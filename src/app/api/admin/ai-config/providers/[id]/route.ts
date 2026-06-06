import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to mask API keys
function maskApiKey(key: string | null): string | null {
  if (!key) return null
  if (key.length <= 4) return '****'
  return '****' + key.slice(-4)
}

// GET /api/admin/ai-config/providers/[id] — Get single provider with its models
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const provider = await db.aIProvider.findUnique({
      where: { id },
      include: {
        models: {
          orderBy: { name: 'asc' },
        },
      },
    })

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      provider: {
        ...provider,
        apiKey: maskApiKey(provider.apiKey),
      },
    })
  } catch (error) {
    console.error('Provider fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch provider' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/ai-config/providers/[id] — Update provider
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const existing = await db.aIProvider.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Check name uniqueness if changing
    if (body.name && body.name !== existing.name) {
      const conflict = await db.aIProvider.findUnique({ where: { name: body.name } })
      if (conflict && conflict.id !== id) {
        return NextResponse.json(
          { error: 'Provider with this name already exists' },
          { status: 409 }
        )
      }
    }

    // Check slug uniqueness if changing
    if (body.slug && body.slug !== existing.slug) {
      const conflict = await db.aIProvider.findUnique({ where: { slug: body.slug } })
      if (conflict && conflict.id !== id) {
        return NextResponse.json(
          { error: 'Provider with this slug already exists' },
          { status: 409 }
        )
      }
    }

    // If setting as default, unset others
    if (body.isDefault && !existing.isDefault) {
      await db.aIProvider.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    // Build update data with field allowlist (preserve existing apiKey if not provided)
    const ALLOWED_PROVIDER_FIELDS = ['name', 'slug', 'type', 'apiKey', 'apiEndpoint', 'isActive', 'isDefault', 'priority', 'config', 'monthlyBudget', 'healthStatus', 'lastHealthCheck'] as const
    const data: Record<string, unknown> = {}
    for (const field of ALLOWED_PROVIDER_FIELDS) {
      if (body[field] !== undefined) {
        data[field] = body[field]
      }
    }

    // Store previous values for audit
    const previousValue: Record<string, unknown> = {}
    for (const field of Object.keys(data)) {
      if (field in existing) {
        previousValue[field] = (existing as Record<string, unknown>)[field]
      }
    }

    const updated = await db.aIProvider.update({
      where: { id },
      data,
    })

    // Create audit log
    await db.aIAuditLog.create({
      data: {
        action: 'provider_update',
        category: 'provider',
        description: `Updated provider "${existing.name}" (${existing.slug})`,
        previousValue: JSON.stringify(previousValue),
        newValue: JSON.stringify(data),
        severity: 'info',
      },
    })

    return NextResponse.json({
      provider: { ...updated, apiKey: maskApiKey(updated.apiKey) },
    })
  } catch (error) {
    console.error('Provider update error:', error)
    return NextResponse.json(
      { error: 'Failed to update provider' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/ai-config/providers/[id] — Delete provider (cascade models)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.aIProvider.findUnique({
      where: { id },
      include: { _count: { select: { models: true } } },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Delete will cascade models and usage logs
    await db.aIProvider.delete({ where: { id } })

    // Create audit log
    await db.aIAuditLog.create({
      data: {
        action: 'provider_delete',
        category: 'provider',
        description: `Deleted provider "${existing.name}" (${existing.slug}) with ${existing._count.models} models`,
        previousValue: JSON.stringify({
          name: existing.name,
          slug: existing.slug,
          type: existing.type,
          isActive: existing.isActive,
          modelCount: existing._count.models,
        }),
        severity: 'warning',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Provider delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete provider' },
      { status: 500 }
    )
  }
}
