import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/ai-config/prompt-templates/[id] — Get single prompt template
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const template = await db.aIPromptTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Prompt template not found' },
        { status: 404 }
      )
    }

    // Optionally fetch parent version
    let parentVersion: { id: string; name: string; slug: string; version: number } | null = null
    if (template.parentVersionId) {
      parentVersion = await db.aIPromptTemplate.findUnique({
        where: { id: template.parentVersionId },
        select: { id: true, name: true, slug: true, version: true },
      })
    }

    // Fetch child versions
    const childVersions = await db.aIPromptTemplate.findMany({
      where: { parentVersionId: id },
      select: { id: true, name: true, slug: true, version: true, isActive: true },
      orderBy: { version: 'desc' },
    })

    return NextResponse.json({ template, parentVersion, childVersions })
  } catch (error) {
    console.error('Prompt template fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prompt template' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/ai-config/prompt-templates/[id] — Update prompt template
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const existing = await db.aIPromptTemplate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Prompt template not found' },
        { status: 404 }
      )
    }

    // If changing slug, check uniqueness
    if (body.slug && body.slug !== existing.slug) {
      const conflict = await db.aIPromptTemplate.findUnique({ where: { slug: body.slug } })
      if (conflict && conflict.id !== id) {
        return NextResponse.json(
          { error: 'Prompt template with this slug already exists' },
          { status: 409 }
        )
      }
    }

    // Build update data with field allowlist
    const ALLOWED_TEMPLATE_FIELDS = ['name', 'slug', 'category', 'description', 'content', 'variables', 'version', 'isActive', 'isDefault', 'parentVersionId', 'tags'] as const
    const data: Record<string, unknown> = {}
    for (const field of ALLOWED_TEMPLATE_FIELDS) {
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

    const updated = await db.aIPromptTemplate.update({
      where: { id },
      data,
    })

    // Create audit log
    await db.aIAuditLog.create({
      data: {
        action: 'prompt_template_update',
        category: 'prompt',
        description: `Updated prompt template "${existing.name}" (${existing.slug})`,
        previousValue: JSON.stringify(previousValue),
        newValue: JSON.stringify(data),
        severity: 'info',
      },
    })

    return NextResponse.json({ template: updated })
  } catch (error) {
    console.error('Prompt template update error:', error)
    return NextResponse.json(
      { error: 'Failed to update prompt template' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/ai-config/prompt-templates/[id] — Delete prompt template
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.aIPromptTemplate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Prompt template not found' },
        { status: 404 }
      )
    }

    await db.aIPromptTemplate.delete({ where: { id } })

    // Create audit log
    await db.aIAuditLog.create({
      data: {
        action: 'prompt_template_delete',
        category: 'prompt',
        description: `Deleted prompt template "${existing.name}" (${existing.slug})`,
        previousValue: JSON.stringify({
          name: existing.name,
          slug: existing.slug,
          category: existing.category,
          version: existing.version,
        }),
        severity: 'warning',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Prompt template delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete prompt template' },
      { status: 500 }
    )
  }
}
