import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/admin/gamification/badge-award — Award badge to user
export async function POST(req: NextRequest) {
  try {
    const { userId, badgeId } = await req.json()

    if (!userId || !badgeId) {
      return NextResponse.json({ error: 'userId and badgeId are required' }, { status: 400 })
    }

    // Check if already awarded
    const existing = await db.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Badge already awarded to this user' }, { status: 409 })
    }

    const badge = await db.badge.findUnique({ where: { id: badgeId } })
    if (!badge) {
      return NextResponse.json({ error: 'Badge not found' }, { status: 404 })
    }

    // Create UserBadge and update user XP/coins in a transaction
    const result = await db.$transaction(async (tx) => {
      const userBadge = await tx.userBadge.create({
        data: { userId, badgeId },
      })

      await tx.user.update({
        where: { id: userId },
        data: {
          xp: { increment: badge.xpReward },
          shijlCoins: { increment: badge.coinReward },
        },
      })

      if (badge.xpReward > 0 || badge.coinReward > 0) {
        await tx.xpActivity.create({
          data: {
            userId,
            action: 'earn_badge',
            xpAmount: badge.xpReward,
            coinAmount: badge.coinReward,
            description: `Earned badge: ${badge.name}`,
            metadata: JSON.stringify({ badgeId, badgeName: badge.name }),
          },
        })
      }

      return userBadge
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    console.error('[Badge Award POST]', error)
    return NextResponse.json({ error: 'Failed to award badge' }, { status: 500 })
  }
}

// DELETE /api/admin/gamification/badge-award — Revoke badge from user
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const badgeId = searchParams.get('badgeId')

    if (!userId || !badgeId) {
      return NextResponse.json({ error: 'userId and badgeId are required' }, { status: 400 })
    }

    const badge = await db.badge.findUnique({ where: { id: badgeId } })

    // Revoke badge and decrement XP/coins in a transaction
    await db.$transaction(async (tx) => {
      await tx.userBadge.delete({
        where: { userId_badgeId: { userId, badgeId } },
      })

      if (badge) {
        await tx.user.update({
          where: { id: userId },
          data: {
            xp: { decrement: badge.xpReward },
            shijlCoins: { decrement: badge.coinReward },
          },
        })
      }
    })

    return NextResponse.json({ data: { revoked: true } })
  } catch (error) {
    console.error('[Badge Award DELETE]', error)
    return NextResponse.json({ error: 'Failed to revoke badge' }, { status: 500 })
  }
}
