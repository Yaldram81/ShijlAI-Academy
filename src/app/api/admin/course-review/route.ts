import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ReviewStats {
  pending: number;
  underReview: number;
  changesRequested: number;
  rejected: number;
  flagged: number;
  avgReviewTime: number; // in hours
  totalReviewed: number;
}

interface CourseListItem {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  thumbnail: string | null;
  price: number;
  reviewStatus: string;
  reviewNote: string | null;
  submittedForReviewAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  flaggedReason: string | null;
  createdAt: string;
  instructor: {
    id: string;
    name: string;
    avatar: string | null;
    email: string;
    instructorProfile: {
      headline: string | null;
    } | null;
  };
  previousReviewer: { name: string } | null;
  _count: {
    modules: number;
    lessons: number;
    enrollments: number;
    reviews: number;
  };
  reviewHistory: Array<{
    id: string;
    action: string;
    reviewerName: string | null;
    note: string | null;
    previousStatus: string | null;
    newStatus: string | null;
    createdAt: string;
  }>;
}

// ─── Helper: safely parse JSON ──────────────────────────────────────────────

function safeJsonParse(str: string | null, fallback: any = null): any {
  if (!str) return fallback;
  try { return JSON.parse(str); }
  catch { return fallback; }
}

// ─── GET /api/admin/course-review ───────────────────────────────────────────
// List courses in the review queue with filtering, sorting, pagination, and stats

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // ── Pagination ───────────────────────────────────────────────────────
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    // ── Filters ──────────────────────────────────────────────────────────
    const reviewStatus = searchParams.get('status') || searchParams.get('reviewStatus') || ''; // under_review, changes_requested, rejected, flagged, all_pending, all
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const level = searchParams.get('level') || '';
    const instructorId = searchParams.get('instructor') || '';

    // ── Sorting ──────────────────────────────────────────────────────────
    const sortParam = searchParams.get('sort') || 'oldest';

    // ── Build where clause ───────────────────────────────────────────────
    const where: Record<string, any> = { isArchived: false };

    // Review status filter
    switch (reviewStatus) {
      case 'pending':
        where.reviewStatus = 'pending';
        break;
      case 'under_review':
        where.reviewStatus = 'under_review';
        break;
      case 'changes_requested':
        where.reviewStatus = 'changes_requested';
        break;
      case 'rejected':
        where.reviewStatus = 'rejected';
        break;
      case 'flagged':
        where.reviewStatus = 'flagged';
        break;
      case 'all_pending':
        where.reviewStatus = { in: ['pending', 'under_review', 'changes_requested'] };
        break;
      case 'all':
        // No status filter — show everything except draft and approved
        where.reviewStatus = { in: ['pending', 'under_review', 'changes_requested', 'rejected', 'flagged', 'approved', 'draft'] };
        break;
      default:
        // Default: show courses needing review (pending + under_review + changes_requested + flagged)
        where.reviewStatus = { in: ['pending', 'under_review', 'changes_requested', 'flagged'] };
        break;
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { instructor: { name: { contains: search } } },
      ];
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Level filter
    if (level) {
      where.level = level;
    }

    // Instructor filter
    if (instructorId) {
      where.instructorId = instructorId;
    }

    // ── Build orderBy ────────────────────────────────────────────────────
    let orderBy: Record<string, string> = {};
    switch (sortParam) {
      case 'oldest':
        orderBy = { submittedForReviewAt: 'asc' };
        break;
      case 'newest':
        orderBy = { submittedForReviewAt: 'desc' };
        break;
      case 'title_asc':
        orderBy = { title: 'asc' };
        break;
      default:
        orderBy = { submittedForReviewAt: 'asc' };
        break;
    }

    // ── Fetch courses and count ──────────────────────────────────────────
    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
              avatar: true,
              email: true,
              instructorProfile: {
                select: { headline: true },
              },
            },
          },
          modules: {
            select: {
              _count: {
                select: { lessons: true },
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
          reviewHistory: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              action: true,
              reviewerId: true,
              reviewerName: true,
              note: true,
              previousStatus: true,
              newStatus: true,
              createdAt: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.course.count({ where }),
    ]);

    // ── Format course list ───────────────────────────────────────────────
    const courseList: CourseListItem[] = courses.map((c) => {
      // Find previous reviewer from review history (most recent reviewer who isn't the current one)
      const previousReviewerEntry = c.reviewHistory.find(
        (h) => h.reviewerName && h.action !== 'note_added'
      );
      const previousReviewer = previousReviewerEntry?.reviewerName
        ? { name: previousReviewerEntry.reviewerName }
        : null;

      // Compute total lesson count from modules
      const lessonCount = c.modules.reduce((sum, m) => sum + m._count.lessons, 0);

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        level: c.level,
        thumbnail: c.thumbnail,
        price: c.price,
        reviewStatus: c.reviewStatus,
        reviewNote: c.reviewNote,
        submittedForReviewAt: c.submittedForReviewAt?.toISOString() ?? null,
        reviewedAt: c.reviewedAt?.toISOString() ?? null,
        reviewedBy: c.reviewedBy,
        flaggedReason: c.flaggedReason,
        createdAt: c.createdAt.toISOString(),
        instructor: {
          id: c.instructor.id,
          name: c.instructor.name,
          avatar: c.instructor.avatar,
          email: c.instructor.email,
          instructorProfile: c.instructor.instructorProfile
            ? { headline: c.instructor.instructorProfile.headline }
            : null,
        },
        previousReviewer,
        _count: {
          modules: c._count.modules,
          lessons: lessonCount,
          enrollments: c._count.enrollments,
          reviews: c._count.reviews,
        },
        reviewHistory: c.reviewHistory.map((h) => ({
          id: h.id,
          action: h.action,
          reviewerName: h.reviewerName,
          note: h.note,
          previousStatus: h.previousStatus,
          newStatus: h.newStatus,
          createdAt: h.createdAt.toISOString(),
        })),
      };
    });

    // ── Compute stats ────────────────────────────────────────────────────
    const [
      pendingCount,
      underReviewCount,
      changesRequestedCount,
      rejectedCount,
      flaggedCount,
      totalReviewedCount,
      reviewedCourses,
    ] = await Promise.all([
      db.course.count({ where: { reviewStatus: 'pending', isArchived: false } }),
      db.course.count({ where: { reviewStatus: 'under_review', isArchived: false } }),
      db.course.count({ where: { reviewStatus: 'changes_requested', isArchived: false } }),
      db.course.count({ where: { reviewStatus: 'rejected', isArchived: false } }),
      db.course.count({ where: { reviewStatus: 'flagged', isArchived: false } }),
      db.course.count({
        where: {
          reviewStatus: { in: ['approved', 'rejected'] },
          isArchived: false,
        },
      }),
      db.course.findMany({
        where: {
          submittedForReviewAt: { not: null },
          reviewedAt: { not: null },
          isArchived: false,
        },
        select: {
          submittedForReviewAt: true,
          reviewedAt: true,
        },
        take: 200,
      }),
    ]);

    // Calculate average review time in hours
    let avgReviewTime = 0;
    if (reviewedCourses.length > 0) {
      const totalHours = reviewedCourses.reduce((acc, c) => {
        if (c.submittedForReviewAt && c.reviewedAt) {
          return acc + (c.reviewedAt.getTime() - c.submittedForReviewAt.getTime()) / (1000 * 60 * 60);
        }
        return acc;
      }, 0);
      avgReviewTime = Math.round((totalHours / reviewedCourses.length) * 10) / 10;
    }

    const stats: ReviewStats = {
      pending: pendingCount,
      underReview: underReviewCount,
      changesRequested: changesRequestedCount,
      rejected: rejectedCount,
      flagged: flaggedCount,
      avgReviewTime,
      totalReviewed: totalReviewedCount,
    };

    // ── Build response ───────────────────────────────────────────────────
    return NextResponse.json({
      courses: courseList,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin course review list API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course review queue' },
      { status: 500 },
    );
  }
}
