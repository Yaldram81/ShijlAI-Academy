import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/student/recommendations?userId=xxx — Personalized course recommendations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    // Validate the user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get the student's enrolled course IDs, categories, and tags
    const enrollments = await db.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    })
    const enrolledCourseIds = enrollments.map((e) => e.courseId)

    // Get categories and tags from enrolled courses
    const enrolledCourses = await db.course.findMany({
      where: { id: { in: enrolledCourseIds } },
      select: { category: true, tags: true },
    })

    // Extract unique categories
    const enrolledCategories = [...new Set(enrolledCourses.map((c) => c.category))]

    // Extract unique tags from enrolled courses
    const enrolledTags = new Set<string>()
    for (const course of enrolledCourses) {
      if (course.tags) {
        try {
          const tags: string[] = JSON.parse(course.tags)
          for (const tag of tags) {
            enrolledTags.add(tag.toLowerCase())
          }
        } catch {
          // Invalid JSON, skip
        }
      }
    }

    // Find courses in similar categories that the student hasn't enrolled in
    // Use 2 queries: one for same-category courses, one for popular courses as backup
    const [categoryMatches, popularCourses] = await Promise.all([
      // Primary: courses in same categories, not enrolled, published
      db.course.findMany({
        where: {
          isPublished: true,
          isArchived: false,
          id: { notIn: enrolledCourseIds },
          category: { in: enrolledCategories },
        },
        include: {
          instructor: {
            select: { id: true, name: true },
          },
        },
        orderBy: { rating: 'desc' },
        take: 12,
      }),

      // Fallback: popular courses across all categories
      db.course.findMany({
        where: {
          isPublished: true,
          isArchived: false,
          id: { notIn: enrolledCourseIds },
        },
        include: {
          instructor: {
            select: { id: true, name: true },
          },
        },
        orderBy: { enrollmentCount: 'desc' },
        take: 12,
      }),
    ])

    // Score and rank category matches by tag overlap
    const scoredCourses = categoryMatches.map((course) => {
      let tagOverlapScore = 0
      if (course.tags) {
        try {
          const courseTags: string[] = JSON.parse(course.tags)
          for (const tag of courseTags) {
            if (enrolledTags.has(tag.toLowerCase())) {
              tagOverlapScore += 1
            }
          }
        } catch {
          // Invalid JSON, no bonus
        }
      }

      // Bonus for high rating and enrollment count
      const ratingScore = course.rating * 2
      const enrollmentScore = Math.min(course.enrollmentCount / 10, 5)

      return {
        course,
        score: tagOverlapScore + ratingScore + enrollmentScore,
      }
    })

    // Sort by score descending
    scoredCourses.sort((a, b) => b.score - a.score)

    // Take top scored courses first
    let recommendations = scoredCourses.map((s) => s.course)

    // If not enough from category matches, fill from popular courses
    if (recommendations.length < 6) {
      const existingIds = new Set(recommendations.map((c) => c.id))
      const fillers = popularCourses.filter((c) => !existingIds.has(c.id))
      recommendations = [...recommendations, ...fillers].slice(0, 6)
    } else {
      recommendations = recommendations.slice(0, 6)
    }

    // Format the response
    const formatted = recommendations.map((course) => ({
      id: course.id,
      title: course.title,
      thumbnail: course.thumbnail,
      rating: course.rating,
      enrollmentCount: course.enrollmentCount,
      price: course.price,
      category: course.category,
      instructor: { name: course.instructor.name },
    }))

    // Build a human-readable reason string
    const reason = enrolledCategories.length > 0
      ? `Recommended because you're learning ${enrolledCategories.join(' and ')}`
      : 'Recommended based on popular courses'

    return NextResponse.json({
      recommendations: formatted,
      reason,
    })
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}
