import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/notifications/preferences — Get user notification preferences
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    let prefs = await db.notificationPreference.findUnique({ where: { userId } })
    if (!prefs) {
      prefs = await db.notificationPreference.create({ data: { userId } })
    }

    return NextResponse.json({ preferences: prefs })
  } catch (error) {
    console.error('[NOTIFICATION_PREFS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

// PUT /api/notifications/preferences — Update user notification preferences
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...updates } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Remove fields that shouldn't be updated directly
    const { id, createdAt, updatedAt, ...updateData } = updates as Record<string, unknown>

    // Whitelist allowed fields only
    const allowedFields = [
      'enableInApp', 'enableEmail', 'enablePush',
      'enrollmentNotifications', 'courseUpdateNotifications', 'assignmentNotifications',
      'qaNotifications', 'reviewNotifications', 'messageNotifications', 'payoutNotifications',
      'achievementNotifications', 'socialNotifications', 'securityNotifications',
      'promotionNotifications', 'liveSessionNotifications', 'reminderNotifications',
      'systemNotifications', 'digestMode', 'quietHoursEnabled', 'quietHoursStart',
      'quietHoursEnd', 'soundEnabled', 'desktopAlerts',
    ]
    const sanitized = Object.fromEntries(
      Object.entries(updateData).filter(([k]) => allowedFields.includes(k))
    )

    let prefs = await db.notificationPreference.findUnique({ where: { userId } })
    if (!prefs) {
      prefs = await db.notificationPreference.create({ data: { userId, ...sanitized } })
    } else {
      prefs = await db.notificationPreference.update({
        where: { userId },
        data: sanitized,
      })
    }

    return NextResponse.json({ preferences: prefs })
  } catch (error) {
    console.error('[NOTIFICATION_PREFS_PUT]', error)
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }
}
