import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/student-insights - Get student insights for the admin dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Validate user — fallback to first admin if userId not found
    let validatedUser = userId
      ? await db.user.findUnique({ where: { id: userId }, select: { id: true, role: true } })
      : null

    if (!validatedUser) {
      validatedUser = await db.user.findFirst({
        where: { role: 'admin' },
        select: { id: true, role: true },
      })
    }

    if (!validatedUser) {
      return NextResponse.json({ error: 'No admin user found' }, { status: 404 })
    }

    const now = new Date()
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    // ===== New students this month vs last month =====
    const newStudentsThisMonth = await db.user.count({
      where: {
        role: 'student',
        createdAt: { gte: startOfThisMonth },
      },
    })

    const newStudentsLastMonth = await db.user.count({
      where: {
        role: 'student',
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    })

    const newStudentsChange = newStudentsLastMonth > 0
      ? Math.round(((newStudentsThisMonth - newStudentsLastMonth) / newStudentsLastMonth) * 100)
      : newStudentsThisMonth > 0 ? 100 : 0

    // ===== Returning students (2+ enrollments) =====
    const studentsWithMultipleEnrollments = await db.user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        _count: { select: { enrollments: true } },
      },
    })
    const returningStudents = studentsWithMultipleEnrollments.filter(
      (s) => s._count.enrollments >= 2
    ).length

    const totalStudents = studentsWithMultipleEnrollments.length
    const returningPercentage = totalStudents > 0
      ? Math.round((returningStudents / totalStudents) * 100)
      : 0

    // ===== Average sessions per week (last 30 days) =====
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

    const dailyActivities = await db.dailyActivity.findMany({
      where: { date: { gte: thirtyDaysAgoStr } },
      select: { userId: true, date: true },
    })

    // Group by user, then count unique days per user, then average per week (~4.3 weeks in 30 days)
    const userActiveDaysMap = new Map<string, number>()
    for (const activity of dailyActivities) {
      const current = userActiveDaysMap.get(activity.userId) || 0
      userActiveDaysMap.set(activity.userId, current + 1)
    }

    const weeksInPeriod = 30 / 7
    const avgSessionsPerWeek = userActiveDaysMap.size > 0
      ? parseFloat(
          (
            Array.from(userActiveDaysMap.values()).reduce((sum, days) => sum + days, 0) /
            userActiveDaysMap.size /
            weeksInPeriod
          ).toFixed(1)
        )
      : 0

    // ===== Average completion rate =====
    const activeEnrollments = await db.enrollment.findMany({
      where: { status: { in: ['active', 'completed'] } },
      select: { progress: true },
    })

    const avgCompletionRate = activeEnrollments.length > 0
      ? Math.round(
          activeEnrollments.reduce((sum, e) => sum + e.progress, 0) / activeEnrollments.length
        )
      : 0

    // ===== Student segments based on lastActiveAt =====
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const allStudents = await db.user.findMany({
      where: { role: 'student' },
      select: { id: true, lastActiveAt: true },
    })

    let highlyActive = 0
    let regular = 0
    let casual = 0
    let atRisk = 0

    for (const student of allStudents) {
      const lastActive = new Date(student.lastActiveAt)
      if (lastActive >= oneDayAgo) {
        highlyActive++
      } else if (lastActive >= threeDaysAgo) {
        regular++
      } else if (lastActive >= sevenDaysAgo) {
        casual++
      } else if (lastActive < fourteenDaysAgo) {
        atRisk++
      }
      // Students between 7-14 days are not counted in any segment per spec
    }

    const segments = { highlyActive, regular, casual, atRisk }

    // ===== Top learning paths =====
    // Find common enrollment sequences by enrollment date ordering
    const allEnrollments = await db.enrollment.findMany({
      where: { status: { in: ['active', 'completed'] } },
      include: {
        course: { select: { title: true, category: true } },
        user: { select: { id: true } },
      },
      orderBy: { enrolledAt: 'asc' },
    })

    // Group enrollments by user, then extract course sequences
    const userEnrollmentMap = new Map<string, string[]>()
    for (const enrollment of allEnrollments) {
      const existing = userEnrollmentMap.get(enrollment.userId) || []
      existing.push(enrollment.course.title)
      userEnrollmentMap.set(enrollment.userId, existing)
    }

    // Count path frequency (using first 3 courses in sequence)
    const pathCountMap = new Map<string, { courses: string[]; count: number }>()
    for (const courses of userEnrollmentMap.values()) {
      if (courses.length >= 2) {
        // Create paths of length 2-3
        const pathLength = Math.min(courses.length, 3)
        const pathKey = courses.slice(0, pathLength).join(' → ')
        const existing = pathCountMap.get(pathKey)
        if (existing) {
          existing.count++
        } else {
          pathCountMap.set(pathKey, { courses: courses.slice(0, pathLength), count: 1 })
        }
      }
    }

    const topLearningPaths = Array.from(pathCountMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((p) => ({ courses: p.courses, count: p.count }))

    // ===== Monthly trend (last 6 months) =====
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
      const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`

      const monthNewStudents = await db.user.count({
        where: {
          role: 'student',
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      })

      // Returning = students whose first enrollment was before this month but who enrolled in something this month
      const monthEnrollments = await db.enrollment.findMany({
        where: { enrolledAt: { gte: monthStart, lte: monthEnd } },
        select: { userId: true },
      })

      const monthActiveUserIds = new Set(monthEnrollments.map((e) => e.userId))

      let monthReturning = 0
      if (monthActiveUserIds.size > 0) {
        // Check which of these users had enrollments before this month
        const usersWithPriorEnrollments = await db.enrollment.findMany({
          where: {
            userId: { in: Array.from(monthActiveUserIds) },
            enrolledAt: { lt: monthStart },
          },
          select: { userId: true },
          distinct: ['userId'],
        })
        monthReturning = usersWithPriorEnrollments.length
      }

      monthlyTrend.push({
        month: monthKey,
        newStudents: monthNewStudents,
        returningStudents: monthReturning,
      })
    }

    return NextResponse.json({
      newStudentsThisMonth,
      newStudentsChange,
      returningStudents,
      returningPercentage,
      avgSessionsPerWeek,
      avgCompletionRate,
      segments,
      topLearningPaths,
      monthlyTrend,
    })
  } catch (error) {
    console.error('Error fetching student insights:', error)
    return NextResponse.json({ error: 'Failed to fetch student insights' }, { status: 500 })
  }
}
