import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Count freezes used this month
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const freezesUsedThisMonth = await db.streakFreeze.count({
      where: { userId, date: { gte: monthStart } },
    })

    // Get gamification settings for freeze config
    const gamificationSettings = await db.gamificationSettings.findFirst()
    const maxFreezesPerMonth = gamificationSettings?.maxStreakFreezesPerMonth || 3
    const freezeCost = gamificationSettings?.streakFreezeCost || 50

    return NextResponse.json({
      streakInfo: {
        current: user.streak,
        longest: user.longestStreak,
        freezesUsedThisMonth,
        maxFreezesPerMonth,
        freezeCost,
        canFreeze: freezesUsedThisMonth < maxFreezesPerMonth && user.shijlCoins >= freezeCost,
        userCoins: user.shijlCoins,
        lastActiveDate: user.lastActiveAt ? user.lastActiveAt.toISOString().split('T')[0] : null,
      },
    })
  } catch (error) {
    console.error('Error fetching streak info:', error)
    return NextResponse.json({ error: 'Failed to fetch streak info' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get settings
    const gamificationSettings = await db.gamificationSettings.findFirst()
    const maxFreezesPerMonth = gamificationSettings?.maxStreakFreezesPerMonth || 3
    const freezeCost = gamificationSettings?.streakFreezeCost || 50

    // Check limits
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const freezesUsedThisMonth = await db.streakFreeze.count({
      where: { userId, date: { gte: monthStart } },
    })

    if (freezesUsedThisMonth >= maxFreezesPerMonth) {
      return NextResponse.json({ error: 'Maximum streak freezes used this month' }, { status: 400 })
    }

    if (user.shijlCoins < freezeCost) {
      return NextResponse.json({ error: 'Not enough coins for streak freeze' }, { status: 400 })
    }

    // Apply freeze - protects yesterday (if streak would have broken)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    await db.streakFreeze.create({
      data: { userId, date: yesterdayStr, costCoins: freezeCost },
    })

    // Deduct coins
    await db.user.update({
      where: { id: userId },
      data: { shijlCoins: { decrement: freezeCost } },
    })

    return NextResponse.json({
      success: true,
      message: `Streak freeze applied! ${freezeCost} coins deducted.`,
      remainingCoins: user.shijlCoins - freezeCost,
    })
  } catch (error) {
    console.error('Error using streak freeze:', error)
    return NextResponse.json({ error: 'Failed to use streak freeze' }, { status: 500 })
  }
}
