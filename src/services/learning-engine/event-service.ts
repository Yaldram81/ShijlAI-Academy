import { db } from '@/lib/db'
import { updateTopicMastery } from './mastery-service'
import { updateStudentProfile } from './profile-service'

/**
 * Event Service - Logs learning events and triggers downstream updates
 * This is the CRITICAL foundation: if an action is NOT logged, it does NOT exist for AI
 */

export interface LogEventParams {
  userId: string
  eventType: string
  eventValue?: number
  courseId?: string
  topicId?: string
  metadata?: Record<string, unknown>
}

export async function logEvent(params: LogEventParams): Promise<void> {
  const { userId, eventType, eventValue = 0, courseId, topicId, metadata } = params

  try {
    // 1. Insert event record
    await db.learningMetric.create({
      data: {
        userId,
        eventType,
        eventValue,
        courseId: courseId || null,
        topicId: topicId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    // 2. Update topic mastery if topic is specified
    if (topicId) {
      const scoreDelta = computeScoreDelta(eventType, eventValue)
      const topicName = (metadata?.topicName as string) || topicId
      await updateTopicMastery({
        userId,
        topicId,
        topicName,
        courseId,
        scoreDelta,
      })
    }

    // 3. Trigger profile recomputation (batch: only if last computed > 5 min ago)
    await updateStudentProfile(userId)
  } catch (error) {
    console.error('[EventService] Error logging event:', error)
    // Don't throw - event logging should be non-blocking
  }
}

function computeScoreDelta(eventType: string, eventValue: number): number {
  switch (eventType) {
    case 'quiz_attempted':
      return eventValue * 0.3 // Quiz score weighted at 30%
    case 'lesson_completed':
      return 15 // Fixed bonus for completing a lesson
    case 'assignment_submitted':
      return eventValue * 0.25 // Assignment score weighted at 25%
    case 'video_watched':
      return 5 // Small bonus for watching content
    case 'ai_tutor_used':
      return 3 // Small bonus for AI interaction
    default:
      return eventValue * 0.1
  }
}

export async function getRecentEvents(
  userId: string,
  options?: {
    eventType?: string
    courseId?: string
    limit?: number
    since?: Date
  }
) {
  const where: Record<string, unknown> = { userId }
  if (options?.eventType) where.eventType = options.eventType
  if (options?.courseId) where.courseId = options.courseId
  if (options?.since) where.createdAt = { gte: options.since }

  return db.learningMetric.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
  })
}

export async function getEventCount(
  userId: string,
  eventType: string,
  since?: Date
): Promise<number> {
  const where: Record<string, unknown> = { userId, eventType }
  if (since) where.createdAt = { gte: since }
  return db.learningMetric.count({ where })
}

export async function getEventSum(
  userId: string,
  eventType: string,
  since?: Date
): Promise<number> {
  const events = await db.learningMetric.findMany({
    where: {
      userId,
      eventType,
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    select: { eventValue: true },
  })
  return events.reduce((sum, e) => sum + e.eventValue, 0)
}
