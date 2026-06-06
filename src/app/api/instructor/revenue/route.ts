import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/revenue - Get revenue data for instructor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

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

    // Get instructor's courses
    const courses = await db.course.findMany({
      where: { instructorId },
      select: { id: true, title: true, price: true, enrollmentCount: true },
    })
    const courseIds = courses.map(c => c.id)
    const courseMap = new Map(courses.map(c => [c.id, c]))

    // Get all transactions for this instructor
    const transactions = await db.transaction.findMany({
      where: { instructorId, type: { in: ['enrollment', 'refund'] } },
      include: {
        student: { select: { id: true, name: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get payouts
    const payouts = await db.payout.findMany({
      where: { instructorId },
      orderBy: { requestedAt: 'desc' },
    })

    // Get payout methods
    const payoutMethods = await db.payoutMethod.findMany({
      where: { instructorId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    // Calculate overview stats
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const enrollmentTransactions = transactions.filter(t => t.type === 'enrollment')
    const refundTransactions = transactions.filter(t => t.type === 'refund')

    const totalEarnings = enrollmentTransactions.reduce((sum, t) => sum + t.amount, 0)
    const totalRefunds = refundTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const netEarnings = totalEarnings - totalRefunds

    // This month's earnings
    const thisMonthEarnings = transactions
      .filter(t => new Date(t.createdAt) >= startOfMonth && t.type === 'enrollment')
      .reduce((sum, t) => sum + t.amount, 0)
    const thisMonthRefunds = transactions
      .filter(t => new Date(t.createdAt) >= startOfMonth && t.type === 'refund')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const thisMonthNet = thisMonthEarnings - thisMonthRefunds

    // Last month's earnings for trend
    const lastMonthEarnings = transactions
      .filter(t => {
        const d = new Date(t.createdAt)
        return d >= startOfLastMonth && d <= endOfLastMonth && t.type === 'enrollment'
      })
      .reduce((sum, t) => sum + t.amount, 0)

    const trendPercent = lastMonthEarnings > 0
      ? Math.round(((thisMonthNet - lastMonthEarnings) / lastMonthEarnings) * 100)
      : 0

    // Available for payout = net earnings - completed payouts - pending/processing payouts
    const completedPayoutsTotal = payouts
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
    const pendingPayoutsTotal = payouts
      .filter(p => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + p.amount, 0)
    const availableForPayout = Math.max(0, netEarnings - completedPayoutsTotal - pendingPayoutsTotal)

    // Pending clearance (recent 14-day hold)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    const pendingClearance = transactions
      .filter(t => t.type === 'enrollment' && new Date(t.createdAt) > fourteenDaysAgo)
      .reduce((sum, t) => sum + t.amount, 0)

    // Revenue by course
    const courseRevenueMap = new Map<string, { revenue: number; enrollments: number }>()
    for (const t of enrollmentTransactions) {
      if (t.courseId) {
        const existing = courseRevenueMap.get(t.courseId) || { revenue: 0, enrollments: 0 }
        existing.revenue += t.amount
        existing.enrollments += 1
        courseRevenueMap.set(t.courseId, existing)
      }
    }

    const totalCourseRevenue = Array.from(courseRevenueMap.values()).reduce((sum, c) => sum + c.revenue, 0)
    const revenueByCourse = Array.from(courseRevenueMap.entries()).map(([courseId, data]) => {
      const course = courseMap.get(courseId)
      return {
        title: course?.title || 'Unknown Course',
        revenue: data.revenue,
        percentage: totalCourseRevenue > 0 ? Math.round((data.revenue / totalCourseRevenue) * 100) : 0,
        enrollments: data.enrollments,
        color: '#10b981',
      }
    }).sort((a, b) => b.revenue - a.revenue)

    // Monthly earnings (last 6 months)
    const monthlyEarnings: { month: string; label: string; earnings: number; tax: number; net: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthName = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

      const monthTxns = transactions.filter(t => {
        const d = new Date(t.createdAt)
        return d >= monthStart && d <= monthEnd
      })

      const earnings = monthTxns.filter(t => t.type === 'enrollment').reduce((s, t) => s + t.amount, 0)
      const refunds = monthTxns.filter(t => t.type === 'refund').reduce((s, t) => s + Math.abs(t.amount), 0)
      const tax = Math.round(earnings * 0.1) // 10% tax estimate

      monthlyEarnings.push({
        month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
        label: monthName,
        earnings,
        tax,
        net: earnings - refunds - tax,
      })
    }

    // Format transactions for frontend
    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      date: new Date(t.createdAt).toISOString().split('T')[0],
      description: t.description || `${t.type === 'enrollment' ? 'Enrollment' : 'Refund'} — ${t.course?.title || 'Unknown'}`,
      type: t.type as 'enrollment' | 'refund',
      gross: t.type === 'refund' ? -Math.abs(t.amount) : t.amount,
      yourShare: t.type === 'refund' ? -Math.round(Math.abs(t.amount) * (t.instructorEarning > 0 && t.amount > 0 ? t.instructorEarning / t.amount : 0.8)) : Math.round(t.instructorEarning || t.amount * 0.8),
      studentName: t.student?.name || 'Unknown Student',
      courseName: t.course?.title || 'Unknown Course',
    }))

    // Format payouts
    const formattedPayouts = payouts.map(p => ({
      id: p.id,
      date: new Date(p.completedAt || p.requestedAt).toISOString().split('T')[0],
      amount: p.amount,
      status: p.status as 'paid' | 'pending' | 'processing',
      method: p.method,
      reference: p.reference || '',
    }))

    // Format payout methods
    const methodIconMap: Record<string, string> = {
      bank_transfer: 'Building2',
      jazzcash: 'Smartphone',
      easypaisa: 'Smartphone',
      payoneer: 'Globe',
      stripe: 'CreditCard',
    }
    const formattedPayoutMethods = payoutMethods.map(pm => ({
      key: pm.id,
      label: pm.type === 'bank_transfer'
        ? `Bank Transfer (${pm.bankName || 'Bank'})`
        : pm.type === 'jazzcash'
        ? 'JazzCash'
        : pm.type === 'easypaisa'
        ? 'Easypaisa'
        : pm.type === 'payoneer'
        ? 'Payoneer'
        : 'Stripe',
      detail: pm.type === 'bank_transfer'
        ? `**** ${pm.accountNumber?.slice(-4) || '0000'}`
        : pm.phoneNumber || pm.email || 'Mobile Wallet',
      icon: methodIconMap[pm.type] || 'CreditCard',
      active: pm.isDefault,
    }))

    // Overview
    const overview = {
      earnedThisMonth: thisMonthNet,
      availableForPayout,
      pendingClearance,
      allTimeEarnings: netEarnings,
      trendPercent,
      grossRevenue: totalEarnings,
      platformFee: enrollmentTransactions.reduce((sum, t) => sum + t.platformFee, 0),
      netEarnings: enrollmentTransactions.reduce((sum, t) => sum + t.instructorEarning, 0) - totalRefunds,
    }

    return NextResponse.json({
      transactions: formattedTransactions,
      payouts: formattedPayouts,
      payoutMethods: formattedPayoutMethods,
      overview,
      revenueByCourse,
      monthlyEarnings,
    })
  } catch (error) {
    console.error('Error fetching revenue data:', error)
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
  }
}
