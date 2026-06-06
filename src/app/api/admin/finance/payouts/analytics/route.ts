import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to get YYYY-MM from a Date
function toMonthKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

// Helper to generate month keys for a given number of months going back from now
function getLastNMonthKeys(n: number): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(toMonthKey(d))
  }
  return months
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'year' // month, quarter, year, all

    // Determine date range based on period
    const now = new Date()
    let startDate: Date | null = null

    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter': {
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3
        startDate = new Date(now.getFullYear(), quarterMonth, 1)
        break
      }
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case 'all':
      default:
        startDate = null // no date filter
        break
    }

    const dateFilter = startDate ? { requestedAt: { gte: startDate } } : {}

    // === Overview Stats ===
    const [
      totalPayoutsResult,
      totalAmountResult,
      pendingResult,
      pendingAmountResult,
      completedThisMonthResult,
      completedThisMonthAmountResult,
      failedResult,
      disputedResult,
      lastPayout,
    ] = await Promise.all([
      // Total payouts count
      db.payout.count({ where: dateFilter }),
      // Total amount
      db.payout.aggregate({ where: dateFilter, _sum: { amount: true } }),
      // Pending count
      db.payout.count({ where: { ...dateFilter, status: 'pending' } }),
      // Pending amount
      db.payout.aggregate({ where: { ...dateFilter, status: 'pending' }, _sum: { amount: true } }),
      // Completed this month
      db.payout.count({
        where: {
          status: 'completed',
          completedAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        },
      }),
      // Completed this month amount
      db.payout.aggregate({
        where: {
          status: 'completed',
          completedAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
      // Failed count
      db.payout.count({ where: { ...dateFilter, status: 'failed' } }),
      // Disputed count
      db.payout.count({ where: { ...dateFilter, status: 'disputed' } }),
      // Last payout date
      db.payout.findFirst({
        where: { status: 'completed' },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true },
      }),
    ])

    // Average processing days
    const completedPayoutsForAvg = await db.payout.findMany({
      where: {
        status: 'completed',
        completedAt: { not: null as unknown as Date },
        ...(startDate ? { completedAt: { gte: startDate } } : {}),
      },
      select: { requestedAt: true, completedAt: true },
    })
    let avgProcessingDays = 0
    if (completedPayoutsForAvg.length > 0) {
      const totalDays = completedPayoutsForAvg.reduce((sum, p) => {
        const req = new Date(p.requestedAt).getTime()
        const comp = new Date(p.completedAt!).getTime()
        return sum + (comp - req) / (1000 * 60 * 60 * 24)
      }, 0)
      avgProcessingDays = Math.round((totalDays / completedPayoutsForAvg.length) * 10) / 10
    }

    // === Monthly Trend (last 6 months) ===
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const monthlyTrendData = await db.payout.findMany({
      where: { requestedAt: { gte: sixMonthsAgo } },
      select: {
        requestedAt: true,
        amount: true,
        method: true,
      },
    })

    // Also get transactions for platform commission per month
    const monthlyTransactions = await db.transaction.findMany({
      where: {
        type: 'enrollment',
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        createdAt: true,
        platformFee: true,
      },
    })

    const monthKeys = getLastNMonthKeys(6)
    const trendMap = new Map<string, { month: string; count: number; amount: number; platformCommission: number }>()
    for (const mk of monthKeys) {
      trendMap.set(mk, { month: mk, count: 0, amount: 0, platformCommission: 0 })
    }
    for (const p of monthlyTrendData) {
      const key = toMonthKey(new Date(p.requestedAt))
      const entry = trendMap.get(key)
      if (entry) {
        entry.count += 1
        entry.amount += p.amount
      }
    }
    for (const t of monthlyTransactions) {
      const key = toMonthKey(new Date(t.createdAt))
      const entry = trendMap.get(key)
      if (entry) {
        entry.platformCommission += t.platformFee || 0
      }
    }
    const monthlyTrend = Array.from(trendMap.values())

    // === Method Distribution ===
    const allPayoutsForMethods = await db.payout.findMany({
      where: dateFilter,
      select: { method: true, amount: true },
    })
    const methodMap = new Map<string, { method: string; count: number; amount: number }>()
    for (const p of allPayoutsForMethods) {
      const existing = methodMap.get(p.method)
      if (existing) {
        existing.count += 1
        existing.amount += p.amount
      } else {
        methodMap.set(p.method, { method: p.method, count: 1, amount: p.amount })
      }
    }
    const totalMethodAmount = Array.from(methodMap.values()).reduce((sum, m) => sum + m.amount, 0)
    const methodDistribution = Array.from(methodMap.values()).map(m => ({
      method: m.method,
      count: m.count,
      amount: Math.round(m.amount * 100) / 100,
      percentage: totalMethodAmount > 0 ? Math.round((m.amount / totalMethodAmount) * 1000) / 10 : 0,
    })).sort((a, b) => b.amount - a.amount)

    // === Top Instructors ===
    const topInstructorData = await db.payout.findMany({
      where: { status: 'completed', ...dateFilter },
      select: {
        instructorId: true,
        amount: true,
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })
    const instructorMap = new Map<string, { instructorId: string; name: string; avatar: string | null; totalPayout: number; payoutCount: number }>()
    for (const p of topInstructorData) {
      const existing = instructorMap.get(p.instructorId)
      if (existing) {
        existing.totalPayout += p.amount
        existing.payoutCount += 1
      } else {
        instructorMap.set(p.instructorId, {
          instructorId: p.instructorId,
          name: p.instructor.name,
          avatar: p.instructor.avatar,
          totalPayout: p.amount,
          payoutCount: 1,
        })
      }
    }
    const topInstructors = Array.from(instructorMap.values())
      .sort((a, b) => b.totalPayout - a.totalPayout)
      .slice(0, 10)
      .map(inst => ({
        ...inst,
        totalPayout: Math.round(inst.totalPayout * 100) / 100,
      }))

    // === Recent Activity (last 10 completed payouts) ===
    const recentActivity = await db.payout.findMany({
      where: { status: 'completed', completedAt: { not: null as unknown as Date } },
      orderBy: { completedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        status: true,
        completedAt: true,
        method: true,
        instructor: {
          select: { name: true },
        },
      },
    })

    const recentActivityFormatted = recentActivity.map(p => ({
      id: p.id,
      instructorName: p.instructor.name,
      amount: Math.round(p.amount * 100) / 100,
      status: p.status,
      completedAt: p.completedAt ? new Date(p.completedAt).toISOString() : null,
      method: p.method,
    }))

    // Build overview response
    const overview = {
      totalPayouts: totalPayoutsResult,
      totalAmount: totalAmountResult._sum.amount || 0,
      pendingCount: pendingResult,
      pendingAmount: pendingAmountResult._sum.amount || 0,
      completedThisMonth: completedThisMonthResult,
      completedThisMonthAmount: completedThisMonthAmountResult._sum.amount || 0,
      failedCount: failedResult,
      disputedCount: disputedResult,
      avgProcessingDays,
      lastPayoutDate: lastPayout?.completedAt ? new Date(lastPayout.completedAt).toISOString() : null,
    }

    return NextResponse.json({
      overview,
      monthlyTrend,
      methodDistribution,
      topInstructors,
      recentActivity: recentActivityFormatted,
    })
  } catch (error) {
    console.error('Payout analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch payout analytics' }, { status: 500 })
  }
}
