import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Types ──────────────────────────────────────────────────────────────────

interface InstructorListItem {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  phone: string | null;
  status: string;
  isVerified: boolean;
  lastActiveAt: string | null;
  createdAt: string;
  instructorProfile: {
    headline: string | null;
    expertise: string | null;
    ntn: string | null;
    ntnVerified: boolean;
    applicationStatus: string | null;
    appliedAt: string | null;
    reviewedAt: string | null;
    rejectionReason: string | null;
  } | null;
  courseStats: {
    totalCourses: number;
    publishedCourses: number;
    totalEnrollments: number;
    avgRating: number;
  };
  totalEarnings: number;
  totalStudents: number;
  payoutMethod: {
    type: string;
    last4: string;
    bankName: string | null;
  } | null;
  commissionOverride: {
    commissionRate: number;
    reason: string | null;
  } | null;
}

interface InstructorStats {
  totalInstructors: number;
  activeInstructors: number;
  suspendedInstructors: number;
  bannedInstructors: number;
  pendingApplications: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  totalCourses: number;
  totalStudents: number;
  totalEarnings: number;
  avgRating: number;
  ntnVerifiedCount: number;
}

type SortField = 'name' | 'createdAt' | 'lastActiveAt' | 'totalStudents' | 'totalEarnings';
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

