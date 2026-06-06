import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AdminNote {
  note: string;
  adminName: string;
  date: string;
}

interface SessionInfo {
  id: string;
  deviceName: string | null;
  deviceType: string;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  location: string | null;
  lastActivity: string;
  createdAt: string;
  expiresAt: string;
}

interface LoginHistoryItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  metadata: string | null;
}

interface EnrollmentDetail {
  id: string;
  courseId: string;
  courseTitle: string;
  progress: number;
  status: string;
  enrolledAt: string;
  completedAt: string | null;
}

interface CourseDetail {
  id: string;
  title: string;
  enrollmentCount: number;
  rating: number;
  isPublished: boolean;
  reviewStatus: string;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface InstructorPerformance {
  coursesPublished: number;
  totalStudents: number;
  totalEarnings: number;
  platformCutCollected: number;
  avgRating: number;
  totalReviews: number;
  qaAnswerRate: number;
}

interface StudentPerformance {
  enrolledCourses: number;
  completedCourses: number;
  avgProgress: number;
  certificatesEarned: number;
  quizzesTaken: number;
  badgesEarned: number;
  xp: number;
  level: number;
  streak: number;
}

interface ParentPerformance {
  linkedChildrenCount: number;
}

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

// ─── Helper: Calculate risk score ───────────────────────────────────────────
// Risk score 0-100: 0 = safe, 100 = high risk

function calculateRiskScore(params: {
  loginAttempts: number;
  mfaEnabled: boolean;
  flaggedReason: string | null;
  status: string;
  isVerified: boolean;
  lockedUntil: Date | null;
  activeSessionCount: number;
}): number {
  let score = 0;

  // High login attempts
  if (params.loginAttempts > 10) score += 25;
  else if (params.loginAttempts > 5) score += 15;
  else if (params.loginAttempts > 3) score += 5;

  // No MFA
  if (!params.mfaEnabled) score += 15;

  // Flagged
  if (params.flaggedReason) score += 20;

  // Suspicious status
  if (params.status === 'suspended') score += 20;
  if (params.status === 'banned') score += 30;

  // Unverified
  if (!params.isVerified) score += 10;

  // Currently locked
  if (params.lockedUntil && new Date(params.lockedUntil) > new Date()) score += 15;

  // Too many active sessions
  if (params.activeSessionCount > 10) score += 10;
  else if (params.activeSessionCount > 5) score += 5;

  return Math.min(100, score);
}

// ─── GET /api/admin/users/[id] ──────────────────────────────────────────────
// Detailed user info with sessions, login history, risk score, and more

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      include: {
        instructorProfile: true,
        instructorSettings: true,
        payoutMethods: {
          where: { isDefault: true },
          take: 1,
        },
        sessions: {
          where: { isActive: true },
          orderBy: { lastActivity: 'desc' },
        },
        _count: {
          select: {
            enrollments: true,
            coursesCreated: true,
            certificates: true,
            quizAttempts: true,
            badges: true,
            sessions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ── Active sessions ───────────────────────────────────────────────────

    const activeSessions: SessionInfo[] = user.sessions
      .filter((s) => s.isActive && new Date(s.expiresAt) > new Date())
      .map((s) => ({
        id: s.id,
        deviceName: s.deviceName,
        deviceType: s.deviceType,
        browser: s.browser,
        os: s.os,
        ipAddress: s.ipAddress,
        location: s.location,
        lastActivity: s.lastActivity.toISOString(),
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
      }));

    // ── Login history ─────────────────────────────────────────────────────

    const loginHistoryRecords = await db.activityLog.findMany({
      where: {
        userId: user.id,
        type: { contains: 'login' },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const loginHistory: LoginHistoryItem[] = loginHistoryRecords.map((l) => ({
      id: l.id,
      type: l.type,
      title: l.title,
      description: l.description,
      createdAt: l.createdAt.toISOString(),
      metadata: l.metadata,
    }));

    // ── Enrollment details (for students) ─────────────────────────────────

    let enrollmentDetails: EnrollmentDetail[] = [];
    if (user.role === 'student') {
      const enrollments = await db.enrollment.findMany({
        where: { userId: user.id },
        include: { course: { select: { title: true } } },
        orderBy: { enrolledAt: 'desc' },
        take: 50,
      });
      enrollmentDetails = enrollments.map((e) => ({
        id: e.id,
        courseId: e.courseId,
        courseTitle: e.course.title,
        progress: Math.round(e.progress),
        status: e.status,
        enrolledAt: e.enrolledAt.toISOString(),
        completedAt: e.completedAt?.toISOString() ?? null,
      }));
    }

    // ── Course details (for instructors) ──────────────────────────────────

    let courseDetails: CourseDetail[] = [];
    if (user.role === 'instructor') {
      const courses = await db.course.findMany({
        where: { instructorId: user.id },
        select: {
          id: true,
          title: true,
          enrollmentCount: true,
          rating: true,
          isPublished: true,
          reviewStatus: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      courseDetails = courses.map((c) => ({
        id: c.id,
        title: c.title,
        enrollmentCount: c.enrollmentCount,
        rating: Math.round(c.rating * 10) / 10,
        isPublished: c.isPublished,
        reviewStatus: c.reviewStatus,
      }));
    }

    // ── Recent notifications ──────────────────────────────────────────────

    const recentNotificationsRaw = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const recentNotifications: NotificationItem[] = recentNotificationsRaw.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      content: n.content,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }));

    // ── Instructor performance data ───────────────────────────────────────

    let performance: InstructorPerformance | StudentPerformance | ParentPerformance | null = null;

    if (user.role === 'instructor') {
      const [
        totalStudents,
        totalEarnings,
        avgRating,
        totalReviews,
        qaAnswered,
        qaTotal,
      ] = await Promise.all([
        db.enrollment.count({
          where: { course: { instructorId: user.id } },
        }),
        db.transaction.aggregate({
          where: { instructorId: user.id, type: 'enrollment', status: 'completed' },
          _sum: { amount: true },
        }),
        db.course.aggregate({
          where: { instructorId: user.id, isPublished: true, rating: { gt: 0 } },
          _avg: { rating: true },
        }),
        db.review.count({
          where: { course: { instructorId: user.id } },
        }),
        db.qAQuestion.count({
          where: { course: { instructorId: user.id }, isAnswered: true },
        }),
        db.qAQuestion.count({
          where: { course: { instructorId: user.id } },
        }),
      ]);

      const totalEarningsAmount = totalEarnings._sum.amount || 0;
      const platformCutAmount = Math.round(totalEarningsAmount * 0.2);
      const qaAnswerRate = qaTotal > 0 ? Math.round((qaAnswered / qaTotal) * 100) : 0;

      performance = {
        coursesPublished: user._count.coursesCreated,
        totalStudents,
        totalEarnings: totalEarningsAmount,
        platformCutCollected: platformCutAmount,
        avgRating: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : 0,
        totalReviews,
        qaAnswerRate,
      };
    }

    // ── Student performance data ──────────────────────────────────────────

    if (user.role === 'student') {
      const [completedCourses, avgProgress] = await Promise.all([
        db.enrollment.count({
          where: { userId: user.id, status: 'completed' },
        }),
        db.enrollment.aggregate({
          where: { userId: user.id, status: 'active' },
          _avg: { progress: true },
        }),
      ]);

      performance = {
        enrolledCourses: user._count.enrollments,
        completedCourses,
        avgProgress: avgProgress._avg.progress ? Math.round(avgProgress._avg.progress) : 0,
        certificatesEarned: user._count.certificates,
        quizzesTaken: user._count.quizAttempts,
        badgesEarned: user._count.badges,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
      };
    }

    // ── Parent performance data ───────────────────────────────────────────

    if (user.role === 'parent') {
      const linkedChildrenCount = await db.parentLink.count({
        where: { parentId: user.id },
      });
      performance = { linkedChildrenCount };
    }

    // ── Recent activity log ───────────────────────────────────────────────

    const recentActivity = await db.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // ── Admin notes ───────────────────────────────────────────────────────

    let adminNotes: AdminNote[] = [];
    try {
      if (user.adminNotes) {
        adminNotes = JSON.parse(user.adminNotes);
      }
    } catch { /* ignore parse errors */ }

    // ── Payout info ───────────────────────────────────────────────────────

    const defaultPayout = user.payoutMethods[0];
    let payoutInfo: { type: string; last4: string; bankName: string | null } | null = null;
    if (defaultPayout) {
      payoutInfo = {
        type: defaultPayout.type,
        last4: defaultPayout.accountNumber?.slice(-4) || defaultPayout.phoneNumber?.slice(-4) || '****',
        bankName: defaultPayout.bankName ?? null,
      };
    }

    // ── Display status ────────────────────────────────────────────────────

    let displayStatus = user.status || 'active';
    if (user.flaggedReason) {
      displayStatus = 'flagged';
    } else if (user.role === 'instructor' && !user.isVerified) {
      displayStatus = 'pending_verification';
    }

    // ── Account age ───────────────────────────────────────────────────────

    const accountAgeMs = Date.now() - user.createdAt.getTime();
    const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

    // ── Risk score ────────────────────────────────────────────────────────

    const activeSessionCount = user.sessions.filter(
      (s) => s.isActive && new Date(s.expiresAt) > new Date(),
    ).length;

    const riskScore = calculateRiskScore({
      loginAttempts: user.loginAttempts,
      mfaEnabled: user.mfaEnabled,
      flaggedReason: user.flaggedReason,
      status: user.status,
      isVerified: user.isVerified,
      lockedUntil: user.lockedUntil,
      activeSessionCount,
    });

    // ── Build response ────────────────────────────────────────────────────

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        bio: user.bio,
        language: user.language,
        phone: user.phone,
        status: displayStatus,
        dbStatus: user.status,
        isVerified: user.isVerified,
        mfaEnabled: user.mfaEnabled,
        authProvider: user.authProvider,
        flaggedReason: user.flaggedReason,
        xp: user.xp,
        level: user.level,
        shijlCoins: user.shijlCoins,
        streak: user.streak,
        longestStreak: user.longestStreak,
        loginAttempts: user.loginAttempts,
        lockedUntil: user.lockedUntil?.toISOString() ?? null,
        lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        lastLoginIp: user.lastLoginIp,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        accountAgeDays,
        riskScore,
        instructorProfile: user.instructorProfile ? {
          headline: user.instructorProfile.headline,
          linkedin: user.instructorProfile.linkedin,
          website: user.instructorProfile.website,
          ntn: user.instructorProfile.ntn,
          ntnVerified: user.instructorProfile.ntnVerified,
          expertise: user.instructorProfile.expertise,
          applicationStatus: user.instructorProfile.applicationStatus,
          cnic: user.instructorProfile.cnic,
          topicProposal: user.instructorProfile.topicProposal,
          sampleOutline: user.instructorProfile.sampleOutline,
          appliedAt: user.instructorProfile.appliedAt?.toISOString() ?? null,
          reviewedAt: user.instructorProfile.reviewedAt?.toISOString() ?? null,
          rejectionReason: user.instructorProfile.rejectionReason,
        } : null,
        payoutInfo,
        performance,
        activeSessions,
        loginHistory,
        enrollmentDetails,
        courseDetails,
        recentNotifications,
        recentActivity: recentActivity.map((a) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          description: a.description,
          icon: a.icon,
          severity: a.severity,
          category: a.category,
          createdAt: a.createdAt.toISOString(),
        })),
        adminNotes,
      },
    });
  } catch (error) {
    console.error('Admin user detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 },
    );
  }
}

