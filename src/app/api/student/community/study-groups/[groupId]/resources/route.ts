import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/student/community/study-groups/[groupId]/resources?userId=xxx
// Get group resources
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

    // Verify group exists
    const group = await db.studyGroup.findUnique({
      where: { id: groupId },
      select: { id: true },
    })
    if (!group) {
      return NextResponse.json(
        { error: 'Study group not found' },
        { status: 404 }
      )
    }

    // Verify user is a member (if userId provided)
    if (userId) {
      const membership = await db.studyGroupMember.findUnique({
        where: { groupId_userId: { groupId, userId } },
        select: { id: true },
      })
      if (!membership) {
        return NextResponse.json(
          { error: 'You must be a member to view resources' },
          { status: 403 }
        )
      }
    }

    const resources = await db.studyGroupResource.findMany({
      where: { groupId },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, level: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedResources = resources.map((res) => ({
      id: res.id,
      title: res.title,
      description: res.description,
      url: res.url,
      fileType: res.fileType,
      tags: res.tags,
      downloads: res.downloads,
      createdAt: res.createdAt.toISOString(),
      updatedAt: res.updatedAt.toISOString(),
      user: {
        id: res.user.id,
        name: res.user.name,
        avatar: res.user.avatar,
        level: res.user.level,
      },
    }))

    return NextResponse.json({ resources: formattedResources })
  } catch (error) {
    console.error('Error fetching group resources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group resources' },
      { status: 500 }
    )
  }
}

// POST /api/student/community/study-groups/[groupId]/resources
// Add a resource to group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
    const body = await request.json()
    const { userId, title, description, url, fileType, tags } = body

    if (!groupId || !userId || !title) {
      return NextResponse.json(
        { error: 'groupId, userId, and title are required' },
        { status: 400 }
      )
    }

    // Verify group exists
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
        { error: 'This study group is no longer active' },
        { status: 400 }
      )
    }

    // Verify user is a member
    const membership = await db.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { id: true },
    })
    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member to add resources' },
        { status: 403 }
      )
    }

    // Validate user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatar: true, level: true },
    })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const resource = await db.studyGroupResource.create({
      data: {
        groupId,
        userId,
        title,
        description: description || null,
        url: url || null,
        fileType: fileType || 'link',
        tags: tags || null,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, level: true },
        },
      },
    })

    return NextResponse.json(
      {
        resource: {
          id: resource.id,
          title: resource.title,
          description: resource.description,
          url: resource.url,
          fileType: resource.fileType,
          tags: resource.tags,
          downloads: resource.downloads,
          createdAt: resource.createdAt.toISOString(),
          updatedAt: resource.updatedAt.toISOString(),
          user: {
            id: resource.user.id,
            name: resource.user.name,
            avatar: resource.user.avatar,
            level: resource.user.level,
          },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding group resource:', error)
    return NextResponse.json(
      { error: 'Failed to add resource' },
      { status: 500 }
    )
  }
}
