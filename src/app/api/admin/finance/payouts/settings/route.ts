import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to safely parse JSON string fields that may be stored as raw strings
function safeJsonParse(value: string | null | undefined, fallback: unknown = null): unknown {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    // If it's not valid JSON, check if it's comma-separated
    if (typeof value === 'string' && value.includes(',') && !value.startsWith('{') && !value.startsWith('[')) {
      return value.split(',').map(v => v.trim())
    }
    return value
  }
}

export async function GET() {
  try {
    const settings = await db.financialSettings.findFirst()
    const overrides = await db.commissionOverride.findMany({
      include: {
        instructor: { select: { id: true, name: true, email: true, avatar: true } }
      }
    })

    const instructors = await db.user.findMany({
      where: { role: 'instructor' },
      select: { id: true, name: true, email: true, avatar: true, commissionOverride: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      settings: settings ? {
        platformCommissionRate: settings.platformCommissionRate,
        instructorPayoutRate: settings.instructorPayoutRate,
        minimumPayoutAmount: settings.minimumPayoutAmount,
        withholdingTaxRate: settings.withholdingTaxRate,
        payoutHoldPeriodDays: settings.payoutHoldPeriodDays,
        defaultPayoutSchedule: settings.defaultPayoutSchedule,
        // Parse supportedPayoutMethods from comma-separated or JSON string into array
        supportedPayoutMethods: safeJsonParse(settings.supportedPayoutMethods, []),
        autoApproveRefunds: settings.autoApproveRefunds,
        disputeResolutionDays: settings.disputeResolutionDays,
      } : null,
      commissionOverrides: overrides,
      instructors,
    })
  } catch (error) {
    console.error('Payout settings GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch payout settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings, commissionOverride } = body

    if (settings) {
      const existing = await db.financialSettings.findFirst()
      if (existing) {
        const updated = await db.financialSettings.update({
          where: { id: existing.id },
          data: {
            platformCommissionRate: settings.platformCommissionRate ?? undefined,
            instructorPayoutRate: settings.instructorPayoutRate ?? undefined,
            minimumPayoutAmount: settings.minimumPayoutAmount ?? undefined,
            withholdingTaxRate: settings.withholdingTaxRate ?? undefined,
            payoutHoldPeriodDays: settings.payoutHoldPeriodDays ?? undefined,
            defaultPayoutSchedule: settings.defaultPayoutSchedule ?? undefined,
            supportedPayoutMethods: settings.supportedPayoutMethods ?? undefined,
          },
        })
        return NextResponse.json({ settings: updated })
      }
    }

    if (commissionOverride) {
      const { instructorId, commissionRate, reason } = commissionOverride
      if (!instructorId || commissionRate === undefined) {
        return NextResponse.json({ error: 'instructorId and commissionRate are required' }, { status: 400 })
      }

      if (commissionRate < 0 || commissionRate > 100) {
        return NextResponse.json({ error: 'Commission rate must be between 0 and 100' }, { status: 400 })
      }

      const existing = await db.commissionOverride.findUnique({
        where: { instructorId }
      })

      if (existing) {
        const updated = await db.commissionOverride.update({
          where: { instructorId },
          data: { commissionRate, reason: reason || undefined, createdBy: 'admin' },
        })
        return NextResponse.json({ commissionOverride: updated })
      } else {
        const created = await db.commissionOverride.create({
          data: { instructorId, commissionRate, reason, createdBy: 'admin' },
        })
        return NextResponse.json({ commissionOverride: created })
      }
    }

    if (body.removeOverride && body.instructorId) {
      await db.commissionOverride.delete({
        where: { instructorId: body.instructorId }
      }).catch(() => {})
      return NextResponse.json({ removed: true })
    }

    return NextResponse.json({ error: 'No valid update data provided' }, { status: 400 })
  } catch (error) {
    console.error('Payout settings PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update payout settings' }, { status: 500 })
  }
}
