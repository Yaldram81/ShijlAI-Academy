import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/student/community/study-groups/[groupId]?userId=xxx
// Get full group details including members, recent messages, resources, and stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!groupId) {
      return NextResponse.json(
        { error: 'groupId is required' },
        { status: 400 }
      )
    }

    // Fetch group with all related data
    const group = await db.studyGroup.findUnique({
      where: { id: groupId },
      include: {
        course: {
          select: { id: true, title: true, category: true },
        },
        createdBy: {
          select: { id: true, name: true, avatar: true, xp: true, level: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                xp: true,
                level: true,
                role: true,
                streak: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        messages: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, avatar: true, level: true },
            },
          },
        },
        resources: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Study group not found' },
        { status: 404 }
      )
    }

    // Check if requesting user is a member
    const membership = userId
      ? await db.studyGroupMember.findUnique({
          where: {
            groupId_userId: { groupId, userId },
          },
          select: { id: true, role: true, joinedAt: true },
        })
      : null

    // Reverse messages so they're in chronological order
    const reversedMessages = [...group.messages].reverse()

    // Format members
    const formattedMembers = group.members.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      avatar: member.user.avatar,
      xp: member.user.xp,
      level: member.user.level,
      role: member.user.role,
      streak: member.user.streak,
      groupRole: member.role,
      joinedAt: member.joinedAt.toISOString(),
    }))

    // Format recent messages
    const formattedMessages = reversedMessages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      type: msg.type,
      attachments: msg.attachments,
      isPinned: msg.isPinned,
      createdAt: msg.createdAt.toISOString(),
      user: {
        id: msg.user.id,
        name: msg.user.name,
        avatar: msg.user.avatar,
        level: msg.user.level,
      },
    }))

    // Format resources
    const formattedResources = group.resources.map((res) => ({
      id: res.id,
      title: res.title,
      description: res.description,
      url: res.url,
      fileType: res.fileType,
      tags: res.tags,
      downloads: res.downloads,
      createdAt: res.createdAt.toISOString(),
      user: {
        id: res.user.id,
        name: res.user.name,
        avatar: res.user.avatar,
      },
    }))

    // Compute member stats
    const totalXp = group.members.reduce((sum, m) => sum + m.user.xp, 0)
    const avgLevel =
      group.members.length > 0
        ? Math.round(
            group.members.reduce((sum, m) => sum + m.user.level, 0) /
              group.members.length
          )
        : 0
    const adminCount = group.members.filter(
      (m) => m.role === 'admin'
    ).length

    const response = {
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        emoji: group.emoji,
        isActive: group.isActive,
        maxMembers: group.maxMembers,
        memberCount: group.memberCount,
        courseId: group.courseId,
        courseName: group.course?.title ?? null,
        courseCategory: group.course?.category ?? null,
        createdById: group.createdById,
        createdBy: {
          id: group.createdBy.id,
          name: group.createdBy.name,
          avatar: group.createdBy.avatar,
          xp: group.createdBy.xp,
          level: group.createdBy.level,
        },
        createdAt: group.createdAt.toISOString(),
        updatedAt: group.updatedAt.toISOString(),
        isMember: !!membership,
        memberRole: membership?.role ?? null,
        joinedAt: membership?.joinedAt.toISOString() ?? null,
      },
      members: formattedMembers,
      recentMessages: formattedMessages,
      resources: formattedResources,
      stats: {
        totalMembers: group.memberCount,
        adminCount,
        totalXp,
        avgLevel,
        spotsLeft: group.maxMembers - group.memberCount,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching study group details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch study group details' },
      { status: 500 }
    )
  }
}
