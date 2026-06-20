import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AIService } from '@/services/ai'

// ─── Score Computation Helpers ───

async function computeStructureScore(courseId: string): Promise<number> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      modules: { include: { lessons: true } },
      assignments: true,
      learningOutcomes: true,
    },
  })

  if (!course) return 0

  const hasModules = course.modules.length > 0
  const hasLessons = course.modules.some((m) => m.lessons.length > 0)
  const hasObjectives = course.learningObjectives
    ? (() => {
        try {
          const parsed = JSON.parse(course.learningObjectives)
          return Array.isArray(parsed) && parsed.length > 0
        } catch {
          return false
        }
      })()
    : false
  const hasOutcomes = course.learningOutcomes.length > 0

  let structureScore = 0
  if (hasModules) structureScore += 25
  if (hasLessons) structureScore += 25
  if (hasObjectives) structureScore += 25
  if (hasOutcomes) structureScore += 25

  // Bonus: more modules with lessons = better structure
  const modulesWithLessons = course.modules.filter((m) => m.lessons.length > 0).length
  if (modulesWithLessons >= 3) structureScore = Math.min(100, structureScore + 5)
  if (modulesWithLessons >= 5) structureScore = Math.min(100, structureScore + 5)

  // Penalty: no modules at all
  if (!hasModules && course.assignments.length === 0) {
    structureScore = Math.max(0, structureScore - 10)
  }

  return Math.min(100, Math.max(0, structureScore))
}

async function computeAssessmentScore(courseId: string): Promise<number> {
  const quizzes = await db.quiz.findMany({
    where: { courseId },
    include: { questions: true, attempts: true },
  })
  const assignments = await db.assignment.findMany({
    where: { courseId },
  })

  const totalQuestions = quizzes.reduce((sum, q) => sum + q.questions.length, 0)
  const questionTypes = new Set(quizzes.flatMap((q) => q.questions.map((qt) => qt.type)))
  const hasVariety = questionTypes.size >= 3
  const mcqOnly = totalQuestions > 0 && questionTypes.size === 1 && questionTypes.has('mcq')

  // Average pass rate
  const allAttempts = quizzes.flatMap((q) => q.attempts)
  const passRate = allAttempts.length > 0
    ? (allAttempts.filter((a) => a.passed).length / allAttempts.length) * 100
    : 0

  let assessmentScore = 50 // base
  if (totalQuestions >= 10) assessmentScore += 15
  if (totalQuestions >= 20) assessmentScore += 10
  if (hasVariety) assessmentScore += 15
  if (mcqOnly) assessmentScore -= 20 // penalty
  if (assignments.length > 0) assessmentScore += 10

  // Pass rate factor
  if (passRate >= 70) assessmentScore += 5
  if (passRate < 50 && allAttempts.length > 0) assessmentScore -= 10

  return Math.min(100, Math.max(0, assessmentScore))
}

async function computeSuccessScore(courseId: string): Promise<number> {
  const enrollments = await db.enrollment.findMany({
    where: { courseId },
  })

  const completionRate = enrollments.length > 0
    ? (enrollments.filter((e) => e.status === 'completed').length / enrollments.length) * 100
    : 0

  const avgProgress = enrollments.length > 0
    ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
    : 0

  const quizAttempts = await db.quizAttempt.findMany({
    where: { quiz: { courseId } },
  })

  const avgQuizScore = quizAttempts.length > 0
    ? quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizAttempts.length
    : 0

  let successScore = 0
  successScore += completionRate * 0.4 // 40% weight to completion
  successScore += avgProgress * 0.3 // 30% weight to avg progress
  successScore += avgQuizScore * 0.3 // 30% weight to quiz scores

  return Math.min(100, Math.max(0, Math.round(successScore)))
}

