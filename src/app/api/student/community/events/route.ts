import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper: compute timeAgo string from a Date
function timeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

// GET /api/student/community/events?userId=xxx&status=upcoming&type=xxx&courseId=xxx&groupId=xxx
// Get community events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const statusFilter = searchParams.get('status') || 'upcoming' // upcoming, live, all
    const typeFilter = searchParams.get('type')
    const courseIdFilter = searchParams.get('courseId')
    const groupIdFilter = searchParams.get('groupId')

    // Build where clause
    const where: Record<string, unknown> = {}

    if (statusFilter === 'upcoming') {
      where.status = 'upcoming'
    } else if (statusFilter === 'live') {
      where.status = 'live'
    } else if (statusFilter === 'all') {
      // No status filter — show all non-cancelled events
      where.status = { not: 'cancelled' }
    }

    if (typeFilter) {
      where.type = typeFilter
    }
    if (courseIdFilter) {
      where.courseId = courseIdFilter
    }
    if (groupIdFilter) {
      where.groupId = groupIdFilter
    }

    // Fetch events
    const events = await db.communityEvent.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, avatar: true, role: true, level: true },
        },
        course: {
          select: { id: true, title: true, category: true },
        },
        group: {
          select: { id: true, name: true, emoji: true },
        },
        attendees: {
          where: userId ? { userId } : undefined,
          select: { id: true, status: true },
        },
      },
      orderBy: { startDate: 'asc' },
    })

    const formattedEvents = events.map((event) => {
      const isAttending = userId
        ? event.attendees.length > 0 &&
          event.attendees[0].status !== 'cancelled'
        : false

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type,
        emoji: event.emoji,
        coverColor: event.coverColor,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate?.toISOString() ?? null,
        duration: event.duration,
        location: event.location,
        meetingUrl: event.meetingUrl,
        maxAttendees: event.maxAttendees,
        attendeeCount: event.attendeeCount,
        isFree: event.isFree,
        status: event.status,
        tags: event.tags,
        courseId: event.courseId,
        courseName: event.course?.title ?? null,
        groupId: event.groupId,
        groupName: event.group?.name ?? null,
        groupEmoji: event.group?.emoji ?? null,
        createdBy: {
          id: event.creator.id,
          name: event.creator.name,
          avatar: event.creator.avatar,
          role: event.creator.role,
          level: event.creator.level,
        },
        isAttending,
        timeAgo: timeAgo(event.createdAt),
        createdAt: event.createdAt.toISOString(),
      }
    })

    return NextResponse.json({ events: formattedEvents })
  } catch (error) {
    console.error('Error fetching community events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch community events' },
      { status: 500 }
    )
  }
}

// POST /api/student/community/events
// Create a community event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      title,
      description,
      type,
      emoji,
      coverColor,
      startDate,
      endDate,
      duration,
      location,
      meetingUrl,
      maxAttendees,
      tags,
      courseId,
      groupId,
    } = body

    if (!userId || !title || !description || !startDate) {
      return NextResponse.json(
        { error: 'userId, title, description, and startDate are required' },
        { status: 400 }
      )
    }

    // Validate user exists and check role
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatar: true, role: true, level: true },
    })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only instructors/admins can create events, OR students if groupId is provided
    const isInstructorOrAdmin = user.role === 'instructor' || user.role === 'admin'
    if (!isInstructorOrAdmin && !groupId) {
      return NextResponse.json(
        { error: 'Only instructors/admins can create community-wide events. Students can create events within study groups.' },
        { status: 403 }
      )
    }

    // If groupId provided, verify user is a member
    if (groupId) {
      const group = await db.studyGroup.findUnique({
        where: { id: groupId },
        select: { id: true, isActive: true },
      })
      if (!group) {
        return NextResponse.json(
          { error: 'Study group not found' },
          { status: 404 }
        )
      }
      if (!group.isActive) {
        return NextResponse.json(
          { error: 'Study group is not active' },
          { status: 400 }
        )
      }

      // Students must be a member of the group to create events
      if (!isInstructorOrAdmin) {
        const membership = await db.studyGroupMember.findUnique({
          where: { groupId_userId: { groupId, userId } },
          select: { id: true },
        })
        if (!membership) {
          return NextResponse.json(
            { error: 'You must be a member of the group to create events' },
            { status: 403 }
          )
        }
      }
    }

    // Validate courseId if provided
    if (courseId) {
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { id: true },
      })
      if (!course) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        )
      }
    }

    // Parse startDate
    const parsedStartDate = new Date(startDate)
    if (isNaN(parsedStartDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid startDate format' },
        { status: 400 }
      )
    }

    // Parse endDate if provided
    let parsedEndDate: Date | null = null
    if (endDate) {
      parsedEndDate = new Date(endDate)
      if (isNaN(parsedEndDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid endDate format' },
          { status: 400 }
        )
      }
    }

    const event = await db.communityEvent.create({
      data: {
        title,
        description,
        type: type || 'workshop',
        emoji: emoji || '📅',
        coverColor: coverColor || 'emerald',
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        duration: duration || 60,
        location: location || null,
        meetingUrl: meetingUrl || null,
        maxAttendees: maxAttendees || null,
        tags: tags || null,
        createdBy: userId,
        courseId: courseId || null,
        groupId: groupId || null,
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true, role: true, level: true },
        },
        course: {
          select: { id: true, title: true },
        },
        group: {
          select: { id: true, name: true, emoji: true },
        },
      },
    })

    return NextResponse.json(
      {
        event: {
          id: event.id,
          title: event.title,
          description: event.description,
          type: event.type,
          emoji: event.emoji,
          coverColor: event.coverColor,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate?.toISOString() ?? null,
          duration: event.duration,
          location: event.location,
          meetingUrl: event.meetingUrl,
          maxAttendees: event.maxAttendees,
          attendeeCount: event.attendeeCount,
          isFree: event.isFree,
          status: event.status,
          tags: event.tags,
          courseId: event.courseId,
          courseName: event.course?.title ?? null,
          groupId: event.groupId,
          groupName: event.group?.name ?? null,
          groupEmoji: event.group?.emoji ?? null,
          createdBy: {
            id: event.creator.id,
            name: event.creator.name,
            avatar: event.creator.avatar,
            role: event.creator.role,
            level: event.creator.level,
          },
          isAttending: false,
          createdAt: event.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating community event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
