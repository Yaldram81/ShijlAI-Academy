import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/ai-config/models/[id] — Get single model
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const model = await db.aIModel.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            healthStatus: true,
          },
        },
      },
    })

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ model })
  } catch (error) {
    console.error('Model fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch model' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/ai-config/models/[id] — Update model
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const existing = await db.aIModel.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    // If changing slug, check uniqueness within provider
    if (body.slug && body.slug !== existing.slug) {
      const conflict = await db.aIModel.findFirst({
        where: { providerId: existing.providerId, slug: body.slug },
      })
      if (conflict && conflict.id !== id) {
        return NextResponse.json(
          { error: 'Model with this slug already exists for this provider' },
          { status: 409 }
        )
      }
    }

    // If setting as default, unset others in same provider
    if (body.isDefault && !existing.isDefault) {
      await db.aIModel.updateMany({
        where: { providerId: existing.providerId, isDefault: true },
        data: { isDefault: false },
      })
    }

    // Build update data with field allowlist
    const ALLOWED_MODEL_FIELDS = ['name', 'slug', 'modelId', 'type', 'isActive', 'isDefault', 'inputPricePer1M', 'outputPricePer1M', 'contextWindow', 'maxOutputTokens', 'supportsVision', 'supportsStreaming', 'supportsJson', 'capabilities', 'rpmLimit', 'tpmLimit'] as const
    const data: Record<string, unknown> = {}
    for (const field of ALLOWED_MODEL_FIELDS) {
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

    const updated = await db.aIModel.update({
      where: { id },
      data,
      include: {
        provider: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    // Create audit log
    await db.aIAuditLog.create({
      data: {
        action: 'model_update',
        category: 'model',
        description: `Updated model "${existing.name}" (${existing.slug})`,
        previousValue: JSON.stringify(previousValue),
        newValue: JSON.stringify(data),
        severity: 'info',
      },
    })

    return NextResponse.json({ model: updated })
  } catch (error) {
    console.error('Model update error:', error)
    return NextResponse.json(
      { error: 'Failed to update model' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/ai-config/models/[id] — Delete model
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.aIModel.findUnique({
      where: { id },
      include: {
        provider: { select: { name: true } },
      },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    await db.aIModel.delete({ where: { id } })

    // Create audit log
    await db.aIAuditLog.create({
      data: {
        action: 'model_delete',
        category: 'model',
        description: `Deleted model "${existing.name}" (${existing.slug}) from provider "${existing.provider.name}"`,
        previousValue: JSON.stringify({
          name: existing.name,
          slug: existing.slug,
          modelId: existing.modelId,
          providerId: existing.providerId,
        }),
        severity: 'warning',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Model delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete model' },
      { status: 500 }
    )
  }
}
