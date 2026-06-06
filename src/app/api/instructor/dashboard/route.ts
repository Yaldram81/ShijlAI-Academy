import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── In-memory cache with 60-second TTL ──────────────────────────────────────
interface CacheEntry {
  data: Record<string, unknown>
  timestamp: number
}
const dashboardCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60_000 // 60 seconds

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatLastLogin(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  const timeStr = new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  if (diffDays === 0) return `Today ${timeStr}`
  if (diffDays === 1) return `Yesterday ${timeStr}`
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[new Date(date).getMonth()]} ${new Date(date).getDate()} ${timeStr}`
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

function titleToSlugKey(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((word, idx) =>
      idx === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('')
}

function getShortDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()}`
}

function getStartDate(period: string): Date | null {
  const now = new Date()
  switch (period) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    case 'all':
    default:
      return null
  }
}

// GET /api/instructor/dashboard - Enhanced instructor dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const period = searchParams.get('period') || '30d'

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    // Check cache
    const cacheKey = `${instructorId}:${period}`
    const cached = dashboardCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data)
    }

    // Verify instructor exists
    const instructor = await db.user.findUnique({
      where: { id: instructorId },
      select: { id: true, name: true, role: true, lastActiveAt: true },
    })
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    const startDate = getStartDate(period)
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // ─── Parallel data fetching ─────────────────────────────────────────────
    const [
      instructorUser,
      courses,
      financialSettings,
      commissionOverride,
      pendingSubmissionsCount,
      gradedSubmissionsCount,
      totalSubmissionsCount,
      platformAvgData,
    ] = await Promise.all([
      // Instructor user data
      db.user.findUnique({
        where: { id: instructorId },
        select: { lastActiveAt: true },
      }),
      // Courses with full data
      db.course.findMany({
        where: { instructorId },
        include: {
          enrollments: {
            include: {
              user: { select: { id: true, name: true, xp: true, lastActiveAt: true } },
              lessonProgress: { select: { timeSpent: true, status: true, completedAt: true } },
            },
            orderBy: { enrolledAt: 'desc' },
          },
          modules: {
            include: {
              lessons: { select: { id: true, duration: true } },
            },
          },
          quizzes: {
            include: {
              attempts: { select: { id: true, percentage: true, passed: true, userId: true } },
            },
          },
          assignments: { select: { id: true } },
          reviews: { select: { rating: true } },
        },
      }),
      // Financial settings
      db.financialSettings.findFirst(),
      // Commission override
      db.commissionOverride.findUnique({
        where: { instructorId },
      }),
      // Pending submissions
      db.submission.count({
        where: {
          assignment: { course: { instructorId } },
          status: { in: ['submitted', 'grading'] },
        },
      }),
      // Graded submissions
      db.submission.count({
        where: {
          assignment: { course: { instructorId } },
          status: { in: ['graded', 'returned'] },
        },
      }),
      // Total submissions
      db.submission.count({
        where: {
          assignment: { course: { instructorId } },
        },
      }),
      // Platform averages for comparison
      getPlatformAverages(startDate),
    ])

    if (courses.length === 0) {
      const emptyResponse = {
        role: 'instructor',
        period,
        welcomeData: {
          greeting: `${getGreeting()}, ${instructor.name}`,
          subtitle: "Here's your overview for today.",
          lastLogin: instructorUser?.lastActiveAt ? formatLastLogin(instructorUser.lastActiveAt) : 'Unknown',
          date: getFormattedDate(),
          totalStudents: 0,
          activeToday: 0,
        },
        stats: {
          totalCourses: 0, totalStudents: 0, avgRating: 0,
          totalRevenue: 0, completionRate: 0, avgQuizPassRate: 0,
          newEnrollmentsWeek: 0, pendingReviews: 0,
          monthRevenue: 0, studentsMoMChange: 0, revenueMoMChange: 0,
          activeCourses: 0, draftCourses: 0, totalReviews: 0,
        },
        revenueByDay: [], actionRequired: [], tip: 'Create your first course to get started!',
        enrollmentTrend: [], coursePerformance: [],
        studentPerformanceDistribution: { excellent: 0, good: 0, average: 0, needsImprovement: 0 },
        topStudents: [], contentPipeline: { draft: 0, review: 0, published: 0 },
        recentStudentActivity: [], reviewQueue: [], announcements: [],
        comparisonData: null,
        engagementMetrics: {
          lessonCompletionRate: 0,
          avgTimeSpentMinutes: 0,
          activityBreakdown: { lessons: 0, quizzes: 0, assignments: 0, discussions: 0 },
          dailyActiveStudents: 0,
          weeklyActiveStudents: 0,
        },
        financialSummary: {
          totalRevenue: 0, platformFee: 0, instructorEarnings: 0,
          pendingPayout: 0, completedPayouts: 0,
          commissionRate: commissionOverride?.commissionRate ?? financialSettings?.platformCommissionRate ?? 20,
          payoutRate: commissionOverride ? 100 - commissionOverride.commissionRate : (financialSettings?.instructorPayoutRate ?? 80),
          currency: 'USD',
        },
        submissionStats: { pending: pendingSubmissionsCount, graded: gradedSubmissionsCount, total: totalSubmissionsCount },
        heatmapData: Array.from({ length: 7 }, () => Array(24).fill(0)),
      }
      dashboardCache.set(cacheKey, { data: emptyResponse, timestamp: Date.now() })
      return NextResponse.json(emptyResponse)
    }

    // ─── Core calculations ──────────────────────────────────────────────────
    const totalCourses = courses.length
    const publishedCourses = courses.filter((c) => c.isPublished).length
    const draftCourses = totalCourses - publishedCourses

    const allEnrollments = courses.flatMap((c) => c.enrollments)
    const totalStudents = allEnrollments.length

    // Active today
    const todayStr = now.toISOString().split('T')[0]
    const activeTodayResult = await db.dailyActivity.findMany({
      where: { date: todayStr },
      select: { userId: true },
      distinct: ['userId'],
    })
    const activeToday = activeTodayResult.length

    // ─── Real revenue from Transaction model ────────────────────────────────
    const transactions = await db.transaction.findMany({
      where: {
        instructorId,
        type: { in: ['enrollment', 'refund'] },
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      },
      include: {
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const enrollmentTransactions = transactions.filter((t) => t.type === 'enrollment')
    const refundTransactions = transactions.filter((t) => t.type === 'refund')
    const totalRevenueFromTx = enrollmentTransactions.reduce((sum, t) => sum + t.amount, 0)
    const totalRefunds = refundTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const netRevenue = totalRevenueFromTx - totalRefunds

    // ─── Financial settings + commission override ───────────────────────────
    const platformCommissionRate = financialSettings?.platformCommissionRate ?? 20
    const instructorPayoutRate = financialSettings?.instructorPayoutRate ?? 80
    const effectiveCommissionRate = commissionOverride?.commissionRate ?? platformCommissionRate
    const effectivePayoutRate = commissionOverride ? (100 - commissionOverride.commissionRate) : instructorPayoutRate

    const totalPlatformFee = enrollmentTransactions.reduce((sum, t) => sum + t.platformFee, 0)
    const totalInstructorEarning = enrollmentTransactions.reduce((sum, t) => sum + t.instructorEarning, 0)

    // Payouts
    const payouts = await db.payout.findMany({
      where: { instructorId },
      orderBy: { requestedAt: 'desc' },
    })
    const completedPayoutsTotal = payouts
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
    const pendingPayoutsTotal = payouts
      .filter((p) => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + p.amount, 0)
    const availableForPayout = Math.max(0, totalInstructorEarning - completedPayoutsTotal - pendingPayoutsTotal)

    // ─── Month-over-month calculations ──────────────────────────────────────
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = currentMonthStart

    const monthRevenue = transactions
      .filter((t) => t.type === 'enrollment' && new Date(t.createdAt) >= currentMonthStart)
      .reduce((sum, t) => sum + t.amount, 0)
    const lastMonthRevenue = transactions
      .filter((t) => {
        const d = new Date(t.createdAt)
        return t.type === 'enrollment' && d >= lastMonthStart && d < lastMonthEnd
      })
      .reduce((sum, t) => sum + t.amount, 0)

    const currentMonthStudents = allEnrollments.filter(
      (e) => e.enrolledAt >= currentMonthStart
    ).length
    const lastMonthStudents = allEnrollments.filter(
      (e) => e.enrolledAt >= lastMonthStart && e.enrolledAt < lastMonthEnd
    ).length

    const studentsMoMChange =
      lastMonthStudents > 0
        ? Math.round(((currentMonthStudents - lastMonthStudents) / lastMonthStudents) * 1000) / 10
        : currentMonthStudents > 0 ? 100 : 0
    const revenueMoMChange =
      lastMonthRevenue > 0
        ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 1000) / 10
        : monthRevenue > 0 ? 100 : 0

    // ─── Stats ──────────────────────────────────────────────────────────────
    const avgRating =
      courses.length > 0
        ? Math.round((courses.reduce((sum, c) => sum + c.rating, 0) / courses.length) * 10) / 10
        : 0

    const completionRate =
      totalStudents > 0
        ? Math.round(
            (allEnrollments.filter((e) => e.completedAt !== null).length / totalStudents) * 100
          )
        : 0

    const allQuizAttempts = courses.flatMap((c) => c.quizzes.flatMap((q) => q.attempts))
    const avgQuizPassRate =
      allQuizAttempts.length > 0
        ? Math.round(
            (allQuizAttempts.filter((a) => a.passed).length / allQuizAttempts.length) * 100
          )
        : 0

    const newEnrollmentsWeek = allEnrollments.filter(
      (e) => e.enrolledAt >= sevenDaysAgo
    ).length

    // ─── Revenue by day ─────────────────────────────────────────────────────
    const todayDay = now.getDate()
    const courseSlugMap = new Map<string, string>()
    for (const course of courses) {
      courseSlugMap.set(course.id, titleToSlugKey(course.title))
    }

    const revenueByDay: { day: number; [courseSlug: string]: number }[] = []
    for (let day = 1; day <= todayDay; day++) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), day)
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), day + 1)
      const dayEntry: { day: number; [courseSlug: string]: number } = { day }

      // Use actual transactions for revenue by day
      const dayTxns = enrollmentTransactions.filter(
        (t) => new Date(t.createdAt) >= dayStart && new Date(t.createdAt) < dayEnd
      )
      for (const course of courses) {
        const slug = courseSlugMap.get(course.id)!
        const courseDayRevenue = dayTxns
          .filter((t) => t.courseId === course.id)
          .reduce((sum, t) => sum + t.amount, 0)
        dayEntry[slug] = Math.round(courseDayRevenue)
      }
      dayEntry['other'] = 0
      revenueByDay.push(dayEntry)
    }

    // ─── Action required ────────────────────────────────────────────────────
    const instructorCourseIds = courses.map((c) => c.id)
    const qaCount = await db.qAQuestion.count({
      where: { courseId: { in: instructorCourseIds }, isAnswered: false },
    })
    const assignmentCount = pendingSubmissionsCount

    const actionRequired = [
      { type: 'qa', count: qaCount, text: 'unanswered Q&A questions', actionLabel: 'Go to Q&A', actionView: 'instructor-qa' },
      { type: 'assignments', count: assignmentCount, text: 'submissions to grade', actionLabel: 'Go to Submissions', actionView: 'instructor-submissions' },
      { type: 'review', count: draftCourses, text: 'draft courses', actionLabel: 'Check status', actionView: 'instructor-courses' },
    ]

    // ─── Tip ────────────────────────────────────────────────────────────────
    let tip: string
    if (draftCourses > 0) tip = 'Publish your draft course to start earning revenue.'
    else if (totalStudents < 10 && courses.length > 0) tip = 'Add a promo video to boost enrollments.'
    else if (avgRating >= 4.5) tip = 'Your courses are highly rated! Consider creating an advanced follow-up course.'
    else tip = 'Update your course thumbnails to attract more students.'

    // ─── Enrollment trend ───────────────────────────────────────────────────
    const enrollmentTrend: { date: string; enrollments: number; cumulative: number }[] = []
    let cumulative = 0
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
      const dayEnrollments = allEnrollments.filter(
        (e) => e.enrolledAt >= dayStart && e.enrolledAt < dayEnd
      ).length
      cumulative += dayEnrollments
      enrollmentTrend.push({ date: getShortDate(d), enrollments: dayEnrollments, cumulative })
    }

    // ─── Course performance ─────────────────────────────────────────────────
    const coursePerformance = courses.map((course) => {
      const totalAttempts = course.quizzes.reduce((sum, q) => sum + q.attempts.length, 0)
      const passedAttempts = course.quizzes.reduce(
        (sum, q) => sum + q.attempts.filter((a) => a.passed).length, 0
      )
      const avgScore =
        totalAttempts > 0
          ? Math.round(
              (course.quizzes.reduce(
                (sum, q) => sum + q.attempts.reduce((s, a) => s + a.percentage, 0), 0
              ) / totalAttempts) * 10
            ) / 10
          : 0
      const recentEnrollments = course.enrollments.filter((e) => e.enrolledAt >= sevenDaysAgo).length
      // Real revenue from transactions
      const courseRevenue = enrollmentTransactions
        .filter((t) => t.courseId === course.id)
        .reduce((sum, t) => sum + t.amount, 0)
      const courseRefunds = refundTransactions
        .filter((t) => t.courseId === course.id)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)

      return {
        courseId: course.id,
        courseTitle: course.title,
        category: course.category,
        enrollmentCount: course.enrollments.length,
        rating: course.rating,
        completionRate:
          course.enrollments.length > 0
            ? Math.round(
                (course.enrollments.filter((e) => e.completedAt !== null).length /
                  course.enrollments.length) *
                  100
              )
            : 0,
        revenue: Math.round(courseRevenue - courseRefunds),
        quizStats: {
          totalAttempts,
          passRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
          avgScore,
        },
        status: course.isPublished ? 'published' : 'draft',
        modulesCount: course.modules.length,
        recentEnrollments,
      }
    })

    // ─── Student performance distribution ───────────────────────────────────
    const excellent = allEnrollments.filter((e) => e.progress >= 90).length
    const good = allEnrollments.filter((e) => e.progress >= 70 && e.progress < 90).length
    const average = allEnrollments.filter((e) => e.progress >= 50 && e.progress < 70).length
    const needsImprovement = allEnrollments.filter((e) => e.progress < 50).length
    const studentPerformanceDistribution = { excellent, good, average, needsImprovement }

    // ─── Top students ───────────────────────────────────────────────────────
    const studentMap = new Map<string, { name: string; xp: number; coursesCompleted: number; totalScore: number; quizCount: number }>()
    for (const course of courses) {
      for (const enrollment of course.enrollments) {
        const existing = studentMap.get(enrollment.user.id) ?? {
          name: enrollment.user.name, xp: enrollment.user.xp,
          coursesCompleted: 0, totalScore: 0, quizCount: 0,
        }
        if (enrollment.completedAt) existing.coursesCompleted += 1
        studentMap.set(enrollment.user.id, existing)
      }
    }
    for (const attempt of allQuizAttempts) {
      const existing = studentMap.get(attempt.userId)
      if (existing) {
        existing.totalScore += attempt.percentage
        existing.quizCount += 1
      }
    }
    const topStudents = Array.from(studentMap.entries())
      .map(([id, data]) => ({
        id, name: data.name, xp: data.xp, coursesCompleted: data.coursesCompleted,
        avgScore: data.quizCount > 0 ? Math.round(data.totalScore / data.quizCount) : 0,
      }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 5)

    // ─── Content pipeline ──────────────────────────────────────────────────
    const contentPipeline = {
      draft: draftCourses,
      review: courses.filter((c) => c.reviewStatus === 'under_review').length,
      published: publishedCourses,
    }

    // ─── Recent student activity ────────────────────────────────────────────
    const recentEnrollmentsForActivity = courses.flatMap((c) =>
      c.enrollments
        .filter((e) => e.enrolledAt >= sevenDaysAgo)
        .map((e) => ({
          studentName: e.user.name, course: c.title,
          date: e.enrolledAt, type: 'enrollment' as const,
        }))
    )
    const recentCompletionsForActivity = courses.flatMap((c) =>
      c.enrollments
        .filter((e) => e.completedAt !== null && e.completedAt >= sevenDaysAgo)
        .map((e) => ({
          studentName: e.user.name, course: c.title,
          date: e.completedAt!, type: 'completion' as const,
        }))
    )
    const recentEarningActivity = courses.flatMap((c) =>
      c.enrollments
        .filter((e) => e.enrolledAt >= sevenDaysAgo && c.price > 0)
        .map((e) => ({
          studentName: e.user.name, course: c.title,
          date: e.enrolledAt, type: 'earning' as const,
        }))
    )

    const allActivityItems = [
      ...recentEnrollmentsForActivity.map((e) => ({
        studentName: e.studentName, action: 'enrolled' as const,
        course: e.course, date: e.date, type: e.type,
      })),
      ...recentCompletionsForActivity.map((e) => ({
        studentName: e.studentName, action: 'completed course' as const,
        course: e.course, date: e.date, type: e.type,
      })),
      ...recentEarningActivity.map((e) => ({
        studentName: e.studentName, action: 'earned revenue' as const,
        course: e.course, date: e.date, type: e.type,
      })),
    ]
    allActivityItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const recentStudentActivity = allActivityItems.slice(0, 10).map((item) => ({
      studentName: item.studentName,
      action: item.action,
      course: item.course,
      time: formatTimeAgo(item.date),
      type: item.type,
    }))

    // ─── Review queue ───────────────────────────────────────────────────────
    const recentQuizAttempts = await db.quizAttempt.findMany({
      where: {
        quiz: { course: { instructorId } },
        completedAt: { not: null },
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
      include: {
        user: { select: { name: true } },
        quiz: { select: { title: true } },
      },
    })
    const reviewQueue = recentQuizAttempts.map((a) => ({
      studentName: a.user.name,
      quizTitle: a.quiz.title,
      score: Math.round(a.percentage),
      submittedAt: formatTimeAgo(a.completedAt!),
    }))

    // ─── Announcements ──────────────────────────────────────────────────────
    const announcements: { title: string; message: string; date: string; type: string }[] = [
      {
        title: 'Course Analytics Updated',
        message: 'Your course performance metrics have been refreshed.',
        date: now.toISOString().split('T')[0],
        type: 'info',
      },
    ]
    if (newEnrollmentsWeek > 0) {
      announcements.push({
        title: 'New Enrollments',
        message: `You received ${newEnrollmentsWeek} new enrollments this week!`,
        date: now.toISOString().split('T')[0],
        type: 'success',
      })
    }

    // ─── Comparison data (instructor vs platform averages) ──────────────────
    const instructorStats = {
      avgRating,
      completionRate,
      avgQuizPassRate,
      totalStudents,
      totalCourses,
      totalRevenue: netRevenue,
      avgRevenuePerCourse: totalCourses > 0 ? Math.round(netRevenue / totalCourses) : 0,
    }
    const comparisonData = {
      instructor: instructorStats,
      platform: platformAvgData,
      differences: {
        rating: parseFloat((avgRating - platformAvgData.avgRating).toFixed(1)),
        completionRate: completionRate - platformAvgData.avgCompletionRate,
        quizPassRate: avgQuizPassRate - platformAvgData.avgQuizPassRate,
        revenuePerCourse: (totalCourses > 0 ? Math.round(netRevenue / totalCourses) : 0) - platformAvgData.avgRevenuePerCourse,
      },
    }

    // ─── Engagement metrics (real) ──────────────────────────────────────────
    const studentIds = Array.from(new Set(allEnrollments.map((e) => e.userId)))

    // Lesson completion rates from LessonProgress
    const lessonProgressRecords = await db.lessonProgress.findMany({
      where: {
        enrollment: { courseId: { in: instructorCourseIds } },
      },
      select: { status: true, timeSpent: true },
    })
    const completedLessons = lessonProgressRecords.filter((lp) => lp.status === 'completed').length
    const totalLessonProgress = lessonProgressRecords.length
    const lessonCompletionRate = totalLessonProgress > 0
      ? Math.round((completedLessons / totalLessonProgress) * 100)
      : 0
    const avgTimeSpentSeconds = totalLessonProgress > 0
      ? Math.round(lessonProgressRecords.reduce((sum, lp) => sum + lp.timeSpent, 0) / totalLessonProgress)
      : 0
    const avgTimeSpentMinutes = Math.round(avgTimeSpentSeconds / 60)

    // Daily active students from DailyActivity
    const dailyActivityResult = await db.dailyActivity.findMany({
      where: {
        userId: { in: studentIds },
        ...(startDate ? { date: { gte: startDate.toISOString().split('T')[0] } } : {}),
      },
      select: { date: true, userId: true, timeSpent: true, lessonsCompleted: true, quizzesTaken: true },
    })
    const uniqueActiveDays = new Set(dailyActivityResult.map((a) => a.date))
    const numDays = uniqueActiveDays.size || 1
    const dailyActiveStudentsSet = new Map<string, Set<string>>()
    for (const activity of dailyActivityResult) {
      if (!dailyActiveStudentsSet.has(activity.date)) {
        dailyActiveStudentsSet.set(activity.date, new Set())
      }
      dailyActiveStudentsSet.get(activity.date)!.add(activity.userId)
    }
    const dailyActiveStudentsValues = Array.from(dailyActiveStudentsSet.values())
    const avgDailyActiveStudents = dailyActiveStudentsValues.length > 0
      ? Math.round(dailyActiveStudentsValues.reduce((acc, s) => acc + s.size, 0) / dailyActiveStudentsValues.length)
      : 0

    // Weekly active students
    const weeklyActiveStudents = await db.dailyActivity.findMany({
      where: {
        userId: { in: studentIds },
        date: { gte: sevenDaysAgo.toISOString().split('T')[0] },
      },
      select: { userId: true },
      distinct: ['userId'],
    })

    // Activity breakdown
    const totalLessonsCompleted = dailyActivityResult.reduce((sum, a) => sum + a.lessonsCompleted, 0)
    const totalQuizzesTaken = dailyActivityResult.reduce((sum, a) => sum + a.quizzesTaken, 0)
    const totalAssignmentSubmissions = totalSubmissionsCount

    const engagementMetrics = {
      lessonCompletionRate,
      avgTimeSpentMinutes,
      activityBreakdown: {
        lessons: totalLessonsCompleted,
        quizzes: totalQuizzesTaken,
        assignments: totalAssignmentSubmissions,
        discussions: 0,
      },
      dailyActiveStudents: avgDailyActiveStudents,
      weeklyActiveStudents: weeklyActiveStudents.length,
    }

    // ─── Heatmap data (7x24 grid from DailyActivity) ───────────────────────
    // For the heatmap, we need to infer hour-of-day from activity patterns
    // Since DailyActivity doesn't store hour, we use LessonProgress completedAt timestamps
    const recentLessonProgress = await db.lessonProgress.findMany({
      where: {
        enrollment: { courseId: { in: instructorCourseIds } },
        completedAt: { not: null },
        ...(startDate ? { completedAt: { gte: startDate } } : {}),
      },
      select: { completedAt: true },
    })

    // Build 7x24 heatmap grid (day-of-week × hour)
    const heatmapGrid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
    for (const lp of recentLessonProgress) {
      if (lp.completedAt) {
        const date = new Date(lp.completedAt)
        const dayOfWeek = date.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
        const hour = date.getHours()
        heatmapGrid[dayOfWeek][hour]++
      }
    }

    // Also add quiz attempts to heatmap
    const recentQuizActivity = await db.quizAttempt.findMany({
      where: {
        quiz: { course: { instructorId } },
        completedAt: { not: null },
        ...(startDate ? { completedAt: { gte: startDate } } : {}),
      },
      select: { completedAt: true },
    })
    for (const qa of recentQuizActivity) {
      if (qa.completedAt) {
        const date = new Date(qa.completedAt)
        const dayOfWeek = date.getDay()
        const hour = date.getHours()
        heatmapGrid[dayOfWeek][hour]++
      }
    }

    // Add submission activity to heatmap
    const recentSubmissions = await db.submission.findMany({
      where: {
        assignment: { course: { instructorId } },
        ...(startDate ? { submittedAt: { gte: startDate } } : {}),
      },
      select: { submittedAt: true },
    })
    for (const sub of recentSubmissions) {
      const date = new Date(sub.submittedAt)
      const dayOfWeek = date.getDay()
      const hour = date.getHours()
      heatmapGrid[dayOfWeek][hour]++
    }

    const heatmapData = {
      grid: heatmapGrid,
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      hours: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    }

    // ─── Financial summary ──────────────────────────────────────────────────
    const financialSummary = {
      totalRevenue: Math.round(totalRevenueFromTx),
      totalRefunds: Math.round(totalRefunds),
      netRevenue: Math.round(netRevenue),
      platformFee: Math.round(totalPlatformFee),
      instructorEarnings: Math.round(totalInstructorEarning),
      availableForPayout: Math.round(availableForPayout),
      completedPayouts: Math.round(completedPayoutsTotal),
      pendingPayouts: Math.round(pendingPayoutsTotal),
      commissionRate: effectiveCommissionRate,
      payoutRate: effectivePayoutRate,
      currency: 'USD',
      hasCommissionOverride: !!commissionOverride,
      overrideReason: commissionOverride?.reason || null,
    }

    // ─── Submission stats ───────────────────────────────────────────────────
    const submissionStats = {
      pending: pendingSubmissionsCount,
      toGrade: pendingSubmissionsCount,
      graded: gradedSubmissionsCount,
      total: totalSubmissionsCount,
    }

    // ─── Assemble response ──────────────────────────────────────────────────
    const responseData: Record<string, unknown> = {
      role: 'instructor',
      period,
      welcomeData: {
        greeting: `${getGreeting()}, ${instructor.name}`,
        subtitle: "Here's your overview for today.",
        lastLogin: instructorUser?.lastActiveAt
          ? formatLastLogin(instructorUser.lastActiveAt)
          : 'Unknown',
        date: getFormattedDate(),
        totalStudents,
        activeToday,
      },
      stats: {
        totalCourses,
        totalStudents,
        avgRating,
        totalRevenue: Math.round(netRevenue),
        completionRate,
        avgQuizPassRate,
        newEnrollmentsWeek,
        pendingReviews: pendingSubmissionsCount,
        monthRevenue: Math.round(monthRevenue),
        studentsMoMChange,
        revenueMoMChange,
        activeCourses: publishedCourses,
        draftCourses,
        totalReviews: allQuizAttempts.length,
      },
      revenueByDay,
      actionRequired,
      tip,
      enrollmentTrend,
      coursePerformance,
      studentPerformanceDistribution,
      topStudents,
      contentPipeline,
      recentStudentActivity,
      reviewQueue,
      announcements,
      // New enhanced fields
      comparisonData,
      engagementMetrics,
      financialSummary,
      submissionStats,
      heatmapData,
    }

    // Cache the response
    dashboardCache.set(cacheKey, { data: responseData, timestamp: Date.now() })

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error fetching instructor dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

// ─── Helper: Platform averages ────────────────────────────────────────────────
async function getPlatformAverages(startDate: Date | null) {
  try {
    const [
      totalCourses,
      totalEnrollments,
      courseRatings,
      completionData,
      quizData,
      revenueData,
    ] = await Promise.all([
      db.course.count({ where: { isPublished: true } }),
      db.enrollment.count(startDate ? { where: { enrolledAt: { gte: startDate } } } : undefined),
      db.course.findMany({
        where: { isPublished: true, rating: { gt: 0 } },
        select: { rating: true },
      }),
      db.enrollment.findMany({
        select: { completedAt: true },
        ...(startDate ? { where: { enrolledAt: { gte: startDate } } } : {}),
      }),
      db.quizAttempt.findMany({
        where: { completedAt: { not: null }, ...(startDate ? { completedAt: { gte: startDate } } : {}) },
        select: { passed: true },
      }),
      db.transaction.findMany({
        where: { type: 'enrollment', status: 'completed', ...(startDate ? { createdAt: { gte: startDate } } : {}) },
        select: { amount: true, instructorEarning: true },
      }),
    ])

    const avgRating = courseRatings.length > 0
      ? parseFloat((courseRatings.reduce((sum, c) => sum + c.rating, 0) / courseRatings.length).toFixed(1))
      : 0

    const avgCompletionRate = completionData.length > 0
      ? Math.round((completionData.filter((e) => e.completedAt !== null).length / completionData.length) * 100)
      : 0

    const avgQuizPassRate = quizData.length > 0
      ? Math.round((quizData.filter((a) => a.passed).length / quizData.length) * 100)
      : 0

    const totalRevenue = revenueData.reduce((sum, t) => sum + t.amount, 0)
    const avgRevenuePerCourse = totalCourses > 0 ? Math.round(totalRevenue / totalCourses) : 0

    return {
      totalCourses,
      totalEnrollments,
      avgRating,
      avgCompletionRate,
      avgQuizPassRate,
      totalRevenue: Math.round(totalRevenue),
      avgRevenuePerCourse,
    }
  } catch {
    return {
      totalCourses: 0,
      totalEnrollments: 0,
      avgRating: 0,
      avgCompletionRate: 0,
      avgQuizPassRate: 0,
      totalRevenue: 0,
      avgRevenuePerCourse: 0,
    }
  }
}
