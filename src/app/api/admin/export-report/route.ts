import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const CURRENCY_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  CAD: 1.36,
}

function convertCurrency(amount: number, currency: string): number {
  const rate = CURRENCY_RATES[currency] ?? 1
  return parseFloat((amount * rate).toFixed(2))
}

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${convertCurrency(amount, currency).toLocaleString()}`
}

// GET /api/admin/export-report - Generate a report for PDF export
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') || 'overview'
    const currency = searchParams.get('currency') || 'USD'

    // Validate currency
    if (!CURRENCY_RATES[currency]) {
      return NextResponse.json(
        { error: `Invalid currency. Supported: ${Object.keys(CURRENCY_RATES).join(', ')}` },
        { status: 400 }
      )
    }

    // Validate type
    if (!['overview', 'enrollments', 'revenue'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid report type. Supported: overview, enrollments, revenue' },
        { status: 400 }
      )
    }

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
    const generatedAt = now.toISOString()

    if (type === 'overview') {
      return await generateOverviewReport(currency, generatedAt)
    } else if (type === 'enrollments') {
      return await generateEnrollmentsReport(currency, generatedAt)
    } else {
      return await generateRevenueReport(currency, generatedAt)
    }
  } catch (error) {
    console.error('Error generating export report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}

async function generateOverviewReport(currency: string, generatedAt: string) {
  // ===== Stats =====
  const totalUsers = await db.user.count()
  const totalStudents = await db.user.count({ where: { role: 'student' } })
  const totalInstructors = await db.user.count({ where: { role: 'instructor' } })
  const totalCourses = await db.course.count({ where: { isPublished: true } })
  const totalEnrollments = await db.enrollment.count()
  const totalCertificates = await db.certificate.count()

  // Revenue
  const allTransactions = await db.transaction.findMany({
    where: { type: 'enrollment', status: 'completed' },
    select: { amount: true },
  })
  const totalRevenue = allTransactions.reduce((sum, t) => sum + t.amount, 0)

  // ===== Popular courses =====
  const popularCourses = await db.course.findMany({
    where: { isPublished: true },
    select: {
      title: true,
      category: true,
      enrollmentCount: true,
      rating: true,
      price: true,
    },
    orderBy: { enrollmentCount: 'desc' },
    take: 10,
  })

  const formattedPopularCourses = popularCourses.map((course) => ({
    title: course.title,
    category: course.category,
    enrollmentCount: course.enrollmentCount,
    rating: course.rating,
    price: convertCurrency(course.price, currency),
    priceFormatted: formatCurrency(course.price, currency),
  }))

  // ===== Revenue breakdown by category (using actual Transaction data) =====
  const transactionsWithCourse = await db.transaction.findMany({
    where: { type: 'enrollment', status: 'completed' },
    include: { course: { select: { category: true } } },
  })

  const categoryRevenueMap = new Map<string, { revenue: number; enrollments: number }>()
  for (const txn of transactionsWithCourse) {
    const category = txn.course?.category || 'Uncategorized'
    const existing = categoryRevenueMap.get(category) || { revenue: 0, enrollments: 0 }
    existing.revenue += txn.amount
    existing.enrollments += 1
    categoryRevenueMap.set(category, existing)
  }

  const revenueBreakdown = Array.from(categoryRevenueMap.entries()).map(
    ([category, data]) => ({
      category,
      revenue: convertCurrency(data.revenue, currency),
      revenueFormatted: formatCurrency(data.revenue, currency),
      enrollments: data.enrollments,
    })
  )

  // ===== Recent signups (last 30 days) =====
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const recentSignups = await db.user.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: {
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const formattedRecentSignups = recentSignups.map((user) => ({
    name: user.name,
    email: user.email,
    role: user.role,
    signedUpAt: user.createdAt.toISOString(),
  }))

  return NextResponse.json({
    reportType: 'overview',
    currency,
    generatedAt,
    stats: {
      totalUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      totalEnrollments,
      totalCertificates,
      totalRevenue: convertCurrency(totalRevenue, currency),
      totalRevenueFormatted: formatCurrency(totalRevenue, currency),
    },
    popularCourses: formattedPopularCourses,
    revenueBreakdown,
    recentSignups: formattedRecentSignups,
  })
}

async function generateEnrollmentsReport(currency: string, generatedAt: string) {
  // All enrollments (no pagination — for export)
  const enrollments = await db.enrollment.findMany({
    include: {
      user: { select: { name: true, email: true } },
      course: { select: { title: true, category: true, price: true } },
    },
    orderBy: { enrolledAt: 'desc' },
  })

  // Get transaction data for revenue
  const courseIds = [...new Set(enrollments.map((e) => e.courseId))]
  const transactions = courseIds.length > 0
    ? await db.transaction.findMany({
        where: {
          courseId: { in: courseIds },
          type: 'enrollment',
          status: 'completed',
        },
        select: { courseId: true, studentId: true, amount: true },
      })
    : []

  const revenueMap = new Map<string, number>()
  for (const txn of transactions) {
    if (txn.courseId && txn.studentId) {
      const key = `${txn.courseId}-${txn.studentId}`
      revenueMap.set(key, txn.amount)
    }
  }

  const formattedEnrollments = enrollments.map((enrollment) => {
    const revenueKey = `${enrollment.courseId}-${enrollment.userId}`
    const rawRevenue = revenueMap.get(revenueKey) ?? enrollment.course.price

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
      revenue: convertCurrency(rawRevenue, currency),
      revenueFormatted: formatCurrency(rawRevenue, currency),
    }
  })

  // Summary stats
  const activeCount = enrollments.filter((e) => e.status === 'active').length
  const completedCount = enrollments.filter((e) => e.status === 'completed').length
  const totalRevenue = formattedEnrollments.reduce((sum, e) => sum + e.revenue, 0)
  const avgCompletion = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
    : 0

  return NextResponse.json({
    reportType: 'enrollments',
    currency,
    generatedAt,
    enrollments: formattedEnrollments,
    summary: {
      totalEnrollments: enrollments.length,
      activeEnrollments: activeCount,
      completedEnrollments: completedCount,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalRevenueFormatted: `${currency} ${totalRevenue.toLocaleString()}`,
      avgCompletionRate: avgCompletion,
    },
  })
}

async function generateRevenueReport(currency: string, generatedAt: string) {
  const now = new Date()

  // ===== Revenue breakdown by type =====
  const transactions = await db.transaction.findMany({
    where: { status: 'completed' },
    include: {
      course: { select: { title: true, category: true } },
      student: { select: { name: true } },
      instructor: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const enrollmentRevenue = transactions
    .filter((t) => t.type === 'enrollment')
    .reduce((sum, t) => sum + t.amount, 0)
  const refundAmount = transactions
    .filter((t) => t.type === 'refund')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const netRevenue = enrollmentRevenue - refundAmount

  const revenueBreakdown = {
    enrollmentRevenue: convertCurrency(enrollmentRevenue, currency),
    enrollmentRevenueFormatted: formatCurrency(enrollmentRevenue, currency),
    refunds: convertCurrency(refundAmount, currency),
    refundsFormatted: formatCurrency(refundAmount, currency),
    netRevenue: convertCurrency(netRevenue, currency),
    netRevenueFormatted: formatCurrency(netRevenue, currency),
    platformFee: convertCurrency(Math.round(enrollmentRevenue * 0.2), currency),
    platformFeeFormatted: formatCurrency(Math.round(enrollmentRevenue * 0.2), currency),
  }

  // ===== Monthly earnings (last 12 months) =====
  const monthlyEarnings: Array<{ month: string; label: string; earnings: number; earningsFormatted: string; refunds: number; net: number }> = []
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
    const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`
    const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    const monthTxns = transactions.filter((t) => {
      const d = new Date(t.createdAt)
      return d >= monthStart && d <= monthEnd
    })

    const earnings = monthTxns
      .filter((t) => t.type === 'enrollment')
      .reduce((sum, t) => sum + t.amount, 0)
    const refunds = monthTxns
      .filter((t) => t.type === 'refund')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    monthlyEarnings.push({
      month: monthKey,
      label: monthLabel,
      earnings: convertCurrency(earnings, currency),
      earningsFormatted: formatCurrency(earnings, currency),
      refunds: convertCurrency(refunds, currency),
      net: convertCurrency(earnings - refunds, currency),
    })
  }

  // ===== Top earning courses =====
  const courseRevenueMap = new Map<string, {
    title: string
    category: string
    revenue: number
    enrollmentCount: number
  }>()

  for (const txn of transactions) {
    if (txn.type === 'enrollment' && txn.courseId && txn.course) {
      const existing = courseRevenueMap.get(txn.courseId) || {
        title: txn.course.title,
        category: txn.course.category,
        revenue: 0,
        enrollmentCount: 0,
      }
      existing.revenue += txn.amount
      existing.enrollmentCount += 1
      courseRevenueMap.set(txn.courseId, existing)
    }
  }

  const topEarningCourses = Array.from(courseRevenueMap.entries())
    .map(([_courseId, data]) => ({
      title: data.title,
      category: data.category,
      revenue: convertCurrency(data.revenue, currency),
      revenueFormatted: formatCurrency(data.revenue, currency),
      enrollmentCount: data.enrollmentCount,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // ===== Recent transactions (for report) =====
  const recentTransactions = transactions.slice(0, 50).map((t) => ({
    date: new Date(t.createdAt).toISOString().split('T')[0],
    type: t.type,
    description: t.description || `${t.type} — ${t.course?.title || 'N/A'}`,
    amount: convertCurrency(t.amount, currency),
    amountFormatted: formatCurrency(t.amount, currency),
    studentName: t.student?.name || 'N/A',
    courseName: t.course?.title || 'N/A',
  }))

  return NextResponse.json({
    reportType: 'revenue',
    currency,
    generatedAt,
    revenueBreakdown,
    monthlyEarnings,
    topEarningCourses,
    recentTransactions,
  })
}
