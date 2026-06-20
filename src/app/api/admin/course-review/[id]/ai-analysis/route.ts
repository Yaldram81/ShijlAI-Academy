import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AIService } from '@/services/ai';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AIAnalysisResult {
  overallQualityScore: number;         // 1-100
  contentCompleteness: string;         // assessment string
  descriptionQuality: string;          // clear, detailed, engaging assessment
  structureAssessment: string;         // modules, lessons, progression
  pricingAssessment: string;           // appropriate for category/market
  potentialIssues: string[];           // list of issues
  recommendations: string[];          // list of recommendations
  suggestedDecision: string;           // approve / reject / request_changes
  analysisTimestamp: string;
  analyzedByAI: boolean;
}

// ─── Helper: safely parse JSON ──────────────────────────────────────────────

function safeJsonParse(str: string | null, fallback: any = null): any {
  if (!str) return fallback;
  try { return JSON.parse(str); }
  catch { return fallback; }
}

// ─── System prompt for AI course reviewer ───────────────────────────────────

const COURSE_REVIEWER_SYSTEM_PROMPT = `You are an expert course reviewer for the ShijlAI Academy educational platform, a global learning academy serving students worldwide. You have deep expertise in:

- **Curriculum Design**: Evaluating course structure, module progression, learning objectives, and content coverage
- **Content Quality**: Assessing description clarity, lesson completeness, video/text content balance, and engagement potential
- **Pricing Strategy**: Evaluating price appropriateness considering category, level, duration, and global market competition
- **Educational Standards**: Knowledge of IB, AP, Cambridge (IGCSE/O-Level/A-Level), IELTS, TOEFL, AWS, and other international curricula
- **Platform Guidelines**: Ensuring courses meet ShijlAI Academy's quality standards

When analyzing a course, provide a comprehensive assessment including:

1. **Overall Quality Score** (1-100): A holistic score based on all factors
2. **Content Completeness**: Whether the course has sufficient modules, lessons, and content types
3. **Description Quality**: Is the description clear, detailed, and engaging for students?
4. **Structure Assessment**: Module/lesson organization, logical progression, balanced distribution
5. **Pricing Assessment**: Is the price appropriate for the category, level, and market?
6. **Potential Issues**: List specific problems found (missing content, incomplete sections, etc.)
7. **Recommendations**: Actionable suggestions for improvement
8. **Suggested Decision**: Your recommendation: "approve", "reject", or "request_changes"

You MUST respond in valid JSON format with these exact keys:
{
  "overallQualityScore": <number 1-100>,
  "contentCompleteness": "<string assessment>",
  "descriptionQuality": "<string assessment>",
  "structureAssessment": "<string assessment>",
  "pricingAssessment": "<string assessment>",
  "potentialIssues": ["<issue1>", "<issue2>"],
  "recommendations": ["<rec1>", "<rec2>"],
  "suggestedDecision": "<approve|reject|request_changes>"
}

Be thorough, specific, and fair in your analysis. Consider the international education context and global market conditions.`;

