import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/student/community/study-groups/[groupId]/messages?userId=xxx&page=1&limit=20
// Get group messages with pagination
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    if (!groupId) {
      return NextResponse.json(
        { error: 'groupId is required' },
        { status: 400 }
      )
    }

    // Verify group exists
    const group = await db.studyGroup.findUnique({
      where: { id: groupId },
      select: { id: true, isActive: true },
    })
    if (!group) {
      return NextResponse.json(
        { error: 'Study group not found' },
        { status: 404 }
      )
    }

    // Verify user is a member (if userId provided)
    if (userId) {
      const membership = await db.studyGroupMember.findUnique({
        where: { groupId_userId: { groupId, userId } },
        select: { id: true },
      })
      if (!membership) {
        return NextResponse.json(
          { error: 'You must be a member to view messages' },
          { status: 403 }
        )
      }
    }

    const skip = (page - 1) * limit

    // Get total count
    const totalCount = await db.studyGroupMessage.count({
      where: { groupId },
    })

    // Get messages with pagination (newest first for pagination, then reverse for display)
    const messages = await db.studyGroupMessage.findMany({
      where: { groupId },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, level: true, xp: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    // Reverse for chronological order
    const formattedMessages = [...messages].reverse().map((msg) => ({
      id: msg.id,
      content: msg.content,
      type: msg.type,
      attachments: msg.attachments,
      isPinned: msg.isPinned,
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
      user: {
        id: msg.user.id,
        name: msg.user.name,
        avatar: msg.user.avatar,
        level: msg.user.level,
        xp: msg.user.xp,
      },
    }))

    const hasMore = skip + limit < totalCount

    return NextResponse.json({
      messages: formattedMessages,
      totalCount,
      page,
      limit,
      hasMore,
    })
  } catch (error) {
    console.error('Error fetching group messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group messages' },
      { status: 500 }
    )
  }
}

// POST /api/student/community/study-groups/[groupId]/messages
// Send a message to group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    const body = await request.json()
    const { userId, content, type } = body

    if (!groupId || !userId || !content) {
      return NextResponse.json(
        { error: 'groupId, userId, and content are required' },
        { status: 400 }
      )
    }

    // Verify group exists and is active
    const group = await db.studyGroup.findUnique({
      where: { id: groupId },
      select: { id: true, isActive: true },
    })
    if (!group) {
      return NextResponse.json(
        { error: 'Study group not found' },
        { status: 404 }
      )
    }
    if (!group.isActive) {
      return NextResponse.json(
        { error: 'This study group is no longer active' },
        { status: 400 }
      )
    }

    // Verify user is a member
    const membership = await db.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { id: true, role: true },
    })
    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member to send messages' },
        { status: 403 }
      )
    }

    // Only admins can send announcement type messages
    const messageType = type || 'text'
    if (messageType === 'announcement' && membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only group admins can send announcements' },
        { status: 403 }
      )
    }

    const message = await db.studyGroupMessage.create({
      data: {
        groupId,
        userId,
        content,
        type: messageType,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, level: true, xp: true },
        },
      },
    })

    return NextResponse.json(
      {
        message: {
          id: message.id,
          content: message.content,
          type: message.type,
          attachments: message.attachments,
          isPinned: message.isPinned,
          createdAt: message.createdAt.toISOString(),
          updatedAt: message.updatedAt.toISOString(),
          user: {
            id: message.user.id,
            name: message.user.name,
            avatar: message.user.avatar,
            level: message.user.level,
            xp: message.user.xp,
          },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error sending group message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
