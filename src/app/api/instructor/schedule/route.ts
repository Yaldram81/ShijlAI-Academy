import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/schedule - Fetch all live sessions for an instructor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    // Verify instructor exists
    const instructor = await db.user.findUnique({
      where: { id: instructorId },
      select: { id: true, role: true },
    })
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    const sessions = await db.liveSession.findMany({
      where: { instructorId },
      include: {
        course: { select: { id: true, title: true } },
        attendees: {
          select: {
            id: true,
            status: true,
            userId: true,
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    })

    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      title: session.title,
      description: session.description,
      courseId: session.courseId,
      courseTitle: session.course?.title || null,
      type: session.type,
      meetingUrl: session.meetingUrl,
      meetingId: session.meetingId,
      meetingPassword: session.meetingPassword,
      scheduledAt: session.scheduledAt,
      duration: session.duration,
      status: session.status,
      maxAttendees: session.maxAttendees,
      recordingUrl: session.recordingUrl,
      isRecurring: session.isRecurring,
      recurrencePattern: session.recurrencePattern,
      attendeeCount: session.attendees.length,
      attendees: session.attendees,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }))

    return NextResponse.json({ sessions: formattedSessions })
  } catch (error) {
    console.error('Error fetching instructor schedule:', error)
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
  }
}

// POST /api/instructor/schedule - Create a new live session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      instructorId,
      title,
      description,
      courseId,
      type,
      meetingUrl,
      meetingId,
      meetingPassword,
      scheduledAt,
      duration,
      maxAttendees,
      isRecurring,
      recurrencePattern,
    } = body

    // Validate required fields
    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!scheduledAt) {
      return NextResponse.json({ error: 'Scheduled date/time is required' }, { status: 400 })
    }

    // Verify instructor exists
    const instructor = await db.user.findUnique({
      where: { id: instructorId },
      select: { id: true, role: true },
    })
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    // Validate course if provided
    if (courseId) {
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { id: true, instructorId: true },
      })
      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }
      if (course.instructorId !== instructorId) {
        return NextResponse.json({ error: 'You can only create sessions for your own courses' }, { status: 400 })
      }
    }

    // Validate session type
    const validTypes = ['live_class', 'office_hours', 'qa_session', 'workshop']
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid session type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate scheduled date is in the future
    const scheduledDate = new Date(scheduledAt)
    if (scheduledDate <= new Date()) {
      return NextResponse.json({ error: 'Scheduled date must be in the future' }, { status: 400 })
    }

    const session = await db.liveSession.create({
      data: {
        instructorId,
        title,
        description: description || null,
        courseId: courseId || null,
        type: type || 'live_class',
        meetingUrl: meetingUrl || null,
        meetingId: meetingId || null,
        meetingPassword: meetingPassword || null,
        scheduledAt: scheduledDate,
        duration: duration || 60,
        maxAttendees: maxAttendees || null,
        isRecurring: isRecurring || false,
        recurrencePattern: recurrencePattern ? JSON.stringify(recurrencePattern) : null,
      },
      include: {
        course: { select: { id: true, title: true } },
        attendees: { select: { id: true, status: true, userId: true } },
      },
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('Error creating live session:', error)
    return NextResponse.json({ error: 'Failed to create live session' }, { status: 500 })
  }
}

// PATCH /api/instructor/schedule - Update session status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, status } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['scheduled', 'live', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify session exists and belongs to instructor
    const existingSession = await db.liveSession.findUnique({
      where: { id: sessionId },
    })
    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Authorization: verify instructorId from request body
    const { instructorId: patchInstructorId } = body
    if (patchInstructorId && existingSession.instructorId !== patchInstructorId) {
      return NextResponse.json({ error: 'You can only update your own sessions' }, { status: 403 })
    }

    const updatedSession = await db.liveSession.update({
      where: { id: sessionId },
      data: { status },
      include: {
        course: { select: { id: true, title: true } },
        attendees: { select: { id: true, status: true, userId: true } },
      },
    })

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    console.error('Error updating live session:', error)
    return NextResponse.json({ error: 'Failed to update live session' }, { status: 500 })
  }
}

// DELETE /api/instructor/schedule - Delete a session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Verify session exists and instructor ownership
    const session = await db.liveSession.findUnique({
      where: { id: sessionId },
    })
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const deleteInstructorId = searchParams.get('instructorId')
    if (deleteInstructorId && session.instructorId !== deleteInstructorId) {
      return NextResponse.json({ error: 'You can only delete your own sessions' }, { status: 403 })
    }

    await db.liveSession.delete({
      where: { id: sessionId },
    })

    return NextResponse.json({ success: true, message: 'Session deleted' })
  } catch (error) {
    console.error('Error deleting live session:', error)
    return NextResponse.json({ error: 'Failed to delete live session' }, { status: 500 })
  }
}
