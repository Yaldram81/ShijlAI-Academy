import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/student/community/events/[eventId]
// RSVP/attend an event: { userId, action: "register" | "cancel" }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const body = await request.json()
    const { userId, action } = body

    if (!eventId || !userId || !action) {
      return NextResponse.json(
        { error: 'eventId, userId, and action are required' },
        { status: 400 }
      )
    }

    if (action !== 'register' && action !== 'cancel') {
      return NextResponse.json(
        { error: 'Action must be "register" or "cancel"' },
        { status: 400 }
      )
    }

    // Verify event exists
    const event = await db.communityEvent.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        status: true,
        maxAttendees: true,
        attendeeCount: true,
      },
    })
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Cannot register for cancelled events
    if (event.status === 'cancelled') {
      return NextResponse.json(
        { error: 'This event has been cancelled' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check existing attendance
    const existingAttendance = await db.eventAttendee.findUnique({
      where: {
        eventId_userId: { eventId, userId },
      },
    })

    if (action === 'register') {
      // Already registered
      if (existingAttendance && existingAttendance.status !== 'cancelled') {
        return NextResponse.json(
          { error: 'You are already registered for this event' },
          { status: 400 }
        )
      }

      // Check if event is full
      if (event.maxAttendees && event.attendeeCount >= event.maxAttendees) {
        // Allow waitlisting if already had a registration
        if (!existingAttendance) {
          return NextResponse.json(
            { error: 'This event is full. Maximum attendees reached.' },
            { status: 400 }
          )
        }
      }

      // Register or re-register
      await db.$transaction(async (tx) => {
        if (existingAttendance) {
          // Re-register (was previously cancelled)
          await tx.eventAttendee.update({
            where: { id: existingAttendance.id },
            data: {
              status: 'registered',
              joinedAt: new Date(),
              reminderSent: false,
            },
          })
        } else {
          // New registration
          await tx.eventAttendee.create({
            data: {
              eventId,
              userId,
              status: 'registered',
            },
          })
        }

        // Update attendee count
        await tx.communityEvent.update({
          where: { id: eventId },
          data: { attendeeCount: { increment: 1 } },
        })
      })

      return NextResponse.json({
        registered: true,
        eventId,
        userId,
      })
    }

    if (action === 'cancel') {
      // Not registered
      if (!existingAttendance || existingAttendance.status === 'cancelled') {
        return NextResponse.json(
          { error: 'You are not registered for this event' },
          { status: 400 }
        )
      }

      // Cancel registration
      await db.$transaction(async (tx) => {
        await tx.eventAttendee.update({
          where: { id: existingAttendance.id },
          data: { status: 'cancelled' },
        })

        // Update attendee count
        await tx.communityEvent.update({
          where: { id: eventId },
          data: { attendeeCount: { decrement: 1 } },
        })
      })

      return NextResponse.json({
        cancelled: true,
        eventId,
        userId,
      })
    }

    // Should not reach here due to earlier validation
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating event attendance:', error)
    return NextResponse.json(
      { error: 'Failed to update attendance' },
      { status: 500 }
    )
  }
}
