import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Get assistant chat history for an instructor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!instructorId) {
      return NextResponse.json(
        { error: 'instructorId is required' },
        { status: 400 }
      )
    }

    const messages = await db.aIAssistantMessage.findMany({
      where: { instructorId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching assistant messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assistant messages' },
      { status: 500 }
    )
  }
}

// POST: Save a new assistant message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instructorId, role, content } = body

    if (!instructorId) {
      return NextResponse.json(
        { error: 'instructorId is required' },
        { status: 400 }
      )
    }

    if (!role || !content) {
      return NextResponse.json(
        { error: 'role and content are required' },
        { status: 400 }
      )
    }

    if (!['user', 'assistant'].includes(role)) {
      return NextResponse.json(
        { error: 'role must be "user" or "assistant"' },
        { status: 400 }
      )
    }

    const message = await db.aIAssistantMessage.create({
      data: {
        instructorId,
        role,
        content,
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Error creating assistant message:', error)
    return NextResponse.json(
      { error: 'Failed to save assistant message' },
      { status: 500 }
    )
  }
}

// DELETE: Clear all messages for an instructor
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    if (!instructorId) {
      return NextResponse.json(
        { error: 'instructorId is required' },
        { status: 400 }
      )
    }

    await db.aIAssistantMessage.deleteMany({
      where: { instructorId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing assistant messages:', error)
    return NextResponse.json(
      { error: 'Failed to clear assistant messages' },
      { status: 500 }
    )
  }
}
