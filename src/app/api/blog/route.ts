import { NextRequest, NextResponse } from 'next/server'
import { articles, allCategories } from '@/lib/blog-data'
import { db } from '@/lib/db'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  tags: string
  coverImage: string | null
  gradient: string
  authorId: string | null
  authorName: string
  authorAvatar: string
  authorBio: string
  status: string
  featured: boolean
  trending: boolean
  allowComments: boolean
  readTime: string
  estimatedMinutes: number
  viewCount: number
  shareCount: number
  likeCount: number
  commentCount: number
  seoTitle: string | null
  seoDescription: string | null
  publishedAt: string
  createdAt: string
  updatedAt: string
}

// Stable view counts seeded by article id
const viewCounts: Record<string, number> = {}
const likeCounts: Record<string, number> = {}
const commentCounts: Record<string, number> = {}

articles.forEach((a) => {
  const seed = parseInt(a.id) * 371
  viewCounts[a.id] = (seed % 5000) + 500
  likeCounts[a.id] = Math.floor(a.shareCount * 0.6)
  commentCounts[a.id] = Math.floor(a.shareCount * 0.15)
})

function toBlogPost(article: typeof articles[number]): BlogPost {
  return {
    id: article.id,
    title: article.title,
    slug: article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    excerpt: article.excerpt,
    content: article.content,
    category: article.category,
    tags: JSON.stringify(article.tags),
    coverImage: null,
    gradient: article.gradient,
    authorId: null,
    authorName: article.author,
    authorAvatar: article.authorAvatar,
    authorBio: article.authorBio,
    status: 'published',
    featured: article.featured,
    trending: article.trending,
    allowComments: true,
    readTime: article.readTime,
    estimatedMinutes: parseInt(article.readTime) || 5,
    viewCount: viewCounts[article.id] || 500,
    shareCount: article.shareCount,
    likeCount: likeCounts[article.id] || 0,
    commentCount: commentCounts[article.id] || 0,
    seoTitle: article.title,
    seoDescription: article.excerpt,
    publishedAt: new Date(article.date).toISOString(),
    createdAt: new Date(article.date).toISOString(),
    updatedAt: new Date(article.date).toISOString(),
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl

    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const tag = searchParams.get('tag') || ''
    const status = searchParams.get('status') || 'published'
    const sort = searchParams.get('sort') || 'newest'
    const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10) || 12, 50)
    const offset = parseInt(searchParams.get('offset') || '0', 10) || 0
    const featured = searchParams.get('featured')
    const authorId = searchParams.get('authorId') || ''

    // Convert static articles to BlogPost format
    let posts = articles.map(toBlogPost)

    // Filter by status
    if (status === 'published') {
      posts = posts.filter((p) => p.status === 'published')
    }

    // Filter by search
    if (search) {
      const q = search.toLowerCase()
      posts = posts.filter((p) => {
        const tagList = (() => {
          try { return JSON.parse(p.tags) as string[] } catch { return [] }
        })()
        return (
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          tagList.some((t) => t.toLowerCase().includes(q)) ||
          p.authorName.toLowerCase().includes(q)
        )
      })
    }

    // Filter by category
    if (category && category !== 'All') {
      posts = posts.filter((p) => p.category === category)
    }

    // Filter by tag
    if (tag) {
      posts = posts.filter((p) => {
        try {
          const tagList = JSON.parse(p.tags) as string[]
          return tagList.some((t) => t.toLowerCase() === tag.toLowerCase())
        } catch {
          return false
        }
      })
    }

    // Filter by featured
    if (featured === 'true') {
      posts = posts.filter((p) => p.featured)
    } else if (featured === 'false') {
      posts = posts.filter((p) => !p.featured)
    }

    // Filter by authorId
    if (authorId) {
      posts = posts.filter((p) => p.authorId === authorId)
    }

    // Compute facets before pagination
    const categoryFacets: { name: string; count: number }[] = []
    const tagFacets: { name: string; count: number }[] = []
    const tagCountMap: Record<string, number> = {}

    const cats = [...new Set(posts.map((p) => p.category))]
    for (const cat of cats) {
      categoryFacets.push({ name: cat, count: posts.filter((p) => p.category === cat).length })
    }

    for (const p of posts) {
      try {
        const tagList = JSON.parse(p.tags) as string[]
        for (const t of tagList) {
          tagCountMap[t] = (tagCountMap[t] || 0) + 1
        }
      } catch { /* ignore */ }
    }
    for (const [name, count] of Object.entries(tagCountMap)) {
      tagFacets.push({ name, count })
    }
    tagFacets.sort((a, b) => b.count - a.count)

    // Sort
    switch (sort) {
      case 'popular':
        posts.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
        break
      case 'trending':
        posts.sort((a, b) => (b.shareCount || 0) - (a.shareCount || 0))
        break
      case 'most_viewed':
        posts.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        break
      case 'newest':
      default:
        posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        break
    }

    const total = posts.length
    const hasMore = offset + limit < total
    const paginatedPosts = posts.slice(offset, offset + limit)

    return NextResponse.json({
      posts: paginatedPosts,
      pagination: {
        total,
        limit,
        offset,
        hasMore,
      },
      facets: {
        categories: categoryFacets,
        tags: tagFacets,
      },
    })
  } catch (error) {
    console.error('[BLOG_GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}

// POST /api/blog - Create a new blog post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!body.category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      )
    }

    // Generate slug from title if not provided
    const slug = body.slug?.trim() || body.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Check slug uniqueness
    const existingSlug = await db.blogPost.findUnique({ where: { slug } })
    if (existingSlug) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 409 }
      )
    }

    // Parse tags
    const tags = Array.isArray(body.tags) ? JSON.stringify(body.tags) : (typeof body.tags === 'string' ? body.tags : '[]')

    const post = await db.blogPost.create({
      data: {
        title: body.title.trim(),
        slug,
        excerpt: body.excerpt?.trim() || '',
        content: body.content?.trim() || '',
        category: body.category,
        tags,
        coverImage: body.coverImage || null,
        gradient: body.gradient || 'from-emerald-500 to-teal-600',
        authorId: body.authorId || 'admin',
        authorName: body.authorName || 'Admin',
        authorAvatar: body.authorAvatar || null,
        authorBio: body.authorBio || null,
        status: body.status || 'draft',
        featured: body.featured ?? false,
        trending: body.trending ?? false,
        allowComments: body.allowComments ?? true,
        readTime: body.readTime || '5 min read',
        estimatedMinutes: parseInt(body.estimatedMinutes, 10) || 5,
        shareCount: 0,
        seoTitle: body.seoTitle || null,
        seoDescription: body.seoDescription || null,
        publishedAt: body.status === 'published' ? new Date() : null,
      },
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

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('[BLOG_POST]', error)
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    )
  }
}
