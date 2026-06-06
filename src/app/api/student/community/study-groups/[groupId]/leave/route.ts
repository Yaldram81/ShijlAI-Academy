import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/student/community/study-groups/[groupId]/leave — Leave a study group
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

    // Check if user is a member
    const membership = await db.studyGroupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
    })
    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 400 }
      )
    }

    // Prevent the group creator (admin) from leaving if they're the only admin
    if (membership.role === 'admin') {
      const adminCount = await db.studyGroupMember.count({
        where: { groupId, role: 'admin' },
      })
      if (adminCount <= 1) {
        // If they're the only admin, they must transfer ownership first or delete the group
        const totalMembers = await db.studyGroupMember.count({
          where: { groupId },
        })
        if (totalMembers > 1) {
          return NextResponse.json(
            { error: 'You must transfer ownership before leaving as the only admin' },
            { status: 400 }
          )
        }
        // If they're the only member, deactivate the group instead
        await db.$transaction([
          db.studyGroupMember.delete({
            where: { id: membership.id },
          }),
          db.studyGroup.update({
            where: { id: groupId },
            data: {
              memberCount: { decrement: 1 },
              isActive: false,
            },
          }),
        ])
        return NextResponse.json({ left: true })
      }
    }

    // Remove membership and decrement memberCount
    await db.$transaction([
      db.studyGroupMember.delete({
        where: { id: membership.id },
      }),
      db.studyGroup.update({
        where: { id: groupId },
        data: { memberCount: { decrement: 1 } },
      }),
    ])

    return NextResponse.json({ left: true })
  } catch (error) {
    console.error('Error leaving study group:', error)
    return NextResponse.json(
      { error: 'Failed to leave study group' },
      { status: 500 }
    )
  }
}
