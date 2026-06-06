import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/lessons/[lessonId] - Get single lesson with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            courseId: true,
            course: { select: { instructorId: true } },
          },
        },
        progress: {
          select: {
            id: true,
            status: true,
            timeSpent: true,
          },
        },
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Verify ownership via module → course
    if (!instructorId || lesson.module.course.instructorId !== instructorId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    return NextResponse.json({ lesson })
  } catch (error) {
    console.error('Error fetching lesson:', error)
    return NextResponse.json({ error: 'Failed to fetch lesson' }, { status: 500 })
  }
}

// PATCH /api/instructor/lessons/[lessonId] - Update lesson
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId') || body.instructorId

    const existing = await db.lesson.findUnique({ where: { id: lessonId } })
    if (!existing) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Verify ownership via module → course
    const module_ = await db.module.findUnique({
      where: { id: existing.moduleId },
      include: { course: { select: { instructorId: true } } },
    })
    if (!module_ || !instructorId || module_.course.instructorId !== instructorId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'title', 'description', 'content', 'type', 'videoUrl', 'duration',
      'resources', 'objectives', 'isFree', 'isPublished', 'transcript',
      'slideUrl', 'order',
    ]
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const lesson = await db.lesson.update({
      where: { id: lessonId },
      data: updateData,
    })

    return NextResponse.json({ lesson, message: 'Lesson updated successfully' })
  } catch (error) {
    console.error('Error updating lesson:', error)
    return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 })
  }
}

// DELETE /api/instructor/lessons/[lessonId] - Delete lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    const existing = await db.lesson.findUnique({ where: { id: lessonId } })
    if (!existing) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Verify ownership via module → course
    const module_ = await db.module.findUnique({
      where: { id: existing.moduleId },
      include: { course: { select: { instructorId: true } } },
    })
    if (!module_ || !instructorId || module_.course.instructorId !== instructorId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await db.lesson.delete({ where: { id: lessonId } })

    return NextResponse.json({ message: 'Lesson deleted successfully' })
  } catch (error) {
    console.error('Error deleting lesson:', error)
    return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 })
  }
}
