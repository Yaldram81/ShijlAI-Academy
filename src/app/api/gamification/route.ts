import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    // Get user gamification data
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatar: true,
        xp: true,
        level: true,
        shijlCoins: true,
        streak: true,
        longestStreak: true,
        lastActiveAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user badges
    const userBadges = await db.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
      },
      orderBy: { earnedAt: 'desc' },
    });

    // Get all badges (for showing locked ones)
    const allBadges = await db.badge.findMany({
      include: {
        userBadges: {
          where: { userId },
          select: { id: true, earnedAt: true },
        },
      },
    });

    const badgesWithStatus = allBadges.map((badge) => ({
      ...badge,
      earned: badge.userBadges.length > 0,
      earnedAt: badge.userBadges[0]?.earnedAt || null,
    }));

    // Calculate level progress
    const XP_PER_LEVEL = 300;
    const currentLevelXP = user.xp % XP_PER_LEVEL;
    const xpToNextLevel = XP_PER_LEVEL - currentLevelXP;

    // Get leaderboard (top 10 users by XP)
    const leaderboard = await db.user.findMany({
      orderBy: { xp: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        avatar: true,
        xp: true,
        level: true,
        streak: true,
      },
    });

    // Get quiz stats
    const quizAttempts = await db.quizAttempt.findMany({
      where: { userId },
    });

    const totalQuizzes = quizAttempts.length;
    const passedQuizzes = quizAttempts.filter((a) => a.passed).length;
    const perfectQuizzes = quizAttempts.filter((a) => a.percentage === 100).length;

    // Get enrollment stats
    const enrollmentCount = await db.enrollment.count({
      where: { userId },
    });

    const completedCourses = await db.enrollment.count({
      where: { userId, completedAt: { not: null } },
    });

    return NextResponse.json({
      user,
      gamification: {
        xp: user.xp,
        level: user.level,
        levelProgress: Math.round((currentLevelXP / XP_PER_LEVEL) * 100),
        xpToNextLevel,
        coins: user.shijlCoins,
        streak: user.streak,
        longestStreak: user.longestStreak,
      },
      badges: badgesWithStatus,
      earnedBadges: userBadges,
      stats: {
        totalQuizzes,
        passedQuizzes,
        perfectQuizzes,
        enrollmentCount,
        completedCourses,
      },
      leaderboard,
    });
  } catch (error) {
    console.error('Error fetching gamification data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gamification data' },
      { status: 500 }
    );
  }
}
