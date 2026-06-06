import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  computeEngagementScore,
  computeConsistencyScore,
  computeDropRisk,
  computeAveragePerformance,
  computeLearningSpeed,
} from '@/services/learning-engine'
import { getWeakTopics, getStrongTopics, getAllMasteries } from '@/services/learning-engine'
import { getOrCreateProfile } from '@/services/learning-engine'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role') || 'student'

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (role === 'student') {
      return await getStudentIntelligentAnalytics(userId)
    } else if (role === 'instructor') {
      return await getInstructorIntelligentAnalytics(userId)
    } else if (role === 'admin') {
      return await getAdminIntelligentAnalytics()
    }

    return NextResponse.json(
      { error: 'Invalid role. Must be: student, instructor, or admin' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[IntelligentAnalytics] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch intelligent analytics' },
      { status: 500 }
    )
  }
}

// ============================================================
// STUDENT INTELLIGENT ANALYTICS
// ============================================================
async function getStudentIntelligentAnalytics(userId: string) {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Parallel fetch all core data
  const [
    profile,
    quizAttempts,
    enrollments,
    dailyActivities,
    lessonProgressAll,
    learningMetrics,
    topicMasteries,
    user,
    aiActivities,
  ] = await Promise.all([
    getOrCreateProfile(userId),
    db.quizAttempt.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      take: 100,
    }),
    db.enrollment.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, title: true, category: true } },
        lessonProgress: true,
      },
    }),
    db.dailyActivity.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    }),
    db.lessonProgress.findMany({
      where: { enrollment: { userId }, status: 'completed' },
    }),
    db.learningMetric.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
    }),
    getAllMasteries(userId),
    db.user.findUnique({ where: { id: userId } }),
    db.studentAIActivity.findMany({
      where: { userId, createdAt: { gte: sevenDaysAgo } },
    }),
  ])

  // Also compute computed metrics in parallel
  const [engagementScore, consistencyScore, dropRiskScore, avgPerformance, learningSpeedScore] =
    await Promise.all([
      computeEngagementScore(userId),
      computeConsistencyScore(userId),
      computeDropRisk(userId),
      computeAveragePerformance(userId),
      computeLearningSpeed(userId),
    ])

  // ---- Metrics Engine ----
  const avgQuizScore = quizAttempts.length > 0
    ? Math.round(quizAttempts.reduce((s, q) => s + q.percentage, 0) / quizAttempts.length * 10) / 10
    : 0

  const completedEnrollments = enrollments.filter(e => e.status === 'completed').length
  const activeEnrollments = enrollments.filter(e => e.status === 'active').length
  const courseCompletionRate = enrollments.length > 0
    ? Math.round((completedEnrollments / enrollments.length) * 100 * 10) / 10
    : 0

  const totalStudyTimeSeconds = dailyActivities.reduce((s, d) => s + d.timeSpent, 0)
  const avgSessionDurationMinutes = dailyActivities.length > 0
    ? Math.round((totalStudyTimeSeconds / dailyActivities.length) / 60 * 10) / 10
    : 0

  const weeklyStudyHours = dailyActivities
    .filter(d => new Date(d.date) >= sevenDaysAgo)
    .reduce((s, d) => s + d.timeSpent, 0) / 3600
  const weeklyStudyHoursRounded = Math.round(weeklyStudyHours * 10) / 10

  // Assignment average
  const submissions = await db.submission.findMany({
    where: { studentId: userId, score: { not: null } },
    include: { assignment: { select: { maxScore: true } } },
  })
  const assignmentAverage = submissions.length > 0
    ? Math.round(
        submissions.reduce((s, sub) => {
          const pct = sub.assignment.maxScore > 0 ? (sub.score! / sub.assignment.maxScore) * 100 : 0
          return s + pct
        }, 0) / submissions.length * 10
      ) / 10
    : 0

  const completedLessonsCount = lessonProgressAll.length
  const totalLessonsInEnrolledCourses = enrollments.reduce(
    (s, e) => s + e.lessonProgress.length, 0
  )
  const lessonCompletionRate = totalLessonsInEnrolledCourses > 0
    ? Math.round((completedLessonsCount / totalLessonsInEnrolledCourses) * 100 * 10) / 10
    : 0

  // AI usage frequency (times per week)
  const aiUsageWeek = await db.learningMetric.count({
    where: { userId, eventType: 'ai_tutor_used', createdAt: { gte: sevenDaysAgo } },
  })

  const totalQuizzesTaken = quizAttempts.length
  const currentStreak = user?.streak || 0
  const xpEarned = user?.xp || 0

  const metrics = {
    averageQuizScore: avgQuizScore,
    courseCompletionRate,
    averageSessionDuration: avgSessionDurationMinutes,
    weeklyStudyHours: weeklyStudyHoursRounded,
    assignmentAverage,
    lessonCompletionRate,
    aiUsageFrequency: aiUsageWeek,
    totalStudyTime: totalStudyTimeSeconds,
    totalLessonsCompleted: completedLessonsCount,
    totalQuizzesTaken,
    currentStreak,
    xpEarned,
  }

  // ---- Topic Mastery Engine ----
  const strong = topicMasteries
    .filter(t => t.masteryScore >= 70)
    .map(t => ({ topicId: t.topicId, topicName: t.topicName, masteryScore: Math.round(t.masteryScore), trend: t.trend }))
  const weak = topicMasteries
    .filter(t => t.masteryScore < 40)
    .map(t => ({ topicId: t.topicId, topicName: t.topicName, masteryScore: Math.round(t.masteryScore), trend: t.trend }))
  const improving = topicMasteries
    .filter(t => t.trend === 'improving')
    .map(t => ({ topicId: t.topicId, topicName: t.topicName, masteryScore: Math.round(t.masteryScore), trend: t.trend }))
  const all = topicMasteries.map(t => ({
    topicId: t.topicId,
    topicName: t.topicName,
    masteryScore: Math.round(t.masteryScore),
    trend: t.trend,
    courseId: t.courseId || undefined,
  }))

  const topicMastery = { strong, weak, improving, all }

  // ---- Insight Engine (rule-based) ----
  const insights = generateStudentInsights({
    avgQuizScore,
    courseCompletionRate,
    weeklyStudyHours: weeklyStudyHoursRounded,
    lessonCompletionRate,
    dropRiskScore,
    engagementScore,
    consistencyScore,
    learningSpeedScore,
    currentStreak,
    assignmentAverage,
    aiUsageFrequency: aiUsageWeek,
    weakTopics: weak,
    strongTopics: strong,
    recentQuizAttempts: quizAttempts.slice(0, 10),
  })

  // ---- Recommendation Engine ----
  const recommendations = await generateStudentRecommendations(userId, {
    weakTopics: weak,
    strongTopics: strong,
    dropRiskScore,
    courseCompletionRate,
    avgQuizScore,
    enrollments,
  })

  // ---- Learning Profile Summary ----
  const learningProfile = {
    learningLevel: profile.learningLevel,
    engagementScore: Math.round(engagementScore),
    consistencyScore: Math.round(consistencyScore),
    learningSpeedScore: Math.round(learningSpeedScore),
    dropRiskScore: Math.round(dropRiskScore),
    learningSpeed: profile.learningSpeed,
  }

  // ---- Activity Heatmap (30 days) ----
  const activityHeatmap = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = d.toISOString().split('T')[0]
    const activity = dailyActivities.find(a => a.date === dateStr)
    activityHeatmap.push({
      date: dateStr,
      xp: activity?.xpEarned || 0,
      lessons: activity?.lessonsCompleted || 0,
      quizzes: activity?.quizzesTaken || 0,
      timeSpent: activity?.timeSpent || 0,
    })
  }

  // ---- Weekly Trend ----
  const weeklyTrend = []
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i * 7 + 7) * 24 * 60 * 60 * 1000)
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
    const weekLabel = `Week ${8 - i}`

    const weekActivities = dailyActivities.filter(a => {
      const d = new Date(a.date)
      return d >= weekStart && d < weekEnd
    })

    const weekQuizzes = quizAttempts.filter(q => {
      if (!q.completedAt) return false
      const d = new Date(q.completedAt)
      return d >= weekStart && d < weekEnd
    })

    weeklyTrend.push({
      week: weekLabel,
      score: weekQuizzes.length > 0
        ? Math.round(weekQuizzes.reduce((s, q) => s + q.percentage, 0) / weekQuizzes.length * 10) / 10
        : 0,
      lessonsCompleted: weekActivities.reduce((s, a) => s + a.lessonsCompleted, 0),
      studyHours: Math.round(weekActivities.reduce((s, a) => s + a.timeSpent, 0) / 3600 * 10) / 10,
    })
  }

  return NextResponse.json({
    metrics,
    topicMastery,
    insights,
    recommendations,
    learningProfile,
    activityHeatmap,
    weeklyTrend,
  })
}

