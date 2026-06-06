import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH /api/admin/courses/[id]/flag — Flag or unflag a course
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reason, adminName } = body;

    if (!action || !['flag', 'unflag'].includes(action)) {
      return NextResponse.json(
        { error: 'Action is required and must be "flag" or "unflag"' },
        { status: 400 }
      );
    }

    if (action === 'flag' && (!reason || typeof reason !== 'string' || reason.trim() === '')) {
      return NextResponse.json(
        { error: 'Reason is required when flagging a course' },
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
        isPublished: true,
        adminNotes: true,
      },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const adminDisplayName = adminName || 'Admin';

    // Parse existing adminNotes
    let adminNotes: Array<{ note: string; adminName: string; date: string }> = [];
    if (existingCourse.adminNotes) {
      try {
        adminNotes = JSON.parse(existingCourse.adminNotes);
      } catch {
        adminNotes = [];
      }
    }

    if (action === 'flag') {
      // Add admin note about flagging
      adminNotes.push({
        note: `Course flagged: ${reason}`,
        adminName: adminDisplayName,
        date: now.toISOString(),
      });

      const course = await db.course.update({
        where: { id },
        data: {
          reviewStatus: 'flagged',
          flaggedReason: reason,
          adminNotes: JSON.stringify(adminNotes),
        },
      });

      // Create ActivityLog entry
      await db.activityLog.create({
        data: {
          type: 'content_removed',
          title: `Course flagged: ${existingCourse.title}`,
          description: `Course "${existingCourse.title}" was flagged by ${adminDisplayName}. Reason: ${reason}`,
          icon: '🚩',
          action: 'updated',
          targetName: existingCourse.title,
          targetType: 'course',
          targetId: id,
          metadata: JSON.stringify({
            action: 'flag',
            reason,
            previousStatus: existingCourse.reviewStatus,
            flaggedBy: adminDisplayName,
          }),
          severity: 'warning',
          category: 'content',
        },
      });

      return NextResponse.json({
        course,
        message: 'Course flagged successfully',
      });
    }

    if (action === 'unflag') {
      // Determine the new review status after unflagging
      // If the course was previously published, set back to 'approved'; otherwise 'draft'
      const newReviewStatus = existingCourse.isPublished ? 'approved' : 'draft';

      // Add admin note about unflagging
      adminNotes.push({
        note: `Course unflagged. Previous flag reason: ${existingCourse.reviewStatus === 'flagged' ? 'see history' : 'N/A'}. Restored to "${newReviewStatus}" status.`,
        adminName: adminDisplayName,
        date: now.toISOString(),
      });

      const course = await db.course.update({
        where: { id },
        data: {
          reviewStatus: newReviewStatus,
          flaggedReason: null,
          adminNotes: JSON.stringify(adminNotes),
        },
      });

      // Create ActivityLog entry
      await db.activityLog.create({
        data: {
          type: 'course_published',
          title: `Course unflagged: ${existingCourse.title}`,
          description: `Course "${existingCourse.title}" was unflagged by ${adminDisplayName}. Status restored to "${newReviewStatus}".`,
          icon: '✅',
          action: 'updated',
          targetName: existingCourse.title,
          targetType: 'course',
          targetId: id,
          metadata: JSON.stringify({
            action: 'unflag',
            newStatus: newReviewStatus,
            previousFlaggedReason: existingCourse.reviewStatus === 'flagged' ? 'flagged' : 'unknown',
            unflaggedBy: adminDisplayName,
          }),
          severity: 'info',
          category: 'content',
        },
      });

      return NextResponse.json({
        course,
        message: 'Course unflagged successfully',
      });
    }

    // This should not be reached due to the validation above, but kept for type safety
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin course flag API error:', error);
    return NextResponse.json(
      { error: 'Failed to update course flag status' },
      { status: 500 }
    );
  }
}
