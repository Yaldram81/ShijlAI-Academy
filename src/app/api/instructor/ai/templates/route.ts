import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET: List templates for an instructor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const toolType = searchParams.get('toolType')

    if (!instructorId) {
      return NextResponse.json({ error: 'instructorId is required' }, { status: 400 })
    }

    const where: Prisma.AITemplateWhereInput = {
      OR: [
        { instructorId },
        { isDefault: true },
      ],
    }

    if (toolType) {
      where.OR = [
        { instructorId, toolType },
        { isDefault: true, toolType },
      ]
    }

    const templates = await db.aITemplate.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { usageCount: 'desc' },
        { name: 'asc' },
      ],
    })

    // Parse JSON string fields for each template
    const parsed = templates.map(t => ({
      ...t,
      inputParams: (() => { try { return t.inputParams ? JSON.parse(t.inputParams as string) : {} } catch { return {} } })(),
    }))

    return NextResponse.json({ templates: parsed })
  } catch (error) {
    console.error('Error listing AI templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

// POST: Create a new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instructorId, toolType, name, description, inputParams, isDefault } = body

    if (!instructorId) {
      return NextResponse.json({ error: 'instructorId is required' }, { status: 400 })
    }
    if (!toolType || !name || !inputParams) {
      return NextResponse.json({ error: 'toolType, name, and inputParams are required' }, { status: 400 })
    }

    const template = await db.aITemplate.create({
      data: {
        instructorId,
        toolType,
        name,
        description: description || null,
        inputParams: typeof inputParams === 'string' ? inputParams : JSON.stringify(inputParams),
        isDefault: isDefault ?? false,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error creating AI template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