// ─── GET /api/admin/instructors ─────────────────────────────────────────────
// List all instructors with advanced filtering, pagination, and stats

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
    const status = searchParams.get('status') || '';
    const applicationStatus = searchParams.get('applicationStatus') || '';

    // Advanced filters
    const ntnVerified = searchParams.get('ntnVerified') || '';
    const hasCourses = searchParams.get('hasCourses') || '';

    // Date range filters
    const joinedAfter = searchParams.get('joinedAfter') || '';
    const joinedBefore = searchParams.get('joinedBefore') || '';

    // Sorting
    const sortField = (searchParams.get('sortField') || 'createdAt') as SortField;
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as SortOrder;

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

    // Application status filter (via instructor profile relation)
    if (applicationStatus) {
      whereConditions.push({
        instructorProfile: { applicationStatus },
      });
    }

    // NTN verified filter
    if (ntnVerified === 'true') {
      whereConditions.push({
        instructorProfile: { ntnVerified: true },
      });
    } else if (ntnVerified === 'false') {
      whereConditions.push({
        instructorProfile: { ntnVerified: false },
      });
    }

    // Has courses filter
    if (hasCourses === 'true') {
      whereConditions.push({
        coursesCreated: { some: {} },
      });
    } else if (hasCourses === 'false') {
      whereConditions.push({
        coursesCreated: { none: {} },
      });
    }

    // Joined date range filter
    if (joinedAfter || joinedBefore) {
      const joinedFilter: Record<string, any> = {};
      if (joinedAfter) joinedFilter.gte = new Date(joinedAfter);
      if (joinedBefore) joinedFilter.lte = new Date(joinedBefore);
      whereConditions.push({ createdAt: joinedFilter });
    }

    const where = whereConditions.length > 0
      ? { AND: whereConditions }
      : { role: 'instructor' };

    // ── Sorting ───────────────────────────────────────────────────────────

    const validSortFields: SortField[] = ['name', 'createdAt', 'lastActiveAt', 'totalStudents', 'totalEarnings'];
    const validSortOrders: SortOrder[] = ['asc', 'desc'];
    const safeSortField = validSortFields.includes(sortField) ? sortField : 'createdAt';
    const safeSortOrder = validSortOrders.includes(sortOrder) ? sortOrder : 'desc';

    // For computed sort fields (totalStudents, totalEarnings), we'll sort after query
    const isComputedSort = safeSortField === 'totalStudents' || safeSortField === 'totalEarnings';
    const dbSortField = isComputedSort ? 'createdAt' : safeSortField;

    // ── Fetch instructors and total ───────────────────────────────────────

    const [instructors, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          phone: true,
          status: true,
          isVerified: true,
          flaggedReason: true,
          lastActiveAt: true,
          createdAt: true,
          instructorProfile: {
            select: {
              headline: true,
              expertise: true,
              ntn: true,
              ntnVerified: true,
              applicationStatus: true,
              appliedAt: true,
              reviewedAt: true,
              rejectionReason: true,
            },
          },
          payoutMethods: {
            where: { isDefault: true },
            take: 1,
            select: {
              type: true,
              accountNumber: true,
              phoneNumber: true,
              bankName: true,
            },
          },
          commissionOverride: {
            select: {
              commissionRate: true,
              reason: true,
            },
          },
          _count: {
            select: {
              coursesCreated: true,
            },
          },
        },
        orderBy: { [dbSortField]: safeSortOrder },
        skip: isComputedSort ? 0 : skip,
        take: isComputedSort ? 9999 : limit,
      }),
      db.user.count({ where }),
    ]);

    // ── Compute course stats and earnings for each instructor ─────────────

    const instructorIds = instructors.map((i) => i.id);

    // Batch fetch course stats
    const courseStatsMap = new Map<string, { totalCourses: number; publishedCourses: number; totalEnrollments: number; avgRating: number }>();

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

    const publishedMap = new Map(publishedCourseCounts.map((c) => [c.instructorId, c._count._all]));

    for (const agg of courseAggregates) {
      courseStatsMap.set(agg.instructorId, {
        totalCourses: agg._count._all,
        publishedCourses: publishedMap.get(agg.instructorId) ?? 0,
        totalEnrollments: agg._sum.enrollmentCount ?? 0,
        avgRating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
      });
    }

    // Batch fetch total earnings
    const earningsMap = new Map<string, number>();
    const earningsAggregates = await db.transaction.groupBy({
      by: ['instructorId'],
      where: { instructorId: { in: instructorIds }, type: 'enrollment', status: 'completed' },
      _sum: { instructorEarning: true },
    });
    for (const ea of earningsAggregates) {
      if (ea.instructorId) {
        earningsMap.set(ea.instructorId, ea._sum.instructorEarning || 0);
      }
    }

    // Batch fetch total students (unique enrollment count)
    const studentsMap = new Map<string, number>();
    // We'll use the enrollmentCount sum from courses as a proxy for total students
    for (const agg of courseAggregates) {
      studentsMap.set(agg.instructorId, agg._sum.enrollmentCount || 0);
    }

    // ── Format instructors ────────────────────────────────────────────────

    let formattedInstructors: InstructorListItem[] = instructors.map((inst) => {
      const courseStats = courseStatsMap.get(inst.id) || {
        totalCourses: 0,
        publishedCourses: 0,
        totalEnrollments: 0,
        avgRating: 0,
      };

      const defaultPayout = inst.payoutMethods[0];
      let payoutMethod: InstructorListItem['payoutMethod'] = null;
      if (defaultPayout) {
        payoutMethod = {
          type: defaultPayout.type,
          last4: defaultPayout.accountNumber?.slice(-4) || defaultPayout.phoneNumber?.slice(-4) || '****',
          bankName: defaultPayout.bankName ?? null,
        };
      }

      let displayStatus = inst.status || 'active';
      if (inst.flaggedReason) {
        displayStatus = 'flagged';
      } else if (!inst.isVerified) {
        displayStatus = 'pending_verification';
      }

      return {
        id: inst.id,
        name: inst.name,
        email: inst.email,
        avatar: inst.avatar,
        phone: inst.phone,
        status: displayStatus,
        isVerified: inst.isVerified,
        lastActiveAt: inst.lastActiveAt?.toISOString() ?? null,
        createdAt: inst.createdAt.toISOString(),
        instructorProfile: inst.instructorProfile ? {
          headline: inst.instructorProfile.headline,
          expertise: (() => { try { return inst.instructorProfile.expertise ? JSON.parse(inst.instructorProfile.expertise) : null; } catch { return inst.instructorProfile.expertise; } })(),
          ntn: inst.instructorProfile.ntn,
          ntnVerified: inst.instructorProfile.ntnVerified,
          applicationStatus: inst.instructorProfile.applicationStatus,
          appliedAt: inst.instructorProfile.appliedAt?.toISOString() ?? null,
          reviewedAt: inst.instructorProfile.reviewedAt?.toISOString() ?? null,
          rejectionReason: inst.instructorProfile.rejectionReason,
        } : null,
        courseStats,
        totalEarnings: earningsMap.get(inst.id) || 0,
        totalStudents: studentsMap.get(inst.id) || 0,
        payoutMethod,
        commissionOverride: inst.commissionOverride ? {
          commissionRate: inst.commissionOverride.commissionRate,
          reason: inst.commissionOverride.reason,
        } : null,
      };
    });

    // ── Apply computed sorting ────────────────────────────────────────────

    if (isComputedSort) {
      formattedInstructors.sort((a, b) => {
        const valA = safeSortField === 'totalStudents' ? a.totalStudents : a.totalEarnings;
        const valB = safeSortField === 'totalStudents' ? b.totalStudents : b.totalEarnings;
        return safeSortOrder === 'asc' ? valA - valB : valB - valA;
      });
      // Apply pagination after sorting
      formattedInstructors = formattedInstructors.slice(skip, skip + limit);
    }

    // ── Compute stats ─────────────────────────────────────────────────────

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalInstructors,
      activeInstructors,
      suspendedInstructors,
      bannedInstructors,
      pendingApplications,
      approvedThisMonth,
      rejectedThisMonth,
      ntnVerifiedCount,
      totalEarningsAggregate,
      avgRatingAggregate,
      totalCoursesCount,
      totalStudentsAggregate,
    ] = await Promise.all([
      db.user.count({ where: { role: 'instructor' } }),
      db.user.count({ where: { role: 'instructor', status: 'active', isVerified: true } }),
      db.user.count({ where: { role: 'instructor', status: 'suspended' } }),
      db.user.count({ where: { role: 'instructor', status: 'banned' } }),
      db.instructorProfile.count({ where: { applicationStatus: { in: ['pending', 'more_info_requested'] } } }),
      db.instructorProfile.count({ where: { applicationStatus: 'approved', reviewedAt: { gte: monthStart } } }),
      db.instructorProfile.count({ where: { applicationStatus: 'rejected', reviewedAt: { gte: monthStart } } }),
      db.instructorProfile.count({ where: { ntnVerified: true } }),
      db.transaction.aggregate({
        where: { instructor: { role: 'instructor' }, type: 'enrollment', status: 'completed' },
        _sum: { instructorEarning: true },
      }),
      db.course.aggregate({
        where: { instructor: { role: 'instructor' }, isPublished: true, rating: { gt: 0 } },
        _avg: { rating: true },
      }),
      db.course.count({ where: { instructor: { role: 'instructor' } } }),
      db.course.aggregate({
        where: { instructor: { role: 'instructor' } },
        _sum: { enrollmentCount: true },
      }),
    ]);

    const stats: InstructorStats = {
      totalInstructors,
      activeInstructors,
      suspendedInstructors,
      bannedInstructors,
      pendingApplications,
      approvedThisMonth,
      rejectedThisMonth,
      totalCourses: totalCoursesCount ?? 0,
      totalStudents: totalStudentsAggregate?._sum?.enrollmentCount ?? 0,
      totalEarnings: totalEarningsAggregate._sum.instructorEarning || 0,
      avgRating: avgRatingAggregate._avg.rating ? Math.round(avgRatingAggregate._avg.rating * 10) / 10 : 0,
      ntnVerifiedCount,
    };

    return NextResponse.json({
      instructors: formattedInstructors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('Admin instructors list API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instructors' },
      { status: 500 },
    );
  }
}

