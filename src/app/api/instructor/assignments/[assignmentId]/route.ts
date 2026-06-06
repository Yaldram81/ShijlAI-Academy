import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to safely parse JSON
function safeJsonParse(str: string | null | undefined, fallback: unknown = null): unknown {
  if (!str) return fallback
  try { return JSON.parse(str) } catch { return fallback }
}

// GET /api/instructor/assignments/[assignmentId] - Get single assignment with stats & submissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const includeSubmissions = searchParams.get('includeSubmissions') === 'true'
    const submissionStatus = searchParams.get('submissionStatus') // pending, graded, all

    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
            enrollments: {
              select: { id: true, userId: true },
            },
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Verify ownership via course
    if (!instructorId || assignment.course.instructorId !== instructorId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Get module data separately if moduleId exists
    let moduleData = null
    if (assignment.moduleId) {
      const mod = await db.module.findUnique({
        where: { id: assignment.moduleId },
        select: { id: true, title: true },
      })
      if (mod) {
        moduleData = { id: mod.id, title: mod.title }
      }
    }

    // Get all submissions for this assignment
    const allSubmissions = await db.submission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: { id: true, name: true, avatar: true, email: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    })

    // Calculate stats
    const totalEnrolled = assignment.course.enrollments.length
    const totalSubmitted = allSubmissions.length
    const pendingSubmissions = allSubmissions.filter(s => s.status === 'submitted' || s.status === 'grading')
    const gradedSubmissions = allSubmissions.filter(s => s.status === 'graded' || s.status === 'returned')
    const lateSubmissions = allSubmissions.filter(s =>
      assignment.dueDate && new Date(s.submittedAt) > new Date(assignment.dueDate)
    )

    const gradedScores = gradedSubmissions.map(s => s.score || 0).filter(s => s > 0)
    const avgScore = gradedScores.length > 0
      ? Math.round(gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length)
      : 0
    const highestScore = gradedScores.length > 0 ? Math.max(...gradedScores) : 0
    const lowestScore = gradedScores.length > 0 ? Math.min(...gradedScores) : 0
    const passRate = gradedScores.length > 0
      ? Math.round((gradedScores.filter(s => (s / assignment.maxScore) * 100 >= 50).length / gradedScores.length) * 100)
      : 0

    // Score distribution
    const scoreDistribution = {
      excellent: gradedScores.filter(s => (s / assignment.maxScore) * 100 >= 90).length,
      good: gradedScores.filter(s => { const p = (s / assignment.maxScore) * 100; return p >= 70 && p < 90 }).length,
      average: gradedScores.filter(s => { const p = (s / assignment.maxScore) * 100; return p >= 50 && p < 70 }).length,
      belowAverage: gradedScores.filter(s => { const p = (s / assignment.maxScore) * 100; return p >= 30 && p < 50 }).length,
      failing: gradedScores.filter(s => (s / assignment.maxScore) * 100 < 30).length,
    }

    // Build formatted submissions if requested
    let formattedSubmissions: unknown[] = []
    if (includeSubmissions) {
      let filteredSubs = [...allSubmissions]
      if (submissionStatus === 'pending') {
        filteredSubs = pendingSubmissions
      } else if (submissionStatus === 'graded') {
        filteredSubs = gradedSubmissions
      }

      const rubricData = safeJsonParse(assignment.rubric, []) as Array<{ criteria?: string; criterion?: string; description: string; maxPoints: number }>

      formattedSubmissions = filteredSubs.map(sub => {
        const rubricScores = safeJsonParse(sub.rubricScores, {}) as Record<string, number>
        const aiPreGrade = safeJsonParse(sub.aiPreGrade, null) as { checks?: unknown[]; suggestedScore?: number } | null

        const now = new Date()
        const submittedDate = new Date(sub.submittedAt)
        const diffMs = now.getTime() - submittedDate.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHrs = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)
        let timeAgo = 'Just now'
        if (diffDays > 0) timeAgo = `${diffDays}d ago`
        else if (diffHrs > 0) timeAgo = `${diffHrs}h ago`
        else if (diffMins > 0) timeAgo = `${diffMins}m ago`

        const isOverdue = assignment.dueDate ? new Date(sub.submittedAt) > new Date(assignment.dueDate) : false

        const rubric = rubricData.map((r: { criteria?: string; criterion?: string; description: string; maxPoints: number }) => ({
          criterion: r.criteria || r.criterion || 'Criterion',
          description: r.description || '',
          maxPoints: r.maxPoints || 0,
        }))

        const scores = rubric.map((r: { criterion: string; maxPoints: number }, i: number) => {
          return rubricScores[i] || rubricScores[r.criterion] || 0
        })

        const fileUrls = safeJsonParse(sub.fileUrls, []) as Array<{ name?: string; size?: string }>
        const fileName = fileUrls.length > 0 ? fileUrls[0].name || sub.content : sub.content

        return {
          id: sub.id,
          content: sub.content,
          fileUrls: safeJsonParse(sub.fileUrls, []),
          studentName: sub.student.name,
          studentAvatar: sub.student.avatar,
          studentEmail: sub.student.email,
          studentId: sub.student.id,
          submittedAt: sub.submittedAt.toISOString(),
          timeAgo,
          isOverdue,
          fileName: fileName || 'submission.txt',
          status: (sub.status === 'submitted' || sub.status === 'grading' ? 'pending' : 'graded') as 'pending' | 'graded',
          aiPreGrade: aiPreGrade ? {
            checks: aiPreGrade.checks || [],
            suggestedScore: aiPreGrade.suggestedScore || 0,
            maxScore: assignment.maxScore,
          } : undefined,
          rubric,
          maxScore: assignment.maxScore,
          scores: scores.length > 0 ? scores : rubric.map(() => 0),
          totalScore: sub.score || scores.reduce((a: number, b: number) => a + b, 0),
          feedback: sub.feedback || '',
          gradedAt: sub.gradedAt?.toISOString(),
          gradedBy: sub.gradedBy ? 'You' : undefined,
          attempt: sub.attempt,
          timeSpent: sub.timeSpent,
        }
      })
    }

    // Students who haven't submitted
    const notSubmittedCount = totalEnrolled - totalSubmitted

    // Parse rubric and resources
    const parsedRubric = safeJsonParse(assignment.rubric, null)
    const parsedResources = safeJsonParse(assignment.resources, null)

    const result = {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions,
      type: assignment.type,
      submissionType: assignment.submissionType,
      maxScore: assignment.maxScore,
      dueDate: assignment.dueDate?.toISOString() || null,
      wordLimit: assignment.wordLimit,
      isPublished: assignment.isPublished,
      order: assignment.order,
      rubric: parsedRubric,
      resources: parsedResources,
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
      course: {
        id: assignment.course.id,
        title: assignment.course.title,
        instructorId: assignment.course.instructorId,
      },
      module: moduleData,
      stats: {
        totalEnrolled,
        totalSubmitted,
        pendingCount: pendingSubmissions.length,
        gradedCount: gradedSubmissions.length,
        lateCount: lateSubmissions.length,
        notSubmittedCount,
        avgScore,
        highestScore,
        lowestScore,
        passRate,
        submissionRate: totalEnrolled > 0 ? Math.round((totalSubmitted / totalEnrolled) * 100) : 0,
        scoreDistribution,
      },
      submissions: includeSubmissions ? formattedSubmissions : undefined,
    }

    return NextResponse.json({ assignment: result })
  } catch (error) {
    console.error('Error fetching assignment:', error)
    return NextResponse.json({ error: 'Failed to fetch assignment' }, { status: 500 })
  }
}

