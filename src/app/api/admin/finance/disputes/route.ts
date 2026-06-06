import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || 'all'
    const type = searchParams.get('type') || 'all'
    const sort = searchParams.get('sort') || 'newest'

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status === 'resolved') {
      where.status = { in: ['resolved_favor_buyer', 'resolved_favor_seller'] }
    } else if (status !== 'all') {
      where.status = status
    }
    if (type !== 'all') where.type = type

    const orderBy: Record<string, string> = sort === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' }

    const [disputes, total] = await Promise.all([
      db.dispute.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          status: true,
          description: true,
          resolutionNote: true,
          refundAmount: true,
          resolvedAt: true,
          createdAt: true,
          updatedAt: true,
          reportedBy: true,
          resolvedBy: true,
          transaction: {
            select: {
              id: true,
              amount: true,
              type: true,
              status: true,
              paymentMethod: true,
              invoiceNumber: true,
              student: { select: { id: true, name: true, avatar: true, email: true } },
              instructor: { select: { id: true, name: true, avatar: true } },
              course: { select: { id: true, title: true, category: true } },
            },
          },
        },
      }),
      db.dispute.count({ where }),
    ])

    // Stats
    const [openCount, underReviewCount, escalatedCount, resolvedCount, cancelledCount] = await Promise.all([
      db.dispute.count({ where: { status: 'open' } }),
      db.dispute.count({ where: { status: 'under_review' } }),
      db.dispute.count({ where: { status: 'escalated' } }),
      db.dispute.count({ where: { status: { in: ['resolved_favor_buyer', 'resolved_favor_seller'] } } }),
      db.dispute.count({ where: { status: 'cancelled' } }),
    ])

    return NextResponse.json({
      disputes,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: { open: openCount, underReview: underReviewCount, escalated: escalatedCount, resolved: resolvedCount, cancelled: cancelledCount, total },
    })
  } catch (error) {
    console.error('Disputes list error:', error)
    return NextResponse.json({ error: 'Failed to fetch disputes' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { disputeId, action, resolutionNote, refundAmount } = body

    if (!disputeId || !action) {
      return NextResponse.json({ error: 'disputeId and action are required' }, { status: 400 })
    }

    const dispute = await db.dispute.findUnique({
      where: { id: disputeId },
      include: { transaction: true },
    })

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
    }

    let newStatus: string
    switch (action) {
      case 'review':
        newStatus = 'under_review'
        break
      case 'resolve_buyer':
        newStatus = 'resolved_favor_buyer'
        break
      case 'resolve_seller':
        newStatus = 'resolved_favor_seller'
        break
      case 'escalate':
        newStatus = 'escalated'
        break
      case 'cancel':
        newStatus = 'cancelled'
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // If resolved in favor of buyer, reverse instructor earnings atomically
    if (newStatus === 'resolved_favor_buyer' && dispute.transaction) {
      const tx = dispute.transaction
      const instructorEarningToReverse = tx.instructorEarning || 0

      const result = await db.$transaction(async (prismaTx) => {
        // Update the dispute
        const updatedDispute = await prismaTx.dispute.update({
          where: { id: disputeId },
          data: {
            status: newStatus,
            resolutionNote: resolutionNote || undefined,
            refundAmount: refundAmount || undefined,
            resolvedAt: new Date(),
            updatedAt: new Date(),
          },
        })

        // Update the original transaction: mark refunded and zero out instructor earnings
        await prismaTx.transaction.update({
          where: { id: dispute.transactionId },
          data: {
            status: 'refunded',
            refundedAt: new Date(),
            refundReason: `Dispute ${disputeId} resolved in buyer's favor`,
            instructorEarning: 0,
          },
        })

        // Create a reversal adjustment transaction to record the instructor earning reversal
        if (instructorEarningToReverse > 0 && tx.instructorId) {
          await prismaTx.transaction.create({
            data: {
              type: 'adjustment',
              amount: -instructorEarningToReverse,
              currency: tx.currency || 'USD',
              status: 'completed',
              description: `Earnings reversal: Dispute ${disputeId} resolved in buyer's favor`,
              instructorId: tx.instructorId,
              courseId: tx.courseId,
              platformFee: 0,
              instructorEarning: -instructorEarningToReverse,
              metadata: JSON.stringify({
                reason: 'dispute_buyer_favor',
                disputeId,
                originalTransactionId: dispute.transactionId,
                reversedAmount: instructorEarningToReverse,
              }),
            },
          })

          // Update instructor's pending payout balance (reduce by the reversed amount)
          const instructorSettings = await prismaTx.instructorSettings.findUnique({
            where: { instructorId: tx.instructorId },
          })
          if (instructorSettings) {
            // Deduct from any pending payouts for this instructor
            const pendingPayout = await prismaTx.payout.findFirst({
              where: { instructorId: tx.instructorId, status: 'pending' },
              orderBy: { requestedAt: 'desc' },
            })
            if (pendingPayout) {
              await prismaTx.payout.update({
                where: { id: pendingPayout.id },
                data: {
                  amount: Math.max(0, pendingPayout.amount - instructorEarningToReverse),
                  notes: pendingPayout.notes
                    ? `${pendingPayout.notes} | Adjusted: -$${instructorEarningToReverse} (dispute ${disputeId})`
                    : `Adjusted: -$${instructorEarningToReverse} (dispute ${disputeId})`,
                },
              })
            }
          }
        }

        return updatedDispute
      })

      return NextResponse.json({ dispute: result })
    }

    // For non-buyer-favor resolutions, update normally
    const updated = await db.dispute.update({
      where: { id: disputeId },
      data: {
        status: newStatus,
        resolutionNote: resolutionNote || undefined,
        refundAmount: refundAmount || undefined,
        resolvedAt: newStatus.startsWith('resolved') || newStatus === 'cancelled' ? new Date() : undefined,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ dispute: updated })
  } catch (error) {
    console.error('Dispute action error:', error)
    return NextResponse.json({ error: 'Failed to update dispute' }, { status: 500 })
  }
}
