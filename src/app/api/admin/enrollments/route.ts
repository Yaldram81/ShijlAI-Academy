import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

// GET /api/admin/enrollments - Get filtered enrollment data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const period = searchParams.get('period') || 'all'
    const category = searchParams.get('category') || undefined
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || undefined
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)))

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

    // ===== Build date range filter =====
    const now = new Date()
    let dateFilter: Prisma.DateTimeFilter | undefined

    switch (period) {
      case '7d': {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilter = { gte: start }
        break
      }
      case '30d': {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        dateFilter = { gte: start }
        break
      }
      case '3m': {
        const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        dateFilter = { gte: start }
        break
      }
      case 'all':
      default:
        dateFilter = undefined
        break
    }

    // ===== Build where conditions =====
    const whereConditions: Prisma.EnrollmentWhereInput = {}

    // Date filter
    if (dateFilter) {
      whereConditions.enrolledAt = dateFilter
    }

    // Status filter
    if (status && status !== 'all') {
      whereConditions.status = status
    }

    // Category filter through course relation
    if (category) {
      whereConditions.course = { category }
    }

    // Search filter on user name (case-insensitive contains)
    if (search) {
      whereConditions.user = {
        name: { contains: search },
      }
    }

    // ===== Count total for pagination =====
    const total = await db.enrollment.count({ where: whereConditions })
    const totalPages = Math.max(1, Math.ceil(total / limit))

    // ===== Fetch paginated enrollments =====
    const enrollments = await db.enrollment.findMany({
      where: whereConditions,
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, category: true, price: true } },
      },
      orderBy: { enrolledAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // ===== Get transaction data for revenue =====
    const courseIds = [...new Set(enrollments.map((e) => e.courseId))]
    const transactions = courseIds.length > 0
      ? await db.transaction.findMany({
          where: {
            courseId: { in: courseIds },
            type: 'enrollment',
            status: 'completed',
          },
          select: {
            courseId: true,
            studentId: true,
            amount: true,
          },
        })
      : []

    // Build a map for revenue lookup: `${courseId}-${studentId}` -> amount
    const revenueMap = new Map<string, number>()
    for (const txn of transactions) {
      if (txn.courseId && txn.studentId) {
        const key = `${txn.courseId}-${txn.studentId}`
        revenueMap.set(key, txn.amount)
      }
    }

    // ===== Format enrollments =====
    const formattedEnrollments = enrollments.map((enrollment) => {
      const revenueKey = `${enrollment.courseId}-${enrollment.userId}`
      const revenue = revenueMap.get(revenueKey) ?? enrollment.course.price

      return {
        id: enrollment.id,
        studentName: enrollment.user.name,
        studentEmail: enrollment.user.email,
        courseTitle: enrollment.course.title,
        category: enrollment.course.category,
        progress: Math.round(enrollment.progress),
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        lastAccessed: enrollment.lastAccessed.toISOString(),
        revenue,
      }
    })

    // ===== Summary stats (regardless of filters) =====
    const allEnrollmentsForSummary = await db.enrollment.findMany({
      select: { status: true, progress: true, courseId: true, userId: true },
    })

    const totalEnrollments = allEnrollmentsForSummary.length
    const activeEnrollments = allEnrollmentsForSummary.filter(
      (e) => e.status === 'active'
    ).length
    const completedEnrollments = allEnrollmentsForSummary.filter(
      (e) => e.status === 'completed'
    ).length

    // Total revenue from all completed transactions
    const allTransactions = await db.transaction.findMany({
      where: { type: 'enrollment', status: 'completed' },
      select: { amount: true },
    })
    const totalRevenue = allTransactions.reduce((sum, t) => sum + t.amount, 0)

    // Average completion rate
    const avgCompletionRate = allEnrollmentsForSummary.length > 0
      ? Math.round(
          allEnrollmentsForSummary.reduce((sum, e) => sum + e.progress, 0) /
          allEnrollmentsForSummary.length
        )
      : 0

    const summary = {
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      totalRevenue,
      avgCompletionRate,
    }

    return NextResponse.json({
      enrollments: formattedEnrollments,
      total,
      page,
      totalPages,
      summary,
    })
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
  }
}
