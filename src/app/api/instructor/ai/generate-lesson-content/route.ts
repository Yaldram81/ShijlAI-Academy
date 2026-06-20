import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/services/ai'

// POST /api/instructor/ai/generate-lesson-content - Generate detailed lesson content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, outline, style, audience, moduleId, courseId } = body

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const resolvedStyle = style || 'Lecture Notes'
    const resolvedAudience = audience || 'Undergraduate'

    const systemPrompt = `You are an expert educational content writer. Generate comprehensive lesson content based on the provided topic and optional outline.

IMPORTANT: You MUST respond with valid JSON only.
The JSON must follow this exact structure:
{
  "title": "Lesson Title",
  "introduction": "Engaging intro paragraph",
  "keyConcepts": [
    {
      "name": "Concept Name",
      "explanation": "Detailed explanation",
      "analogy": "A relatable analogy or real-world connection"
    }
  ],
  "examples": [
    {
      "title": "Example Title",
      "content": "Detailed example with steps",
      "takeaway": "Key takeaway from this example"
    }
  ],
  "exercises": [
    {
      "title": "Exercise Title",
      "instructions": "Step-by-step instructions",
      "difficulty": "easy|medium|hard",
      "hint": "Optional hint for students"
    }
  ],
  "summary": "Comprehensive lesson summary",
  "furtherReading": ["Resource 1", "Resource 2"]
}

Create content suitable for the "${resolvedStyle}" style aimed at ${resolvedAudience} level learners.
Include 3-5 key concepts, 2-3 examples, 2-3 exercises, and 2-3 further reading resources.`

    const userPrompt = `Generate detailed lesson content for:
Topic: ${topic}
Style: ${resolvedStyle}
Audience: ${resolvedAudience}
${outline ? `Outline/Structure to follow:\n${outline}` : ''}

Make the content engaging, pedagogically sound, and appropriate for the audience level.`

    let lesson: any = null
    try {
      lesson = await AIService.generateJSON<any>({
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        complexity: 'fast',
        feature: 'lesson_content_generator',
        userId: moduleId || courseId,
        courseId: courseId || undefined,
      })
    } catch (err) {
      console.error('Failed to generate lesson content JSON:', err)
    }

    if (!lesson || !lesson.keyConcepts || !Array.isArray(lesson.keyConcepts)) {
      return NextResponse.json({ error: 'AI failed to generate lesson content. Please try again.' }, { status: 422 })
    }

    return NextResponse.json({ lesson, content: JSON.stringify(lesson) })
  } catch (error) {
    console.error('Error generating lesson content:', error)
    return NextResponse.json({ error: 'Failed to generate lesson content' }, { status: 500 })
  }
}

