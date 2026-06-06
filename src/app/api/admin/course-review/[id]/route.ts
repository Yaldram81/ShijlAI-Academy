import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Types ──────────────────────────────────────────────────────────────────

interface QualityMetrics {
  totalDuration: number;       // total minutes of all lessons
  totalLessons: number;
  videoLessonCount: number;
  textLessonCount: number;
  quizCount: number;
  assignmentCount: number;
  hasPromoVideo: boolean;
  hasThumbnail: boolean;
  completionRate: number;      // percentage of enrollments with status 'completed'
  avgRating: number;
}

interface ModulePreview {
  id: string;
  title: string;
  description: string | null;
  order: number;
  isPublished: boolean;
  lessons: Array<{
    id: string;
    title: string;
    description: string | null;
    type: string;
    videoUrl: string | null;
    duration: number;
    order: number;
    isFree: boolean;
    isPublished: boolean;
  }>;
}

// ─── Helper: safely parse JSON ──────────────────────────────────────────────

function safeJsonParse(str: string | null, fallback: any = null): any {
  if (!str) return fallback;
  try { return JSON.parse(str); }
  catch { return fallback; }
}

// ─── GET /api/admin/course-review/[id] ──────────────────────────────────────
// Full course review detail with all data needed for review

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // ── Fetch course with all relations ──────────────────────────────────
    const course = await db.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
            bio: true,
            status: true,
            isVerified: true,
            lastActiveAt: true,
            createdAt: true,
            instructorProfile: {
              select: {
                headline: true,
                expertise: true,
                ntn: true,
                ntnVerified: true,
                applicationStatus: true,
              },
            },
            _count: {
              select: { coursesCreated: true },
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
                videoUrl: true,
                duration: true,
                order: true,
                isFree: true,
                isPublished: true,
                content: true,
                transcript: true,
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
            maxScore: true,
          },
        },
        reviewHistory: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            reviewerId: true,
            reviewerName: true,
            note: true,
            checklist: true,
            previousStatus: true,
            newStatus: true,
            metadata: true,
            createdAt: true,
          },
        },
        reviews: {
          where: { isFlagged: false, moderationStatus: { not: 'removed' } },
          orderBy: { createdAt: 'desc' },
          take: 10,
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
        },
        _count: {
          select: {
            modules: true,
            enrollments: true,
            reviews: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // ── Compute quality metrics ──────────────────────────────────────────
    let totalDuration = 0;
    let totalLessons = 0;
    let videoLessonCount = 0;
    let textLessonCount = 0;

    for (const courseModule of course.modules) {
      for (const lesson of courseModule.lessons) {
        totalLessons++;
        totalDuration += lesson.duration || 0;
        if (lesson.type === 'video') videoLessonCount++;
        if (lesson.type === 'text') textLessonCount++;
      }
    }

    const quizCount = course.quizzes.length;
    const assignmentCount = course.assignments.length;
    const hasPromoVideo = !!course.promoVideoUrl;
    const hasThumbnail = !!course.thumbnail;

    // Completion rate
    const completedEnrollments = await db.enrollment.count({
      where: { courseId: id, status: 'completed' },
    });
    const totalEnrollments = course._count.enrollments || 1;
    const completionRate = Math.round((completedEnrollments / totalEnrollments) * 1000) / 10;

    const qualityMetrics: QualityMetrics = {
      totalDuration,
      totalLessons,
      videoLessonCount,
      textLessonCount,
      quizCount,
      assignmentCount,
      hasPromoVideo,
      hasThumbnail,
      completionRate,
      avgRating: Math.round(course.rating * 10) / 10,
    };

    // ── Parse JSON fields ────────────────────────────────────────────────
    const reviewChecklist = safeJsonParse(course.reviewChecklist, {});
    const adminNotes = safeJsonParse(course.adminNotes, []);
    const learningObjectives = safeJsonParse(course.learningObjectives, []);
    const tags = safeJsonParse(course.tags, []);
    const prerequisites = safeJsonParse(course.prerequisites, []);
    const instructorExpertise = safeJsonParse(course.instructor.instructorProfile?.expertise, []);

    // ── Build module previews ────────────────────────────────────────────
    const modulePreviews: ModulePreview[] = course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      order: m.order,
      isPublished: m.isPublished,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        type: l.type,
        videoUrl: l.videoUrl,
        duration: l.duration,
        order: l.order,
        isFree: l.isFree,
        isPublished: l.isPublished,
      })),
    }));

    // ── Build full response ──────────────────────────────────────────────
    return NextResponse.json({
      course: {
        // Basic info
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        language: course.language,
        thumbnail: course.thumbnail,
        price: course.price,
        isPublished: course.isPublished,
        isArchived: course.isArchived,
        enrollmentCount: course.enrollmentCount,
        rating: course.rating,
        estimatedDuration: course.estimatedDuration,
        certificateEnabled: course.certificateEnabled,
        completionThreshold: course.completionThreshold,
        targetAudience: course.targetAudience,
        promoVideoUrl: course.promoVideoUrl,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),

        // Parsed JSON fields
        learningObjectives,
        prerequisites,
        tags,

        // Admin management fields
        reviewStatus: course.reviewStatus,
        reviewNote: course.reviewNote,
        reviewChecklist,
        featured: course.featured,
        staffPick: course.staffPick,
        overridePrice: course.overridePrice,
        overridePriceUntil: course.overridePriceUntil?.toISOString() ?? null,
        ageRestriction: course.ageRestriction,
        regionRestricted: course.regionRestricted,
        flaggedReason: course.flaggedReason,
        adminNotes,
        submittedForReviewAt: course.submittedForReviewAt?.toISOString() ?? null,
        reviewedAt: course.reviewedAt?.toISOString() ?? null,
        reviewedBy: course.reviewedBy,

        // Instructor details
        instructor: {
          id: course.instructor.id,
          name: course.instructor.name,
          avatar: course.instructor.avatar,
          email: course.instructor.email,
          bio: course.instructor.bio,
          status: course.instructor.status,
          isVerified: course.instructor.isVerified,
          lastActiveAt: course.instructor.lastActiveAt?.toISOString() ?? null,
          createdAt: course.instructor.createdAt.toISOString(),
          totalCourses: course.instructor._count.coursesCreated,
          instructorProfile: course.instructor.instructorProfile
            ? {
                headline: course.instructor.instructorProfile.headline,
                expertise: instructorExpertise,
                ntn: course.instructor.instructorProfile.ntn,
                ntnVerified: course.instructor.instructorProfile.ntnVerified,
                applicationStatus: course.instructor.instructorProfile.applicationStatus,
              }
            : null,
        },

        // Modules with lessons for content preview
        modules: modulePreviews,

        // Quizzes
        quizzes: course.quizzes.map((q) => ({
          id: q.id,
          title: q.title,
          type: q.type,
          questionCount: q._count.questions,
        })),

        // Assignments
        assignments: course.assignments.map((a) => ({
          id: a.id,
          title: a.title,
          type: a.type,
          maxScore: a.maxScore,
        })),

        // Review history (all entries, ordered by createdAt desc)
        reviewHistory: course.reviewHistory.map((h) => ({
          id: h.id,
          action: h.action,
          reviewerId: h.reviewerId,
          reviewerName: h.reviewerName,
          note: h.note,
          checklist: safeJsonParse(h.checklist, null),
          previousStatus: h.previousStatus,
          newStatus: h.newStatus,
          metadata: safeJsonParse(h.metadata, null),
          createdAt: h.createdAt.toISOString(),
        })),

        // Recent student reviews
        recentReviews: course.reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          content: r.content,
          isAnonymous: r.isAnonymous,
          createdAt: r.createdAt.toISOString(),
          user: r.isAnonymous
            ? null
            : {
                id: r.user.id,
                name: r.user.name,
                avatar: r.user.avatar,
              },
        })),

        // Counts
        _count: course._count,

        // Quality metrics
        qualityMetrics,
      },
    });
  } catch (error) {
    console.error('Admin course review detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course review details' },
      { status: 500 },
    );
  }
}

