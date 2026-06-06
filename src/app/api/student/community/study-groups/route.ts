import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper: validate userId, fallback to first student user
async function validateUser(userId: string | null): Promise<{ id: string; name: string; role: string } | null> {
  if (userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    })
    if (user) return user
  }
  // Fallback: find first student user
  const fallback = await db.user.findFirst({
    where: { role: 'student' },
    select: { id: true, name: true, role: true },
  })
  return fallback
}

// GET /api/student/community/study-groups?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const user = await validateUser(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'No student user found' },
        { status: 404 }
      )
    }

    // Fetch all active study groups
    const groups = await db.studyGroup.findMany({
      where: { isActive: true },
      include: {
        course: {
          select: { id: true, title: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        members: {
          where: { userId: user.id },
          select: { id: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedGroups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      emoji: group.emoji,
      courseId: group.courseId,
      courseName: group.course?.title ?? null,
      createdById: group.createdById,
      createdByName: group.createdBy.name,
      isActive: group.isActive,
      maxMembers: group.maxMembers,
      memberCount: group.memberCount,
      isMember: group.members.length > 0,
      memberRole: group.members.length > 0 ? group.members[0].role : null,
      createdAt: group.createdAt.toISOString(),
    }))

    return NextResponse.json({ groups: formattedGroups })
  } catch (error) {
    console.error('Error fetching study groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch study groups' },
      { status: 500 }
    )
  }
}

// POST /api/student/community/study-groups — Create a new study group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, description, emoji, courseId, maxMembers } = body

    if (!userId || !name || !description) {
      return NextResponse.json(
        { error: 'userId, name, and description are required' },
        { status: 400 }
      )
    }

    // Validate user exists
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

    // Create group and auto-join creator as admin in a transaction
    const group = await db.$transaction(async (tx) => {
      const newGroup = await tx.studyGroup.create({
        data: {
          name,
          description,
          emoji: emoji || '📚',
          courseId: courseId || null,
          createdById: userId,
          maxMembers: maxMembers || 50,
          memberCount: 1,
        },
        include: {
          course: {
            select: { id: true, title: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
        },
      })

      // Auto-join creator as admin
      await tx.studyGroupMember.create({
        data: {
          groupId: newGroup.id,
          userId,
          role: 'admin',
        },
      })

      return newGroup
    })

    return NextResponse.json(
      {
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
          emoji: group.emoji,
          courseId: group.courseId,
          courseName: group.course?.title ?? null,
          createdById: group.createdById,
          createdByName: group.createdBy.name,
          isActive: group.isActive,
          maxMembers: group.maxMembers,
          memberCount: group.memberCount,
          isMember: true,
          memberRole: 'admin',
          createdAt: group.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating study group:', error)
    return NextResponse.json(
      { error: 'Failed to create study group' },
      { status: 500 }
    )
  }
}
