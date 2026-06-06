import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/instructor/modules/[m[moduleId] - Update module
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId') || body.instructorId

    const existing = await db.module.findUnique({ where: { id: moduleId } })
    if (!existing) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Verify ownership via course
    const course = await db.course.findUnique({ where: { id: existing.courseId } })
    if (!course || !instructorId || course.instructorId !== instructorId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    const allowedFields = ['title', 'description', 'learningObjectives', 'isPublished', 'order']
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const module_ = await db.module.update({
      where: { id: moduleId },
      data: updateData,
      include: {
        lessons: { orderBy: { order: 'asc' } },
      },
    })

    return NextResponse.json({ module: module_, message: 'Module updated successfully' })
  } catch (error) {
    console.error('Error updating module:', error)
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 })
  }
}

// DELETE /api/instructor/modules/[m[moduleId] - Delete module (cascades lessons)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    const existing = await db.module.findUnique({
      where: { id: moduleId },
      include: { _count: { select: { lessons: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Verify ownership via course
    const course = await db.course.findUnique({ where: { id: existing.courseId } })
    if (!course || !instructorId || course.instructorId !== instructorId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await db.module.delete({ where: { id: moduleId } })

    return NextResponse.json({
      message: 'Module deleted successfully',
      deletedLessonsCount: existing._count.lessons,
    })
  } catch (error) {
    console.error('Error deleting module:', error)
    return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 })
  }
}
