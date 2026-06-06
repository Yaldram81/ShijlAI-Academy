import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to mask API keys
function maskApiKey(key: string | null): string | null {
  if (!key) return null
  if (key.length <= 4) return '****'
  return '****' + key.slice(-4)
}

// GET /api/admin/ai-config/providers — List all providers with model counts and monthly usage
export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const providers = await db.aIProvider.findMany({
      include: {
        _count: { select: { models: true, usageLogs: true } },
      },
      orderBy: { priority: 'desc' },
    })

    // Get monthly usage per provider
    const monthlyUsageRaw = await db.aIUsageLog.groupBy({
      by: ['providerId'],
      _sum: { costUSD: true, totalTokens: true },
      _count: true,
      where: { createdAt: { gte: startOfMonth } },
    })

    const monthlyUsageMap = new Map(
      monthlyUsageRaw.map(u => [u.providerId, {
        monthlyCostUSD: Number(u._sum.costUSD || 0),
        monthlyTokens: u._sum.totalTokens || 0,
        monthlyRequests: u._count,
      }])
    )

    const result = providers.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      type: p.type,
      apiKey: maskApiKey(p.apiKey),
      apiEndpoint: p.apiEndpoint,
      isActive: p.isActive,
      isDefault: p.isDefault,
      priority: p.priority,
      config: p.config,
      monthlyBudget: p.monthlyBudget,
      healthStatus: p.healthStatus,
      lastHealthCheck: p.lastHealthCheck,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      modelCount: p._count.models,
      totalUsageLogs: p._count.usageLogs,
      monthlyUsage: monthlyUsageMap.get(p.id) || {
        monthlyCostUSD: 0,
        monthlyTokens: 0,
        monthlyRequests: 0,
      },
    }))

    return NextResponse.json({ providers: result })
  } catch (error) {
    console.error('Providers fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    )
  }
}

// POST /api/admin/ai-config/providers — Create a new provider
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, slug, type, apiKey, apiEndpoint, isActive, isDefault, priority, config, monthlyBudget } = body

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Check uniqueness
    const existingByName = await db.aIProvider.findUnique({ where: { name } })
    if (existingByName) {
      return NextResponse.json(
        { error: 'Provider with this name already exists' },
        { status: 409 }
      )
    }

    const existingBySlug = await db.aIProvider.findUnique({ where: { slug } })
    if (existingBySlug) {
      return NextResponse.json(
        { error: 'Provider with this slug already exists' },
        { status: 409 }
      )
    }

    // If this is set as default, unset others
    if (isDefault) {
      await db.aIProvider.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const provider = await db.aIProvider.create({
      data: {
        name,
        slug,
        type: type || 'llm',
        apiKey: apiKey || null,
        apiEndpoint: apiEndpoint || null,
        isActive: isActive !== undefined ? isActive : true,
        isDefault: isDefault || false,
        priority: priority || 0,
        config: config || '{}',
        monthlyBudget: monthlyBudget || null,
      },
    })

    // Create audit log
    await db.aIAuditLog.create({
      data: {
        action: 'provider_add',
        category: 'provider',
        description: `Created provider "${name}" (${slug})`,
        newValue: JSON.stringify({ name, slug, type: type || 'llm', isActive: true }),
        severity: 'info',
      },
    })

    return NextResponse.json({ provider: { ...provider, apiKey: maskApiKey(provider.apiKey) } }, { status: 201 })
  } catch (error) {
    console.error('Provider create error:', error)
    return NextResponse.json(
      { error: 'Failed to create provider' },
      { status: 500 }
    )
  }
}
