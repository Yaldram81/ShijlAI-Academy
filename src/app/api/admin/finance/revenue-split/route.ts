import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'

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
        startDate = new Date(2020, 0, 1)
    }

    // Revenue split by instructor
    const instructorSplits = await db.transaction.groupBy({
      by: ['instructorId'],
      where: {
        type: 'enrollment',
        status: 'completed',
        createdAt: { gte: startDate },
        instructorId: { not: null },
      },
      _sum: { amount: true, platformFee: true, instructorEarning: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    })

    // Get instructor details
    const instructorIds = instructorSplits.map(s => s.instructorId).filter(Boolean) as string[]
    const instructors = await db.user.findMany({
      where: { id: { in: instructorIds } },
      select: { id: true, name: true, avatar: true, email: true },
    })
    const instructorMap = new Map(instructors.map(i => [i.id, i]))

    // Course-level breakdown per instructor
    const instructorCourseBreakdown = await Promise.all(
      instructorIds.slice(0, 10).map(async (instId) => {
        const courseTxs = await db.transaction.groupBy({
          by: ['courseId'],
          where: {
            type: 'enrollment',
            status: 'completed',
            createdAt: { gte: startDate },
            instructorId: instId,
          },
          _sum: { amount: true, instructorEarning: true },
          _count: true,
        })

        const courseIds = courseTxs.map(ct => ct.courseId).filter(Boolean) as string[]
        const courses = await db.course.findMany({
          where: { id: { in: courseIds } },
          select: { id: true, title: true, category: true },
        })
        const courseMap = new Map(courses.map(c => [c.id, c]))

        return {
          instructorId: instId,
          courses: courseTxs.map(ct => ({
            courseId: ct.courseId,
            courseTitle: courseMap.get(ct.courseId || '')?.title || 'Unknown',
            category: courseMap.get(ct.courseId || '')?.category || 'Unknown',
            revenue: ct._sum.amount || 0,
            instructorEarning: ct._sum.instructorEarning || 0,
            enrollmentCount: ct._count,
          })),
        }
      })
    )

    const revenueSplit = instructorSplits.map(split => {
      const instructor = instructorMap.get(split.instructorId || '')
      const courseBreakdown = instructorCourseBreakdown.find(b => b.instructorId === split.instructorId)
      return {
        instructorId: split.instructorId,
        instructor: instructor ? { name: instructor.name, avatar: instructor.avatar, email: instructor.email } : null,
        totalRevenue: split._sum.amount || 0,
        platformCut: split._sum.platformFee || 0,
        instructorEarning: split._sum.instructorEarning || 0,
        enrollmentCount: split._count,
        courses: courseBreakdown?.courses || [],
      }
    })

    // Totals — use actual Transaction data for rates instead of hardcoded 20/80
    const totals = await db.transaction.aggregate({
      where: { type: 'enrollment', status: 'completed', createdAt: { gte: startDate } },
      _sum: { amount: true, platformFee: true, instructorEarning: true },
      _count: true,
    })

    const grossRevenue = totals._sum.amount || 0
    const platformCut = totals._sum.platformFee || 0
    const instructorEarnings = totals._sum.instructorEarning || 0

    // Calculate actual rates from transaction data
    const platformRate = grossRevenue > 0 ? Math.round((platformCut / grossRevenue) * 100) : 0
    const instructorRate = grossRevenue > 0 ? Math.round((instructorEarnings / grossRevenue) * 100) : 0

    return NextResponse.json({
      period,
      revenueSplit,
      totals: {
        grossRevenue,
        platformCut,
        instructorEarnings,
        totalEnrollments: totals._count,
        platformRate,
        instructorRate,
      },
    })
  } catch (error) {
    console.error('Revenue split error:', error)
    return NextResponse.json({ error: 'Failed to fetch revenue split' }, { status: 500 })
  }
}

// PUT /api/admin/finance/revenue-split — Update revenue split settings with validation
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { platformShare, instructorShare, otherShares } = body

    // Validate that all share rates are provided and sum to 100
    if (platformShare === undefined || instructorShare === undefined) {
      return NextResponse.json(
        { error: 'platformShare and instructorShare are required' },
        { status: 400 }
      )
    }

    const otherTotal = Array.isArray(otherShares)
      ? otherShares.reduce((sum: number, s: { share: number }) => sum + (s.share || 0), 0)
      : 0

    const totalShare = Number(platformShare) + Number(instructorShare) + Number(otherTotal)

    if (totalShare !== 100) {
      return NextResponse.json(
        { error: `Commission rates must sum to 100%. Current sum: ${totalShare}%` },
        { status: 400 }
      )
    }

    if (platformShare < 0 || instructorShare < 0) {
      return NextResponse.json(
        { error: 'Share rates cannot be negative' },
        { status: 400 }
      )
    }

    // Update FinancialSettings
    let settings = await db.financialSettings.findFirst()
    if (!settings) {
      settings = await db.financialSettings.create({ data: {} })
    }

    const updated = await db.financialSettings.update({
      where: { id: settings.id },
      data: {
        platformCommissionRate: Number(platformShare),
        instructorPayoutRate: Number(instructorShare),
      },
    })

    return NextResponse.json({
      settings: {
        platformCommissionRate: updated.platformCommissionRate,
        instructorPayoutRate: updated.instructorPayoutRate,
      },
    })
  } catch (error) {
    console.error('Revenue split PUT error:', error)
    return NextResponse.json({ error: 'Failed to update revenue split settings' }, { status: 500 })
  }
}
