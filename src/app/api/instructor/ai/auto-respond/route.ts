import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/services/ai'

// POST /api/instructor/ai/auto-respond - Draft AI answers to student questions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, context, moduleId, courseId } = body

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    const systemPrompt =
      'You are an expert instructor who drafts clear, educational answers for students. ' +
      'Your answers should be accurate, well-structured, and easy to understand. ' +
      'Use examples and step-by-step explanations when helpful. ' +
      'Adapt your tone to be encouraging and supportive while maintaining academic rigor.\n\n' +
      'IMPORTANT: You MUST respond with valid JSON only. ' +
      'The JSON must follow this exact structure:\n' +
      '{\n' +
      '  "answer": "The full answer text",\n' +
      '  "keyPoints": ["Key point 1", "Key point 2"],\n' +
      '  "relatedTopics": ["Related topic 1", "Related topic 2"],\n' +
      '  "confidence": "high|medium|low"\n' +
      '}\n\n' +
      'The "confidence" field must be exactly one of: "high", "medium", or "low", ' +
      'reflecting how confident you are in the accuracy of the answer. ' +
      '"keyPoints" should contain 2-5 concise takeaways. ' +
      '"relatedTopics" should list 2-4 topics the student might want to explore next.'

    const userPrompt = context
      ? `Course context: ${context}\n\nStudent question: ${question}`
      : `Student question: ${question}`

    let answerObj: any = null
    try {
      answerObj = await AIService.generateJSON<any>({
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        complexity: 'fast',
        feature: 'auto_respond',
        userId: moduleId || courseId,
        courseId: courseId || undefined,
      })
    } catch (err) {
      console.error('Failed to generate auto-respond JSON:', err)
    }

    if (!answerObj || !answerObj.answer) {
      return NextResponse.json(
        { error: 'AI did not generate a valid response. Please try again.' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      content: JSON.stringify(answerObj),
      answer: answerObj,
    })
  } catch (error) {
    console.error('Error drafting auto-respond answer:', error)
    return NextResponse.json(
      { error: 'Failed to draft answer' },
      { status: 500 }
    )
  }
}