// ============================================================
// INSTRUCTOR INTELLIGENT ANALYTICS
// ============================================================
async function getInstructorIntelligentAnalytics(userId: string) {
  // Get instructor's courses with full data
  const courses = await db.course.findMany({
    where: { instructorId: userId },
    include: {
      enrollments: {
        include: {
          user: { select: { id: true, name: true } },
          lessonProgress: { include: { lesson: true } },
        },
      },
      modules: {
        include: {
          lessons: {
            include: {
              progress: true,
              qaQuestions: { select: { id: true } },
            },
          },
        },
      },
      quizzes: {
        include: {
          attempts: { select: { percentage: true, passed: true, userId: true } },
        },
      },
      assignments: {
        include: {
          submissions: { select: { score: true, studentId: true } },
        },
      },
      reviews: { select: { rating: true } },
    },
  })

  const totalStudents = new Set(courses.flatMap(c => c.enrollments.map(e => e.userId))).size
  const completedEnrollments = courses.flatMap(c => c.enrollments).filter(e => e.status === 'completed').length
  const totalEnrollments = courses.flatMap(c => c.enrollments).length
  const courseCompletionRate = totalEnrollments > 0
    ? Math.round((completedEnrollments / totalEnrollments) * 100 * 10) / 10
    : 0

  // Average student score across all quizzes
  const allAttempts = courses.flatMap(c => c.quizzes.flatMap(q => q.attempts))
  const averageStudentScore = allAttempts.length > 0
    ? Math.round(allAttempts.reduce((s, a) => s + a.percentage, 0) / allAttempts.length * 10) / 10
    : 0

  // Average engagement (based on lesson completion rate)
  const averageEngagement = totalEnrollments > 0
    ? Math.round(
        courses.flatMap(c => c.enrollments).reduce((s, e) => s + e.progress, 0) / totalEnrollments * 10
      ) / 10
    : 0

  // Average assignment score
  const allSubmissions = courses.flatMap(c => c.assignments.flatMap(a => a.submissions))
  const averageAssignmentScore = allSubmissions.length > 0
    ? Math.round(
        allSubmissions.reduce((s, sub) => s + (sub.score || 0), 0) / allSubmissions.length * 10
      ) / 10
    : 0

  // Course rating
  const allRatings = courses.flatMap(c => c.reviews.map(r => r.rating))
  const courseRating = allRatings.length > 0
    ? Math.round(allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length * 10) / 10
    : 0

  const instructorMetrics = {
    totalStudents,
    courseCompletionRate,
    averageStudentScore,
    averageEngagement,
    averageAssignmentScore,
    courseRating,
  }

  // ---- Difficult Lessons Detection ----
  const difficultLessons = []
  for (const course of courses) {
    for (const courseModule of course.modules) {
      for (const lesson of courseModule.lessons) {
        const completedProgress = lesson.progress.filter(p => p.status === 'completed')
        const totalProgress = lesson.progress.length
        const completionRate = totalProgress > 0
          ? (completedProgress.length / totalProgress) * 100
          : 0

        // Average score for quizzes in this lesson
        const lessonQuizAttempts = lesson.qaQuestions.length > 0 ? [] : [] // no direct quiz-lesson link, use module quizzes

        // Repeat visit rate: students who visited lesson more than once
        const studentVisitCounts = new Map<string, number>()
        for (const p of lesson.progress) {
          const enrollment = course.enrollments.find(e =>
            e.lessonProgress.some(lp => lp.lessonId === lesson.id)
          )
          if (enrollment) {
            const cnt = studentVisitCounts.get(enrollment.userId) || 0
            studentVisitCounts.set(enrollment.userId, cnt + 1)
          }
        }
        const repeatVisitors = Array.from(studentVisitCounts.values()).filter(c => c > 1).length
        const totalVisitors = studentVisitCounts.size
        const repeatVisitRate = totalVisitors > 0 ? (repeatVisitors / totalVisitors) * 100 : 0

        // Dropoff rate: students who started but didn't complete
        const inProgress = lesson.progress.filter(p => p.status === 'in_progress').length
        const dropoffRate = totalProgress > 0
          ? ((inProgress + (totalProgress - completedProgress.length - inProgress)) / totalProgress) * 100
          : 0

        // Difficulty score: composite of low completion, high repeat visits, high dropoff
        const difficultyScore = Math.round(
          ((100 - completionRate) * 0.4) +
          (repeatVisitRate * 0.3) +
          (dropoffRate * 0.3)
        )

        if (totalProgress > 0 && difficultyScore > 30) {
          // Average score for students completing this lesson
          const avgScore = completedProgress.length > 0
            ? completedProgress.reduce((s, p) => s + (p.xpEarned > 0 ? Math.min(100, p.xpEarned) : 50), 0) / completedProgress.length
            : 0

          difficultLessons.push({
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            moduleTitle: courseModule.title,
            courseTitle: course.title,
            courseId: course.id,
            difficultyScore: Math.min(100, Math.round(difficultyScore)),
            avgScore: Math.round(avgScore * 10) / 10,
            completionRate: Math.round(completionRate * 10) / 10,
            repeatVisitRate: Math.round(repeatVisitRate * 10) / 10,
            dropoffRate: Math.round(dropoffRate * 10) / 10,
            studentCount: totalVisitors,
          })
        }
      }
    }
  }
  difficultLessons.sort((a, b) => b.difficultyScore - a.difficultyScore)

  // ---- Student Struggle Areas ----
  // Aggregate topic mastery for all students in instructor's courses
  const studentIds = Array.from(new Set(courses.flatMap(c => c.enrollments.map(e => e.userId))))
  const studentMasteries = await db.topicMastery.findMany({
    where: { userId: { in: studentIds } },
  })

  // Group by topic
  const topicGroups = new Map<string, { name: string; scores: number[]; trends: string[] }>()
  for (const m of studentMasteries) {
    const existing = topicGroups.get(m.topicId) || { name: m.topicName, scores: [], trends: [] }
    existing.scores.push(m.masteryScore)
    existing.trends.push(m.trend)
    topicGroups.set(m.topicId, existing)
  }

  const studentStruggles = Array.from(topicGroups.entries())
    .map(([topic, data]) => {
      const avgMastery = data.scores.reduce((s, v) => s + v, 0) / data.scores.length
      const struggling = data.scores.filter(s => s < 50).length
      const improvingCount = data.trends.filter(t => t === 'improving').length
      const decliningCount = data.trends.filter(t => t === 'declining').length
      const trend = decliningCount > improvingCount ? 'declining' : improvingCount > decliningCount ? 'improving' : 'stable'
      return {
        topic,
        avgMastery: Math.round(avgMastery * 10) / 10,
        strugglingStudents: struggling,
        totalStudents: data.scores.length,
        trend,
      }
    })
    .filter(s => s.avgMastery < 60)
    .sort((a, b) => a.avgMastery - b.avgMastery)
    .slice(0, 15)

  // ---- Module Score Drops ----
  const moduleDrops = []
  for (const course of courses) {
    for (const courseModule of course.modules) {
      // Get quiz attempts for this module's quizzes
      const moduleQuizzes = course.quizzes.filter(q => q.moduleId === courseModule.id)
      if (moduleQuizzes.length === 0) continue

      const allModuleAttempts = moduleQuizzes.flatMap(q => q.attempts)
      if (allModuleAttempts.length < 2) continue

      // Split into recent (last 2 weeks) and previous
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      const recentAttempts = allModuleAttempts.filter(() => true) // we don't have timestamp on attempts in this query
      const currentAvgScore = allModuleAttempts.length > 0
        ? allModuleAttempts.reduce((s, a) => s + a.percentage, 0) / allModuleAttempts.length
        : 0

      // For drop detection, compare first half vs second half of attempts
      const half = Math.floor(allModuleAttempts.length / 2)
      const firstHalf = allModuleAttempts.slice(0, half)
      const secondHalf = allModuleAttempts.slice(half)
      const previousAvgScore = firstHalf.length > 0
        ? firstHalf.reduce((s, a) => s + a.percentage, 0) / firstHalf.length
        : 0
      const recentAvgScore = secondHalf.length > 0
        ? secondHalf.reduce((s, a) => s + a.percentage, 0) / secondHalf.length
        : 0

      const dropPercent = previousAvgScore > 0
        ? Math.round(((previousAvgScore - recentAvgScore) / previousAvgScore) * 100 * 10) / 10
        : 0

      if (dropPercent > 5) { // Only show significant drops
        moduleDrops.push({
          moduleTitle: courseModule.title,
          courseTitle: course.title,
          courseId: course.id,
          currentAvgScore: Math.round(recentAvgScore * 10) / 10,
          previousAvgScore: Math.round(previousAvgScore * 10) / 10,
          dropPercent,
          studentCount: new Set(allModuleAttempts.map(a => a.userId)).size,
        })
      }
    }
  }
  moduleDrops.sort((a, b) => b.dropPercent - a.dropPercent)

  // ---- Instructor Insights (rule-based) ----
  const insights = generateInstructorInsights({
    totalStudents,
    courseCompletionRate,
    averageStudentScore,
    averageEngagement,
    courseRating,
    difficultLessonsCount: difficultLessons.length,
    strugglingTopicsCount: studentStruggles.length,
    moduleDropsCount: moduleDrops.length,
    totalCourses: courses.length,
  })

  // ---- AI Suggestions for Instructor Actions ----
  const suggestions = generateInstructorSuggestions({
    difficultLessons,
    studentStruggles,
    moduleDrops,
    courses,
  })

  return NextResponse.json({
    metrics: instructorMetrics,
    difficultLessons: difficultLessons.slice(0, 20),
    studentStruggles,
    moduleDrops: moduleDrops.slice(0, 15),
    insights,
    suggestions,
  })
}

