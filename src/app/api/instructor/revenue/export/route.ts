import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/revenue/export - Export revenue data as CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const format = searchParams.get('format') || 'csv'
    const period = searchParams.get('period') || '30d'

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    if (format !== 'csv') {
      return NextResponse.json(
        { error: 'Only CSV format is currently supported' },
        { status: 400 }
      )
    }

    const validPeriods = ['30d', '90d', '1y', 'all']
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: `period must be one of: ${validPeriods.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify instructor exists
    const instructor = await db.user.findUnique({
      where: { id: instructorId },
      select: { id: true, name: true, role: true },
    })
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    // Calculate date filter
    const now = new Date()
    let startDate: Date | null = null
    switch (period) {
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

    // Fetch transactions
    const whereClause: Record<string, unknown> = {
      instructorId,
      type: { in: ['enrollment', 'refund'] },
    }
    if (startDate) {
      whereClause.createdAt = { gte: startDate }
    }

    const transactions = await db.transaction.findMany({
      where: whereClause,
      include: {
        student: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, category: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch payouts for the period
    const payoutWhere: Record<string, unknown> = { instructorId }
    if (startDate) {
      payoutWhere.requestedAt = { gte: startDate }
    }
    const payouts = await db.payout.findMany({
      where: payoutWhere,
      orderBy: { requestedAt: 'desc' },
    })

    // Fetch financial settings for commission info
    const financialSettings = await db.financialSettings.findFirst()
    const commissionOverride = await db.commissionOverride.findUnique({
      where: { instructorId },
    })
    const effectiveCommissionRate = commissionOverride?.commissionRate ?? financialSettings?.platformCommissionRate ?? 20
    const effectivePayoutRate = commissionOverride ? (100 - commissionOverride.commissionRate) : (financialSettings?.instructorPayoutRate ?? 80)

    // Generate CSV content
    const csvLines: string[] = []

    // Header section
    csvLines.push('ShijlAI Academy - Revenue Export Report')
    csvLines.push(`Instructor,${instructor.name}`)
    csvLines.push(`Period,${period}`)
    csvLines.push(`Generated At,${now.toISOString()}`)
    csvLines.push(`Commission Rate,${effectiveCommissionRate}%`)
    csvLines.push(`Payout Rate,${effectivePayoutRate}%`)
    csvLines.push('')

    // Summary section
    const enrollmentTxns = transactions.filter((t) => t.type === 'enrollment')
    const refundTxns = transactions.filter((t) => t.type === 'refund')
    const totalRevenue = enrollmentTxns.reduce((sum, t) => sum + t.amount, 0)
    const totalRefunds = refundTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const totalPlatformFee = enrollmentTxns.reduce((sum, t) => sum + t.platformFee, 0)
    const totalInstructorEarning = enrollmentTxns.reduce((sum, t) => sum + t.instructorEarning, 0)
    const netEarnings = totalRevenue - totalRefunds
    const completedPayoutsTotal = payouts
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)

    csvLines.push('=== REVENUE SUMMARY ===')
    csvLines.push('Metric,Value (USD)')
    csvLines.push(`Total Revenue,${totalRevenue.toFixed(2)}`)
    csvLines.push(`Total Refunds,${totalRefunds.toFixed(2)}`)
    csvLines.push(`Net Revenue,${netEarnings.toFixed(2)}`)
    csvLines.push(`Platform Fee,${totalPlatformFee.toFixed(2)}`)
    csvLines.push(`Instructor Earnings,${totalInstructorEarning.toFixed(2)}`)
    csvLines.push(`Completed Payouts,${completedPayoutsTotal.toFixed(2)}`)
    csvLines.push(`Available for Payout,${Math.max(0, totalInstructorEarning - completedPayoutsTotal).toFixed(2)}`)
    csvLines.push('')

    // Revenue by course
    const courseRevenueMap = new Map<string, { title: string; category: string; revenue: number; refunds: number; enrollments: number }>()
    for (const t of enrollmentTxns) {
      if (t.courseId) {
        const existing = courseRevenueMap.get(t.courseId) ?? {
          title: t.course?.title ?? 'Unknown',
          category: t.course?.category ?? 'Unknown',
          revenue: 0, refunds: 0, enrollments: 0,
        }
        existing.revenue += t.amount
        existing.enrollments += 1
        courseRevenueMap.set(t.courseId, existing)
      }
    }
    for (const t of refundTxns) {
      if (t.courseId) {
        const existing = courseRevenueMap.get(t.courseId)
        if (existing) {
          existing.refunds += Math.abs(t.amount)
        }
      }
    }

    csvLines.push('=== REVENUE BY COURSE ===')
    csvLines.push('Course Title,Category,Enrollments,Revenue (USD),Refunds (USD),Net (USD)')
    for (const [, data] of courseRevenueMap) {
      csvLines.push(`"${data.title}","${data.category}",${data.enrollments},${data.revenue.toFixed(2)},${data.refunds.toFixed(2)},${(data.revenue - data.refunds).toFixed(2)}`)
    }
    csvLines.push('')

    // Transaction details
    csvLines.push('=== TRANSACTION DETAILS ===')
    csvLines.push('Date,Transaction ID,Type,Student,Course,Category,Gross Amount (USD),Platform Fee (USD),Instructor Earning (USD),Payment Method,Status')
    for (const t of transactions) {
      const date = new Date(t.createdAt).toISOString().split('T')[0]
      const type = t.type === 'enrollment' ? 'Enrollment' : 'Refund'
      const studentName = t.student?.name ?? 'Unknown'
      const courseTitle = t.course?.title ?? 'Unknown'
      const category = t.course?.category ?? ''
      const grossAmount = t.type === 'refund' ? -Math.abs(t.amount) : t.amount
      const csvLine = [
        date,
        t.id,
        type,
        `"${studentName}"`,
        `"${courseTitle}"`,
        `"${category}"`,
        grossAmount.toFixed(2),
        t.platformFee.toFixed(2),
        t.instructorEarning.toFixed(2),
        t.paymentMethod,
        t.status,
      ].join(',')
      csvLines.push(csvLine)
    }
    csvLines.push('')

    // Payout history
    csvLines.push('=== PAYOUT HISTORY ===')
    csvLines.push('Date,Payout ID,Amount (USD),Status,Method,Reference')
    for (const p of payouts) {
      const date = new Date(p.completedAt || p.requestedAt).toISOString().split('T')[0]
      csvLines.push(`${date},${p.id},${p.amount.toFixed(2)},${p.status},${p.method},"${p.reference || ''}"`)
    }

    // Build final CSV string
    const csvContent = csvLines.join('\n')

    // Determine period label for filename
    const periodLabel = period === 'all' ? 'all-time' : period

    // Return CSV with proper headers
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="revenue-export-${instructor.name.replace(/\s+/g, '-').toLowerCase()}-${periodLabel}-${now.toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })

    return response
  } catch (error) {
    console.error('Error exporting revenue data:', error)
    return NextResponse.json(
      { error: 'Failed to export revenue data' },
      { status: 500 }
    )
  }
}
