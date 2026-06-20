import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/services/ai'

// POST /api/instructor/ai/generate-outcomes - Generate learning outcomes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, framework, level, count, moduleId, courseId } = body

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const resolvedFramework = framework || "Bloom's Taxonomy"
    const resolvedLevel = level || 'intermediate'
    const resolvedCount = Math.min(Math.max(Number(count) || 8, 3), 15)

    const systemPrompt = `You are an expert instructional designer specializing in writing measurable learning outcomes. You create outcomes aligned with ${resolvedFramework}.

IMPORTANT: You MUST respond with valid JSON only.
The JSON must follow this exact structure:
{
  "outcomes": [
    {
      "statement": "Students will be able to ...",
      "bloomLevel": "Remember|Understand|Apply|Analyze|Evaluate|Create",
      "domain": "Cognitive|Affective|Psychomotor",
      "actionVerb": "analyze",
      "measurable": true,
      "assessmentMethod": "How to assess this outcome"
    }
  ],
  "summary": "Brief summary of the outcome set",
  "alignment": "How these outcomes align with the chosen framework"
}

Each outcome must:
- Start with an action verb (not "understand" or "know")
- Be specific and measurable
- Be appropriate for the ${resolvedLevel} level
- Include a suggested assessment method`

    const userPrompt = `Generate ${resolvedCount} learning outcomes for:
Topic: ${topic}
Framework: ${resolvedFramework}
Level: ${resolvedLevel}

Create outcomes that progress from lower-order to higher-order thinking skills.`

    let result: any = null
    try {
      result = await AIService.generateJSON<any>({
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        complexity: 'fast',
        feature: 'outcomes_generator',
        userId: moduleId || courseId,
        courseId: courseId || undefined,
      })
    } catch (err) {
      console.error('Failed to generate outcomes JSON:', err)
    }

    if (!result || !result.outcomes || !Array.isArray(result.outcomes)) {
      return NextResponse.json({ error: 'AI failed to generate outcomes. Please try again.' }, { status: 422 })
    }

    return NextResponse.json({
      outcomes: result.outcomes,
      summary: result.summary,
      alignment: result.alignment,
      content: JSON.stringify(result)
    })
  } catch (error) {
    console.error('Error generating outcomes:', error)
    return NextResponse.json({ error: 'Failed to generate outcomes' }, { status: 500 })
  }
}

