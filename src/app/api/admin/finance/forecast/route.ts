import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface MonthlyDataPoint {
  month: string       // YYYY-MM format
  revenue: number
  enrollments: number
  platformCut: number
  instructorPayouts: number
}

// Simple linear regression: y = mx + b
function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = points.length
  if (n < 2) return { slope: 0, intercept: points[0]?.y || 0 }

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0

  for (const p of points) {
    sumX += p.x
    sumY += p.y
    sumXY += p.x * p.y
    sumX2 += p.x * p.x
  }

  const denominator = n * sumX2 - sumX * sumX
  if (denominator === 0) return { slope: 0, intercept: sumY / n }

  const slope = (n * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

// Calculate R-squared for confidence assessment
function rSquared(points: { x: number; y: number }[], slope: number, intercept: number): number {
  const n = points.length
  if (n < 2) return 0

  const meanY = points.reduce((s, p) => s + p.y, 0) / n
  let ssTot = 0
  let ssRes = 0

  for (const p of points) {
    const predicted = slope * p.x + intercept
    ssTot += (p.y - meanY) ** 2
    ssRes += (p.y - predicted) ** 2
  }

  if (ssTot === 0) return 1
  return Math.max(0, 1 - ssRes / ssTot)
}

function getConfidenceLevel(r2: number): 'low' | 'medium' | 'high' {
  if (r2 >= 0.7) return 'high'
  if (r2 >= 0.4) return 'medium'
  return 'low'
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'next_quarter' // next_month, next_quarter, next_year

    const now = new Date()

    // Get last 6 months of transaction data for regression
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const transactions = await db.transaction.findMany({
      where: {
        type: 'enrollment',
        status: 'completed',
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        amount: true,
        platformFee: true,
        instructorEarning: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Also get refund data for the same period
    const refunds = await db.transaction.findMany({
      where: {
        type: 'refund',
        status: { in: ['refunded', 'pending'] },
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Enrollment count data
    const enrollments = await db.enrollment.findMany({
      where: {
        enrolledAt: { gte: sixMonthsAgo },
      },
      select: {
        enrolledAt: true,
      },
      orderBy: { enrolledAt: 'asc' },
    })

    // Aggregate data by month
    const monthlyMap = new Map<string, MonthlyDataPoint>()

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyMap.set(key, {
        month: key,
        revenue: 0,
        enrollments: 0,
        platformCut: 0,
        instructorPayouts: 0,
      })
    }

    // Aggregate enrollment transactions by month
    for (const tx of transactions) {
      const d = new Date(tx.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const entry = monthlyMap.get(key)
      if (entry) {
        entry.revenue += tx.amount
        entry.platformCut += tx.platformFee
        entry.instructorPayouts += tx.instructorEarning
      }
    }

    // Aggregate refunds by month (deduct from revenue for net)
    const refundByMonth = new Map<string, number>()
    for (const r of refunds) {
      const d = new Date(r.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      refundByMonth.set(key, (refundByMonth.get(key) || 0) + r.amount)
    }

    // Aggregate enrollments by month
    for (const e of enrollments) {
      const d = new Date(e.enrolledAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const entry = monthlyMap.get(key)
      if (entry) {
        entry.enrollments += 1
      }
    }

    // Get FinancialSettings for rates
    const settings = await db.financialSettings.findFirst()
    const platformRate = settings?.platformCommissionRate ?? 20
    const instructorRate = settings?.instructorPayoutRate ?? 80

    // Build data points for regression
    const monthlyData = Array.from(monthlyMap.values())
    const revenuePoints = monthlyData.map((d, i) => ({ x: i, y: d.revenue }))
    const enrollmentPoints = monthlyData.map((d, i) => ({ x: i, y: d.enrollments }))

    // Run regressions
    const revenueRegression = linearRegression(revenuePoints)
    const enrollmentRegression = linearRegression(enrollmentPoints)

    // Calculate confidence
    const revenueR2 = rSquared(revenuePoints, revenueRegression.slope, revenueRegression.intercept)
    const enrollmentR2 = rSquared(enrollmentPoints, enrollmentRegression.slope, enrollmentRegression.intercept)
    const avgR2 = (revenueR2 + enrollmentR2) / 2
    const confidence = getConfidenceLevel(avgR2)

    // Determine number of months to forecast
    let forecastMonths: number
    switch (period) {
      case 'next_month':
        forecastMonths = 1
        break
      case 'next_year':
        forecastMonths = 12
        break
      case 'next_quarter':
      default:
        forecastMonths = 3
        break
    }

    // Calculate growth rate
    const recentRevenue = monthlyData[monthlyData.length - 1]?.revenue || 0
    const previousRevenue = monthlyData[monthlyData.length - 2]?.revenue || 0
    const growthRate = previousRevenue > 0
      ? Math.round(((recentRevenue - previousRevenue) / previousRevenue) * 100 * 10) / 10
      : 0

    // Generate forecasts
    const lastMonthIndex = monthlyData.length - 1
    let projectedRevenue = 0
    let projectedEnrollments = 0
    let projectedPlatformCut = 0
    let projectedInstructorPayouts = 0

    const trendData: Array<{
      month: string
      projectedRevenue: number
      projectedEnrollments: number
      projectedPlatformCut: number
      projectedInstructorPayouts: number
    }> = []

    for (let i = 1; i <= forecastMonths; i++) {
      const forecastIndex = lastMonthIndex + i
      const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`

      // Predict using linear regression, clamped to non-negative
      const predRevenue = Math.max(0, Math.round(revenueRegression.slope * forecastIndex + revenueRegression.intercept))
      const predEnrollments = Math.max(0, Math.round(enrollmentRegression.slope * forecastIndex + enrollmentRegression.intercept))

      // Apply rates
      const predPlatformCut = Math.round(predRevenue * (platformRate / 100))
      const predInstructorPayouts = Math.round(predRevenue * (instructorRate / 100))

      projectedRevenue += predRevenue
      projectedEnrollments += predEnrollments
      projectedPlatformCut += predPlatformCut
      projectedInstructorPayouts += predInstructorPayouts

      trendData.push({
        month: monthKey,
        projectedRevenue: predRevenue,
        projectedEnrollments: predEnrollments,
        projectedPlatformCut: predPlatformCut,
        projectedInstructorPayouts: predInstructorPayouts,
      })
    }

    // Historical trend data for chart display
    const historicalTrend = monthlyData.map((d) => ({
      month: d.month,
      revenue: d.revenue,
      enrollments: d.enrollments,
      platformCut: d.platformCut,
      instructorPayouts: d.instructorPayouts,
      refunds: refundByMonth.get(d.month) || 0,
    }))

    // Total historical values for context
    const totalHistoricalRevenue = monthlyData.reduce((s, d) => s + d.revenue, 0)
    const totalHistoricalEnrollments = monthlyData.reduce((s, d) => s + d.enrollments, 0)

    // Average monthly values
    const avgMonthlyRevenue = monthlyData.length > 0 ? Math.round(totalHistoricalRevenue / monthlyData.length) : 0
    const avgMonthlyEnrollments = monthlyData.length > 0 ? Math.round(totalHistoricalEnrollments / monthlyData.length) : 0

    // Data consistency metrics
    const revenueValues = monthlyData.map((d) => d.revenue)
    const meanRevenue = revenueValues.reduce((a, b) => a + b, 0) / revenueValues.length
    const varianceRevenue = revenueValues.reduce((sum, v) => sum + (v - meanRevenue) ** 2, 0) / revenueValues.length
    const coefficientOfVariation = meanRevenue > 0 ? Math.sqrt(varianceRevenue) / meanRevenue : 0

    return NextResponse.json({
      period,
      forecast: {
        projectedRevenue,
        projectedEnrollments,
        projectedPlatformCut,
        projectedInstructorPayouts,
        growthRate,
      },
      confidence: {
        level: confidence,
        rSquared: Math.round(avgR2 * 1000) / 1000,
        revenueRSquared: Math.round(revenueR2 * 1000) / 1000,
        enrollmentRSquared: Math.round(enrollmentR2 * 1000) / 1000,
        coefficientOfVariation: Math.round(coefficientOfVariation * 1000) / 1000,
        dataPoints: monthlyData.length,
      },
      trend: {
        historical: historicalTrend,
        projected: trendData,
      },
      summary: {
        avgMonthlyRevenue,
        avgMonthlyEnrollments,
        totalHistoricalRevenue,
        totalHistoricalEnrollments,
        regressionSlope: Math.round(revenueRegression.slope * 100) / 100,
        regressionIntercept: Math.round(revenueRegression.intercept),
      },
      settings: {
        platformRate,
        instructorRate,
      },
    })
  } catch (error) {
    console.error('Finance forecast GET error:', error)
    return NextResponse.json({ error: 'Failed to generate revenue forecast' }, { status: 500 })
  }
}
