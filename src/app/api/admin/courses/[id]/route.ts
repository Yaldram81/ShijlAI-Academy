import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/courses/[id] — Get course detail for admin
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const course = await db.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
            instructorProfile: {
              select: {
                headline: true,
                expertise: true,
                applicationStatus: true,
              },
            },
          },
        },
        modules: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                type: true,
                duration: true,
                order: true,
                isPublished: true,
                isFree: true,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
            quizzes: true,
            assignments: true,
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

    // Fetch extra data in parallel
    const [recentReviews, recentEnrollments, revenueData, progressData, completionCount] = await Promise.all([
      db.review.findMany({
        where: { courseId: id },
        select: {
          id: true,
          rating: true,
          content: true,
          isAnonymous: true,
          createdAt: true,
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      db.enrollment.findMany({
        where: { courseId: id },
        select: {
          id: true,
          progress: true,
          status: true,
          enrolledAt: true,
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { enrolledAt: 'desc' },
        take: 10,
      }),
      db.transaction.aggregate({
        where: { courseId: id, type: 'enrollment', status: 'completed' },
        _sum: { amount: true, platformFee: true, instructorEarning: true },
        _count: true,
      }),
      db.enrollment.aggregate({
        where: { courseId: id },
        _avg: { progress: true },
        _count: { status: true },
      }),
      db.enrollment.count({
        where: { courseId: id, status: 'completed' },
      }),
    ]);

    // Parse JSON fields
    let reviewChecklist = null;
    if (course.reviewChecklist) {
      try {
        reviewChecklist = JSON.parse(course.reviewChecklist);
      } catch {
        reviewChecklist = null;
      }
    }

    let adminNotes: Array<{ note: string; adminName: string; date: string }> = [];
    if (course.adminNotes) {
      try {
        adminNotes = JSON.parse(course.adminNotes);
      } catch {
        adminNotes = [];
      }
    }

    let learningObjectives: string[] = [];
    if (course.learningObjectives) {
      try {
        learningObjectives = JSON.parse(course.learningObjectives);
      } catch {
        learningObjectives = [];
      }
    }

    let prerequisites: string[] = [];
    if (course.prerequisites) {
      try {
        prerequisites = JSON.parse(course.prerequisites);
      } catch {
        prerequisites = [];
      }
    }

    let tags: string[] = [];
    if (course.tags) {
      try {
        tags = JSON.parse(course.tags);
      } catch {
        tags = [];
      }
    }

    // Compute total duration and lesson count from modules
    let totalDuration = 0;
    let totalLessons = 0;
    for (const courseModule of course.modules) {
      for (const lesson of courseModule.lessons) {
        totalDuration += lesson.duration || 0;
        totalLessons += 1;
      }
    }

    return NextResponse.json({
      ...course,
      reviewChecklist,
      adminNotes,
      learningObjectives,
      prerequisites,
      tags,
      totalDuration,
      totalLessons,
      recentReviews,
      recentEnrollments,
      revenue: {
        total: revenueData._sum.amount || 0,
        platformFee: revenueData._sum.platformFee || 0,
        instructorEarning: revenueData._sum.instructorEarning || 0,
        transactionCount: revenueData._count,
      },
      analytics: {
        avgProgress: Math.round((progressData._avg.progress || 0) * 10) / 10,
        totalEnrollments: progressData._count.status ?? 0,
        completedEnrollments: completionCount,
        completionRate: (progressData._count.status ?? 0) > 0
          ? Math.round((completionCount / (progressData._count.status ?? 1)) * 1000) / 10
          : 0,
      },
    });
  } catch (error) {
    console.error('Admin course detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/courses/[id] — Update course admin overrides
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // Verify course exists
    const existingCourse = await db.course.findUnique({ where: { id } });
    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    if (action === 'update_overrides') {
      const {
        featured,
        staffPick,
        overridePrice,
        overridePriceUntil,
        ageRestriction,
        regionRestricted,
      } = body;

      const updateData: Record<string, unknown> = {};

      if (featured !== undefined) updateData.featured = Boolean(featured);
      if (staffPick !== undefined) updateData.staffPick = Boolean(staffPick);
      if (overridePrice !== undefined) {
        updateData.overridePrice = overridePrice === null ? null : parseFloat(String(overridePrice));
      }
      if (overridePriceUntil !== undefined) {
        updateData.overridePriceUntil = overridePriceUntil ? new Date(overridePriceUntil) : null;
      }
      if (ageRestriction !== undefined) {
        const validRestrictions = ['none', '13+', '18+'];
        if (!validRestrictions.includes(ageRestriction)) {
          return NextResponse.json(
            { error: 'Invalid age restriction value. Must be: none, 13+, 18+' },
            { status: 400 }
          );
        }
        updateData.ageRestriction = ageRestriction;
      }
      if (regionRestricted !== undefined) updateData.regionRestricted = Boolean(regionRestricted);

      const course = await db.course.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({ course, message: 'Overrides updated successfully' });
    }

    if (action === 'update_status') {
      const { status } = body;

      if (!status) {
        return NextResponse.json(
          { error: 'Status action is required' },
          { status: 400 }
        );
      }

      const updateData: Record<string, unknown> = {};

      switch (status) {
        case 'unpublish':
          updateData.isPublished = false;
          updateData.reviewStatus = 'draft';
          break;
        case 'archive':
          updateData.isArchived = true;
          break;
        case 'unarchive':
          updateData.isArchived = false;
          break;
        case 'delete':
          await db.course.delete({ where: { id } });
          return NextResponse.json({ message: 'Course deleted successfully' });
        case 'publish':
          updateData.isPublished = true;
          updateData.reviewStatus = 'approved';
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid status action. Must be: unpublish, archive, unarchive, delete, publish' },
            { status: 400 }
          );
      }

      const course = await db.course.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({ course, message: `Course ${status} action completed` });
    }

    if (action === 'update_checklist') {
      const { checklist } = body;

      if (!checklist || typeof checklist !== 'object') {
        return NextResponse.json(
          { error: 'Checklist object is required' },
          { status: 400 }
        );
      }

      const course = await db.course.update({
        where: { id },
        data: { reviewChecklist: JSON.stringify(checklist) },
      });

      // Log activity
      await db.activityLog.create({
        data: {
          type: 'course_review_pending',
          title: `Review checklist updated: ${existingCourse.title}`,
          description: `Admin updated the review checklist for course "${existingCourse.title}".`,
          icon: '📋',
          metadata: JSON.stringify({ courseId: id, action: 'update_checklist' }),
          action: 'updated',
          targetType: 'course',
          targetId: id,
          targetName: existingCourse.title,
          severity: 'info',
          category: 'content',
        },
      });

      return NextResponse.json({ course, message: 'Checklist updated successfully' });
    }

    if (action === 'add_note') {
      const { note, adminName } = body;

      if (!note) {
        return NextResponse.json(
          { error: 'Note text is required' },
          { status: 400 }
        );
      }

      // Parse existing adminNotes or start new array
      let adminNotes: Array<{ note: string; adminName: string; date: string }> = [];
      if (existingCourse.adminNotes) {
        try {
          adminNotes = JSON.parse(existingCourse.adminNotes);
        } catch {
          adminNotes = [];
        }
      }

      // Append new note
      adminNotes.push({
        note,
        adminName: adminName || 'Admin',
        date: new Date().toISOString(),
      });

      const course = await db.course.update({
        where: { id },
        data: { adminNotes: JSON.stringify(adminNotes) },
      });

      return NextResponse.json({ course, message: 'Note added successfully' });
    }

    return NextResponse.json(
      { error: 'Invalid action. Must be: update_overrides, update_status, update_checklist, or add_note' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin course update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}
