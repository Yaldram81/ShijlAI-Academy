import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/admin/gamification/bulk-actions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'award_xp_coins': {
        const { userIds, xpAmount, coinAmount, reason } = body
        if (!userIds?.length || (!xpAmount && !coinAmount)) {
          return NextResponse.json({ error: 'userIds and at least one of xpAmount/coinAmount are required' }, { status: 400 })
        }

        const xp = Number(xpAmount || 0)
        const coins = Number(coinAmount || 0)

        // Update each user and create activity log in a transaction
        await db.$transaction(async (tx) => {
          for (const userId of userIds as string[]) {
            const updates: Record<string, unknown> = {}
            if (xp > 0) updates.xp = { increment: xp }
            if (coins > 0) updates.shijlCoins = { increment: coins }

            await tx.user.update({ where: { id: userId }, data: updates })
            await tx.xpActivity.create({
              data: {
                userId,
                action: 'admin_grant',
                xpAmount: xp,
                coinAmount: coins,
                description: reason || 'Admin granted XP/coins',
                metadata: JSON.stringify({ type: 'bulk_award', reason }),
              },
            })
          }
        })

        return NextResponse.json({ data: { updated: userIds.length, xp, coins } })
      }

      case 'reset_leaderboard': {
        // Reset all students' XP to 0 in a transaction
        await db.$transaction(async (tx) => {
          await tx.user.updateMany({
            where: { role: 'student' },
            data: { xp: 0, level: 1 },
          })
        })

        const result = await db.user.count({ where: { role: 'student' } })
        return NextResponse.json({ data: { reset: result } })
      }

      case 'toggle_all_xp_rules': {
        const { isActive } = body
        if (isActive === undefined) {
          return NextResponse.json({ error: 'isActive is required' }, { status: 400 })
        }

        const result = await db.$transaction(async (tx) => {
          return tx.xPRule.updateMany({
            data: { isActive: Boolean(isActive) },
          })
        })

        return NextResponse.json({ data: { updated: result.count } })
      }

      case 'reset_streaks': {
        await db.$transaction(async (tx) => {
          await tx.user.updateMany({
            where: { role: 'student' },
            data: { streak: 0 },
          })
        })

        const result = await db.user.count({ where: { role: 'student' } })
        return NextResponse.json({ data: { reset: result } })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[Bulk Actions POST]', error)
    return NextResponse.json({ error: 'Failed to perform bulk action' }, { status: 500 })
  }
}
