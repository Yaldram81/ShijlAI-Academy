import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/instructor/modules/[m[moduleId]/lessons - Add a lesson to a module
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params
    const body = await request.json()
    const { title, description, content, type, videoUrl, duration } = body

    if (!title) {
      return NextResponse.json({ error: 'Lesson title is required' }, { status: 400 })
    }

    const moduleExists = await db.module.findUnique({
      where: { id: moduleId },
      include: { course: { select: { id: true, instructorId: true } } },
    })
    if (!moduleExists) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Verify ownership via course
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId') || body.instructorId
    if (!instructorId || moduleExists.course.instructorId !== instructorId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Get next order
    const maxOrder = await db.lesson.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const lesson = await db.lesson.create({
      data: {
        title,
        description: description || null,
        content: content || '',
        type: type || 'text',
        videoUrl: videoUrl || null,
        duration: duration || 0,
        order: (maxOrder?.order ?? -1) + 1,
        moduleId,
      },
    })

    return NextResponse.json({ lesson, message: 'Lesson created successfully' }, { status: 201 })
  } catch (error) {
    console.error('Error creating lesson:', error)
    return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 })
  }
}
