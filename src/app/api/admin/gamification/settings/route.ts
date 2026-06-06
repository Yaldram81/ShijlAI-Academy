import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_SETTINGS = {
  id: 'gamification_settings_singleton',
  leaderboardResetFrequency: 'monthly',
  leaderboardShowFullName: true,
  topWinnerCount: 3,
  topWinnerRewardType: 'platform_credit',
  topWinnerRewardAmount: 500,
  streakXpMultiplier: 1.0,
  streakFreezeEnabled: true,
  streakFreezeCost: 50,
  maxStreakFreezesPerMonth: 3,
  xpEnabled: true,
  badgesEnabled: true,
  leaderboardsEnabled: true,
  streaksEnabled: true,
  rewardsEnabled: true,
  challengesEnabled: true,
  eventsEnabled: true,
  shopEnabled: true,
}

// GET /api/admin/gamification/settings
export async function GET() {
  try {
    let settings = await db.gamificationSettings.findFirst()
    if (!settings) {
      settings = await db.gamificationSettings.create({ data: DEFAULT_SETTINGS })
    }
    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error('[Gamification Settings GET]', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PATCH /api/admin/gamification/settings
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    let settings = await db.gamificationSettings.findFirst()

    if (!settings) {
      settings = await db.gamificationSettings.create({ data: DEFAULT_SETTINGS })
    }

    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'leaderboardResetFrequency', 'leaderboardShowFullName', 'topWinnerCount',
      'topWinnerRewardType', 'topWinnerRewardAmount', 'streakXpMultiplier',
      'streakFreezeEnabled', 'streakFreezeCost', 'maxStreakFreezesPerMonth',
      'xpEnabled', 'badgesEnabled', 'leaderboardsEnabled', 'streaksEnabled', 'rewardsEnabled',
      'challengesEnabled', 'eventsEnabled', 'shopEnabled',
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (typeof settings[field] === 'boolean') {
          updateData[field] = Boolean(body[field])
        } else if (typeof settings[field] === 'number') {
          updateData[field] = Number(body[field])
        } else {
          updateData[field] = body[field]
        }
      }
    }

    const updated = await db.gamificationSettings.update({
      where: { id: settings.id },
      data: updateData,
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[Gamification Settings PATCH]', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
