import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/courses/analytics — Comprehensive course analytics for admin dashboard
export async function GET() {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0, 0);

    // ─── 1. Overview Stats ────────────────────────────────────────
    const [
      totalCourses,
      publishedCourses,
      draftCourses,
      underReviewCourses,
      archivedCourses,
      flaggedCourses,
    ] = await Promise.all([
      db.course.count(),
      db.course.count({ where: { isPublished: true, isArchived: false } }),
      db.course.count({ where: { reviewStatus: 'draft', isPublished: false } }),
      db.course.count({ where: { reviewStatus: 'under_review' } }),
      db.course.count({ where: { isArchived: true } }),
      db.course.count({ where: { reviewStatus: 'flagged' } }),
    ]);

    const totalEnrollments = await db.enrollment.count();

    // Revenue from completed enrollment transactions
    const enrollmentTransactions = await db.transaction.findMany({
      where: { type: 'enrollment', status: 'completed' },
      select: { amount: true, platformFee: true },
    });
    const totalRevenue = enrollmentTransactions.reduce((sum, t) => sum + t.amount, 0);
    const platformFeeTotal = enrollmentTransactions.reduce((sum, t) => sum + t.platformFee, 0);

    // Average rating across published courses with rating > 0
    const ratingAgg = await db.course.aggregate({
      _avg: { rating: true },
      _count: true,
      where: { isPublished: true, rating: { gt: 0 } },
    });
    const avgRating = ratingAgg._avg.rating
      ? Math.round(ratingAgg._avg.rating * 100) / 100
      : 0;

    // Average completion rate: average progress of completed enrollments
    const completedEnrollmentsAgg = await db.enrollment.aggregate({
      _avg: { progress: true },
      where: { status: 'completed' },
    });
    const avgCompletionRate = completedEnrollmentsAgg._avg.progress
      ? Math.round(completedEnrollmentsAgg._avg.progress * 100) / 100
      : 0;

    const overview = {
      totalCourses,
      publishedCourses,
      draftCourses,
      underReviewCourses,
      archivedCourses,
      flaggedCourses,
      totalEnrollments,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      platformFeeTotal: Math.round(platformFeeTotal * 100) / 100,
      avgRating,
      avgCompletionRate,
    };

    // ─── 2. Enrollment Trend (last 12 months) ─────────────────────
    const enrollments = await db.enrollment.findMany({
      where: { enrolledAt: { gte: twelveMonthsAgo } },
      select: { enrolledAt: true },
    });

    const enrollmentTrend = buildMonthBuckets(twelveMonthsAgo, now).map((bucket) => {
      const count = enrollments.filter((e) => {
        const d = new Date(e.enrolledAt);
        return d >= bucket.start && d < bucket.end;
      }).length;
      return { month: bucket.label, count };
    });

    // ─── 3. Category Distribution ─────────────────────────────────
    const categoryGroups = await db.course.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });
    const categoryDistribution = categoryGroups.map((g) => ({
      category: g.category,
      count: g._count.category,
    }));

    // ─── 4. Top Performing Courses (top 5 by enrollmentCount) ────
    const topCoursesRaw = await db.course.findMany({
      where: { isPublished: true },
      orderBy: { enrollmentCount: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        enrollmentCount: true,
        rating: true,
      },
    });

    // Compute revenue per course from transactions
    const topCourseIds = topCoursesRaw.map((c) => c.id);
    const courseRevenues = await db.transaction.groupBy({
      by: ['courseId'],
      where: {
        courseId: { in: topCourseIds },
        type: 'enrollment',
        status: 'completed',
      },
      _sum: { amount: true },
    });

    const revenueMap = new Map(
      courseRevenues.map((r) => [r.courseId, r._sum.amount ?? 0])
    );

    const topCourses = topCoursesRaw.map((c) => ({
      id: c.id,
      title: c.title,
      enrollmentCount: c.enrollmentCount,
      rating: c.rating,
      revenue: Math.round((revenueMap.get(c.id) ?? 0) * 100) / 100,
    }));

    // ─── 5. Revenue by Month (last 12 months) ─────────────────────
    const revenueTransactions = await db.transaction.findMany({
      where: {
        type: 'enrollment',
        status: 'completed',
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { amount: true, platformFee: true, createdAt: true },
    });

    const revenueByMonth = buildMonthBuckets(twelveMonthsAgo, now).map((bucket) => {
      const matching = revenueTransactions.filter((t) => {
        const d = new Date(t.createdAt);
        return d >= bucket.start && d < bucket.end;
      });
      const revenue = matching.reduce((sum, t) => sum + t.amount, 0);
      const platformFee = matching.reduce((sum, t) => sum + t.platformFee, 0);
      return {
        month: bucket.label,
        revenue: Math.round(revenue * 100) / 100,
        platformFee: Math.round(platformFee * 100) / 100,
      };
    });

    // ─── 6. Review Queue Stats ────────────────────────────────────
    const pendingReviews = await db.course.count({
      where: { reviewStatus: 'under_review' },
    });

    // Average review time: courses that have both submittedForReviewAt and reviewedAt
    const reviewedCourses = await db.course.findMany({
      where: {
        submittedForReviewAt: { not: null },
        reviewedAt: { not: null },
      },
      select: {
        submittedForReviewAt: true,
        reviewedAt: true,
      },
    });

    let avgReviewTime = 0;
    if (reviewedCourses.length > 0) {
      const totalHours = reviewedCourses.reduce((sum, c) => {
        const submitted = c.submittedForReviewAt!;
        const reviewed = c.reviewedAt!;
        const diffMs = new Date(reviewed).getTime() - new Date(submitted).getTime();
        return sum + diffMs / (1000 * 60 * 60); // convert ms to hours
      }, 0);
      avgReviewTime = Math.round((totalHours / reviewedCourses.length) * 100) / 100;
    }

    const reviewQueueStats = {
      pendingReviews,
      avgReviewTime,
    };

    // ─── Response ─────────────────────────────────────────────────
    return NextResponse.json({
      overview,
      enrollmentTrend,
      categoryDistribution,
      topCourses,
      revenueByMonth,
      reviewQueueStats,
    });
  } catch (error) {
    console.error('Course analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course analytics' },
      { status: 500 }
    );
  }
}

// ─── Helper: build 12 month buckets ───────────────────────────────
interface MonthBucket {
  label: string; // 'YYYY-MM'
  start: Date;
  end: Date;
}

function buildMonthBuckets(from: Date, to: Date): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const current = new Date(from.getFullYear(), from.getMonth(), 1);

  while (current <= to) {
    const year = current.getFullYear();
    const month = current.getMonth();
    const label = `${year}-${String(month + 1).padStart(2, '0')}`;
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    buckets.push({ label, start, end });
    current.setMonth(current.getMonth() + 1);
  }

  return buckets;
}
