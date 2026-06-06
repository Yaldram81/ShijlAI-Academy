import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper: validate userId, fallback to first student user
async function validateUser(userId: string | null): Promise<{ id: string; name: string; role: string } | null> {
  if (userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    })
    if (user) return user
  }
  // Fallback: find first student user
  const fallback = await db.user.findFirst({
    where: { role: 'student' },
    select: { id: true, name: true, role: true },
  })
  return fallback
}

interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  avatar: string | null
  xp: number
  level: number
  streak: number
  isCurrentUser: boolean
}

// GET /api/student/community/leaderboard?userId=xxx&period=week&courseId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const period = searchParams.get('period') || 'week' // week, month, all
    const courseId = searchParams.get('courseId')

    const user = await validateUser(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'No student user found' },
        { status: 404 }
      )
    }

    // Determine date range based on period
    const now = new Date()
    let startDate: Date | null = null

    if (period === 'week') {
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 7)
    } else if (period === 'month') {
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 30)
    }
    // "all" period: startDate stays null (no date filter)

    // For courseId filter, get enrolled user IDs in that course
    let courseUserIds: string[] | null = null
    if (courseId) {
      const enrollments = await db.enrollment.findMany({
        where: { courseId },
        select: { userId: true },
      })
      courseUserIds = enrollments.map((e) => e.userId)
    }

    if (period === 'all') {
      // Use User.xp directly for "all" period
      const whereClause: { role: string; id?: { in: string[] } } = { role: 'student' }
      if (courseUserIds) {
        whereClause.id = { in: courseUserIds }
      }

      const allUsers = await db.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          avatar: true,
          xp: true,
          level: true,
          streak: true,
        },
        orderBy: { xp: 'desc' },
      })

      // Build leaderboard
      const leaderboard: LeaderboardEntry[] = allUsers.slice(0, 20).map((u, index) => ({
        rank: index + 1,
        userId: u.id,
        userName: u.name,
        avatar: u.avatar,
        xp: u.xp,
        level: u.level,
        streak: u.streak,
        isCurrentUser: u.id === user.id,
      }))

      // Find current user's rank if not in top 20
      const currentUserRank = allUsers.findIndex((u) => u.id === user.id) + 1

      return NextResponse.json({
        leaderboard,
        period,
        currentUserRank: currentUserRank > 0 ? currentUserRank : null,
        currentUserEntry: currentUserRank > 20
          ? {
              rank: currentUserRank,
              userId: user.id,
              userName: allUsers[currentUserRank - 1]?.name ?? user.name,
              avatar: allUsers[currentUserRank - 1]?.avatar ?? null,
              xp: allUsers[currentUserRank - 1]?.xp ?? 0,
              level: allUsers[currentUserRank - 1]?.level ?? 1,
              streak: allUsers[currentUserRank - 1]?.streak ?? 0,
              isCurrentUser: true,
            }
          : null,
      })
    } else {
      // For "week" or "month": aggregate DailyActivity xpEarned
      const dateFilter = startDate
        ? { date: { gte: startDate.toISOString().split('T')[0] } }
        : {}

      const userFilter = courseUserIds
        ? { userId: { in: courseUserIds } }
        : {}

      // Aggregate XP from DailyActivity
      const activities = await db.dailyActivity.findMany({
        where: {
          ...dateFilter,
          ...userFilter,
        },
        select: {
          userId: true,
          xpEarned: true,
        },
      })

      // Sum XP per user
      const userXpMap = new Map<string, number>()
      for (const activity of activities) {
        const current = userXpMap.get(activity.userId) ?? 0
        userXpMap.set(activity.userId, current + activity.xpEarned)
      }

      // Get user details for users with activity
      const activeUserIds = Array.from(userXpMap.keys())
      const usersData = await db.user.findMany({
        where: {
          id: { in: activeUserIds },
          role: 'student',
        },
        select: {
          id: true,
          name: true,
          avatar: true,
          level: true,
          streak: true,
        },
      })

      // Build leaderboard entries
      const entries: LeaderboardEntry[] = usersData
        .map((u) => ({
          userId: u.id,
          userName: u.name,
          avatar: u.avatar,
          xp: userXpMap.get(u.id) ?? 0,
          level: u.level,
          streak: u.streak,
          isCurrentUser: u.id === user.id,
          rank: 0,
        }))
        .sort((a, b) => b.xp - a.xp)

      // Assign ranks
      for (let i = 0; i < entries.length; i++) {
        entries[i].rank = i + 1
      }

      const leaderboard = entries.slice(0, 20)

      // Find current user's entry
      const currentUserEntry = entries.find((e) => e.isCurrentUser)
      const currentUserRank = currentUserEntry?.rank ?? null

      return NextResponse.json({
        leaderboard,
        period,
        currentUserRank,
        currentUserEntry: currentUserEntry && currentUserRank && currentUserRank > 20
          ? currentUserEntry
          : null,
      })
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
