import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { updateTopicMastery } from '@/services/learning-engine/mastery-service'
import { updateStudentProfile } from '@/services/learning-engine/profile-service'

// Analytics Events API - Record and retrieve learning events

interface TrackEventRequest {
  userId: string
  courseId?: string
  moduleId?: string
  lessonId?: string
  quizId?: string
  assignmentId?: string
  eventType: string
  score?: number
  timeSpent?: number
  metadata?: Record<string, unknown>
}

// POST /api/analytics/events - Record a learning event
export async function POST(request: Request) {
  try {
    const body: TrackEventRequest = await request.json()
    const {
      userId,
      courseId,
      moduleId,
      lessonId,
      quizId,
      assignmentId,
      eventType,
      score,
      timeSpent = 0,
      metadata,
    } = body

    if (!userId || !eventType) {
      return NextResponse.json(
        { error: 'userId and eventType are required' },
        { status: 400 }
      )
    }

    // Validate user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const metadataJson = metadata ? JSON.stringify(metadata) : null

    // 1. Create LearningEvent record
    const learningEvent = await db.learningEvent.create({
      data: {
        userId,
        courseId: courseId || null,
        moduleId: moduleId || null,
        lessonId: lessonId || null,
        quizId: quizId || null,
        assignmentId: assignmentId || null,
        eventType,
        score: score !== undefined ? score : null,
        timeSpent,
        metadata: metadataJson,
      },
    })

    // 2. Create/update LearningMetric for backwards compatibility
    const metricEventType = mapEventTypeToMetric(eventType)
    const metricEventValue = computeEventValue(eventType, score, timeSpent)
    await db.learningMetric.create({
      data: {
        userId,
        courseId: courseId || null,
        topicId: (metadata?.topicId as string) || moduleId || null,
        eventType: metricEventType,
        eventValue: metricEventValue,
        metadata: metadataJson,
      },
    })

    // 3. Update DailyActivity for the user
    const today = new Date().toISOString().split('T')[0]
    await updateDailyActivity(userId, today, eventType, timeSpent, score)

    // 4. Update StudentLearningProfile if relevant
    await updateProfileOnEvent(userId, eventType, score, timeSpent)

    // 5. Update TopicMastery if quiz-related
    if (isQuizRelatedEvent(eventType) && (metadata?.topicId || moduleId)) {
      const topicId = (metadata?.topicId as string) || moduleId || 'unknown'
      const topicName = (metadata?.topicName as string) || topicId
      const scoreDelta = computeMasteryDelta(eventType, score)

      await updateTopicMastery({
        userId,
        topicId,
        topicName,
        courseId,
        scoreDelta,
      })
    }

    // 6. Update lesson progress if lesson-related event
    if (eventType === 'LESSON_COMPLETED' && lessonId && courseId) {
      await updateLessonProgress(userId, lessonId, courseId, timeSpent)
    }

    // 7. Update user's lastActiveAt
    await db.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    })

    // 8. Update enrollment progress if relevant
    if (courseId && (eventType === 'LESSON_COMPLETED' || eventType === 'QUIZ_PASSED')) {
      await updateEnrollmentProgress(userId, courseId)
    }

    return NextResponse.json({
      success: true,
      eventId: learningEvent.id,
      eventType,
    })
  } catch (error) {
    console.error('[Analytics Events POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to record learning event' },
      { status: 500 }
    )
  }
}

