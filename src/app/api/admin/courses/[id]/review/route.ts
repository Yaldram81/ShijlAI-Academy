import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT /api/admin/courses/[id]/review — Review actions (approve, reject, request_changes)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reviewNote, checklist, reviewerId } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required (approve, reject, or request_changes)' },
        { status: 400 }
      );
    }

    // Verify course exists
    const existingCourse = await db.course.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        reviewStatus: true,
        instructorId: true,
      },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get reviewer ID from request body (trusted) instead of untrusted headers
    const reviewedBy = reviewerId || 'system';
    const now = new Date();

    if (action === 'approve') {
      const course = await db.course.update({
        where: { id },
        data: {
          isPublished: true,
          reviewStatus: 'approved',
          reviewedAt: now,
          reviewedBy,
          reviewNote: reviewNote || null,
        },
      });

      // Create ActivityLog entry
      await db.activityLog.create({
        data: {
          type: 'course_published',
          title: `Course approved: ${existingCourse.title}`,
          description: reviewNote || `Course "${existingCourse.title}" has been approved and published by admin.`,
          icon: '✅',
          metadata: JSON.stringify({
            courseId: id,
            action: 'approve',
            previousStatus: existingCourse.reviewStatus,
          }),
        },
      });

      return NextResponse.json({
        course,
        message: 'Course approved and published successfully',
      });
    }

    if (action === 'reject') {
      const course = await db.course.update({
        where: { id },
        data: {
          reviewStatus: 'rejected',
          reviewNote: reviewNote || null,
          reviewedAt: now,
          reviewedBy,
        },
      });

      // Create ActivityLog entry
      await db.activityLog.create({
        data: {
          type: 'course_published',
          title: `Course rejected: ${existingCourse.title}`,
          description: reviewNote || `Course "${existingCourse.title}" has been rejected.`,
          icon: '❌',
          metadata: JSON.stringify({
            courseId: id,
            action: 'reject',
            previousStatus: existingCourse.reviewStatus,
          }),
        },
      });

      return NextResponse.json({
        course,
        message: 'Course rejected',
      });
    }

    if (action === 'request_changes') {
      const updateData: Record<string, unknown> = {
        reviewStatus: 'changes_requested',
        reviewNote: reviewNote || null,
        reviewedAt: now,
        reviewedBy,
      };

      // Update reviewChecklist if provided
      if (checklist) {
        updateData.reviewChecklist = JSON.stringify(checklist);
      }

      const course = await db.course.update({
        where: { id },
        data: updateData,
      });

      // Create ActivityLog entry
      await db.activityLog.create({
        data: {
          type: 'course_review_pending',
          title: `Changes requested: ${existingCourse.title}`,
          description: reviewNote || `Changes have been requested for course "${existingCourse.title}".`,
          icon: '📝',
          metadata: JSON.stringify({
            courseId: id,
            action: 'request_changes',
            previousStatus: existingCourse.reviewStatus,
            hasChecklist: !!checklist,
          }),
        },
      });

      return NextResponse.json({
        course,
        message: 'Changes requested successfully',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Must be: approve, reject, or request_changes' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin course review API error:', error);
    return NextResponse.json(
      { error: 'Failed to process review action' },
      { status: 500 }
    );
  }
}
