import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/instructor/ai/generate-curriculum - Generate a course curriculum using AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, prompt, audience, level, sections, title, category } = body

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

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no extra text. The JSON must follow this exact structure:
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

Generate ${resolvedSections} modules, each with 3-5 lessons. Ensure the content is relevant to international education standards (IB, AP, Cambridge, Common Core) where applicable and appropriate for the ${resolvedLevel} difficulty level.

Respond with JSON only:`

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })
    const response = completion.choices[0]?.message?.content

    if (!response) {
      return NextResponse.json(
        { error: 'AI generated an empty response. Please try again.' },
        { status: 422 }
      )
    }

    // Try to parse the AI response as JSON
    try {
      // Strip markdown code fences if present
      let cleaned = response.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
      }

      const parsed = JSON.parse(cleaned)

      // Validate structure
      if (parsed.modules && Array.isArray(parsed.modules)) {
        return NextResponse.json({ modules: parsed.modules, content: response })
      }
    } catch {
      // JSON parsing failed — return as plain text content
    }

    // Fallback: return raw content for the frontend to handle
    return NextResponse.json({ content: response })
  } catch (error) {
    console.error('Error generating curriculum:', error)
    return NextResponse.json(
      { error: 'Failed to generate curriculum' },
      { status: 500 }
    )
  }
}
