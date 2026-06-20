import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/services/ai'

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

    let questions = []
    try {
      questions = await AIService.generateJSON<any[]>({
        systemPrompt: 'You are an educational quiz generator. Return only valid JSON arrays containing the quiz questions.',
        messages: [{ role: 'user', content: prompt }],
        complexity: 'fast',
        feature: 'quiz_generator',
        userId: moduleId || courseId, // use whatever context ID is available
        courseId: courseId || undefined,
      })
    } catch (err) {
      console.error('Failed to generate quiz questions JSON:', err)
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
