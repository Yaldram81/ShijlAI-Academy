import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/instructor/ai/generate-rubric - Generate a standalone grading rubric
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, criteriaCount, gradingScale, assignmentType } = body

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const resolvedCriteriaCount = Math.min(Math.max(Number(criteriaCount) || 5, 3), 8)
    const resolvedGradingScale = gradingScale || '4-Point'
    const resolvedAssignmentType = assignmentType || 'Essay'

    const zai = await ZAI.create()

    const systemPrompt = `You are an expert rubric designer specializing in creating clear, fair, and comprehensive grading rubrics.

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no extra text.
The JSON must follow this exact structure:
{
  "title": "Rubric Title",
  "description": "Brief rubric description",
  "criteria": [
    {
      "name": "Criterion Name",
      "weight": 25,
      "description": "What this criterion measures",
      "levels": [
        {
          "label": "Excellent",
          "score": 4,
          "description": "Detailed description for excellent performance",
          "indicators": ["Specific indicator 1", "Specific indicator 2"]
        },
        {
          "label": "Good",
          "score": 3,
          "description": "Description for good performance",
          "indicators": ["Specific indicator 1"]
        },
        {
          "label": "Satisfactory",
          "score": 2,
          "description": "Description for satisfactory performance",
          "indicators": ["Specific indicator 1"]
        },
        {
          "label": "Needs Improvement",
          "score": 1,
          "description": "Description for needs improvement",
          "indicators": ["Specific indicator 1"]
        }
      ]
    }
  ],
  "totalPoints": 100,
  "gradingNotes": "Additional grading notes and considerations"
}

Create ${resolvedCriteriaCount} criteria. Weights must total 100.
Each criterion should have 4 levels (${resolvedGradingScale} scale).
Tailor criteria and descriptions to a "${resolvedAssignmentType}" assignment type.`

    const userPrompt = `Generate a comprehensive grading rubric for:
Topic: ${topic}
Assignment Type: ${resolvedAssignmentType}
Number of Criteria: ${resolvedCriteriaCount}
Grading Scale: ${resolvedGradingScale}

Create specific, measurable criteria with clear performance level descriptions.
Ensure weights total 100 points.
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
      return NextResponse.json({ error: 'AI failed to generate rubric. Please try again.' }, { status: 422 })
    }

    try {
      let cleaned = response.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
      }
      const parsed = JSON.parse(cleaned)
      if (parsed.criteria && Array.isArray(parsed.criteria)) {
        return NextResponse.json({ rubric: parsed, content: response })
      }
    } catch {
      // fall through
    }

    return NextResponse.json({ content: response })
  } catch (error) {
    console.error('Error generating rubric:', error)
    return NextResponse.json({ error: 'Failed to generate rubric' }, { status: 500 })
  }
}
