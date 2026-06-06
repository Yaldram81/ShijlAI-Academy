import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/ai-config/usage-logs — List usage logs with filtering and pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const providerId = searchParams.get('providerId')
    const modelId = searchParams.get('modelId')
    const feature = searchParams.get('feature')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Build where clause
    const where: Record<string, unknown> = {}
    if (providerId) where.providerId = providerId
    if (modelId) where.modelId = modelId
    if (feature) where.feature = feature
    if (status) where.status = status
    if (startDate || endDate) {
      const createdAt: Record<string, Date> = {}
      if (startDate) createdAt.gte = new Date(startDate)
      if (endDate) createdAt.lte = new Date(endDate)
      where.createdAt = createdAt
    }

    const skip = (page - 1) * limit

    const [logs, totalCount] = await Promise.all([
      db.aIUsageLog.findMany({
        where,
        include: {
          provider: { select: { id: true, name: true, slug: true } },
          model: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.aIUsageLog.count({ where }),
    ])

    // Compute aggregate stats for the filtered set
    const aggregate = await db.aIUsageLog.aggregate({
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        costUSD: true,
      },
      _avg: { latencyMs: true },
      _count: true,
      where,
    })

    // Status distribution
    const statusDist = await db.aIUsageLog.groupBy({
      by: ['status'],
      _count: true,
      where,
    })

    // Feature distribution
    const featureDist = await db.aIUsageLog.groupBy({
      by: ['feature'],
      _sum: { costUSD: true, totalTokens: true },
      _count: true,
      where,
    })

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        totalRequests: aggregate._count,
        totalPromptTokens: aggregate._sum.promptTokens || 0,
        totalCompletionTokens: aggregate._sum.completionTokens || 0,
        totalTokens: aggregate._sum.totalTokens || 0,
        totalCostUSD: Number(aggregate._sum.costUSD || 0),
        avgLatencyMs: aggregate._avg.latencyMs ? Math.round(aggregate._avg.latencyMs) : 0,
        statusDistribution: statusDist.map(s => ({
          status: s.status,
          count: s._count,
        })),
        featureDistribution: featureDist.map(f => ({
          feature: f.feature,
          totalTokens: f._sum.totalTokens || 0,
          costUSD: Number(f._sum.costUSD || 0),
          requestCount: f._count,
        })),
      },
    })
  } catch (error) {
    console.error('Usage logs fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage logs' },
      { status: 500 }
    )
  }
}
