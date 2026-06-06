import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to safely parse JSON
function safeJsonParse(str: string | null | undefined, fallback: unknown = null): unknown {
  if (!str) return fallback
  try { return JSON.parse(str) } catch { return fallback }
}

// PATCH /api/instructor/submissions/[submissionId] - Save draft grading
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params
    const body = await request.json()
    const { instructorId, scores, feedback, rubricScores } = body

    if (!submissionId || !instructorId) {
      return NextResponse.json({ error: 'Submission ID and instructor ID are required' }, { status: 400 })
    }

    const submission = await db.submission.findUnique({
      where: { id: submissionId },
    })
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Verify ownership via assignment → course → instructorId
    const assignment = await db.assignment.findUnique({
      where: { id: submission.assignmentId },
      include: { course: { select: { instructorId: true } } },
    })
    if (!assignment || assignment.course.instructorId !== instructorId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Build rubricScores JSON from scores array if provided
    let rubricScoresJson = rubricScores
    if (Array.isArray(scores) && !rubricScores) {
      const assignment = await db.assignment.findUnique({
        where: { id: submission.assignmentId },
        select: { rubric: true },
      })
      const rubricData = safeJsonParse(assignment?.rubric, []) as Array<{ criteria?: string; criterion?: string }>
      const rs: Record<string, number> = {}
      scores.forEach((score: number, i: number) => {
        if (rubricData[i]) {
          rs[rubricData[i].criteria || rubricData[i].criterion || `criterion_${i}`] = score
        } else {
          rs[`criterion_${i}`] = score
        }
      })
      rubricScoresJson = JSON.stringify(rs)
    }

    const updated = await db.submission.update({
      where: { id: submissionId },
      data: {
        ...(feedback !== undefined && { feedback }),
        ...(rubricScoresJson && { rubricScores: typeof rubricScoresJson === 'string' ? rubricScoresJson : JSON.stringify(rubricScoresJson) }),
        status: 'grading', // Mark as in-progress grading
      },
    })

    return NextResponse.json({
      submission: { id: updated.id, status: updated.status },
      message: 'Draft saved successfully',
    })
  } catch (error) {
    console.error('Error saving draft:', error)
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
  }
}