// GET /api/analytics/events?userId=xxx&eventType=xxx&courseId=xxx&limit=50&since=2024-01-01
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const eventType = searchParams.get('eventType')
    const courseId = searchParams.get('courseId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const since = searchParams.get('since')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { userId }
    if (eventType) where.eventType = eventType
    if (courseId) where.courseId = courseId
    if (since) where.createdAt = { gte: new Date(since) }

    // Fetch from LearningEvent (new model)
    const events = await db.learningEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Also fetch event type counts
    const eventCounts = await db.learningEvent.groupBy({
      by: ['eventType'],
      where: { userId },
      _count: { id: true },
    })

    // Time-spent aggregation
    const totalTimeSpent = await db.learningEvent.aggregate({
      where: { userId, timeSpent: { gt: 0 } },
      _sum: { timeSpent: true },
    })

    return NextResponse.json({
      events,
      eventCounts: Object.fromEntries(eventCounts.map(e => [e.eventType, e._count.id])),
      totalTimeSpent: totalTimeSpent._sum.timeSpent || 0,
    })
  } catch (error) {
    console.error('[Analytics Events GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch learning events' },
      { status: 500 }
    )
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function mapEventTypeToMetric(eventType: string): string {
  const mapping: Record<string, string> = {
    LESSON_STARTED: 'lesson_completed',
    LESSON_COMPLETED: 'lesson_completed',
    LESSON_ABANDONED: 'lesson_completed',
    QUIZ_STARTED: 'quiz_attempted',
    QUIZ_SUBMITTED: 'quiz_attempted',
    QUIZ_PASSED: 'quiz_attempted',
    QUIZ_FAILED: 'quiz_attempted',
    ASSIGNMENT_SUBMITTED: 'assignment_submitted',
    COURSE_ENROLLED: 'course_enrolled',
    COURSE_COMPLETED: 'lesson_completed',
    AI_CHAT_USED: 'ai_tutor_used',
    DISCUSSION_POSTED: 'ai_tutor_used',
    VIDEO_WATCHED: 'video_watched',
    NOTE_CREATED: 'lesson_completed',
    BOOKMARK_CREATED: 'lesson_completed',
    LOGIN: 'login',
  }
  return mapping[eventType] || 'lesson_completed'
}

function computeEventValue(eventType: string, score?: number, timeSpent?: number): number {
  switch (eventType) {
    case 'QUIZ_SUBMITTED':
    case 'QUIZ_PASSED':
    case 'QUIZ_FAILED':
      return score || 0
    case 'LESSON_COMPLETED':
    case 'VIDEO_WATCHED':
      return timeSpent ? timeSpent / 60 : 0 // convert to minutes
    case 'ASSIGNMENT_SUBMITTED':
      return score || 0
    case 'TIME_SPENT':
      return timeSpent || 0
    default:
      return 0
  }
}

function isQuizRelatedEvent(eventType: string): boolean {
  return ['QUIZ_SUBMITTED', 'QUIZ_PASSED', 'QUIZ_FAILED', 'ASSIGNMENT_SUBMITTED'].includes(eventType)
}

function computeMasteryDelta(eventType: string, score?: number): number {
  switch (eventType) {
    case 'QUIZ_SUBMITTED':
    case 'QUIZ_PASSED':
      return (score || 0) * 0.3 // Quiz score weighted at 30%
    case 'QUIZ_FAILED':
      return Math.max(-5, ((score || 0) - 50) * 0.1) // Small negative for failing
    case 'ASSIGNMENT_SUBMITTED':
      return (score || 0) * 0.25
    default:
      return 0
  }
}

async function updateDailyActivity(
  userId: string,
  date: string,
  eventType: string,
  timeSpent: number,
  score?: number
) {
  try {
    const existing = await db.dailyActivity.findUnique({
      where: { userId_date: { userId, date } },
    })

    const updateData: Record<string, unknown> = {}

    // Increment counters based on event type
    if (eventType === 'LESSON_COMPLETED') {
      updateData.lessonsCompleted = { increment: 1 }
    }
    if (['QUIZ_SUBMITTED', 'QUIZ_PASSED', 'QUIZ_FAILED'].includes(eventType)) {
      updateData.quizzesTaken = { increment: 1 }
    }
    if (timeSpent > 0) {
      updateData.timeSpent = { increment: timeSpent }
    }
    // XP from lesson completion and quiz passing
    if (eventType === 'LESSON_COMPLETED') {
      updateData.xpEarned = { increment: 10 }
    } else if (eventType === 'QUIZ_PASSED' && score && score >= 70) {
      updateData.xpEarned = { increment: Math.round(score / 2) }
    }

    if (existing) {
      await db.dailyActivity.update({
        where: { id: existing.id },
        data: updateData,
      })
    } else {
      await db.dailyActivity.create({
        data: {
          userId,
          date,
          lessonsCompleted: eventType === 'LESSON_COMPLETED' ? 1 : 0,
          quizzesTaken: ['QUIZ_SUBMITTED', 'QUIZ_PASSED', 'QUIZ_FAILED'].includes(eventType) ? 1 : 0,
          timeSpent,
          xpEarned: eventType === 'LESSON_COMPLETED' ? 10 : (eventType === 'QUIZ_PASSED' && score && score >= 70 ? Math.round(score / 2) : 0),
        },
      })
    }
  } catch (error) {
    console.error('[Analytics Events] Error updating daily activity:', error)
  }
}

