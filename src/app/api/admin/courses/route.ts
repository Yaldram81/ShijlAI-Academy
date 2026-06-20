import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/courses — List courses with filtering, search, pagination, stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const category = searchParams.get('category') || '';
    const level = searchParams.get('level') || '';
    const sort = searchParams.get('sort') || 'newest';
    const featured = searchParams.get('featured') || '';
    const staffPick = searchParams.get('staff_pick') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    // Search by title, description, or instructor name
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { instructor: { name: { contains: search } } },
      ];
    }

    // Status filter mapping
    if (status === 'published') {
      where.isPublished = true;
      where.isArchived = false;
    } else if (status === 'pending') {
      where.reviewStatus = 'pending';
    } else if (status === 'under_review') {
      where.reviewStatus = 'under_review';
    } else if (status === 'draft') {
      where.reviewStatus = 'draft';
      where.isPublished = false;
    } else if (status === 'archived') {
      where.isArchived = true;
    } else if (status === 'flagged') {
      where.reviewStatus = 'flagged';
    } else if (status === 'rejected') {
      where.reviewStatus = 'rejected';
    } else if (status === 'changes_requested') {
      where.reviewStatus = 'changes_requested';
    } else {
      // "all" => exclude drafts so admin doesn't see instructor work-in-progress
      where.reviewStatus = { not: 'draft' };
    }

    if (category) {
      where.category = category;
    }

    if (level) {
      where.level = level;
    }

    if (featured === 'true') {
      where.featured = true;
    } else if (featured === 'false') {
      where.featured = false;
    }

    if (staffPick === 'true') {
      where.staffPick = true;
    } else if (staffPick === 'false') {
      where.staffPick = false;
    }

    // Build orderBy
    let orderBy: Record<string, unknown> = { createdAt: 'desc' };
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'most_enrolled':
        orderBy = { enrollmentCount: 'desc' };
        break;
      case 'highest_rated':
        orderBy = { rating: 'desc' };
        break;
      case 'most_revenue':
        // Revenue = enrollmentCount * price; sort by enrollmentCount * price approximation
        // SQLite doesn't support computed orderBy easily, so sort by enrollmentCount as proxy
        orderBy = { enrollmentCount: 'desc' };
        break;
      case 'title_asc':
        orderBy = { title: 'asc' };
        break;
      case 'title_desc':
        orderBy = { title: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          level: true,
          language: true,
          thumbnail: true,
          price: true,
          overridePrice: true,
          overridePriceUntil: true,
          isPublished: true,
          isArchived: true,
          enrollmentCount: true,
          rating: true,
          featured: true,
          staffPick: true,
          reviewStatus: true,
          ageRestriction: true,
          regionRestricted: true,
          flaggedReason: true,
          submittedForReviewAt: true,
          reviewedAt: true,
          createdAt: true,
          updatedAt: true,
          instructor: {
            select: {
              id: true,
              name: true,
              avatar: true,
              email: true,
            },
          },
          _count: {
            select: {
              modules: true,
              enrollments: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.course.count({ where }),
    ]);

    // Get stats counts (across all courses, not filtered)
    const [
      totalCourses,
      publishedCourses,
      pendingReviewCourses,
      underReviewCourses,
      draftCourses,
      archivedCourses,
      flaggedCourses,
    ] = await Promise.all([
      db.course.count({ where: { reviewStatus: { not: 'draft' } } }),
      db.course.count({ where: { isPublished: true, isArchived: false } }),
      db.course.count({ where: { reviewStatus: 'pending' } }),
      db.course.count({ where: { reviewStatus: 'under_review' } }),
      db.course.count({ where: { reviewStatus: 'draft', isPublished: false } }),
      db.course.count({ where: { isArchived: true } }),
      db.course.count({ where: { reviewStatus: 'flagged' } }),
    ]);

    const stats = {
      total: totalCourses,
      published: publishedCourses,
      pendingReview: pendingReviewCourses,
      underReview: underReviewCourses,
      draft: draftCourses,
      archived: archivedCourses,
      flagged: flaggedCourses,
    };

    return NextResponse.json({
      courses,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin courses list API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