// ─── PATCH /api/admin/course-review/[id] ────────────────────────────────────
// Review actions: approve, reject, request_changes, flag, unflag,
// assign_reviewer, escalate, add_note, update_checklist

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      action,
      reviewNote,
      checklist,
      adminName,
      flagReason,
      reviewerId,
    } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 },
      );
    }

    // ── Fetch course ─────────────────────────────────────────────────────
    const course = await db.course.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        reviewStatus: true,
        reviewChecklist: true,
        adminNotes: true,
        instructorId: true,
        flaggedReason: true,
        reviewedBy: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const now = new Date();
    const previousStatus = course.reviewStatus;
    let updateData: Record<string, any> = {};
    let historyAction = action;
    let historyNote = reviewNote || null;
    let newStatus: string | null = null;
    let logType = 'course_review_pending';
    let logTitle = '';
    let logDescription = '';
    let logIcon = '📋';
    let logSeverity: string = 'info';
    let logAction = 'updated';
    let logCategory: string = 'content';

    switch (action) {
      // ── Approve ────────────────────────────────────────────────────────
      case 'approve': {
        updateData = {
          isPublished: true,
          reviewStatus: 'approved',
          reviewedAt: now,
          reviewedBy: reviewerId || null,
          reviewNote: reviewNote || null,
        };
        newStatus = 'approved';
        logType = 'course_published';
        logTitle = `Course approved: ${course.title}`;
        logDescription = reviewNote || `Course "${course.title}" approved and published by admin.`;
        logIcon = '✅';
        logAction = 'approved';
        break;
      }

      // ── Reject ─────────────────────────────────────────────────────────
      case 'reject': {
        updateData = {
          reviewStatus: 'rejected',
          reviewedAt: now,
          reviewedBy: reviewerId || null,
          reviewNote: reviewNote || null,
        };
        newStatus = 'rejected';
        logType = 'course_rejected';
        logTitle = `Course rejected: ${course.title}`;
        logDescription = reviewNote || `Course "${course.title}" rejected by admin.`;
        logIcon = '❌';
        logSeverity = 'warning';
        logAction = 'rejected';
        break;
      }

      // ── Request Changes ────────────────────────────────────────────────
      case 'request_changes': {
        updateData = {
          reviewStatus: 'changes_requested',
          reviewedAt: now,
          reviewedBy: reviewerId || null,
          reviewNote: reviewNote || null,
        };
        if (checklist) {
          updateData.reviewChecklist = typeof checklist === 'string' ? checklist : JSON.stringify(checklist);
        }
        newStatus = 'changes_requested';
        logType = 'course_review_pending';
        logTitle = `Changes requested: ${course.title}`;
        logDescription = reviewNote || `Changes requested for course "${course.title}".`;
        logIcon = '📝';
        logAction = 'requested_changes';
        break;
      }

      // ── Flag ───────────────────────────────────────────────────────────
      case 'flag': {
        if (!flagReason) {
          return NextResponse.json(
            { error: 'Flag reason is required' },
            { status: 400 },
          );
        }
        updateData = {
          reviewStatus: 'flagged',
          flaggedReason: flagReason,
          reviewedAt: now,
          reviewedBy: reviewerId || null,
        };
        newStatus = 'flagged';
        logType = 'course_review_pending';
        logTitle = `Course flagged: ${course.title}`;
        logDescription = `Reason: ${flagReason}`;
        logIcon = '🚩';
        logSeverity = 'warning';
        logAction = 'flagged';
        break;
      }

      // ── Unflag ─────────────────────────────────────────────────────────
      case 'unflag': {
        // Revert to previous status or under_review
        const revertStatus = previousStatus === 'flagged' ? 'under_review' : previousStatus;
        updateData = {
          reviewStatus: revertStatus,
          flaggedReason: null,
        };
        newStatus = revertStatus;
        logType = 'course_review_pending';
        logTitle = `Course unflagged: ${course.title}`;
        logDescription = `Flag removed, status reverted to ${revertStatus}`;
        logIcon = '🏳️';
        logAction = 'unflagged';
        break;
      }

      // ── Assign (alias for assign_reviewer) ─────────────────────────────
      case 'assign':
      // ── Assign Reviewer ────────────────────────────────────────────────
      case 'assign_reviewer': {
        const effectiveReviewerId = reviewerId || body.userId;
        if (!effectiveReviewerId) {
          return NextResponse.json(
            { error: 'Reviewer ID is required' },
            { status: 400 },
          );
        }
        // Verify the reviewer exists and is admin
        const reviewer = await db.user.findUnique({
          where: { id: effectiveReviewerId },
          select: { id: true, name: true, role: true, email: true },
        });
        if (!reviewer || (reviewer.role !== 'admin' && reviewer.role !== 'instructor')) {
          return NextResponse.json(
            { error: 'Invalid reviewer ID or user is not an admin/instructor' },
            { status: 400 },
          );
        }
        updateData = {
          reviewedBy: effectiveReviewerId,
        };
        historyAction = 'assigned';
        historyNote = `Assigned to ${reviewer.name}`;
        logType = 'course_review_pending';
        logTitle = `Reviewer assigned to: ${course.title}`;
        logDescription = `Assigned to ${reviewer.name} (${reviewer.email || reviewer.id})`;
        logIcon = '👤';
        logAction = 'assigned';
        break;
      }

      // ── Start Review ──────────────────────────────────────────────────
      case 'start_review': {
        updateData = {
          reviewStatus: 'under_review',
          reviewedAt: now,
          reviewedBy: reviewerId || null,
        };
        newStatus = 'under_review';
        logType = 'course_review_pending';
        logTitle = `Review started: ${course.title}`;
        logDescription = `Review has been started for course "${course.title}".`;
        logIcon = '🔍';
        logAction = 'started_review';
        break;
      }

      // ── Update Review Note ────────────────────────────────────────────
      case 'update_review_note': {
        if (reviewNote === undefined || reviewNote === null) {
          return NextResponse.json(
            { error: 'reviewNote is required for update_review_note action' },
            { status: 400 },
          );
        }
        updateData = {
          reviewNote: reviewNote,
        };
        historyAction = 'note_updated';
        historyNote = reviewNote;
        logType = 'course_review_pending';
        logTitle = `Review note updated: ${course.title}`;
        logDescription = `Review note updated for course "${course.title}".`;
        logIcon = '📝';
        logAction = 'updated_note';
        break;
      }

      // ── Escalate ───────────────────────────────────────────────────────
      case 'escalate': {
        updateData = {
          reviewStatus: 'flagged',
          flaggedReason: `ESCALATED: ${flagReason || 'Escalated for senior review'}`,
          reviewedAt: now,
          reviewedBy: reviewerId || null,
        };
        newStatus = 'flagged';
        logType = 'course_review_pending';
        logTitle = `Course escalated: ${course.title}`;
        logDescription = flagReason || 'Escalated for senior review';
        logIcon = '⬆️';
        logSeverity = 'warning';
        logAction = 'escalated';
        break;
      }

      // ── Add Note ───────────────────────────────────────────────────────
      case 'add_note': {
        if (!reviewNote) {
          return NextResponse.json(
            { error: 'Note content is required' },
            { status: 400 },
          );
        }
        const existingNotes = safeJsonParse(course.adminNotes, []);
        existingNotes.push({
          note: reviewNote,
          adminName: adminName || 'Admin',
          date: now.toISOString(),
        });
        updateData = {
          adminNotes: JSON.stringify(existingNotes),
        };
        historyAction = 'note_added';
        logType = 'course_review_pending';
        logTitle = `Note added to: ${course.title}`;
        logDescription = reviewNote;
        logIcon = '📝';
        logAction = 'noted';
        break;
      }

      // ── Update Checklist ───────────────────────────────────────────────
      case 'update_checklist': {
        if (!checklist) {
          return NextResponse.json(
            { error: 'Checklist data is required' },
            { status: 400 },
          );
        }
        updateData = {
          reviewChecklist: typeof checklist === 'string' ? checklist : JSON.stringify(checklist),
        };
        historyAction = 'checklist_updated';
        historyNote = 'Review checklist updated';
        logType = 'course_review_pending';
        logTitle = `Checklist updated for: ${course.title}`;
        logDescription = 'Review checklist items updated by admin';
        logIcon = '✅';
        logAction = 'updated';
        break;
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: approve, reject, request_changes, flag, unflag, assign, assign_reviewer, start_review, update_review_note, escalate, add_note, update_checklist` },
          { status: 400 },
        );
    }

    // ── Apply course update ──────────────────────────────────────────────
    await db.course.update({
      where: { id },
      data: updateData,
    });

    // ── Create CourseReviewHistory entry ─────────────────────────────────
    await db.courseReviewHistory.create({
      data: {
        courseId: id,
        action: historyAction,
        reviewerId: reviewerId || null,
        reviewerName: adminName || null,
        note: historyNote,
        checklist: checklist
          ? (typeof checklist === 'string' ? checklist : JSON.stringify(checklist))
          : undefined,
        previousStatus,
        newStatus,
        metadata: JSON.stringify({
          action,
          timestamp: now.toISOString(),
          flagReason: flagReason || undefined,
        }),
      },
    });

    // ── Create ActivityLog entry ─────────────────────────────────────────
    await db.activityLog.create({
      data: {
        userId: course.instructorId,
        type: logType,
        title: logTitle,
        description: logDescription,
        icon: logIcon,
        action: logAction,
        targetName: course.title,
        targetType: 'course',
        targetId: id,
        severity: logSeverity,
        category: logCategory,
        metadata: JSON.stringify({
          courseId: id,
          action,
          previousStatus,
          newStatus,
        }),
      },
    });

    // ── Send notification to instructor for significant actions ──────────
    if (['approve', 'reject', 'request_changes', 'flag', 'escalate'].includes(action)) {
      const notificationContent: Record<string, string> = {
        approve: `Your course "${course.title}" has been approved and is now published! 🎉`,
        reject: `Your course "${course.title}" was not approved. ${reviewNote ? `Reason: ${reviewNote}` : 'Please review the feedback and make necessary changes.'}`,
        request_changes: `Changes have been requested for your course "${course.title}". ${reviewNote ? `Note: ${reviewNote}` : 'Please review the feedback and update your course.'}`,
        flag: `Your course "${course.title}" has been flagged for review. ${flagReason ? `Reason: ${flagReason}` : ''}`,
        escalate: `Your course "${course.title}" has been escalated for additional review.`,
      };

      const notificationIcon: Record<string, string> = {
        approve: '🎉',
        reject: '❌',
        request_changes: '📝',
        flag: '🚩',
        escalate: '⬆️',
      };

      await db.notification.create({
        data: {
          userId: course.instructorId,
          type: action === 'approve' ? 'system' : 'system',
          title: logTitle,
          content: notificationContent[action] || logDescription,
          icon: notificationIcon[action] || '📋',
          courseId: id,
        },
      });
    }

    // ── Build response ───────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      message: `Action "${action}" completed successfully`,
      action,
      previousStatus,
      newStatus: newStatus || previousStatus,
      courseId: id,
    });
  } catch (error) {
    console.error('Admin course review action API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform review action' },
      { status: 500 },
    );
  }
}