async function updateProfileOnEvent(
  userId: string,
  eventType: string,
  score?: number,
  timeSpent?: number
) {
  try {
    const profile = await db.studentLearningProfile.findUnique({
      where: { studentId: userId },
    })

    if (!profile) {
      // Create initial profile and let profile-service handle computation
      await updateStudentProfile(userId)
      return
    }

    const updateData: Record<string, unknown> = {
      lastComputedAt: new Date(),
    }

    // Increment counters
    if (eventType === 'LESSON_COMPLETED') {
      updateData.totalLessonsCompleted = { increment: 1 }
    }
    if (['QUIZ_SUBMITTED', 'QUIZ_PASSED', 'QUIZ_FAILED'].includes(eventType)) {
      updateData.totalQuizzesTaken = { increment: 1 }
      // Update average quiz score
      if (score !== undefined) {
        const totalQuizzes = profile.totalQuizzesTaken + 1
        const newAvg = ((profile.averageQuizScore * profile.totalQuizzesTaken) + score) / totalQuizzes
        updateData.averageQuizScore = Math.round(newAvg * 10) / 10
      }
    }
    if (timeSpent && timeSpent > 0) {
      updateData.totalTimeSpent = { increment: timeSpent }
    }

    // XP
    let xpGain = 0
    if (eventType === 'LESSON_COMPLETED') xpGain = 10
    else if (eventType === 'QUIZ_PASSED' && score && score >= 70) xpGain = Math.round(score / 2)
    if (xpGain > 0) {
      updateData.totalXpEarned = { increment: xpGain }
      // Also update user XP
      await db.user.update({
        where: { id: userId },
        data: { xp: { increment: xpGain } },
      })
    }

    // Update study streak
    if (eventType === 'LESSON_COMPLETED' || ['QUIZ_SUBMITTED', 'QUIZ_PASSED'].includes(eventType)) {
      updateData.studyStreakDays = { increment: 1 }
    }

    await db.studentLearningProfile.update({
      where: { studentId: userId },
      data: updateData,
    })

    // Trigger full profile recomputation if enough events have accumulated
    const lastComputed = profile.lastComputedAt
    if (!lastComputed || (Date.now() - new Date(lastComputed).getTime()) > 5 * 60 * 1000) {
      // Recompute profile every 5 minutes at most
      await updateStudentProfile(userId)
    }
  } catch (error) {
    console.error('[Analytics Events] Error updating profile:', error)
  }
}

async function updateLessonProgress(
  userId: string,
  lessonId: string,
  courseId: string,
  timeSpent: number
) {
  try {
    // Find the enrollment for this user and course
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })

    if (!enrollment) return

    // Find or create lesson progress
    const existingProgress = await db.lessonProgress.findUnique({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
    })

    if (existingProgress) {
      if (existingProgress.status !== 'completed') {
        await db.lessonProgress.update({
          where: { id: existingProgress.id },
          data: {
            status: 'completed',
            timeSpent: { increment: timeSpent },
            completedAt: new Date(),
            xpEarned: 10,
          },
        })
      }
    } else {
      await db.lessonProgress.create({
        data: {
          enrollmentId: enrollment.id,
          lessonId,
          status: 'completed',
          timeSpent,
          completedAt: new Date(),
          xpEarned: 10,
        },
      })
    }
  } catch (error) {
    console.error('[Analytics Events] Error updating lesson progress:', error)
  }
}

async function updateEnrollmentProgress(userId: string, courseId: string) {
  try {
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: { lessonProgress: true },
    })

    if (!enrollment) return

    // Count completed lessons vs total lessons in the course
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: { select: { id: true } },
          },
        },
      },
    })

    if (!course) return

    const totalLessons = course.modules.reduce(
      (sum, m) => sum + m.lessons.length, 0
    )
    const completedLessons = enrollment.lessonProgress.filter(
      lp => lp.status === 'completed'
    ).length

    if (totalLessons > 0) {
      const progress = Math.round((completedLessons / totalLessons) * 100 * 10) / 10
      const updateData: Record<string, unknown> = {
        progress,
        lastAccessed: new Date(),
      }

      // Check if course is now complete
      if (progress >= 100 && enrollment.status !== 'completed') {
        updateData.status = 'completed'
        updateData.completedAt = new Date()
      }

      await db.enrollment.update({
        where: { id: enrollment.id },
        data: updateData,
      })
    }
  } catch (error) {
    console.error('[Analytics Events] Error updating enrollment progress:', error)
  }
}
