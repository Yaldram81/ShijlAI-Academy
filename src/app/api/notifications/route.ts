import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── Role-based notification type filtering ──────────────────────────────────
// Notification types that are appropriate for each role.
// If a notification's type is NOT in the user's allowed list, it gets filtered out.

const ROLE_ALLOWED_TYPES: Record<string, string[] | null> = {
  student: ['enrollment', 'achievement', 'course_update', 'assignment', 'qa', 'review', 'live_session', 'reminder', 'security', 'promotion', 'system', 'announcement'],
  instructor: ['enrollment', 'achievement', 'course_update', 'payout', 'social', 'review', 'qa', 'live_session', 'reminder', 'security', 'promotion', 'system', 'announcement'],
  admin: ['enrollment', 'payout', 'security', 'reminder', 'system', 'announcement'],
  parent: ['enrollment', 'achievement', 'course_update', 'reminder', 'security', 'system', 'promotion', 'announcement'],
}

// GET /api/notifications — Fetch notifications for the current user (role-filtered)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const role = searchParams.get('role') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)))
    const type = searchParams.get('type') || ''
    const category = searchParams.get('category') || ''
    const priority = searchParams.get('priority') || ''
    const search = searchParams.get('search') || ''
    const filter = searchParams.get('filter') || 'all' // all, unread, read, archived, pinned
    const includeExpired = searchParams.get('includeExpired') === 'true'

    const where: Record<string, unknown> = { userId }

    // Apply role-based type filtering to exclude notifications not meant for this role
    if (role && ROLE_ALLOWED_TYPES[role]) {
      where.type = { in: ROLE_ALLOWED_TYPES[role] }
    }

    // Filter by read/archived/pinned status
    if (filter === 'unread') {
      where.isRead = false
      where.isArchived = false
    } else if (filter === 'read') {
      where.isRead = true
      where.isArchived = false
    } else if (filter === 'archived') {
      where.isArchived = true
    } else if (filter === 'pinned') {
      where.isPinned = true
      where.isArchived = false
    } else {
      // 'all' — exclude archived by default
      where.isArchived = false
    }

    // If user also specified a specific type filter, intersect with role-allowed types
    if (type) {
      if (where.type && typeof where.type === 'object' && 'in' in (where.type as any)) {
        // Role filter is already applied; only allow if the requested type is within the role's allowed types
        const allowedTypes = (where.type as { in: string[] }).in
        if (allowedTypes.includes(type)) {
          where.type = type
        } else {
          // Requested type not allowed for this role — return empty
          return NextResponse.json({ notifications: [], pagination: { page, limit, total: 0, totalPages: 0 }, counts: { total: 0, unread: 0, pinned: 0, byType: {} } })
        }
      } else {
        where.type = type
      }
    }
    if (category) where.category = category
    if (priority) where.priority = priority

    // Exclude expired notifications unless explicitly requested
    if (!includeExpired) {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ]
    }

    if (search) {
      const searchConditions: Record<string, unknown>[] = [
        { title: { contains: search } },
        { content: { contains: search } },
      ]
      // Combine with existing OR if any
      if (where.OR) {
        const existingOR = where.OR as Record<string, unknown>[]
        delete where.OR
        where.AND = [
          { OR: existingOR },
          { OR: searchConditions },
        ]
      } else {
        where.OR = searchConditions
      }
    }

    const [notifications, total, unreadCount, pinnedCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({ where }),
      db.notification.count({ where: { userId, isRead: false, isArchived: false } }),
      db.notification.count({ where: { userId, isPinned: true, isArchived: false } }),
    ])

    // Get type counts for sidebar
    const typeCounts = await db.notification.groupBy({
      by: ['type'],
      where: { userId, isArchived: false, isRead: false },
      _count: { type: true },
    })

    const typeCountMap: Record<string, number> = {}
    for (const item of typeCounts) {
      typeCountMap[item.type] = item._count.type
    }

    return NextResponse.json({
      notifications: notifications.map(n => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt?.toISOString() || null,
        archivedAt: n.archivedAt?.toISOString() || null,
        pinnedAt: n.pinnedAt?.toISOString() || null,
        expiresAt: n.expiresAt?.toISOString() || null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      counts: {
        total,
        unread: unreadCount,
        pinned: pinnedCount,
        byType: typeCountMap,
      },
    })
  } catch (error) {
    console.error('[NOTIFICATIONS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// PUT /api/notifications — Bulk update notifications
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, notificationIds, userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    switch (action) {
      case 'mark_read': {
        if (notificationIds && notificationIds.length > 0) {
          await db.notification.updateMany({
            where: { id: { in: notificationIds }, userId },
            data: { isRead: true, readAt: new Date() },
          })
        } else {
          // Mark all as read
          await db.notification.updateMany({
            where: { userId, isRead: false, isArchived: false },
            data: { isRead: true, readAt: new Date() },
          })
        }
        return NextResponse.json({ success: true, action: 'mark_read' })
      }
      case 'mark_unread': {
        if (notificationIds && notificationIds.length > 0) {
          await db.notification.updateMany({
            where: { id: { in: notificationIds }, userId },
            data: { isRead: false, readAt: null },
          })
        }
        return NextResponse.json({ success: true, action: 'mark_unread' })
      }
      case 'archive': {
        if (notificationIds && notificationIds.length > 0) {
          await db.notification.updateMany({
            where: { id: { in: notificationIds }, userId },
            data: { isArchived: true, archivedAt: new Date(), isPinned: false },
          })
        }
        return NextResponse.json({ success: true, action: 'archive' })
      }
      case 'unarchive': {
        if (notificationIds && notificationIds.length > 0) {
          await db.notification.updateMany({
            where: { id: { in: notificationIds }, userId },
            data: { isArchived: false, archivedAt: null },
          })
        }
        return NextResponse.json({ success: true, action: 'unarchive' })
      }
      case 'pin': {
        if (notificationIds && notificationIds.length > 0) {
          await db.notification.updateMany({
            where: { id: { in: notificationIds }, userId },
            data: { isPinned: true, pinnedAt: new Date() },
          })
        }
        return NextResponse.json({ success: true, action: 'pin' })
      }
      case 'unpin': {
        if (notificationIds && notificationIds.length > 0) {
          await db.notification.updateMany({
            where: { id: { in: notificationIds }, userId },
            data: { isPinned: false, pinnedAt: null },
          })
        }
        return NextResponse.json({ success: true, action: 'unpin' })
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[NOTIFICATIONS_PUT]', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}

// DELETE /api/notifications — Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const ids = searchParams.get('ids')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (ids) {
      const notificationIds = ids.split(',')
      const result = await db.notification.deleteMany({
        where: { id: { in: notificationIds }, userId },
      })
      return NextResponse.json({ success: true, deletedCount: result.count })
    }

    // Delete all archived notifications for this user
    const result = await db.notification.deleteMany({
      where: { userId, isArchived: true },
    })
    return NextResponse.json({ success: true, deletedCount: result.count, action: 'clear_archived' })
  } catch (error) {
    console.error('[NOTIFICATIONS_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 })
  }
}
