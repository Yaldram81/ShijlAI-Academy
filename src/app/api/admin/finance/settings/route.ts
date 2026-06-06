import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get or create FinancialSettings (singleton pattern)
    let settings = await db.financialSettings.findFirst()

    if (!settings) {
      settings = await db.financialSettings.create({
        data: {},
      })
    }

    // Get all commission overrides with instructor details
    const commissionOverrides = await db.commissionOverride.findMany({
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get all instructors for the override dropdown
    const instructors = await db.user.findMany({
      where: { role: 'instructor' },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        commissionOverride: {
          select: { commissionRate: true, reason: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Parse supportedPayoutMethods from comma-separated string
    let supportedPayoutMethods: string[] = []
    try {
      supportedPayoutMethods = settings.supportedPayoutMethods
        ? settings.supportedPayoutMethods.split(',').map((m: string) => m.trim()).filter(Boolean)
        : ['bank_transfer', 'jazzcash', 'easypaisa', 'payoneer', 'stripe']
    } catch {
      supportedPayoutMethods = ['bank_transfer', 'jazzcash', 'easypaisa', 'payoneer', 'stripe']
    }

    return NextResponse.json({
      settings: {
        ...settings,
        supportedPayoutMethods,
        updatedAt: settings.updatedAt.toISOString(),
      },
      commissionOverrides: commissionOverrides.map((co) => ({
        id: co.id,
        instructorId: co.instructorId,
        commissionRate: co.commissionRate,
        reason: co.reason,
        createdBy: co.createdBy,
        createdAt: co.createdAt.toISOString(),
        updatedAt: co.updatedAt.toISOString(),
        instructor: co.instructor,
      })),
      instructors,
    })
  } catch (error) {
    console.error('Finance settings GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch finance settings' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    // Ensure settings row exists
    let settings = await db.financialSettings.findFirst()
    if (!settings) {
      settings = await db.financialSettings.create({ data: {} })
    }

    switch (action) {
      case 'update_settings': {
        const {
          platformCommissionRate,
          instructorPayoutRate,
          minimumPayoutAmount,
          refundPolicyDays,
          withholdingTaxRate,
          autoApproveRefunds,
          disputeResolutionDays,
          fiscalYearStart,
          currency,
          taxId,
          payoutHoldPeriodDays,
          defaultPayoutSchedule,
          supportedPayoutMethods,
        } = body

        const updateData: Record<string, unknown> = {}

        if (platformCommissionRate !== undefined) {
          if (platformCommissionRate < 0 || platformCommissionRate > 100) {
            return NextResponse.json({ error: 'Platform commission rate must be between 0 and 100' }, { status: 400 })
          }
          updateData.platformCommissionRate = platformCommissionRate
        }
        if (instructorPayoutRate !== undefined) {
          if (instructorPayoutRate < 0 || instructorPayoutRate > 100) {
            return NextResponse.json({ error: 'Instructor payout rate must be between 0 and 100' }, { status: 400 })
          }
          updateData.instructorPayoutRate = instructorPayoutRate
        }
        if (minimumPayoutAmount !== undefined) {
          if (minimumPayoutAmount < 0) {
            return NextResponse.json({ error: 'Minimum payout amount must be non-negative' }, { status: 400 })
          }
          updateData.minimumPayoutAmount = minimumPayoutAmount
        }
        if (refundPolicyDays !== undefined) {
          if (refundPolicyDays < 0) {
            return NextResponse.json({ error: 'Refund policy days must be non-negative' }, { status: 400 })
          }
          updateData.refundPolicyDays = refundPolicyDays
        }
        if (withholdingTaxRate !== undefined) {
          if (withholdingTaxRate < 0 || withholdingTaxRate > 100) {
            return NextResponse.json({ error: 'Withholding tax rate must be between 0 and 100' }, { status: 400 })
          }
          updateData.withholdingTaxRate = withholdingTaxRate
        }
        if (autoApproveRefunds !== undefined) {
          updateData.autoApproveRefunds = autoApproveRefunds
        }
        if (disputeResolutionDays !== undefined) {
          if (disputeResolutionDays < 0) {
            return NextResponse.json({ error: 'Dispute resolution days must be non-negative' }, { status: 400 })
          }
          updateData.disputeResolutionDays = disputeResolutionDays
        }
        if (fiscalYearStart !== undefined) {
          updateData.fiscalYearStart = fiscalYearStart
        }
        if (currency !== undefined) {
          updateData.currency = currency
        }
        if (taxId !== undefined) {
          updateData.taxId = taxId
        }
        if (payoutHoldPeriodDays !== undefined) {
          if (payoutHoldPeriodDays < 0) {
            return NextResponse.json({ error: 'Payout hold period days must be non-negative' }, { status: 400 })
          }
          updateData.payoutHoldPeriodDays = payoutHoldPeriodDays
        }
        if (defaultPayoutSchedule !== undefined) {
          const validSchedules = ['monthly', 'biweekly', 'weekly']
          if (!validSchedules.includes(defaultPayoutSchedule)) {
            return NextResponse.json({ error: 'Invalid payout schedule' }, { status: 400 })
          }
          updateData.defaultPayoutSchedule = defaultPayoutSchedule
        }
        if (supportedPayoutMethods !== undefined) {
          if (Array.isArray(supportedPayoutMethods)) {
            updateData.supportedPayoutMethods = supportedPayoutMethods.join(',')
          } else if (typeof supportedPayoutMethods === 'string') {
            updateData.supportedPayoutMethods = supportedPayoutMethods
          }
        }

        if (Object.keys(updateData).length === 0) {
          return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
        }

        const updated = await db.financialSettings.update({
          where: { id: settings.id },
          data: updateData,
        })

        // Log the settings update
        await db.activityLog.create({
          data: {
            type: 'settings_updated',
            title: 'Financial settings updated',
            description: `Updated: ${Object.keys(updateData).join(', ')}`,
            icon: '⚙️',
            action: 'updated',
            targetType: 'settings',
            targetId: settings.id,
            category: 'finance',
            severity: 'info',
          },
        })

        // Parse supportedPayoutMethods for response
        let responseMethods: string[] = []
        try {
          responseMethods = updated.supportedPayoutMethods
            ? updated.supportedPayoutMethods.split(',').map((m: string) => m.trim()).filter(Boolean)
            : []
        } catch {
          responseMethods = []
        }

        return NextResponse.json({
          settings: {
            ...updated,
            supportedPayoutMethods: responseMethods,
            updatedAt: updated.updatedAt.toISOString(),
          },
        })
      }

      case 'add_commission_override': {
        const { instructorId, commissionRate, reason } = body

        if (!instructorId) {
          return NextResponse.json({ error: 'instructorId is required' }, { status: 400 })
        }
        if (commissionRate === undefined || commissionRate === null) {
          return NextResponse.json({ error: 'commissionRate is required' }, { status: 400 })
        }
        if (commissionRate < 0 || commissionRate > 100) {
          return NextResponse.json({ error: 'Commission rate must be between 0 and 100' }, { status: 400 })
        }

        // Verify instructor exists
        const instructor = await db.user.findUnique({
          where: { id: instructorId },
          select: { id: true, name: true, email: true, role: true },
        })

        if (!instructor) {
          return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
        }

        // Upsert the commission override
        const existingOverride = await db.commissionOverride.findUnique({
          where: { instructorId },
        })

        let override
        if (existingOverride) {
          override = await db.commissionOverride.update({
            where: { instructorId },
            data: {
              commissionRate,
              reason: reason || null,
              createdBy: 'admin',
            },
          })
        } else {
          override = await db.commissionOverride.create({
            data: {
              instructorId,
              commissionRate,
              reason: reason || null,
              createdBy: 'admin',
            },
          })
        }

        // Log activity
        await db.activityLog.create({
          data: {
            type: 'revenue_split_changed',
            title: `Commission override ${existingOverride ? 'updated' : 'added'} for ${instructor.name}`,
            description: `Rate: ${commissionRate}%${reason ? ` | Reason: ${reason}` : ''}`,
            icon: '💰',
            action: existingOverride ? 'updated' : 'created',
            targetType: 'settings',
            targetId: instructorId,
            targetName: instructor.name,
            category: 'finance',
            severity: 'info',
          },
        })

        // Notify the instructor
        await db.notification.create({
          data: {
            userId: instructorId,
            type: 'system',
            title: 'Commission Rate Updated',
            content: `Your commission rate has been ${existingOverride ? 'updated' : 'set'} to ${commissionRate}%.${reason ? ` Reason: ${reason}` : ''}`,
            icon: '💰',
            metadata: JSON.stringify({ commissionRate, reason, action: existingOverride ? 'updated' : 'added' }),
          },
        })

        return NextResponse.json({
          commissionOverride: {
            ...override,
            createdAt: override.createdAt.toISOString(),
            updatedAt: override.updatedAt.toISOString(),
          },
        })
      }

      case 'remove_commission_override': {
        const { instructorId } = body

        if (!instructorId) {
          return NextResponse.json({ error: 'instructorId is required' }, { status: 400 })
        }

        const existingOverride = await db.commissionOverride.findUnique({
          where: { instructorId },
          include: { instructor: { select: { name: true } } },
        })

        if (!existingOverride) {
          return NextResponse.json({ error: 'Commission override not found' }, { status: 404 })
        }

        await db.commissionOverride.delete({
          where: { instructorId },
        })

        // Log activity
        await db.activityLog.create({
          data: {
            type: 'revenue_split_changed',
            title: `Commission override removed for ${existingOverride.instructor.name}`,
            description: `Previous rate: ${existingOverride.commissionRate}%`,
            icon: '💰',
            action: 'deleted',
            targetType: 'settings',
            targetId: instructorId,
            targetName: existingOverride.instructor.name,
            category: 'finance',
            severity: 'info',
          },
        })

        // Notify the instructor
        await db.notification.create({
          data: {
            userId: instructorId,
            type: 'system',
            title: 'Commission Override Removed',
            content: 'Your custom commission rate has been removed. The default rate will now apply.',
            icon: '💰',
            metadata: JSON.stringify({ action: 'removed', previousRate: existingOverride.commissionRate }),
          },
        })

        return NextResponse.json({ removed: true })
      }

      default:
        return NextResponse.json({ error: 'Invalid action. Use: update_settings, add_commission_override, remove_commission_override' }, { status: 400 })
    }
  } catch (error) {
    console.error('Finance settings PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update finance settings' }, { status: 500 })
  }
}
