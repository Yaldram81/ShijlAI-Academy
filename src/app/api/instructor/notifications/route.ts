import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/notifications - List notifications for the instructor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const type = searchParams.get('type') // filter by notification type
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    // Verify instructor exists
    const instructor = await db.user.findUnique({
      where: { id: instructorId },
      select: { id: true, role: true },
    })
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    // Build where clause
    const where: Record<string, unknown> = { userId: instructorId }
    if (type) {
      where.type = type
    }
    if (unreadOnly) {
      where.isRead = false
    }

    // Fetch notifications
    const [notifications, unreadCount, totalCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          // We don't have sender relation but can include user context
        },
      }),
      db.notification.count({
        where: { userId: instructorId, isRead: false },
      }),
      db.notification.count({ where }),
    ])

    // Format notifications for frontend
    const formattedNotifications = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      content: n.content,
      icon: n.icon,
      link: n.link,
      isRead: n.isRead,
      readAt: n.readAt?.toISOString() || null,
      courseId: n.courseId,
      senderId: n.senderId,
      metadata: n.metadata ? JSON.parse(n.metadata) : null,
      createdAt: n.createdAt.toISOString(),
    }))

    const response = NextResponse.json({
      notifications: formattedNotifications,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    })

    // Add unread count in response headers
    response.headers.set('X-Unread-Count', String(unreadCount))

    return response
  } catch (error) {
    console.error('Error fetching instructor notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// PATCH /api/instructor/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { instructorId, notificationIds } = body as {
      instructorId?: string
      notificationIds?: string[]
    }

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'notificationIds must be a non-empty array of notification IDs' },
        { status: 400 }
      )
    }

    // Verify instructor exists
    const instructor = await db.user.findUnique({
      where: { id: instructorId },
      select: { id: true },
    })
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    // Update the specified notifications that belong to this instructor
    const updateResult = await db.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: instructorId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    // Get updated unread count
    const unreadCount = await db.notification.count({
      where: { userId: instructorId, isRead: false },
    })

    const response = NextResponse.json({
      success: true,
      markedAsRead: updateResult.count,
      message: `${updateResult.count} notification(s) marked as read`,
    })

    response.headers.set('X-Unread-Count', String(unreadCount))

    return response
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}
