import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Types ──────────────────────────────────────────────────────────────────

interface UserListItem {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  status: string;
  isVerified: boolean;
  mfaEnabled: boolean;
  authProvider: string;
  flaggedReason: string | null;
  lastActiveAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  enrollmentCount: number;
  courseCount: number;
  instructorApplicationStatus: string | null;
  ntnVerified: boolean | null;
}

interface UserStats {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalAdmins: number;
  activeUsers: number;
  suspendedUsers: number;
  bannedUsers: number;
  pendingVerification: number;
  flaggedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

type SortField = 'name' | 'email' | 'createdAt' | 'lastActiveAt';
type SortOrder = 'asc' | 'desc';

// ─── Helper: simpleHash matching existing auth setup ────────────────────────
// ⚠️ SECURITY WARNING: simpleHash is NOT cryptographically secure. It is used
// here only for demo/development consistency with existing auth setup. Production
// MUST replace this with bcrypt or argon2 password hashing.

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

// ─── GET /api/admin/users ───────────────────────────────────────────────────
// List users with advanced filtering, search, pagination, and stats

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    // Search
    const search = searchParams.get('search') || '';

    // Basic filters
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    // Advanced filters (accept both frontend and backend param names)
    const authProvider = searchParams.get('authProvider') || '';
    const mfaEnabled = searchParams.get('mfa') || searchParams.get('mfaEnabled') || '';
    const verified = searchParams.get('verification') || searchParams.get('verified') || '';

    // Date range filters (accept both frontend and backend param names)
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const joinedDateFrom = searchParams.get('joinedAfter') || searchParams.get('joinedDateFrom') || '';
    const joinedDateTo = searchParams.get('joinedBefore') || searchParams.get('joinedDateTo') || '';

    // Sorting
    const sortBy = (searchParams.get('sortBy') || 'createdAt') as SortField;
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as SortOrder;

    // ── Build where clause ────────────────────────────────────────────────

    const whereConditions: Record<string, any>[] = [];

    // Search across name, email, phone
    if (search) {
      whereConditions.push({
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      });
    }

    // Role filter
    if (role) {
      whereConditions.push({ role });
    }

    // Status filter
    if (status === 'flagged') {
      whereConditions.push({ flaggedReason: { not: null } });
    } else if (status === 'pending_verification') {
      whereConditions.push({ isVerified: false, role: 'instructor' });
    } else if (status) {
      whereConditions.push({ status });
    }

    // Auth provider filter
    if (authProvider) {
      whereConditions.push({ authProvider });
    }

    // MFA enabled filter
    if (mfaEnabled === 'true') {
      whereConditions.push({ mfaEnabled: true });
    } else if (mfaEnabled === 'false') {
      whereConditions.push({ mfaEnabled: false });
    }

    // Verified filter
    if (verified === 'true') {
      whereConditions.push({ isVerified: true });
    } else if (verified === 'false') {
      whereConditions.push({ isVerified: false });
    }

    // Date range filter (lastActiveAt)
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, any> = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      whereConditions.push({ lastActiveAt: dateFilter });
    }

    // Joined date range filter (createdAt)
    if (joinedDateFrom || joinedDateTo) {
      const joinedFilter: Record<string, any> = {};
      if (joinedDateFrom) joinedFilter.gte = new Date(joinedDateFrom);
      if (joinedDateTo) joinedFilter.lte = new Date(joinedDateTo);
      whereConditions.push({ createdAt: joinedFilter });
    }

    const where = whereConditions.length > 0
      ? { AND: whereConditions }
      : {};

    // ── Sorting ───────────────────────────────────────────────────────────

    const validSortFields: SortField[] = ['name', 'email', 'createdAt', 'lastActiveAt'];
    const validSortOrders: SortOrder[] = ['asc', 'desc'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = validSortOrders.includes(sortOrder) ? sortOrder : 'desc';

    // ── Fetch users and total ─────────────────────────────────────────────

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          status: true,
          isVerified: true,
          mfaEnabled: true,
          authProvider: true,
          flaggedReason: true,
          lastActiveAt: true,
          lastLoginAt: true,
          createdAt: true,
          instructorProfile: {
            select: {
              applicationStatus: true,
              ntnVerified: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
              coursesCreated: true,
            },
          },
        },
        orderBy: { [safeSortBy]: safeSortOrder },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    // ── Compute stats ─────────────────────────────────────────────────────

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalAdmins,
      activeUsers,
      suspendedUsers,
      bannedUsers,
      pendingVerification,
      flaggedUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: 'student' } }),
      db.user.count({ where: { role: 'instructor' } }),
      db.user.count({ where: { role: 'admin' } }),
      db.user.count({ where: { status: 'active' } }),
      db.user.count({ where: { status: 'suspended' } }),
      db.user.count({ where: { status: 'banned' } }),
      db.user.count({ where: { isVerified: false, role: 'instructor' } }),
      db.user.count({ where: { flaggedReason: { not: null } } }),
      db.user.count({ where: { createdAt: { gte: todayStart } } }),
      db.user.count({ where: { createdAt: { gte: weekStart } } }),
      db.user.count({ where: { createdAt: { gte: monthStart } } }),
    ]);

    const stats: UserStats = {
      totalUsers,
      totalStudents,
      totalInstructors,
      totalAdmins,
      activeUsers,
      suspendedUsers,
      bannedUsers,
      pendingVerification,
      flaggedUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
    };

    // ── Format users ──────────────────────────────────────────────────────

    const formattedUsers: UserListItem[] = users.map((user) => {
      let displayStatus = user.status || 'active';
      if (user.flaggedReason) {
        displayStatus = 'flagged';
      } else if (user.role === 'instructor' && !user.isVerified) {
        displayStatus = 'pending_verification';
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        status: displayStatus,
        isVerified: user.isVerified,
        mfaEnabled: user.mfaEnabled,
        authProvider: user.authProvider,
        flaggedReason: user.flaggedReason,
        lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        enrollmentCount: user._count.enrollments,
        courseCount: user._count.coursesCreated,
        instructorApplicationStatus: user.instructorProfile?.applicationStatus ?? null,
        ntnVerified: user.instructorProfile?.ntnVerified ?? null,
      };
    });

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('Admin users list API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 },
    );
  }
}

