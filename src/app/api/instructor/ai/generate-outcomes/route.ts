import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/instructor/ai/generate-outcomes - Generate learning outcomes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, framework, level, count } = body

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const resolvedFramework = framework || "Bloom's Taxonomy"
    const resolvedLevel = level || 'intermediate'
    const resolvedCount = Math.min(Math.max(Number(count) || 8, 3), 15)

    const zai = await ZAI.create()

    const systemPrompt = `You are an expert instructional designer specializing in writing measurable learning outcomes. You create outcomes aligned with ${resolvedFramework}.

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no extra text.
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

Create outcomes that progress from lower-order to higher-order thinking skills.
Respond with JSON only:`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      return NextResponse.json({ error: 'AI failed to generate outcomes. Please try again.' }, { status: 422 })
    }

    try {
      let cleaned = response.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
      }
      const parsed = JSON.parse(cleaned)
      if (parsed.outcomes && Array.isArray(parsed.outcomes)) {
        return NextResponse.json({ outcomes: parsed.outcomes, summary: parsed.summary, alignment: parsed.alignment, content: response })
      }
    } catch {
      // fall through
    }

    return NextResponse.json({ content: response })
  } catch (error) {
    console.error('Error generating outcomes:', error)
    return NextResponse.json({ error: 'Failed to generate outcomes' }, { status: 500 })
  }
}
