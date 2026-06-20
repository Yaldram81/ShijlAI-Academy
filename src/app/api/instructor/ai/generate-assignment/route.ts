import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/services/ai'

// POST /api/instructor/ai/generate-assignment - Generate assignment brief with grading rubric using AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { skill, type, course, moduleId, courseId } = body

    if (!skill) {
      return NextResponse.json(
        { error: 'Skill is required' },
        { status: 400 }
      )
    }

    const validTypes = ['written', 'coding', 'project', 'presentation', 'peer-review']
    const assignmentType = validTypes.includes(type) ? type : 'written'

    const systemPrompt = `You are an expert assignment designer and curriculum developer with deep experience creating rigorous, well-structured academic assignments. You specialize in crafting clear assignment briefs that align learning objectives with measurable outcomes. You always include detailed grading rubrics with explicit criteria and point ranges to ensure transparent and consistent evaluation.

IMPORTANT: You MUST respond with valid JSON only. The JSON must follow this exact structure:
{
  "title": "Assignment Title",
  "objectives": ["Objective 1", "Objective 2"],
  "instructions": "Full step-by-step instructions as a single string",
  "deliverables": ["Deliverable 1", "Deliverable 2"],
  "wordLimit": "500-1000 words",
  "rubric": [
    {
      "criterion": "Criterion Name",
      "description": "What is being assessed",
      "levels": [
        { "label": "Excellent", "range": "9-10", "description": "Description for excellent" },
        { "label": "Good", "range": "7-8", "description": "Description for good" },
        { "label": "Satisfactory", "range": "5-6", "description": "Description for satisfactory" },
        { "label": "Needs Improvement", "range": "0-4", "description": "Description for needs improvement" }
      ]
    }
  ]
}

Provide 3-5 objectives, clear step-by-step instructions, a precise list of deliverables, an appropriate word/time limit, and at least 4 rubric criteria each with 4 performance levels.`

    const userPrompt = `Generate a comprehensive assignment brief for the following:

- Skill/Topic: ${skill}
- Assignment Type: ${assignmentType}${course ? `\n- Course: ${course}` : ''}`

    let assignment: any = null
    try {
      assignment = await AIService.generateJSON<any>({
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        complexity: 'fast',
        feature: 'assignment_generator',
        userId: moduleId || courseId,
        courseId: courseId || undefined,
      })
    } catch (err) {
      console.error('Failed to generate assignment JSON:', err)
    }

    if (!assignment || !assignment.title || !assignment.rubric || !Array.isArray(assignment.rubric)) {
      return NextResponse.json(
        { error: 'AI failed to generate assignment content. Please try again.' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      content: JSON.stringify(assignment),
      assignment,
    })
  } catch (error) {
    console.error('Error generating assignment:', error)
    return NextResponse.json(
      { error: 'Failed to generate assignment' },
      { status: 500 }
    )
  }
}
