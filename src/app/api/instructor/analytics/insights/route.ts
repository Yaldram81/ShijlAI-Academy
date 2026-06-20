import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AIService } from '@/services/ai'

// GET /api/instructor/analytics/insights - AI-generated teaching insights
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const period = searchParams.get('period') || '30d'

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    // Verify instructor exists
    const instructor = await db.user.findUnique({
      where: { id: instructorId },
      select: { id: true, name: true, role: true },
    })
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    // Fetch analytics data to build insights
    const now = new Date()
    let startDate: Date | null = null
    let periodDays = 30
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        periodDays = 7
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        periodDays = 30
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        periodDays = 90
        break
      default:
        startDate = null
        periodDays = 365
        break
    }

    const prevStartDate = startDate
      ? new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000)
      : null

    // Get instructor's courses with data
    const instructorCourses = await db.course.findMany({
      where: { instructorId },
      include: {
        enrollments: {
          include: {
            user: { select: { id: true, lastActiveAt: true } },
            lessonProgress: { select: { status: true } },
          },
        },
        reviews: { select: { rating: true, content: true } },
        modules: { include: { lessons: { select: { id: true } } } },
      },
    })

    if (instructorCourses.length === 0) {
      return NextResponse.json({
        insights: [],
        summary: 'No courses found. Create your first course to start receiving AI insights.',
        recommendations: ['Create your first course to get started'],
      })
    }

    // Calculate key metrics
    const allEnrollments = instructorCourses.flatMap((c) => c.enrollments)
    const studentSet = new Set(allEnrollments.map((e) => e.userId))
    const totalStudents = studentSet.size
    const totalRevenue = instructorCourses.reduce((acc, c) => acc + c.price * c.enrollments.length, 0)
    const avgRating = instructorCourses.length > 0
      ? instructorCourses.reduce((acc, c) => acc + c.rating, 0) / instructorCourses.length
      : 0
    const completionRate = allEnrollments.length > 0
      ? (allEnrollments.filter((e) => e.completedAt !== null).length / allEnrollments.length) * 100
      : 0
    const publishedCourses = instructorCourses.filter((c) => c.isPublished && !c.isArchived).length

    // Previous period metrics
    const prevEnrollments = allEnrollments.filter((e) => {
      if (!prevStartDate || !startDate) return false
      const d = new Date(e.enrolledAt)
      return d >= prevStartDate && d < startDate
    })
    const prevStudentSet = new Set(prevEnrollments.map((e) => e.userId))
    const prevTotalStudents = prevStudentSet.size
    const prevTotalRevenue = instructorCourses.reduce((acc, c) => {
      const prevEnr = c.enrollments.filter((e) => {
        if (!prevStartDate || !startDate) return false
        const d = new Date(e.enrolledAt)
        return d >= prevStartDate && d < startDate
      })
      return acc + c.price * prevEnr.length
    }, 0)

    // Engagement metrics
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const recentActivities = await db.dailyActivity.findMany({
      where: {
        userId: { in: Array.from(studentSet) },
        date: { gte: sevenDaysAgo.toISOString().split('T')[0] },
      },
      select: { userId: true },
    })
    const activeStudents = new Set(recentActivities.map((a) => a.userId)).size

    // Returning students
    const studentEnrollCount = new Map<string, number>()
    for (const e of allEnrollments) {
      studentEnrollCount.set(e.userId, (studentEnrollCount.get(e.userId) || 0) + 1)
    }
    const returningStudents = Array.from(studentEnrollCount.values()).filter((c) => c > 1).length

    // Quiz metrics
    const quizAttempts = await db.quizAttempt.findMany({
      where: {
        quiz: { course: { instructorId } },
        completedAt: { not: null, ...(startDate ? { gte: startDate } : {}) },
      },
      select: { passed: true, percentage: true },
    })
    const quizPassRate = quizAttempts.length > 0
      ? (quizAttempts.filter((a) => a.passed).length / quizAttempts.length) * 100
      : 0

    // Reviews
    const allReviews = instructorCourses.flatMap((c) => c.reviews)
    const positiveReviews = allReviews.filter((r) => r.rating >= 4).length
    const negativeReviews = allReviews.filter((r) => r.rating <= 2).length

    // Live sessions
    const liveSessionCount = await db.liveSession.count({ where: { instructorId } })

    // Build the data summary for the LLM
    const dataSummary = `
Instructor: ${instructor.name}
Period: ${period}
Total Courses: ${instructorCourses.length} (Published: ${publishedCourses})
Total Students: ${totalStudents} (Previous: ${prevTotalStudents})
Total Revenue: $${totalRevenue.toLocaleString()} (Previous: $${prevTotalRevenue.toLocaleString()})
Average Rating: ${avgRating.toFixed(1)}/5
Completion Rate: ${completionRate.toFixed(1)}%
Active Students (7d): ${activeStudents}
Returning Students: ${returningStudents}
Quiz Pass Rate: ${quizPassRate.toFixed(1)}%
Total Reviews: ${allReviews.length} (Positive: ${positiveReviews}, Negative: ${negativeReviews})
Live Sessions: ${liveSessionCount}

Course Breakdown:
${instructorCourses.map((c) => `- "${c.title}": ${c.enrollments.length} students, $${c.price} price, ${c.rating}/5 rating, ${c.enrollments.filter((e) => e.completedAt !== null).length} completed`).join('\n')}

Recent Reviews:
${allReviews.slice(0, 5).map((r) => `- Rating: ${r.rating}/5${r.content ? `, Comment: "${r.content.substring(0, 100)}"` : ''}`).join('\n')}
`.trim()

    const systemPrompt = `You are an expert educational analytics consultant for the ShijlAI Academy platform. You analyze instructor data and provide structured, actionable insights about their teaching performance, student engagement, and revenue. You focus on international education contexts (IB, AP, Cambridge, etc.).

You MUST respond with a valid JSON object with this exact structure:
{
  "insights": [
    {
      "type": "opportunity" | "warning" | "achievement" | "suggestion",
      "title": "Short insight title (5-8 words)",
      "description": "Detailed explanation of the insight (1-2 sentences)",
      "metric": "The key metric name (e.g., 'completionRate', 'revenue', 'avgRating')",
      "value": "The metric value as a string (e.g., '78%', '$15,000', '4.2/5')",
      "icon": "An emoji icon representing the insight type"
    }
  ],
  "summary": "A 2-3 sentence overall assessment of the instructor's performance",
  "recommendations": ["3-5 specific, actionable recommendations for improvement"]
}

Generate 4-8 insights covering different aspects (achievements, warnings, opportunities, suggestions). Be specific and data-driven. Use the actual numbers provided.`

    const userPrompt = `Analyze this instructor's analytics data and generate structured insights:\n\n${dataSummary}`

    let parsedResponse: any = null
    try {
      parsedResponse = await AIService.generateJSON<any>({
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        complexity: 'fast',
        feature: 'instructor_analytics_insights',
        userId: instructorId,
      })
    } catch (err) {
      console.error('Failed to generate analytics insights JSON:', err)
    }

    if (!parsedResponse) {
      // Fallback if AI doesn't return valid JSON
      parsedResponse = {
        insights: [
          {
            type: 'achievement' as const,
            title: `${totalStudents} Students Enrolled`,
            description: `You have ${totalStudents} students across ${publishedCourses} published courses.`,
            metric: 'totalStudents',
            value: `${totalStudents}`,
            icon: '🎓',
          },
          {
            type: 'suggestion' as const,
            title: 'Review Your Course Performance',
            description: 'Check your analytics dashboard for detailed performance metrics and student engagement data.',
            metric: 'engagement',
            value: `${activeStudents} active`,
            icon: '💡',
          },
        ],
        summary: `You have ${totalStudents} students and ${publishedCourses} published courses. ${activeStudents} students were active in the last 7 days with a ${completionRate.toFixed(0)}% completion rate.`,
        recommendations: [
          'Review courses with low completion rates for content improvements',
          'Engage with inactive students through announcements',
          'Consider creating additional content for high-demand topics',
        ],
      }
    }

    // Validate and normalize the response
    const insights = (parsedResponse.insights || []).map(
      (ins: { type?: string; title?: string; description?: string; metric?: string; value?: string; icon?: string }) => ({
        type: ['opportunity', 'warning', 'achievement', 'suggestion'].includes(ins.type || '')
          ? ins.type
          : 'suggestion',
        title: ins.title || 'Insight',
        description: ins.description || '',
        metric: ins.metric || 'general',
        value: ins.value || 'N/A',
        icon: ins.icon || '📊',
      })
    )

    const summary = parsedResponse.summary || 'Analytics data processed successfully.'
    const recommendations = Array.isArray(parsedResponse.recommendations)
      ? parsedResponse.recommendations.slice(0, 5)
      : ['Review your analytics dashboard for detailed insights']

    return NextResponse.json({
      insights,
      summary,
      recommendations,
    })
  } catch (error) {
    console.error('Error generating AI insights:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}

