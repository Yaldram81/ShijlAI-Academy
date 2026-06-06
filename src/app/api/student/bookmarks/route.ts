import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/student/bookmarks - Fetch bookmarks for a lesson
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

    const bookmark = await db.lessonBookmark.findUnique({
      where: {
        userId_lessonId_enrollmentId: {
          userId,
          lessonId,
          enrollmentId,
        },
      },
      select: {
        id: true,
        timestamp: true,
        label: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      bookmarks: bookmark ? [bookmark] : [],
    })
  } catch (error) {
    console.error('Error fetching lesson bookmarks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lesson bookmarks' },
      { status: 500 }
    )
  }
}

// POST /api/student/bookmarks - Create or update a lesson bookmark (upsert)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, lessonId, enrollmentId, timestamp, label } = body

    if (!userId || !lessonId || !enrollmentId || timestamp === undefined) {
      return NextResponse.json(
        { error: 'userId, lessonId, enrollmentId, and timestamp are required' },
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

    const bookmark = await db.lessonBookmark.upsert({
      where: {
        userId_lessonId_enrollmentId: {
          userId,
          lessonId,
          enrollmentId,
        },
      },
      create: {
        userId,
        lessonId,
        enrollmentId,
        timestamp,
        label: label ?? null,
      },
      update: {
        timestamp,
        ...(label !== undefined && { label }),
      },
    })

    return NextResponse.json({ bookmark })
  } catch (error) {
    console.error('Error creating/updating lesson bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to create/update lesson bookmark' },
      { status: 500 }
    )
  }
}

// DELETE /api/student/bookmarks - Delete a lesson bookmark
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { bookmarkId } = body

    if (!bookmarkId) {
      return NextResponse.json(
        { error: 'bookmarkId is required' },
        { status: 400 }
      )
    }

    const existing = await db.lessonBookmark.findUnique({
      where: { id: bookmarkId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      )
    }

    await db.lessonBookmark.delete({
      where: { id: bookmarkId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lesson bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to delete lesson bookmark' },
      { status: 500 }
    )
  }
}
