import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/instructor/ai/generate-description - Generate SEO-optimized course descriptions using AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, keywords, tone, title, category, level, language } = body

    // Support both `topic` (direct API call) and `title` (from course creator wizard)
    const resolvedTopic = topic || title
    if (!resolvedTopic) {
      return NextResponse.json({ error: 'Topic or title is required' }, { status: 400 })
    }

    const validTones = ['professional', 'friendly', 'academic', 'inspiring'] as const
    const selectedTone: (typeof validTones)[number] =
      validTones.includes(tone) ? tone : 'professional'

    const zai = await ZAI.create()

    const systemPrompt = `You are an expert SEO copywriter specializing in online course descriptions. Your goal is to create compelling, search-engine-optimized content that attracts learners and drives enrollments. You understand how to balance keyword optimization with engaging, persuasive writing.

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no extra text. The JSON must follow this exact structure:
{
  "seoTitle": "SEO-Optimized Title (under 60 chars)",
  "subtitle": "Compelling one-line subtitle (under 120 chars)",
  "description": "Full detailed course description (200-400 words)",
  "learningOutcomes": ["Outcome 1", "Outcome 2", "..."],
  "keywords": ["keyword1", "keyword2", "..."]
}

Requirements:
- seoTitle: A catchy, keyword-rich course title (under 60 characters for SEO).
- subtitle: A compelling one-line subtitle that expands on the title (under 120 characters).
- description: A detailed course description (200-400 words) that opens with a hook speaking to the learner's pain point or aspiration, explains what the course covers and why it matters, naturally incorporates target keywords throughout, and ends with a strong call-to-action encouraging enrollment.
- learningOutcomes: 4 to 6 specific, measurable learning outcomes (start each with an action verb).
- keywords: A list of 5-8 SEO keywords relevant to the course.`

    const userPrompt = `Generate an SEO-optimized course description for the following:

Topic: "${resolvedTopic}"
${category ? `Category: ${category}` : ''}
${level ? `Difficulty Level: ${level}` : ''}
${language ? `Language: ${language}` : ''}
${keywords ? `Target Keywords: ${keywords}` : 'Suggest relevant keywords based on the topic.'}
Tone: ${selectedTone}

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
      return NextResponse.json(
        { error: 'AI failed to generate a description. Please try again.' },
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

      // Validate required fields exist
      if (parsed.seoTitle && parsed.description) {
        return NextResponse.json({
          content: response,
          description: parsed,
        })
      }
    } catch {
      // JSON parsing failed — return as plain text content
    }

    // Fallback: return raw content for the frontend to handle
    return NextResponse.json({ content: response })
  } catch (error) {
    console.error('Error generating course description:', error)
    return NextResponse.json(
      { error: 'Failed to generate course description' },
      { status: 500 }
    )
  }
}
