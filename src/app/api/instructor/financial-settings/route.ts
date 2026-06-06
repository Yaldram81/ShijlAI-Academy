import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/financial-settings - Returns financial settings for the instructor
// If no FinancialSettings row exists, creates one with defaults
// Also checks for per-instructor CommissionOverride
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    // Get or create global financial settings
    let financialSettings = await db.financialSettings.findFirst()

    if (!financialSettings) {
      // Seed default financial settings
      financialSettings = await db.financialSettings.create({
        data: {
          platformCommissionRate: 20,
          instructorPayoutRate: 80,
          minimumPayoutAmount: 2000,
          refundPolicyDays: 30,
          withholdingTaxRate: 10,
          autoApproveRefunds: false,
          disputeResolutionDays: 14,
          fiscalYearStart: 'July',
          currency: 'USD',
          payoutHoldPeriodDays: 14,
          defaultPayoutSchedule: 'monthly',
          supportedPayoutMethods: 'bank_transfer,jazzcash,easypaisa,payoneer,stripe',
        },
      })
    }

    // Check for instructor-specific commission override
    let commissionOverride = null
    if (instructorId) {
      commissionOverride = await db.commissionOverride.findUnique({
        where: { instructorId },
      })
    }

    // Calculate effective rates
    const platformCommissionRate = financialSettings.platformCommissionRate
    const instructorPayoutRate = financialSettings.instructorPayoutRate
    const effectiveCommissionRate = commissionOverride?.commissionRate ?? platformCommissionRate
    const effectivePayoutRate = commissionOverride ? (100 - commissionOverride.commissionRate) : instructorPayoutRate

    return NextResponse.json({
      financialSettings: {
        id: financialSettings.id,
        platformCommissionRate,
        instructorPayoutRate,
        minimumPayoutAmount: financialSettings.minimumPayoutAmount,
        refundPolicyDays: financialSettings.refundPolicyDays,
        withholdingTaxRate: financialSettings.withholdingTaxRate,
        autoApproveRefunds: financialSettings.autoApproveRefunds,
        disputeResolutionDays: financialSettings.disputeResolutionDays,
        fiscalYearStart: financialSettings.fiscalYearStart,
        currency: financialSettings.currency,
        payoutHoldPeriodDays: financialSettings.payoutHoldPeriodDays,
        defaultPayoutSchedule: financialSettings.defaultPayoutSchedule,
        supportedPayoutMethods: financialSettings.supportedPayoutMethods,
      },
      commissionOverride: commissionOverride
        ? {
            id: commissionOverride.id,
            commissionRate: commissionOverride.commissionRate,
            reason: commissionOverride.reason,
          }
        : null,
      effectiveRates: {
        platformCommissionRate: effectiveCommissionRate,
        instructorPayoutRate: effectivePayoutRate,
        hasOverride: !!commissionOverride,
      },
    })
  } catch (error) {
    console.error('Error fetching financial settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial settings' },
      { status: 500 }
    )
  }
}
