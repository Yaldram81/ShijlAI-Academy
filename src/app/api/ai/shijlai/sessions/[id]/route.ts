import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/ai/shijlai/sessions/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await db.shijlAISession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        conversationSummaries: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Reverse messages so they are in chronological order
    const sessionWithMessages = {
      ...session,
      messages: [...session.messages].reverse(),
    }

    return NextResponse.json({ session: sessionWithMessages })
  } catch (error) {
    console.error('[ShijlAI Session GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/ai/shijlai/sessions/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await db.shijlAISession.findUnique({ where: { id } })
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Cascade delete will handle messages and summaries
    await db.shijlAISession.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ShijlAI Session DELETE] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/ai/shijlai/sessions/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, isArchived } = body

    const session = await db.shijlAISession.findUnique({ where: { id } })
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (isArchived !== undefined) updateData.isArchived = isArchived

    const updatedSession = await db.shijlAISession.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    console.error('[ShijlAI Session PATCH] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
