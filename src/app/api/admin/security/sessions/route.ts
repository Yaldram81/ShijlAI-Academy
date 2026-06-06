import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/security/sessions — Fetch all active user sessions
export async function GET() {
  try {
    const sessions = await db.userSession.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: { lastActivity: 'desc' },
    })

    const serialized = sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      userName: s.user.name,
      userEmail: s.user.email,
      userAvatar: s.user.avatar,
      userRole: s.user.role,
      deviceName: s.deviceName,
      deviceType: s.deviceType,
      browser: s.browser,
      os: s.os,
      ipAddress: s.ipAddress,
      location: s.location,
      isActive: s.isActive,
      lastActivity: s.lastActivity.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
    }))

    // Compute stats
    const totalActive = serialized.length
    const desktopSessions = serialized.filter((s) => s.deviceType === 'desktop').length
    const mobileSessions = serialized.filter((s) => s.deviceType === 'mobile').length
    const now = new Date()
    const expiredSessions = serialized.filter((s) => new Date(s.expiresAt) < now).length

    // Stats by browser
    const byBrowser: Record<string, number> = {}
    for (const s of serialized) {
      const b = s.browser || 'Unknown'
      byBrowser[b] = (byBrowser[b] || 0) + 1
    }

    // Stats by device type
    const byDeviceType: Record<string, number> = {}
    for (const s of serialized) {
      byDeviceType[s.deviceType] = (byDeviceType[s.deviceType] || 0) + 1
    }

    return NextResponse.json({
      sessions: serialized,
      stats: {
        totalActive,
        desktopSessions,
        mobileSessions,
        expiredSessions,
        byDeviceType,
        byBrowser,
      },
    })
  } catch (error) {
    console.error('Sessions fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/security/sessions — Terminate a session or all sessions for a user
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, userId, terminateAll } = body

    if (terminateAll && userId) {
      // Terminate all sessions for a user
      const result = await db.userSession.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      })

      // Log the action
      await db.activityLog.create({
        data: {
          type: 'security_alert',
          title: 'All sessions terminated for user',
          description: `Admin terminated all active sessions for user ${userId}`,
          icon: '🔒',
          action: 'terminated',
          targetType: 'user',
          targetId: userId,
          category: 'security',
          severity: 'warning',
        },
      })

      return NextResponse.json({
        success: true,
        message: `Terminated ${result.count} session(s) for user`,
        count: result.count,
      })
    }

    if (id) {
      // Terminate a single session
      const session = await db.userSession.findUnique({ where: { id } })
      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        )
      }

      await db.userSession.update({
        where: { id },
        data: { isActive: false },
      })

      // Log the action
      await db.activityLog.create({
        data: {
          type: 'security_alert',
          title: 'Session terminated',
          description: `Admin terminated session ${id}`,
          icon: '🔒',
          action: 'terminated',
          targetType: 'session',
          targetId: id,
          category: 'security',
          severity: 'info',
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Session terminated',
      })
    }

    return NextResponse.json(
      { error: 'Either id or userId+terminateAll is required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Session terminate error:', error)
    return NextResponse.json(
      { error: 'Failed to terminate session' },
      { status: 500 }
    )
  }
}
