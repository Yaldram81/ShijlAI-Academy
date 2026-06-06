import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || 'all' // all, enrollment, refund, payout, adjustment
    const status = searchParams.get('status') || 'all' // all, completed, pending, failed, refunded
    const paymentMethod = searchParams.get('paymentMethod') || 'all'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sort = searchParams.get('sort') || 'newest'

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    if (type !== 'all') where.type = type
    if (status !== 'all') where.status = status
    if (paymentMethod !== 'all') where.paymentMethod = paymentMethod

    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { invoiceNumber: { contains: search } },
        { student: { name: { contains: search } } },
        { instructor: { name: { contains: search } } },
        { course: { title: { contains: search } } },
      ]
    }

    const orderBy: Record<string, string> = sort === 'oldest' ? { createdAt: 'asc' } : 
      sort === 'amount_high' ? { amount: 'desc' } : 
      sort === 'amount_low' ? { amount: 'asc' } : 
      { createdAt: 'desc' }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
          status: true,
          description: true,
          paymentMethod: true,
          platformFee: true,
          instructorEarning: true,
          invoiceNumber: true,
          refundReason: true,
          refundedAt: true,
          createdAt: true,
          student: { select: { id: true, name: true, avatar: true, email: true } },
          instructor: { select: { id: true, name: true, avatar: true } },
          course: { select: { id: true, title: true, category: true, thumbnail: true } },
          _count: { select: { disputes: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ])

    // Stats for the current filter
    const stats = await prisma.transaction.aggregate({
      where,
      _sum: { amount: true, platformFee: true, instructorEarning: true },
      _count: true,
    })

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalAmount: stats._sum.amount || 0,
        totalPlatformFee: stats._sum.platformFee || 0,
        totalInstructorEarning: stats._sum.instructorEarning || 0,
        count: stats._count,
      },
    })
  } catch (error) {
    console.error('Finance transactions error:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
