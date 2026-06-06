import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/instructor/ai/analyze-feedback - Analyze student feedback using AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reviews } = body

    if (!reviews || typeof reviews !== 'string' || reviews.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reviews text is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const systemPrompt = `You are an expert educational feedback analyst. You specialize in analyzing student reviews and feedback to extract meaningful insights for instructors and course designers. You have deep experience in educational psychology, pedagogy, and student engagement. Your analysis is always structured, actionable, and focused on continuous improvement.

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no extra text. The JSON must follow this exact structure:
{
  "topPraise": ["Praise point 1", "Praise point 2"],
  "topIssues": ["Issue 1", "Issue 2"],
  "sentiment": {
    "positive": 65,
    "neutral": 20,
    "negative": 15,
    "summary": "Overall tone explanation"
  },
  "improvementTips": [
    {
      "tip": "Brief tip title",
      "description": "Detailed description of the recommendation",
      "priority": "high|medium|low"
    }
  ]
}

Rules:
- topPraise: array of concise strings, each capturing a distinct positive theme from the feedback.
- topIssues: array of concise strings, each capturing a distinct concern or complaint.
- sentiment: percentages must be whole numbers that sum to 100. The summary should be 1-2 sentences explaining the overall emotional tone.
- improvementTips: each tip must have a "priority" value of exactly "high", "medium", or "low". Provide 3-5 actionable recommendations ordered by priority.
- Return ONLY valid JSON. No markdown code fences, no commentary.`

    const userPrompt = `Analyze the following student feedback/reviews and provide a comprehensive analysis.

Student Feedback:
---
${reviews.trim()}
---

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

      return NextResponse.json({
        content: response,
        analysis: parsed,
      })
    } catch {
      // JSON parsing failed — return as plain text content
    }

    // Fallback: return raw content for the frontend to handle
    return NextResponse.json({ content: response })
  } catch (error) {
    console.error('Error analyzing feedback:', error)
    return NextResponse.json(
      { error: 'Failed to analyze student feedback' },
      { status: 500 }
    )
  }
}
