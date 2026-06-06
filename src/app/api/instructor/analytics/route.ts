import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/analytics - Enterprise-level analytics for instructors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, all

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
    let periodDays = 30
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        periodDays = 7
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        periodDays = 30
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        periodDays = 90
        break
      case 'all':
      default:
        startDate = null
        periodDays = 365
        break
    }

    // Previous period dates for comparison
    const prevStartDate = startDate
      ? new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000)
      : null

    // Get all courses for this instructor
    const instructorCourses = await db.course.findMany({
      where: { instructorId },
      include: {
        modules: {
          include: {
            lessons: {
              select: { id: true, title: true, duration: true, order: true },
            },
          },
          orderBy: { order: 'asc' },
        },
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                xp: true,
                level: true,
                lastActiveAt: true,
              },
            },
            lessonProgress: {
              select: {
                lessonId: true,
                timeSpent: true,
                status: true,
                completedAt: true,
              },
            },
          },
          orderBy: { enrolledAt: 'asc' },
        },
        quizzes: {
          include: {
            questions: { select: { id: true } },
            attempts: {
              select: {
                userId: true,
                score: true,
                maxScore: true,
                percentage: true,
                passed: true,
                completedAt: true,
                startedAt: true,
              },
            },
          },
        },
        assignments: {
          select: {
            id: true,
            type: true,
            isPublished: true,
            maxScore: true,
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            content: true,
            createdAt: true,
            userId: true,
            user: {
              select: { id: true, name: true },
            },
            isAnonymous: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (instructorCourses.length === 0) {
      return NextResponse.json({
        overview: {
          totalStudents: 0,
          totalRevenue: 0,
          avgRating: 0,
          completionRate: 0,
          totalCourses: 0,
          publishedCourses: 0,
          draftCourses: 0,
        },
        revenueOverTime: [],
        enrollmentOverTime: [],
        coursePerformance: [],
        studentDistribution: {
          excellent: 0,
          good: 0,
          average: 0,
          needsImprovement: 0,
        },
        quizAnalytics: {
          totalQuizzes: 0,
          totalAttempts: 0,
          avgPassRate: 0,
          avgScore: 0,
          quizzesByType: [],
        },
        assignmentAnalytics: {
          totalAssignments: 0,
          submissionRate: 0,
          avgScore: 0,
          byType: [],
        },
        topPerformingStudents: [],
        engagementMetrics: {
          avgDailyActiveStudents: 0,
          avgTimeSpentPerStudent: 0,
          avgLessonsCompletedPerDay: 0,
        },
        categoryBreakdown: [],
        comparison: {
          totalStudents: { current: 0, previous: 0, change: 0, changePercent: 0 },
          totalRevenue: { current: 0, previous: 0, change: 0, changePercent: 0 },
          avgRating: { current: 0, previous: 0, change: 0, changePercent: 0 },
          completionRate: { current: 0, previous: 0, change: 0, changePercent: 0 },
          publishedCourses: { current: 0, previous: 0, change: 0, changePercent: 0 },
        },
        retentionMetrics: {
          activeStudents: 0,
          returningStudents: 0,
          churnedStudents: 0,
          retentionRate: 0,
          avgTimeToComplete: 0,
        },
        lessonDropoff: [],
        reviewAnalytics: {
          totalReviews: 0,
          avgRating: 0,
          ratingDistribution: [],
          recentReviews: [],
          sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        },
        enrollmentForecast: [],
        revenueBreakdown: [],
        liveSessionAnalytics: {
          totalSessions: 0,
          totalAttendees: 0,
          avgAttendanceRate: 0,
          byType: [],
        },
      })
    }

    // ========== OVERVIEW ==========
    const totalCourses = instructorCourses.length
    const publishedCourses = instructorCourses.filter((c) => c.isPublished && !c.isArchived).length
    const draftCourses = instructorCourses.filter((c) => !c.isPublished && !c.isArchived).length

    // Unique students across all courses
    const studentSet = new Set<string>()
    for (const course of instructorCourses) {
      for (const enrollment of course.enrollments) {
        studentSet.add(enrollment.userId)
      }
    }
    const totalStudents = studentSet.size

    // Total revenue from actual transactions
    const transactions = await db.transaction.findMany({
      where: {
        instructorId,
        type: { in: ['enrollment', 'refund'] },
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      },
      select: { amount: true, type: true, courseId: true, createdAt: true },
    })
    const enrollmentTxns = transactions.filter(t => t.type === 'enrollment')
    const refundTxns = transactions.filter(t => t.type === 'refund')
    const totalRevenue = enrollmentTxns.reduce((sum, t) => sum + t.amount, 0) - refundTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0)

    // Average rating
    const avgRating = totalCourses > 0
      ? parseFloat((instructorCourses.reduce((acc, c) => acc + c.rating, 0) / totalCourses).toFixed(1))
      : 0

    // Completion rate (across all enrollments)
    const allEnrollments = instructorCourses.flatMap((c) => c.enrollments)
    const completedEnrollments = allEnrollments.filter((e) => e.completedAt !== null)
    const completionRate = allEnrollments.length > 0
      ? Math.round((completedEnrollments.length / allEnrollments.length) * 100)
      : 0

    const overview = {
      totalStudents,
      totalRevenue,
      avgRating,
      completionRate,
      totalCourses,
      publishedCourses,
      draftCourses,
    }

    // ========== REVENUE OVER TIME ==========
    const revenueByDate = new Map<string, number>()
    for (const t of enrollmentTxns) {
      const dateKey = new Date(t.createdAt).toISOString().split('T')[0]
      revenueByDate.set(dateKey, (revenueByDate.get(dateKey) || 0) + t.amount)
    }
    for (const t of refundTxns) {
      const dateKey = new Date(t.createdAt).toISOString().split('T')[0]
      revenueByDate.set(dateKey, (revenueByDate.get(dateKey) || 0) - Math.abs(t.amount))
    }
    const revenueOverTime = Array.from(revenueByDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }))

    // Calculate cumulative revenue properly
    let cumulativeRevenue = 0
    const revenueOverTimeFinal = revenueOverTime.map((entry) => {
      cumulativeRevenue += entry.revenue
      return { ...entry, cumulative: cumulativeRevenue }
    })

    // ========== ENROLLMENT OVER TIME ==========
    const enrollmentByDate = new Map<string, number>()
    for (const course of instructorCourses) {
      for (const enrollment of course.enrollments) {
        const dateKey = new Date(enrollment.enrolledAt).toISOString().split('T')[0]
        if (startDate && new Date(enrollment.enrolledAt) < startDate) continue
        const existing = enrollmentByDate.get(dateKey) || 0
        enrollmentByDate.set(dateKey, existing + 1)
      }
    }
    let cumulativeEnrollments = 0
    const enrollmentOverTime = Array.from(enrollmentByDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, enrollments]) => {
        cumulativeEnrollments += enrollments
        return { date, enrollments, cumulative: cumulativeEnrollments }
      })

    // ========== COURSE PERFORMANCE ==========
    const coursePerformance = instructorCourses.map((course) => {
      const enrollmentCount = course.enrollments.length
      const completionRate = enrollmentCount > 0
        ? Math.round((course.enrollments.filter((e) => e.completedAt !== null).length / enrollmentCount) * 100)
        : 0
      const avgScore = enrollmentCount > 0
        ? Math.round(course.enrollments.reduce((acc, e) => acc + e.progress, 0) / enrollmentCount)
        : 0
      const courseRevenueTxns = enrollmentTxns.filter(t => t.courseId === course.id)
      const courseRefundTxns = refundTxns.filter(t => t.courseId === course.id)
      const revenue = courseRevenueTxns.reduce((sum, t) => sum + t.amount, 0) - courseRefundTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0)

      return {
        courseId: course.id,
        title: course.title,
        category: course.category,
        enrollmentCount,
        completionRate,
        avgScore,
        revenue,
        rating: course.rating,
      }
    })

    // ========== STUDENT DISTRIBUTION ==========
    const studentProgressMap = new Map<string, number[]>()
    for (const course of instructorCourses) {
      for (const enrollment of course.enrollments) {
        const existing = studentProgressMap.get(enrollment.userId) || []
        existing.push(enrollment.progress)
        studentProgressMap.set(enrollment.userId, existing)
      }
    }

    let excellent = 0
    let good = 0
    let average = 0
    let needsImprovement = 0

    for (const progresses of studentProgressMap.values()) {
      const avgProg = progresses.reduce((a, b) => a + b, 0) / progresses.length
      if (avgProg >= 90) excellent++
      else if (avgProg >= 70) good++
      else if (avgProg >= 40) average++
      else needsImprovement++
    }

    const studentDistribution = { excellent, good, average, needsImprovement }

    // ========== QUIZ ANALYTICS ==========
    const allQuizzes = instructorCourses.flatMap((c) => c.quizzes)
    const totalQuizzes = allQuizzes.length
    const allAttempts = allQuizzes.flatMap((q) => q.attempts)
    const completedAttempts = allAttempts.filter((a) => a.completedAt !== null)

    const periodCompletedAttempts = startDate
      ? completedAttempts.filter((a) => a.completedAt && new Date(a.completedAt) >= startDate)
      : completedAttempts

    const totalAttemptsCount = periodCompletedAttempts.length
    const passedAttempts = periodCompletedAttempts.filter((a) => a.passed)
    const avgPassRate = totalAttemptsCount > 0
      ? Math.round((passedAttempts.length / totalAttemptsCount) * 100)
      : 0
    const avgQuizScore = totalAttemptsCount > 0
      ? Math.round(periodCompletedAttempts.reduce((acc, a) => acc + a.percentage, 0) / totalAttemptsCount)
      : 0

    const quizTypeMap = new Map<string, number>()
    for (const quiz of allQuizzes) {
      const count = quizTypeMap.get(quiz.type) || 0
      quizTypeMap.set(quiz.type, count + 1)
    }
    const quizzesByType = Array.from(quizTypeMap.entries()).map(([type, count]) => ({ type, count }))

    const quizAnalytics = {
      totalQuizzes,
      totalAttempts: totalAttemptsCount,
      avgPassRate,
      avgScore: avgQuizScore,
      quizzesByType,
    }

    // ========== ASSIGNMENT ANALYTICS ==========
    const allAssignments = instructorCourses.flatMap((c) => c.assignments)
    const totalAssignments = allAssignments.length

    const totalEnrollmentsForAssignments = instructorCourses.reduce(
      (acc, c) => acc + c.enrollments.length,
      0
    )
    const submissionRate = totalAssignments > 0 && totalEnrollmentsForAssignments > 0
      ? Math.round((totalEnrollmentsForAssignments / (totalAssignments * totalStudents || 1)) * 100)
      : 0

    const assignmentTypeMap = new Map<string, number>()
    for (const assignment of allAssignments) {
      const count = assignmentTypeMap.get(assignment.type) || 0
      assignmentTypeMap.set(assignment.type, count + 1)
    }
    const assignmentByType = Array.from(assignmentTypeMap.entries()).map(([type, count]) => ({ type, count }))

    const assignmentAnalytics = {
      totalAssignments,
      submissionRate: Math.min(submissionRate, 100),
      avgScore: 0,
      byType: assignmentByType,
    }

    // ========== TOP PERFORMING STUDENTS ==========
    const studentDataMap = new Map<string, {
      name: string
      xp: number
      coursesCompleted: number
      avgScore: number
      totalProgress: number
      enrollmentCount: number
    }>()

    for (const course of instructorCourses) {
      for (const enrollment of course.enrollments) {
        const existing = studentDataMap.get(enrollment.userId) || {
          name: enrollment.user.name,
          xp: enrollment.user.xp,
          coursesCompleted: 0,
          avgScore: 0,
          totalProgress: 0,
          enrollmentCount: 0,
        }
        existing.totalProgress += enrollment.progress
        existing.enrollmentCount++
        if (enrollment.completedAt) existing.coursesCompleted++
        if (enrollment.user.xp > existing.xp) existing.xp = enrollment.user.xp
        studentDataMap.set(enrollment.userId, existing)
      }
    }

    for (const [userId, data] of studentDataMap) {
      data.avgScore = data.enrollmentCount > 0
        ? Math.round(data.totalProgress / data.enrollmentCount)
        : 0
      studentDataMap.set(userId, data)
    }

    const topPerformingStudents = Array.from(studentDataMap.values())
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 10)
      .map((s) => ({
        name: s.name,
        xp: s.xp,
        coursesCompleted: s.coursesCompleted,
        avgScore: s.avgScore,
      }))

    // ========== ENGAGEMENT METRICS ==========
    const studentIds = Array.from(studentSet)
    const activityWhere: Record<string, unknown> = {
      userId: { in: studentIds },
    }
    if (startDate) {
      activityWhere.date = { gte: startDate.toISOString().split('T')[0] }
    }

    const dailyActivities = await db.dailyActivity.findMany({
      where: activityWhere,
      select: {
        date: true,
        userId: true,
        timeSpent: true,
        lessonsCompleted: true,
      },
    })

    const uniqueActiveDays = new Set(dailyActivities.map((a) => a.date))
    const numDays = uniqueActiveDays.size || 1

    const studentsPerDay = new Map<string, Set<string>>()
    for (const activity of dailyActivities) {
      if (!studentsPerDay.has(activity.date)) {
        studentsPerDay.set(activity.date, new Set())
      }
      studentsPerDay.get(activity.date)!.add(activity.userId)
    }
    const totalActiveStudentsPerDay = Array.from(studentsPerDay.values())
    const avgDailyActiveStudents = totalActiveStudentsPerDay.length > 0
      ? Math.round(totalActiveStudentsPerDay.reduce((acc, s) => acc + s.size, 0) / totalActiveStudentsPerDay.length)
      : 0

    const totalTimeSpent = dailyActivities.reduce((acc, a) => acc + a.timeSpent, 0)
    const avgTimeSpentPerStudent = totalStudents > 0
      ? Math.round(totalTimeSpent / totalStudents)
      : 0

    const totalLessonsCompleted = dailyActivities.reduce((acc, a) => acc + a.lessonsCompleted, 0)
    const avgLessonsCompletedPerDay = parseFloat((totalLessonsCompleted / numDays).toFixed(1))

    const engagementMetrics = {
      avgDailyActiveStudents,
      avgTimeSpentPerStudent,
      avgLessonsCompletedPerDay,
    }

    // ========== CATEGORY BREAKDOWN ==========
    const categoryMap = new Map<string, {
      category: string
      courseCount: number
      studentCount: number
      totalRating: number
      coursesWithRating: number
    }>()

    for (const course of instructorCourses) {
      const existing = categoryMap.get(course.category) || {
        category: course.category,
        courseCount: 0,
        studentCount: 0,
        totalRating: 0,
        coursesWithRating: 0,
      }
      existing.courseCount++
      existing.studentCount += course.enrollments.length
      if (course.rating > 0) {
        existing.totalRating += course.rating
        existing.coursesWithRating++
      }
      categoryMap.set(course.category, existing)
    }

    const categoryBreakdown = Array.from(categoryMap.values()).map((data) => ({
      category: data.category,
      courseCount: data.courseCount,
      studentCount: data.studentCount,
      avgRating: data.coursesWithRating > 0
        ? parseFloat((data.totalRating / data.coursesWithRating).toFixed(1))
        : 0,
    }))

    // ========== NEW: COMPARISON DATA (Previous Period) ==========
    const prevEnrollments = allEnrollments.filter((e) => {
      if (!prevStartDate || !startDate) return false
      const enrolledAt = new Date(e.enrolledAt)
      return enrolledAt >= prevStartDate && enrolledAt < startDate
    })

    const prevStudentSet = new Set<string>()
    for (const e of prevEnrollments) {
      prevStudentSet.add(e.userId)
    }
    const prevTotalStudents = prevStudentSet.size

    // Previous period revenue from transactions
    const prevTransactions = await db.transaction.findMany({
      where: {
        instructorId,
        type: { in: ['enrollment', 'refund'] },
        ...(prevStartDate && startDate ? { createdAt: { gte: prevStartDate, lt: startDate } } : {}),
      },
      select: { amount: true, type: true },
    })
    let prevTotalRevenue = prevTransactions.filter(t => t.type === 'enrollment').reduce((sum, t) => sum + t.amount, 0)
      - prevTransactions.filter(t => t.type === 'refund').reduce((sum, t) => sum + Math.abs(t.amount), 0)

    // Previous avg rating (courses that existed in previous period)
    const prevAvgRating = totalCourses > 0
      ? parseFloat((instructorCourses.reduce((acc, c) => acc + c.rating, 0) / totalCourses).toFixed(1))
      : 0

    // Previous completion rate
    const prevCompletedEnrollments = prevEnrollments.filter((e) => e.completedAt !== null)
    const prevCompletionRate = prevEnrollments.length > 0
      ? Math.round((prevCompletedEnrollments.length / prevEnrollments.length) * 100)
      : 0

    // Previous published courses (same as current since we can't track history)
    const prevPublishedCourses = publishedCourses

    // Compute change
    function computeChange(current: number, previous: number) {
      const change = current - previous
      const changePercent = previous !== 0 ? parseFloat(((change / previous) * 100).toFixed(1)) : (current !== 0 ? 100 : 0)
      return { current, previous, change, changePercent }
    }

    const comparison = {
      totalStudents: computeChange(totalStudents, prevTotalStudents),
      totalRevenue: computeChange(totalRevenue, prevTotalRevenue),
      avgRating: computeChange(avgRating, prevAvgRating),
      completionRate: computeChange(completionRate, prevCompletionRate),
      publishedCourses: computeChange(publishedCourses, prevPublishedCourses),
    }

    // ========== NEW: RETENTION METRICS ==========
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Active students: with activity in last 7 days
    const recentActivities = await db.dailyActivity.findMany({
      where: {
        userId: { in: studentIds },
        date: { gte: sevenDaysAgo.toISOString().split('T')[0] },
      },
      select: { userId: true },
    })
    const activeStudents = new Set(recentActivities.map((a) => a.userId)).size

    // Returning students: enrolled in >1 course
    const studentEnrollmentCount = new Map<string, number>()
    for (const course of instructorCourses) {
      for (const enrollment of course.enrollments) {
        const count = studentEnrollmentCount.get(enrollment.userId) || 0
        studentEnrollmentCount.set(enrollment.userId, count + 1)
      }
    }
    const returningStudents = Array.from(studentEnrollmentCount.values()).filter((c) => c > 1).length

    // Churned students: no activity in 30+ days
    const recent30DayActivities = await db.dailyActivity.findMany({
      where: {
        userId: { in: studentIds },
        date: { gte: thirtyDaysAgo.toISOString().split('T')[0] },
      },
      select: { userId: true },
    })
    const activeIn30Days = new Set(recent30DayActivities.map((a) => a.userId))
    // Also check lastActiveAt on user model
    const churnedStudents = studentIds.filter((id) => !activeIn30Days.has(id)).length

    // Retention rate
    const retentionRate = totalStudents > 0
      ? parseFloat(((activeStudents / totalStudents) * 100).toFixed(1))
      : 0

    // Average time to complete a course (days between enrollment and completion)
    const completedWithDates = allEnrollments.filter(
      (e) => e.completedAt && e.enrolledAt
    )
    const avgTimeToComplete = completedWithDates.length > 0
      ? Math.round(
          completedWithDates.reduce((acc, e) => {
            const days = (new Date(e.completedAt!).getTime() - new Date(e.enrolledAt).getTime()) / (1000 * 60 * 60 * 24)
            return acc + days
          }, 0) / completedWithDates.length
        )
      : 0

    const retentionMetrics = {
      activeStudents,
      returningStudents,
      churnedStudents,
      retentionRate,
      avgTimeToComplete,
    }

    // ========== NEW: LESSON DROP-OFF ANALYSIS ==========
    const lessonDropoff = instructorCourses.map((course) => {
      const enrollmentCount = course.enrollments.length

      const modulesData = course.modules
        .sort((a, b) => a.order - b.order)
        .map((mod) => {
          const lessonCount = mod.lessons.length

          // For each enrollment, check how many lessons in this module are completed
          let totalCompletedLessons = 0
          let totalLessonsForModule = 0

          for (const enrollment of course.enrollments) {
            for (const lesson of mod.lessons) {
              totalLessonsForModule++
              const lp = enrollment.lessonProgress.find(
                (p) => p.lessonId === lesson.id && p.status === 'completed'
              )
              if (lp) totalCompletedLessons++
            }
          }

          const avgCompletionRate = totalLessonsForModule > 0
            ? Math.round((totalCompletedLessons / totalLessonsForModule) * 100)
            : 0

          // Drop-off rate: students who completed earlier modules but not this one
          // Approximate: percentage of enrolled students who did NOT complete any lesson in this module
          let studentsWithCompletion = 0
          for (const enrollment of course.enrollments) {
            const hasCompletedAny = mod.lessons.some((lesson) =>
              enrollment.lessonProgress.some(
                (p) => p.lessonId === lesson.id && p.status === 'completed'
              )
            )
            if (hasCompletedAny) studentsWithCompletion++
          }

          const dropoffRate = enrollmentCount > 0
            ? Math.round(((enrollmentCount - studentsWithCompletion) / enrollmentCount) * 100)
            : 0

          return {
            moduleId: mod.id,
            moduleTitle: mod.title,
            order: mod.order,
            lessonCount,
            avgCompletionRate,
            dropoffRate,
          }
        })

      return {
        courseId: course.id,
        courseTitle: course.title,
        modules: modulesData,
      }
    })

    // ========== NEW: REVIEW ANALYTICS ==========
    const allReviews = instructorCourses.flatMap((c) => c.reviews)
    const totalReviews = allReviews.length
    const reviewAvgRating = totalReviews > 0
      ? parseFloat((allReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
      : 0

    // Rating distribution (1-5 stars)
    const ratingDistMap = new Map<number, number>()
    for (let i = 1; i <= 5; i++) ratingDistMap.set(i, 0)
    for (const review of allReviews) {
      ratingDistMap.set(review.rating, (ratingDistMap.get(review.rating) || 0) + 1)
    }
    const ratingDistribution = Array.from(ratingDistMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([rating, count]) => ({ rating, count }))

    // Recent reviews (last 10)
    const recentReviews = allReviews
      .slice(0, 10)
      .map((r) => ({
        id: r.id,
        courseTitle: instructorCourses.find((c) => c.reviews.some((rev) => rev.id === r.id))?.title || '',
        rating: r.rating,
        content: r.content || '',
        userName: r.isAnonymous ? 'Anonymous' : r.user.name,
        createdAt: r.createdAt.toISOString(),
      }))

    // Sentiment breakdown (simple heuristic based on rating)
    const positive = allReviews.filter((r) => r.rating >= 4).length
    const negative = allReviews.filter((r) => r.rating <= 2).length
    const neutral = totalReviews - positive - negative
    const sentimentBreakdown = { positive, neutral, negative }

    const reviewAnalytics = {
      totalReviews,
      avgRating: reviewAvgRating,
      ratingDistribution,
      recentReviews,
      sentimentBreakdown,
    }

    // ========== NEW: ENROLLMENT FORECAST ==========
    // Simple linear projection based on recent enrollment trend
    // Use daily enrollment data to fit a simple linear model
    const allEnrollmentDates = allEnrollments
      .map((e) => new Date(e.enrolledAt).toISOString().split('T')[0])
      .sort()

    // Group enrollments by date for the last 30 days
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recentEnrollmentByDate = new Map<string, number>()
    for (const enrollment of allEnrollments) {
      const dateKey = new Date(enrollment.enrolledAt).toISOString().split('T')[0]
      if (new Date(dateKey) >= last30Days) {
        recentEnrollmentByDate.set(dateKey, (recentEnrollmentByDate.get(dateKey) || 0) + 1)
      }
    }

    // Fill in missing dates with 0
    const forecastDays = 14
    const historicalDays = 30
    const dailyValues: { day: number; count: number }[] = []
    for (let i = 0; i < historicalDays; i++) {
      const date = new Date(last30Days.getTime() + i * 24 * 60 * 60 * 1000)
      const dateKey = date.toISOString().split('T')[0]
      dailyValues.push({ day: i, count: recentEnrollmentByDate.get(dateKey) || 0 })
    }

    // Simple linear regression: y = mx + b
    const n = dailyValues.length
    const sumX = dailyValues.reduce((acc, d) => acc + d.day, 0)
    const sumY = dailyValues.reduce((acc, d) => acc + d.count, 0)
    const sumXY = dailyValues.reduce((acc, d) => acc + d.day * d.count, 0)
    const sumX2 = dailyValues.reduce((acc, d) => acc + d.day * d.day, 0)

    const slope = n > 0 && (n * sumX2 - sumX * sumX) !== 0
      ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
      : 0
    const intercept = n > 0 ? (sumY - slope * sumX) / n : 0

    // Standard error for confidence interval
    const residuals = dailyValues.map((d) => {
      const predicted = slope * d.day + intercept
      return d.count - predicted
    })
    const sse = residuals.reduce((acc, r) => acc + r * r, 0)
    const stdError = n > 2 ? Math.sqrt(sse / (n - 2)) : 0
    const tValue = 1.96 // 95% confidence

    const enrollmentForecast: Array<{ date: string; projected: number; lower: number; upper: number }> = []
    for (let i = 1; i <= forecastDays; i++) {
      const dayIndex = historicalDays + i - 1
      const projected = Math.max(0, Math.round(slope * dayIndex + intercept))
      const margin = Math.round(tValue * stdError * Math.sqrt(1 + 1 / n))
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
      enrollmentForecast.push({
        date: date.toISOString().split('T')[0],
        projected,
        lower: Math.max(0, projected - margin),
        upper: projected + margin,
      })
    }

    // ========== NEW: REVENUE BREAKDOWN BY COURSE ==========
    const revenueBreakdown = instructorCourses
      .map((course) => {
        const enrollmentCount = course.enrollments.length
        const cRevTxns = enrollmentTxns.filter(t => t.courseId === course.id)
        const cRefTxns = refundTxns.filter(t => t.courseId === course.id)
        const revenue = cRevTxns.reduce((sum, t) => sum + t.amount, 0) - cRefTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0)
        return {
          courseId: course.id,
          courseTitle: course.title,
          revenue,
          percentage: totalRevenue > 0 ? parseFloat(((revenue / totalRevenue) * 100).toFixed(1)) : 0,
          enrollmentCount,
          avgPrice: course.price,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)

    // ========== NEW: LIVE SESSION ANALYTICS ==========
    const liveSessions = await db.liveSession.findMany({
      where: { instructorId },
      include: {
        attendees: {
          select: {
            id: true,
            status: true,
            userId: true,
          },
        },
      },
    })

    const totalLiveSessions = liveSessions.length
    const totalAttendees = liveSessions.reduce((acc, s) => acc + s.attendees.length, 0)
    const totalAttended = liveSessions.reduce(
      (acc, s) => acc + s.attendees.filter((a) => a.status === 'attended').length,
      0
    )
    const avgAttendanceRate = totalAttendees > 0
      ? Math.round((totalAttended / totalAttendees) * 100)
      : 0

    // By session type
    const sessionTypeMap = new Map<string, { count: number; totalAttendees: number; totalAttended: number }>()
    for (const session of liveSessions) {
      const existing = sessionTypeMap.get(session.type) || { count: 0, totalAttendees: 0, totalAttended: 0 }
      existing.count++
      existing.totalAttendees += session.attendees.length
      existing.totalAttended += session.attendees.filter((a) => a.status === 'attended').length
      sessionTypeMap.set(session.type, existing)
    }
    const liveSessionByType = Array.from(sessionTypeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      avgAttendance: data.totalAttendees > 0
        ? Math.round((data.totalAttended / data.totalAttendees) * 100)
        : 0,
    }))

    const liveSessionAnalytics = {
      totalSessions: totalLiveSessions,
      totalAttendees,
      avgAttendanceRate,
      byType: liveSessionByType,
    }

    // ========== RETURN ALL DATA ==========
    return NextResponse.json({
      overview,
      revenueOverTime: revenueOverTimeFinal,
      enrollmentOverTime,
      coursePerformance,
      studentDistribution,
      quizAnalytics,
      assignmentAnalytics,
      topPerformingStudents,
      engagementMetrics,
      categoryBreakdown,
      // New enterprise data
      comparison,
      retentionMetrics,
      lessonDropoff,
      reviewAnalytics,
      enrollmentForecast,
      revenueBreakdown,
      liveSessionAnalytics,
    })
  } catch (error) {
    console.error('Error fetching instructor analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
