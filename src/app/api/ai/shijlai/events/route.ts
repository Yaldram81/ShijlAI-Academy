import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logEvent } from '@/services/learning-engine/event-service'

// GET /api/ai/shijlai/events?userId=xxx&eventType=xxx&courseId=xxx&limit=50
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const eventType = searchParams.get('eventType') || undefined
    const courseId = searchParams.get('courseId') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const since = searchParams.get('since')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId }
    if (eventType) where.eventType = eventType
    if (courseId) where.courseId = courseId
    if (since) where.createdAt = { gte: new Date(since) }

    const events = await db.learningMetric.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Also get event type counts for analytics
    const eventCounts = await db.learningMetric.groupBy({
      by: ['eventType'],
      where: { userId },
      _count: { id: true },
    })

    return NextResponse.json({
      events,
      eventCounts: Object.fromEntries(eventCounts.map(e => [e.eventType, e._count.id])),
    })
  } catch (error) {
    console.error('[ShijlAI Events GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/ai/shijlai/events - Log a learning event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, eventType, eventValue, courseId, topicId, metadata } = body

    if (!userId || !eventType) {
      return NextResponse.json({ error: 'userId and eventType are required' }, { status: 400 })
    }

    await logEvent({
      userId,
      eventType,
      eventValue: eventValue || 0,
      courseId: courseId || undefined,
      topicId: topicId || undefined,
      metadata: metadata || undefined,
    })

    return NextResponse.json({ logged: true, eventType })
  } catch (error) {
    console.error('[ShijlAI Events POST] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
