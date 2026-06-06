import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/student/messages - Get conversations for student
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const filter = searchParams.get('filter') || 'all' // all, instructors, support

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Find all conversations where the student is a participant (include archived for filter)
    const participantEntries = await db.conversationParticipant.findMany({
      where: {
        userId: studentId,
      },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, avatar: true, lastActiveAt: true, role: true },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { conversation: { lastMessageAt: 'desc' } },
    })

    // Format conversations for frontend
    let conversations = participantEntries.map(pe => {
      const conv = pe.conversation
      // Find the other participant
      const otherParticipant = conv.participants.find(p => p.userId !== studentId)
      const otherUser = otherParticipant?.user

      // Count unread messages
      const myLastReadAt = pe.lastReadAt
      let unreadCount = 0
      if (!myLastReadAt) {
        // Never read — count all messages not from self
        unreadCount = conv.messages.filter(m => m.senderId !== studentId).length
        // But we only have the last message loaded. Let's do a proper count
        unreadCount = 0 // Will be computed below
      }

      // Get last message
      const lastMessage = conv.messages[0]
      const lastMessageTime = lastMessage
        ? formatTimeAgo(new Date(lastMessage.createdAt))
        : ''

      // Determine if other user is online (active within last 5 minutes)
      const fiveMinAgo = new Date()
      fiveMinAgo.setMinutes(fiveMinAgo.getMinutes() - 5)
      const online = otherUser ? new Date(otherUser.lastActiveAt) > fiveMinAgo : false

      // Determine conversation category
      const isInstructor = otherUser?.role === 'instructor'
      const isAdmin = otherUser?.role === 'admin'
      const isSupport = isAdmin || otherUser?.name?.toLowerCase().includes('support')

      // Get course name if available
      let courseName = 'General'
      if (conv.courseId) {
        // We'll note the courseId for lazy loading
        courseName = '' // Will be populated below
      }

      return {
        id: conv.id,
        otherUserId: otherUser?.id || '',
        otherUserName: otherUser?.name || 'Unknown',
        otherUserAvatar: otherUser?.avatar || null,
        otherUserRole: otherUser?.role || 'student',
        courseName,
        courseId: conv.courseId,
        lastMessage: conv.lastMessageContent || lastMessage?.content || '',
        lastMessageTime,
        unreadCount: 0, // placeholder
        online,
        isInstructor,
        isSupport,
        archived: pe.isArchived,
        starred: pe.isStarred,
        muted: pe.isMuted,
        lastMessageAt: conv.lastMessageAt,
      }
    })

    // Get proper unread counts and course names
    for (const conv of conversations) {
      const participant = await db.conversationParticipant.findFirst({
        where: { conversationId: conv.id, userId: studentId },
      })

      if (participant?.lastReadAt) {
        conv.unreadCount = await db.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: studentId },
            createdAt: { gt: participant.lastReadAt },
            deletedAt: null,
          },
        })
      } else {
        conv.unreadCount = await db.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: studentId },
            deletedAt: null,
          },
        })
      }

      // Get course name
      if (conv.courseId) {
        const course = await db.course.findUnique({
          where: { id: conv.courseId },
          select: { title: true },
        })
        conv.courseName = course?.title || 'General'
      }
    }

    // Apply filter
    if (filter === 'instructors') {
      conversations = conversations.filter(c => c.isInstructor)
    } else if (filter === 'support') {
      conversations = conversations.filter(c => c.isSupport)
    }

    // Calculate total unread
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

    return NextResponse.json({ conversations, totalUnread })
  } catch (error) {
    console.error('Error fetching student messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST /api/student/messages - Send message, start conversation, archive, star, mark-read
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, studentId } = body

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    if (action === 'send') {
      const { conversationId, content } = body
      if (!conversationId || !content) {
        return NextResponse.json({ error: 'Conversation ID and content are required' }, { status: 400 })
      }

      // Verify student is a participant of this conversation
      const isParticipant = await db.conversationParticipant.findFirst({
        where: { conversationId, userId: studentId }
      })
      if (!isParticipant) {
        return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
      }

      // Create message
      const message = await db.message.create({
        data: {
          conversationId,
          senderId: studentId,
          content,
          type: 'text',
          isRead: false,
        },
      })

      // Update conversation's last message
      await db.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessageContent: content.slice(0, 200),
        },
      })

      // Update student's lastReadAt
      await db.conversationParticipant.updateMany({
        where: { conversationId, userId: studentId },
        data: { lastReadAt: new Date() },
      })

      return NextResponse.json({
        message: {
          id: message.id,
          senderId: message.senderId,
          senderName: 'You',
          content: message.content,
          timestamp: formatMessageTime(new Date(message.createdAt)),
          dateStr: formatDateStr(new Date(message.createdAt)),
          read: message.isRead,
          isOwn: true,
        },
      })
    }

    if (action === 'start') {
      const { recipientId, content, courseId } = body
      if (!recipientId || !content) {
        return NextResponse.json({ error: 'Recipient ID and content are required' }, { status: 400 })
      }

      // Look for existing direct conversation
      const studentConvs = await db.conversationParticipant.findMany({
        where: { userId: studentId },
        include: {
          conversation: {
            include: {
              participants: {
                where: { userId: recipientId },
              },
            },
          },
        },
      })

      const existingDirect = studentConvs.find(
        sc => sc.conversation.participants.length > 0 && sc.conversation.type === 'direct'
      )

      if (existingDirect) {
        // Send message to existing conversation
        const message = await db.message.create({
          data: {
            conversationId: existingDirect.conversationId,
            senderId: studentId,
            content,
            type: 'text',
            isRead: false,
          },
        })

        await db.conversation.update({
          where: { id: existingDirect.conversationId },
          data: {
            lastMessageAt: new Date(),
            lastMessageContent: content.slice(0, 200),
          },
        })

        // Mark as read for student
        await db.conversationParticipant.updateMany({
          where: { conversationId: existingDirect.conversationId, userId: studentId },
          data: { lastReadAt: new Date() },
        })

        return NextResponse.json({
          conversationId: existingDirect.conversationId,
          message: {
            id: message.id,
            senderId: message.senderId,
            senderName: 'You',
            content: message.content,
            timestamp: formatMessageTime(new Date(message.createdAt)),
            dateStr: formatDateStr(new Date(message.createdAt)),
            isOwn: true,
          },
        })
      }

      // Create new conversation
      const conversation = await db.conversation.create({
        data: {
          type: 'direct',
          courseId: courseId || null,
          lastMessageAt: new Date(),
          lastMessageContent: content.slice(0, 200),
          participants: {
            create: [
              { userId: studentId, role: 'member', lastReadAt: new Date() },
              { userId: recipientId, role: 'admin' },
            ],
          },
          messages: {
            create: {
              senderId: studentId,
              content,
              type: 'text',
              isRead: false,
            },
          },
        },
      })

      return NextResponse.json({
        conversationId: conversation.id,
        message: 'Conversation started',
      })
    }

    if (action === 'mark-read') {
      const { conversationId } = body
      if (!conversationId) {
        return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
      }

      // Update lastReadAt
      await db.conversationParticipant.updateMany({
        where: { conversationId, userId: studentId },
        data: { lastReadAt: new Date() },
      })

      // Mark all messages as read
      await db.message.updateMany({
        where: {
          conversationId,
          senderId: { not: studentId },
          isRead: false,
        },
        data: { isRead: true },
      })

      return NextResponse.json({ message: 'Marked as read' })
    }

    if (action === 'archive') {
      const { conversationId } = body
      if (!conversationId) {
        return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
      }

      const participant = await db.conversationParticipant.findFirst({
        where: { conversationId, userId: studentId },
      })
      if (!participant) {
        return NextResponse.json({ error: 'Not a participant' }, { status: 404 })
      }

      await db.conversationParticipant.update({
        where: { id: participant.id },
        data: { isArchived: !participant.isArchived },
      })

      return NextResponse.json({ archived: !participant.isArchived })
    }

    // Toggle star on a conversation
    if (action === 'star') {
      const { conversationId } = body
      if (!conversationId) {
        return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
      }

      const participant = await db.conversationParticipant.findFirst({
        where: { conversationId, userId: studentId },
      })
      if (!participant) {
        return NextResponse.json({ error: 'Not a participant' }, { status: 404 })
      }

      await db.conversationParticipant.update({
        where: { id: participant.id },
        data: { isStarred: !participant.isStarred },
      })

      return NextResponse.json({ starred: !participant.isStarred })
    }

    // Toggle mute on a conversation
    if (action === 'mute') {
      const { conversationId } = body
      if (!conversationId) {
        return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
      }

      const participant = await db.conversationParticipant.findFirst({
        where: { conversationId, userId: studentId },
      })
      if (!participant) {
        return NextResponse.json({ error: 'Not a participant' }, { status: 404 })
      }

      await db.conversationParticipant.update({
        where: { id: participant.id },
        data: { isMuted: !participant.isMuted },
      })

      return NextResponse.json({ muted: !participant.isMuted })
    }

    // Soft delete a message
    if (action === 'delete-message') {
      const { messageId } = body
      if (!messageId) {
        return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
      }

      const message = await db.message.findUnique({
        where: { id: messageId },
      })
      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 })
      }

      // Only allow sender to delete their own messages
      if (message.senderId !== studentId) {
        return NextResponse.json({ error: 'Can only delete your own messages' }, { status: 403 })
      }

      await db.message.update({
        where: { id: messageId },
        data: { deletedAt: new Date() },
      })

      return NextResponse.json({ deleted: true })
    }

    // Edit a message
    if (action === 'edit-message') {
      const { messageId, content } = body
      if (!messageId || !content) {
        return NextResponse.json({ error: 'Message ID and content are required' }, { status: 400 })
      }

      const message = await db.message.findUnique({
        where: { id: messageId },
      })
      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 })
      }

      // Only allow sender to edit their own messages
      if (message.senderId !== studentId) {
        return NextResponse.json({ error: 'Can only edit your own messages' }, { status: 403 })
      }

      // Cannot edit deleted messages
      if (message.deletedAt) {
        return NextResponse.json({ error: 'Cannot edit a deleted message' }, { status: 400 })
      }

      await db.message.update({
        where: { id: messageId },
        data: {
          content,
          editedAt: new Date(),
        },
      })

      return NextResponse.json({
        edited: true,
        message: {
          id: messageId,
          content,
          editedAt: new Date().toISOString(),
        },
      })
    }

    // Add emoji reaction to a message
    if (action === 'add-reaction') {
      const { messageId, emoji } = body
      if (!messageId || !emoji) {
        return NextResponse.json({ error: 'Message ID and emoji are required' }, { status: 400 })
      }

      const message = await db.message.findUnique({
        where: { id: messageId },
      })
      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 })
      }

      // Parse existing attachments/reactions
      let attachmentsData: Record<string, unknown> = {}
      if (message.attachments) {
        try {
          attachmentsData = JSON.parse(message.attachments)
        } catch {
          attachmentsData = {}
        }
      }

      // Get or initialize reactions
      const reactions = (attachmentsData.reactions || {}) as Record<string, string[]>

      // Toggle reaction: if user already reacted with this emoji, remove it; otherwise add it
      if (reactions[emoji]) {
        const userIds = reactions[emoji]
        if (userIds.includes(studentId)) {
          // Remove user from this emoji reaction
          reactions[emoji] = userIds.filter(id => id !== studentId)
          // Remove emoji key if no users left
          if (reactions[emoji].length === 0) {
            delete reactions[emoji]
          }
        } else {
          // Add user to this emoji reaction
          reactions[emoji] = [...userIds, studentId]
        }
      } else {
        // First reaction with this emoji
        reactions[emoji] = [studentId]
      }

      attachmentsData.reactions = reactions

      await db.message.update({
        where: { id: messageId },
        data: { attachments: JSON.stringify(attachmentsData) },
      })

      return NextResponse.json({
        reacted: true,
        reactions,
      })
    }

    // Search messages across conversations
    if (action === 'search') {
      const { query } = body
      if (!query) {
        return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
      }

      // Get all conversation IDs for this student
      const participantEntries = await db.conversationParticipant.findMany({
        where: { userId: studentId },
        select: { conversationId: true },
      })
      const conversationIds = participantEntries.map(pe => pe.conversationId)

      if (conversationIds.length === 0) {
        return NextResponse.json({ results: [] })
      }

      // Search messages by content
      const messages = await db.message.findMany({
        where: {
          conversationId: { in: conversationIds },
          content: { contains: query },
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          conversation: {
            include: {
              participants: {
                include: {
                  user: {
                    select: { id: true, name: true, avatar: true, role: true },
                  },
                },
              },
            },
          },
        },
      })

      const results = messages.map(m => {
        const otherParticipant = m.conversation.participants.find(p => p.userId !== studentId)
        const otherUser = otherParticipant?.user

        return {
          messageId: m.id,
          conversationId: m.conversationId,
          content: m.content,
          createdAt: m.createdAt,
          senderId: m.senderId,
          senderName: m.senderId === studentId ? 'You' : (otherUser?.name || 'Unknown'),
          otherUserName: otherUser?.name || 'Unknown',
          otherUserAvatar: otherUser?.avatar || null,
          type: m.type,
          editedAt: m.editedAt,
        }
      })

      return NextResponse.json({ results })
    }

    // Mark all conversations as read (bulk)
    if (action === 'bulk-mark-read') {
      // Get all conversations for this student
      const participantEntries = await db.conversationParticipant.findMany({
        where: { userId: studentId },
        select: { conversationId: true },
      })
      const conversationIds = participantEntries.map(pe => pe.conversationId)

      // Update lastReadAt for all participant entries
      await db.conversationParticipant.updateMany({
        where: { userId: studentId },
        data: { lastReadAt: new Date() },
      })

      // Mark all unread messages in these conversations as read
      if (conversationIds.length > 0) {
        await db.message.updateMany({
          where: {
            conversationId: { in: conversationIds },
            senderId: { not: studentId },
            isRead: false,
          },
          data: { isRead: true },
        })
      }

      return NextResponse.json({ marked: true, count: conversationIds.length })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing student message action:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
