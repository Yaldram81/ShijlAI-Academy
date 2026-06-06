import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── Types ────────────────────────────────────────────────────────

interface PlatformHealth {
  totalStudents: number
  totalCourses: number
  totalEnrollments: number
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
  avgSessionDuration: number
  completionRate: number
  retentionRate: number
  trends: {
    dauTrend: number
    wauTrend: number
    enrollmentTrend: number
    completionTrend: number
  }
}

interface CourseEngagement {
  courseId: string
  courseTitle: string
  enrollmentCount: number
  engagementScore: number
  loginScore: number
  activityScore: number
  quizScore: number
  aiScore: number
  communityScore: number
}

interface EngagementData {
  courseEngagement: CourseEngagement[]
  platformAverageEngagement: number
}

interface CourseIntelligenceItem {
  courseId: string
  courseTitle: string
  instructorName: string
  healthScore: number
  status: 'healthy' | 'at_risk' | 'critical'
  enrollmentGrowth: number
  completionRate: number
  avgRating: number
  engagementRate: number
  assessmentScore: number
  enrollmentCount: number
}

interface InstructorIntelligenceItem {
  instructorId: string
  instructorName: string
  courseCount: number
  totalStudents: number
  effectivenessScore: number
  completionRate: number
  avgRating: number
  studentSuccessRate: number
  engagementScore: number
  warnings: string[]
}

interface AlertItem {
  id: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  relatedEntity: string
  relatedEntityType: 'course' | 'instructor' | 'student' | 'platform'
  timestamp: string
  isRead: boolean
}

interface InsightItem {
  id: string
  engine: string
  type: 'positive' | 'negative' | 'neutral' | 'warning'
  title: string
  description: string
  actionable: boolean
  actionSuggestion?: string
}

// ─── Helpers ──────────────────────────────────────────────────────

