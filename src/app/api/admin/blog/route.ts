import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/admin/blog - Admin blog listing with all statuses and stats
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const sort = searchParams.get('sort') || 'newest'
    const limitParam = searchParams.get('limit') || '10'
    const offsetParam = searchParams.get('offset') || '0'
    const authorId = searchParams.get('authorId') || ''
    const featuredParam = searchParams.get('featured')

    const limit = Math.min(parseInt(limitParam, 10) || 10, 50)
    const offset = parseInt(offsetParam, 10) || 0

    // Build where clause - admin can see all statuses
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (category) {
      where.category = category
    }

    if (authorId) {
      where.authorId = authorId
    }

    if (featuredParam === 'true') {
      where.featured = true
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { tags: { contains: search } },
        { category: { contains: search } },
        { authorName: { contains: search } },
      ]
    }

    // Build order by
    let orderBy: any = { createdAt: 'desc' }
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      case 'popular':
        orderBy = { viewCount: 'desc' }
        break
      case 'most_viewed':
        orderBy = { viewCount: 'desc' }
        break
      case 'most_liked':
        orderBy = { likeCount: 'desc' }
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    const [posts, total] = await Promise.all([
      db.blogPost.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
      }),
      db.blogPost.count({ where }),
    ])

    // Get stats using counts
    const [
      totalPosts,
      publishedCount,
      draftCount,
      archivedCount,
      featuredCount,
    ] = await Promise.all([
      db.blogPost.count(),
      db.blogPost.count({ where: { status: 'published' } }),
      db.blogPost.count({ where: { status: 'draft' } }),
      db.blogPost.count({ where: { status: 'archived' } }),
      db.blogPost.count({ where: { featured: true } }),
    ])

    // Get total views and likes by summing manually
    const allPosts = await db.blogPost.findMany({ select: { viewCount: true, likeCount: true } })
    const totalViews = allPosts.reduce((sum, p) => sum + (p.viewCount || 0), 0)
    const totalLikes = allPosts.reduce((sum, p) => sum + (p.likeCount || 0), 0)

    return NextResponse.json({
      posts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      stats: {
        total: totalPosts,
        published: publishedCount,
        draft: draftCount,
        archived: archivedCount,
        featured: featuredCount,
        totalViews,
        totalLikes,
      },
    })
  } catch (error) {
    console.error('[ADMIN_BLOG_GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin blog posts' },
      { status: 500 }
    )
  }
}
