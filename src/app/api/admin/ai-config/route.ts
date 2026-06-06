import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to mask API keys — show only last 4 chars
function maskApiKey(key: string | null): string | null {
  if (!key) return null
  if (key.length <= 4) return '****'
  return '****' + key.slice(-4)
}

// GET /api/admin/ai-config — Fetch AI configuration and enhanced usage stats
export async function GET() {
  try {
    // Fetch or create the singleton config record
    let config = await db.aIConfiguration.findFirst()
    if (!config) {
      config = await db.aIConfiguration.create({ data: {} })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Fetch counts in parallel
    const [
      providersCount,
      modelsCount,
      promptTemplatesCount,
      activeProviders,
      totalUsageLogs,
      monthlyUsageLogs,
    ] = await Promise.all([
      db.aIProvider.count(),
      db.aIModel.count(),
      db.aIPromptTemplate.count(),
      db.aIProvider.count({ where: { isActive: true } }),
      db.aIUsageLog.count(),
      db.aIUsageLog.count({ where: { createdAt: { gte: startOfMonth } } }),
    ])

    // Compute actual costs from usage logs
    const monthlyCostAggregate = await db.aIUsageLog.aggregate({
      _sum: { costUSD: true, promptTokens: true, completionTokens: true, totalTokens: true },
      _avg: { latencyMs: true },
      where: { createdAt: { gte: startOfMonth } },
    })

    const totalCostAggregate = await db.aIUsageLog.aggregate({
      _sum: { costUSD: true, totalTokens: true },
    })

    // Usage by provider
    const usageByProviderRaw = await db.aIUsageLog.groupBy({
      by: ['providerId'],
      _sum: { costUSD: true, totalTokens: true },
      _count: true,
      where: { createdAt: { gte: startOfMonth } },
    })

    const providers = await db.aIProvider.findMany({ select: { id: true, name: true } })
    const providerMap = new Map(providers.map(p => [p.id, p.name]))

    const usageByProvider = usageByProviderRaw.map(item => ({
      providerId: item.providerId,
      providerName: providerMap.get(item.providerId) || 'Unknown',
      totalTokens: item._sum.totalTokens || 0,
      costUSD: Number(item._sum.costUSD || 0),
      requestCount: item._count,
    }))

    // Usage by model
    const usageByModelRaw = await db.aIUsageLog.groupBy({
      by: ['modelId'],
      _sum: { costUSD: true, totalTokens: true },
      _count: true,
      where: { createdAt: { gte: startOfMonth }, modelId: { not: null } },
    })

    const models = await db.aIModel.findMany({ select: { id: true, name: true } })
    const modelMap = new Map(models.map(m => [m.id, m.name]))

    const usageByModel = usageByModelRaw.map(item => ({
      modelId: item.modelId,
      modelName: modelMap.get(item.modelId!) || 'Unknown',
      totalTokens: item._sum.totalTokens || 0,
      costUSD: Number(item._sum.costUSD || 0),
      requestCount: item._count,
    }))

    // Usage by feature
    const usageByFeatureRaw = await db.aIUsageLog.groupBy({
      by: ['feature'],
      _sum: { costUSD: true, totalTokens: true },
      _count: true,
      where: { createdAt: { gte: startOfMonth } },
    })

    const usageByFeature = usageByFeatureRaw.map(item => ({
      feature: item.feature,
      totalTokens: item._sum.totalTokens || 0,
      costUSD: Number(item._sum.costUSD || 0),
      requestCount: item._count,
    }))

    // Daily breakdown for last 30 days
    const dailyLogs = await db.aIUsageLog.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, totalTokens: true, costUSD: true },
      orderBy: { createdAt: 'asc' },
    })

    const dailyBreakdown: Record<string, { date: string; totalTokens: number; costUSD: number; requestCount: number }> = {}
    for (const log of dailyLogs) {
      const dateKey = log.createdAt.toISOString().split('T')[0]
      if (!dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey] = { date: dateKey, totalTokens: 0, costUSD: 0, requestCount: 0 }
      }
      dailyBreakdown[dateKey].totalTokens += log.totalTokens
      dailyBreakdown[dateKey].costUSD += log.costUSD
      dailyBreakdown[dateKey].requestCount += 1
    }

    // Error rate this month
    const errorCount = await db.aIUsageLog.count({
      where: {
        createdAt: { gte: startOfMonth },
        status: { in: ['error', 'rate_limited', 'timeout'] },
      },
    })
    const errorRate = monthlyUsageLogs > 0 ? (errorCount / monthlyUsageLogs) * 100 : 0

    // Status distribution
    const statusDistribution = await db.aIUsageLog.groupBy({
      by: ['status'],
      _count: true,
      where: { createdAt: { gte: startOfMonth } },
    })

    const usage = {
      // Summary
      totalRequests: totalUsageLogs,
      monthlyRequests: monthlyUsageLogs,
      totalTokensUsed: totalCostAggregate._sum.totalTokens || 0,
      monthlyTokensUsed: monthlyCostAggregate._sum.totalTokens || 0,
      monthlyPromptTokens: monthlyCostAggregate._sum.promptTokens || 0,
      monthlyCompletionTokens: monthlyCostAggregate._sum.completionTokens || 0,
      totalCostUSD: Number(totalCostAggregate._sum.costUSD || 0),
      monthlyCostUSD: Number(monthlyCostAggregate._sum.costUSD || 0),
      avgLatencyMs: monthlyCostAggregate._avg.latencyMs
        ? Math.round(monthlyCostAggregate._avg.latencyMs)
        : 0,
      errorCount,
      errorRate: parseFloat(errorRate.toFixed(2)),
      // Breakdowns
      usageByProvider,
      usageByModel,
      usageByFeature,
      dailyBreakdown: Object.values(dailyBreakdown).sort((a, b) => a.date.localeCompare(b.date)),
      statusDistribution: statusDistribution.map(s => ({
        status: s.status,
        count: s._count,
      })),
    }

    // Get provider list with masked keys for config display
    const providersList = await db.aIProvider.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        isActive: true,
        isDefault: true,
        healthStatus: true,
        apiKey: true,
      },
      orderBy: { priority: 'desc' },
    })

    const providersWithMaskedKeys = providersList.map(p => ({
      ...p,
      apiKey: maskApiKey(p.apiKey),
    }))

    return NextResponse.json({
      config,
      usage,
      counts: {
        providers: providersCount,
        activeProviders,
        models: modelsCount,
        promptTemplates: promptTemplatesCount,
      },
      providers: providersWithMaskedKeys,
    })
  } catch (error) {
    console.error('AI config fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI configuration' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/ai-config — Update AI configuration with audit logging
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()

    // Get or create the singleton config record
    let config = await db.aIConfiguration.findFirst()
    if (!config) {
      config = await db.aIConfiguration.create({ data: {} })
    }

    // Store previous values for audit log
    const previousConfig = { ...config }

    // Filter out fields that shouldn't be updated directly
    const { id, updatedAt, ...updateFields } = body

    // Only include fields that have defined values
    const data: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        data[key] = value
      }
    }

    const updated = await db.aIConfiguration.update({
      where: { id: config.id },
      data,
    })

    // Create audit log entry
    const changedFields = Object.keys(data)
    if (changedFields.length > 0) {
      const previousValue: Record<string, unknown> = {}
      const newValue: Record<string, unknown> = {}
      for (const field of changedFields) {
        if (field in previousConfig) {
          previousValue[field] = (previousConfig as Record<string, unknown>)[field]
        }
        newValue[field] = data[field]
      }

      await db.aIAuditLog.create({
        data: {
          action: 'config_update',
          category: 'config',
          description: `Updated AI configuration: ${changedFields.join(', ')}`,
          previousValue: JSON.stringify(previousValue),
          newValue: JSON.stringify(newValue),
          severity: 'info',
        },
      })
    }

    return NextResponse.json({ config: updated })
  } catch (error) {
    console.error('AI config update error:', error)
    return NextResponse.json(
      { error: 'Failed to update AI configuration' },
      { status: 500 }
    )
  }
}
