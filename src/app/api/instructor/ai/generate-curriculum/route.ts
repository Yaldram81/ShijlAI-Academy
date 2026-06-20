import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/services/ai'

// POST /api/instructor/ai/generate-curriculum - Generate a course curriculum using AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, prompt, audience, level, sections, title, category, moduleId, courseId } = body

    // Support both `topic` (direct API call) and `prompt` (from course creator wizard)
    const resolvedTopic = topic || prompt
    if (!resolvedTopic) {
      return NextResponse.json(
        { error: 'Topic or prompt is required' },
        { status: 400 }
      )
    }

    const validLevels = ['beginner', 'intermediate', 'advanced']
    const resolvedLevel = validLevels.includes(level) ? level : 'beginner'
    const resolvedSections = Math.min(Math.max(Number(sections) || 5, 1), 20)
    const resolvedAudience = audience || 'General students'
    const resolvedTitle = title || ''
    const resolvedCategory = category || ''

    const systemPrompt = `You are an expert curriculum designer specializing in international education standards, including IB (International Baccalaureate), AP (Advanced Placement), Cambridge (IGCSE, O-Level, A-Level), and Common Core. You create well-structured, pedagogically sound course curricula that align with international education standards and assessment objectives. Your curricula are clear, comprehensive, and tailored to the specified audience and difficulty level.

IMPORTANT: You MUST respond with valid JSON only. The JSON must follow this exact structure:
{
  "modules": [
    {
      "title": "Module Title",
      "description": "Brief module description",
      "objectives": ["Learning objective 1", "Learning objective 2"],
      "lessons": [
        {
          "title": "Lesson Title",
          "description": "Brief lesson description",
          "type": "video",
          "duration": 15
        }
      ]
    }
  ]
}

Lesson types must be one of: "video", "text", "quiz", "assignment", "interactive", "download"
Duration is in minutes (integer).`

    const userPrompt = `Generate a detailed course curriculum for the following:

${resolvedTitle ? `Course Title: ${resolvedTitle}` : ''}
${resolvedCategory ? `Category: ${resolvedCategory}` : ''}
Topic: ${resolvedTopic}
Target Audience: ${resolvedAudience}
Difficulty Level: ${resolvedLevel}
Number of Modules: ${resolvedSections}

Generate ${resolvedSections} modules, each with 3-5 lessons. Ensure the content is relevant to international education standards (IB, AP, Cambridge, Common Core) where applicable and appropriate for the ${resolvedLevel} difficulty level.`

    let curriculum: any = null
    try {
      curriculum = await AIService.generateJSON<any>({
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        complexity: 'fast',
        feature: 'curriculum_generator',
        userId: moduleId || courseId,
        courseId: courseId || undefined,
      })
    } catch (err) {
      console.error('Failed to generate curriculum JSON:', err)
    }

    if (!curriculum || !curriculum.modules || !Array.isArray(curriculum.modules)) {
      return NextResponse.json(
        { error: 'AI generated an empty or invalid response. Please try again.' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      modules: curriculum.modules,
      content: JSON.stringify(curriculum),
    })
  } catch (error) {
    console.error('Error generating curriculum:', error)
    return NextResponse.json(
      { error: 'Failed to generate curriculum' },
      { status: 500 }
    )
  }
}

