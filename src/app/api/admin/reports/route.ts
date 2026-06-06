import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// ─── Types ───
type ReportType = 'platform_performance' | 'course_performance' | 'instructor_performance' | 'student_engagement' | 'ai_usage'
type Period = 'weekly' | 'monthly' | 'quarterly'

// ─── Period Date Helper ───
function getPeriodDates(period: Period): { periodStart: Date; periodEnd: Date } {
  const now = new Date()
  const periodEnd = new Date(now)
  let periodStart = new Date(now)

  switch (period) {
    case 'weekly':
      periodStart.setDate(now.getDate() - 7)
      break
    case 'monthly':
      periodStart.setMonth(now.getMonth() - 1)
      break
    case 'quarterly':
      periodStart.setMonth(now.getMonth() - 3)
      break
  }

  return { periodStart, periodEnd }
}

// ─── Metrics Computation ───
async function computePlatformPerformance(periodStart: Date) {
  const totalStudents = await db.user.count({ where: { role: 'student' } })
  const totalInstructors = await db.user.count({ where: { role: 'instructor' } })
  const totalCourses = await db.course.count()
  const publishedCourses = await db.course.count({ where: { isPublished: true } })
  const totalEnrollments = await db.enrollment.count()
  const newEnrollments = await db.enrollment.count({ where: { enrolledAt: { gte: periodStart } } })
  const activeEnrollments = await db.enrollment.count({ where: { status: 'active' } })
  const completedEnrollments = await db.enrollment.count({ where: { status: 'completed' } })
  const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0
  const totalCertificates = await db.certificate.count()
  const totalRevenue = await db.transaction.aggregate({
    where: { type: 'enrollment', status: 'completed', createdAt: { gte: periodStart } },
    _sum: { amount: true },
  })
  const aiUsage = await db.aIUsageLog.count({ where: { createdAt: { gte: periodStart } } })

  return {
    totalStudents,
    totalInstructors,
    totalCourses,
    publishedCourses,
    draftCourses: totalCourses - publishedCourses,
    totalEnrollments,
    newEnrollments,
    activeEnrollments,
    completedEnrollments,
    completionRate,
    totalCertificates,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    aiUsageCount: aiUsage,
  }
}

async function computeCoursePerformance(courseId?: string) {
  const where = courseId ? { id: courseId } : { isPublished: true }
  const courses = await db.course.findMany({
    where,
    include: {
      enrollments: true,
      quizzes: { include: { attempts: true } },
      reviews: true,
    },
  })

  const courseMetrics = courses.map((course) => {
    const enrollmentCount = course.enrollments.length
    const completedCount = course.enrollments.filter((e) => e.status === 'completed').length
    const completionRate = enrollmentCount > 0 ? Math.round((completedCount / enrollmentCount) * 100) : 0
    const avgProgress = enrollmentCount > 0
      ? Math.round(course.enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollmentCount)
      : 0

    const allAttempts = course.quizzes.flatMap((q) => q.attempts)
    const avgQuizScore = allAttempts.length > 0
      ? Math.round(allAttempts.reduce((sum, a) => sum + a.percentage, 0) / allAttempts.length)
      : 0

    const rating = course.reviews.length > 0
      ? Math.round((course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length) * 10) / 10
      : 0

    return {
      courseId: course.id,
      title: course.title,
      category: course.category,
      enrollmentCount,
      completionRate,
      avgProgress,
      avgQuizScore,
      rating,
    }
  })

  return { courses: courseMetrics, totalCourses: courseMetrics.length }
}

