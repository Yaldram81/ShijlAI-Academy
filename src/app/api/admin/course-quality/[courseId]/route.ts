import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: Single Course Quality Analysis ───
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params

    const analysis = await db.courseQualityAnalysis.findUnique({
      where: { courseId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            thumbnail: true,
            enrollmentCount: true,
            rating: true,
            level: true,
            isPublished: true,
            instructor: { select: { id: true, name: true, avatar: true } },
            modules: {
              select: {
                id: true,
                title: true,
                order: true,
                lessons: {
                  select: {
                    id: true,
                    title: true,
                    type: true,
                    duration: true,
                    order: true,
                  },
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
            quizzes: {
              select: {
                id: true,
                title: true,
                type: true,
                passingScore: true,
                _count: { select: { questions: true, attempts: true } },
              },
            },
            assignments: {
              select: {
                id: true,
                title: true,
                type: true,
                maxScore: true,
              },
            },
          },
        },
      },
    })

    if (!analysis) {
      return NextResponse.json(
        { error: 'Course quality analysis not found. Run analysis first via POST /api/admin/course-quality' },
        { status: 404 }
      )
    }

    // Parse JSON fields
    const parsed = {
      ...analysis,
      strengths: analysis.strengths ? JSON.parse(analysis.strengths) : [],
      weaknesses: analysis.weaknesses ? JSON.parse(analysis.weaknesses) : [],
      recommendations: analysis.recommendations ? JSON.parse(analysis.recommendations) : [],
    }

    return NextResponse.json({ analysis: parsed })
  } catch (error) {
    console.error('[Course Quality API] GET single error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course quality analysis' },
      { status: 500 }
    )
  }
}
