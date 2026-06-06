import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/settings/sessions - List active sessions for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const sessions = await db.userSession.findMany({
      where: { userId, isActive: true },
      orderBy: { lastActivity: 'desc' },
    })

    // If no sessions in DB, return mock demo sessions
    if (sessions.length === 0) {
      const now = new Date()
      return NextResponse.json({
        sessions: [
          {
            id: 'demo-current',
            deviceName: 'Chrome on MacOS',
            deviceType: 'desktop',
            browser: 'Chrome 121',
            os: 'macOS Sonoma',
            ipAddress: '192.168.1.1',
            location: 'New York, US',
            isActive: true,
            isCurrent: true,
            lastActivity: now.toISOString(),
            createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'demo-mobile',
            deviceName: 'Safari on iPhone',
            deviceType: 'mobile',
            browser: 'Safari 17',
            os: 'iOS 17.3',
            ipAddress: '192.168.1.2',
            location: 'London, UK',
            isActive: true,
            isCurrent: false,
            lastActivity: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
            createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'demo-tablet',
            deviceName: 'Firefox on iPad',
            deviceType: 'tablet',
            browser: 'Firefox 122',
            os: 'iPadOS 17',
            ipAddress: '10.0.0.5',
            location: 'Toronto, Canada',
            isActive: true,
            isCurrent: false,
            lastActivity: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      })
    }

    return NextResponse.json({
      sessions: sessions.map((s, i) => ({
        id: s.id,
        deviceName: s.deviceName || 'Unknown device',
        deviceType: s.deviceType,
        browser: s.browser || 'Unknown',
        os: s.os || 'Unknown',
        ipAddress: s.ipAddress || 'Unknown',
        location: s.location || 'Unknown',
        isActive: s.isActive,
        isCurrent: i === 0,
        lastActivity: s.lastActivity.toISOString(),
        createdAt: s.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

// DELETE /api/instructor/settings/sessions - Revoke sessions
export async function DELETE(request: NextRequest) {
  try {
    // Try to read JSON body first, fall back to query params
    let userId: string | null = null
    let sessionId: string | null = null
    let revokeAll = false

    try {
      const body = await request.json()
      userId = body.userId || null
      sessionId = body.sessionId || null
      revokeAll = body.revokeAll === true
    } catch {
      // Body parsing failed, try query params
      const { searchParams } = new URL(request.url)
      userId = searchParams.get('userId')
      sessionId = searchParams.get('sessionId')
      revokeAll = searchParams.get('revokeAll') === 'true'
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (revokeAll) {
      const result = await db.userSession.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      })
      return NextResponse.json({ success: true, revokedCount: result.count })
    }

    if (sessionId) {
      // For demo sessions, just return success
      if (sessionId.startsWith('demo-')) {
        return NextResponse.json({ success: true })
      }
      const session = await db.userSession.findUnique({ where: { id: sessionId } })
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
      await db.userSession.update({
        where: { id: sessionId },
        data: { isActive: false },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Provide sessionId or revokeAll=true' }, { status: 400 })
  } catch (error) {
    console.error('Error revoking sessions:', error)
    return NextResponse.json({ error: 'Failed to revoke sessions' }, { status: 500 })
  }
}