// ============================================================
// ADMIN INTELLIGENT ANALYTICS
// ============================================================
async function getAdminIntelligentAnalytics() {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Platform-wide metrics in parallel
  const [
    totalUsers,
    activeUsersCount,
    dailyActiveUsersCount,
    totalCourses,
    totalRevenue,
    studentCount,
    instructorCount,
    allCourses,
    allEnrollments,
  ] = await Promise.all([
    db.user.count(),
    db.dailyActivity.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { userId: true },
      distinct: ['userId'],
    }),
    db.dailyActivity.findMany({
      where: { createdAt: { gte: oneDayAgo } },
      select: { userId: true },
      distinct: ['userId'],
    }),
    db.course.count({ where: { isPublished: true } }),
    db.transaction.aggregate({
      where: { type: 'enrollment', status: 'completed' },
      _sum: { amount: true },
    }),
    db.user.count({ where: { role: 'student' } }),
    db.user.count({ where: { role: 'instructor' } }),
    db.course.findMany({
      where: { isPublished: true },
      include: {
        instructor: { select: { id: true, name: true } },
        enrollments: { select: { id: true, status: true, progress: true } },
        reviews: { select: { rating: true } },
        _count: { select: { modules: true } },
      },
    }),
    db.enrollment.findMany({
      select: { status: true },
    }),
  ])

  const completionRates = allEnrollments.length > 0
    ? Math.round((allEnrollments.filter(e => e.status === 'completed').length / allEnrollments.length) * 100 * 10) / 10
    : 0

  const adminMetrics = {
    totalUsers,
    activeUsers: activeUsersCount.length,
    dailyActiveUsers: dailyActiveUsersCount.length,
    totalCourses,
    totalRevenue: totalRevenue._sum.amount || 0,
    completionRates,
    instructorCount,
    studentCount,
  }

  // ---- Course Health Analysis ----
  const courseHealth = allCourses.map(course => {
    const enrollments = course.enrollments
    const completions = enrollments.filter(e => e.status === 'completed').length
    const enrollmentCount = enrollments.length
    const completionRate = enrollmentCount > 0 ? (completions / enrollmentCount) * 100 : 0
    const rating = course.rating

    // Engagement: average progress of active students
    const activeEnrollments = enrollments.filter(e => e.status === 'active')
    const engagement = activeEnrollments.length > 0
      ? activeEnrollments.reduce((s, e) => s + e.progress, 0) / activeEnrollments.length
      : 0

    // Health score: composite
    const healthScore = Math.round(
      (completionRate * 0.3) +
      (Math.min(rating, 5) / 5 * 100 * 0.3) +
      (engagement * 0.2) +
      (Math.min(enrollmentCount, 50) / 50 * 100 * 0.2)
    )

    let status: 'healthy' | 'at_risk' | 'critical' = 'healthy'
    if (healthScore < 30) status = 'critical'
    else if (healthScore < 55) status = 'at_risk'

    return {
      courseId: course.id,
      courseTitle: course.title,
      instructorName: course.instructor.name,
      enrollments: enrollmentCount,
      completions,
      completionRate: Math.round(completionRate * 10) / 10,
      rating: Math.round(rating * 10) / 10,
      engagement: Math.round(engagement * 10) / 10,
      healthScore,
      status,
    }
  })
  courseHealth.sort((a, b) => a.healthScore - b.healthScore)

  // ---- Instructor Performance Ranking ----
  const instructors = await db.user.findMany({
    where: { role: 'instructor' },
    include: {
      coursesCreated: {
        where: { isPublished: true },
        include: {
          enrollments: { select: { id: true, status: true, progress: true, userId: true } },
          reviews: { select: { rating: true } },
        },
      },
    },
  })

  const instructorPerformance = instructors.map(inst => {
    const courseCount = inst.coursesCreated.length
    const totalStudents = new Set(inst.coursesCreated.flatMap(c => c.enrollments.map(e => e.userId))).size
    const allEnrollmentsForInst = inst.coursesCreated.flatMap(c => c.enrollments)
    const avgCompletionRate = allEnrollmentsForInst.length > 0
      ? allEnrollmentsForInst.filter(e => e.status === 'completed').length / allEnrollmentsForInst.length * 100
      : 0
    const allRatings = inst.coursesCreated.flatMap(c => c.reviews.map(r => r.rating))
    const avgRating = allRatings.length > 0
      ? allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length
      : 0
    const engagementScore = allEnrollmentsForInst.length > 0
      ? allEnrollmentsForInst.filter(e => e.status === 'active').reduce((s, e) => s + e.progress, 0) /
        Math.max(1, allEnrollmentsForInst.filter(e => e.status === 'active').length)
      : 0

    const performanceScore = Math.round(
      (avgCompletionRate * 0.3) +
      (Math.min(avgRating, 5) / 5 * 100 * 0.3) +
      (engagementScore * 0.2) +
      (Math.min(totalStudents, 100) / 100 * 100 * 0.2)
    )

    return {
      instructorId: inst.id,
      instructorName: inst.name,
      courseCount,
      totalStudents,
      avgCompletionRate: Math.round(avgCompletionRate * 10) / 10,
      avgRating: Math.round(avgRating * 10) / 10,
      engagementScore: Math.round(engagementScore * 10) / 10,
      performanceScore,
    }
  })
  instructorPerformance.sort((a, b) => b.performanceScore - a.performanceScore)

  // ---- Platform Risk Detection ----
  const riskAlerts = generateRiskAlerts({
    totalUsers,
    activeUsers: activeUsersCount.length,
    dailyActiveUsers: dailyActiveUsersCount.length,
    studentCount,
    instructorCount,
    completionRates,
    courseHealth,
    instructorPerformance,
    totalRevenue: totalRevenue._sum.amount || 0,
  })

  // ---- Admin Insights ----
  const insights = generateAdminInsights({
    totalUsers,
    activeUsers: activeUsersCount.length,
    dailyActiveUsers: dailyActiveUsersCount.length,
    totalCourses,
    totalRevenue: totalRevenue._sum.amount || 0,
    completionRates,
    instructorCount,
    studentCount,
    atRiskCourses: courseHealth.filter(c => c.status !== 'healthy').length,
    criticalCourses: courseHealth.filter(c => c.status === 'critical').length,
  })

  return NextResponse.json({
    metrics: adminMetrics,
    courseHealth: courseHealth.slice(0, 30),
    instructorPerformance: instructorPerformance.slice(0, 30),
    riskAlerts,
    insights,
  })
}

