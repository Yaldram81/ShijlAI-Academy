import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/instructor/ai/generate-quiz - Generate quiz questions using AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, count, difficulty, questionTypes, moduleId, courseId } = body

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const questionCount = Math.min(Math.max(count || 5, 1), 20)
    const difficultyLevel = difficulty || 'medium'
    const types = questionTypes || ['mcq', 'true_false', 'fill_blank']

    const sdk = await ZAI.create()

    const prompt = `Generate ${questionCount} quiz questions about "${topic}" at ${difficultyLevel} difficulty level.

Use these question types: ${types.join(', ')}

Available question types:
- mcq: Multiple choice question with 4 options
- true_false: True or false question
- fill_blank: Fill in the blank question
- short_answer: Short answer question

Return ONLY a valid JSON array of objects with this exact structure:
[
  {
    "text": "The question text",
    "type": "mcq|true_false|fill_blank|short_answer",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "The correct answer",
    "explanation": "Why this is the correct answer",
    "points": 1
  }
]

Rules:
- For mcq: provide exactly 4 options in the options array
- For true_false: options should be ["True", "False"]
- For fill_blank: use "___" in the text where the blank goes, options can be empty array
- For short_answer: options can be empty array, correctAnswer should be a sample answer
- Make questions educationally sound and accurate
- Points should be 1-5 based on question complexity
- Distribute question types evenly if multiple types are requested

Generate the questions now:`

    const response = await sdk.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'default',
    })

    // Parse the AI response to extract questions
    const content = response.choices?.[0]?.message?.content || ''
    
    // Try to extract JSON from the response
    let questions = []
    try {
      // First try direct parse
      questions = JSON.parse(content)
    } catch {
      // Try to extract JSON from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[1])
      } else {
        // Try to find array in the response
        const arrayMatch = content.match(/\[[\s\S]*\]/)
        if (arrayMatch) {
          questions = JSON.parse(arrayMatch[0])
        }
      }
    }

    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'AI generated an invalid response format. Please try again.' },
        { status: 422 }
      )
    }

    // Validate and normalize questions
    const validatedQuestions = questions.map((q: Record<string, unknown>, index: number) => ({
      text: String(q.text || ''),
      type: types.includes(q.type as string) ? q.type : 'mcq',
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: String(q.correctAnswer || ''),
      explanation: q.explanation ? String(q.explanation) : null,
      points: typeof q.points === 'number' ? Math.min(Math.max(q.points, 1), 5) : 1,
      order: index,
    })).filter((q) => q.text && q.correctAnswer)

    return NextResponse.json({
      questions: validatedQuestions,
      meta: {
        topic,
        count: validatedQuestions.length,
        difficulty: difficultyLevel,
        questionTypes: types,
        moduleId: moduleId || null,
        courseId: courseId || null,
      },
    })
  } catch (error) {
    console.error('Error generating quiz:', error)
    return NextResponse.json({ error: 'Failed to generate quiz questions' }, { status: 500 })
  }
}