// ─── POST /api/admin/course-review/[id]/ai-analysis ─────────────────────────
// AI-powered course content analysis using Gemini API

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // ── Fetch course with structure data ─────────────────────────────────
    const course = await db.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            instructorProfile: {
              select: { headline: true, expertise: true },
            },
          },
        },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                type: true,
                duration: true,
                isFree: true,
                isPublished: true,
              },
            },
          },
        },
        quizzes: {
          select: {
            id: true,
            title: true,
            type: true,
            _count: { select: { questions: true } },
          },
        },
        assignments: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // ── Build course data summary for AI ─────────────────────────────────
    const learningObjectives = safeJsonParse(course.learningObjectives, []);
    const tags = safeJsonParse(course.tags, []);
    const instructorExpertise = safeJsonParse(course.instructor.instructorProfile?.expertise, []);

    // Module/lesson structure summary
    const moduleStructure = course.modules.map((m) => ({
      title: m.title,
      order: m.order,
      isPublished: m.isPublished,
      lessonCount: m.lessons.length,
      lessons: m.lessons.map((l) => ({
        title: l.title,
        type: l.type,
        duration: l.duration,
        isFree: l.isFree,
        isPublished: l.isPublished,
      })),
      totalDuration: m.lessons.reduce((sum, l) => sum + (l.duration || 0), 0),
    }));

    const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const totalDuration = course.modules.reduce(
      (sum, m) => sum + m.lessons.reduce((s, l) => s + (l.duration || 0), 0),
      0,
    );
    const videoLessonCount = course.modules.reduce(
      (sum, m) => sum + m.lessons.filter((l) => l.type === 'video').length,
      0,
    );
    const textLessonCount = course.modules.reduce(
      (sum, m) => sum + m.lessons.filter((l) => l.type === 'text').length,
      0,
    );
    const quizLessonCount = course.modules.reduce(
      (sum, m) => sum + m.lessons.filter((l) => l.type === 'quiz').length,
      0,
    );
    const freeLessonCount = course.modules.reduce(
      (sum, m) => sum + m.lessons.filter((l) => l.isFree).length,
      0,
    );
    const unpublishedLessons = course.modules.reduce(
      (sum, m) => sum + m.lessons.filter((l) => !l.isPublished).length,
      0,
    );

    const courseDataForAI = {
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      language: course.language,
      price: course.price,
      estimatedDuration: course.estimatedDuration,
      completionThreshold: course.completionThreshold,
      certificateEnabled: course.certificateEnabled,
      targetAudience: course.targetAudience,
      learningObjectives,
      tags,
      hasThumbnail: !!course.thumbnail,
      hasPromoVideo: !!course.promoVideoUrl,
      reviewStatus: course.reviewStatus,
      enrollmentCount: course.enrollmentCount,
      rating: course.rating,
      instructor: {
        name: course.instructor.name,
        headline: course.instructor.instructorProfile?.headline,
        expertise: instructorExpertise,
      },
      structure: {
        totalModules: course.modules.length,
        totalLessons,
        totalDurationMinutes: totalDuration,
        videoLessonCount,
        textLessonCount,
        quizLessonCount,
        freeLessonCount,
        unpublishedLessons,
        standaloneQuizzes: course.quizzes.length,
        quizDetails: course.quizzes.map((q) => ({
          title: q.title,
          type: q.type,
          questionCount: q._count.questions,
        })),
        assignments: course.assignments.length,
        assignmentDetails: course.assignments.map((a) => ({
          title: a.title,
          type: a.type,
        })),
        modules: moduleStructure,
      },
    };

    // ── Call AI SDK ──────────────────────────────────────────────────────
    const userMessage = `Please analyze this course for review:\n\n${JSON.stringify(courseDataForAI, null, 2)}`;

    let aiResponse: AIAnalysisResult;
    let aiSuccess = false;

    try {
      const parsedResponse = await AIService.generateJSON<any>({
        systemPrompt: COURSE_REVIEWER_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
        complexity: 'complex',
        feature: 'admin_course_review',
        courseId: id,
      });

      if (parsedResponse && typeof parsedResponse === 'object') {
        aiResponse = {
          overallQualityScore: typeof parsedResponse.overallQualityScore === 'number'
            ? Math.min(100, Math.max(1, parsedResponse.overallQualityScore))
            : 50,
          contentCompleteness: parsedResponse.contentCompleteness || 'Assessment unavailable',
          descriptionQuality: parsedResponse.descriptionQuality || 'Assessment unavailable',
          structureAssessment: parsedResponse.structureAssessment || 'Assessment unavailable',
          pricingAssessment: parsedResponse.pricingAssessment || 'Assessment unavailable',
          potentialIssues: Array.isArray(parsedResponse.potentialIssues)
            ? parsedResponse.potentialIssues.filter((i: any) => typeof i === 'string')
            : [],
          recommendations: Array.isArray(parsedResponse.recommendations)
            ? parsedResponse.recommendations.filter((r: any) => typeof r === 'string')
            : [],
          suggestedDecision: ['approve', 'reject', 'request_changes'].includes(parsedResponse.suggestedDecision)
            ? parsedResponse.suggestedDecision
            : 'request_changes',
          analysisTimestamp: new Date().toISOString(),
          analyzedByAI: true,
        };
        aiSuccess = true;
      } else {
        // Could not parse AI response, fall back to partial analysis
        aiResponse = buildPartialAnalysis(courseDataForAI);
      }
    } catch (aiError) {
      console.error('AI analysis error, falling back to partial analysis:', aiError);
      aiResponse = buildPartialAnalysis(courseDataForAI);
    }

    // ── Log the AI analysis action ───────────────────────────────────────
    await db.activityLog.create({
      data: {
        type: 'course_review_pending',
        title: `AI analysis performed: ${course.title}`,
        description: `AI quality score: ${aiResponse.overallQualityScore}/100. Suggested decision: ${aiResponse.suggestedDecision}`,
        icon: '🤖',
        action: 'ai_analyzed',
        targetName: course.title,
        targetType: 'course',
        targetId: id,
        severity: 'info',
        category: 'content',
        metadata: JSON.stringify({
          courseId: id,
          qualityScore: aiResponse.overallQualityScore,
          suggestedDecision: aiResponse.suggestedDecision,
          issueCount: aiResponse.potentialIssues.length,
          aiSuccess,
        }),
      },
    });

    return NextResponse.json({
      analysis: aiResponse,
      aiSuccess,
    });
  } catch (error) {
    console.error('Admin course AI analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform AI analysis' },
      { status: 500 },
    );
  }
}