async function computeEngagementScore(courseId: string): Promise<number> {
  const now = new Date()
  const periodStart = new Date(now)
  periodStart.setMonth(now.getMonth() - 1)

  const recentEnrollments = await db.enrollment.count({
    where: { courseId, enrolledAt: { gte: periodStart } },
  })

  const lessonViews = await db.lessonProgress.count({
    where: { enrollment: { courseId }, status: 'completed' },
  })

  const avgTimeSpent = await db.lessonProgress.aggregate({
    where: { enrollment: { courseId } },
    _avg: { timeSpent: true },
  })

  let engagementScore = 40 // base
  if (recentEnrollments > 0) engagementScore += 20
  if (lessonViews > 10) engagementScore += 20
  if (avgTimeSpent._avg.timeSpent && avgTimeSpent._avg.timeSpent > 300) engagementScore += 20

  return Math.min(100, Math.max(0, engagementScore))
}

async function computeContentScore(
  course: {
    title: string
    description: string
    learningObjectives: string | null
    modules: { lessons: { title: string }[] }[]
  },
  courseId: string
): Promise<number> {
  const sampleLessonTitles = course.modules
    .flatMap((m) => m.lessons.map((l) => l.title))
    .slice(0, 10)
    .join(', ')

  let objectivesStr = ''
  if (course.learningObjectives) {
    try {
      const parsed = JSON.parse(course.learningObjectives)
      objectivesStr = Array.isArray(parsed) ? parsed.join(', ') : String(parsed)
    } catch {
      objectivesStr = course.learningObjectives
    }
  }

  try {
    const prompt = `Analyze this course content for quality. Rate 0-100 based on:
- Clarity of description
- Depth of learning objectives
- Content coverage
- Consistency

Course: ${course.title}
Description: ${course.description}
Objectives: ${objectivesStr}
Sample Lessons: ${sampleLessonTitles}

Return ONLY a number between 0-100.`

    const responseText = await AIService.chat({
      systemPrompt: 'You are an LMS course quality evaluator. Return ONLY a single number between 0-100 representing the content quality score.',
      messages: [{ role: 'user', content: prompt }],
      complexity: 'complex',
      feature: 'course_quality',
      courseId,
    })

    // Parse number from response
    const match = responseText.match(/\b(\d{1,3})\b/)
    if (match) {
      const score = parseInt(match[1], 10)
      return Math.min(100, Math.max(0, score))
    }
  } catch (error) {
    console.error('[Course Quality] Content score LLM error:', error)
  }

  // Fallback: heuristic content score
  let fallbackScore = 30
  if (course.description && course.description.length > 100) fallbackScore += 15
  if (course.description && course.description.length > 500) fallbackScore += 10
  if (objectivesStr.length > 0) fallbackScore += 15
  if (sampleLessonTitles.length > 0) fallbackScore += 10
  if (course.modules.length >= 3) fallbackScore += 10
  return Math.min(100, Math.max(0, fallbackScore))
}

async function generateAIAnalysis(
  courseTitle: string,
  structureScore: number,
  assessmentScore: number,
  successScore: number,
  engagementScore: number,
  contentScore: number,
  qualityScore: number,
  courseId: string
): Promise<string> {
  try {
    const prompt = `You are an LMS course quality analyst. Based on these computed quality scores, provide:
1. Strengths (2-3 items)
2. Weaknesses (2-3 items)
3. Recommendations (3-5 actionable items)

Course: ${courseTitle}
Structure: ${structureScore}/100
Assessment: ${assessmentScore}/100
Student Success: ${successScore}/100
Engagement: ${engagementScore}/100
Content: ${contentScore}/100
Overall: ${qualityScore}/100

Keep response concise, max 200 words.`

    const analysisText = await AIService.chat({
      systemPrompt: 'You are an LMS course quality analyst providing concise, actionable analysis.',
      messages: [{ role: 'user', content: prompt }],
      complexity: 'complex',
      feature: 'course_quality',
      courseId,
    })

    return analysisText || `Course "${courseTitle}" analysis complete.`
  } catch (error) {
    console.error('[Course Quality] AI analysis error:', error)
    return `Course "${courseTitle}" has an overall quality score of ${qualityScore}/100. Structure: ${structureScore}, Assessment: ${assessmentScore}, Student Success: ${successScore}, Engagement: ${engagementScore}, Content: ${contentScore}. Review each dimension for improvement opportunities.`
  }
}

