import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ExportInstructor {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  isVerified: boolean;
  headline: string | null;
  expertise: string | null;
  ntn: string | null;
  ntnVerified: boolean;
  applicationStatus: string | null;
  courseCount: number;
  publishedCourseCount: number;
  studentCount: number;
  totalEarnings: number;
  avgRating: number;
  payoutMethod: string | null;
  commissionRate: number | null;
  joinedAt: string;
  lastActiveAt: string | null;
}

// ─── Helper: format date for export ─────────────────────────────────────────

function formatDateShort(date: Date | null | undefined): string {
  if (!date) return '';
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

// ─── GET /api/admin/instructors/export ──────────────────────────────────────
// Export instructor data as CSV or JSON

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Format
    const format = searchParams.get('format') || 'csv'; // csv or json

    // Filters
    const status = searchParams.get('status') || '';
    const applicationStatus = searchParams.get('applicationStatus') || '';
    const search = searchParams.get('search') || '';

    // ── Build where clause ────────────────────────────────────────────────

    const whereConditions: Record<string, any>[] = [
      { role: 'instructor' },
    ];

    // Search across name, email
    if (search) {
      whereConditions.push({
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      });
    }

    // Status filter
    if (status === 'flagged') {
      whereConditions.push({ flaggedReason: { not: null } });
    } else if (status === 'pending_verification') {
      whereConditions.push({ isVerified: false });
    } else if (status) {
      whereConditions.push({ status });
    }

    // Application status filter
    if (applicationStatus) {
      whereConditions.push({
        instructorProfile: { applicationStatus },
      });
    }

    const where = whereConditions.length > 0
      ? { AND: whereConditions }
      : { role: 'instructor' };

    // ── Fetch instructors ─────────────────────────────────────────────────

    const instructors = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
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
        payoutMethods: {
          where: { isDefault: true },
          take: 1,
          select: { type: true },
        },
        commissionOverride: {
          select: { commissionRate: true },
        },
        _count: {
          select: { coursesCreated: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // ── Batch compute course stats ────────────────────────────────────────

    const instructorIds = instructors.map((i) => i.id);

    const courseAggregates = await db.course.groupBy({
      by: ['instructorId'],
      where: { instructorId: { in: instructorIds } },
      _count: { _all: true },
      _sum: { enrollmentCount: true },
      _avg: { rating: true },
    });

    const publishedCourseCounts = await db.course.groupBy({
      by: ['instructorId'],
      where: { instructorId: { in: instructorIds }, isPublished: true },
      _count: { _all: true },
    });

    const courseStatsMap = new Map(courseAggregates.map((c: any) => [c.instructorId, c]));
    const publishedMap = new Map(publishedCourseCounts.map((c: any) => [c.instructorId, c._count._all]));

    // Batch compute earnings
    const earningsAggregates = await db.transaction.groupBy({
      by: ['instructorId'],
      where: { instructorId: { in: instructorIds }, type: 'enrollment', status: 'completed' },
      _sum: { instructorEarning: true },
    });
    const earningsMap = new Map(earningsAggregates.map((e: any) => [e.instructorId, e._sum.instructorEarning || 0]));

    // ── Format instructors for export ─────────────────────────────────────

    const formattedInstructors: ExportInstructor[] = instructors.map((inst) => {
      const courseStats: any = courseStatsMap.get(inst.id);
      const totalCourses = courseStats?._count?._all ?? 0;
      const studentCount = courseStats?._sum?.enrollmentCount ?? 0;
      const avgRating = courseStats?._avg?.rating ? Math.round(courseStats._avg.rating * 10) / 10 : 0;

      return {
        id: inst.id,
        name: inst.name,
        email: inst.email,
        phone: inst.phone,
        status: inst.status || 'active',
        isVerified: inst.isVerified,
        headline: inst.instructorProfile?.headline || null,
        expertise: inst.instructorProfile?.expertise || null,
        ntn: inst.instructorProfile?.ntn || null,
        ntnVerified: inst.instructorProfile?.ntnVerified || false,
        applicationStatus: inst.instructorProfile?.applicationStatus || null,
        courseCount: totalCourses,
        publishedCourseCount: publishedMap.get(inst.id) || 0,
        studentCount,
        totalEarnings: earningsMap.get(inst.id) || 0,
        avgRating,
        payoutMethod: inst.payoutMethods[0]?.type || null,
        commissionRate: inst.commissionOverride?.commissionRate || null,
        joinedAt: formatDateShort(inst.createdAt),
        lastActiveAt: formatDateShort(inst.lastActiveAt),
      };
    });

    // ── CSV Export ─────────────────────────────────────────────────────────

    if (format === 'csv') {
      const headers = [
        'ID', 'Name', 'Email', 'Phone', 'Status', 'Verified',
        'Headline', 'Expertise', 'NTN', 'NTN Verified', 'Application Status',
        'Course Count', 'Published Courses', 'Student Count', 'Total Earnings (USD)',
        'Avg Rating', 'Payout Method', 'Commission Rate (%)',
        'Joined', 'Last Active',
      ];

      const rows = formattedInstructors.map((i) => [
        i.id,
        `"${i.name.replace(/"/g, '""')}"`,
        i.email,
        i.phone ? `"${i.phone.replace(/"/g, '""')}"` : '',
        i.status,
        i.isVerified ? 'Yes' : 'No',
        i.headline ? `"${i.headline.replace(/"/g, '""')}"` : '',
        i.expertise ? `"${i.expertise.replace(/"/g, '""')}"` : '',
        i.ntn || '',
        i.ntnVerified ? 'Yes' : 'No',
        i.applicationStatus || '',
        i.courseCount,
        i.publishedCourseCount,
        i.studentCount,
        i.totalEarnings,
        i.avgRating,
        i.payoutMethod || '',
        i.commissionRate !== null ? i.commissionRate : '',
        i.joinedAt,
        i.lastActiveAt || '',
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="instructors-export-${formatDateShort(new Date())}.csv"`,
        },
      });
    }

    // ── JSON Export ────────────────────────────────────────────────────────

    if (format === 'json') {
      return new NextResponse(
        JSON.stringify({
          exportedAt: new Date().toISOString(),
          totalRecords: formattedInstructors.length,
          filters: {
            status: status || null,
            applicationStatus: applicationStatus || null,
            search: search || null,
          },
          instructors: formattedInstructors,
        }, null, 2),
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="instructors-export-${formatDateShort(new Date())}.json"`,
          },
        },
      );
    }

    // ── Unsupported format ────────────────────────────────────────────────

    return NextResponse.json(
      { error: 'Unsupported export format. Use "csv" or "json".' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Admin instructors export API error:', error);
    return NextResponse.json(
      { error: 'Failed to export instructors' },
      { status: 500 },
    );
  }
}