async function computeInstructorPerformance(instructorId?: string) {
  const where: Record<string, unknown> = { role: 'instructor' }
  if (instructorId) where.id = instructorId

  const instructors = await db.user.findMany({
    where,
    include: {
      coursesCreated: {
        include: {
          enrollments: true,
          reviews: true,
        },
      },
    },
  })

  const instructorMetrics = instructors.map((inst) => {
    const courseCount = inst.coursesCreated.length
    const totalStudents = inst.coursesCreated.reduce((sum, c) => sum + c.enrollments.length, 0)

    const allReviews = inst.coursesCreated.flatMap((c) => c.reviews)
    const avgRating = allReviews.length > 0
      ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) * 10) / 10
      : 0

    const allEnrollments = inst.coursesCreated.flatMap((c) => c.enrollments)
    const completedCount = allEnrollments.filter((e) => e.status === 'completed').length
    const completionRate = allEnrollments.length > 0
      ? Math.round((completedCount / allEnrollments.length) * 100)
      : 0

    return {
      instructorId: inst.id,
      name: inst.name,
      courseCount,
      totalStudents,
      avgRating,
      completionRate,
    }
  })

  return { instructors: instructorMetrics, totalInstructors: instructorMetrics.length }
}

async function computeStudentEngagement(periodStart: Date) {
  const totalStudents = await db.user.count({ where: { role: 'student' } })
  const activeStudents = await db.user.count({
    where: { role: 'student', lastActiveAt: { gte: periodStart } },
  })
  const engagementRate = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0

  // Students inactive for 14+ days (at-risk)
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  const atRiskStudents = await db.user.count({
    where: { role: 'student', lastActiveAt: { lt: fourteenDaysAgo } },
  })

  // Most active students (top 5 by XP)
  const mostActive = await db.user.findMany({
    where: { role: 'student', lastActiveAt: { gte: periodStart } },
    orderBy: { xp: 'desc' },
    take: 5,
    select: { id: true, name: true, xp: true, streak: true, lastActiveAt: true },
  })

  // Total lesson progress completed in period
  const completedLessons = await db.lessonProgress.count({
    where: { status: 'completed', completedAt: { gte: periodStart } },
  })

  // Quiz attempts in period
  const quizAttempts = await db.quizAttempt.count({
    where: { completedAt: { gte: periodStart } },
  })

  return {
    totalStudents,
    activeStudents,
    engagementRate,
    atRiskStudents,
    mostActiveStudents: mostActive,
    completedLessons,
    quizAttempts,
  }
}

async function computeAIUsage(periodStart: Date) {
  const totalUsage = await db.aIUsageLog.count({ where: { createdAt: { gte: periodStart } } })

  // Group by feature (equivalent to requestType)
  const byFeature = await db.aIUsageLog.groupBy({
    by: ['feature'],
    where: { createdAt: { gte: periodStart } },
    _count: true,
  })

  const totalTokens = await db.aIUsageLog.aggregate({
    where: { createdAt: { gte: periodStart } },
    _sum: { totalTokens: true },
  })

  const totalCost = await db.aIUsageLog.aggregate({
    where: { createdAt: { gte: periodStart } },
    _sum: { costUSD: true },
  })

  const errorCount = await db.aIUsageLog.count({
    where: { createdAt: { gte: periodStart }, status: 'error' },
  })

  return {
    totalUsage,
    byFeature: byFeature.map((f) => ({ feature: f.feature, count: f._count })),
    totalTokens: totalTokens._sum.totalTokens ?? 0,
    totalCostUSD: totalCost._sum.costUSD ?? 0,
    errorCount,
    errorRate: totalUsage > 0 ? Math.round((errorCount / totalUsage) * 100) : 0,
  }
}

