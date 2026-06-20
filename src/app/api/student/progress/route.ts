import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const period = searchParams.get('period') || 'all' // weekly, monthly, all

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Validate user exists
    let user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      user = await db.user.findFirst({ where: { role: 'student' } })
    }
    if (!user) {
      return NextResponse.json({ error: 'No student user found' }, { status: 404 })
    }

    const effectiveUserId = user.id
    const now = new Date()

    // ══════════════════════════════════════
    // OVERVIEW STATS
    // ══════════════════════════════════════
    const dailyActivities = await db.dailyActivity.findMany({
      where: { userId: effectiveUserId },
      orderBy: { date: 'desc' },
    })

    const totalTimeSpentSeconds = dailyActivities.reduce((sum, d) => sum + d.timeSpent, 0)
    const totalLessonsCompleted = dailyActivities.reduce((sum, d) => sum + d.lessonsCompleted, 0)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const thisMonthActivities = dailyActivities.filter(d => d.date >= monthStart)
    const thisMonthTime = thisMonthActivities.reduce((sum, d) => sum + d.timeSpent, 0)
    const thisMonthLessons = thisMonthActivities.reduce((sum, d) => sum + d.lessonsCompleted, 0)

    // Quiz stats
    const quizAttempts = await db.quizAttempt.findMany({ where: { userId: effectiveUserId } })
    const totalQuizzes = quizAttempts.length
    const passedQuizzes = quizAttempts.filter(a => a.passed).length
    const quizPassRate = totalQuizzes > 0 ? Math.round((passedQuizzes / totalQuizzes) * 100) : 0

    // Assignment stats
    const submissions = await db.submission.findMany({ where: { studentId: effectiveUserId } })
    const totalAssignments = await db.assignment.count({
      where: { course: { enrollments: { some: { userId: effectiveUserId } } }, isPublished: true },
    })
    const submittedAssignments = submissions.length

    // ══════════════════════════════════════
    // HEATMAP DATA (last 90 days)
    // ══════════════════════════════════════
    const activityMap = new Map<string, { xp: number; timeSpent: number; lessons: number; quizzes: number }>()
    for (const d of dailyActivities) {
      activityMap.set(d.date, { xp: d.xpEarned, timeSpent: d.timeSpent, lessons: d.lessonsCompleted, quizzes: d.quizzesTaken })
    }

    const heatmap: { date: string; day: number; week: number; xp: number; active: boolean }[] = []
    for (let i = 89; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const activity = activityMap.get(dateStr)
      const xp = activity?.xp || 0
      heatmap.push({ date: dateStr, day: date.getDay(), week: Math.floor((89 - i) / 7), xp, active: xp > 0 || (activity?.timeSpent || 0) > 0 })
    }

    // ══════════════════════════════════════
    // BY COURSE DATA
    // ══════════════════════════════════════
    const enrollments = await db.enrollment.findMany({
      where: { userId: effectiveUserId },
      include: {
        course: {
          include: {
            modules: { include: { lessons: true } },
            quizzes: { include: { attempts: { where: { userId: effectiveUserId }, orderBy: { completedAt: 'desc' }, take: 1 } } },
            assignments: { include: { submissions: { where: { studentId: effectiveUserId } } } },
          },
        },
        lessonProgress: true,
      },
    })

    const courses = enrollments.map(enrollment => {
      const totalLessons = enrollment.course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0)
      const completedLessons = enrollment.lessonProgress.filter(lp => lp.status === 'completed').length
      const totalTimeSpent = enrollment.lessonProgress.reduce((sum, lp) => sum + lp.timeSpent, 0)
      const totalXpEarned = enrollment.lessonProgress.reduce((sum, lp) => sum + lp.xpEarned, 0)

      const courseQuizAttempts = enrollment.course.quizzes.flatMap(q => q.attempts)
      const courseQuizPassed = courseQuizAttempts.filter(a => a.passed).length
      const courseAvgScore = courseQuizAttempts.length > 0 ? Math.round(courseQuizAttempts.reduce((s, a) => s + a.percentage, 0) / courseQuizAttempts.length) : 0

      const courseAssignments = enrollment.course.assignments
      const courseSubmittedAssignments = courseAssignments.filter(a => a.submissions.length > 0).length
      const courseGradedAssignments = courseAssignments.filter(a => a.submissions.some(s => s.status === 'graded')).length

      return {
        enrollmentId: enrollment.id, courseId: enrollment.course.id, courseTitle: enrollment.course.title,
        category: enrollment.course.category, level: enrollment.course.level, thumbnail: enrollment.course.thumbnail,
        progress: enrollment.progress, status: enrollment.status, enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt, lastAccessed: enrollment.lastAccessed,
        totalLessons, completedLessons, totalTimeSpent, totalXpEarned,
        quizStats: { total: enrollment.course.quizzes.length, passed: courseQuizPassed, avgScore: courseAvgScore },
        assignmentStats: { total: courseAssignments.length, submitted: courseSubmittedAssignments, graded: courseGradedAssignments },
      }
    })

    // ══════════════════════════════════════
    // SKILLS DATA
    // ══════════════════════════════════════
    const userSkills = await db.userSkill.findMany({
      where: { userId: effectiveUserId }, include: { skill: true }, orderBy: { overallScore: 'desc' },
    })
    const skills = userSkills.map(us => ({
      id: us.id, skillId: us.skillId, name: us.skill.name, category: us.skill.category,
      icon: us.skill.icon, level: us.level, progress: us.overallScore, xpEarned: us.xpEarned,
    }))

    // ══════════════════════════════════════
    // ACHIEVEMENTS / BADGES
    // ══════════════════════════════════════
    const allBadges = await db.badge.findMany({
      include: { userBadges: { where: { userId: effectiveUserId }, select: { id: true, earnedAt: true } } },
    })

    const earnedBadges = allBadges.filter(b => b.userBadges.length > 0).map(b => ({
      id: b.id, name: b.name, description: b.description, icon: b.icon, category: b.category,
      xpReward: b.xpReward, coinReward: b.coinReward, earned: true, earnedAt: b.userBadges[0]?.earnedAt || null,
    })).sort((a, b) => new Date(b.earnedAt!).getTime() - new Date(a.earnedAt!).getTime())

    const lockedBadges = allBadges.filter(b => b.userBadges.length === 0).map(b => ({
      id: b.id, name: b.name, description: b.description, icon: b.icon, category: b.category,
      xpReward: b.xpReward, coinReward: b.coinReward, earned: false, earnedAt: null, requirement: b.requirement,
    }))

    // ══════════════════════════════════════
    // XP & LEVEL
    // ══════════════════════════════════════
    const XP_PER_LEVEL = 300
    const currentLevelXP = user.xp - (user.level * XP_PER_LEVEL)
    const xpToNextLevel = ((user.level + 1) * XP_PER_LEVEL) - user.xp
    const levelProgress = Math.min(Math.max((currentLevelXP / XP_PER_LEVEL) * 100, 0), 100)

    const usersAbove = await db.user.count({ where: { role: 'student', xp: { gt: user.xp } } })
    const leaderboardRank = usersAbove + 1
    const totalStudents = await db.user.count({ where: { role: 'student' } })

    // ══════════════════════════════════════
    // LEARNING GOALS
    // ══════════════════════════════════════
    const goals = await db.learningGoal.findMany({
      where: { userId: effectiveUserId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    })

    // ══════════════════════════════════════
    // DAILY CHALLENGES (with progress)
    // ══════════════════════════════════════
    const today = now.toISOString().split('T')[0]
    const todayChallenges = await db.dailyChallenge.findMany({ where: { date: today, isActive: true } })

    // Auto-create challenges if none exist
    let challenges = todayChallenges
    if (challenges.length === 0) {
      challenges = await Promise.all([
        db.dailyChallenge.create({ data: { title: 'Lesson Sprint', description: 'Complete 2 lessons today', type: 'lesson', target: 2, unit: 'lessons', xpReward: 25, coinReward: 10, icon: '📖', difficulty: 'easy', date: today } }),
        db.dailyChallenge.create({ data: { title: 'XP Hunter', description: 'Earn 100 XP today', type: 'xp', target: 100, unit: 'xp', xpReward: 50, coinReward: 25, icon: '⚡', difficulty: 'medium', date: today } }),
        db.dailyChallenge.create({ data: { title: 'Deep Focus', description: 'Study for 30 minutes', type: 'time', target: 30, unit: 'minutes', xpReward: 75, coinReward: 40, icon: '🧠', difficulty: 'hard', date: today } }),
      ])
    }

    const userChallenges = await db.userChallenge.findMany({
      where: { userId: effectiveUserId, challenge: { date: today } },
    })

    // Calculate progress for challenges
    const todayActivity = await db.dailyActivity.findUnique({ where: { userId_date: { userId: effectiveUserId, date: today } } })
    const lessonsToday = todayActivity?.lessonsCompleted || 0
    const xpToday = todayActivity?.xpEarned || 0
    const timeTodayMinutes = Math.round((todayActivity?.timeSpent || 0) / 60)

    const challengesWithProgress = challenges.map(challenge => {
      const uc = userChallenges.find(u => u.challengeId === challenge.id)
      let progress = uc?.progress || 0

      // Auto-calculate progress if no user challenge record yet
      if (!uc) {
        if (challenge.type === 'lesson') progress = Math.min(lessonsToday, challenge.target)
        else if (challenge.type === 'xp') progress = Math.min(xpToday, challenge.target)
        else if (challenge.type === 'time') progress = Math.min(timeTodayMinutes, challenge.target)
      }

      return {
        ...challenge,
        userProgress: {
          id: uc?.id || '',
          progress,
          completed: progress >= challenge.target,
          completedAt: uc?.completedAt || null,
          rewardClaimed: !!uc?.completedAt,
        },
      }
    })

    // ══════════════════════════════════════
    // XP ACTIVITY FEED (recent 30)
    // ══════════════════════════════════════
    const xpActivity = await db.xpActivity.findMany({
      where: { userId: effectiveUserId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })

    // ══════════════════════════════════════
    // WEEKLY REPORT
    // ══════════════════════════════════════
    const currentWeekStart = new Date(now)
    currentWeekStart.setDate(now.getDate() - now.getDay())
    const currentWeekStartStr = currentWeekStart.toISOString().split('T')[0]

    const prevWeekStart = new Date(currentWeekStart)
    prevWeekStart.setDate(prevWeekStart.getDate() - 7)
    const prevWeekStartStr = prevWeekStart.toISOString().split('T')[0]

    const currentWeekActivities = dailyActivities.filter(d => d.date >= currentWeekStartStr)
    const prevWeekActivities = dailyActivities.filter(d => d.date >= prevWeekStartStr && d.date < currentWeekStartStr)

    const calcPercent = (curr: number, prev: number) => prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0

    const weeklyReport = {
      currentWeek: {
        xpEarned: currentWeekActivities.reduce((s, d) => s + d.xpEarned, 0),
        lessonsCompleted: currentWeekActivities.reduce((s, d) => s + d.lessonsCompleted, 0),
        timeSpent: currentWeekActivities.reduce((s, d) => s + d.timeSpent, 0),
        quizzesTaken: currentWeekActivities.reduce((s, d) => s + d.quizzesTaken, 0),
        activeDays: currentWeekActivities.filter(d => d.xpEarned > 0 || d.timeSpent > 0).length,
      },
      previousWeek: {
        xpEarned: prevWeekActivities.reduce((s, d) => s + d.xpEarned, 0),
        lessonsCompleted: prevWeekActivities.reduce((s, d) => s + d.lessonsCompleted, 0),
        timeSpent: prevWeekActivities.reduce((s, d) => s + d.timeSpent, 0),
        quizzesTaken: prevWeekActivities.reduce((s, d) => s + d.quizzesTaken, 0),
        activeDays: prevWeekActivities.filter(d => d.xpEarned > 0 || d.timeSpent > 0).length,
      },
      change: {
        xpPercent: calcPercent(
          currentWeekActivities.reduce((s, d) => s + d.xpEarned, 0),
          prevWeekActivities.reduce((s, d) => s + d.xpEarned, 0),
        ),
        lessonsPercent: calcPercent(
          currentWeekActivities.reduce((s, d) => s + d.lessonsCompleted, 0),
          prevWeekActivities.reduce((s, d) => s + d.lessonsCompleted, 0),
        ),
        timePercent: calcPercent(
          currentWeekActivities.reduce((s, d) => s + d.timeSpent, 0),
          prevWeekActivities.reduce((s, d) => s + d.timeSpent, 0),
        ),
        quizzesPercent: calcPercent(
          currentWeekActivities.reduce((s, d) => s + d.quizzesTaken, 0),
          prevWeekActivities.reduce((s, d) => s + d.quizzesTaken, 0),
        ),
        activeDaysPercent: calcPercent(
          currentWeekActivities.filter(d => d.xpEarned > 0 || d.timeSpent > 0).length,
          prevWeekActivities.filter(d => d.xpEarned > 0 || d.timeSpent > 0).length,
        ),
      },
      topSkill: skills.length > 0 ? skills[0].name : null,
      streakDaysThisWeek: currentWeekActivities.filter(d => d.xpEarned > 0).length,
    }

    // ══════════════════════════════════════
    // STREAK INFO
    // ══════════════════════════════════════
    const monthStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const freezesUsedThisMonth = await db.streakFreeze.count({ where: { userId: effectiveUserId, date: { gte: monthStartDate } } })
    const gamificationSettings = await db.gamificationSettings.findFirst()
    const maxFreezesPerMonth = gamificationSettings?.maxStreakFreezesPerMonth || 3
    const freezeCost = gamificationSettings?.streakFreezeCost || 50

    const streakInfo = {
      current: user.streak,
      longest: user.longestStreak,
      freezesUsedThisMonth,
      maxFreezesPerMonth,
      freezeCost,
      canFreeze: freezesUsedThisMonth < maxFreezesPerMonth && user.shijlCoins >= freezeCost,
      userCoins: user.shijlCoins,
      lastActiveDate: user.lastActiveAt ? user.lastActiveAt.toISOString().split('T')[0] : null,
    }

    // ══════════════════════════════════════
    // LEADERBOARD
    // ══════════════════════════════════════
    let leaderboard: { userId: string; userName: string; avatar: string | null; xp: number; level: number; streak: number; rank: number; isCurrentUser: boolean }[] = []

    if (period === 'weekly' || period === 'monthly') {
      const periodStart = period === 'weekly'
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString().split('T')[0]
        : new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

      const periodActivities = await db.dailyActivity.findMany({
        where: { date: { gte: periodStart } },
        include: { user: { select: { id: true, name: true, avatar: true, level: true, streak: true } } },
      })

      const userXpMap = new Map<string, { userId: string; userName: string; avatar: string | null; xp: number; level: number; streak: number }>()
      for (const a of periodActivities) {
        const existing = userXpMap.get(a.userId)
        if (existing) {
          existing.xp += a.xpEarned
        } else {
          userXpMap.set(a.userId, { userId: a.user.id, userName: a.user.name, avatar: a.user.avatar, xp: a.xpEarned, level: a.user.level, streak: a.user.streak })
        }
      }

      const sorted = Array.from(userXpMap.values()).sort((a, b) => b.xp - a.xp).slice(0, 20)
      leaderboard = sorted.map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
        isCurrentUser: entry.userId === effectiveUserId,
      }))

      // Ensure current user is in the list
      if (!leaderboard.some(e => e.isCurrentUser)) {
        const myEntry = userXpMap.get(effectiveUserId)
        if (myEntry) {
          const myRank = Array.from(userXpMap.values()).filter(e => e.xp > myEntry.xp).length + 1
          leaderboard.push({ ...myEntry, rank: myRank, isCurrentUser: true })
        }
      }
    } else {
      // All-time leaderboard
      const topUsers = await db.user.findMany({
        where: { role: 'student' },
        select: { id: true, name: true, avatar: true, xp: true, level: true, streak: true },
        orderBy: { xp: 'desc' },
        take: 20,
      })

      leaderboard = topUsers.map((u, idx) => ({
        userId: u.id, userName: u.name, avatar: u.avatar, xp: u.xp, level: u.level, streak: u.streak,
        rank: idx + 1, isCurrentUser: u.id === effectiveUserId,
      }))

      // Ensure current user is in the list
      if (!leaderboard.some(e => e.isCurrentUser) && leaderboardRank > 20) {
        leaderboard.push({
          userId: effectiveUserId, userName: user.name, avatar: user.avatar, xp: user.xp,
          level: user.level, streak: user.streak, rank: leaderboardRank, isCurrentUser: true,
        })
      }
    }

    // ══════════════════════════════════════
    // RETURN COMPLETE DATA
    // ══════════════════════════════════════
    return NextResponse.json({
      overview: {
        totalLearningTime: totalTimeSpentSeconds,
        thisMonthTime,
        totalLessonsCompleted,
        thisMonthLessons,
        quizStats: { total: totalQuizzes, passed: passedQuizzes, passRate: quizPassRate },
        assignmentStats: { total: totalAssignments, submitted: submittedAssignments, rate: totalAssignments > 0 ? Math.round((submittedAssignments / totalAssignments) * 100) : 0 },
      },
      heatmap,
      courses,
      skills,
      achievements: { earned: earnedBadges, locked: lockedBadges },
      xp: {
        total: user.xp, level: user.level, levelProgress: Math.round(levelProgress),
        xpToNextLevel, coins: user.shijlCoins, streak: user.streak,
        longestStreak: user.longestStreak, leaderboardRank, totalStudents,
      },
      // New enterprise features
      goals,
      challenges: challengesWithProgress,
      xpActivity,
      weeklyReport,
      streakInfo,
      leaderboard,
    })
  } catch (error) {
    console.error('Error fetching progress data:', error)
    return NextResponse.json({ error: 'Failed to fetch progress data' }, { status: 500 })
  }
}
