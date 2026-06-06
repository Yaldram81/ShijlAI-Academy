import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/student/community/study-groups/[groupId]/join — Join a study group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    const body = await request.json()
    const { userId } = body

    if (!groupId || !userId) {
      return NextResponse.json(
        { error: 'groupId and userId are required' },
        { status: 400 }
      )
    }

    // Validate group exists and is active
    const group = await db.studyGroup.findUnique({
      where: { id: groupId },
      select: { id: true, isActive: true, maxMembers: true, memberCount: true },
    })
    if (!group) {
      return NextResponse.json(
        { error: 'Study group not found' },
        { status: 404 }
      )
    }
    if (!group.isActive) {
      return NextResponse.json(
        { error: 'This study group is no longer active' },
        { status: 400 }
      )
    }

    // Check if already a member
    const existingMembership = await db.studyGroupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
    })
    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this group' },
        { status: 400 }
      )
    }

    // Check if group is full
    if (group.memberCount >= group.maxMembers) {
      return NextResponse.json(
        { error: 'This study group is full' },
        { status: 400 }
      )
    }

    // Add membership and increment memberCount in a transaction
    await db.$transaction([
      db.studyGroupMember.create({
        data: {
          groupId,
          userId,
          role: 'member',
        },
      }),
      db.studyGroup.update({
        where: { id: groupId },
        data: { memberCount: { increment: 1 } },
      }),
    ])

    return NextResponse.json({ joined: true })
  } catch (error) {
    console.error('Error joining study group:', error)
    return NextResponse.json(
      { error: 'Failed to join study group' },
      { status: 500 }
    )
  }
}
