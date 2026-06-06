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

// GET /api/student/community/discussions/[postId]?userId=xxx
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      )
    }

    const post = await db.discussionPost.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: { id: true, name: true, role: true, avatar: true },
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, role: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        upvoteRecords: userId
          ? {
              where: { userId },
              select: { id: true },
            }
          : false,
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    const hasUpvoted = userId
      ? post.upvoteRecords && 'length' in post.upvoteRecords
        ? (post.upvoteRecords as { id: string }[]).length > 0
        : false
      : false

    const formattedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      upvotes: post.upvotes,
      replyCount: post.replyCount,
      lessonId: post.lessonId,
      lessonContext: post.lessonContext,
      timeAgo: timeAgo(post.createdAt),
      createdAt: post.createdAt.toISOString(),
      user: {
        id: post.user.id,
        name: post.user.name,
        role: post.user.role,
        avatar: post.user.avatar,
      },
      hasUpvoted,
      replies: post.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        upvotes: reply.upvotes,
        isEdited: reply.isEdited,
        timeAgo: timeAgo(reply.createdAt),
        createdAt: reply.createdAt.toISOString(),
        user: {
          id: reply.user.id,
          name: reply.user.name,
          role: reply.user.role,
          avatar: reply.user.avatar,
        },
      })),
    }

    return NextResponse.json({ post: formattedPost })
  } catch (error) {
    console.error('Error fetching discussion post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discussion post' },
      { status: 500 }
    )
  }
}

// POST /api/student/community/discussions/[postId] — Reply to a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const body = await request.json()
    const { userId, content } = body

    if (!postId || !userId || !content) {
      return NextResponse.json(
        { error: 'postId, userId, and content are required' },
        { status: 400 }
      )
    }

    // Validate post exists and is not locked
    const post = await db.discussionPost.findUnique({
      where: { id: postId },
      select: { id: true, isLocked: true },
    })
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }
    if (post.isLocked) {
      return NextResponse.json(
        { error: 'This discussion is locked and cannot receive new replies' },
        { status: 400 }
      )
    }

    // Validate user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true, avatar: true },
    })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create reply and increment post replyCount in a transaction
    const reply = await db.$transaction(async (tx) => {
      const newReply = await tx.discussionReply.create({
        data: {
          postId,
          userId,
          content,
        },
        include: {
          user: {
            select: { id: true, name: true, role: true, avatar: true },
          },
        },
      })

      await tx.discussionPost.update({
        where: { id: postId },
        data: { replyCount: { increment: 1 } },
      })

      return newReply
    })

    return NextResponse.json(
      {
        reply: {
          id: reply.id,
          content: reply.content,
          upvotes: reply.upvotes,
          isEdited: reply.isEdited,
          timeAgo: timeAgo(reply.createdAt),
          createdAt: reply.createdAt.toISOString(),
          user: {
            id: reply.user.id,
            name: reply.user.name,
            role: reply.user.role,
            avatar: reply.user.avatar,
          },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating reply:', error)
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    )
  }
}
