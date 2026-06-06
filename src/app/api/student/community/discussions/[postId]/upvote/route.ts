import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/student/community/discussions/[postId]/upvote — Toggle upvote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const body = await request.json()
    const { userId } = body

    if (!postId || !userId) {
      return NextResponse.json(
        { error: 'postId and userId are required' },
        { status: 400 }
      )
    }

    // Validate post exists
    const post = await db.discussionPost.findUnique({
      where: { id: postId },
      select: { id: true, upvotes: true },
    })
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user already upvoted
    const existingUpvote = await db.discussionUpvote.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    })

    if (existingUpvote) {
      // Remove upvote, decrement post.upvotes
      await db.$transaction([
        db.discussionUpvote.delete({
          where: { id: existingUpvote.id },
        }),
        db.discussionPost.update({
          where: { id: postId },
          data: { upvotes: { decrement: 1 } },
        }),
      ])

      return NextResponse.json({
        upvoted: false,
        upvotes: post.upvotes - 1,
      })
    } else {
      // Create upvote, increment post.upvotes
      await db.$transaction([
        db.discussionUpvote.create({
          data: { postId, userId },
        }),
        db.discussionPost.update({
          where: { id: postId },
          data: { upvotes: { increment: 1 } },
        }),
      ])

      return NextResponse.json({
        upvoted: true,
        upvotes: post.upvotes + 1,
      })
    }
  } catch (error) {
    console.error('Error toggling upvote:', error)
    return NextResponse.json(
      { error: 'Failed to toggle upvote' },
      { status: 500 }
    )
  }
}
