import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH: Update a template (name, description, inputParams). Increment usageCount when used.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, inputParams, incrementUsage, instructorId } = body

    if (!instructorId) {
      return NextResponse.json(
        { error: 'instructorId is required' },
        { status: 400 }
      )
    }

    const existing = await db.aITemplate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Only the owner can modify their templates (system defaults have no owner restriction for usage)
    if (!existing.isDefault && existing.instructorId !== instructorId) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this template' },
        { status: 403 }
      )
    }

    const data: Record<string, unknown> = {}

    if (name !== undefined) {
      data.name = name
    }
    if (description !== undefined) {
      data.description = description
    }
    if (inputParams !== undefined) {
      data.inputParams = typeof inputParams === 'string' ? inputParams : JSON.stringify(inputParams)
    }

    // Increment usageCount when the template is used
    if (incrementUsage === true) {
      data.usageCount = existing.usageCount + 1
    }

    const template = await db.aITemplate.update({
      where: { id },
      data,
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error updating AI template:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a template (only if not system default)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    if (!instructorId) {
      return NextResponse.json(
        { error: 'instructorId is required' },
        { status: 400 }
      )
    }

    const existing = await db.aITemplate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    if (existing.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete system default templates' },
        { status: 403 }
      )
    }

    if (existing.instructorId !== instructorId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this template' },
        { status: 403 }
      )
    }

    await db.aITemplate.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting AI template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
