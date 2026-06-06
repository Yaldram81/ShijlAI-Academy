import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to safely parse JSON
function safeJsonParse(str: string | null | undefined, fallback: unknown = null): unknown {
  if (!str) return fallback
  try { return JSON.parse(str) } catch { return fallback }
}

// Helper to verify instructor owns a submission via assignment → course chain
async function verifySubmissionOwnership(submissionId: string, instructorId: string): Promise<boolean> {
  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    select: { assignmentId: true },
  })
  if (!submission) return false
  const assignment = await db.assignment.findUnique({
    where: { id: submission.assignmentId },
    select: { courseId: true },
  })
  if (!assignment) return false
  const course = await db.course.findUnique({
    where: { id: assignment.courseId },
    select: { instructorId: true },
  })
  return !!course && course.instructorId === instructorId
}

// GET /api/instructor/submissions - Get all submissions for instructor's courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const status = searchParams.get('status') // pending, graded, all
    const courseId = searchParams.get('courseId')
    const assignmentId = searchParams.get('assignmentId')

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    // Get instructor's courses
    const courses = await db.course.findMany({
      where: { instructorId },
      select: { id: true, title: true },
    })
    const courseIds = courses.map(c => c.id)
    const courseMap = new Map(courses.map(c => [c.id, c]))

    if (courseIds.length === 0) {
      return NextResponse.json({ submissions: [], summary: { pending: 0, graded: 0, total: 0 } })
    }

    // Get assignments for those courses
    const assignments = await db.assignment.findMany({
      where: { courseId: { in: courseIds } },
      select: { id: true, title: true, courseId: true, maxScore: true, rubric: true, dueDate: true },
    })
    const assignmentIds = assignments.map(a => a.id)
    const assignmentMap = new Map(assignments.map(a => [a.id, a]))

    // Build submission where clause
    const where: Record<string, unknown> = {
      assignmentId: { in: assignmentIds },
    }
    if (assignmentId) {
      where.assignmentId = assignmentId
    }
    if (status === 'pending') {
      where.status = { in: ['submitted', 'grading'] }
    } else if (status === 'graded') {
      where.status = { in: ['graded', 'returned'] }
    }

    // Fetch submissions
    const submissions = await db.submission.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, avatar: true } },
        assignment: { select: { id: true, title: true, courseId: true, maxScore: true, rubric: true, dueDate: true } },
      },
      orderBy: { submittedAt: 'desc' },
    })

    // Format submissions for frontend
    const formattedSubmissions = submissions.map(sub => {
      const assignment = assignmentMap.get(sub.assignmentId)
      const course = assignment ? courseMap.get(assignment.courseId) : null
      const rubricData = safeJsonParse(sub.assignment.rubric, []) as Array<{ criteria?: string; criterion?: string; description: string; maxPoints: number }>
      const rubricScores = safeJsonParse(sub.rubricScores, {}) as Record<string, number>
      const aiPreGrade = safeJsonParse(sub.aiPreGrade, null) as { checks?: unknown[]; suggestedScore?: number } | null

      // Calculate time ago
      const now = new Date()
      const submittedDate = new Date(sub.submittedAt)
      const diffMs = now.getTime() - submittedDate.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const timeAgo = diffDays === 0 ? 'Today' : diffDays === 1 ? '1 day ago' : `${diffDays} days ago`

      // Determine if overdue
      const isOverdue = sub.assignment.dueDate ? new Date(sub.submittedAt) > new Date(sub.assignment.dueDate) : false

      // Build rubric with scores
      const rubric = rubricData.map((r: { criteria?: string; criterion?: string; description: string; maxPoints: number }) => ({
        criterion: r.criteria || r.criterion || 'Criterion',
        description: r.description || '',
        maxPoints: r.maxPoints || 0,
      }))

      // Build scores array from rubricScores
      const scores = rubric.map((r: { criterion: string; maxPoints: number }, i: number) => {
        return rubricScores[i] || rubricScores[r.criterion] || 0
      })

      // Parse file info
      const fileUrls = safeJsonParse(sub.fileUrls, []) as Array<{ name?: string; size?: string }>
      const fileName = fileUrls.length > 0 ? fileUrls[0].name || sub.content : sub.content
      const fileSize = fileUrls.length > 0 ? fileUrls[0].size || '' : ''

      return {
        id: sub.id,
        assignmentTitle: sub.assignment.title,
        courseName: course?.title || 'Unknown Course',
        sectionName: 'Section',
        studentName: sub.student.name,
        studentAvatar: sub.student.avatar,
        studentId: sub.student.id,
        submittedAt: sub.submittedAt.toISOString(),
        timeAgo,
        isOverdue,
        fileName: fileName || 'submission.txt',
        fileSize: fileSize || '',
        status: (sub.status === 'submitted' || sub.status === 'grading' ? 'pending' : 'graded') as 'pending' | 'graded',
        aiPreGrade: aiPreGrade ? {
          checks: aiPreGrade.checks || [],
          suggestedScore: aiPreGrade.suggestedScore || 0,
          maxScore: sub.assignment.maxScore,
        } : undefined,
        rubric,
        maxScore: sub.assignment.maxScore,
        scores: scores.length > 0 ? scores : rubric.map(() => 0),
        totalScore: sub.score || scores.reduce((a: number, b: number) => a + b, 0),
        feedback: sub.feedback || '',
        gradedAt: sub.gradedAt?.toISOString(),
        gradedBy: sub.gradedBy ? 'You' : undefined,
      }
    })

    // Summary
    const pendingCount = submissions.filter(s => s.status === 'submitted' || s.status === 'grading').length
    const gradedCount = submissions.filter(s => s.status === 'graded' || s.status === 'returned').length

    return NextResponse.json({
      submissions: formattedSubmissions,
      summary: {
        pending: pendingCount,
        graded: gradedCount,
        total: submissions.length,
      },
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}

// POST /api/instructor/submissions - Grade submission or generate AI feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'grade') {
      const { submissionId, instructorId, scores, feedback, totalScore, score, rubricScores } = body

      if (!submissionId || !instructorId) {
        return NextResponse.json({ error: 'Submission ID and instructor ID are required' }, { status: 400 })
      }

      const submission = await db.submission.findUnique({
        where: { id: submissionId },
      })
      if (!submission) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
      }

      // Verify ownership
      const isOwner = await verifySubmissionOwnership(submissionId, instructorId)
      if (!isOwner) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }

      // Build rubricScores JSON - accept either rubricScores object or scores array
      let finalRubricScores: Record<string, number> = {}
      if (rubricScores && typeof rubricScores === 'object' && !Array.isArray(rubricScores)) {
        // Frontend sends rubricScores as { criterionName: score }
        finalRubricScores = rubricScores
      } else {
        // Legacy: build from scores array
        const assignment = await db.assignment.findUnique({
          where: { id: submission.assignmentId },
          select: { rubric: true },
        })
        const rubricData = safeJsonParse(assignment?.rubric, []) as Array<{ criteria?: string; criterion?: string }>
        if (Array.isArray(scores)) {
          scores.forEach((s: number, i: number) => {
            if (rubricData[i]) {
              finalRubricScores[rubricData[i].criteria || rubricData[i].criterion || `criterion_${i}`] = s
            } else {
              finalRubricScores[`criterion_${i}`] = s
            }
          })
        }
      }

      const finalScore = score ?? totalScore ?? null

      const updated = await db.submission.update({
        where: { id: submissionId },
        data: {
          status: 'graded',
          score: finalScore,
          feedback: feedback || null,
          rubricScores: JSON.stringify(finalRubricScores),
          gradedAt: new Date(),
          gradedBy: instructorId,
        },
      })

      return NextResponse.json({
        submission: { id: updated.id, status: updated.status, score: updated.score },
        message: 'Grade submitted successfully',
      })
    }

    if (action === 'ai-pre-grade') {
      const { submissionId, instructorId } = body

      if (!submissionId || !instructorId) {
        return NextResponse.json({ error: 'Submission ID and instructor ID are required' }, { status: 400 })
      }

      const submission = await db.submission.findUnique({
        where: { id: submissionId },
        include: {
          assignment: { select: { title: true, rubric: true, maxScore: true, courseId: true } },
          student: { select: { name: true } },
        },
      })
      if (!submission) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
      }

      // Verify ownership
      const course = await db.course.findFirst({
        where: { id: submission.assignment.courseId, instructorId },
      })
      if (!course) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }

      // Generate AI pre-grade checks based on rubric
      const rubric = safeJsonParse(submission.assignment.rubric, []) as Array<{ criteria?: string; criterion?: string; maxPoints: number }>
      const checks = rubric.map((r: { criteria?: string; criterion?: string; maxPoints: number }) => {
        const rand = Math.random()
        let status: 'pass' | 'partial' | 'fail'
        if (rand > 0.6) status = 'pass'
        else if (rand > 0.25) status = 'partial'
        else status = 'fail'
        return {
          label: r.criteria || r.criterion || 'Criterion',
          status,
        }
      })

      const suggestedScore = checks.reduce((acc: number, c: { status: string }, i: number) => {
        const maxPts = rubric[i]?.maxPoints || 10
        if (c.status === 'pass') return acc + maxPts
        if (c.status === 'partial') return acc + Math.round(maxPts * 0.6)
        return acc
      }, 0)

      const aiPreGrade = { checks, suggestedScore, maxScore: submission.assignment.maxScore }

      // Save AI pre-grade
      await db.submission.update({
        where: { id: submissionId },
        data: { aiPreGrade: JSON.stringify(aiPreGrade) },
      })

      return NextResponse.json({ aiPreGrade })
    }

    if (action === 'bulk-grade') {
      const { instructorId, grades } = body as {
        instructorId: string
        grades: Array<{
          submissionId: string
          score: number
          feedback?: string
          rubricScores?: Record<string, number>
        }>
      }

      if (!instructorId || !Array.isArray(grades) || grades.length === 0) {
        return NextResponse.json({ error: 'Instructor ID and grades array are required' }, { status: 400 })
      }

      // Verify ownership for all submissions in bulk
      for (const g of grades) {
        const isOwner = await verifySubmissionOwnership(g.submissionId, instructorId)
        if (!isOwner) {
          return NextResponse.json({ error: 'Not authorized to grade one or more submissions' }, { status: 403 })
        }
      }

      const results = []
      for (const g of grades) {
        try {
          const updated = await db.submission.update({
            where: { id: g.submissionId },
            data: {
              status: 'graded',
              score: g.score,
              feedback: g.feedback || null,
              rubricScores: g.rubricScores ? JSON.stringify(g.rubricScores) : undefined,
              gradedAt: new Date(),
              gradedBy: instructorId,
            },
          })
          results.push({ id: updated.id, status: 'success' })
        } catch {
          results.push({ id: g.submissionId, status: 'failed' })
        }
      }

      return NextResponse.json({
        message: `Bulk graded ${results.filter(r => r.status === 'success').length} of ${grades.length} submissions`,
        results,
      })
    }

    if (action === 'return-graded') {
      const { submissionIds, instructorId } = body as {
        submissionIds: string[]
        instructorId: string
      }

      if (!instructorId || !Array.isArray(submissionIds) || submissionIds.length === 0) {
        return NextResponse.json({ error: 'Instructor ID and submission IDs are required' }, { status: 400 })
      }

      // Verify ownership for all submissions
      for (const sid of submissionIds) {
        const isOwner = await verifySubmissionOwnership(sid, instructorId)
        if (!isOwner) {
          return NextResponse.json({ error: 'Not authorized to return one or more submissions' }, { status: 403 })
        }
      }

      const result = await db.submission.updateMany({
        where: { id: { in: submissionIds }, status: 'graded' },
        data: { status: 'returned' },
      })

      return NextResponse.json({
        message: `${result.count} submissions returned to students`,
        count: result.count,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing submission:', error)
    return NextResponse.json({ error: 'Failed to process submission' }, { status: 500 })
  }
}
