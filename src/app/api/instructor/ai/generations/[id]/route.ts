import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Get a single generation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const generation = await db.aIGeneration.findUnique({
      where: { id },
      include: {
        instructor: {
          select: { id: true, name: true, email: true },
        },
        course: {
          select: { id: true, title: true },
        },
      },
    })

    if (!generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ generation })
  } catch (error) {
    console.error('Error fetching AI generation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch generation' },
      { status: 500 }
    )
  }
}

// PATCH: Update a generation (toggle favorite, update tags, update title)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { isFavorite, tags, title, instructorId } = body

    if (!instructorId) {
      return NextResponse.json(
        { error: 'instructorId is required' },
        { status: 400 }
      )
    }

    const existing = await db.aIGeneration.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      )
    }

    if (existing.instructorId !== instructorId) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this generation' },
        { status: 403 }
      )
    }

    const data: Record<string, unknown> = {}
    if (isFavorite !== undefined) {
      data.isFavorite = isFavorite
    }
    if (tags !== undefined) {
      data.tags = typeof tags === 'string' ? tags : JSON.stringify(tags)
    }
    if (title !== undefined) {
      data.title = title
    }

    const generation = await db.aIGeneration.update({
      where: { id },
      data,
      include: {
        course: {
          select: { id: true, title: true },
        },
      },
    })

    return NextResponse.json({ generation })
  } catch (error) {
    console.error('Error updating AI generation:', error)
    return NextResponse.json(
      { error: 'Failed to update generation' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a generation
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

    const existing = await db.aIGeneration.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      )
    }

    if (existing.instructorId !== instructorId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this generation' },
        { status: 403 }
      )
    }

    await db.aIGeneration.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting AI generation:', error)
    return NextResponse.json(
      { error: 'Failed to delete generation' },
      { status: 500 }
    )
  }
}
