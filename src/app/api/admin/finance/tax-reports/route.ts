import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default withholding tax rate (percentage) — matches FinancialSettings schema default
const DEFAULT_WITHHOLDING_TAX_RATE = 10

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fiscalYear = searchParams.get('fiscalYear') || '2024-25'

    // Get financial settings
    const settings = await db.financialSettings.findFirst()

    // Calculate fiscal year dates (July 1 to June 30)
    // FY '2024-25' means July 1, 2024 to June 30, 2025
    const [startYear] = fiscalYear.split('-').map(Number)
    const fyStart = new Date(startYear, 6, 1) // July 1 of start year
    const fyEnd = new Date(startYear + 1, 5, 30, 23, 59, 59) // June 30 of next year

    // Annual totals
    const [enrollmentStats, refundStats, payoutStats] = await Promise.all([
      db.transaction.aggregate({
        where: { type: 'enrollment', status: 'completed', createdAt: { gte: fyStart, lte: fyEnd } },
        _sum: { amount: true, platformFee: true, instructorEarning: true },
        _count: true,
      }),
      db.transaction.aggregate({
        where: { type: 'refund', createdAt: { gte: fyStart, lte: fyEnd } },
        _sum: { amount: true },
        _count: true,
      }),
      db.transaction.aggregate({
        where: { type: 'payout', status: 'completed', createdAt: { gte: fyStart, lte: fyEnd } },
        _sum: { amount: true },
        _count: true,
      }),
    ])

    const grossRevenue = enrollmentStats._sum.amount || 0
    const platformCommission = enrollmentStats._sum.platformFee || 0
    const instructorEarnings = enrollmentStats._sum.instructorEarning || 0
    const refundAmount = refundStats._sum.amount || 0
    const withholdingTaxRate = settings?.withholdingTaxRate ?? DEFAULT_WITHHOLDING_TAX_RATE
    const withholdingTax = Math.round(platformCommission * withholdingTaxRate / 100)

    // Monthly breakdown for the fiscal year
    const monthlyBreakdown: { month: string; grossRevenue: number; platformCommission: number; enrollments: number; refunds: number }[] = []
    for (let month = 6; month <= 17; month++) {
      const actualMonth = month % 12
      const actualYear = month >= 12 ? startYear + 1 : startYear
      const monthStart = new Date(actualYear, actualMonth, 1)
      const monthEnd = new Date(actualYear, actualMonth + 1, 0, 23, 59, 59)

      const monthStats = await db.transaction.aggregate({
        where: { type: 'enrollment', status: 'completed', createdAt: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true, platformFee: true },
        _count: true,
      })

      const monthRefunds = await db.transaction.aggregate({
        where: { type: 'refund', createdAt: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      })

      monthlyBreakdown.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        grossRevenue: monthStats._sum.amount || 0,
        platformCommission: monthStats._sum.platformFee || 0,
        enrollments: monthStats._count,
        refunds: monthRefunds._sum.amount || 0,
      })
    }

    // Per-instructor tax summary
    const instructorTxs = await db.transaction.groupBy({
      by: ['instructorId'],
      where: {
        type: 'enrollment',
        status: 'completed',
        createdAt: { gte: fyStart, lte: fyEnd },
        instructorId: { not: null },
      },
      _sum: { amount: true, instructorEarning: true },
      _count: true,
    })

    const instructorIds = instructorTxs.map(t => t.instructorId).filter(Boolean) as string[]
    const instructors = await db.user.findMany({
      where: { id: { in: instructorIds } },
      select: { id: true, name: true, email: true },
    })
    const instructorMap = new Map(instructors.map(i => [i.id, i]))

    const instructorTaxSummary = instructorTxs.map(tx => {
      const instructor = instructorMap.get(tx.instructorId || '')
      const earnings = tx._sum.instructorEarning || 0
      const taxWithheld = Math.round(earnings * (withholdingTaxRate) / 100)
      return {
        instructorId: tx.instructorId,
        name: instructor?.name || 'Unknown',
        email: instructor?.email || '',
        grossEarnings: tx._sum.amount || 0,
        netEarnings: earnings,
        taxWithheld,
        enrollmentCount: tx._count,
      }
    }).sort((a, b) => b.grossEarnings - a.grossEarnings)

    return NextResponse.json({
      fiscalYear,
      fiscalYearRange: {
        start: fyStart.toISOString(),
        end: fyEnd.toISOString(),
      },
      settings: settings ? {
        platformCommissionRate: settings.platformCommissionRate,
        instructorPayoutRate: settings.instructorPayoutRate,
        withholdingTaxRate: settings.withholdingTaxRate,
        taxId: settings.taxId,
        fiscalYearStart: settings.fiscalYearStart,
      } : null,
      summary: {
        totalGrossRevenue: grossRevenue,
        platformCommission,
        instructorEarnings,
        refundAmount,
        totalEnrollments: enrollmentStats._count,
        totalRefunds: refundStats._count,
        totalPayouts: payoutStats._sum.amount || 0,
        withholdingTaxCollected: withholdingTax,
      },
      monthlyBreakdown,
      instructorTaxSummary,
    })
  } catch (error) {
    console.error('Tax reports error:', error)
    return NextResponse.json({ error: 'Failed to fetch tax reports' }, { status: 500 })
  }
}
