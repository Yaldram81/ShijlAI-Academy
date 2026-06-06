import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/admin/courses/bulk — Bulk actions on selected courses
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseIds, action } = body;

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: 'courseIds must be a non-empty array of course IDs' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const validActions = ['publish', 'unpublish', 'archive', 'unarchive', 'feature', 'unfeature', 'delete'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify courses exist
    const existingCourses = await db.course.findMany({
      where: { id: { in: courseIds } },
      include: {
        modules: {
          select: {
            _count: {
              select: { lessons: true },
            },
          },
        },
      },
    });

    if (existingCourses.length === 0) {
      return NextResponse.json(
        { error: 'No valid courses found with provided IDs' },
        { status: 404 }
      );
    }

    // Validate content for publish action: courses must have at least 1 module with 1 lesson
    if (action === 'publish') {
      const invalidCourses = existingCourses.filter((c) => {
        const totalLessons = c.modules.reduce((sum, m) => sum + m._count.lessons, 0);
        return totalLessons === 0;
      });
      if (invalidCourses.length > 0) {
        const names = invalidCourses.map((c) => c.title || c.id).join(', ');
        return NextResponse.json(
          { error: `Cannot publish courses without content. The following courses have no lessons: ${names}` },
          { status: 400 }
        );
      }
    }

    const validIds = existingCourses.map((c) => c.id);

    let affected = 0;

    switch (action) {
      case 'publish': {
        affected = await db.course.updateMany({
          where: { id: { in: validIds } },
          data: {
            isPublished: true,
            reviewStatus: 'approved',
          },
        });
        break;
      }

      case 'unpublish': {
        affected = await db.course.updateMany({
          where: { id: { in: validIds } },
          data: {
            isPublished: false,
            reviewStatus: 'draft',
          },
        });
        break;
      }

      case 'archive': {
        affected = await db.course.updateMany({
          where: { id: { in: validIds } },
          data: { isArchived: true },
        });
        break;
      }

      case 'unarchive': {
        affected = await db.course.updateMany({
          where: { id: { in: validIds } },
          data: { isArchived: false },
        });
        break;
      }

      case 'feature': {
        affected = await db.course.updateMany({
          where: { id: { in: validIds } },
          data: { featured: true },
        });
        break;
      }

      case 'unfeature': {
        affected = await db.course.updateMany({
          where: { id: { in: validIds } },
          data: { featured: false },
        });
        break;
      }

      case 'delete': {
        affected = await db.course.deleteMany({
          where: { id: { in: validIds } },
        });
        break;
      }
    }

    // Log activity for bulk action
    const actionLabels: Record<string, string> = {
      publish: 'published',
      unpublish: 'unpublished',
      archive: 'archived',
      unarchive: 'unarchived',
      feature: 'featured',
      unfeature: 'unfeatured',
      delete: 'deleted',
    };

    await db.activityLog.create({
      data: {
        type: 'course_published',
        title: `Bulk ${actionLabels[action]} courses`,
        description: `${affected.count} course(s) were ${actionLabels[action]} via bulk action.`,
        icon: '📦',
        metadata: JSON.stringify({
          action,
          courseIds: validIds,
          affectedCount: affected.count,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      affected: affected.count,
      action,
      message: `${affected.count} course(s) ${actionLabels[action]} successfully`,
    });
  } catch (error) {
    console.error('Admin courses bulk API error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk action' },
      { status: 500 }
    );
  }
}
