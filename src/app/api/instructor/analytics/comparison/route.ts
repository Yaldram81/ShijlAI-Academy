import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/analytics/comparison - Period-over-period comparison
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const currentPeriod = searchParams.get('currentPeriod') || '30d'
    const previousPeriod = searchParams.get('previousPeriod') || null // Auto-calculated if not provided

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    // Verify instructor exists
    const instructor = await db.user.findUnique({
      where: { id: instructorId },
      select: { id: true, role: true },
    })
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    const now = new Date()

    // Parse current period
    function parsePeriodToDate(period: string, refDate: Date): { start: Date; end: Date; days: number } | null {
      const match = period.match(/^(\d+)(d|w|m)$/i)
      if (!match) {
        switch (period) {
          case '7d': return { start: new Date(refDate.getTime() - 7 * 24 * 60 * 60 * 1000), end: refDate, days: 7 }
          case '30d': return { start: new Date(refDate.getTime() - 30 * 24 * 60 * 60 * 1000), end: refDate, days: 30 }
          case '90d': return { start: new Date(refDate.getTime() - 90 * 24 * 60 * 60 * 1000), end: refDate, days: 90 }
          case '1y': return { start: new Date(refDate.getTime() - 365 * 24 * 60 * 60 * 1000), end: refDate, days: 365 }
          default: return null
        }
      }
      const value = parseInt(match[1])
      const unit = match[2].toLowerCase()
      let days: number
      switch (unit) {
        case 'd': days = value; break
        case 'w': days = value * 7; break
        case 'm': days = value * 30; break
        default: return null
      }
      return {
        start: new Date(refDate.getTime() - days * 24 * 60 * 60 * 1000),
        end: refDate,
        days,
      }
    }

    const currentRange = parsePeriodToDate(currentPeriod, now)
    if (!currentRange) {
      return NextResponse.json({ error: 'Invalid currentPeriod format. Use 7d, 30d, 90d, or 1y' }, { status: 400 })
    }

    // Previous period: same length, just before current period
    let prevRange: { start: Date; end: Date; days: number }
    if (previousPeriod) {
      const parsed = parsePeriodToDate(previousPeriod, currentRange.start)
      if (!parsed) {
        return NextResponse.json({ error: 'Invalid previousPeriod format' }, { status: 400 })
      }
      prevRange = { start: parsed.start, end: currentRange.start, days: parsed.days }
    } else {
      prevRange = {
        start: new Date(currentRange.start.getTime() - currentRange.days * 24 * 60 * 60 * 1000),
        end: currentRange.start,
        days: currentRange.days,
      }
    }

    // Get instructor's courses
    const instructorCourses = await db.course.findMany({
      where: { instructorId },
      include: {
        enrollments: {
          select: {
            userId: true,
            enrolledAt: true,
            completedAt: true,
            progress: true,
          },
        },
        reviews: {
          select: { rating: true, createdAt: true },
        },
      },
    })

    if (instructorCourses.length === 0) {
      return NextResponse.json({
        currentPeriod: { start: currentRange.start.toISOString(), end: currentRange.end.toISOString(), days: currentRange.days },
        previousPeriod: { start: prevRange.start.toISOString(), end: prevRange.end.toISOString(), days: prevRange.days },
        comparison: {
          totalStudents: { current: 0, previous: 0, change: 0, changePercent: 0 },
          totalRevenue: { current: 0, previous: 0, change: 0, changePercent: 0 },
          avgRating: { current: 0, previous: 0, change: 0, changePercent: 0 },
          completionRate: { current: 0, previous: 0, change: 0, changePercent: 0 },
          publishedCourses: { current: 0, previous: 0, change: 0, changePercent: 0 },
        },
        enrollmentComparison: [],
        revenueComparison: [],
      })
    }

    // ========== Calculate current period metrics ==========
    const currentEnrollments = instructorCourses.flatMap((c) =>
      c.enrollments.filter((e) => {
        const d = new Date(e.enrolledAt)
        return d >= currentRange.start && d < currentRange.end
      })
    )
    const currentStudentSet = new Set(currentEnrollments.map((e) => e.userId))
    const currentTotalStudents = currentStudentSet.size

    let currentTotalRevenue = 0
    for (const course of instructorCourses) {
      const courseEnrollments = course.enrollments.filter((e) => {
        const d = new Date(e.enrolledAt)
        return d >= currentRange.start && d < currentRange.end
      })
      currentTotalRevenue += course.price * courseEnrollments.length
    }

    // Current avg rating from reviews in period
    const currentReviews = instructorCourses.flatMap((c) =>
      c.reviews.filter((r) => {
        const d = new Date(r.createdAt)
        return d >= currentRange.start && d < currentRange.end
      })
    )
    const currentAvgRating = currentReviews.length > 0
      ? parseFloat((currentReviews.reduce((acc, r) => acc + r.rating, 0) / currentReviews.length).toFixed(1))
      : parseFloat((instructorCourses.reduce((acc, c) => acc + c.rating, 0) / instructorCourses.length).toFixed(1))

    // Current completion rate for enrollments in period
    const currentCompletedEnrollments = instructorCourses.flatMap((c) =>
      c.enrollments.filter((e) => {
        if (!e.completedAt) return false
        const d = new Date(e.completedAt)
        return d >= currentRange.start && d < currentRange.end
      })
    )
    const currentAllEnrollments = instructorCourses.flatMap((c) => c.enrollments)
    const currentCompletionRate = currentAllEnrollments.length > 0
      ? Math.round((currentCompletedEnrollments.length / currentAllEnrollments.length) * 100)
      : 0

    const currentPublishedCourses = instructorCourses.filter((c) => c.isPublished && !c.isArchived).length

    // ========== Calculate previous period metrics ==========
    const prevEnrollments = instructorCourses.flatMap((c) =>
      c.enrollments.filter((e) => {
        const d = new Date(e.enrolledAt)
        return d >= prevRange.start && d < prevRange.end
      })
    )
    const prevStudentSet = new Set(prevEnrollments.map((e) => e.userId))
    const prevTotalStudents = prevStudentSet.size

    let prevTotalRevenue = 0
    for (const course of instructorCourses) {
      const courseEnrollments = course.enrollments.filter((e) => {
        const d = new Date(e.enrolledAt)
        return d >= prevRange.start && d < prevRange.end
      })
      prevTotalRevenue += course.price * courseEnrollments.length
    }

    const prevReviews = instructorCourses.flatMap((c) =>
      c.reviews.filter((r) => {
        const d = new Date(r.createdAt)
        return d >= prevRange.start && d < prevRange.end
      })
    )
    const prevAvgRating = prevReviews.length > 0
      ? parseFloat((prevReviews.reduce((acc, r) => acc + r.rating, 0) / prevReviews.length).toFixed(1))
      : 0

    const prevCompletedEnrollments = instructorCourses.flatMap((c) =>
      c.enrollments.filter((e) => {
        if (!e.completedAt) return false
        const d = new Date(e.completedAt)
        return d >= prevRange.start && d < prevRange.end
      })
    )
    const prevCompletionRate = prevEnrollments.length > 0
      ? Math.round((prevCompletedEnrollments.length / prevEnrollments.length) * 100)
      : 0

    const prevPublishedCourses = currentPublishedCourses // Can't track historical state

    // ========== Compute comparison ==========
    function computeChange(current: number, previous: number) {
      const change = current - previous
      const changePercent = previous !== 0
        ? parseFloat(((change / previous) * 100).toFixed(1))
        : (current !== 0 ? 100 : 0)
      return { current, previous, change, changePercent }
    }

    const comparison = {
      totalStudents: computeChange(currentTotalStudents, prevTotalStudents),
      totalRevenue: computeChange(currentTotalRevenue, prevTotalRevenue),
      avgRating: computeChange(currentAvgRating, prevAvgRating),
      completionRate: computeChange(currentCompletionRate, prevCompletionRate),
      publishedCourses: computeChange(currentPublishedCourses, prevPublishedCourses),
    }

    // ========== Daily enrollment comparison ==========
    // Build daily enrollment counts for both periods
    function buildDailyEnrollments(
      enrollments: { enrolledAt: Date }[],
      rangeStart: Date,
      rangeDays: number
    ) {
      const daily = new Map<string, number>()
      for (let i = 0; i < rangeDays; i++) {
        const date = new Date(rangeStart.getTime() + i * 24 * 60 * 60 * 1000)
        const dateKey = date.toISOString().split('T')[0]
        daily.set(dateKey, 0)
      }
      for (const e of enrollments) {
        const dateKey = new Date(e.enrolledAt).toISOString().split('T')[0]
        if (daily.has(dateKey)) {
          daily.set(dateKey, (daily.get(dateKey) || 0) + 1)
        }
      }
      return Array.from(daily.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }))
    }

    const currentDailyEnrollments = buildDailyEnrollments(
      currentEnrollments as unknown as { enrolledAt: Date }[],
      currentRange.start,
      currentRange.days
    )
    const prevDailyEnrollments = buildDailyEnrollments(
      prevEnrollments as unknown as { enrolledAt: Date }[],
      prevRange.start,
      prevRange.days
    )

    // Normalize to same day index for comparison
    const maxDays = Math.max(currentDailyEnrollments.length, prevDailyEnrollments.length)
    const enrollmentComparison = Array.from({ length: maxDays }, (_, i) => ({
      day: i + 1,
      current: currentDailyEnrollments[i]?.count || 0,
      previous: prevDailyEnrollments[i]?.count || 0,
    }))

    // ========== Daily revenue comparison ==========
    function buildDailyRevenue(
      courseList: { price: number; enrollments: { enrolledAt: Date }[] }[],
      rangeStart: Date,
      rangeDays: number
    ) {
      const daily = new Map<string, number>()
      for (let i = 0; i < rangeDays; i++) {
        const date = new Date(rangeStart.getTime() + i * 24 * 60 * 60 * 1000)
        const dateKey = date.toISOString().split('T')[0]
        daily.set(dateKey, 0)
      }
      for (const course of courseList) {
        for (const e of course.enrollments) {
          const dateKey = new Date(e.enrolledAt).toISOString().split('T')[0]
          if (daily.has(dateKey)) {
            daily.set(dateKey, (daily.get(dateKey) || 0) + course.price)
          }
        }
      }
      return Array.from(daily.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, revenue]) => ({ date, revenue }))
    }

    const currentEnrollmentsWithCourse = instructorCourses.map((c) => ({
      price: c.price,
      enrollments: c.enrollments.filter((e) => {
        const d = new Date(e.enrolledAt)
        return d >= currentRange.start && d < currentRange.end
      }) as unknown as { enrolledAt: Date }[],
    }))
    const prevEnrollmentsWithCourse = instructorCourses.map((c) => ({
      price: c.price,
      enrollments: c.enrollments.filter((e) => {
        const d = new Date(e.enrolledAt)
        return d >= prevRange.start && d < prevRange.end
      }) as unknown as { enrolledAt: Date }[],
    }))

    const currentDailyRevenue = buildDailyRevenue(
      currentEnrollmentsWithCourse,
      currentRange.start,
      currentRange.days
    )
    const prevDailyRevenue = buildDailyRevenue(
      prevEnrollmentsWithCourse,
      prevRange.start,
      prevRange.days
    )

    const revenueComparison = Array.from({ length: maxDays }, (_, i) => ({
      day: i + 1,
      current: currentDailyRevenue[i]?.revenue || 0,
      previous: prevDailyRevenue[i]?.revenue || 0,
    }))

    // ========== Additional metrics ==========
    // Average progress comparison
    const currentAvgProgress = currentEnrollments.length > 0
      ? parseFloat((currentEnrollments.reduce((acc, e) => acc + e.progress, 0) / currentEnrollments.length).toFixed(1))
      : 0
    const prevAvgProgress = prevEnrollments.length > 0
      ? parseFloat((prevEnrollments.reduce((acc, e) => acc + e.progress, 0) / prevEnrollments.length).toFixed(1))
      : 0

    // Review count comparison
    const currentReviewCount = currentReviews.length
    const prevReviewCount = prevReviews.length

    return NextResponse.json({
      currentPeriod: {
        start: currentRange.start.toISOString(),
        end: currentRange.end.toISOString(),
        days: currentRange.days,
      },
      previousPeriod: {
        start: prevRange.start.toISOString(),
        end: prevRange.end.toISOString(),
        days: prevRange.days,
      },
      comparison,
      additionalMetrics: {
        avgProgress: computeChange(currentAvgProgress, prevAvgProgress),
        reviewCount: computeChange(currentReviewCount, prevReviewCount),
        enrollmentCount: computeChange(currentEnrollments.length, prevEnrollments.length),
      },
      enrollmentComparison,
      revenueComparison,
    })
  } catch (error) {
    console.error('Error fetching comparison analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch comparison data' }, { status: 500 })
  }
}