function safeDiv(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return numerator / denominator
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  const change = Math.round(((current - previous) / previous) * 1000) / 10
  // Cap extreme values to avoid misleading displays (e.g., -100% when no prior data period exists)
  return Math.max(-99, Math.min(999, change))
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

// ─── GET Handler ──────────────────────────────────────────────────

export async function GET() {
  try {
    const now = new Date()
    const todayStr = dateStr(now)
    const yesterdayStr = dateStr(daysAgo(1))
    const sevenDaysAgo = daysAgo(7)
    const sevenDaysAgoStr = dateStr(daysAgo(7))
    const fourteenDaysAgoStr = dateStr(daysAgo(14))
    const thirtyDaysAgo = daysAgo(30)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // ═══════════════════════════════════════════════════════════
    // ─── Phase 1: Parallel raw data queries ───────────────────
    // ═══════════════════════════════════════════════════════════

    const [
      totalStudentsRaw,
      totalCourses,
      totalEnrollments,
      todayActivity,
      yesterdayActivity,
      weekActivity,
      prevWeekActivity,
      monthActivity,
      lessonProgressAgg,
      completedEnrollments,
      prevCompletedEnrollments,
      enrollmentsThisMonth,
      enrollmentsLastMonth,
      publishedCourses,
      allEnrollments,
      allReviews,
      allQuizAttempts,
      allInstructors,
      allDailyActivity,
      studentAIActivities,
      discussionPosts,
      discussionReplies,
      qaQuestions,
      qaAnswers,
      learningEvents,
    ] = await Promise.all([
      // Total students (users with role=student)
      db.user.count({ where: { role: 'student' } }),

      // Total courses
      db.course.count(),

      // Total enrollments
      db.enrollment.count(),

      // Today's active users
      db.dailyActivity.findMany({
        where: { date: todayStr },
        select: { userId: true },
        distinct: ['userId'],
      }),

      // Yesterday's active users
      db.dailyActivity.findMany({
        where: { date: yesterdayStr },
        select: { userId: true },
        distinct: ['userId'],
      }),

      // This week's active users
      db.dailyActivity.findMany({
        where: { date: { gte: sevenDaysAgoStr } },
        select: { userId: true },
        distinct: ['userId'],
      }),

      // Previous week's active users
      db.dailyActivity.findMany({
        where: { date: { gte: fourteenDaysAgoStr, lt: sevenDaysAgoStr } },
        select: { userId: true },
        distinct: ['userId'],
      }),

      // Monthly active users
      db.dailyActivity.findMany({
        where: { date: { gte: dateStr(thirtyDaysAgo) } },
        select: { userId: true },
        distinct: ['userId'],
      }),

      // Average session duration (avg timeSpent from completed lesson progress)
      db.lessonProgress.aggregate({
        _avg: { timeSpent: true },
        where: { status: 'completed' },
      }),

      // Completed enrollments (current period)
      db.enrollment.count({ where: { completedAt: { not: null } } }),

      // Completed enrollments in previous month (for trend)
      db.enrollment.count({
        where: {
          completedAt: { gte: lastMonthStart, lt: monthStart },
        },
      }),

      // Enrollments this month
      db.enrollment.count({ where: { enrolledAt: { gte: monthStart } } }),

      // Enrollments last month
      db.enrollment.count({
        where: { enrolledAt: { gte: lastMonthStart, lt: monthStart } },
      }),

      // Published courses with instructor info
      db.course.findMany({
        where: { isPublished: true },
        include: {
          instructor: { select: { id: true, name: true, role: true } },
          enrollments: {
            select: {
              id: true,
              userId: true,
              progress: true,
              status: true,
              enrolledAt: true,
              completedAt: true,
              lastAccessed: true,
            },
          },
          reviews: { select: { rating: true, createdAt: true } },
          quizzes: {
            select: {
              id: true,
              attempts: {
                select: { percentage: true, passed: true, completedAt: true, userId: true },
              },
            },
          },
          discussionPosts: { select: { id: true, userId: true, createdAt: true } },
          modules: {
            select: {
              id: true,
              lessons: { select: { id: true } },
            },
          },
        },
      }),

      // All enrollments for engagement
      db.enrollment.findMany({
        select: {
          id: true,
          userId: true,
          courseId: true,
          progress: true,
          status: true,
          enrolledAt: true,
          completedAt: true,
          lastAccessed: true,
          lessonProgress: {
            select: {
              status: true,
              timeSpent: true,
              completedAt: true,
              lessonId: true,
            },
          },
        },
      }),

      // All reviews
      db.review.findMany({
        select: {
          id: true,
          courseId: true,
          userId: true,
          rating: true,
          createdAt: true,
        },
      }),

      // All quiz attempts
      db.quizAttempt.findMany({
        where: { completedAt: { not: null } },
        select: {
          id: true,
          userId: true,
          quizId: true,
          percentage: true,
          passed: true,
          completedAt: true,
          quiz: { select: { courseId: true } },
        },
      }),

      // All instructors with their courses
      db.user.findMany({
        where: { role: 'instructor' },
        select: {
          id: true,
          name: true,
          lastActiveAt: true,
          coursesCreated: {
            where: { isPublished: true },
            select: {
              id: true,
              title: true,
              enrollmentCount: true,
              rating: true,
              enrollments: {
                select: {
                  id: true,
                  userId: true,
                  progress: true,
                  status: true,
                  completedAt: true,
                  enrolledAt: true,
                },
              },
              reviews: { select: { rating: true } },
              quizzes: {
                select: {
                  attempts: {
                    where: { completedAt: { not: null } },
                    select: { percentage: true, userId: true },
                  },
                },
              },
            },
          },
          qaAnswers: {
            select: { createdAt: true, question: { select: { createdAt: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      }),

      // Daily activity (last 60 days for trend analysis)
      db.dailyActivity.findMany({
        where: { date: { gte: dateStr(daysAgo(60)) } },
        select: {
          userId: true,
          date: true,
          xpEarned: true,
          lessonsCompleted: true,
          quizzesTaken: true,
          timeSpent: true,
        },
      }),

      // Student AI activities (last 30 days)
      db.studentAIActivity.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: {
          userId: true,
          activityType: true,
          createdAt: true,
        },
      }),

      // Discussion posts (last 30 days)
      db.discussionPost.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { id: true, courseId: true, userId: true, createdAt: true },
      }),

      // Discussion replies (last 30 days)
      db.discussionReply.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { id: true, postId: true, userId: true, createdAt: true },
      }),

      // Q&A Questions (last 30 days)
      db.qAQuestion.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { id: true, courseId: true, userId: true, createdAt: true },
      }),

      // Q&A Answers (last 30 days)
      db.qAAnswer.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { id: true, questionId: true, userId: true, isInstructorAnswer: true, createdAt: true },
      }),

      // Learning events (last 30 days)
      db.learningEvent.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: {
          id: true,
          userId: true,
          courseId: true,
          eventType: true,
          createdAt: true,
        },
      }),
    ])

    // ═══════════════════════════════════════════════════════════
    // ─── Build lookup maps ────────────────────────────────────
    // ═══════════════════════════════════════════════════════════

    // Enrollments by course
    const enrollmentsByCourse = new Map<string, typeof allEnrollments>()
    for (const e of allEnrollments) {
      const list = enrollmentsByCourse.get(e.courseId) || []
      list.push(e)
      enrollmentsByCourse.set(e.courseId, list)
    }

    // Reviews by course
    const reviewsByCourse = new Map<string, typeof allReviews>()
    for (const r of allReviews) {
      const list = reviewsByCourse.get(r.courseId) || []
      list.push(r)
      reviewsByCourse.set(r.courseId, list)
    }

    // Quiz attempts by course (via quiz.courseId)
    const quizAttemptsByCourse = new Map<string, typeof allQuizAttempts>()
    for (const qa of allQuizAttempts) {
      const cid = qa.quiz?.courseId
      if (!cid) continue
      const list = quizAttemptsByCourse.get(cid) || []
      list.push(qa)
      quizAttemptsByCourse.set(cid, list)
    }

    // AI activities by user
    const aiActivitiesByUser = new Map<string, number>()
    for (const a of studentAIActivities) {
      aiActivitiesByUser.set(a.userId, (aiActivitiesByUser.get(a.userId) || 0) + 1)
    }

    // AI activities by course (via learning events with type AI_CHAT_USED)
    const aiActivitiesByCourse = new Map<string, number>()
    for (const ev of learningEvents) {
      if (ev.eventType === 'AI_CHAT_USED' && ev.courseId) {
        aiActivitiesByCourse.set(ev.courseId, (aiActivitiesByCourse.get(ev.courseId) || 0) + 1)
      }
    }

    // Discussion posts by course
    const discussionByCourse = new Map<string, number>()
    for (const p of discussionPosts) {
      discussionByCourse.set(p.courseId, (discussionByCourse.get(p.courseId) || 0) + 1)
    }
    for (const r of discussionReplies) {
      // Find the course via the post — we don't have postId→courseId map easily, skip for now
      // We'll use discussionPosts for course-level aggregation
    }

    // Q&A by course
    const qaByCourse = new Map<string, number>()
    for (const q of qaQuestions) {
      qaByCourse.set(q.courseId, (qaByCourse.get(q.courseId) || 0) + 1)
    }
    for (const a of qaAnswers) {
      // Answers don't directly have courseId; we'd need to join. Use questions as proxy.
    }

    // Learning events by course and type
    const learningEventsByCourse = new Map<string, Map<string, number>>()
    for (const ev of learningEvents) {
      if (!ev.courseId) continue
      const courseMap = learningEventsByCourse.get(ev.courseId) || new Map<string, number>()
      courseMap.set(ev.eventType, (courseMap.get(ev.eventType) || 0) + 1)
      learningEventsByCourse.set(ev.courseId, courseMap)
    }

    // Unique users per course (from enrollments)
    const usersPerCourse = new Map<string, Set<string>>()
    for (const e of allEnrollments) {
      const set = usersPerCourse.get(e.courseId) || new Set<string>()
      set.add(e.userId)
      usersPerCourse.set(e.courseId, set)
    }

    // Daily activity by date → unique users
    const dailyActivityByDate = new Map<string, Set<string>>()
    for (const da of allDailyActivity) {
      const set = dailyActivityByDate.get(da.date) || new Set<string>()
      set.add(da.userId)
      dailyActivityByDate.set(da.date, set)
    }

    // ═══════════════════════════════════════════════════════════
    // ─── Engine 1: Platform Health Engine ─────────────────────
    // ═══════════════════════════════════════════════════════════

    const dailyActiveUsers = todayActivity.length
    const prevDayActiveUsers = yesterdayActivity.length
    const weeklyActiveUsers = weekActivity.length
    const prevWeekActiveUsers = prevWeekActivity.length
    const monthlyActiveUsers = monthActivity.length

    const avgTimeSpentSeconds = lessonProgressAgg._avg.timeSpent || 0
    const avgSessionDuration = Math.round((avgTimeSpentSeconds / 60) * 10) / 10

    const completionRate = totalEnrollments > 0
      ? Math.round(safeDiv(completedEnrollments, totalEnrollments) * 1000) / 10
      : 0

    // Retention: students active in last 7 days / total students
    const activeThisWeek = new Set<string>()
    for (const da of allDailyActivity) {
      if (da.date >= sevenDaysAgoStr) {
        activeThisWeek.add(da.userId)
      }
    }
    const retentionRate = totalStudentsRaw > 0
      ? Math.round(safeDiv(activeThisWeek.size, totalStudentsRaw) * 1000) / 10
      : 0

    // Trends
    const dauTrend = pctChange(dailyActiveUsers, prevDayActiveUsers)
    const wauTrend = pctChange(weeklyActiveUsers, prevWeekActiveUsers)
    const enrollmentTrend = pctChange(enrollmentsThisMonth, enrollmentsLastMonth)

    // Completion trend: compare completions this month vs last month
    const completionsThisMonth = await db.enrollment.count({
      where: { completedAt: { gte: monthStart } },
    }).catch(() => 0)
    const completionTrend = pctChange(completionsThisMonth, prevCompletedEnrollments)

    const platformHealth: PlatformHealth = {
      totalStudents: totalStudentsRaw,
      totalCourses,
      totalEnrollments,
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      avgSessionDuration,
      completionRate,
      retentionRate,
      trends: {
        dauTrend,
        wauTrend,
        enrollmentTrend,
        completionTrend,
      },
    }

    // ═══════════════════════════════════════════════════════════
    // ─── Engine 2: Engagement Intelligence Engine ─────────────
    // ═══════════════════════════════════════════════════════════

    const courseEngagement: CourseEngagement[] = []

    for (const course of publishedCourses) {
      const courseId = course.id
      const courseEnrollments = course.enrollments
      const enrollmentCount = courseEnrollments.length
      if (enrollmentCount === 0) {
        courseEngagement.push({
          courseId,
          courseTitle: course.title,
          enrollmentCount: 0,
          engagementScore: 0,
          loginScore: 0,
          activityScore: 0,
          quizScore: 0,
          aiScore: 0,
          communityScore: 0,
        })
        continue
      }

      // 1. Login Score (0-20): % of enrolled students who logged in last 7 days
      const enrolledUserIds = new Set(courseEnrollments.map(e => e.userId))
      let recentLogins = 0
      for (const uid of enrolledUserIds) {
        if (activeThisWeek.has(uid)) recentLogins++
      }
      const loginScore = Math.round(safeDiv(recentLogins, enrollmentCount) * 20)

      // 2. Course Activity Score (0-30): Based on lesson completions and progress
      const courseEvents = learningEventsByCourse.get(courseId) || new Map<string, number>()
      const lessonsCompleted = courseEvents.get('LESSON_COMPLETED') || 0
      const lessonViews = courseEvents.get('LESSON_STARTED') || 0
      const avgProgress = courseEnrollments.reduce((sum, e) => sum + e.progress, 0) / enrollmentCount
      const activityRaw = safeDiv(avgProgress, 100) * 15 + safeDiv(Math.min(lessonsCompleted, enrollmentCount * 5), enrollmentCount * 5) * 10 + safeDiv(Math.min(lessonViews, enrollmentCount * 10), enrollmentCount * 10) * 5
      const activityScore = Math.round(clamp(activityRaw, 0, 30))

      // 3. Quiz Activity Score (0-20): Based on quiz attempts
      const courseQuizAttempts = quizAttemptsByCourse.get(courseId) || []
      const recentQuizAttempts = courseQuizAttempts.filter(qa => {
        const uid = enrolledUserIds.has(qa.userId)
        return uid
      })
      const quizParticipationRate = safeDiv(recentQuizAttempts.length, enrollmentCount)
      const quizScore = Math.round(clamp(quizParticipationRate * 20, 0, 20))

      // 4. AI Interaction Score (0-15): Based on AI usage
      const aiCount = aiActivitiesByCourse.get(courseId) || 0
      const aiUsersInCourse = learningEvents.filter(
        ev => ev.courseId === courseId && ev.eventType === 'AI_CHAT_USED'
      ).length
      const aiRate = safeDiv(aiUsersInCourse, enrollmentCount)
      const aiScore = Math.round(clamp(aiRate * 15, 0, 15))

      // 5. Community Participation Score (0-15): Based on discussions + Q&A
      const communityPosts = (discussionByCourse.get(courseId) || 0) + (qaByCourse.get(courseId) || 0)
      const communityRate = safeDiv(communityPosts, enrollmentCount)
      const communityScore = Math.round(clamp(communityRate * 15, 0, 15))

      const engagementScore = clamp(loginScore + activityScore + quizScore + aiScore + communityScore, 0, 100)

      courseEngagement.push({
        courseId,
        courseTitle: course.title,
        enrollmentCount,
        engagementScore: Math.round(engagementScore),
        loginScore,
        activityScore,
        quizScore,
        aiScore,
        communityScore,
      })
    }

    const platformAverageEngagement = courseEngagement.length > 0
      ? Math.round(courseEngagement.reduce((sum, c) => sum + c.engagementScore, 0) / courseEngagement.length * 10) / 10
      : 0

    const engagement: EngagementData = {
      courseEngagement,
      platformAverageEngagement,
    }

    // ═══════════════════════════════════════════════════════════
    // ─── Engine 3: Course Intelligence Engine ─────────────────
    // ═══════════════════════════════════════════════════════════

    const courseIntelligence: CourseIntelligenceItem[] = []

    for (const course of publishedCourses) {
      const courseId = course.id
      const courseEnrollments = course.enrollments
      const enrollmentCount = courseEnrollments.length

      // 1. Enrollment Growth (25%): this month vs last month
      const enrollmentsThisMonthForCourse = courseEnrollments.filter(
        e => new Date(e.enrolledAt) >= monthStart
      ).length
      const enrollmentsLastMonthForCourse = courseEnrollments.filter(
        e => {
          const d = new Date(e.enrolledAt)
          return d >= lastMonthStart && d < monthStart
        }
      ).length
      const enrollmentGrowth = pctChange(enrollmentsThisMonthForCourse, enrollmentsLastMonthForCourse)
      // Normalize to 0-100: growth of 50%+ = 100, 0% = 50, -50%+ = 0
      const enrollmentGrowthScore = clamp(50 + enrollmentGrowth, 0, 100)

      // 2. Completion Rate (25%)
      const completedCount = courseEnrollments.filter(e => e.status === 'completed' || e.completedAt).length
      const completionRateCourse = safeDiv(completedCount, enrollmentCount) * 100

      // 3. Ratings (20%)
      const courseReviews = course.reviews
      const avgRating = courseReviews.length > 0
        ? courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length
        : course.rating || 0
      // Normalize: 5 stars = 100, 3 stars = 60, 1 star = 20
      const ratingScore = (avgRating / 5) * 100

      // 4. Engagement (15%): average progress of active enrollments
      const activeEnrollments = courseEnrollments.filter(e => e.status === 'active')
      const engagementRate = activeEnrollments.length > 0
        ? activeEnrollments.reduce((sum, e) => sum + e.progress, 0) / activeEnrollments.length
        : 0

      // 5. Assessment Score (15%): average quiz performance
      const courseQuizAttempts = (quizAttemptsByCourse.get(courseId) || [])
        .filter(qa => {
          const uid = courseEnrollments.some(e => e.userId === qa.userId)
          return uid
        })
      const assessmentScore = courseQuizAttempts.length > 0
        ? courseQuizAttempts.reduce((sum, qa) => sum + qa.percentage, 0) / courseQuizAttempts.length
        : 0

      // Weighted health score
      const healthScore = Math.round(clamp(
        enrollmentGrowthScore * 0.25 +
        completionRateCourse * 0.25 +
        ratingScore * 0.20 +
        engagementRate * 0.15 +
        assessmentScore * 0.15,
        0, 100
      ))

      // Status categorization
      let status: 'healthy' | 'at_risk' | 'critical' = 'healthy'
      if (healthScore < 40) status = 'critical'
      else if (healthScore < 65) status = 'at_risk'

      courseIntelligence.push({
        courseId,
        courseTitle: course.title,
        instructorName: course.instructor.name,
        healthScore,
        status,
        enrollmentGrowth,
        completionRate: Math.round(completionRateCourse * 10) / 10,
        avgRating: Math.round(avgRating * 10) / 10,
        engagementRate: Math.round(engagementRate * 10) / 10,
        assessmentScore: Math.round(assessmentScore * 10) / 10,
        enrollmentCount,
      })
    }

    // Sort by health score ascending (worst first)
    courseIntelligence.sort((a, b) => a.healthScore - b.healthScore)

    // ═══════════════════════════════════════════════════════════
    // ─── Engine 4: Instructor Intelligence Engine ─────────────
    // ═══════════════════════════════════════════════════════════

    const instructorIntelligence: InstructorIntelligenceItem[] = []

    for (const instructor of allInstructors) {
      const courses = instructor.coursesCreated
      const courseCount = courses.length

      if (courseCount === 0) {
        instructorIntelligence.push({
          instructorId: instructor.id,
          instructorName: instructor.name,
          courseCount: 0,
          totalStudents: 0,
          effectivenessScore: 0,
          completionRate: 0,
          avgRating: 0,
          studentSuccessRate: 0,
          engagementScore: 0,
          warnings: ['No published courses'],
        })
        continue
      }

      const totalStudents = courses.reduce((sum, c) => sum + c.enrollmentCount, 0)

      // 1. Course Completion Rate (30%)
      const allCourseEnrollments = courses.flatMap(c => c.enrollments)
      const totalEnrollmentsForInstructor = allCourseEnrollments.length
      const completedForInstructor = allCourseEnrollments.filter(e => e.status === 'completed' || e.completedAt).length
      const instructorCompletionRate = totalEnrollmentsForInstructor > 0
        ? safeDiv(completedForInstructor, totalEnrollmentsForInstructor) * 100
        : 0

      // 2. Ratings (25%)
      const allRatings = courses.flatMap(c => c.reviews.map(r => r.rating))
      const avgInstructorRating = allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
        : courses.reduce((sum, c) => sum + c.rating, 0) / courseCount
      const ratingNormalized = (avgInstructorRating / 5) * 100

      // 3. Student Success Rate (25%): average student quiz performance
      const allStudentQuizAttempts = courses.flatMap(c =>
        c.quizzes.flatMap(q => q.attempts)
      )
      const studentSuccessRate = allStudentQuizAttempts.length > 0
        ? allStudentQuizAttempts.reduce((sum, a) => sum + a.percentage, 0) / allStudentQuizAttempts.length
        : 0

      // 4. Engagement Score (20%): average course progress
      const activeInstructorEnrollments = allCourseEnrollments.filter(e => e.status === 'active')
      const instructorEngagement = activeInstructorEnrollments.length > 0
        ? activeInstructorEnrollments.reduce((sum, e) => sum + e.progress, 0) / activeInstructorEnrollments.length
        : 0

      // Weighted effectiveness score
      const effectivenessScore = Math.round(clamp(
        instructorCompletionRate * 0.30 +
        ratingNormalized * 0.25 +
        studentSuccessRate * 0.25 +
        instructorEngagement * 0.20,
        0, 100
      ))

      // Warnings
      const warnings: string[] = []

      // High response time: check if instructor's Q&A answers are >48 hours after question
      const recentAnswers = instructor.qaAnswers || []
      let slowResponseCount = 0
      for (const ans of recentAnswers) {
        const questionDate = new Date(ans.question.createdAt)
        const answerDate = new Date(ans.createdAt)
        const hoursDiff = (answerDate.getTime() - questionDate.getTime()) / (1000 * 60 * 60)
        if (hoursDiff > 48) slowResponseCount++
      }
      if (slowResponseCount > 2) {
        warnings.push(`High response time: ${slowResponseCount} answers took >48 hours`)
      }

      // Low ratings
      if (avgInstructorRating > 0 && avgInstructorRating < 3.0) {
        warnings.push(`Low average rating: ${avgInstructorRating.toFixed(1)}/5.0`)
      }

      // Low completion rate
      if (instructorCompletionRate < 20 && totalEnrollmentsForInstructor > 5) {
        warnings.push(`Low completion rate: ${instructorCompletionRate.toFixed(1)}%`)
      }

      // No new enrollments in 30 days
      const recentEnrollments = allCourseEnrollments.filter(
        e => new Date(e.enrolledAt) >= thirtyDaysAgo
      ).length
      if (recentEnrollments === 0 && totalEnrollmentsForInstructor > 0) {
        warnings.push('No new enrollments in the last 30 days')
      }

      // Instructor inactive
      const lastActive = new Date(instructor.lastActiveAt)
      const daysSinceActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceActive > 14) {
        warnings.push(`Inactive for ${daysSinceActive} days`)
      }

      instructorIntelligence.push({
        instructorId: instructor.id,
        instructorName: instructor.name,
        courseCount,
        totalStudents,
        effectivenessScore,
        completionRate: Math.round(instructorCompletionRate * 10) / 10,
        avgRating: Math.round(avgInstructorRating * 10) / 10,
        studentSuccessRate: Math.round(studentSuccessRate * 10) / 10,
        engagementScore: Math.round(instructorEngagement * 10) / 10,
        warnings,
      })
    }

    // Sort by effectiveness score ascending (worst first for admin attention)
    instructorIntelligence.sort((a, b) => a.effectivenessScore - b.effectivenessScore)

    // ═══════════════════════════════════════════════════════════
    // ─── Engine 5: Alert & Anomaly Engine ─────────────────────
    // ═══════════════════════════════════════════════════════════

    const alerts: AlertItem[] = []
    let alertCounter = 0

    function addAlert(
      type: string,
      severity: 'critical' | 'warning' | 'info',
      title: string,
      description: string,
      relatedEntity: string,
      relatedEntityType: 'course' | 'instructor' | 'student' | 'platform'
    ) {
      alertCounter++
      alerts.push({
        id: `alert-${alertCounter}-${Date.now()}`,
        type,
        severity,
        title,
        description,
        relatedEntity,
        relatedEntityType,
        timestamp: now.toISOString(),
        isRead: false,
      })
    }

    // Rule 1: Enrollment Drop > 20% → "Enrollment Alert"
    if (enrollmentsLastMonth > 0 && enrollmentTrend < -20) {
      addAlert(
        'enrollment_drop',
        'warning',
        'Enrollment Alert',
        `Platform enrollments dropped ${Math.abs(enrollmentTrend)}% compared to last month (${enrollmentsThisMonth} vs ${enrollmentsLastMonth})`,
        'platform',
        'platform'
      )
    }

    // Per-course enrollment drop
    for (const ci of courseIntelligence) {
      if (ci.enrollmentGrowth < -20) {
        addAlert(
          'course_enrollment_drop',
          ci.enrollmentGrowth < -40 ? 'critical' : 'warning',
          'Enrollment Alert',
          `"${ci.courseTitle}" enrollment dropped ${Math.abs(ci.enrollmentGrowth)}% this month`,
          ci.courseId,
          'course'
        )
      }
    }

    // Rule 2: Completion decrease > 15% → "Course Quality Alert"
    if (completionTrend < -15) {
      addAlert(
        'completion_decrease',
        'warning',
        'Course Quality Alert',
        `Platform course completion rate decreased by ${Math.abs(completionTrend)}% compared to last month`,
        'platform',
        'platform'
      )
    }

    for (const ci of courseIntelligence) {
      if (ci.completionRate < 15 && ci.enrollmentCount > 3) {
        addAlert(
          'low_completion',
          ci.completionRate < 8 ? 'critical' : 'warning',
          'Course Quality Alert',
          `"${ci.courseTitle}" has a completion rate of only ${ci.completionRate}%`,
          ci.courseId,
          'course'
        )
      }
    }

    // Rule 3: Instructor response time > 48 hours → "Instructor Attention Required"
    for (const inst of instructorIntelligence) {
      if (inst.warnings.some(w => w.includes('>48 hours'))) {
        addAlert(
          'instructor_response_time',
          'warning',
          'Instructor Attention Required',
          `${inst.instructorName} has slow Q&A response times (>48 hours)`,
          inst.instructorId,
          'instructor'
        )
      }
    }

    // Rule 4: Student activity = 0 for 14 days → "High Inactivity Alert"
    // Find students who haven't had any daily activity in the last 14 days
    const fourteenDaysAgoDate = daysAgo(14)
    const activeUsersLast14Days = new Set<string>()
    for (const da of allDailyActivity) {
      if (new Date(da.date) >= fourteenDaysAgoDate) {
        activeUsersLast14Days.add(da.userId)
      }
    }
    // Count students enrolled but inactive for 14+ days
    const inactiveStudentIds = new Set<string>()
    for (const e of allEnrollments) {
      if (e.status === 'active' && !activeUsersLast14Days.has(e.userId)) {
        inactiveStudentIds.add(e.userId)
      }
    }
    if (inactiveStudentIds.size > 0) {
      addAlert(
        'student_inactivity',
        inactiveStudentIds.size > 20 ? 'critical' : 'warning',
        'High Inactivity Alert',
        `${inactiveStudentIds.size} students have been inactive for 14+ days despite active enrollments`,
        'platform',
        'platform'
      )
    }

    // Rule 5: Quiz avg score drops > 20% → "Assessment Quality Alert"
    // Compare quiz performance this month vs last month
    const thisMonthQuizAttempts = allQuizAttempts.filter(
      qa => qa.completedAt && new Date(qa.completedAt) >= monthStart
    )
    const lastMonthQuizAttempts = allQuizAttempts.filter(
      qa => qa.completedAt && new Date(qa.completedAt) >= lastMonthStart && new Date(qa.completedAt) < monthStart
    )
    const thisMonthAvgScore = thisMonthQuizAttempts.length > 0
      ? thisMonthQuizAttempts.reduce((s, q) => s + q.percentage, 0) / thisMonthQuizAttempts.length
      : 0
    const lastMonthAvgScore = lastMonthQuizAttempts.length > 0
      ? lastMonthQuizAttempts.reduce((s, q) => s + q.percentage, 0) / lastMonthQuizAttempts.length
      : 0
    const quizScoreChange = pctChange(thisMonthAvgScore, lastMonthAvgScore)

    if (lastMonthAvgScore > 0 && quizScoreChange < -20) {
      addAlert(
        'assessment_quality',
        'warning',
        'Assessment Quality Alert',
        `Average quiz scores dropped ${Math.abs(quizScoreChange)}% this month (${thisMonthAvgScore.toFixed(1)}% vs ${lastMonthAvgScore.toFixed(1)}%)`,
        'platform',
        'platform'
      )
    }

    // Per-course quiz score drop
    for (const ci of courseIntelligence) {
      if (ci.assessmentScore < 30 && ci.enrollmentCount > 2) {
        addAlert(
          'course_assessment_quality',
          ci.assessmentScore < 15 ? 'critical' : 'warning',
          'Assessment Quality Alert',
          `"${ci.courseTitle}" has low average quiz scores (${ci.assessmentScore}%)`,
          ci.courseId,
          'course'
        )
      }
    }

    // Rule 6: New enrollment spike > 50% → "Enrollment Spike"
    if (enrollmentsLastMonth > 0 && enrollmentTrend > 50) {
      addAlert(
        'enrollment_spike',
        'info',
        'Enrollment Spike',
        `Platform enrollments surged ${enrollmentTrend}% compared to last month (${enrollmentsThisMonth} vs ${enrollmentsLastMonth})`,
        'platform',
        'platform'
      )
    }

    // Per-course enrollment spike
    for (const ci of courseIntelligence) {
      if (ci.enrollmentGrowth > 50) {
        addAlert(
          'course_enrollment_spike',
          'info',
          'Enrollment Spike',
          `"${ci.courseTitle}" enrollment surged ${ci.enrollmentGrowth}% this month`,
          ci.courseId,
          'course'
        )
      }
    }

    // Rule 7: Course rating drops below 3.0 → "Low Course Rating"
    for (const ci of courseIntelligence) {
      if (ci.avgRating > 0 && ci.avgRating < 3.0) {
        addAlert(
          'low_course_rating',
          ci.avgRating < 2.0 ? 'critical' : 'warning',
          'Low Course Rating',
          `"${ci.courseTitle}" has a low average rating of ${ci.avgRating}/5.0`,
          ci.courseId,
          'course'
        )
      }
    }

    // Rule 8: Instructor with 0 new enrollments in 30 days → "Instructor Inactivity"
    for (const inst of instructorIntelligence) {
      if (inst.warnings.some(w => w.includes('No new enrollments in the last 30 days'))) {
        addAlert(
          'instructor_inactivity',
          'warning',
          'Instructor Inactivity',
          `${inst.instructorName} has had 0 new enrollments across all courses in the last 30 days`,
          inst.instructorId,
          'instructor'
        )
      }
    }

    // Sort alerts by severity (critical first)
    const severityOrder = { critical: 0, warning: 1, info: 2 }
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    // ═══════════════════════════════════════════════════════════
    // ─── Insight Generator (Rule-Based) ───────────────────────
    // ═══════════════════════════════════════════════════════════

    const insights: InsightItem[] = []
    let insightCounter = 0

    function addInsight(
      engine: string,
      type: 'positive' | 'negative' | 'neutral' | 'warning',
      title: string,
      description: string,
      actionable: boolean,
      actionSuggestion?: string
    ) {
      insightCounter++
      insights.push({
        id: `insight-${insightCounter}`,
        engine,
        type,
        title,
        description,
        actionable,
        actionSuggestion,
      })
    }

    // Platform Health Insights
    if (retentionRate >= 70) {
      addInsight('Platform Health', 'positive', 'Strong Student Retention', `${retentionRate}% of students are active this week, indicating healthy engagement.`, false)
    } else if (retentionRate < 30) {
      addInsight('Platform Health', 'negative', 'Low Student Retention', `Only ${retentionRate}% of students are active this week. Consider re-engagement campaigns.`, true, 'Launch targeted email campaigns for inactive students')
    }

    if (completionRate >= 60) {
      addInsight('Platform Health', 'positive', 'High Completion Rate', `Course completion rate is ${completionRate}%, above the 60% industry benchmark.`, false)
    } else if (completionRate < 30) {
      addInsight('Platform Health', 'warning', 'Low Completion Rate', `Course completion rate is ${completionRate}%. Courses may need content restructuring.`, true, 'Review course content difficulty and pacing')
    }

    if (dauTrend > 20) {
      addInsight('Platform Health', 'positive', 'Growing Daily Active Users', `DAU increased ${dauTrend}% compared to yesterday.`, false)
    } else if (dauTrend < -20) {
      addInsight('Platform Health', 'negative', 'Declining Daily Active Users', `DAU dropped ${Math.abs(dauTrend)}% compared to yesterday.`, true, 'Investigate potential causes: content gaps, technical issues, or seasonal patterns')
    }

    // Engagement Insights
    const highEngagementCourses = courseEngagement.filter(c => c.engagementScore >= 70)
    const lowEngagementCourses = courseEngagement.filter(c => c.engagementScore < 30 && c.enrollmentCount > 0)

    if (highEngagementCourses.length > 0) {
      addInsight('Engagement', 'positive', 'High-Engagement Courses Detected', `${highEngagementCourses.length} courses have engagement scores above 70/100.`, true, 'Study these courses\' patterns and apply best practices to underperforming courses')
    }

    if (lowEngagementCourses.length > 0) {
      addInsight('Engagement', 'warning', 'Low-Engagement Courses Need Attention', `${lowEngagementCourses.length} courses have engagement scores below 30/100.`, true, 'Consider content refresh, interactive elements, or instructor outreach')
    }

    if (platformAverageEngagement < 40) {
      addInsight('Engagement', 'negative', 'Below-Average Platform Engagement', `Platform average engagement is ${platformAverageEngagement}/100. Students may be losing interest.`, true, 'Implement gamification, push notifications, or content recommendations')
    }

    // Course Intelligence Insights
    const criticalCourses = courseIntelligence.filter(c => c.status === 'critical')
    const atRiskCourses = courseIntelligence.filter(c => c.status === 'at_risk')
    const healthyCourses = courseIntelligence.filter(c => c.status === 'healthy')

    if (criticalCourses.length > 0) {
      addInsight('Course Intelligence', 'negative', 'Critical Courses Detected', `${criticalCourses.length} courses are in critical condition with health scores below 40.`, true, 'Prioritize review of these courses: consider content overhaul, instructor support, or archival')
    }

    if (atRiskCourses.length > 0) {
      addInsight('Course Intelligence', 'warning', 'At-Risk Courses Need Monitoring', `${atRiskCourses.length} courses are at risk with health scores between 40-65.`, true, 'Schedule instructor check-ins and review student feedback')
    }

    if (healthyCourses.length > 0 && healthyCourses.length === courseIntelligence.length) {
      addInsight('Course Intelligence', 'positive', 'All Courses Healthy', 'All published courses have health scores above 65.', false)
    }

    // Instructor Intelligence Insights
    const lowEffectivenessInstructors = instructorIntelligence.filter(i => i.effectivenessScore < 40 && i.courseCount > 0)
    const topInstructorsList = instructorIntelligence.filter(i => i.effectivenessScore >= 75)

    if (lowEffectivenessInstructors.length > 0) {
      addInsight('Instructor Intelligence', 'warning', 'Underperforming Instructors', `${lowEffectivenessInstructors.length} instructors have effectiveness scores below 40.`, true, 'Provide training resources, mentorship pairing, or performance improvement plans')
    }

    if (topInstructorsList.length > 0) {
      addInsight('Instructor Intelligence', 'positive', 'Top-Performing Instructors', `${topInstructorsList.length} instructors have effectiveness scores above 75.`, true, 'Feature these instructors in promotions and use their courses as best-practice examples')
    }

    const instructorsWithWarnings = instructorIntelligence.filter(i => i.warnings.length > 0)
    if (instructorsWithWarnings.length > 0) {
      addInsight('Instructor Intelligence', 'warning', 'Instructor Warnings Detected', `${instructorsWithWarnings.length} instructors have active warnings that need attention.`, true, 'Review each warning and reach out to affected instructors')
    }

    // Alert-based Insights
    const criticalAlerts = alerts.filter(a => a.severity === 'critical')
    if (criticalAlerts.length > 0) {
      addInsight('Alert Engine', 'negative', 'Critical Alerts Active', `${criticalAlerts.length} critical alerts require immediate attention.`, true, 'Review and address all critical alerts before other tasks')
    }

    // ═══════════════════════════════════════════════════════════
    // ─── Final Response ───────────────────────────────────────
    // ═══════════════════════════════════════════════════════════

    return NextResponse.json({
      platformHealth,
      engagement,
      courseIntelligence,
      instructorIntelligence,
      alerts,
      insights,
    })
  } catch (error) {
    console.error('[SystemIntelligence] Error:', error)
    return NextResponse.json(
      { error: 'Failed to compute system intelligence data' },
      { status: 500 }
    )
  }
}
