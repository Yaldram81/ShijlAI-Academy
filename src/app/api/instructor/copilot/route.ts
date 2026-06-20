import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AIService } from '@/services/ai'

// Helper: call LLM with system + user prompts
async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  instructorId?: string,
  courseId?: string
): Promise<string> {
  try {
    return await AIService.chat({
      systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      complexity: 'complex',
      feature: 'instructor_copilot',
      userId: instructorId,
      courseId: courseId,
    })
  } catch (err) {
    console.error('[callLLM] Error:', err)
    return ''
  }
}

// Helper: parse JSON from LLM response (strip markdown fences)
function parseLLMJson(text: string): unknown {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }
  return JSON.parse(cleaned)
}

// Helper: log instructor AI activity
async function logActivity(
  instructorId: string,
  activityType: string,
  moduleType: string,
  title: string,
  metadata?: Record<string, unknown>
) {
  await db.instructorAIActivity.create({
    data: {
      instructorId,
      activityType,
      moduleType,
      title,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  })
}

// POST /api/instructor/copilot — Instructor Copilot actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'generate-outline':
        return await handleGenerateOutline(body)
      case 'generate-outcomes':
        return await handleGenerateOutcomes(body)
      case 'generate-structure':
        return await handleGenerateStructure(body)
      case 'generate-content':
        return await handleGenerateContent(body)
      case 'generate-quiz':
        return await handleGenerateQuiz(body)
      case 'generate-assignment':
        return await handleGenerateAssignment(body)
      case 'generate-rubric':
        return await handleGenerateRubric(body)
      case 'improvement-insights':
        return await handleImprovementInsights(body)
      case 'review-approve':
        return await handleReviewApprove(body)
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[Instructor Copilot] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/instructor/copilot — Fetch saved records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const type = searchParams.get('type')
    const activityType = searchParams.get('activityType')
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    if (!instructorId) {
      return NextResponse.json({ error: 'instructorId is required' }, { status: 400 })
    }

    if (type === 'outline') {
      const records = await db.aIGeneratedOutline.findMany({
        where: { instructorId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
      return NextResponse.json({ outlines: records })
    }

    if (type === 'lesson') {
      const records = await db.aIGeneratedLesson.findMany({
        where: { instructorId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
      return NextResponse.json({ lessons: records })
    }

    if (type === 'quiz') {
      const records = await db.aIGeneratedQuiz.findMany({
        where: { instructorId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
      return NextResponse.json({ quizzes: records })
    }

    if (type === 'assignment') {
      const records = await db.aIGeneratedAssignment.findMany({
        where: { instructorId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
      return NextResponse.json({ assignments: records })
    }

    if (type === 'rubric') {
      const records = await db.aIGeneratedRubric.findMany({
        where: { instructorId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
      return NextResponse.json({ rubrics: records })
    }

    if (type === 'activity') {
      const where: Record<string, unknown> = { instructorId }
      if (activityType) {
        where.activityType = activityType
      }
      const activities = await db.instructorAIActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
      return NextResponse.json({ activities })
    }

    // Default: return all types
    const [outlines, lessons, quizzes, assignments, rubrics, activities] = await Promise.all([
      db.aIGeneratedOutline.findMany({ where: { instructorId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      db.aIGeneratedLesson.findMany({ where: { instructorId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      db.aIGeneratedQuiz.findMany({ where: { instructorId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      db.aIGeneratedAssignment.findMany({ where: { instructorId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      db.aIGeneratedRubric.findMany({ where: { instructorId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      db.instructorAIActivity.findMany({
        where: activityType ? { instructorId, activityType } : { instructorId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ])

    return NextResponse.json({ outlines, lessons, quizzes, assignments, rubrics, activities })
  } catch (error) {
    console.error('[Instructor Copilot] GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ==================== Action Handlers ====================

async function handleGenerateOutline(body: {
  instructorId: string
  topic: string
  audience?: string
  level?: string
  courseId?: string
}) {
  const { instructorId, topic, audience, level, courseId } = body

  if (!instructorId || !topic) {
    return NextResponse.json({ error: 'instructorId and topic are required' }, { status: 400 })
  }

  const systemPrompt = `You are an expert curriculum designer. Generate a detailed course outline in JSON format.
IMPORTANT: Respond with valid JSON only. No markdown, no code fences, no extra text.
Structure: { "description": "course description", "objectives": ["obj1", "obj2"], "modules": [{ "title": "Module Title", "lessons": [{ "title": "Lesson Title" }] }], "prerequisites": ["prereq1"], "estimatedDuration": "X hours" }`

  const userPrompt = `Generate a course outline for:
Topic: ${topic}
Target Audience: ${audience || 'General students'}
Difficulty Level: ${level || 'beginner'}
Include 4-6 modules with 3-5 lessons each. Provide clear learning objectives, prerequisites, and estimated duration.
Respond with JSON only:`

  const response = await callLLM(systemPrompt, userPrompt, instructorId, courseId)

  let generatedContent: string
  try {
    const parsed = parseLLMJson(response)
    generatedContent = JSON.stringify(parsed)
  } catch {
    generatedContent = JSON.stringify({ rawContent: response })
  }

  const outline = await db.aIGeneratedOutline.create({
    data: {
      instructorId,
      courseId: courseId || null,
      prompt: topic,
      generatedContent,
      status: 'generated',
    },
  })

  await logActivity(instructorId, 'outline_generated', 'outline', `Generated outline: ${topic}`, { outlineId: outline.id })

  return NextResponse.json({ outline })
}

async function handleGenerateOutcomes(body: {
  instructorId: string
  topic: string
  courseId?: string
}) {
  const { instructorId, topic, courseId } = body

  if (!instructorId || !topic) {
    return NextResponse.json({ error: 'instructorId and topic are required' }, { status: 400 })
  }

  const systemPrompt = `You are an expert instructional designer. Generate learning outcomes for a course topic.
IMPORTANT: Respond with valid JSON only. No markdown, no code fences, no extra text.
Structure: { "outcomes": ["Students will be able to ...", "Students will be able to ..."] }
Generate 6-10 specific, measurable learning outcomes starting with "Students will be able to".`

  const userPrompt = `Generate learning outcomes for:
Topic: ${topic}
Respond with JSON only:`

  const response = await callLLM(systemPrompt, userPrompt, instructorId, courseId)

  let outcomes: unknown
  try {
    outcomes = parseLLMJson(response)
  } catch {
    outcomes = { rawContent: response }
  }

  await logActivity(instructorId, 'outcomes_generated', 'outcomes', `Generated outcomes: ${topic}`, { courseId })

  return NextResponse.json({ outcomes })
}

async function handleGenerateStructure(body: {
  instructorId: string
  topic: string
  courseId?: string
}) {
  const { instructorId, topic, courseId } = body

  if (!instructorId || !topic) {
    return NextResponse.json({ error: 'instructorId and topic are required' }, { status: 400 })
  }

  const systemPrompt = `You are an expert lesson planner. Generate a lesson structure in JSON format.
IMPORTANT: Respond with valid JSON only. No markdown, no code fences, no extra text.
Structure: { "introduction": "brief intro", "keyConcepts": ["concept1", "concept2"], "examples": ["example1", "example2"], "applications": ["app1", "app2"], "summary": "lesson summary", "quizQuestions": [{ "question": "Q?", "answer": "A" }], "references": ["ref1"] }`

  const userPrompt = `Generate a lesson structure for:
Topic: ${topic}
Include introduction, key concepts (3-5), examples (2-3), applications (2-3), summary, 3-5 quiz questions with answers, and references.
Respond with JSON only:`

  const response = await callLLM(systemPrompt, userPrompt, instructorId, courseId)

  let structureContent: string
  try {
    const parsed = parseLLMJson(response)
    structureContent = JSON.stringify(parsed)
  } catch {
    structureContent = JSON.stringify({ rawContent: response })
  }

  const lesson = await db.aIGeneratedLesson.create({
    data: {
      instructorId,
      courseId: courseId || null,
      topic,
      structureContent,
      status: 'structure_generated',
    },
  })

  await logActivity(instructorId, 'structure_generated', 'structure', `Generated structure: ${topic}`, { lessonId: lesson.id })

  return NextResponse.json({ lesson })
}

async function handleGenerateContent(body: {
  instructorId: string
  lessonId: string
}) {
  const { instructorId, lessonId } = body

  if (!instructorId || !lessonId) {
    return NextResponse.json({ error: 'instructorId and lessonId are required' }, { status: 400 })
  }

  const lesson = await db.aIGeneratedLesson.findUnique({ where: { id: lessonId } })
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }
  if (lesson.instructorId !== instructorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const structureContext = lesson.structureContent || lesson.topic

  const systemPrompt = `You are an expert educational content writer. Generate detailed lesson content in JSON format based on the provided lesson structure.
IMPORTANT: Respond with valid JSON only. No markdown, no code fences, no extra text.
Structure: { "notes": "detailed lesson notes in markdown", "examples": ["detailed example 1", "detailed example 2"], "exercises": ["exercise 1 with instructions", "exercise 2 with instructions"], "summary": "comprehensive summary" }
Make the content detailed, engaging, and pedagogically sound. Notes should be comprehensive markdown-formatted content.`

  const userPrompt = `Generate detailed lesson content for:
Topic: ${lesson.topic}
Lesson Structure: ${structureContext}
Write comprehensive notes, detailed examples (2-3), practical exercises (2-3), and a summary.
Respond with JSON only:`

  const response = await callLLM(systemPrompt, userPrompt, instructorId, lesson.courseId || undefined)

  let lessonContent: string
  try {
    const parsed = parseLLMJson(response)
    lessonContent = JSON.stringify(parsed)
  } catch {
    lessonContent = JSON.stringify({ rawContent: response })
  }

  const updated = await db.aIGeneratedLesson.update({
    where: { id: lessonId },
    data: {
      lessonContent,
      status: 'content_generated',
    },
  })

  await logActivity(instructorId, 'content_generated', 'content', `Generated content: ${lesson.topic}`, { lessonId })

  return NextResponse.json({ lesson: updated })
}

async function handleGenerateQuiz(body: {
  instructorId: string
  topic: string
  questionTypes?: string[]
  difficulty?: string
  questionCount?: number
  courseId?: string
}) {
  const { instructorId, topic, questionTypes, difficulty, questionCount, courseId } = body

  if (!instructorId || !topic) {
    return NextResponse.json({ error: 'instructorId and topic are required' }, { status: 400 })
  }

  const types = questionTypes && questionTypes.length > 0 ? questionTypes : ['mcq']
  const diff = difficulty || 'medium'
  const count = Math.min(Math.max(questionCount || 5, 1), 20)

  const systemPrompt = `You are an expert assessment designer. Generate quiz questions in JSON format.
IMPORTANT: Respond with valid JSON only. No markdown, no code fences, no extra text.
Structure: { "questions": [{ "type": "mcq|true_false|short_answer|long_answer", "text": "question text", "options": ["A", "B", "C", "D"], "correctAnswer": "answer", "explanation": "why this is correct", "points": 1 }] }
For MCQ and true_false, include options array. For short_answer and long_answer, options can be empty array.`

  const userPrompt = `Generate ${count} quiz questions for:
Topic: ${topic}
Question Types: ${types.join(', ')}
Difficulty: ${diff}
Include a mix of the specified question types. Each question should have a clear correct answer and explanation.
Respond with JSON only:`

  const response = await callLLM(systemPrompt, userPrompt, instructorId, courseId)

  let generatedContent: string
  try {
    const parsed = parseLLMJson(response)
    generatedContent = JSON.stringify(parsed)
  } catch {
    generatedContent = JSON.stringify({ rawContent: response })
  }

  const quiz = await db.aIGeneratedQuiz.create({
    data: {
      instructorId,
      courseId: courseId || null,
      topic,
      questionTypes: JSON.stringify(types),
      difficulty: diff,
      questionCount: count,
      generatedContent,
      status: 'generated',
    },
  })

  await logActivity(instructorId, 'quiz_generated', 'quiz', `Generated quiz: ${topic}`, { quizId: quiz.id })

  return NextResponse.json({ quiz })
}

async function handleGenerateAssignment(body: {
  instructorId: string
  topic: string
  difficulty?: string
  deadline?: string
  courseId?: string
}) {
  const { instructorId, topic, difficulty, deadline, courseId } = body

  if (!instructorId || !topic) {
    return NextResponse.json({ error: 'instructorId and topic are required' }, { status: 400 })
  }

  const diff = difficulty || 'medium'

  const systemPrompt = `You are an expert assignment designer. Generate an assignment in JSON format.
IMPORTANT: Respond with valid JSON only. No markdown, no code fences, no extra text.
Structure: { "title": "Assignment Title", "problemStatement": "detailed problem statement", "instructions": "step-by-step instructions", "deliverables": ["deliverable 1", "deliverable 2"], "submissionFormat": "how to submit" }`

  const userPrompt = `Generate an assignment for:
Topic: ${topic}
Difficulty: ${diff}
${deadline ? `Deadline: ${deadline}` : ''}
Create a comprehensive assignment with clear problem statement, detailed instructions, specific deliverables, and submission format.
Respond with JSON only:`

  const response = await callLLM(systemPrompt, userPrompt, instructorId, courseId)

  let generatedContent: string
  try {
    const parsed = parseLLMJson(response)
    generatedContent = JSON.stringify(parsed)
  } catch {
    generatedContent = JSON.stringify({ rawContent: response })
  }

  const assignment = await db.aIGeneratedAssignment.create({
    data: {
      instructorId,
      courseId: courseId || null,
      topic,
      difficulty: diff,
      generatedContent,
      status: 'generated',
    },
  })

  await logActivity(instructorId, 'assignment_generated', 'assignment', `Generated assignment: ${topic}`, { assignmentId: assignment.id })

  return NextResponse.json({ assignment })
}

async function handleGenerateRubric(body: {
  instructorId: string
  topic: string
  assignmentId?: string
  courseId?: string
}) {
  const { instructorId, topic, assignmentId, courseId } = body

  if (!instructorId || !topic) {
    return NextResponse.json({ error: 'instructorId and topic are required' }, { status: 400 })
  }

  const systemPrompt = `You are an expert rubric designer. Generate a grading rubric in JSON format.
IMPORTANT: Respond with valid JSON only. No markdown, no code fences, no extra text.
Structure: { "criteria": [{ "name": "Criterion Name", "weight": 25, "description": "what this criterion measures", "levels": [{ "level": "Excellent", "score": 100, "description": "description" }, { "level": "Good", "score": 75, "description": "description" }, { "level": "Satisfactory", "score": 50, "description": "description" }, { "level": "Needs Improvement", "score": 25, "description": "description" }] }] }
Create 4-6 criteria. Weights should total 100.`

  const userPrompt = `Generate a rubric for:
Topic: ${topic}
${assignmentId ? 'This rubric is for a specific assignment.' : ''}
Create 4-6 criteria with 4 performance levels each. Ensure weights total 100.
Respond with JSON only:`

  const response = await callLLM(systemPrompt, userPrompt, instructorId, courseId)

  let generatedContent: string
  try {
    const parsed = parseLLMJson(response)
    generatedContent = JSON.stringify(parsed)
  } catch {
    generatedContent = JSON.stringify({ rawContent: response })
  }

  const rubric = await db.aIGeneratedRubric.create({
    data: {
      instructorId,
      courseId: courseId || null,
      assignmentId: assignmentId || null,
      topic,
      generatedContent,
      status: 'generated',
    },
  })

  await logActivity(instructorId, 'rubric_generated', 'rubric', `Generated rubric: ${topic}`, { rubricId: rubric.id })

  return NextResponse.json({ rubric })
}

async function handleImprovementInsights(body: {
  instructorId: string
  courseId?: string
}) {
  const { instructorId, courseId } = body

  if (!instructorId) {
    return NextResponse.json({ error: 'instructorId is required' }, { status: 400 })
  }

  // Fetch analytics data from the intelligent analytics endpoint
  let analyticsData: Record<string, unknown> = {}
  try {
    const analyticsRes = await fetch(
      `http://localhost:3000/api/analytics/intelligent?userId=${instructorId}&role=instructor`
    )
    if (analyticsRes.ok) {
      analyticsData = await analyticsRes.json()
    }
  } catch (err) {
    console.error('[Instructor Copilot] Failed to fetch analytics:', err)
  }

  const systemPrompt = `You are an expert instructional coach and course improvement advisor. Analyze the provided analytics data and generate improvement insights for the instructor.
IMPORTANT: Respond with valid JSON only. No markdown, no code fences, no extra text.
Structure: { "insights": [{ "title": "Insight Title", "description": "Detailed description", "severity": "high|medium|low", "action": "Suggested action to take", "category": "content|engagement|assessment|structure" }], "overallRecommendation": "Overall recommendation summary" }`

  const userPrompt = `Generate improvement insights based on this analytics data:
${JSON.stringify(analyticsData, null, 2)}

Focus on:
1. Difficult lessons that need revision
2. Student struggle areas that need additional support
3. Module performance drops that need restructuring
4. Engagement issues that need addressing
5. Assessment improvements

Provide specific, actionable insights.
Respond with JSON only:`

  const response = await callLLM(systemPrompt, userPrompt, instructorId, courseId)

  let insights: unknown
  try {
    insights = parseLLMJson(response)
  } catch {
    insights = { rawContent: response }
  }

  await logActivity(instructorId, 'insight_viewed', 'insights', `Generated improvement insights`, { courseId })

  return NextResponse.json({ insights, analyticsData })
}

async function handleReviewApprove(body: {
  instructorId: string
  type: 'outline' | 'lesson' | 'quiz' | 'assignment' | 'rubric'
  id: string
  action: 'approve' | 'reject'
  editedContent?: string
  reviewNotes?: string
}) {
  const { instructorId, type, id, action: reviewAction, editedContent, reviewNotes } = body

  if (!instructorId || !type || !id || !reviewAction) {
    return NextResponse.json(
      { error: 'instructorId, type, id, and action are required' },
      { status: 400 }
    )
  }

  const validTypes = ['outline', 'lesson', 'quiz', 'assignment', 'rubric']
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 })
  }

  const validActions = ['approve', 'reject']
  if (!validActions.includes(reviewAction)) {
    return NextResponse.json({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` }, { status: 400 })
  }

  const newStatus = reviewAction === 'approve' ? 'approved' : 'rejected'

  // Map type to Prisma model and verify ownership
  const modelMap: Record<string, { findUnique: (args: { where: { id: string } }) => Promise<{ instructorId: string } | null>; update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown> }> = {
    outline: db.aIGeneratedOutline,
    lesson: db.aIGeneratedLesson,
    quiz: db.aIGeneratedQuiz,
    assignment: db.aIGeneratedAssignment,
    rubric: db.aIGeneratedRubric,
  }

  const model = modelMap[type]
  if (!model) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const record = await model.findUnique({ where: { id } })
  if (!record) {
    return NextResponse.json({ error: `${type} not found` }, { status: 404 })
  }
  if (record.instructorId !== instructorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const updateData: Record<string, unknown> = {
    status: newStatus,
    reviewNotes: reviewNotes || null,
  }
  if (editedContent) {
    updateData.editedContent = editedContent
  }

  const updated = await model.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json({ record: updated, type, action: reviewAction })
}

