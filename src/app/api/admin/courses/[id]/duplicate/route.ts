import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/admin/courses/[id]/duplicate — Duplicate/clone a course with all modules and lessons
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the source course with modules and lessons
    const originalCourse = await db.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!originalCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Create the duplicated course with reset admin fields
    const duplicatedCourse = await db.course.create({
      data: {
        // Copied fields
        title: `${originalCourse.title} (Copy)`,
        description: originalCourse.description,
        category: originalCourse.category,
        level: originalCourse.level,
        language: originalCourse.language,
        thumbnail: originalCourse.thumbnail,
        price: originalCourse.price,
        estimatedDuration: originalCourse.estimatedDuration,
        certificateEnabled: originalCourse.certificateEnabled,
        completionThreshold: originalCourse.completionThreshold,
        learningObjectives: originalCourse.learningObjectives,
        prerequisites: originalCourse.prerequisites,
        targetAudience: originalCourse.targetAudience,
        tags: originalCourse.tags,
        promoVideoUrl: originalCourse.promoVideoUrl,
        instructorId: originalCourse.instructorId,

        // Reset fields
        isPublished: false,
        isArchived: false,
        enrollmentCount: 0,
        rating: 0,
        reviewStatus: 'draft',
        featured: false,
        staffPick: false,
        overridePrice: null,
        overridePriceUntil: null,
        ageRestriction: 'none',
        regionRestricted: false,
        flaggedReason: null,
        adminNotes: null,
        submittedForReviewAt: null,
        reviewedAt: null,
        reviewedBy: null,
        reviewNote: null,
        reviewChecklist: null,

        // Duplicate modules with their lessons
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
      },
      include: {
        modules: {
          include: { lessons: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    // Create ActivityLog entry for the duplication
    await db.activityLog.create({
      data: {
        type: 'course_published',
        title: `Course duplicated: ${originalCourse.title}`,
        description: `Course "${originalCourse.title}" was duplicated to create "${duplicatedCourse.title}". ${duplicatedCourse.modules.length} modules and ${duplicatedCourse.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons were copied.`,
        icon: '📋',
        action: 'created',
        targetName: originalCourse.title,
        targetType: 'course',
        targetId: duplicatedCourse.id,
        metadata: JSON.stringify({
          originalCourseId: originalCourse.id,
          newCourseId: duplicatedCourse.id,
          modulesCopied: duplicatedCourse.modules.length,
          lessonsCopied: duplicatedCourse.modules.reduce((acc, m) => acc + m.lessons.length, 0),
        }),
        severity: 'info',
        category: 'content',
      },
    });

    return NextResponse.json(
      {
        course: duplicatedCourse,
        message: 'Course duplicated successfully',
        stats: {
          modulesCopied: duplicatedCourse.modules.length,
          lessonsCopied: duplicatedCourse.modules.reduce((acc, m) => acc + m.lessons.length, 0),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin course duplicate API error:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate course' },
      { status: 500 }
    );
  }
}
