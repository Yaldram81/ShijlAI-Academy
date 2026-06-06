import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/instructor/ai/auto-respond - Draft AI answers to student questions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, context } = body

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const systemPrompt =
      'You are an expert instructor who drafts clear, educational answers for students. ' +
      'Your answers should be accurate, well-structured, and easy to understand. ' +
      'Use examples and step-by-step explanations when helpful. ' +
      'Adapt your tone to be encouraging and supportive while maintaining academic rigor.\n\n' +
      'IMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no extra text. ' +
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
      '"relatedTopics" should list 2-4 topics the student might want to explore next. ' +
      'Return ONLY valid JSON with no markdown code fences.'

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: context
            ? `Course context: ${context}\n\nStudent question: ${question}`
            : `Student question: ${question}`,
        },
      ],
      thinking: { type: 'disabled' },
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      return NextResponse.json(
        { error: 'AI did not generate a response. Please try again.' },
        { status: 422 }
      )
    }

    // Try to parse the AI response as JSON
    try {
      // Strip markdown code fences if present
      let cleaned = response.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned
          .replace(/^```(?:json)?\s*\n?/, '')
          .replace(/\n?```\s*$/, '')
      }

      const parsed = JSON.parse(cleaned)

      return NextResponse.json({
        content: response, // raw text fallback
        answer: parsed, // structured JSON
      })
    } catch {
      // JSON parsing failed — return raw content as answer
    }

    // Fallback: return raw content for the frontend to handle
    return NextResponse.json({ content: response, answer: response })
  } catch (error) {
    console.error('Error drafting auto-respond answer:', error)
    return NextResponse.json(
      { error: 'Failed to draft answer' },
      { status: 500 }
    )
  }
}
