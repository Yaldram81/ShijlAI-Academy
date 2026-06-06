import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to get YYYY-MM from a Date
function toMonthKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

// Helper to generate last N month keys
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || 'all'
    const instructorId = searchParams.get('instructorId') || 'all'
    const method = searchParams.get('method') || 'all'
    const search = searchParams.get('search') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sort = searchParams.get('sort') || 'newest'

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (status === 'pending') where.status = 'pending'
    else if (status === 'processed') where.status = { in: ['completed', 'processing'] }
    else if (status === 'disputed') where.status = 'disputed'
    else if (status === 'failed') where.status = 'failed'
    else if (status !== 'all') where.status = status

    if (instructorId !== 'all') where.instructorId = instructorId
    if (method !== 'all') where.method = method

    // Search filter: search by instructor name or payout reference
    if (search) {
      where.OR = [
        { reference: { contains: search } },
        { notes: { contains: search } },
        { instructor: { name: { contains: search } } },
        { instructor: { email: { contains: search } } },
      ]
    }

    if (dateFrom || dateTo) {
      where.requestedAt = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      }
    }

    const orderBy: Record<string, string> = sort === 'oldest' ? { requestedAt: 'asc' } :
      sort === 'amount_high' ? { amount: 'desc' } :
      sort === 'amount_low' ? { amount: 'asc' } :
      { requestedAt: 'desc' }

    const [payouts, total] = await Promise.all([
      db.payout.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          method: true,
          payoutMethodId: true,
          reference: true,
          notes: true,
          periodStart: true,
          periodEnd: true,
          requestedAt: true,
          processedAt: true,
          completedAt: true,
          disputeReason: true,
          disputeResolution: true,
          disputedAt: true,
          taxWithheld: true,
          grossEarning: true,
          createdAt: true,
          instructor: {
            select: {
              id: true,
              name: true,
              avatar: true,
              email: true,
              commissionOverride: { select: { commissionRate: true, reason: true } },
            }
          },
        },
      }),
      db.payout.count({ where }),
    ])

    // Enrich with payout method details
    const payoutMethodIds = payouts.map(p => p.payoutMethodId).filter(Boolean) as string[]
    const payoutMethods = payoutMethodIds.length > 0 ? await db.payoutMethod.findMany({
      where: { id: { in: payoutMethodIds } },
    }) : []
    const methodMap = new Map(payoutMethods.map(m => [m.id, m]))

    const enrichedPayouts = payouts.map(p => ({
      ...p,
      payoutMethod: p.payoutMethodId ? methodMap.get(p.payoutMethodId) || null : null,
    }))

    // Existing basic stats
    const [pendingCount, processedCount, disputedCount, failedCount, cancelledCount] = await Promise.all([
      db.payout.count({ where: { status: 'pending' } }),
      db.payout.count({ where: { status: { in: ['completed', 'processing'] } } }),
      db.payout.count({ where: { status: 'disputed' } }),
      db.payout.count({ where: { status: 'failed' } }),
      db.payout.count({ where: { status: 'cancelled' } }),
    ])

    const [pendingTotal, processedTotal, failedTotal, cancelledTotal] = await Promise.all([
      db.payout.aggregate({ where: { status: 'pending' }, _sum: { amount: true } }),
      db.payout.aggregate({ where: { status: { in: ['completed', 'processing'] } }, _sum: { amount: true } }),
      db.payout.aggregate({ where: { status: 'failed' }, _sum: { amount: true } }),
      db.payout.aggregate({ where: { status: 'cancelled' }, _sum: { amount: true } }),
    ])

    // === NEW: Enhanced analytics stats ===

    // 1. Payout method breakdown for the current filter
    const allFilteredPayouts = await db.payout.findMany({
      where,
      select: { method: true, amount: true },
    })
    const methodBreakdownMap = new Map<string, { method: string; count: number; totalAmount: number }>()
    for (const p of allFilteredPayouts) {
      const existing = methodBreakdownMap.get(p.method)
      if (existing) {
        existing.count += 1
        existing.totalAmount += p.amount
      } else {
        methodBreakdownMap.set(p.method, { method: p.method, count: 1, totalAmount: p.amount })
      }
    }
    const payoutMethodBreakdown = Array.from(methodBreakdownMap.values())

    // 2. Monthly payouts for the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const monthlyPayoutData = await db.payout.findMany({
      where: { requestedAt: { gte: sixMonthsAgo } },
      select: { requestedAt: true, amount: true },
    })
    const monthKeys = getLastNMonthKeys(6)
    const monthlyMap = new Map<string, { month: string; count: number; totalAmount: number }>()
    for (const mk of monthKeys) {
      monthlyMap.set(mk, { month: mk, count: 0, totalAmount: 0 })
    }
    for (const p of monthlyPayoutData) {
      const key = toMonthKey(new Date(p.requestedAt))
      const entry = monthlyMap.get(key)
      if (entry) {
        entry.count += 1
        entry.totalAmount += p.amount
      }
    }
    const monthlyPayouts = Array.from(monthlyMap.values())

    // 3. Top 5 instructors by total payout amount (completed payouts)
    const topInstructorData = await db.payout.findMany({
      where: { status: 'completed' },
      select: {
        instructorId: true,
        amount: true,
        instructor: { select: { id: true, name: true, avatar: true } },
      },
    })
    const instructorTotals = new Map<string, { instructorId: string; name: string; avatar: string | null; totalAmount: number }>()
    for (const p of topInstructorData) {
      const existing = instructorTotals.get(p.instructorId)
      if (existing) {
        existing.totalAmount += p.amount
      } else {
        instructorTotals.set(p.instructorId, {
          instructorId: p.instructorId,
          name: p.instructor.name,
          avatar: p.instructor.avatar,
          totalAmount: p.amount,
        })
      }
    }
    const topInstructorsByPayout = Array.from(instructorTotals.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5)

    // 4. Average processing days (completed payouts with both requestedAt and completedAt)
    const completedPayoutsForAvg = await db.payout.findMany({
      where: {
        status: 'completed',
        completedAt: { not: null as unknown as Date },
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

    return NextResponse.json({
      payouts: enrichedPayouts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: {
        pending: pendingCount,
        processed: processedCount,
        disputed: disputedCount,
        failed: failedCount,
        cancelled: cancelledCount,
        total,
        pendingAmount: pendingTotal._sum.amount || 0,
        processedAmount: processedTotal._sum.amount || 0,
        failedAmount: failedTotal._sum.amount || 0,
        cancelledAmount: cancelledTotal._sum.amount || 0,
        // New stats
        payoutMethodBreakdown,
        monthlyPayouts,
        topInstructorsByPayout,
        avgProcessingDays,
      },
    })
  } catch (error) {
    console.error('Payouts list error:', error)
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { payoutId, action, resolutionNote, adjustmentAmount, reference, note } = body

    if (!payoutId || !action) {
      return NextResponse.json({ error: 'payoutId and action are required' }, { status: 400 })
    }

    const payout = await db.payout.findUnique({
      where: { id: payoutId },
      include: { instructor: true },
    })

    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
    }

    switch (action) {
      case 'pay': {
        // Only allow 'pay' action if payout is in 'pending' or 'processing' status
        if (payout.status !== 'pending' && payout.status !== 'processing') {
          return NextResponse.json(
            { error: `Cannot pay a payout with status '${payout.status}'. Only 'pending' or 'processing' payouts can be paid.` },
            { status: 400 }
          )
        }
        const updated = await db.payout.update({
          where: { id: payoutId },
          data: {
            status: 'completed',
            processedAt: new Date(),
            completedAt: new Date(),
            reference: reference || `PAY-${Date.now()}`,
            notes: payout.notes ? `${payout.notes} | Processed on ${new Date().toLocaleDateString()}` : `Processed on ${new Date().toLocaleDateString()}`,
          },
        })
        // Log activity
        await db.activityLog.create({
          data: {
            userId: payout.instructorId,
            type: 'payout_processed',
            title: 'Payout Processed',
            description: `Payout of $${payout.amount} processed for ${payout.instructor.name}`,
            action: 'processed',
            targetType: 'payout',
            targetId: payoutId,
            targetName: `$${payout.amount}`,
            category: 'finance',
          },
        })
        return NextResponse.json({ payout: updated })
      }

      case 'process': {
        const updated = await db.payout.update({
          where: { id: payoutId },
          data: {
            status: 'processing',
            processedAt: new Date(),
          },
        })
        await db.activityLog.create({
          data: {
            userId: payout.instructorId,
            type: 'payout_processed',
            title: 'Payout Set to Processing',
            description: `Payout of $${payout.amount} moved to processing for ${payout.instructor.name}`,
            action: 'processed',
            targetType: 'payout',
            targetId: payoutId,
            targetName: `$${payout.amount}`,
            category: 'finance',
          },
        })
        return NextResponse.json({ payout: updated })
      }

      case 'resolve_dispute': {
        if (!resolutionNote) {
          return NextResponse.json({ error: 'resolutionNote is required for dispute resolution' }, { status: 400 })
        }
        const updated = await db.payout.update({
          where: { id: payoutId },
          data: {
            disputeResolution: resolutionNote,
            status: 'completed',
            completedAt: new Date(),
            reference: reference || `PAY-${Date.now()}`,
          },
        })
        await db.activityLog.create({
          data: {
            userId: payout.instructorId,
            type: 'payout_disputed',
            title: 'Dispute Resolved',
            description: `Dispute resolved for payout $${payout.amount}: ${resolutionNote}`,
            action: 'processed',
            targetType: 'payout',
            targetId: payoutId,
            targetName: `$${payout.amount}`,
            category: 'finance',
          },
        })
        return NextResponse.json({ payout: updated })
      }

      case 'issue_adjustment': {
        const adjAmount = adjustmentAmount || 0
        const updated = await db.payout.update({
          where: { id: payoutId },
          data: {
            amount: payout.amount + adjAmount,
            notes: payout.notes ? `${payout.notes} | Adjustment: $${adjAmount}` : `Adjustment: $${adjAmount}`,
            disputeResolution: `Adjustment of $${adjAmount} issued. ${resolutionNote || ''}`,
            status: 'completed',
            completedAt: new Date(),
          },
        })
        await db.activityLog.create({
          data: {
            userId: payout.instructorId,
            type: 'payout_processed',
            title: 'Payout Adjustment Issued',
            description: `Adjustment of $${adjAmount} issued for payout ${payoutId}`,
            action: 'updated',
            targetType: 'payout',
            targetId: payoutId,
            targetName: `$${payout.amount}`,
            category: 'finance',
          },
        })
        return NextResponse.json({ payout: updated })
      }

      case 'escalate_dispute': {
        const updated = await db.payout.update({
          where: { id: payoutId },
          data: {
            notes: payout.notes ? `${payout.notes} | Escalated` : 'Escalated',
          },
        })
        await db.activityLog.create({
          data: {
            userId: payout.instructorId,
            type: 'payout_disputed',
            title: 'Dispute Escalated',
            description: `Dispute escalated for payout $${payout.amount}`,
            action: 'updated',
            targetType: 'payout',
            targetId: payoutId,
            targetName: `$${payout.amount}`,
            category: 'finance',
            severity: 'warning',
          },
        })
        return NextResponse.json({ payout: updated })
      }

      case 'cancel': {
        const updated = await db.payout.update({
          where: { id: payoutId },
          data: { status: 'cancelled' },
        })
        await db.activityLog.create({
          data: {
            userId: payout.instructorId,
            type: 'payout_processed',
            title: 'Payout Cancelled',
            description: `Payout of $${payout.amount} cancelled for ${payout.instructor.name}`,
            action: 'deleted',
            targetType: 'payout',
            targetId: payoutId,
            targetName: `$${payout.amount}`,
            category: 'finance',
          },
        })
        return NextResponse.json({ payout: updated })
      }

      // === NEW PATCH ACTIONS ===

      case 'add_note': {
        if (!note || typeof note !== 'string' || note.trim().length === 0) {
          return NextResponse.json({ error: 'note is required and must be a non-empty string' }, { status: 400 })
        }
        const timestamp = new Date().toISOString()
        const newNoteEntry = `[${timestamp}] ${note.trim()}`
        const updated = await db.payout.update({
          where: { id: payoutId },
          data: {
            notes: payout.notes ? `${payout.notes} | ${newNoteEntry}` : newNoteEntry,
          },
        })
        await db.activityLog.create({
          data: {
            userId: payout.instructorId,
            type: 'payout_processed',
            title: 'Note Added to Payout',
            description: `Admin note added to payout $${payout.amount}: ${note.trim().substring(0, 100)}`,
            action: 'updated',
            targetType: 'payout',
            targetId: payoutId,
            targetName: `$${payout.amount}`,
            category: 'finance',
          },
        })
        return NextResponse.json({ payout: updated })
      }

      case 'retry': {
        if (payout.status !== 'failed') {
          return NextResponse.json({ error: 'Can only retry failed payouts' }, { status: 400 })
        }
        const updated = await db.payout.update({
          where: { id: payoutId },
          data: {
            status: 'pending',
            processedAt: null,
            notes: payout.notes ? `${payout.notes} | Retried from failed at ${new Date().toISOString()}` : `Retried from failed at ${new Date().toISOString()}`,
          },
        })
        await db.activityLog.create({
          data: {
            userId: payout.instructorId,
            type: 'payout_processed',
            title: 'Failed Payout Retried',
            description: `Failed payout of $${payout.amount} retried for ${payout.instructor.name}`,
            action: 'updated',
            targetType: 'payout',
            targetId: payoutId,
            targetName: `$${payout.amount}`,
            category: 'finance',
          },
        })
        return NextResponse.json({ payout: updated })
      }

      case 'update_reference': {
        if (!reference || typeof reference !== 'string' || reference.trim().length === 0) {
          return NextResponse.json({ error: 'reference is required and must be a non-empty string' }, { status: 400 })
        }
        const oldReference = payout.reference
        const updated = await db.payout.update({
          where: { id: payoutId },
          data: {
            reference: reference.trim(),
            notes: payout.notes
              ? `${payout.notes} | Reference updated from "${oldReference || 'none'}" to "${reference.trim()}" at ${new Date().toISOString()}`
              : `Reference updated from "${oldReference || 'none'}" to "${reference.trim()}" at ${new Date().toISOString()}`,
          },
        })
        await db.activityLog.create({
          data: {
            userId: payout.instructorId,
            type: 'payout_processed',
            title: 'Payout Reference Updated',
            description: `Reference updated for payout $${payout.amount}: "${oldReference || 'none'}" → "${reference.trim()}"`,
            action: 'updated',
            targetType: 'payout',
            targetId: payoutId,
            targetName: `$${payout.amount}`,
            category: 'finance',
          },
        })
        return NextResponse.json({ payout: updated })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Payout action error:', error)
    return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, payoutIds, scheduleDate } = body

    if (action === 'batch_pay' && Array.isArray(payoutIds)) {
      if (payoutIds.length === 0) {
        return NextResponse.json({ error: 'payoutIds must be a non-empty array' }, { status: 400 })
      }
      if (payoutIds.length > 100) {
        return NextResponse.json({ error: 'Cannot process more than 100 payouts at once' }, { status: 400 })
      }

      const result = await db.payout.updateMany({
        where: { id: { in: payoutIds }, status: 'pending' },
        data: {
          status: 'completed',
          processedAt: new Date(),
          completedAt: new Date(),
          reference: `BATCH-${Date.now()}`,
        },
      })

      await db.activityLog.create({
        data: {
          type: 'payout_processed',
          title: 'Batch Payout Processed',
          description: `${result.count} payouts batch-processed`,
          action: 'processed',
          targetType: 'payout',
          category: 'finance',
          metadata: JSON.stringify({ payoutIds, count: result.count }),
        },
      })

      return NextResponse.json({ updated: result.count })
    }

    if (action === 'schedule_batch' && scheduleDate) {
      // In a real app, this would create a scheduled job
      // For now, just mark the pending payouts with a note
      const pendingPayouts = await db.payout.findMany({
        where: { status: 'pending' },
        select: { id: true },
      })
      return NextResponse.json({
        scheduled: true,
        payoutCount: pendingPayouts.length,
        scheduledFor: scheduleDate,
      })
    }

    // === NEW BATCH ACTIONS ===

    if (action === 'batch_cancel' && Array.isArray(payoutIds)) {
      if (payoutIds.length === 0) {
        return NextResponse.json({ error: 'payoutIds must be a non-empty array' }, { status: 400 })
      }
      if (payoutIds.length > 100) {
        return NextResponse.json({ error: 'Cannot cancel more than 100 payouts at once' }, { status: 400 })
      }

      // Only cancel payouts that are in a cancellable state (pending or processing)
      const result = await db.payout.updateMany({
        where: {
          id: { in: payoutIds },
          status: { in: ['pending', 'processing', 'failed'] },
        },
        data: { status: 'cancelled' },
      })

      await db.activityLog.create({
        data: {
          type: 'payout_processed',
          title: 'Batch Payout Cancelled',
          description: `${result.count} payouts batch-cancelled`,
          action: 'deleted',
          targetType: 'payout',
          category: 'finance',
          severity: 'warning',
          metadata: JSON.stringify({ payoutIds, count: result.count }),
        },
      })

      return NextResponse.json({ cancelled: result.count })
    }

    if (action === 'batch_process' && Array.isArray(payoutIds)) {
      if (payoutIds.length === 0) {
        return NextResponse.json({ error: 'payoutIds must be a non-empty array' }, { status: 400 })
      }
      if (payoutIds.length > 100) {
        return NextResponse.json({ error: 'Cannot process more than 100 payouts at once' }, { status: 400 })
      }

      // Move pending payouts to processing
      const result = await db.payout.updateMany({
        where: {
          id: { in: payoutIds },
          status: 'pending',
        },
        data: {
          status: 'processing',
          processedAt: new Date(),
        },
      })

      await db.activityLog.create({
        data: {
          type: 'payout_processed',
          title: 'Batch Payout Set to Processing',
          description: `${result.count} pending payouts moved to processing`,
          action: 'processed',
          targetType: 'payout',
          category: 'finance',
          metadata: JSON.stringify({ payoutIds, count: result.count }),
        },
      })

      return NextResponse.json({ processed: result.count })
    }

    return NextResponse.json({ error: 'Invalid batch action' }, { status: 400 })
  } catch (error) {
    console.error('Payout batch error:', error)
    return NextResponse.json({ error: 'Failed to process batch' }, { status: 500 })
  }
}
