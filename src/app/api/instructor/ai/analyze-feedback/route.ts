import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/services/ai'

// POST /api/instructor/ai/analyze-feedback - Analyze student feedback using AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reviews, moduleId, courseId } = body

    if (!reviews || typeof reviews !== 'string' || reviews.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reviews text is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert educational feedback analyst. You specialize in analyzing student reviews and feedback to extract meaningful insights for instructors and course designers. You have deep experience in educational psychology, pedagogy, and student engagement. Your analysis is always structured, actionable, and focused on continuous improvement.

IMPORTANT: You MUST respond with valid JSON only. The JSON must follow this exact structure:
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
- improvementTips: each tip must have a "priority" value of exactly "high", "medium", or "low". Provide 3-5 actionable recommendations ordered by priority.`

    const userPrompt = `Analyze the following student feedback/reviews and provide a comprehensive analysis.

Student Feedback:
---
${reviews.trim()}
---`

    let analysis: any = null
    try {
      analysis = await AIService.generateJSON<any>({
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        complexity: 'fast',
        feature: 'feedback_analyst',
        userId: moduleId || courseId,
        courseId: courseId || undefined,
      })
    } catch (err) {
      console.error('Failed to generate feedback analysis JSON:', err)
    }

    if (!analysis || !analysis.sentiment) {
      return NextResponse.json(
        { error: 'AI generated an empty or invalid response. Please try again.' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      content: JSON.stringify(analysis),
      analysis,
    })
  } catch (error) {
    console.error('Error analyzing feedback:', error)
    return NextResponse.json(
      { error: 'Failed to analyze student feedback' },
      { status: 500 }
    )
  }
}

