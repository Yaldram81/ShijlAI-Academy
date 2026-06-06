import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BulkReviewResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

// ─── POST /api/admin/course-review/bulk ─────────────────────────────────────
// Bulk review actions on multiple courses

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseIds, action, reviewNote, adminName } = body;

    // ── Validate input ───────────────────────────────────────────────────
    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: 'courseIds array is required and must not be empty' },
        { status: 400 },
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 },
      );
    }

    // Limit bulk operations
    if (courseIds.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 courses per bulk operation' },
        { status: 400 },
      );
    }

    // ── Normalize and validate action ────────────────────────────────────
    // Accept both short names (approve, reject, etc.) and bulk_ prefixed names
    const actionAliases: Record<string, string> = {
      approve: 'bulk_approve',
      reject: 'bulk_reject',
      request_changes: 'bulk_request_changes',
      flag: 'bulk_flag',
      assign: 'bulk_assign',
      bulk_approve: 'bulk_approve',
      bulk_reject: 'bulk_reject',
      bulk_request_changes: 'bulk_request_changes',
      bulk_flag: 'bulk_flag',
      bulk_assign: 'bulk_assign',
    };

    const normalizedAction = actionAliases[action];
    if (!normalizedAction) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: approve, reject, request_changes, flag, assign (or their bulk_ prefixed equivalents)` },
        { status: 400 },
      );
    }

    // ── Fetch existing courses ───────────────────────────────────────────
    const courses = await db.course.findMany({
      where: {
        id: { in: courseIds },
        isArchived: false,
      },
      select: {
        id: true,
        title: true,
        reviewStatus: true,
        instructorId: true,
        flaggedReason: true,
      },
    });

    // Map for quick lookup
    const courseMap = new Map(courses.map((c) => [c.id, c]));
    const missingIds = courseIds.filter((cid: string) => !courseMap.has(cid));

    const result: BulkReviewResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
    };

    // Report missing courses
    for (const missingId of missingIds) {
      result.errors.push(`Course not found or archived: ${missingId}`);
    }

    const now = new Date();

    // ── Execute bulk action ──────────────────────────────────────────────
    switch (normalizedAction) {
      case 'bulk_approve': {
        for (const course of courses) {
          try {
            const previousStatus = course.reviewStatus;

            // Update course
            await db.course.update({
              where: { id: course.id },
              data: {
                isPublished: true,
                reviewStatus: 'approved',
                reviewedAt: now,
                reviewNote: reviewNote || null,
              },
            });

            // Create review history
            await db.courseReviewHistory.create({
              data: {
                courseId: course.id,
                action: 'approved',
                reviewerName: adminName || null,
                note: reviewNote || 'Bulk approved by admin',
                previousStatus,
                newStatus: 'approved',
                metadata: JSON.stringify({
                  bulkAction: true,
                  action: 'bulk_approve',
                  timestamp: now.toISOString(),
                }),
              },
            });

            // Create activity log
            await db.activityLog.create({
              data: {
                userId: course.instructorId,
                type: 'course_published',
                title: `Course bulk approved: ${course.title}`,
                description: reviewNote || `Course "${course.title}" approved via bulk action.`,
                icon: '✅',
                action: 'approved',
                targetName: course.title,
                targetType: 'course',
                targetId: course.id,
                severity: 'info',
                category: 'content',
                metadata: JSON.stringify({
                  courseId: course.id,
                  action: 'bulk_approve',
                  previousStatus,
                }),
              },
            });

            // Notify instructor
            await db.notification.create({
              data: {
                userId: course.instructorId,
                type: 'system',
                title: `Course Approved: ${course.title}`,
                content: `Your course "${course.title}" has been approved and is now published! 🎉 ${reviewNote ? `Note: ${reviewNote}` : ''}`,
                icon: '🎉',
                courseId: course.id,
              },
            });

            result.processed++;
          } catch (err) {
            result.failed++;
            result.errors.push(`Failed to approve course ${course.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
        break;
      }

      case 'bulk_reject': {
        for (const course of courses) {
          try {
            const previousStatus = course.reviewStatus;

            await db.course.update({
              where: { id: course.id },
              data: {
                reviewStatus: 'rejected',
                reviewedAt: now,
                reviewNote: reviewNote || null,
              },
            });

            await db.courseReviewHistory.create({
              data: {
                courseId: course.id,
                action: 'rejected',
                reviewerName: adminName || null,
                note: reviewNote || 'Bulk rejected by admin',
                previousStatus,
                newStatus: 'rejected',
                metadata: JSON.stringify({
                  bulkAction: true,
                  action: 'bulk_reject',
                  timestamp: now.toISOString(),
                }),
              },
            });

            await db.activityLog.create({
              data: {
                userId: course.instructorId,
                type: 'course_rejected',
                title: `Course bulk rejected: ${course.title}`,
                description: reviewNote || `Course "${course.title}" rejected via bulk action.`,
                icon: '❌',
                action: 'rejected',
                targetName: course.title,
                targetType: 'course',
                targetId: course.id,
                severity: 'warning',
                category: 'content',
                metadata: JSON.stringify({
                  courseId: course.id,
                  action: 'bulk_reject',
                  previousStatus,
                }),
              },
            });

            await db.notification.create({
              data: {
                userId: course.instructorId,
                type: 'system',
                title: `Course Not Approved: ${course.title}`,
                content: `Your course "${course.title}" was not approved. ${reviewNote ? `Reason: ${reviewNote}` : 'Please review and make necessary changes.'}`,
                icon: '❌',
                courseId: course.id,
              },
            });

            result.processed++;
          } catch (err) {
            result.failed++;
            result.errors.push(`Failed to reject course ${course.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
        break;
      }

      case 'bulk_request_changes': {
        for (const course of courses) {
          try {
            const previousStatus = course.reviewStatus;

            await db.course.update({
              where: { id: course.id },
              data: {
                reviewStatus: 'changes_requested',
                reviewedAt: now,
                reviewNote: reviewNote || null,
              },
            });

            await db.courseReviewHistory.create({
              data: {
                courseId: course.id,
                action: 'changes_requested',
                reviewerName: adminName || null,
                note: reviewNote || 'Changes requested via bulk action',
                previousStatus,
                newStatus: 'changes_requested',
                metadata: JSON.stringify({
                  bulkAction: true,
                  action: 'bulk_request_changes',
                  timestamp: now.toISOString(),
                }),
              },
            });

            await db.activityLog.create({
              data: {
                userId: course.instructorId,
                type: 'course_review_pending',
                title: `Changes requested (bulk): ${course.title}`,
                description: reviewNote || `Changes requested for course "${course.title}" via bulk action.`,
                icon: '📝',
                action: 'requested_changes',
                targetName: course.title,
                targetType: 'course',
                targetId: course.id,
                severity: 'info',
                category: 'content',
                metadata: JSON.stringify({
                  courseId: course.id,
                  action: 'bulk_request_changes',
                  previousStatus,
                }),
              },
            });

            await db.notification.create({
              data: {
                userId: course.instructorId,
                type: 'system',
                title: `Changes Requested: ${course.title}`,
                content: `Changes have been requested for your course "${course.title}". ${reviewNote ? `Note: ${reviewNote}` : 'Please review the feedback and update your course.'}`,
                icon: '📝',
                courseId: course.id,
              },
            });

            result.processed++;
          } catch (err) {
            result.failed++;
            result.errors.push(`Failed to request changes for course ${course.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
        break;
      }

      case 'bulk_flag': {
        const flagReason = reviewNote || 'Bulk flagged by admin';

        for (const course of courses) {
          try {
            const previousStatus = course.reviewStatus;

            await db.course.update({
              where: { id: course.id },
              data: {
                reviewStatus: 'flagged',
                flaggedReason: flagReason,
                reviewedAt: now,
              },
            });

            await db.courseReviewHistory.create({
              data: {
                courseId: course.id,
                action: 'flagged',
                reviewerName: adminName || null,
                note: flagReason,
                previousStatus,
                newStatus: 'flagged',
                metadata: JSON.stringify({
                  bulkAction: true,
                  action: 'bulk_flag',
                  flagReason,
                  timestamp: now.toISOString(),
                }),
              },
            });

            await db.activityLog.create({
              data: {
                userId: course.instructorId,
                type: 'course_review_pending',
                title: `Course bulk flagged: ${course.title}`,
                description: `Reason: ${flagReason}`,
                icon: '🚩',
                action: 'flagged',
                targetName: course.title,
                targetType: 'course',
                targetId: course.id,
                severity: 'warning',
                category: 'content',
                metadata: JSON.stringify({
                  courseId: course.id,
                  action: 'bulk_flag',
                  flagReason,
                  previousStatus,
                }),
              },
            });

            result.processed++;
          } catch (err) {
            result.failed++;
            result.errors.push(`Failed to flag course ${course.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
        break;
      }

      case 'bulk_assign': {
        // Assign a reviewer to all courses
        // reviewerId should be passed in reviewNote field or as a separate field
        const reviewerIdFromBody = body.reviewerId;
        if (!reviewerIdFromBody) {
          return NextResponse.json(
            { error: 'reviewerId is required for bulk_assign action' },
            { status: 400 },
          );
        }

        // Verify reviewer exists
        const reviewer = await db.user.findUnique({
          where: { id: reviewerIdFromBody },
          select: { id: true, name: true, role: true },
        });

        if (!reviewer || (reviewer.role !== 'admin' && reviewer.role !== 'instructor')) {
          return NextResponse.json(
            { error: 'Invalid reviewer ID or user is not an admin/instructor' },
            { status: 400 },
          );
        }

        for (const course of courses) {
          try {
            await db.course.update({
              where: { id: course.id },
              data: {
                reviewedBy: reviewerIdFromBody,
              },
            });

            await db.courseReviewHistory.create({
              data: {
                courseId: course.id,
                action: 'assigned',
                reviewerId: reviewerIdFromBody,
                reviewerName: adminName || reviewer.name,
                note: `Assigned to ${reviewer.name} via bulk action`,
                previousStatus: course.reviewStatus,
                newStatus: course.reviewStatus,
                metadata: JSON.stringify({
                  bulkAction: true,
                  action: 'bulk_assign',
                  reviewerId: reviewerIdFromBody,
                  reviewerName: reviewer.name,
                  timestamp: now.toISOString(),
                }),
              },
            });

            await db.activityLog.create({
              data: {
                userId: course.instructorId,
                type: 'course_review_pending',
                title: `Reviewer assigned (bulk): ${course.title}`,
                description: `Assigned to ${reviewer.name}`,
                icon: '👤',
                action: 'assigned',
                targetName: course.title,
                targetType: 'course',
                targetId: course.id,
                severity: 'info',
                category: 'content',
                metadata: JSON.stringify({
                  courseId: course.id,
                  action: 'bulk_assign',
                  reviewerId: reviewerIdFromBody,
                }),
              },
            });

            result.processed++;
          } catch (err) {
            result.failed++;
            result.errors.push(`Failed to assign reviewer for course ${course.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 },
        );
    }

    // ── Log the bulk action itself ───────────────────────────────────────
    await db.activityLog.create({
      data: {
        type: 'admin_action',
        title: `Bulk review action: ${action}`,
        description: `Admin performed bulk action "${action}" on ${courses.length} courses. ${reviewNote ? `Note: ${reviewNote}` : ''}`,
        icon: '⚡',
        action: 'bulk_action',
        targetType: 'course',
        severity: result.failed > 0 ? 'warning' : 'info',
        category: 'admin_action',
        metadata: JSON.stringify({
          action,
          totalCourses: courses.length,
          processed: result.processed,
          failed: result.failed,
          missingCount: missingIds.length,
          reviewNote: reviewNote || null,
        }),
      },
    });

    result.success = result.failed === 0;

    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin course review bulk API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk review action' },
      { status: 500 },
    );
  }
}
