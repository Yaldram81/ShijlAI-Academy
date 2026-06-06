import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const status = searchParams.get('status') || 'all' // all, pending, approved, rejected, processed
    const search = searchParams.get('search') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const courseId = searchParams.get('courseId') || ''
    const instructorId = searchParams.get('instructorId') || ''
    const sort = searchParams.get('sort') || 'newest'

    const skip = (page - 1) * limit

    // Build where clause for refund transactions
    const where: Record<string, unknown> = {
      type: 'refund',
    }

    // Status filtering:
    // pending = status 'pending'
    // approved = status 'refunded' but refundedAt is null (approved but not yet processed)
    // rejected = status 'completed' with refundReason (reverted)
    // processed = status 'refunded' with refundedAt set
    if (status === 'pending') {
      where.status = 'pending'
    } else if (status === 'approved') {
      where.status = 'refunded'
      where.refundedAt = null
    } else if (status === 'processed') {
      where.status = 'refunded'
      where.refundedAt = { not: null }
    } else if (status === 'rejected') {
      where.status = 'refund_rejected'
    } else if (status === 'refunded') {
      where.status = 'refunded'
    }

    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      }
    }

    if (courseId) {
      where.courseId = courseId
    }

    if (instructorId) {
      where.instructorId = instructorId
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { invoiceNumber: { contains: search } },
        { refundReason: { contains: search } },
        { student: { name: { contains: search } } },
        { student: { email: { contains: search } } },
        { instructor: { name: { contains: search } } },
        { course: { title: { contains: search } } },
      ]
    }

    const orderBy: Record<string, string> =
      sort === 'oldest' ? { createdAt: 'asc' } :
      sort === 'amount_high' ? { amount: 'desc' } :
      sort === 'amount_low' ? { amount: 'asc' } :
      { createdAt: 'desc' }

    const [refunds, total] = await Promise.all([
      db.transaction.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
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
          metadata: true,
          courseId: true,
          studentId: true,
          instructorId: true,
          createdAt: true,
          updatedAt: true,
          student: {
            select: { id: true, name: true, avatar: true, email: true },
          },
          instructor: {
            select: { id: true, name: true, avatar: true, email: true },
          },
          course: {
            select: { id: true, title: true, category: true, thumbnail: true, price: true },
          },
        },
      }),
      db.transaction.count({ where }),
    ])

    // Parse metadata JSON for each refund
    const enrichedRefunds = refunds.map((r) => {
      let parsedMetadata: unknown = null
      try {
        parsedMetadata = r.metadata ? JSON.parse(r.metadata) : null
      } catch {
        parsedMetadata = null
      }

      return {
        ...r,
        metadata: parsedMetadata,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        refundedAt: r.refundedAt?.toISOString() || null,
      }
    })

    // Stats - run in parallel
    const [
      totalRefundAmountResult,
      pendingCount,
      approvedCount,
      processedCount,
      rejectedCount,
      avgProcessingDaysResult,
    ] = await Promise.all([
      db.transaction.aggregate({
        where: { type: 'refund', status: 'refunded' },
        _sum: { amount: true },
      }),
      db.transaction.count({ where: { type: 'refund', status: 'pending' } }),
      db.transaction.count({ where: { type: 'refund', status: 'refunded', refundedAt: null } }),
      db.transaction.count({ where: { type: 'refund', status: 'refunded', refundedAt: { not: null } } }),
      db.transaction.count({ where: { type: 'refund', status: 'refund_rejected' } }),
      // Calculate average processing days for processed refunds
      db.transaction.findMany({
        where: {
          type: 'refund',
          status: 'refunded',
          refundedAt: { not: null },
        },
        select: { createdAt: true, refundedAt: true },
        take: 50,
        orderBy: { refundedAt: 'desc' },
      }),
    ])

    // Calculate avg processing days
    let avgProcessingDays = 0
    if (avgProcessingDaysResult.length > 0) {
      const totalDays = avgProcessingDaysResult.reduce((sum, r) => {
        if (r.refundedAt) {
          const days = (new Date(r.refundedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          return sum + days
        }
        return sum
      }, 0)
      avgProcessingDays = Math.round((totalDays / avgProcessingDaysResult.length) * 10) / 10
    }

    return NextResponse.json({
      refunds: enrichedRefunds,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalRefundAmount: totalRefundAmountResult._sum.amount || 0,
        pendingCount,
        approvedCount,
        processedCount,
        rejectedCount,
        avgProcessingDays,
        total,
      },
    })
  } catch (error) {
    console.error('Refunds GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch refunds' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'approve': {
        const { transactionId, adminNote } = body
        if (!transactionId) {
          return NextResponse.json({ error: 'transactionId is required' }, { status: 400 })
        }

        const transaction = await db.transaction.findUnique({
          where: { id: transactionId },
          include: {
            student: { select: { id: true, name: true } },
            instructor: { select: { id: true, name: true } },
            course: { select: { id: true, title: true } },
          },
        })

        if (!transaction) {
          return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
        }

        if (transaction.type !== 'refund') {
          return NextResponse.json({ error: 'Transaction is not a refund' }, { status: 400 })
        }

        if (transaction.status !== 'pending') {
          return NextResponse.json({ error: 'Only pending refunds can be approved' }, { status: 400 })
        }

        const updated = await db.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'refunded',
            refundReason: adminNote || transaction.refundReason || 'Approved by admin',
          },
        })

        // Log activity
        await db.activityLog.create({
          data: {
            type: 'refund_issued',
            title: `Refund approved for ${transaction.student?.name || 'student'}`,
            description: `Amount: $${transaction.amount} | Course: ${transaction.course?.title || 'N/A'}${adminNote ? ` | Note: ${adminNote}` : ''}`,
            icon: '✅',
            action: 'approved',
            targetType: 'refund',
            targetId: transactionId,
            targetName: transaction.course?.title || transaction.description || 'Refund',
            category: 'finance',
            severity: 'info',
          },
        })

        // Notify student
        if (transaction.studentId) {
          await db.notification.create({
            data: {
              userId: transaction.studentId,
              type: 'system',
              title: 'Refund Approved',
              content: `Your refund of $${transaction.amount} for "${transaction.course?.title || 'a course'}" has been approved.`,
              icon: '✅',
              link: '/dashboard/purchases',
              metadata: JSON.stringify({ transactionId, amount: transaction.amount }),
            },
          })
        }

        // Notify instructor
        if (transaction.instructorId) {
          await db.notification.create({
            data: {
              userId: transaction.instructorId,
              type: 'payout',
              title: 'Refund Approved on Your Course',
              content: `A refund of $${transaction.amount} has been approved for "${transaction.course?.title || 'your course'}". This will affect your earnings.`,
              icon: '⚠️',
              link: '/instructor/earnings',
              metadata: JSON.stringify({ transactionId, amount: transaction.amount, studentName: transaction.student?.name }),
            },
          })
        }

        return NextResponse.json({
          transaction: {
            ...updated,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
            refundedAt: updated.refundedAt?.toISOString() || null,
          },
        })
      }

      case 'reject': {
        const { transactionId, reason } = body
        if (!transactionId) {
          return NextResponse.json({ error: 'transactionId is required' }, { status: 400 })
        }
        if (!reason) {
          return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
        }

        const transaction = await db.transaction.findUnique({
          where: { id: transactionId },
          include: {
            student: { select: { id: true, name: true } },
            instructor: { select: { id: true, name: true } },
            course: { select: { id: true, title: true } },
          },
        })

        if (!transaction) {
          return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
        }

        if (transaction.type !== 'refund') {
          return NextResponse.json({ error: 'Transaction is not a refund' }, { status: 400 })
        }

        if (transaction.status !== 'pending') {
          return NextResponse.json({ error: 'Only pending refunds can be rejected' }, { status: 400 })
        }

        // Mark as refund_rejected so it's distinguishable from successful transactions
        const updated = await db.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'refund_rejected',
            refundReason: `Rejected: ${reason}`,
          },
        })

        // Log activity
        await db.activityLog.create({
          data: {
            type: 'refund_issued',
            title: `Refund rejected for ${transaction.student?.name || 'student'}`,
            description: `Amount: $${transaction.amount} | Course: ${transaction.course?.title || 'N/A'} | Reason: ${reason}`,
            icon: '❌',
            action: 'rejected',
            targetType: 'refund',
            targetId: transactionId,
            targetName: transaction.course?.title || transaction.description || 'Refund',
            category: 'finance',
            severity: 'warning',
          },
        })

        // Notify student
        if (transaction.studentId) {
          await db.notification.create({
            data: {
              userId: transaction.studentId,
              type: 'system',
              title: 'Refund Request Rejected',
              content: `Your refund request for "${transaction.course?.title || 'a course'}" has been rejected. Reason: ${reason}`,
              icon: '❌',
              link: '/dashboard/purchases',
              metadata: JSON.stringify({ transactionId, reason }),
            },
          })
        }

        // Notify instructor
        if (transaction.instructorId) {
          await db.notification.create({
            data: {
              userId: transaction.instructorId,
              type: 'system',
              title: 'Refund Request Rejected',
              content: `The refund request for "${transaction.course?.title || 'your course'}" has been rejected.`,
              icon: 'ℹ️',
              metadata: JSON.stringify({ transactionId }),
            },
          })
        }

        return NextResponse.json({
          transaction: {
            ...updated,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
            refundedAt: updated.refundedAt?.toISOString() || null,
          },
        })
      }

      case 'process': {
        const { transactionId } = body
        if (!transactionId) {
          return NextResponse.json({ error: 'transactionId is required' }, { status: 400 })
        }

        const transaction = await db.transaction.findUnique({
          where: { id: transactionId },
          include: {
            student: { select: { id: true, name: true } },
            instructor: { select: { id: true, name: true } },
            course: { select: { id: true, title: true } },
          },
        })

        if (!transaction) {
          return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
        }

        if (transaction.type !== 'refund') {
          return NextResponse.json({ error: 'Transaction is not a refund' }, { status: 400 })
        }

        if (transaction.status !== 'refunded' || transaction.refundedAt) {
          return NextResponse.json({ error: 'Only approved (unprocessed) refunds can be marked as processed' }, { status: 400 })
        }

        const updated = await db.transaction.update({
          where: { id: transactionId },
          data: {
            refundedAt: new Date(),
          },
        })

        // Log activity
        await db.activityLog.create({
          data: {
            type: 'refund_issued',
            title: `Refund processed for ${transaction.student?.name || 'student'}`,
            description: `Amount: $${transaction.amount} | Course: ${transaction.course?.title || 'N/A'}`,
            icon: '💸',
            action: 'processed',
            targetType: 'refund',
            targetId: transactionId,
            targetName: transaction.course?.title || transaction.description || 'Refund',
            category: 'finance',
            severity: 'info',
          },
        })

        // Notify student
        if (transaction.studentId) {
          await db.notification.create({
            data: {
              userId: transaction.studentId,
              type: 'system',
              title: 'Refund Processed',
              content: `Your refund of $${transaction.amount} for "${transaction.course?.title || 'a course'}" has been processed and will be returned to your original payment method.`,
              icon: '💸',
              link: '/dashboard/purchases',
              metadata: JSON.stringify({ transactionId, amount: transaction.amount }),
            },
          })
        }

        return NextResponse.json({
          transaction: {
            ...updated,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
            refundedAt: updated.refundedAt?.toISOString() || null,
          },
        })
      }

      case 'bulk_approve': {
        const { transactionIds, adminNote } = body
        if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
          return NextResponse.json({ error: 'transactionIds array is required' }, { status: 400 })
        }

        if (transactionIds.length > 100) {
          return NextResponse.json({ error: 'Maximum 100 refunds can be processed at once' }, { status: 400 })
        }

        // Verify all transactions exist and are pending refunds
        const transactions = await db.transaction.findMany({
          where: {
            id: { in: transactionIds },
            type: 'refund',
            status: 'pending',
          },
          include: {
            student: { select: { id: true, name: true } },
            instructor: { select: { id: true, name: true } },
            course: { select: { id: true, title: true } },
          },
        })

        if (transactions.length === 0) {
          return NextResponse.json({ error: 'No pending refunds found for the given IDs' }, { status: 404 })
        }

        // Batch approve
        const updateResult = await db.transaction.updateMany({
          where: {
            id: { in: transactions.map((t) => t.id) },
            type: 'refund',
            status: 'pending',
          },
          data: {
            status: 'refunded',
            refundReason: adminNote || 'Bulk approved by admin',
          },
        })

        // Log the bulk action
        await db.activityLog.create({
          data: {
            type: 'refund_issued',
            title: `${updateResult.count} refunds bulk approved`,
            description: `Amounts: ${transactions.map((t) => `$${t.amount}`).join(', ')}${adminNote ? ` | Note: ${adminNote}` : ''}`,
            icon: '✅',
            action: 'approved',
            targetType: 'refund',
            category: 'finance',
            severity: 'info',
            metadata: JSON.stringify({
              transactionIds: transactions.map((t) => t.id),
              totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
              count: updateResult.count,
            }),
          },
        })

        // Send notifications to affected students and instructors
        const studentIds = [...new Set(transactions.map((t) => t.studentId).filter(Boolean))] as string[]
        const instructorIds = [...new Set(transactions.map((t) => t.instructorId).filter(Boolean))] as string[]

        // Create notifications for students
        const studentNotifications = transactions
          .filter((t) => t.studentId)
          .map((t) => ({
            userId: t.studentId!,
            type: 'system' as const,
            title: 'Refund Approved',
            content: `Your refund of $${t.amount} for "${t.course?.title || 'a course'}" has been approved.`,
            icon: '✅',
            link: '/dashboard/purchases',
            metadata: JSON.stringify({ transactionId: t.id, amount: t.amount, bulkAction: true }),
          }))

        // Create notifications for instructors
        const instructorNotifications = transactions
          .filter((t) => t.instructorId)
          .map((t) => ({
            userId: t.instructorId!,
            type: 'payout' as const,
            title: 'Refund Approved on Your Course',
            content: `A refund of $${t.amount} has been approved for "${t.course?.title || 'your course'}". This will affect your earnings.`,
            icon: '⚠️',
            link: '/instructor/earnings',
            metadata: JSON.stringify({ transactionId: t.id, amount: t.amount, bulkAction: true }),
          }))

        await db.notification.createMany({
          data: [...studentNotifications, ...instructorNotifications],
        })

        return NextResponse.json({
          success: true,
          processed: updateResult.count,
          skipped: transactionIds.length - transactions.length,
          totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
          notifiedStudents: studentIds.length,
          notifiedInstructors: instructorIds.length,
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action. Use: approve, reject, process, bulk_approve' }, { status: 400 })
    }
  } catch (error) {
    console.error('Refunds PATCH error:', error)
    return NextResponse.json({ error: 'Failed to process refund action' }, { status: 500 })
  }
}
