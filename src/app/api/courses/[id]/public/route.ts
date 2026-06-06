import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const course = await db.course.findUnique({
      where: { id, isPublished: true },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
            _count: {
              select: {
                coursesCreated: true,
              },
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
                description: true,
                type: true,
                duration: true,
                order: true,
                // content is excluded by default — only included for free preview
                videoUrl: true,
                moduleId: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            modules: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Calculate total duration
    const totalMinutes = course.modules.reduce(
      (acc, mod) => acc + mod.lessons.reduce((a, l) => a + l.duration, 0),
      0
    );

    const totalLessons = course.modules.reduce(
      (acc, mod) => acc + mod.lessons.length,
      0
    );

    // Calculate instructor stats
    const instructorEnrollments = await db.enrollment.count({
      where: {
        course: { instructorId: course.instructorId },
      },
    });

    const instructorRating = await db.course.aggregate({
      where: { instructorId: course.instructorId, isPublished: true },
      _avg: { rating: true },
    });

    // Get the first lesson's content for free preview
    let freePreviewLesson = null;
    const firstModule = course.modules[0];
    if (firstModule && firstModule.lessons.length > 0) {
      const firstLesson = firstModule.lessons[0];
      const fullLesson = await db.lesson.findUnique({
        where: { id: firstLesson.id },
        select: { content: true },
      });
      freePreviewLesson = {
        id: firstLesson.id,
        title: firstLesson.title,
        content: fullLesson?.content || '',
      };
    }

    // Serialize dates
    const serializedCourse = {
      ...course,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      modules: course.modules.map((mod) => ({
        ...mod,
        createdAt: mod.createdAt.toISOString(),
        updatedAt: mod.updatedAt.toISOString(),
        lessons: mod.lessons.map((lesson) => ({
          ...lesson,
          createdAt: lesson.createdAt.toISOString(),
          updatedAt: lesson.updatedAt.toISOString(),
        })),
      })),
      totalMinutes,
      totalLessons,
      instructorStats: {
        coursesCreated: course.instructor._count.coursesCreated,
        totalStudents: instructorEnrollments,
        averageRating: instructorRating._avg.rating
          ? Math.round(instructorRating._avg.rating * 10) / 10
          : 0,
      },
      freePreviewLesson,
    };

    return NextResponse.json({ course: serializedCourse });
  } catch (error) {
    console.error('Error fetching public course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}
