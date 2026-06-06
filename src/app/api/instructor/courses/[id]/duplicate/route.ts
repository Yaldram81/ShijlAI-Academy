import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/instructor/courses/[id]/duplicate - Duplicate a course with all modules, lessons, and assignments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    const originalCourse = await db.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            lessons: true,
          },
          orderBy: { order: 'asc' },
        },
        assignments: {
          orderBy: { order: 'asc' },
        },
        quizzes: {
          include: {
            questions: { orderBy: { order: 'asc' } },
          },
        },
      },
    })

    if (!originalCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Verify ownership
    if (!instructorId || originalCourse.instructorId !== instructorId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Create the duplicated course
    const duplicatedCourse = await db.course.create({
      data: {
        title: `${originalCourse.title} (Copy)`,
        description: originalCourse.description,
        category: originalCourse.category,
        level: originalCourse.level,
        language: originalCourse.language,
        thumbnail: originalCourse.thumbnail,
        price: originalCourse.price,
        isPublished: false, // Always start as draft
        isArchived: false,
        enrollmentCount: 0,
        rating: 0,
        learningObjectives: originalCourse.learningObjectives,
        prerequisites: originalCourse.prerequisites,
        targetAudience: originalCourse.targetAudience,
        tags: originalCourse.tags,
        estimatedDuration: originalCourse.estimatedDuration,
        certificateEnabled: originalCourse.certificateEnabled,
        completionThreshold: originalCourse.completionThreshold,
        instructorId: originalCourse.instructorId,
        modules: {
          create: originalCourse.modules.map((module_) => ({
            title: module_.title,
            description: module_.description,
            order: module_.order,
            learningObjectives: module_.learningObjectives,
            isPublished: false,
            lessons: {
              create: module_.lessons.map((lesson) => ({
                title: lesson.title,
                description: lesson.description,
                content: lesson.content,
                type: lesson.type,
                videoUrl: lesson.videoUrl,
                duration: lesson.duration,
                order: lesson.order,
                resources: lesson.resources,
                objectives: lesson.objectives,
                isFree: lesson.isFree,
                isPublished: lesson.isPublished,
                transcript: lesson.transcript,
                slideUrl: lesson.slideUrl,
              })),
            },
          })),
        },
        assignments: {
          create: originalCourse.assignments.map((assignment) => ({
            title: assignment.title,
            description: assignment.description,
            instructions: assignment.instructions,
            type: assignment.type,
            maxScore: assignment.maxScore,
            dueDate: assignment.dueDate,
            rubric: assignment.rubric,
            resources: assignment.resources,
            submissionType: assignment.submissionType,
            wordLimit: assignment.wordLimit,
            isPublished: assignment.isPublished,
            order: assignment.order,
          })),
        },
        quizzes: {
          create: originalCourse.quizzes.map((quiz) => ({
            title: quiz.title,
            description: quiz.description,
            type: quiz.type,
            timeLimit: quiz.timeLimit,
            passingScore: quiz.passingScore,
            maxAttempts: quiz.maxAttempts,
            isPublished: false,
            questions: {
              create: quiz.questions.map((question) => ({
                text: question.text,
                type: question.type,
                options: question.options,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation,
                points: question.points,
                order: question.order,
              })),
            },
          })),
        },
      },
      include: {
        modules: {
          include: { lessons: true },
          orderBy: { order: 'asc' },
        },
        assignments: { orderBy: { order: 'asc' } },
        quizzes: {
          include: { questions: { orderBy: { order: 'asc' } } },
        },
      },
    })

    return NextResponse.json(
      {
        course: duplicatedCourse,
        message: 'Course duplicated successfully',
        stats: {
          modulesCopied: duplicatedCourse.modules.length,
          lessonsCopied: duplicatedCourse.modules.reduce((acc, m) => acc + m.lessons.length, 0),
          assignmentsCopied: duplicatedCourse.assignments.length,
          quizzesCopied: duplicatedCourse.quizzes.length,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error duplicating course:', error)
    return NextResponse.json({ error: 'Failed to duplicate course' }, { status: 500 })
  }
}
