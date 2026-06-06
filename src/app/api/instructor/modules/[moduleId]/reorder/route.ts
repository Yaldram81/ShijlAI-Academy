import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/instructor/modules/[m[moduleId]/reorder - Reorder lessons
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params
    const body = await request.json()
    const { lessonIds } = body

    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      return NextResponse.json(
        { error: 'lessonIds must be a non-empty array of lesson IDs' },
        { status: 400 }
      )
    }

    // Verify module exists
    const moduleExists = await db.module.findUnique({ where: { id: moduleId } })
    if (!moduleExists) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Verify all lessons belong to this module
    const lessons = await db.lesson.findMany({
      where: { moduleId },
      select: { id: true },
    })

    const moduleLessonIds = new Set(lessons.map((l) => l.id))
    for (const lessonId of lessonIds) {
      if (!moduleLessonIds.has(lessonId)) {
        return NextResponse.json(
          { error: `Lesson ${lessonId} does not belong to this module` },
          { status: 400 }
        )
      }
    }

    // Update all lesson orders in a transaction
    await db.$transaction(
      lessonIds.map((lessonId: string, index: number) =>
        db.lesson.update({
          where: { id: lessonId },
          data: { order: index },
        })
      )
    )

    // Return updated lessons
    const updatedLessons = await db.lesson.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({
      lessons: updatedLessons,
      message: 'Lessons reordered successfully',
    })
  } catch (error) {
    console.error('Error reordering lessons:', error)
    return NextResponse.json({ error: 'Failed to reorder lessons' }, { status: 500 })
  }
}