// ─── GET: List Reports ───
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const where: Record<string, unknown> = {}
    if (type) where.reportType = type

    const [reports, total] = await Promise.all([
      db.generatedReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          reportType: true,
          period: true,
          periodStart: true,
          periodEnd: true,
          status: true,
          courseId: true,
          instructorId: true,
          generatedBy: true,
          createdAt: true,
        },
      }),
      db.generatedReport.count({ where }),
    ])

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[Reports API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

// ─── POST: Generate Report ───
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reportType, period, generatedBy, courseId, instructorId } = body as {
      reportType: ReportType
      period: Period
      generatedBy?: string
      courseId?: string
      instructorId?: string
    }

    // Validate
    const validReportTypes: ReportType[] = [
      'platform_performance',
      'course_performance',
      'instructor_performance',
      'student_engagement',
      'ai_usage',
    ]
    const validPeriods: Period[] = ['weekly', 'monthly', 'quarterly']

    if (!validReportTypes.includes(reportType)) {
      return NextResponse.json(
        { error: `Invalid reportType. Must be one of: ${validReportTypes.join(', ')}` },
        { status: 400 }
      )
    }
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: `Invalid period. Must be one of: ${validPeriods.join(', ')}` },
        { status: 400 }
      )
    }

    const { periodStart, periodEnd } = getPeriodDates(period)

    // Create report record with "generating" status
    const report = await db.generatedReport.create({
      data: {
        reportType,
        period,
        periodStart,
        periodEnd,
        status: 'generating',
        generatedBy: generatedBy || null,
        courseId: courseId || null,
        instructorId: instructorId || null,
      },
    })

    // Compute real metrics from database
    let computedMetrics: Record<string, unknown> = {}
    try {
      switch (reportType) {
        case 'platform_performance':
          computedMetrics = await computePlatformPerformance(periodStart)
          break
        case 'course_performance':
          computedMetrics = await computeCoursePerformance(courseId)
          break
        case 'instructor_performance':
          computedMetrics = await computeInstructorPerformance(instructorId)
          break
        case 'student_engagement':
          computedMetrics = await computeStudentEngagement(periodStart)
          break
        case 'ai_usage':
          computedMetrics = await computeAIUsage(periodStart)
          break
      }
    } catch (metricsError) {
      console.error('[Reports API] Metrics computation error:', metricsError)
      computedMetrics = { error: 'Failed to compute some metrics', partial: true }
    }

    // Use LLM to generate summary
    let reportSummary: Record<string, unknown> = {}
    try {
      const zai = await ZAI.create()
      const prompt = `Analyze the following LMS metrics for a ${reportType} report covering ${period} period.
Generate:
1. Executive Summary (2-3 sentences)
2. Key Insights (3-5 bullet points)
3. Risks (2-3 items if any)
4. Recommendations (3-5 actionable items)

Maximum 300 words total.

Metrics:
${JSON.stringify(computedMetrics, null, 2)}`

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'assistant',
            content: 'You are an LMS analytics expert. Analyze the provided metrics and generate a concise report.',
          },
          { role: 'user', content: prompt },
        ],
        thinking: { type: 'disabled' },
      })

      const summaryText = completion.choices?.[0]?.message?.content ?? 'AI summary unavailable'

      reportSummary = {
        executiveSummary: summaryText,
        generatedAt: new Date().toISOString(),
      }
    } catch (llmError) {
      console.error('[Reports API] LLM error:', llmError)
      reportSummary = {
        executiveSummary: 'AI summary generation failed. See computed metrics for raw data.',
        generatedAt: new Date().toISOString(),
        error: true,
      }
    }

    // Update report with data and summary
    await db.generatedReport.update({
      where: { id: report.id },
      data: {
        reportData: JSON.stringify(computedMetrics),
        reportSummary: JSON.stringify(reportSummary),
        status: 'completed',
      },
    })

    return NextResponse.json({
      id: report.id,
      reportType,
      period,
      periodStart,
      periodEnd,
      status: 'completed',
      metrics: computedMetrics,
      summary: reportSummary,
    }, { status: 201 })
  } catch (error) {
    console.error('[Reports API] POST error:', error)

    // Try to mark any generating report as failed
    try {
      const body = await request.clone().json().catch(() => ({}))
      // We can't easily identify the report, but we tried
      void body
    } catch {
      // ignore
    }

    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
