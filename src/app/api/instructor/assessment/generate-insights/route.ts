import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/instructor/assessment/generate-insights
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { instructorId, courseId } = body

    if (!instructorId) {
      return NextResponse.json({ error: 'instructorId is required' }, { status: 400 })
    }
    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
    }

    // Verify course ownership
    const course = await db.course.findFirst({
      where: { id: courseId, instructorId },
    })
    if (!course) {
      return NextResponse.json({ error: 'Course not found or not owned by instructor' }, { status: 404 })
    }

    // Gather assessment data for AI analysis
    // 1. Outcome mastery levels
    const outcomes = await db.learningOutcome.findMany({
      where: { courseId },
      include: { questionOutcomes: true },
    })

    const outcomeData = outcomes.map(o => ({
      id: o.id,
      title: o.title,
      questionCount: o.questionOutcomes.length,
    }))

    // 2. Difficult questions
    const quizzes = await db.quiz.findMany({
      where: { courseId },
      select: { id: true },
    })
    const quizIds = quizzes.map(q => q.id)

    const questions = await db.question.findMany({
      where: { quizId: { in: quizIds } },
      select: { id: true, text: true, type: true },
    })
    const questionIds = questions.map(q => q.id)

    const questionAnalytics = await db.questionAnalytics.findMany({
      where: { questionId: { in: questionIds } },
    })

    const difficultQuestions = questionAnalytics
      .filter(qa => qa.difficultyLevel === 'too_difficult' || qa.difficultyLevel === 'difficult')
      .map(qa => {
        const q = questions.find(q => q.id === qa.questionId)
        return {
          questionId: qa.questionId,
          text: q?.text || 'Unknown',
          type: q?.type || 'Unknown',
          successRate: qa.successRate,
          difficultyLevel: qa.difficultyLevel,
          attempts: qa.attempts,
        }
      })

    // 3. Weak distractors
    const distractorAnalytics = await db.distractorAnalytics.findMany({
      where: { questionId: { in: questionIds }, isWeak: true },
    })

    const weakDistractors = distractorAnalytics.map(da => ({
      questionId: da.questionId,
      optionLabel: da.optionLabel,
      optionText: da.optionText,
      selectionRate: da.selectionRate,
    }))

    // 4. Quality scores
    const qualityScores = await db.assessmentQualityScore.findMany({
      where: { quizId: { in: quizIds } },
    })

    // 5. Quiz attempt summary
    const totalAttempts = await db.quizAttempt.count({
      where: { quizId: { in: quizIds }, completedAt: { not: null } },
    })

    // Build context for AI
    const assessmentContext = JSON.stringify({
      courseName: course.title,
      totalQuizzes: quizzes.length,
      totalQuestions: questions.length,
      totalAttempts,
      outcomes: outcomeData,
      difficultQuestions,
      weakDistractors,
      qualityScores: qualityScores.map(qs => ({
        overallScore: qs.overallScore,
        difficultyBalance: qs.difficultyBalance,
        questionVariety: qs.questionVariety,
        outcomeCoverage: qs.outcomeCoverage,
      })),
      questionDifficultyDistribution: {
        too_difficult: questionAnalytics.filter(qa => qa.difficultyLevel === 'too_difficult').length,
        difficult: questionAnalytics.filter(qa => qa.difficultyLevel === 'difficult').length,
        normal: questionAnalytics.filter(qa => qa.difficultyLevel === 'normal').length,
        easy: questionAnalytics.filter(qa => qa.difficultyLevel === 'easy').length,
        too_easy: questionAnalytics.filter(qa => qa.difficultyLevel === 'too_easy').length,
      },
    }, null, 2)

    const zai = await ZAI.create()

    const systemPrompt = `You are an expert assessment analyst and educational consultant. Analyze assessment data and provide actionable insights for both students and instructors.

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no extra text.
The JSON must follow this exact structure:
{
  "studentInsights": [
    {
      "title": "Insight Title",
      "description": "Detailed description",
      "severity": "high|medium|low",
      "category": "performance|difficulty|study_strategy|knowledge_gap",
      "recommendation": "What the student should do",
      "affectedOutcomes": ["outcome title 1", "outcome title 2"]
    }
  ],
  "instructorInsights": [
    {
      "title": "Insight Title",
      "description": "Detailed description",
      "severity": "high|medium|low",
      "category": "question_quality|assessment_design|student_performance|content_alignment",
      "recommendation": "What the instructor should do",
      "effort": "low|medium|high",
      "impact": "Expected impact description"
    }
  ],
  "overallAssessment": {
    "healthScore": 75,
    "strengths": ["strength 1", "strength 2"],
    "areasForImprovement": ["area 1", "area 2"],
    "priorityActions": ["action 1", "action 2"]
  }
}

Generate 3-5 student insights and 3-5 instructor insights based on the data provided.
Focus on actionable recommendations that can improve learning outcomes and assessment quality.`

    const userPrompt = `Analyze the following assessment data for the course "${course.title}" and generate comprehensive insights:

${assessmentContext}

Generate specific, actionable insights for both students and instructors. Consider:
- Questions that are too difficult or too easy may indicate content misalignment
- Weak distractors (low selection rate) suggest poorly designed wrong answers
- Low outcome coverage means some learning objectives aren't being assessed
- Difficulty imbalance means the assessment may not accurately measure student knowledge

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

    // Try to parse as JSON
    try {
      let cleaned = response.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
      }
      const parsed = JSON.parse(cleaned)

      if (parsed.studentInsights && parsed.instructorInsights) {
        return NextResponse.json({
          studentInsights: parsed.studentInsights,
          instructorInsights: parsed.instructorInsights,
          overallAssessment: parsed.overallAssessment || {
            healthScore: 50,
            strengths: [],
            areasForImprovement: [],
            priorityActions: [],
          },
        })
      }
    } catch {
      // JSON parsing failed, return raw content
    }

    // Fallback: return raw content
    return NextResponse.json({
      studentInsights: [],
      instructorInsights: [],
      overallAssessment: {
        healthScore: 0,
        strengths: [],
        areasForImprovement: [],
        priorityActions: [],
      },
      rawContent: response,
    })
  } catch (error) {
    console.error('Error generating assessment insights:', error)
    return NextResponse.json({ error: 'Failed to generate assessment insights' }, { status: 500 })
  }
}
