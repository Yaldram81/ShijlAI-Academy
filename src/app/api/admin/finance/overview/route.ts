import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // month, quarter, year, all

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date
    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3
        startDate = new Date(now.getFullYear(), quarterStart, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(2020, 0, 1) // all time
    }

    // Previous period for comparison
    const periodDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const prevStart = new Date(startDate.getTime() - periodDays * 1000 * 60 * 60 * 24)
    const prevEnd = startDate

    // Current period aggregations
    const [currentEnrollments, currentRefunds, prevEnrollments, prevRefunds] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: 'enrollment', status: 'completed', createdAt: { gte: startDate } },
        _sum: { amount: true, platformFee: true, instructorEarning: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { type: 'refund', createdAt: { gte: startDate } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { type: 'enrollment', status: 'completed', createdAt: { gte: prevStart, lt: prevEnd } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: 'refund', createdAt: { gte: prevStart, lt: prevEnd } },
        _sum: { amount: true },
      }),
    ])

    const grossRevenue = currentEnrollments._sum.amount || 0
    const platformCut = currentEnrollments._sum.platformFee || 0
    const instructorPayouts = currentEnrollments._sum.instructorEarning || 0
    const refundsIssued = currentRefunds._sum.amount || 0
    const prevGross = prevEnrollments._sum.amount || 0
    const prevRefundAmount = prevRefunds._sum.amount || 0
    const revenueChange = prevGross > 0 ? ((grossRevenue - prevGross) / prevGross * 100) : 0
    const refundsChange = prevRefundAmount > 0 ? ((refundsIssued - prevRefundAmount) / prevRefundAmount * 100) : 0

    // Revenue by category
    const courses = await prisma.course.findMany({
      select: { id: true, category: true },
    })
    const courseCategoryMap = new Map(courses.map(c => [c.id, c.category]))

    const enrollmentTxs = await prisma.transaction.findMany({
      where: { type: 'enrollment', status: 'completed', createdAt: { gte: startDate } },
      select: { courseId: true, amount: true },
    })

    const categoryRevenue: Record<string, number> = {}
    for (const tx of enrollmentTxs) {
      if (!tx.courseId) continue
      const cat = courseCategoryMap.get(tx.courseId) || 'Other'
      categoryRevenue[cat] = (categoryRevenue[cat] || 0) + tx.amount
    }

    // Map categories to broader groups for the wireframe
    const categoryGroups: Record<string, string> = {
      'Programming': 'Technology',
      'Computer Science': 'Technology',
      'AWS': 'Technology',
      'IB': 'Languages',
      'AP': 'Languages',
      'Cambridge': 'Languages',
      'English': 'Languages',
      'IELTS': 'Languages',
      'Business': 'Business',
      'General': 'Business',
      'Mathematics': 'Business',
      'Design': 'Design',
      'Chemistry': 'Other',
      'Physics': 'Other',
      'Biology': 'Other',
    }

    const groupedRevenue: Record<string, number> = {}
    for (const [cat, amount] of Object.entries(categoryRevenue)) {
      const group = categoryGroups[cat] || 'Other'
      groupedRevenue[group] = (groupedRevenue[group] || 0) + amount
    }

    const revenueByCategory = Object.entries(groupedRevenue)
      .map(([category, amount]) => ({ category, amount, percentage: grossRevenue > 0 ? (amount / grossRevenue * 100) : 0 }))
      .sort((a, b) => b.amount - a.amount)

    // Revenue by payment method
    const paymentMethodTxs = await prisma.transaction.groupBy({
      by: ['paymentMethod'],
      where: { type: 'enrollment', status: 'completed', createdAt: { gte: startDate } },
      _sum: { amount: true },
      _count: true,
    })

    const paymentMethodLabels: Record<string, string> = {
      credit_debit_card: 'Credit/Debit Card',
      jazzcash: 'JazzCash',
      easypaisa: 'Easypaisa',
      bank_transfer: 'Bank Transfer',
      payoneer_stripe: 'Payoneer / Stripe',
    }

    const revenueByPaymentMethod = paymentMethodTxs
      .map(pm => ({
        method: pm.paymentMethod,
        label: paymentMethodLabels[pm.paymentMethod] || pm.paymentMethod,
        amount: pm._sum.amount || 0,
        count: pm._count,
        percentage: grossRevenue > 0 ? ((pm._sum.amount || 0) / grossRevenue * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)

    // Open disputes count
    const openDisputes = await prisma.dispute.count({
      where: { status: { in: ['open', 'under_review', 'escalated'] } },
    })

    return NextResponse.json({
      period,
      overview: {
        grossRevenue,
        platformCut,
        instructorPayouts,
        refundsIssued,
        totalEnrollments: currentEnrollments._count,
        totalRefundCount: currentRefunds._count,
        refundRate: grossRevenue > 0 ? (refundsIssued / grossRevenue * 100) : 0,
        revenueChange: Math.round(revenueChange * 10) / 10,
        refundsChange: Math.round(refundsChange * 10) / 10,
      },
      revenueByCategory,
      revenueByPaymentMethod,
      openDisputes,
    })
  } catch (error) {
    console.error('Finance overview error:', error)
    return NextResponse.json({ error: 'Failed to fetch finance overview' }, { status: 500 })
  }
}
