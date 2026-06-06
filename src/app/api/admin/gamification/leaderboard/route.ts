import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/gamification/leaderboard
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number(searchParams.get('limit') || '50'), 200)
    const period = searchParams.get('period') || 'all_time' // all_time, monthly, weekly

    const users = await db.user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        name: true,
        avatar: true,
        xp: true,
        level: true,
        streak: true,
        longestStreak: true,
        shijlCoins: true,
      },
      orderBy: { xp: 'desc' },
      take: limit,
    })

    const leaderboard = users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      userName: u.name,
      avatar: u.avatar,
      xp: u.xp,
      level: u.level,
      streak: u.streak,
      longestStreak: u.longestStreak,
      coins: u.shijlCoins,
    }))

    return NextResponse.json({ data: leaderboard, period })
  } catch (error) {
    console.error('[Leaderboard GET]', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
