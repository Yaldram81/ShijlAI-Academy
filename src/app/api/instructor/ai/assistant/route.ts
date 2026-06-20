import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/services/ai'

const SYSTEM_PROMPT = `You are a helpful AI assistant for course instructors on the ShijlAI Academy platform. Your role is to support instructors with:

- **Course Management**: Creating, organizing, and maintaining courses, modules, and lessons effectively.
- **Student Engagement**: Strategies to keep students motivated, active, and participating in their learning journey.
- **Content Creation**: Designing high-quality educational content including lesson materials, quizzes, assignments, and multimedia resources.
- **Teaching Strategies**: Best practices for online and blended teaching, differentiated instruction, and assessment design.
- **Platform Features**: Guiding instructors on how to use ShijlAI Academy's tools and features to their fullest potential.
- **Analytics Interpretation**: Helping instructors understand student performance data, engagement metrics, and progress reports to make informed instructional decisions.

You are tailored to the international education context. You understand curricula such as IB (International Baccalaureate), AP (Advanced Placement), Cambridge (IGCSE, O-Level, A-Level), Common Core, and other international examination systems. You are familiar with subjects like Physics, Chemistry, Biology, Mathematics, English, Computer Science, and more as taught in schools and colleges worldwide.

Always provide clear, practical, and culturally inclusive advice. Use examples and references that resonate with a global education audience. Be professional, encouraging, and supportive of instructors' efforts to deliver quality education.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, history, moduleId, courseId } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'A valid "message" string is required.' },
        { status: 400 }
      )
    }

    const validatedHistory: { role: 'user' | 'assistant'; content: string }[] = Array.isArray(history)
      ? history
          .filter(
            (msg: any) =>
              msg &&
              (msg.role === 'user' || msg.role === 'assistant') &&
              typeof msg.content === 'string'
          )
          .slice(-20)
      : []

    const messages = [
      ...validatedHistory,
      { role: 'user' as const, content: message },
    ]

    let response = ''
    try {
      response = await AIService.chat({
        systemPrompt: SYSTEM_PROMPT,
        messages,
        complexity: 'fast',
        feature: 'instructor_assistant',
        userId: moduleId || courseId,
        courseId: courseId || undefined,
      })
    } catch (err) {
      console.error('[AI Assistant Error]', err)
    }

    return NextResponse.json({ content: response, response })
  } catch (error: any) {
    console.error('[AI Assistant Error]', error)
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred while processing your request.' },
      { status: 500 }
    )
  }
}

