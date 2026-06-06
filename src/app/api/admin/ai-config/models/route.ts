import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/ai-config/models — List all models with provider info
export async function GET() {
  try {
    const models = await db.aIModel.findMany({
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
      },
      orderBy: [
        { provider: { priority: 'desc' } },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ models })
  } catch (error) {
    console.error('Models fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}

// POST /api/admin/ai-config/models — Create a new model
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      providerId, name, slug, modelId, type,
      isActive, isDefault,
      inputPricePer1M, outputPricePer1M,
      contextWindow, maxOutputTokens,
      supportsVision, supportsStreaming, supportsJson,
      capabilities, rpmLimit, tpmLimit,
    } = body

    // Validate required fields
    if (!providerId || !name || !slug || !modelId) {
      return NextResponse.json(
        { error: 'providerId, name, slug, and modelId are required' },
        { status: 400 }
      )
    }

    // Check provider exists
    const provider = await db.aIProvider.findUnique({ where: { id: providerId } })
    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Check slug uniqueness within provider
    const existingSlug = await db.aIModel.findFirst({
      where: { providerId, slug },
    })
    if (existingSlug) {
      return NextResponse.json(
        { error: 'Model with this slug already exists for this provider' },
        { status: 409 }
      )
    }

    // If setting as default, unset others in same provider
    if (isDefault) {
      await db.aIModel.updateMany({
        where: { providerId, isDefault: true },
        data: { isDefault: false },
      })
    }

    const model = await db.aIModel.create({
      data: {
        providerId,
        name,
        slug,
        modelId,
        type: type || 'chat',
        isActive: isActive !== undefined ? isActive : true,
        isDefault: isDefault || false,
        inputPricePer1M: inputPricePer1M || 0,
        outputPricePer1M: outputPricePer1M || 0,
        contextWindow: contextWindow || 4096,
        maxOutputTokens: maxOutputTokens || 4096,
        supportsVision: supportsVision || false,
        supportsStreaming: supportsStreaming !== undefined ? supportsStreaming : true,
        supportsJson: supportsJson !== undefined ? supportsJson : true,
        capabilities: capabilities || '{}',
        rpmLimit: rpmLimit || null,
        tpmLimit: tpmLimit || null,
      },
      include: {
        provider: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    // Create audit log
    await db.aIAuditLog.create({
      data: {
        action: 'model_add',
        category: 'model',
        description: `Created model "${name}" (${slug}) for provider "${provider.name}"`,
        newValue: JSON.stringify({ name, slug, modelId, providerId, type: type || 'chat' }),
        severity: 'info',
      },
    })

    return NextResponse.json({ model }, { status: 201 })
  } catch (error) {
    console.error('Model create error:', error)
    return NextResponse.json(
      { error: 'Failed to create model' },
      { status: 500 }
    )
  }
}
