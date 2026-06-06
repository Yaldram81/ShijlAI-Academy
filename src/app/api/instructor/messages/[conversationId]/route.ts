import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/messages/[conversationId] - Get messages in a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const searchQuery = searchParams.get('search') || ''

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    // Build message where clause
    const messageWhere: Record<string, unknown> = {
      deletedAt: null,
    }

    // Add search filter if provided
    if (searchQuery) {
      messageWhere.content = { contains: searchQuery }
    }

    // Get conversation with messages and participants
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, lastActiveAt: true, role: true },
            },
          },
        },
        messages: {
          where: messageWhere,
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Verify instructor is a participant and instructorId is provided
    const isInConversation = conversation.participants.some(p => p.userId === instructorId)
    if (!instructorId || !isInConversation) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Find the student (other participant)
    const otherParticipant = conversation.participants.find(p => p.userId !== instructorId)
    const student = otherParticipant?.user

    // Determine if student is online
    const fiveMinAgo = new Date()
    fiveMinAgo.setMinutes(fiveMinAgo.getMinutes() - 5)
    const online = student ? new Date(student.lastActiveAt) > fiveMinAgo : false

    // Format messages with additional fields (matching student side)
    const formattedMessages = conversation.messages.map(m => {
      // Parse reactions from attachments JSON
      let reactions: Record<string, string[]> | null = null
      if (m.attachments) {
        try {
          const attachmentsData = JSON.parse(m.attachments)
          if (attachmentsData.reactions && Object.keys(attachmentsData.reactions).length > 0) {
            reactions = attachmentsData.reactions as Record<string, string[]>
          }
        } catch {
          // attachments is not valid JSON, ignore
        }
      }

      // Parse readBy from JSON field
      let readBy: string[] = []
      if (m.readBy) {
        try {
          readBy = JSON.parse(m.readBy)
        } catch {
          readBy = []
        }
      }

      return {
        id: m.id,
        senderId: m.senderId,
        senderName: m.senderId === instructorId ? 'You' : (student?.name || 'Student'),
        content: m.content,
        timestamp: formatMessageTime(new Date(m.createdAt)),
        dateStr: formatDateStr(new Date(m.createdAt)),
        read: m.isRead,
        isOwn: m.senderId === instructorId,
        type: m.type,
        editedAt: m.editedAt,
        deletedAt: m.deletedAt,
        attachments: m.attachments,
        reactions,
        readBy,
      }
    })

    // Get course name from database
    let courseName = 'General'
    if (conversation.courseId) {
      const course = await db.course.findUnique({
        where: { id: conversation.courseId },
        select: { title: true },
      })
      if (course) courseName = course.title
    }

    // Find instructor's participant record for archive/star/mute state
    const instructorParticipant = conversation.participants.find(p => p.userId === instructorId)

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        studentId: student?.id || '',
        studentName: student?.name || 'Unknown Student',
        studentAvatar: student?.avatar || null,
        courseName,
        courseId: conversation.courseId,
        online,
        archived: instructorParticipant?.isArchived || false,
        starred: instructorParticipant?.isStarred || false,
        muted: instructorParticipant?.isMuted || false,
        messages: formattedMessages,
      },
    })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 })
  }
}

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDateStr(date: Date): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
