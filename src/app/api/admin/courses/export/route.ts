import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to escape CSV fields
function escapeCsvField(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  // If the field contains a comma, quote, or newline, wrap it in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// GET /api/admin/courses/export — Export courses as CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const category = searchParams.get('category') || '';
    const level = searchParams.get('level') || '';
    const featured = searchParams.get('featured') || '';
    const staffPick = searchParams.get('staff_pick') || '';

    // Build where clause (same as list route)
    const where: Record<string, unknown> = {};

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

    const courses = await db.course.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        level: true,
        price: true,
        overridePrice: true,
        isPublished: true,
        isArchived: true,
        enrollmentCount: true,
        rating: true,
        featured: true,
        staffPick: true,
        reviewStatus: true,
        createdAt: true,
        instructor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Determine display status for each course
    const getDisplayStatus = (course: {
      isPublished: boolean;
      isArchived: boolean;
      reviewStatus: string;
    }): string => {
      if (course.isArchived) return 'archived';
      if (course.isPublished) return 'published';
      if (course.reviewStatus === 'under_review') return 'under_review';
      if (course.reviewStatus === 'rejected') return 'rejected';
      if (course.reviewStatus === 'changes_requested') return 'changes_requested';
      if (course.reviewStatus === 'flagged') return 'flagged';
      return 'draft';
    };

    // Get effective price
    const getEffectivePrice = (course: {
      price: number;
      overridePrice: number | null;
      overridePriceUntil: Date | null;
    }): number => {
      const now = new Date();
      if (
        course.overridePrice !== null &&
        course.overridePrice !== undefined &&
        (!course.overridePriceUntil || new Date(course.overridePriceUntil) > now)
      ) {
        return course.overridePrice;
      }
      return course.price;
    };

    // Build CSV
    const headers = [
      'ID',
      'Title',
      'Category',
      'Level',
      'Instructor',
      'Students',
      'Rating',
      'Price',
      'Status',
      'Featured',
      'Staff Pick',
      'Created',
    ];

    const csvRows: string[] = [headers.map(escapeCsvField).join(',')];

    for (const course of courses) {
      const row = [
        escapeCsvField(course.id),
        escapeCsvField(course.title),
        escapeCsvField(course.category),
        escapeCsvField(course.level),
        escapeCsvField(course.instructor?.name || 'Unknown'),
        escapeCsvField(course.enrollmentCount),
        escapeCsvField(course.rating?.toFixed(1)),
        escapeCsvField(getEffectivePrice(course)),
        escapeCsvField(getDisplayStatus(course)),
        escapeCsvField(course.featured ? 'Yes' : 'No'),
        escapeCsvField(course.staffPick ? 'Yes' : 'No'),
        escapeCsvField(course.createdAt.toISOString().split('T')[0]),
      ];
      csvRows.push(row.join(','));
    }

    const csvString = csvRows.join('\n');

    // Set CSV download headers
    const filename = `courses-export-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Admin courses export API error:', error);
    return NextResponse.json(
      { error: 'Failed to export courses' },
      { status: 500 }
    );
  }
}
