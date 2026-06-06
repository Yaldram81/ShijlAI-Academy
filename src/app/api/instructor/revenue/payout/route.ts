import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/instructor/revenue/payout - Request a payout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instructorId, amount, payoutMethodId } = body

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payout amount' }, { status: 400 })
    }

    // Get default payout method if not specified
    let methodId = payoutMethodId
    if (!methodId) {
      const defaultMethod = await db.payoutMethod.findFirst({
        where: { instructorId, isDefault: true, isActive: true },
      })
      if (!defaultMethod) {
        const anyMethod = await db.payoutMethod.findFirst({
          where: { instructorId, isActive: true },
        })
        if (!anyMethod) {
          return NextResponse.json({ error: 'No payout method configured' }, { status: 400 })
        }
        methodId = anyMethod.id
      } else {
        methodId = defaultMethod.id
      }
    }

    const payoutMethod = await db.payoutMethod.findUnique({
      where: { id: methodId },
    })
    if (!payoutMethod || payoutMethod.instructorId !== instructorId) {
      return NextResponse.json({ error: 'Invalid payout method' }, { status: 400 })
    }

    // Create payout request
    const payout = await db.payout.create({
      data: {
        instructorId,
        amount,
        currency: 'USD',
        status: 'pending',
        method: payoutMethod.type,
        payoutMethodId: methodId,
        reference: `${payoutMethod.type.toUpperCase()}-${new Date().toISOString().split('T')[0]}-${payoutMethod.accountNumber?.slice(-4) || payoutMethod.phoneNumber?.slice(-4) || '0000'}`,
        periodStart: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        periodEnd: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
      },
    })

    return NextResponse.json({
      payout: {
        id: payout.id,
        amount: payout.amount,
        status: payout.status,
        method: payout.method,
        reference: payout.reference,
        requestedAt: payout.requestedAt,
      },
      message: 'Payout requested successfully',
    })
  } catch (error) {
    console.error('Error requesting payout:', error)
    return NextResponse.json({ error: 'Failed to request payout' }, { status: 500 })
  }
}
