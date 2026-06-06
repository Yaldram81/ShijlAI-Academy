import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/ai-config/prompt-templates — List all prompt templates
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const templates = await db.aIPromptTemplate.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Prompt templates fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prompt templates' },
      { status: 500 }
    )
  }
}

// POST /api/admin/ai-config/prompt-templates — Create a new prompt template
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, slug, category, description, content, variables, isActive, isDefault, tags } = body

    // Validate required fields
    if (!name || !slug || !content) {
      return NextResponse.json(
        { error: 'Name, slug, and content are required' },
        { status: 400 }
      )
    }

    // Check slug uniqueness
    const existing = await db.aIPromptTemplate.findUnique({ where: { slug } })

    let version = 1
    let parentVersionId: string | null = null

    if (existing) {
      // Auto-increment version if slug exists
      version = existing.version + 1
      parentVersionId = existing.id

      // Create a new slug with version suffix to avoid unique constraint violation
      const newSlug = `${slug}-v${version}`

      const template = await db.aIPromptTemplate.create({
        data: {
          name: `${name} v${version}`,
          slug: newSlug,
          category: category || existing.category,
          description: description || existing.description,
          content,
          variables: variables || existing.variables,
          version,
          isActive: isActive !== undefined ? isActive : true,
          isDefault: isDefault || false,
          parentVersionId,
          tags: tags || existing.tags,
        },
      })

      // Create audit log
      await db.aIAuditLog.create({
        data: {
          action: 'prompt_template_add',
          category: 'prompt',
          description: `Created new version ${version} of prompt template "${name}" (${slug})`,
          newValue: JSON.stringify({ name: template.name, slug: newSlug, version }),
          severity: 'info',
        },
      })

      return NextResponse.json({ template }, { status: 201 })
    }

    // First version of this template
    const template = await db.aIPromptTemplate.create({
      data: {
        name,
        slug,
        category: category || 'general',
        description: description || null,
        content,
        variables: variables || '[]',
        version,
        isActive: isActive !== undefined ? isActive : true,
        isDefault: isDefault || false,
        parentVersionId,
        tags: tags || '[]',
      },
    })

    // Create audit log
    await db.aIAuditLog.create({
      data: {
        action: 'prompt_template_add',
        category: 'prompt',
        description: `Created prompt template "${name}" (${slug})`,
        newValue: JSON.stringify({ name, slug, version: 1 }),
        severity: 'info',
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Prompt template create error:', error)
    return NextResponse.json(
      { error: 'Failed to create prompt template' },
      { status: 500 }
    )
  }
}
