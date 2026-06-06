import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// PATCH /api/admin/blog/[id] - Admin update with all fields
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if post exists
    const existing = await db.blogPost.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    // If slug is being updated, check uniqueness
    if (body.slug && body.slug !== existing.slug) {
      const slugConflict = await db.blogPost.findUnique({ where: { slug: body.slug } })
      if (slugConflict) {
        return NextResponse.json(
          { error: 'A post with this slug already exists' },
          { status: 409 }
        )
      }
    }

    const updateData: any = {}

    // Map all updatable fields
    if (body.title !== undefined) {
      updateData.title = body.title
      // Auto-generate slug if not explicitly provided
      if (body.slug === undefined) {
        updateData.slug = body.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
      }
    }
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt
    if (body.content !== undefined) updateData.content = body.content
    if (body.category !== undefined) updateData.category = body.category
    if (body.tags !== undefined) {
      updateData.tags = Array.isArray(body.tags) ? JSON.stringify(body.tags) : body.tags
    }
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage || null
    if (body.gradient !== undefined) updateData.gradient = body.gradient
    if (body.authorName !== undefined) updateData.authorName = body.authorName
    if (body.authorAvatar !== undefined) updateData.authorAvatar = body.authorAvatar || null
    if (body.authorBio !== undefined) updateData.authorBio = body.authorBio || null
    if (body.status !== undefined) {
      updateData.status = body.status
      // Set publishedAt when first publishing
      if (body.status === 'published' && !existing.publishedAt) {
        updateData.publishedAt = new Date()
      }
      // Clear publishedAt if unpublishing
      if (body.status === 'draft' && existing.publishedAt) {
        updateData.publishedAt = null
      }
    }
    if (body.featured !== undefined) updateData.featured = body.featured
    if (body.trending !== undefined) updateData.trending = body.trending
    if (body.allowComments !== undefined) updateData.allowComments = body.allowComments
    if (body.readTime !== undefined) updateData.readTime = body.readTime
    if (body.estimatedMinutes !== undefined) updateData.estimatedMinutes = body.estimatedMinutes
    if (body.viewCount !== undefined) updateData.viewCount = body.viewCount
    if (body.shareCount !== undefined) updateData.shareCount = body.shareCount
    if (body.likeCount !== undefined) updateData.likeCount = body.likeCount
    if (body.commentCount !== undefined) updateData.commentCount = body.commentCount
    if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle || null
    if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription || null

    const post = await db.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error('[ADMIN_BLOG_PATCH_ID]', error)
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/blog/[id] - Hard delete a blog post
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.blogPost.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    await db.blogPost.delete({ where: { id } })

    return NextResponse.json({ message: 'Blog post deleted successfully' })
  } catch (error) {
    console.error('[ADMIN_BLOG_DELETE_ID]', error)
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    )
  }
}
