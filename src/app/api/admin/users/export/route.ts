import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ExportUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  isVerified: boolean;
  mfaEnabled: boolean;
  authProvider: string;
  phone: string | null;
  flaggedReason: string | null;
  lastActiveAt: string | null;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  xp: number;
  level: number;
  shijlCoins: number;
  streak: number;
  language: string;
  enrollmentCount: number;
  courseCount: number;
  certificateCount: number;
  createdAt: string;
}

// ─── Helper: format date for export ─────────────────────────────────────────

function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  return date.toISOString();
}

function formatDateShort(date: Date | null | undefined): string {
  if (!date) return '';
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

// ─── GET /api/admin/users/export ────────────────────────────────────────────
// Export users as CSV or JSON with advanced filters

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Format
    const format = searchParams.get('format') || 'csv'; // csv or json

    // Basic filters
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    // Advanced filters
    const authProvider = searchParams.get('authProvider') || '';
    const mfaEnabled = searchParams.get('mfaEnabled') || '';
    const verified = searchParams.get('verified') || '';

    // Date range filters
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const joinedDateFrom = searchParams.get('joinedDateFrom') || '';
    const joinedDateTo = searchParams.get('joinedDateTo') || '';

    // ── Build where clause ────────────────────────────────────────────────

    const whereConditions: Record<string, any>[] = [];

    if (search) {
      whereConditions.push({
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      });
    }

    if (role) whereConditions.push({ role });

    if (status === 'flagged') {
      whereConditions.push({ flaggedReason: { not: null } });
    } else if (status === 'pending_verification') {
      whereConditions.push({ isVerified: false, role: 'instructor' });
    } else if (status) {
      whereConditions.push({ status });
    }

    if (authProvider) whereConditions.push({ authProvider });

    if (mfaEnabled === 'true') {
      whereConditions.push({ mfaEnabled: true });
    } else if (mfaEnabled === 'false') {
      whereConditions.push({ mfaEnabled: false });
    }

    if (verified === 'true') {
      whereConditions.push({ isVerified: true });
    } else if (verified === 'false') {
      whereConditions.push({ isVerified: false });
    }

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, any> = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      whereConditions.push({ lastActiveAt: dateFilter });
    }

    if (joinedDateFrom || joinedDateTo) {
      const joinedFilter: Record<string, any> = {};
      if (joinedDateFrom) joinedFilter.gte = new Date(joinedDateFrom);
      if (joinedDateTo) joinedFilter.lte = new Date(joinedDateTo);
      whereConditions.push({ createdAt: joinedFilter });
    }

    const where = whereConditions.length > 0
      ? { AND: whereConditions }
      : {};

    // ── Fetch users ───────────────────────────────────────────────────────

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isVerified: true,
        mfaEnabled: true,
        authProvider: true,
        phone: true,
        flaggedReason: true,
        lastActiveAt: true,
        lastLoginAt: true,
        lastLoginIp: true,
        xp: true,
        level: true,
        shijlCoins: true,
        streak: true,
        language: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            coursesCreated: true,
            certificates: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // ── Format users for export ───────────────────────────────────────────

    const formattedUsers: ExportUser[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status || 'active',
      isVerified: u.isVerified,
      mfaEnabled: u.mfaEnabled,
      authProvider: u.authProvider,
      phone: u.phone,
      flaggedReason: u.flaggedReason,
      lastActiveAt: formatDate(u.lastActiveAt),
      lastLoginAt: formatDate(u.lastLoginAt),
      lastLoginIp: u.lastLoginIp,
      xp: u.xp,
      level: u.level,
      shijlCoins: u.shijlCoins,
      streak: u.streak,
      language: u.language,
      enrollmentCount: u._count.enrollments,
      courseCount: u._count.coursesCreated,
      certificateCount: u._count.certificates,
      createdAt: formatDate(u.createdAt),
    }));

    // ── CSV Export ─────────────────────────────────────────────────────────

    if (format === 'csv') {
      const headers = [
        'ID', 'Name', 'Email', 'Role', 'Status', 'Verified',
        '2FA Enabled', 'Auth Provider', 'Phone', 'Last Login IP',
        'XP', 'Level', 'ShijlCoins', 'Streak', 'Language',
        'Enrollments', 'Courses Created', 'Certificates',
        'Flagged Reason', 'Last Active', 'Last Login', 'Joined',
      ];

      const rows = formattedUsers.map((u) => [
        u.id,
        `"${u.name.replace(/"/g, '""')}"`,
        u.email,
        u.role,
        u.status,
        u.isVerified ? 'Yes' : 'No',
        u.mfaEnabled ? 'Yes' : 'No',
        u.authProvider,
        u.phone ? `"${u.phone.replace(/"/g, '""')}"` : '',
        u.lastLoginIp || '',
        u.xp,
        u.level,
        u.shijlCoins,
        u.streak,
        u.language,
        u.enrollmentCount,
        u.courseCount,
        u.certificateCount,
        u.flaggedReason ? `"${u.flaggedReason.replace(/"/g, '""')}"` : '',
        u.lastActiveAt || '',
        u.lastLoginAt || '',
        u.createdAt,
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="users-export-${formatDateShort(new Date())}.csv"`,
        },
      });
    }

    // ── JSON Export ────────────────────────────────────────────────────────

    if (format === 'json') {
      return new NextResponse(
        JSON.stringify({
          exportedAt: new Date().toISOString(),
          totalRecords: formattedUsers.length,
          filters: {
            role: role || null,
            status: status || null,
            search: search || null,
            authProvider: authProvider || null,
            mfaEnabled: mfaEnabled || null,
            verified: verified || null,
            dateFrom: dateFrom || null,
            dateTo: dateTo || null,
            joinedDateFrom: joinedDateFrom || null,
            joinedDateTo: joinedDateTo || null,
          },
          users: formattedUsers,
        }, null, 2),
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="users-export-${formatDateShort(new Date())}.json"`,
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
    console.error('Admin users export API error:', error);
    return NextResponse.json(
      { error: 'Failed to export users' },
      { status: 500 },
    );
  }
}