// ─── POST /api/admin/instructors ────────────────────────────────────────────
// Create a new instructor (promote existing user or create new)

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, userId, name, email, phone, expertise, headline } = body;

    if (!action || !['promote', 'create'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "promote" or "create"' },
        { status: 400 },
      );
    }

    // ── Promote existing user ─────────────────────────────────────────────

    if (action === 'promote') {
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required for promote action' },
          { status: 400 },
        );
      }

      const existingUser = await db.user.findUnique({ where: { id: userId } });
      if (!existingUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 },
        );
      }

      if (existingUser.role === 'instructor') {
        return NextResponse.json(
          { error: 'User is already an instructor' },
          { status: 409 },
        );
      }

      // Update user role to instructor
      const updatedUser = await db.user.update({
        where: { id: userId },
        data: {
          role: 'instructor',
          isVerified: true,
        },
      });

      // Create instructor profile if not exists
      const existingProfile = await db.instructorProfile.findUnique({
        where: { instructorId: userId },
      });

      let profile;
      if (!existingProfile) {
        profile = await db.instructorProfile.create({
          data: {
            instructorId: userId,
            headline: headline || null,
            expertise: expertise ? JSON.stringify(Array.isArray(expertise) ? expertise : [expertise]) : null,
            applicationStatus: 'approved',
            appliedAt: new Date(),
            reviewedAt: new Date(),
          },
        });
      } else {
        profile = await db.instructorProfile.update({
          where: { instructorId: userId },
          data: {
            applicationStatus: 'approved',
            reviewedAt: new Date(),
            ...(headline && { headline }),
            ...(expertise && { expertise: JSON.stringify(Array.isArray(expertise) ? expertise : [expertise]) }),
          },
        });
      }

      // Create instructor settings if not exists
      const existingSettings = await db.instructorSettings.findUnique({
        where: { instructorId: userId },
      });
      if (!existingSettings) {
        await db.instructorSettings.create({
          data: { instructorId: userId },
        });
      }

      // Send notification
      await db.notification.create({
        data: {
          userId: userId,
          type: 'system',
          title: 'Instructor Account Activated!',
          content: `Congratulations! Your account has been upgraded to instructor. You can now create and publish courses on ShijlAI Academy.`,
          icon: '🎉',
        },
      });

      // Log activity
      await db.activityLog.create({
        data: {
          userId: userId,
          type: 'instructor_approved',
          title: `User promoted to instructor: ${updatedUser.name}`,
          description: `Role changed from ${existingUser.role} to instructor by admin`,
          icon: '🎓',
          action: 'promoted',
          targetName: updatedUser.name,
          targetType: 'user',
          targetId: userId,
          severity: 'info',
          category: 'user_management',
        },
      });

      return NextResponse.json({
        instructor: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          status: updatedUser.status,
          isVerified: updatedUser.isVerified,
          profile,
        },
        message: 'User promoted to instructor successfully',
      }, { status: 201 });
    }

    // ── Create new instructor ─────────────────────────────────────────────

    if (action === 'create') {
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

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 },
        );
      }

      // Check if email already exists
      const existing = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (existing) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 },
        );
      }

      // Create user with instructor role
      const defaultPassword = 'InstructorPass123!';
      const newUser = await db.user.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone || null,
          role: 'instructor',
          passwordHash: simpleHash(defaultPassword),
          isVerified: true,
          status: 'active',
        },
      });

      // Create instructor profile
      const profile = await db.instructorProfile.create({
        data: {
          instructorId: newUser.id,
          headline: headline || null,
          expertise: expertise ? JSON.stringify(Array.isArray(expertise) ? expertise : [expertise]) : null,
          applicationStatus: 'approved',
          appliedAt: new Date(),
          reviewedAt: new Date(),
        },
      });

      // Create instructor settings
      await db.instructorSettings.create({
        data: { instructorId: newUser.id },
      });

      // Create session token
      const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db.userSession.create({
        data: {
          userId: newUser.id,
          token: sessionToken,
          deviceName: 'Admin Created',
          deviceType: 'desktop',
          browser: 'System',
          os: 'N/A',
          isActive: true,
          expiresAt,
        },
      });

      // Send welcome notification
      await db.notification.create({
        data: {
          userId: newUser.id,
          type: 'system',
          title: 'Welcome to ShijlAI Academy!',
          content: `Hello ${newUser.name}, your instructor account has been created. Please check your email for login instructions and change your password after first login.`,
          icon: '🎉',
        },
      });

      // Log activity
      await db.activityLog.create({
        data: {
          userId: newUser.id,
          type: 'instructor_approved',
          title: `Admin created instructor: ${newUser.name}`,
          description: `Email: ${newUser.email}. Instructor account created by admin.`,
          icon: '👤',
          action: 'created',
          targetName: newUser.name,
          targetType: 'user',
          targetId: newUser.id,
          severity: 'info',
          category: 'user_management',
        },
      });

      return NextResponse.json({
        instructor: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          isVerified: newUser.isVerified,
          profile,
        },
        temporaryPassword: defaultPassword,
        sessionToken,
        message: 'Instructor created successfully. A temporary password has been assigned.',
      }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin create instructor API error:', error);
    return NextResponse.json(
      { error: 'Failed to create instructor' },
      { status: 500 },
    );
  }
}