// Derive strengths/weaknesses from scores
function deriveStrengthsAndWeaknesses(
  structureScore: number,
  assessmentScore: number,
  successScore: number,
  engagementScore: number,
  contentScore: number
): { strengths: string[]; weaknesses: string[] } {
  const dimensions = [
    { name: 'Course Structure', score: structureScore },
    { name: 'Assessment Quality', score: assessmentScore },
    { name: 'Student Success', score: successScore },
    { name: 'Student Engagement', score: engagementScore },
    { name: 'Content Quality', score: contentScore },
  ]

  const strengths = dimensions.filter((d) => d.score >= 70).map((d) => `${d.name} (${d.score}/100)`)
  const weaknesses = dimensions.filter((d) => d.score < 50).map((d) => `${d.name} (${d.score}/100)`)

  return { strengths, weaknesses }
}

// Derive recommendations from scores
function deriveRecommendations(
  structureScore: number,
  assessmentScore: number,
  successScore: number,
  engagementScore: number,
  contentScore: number
): string[] {
  const recs: string[] = []

  if (structureScore < 50) recs.push('Add more modules and organize content into clear sections')
  if (structureScore < 70) recs.push('Define learning objectives and outcomes for the course')
  if (assessmentScore < 50) recs.push('Add quizzes with diverse question types (not just MCQ)')
  if (assessmentScore < 70) recs.push('Include assignments and increase question variety')
  if (successScore < 50) recs.push('Review completion threshold and provide additional learning support')
  if (engagementScore < 50) recs.push('Add interactive content and encourage student participation')
  if (engagementScore < 70) recs.push('Improve lesson engagement with practical exercises')
  if (contentScore < 50) recs.push('Enhance course description and ensure comprehensive content coverage')
  if (contentScore < 70) recs.push('Deepen learning objectives and add more detailed lesson content')

  if (recs.length === 0) recs.push('Continue maintaining current quality standards')
  return recs.slice(0, 5)
}

// ─── Analyze a Single Course ───
async function analyzeCourse(courseId: string): Promise<Record<string, unknown> | null> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      modules: { include: { lessons: true } },
      assignments: true,
      learningOutcomes: true,
    },
  })

  if (!course) return null

  // Step 1: Structure Quality (25%)
  const structureScore = await computeStructureScore(courseId)

  // Step 2: Assessment Quality (25%)
  const assessmentScore = await computeAssessmentScore(courseId)

  // Step 3: Student Success Quality (20%)
  const successScore = await computeSuccessScore(courseId)

  // Step 4: Engagement Quality (15%)
  const engagementScore = await computeEngagementScore(courseId)

  // Step 5: Content Quality (15%) - AI assisted
  const contentScore = await computeContentScore({
    title: course.title,
    description: course.description,
    learningObjectives: course.learningObjectives,
    modules: course.modules.map((m) => ({
      lessons: m.lessons.map((l) => ({ title: l.title })),
    })),
  }, courseId)

  // Step 6: Calculate Final Score
  const qualityScore = Math.round(
    structureScore * 0.25 +
    assessmentScore * 0.25 +
    successScore * 0.20 +
    engagementScore * 0.15 +
    contentScore * 0.15
  )

  // Derive strengths, weaknesses, recommendations from computed scores
  const { strengths, weaknesses } = deriveStrengthsAndWeaknesses(
    structureScore, assessmentScore, successScore, engagementScore, contentScore
  )
  const recommendations = deriveRecommendations(
    structureScore, assessmentScore, successScore, engagementScore, contentScore
  )

  // Step 7: Generate AI Analysis Report
  const aiAnalysis = await generateAIAnalysis(
    course.title,
    structureScore,
    assessmentScore,
    successScore,
    engagementScore,
    contentScore,
    qualityScore,
    courseId
  )

  // Step 8: Upsert to database
  await db.courseQualityAnalysis.upsert({
    where: { courseId },
    create: {
      courseId,
      qualityScore,
      structureScore,
      assessmentScore,
      successScore,
      engagementScore,
      contentScore,
      strengths: JSON.stringify(strengths),
      weaknesses: JSON.stringify(weaknesses),
      recommendations: JSON.stringify(recommendations),
      aiAnalysis,
      analyzedAt: new Date(),
    },
    update: {
      qualityScore,
      structureScore,
      assessmentScore,
      successScore,
      engagementScore,
      contentScore,
      strengths: JSON.stringify(strengths),
      weaknesses: JSON.stringify(weaknesses),
      recommendations: JSON.stringify(recommendations),
      aiAnalysis,
      analyzedAt: new Date(),
    },
  })

  return {
    courseId,
    courseTitle: course.title,
    qualityScore,
    structureScore,
    assessmentScore,
    successScore,
    engagementScore,
    contentScore,
    strengths,
    weaknesses,
    recommendations,
    aiAnalysis,
  }
}

