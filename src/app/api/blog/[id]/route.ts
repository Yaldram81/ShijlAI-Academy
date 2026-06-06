import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/blog/[id] - Fetch single blog post by ID (increments viewCount)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const post = await db.blogPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    // Increment viewCount asynchronously
    db.blogPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch((err) => {
      console.error('[BLOG_VIEW_INCREMENT]', err)
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error('[BLOG_GET_ID]', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    )
  }
}

// PATCH /api/blog/[id] - Update blog post
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

    // If title is updated but slug is not provided, auto-generate slug
    const updateData: any = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.slug !== undefined) updateData.slug = body.slug
    else if (body.title !== undefined) {
      // Auto-generate slug from title
      const generatedSlug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      updateData.slug = generatedSlug
    }
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt
    if (body.content !== undefined) updateData.content = body.content
    if (body.category !== undefined) updateData.category = body.category
    if (body.tags !== undefined) {
      updateData.tags = Array.isArray(body.tags) ? JSON.stringify(body.tags) : body.tags
    }
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage
    if (body.gradient !== undefined) updateData.gradient = body.gradient
    if (body.authorName !== undefined) updateData.authorName = body.authorName
    if (body.authorAvatar !== undefined) updateData.authorAvatar = body.authorAvatar
    if (body.authorBio !== undefined) updateData.authorBio = body.authorBio
    if (body.status !== undefined) {
      updateData.status = body.status
      // Set publishedAt when first publishing
      if (body.status === 'published' && !existing.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }
    if (body.featured !== undefined) updateData.featured = body.featured
    if (body.trending !== undefined) updateData.trending = body.trending
    if (body.allowComments !== undefined) updateData.allowComments = body.allowComments
    if (body.readTime !== undefined) updateData.readTime = body.readTime
    if (body.estimatedMinutes !== undefined) updateData.estimatedMinutes = body.estimatedMinutes
    if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle
    if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription

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
    console.error('[BLOG_PATCH_ID]', error)
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    )
  }
}

// DELETE /api/blog/[id] - Delete a blog post
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
    console.error('[BLOG_DELETE_ID]', error)
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    )
  }
}