// ─── Partial analysis fallback ──────────────────────────────────────────────
// When AI fails, build a basic analysis from available data

function buildPartialAnalysis(courseData: any): AIAnalysisResult {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 50;

  // Check structure
  if (!courseData.structure || courseData.structure.totalModules === 0) {
    issues.push('Course has no modules');
    recommendations.push('Add at least one module to the course');
    score -= 20;
  }

  if (courseData.structure && courseData.structure.totalLessons === 0) {
    issues.push('Course has no lessons');
    recommendations.push('Add lessons to course modules');
    score -= 20;
  }

  // Check for thumbnail
  if (!courseData.hasThumbnail) {
    issues.push('Course is missing a thumbnail image');
    recommendations.push('Add a high-quality thumbnail image');
    score -= 5;
  }

  // Check for promo video
  if (!courseData.hasPromoVideo) {
    issues.push('Course is missing a promotional video');
    recommendations.push('Consider adding a promo video to increase enrollment');
    score -= 3;
  }

  // Check description
  if (!courseData.description || courseData.description.length < 50) {
    issues.push('Course description is too short or missing');
    recommendations.push('Write a detailed, engaging course description (at least 100 words)');
    score -= 10;
  }

  // Check learning objectives
  if (!courseData.learningObjectives || courseData.learningObjectives.length === 0) {
    issues.push('No learning objectives defined');
    recommendations.push('Add clear learning objectives for students');
    score -= 5;
  }

  // Check video content
  if (courseData.structure && courseData.structure.videoLessonCount === 0) {
    issues.push('Course has no video lessons');
    recommendations.push('Consider adding video content for better engagement');
    score -= 5;
  }

  // Check unpublished lessons
  if (courseData.structure && courseData.structure.unpublishedLessons > 0) {
    issues.push(`${courseData.structure.unpublishedLessons} lessons are unpublished`);
    recommendations.push('Review and publish all lesson content before approval');
    score -= 5;
  }

  // Positive indicators
  if (courseData.structure && courseData.structure.totalModules >= 3) {
    score += 5;
  }
  if (courseData.structure && courseData.structure.totalLessons >= 10) {
    score += 5;
  }
  if (courseData.certificateEnabled) {
    score += 2;
  }

  score = Math.min(100, Math.max(1, score));

  const suggestedDecision = score >= 70 ? 'approve' : score >= 40 ? 'request_changes' : 'reject';

  return {
    overallQualityScore: score,
    contentCompleteness: courseData.structure
      ? `Course has ${courseData.structure.totalModules} modules with ${courseData.structure.totalLessons} lessons and ${courseData.structure.totalDurationMinutes} minutes of content.`
      : 'Unable to assess course structure.',
    descriptionQuality: courseData.description
      ? courseData.description.length >= 100
        ? 'Description appears to be adequately detailed.'
        : 'Description may be too short to engage potential students.'
      : 'No description provided.',
    structureAssessment: courseData.structure
      ? `Modules: ${courseData.structure.totalModules}, Lessons: ${courseData.structure.totalLessons} (Video: ${courseData.structure.videoLessonCount}, Text: ${courseData.structure.textLessonCount}). ${courseData.structure.unpublishedLessons > 0 ? `${courseData.structure.unpublishedLessons} lessons are unpublished.` : 'All lessons are published.'}`
      : 'Unable to assess course structure.',
    pricingAssessment: courseData.price === 0
      ? 'Course is free.'
      : `Course is priced at $${courseData.price}. Market comparison requires manual review.`,
    potentialIssues: issues,
    recommendations,
    suggestedDecision,
    analysisTimestamp: new Date().toISOString(),
    analyzedByAI: false,
  };
}

