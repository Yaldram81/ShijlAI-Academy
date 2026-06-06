import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/ai/shijlai/sessions?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const sessions = await db.shijlAISession.findMany({
      where: { userId, isArchived: false },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('[ShijlAI Sessions GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/ai/shijlai/sessions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, mode = 'tutor', title, courseId, language = 'en' } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const session = await db.shijlAISession.create({
      data: {
        userId,
        title: title || 'New Conversation',
        mode,
        courseId: courseId || null,
        language,
      },
    })

    // Log activity
    await db.studentAIActivity.create({
      data: {
        userId,
        activityType: 'chat_message',
        mode,
        sessionId: session.id,
        metadata: JSON.stringify({ action: 'session_created' }),
      },
    })

    return NextResponse.json({ session })
  } catch (error) {
    console.error('[ShijlAI Sessions POST] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
