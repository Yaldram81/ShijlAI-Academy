import { db } from '@/lib/db'
import { articles } from '@/lib/blog-data'
import { NextResponse } from 'next/server'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function parseDateString(dateStr: string): Date | null {
  try {
    // Parse dates like "Feb 28, 2025"
    const parsed = new Date(dateStr)
    if (isNaN(parsed.getTime())) return null
    return parsed
  } catch {
    return null
  }
}

// POST /api/blog/seed - Seed blog posts from static blog-data.ts
export async function POST() {
  try {
    // Find an admin user to use as author fallback
    const adminUser = await db.user.findFirst({
      where: { role: 'admin' },
    })

    const defaultAuthorId = adminUser?.id || 'seed-admin'

    let created = 0
    let skipped = 0
    const errors: string[] = []

    for (const article of articles) {
      try {
        const slug = generateSlug(article.title)

        // Check if a post with this slug already exists
        const existing = await db.blogPost.findUnique({ where: { slug } })
        if (existing) {
          skipped++
          continue
        }

        const publishedAt = parseDateString(article.date)

        await db.blogPost.create({
          data: {
            title: article.title,
            slug,
            excerpt: article.excerpt,
            content: article.content,
            category: article.category,
            tags: JSON.stringify(article.tags),
            gradient: article.gradient,
            authorId: defaultAuthorId,
            authorName: article.author,
            authorAvatar: article.authorAvatar || null,
            authorBio: article.authorBio || null,
            status: 'published',
            featured: article.featured ?? false,
            trending: article.trending ?? false,
            allowComments: true,
            readTime: article.readTime,
            estimatedMinutes: parseInt(article.readTime, 10) || 5,
            shareCount: article.shareCount || 0,
            publishedAt: publishedAt || new Date(),
          },
        })

        created++
      } catch (articleError) {
        const errorMsg = articleError instanceof Error ? articleError.message : 'Unknown error'
        errors.push(`Failed to seed "${article.title}": ${errorMsg}`)
      }
    }

    return NextResponse.json({
      message: 'Blog seed completed',
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[BLOG_SEED]', error)
    return NextResponse.json(
      { error: 'Failed to seed blog posts' },
      { status: 500 }
    )
  }
}
