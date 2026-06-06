import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/instructor/assessment/outcomes/create
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { courseId, title, description } = body

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
    }
    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    // Verify course exists
    const course = await db.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Get the current max order for this course's outcomes
    const maxOrderOutcome = await db.learningOutcome.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const nextOrder = (maxOrderOutcome?.order ?? -1) + 1

    const outcome = await db.learningOutcome.create({
      data: {
        courseId,
        title,
        description: description || null,
        order: nextOrder,
      },
    })

    return NextResponse.json({
      outcome: {
        id: outcome.id,
        title: outcome.title,
        description: outcome.description,
        courseId: outcome.courseId,
      },
    })
  } catch (error) {
    console.error('Error creating outcome:', error)
    return NextResponse.json({ error: 'Failed to create outcome' }, { status: 500 })
  }
}