// ============================================================
// STUDENT INSIGHT GENERATOR (Rule-Based)
// ============================================================
interface StudentInsightData {
  avgQuizScore: number
  courseCompletionRate: number
  weeklyStudyHours: number
  lessonCompletionRate: number
  dropRiskScore: number
  engagementScore: number
  consistencyScore: number
  learningSpeedScore: number
  currentStreak: number
  assignmentAverage: number
  aiUsageFrequency: number
  weakTopics: Array<{ topicId: string; topicName: string; masteryScore: number; trend: string }>
  strongTopics: Array<{ topicId: string; topicName: string; masteryScore: number; trend: string }>
  recentQuizAttempts: Array<{ percentage: number; passed: boolean }>
}

function generateStudentInsights(data: StudentInsightData) {
  const insights: Array<{
    id: string
    type: 'strength' | 'weakness' | 'trend' | 'warning' | 'achievement' | 'suggestion'
    title: string
    description: string
    category: 'performance' | 'study_habits' | 'topic_mastery' | 'engagement' | 'consistency'
    severity: 'info' | 'warning' | 'critical' | 'positive'
    actionable: boolean
    actionSuggestion?: string
    relatedMetric?: string
    metricValue?: number
  }> = []

  let idCounter = 0

  // Rule: Low quiz score
  if (data.avgQuizScore > 0 && data.avgQuizScore < 50) {
    insights.push({
      id: `ins-student-${++idCounter}`,
      type: 'weakness',
      title: 'Low Quiz Performance',
      description: `Your average quiz score is ${data.avgQuizScore}%. This suggests gaps in understanding that should be addressed before moving to advanced topics.`,
      category: 'performance',
      severity: 'critical',
      actionable: true,
      actionSuggestion: 'Review incorrect quiz answers, revisit lesson materials, and use ShijlAI in quiz mode for targeted practice.',
      relatedMetric: 'averageQuizScore',
      metricValue: data.avgQuizScore,
    })
  } else if (data.avgQuizScore >= 80) {
    insights.push({
      id: `ins-student-${++idCounter}`,
      type: 'strength',
      title: 'Strong Quiz Performance',
      description: `Your average quiz score is ${data.avgQuizScore}%. You demonstrate solid understanding across tested topics.`,
      category: 'performance',
      severity: 'positive',
      actionable: false,
      relatedMetric: 'averageQuizScore',
      metricValue: data.avgQuizScore,
    })
  }

  // Rule: Quiz score declining
  if (data.recentQuizAttempts.length >= 4) {
    const firstHalf = data.recentQuizAttempts.slice(0, Math.floor(data.recentQuizAttempts.length / 2))
    const secondHalf = data.recentQuizAttempts.slice(Math.floor(data.recentQuizAttempts.length / 2))
    const firstAvg = firstHalf.reduce((s, q) => s + q.percentage, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((s, q) => s + q.percentage, 0) / secondHalf.length
    const drop = firstAvg - secondAvg
    if (drop > 20) {
      insights.push({
        id: `ins-student-${++idCounter}`,
        type: 'trend',
        title: 'Quiz Performance Declining',
        description: `Your recent quiz scores have dropped by ${Math.round(drop)}%. This trend suggests the material is getting harder or review is needed.`,
        category: 'performance',
        severity: 'warning',
        actionable: true,
        actionSuggestion: 'Go back and review earlier lessons. Focus on understanding concepts rather than memorizing. Ask ShijlAI for simplified explanations.',
        relatedMetric: 'averageQuizScore',
        metricValue: Math.round(drop),
      })
    }
  }

  // Rule: Low study hours
  if (data.weeklyStudyHours < 2 && data.avgQuizScore > 0) {
    insights.push({
      id: `ins-student-${++idCounter}`,
      type: 'suggestion',
      title: 'Increase Study Time',
      description: `You're studying only ${data.weeklyStudyHours} hours per week. Research shows 5-7 hours per week leads to significantly better outcomes.`,
      category: 'study_habits',
      severity: 'warning',
      actionable: true,
      actionSuggestion: 'Try to add 30 minutes of study each day. Break sessions into 15-minute focused blocks using the Pomodoro technique.',
      relatedMetric: 'weeklyStudyHours',
      metricValue: data.weeklyStudyHours,
    })
  }

  // Rule: Drop risk
  if (data.dropRiskScore > 60) {
    insights.push({
      id: `ins-student-${++idCounter}`,
      type: 'warning',
      title: 'High Risk of Dropping Out',
      description: `Your drop risk score is ${Math.round(data.dropRiskScore)}/100. Your engagement and consistency patterns suggest you may be at risk of disengaging.`,
      category: 'engagement',
      severity: 'critical',
      actionable: true,
      actionSuggestion: 'Set a daily study reminder, even 15 minutes helps. Focus on one course at a time. Consider creating a study plan with ShijlAI.',
      relatedMetric: 'dropRiskScore',
      metricValue: Math.round(data.dropRiskScore),
    })
  } else if (data.dropRiskScore > 30) {
    insights.push({
      id: `ins-student-${++idCounter}`,
      type: 'warning',
      title: 'Moderate Drop Risk',
      description: `Your drop risk score is ${Math.round(data.dropRiskScore)}/100. There are signs of reduced engagement that could worsen if not addressed.`,
      category: 'engagement',
      severity: 'warning',
      actionable: true,
      actionSuggestion: 'Try to maintain a consistent study schedule. Even short daily sessions are more effective than occasional long ones.',
      relatedMetric: 'dropRiskScore',
      metricValue: Math.round(data.dropRiskScore),
    })
  }

  // Rule: Weak topic
  if (data.weakTopics.length > 0) {
    const weakest = data.weakTopics[0]
    insights.push({
      id: `ins-student-${++idCounter}`,
      type: 'weakness',
      title: `${weakest.topicName} Is Your Weakest Topic`,
      description: `Your mastery of "${weakest.topicName}" is only ${weakest.masteryScore}%. ${weakest.trend === 'declining' ? 'This topic is declining — review it soon!' : weakest.trend === 'improving' ? 'You are improving, but still have work to do.' : 'Focus on building a stronger foundation here.'}`,
      category: 'topic_mastery',
      severity: weakest.masteryScore < 30 ? 'critical' : 'warning',
      actionable: true,
      actionSuggestion: `Start with the basics of ${weakest.topicName}. Use practice quizzes and review lessons. Ask ShijlAI for help with specific concepts.`,
      relatedMetric: 'topicMastery',
      metricValue: weakest.masteryScore,
    })
  }

  // Rule: Lesson completion rate low
  if (data.lessonCompletionRate < 50 && data.lessonCompletionRate > 0) {
    insights.push({
      id: `ins-student-${++idCounter}`,
      type: 'suggestion',
      title: 'Complete More Lessons',
      description: `You've completed ${Math.round(data.lessonCompletionRate)}% of available lessons. Completing lessons in order builds a stronger foundation.`,
      category: 'consistency',
      severity: 'info',
      actionable: true,
      actionSuggestion: 'Pick up where you left off. Try to complete at least one lesson per study session.',
      relatedMetric: 'lessonCompletionRate',
      metricValue: data.lessonCompletionRate,
    })
  }

  // Rule: Low consistency
  if (data.consistencyScore < 30) {
    insights.push({
      id: `ins-student-${++idCounter}`,
      type: 'weakness',
      title: 'Low Study Consistency',
      description: `Your consistency score is ${Math.round(data.consistencyScore)}/100. Irregular study patterns make it harder to retain information.`,
      category: 'consistency',
      severity: 'warning',
      actionable: true,
      actionSuggestion: 'Try to study at the same time every day. Even 20 minutes daily is better than 2 hours once a week.',
      relatedMetric: 'consistencyScore',
      metricValue: Math.round(data.consistencyScore),
    })
  }

  // Rule: Study streak achievements
  if (data.currentStreak >= 7) {
    insights.push({
      id: `ins-student-${++idCounter}`,
      type: 'achievement',
      title: `${data.currentStreak}-Day Study Streak!`,
      description: `You've maintained a ${data.currentStreak}-day study streak. Consistent practice leads to better retention and understanding.`,
      category: 'consistency',
      severity: 'positive',
      actionable: false,
      actionSuggestion: 'Keep going! You might qualify for streak rewards soon.',
      relatedMetric: 'currentStreak',
      metricValue: data.currentStreak,
    })
  } else if (data.currentStreak < 3 && data.avgQuizScore > 0) {
    insights.push({
      id: `ins-student-${++idCounter}`,
      type: 'suggestion',
      title: 'Build Your Study Streak',
      description: `Your current study streak is ${data.currentStreak} days. Building a streak helps maintain consistency and improves learning outcomes.`,
      category: 'consistency',
      severity: 'info',
      actionable: true,
      actionSuggestion: 'Aim to study at least 15 minutes every day. Even a single lesson or quiz counts towards your streak.',
      relatedMetric: 'currentStreak',
      metricValue: data.currentStreak,
    })
  }

  // Rule: Course completion rate low
  if (data.courseCompletionRate < 30 && data.courseCompletionRate > 0) {
    insights.push({
      id: `ins-student-${++idCounter}`,
      type: 'suggestion',
      title: 'Focus on Course Completion',
      description: `You've completed ${Math.round(data.courseCompletionRate)}% of your enrolled courses. Consider focusing on finishing one course before starting new ones.`,
      category: 'consistency',
      severity: 'info',
      actionable: true,
      actionSuggestion: 'Pick the course you\'re closest to completing and dedicate study time to it.',
      relatedMetric: 'courseCompletionRate',
      metricValue: data.courseCompletionRate,
    })
  }

  // Rule: Strong topic achievement
  if (data.strongTopics.length >= 3) {
    insights.push({
      id: `ins-student-${++idCounter}`,
      type: 'achievement',
      title: 'Strong Topic Mastery',
      description: `You've achieved strong mastery in ${data.strongTopics.length} topics. Your dedication to learning is paying off!`,
      category: 'topic_mastery',
      severity: 'positive',
      actionable: false,
      relatedMetric: 'topicMastery',
      metricValue: data.strongTopics.length,
    })
  }

  // Rule: Assignment performance
  if (data.assignmentAverage > 0 && data.assignmentAverage < 50) {
    insights.push({
      id: `ins-student-${++idCounter}`,
      type: 'weakness',
      title: 'Low Assignment Scores',
      description: `Your average assignment score is ${Math.round(data.assignmentAverage)}%. Assignments are key to applying what you've learned.`,
      category: 'performance',
      severity: 'warning',
      actionable: true,
      actionSuggestion: 'Review assignment feedback carefully. Ask ShijlAI for help understanding concepts before attempting assignments.',
      relatedMetric: 'assignmentAverage',
      metricValue: data.assignmentAverage,
    })
  }

  // Rule: Engagement trend
  if (data.engagementScore < 30 && data.avgQuizScore > 0) {
    insights.push({
      id: `ins-student-${++idCounter}`,
      type: 'warning',
      title: 'Low Engagement',
      description: `Your engagement score is ${Math.round(data.engagementScore)}/100. Active participation (quizzes, lessons, AI tutor) significantly improves learning.`,
      category: 'engagement',
      severity: 'warning',
      actionable: true,
      actionSuggestion: 'Try to interact with at least one lesson or quiz per day. Use ShijlAI to stay engaged with the material.',
      relatedMetric: 'engagementScore',
      metricValue: Math.round(data.engagementScore),
    })
  }

  return insights
}

// ============================================================
// STUDENT RECOMMENDATION GENERATOR
// ============================================================
async function generateStudentRecommendations(
  userId: string,
  data: {
    weakTopics: Array<{ topicId: string; topicName: string; masteryScore: number; trend: string }>
    strongTopics: Array<{ topicId: string; topicName: string; masteryScore: number; trend: string }>
    dropRiskScore: number
    courseCompletionRate: number
    avgQuizScore: number
    enrollments: Array<{ courseId: string; course: { id: string; title: string; category: string }; progress: number; status: string }>
  }
) {
  const recommendations: Array<{
    id: string
    type: 'lesson' | 'quiz' | 'course' | 'topic' | 'study_plan'
    title: string
    description: string
    reason: string
    priority: 'low' | 'medium' | 'high'
    relatedId?: string
    relatedType?: string
  }> = []

  let idCounter = 0

  // Weak topic recommendations
  for (const topic of data.weakTopics.slice(0, 3)) {
    if (topic.masteryScore < 30) {
      recommendations.push({
        id: `rec-student-${++idCounter}`,
        type: 'topic',
        title: `Review ${topic.topicName} Basics`,
        description: `Your mastery of ${topic.topicName} is very low (${topic.masteryScore}%). Start with the fundamentals.`,
        reason: `Very low mastery (${topic.masteryScore}%) — focus on basics first`,
        priority: 'high',
        relatedId: topic.topicId,
        relatedType: 'topic',
      })
      recommendations.push({
        id: `rec-student-${++idCounter}`,
        type: 'quiz',
        title: `Practice Quiz: ${topic.topicName}`,
        description: `Take a practice quiz to reinforce your understanding of ${topic.topicName} fundamentals.`,
        reason: 'Practice quizzes build foundational knowledge',
        priority: 'high',
        relatedId: topic.topicId,
        relatedType: 'topic',
      })
    } else {
      recommendations.push({
        id: `rec-student-${++idCounter}`,
        type: 'lesson',
        title: `Revise ${topic.topicName}`,
        description: `You have partial understanding of ${topic.topicName} (${topic.masteryScore}%). Review key concepts.`,
        reason: `Partial mastery (${topic.masteryScore}%) — targeted revision will help`,
        priority: 'medium',
        relatedId: topic.topicId,
        relatedType: 'topic',
      })
    }
  }

  // Incomplete course recommendations
  for (const enrollment of data.enrollments.filter(e => e.status === 'active' && e.progress < 80).slice(0, 2)) {
    recommendations.push({
      id: `rec-student-${++idCounter}`,
      type: 'course',
      title: `Continue: ${enrollment.course.title}`,
      description: `You're ${Math.round(enrollment.progress)}% through this course. Keep going!`,
      reason: `Course is ${Math.round(enrollment.progress)}% complete — finish strong`,
      priority: enrollment.progress > 50 ? 'high' : 'medium',
      relatedId: enrollment.course.id,
      relatedType: 'course',
    })
  }

  // Drop risk study plan
  if (data.dropRiskScore > 60) {
    recommendations.push({
      id: `rec-student-${++idCounter}`,
      type: 'study_plan',
      title: 'Create a Study Plan',
      description: 'Your activity has decreased. A structured study plan can help you stay on track.',
      reason: `High drop risk (${Math.round(data.dropRiskScore)}%) — a study plan provides structure`,
      priority: 'high',
    })
  } else if (data.dropRiskScore > 30) {
    recommendations.push({
      id: `rec-student-${++idCounter}`,
      type: 'study_plan',
      title: 'Review Your Study Schedule',
      description: 'Your engagement has been declining. Consider adjusting your study schedule.',
      reason: 'Declining engagement — small adjustments make a big difference',
      priority: 'medium',
    })
  }

  // Strong topic: advance
  for (const topic of data.strongTopics.slice(0, 2)) {
    recommendations.push({
      id: `rec-student-${++idCounter}`,
      type: 'course',
      title: `Advanced ${topic.topicName}`,
      description: `You've mastered ${topic.topicName} (${topic.masteryScore}%). Ready for more advanced content?`,
      reason: `Strong mastery (${topic.masteryScore}%) — ready for next level`,
      priority: 'low',
      relatedId: topic.topicId,
      relatedType: 'topic',
    })
  }

  // Low quiz score: practice recommendation
  if (data.avgQuizScore > 0 && data.avgQuizScore < 60) {
    recommendations.push({
      id: `rec-student-${++idCounter}`,
      type: 'quiz',
      title: 'Take More Practice Quizzes',
      description: 'Your quiz scores suggest you need more practice. Try shorter, more frequent quizzes.',
      reason: `Average quiz score is ${data.avgQuizScore}% — more practice needed`,
      priority: 'high',
    })
  }

  return recommendations
}

// ============================================================
// INSTRUCTOR INSIGHT GENERATOR (Rule-Based)
// ============================================================
interface InstructorInsightData {
  totalStudents: number
  courseCompletionRate: number
  averageStudentScore: number
  averageEngagement: number
  courseRating: number
  difficultLessonsCount: number
  strugglingTopicsCount: number
  moduleDropsCount: number
  totalCourses: number
}

function generateInstructorInsights(data: InstructorInsightData) {
  const insights: Array<{
    id: string
    type: 'opportunity' | 'warning' | 'achievement' | 'suggestion'
    title: string
    description: string
    category: 'course_health' | 'student_engagement' | 'content_quality' | 'revenue'
    severity: 'info' | 'warning' | 'critical' | 'positive'
    actionable: boolean
    actionSuggestion?: string
  }> = []

  let idCounter = 0

  // Low completion rate
  if (data.courseCompletionRate < 40 && data.totalStudents > 0) {
    insights.push({
      id: `ins-instructor-${++idCounter}`,
      type: 'warning',
      title: 'Low Course Completion Rate',
      description: `Only ${Math.round(data.courseCompletionRate)}% of students are completing your courses. This may indicate content difficulty or engagement issues.`,
      category: 'course_health',
      severity: 'warning',
      actionable: true,
      actionSuggestion: 'Review your course structure. Consider breaking long modules into smaller sections and adding more interactive elements.',
    })
  } else if (data.courseCompletionRate >= 70) {
    insights.push({
      id: `ins-instructor-${++idCounter}`,
      type: 'achievement',
      title: 'Strong Completion Rate',
      description: `${Math.round(data.courseCompletionRate)}% of students are completing your courses. Great job keeping students engaged!`,
      category: 'course_health',
      severity: 'positive',
      actionable: false,
    })
  }

  // Low student scores
  if (data.averageStudentScore < 50 && data.totalStudents > 0) {
    insights.push({
      id: `ins-instructor-${++idCounter}`,
      type: 'warning',
      title: 'Students Struggling with Assessments',
      description: `Your students average ${Math.round(data.averageStudentScore)}% on quizzes. Consider reviewing quiz difficulty or adding more practice material.`,
      category: 'content_quality',
      severity: 'warning',
      actionable: true,
      actionSuggestion: 'Review quiz questions for clarity. Add practice quizzes before assessments. Consider providing study guides.',
    })
  }

  // Difficult lessons
  if (data.difficultLessonsCount > 0) {
    insights.push({
      id: `ins-instructor-${++idCounter}`,
      type: 'opportunity',
      title: `${data.difficultLessonsCount} Difficult Lessons Detected`,
      description: `${data.difficultLessonsCount} lessons have high difficulty scores based on completion rates and repeat visits. These are opportunities to improve content.`,
      category: 'content_quality',
      severity: 'info',
      actionable: true,
      actionSuggestion: 'Review these lessons for clarity. Add more examples, visual aids, or break complex topics into smaller parts.',
    })
  }

  // Module drops
  if (data.moduleDropsCount > 0) {
    insights.push({
      id: `ins-instructor-${++idCounter}`,
      type: 'warning',
      title: 'Score Drops in Some Modules',
      description: `${data.moduleDropsCount} modules show declining student scores. This may indicate content gaps between modules.`,
      category: 'content_quality',
      severity: 'warning',
      actionable: true,
      actionSuggestion: 'Review the transition between modules. Add bridging content or review material to help students prepare for more advanced sections.',
    })
  }

  // Low engagement
  if (data.averageEngagement < 30 && data.totalStudents > 0) {
    insights.push({
      id: `ins-instructor-${++idCounter}`,
      type: 'suggestion',
      title: 'Low Student Engagement',
      description: `Average student engagement is ${Math.round(data.averageEngagement)}%. Consider adding more interactive elements and discussions.`,
      category: 'student_engagement',
      severity: 'info',
      actionable: true,
      actionSuggestion: 'Add quizzes between lessons, discussion prompts, or live Q&A sessions. Interactive content significantly boosts engagement.',
    })
  }

  // Struggling topics
  if (data.strugglingTopicsCount > 3) {
    insights.push({
      id: `ins-instructor-${++idCounter}`,
      type: 'warning',
      title: 'Multiple Topics with Low Mastery',
      description: `${data.strugglingTopicsCount} topics have average student mastery below 60%. Consider additional review material for these areas.`,
      category: 'content_quality',
      severity: 'warning',
      actionable: true,
      actionSuggestion: 'Create supplementary video lessons, add practice problems, or host review sessions for these topics.',
    })
  }

  // Rating
  if (data.courseRating >= 4.5) {
    insights.push({
      id: `ins-instructor-${++idCounter}`,
      type: 'achievement',
      title: 'Excellent Course Ratings',
      description: `Your courses average ${data.courseRating}/5 rating. Students love your content!`,
      category: 'course_health',
      severity: 'positive',
      actionable: false,
    })
  } else if (data.courseRating > 0 && data.courseRating < 3.5) {
    insights.push({
      id: `ins-instructor-${++idCounter}`,
      type: 'warning',
      title: 'Low Course Ratings',
      description: `Your courses average ${data.courseRating}/5 rating. Consider reviewing student feedback for improvement areas.`,
      category: 'course_health',
      severity: 'warning',
      actionable: true,
      actionSuggestion: 'Read student reviews carefully. Address common complaints and update outdated content.',
    })
  }

  return insights
}

// ============================================================
// INSTRUCTOR SUGGESTION GENERATOR
// ============================================================
function generateInstructorSuggestions(data: {
  difficultLessons: Array<{ lessonId: string; lessonTitle: string; difficultyScore: number; courseId: string }>
  studentStruggles: Array<{ topic: string; avgMastery: number; strugglingStudents: number }>
  moduleDrops: Array<{ moduleTitle: string; courseId: string; dropPercent: number }>
  courses: Array<{ id: string; title: string }>
}) {
  const suggestions: Array<{
    id: string
    type: 'add_revision' | 'create_quiz' | 'update_module' | 'review_content' | 'engage_students'
    title: string
    description: string
    targetId?: string
    targetType?: string
    priority: 'low' | 'medium' | 'high'
  }> = []

  let idCounter = 0

  // Suggest revision material for difficult lessons
  for (const lesson of data.difficultLessons.slice(0, 3)) {
    suggestions.push({
      id: `sug-instructor-${++idCounter}`,
      type: 'add_revision',
      title: `Add Revision Material: ${lesson.lessonTitle}`,
      description: `This lesson has a difficulty score of ${lesson.difficultyScore}/100. Adding supplementary explanations or examples could help students.`,
      targetId: lesson.lessonId,
      targetType: 'lesson',
      priority: lesson.difficultyScore > 70 ? 'high' : 'medium',
    })
  }

  // Suggest quizzes for struggling topics
  for (const struggle of data.studentStruggles.slice(0, 3)) {
    suggestions.push({
      id: `sug-instructor-${++idCounter}`,
      type: 'create_quiz',
      title: `Create Practice Quiz: ${struggle.topic}`,
      description: `${struggle.strugglingStudents} students are struggling with this topic (avg mastery: ${Math.round(struggle.avgMastery)}%). A practice quiz could help reinforce learning.`,
      priority: struggle.avgMastery < 30 ? 'high' : 'medium',
    })
  }

  // Suggest module updates for score drops
  for (const drop of data.moduleDrops.slice(0, 3)) {
    suggestions.push({
      id: `sug-instructor-${++idCounter}`,
      type: 'update_module',
      title: `Review Module: ${drop.moduleTitle}`,
      description: `Student scores dropped by ${Math.round(drop.dropPercent)}% in this module. Consider adding bridging content or reviewing the flow.`,
      targetId: drop.courseId,
      targetType: 'course',
      priority: drop.dropPercent > 20 ? 'high' : 'medium',
    })
  }

  // Suggest content review if many issues
  if (data.difficultLessons.length > 3) {
    suggestions.push({
      id: `sug-instructor-${++idCounter}`,
      type: 'review_content',
      title: 'Comprehensive Content Review Recommended',
      description: 'Multiple lessons show difficulty issues. A thorough content review could improve overall student outcomes.',
      priority: 'high',
    })
  }

  // Suggest engagement boost
  if (data.studentStruggles.length > 2) {
    suggestions.push({
      id: `sug-instructor-${++idCounter}`,
      type: 'engage_students',
      title: 'Host a Q&A Session',
      description: 'With multiple topics showing low mastery, a live Q&A session could address common questions and boost student confidence.',
      priority: 'medium',
    })
  }

  return suggestions
}

// ============================================================
// ADMIN RISK ALERT GENERATOR
// ============================================================
function generateRiskAlerts(data: {
  totalUsers: number
  activeUsers: number
  dailyActiveUsers: number
  studentCount: number
  instructorCount: number
  completionRates: number
  courseHealth: Array<{ courseId: string; courseTitle: string; instructorName: string; healthScore: number; status: string; enrollments: number }>
  instructorPerformance: Array<{ instructorId: string; instructorName: string; performanceScore: number; avgCompletionRate: number }>
  totalRevenue: number
}) {
  const alerts: Array<{
    id: string
    type: 'high_dropout' | 'inactive_students' | 'inactive_instructor' | 'low_engagement' | 'declining_revenue'
    title: string
    description: string
    severity: 'warning' | 'critical'
    targetId?: string
    targetName?: string
    metric: string
    value: number
    threshold: number
  }> = []

  let idCounter = 0

  // High dropout rate
  const completionRate = data.completionRates
  if (completionRate < 30 && data.totalUsers > 10) {
    alerts.push({
      id: `risk-admin-${++idCounter}`,
      type: 'high_dropout',
      title: 'High Dropout Rate',
      description: `Only ${Math.round(completionRate)}% of students complete their courses. The platform-wide dropout rate is concerning.`,
      severity: completionRate < 15 ? 'critical' : 'warning',
      metric: 'completionRate',
      value: completionRate,
      threshold: 30,
    })
  }

  // Inactive students
  const activeRatio = data.totalUsers > 0 ? (data.activeUsers / data.totalUsers) * 100 : 0
  if (activeRatio < 30 && data.totalUsers > 10) {
    alerts.push({
      id: `risk-admin-${++idCounter}`,
      type: 'inactive_students',
      title: 'Low Active Student Ratio',
      description: `Only ${Math.round(activeRatio)}% of users were active in the last 7 days. Student engagement needs attention.`,
      severity: activeRatio < 15 ? 'critical' : 'warning',
      metric: 'activeUserRatio',
      value: Math.round(activeRatio),
      threshold: 30,
    })
  }

  // Critical courses
  const criticalCourses = data.courseHealth.filter(c => c.status === 'critical')
  for (const course of criticalCourses.slice(0, 5)) {
    alerts.push({
      id: `risk-admin-${++idCounter}`,
      type: 'low_engagement',
      title: `Critical Course: ${course.courseTitle}`,
      description: `Course health score is ${course.healthScore}/100. Instructor: ${course.instructorName}. Only ${course.enrollments} enrollments.`,
      severity: 'critical',
      targetId: course.courseId,
      targetName: course.courseTitle,
      metric: 'healthScore',
      value: course.healthScore,
      threshold: 55,
    })
  }

  // Inactive instructors
  const lowPerformingInstructors = data.instructorPerformance.filter(i => i.performanceScore < 30 && i.avgCompletionRate < 20)
  for (const inst of lowPerformingInstructors.slice(0, 3)) {
    alerts.push({
      id: `risk-admin-${++idCounter}`,
      type: 'inactive_instructor',
      title: `Low Performing Instructor: ${inst.instructorName}`,
      description: `Performance score: ${inst.performanceScore}/100. Course completion rate: ${Math.round(inst.avgCompletionRate)}%. May need support or review.`,
      severity: inst.performanceScore < 15 ? 'critical' : 'warning',
      targetId: inst.instructorId,
      targetName: inst.instructorName,
      metric: 'performanceScore',
      value: inst.performanceScore,
      threshold: 30,
    })
  }

  return alerts
}

// ============================================================
// ADMIN INSIGHT GENERATOR (Rule-Based)
// ============================================================
function generateAdminInsights(data: {
  totalUsers: number
  activeUsers: number
  dailyActiveUsers: number
  totalCourses: number
  totalRevenue: number
  completionRates: number
  instructorCount: number
  studentCount: number
  atRiskCourses: number
  criticalCourses: number
}) {
  const insights: Array<{
    id: string
    type: 'growth' | 'risk' | 'opportunity' | 'achievement'
    title: string
    description: string
    category: 'platform_health' | 'revenue' | 'engagement' | 'growth' | 'content'
    severity: 'info' | 'warning' | 'critical' | 'positive'
    actionable: boolean
    actionSuggestion?: string
  }> = []

  let idCounter = 0

  // Platform growth
  if (data.totalUsers > 100) {
    insights.push({
      id: `ins-admin-${++idCounter}`,
      type: 'achievement',
      title: 'Growing Platform',
      description: `The platform has ${data.totalUsers} users (${data.studentCount} students, ${data.instructorCount} instructors). Solid growth foundation.`,
      category: 'growth',
      severity: 'positive',
      actionable: false,
    })
  }

  // DAU/MAU ratio
  const dauMauRatio = data.activeUsers > 0 ? (data.dailyActiveUsers / data.activeUsers) * 100 : 0
  if (dauMauRatio < 15 && data.activeUsers > 10) {
    insights.push({
      id: `ins-admin-${++idCounter}`,
      type: 'risk',
      title: 'Low DAU/MAU Ratio',
      description: `Only ${Math.round(dauMauRatio)}% of weekly active users are daily active. User stickiness needs improvement.`,
      category: 'engagement',
      severity: 'warning',
      actionable: true,
      actionSuggestion: 'Implement daily challenges, streaks, or notifications to encourage daily platform visits.',
    })
  } else if (dauMauRatio >= 40) {
    insights.push({
      id: `ins-admin-${++idCounter}`,
      type: 'achievement',
      title: 'Strong User Stickiness',
      description: `${Math.round(dauMauRatio)}% of weekly active users engage daily. The platform has good user retention.`,
      category: 'engagement',
      severity: 'positive',
      actionable: false,
    })
  }

  // At-risk courses
  if (data.criticalCourses > 0) {
    insights.push({
      id: `ins-admin-${++idCounter}`,
      type: 'risk',
      title: `${data.criticalCourses} Critical Courses`,
      description: `${data.criticalCourses} courses are in critical health. These need immediate attention to prevent student loss.`,
      category: 'content',
      severity: 'critical',
      actionable: true,
      actionSuggestion: 'Review these courses with their instructors. Consider content updates or additional instructor support.',
    })
  }

  if (data.atRiskCourses > 3) {
    insights.push({
      id: `ins-admin-${++idCounter}`,
      type: 'risk',
      title: 'Multiple At-Risk Courses',
      description: `${data.atRiskCourses} courses are at risk or critical. This represents a significant portion of course offerings.`,
      category: 'platform_health',
      severity: 'warning',
      actionable: true,
      actionSuggestion: 'Develop a course improvement program. Provide instructors with analytics and best practices.',
    })
  }

  // Completion rate
  if (data.completionRates < 40 && data.totalUsers > 10) {
    insights.push({
      id: `ins-admin-${++idCounter}`,
      type: 'opportunity',
      title: 'Improve Course Completion',
      description: `Platform-wide completion rate is ${Math.round(data.completionRates)}%. There's significant room for improvement.`,
      category: 'platform_health',
      severity: 'info',
      actionable: true,
      actionSuggestion: 'Implement nudges for inactive students. Gamify course completion with badges and certificates.',
    })
  }

  // Revenue
  if (data.totalRevenue > 0) {
    insights.push({
      id: `ins-admin-${++idCounter}`,
      type: 'growth',
      title: 'Revenue Generated',
      description: `The platform has generated ${data.totalRevenue} in enrollment revenue. ${data.instructorCount} instructors are contributing.`,
      category: 'revenue',
      severity: 'positive',
      actionable: false,
    })
  }

  // Student-to-instructor ratio
  if (data.instructorCount > 0) {
    const ratio = data.studentCount / data.instructorCount
    if (ratio > 50) {
      insights.push({
        id: `ins-admin-${++idCounter}`,
        type: 'opportunity',
        title: 'Recruit More Instructors',
        description: `The student-to-instructor ratio is ${Math.round(ratio)}:1. More instructors could improve course variety and student support.`,
        category: 'growth',
        severity: 'info',
        actionable: true,
        actionSuggestion: 'Launch an instructor recruitment campaign. Highlight success stories from current instructors.',
      })
    }
  }

  return insights
}
