import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AIService } from '@/services/ai'

// POST /api/ai/shijlai/quiz-generator
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instructorId, courseId, moduleId, topic, difficulty = 'medium', questionCount = 5, questionTypes = ['mcq'] } = body

    if (!instructorId || !topic) {
      return NextResponse.json({ error: 'instructorId and topic are required' }, { status: 400 })
    }

    // Get course context if provided
    let courseContext = ''
    if (courseId) {
      const course = await db.course.findUnique({
        where: { id: courseId },
        include: { modules: { include: { lessons: true } } },
      })
      if (course) {
        courseContext = `\nCourse: ${course.title} (${course.category}, ${course.level})\nModules: ${course.modules.map(m => m.title).join(', ')}`
        if (moduleId) {
          const courseModule = course.modules.find(m => m.id === moduleId)
          if (courseModule) {
            courseContext += `\nModule: ${courseModule.title}\nLessons: ${courseModule.lessons.map(l => l.title).join(', ')}`
          }
        }
      }
    }

    const typesStr = Array.isArray(questionTypes) ? questionTypes.join(', ') : questionTypes

    // Call AIService using generateJSON
    let questions: Array<Record<string, unknown>> = []
    try {
      questions = await AIService.generateJSON<Array<Record<string, unknown>>>({
        systemPrompt: `You are a quiz generation engine for ShijlAI Academy. Generate quiz questions in the specified format. Each question should have: type (one of: ${typesStr}), text, options (for mcq: array of 4 strings), correctAnswer, explanation, points (1-5). Return as a JSON array of question objects.`,
        messages: [
          {
            role: 'user',
            content: `Generate ${questionCount} ${difficulty} difficulty quiz questions about "${topic}".${courseContext}\nQuestion types: ${typesStr}\nReturn only the JSON array.`,
          },
        ],
        complexity: 'fast',
        feature: 'quiz_generator',
        userId: instructorId,
        courseId: courseId || undefined,
      })
    } catch (err) {
      console.error('Failed to generate quiz questions JSON:', err)
    }

    // Save generation record
    const generation = await db.aIQuizGeneration.create({
      data: {
        instructorId,
        courseId: courseId || null,
        moduleId: moduleId || null,
        topic,
        difficulty,
        questionCount,
        questionTypes: JSON.stringify(questionTypes),
        generatedContent: JSON.stringify(questions),
      },
    })

    return NextResponse.json({
      questions,
      generationId: generation.id,
    })
  } catch (error) {
    console.error('[ShijlAI Quiz Generator] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
