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

// GET /api/student/community/discussions?userId=xxx&courseId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    let courseId = searchParams.get('courseId')

    const user = await validateUser(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'No student user found' },
        { status: 404 }
      )
    }

    // If no courseId provided, use user's first enrolled course
    if (!courseId) {
      const firstEnrollment = await db.enrollment.findFirst({
        where: { userId: user.id },
        orderBy: { enrolledAt: 'desc' },
        select: { courseId: true },
      })
      if (!firstEnrollment) {
        return NextResponse.json({ posts: [], courseId: null })
      }
      courseId = firstEnrollment.courseId
    }

    // Fetch discussion posts for the course
    const posts = await db.discussionPost.findMany({
      where: { courseId },
      include: {
        user: {
          select: { id: true, name: true, role: true, avatar: true },
        },
        upvoteRecords: {
          where: { userId: user.id },
          select: { id: true },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { upvotes: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Check which posts the user has bookmarked
    const userBookmarks = await db.discussionBookmark.findMany({
      where: { userId: user.id, postId: { in: posts.map(p => p.id) } },
      select: { postId: true },
    })
    const bookmarkedPostIds = new Set(userBookmarks.map(b => b.postId))

    // Check which posts the user has upvoted
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      upvoteCount: post.upvotes,
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
      hasUpvoted: post.upvoteRecords.length > 0,
      isBookmarked: bookmarkedPostIds.has(post.id),
    }))

    return NextResponse.json({
      posts: formattedPosts,
      courseId,
    })
  } catch (error) {
    console.error('Error fetching discussion posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discussion posts' },
      { status: 500 }
    )
  }
}

// POST /api/student/community/discussions — Create a new discussion post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, courseId, title, content, lessonId, lessonContext } = body

    if (!userId || !courseId || !title || !content) {
      return NextResponse.json(
        { error: 'userId, courseId, title, and content are required' },
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

    // Validate course exists
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

    const post = await db.discussionPost.create({
      data: {
        courseId,
        userId,
        title,
        content,
        lessonId: lessonId || null,
        lessonContext: lessonContext || null,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true, avatar: true },
        },
      },
    })

    return NextResponse.json(
      {
        post: {
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
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating discussion post:', error)
    return NextResponse.json(
      { error: 'Failed to create discussion post' },
      { status: 500 }
    )
  }
}
