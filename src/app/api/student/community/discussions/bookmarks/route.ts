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

// GET /api/student/community/discussions/bookmarks?userId=xxx
// Get user's bookmarked posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Validate user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch bookmarked posts with full details
    const bookmarks = await db.discussionBookmark.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            user: {
              select: { id: true, name: true, role: true, avatar: true },
            },
            course: {
              select: { id: true, title: true, category: true },
            },
            upvoteRecords: {
              where: { userId },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedPosts = bookmarks.map((bookmark) => {
      const post = bookmark.post
      return {
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
        courseId: post.courseId,
        courseName: post.course?.title ?? null,
        courseCategory: post.course?.category ?? null,
        user: {
          id: post.user.id,
          name: post.user.name,
          role: post.user.role,
          avatar: post.user.avatar,
        },
        hasUpvoted: post.upvoteRecords.length > 0,
        bookmarkedAt: bookmark.createdAt.toISOString(),
        bookmarkId: bookmark.id,
      }
    })

    return NextResponse.json({ bookmarks: formattedPosts })
  } catch (error) {
    console.error('Error fetching discussion bookmarks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    )
  }
}

// POST /api/student/community/discussions/bookmarks
// Bookmark/unbookmark a post: { userId, postId, action: "add" | "remove" }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, postId, action } = body

    if (!userId || !postId || !action) {
      return NextResponse.json(
        { error: 'userId, postId, and action are required' },
        { status: 400 }
      )
    }

    if (action !== 'add' && action !== 'remove') {
      return NextResponse.json(
        { error: 'Action must be "add" or "remove"' },
        { status: 400 }
      )
    }

    // Validate user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate post exists
    const post = await db.discussionPost.findUnique({
      where: { id: postId },
      select: { id: true, title: true },
    })
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (action === 'add') {
      // Check if already bookmarked
      const existing = await db.discussionBookmark.findUnique({
        where: {
          userId_postId: { userId, postId },
        },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'Post is already bookmarked' },
          { status: 400 }
        )
      }

      const bookmark = await db.discussionBookmark.create({
        data: { userId, postId },
      })

      return NextResponse.json(
        {
          bookmarked: true,
          bookmarkId: bookmark.id,
          postId,
          userId,
        },
        { status: 201 }
      )
    }

    if (action === 'remove') {
      // Check if bookmark exists
      const existing = await db.discussionBookmark.findUnique({
        where: {
          userId_postId: { userId, postId },
        },
      })
      if (!existing) {
        return NextResponse.json(
          { error: 'Bookmark not found' },
          { status: 404 }
        )
      }

      await db.discussionBookmark.delete({
        where: { id: existing.id },
      })

      return NextResponse.json({
        removed: true,
        postId,
        userId,
      })
    }

    // Should not reach here
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating discussion bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to update bookmark' },
      { status: 500 }
    )
  }
}
