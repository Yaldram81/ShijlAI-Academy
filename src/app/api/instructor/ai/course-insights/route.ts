import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/instructor/ai/course-insights - Generate course improvement insights
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseName, focus, instructorId } = body

    // Fetch some analytics if instructorId is provided
    let analyticsContext = ''
    if (instructorId) {
      try {
        const analyticsRes = await fetch(`http://localhost:3000/api/analytics/intelligent?userId=${instructorId}&role=instructor`)
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json()
          analyticsContext = `\n\nAnalytics Data (use this to inform your insights):\n${JSON.stringify(analyticsData, null, 2)}`
        }
      } catch {
        // Analytics not available, continue without it
      }
    }

    const resolvedFocus = focus || 'All Areas'

    const zai = await ZAI.create()

    const systemPrompt = `You are an expert instructional coach and course improvement advisor. Analyze the course context and provide actionable improvement insights.

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no extra text.
The JSON must follow this exact structure:
{
  "insights": [
    {
      "title": "Insight Title",
      "description": "Detailed description of the finding",
      "severity": "high|medium|low",
      "category": "content|engagement|assessment|structure|accessibility",
      "action": "Specific, actionable step to take",
      "impact": "Expected impact if addressed",
      "effort": "low|medium|high"
    }
  ],
  "overallScore": 75,
  "overallRecommendation": "Overall recommendation summary",
  "quickWins": ["Quick improvement 1", "Quick improvement 2"],
  "longTermGoals": ["Long-term goal 1", "Long-term goal 2"]
}

Generate 5-8 specific, actionable insights. Focus on ${resolvedFocus}.
Each insight should have a clear action step and expected impact.
Severity indicates urgency: high = address now, medium = address soon, low = nice to have.
Effort indicates implementation difficulty.`

    const userPrompt = `Generate course improvement insights for:
${courseName ? `Course: ${courseName}` : 'General course improvement recommendations'}
Focus Area: ${resolvedFocus}
${analyticsContext}

Provide specific, actionable insights with clear recommendations.
Prioritize by severity and include both quick wins and long-term goals.
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
      return NextResponse.json({ error: 'AI failed to generate insights. Please try again.' }, { status: 422 })
    }

    try {
      let cleaned = response.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
      }
      const parsed = JSON.parse(cleaned)
      if (parsed.insights && Array.isArray(parsed.insights)) {
        return NextResponse.json({ insights: parsed.insights, overallScore: parsed.overallScore, overallRecommendation: parsed.overallRecommendation, quickWins: parsed.quickWins, longTermGoals: parsed.longTermGoals, content: response })
      }
    } catch {
      // fall through
    }

    return NextResponse.json({ content: response })
  } catch (error) {
    console.error('Error generating course insights:', error)
    return NextResponse.json({ error: 'Failed to generate course insights' }, { status: 500 })
  }
}
