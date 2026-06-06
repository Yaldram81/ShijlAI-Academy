import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/gamification — Overview stats + all gamification data
export async function GET() {
  try {
    const [
      xpRules,
      badges,
      levels,
      settings,
      streakRewards,
      challenges,
      rewardShop,
      events,
      xpActivityRecent,
      totalBadgesAwarded,
      totalRewardsClaimed,
      activeEvents,
      // Aggregate stats across ALL students (not just top 50)
      studentCount,
      totalXpAggregate,
      totalCoinsAggregate,
      maxStreakAggregate,
      activeStreakCount,
      levelDistributionRaw,
    ] = await Promise.all([
      db.xPRule.findMany({ orderBy: { order: 'asc' } }),
      db.badge.findMany({ orderBy: { name: 'asc' } }),
      db.levelConfig.findMany({ orderBy: { level: 'asc' } }),
      db.gamificationSettings.findFirst(),
      db.streakReward.findMany({ orderBy: { streakDays: 'asc' }, include: { badge: { select: { id: true, name: true, icon: true } } } }),
      db.dailyChallenge.findMany({ orderBy: { date: 'desc' }, include: { _count: { select: { userChallenges: true } } } }),
      db.rewardShopItem.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { userRewards: true } } } }),
      db.gamificationEvent.findMany({ orderBy: { startDate: 'desc' } }),
      db.xpActivity.aggregate({
        _sum: { xpAmount: true },
        _count: true,
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
      db.userBadge.count(),
      db.userReward.count(),
      db.gamificationEvent.count({ where: { isActive: true, endDate: { gte: new Date() } } }),
      // Full aggregate stats
      db.user.count({ where: { role: 'student' } }),
      db.user.aggregate({ _sum: { xp: true, shijlCoins: true }, where: { role: 'student' } }),
      db.user.aggregate({ _sum: { shijlCoins: true }, where: { role: 'student' } }),
      db.user.findFirst({ where: { role: 'student' }, orderBy: { longestStreak: 'desc' }, select: { longestStreak: true } }),
      db.user.count({ where: { role: 'student', streak: { gt: 0 } } }),
      db.user.groupBy({ by: ['level'], where: { role: 'student' }, _count: { level: true } }),
    ])

    // Top 50 users for leaderboard display
    const leaderboardUsers = await db.user.findMany({
      where: { role: 'student' },
      select: { id: true, xp: true, level: true, shijlCoins: true, streak: true, longestStreak: true, name: true, avatar: true },
      orderBy: { xp: 'desc' },
      take: 50,
    })

    // Badge earn counts
    const userBadgeRows = await db.userBadge.findMany({ select: { badgeId: true } })
    const badgeEarnCounts: Record<string, number> = {}
    for (const ub of userBadgeRows) {
      badgeEarnCounts[ub.badgeId] = (badgeEarnCounts[ub.badgeId] || 0) + 1
    }

    // Total XP/coins from aggregate
    const totalXpDistributed = totalXpAggregate._sum.xp || 0
    const totalCoinsDistributed = totalXpAggregate._sum.shijlCoins || 0

    // Level distribution from groupBy
    const levelDistribution: Record<number, number> = {}
    for (const row of levelDistributionRaw) {
      levelDistribution[row.level] = row._count.level
    }

    return NextResponse.json({
      data: {
        xpRules,
        badges: badges.map(b => ({
          ...b,
          earnCount: badgeEarnCounts[b.id] || 0,
        })),
        levels,
        settings: settings || {
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
        },
        streakRewards,
        leaderboard: leaderboardUsers.map((u, i) => ({
          rank: i + 1,
          userId: u.id,
          userName: u.name,
          avatar: u.avatar,
          xp: u.xp,
          level: u.level,
          streak: u.streak,
          longestStreak: u.longestStreak,
          coins: u.shijlCoins,
        })),
        challenges: challenges.map(c => ({
          id: c.id,
          title: c.title,
          description: c.description,
          type: c.type,
          target: c.target,
          unit: c.unit,
          xpReward: c.xpReward,
          coinReward: c.coinReward,
          icon: c.icon,
          difficulty: c.difficulty,
          date: c.date,
          isActive: c.isActive,
          participantCount: c._count.userChallenges,
          createdAt: c.createdAt,
        })),
        rewardShop: rewardShop.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          icon: r.icon,
          category: r.category,
          coinCost: r.coinCost,
          xpCost: r.xpCost,
          stock: r.stock,
          claimed: r.claimed,
          claimCount: r._count.userRewards,
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
        events,
        xpActivityRecent: {
          count: xpActivityRecent._count,
          totalXp: xpActivityRecent._sum.xpAmount || 0,
        },
        stats: {
          totalXpDistributed,
          totalCoinsDistributed,
          totalBadgesAwarded,
          activeUsersWithStreak: activeStreakCount,
          avgXpPerUser: studentCount > 0 ? Math.round(totalXpDistributed / studentCount) : 0,
          maxStreak: maxStreakAggregate?.longestStreak || 0,
          totalChallengesCreated: challenges.length,
          totalRewardsClaimed,
          activeEvents,
          levelDistribution,
        },
      },
    })
  } catch (error) {
    console.error('[Gamification GET]', error)
    return NextResponse.json({ error: 'Failed to fetch gamification data' }, { status: 500 })
  }
}
