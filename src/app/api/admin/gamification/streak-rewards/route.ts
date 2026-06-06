import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/gamification/streak-rewards
export async function GET() {
  try {
    const rewards = await db.streakReward.findMany({
      orderBy: { streakDays: 'asc' },
      include: { badge: { select: { id: true, name: true, icon: true } } },
    })
    return NextResponse.json({ data: rewards })
  } catch (error) {
    console.error('[Streak Rewards GET]', error)
    return NextResponse.json({ error: 'Failed to fetch streak rewards' }, { status: 500 })
  }
}

// POST /api/admin/gamification/streak-rewards — Create new streak reward
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { streakDays, xpBonus, coinBonus, badgeId, isActive } = body

    if (!streakDays) {
      return NextResponse.json({ error: 'streakDays is required' }, { status: 400 })
    }

    const reward = await db.streakReward.create({
      data: {
        streakDays: Number(streakDays),
        xpBonus: Number(xpBonus || 0),
        coinBonus: Number(coinBonus || 0),
        badgeId: badgeId || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      include: { badge: { select: { id: true, name: true, icon: true } } },
    })

    return NextResponse.json({ data: reward }, { status: 201 })
  } catch (error) {
    console.error('[Streak Rewards POST]', error)
    return NextResponse.json({ error: 'Failed to create streak reward' }, { status: 500 })
  }
}

// PATCH /api/admin/gamification/streak-rewards — Update streak reward
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, streakDays, xpBonus, coinBonus, badgeId, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (streakDays !== undefined) updateData.streakDays = Number(streakDays)
    if (xpBonus !== undefined) updateData.xpBonus = Number(xpBonus)
    if (coinBonus !== undefined) updateData.coinBonus = Number(coinBonus)
    if (badgeId !== undefined) updateData.badgeId = badgeId || null
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    const reward = await db.streakReward.update({
      where: { id },
      data: updateData,
      include: { badge: { select: { id: true, name: true, icon: true } } },
    })

    return NextResponse.json({ data: reward })
  } catch (error) {
    console.error('[Streak Rewards PATCH]', error)
    return NextResponse.json({ error: 'Failed to update streak reward' }, { status: 500 })
  }
}
