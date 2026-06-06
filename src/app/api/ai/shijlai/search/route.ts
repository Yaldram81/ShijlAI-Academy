import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/ai/shijlai/search
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, query, courseId } = body

    if (!userId || !query) {
      return NextResponse.json({ error: 'userId and query are required' }, { status: 400 })
    }

    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2)
      .slice(0, 5)

    if (keywords.length === 0) {
      return NextResponse.json({ results: [] })
    }

    // Build course filter
    const courseFilter: Record<string, unknown> = { isPublished: true }
    if (courseId) {
      courseFilter.id = courseId
    }

    // Get relevant courses
    const courses = await db.course.findMany({
      where: courseFilter,
      include: {
        modules: {
          include: {
            lessons: {
              where: {
                isPublished: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      take: 20,
    })

    // Search through lessons using keyword matching
    const results: Array<{
      lessonId: string
      lessonTitle: string
      moduleId: string
      moduleTitle: string
      courseId: string
      courseTitle: string
      content: string
      score: number
    }> = []

    for (const course of courses) {
      for (const courseModule of course.modules) {
        for (const lesson of courseModule.lessons) {
          let score = 0
          const titleLower = lesson.title.toLowerCase()
          const contentLower = (lesson.content || '').toLowerCase()
          const descriptionLower = (lesson.description || '').toLowerCase()

          for (const keyword of keywords) {
            if (titleLower.includes(keyword)) score += 10
            if (descriptionLower.includes(keyword)) score += 5
            if (contentLower.includes(keyword)) score += 2

            // Count occurrences for more relevance
            const occurrences = (contentLower.match(new RegExp(keyword, 'g')) || []).length
            score += Math.min(occurrences, 10)
          }

          if (score > 0) {
            // Extract a relevant snippet from the content
            let snippet = ''
            const contentText = lesson.content || ''
            for (const keyword of keywords) {
              const idx = contentLower.indexOf(keyword)
              if (idx !== -1) {
                const start = Math.max(0, idx - 100)
                const end = Math.min(contentText.length, idx + keyword.length + 200)
                snippet = contentText.slice(start, end).trim()
                if (start > 0) snippet = '...' + snippet
                if (end < contentText.length) snippet = snippet + '...'
                break
              }
            }

            results.push({
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              moduleId: courseModule.id,
              moduleTitle: courseModule.title,
              courseId: course.id,
              courseTitle: course.title,
              content: snippet || lesson.description || lesson.title,
              score,
            })
          }
        }
      }
    }

    // Sort by score descending and limit results
    results.sort((a, b) => b.score - a.score)
    const topResults = results.slice(0, 10)

    // Log activity
    await db.studentAIActivity.create({
      data: {
        userId,
        activityType: 'chat_message',
        metadata: JSON.stringify({ action: 'search', query, resultCount: topResults.length }),
      },
    })

    return NextResponse.json({ results: topResults })
  } catch (error) {
    console.error('[ShijlAI Search] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
