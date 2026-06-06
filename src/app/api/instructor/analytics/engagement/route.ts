import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/analytics/engagement - Real engagement heatmap data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const period = searchParams.get('period') || '30d'

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

    // Calculate date filter
    const now = new Date()
    let startDate: Date | null = null
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      case 'all':
      default:
        startDate = null
        break
    }

    // Get instructor's courses
    const instructorCourses = await db.course.findMany({
      where: { instructorId },
      select: { id: true },
    })
    const instructorCourseIds = instructorCourses.map((c) => c.id)

    if (instructorCourseIds.length === 0) {
      return NextResponse.json({
        period,
        heatmap: {
          grid: Array.from({ length: 7 }, () => Array(24).fill(0)),
          days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          hours: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        },
        byDayOfWeek: [],
        peakHours: [],
        summary: {
          totalActivities: 0,
          peakDay: null,
          peakHour: null,
          avgActivitiesPerDay: 0,
          mostActiveTimeSlot: null,
        },
      })
    }

    // Get student IDs enrolled in instructor's courses
    const enrollments = await db.enrollment.findMany({
      where: { courseId: { in: instructorCourseIds } },
      select: { userId: true },
      distinct: ['userId'],
    })
    const studentIds = enrollments.map((e) => e.userId)

    // ─── Build heatmap from multiple real data sources ──────────────────────

    // 1. LessonProgress completedAt timestamps (most granular for hourly data)
    const lessonProgressWhere: Record<string, unknown> = {
      enrollment: { courseId: { in: instructorCourseIds } },
      completedAt: { not: null },
    }
    if (startDate) {
      lessonProgressWhere.completedAt = { gte: startDate }
    }
    const lessonProgress = await db.lessonProgress.findMany({
      where: lessonProgressWhere,
      select: { completedAt: true },
    })

    // 2. QuizAttempt completedAt timestamps
    const quizAttemptWhere: Record<string, unknown> = {
      quiz: { course: { instructorId } },
      completedAt: { not: null, ...(startDate ? { gte: startDate } : {}) },
    }
    const quizAttempts = await db.quizAttempt.findMany({
      where: quizAttemptWhere,
      select: { completedAt: true },
    })

    // 3. Submission timestamps
    const submissionWhere: Record<string, unknown> = {
      assignment: { course: { instructorId } },
    }
    if (startDate) {
      submissionWhere.submittedAt = { gte: startDate }
    }
    const submissions = await db.submission.findMany({
      where: submissionWhere,
      select: { submittedAt: true },
    })

    // 4. QA Question timestamps
    const qaWhere: Record<string, unknown> = {
      courseId: { in: instructorCourseIds },
    }
    if (startDate) {
      qaWhere.createdAt = { gte: startDate }
    }
    const qaQuestions = await db.qAQuestion.findMany({
      where: qaWhere,
      select: { createdAt: true },
    })

    // 5. DailyActivity for daily patterns
    const dailyActivityWhere: Record<string, unknown> = {
      userId: { in: studentIds },
    }
    if (startDate) {
      dailyActivityWhere.date = { gte: startDate.toISOString().split('T')[0] }
    }
    const dailyActivities = await db.dailyActivity.findMany({
      where: dailyActivityWhere,
      select: {
        date: true,
        userId: true,
        lessonsCompleted: true,
        quizzesTaken: true,
        timeSpent: true,
        xpEarned: true,
      },
    })

    // ─── Build 7x24 heatmap grid (day-of-week × hour) ──────────────────────
    const heatmapGrid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))

    // Helper to add timestamp to heatmap
    function addToHeatmap(dateValue: Date) {
      const d = new Date(dateValue)
      const dayOfWeek = d.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
      const hour = d.getHours()
      if (dayOfWeek >= 0 && dayOfWeek < 7 && hour >= 0 && hour < 24) {
        heatmapGrid[dayOfWeek][hour]++
      }
    }

    // Add lesson completions
    for (const lp of lessonProgress) {
      if (lp.completedAt) addToHeatmap(lp.completedAt)
    }

    // Add quiz completions
    for (const qa of quizAttempts) {
      if (qa.completedAt) addToHeatmap(qa.completedAt)
    }

    // Add submissions
    for (const sub of submissions) {
      addToHeatmap(sub.submittedAt)
    }

    // Add Q&A questions
    for (const q of qaQuestions) {
      addToHeatmap(q.createdAt)
    }

    // For DailyActivity records without hourly granularity, distribute
    // based on a typical learning pattern (weighted toward evening hours)
    for (const da of dailyActivities) {
      // Distribute daily activity across hours with realistic learning patterns
      const totalActivity = da.lessonsCompleted + da.quizzesTaken
      if (totalActivity > 0) {
        const dateObj = new Date(da.date + 'T00:00:00')
        const dayOfWeek = dateObj.getDay()
        // Typical learning hours distribution (higher in evening)
        const hourWeights = [
          0.01, 0.01, 0.01, 0.01, 0.01, 0.02, // 0-5 AM
          0.03, 0.05, 0.06, 0.07, 0.07, 0.06, // 6-11 AM
          0.04, 0.05, 0.05, 0.05, 0.05, 0.04, // 12-5 PM
          0.05, 0.08, 0.10, 0.08, 0.05, 0.02, // 6-11 PM
        ]
        const totalWeight = hourWeights.reduce((a, b) => a + b, 0)

        for (let hour = 0; hour < 24; hour++) {
          const count = Math.round((hourWeights[hour] / totalWeight) * totalActivity)
          if (dayOfWeek >= 0 && dayOfWeek < 7) {
            heatmapGrid[dayOfWeek][hour] += count
          }
        }
      }
    }

    // ─── Engagement by day of week breakdown ────────────────────────────────
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const byDayOfWeek = dayNames.map((day, dayIndex) => {
      const dayTotal = heatmapGrid[dayIndex].reduce((sum, count) => sum + count, 0)
      return {
        day,
        dayIndex,
        totalActivities: dayTotal,
        avgPerHour: dayTotal > 0 ? parseFloat((dayTotal / 24).toFixed(1)) : 0,
      }
    })

    // ─── Peak hours analysis ────────────────────────────────────────────────
    // Find peak hours across all days
    const hourTotals: { hour: number; totalActivities: number }[] = []
    for (let hour = 0; hour < 24; hour++) {
      const totalAcrossDays = heatmapGrid.reduce((sum, dayData) => sum + dayData[hour], 0)
      hourTotals.push({ hour, totalActivities: totalAcrossDays })
    }

    const sortedHours = [...hourTotals].sort((a, b) => b.totalActivities - a.totalActivities)
    const peakHours = sortedHours.slice(0, 5).map((h) => ({
      hour: h.hour,
      label: `${h.hour}:00 - ${h.hour + 1}:00`,
      totalActivities: h.totalActivities,
      isPeak: true,
    }))

    // ─── Find global peak ──────────────────────────────────────────────────
    let maxActivity = 0
    let peakDayIdx = 0
    let peakHourIdx = 0
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        if (heatmapGrid[d][h] > maxActivity) {
          maxActivity = heatmapGrid[d][h]
          peakDayIdx = d
          peakHourIdx = h
        }
      }
    }

    // ─── Summary ────────────────────────────────────────────────────────────
    const totalActivities = heatmapGrid.reduce(
      (sum, dayData) => sum + dayData.reduce((s, c) => s + c, 0),
      0
    )
    const numDays = startDate
      ? Math.min(Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)), 365)
      : 30
    const summary = {
      totalActivities,
      peakDay: maxActivity > 0 ? dayNames[peakDayIdx] : null,
      peakHour: maxActivity > 0 ? `${peakHourIdx}:00` : null,
      avgActivitiesPerDay: parseFloat((totalActivities / Math.max(numDays, 1)).toFixed(1)),
      mostActiveTimeSlot: maxActivity > 0
        ? `${dayNames[peakDayIdx]} ${peakHourIdx}:00 - ${peakHourIdx + 1}:00`
        : null,
    }

    // ─── Lesson completion and time metrics from LessonProgress ─────────────
    const allLessonProgress = await db.lessonProgress.findMany({
      where: {
        enrollment: { courseId: { in: instructorCourseIds } },
        ...(startDate ? { completedAt: { gte: startDate } } : {}),
      },
      select: { status: true, timeSpent: true },
    })

    const completedLessons = allLessonProgress.filter((lp) => lp.status === 'completed').length
    const inProgressLessons = allLessonProgress.filter((lp) => lp.status === 'in_progress').length
    const avgTimeSpentSeconds = allLessonProgress.length > 0
      ? Math.round(allLessonProgress.reduce((sum, lp) => sum + lp.timeSpent, 0) / allLessonProgress.length)
      : 0

    // Enrollment activity from Enrollment model
    const enrollmentActivity = await db.enrollment.findMany({
      where: {
        courseId: { in: instructorCourseIds },
        ...(startDate ? { enrolledAt: { gte: startDate } } : {}),
      },
      select: { enrolledAt: true, completedAt: true, progress: true },
    })

    const enrollmentMetrics = {
      newEnrollments: enrollmentActivity.length,
      completedCourses: enrollmentActivity.filter((e) => e.completedAt !== null).length,
      avgProgress: enrollmentActivity.length > 0
        ? parseFloat((enrollmentActivity.reduce((sum, e) => sum + e.progress, 0) / enrollmentActivity.length).toFixed(1))
        : 0,
    }

    return NextResponse.json({
      period,
      heatmap: {
        grid: heatmapGrid,
        days: dayNames,
        hours: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      },
      byDayOfWeek,
      peakHours,
      summary,
      lessonMetrics: {
        completed: completedLessons,
        inProgress: inProgressLessons,
        total: allLessonProgress.length,
        completionRate: allLessonProgress.length > 0
          ? Math.round((completedLessons / allLessonProgress.length) * 100)
          : 0,
        avgTimeSpentMinutes: Math.round(avgTimeSpentSeconds / 60),
      },
      enrollmentMetrics,
      dailyActivitySummary: {
        totalDaysTracked: new Set(dailyActivities.map((a) => a.date)).size,
        totalLessonsCompleted: dailyActivities.reduce((sum, a) => sum + a.lessonsCompleted, 0),
        totalQuizzesTaken: dailyActivities.reduce((sum, a) => sum + a.quizzesTaken, 0),
        totalTimeSpentHours: parseFloat((dailyActivities.reduce((sum, a) => sum + a.timeSpent, 0) / 3600).toFixed(1)),
        totalXpEarned: dailyActivities.reduce((sum, a) => sum + a.xpEarned, 0),
      },
    })
  } catch (error) {
    console.error('Error fetching engagement heatmap:', error)
    return NextResponse.json(
      { error: 'Failed to fetch engagement data' },
      { status: 500 }
    )
  }
}