// ─── GET: List All Course Quality Analyses ───
export async function GET() {
  try {
    const analyses = await db.courseQualityAnalysis.findMany({
      include: {
        course: {
          select: {
            id: true,
            title: true,
            category: true,
            thumbnail: true,
            enrollmentCount: true,
            rating: true,
            instructor: { select: { name: true } },
          },
        },
      },
      orderBy: { qualityScore: 'asc' }, // lowest quality first (most attention needed)
    })

    // Parse JSON fields for convenience
    const parsed = analyses.map((a) => ({
      ...a,
      strengths: a.strengths ? JSON.parse(a.strengths) : [],
      weaknesses: a.weaknesses ? JSON.parse(a.weaknesses) : [],
      recommendations: a.recommendations ? JSON.parse(a.recommendations) : [],
    }))

    return NextResponse.json({ analyses: parsed, total: parsed.length })
  } catch (error) {
    console.error('[Course Quality API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course quality analyses' },
      { status: 500 }
    )
  }
}

// ─── POST: Analyze Course(s) ───
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId, analyzeAll } = body as { courseId?: string; analyzeAll?: boolean }

    let courseIds: string[] = []

    if (analyzeAll) {
      const courses = await db.course.findMany({
        where: { isPublished: true },
        select: { id: true },
      })
      courseIds = courses.map((c) => c.id)
    } else if (courseId) {
      courseIds = [courseId]
    } else {
      return NextResponse.json(
        { error: 'Provide either courseId or analyzeAll: true' },
        { status: 400 }
      )
    }

    if (courseIds.length === 0) {
      return NextResponse.json(
        { error: 'No courses found to analyze' },
        { status: 404 }
      )
    }

    // Analyze each course (limit to 10 at a time to avoid timeouts)
    const idsToAnalyze = courseIds.slice(0, 10)
    const results: Record<string, unknown>[] = []
    const errors: string[] = []

    for (const id of idsToAnalyze) {
      try {
        const result = await analyzeCourse(id)
        if (result) {
          results.push(result)
        } else {
          errors.push(`Course ${id} not found`)
        }
      } catch (err) {
        console.error(`[Course Quality API] Error analyzing course ${id}:`, err)
        errors.push(`Failed to analyze course ${id}`)
      }
    }

    return NextResponse.json({
      analyzed: results.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
      skipped: courseIds.length - idsToAnalyze.length > 0
        ? courseIds.length - idsToAnalyze.length
        : undefined,
    }, { status: 201 })
  } catch (error) {
    console.error('[Course Quality API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze courses' },
      { status: 500 }
    )
  }
}

