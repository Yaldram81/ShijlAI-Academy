import { db } from '@/lib/db'

/**
 * Feature Engine - Core Intelligence
 * Turns raw event data into computed metrics (0-100 scores)
 */

// Learning Speed: completed_lessons / total_time_spent normalized to 0-100
export async function computeLearningSpeed(userId: string): Promise<number> {
  try {
    const enrollments = await db.enrollment.findMany({
      where: { userId },
      include: { lessonProgress: true },
    })

    const totalLessonsCompleted = enrollments.reduce(
      (sum, e) => sum + e.lessonProgress.filter(lp => lp.status === 'completed').length,
      0
    )

    const totalTimeSpentHours = enrollments.reduce(
      (sum, e) => sum + e.lessonProgress.reduce((lpSum, lp) => lpSum + lp.timeSpent, 0),
      0
    ) / 3600

    if (totalTimeSpentHours < 0.1) return 50 // Default for new students
    const speed = (totalLessonsCompleted / totalTimeSpentHours) * 10
    return Math.min(100, Math.max(0, Math.round(speed)))
  } catch {
    return 50
  }
}

// Engagement Score: login_frequency + time_spent + quiz_attempts + AI usage → 0-100
export async function computeEngagementScore(userId: string): Promise<number> {
  try {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Login frequency (last 30 days)
    const loginCount = await db.learningMetric.count({
      where: { userId, eventType: 'login', createdAt: { gte: monthAgo } },
    })

    // Time spent (last 7 days)
    const timeSpentEvents = await db.learningMetric.findMany({
      where: { userId, eventType: 'time_spent', createdAt: { gte: weekAgo } },
      select: { eventValue: true },
    })
    const totalTimeHours = timeSpentEvents.reduce((s, e) => s + e.eventValue, 0) / 3600

    // Quiz attempts (last 7 days)
    const quizAttempts = await db.learningMetric.count({
      where: { userId, eventType: 'quiz_attempted', createdAt: { gte: weekAgo } },
    })

    // AI tutor usage (last 7 days)
    const aiUsage = await db.learningMetric.count({
      where: { userId, eventType: 'ai_tutor_used', createdAt: { gte: weekAgo } },
    })

    // Also get lesson completions
    const lessonsCompleted = await db.learningMetric.count({
      where: { userId, eventType: 'lesson_completed', createdAt: { gte: weekAgo } },
    })

    const rawScore =
      (Math.min(loginCount, 7) * 5) + // Max 35 from login (7 days)
      (totalTimeHours * 4) + // Max ~28 from time (7 hours)
      (Math.min(quizAttempts, 10) * 2) + // Max 20 from quizzes
      (Math.min(aiUsage, 10) * 1.5) + // Max 15 from AI
      (Math.min(lessonsCompleted, 10) * 0.5) // Max 5 from lessons

    return Math.min(100, Math.max(0, Math.round(rawScore)))
  } catch {
    return 0
  }
}

// Consistency Score: days_active / total_days_enrolled * 100
export async function computeConsistencyScore(userId: string): Promise<number> {
  try {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return 0

    const enrollments = await db.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: 'asc' },
    })

    if (enrollments.length === 0) return 0

    const earliestEnrollment = enrollments[0].enrolledAt
    const totalDaysEnrolled = Math.max(1, Math.floor((Date.now() - new Date(earliestEnrollment).getTime()) / (1000 * 60 * 60 * 24)))

    // Count distinct active days (days with any event)
    const activeDays = await db.learningMetric.groupBy({
      by: ['userId'],
      where: {
        userId,
        createdAt: { gte: earliestEnrollment },
      },
      _count: { id: true },
    })

    // Simpler approach: count distinct dates from daily activities
    const dailyActivities = await db.dailyActivity.findMany({
      where: {
        userId,
        date: { gte: new Date(earliestEnrollment).toISOString().split('T')[0] },
      },
    })

    const activeDayCount = dailyActivities.length || Math.min(user.streak || 0, totalDaysEnrolled)
    const consistency = (activeDayCount / totalDaysEnrolled) * 100

    // Penalize gaps: if streak < 3, reduce score
    const streakPenalty = (user.streak || 0) < 3 ? 10 : 0

    return Math.min(100, Math.max(0, Math.round(consistency - streakPenalty)))
  } catch {
    return 0
  }
}

// Average Performance: avg(quiz_scores + assignment_scores)
export async function computeAveragePerformance(userId: string): Promise<number> {
  try {
    const quizAttempts = await db.quizAttempt.findMany({
      where: { userId, completedAt: { not: null } },
      select: { percentage: true },
    })

    const submissions = await db.submission.findMany({
      where: { studentId: userId, score: { not: null } },
      select: { score: true, assignment: { select: { maxScore: true } } },
    })

    const quizScores = quizAttempts.map(q => q.percentage)
    const assignmentScores = submissions.map(s =>
      s.assignment.maxScore > 0 ? (s.score! / s.assignment.maxScore) * 100 : 0
    )

    const allScores = [...quizScores, ...assignmentScores]
    if (allScores.length === 0) return 0

    return Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)
  } catch {
    return 0
  }
}

// Drop Risk: 0-100 (0-30 safe, 30-60 warning, 60-100 high risk)
export async function computeDropRisk(userId: string): Promise<number> {
  try {
    const engagement = await computeEngagementScore(userId)
    const consistency = await computeConsistencyScore(userId)
    const performance = await computeAveragePerformance(userId)

    // Inactivity days
    const user = await db.user.findUnique({ where: { id: userId } })
    const lastActive = user?.lastActiveAt ? new Date(user.lastActiveAt) : new Date()
    const inactivityDays = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
    const inactivityScore = Math.min(100, inactivityDays * 5) // 5 points per inactive day

    // Declining scores: compare recent vs older quiz scores
    const recentQuizzes = await db.quizAttempt.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      take: 5,
      select: { percentage: true },
    })
    const olderQuizzes = await db.quizAttempt.findMany({
      where: {
        userId,
        completedAt: { not: null },
      },
      orderBy: { completedAt: 'asc' },
      take: 5,
      select: { percentage: true },
    })

    let decliningScore = 0
    if (recentQuizzes.length >= 2 && olderQuizzes.length >= 2) {
      const recentAvg = recentQuizzes.reduce((s, q) => s + q.percentage, 0) / recentQuizzes.length
      const olderAvg = olderQuizzes.reduce((s, q) => s + q.percentage, 0) / olderQuizzes.length
      decliningScore = olderAvg > recentAvg ? Math.min(100, (olderAvg - recentAvg) * 2) : 0
    }

    // Weighted formula
    const lowEngagement = 100 - engagement
    const lowConsistency = 100 - consistency
    const lowPerformance = 100 - performance

    const dropRisk =
      (lowEngagement * 0.3) +
      (lowConsistency * 0.3) +
      (decliningScore * 0.2) +
      (inactivityScore * 0.2)

    return Math.min(100, Math.max(0, Math.round(dropRisk)))
  } catch {
    return 0
  }
}