// PATCH /api/instructor/assignments/[assignmentId] - Update assignment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId') || body.instructorId

    const existing = await db.assignment.findUnique({ where: { id: assignmentId } })
    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Always verify instructor owns this assignment's course (derive from course ownership)
    const course = await db.course.findFirst({
      where: { id: existing.courseId, instructorId: instructorId || undefined },
    })
    if (!course || !instructorId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'title', 'description', 'instructions', 'type', 'moduleId', 'maxScore',
      'dueDate', 'rubric', 'resources', 'submissionType', 'wordLimit',
      'isPublished', 'order',
    ]
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'dueDate' && body[field]) {
          updateData[field] = new Date(body[field])
        } else if ((field === 'rubric' || field === 'resources') && body[field]) {
          updateData[field] = typeof body[field] === 'string' ? body[field] : JSON.stringify(body[field])
        } else {
          updateData[field] = body[field]
        }
      }
    }

    const assignment = await db.assignment.update({
      where: { id: assignmentId },
      data: updateData,
      include: {
        course: { select: { id: true, title: true } },
      },
    })

    return NextResponse.json({ assignment, message: 'Assignment updated successfully' })
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
  }
}

// DELETE /api/instructor/assignments/[assignmentId] - Delete assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    const existing = await db.assignment.findUnique({ where: { id: assignmentId } })
    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Verify ownership via course
    const course = await db.course.findFirst({
      where: { id: existing.courseId, instructorId: instructorId || undefined },
    })
    if (!course || !instructorId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Delete all related submissions first
    await db.submission.deleteMany({ where: { assignmentId } })
    await db.assignment.delete({ where: { id: assignmentId } })

    return NextResponse.json({ message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
  }
}