// ─── PATCH /api/admin/users/[id] ────────────────────────────────────────────
// Update user with comprehensive admin actions

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, data } = body;

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updateData: Record<string, any> = {};
    let logType = '';
    let logTitle = '';
    let logDescription = '';
    let logIcon = '📋';
    let logSeverity: string = 'info';
    let logCategory: string = 'user_management';
    let logAction: string = 'updated';
    let tempPassword: string | undefined;
    let impersonationToken: string | undefined;

    switch (action) {
      // ── Status actions ──────────────────────────────────────────────────

      case 'suspend': {
        // Protect admin users from being suspended
        if (user.role === 'admin') {
          return NextResponse.json(
            { error: 'Cannot suspend admin users' },
            { status: 403 },
          );
        }
        updateData = {
          status: 'suspended',
          lockedUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        };
        logType = 'user_suspended';
        logTitle = `User suspended: ${user.name}`;
        logDescription = data?.reason ? `Account suspended by admin. Reason: ${data.reason}` : 'Account suspended by admin';
        logIcon = '🚫';
        logSeverity = 'warning';
        logAction = 'suspended';
        break;
      }

      case 'unsuspend': {
        updateData = { status: 'active', lockedUntil: null };
        logType = 'user_unsuspended';
        logTitle = `User unsuspended: ${user.name}`;
        logDescription = 'Account reactivated by admin';
        logIcon = '✅';
        logAction = 'unsuspended';
        break;
      }

      case 'ban': {
        // Protect admin users from being banned
        if (user.role === 'admin') {
          return NextResponse.json(
            { error: 'Cannot ban admin users' },
            { status: 403 },
          );
        }
        updateData = {
          status: 'banned',
          lockedUntil: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
        };
        logType = 'user_banned';
        logTitle = `User banned: ${user.name}`;
        logDescription = data?.reason ? `Account permanently banned by admin. Reason: ${data.reason}` : 'Account permanently banned by admin';
        logIcon = '🔴';
        logSeverity = 'critical';
        logAction = 'banned';
        break;
      }

      // ── Flag actions ────────────────────────────────────────────────────

      case 'flag': {
        updateData = { flaggedReason: data?.reason || 'Flagged by admin' };
        logType = 'user_flagged';
        logTitle = `User flagged: ${user.name}`;
        logDescription = data?.reason || 'Flagged by admin';
        logIcon = '⚠️';
        logSeverity = 'warning';
        logAction = 'flagged';
        break;
      }

      case 'unflag': {
        updateData = { flaggedReason: null };
        logType = 'user_unflagged';
        logTitle = `User unflagged: ${user.name}`;
        logDescription = 'Flag removed by admin';
        logIcon = '✅';
        logAction = 'unflagged';
        break;
      }

      // ── Verification ────────────────────────────────────────────────────

      case 'verify': {
        updateData = { isVerified: true };
        logType = 'user_verified';
        logTitle = `User verified: ${user.name}`;
        logDescription = 'Email/account verified by admin';
        logIcon = '✓';
        logAction = 'verified';
        break;
      }

      // ── Role change ─────────────────────────────────────────────────────

      case 'change_role': {
        if (!data?.role) {
          return NextResponse.json({ error: 'Role is required' }, { status: 400 });
        }
        const validRoles = ['student', 'instructor', 'admin', 'parent'];
        if (!validRoles.includes(data.role)) {
          return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
        }
        updateData = { role: data.role };
        if (data.role === 'instructor') {
          const existingProfile = await db.instructorProfile.findUnique({
            where: { instructorId: id },
          });
          if (!existingProfile) {
            await db.instructorProfile.create({
              data: { instructorId: id, applicationStatus: 'approved' },
            });
          } else {
            await db.instructorProfile.update({
              where: { instructorId: id },
              data: { applicationStatus: 'approved' },
            });
          }
          updateData.isVerified = true;
        }
        logType = 'user_role_changed';
        logTitle = `User role changed: ${user.name}`;
        logDescription = `Role changed from ${user.role} to ${data.role}`;
        logIcon = '🔄';
        logSeverity = 'warning';
        logAction = 'changed';
        break;
      }

      // ── Password reset ──────────────────────────────────────────────────

      case 'reset_password': {
        tempPassword = `Reset${Date.now().toString(36)}!`;
        updateData = {
          passwordHash: simpleHash(tempPassword),
          resetToken: null,
          resetTokenExpiresAt: null,
          loginAttempts: 0,
          lockedUntil: null,
          status: user.status === 'banned' ? user.status : 'active',
        };
        logType = 'password_reset';
        logTitle = `Password reset: ${user.name}`;
        logDescription = 'Password reset by admin';
        logIcon = '🔑';
        logSeverity = 'warning';
        logCategory = 'security';
        logAction = 'reset';
        break;
      }

      // ── Profile update ──────────────────────────────────────────────────

      case 'update_profile': {
        // Validate email if changing
        if (data?.email && data.email !== user.email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(data.email)) {
            return NextResponse.json(
              { error: 'Invalid email format' },
              { status: 400 },
            );
          }
          const existingEmail = await db.user.findUnique({ where: { email: data.email } });
          if (existingEmail) {
            return NextResponse.json(
              { error: 'Email already in use by another user' },
              { status: 409 },
            );
          }
        }
        updateData = {
          name: data?.name || user.name,
          email: data?.email || user.email,
          bio: data?.bio !== undefined ? data.bio : user.bio,
          phone: data?.phone !== undefined ? data.phone : user.phone,
        };
        logType = 'profile_updated';
        logTitle = `Profile updated by admin: ${user.name}`;
        logDescription = 'Admin edited user profile';
        logIcon = '✏️';
        logAction = 'updated';
        break;
      }

      // ── Add note ────────────────────────────────────────────────────────

      case 'add_note': {
        if (!data?.note) {
          return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
        }
        const currentNotes: AdminNote[] = (() => {
          try { return user.adminNotes ? JSON.parse(user.adminNotes) : []; }
          catch { return []; }
        })();
        const newNote: AdminNote = {
          note: data.note,
          adminName: data?.adminName || 'Admin',
          date: new Date().toISOString(),
        };
        updateData = { adminNotes: JSON.stringify([...currentNotes, newNote]) };
        logType = 'admin_note_added';
        logTitle = `Admin note added for: ${user.name}`;
        logDescription = data.note.substring(0, 100);
        logIcon = '📝';
        logAction = 'added';
        break;
      }

      // ── NEW: Impersonate ────────────────────────────────────────────────

      case 'impersonate': {
        // Generate a temporary session token for admin to login as this user
        impersonationToken = `imp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await db.userSession.create({
          data: {
            userId: user.id,
            token: impersonationToken,
            deviceName: 'Admin Impersonation',
            deviceType: 'desktop',
            browser: 'Admin Panel',
            os: 'N/A',
            isActive: true,
            expiresAt,
          },
        });

        logType = 'security_alert';
        logTitle = `Admin impersonated user: ${user.name}`;
        logDescription = `Admin initiated impersonation session for user ${user.email}`;
        logIcon = '🕵️';
        logSeverity = 'critical';
        logCategory = 'security';
        logAction = 'impersonated';
        break;
      }

      // ── NEW: Send notification ──────────────────────────────────────────

      case 'send_notification': {
        if (!data?.title || !data?.content) {
          return NextResponse.json(
            { error: 'Notification title and content are required' },
            { status: 400 },
          );
        }
        await db.notification.create({
          data: {
            userId: user.id,
            type: data?.type || 'system',
            title: data.title,
            content: data.content,
            icon: data?.icon || '📢',
            link: data?.link || null,
          },
        });
        logType = 'notification_sent';
        logTitle = `Notification sent to: ${user.name}`;
        logDescription = `Title: ${data.title}`;
        logIcon = '📢';
        logCategory = 'admin_action';
        logAction = 'sent';
        break;
      }

      // ── NEW: Toggle MFA ─────────────────────────────────────────────────

      case 'toggle_mfa': {
        const newMfaState = !user.mfaEnabled;
        updateData = {
          mfaEnabled: newMfaState,
          mfaSecret: newMfaState ? (user.mfaSecret || 'admin_enabled') : null,
        };
        logType = 'security_alert';
        logTitle = `MFA ${newMfaState ? 'enabled' : 'disabled'} for: ${user.name}`;
        logDescription = `MFA was ${newMfaState ? 'enabled' : 'disabled'} by admin`;
        logIcon = newMfaState ? '🔐' : '🔓';
        logSeverity = newMfaState ? 'info' : 'warning';
        logCategory = 'security';
        logAction = newMfaState ? 'enabled' : 'disabled';
        break;
      }

      // ── NEW: Update language ────────────────────────────────────────────

      case 'update_language': {
        if (!data?.language) {
          return NextResponse.json({ error: 'Language is required' }, { status: 400 });
        }
        const validLanguages = ['en', 'ur'];
        if (!validLanguages.includes(data.language)) {
          return NextResponse.json(
            { error: 'Invalid language. Must be one of: en, ur' },
            { status: 400 },
          );
        }
        updateData = { language: data.language };
        logType = 'settings_updated';
        logTitle = `Language updated for: ${user.name}`;
        logDescription = `Language changed to ${data.language}`;
        logIcon = '🌐';
        logAction = 'updated';
        break;
      }

      // ── NEW: Delete note ────────────────────────────────────────────────

      case 'delete_note': {
        if (data?.index === undefined || data?.index === null) {
          return NextResponse.json(
            { error: 'Note index is required' },
            { status: 400 },
          );
        }
        const existingNotes: AdminNote[] = (() => {
          try { return user.adminNotes ? JSON.parse(user.adminNotes) : []; }
          catch { return []; }
        })();
        const noteIndex = Number(data.index);
        if (noteIndex < 0 || noteIndex >= existingNotes.length) {
          return NextResponse.json(
            { error: 'Invalid note index' },
            { status: 400 },
          );
        }
        existingNotes.splice(noteIndex, 1);
        updateData = { adminNotes: JSON.stringify(existingNotes) };
        logType = 'admin_note_deleted';
        logTitle = `Admin note deleted for: ${user.name}`;
        logDescription = `Note at index ${noteIndex} removed`;
        logIcon = '🗑️';
        logAction = 'deleted';
        break;
      }

      // ── NEW: Clear sessions ─────────────────────────────────────────────

      case 'clear_sessions': {
        await db.userSession.updateMany({
          where: { userId: id, isActive: true },
          data: { isActive: false },
        });
        logType = 'security_alert';
        logTitle = `Sessions cleared for: ${user.name}`;
        logDescription = 'All active sessions invalidated by admin';
        logIcon = '🔒';
        logSeverity = 'warning';
        logCategory = 'security';
        logAction = 'cleared';
        break;
      }

      // ── NEW: Adjust coins ───────────────────────────────────────────────

      case 'adjust_coins': {
        if (data?.amount === undefined || data?.amount === null) {
          return NextResponse.json(
            { error: 'Amount is required' },
            { status: 400 },
          );
        }
        const coinAmount = Number(data.amount);
        if (isNaN(coinAmount)) {
          return NextResponse.json(
            { error: 'Amount must be a number' },
            { status: 400 },
          );
        }
        const newCoinBalance = Math.max(0, user.shijlCoins + coinAmount);
        updateData = { shijlCoins: newCoinBalance };
        logType = 'settings_updated';
        logTitle = `Coins adjusted for: ${user.name}`;
        logDescription = `${coinAmount >= 0 ? '+' : ''}${coinAmount} coins (reason: ${data?.reason || 'No reason provided'}). New balance: ${newCoinBalance}`;
        logIcon = '🪙';
        logSeverity = coinAmount < 0 ? 'warning' : 'info';
        logCategory = 'finance';
        logAction = 'adjusted';
        break;
      }

      // ── NEW: Adjust XP ──────────────────────────────────────────────────

      case 'adjust_xp': {
        if (data?.amount === undefined || data?.amount === null) {
          return NextResponse.json(
            { error: 'Amount is required' },
            { status: 400 },
          );
        }
        const xpAmount = Number(data.amount);
        if (isNaN(xpAmount)) {
          return NextResponse.json(
            { error: 'Amount must be a number' },
            { status: 400 },
          );
        }
        const newXpBalance = Math.max(0, user.xp + xpAmount);
        updateData = { xp: newXpBalance };
        logType = 'settings_updated';
        logTitle = `XP adjusted for: ${user.name}`;
        logDescription = `${xpAmount >= 0 ? '+' : ''}${xpAmount} XP (reason: ${data?.reason || 'No reason provided'}). New total: ${newXpBalance}`;
        logIcon = '⚡';
        logSeverity = xpAmount < 0 ? 'warning' : 'info';
        logCategory = 'finance';
        logAction = 'adjusted';
        break;
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 },
        );
    }

    // ── Apply update ──────────────────────────────────────────────────────

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isVerified: true,
        mfaEnabled: true,
        flaggedReason: true,
        shijlCoins: true,
        xp: true,
        language: true,
      },
    });

    // ── Log the action ────────────────────────────────────────────────────

    await db.activityLog.create({
      data: {
        userId: id,
        type: logType,
        title: logTitle,
        description: logDescription,
        icon: logIcon,
        action: logAction,
        targetName: user.name,
        targetType: 'user',
        targetId: id,
        severity: logSeverity,
        category: logCategory,
      },
    });

    // ── Build response ────────────────────────────────────────────────────

    const responseData: Record<string, any> = {
      user: updatedUser,
      message: 'Action completed successfully',
    };
    if (tempPassword) {
      responseData.temporaryPassword = tempPassword;
    }
    if (impersonationToken) {
      responseData.impersonationToken = impersonationToken;
      responseData.impersonationExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Admin user update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/admin/users/[id] ───────────────────────────────────────────

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 403 },
      );
    }

    await db.activityLog.create({
      data: {
        type: 'user_deleted',
        title: `User deleted: ${user.name}`,
        description: `Email: ${user.email}, Role: ${user.role}`,
        icon: '🗑️',
        action: 'deleted',
        targetName: user.name,
        targetType: 'user',
        targetId: id,
        severity: 'critical',
        category: 'user_management',
      },
    });

    await db.user.delete({ where: { id } });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin user delete API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 },
    );
  }
}