// ─── POST /api/admin/users ──────────────────────────────────────────────────
// Add user manually with validation, optional welcome email, and UserSession

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role, phone, bio, sendWelcomeEmail, language } = body;

    // ── Validation ────────────────────────────────────────────────────────

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name is required and must be at least 2 characters' },
        { status: 400 },
      );
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 },
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 },
      );
    }

    // Validate role if provided
    const validRoles = ['student', 'instructor', 'admin', 'parent'];
    const userRole = role || 'student';
    if (!validRoles.includes(userRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate language if provided
    const validLanguages = ['en', 'ur'];
    const userLanguage = language || 'en';
    if (!validLanguages.includes(userLanguage)) {
      return NextResponse.json(
        { error: 'Invalid language. Must be one of: en, ur' },
        { status: 400 },
      );
    }

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 },
      );
    }

    // ── Create user ───────────────────────────────────────────────────────

    const defaultPassword = 'TempPass123!';
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: userRole,
        phone: phone || null,
        bio: bio || null,
        language: userLanguage,
        passwordHash: simpleHash(defaultPassword),
        isVerified: false,
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        status: true,
        isVerified: true,
        mfaEnabled: true,
        authProvider: true,
        language: true,
        phone: true,
        bio: true,
        xp: true,
        level: true,
        shijlCoins: true,
        streak: true,
        lastActiveAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: true,
            coursesCreated: true,
          },
        },
      },
    });

    // ── Create UserSession for the new user ───────────────────────────────

    const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h expiry

    await db.userSession.create({
      data: {
        userId: user.id,
        token: sessionToken,
        deviceName: 'Admin Created',
        deviceType: 'desktop',
        browser: 'System',
        os: 'N/A',
        isActive: true,
        expiresAt,
      },
    });

    // ── Simulate welcome email if requested ───────────────────────────────

    if (sendWelcomeEmail) {
      await db.notification.create({
        data: {
          userId: user.id,
          type: 'system',
          title: 'Welcome to ShijlAI Academy!',
          content: `Hello ${user.name}, your account has been created. Please check your email for login instructions and change your password after first login.`,
          icon: '🎉',
        },
      });
    }

    // ── Create InstructorProfile if role is instructor ────────────────────

    if (userRole === 'instructor') {
      const existingProfile = await db.instructorProfile.findUnique({
        where: { instructorId: user.id },
      });
      if (!existingProfile) {
        await db.instructorProfile.create({
          data: { instructorId: user.id, applicationStatus: 'pending' },
        });
      }
    }

    // ── Log activity ──────────────────────────────────────────────────────

    await db.activityLog.create({
      data: {
        userId: user.id,
        type: 'user_signup',
        title: `Admin created user: ${user.name}`,
        description: `Role: ${userRole}. Email: ${user.email}${sendWelcomeEmail ? '. Welcome email sent.' : ''}`,
        icon: '👤',
        action: 'created',
        targetName: user.name,
        targetType: 'user',
        targetId: user.id,
        severity: 'info',
        category: 'user_management',
      },
    });

    // ── Format response ───────────────────────────────────────────────────

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          status: user.status,
          isVerified: user.isVerified,
          mfaEnabled: user.mfaEnabled,
          authProvider: user.authProvider,
          language: user.language,
          phone: user.phone,
          bio: user.bio,
          xp: user.xp,
          level: user.level,
          shijlCoins: user.shijlCoins,
          streak: user.streak,
          lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
          lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          enrollmentCount: user._count.enrollments,
          courseCount: user._count.coursesCreated,
        },
        temporaryPassword: defaultPassword,
        sessionToken,
        welcomeEmailSent: !!sendWelcomeEmail,
        message: 'User created successfully. A temporary password has been assigned.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Admin create user API error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 },
    );
  }
}
