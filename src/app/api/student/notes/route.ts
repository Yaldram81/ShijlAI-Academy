import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/student/notes - Fetch notes for a lesson (supports multiple notes)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const lessonId = searchParams.get('lessonId')
    const enrollmentId = searchParams.get('enrollmentId')

    if (!userId || !lessonId || !enrollmentId) {
      return NextResponse.json(
        { error: 'userId, lessonId, and enrollmentId are required' },
        { status: 400 }
      )
    }

    // Fetch ALL notes for this lesson (multiple notes supported)
    const notesList = await db.lessonNote.findMany({
      where: {
        userId,
        lessonId,
        enrollmentId,
      },
      select: {
        id: true,
        content: true,
        timestamp: true,
        color: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      notes: notesList,
    })
  } catch (error) {
    console.error('Error fetching lesson notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lesson notes' },
      { status: 500 }
    )
  }
}

// POST /api/student/notes - Create a new lesson note (supports multiple)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, lessonId, enrollmentId, content, timestamp, color, noteId } = body

    // If noteId is provided, update existing note (upsert behavior)
    if (noteId) {
      const existing = await db.lessonNote.findUnique({
        where: { id: noteId },
      })
      if (existing) {
        const updateData: Record<string, unknown> = {}
        if (content !== undefined) updateData.content = content
        if (timestamp !== undefined) updateData.timestamp = timestamp
        if (color !== undefined) updateData.color = color

        const updated = await db.lessonNote.update({
          where: { id: noteId },
          data: updateData,
        })
        return NextResponse.json({ note: updated })
      }
    }

    // Create new note
    if (!userId || !lessonId || !enrollmentId || content === undefined) {
      return NextResponse.json(
        { error: 'userId, lessonId, enrollmentId, and content are required' },
        { status: 400 }
      )
    }

    // Verify enrollment exists and belongs to user
    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
    })

    if (!enrollment || enrollment.userId !== userId) {
      return NextResponse.json(
        { error: 'Enrollment not found or does not belong to user' },
        { status: 404 }
      )
    }

    // Verify lesson exists
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
    })

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    const note = await db.lessonNote.create({
      data: {
        userId,
        lessonId,
        enrollmentId,
        content,
        timestamp: timestamp ?? 0,
        color: color || 'default',
      },
    })

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Error creating/updating lesson note:', error)
    return NextResponse.json(
      { error: 'Failed to create/update lesson note' },
      { status: 500 }
    )
  }
}

// PATCH /api/student/notes - Update a lesson note by noteId
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { noteId, content, timestamp, color } = body

    if (!noteId) {
      return NextResponse.json(
        { error: 'noteId is required' },
        { status: 400 }
      )
    }

    const existing = await db.lessonNote.findUnique({
      where: { id: noteId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (content !== undefined) updateData.content = content
    if (timestamp !== undefined) updateData.timestamp = timestamp
    if (color !== undefined) updateData.color = color

    const updated = await db.lessonNote.update({
      where: { id: noteId },
      data: updateData,
    })

    return NextResponse.json({ note: updated })
  } catch (error) {
    console.error('Error updating lesson note:', error)
    return NextResponse.json(
      { error: 'Failed to update lesson note' },
      { status: 500 }
    )
  }
}

// DELETE /api/student/notes - Delete a lesson note
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { noteId } = body

    if (!noteId) {
      return NextResponse.json(
        { error: 'noteId is required' },
        { status: 400 }
      )
    }

    const existing = await db.lessonNote.findUnique({
      where: { id: noteId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }

    await db.lessonNote.delete({
      where: { id: noteId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lesson note:', error)
    return NextResponse.json(
      { error: 'Failed to delete lesson note' },
      { status: 500 }
    )
  }
}
