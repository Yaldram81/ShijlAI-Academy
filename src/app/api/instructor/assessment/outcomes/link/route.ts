import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/instructor/assessment/outcomes/link
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { questionId, outcomeId } = body

    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 })
    }
    if (!outcomeId) {
      return NextResponse.json({ error: 'outcomeId is required' }, { status: 400 })
    }

    // Verify question exists
    const question = await db.question.findUnique({ where: { id: questionId } })
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Verify outcome exists
    const outcome = await db.learningOutcome.findUnique({ where: { id: outcomeId } })
    if (!outcome) {
      return NextResponse.json({ error: 'Outcome not found' }, { status: 404 })
    }

    // Check if link already exists
    const existingLink = await db.questionOutcome.findUnique({
      where: {
        questionId_outcomeId: { questionId, outcomeId },
      },
    })

    if (existingLink) {
      return NextResponse.json({ success: true, message: 'Link already exists' })
    }

    // Create the link
    await db.questionOutcome.create({
      data: {
        questionId,
        outcomeId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error linking outcome:', error)
    return NextResponse.json({ error: 'Failed to link outcome to question' }, { status: 500 })
  }
}
