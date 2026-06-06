import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CourseDetail {
  id: string;
  title: string;
  category: string;
  level: string;
  enrollmentCount: number;
  rating: number;
  isPublished: boolean;
  reviewStatus: string;
  price: number;
  createdAt: string;
}

interface PayoutInfo {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  requestedAt: string;
  processedAt: string | null;
}

interface PerformanceStats {
  totalStudents: number;
  totalCourses: number;
  publishedCourses: number;
  avgRating: number;
  totalEarnings: number;
  monthlyEarnings: Array<{ month: string; earnings: number }>;
  qaAnswerRate: number;
  totalReviews: number;
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

// ─── GET /api/admin/instructors/[id] ────────────────────────────────────────
// Full instructor detail with all related data

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const instructor = await db.user.findUnique({
      where: { id, role: 'instructor' },
      include: {
        instructorProfile: true,
        instructorSettings: true,
        payoutMethods: {
          orderBy: { isDefault: 'desc' },
        },
        commissionOverride: true,
        instructorApplication: true,
        _count: {
          select: {
            coursesCreated: true,
            sessions: true,
          },
        },
      },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    }

    // ── Courses ───────────────────────────────────────────────────────────

    const courses = await db.course.findMany({
      where: { instructorId: id },
      select: {
        id: true,
        title: true,
        category: true,
        level: true,
        enrollmentCount: true,
        rating: true,
        isPublished: true,
        reviewStatus: true,
        price: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const courseDetails: CourseDetail[] = courses.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      level: c.level,
      enrollmentCount: c.enrollmentCount,
      rating: Math.round(c.rating * 10) / 10,
      isPublished: c.isPublished,
      reviewStatus: c.reviewStatus,
      price: c.price,
      createdAt: c.createdAt.toISOString(),
    }));

    // ── Recent payouts ────────────────────────────────────────────────────

    const recentPayouts = await db.payout.findMany({
      where: { instructorId: id },
      orderBy: { requestedAt: 'desc' },
      take: 10,
    });

    const payoutInfo: PayoutInfo[] = recentPayouts.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      method: p.method,
      requestedAt: p.requestedAt.toISOString(),
      processedAt: p.processedAt?.toISOString() ?? null,
    }));

    // ── Recent transactions ───────────────────────────────────────────────

    const recentTransactions = await db.transaction.findMany({
      where: { instructorId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        course: { select: { title: true } },
        student: { select: { name: true, email: true } },
      },
    });

    // ── Activity logs ─────────────────────────────────────────────────────

    const activityLogs = await db.activityLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // ── Performance stats ─────────────────────────────────────────────────

    const [
      totalStudents,
      totalEarningsResult,
      avgRatingResult,
      totalReviews,
      qaAnswered,
      qaTotal,
    ] = await Promise.all([
      db.enrollment.count({
        where: { course: { instructorId: id } },
      }),
      db.transaction.aggregate({
        where: { instructorId: id, type: 'enrollment', status: 'completed' },
        _sum: { instructorEarning: true },
      }),
      db.course.aggregate({
        where: { instructorId: id, isPublished: true, rating: { gt: 0 } },
        _avg: { rating: true },
      }),
      db.review.count({
        where: { course: { instructorId: id } },
      }),
      db.qAQuestion.count({
        where: { course: { instructorId: id }, isAnswered: true },
      }),
      db.qAQuestion.count({
        where: { course: { instructorId: id } },
      }),
    ]);

    const totalEarnings = totalEarningsResult._sum.instructorEarning || 0;
    const avgRating = avgRatingResult._avg.rating ? Math.round(avgRatingResult._avg.rating * 10) / 10 : 0;
    const qaAnswerRate = qaTotal > 0 ? Math.round((qaAnswered / qaTotal) * 100) : 0;

    // ── Monthly earnings trend (last 6 months) ────────────────────────────

    const now = new Date();
    const monthlyEarnings: Array<{ month: string; earnings: number }> = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthLabel = monthDate.toLocaleString('default', { year: 'numeric', month: 'short' });

      const monthEarningsResult = await db.transaction.aggregate({
        where: {
          instructorId: id,
          type: 'enrollment',
          status: 'completed',
          createdAt: {
            gte: monthDate,
            lte: monthEnd,
          },
        },
        _sum: { instructorEarning: true },
      });

      monthlyEarnings.push({
        month: monthLabel,
        earnings: monthEarningsResult._sum.instructorEarning || 0,
      });
    }

    // ── Performance stats object ──────────────────────────────────────────

    const performance: PerformanceStats = {
      totalStudents,
      totalCourses: instructor._count.coursesCreated,
      publishedCourses: courses.filter((c) => c.isPublished).length,
      avgRating,
      totalEarnings,
      monthlyEarnings,
      qaAnswerRate,
      totalReviews,
    };

    // ── Active sessions ───────────────────────────────────────────────────

    const activeSessions = await db.userSession.findMany({
      where: { userId: id, isActive: true, expiresAt: { gt: new Date() } },
      orderBy: { lastActivity: 'desc' },
      take: 10,
    });

    // ── Display status ────────────────────────────────────────────────────

    let displayStatus = instructor.status || 'active';
    if (instructor.flaggedReason) {
      displayStatus = 'flagged';
    } else if (!instructor.isVerified) {
      displayStatus = 'pending_verification';
    }

    // ── Build response ────────────────────────────────────────────────────

    return NextResponse.json({
      instructor: {
        // User info
        id: instructor.id,
        name: instructor.name,
        email: instructor.email,
        avatar: instructor.avatar,
        phone: instructor.phone,
        bio: instructor.bio,
        language: instructor.language,
        role: instructor.role,
        status: displayStatus,
        dbStatus: instructor.status,
        isVerified: instructor.isVerified,
        mfaEnabled: instructor.mfaEnabled,
        authProvider: instructor.authProvider,
        flaggedReason: instructor.flaggedReason,
        xp: instructor.xp,
        level: instructor.level,
        shijlCoins: instructor.shijlCoins,
        streak: instructor.streak,
        longestStreak: instructor.longestStreak,
        loginAttempts: instructor.loginAttempts,
        lockedUntil: instructor.lockedUntil?.toISOString() ?? null,
        lastActiveAt: instructor.lastActiveAt?.toISOString() ?? null,
        lastLoginAt: instructor.lastLoginAt?.toISOString() ?? null,
        lastLoginIp: instructor.lastLoginIp,
        createdAt: instructor.createdAt.toISOString(),
        updatedAt: instructor.updatedAt.toISOString(),

        // Instructor profile
        instructorProfile: instructor.instructorProfile ? {
          id: instructor.instructorProfile.id,
          headline: instructor.instructorProfile.headline,
          website: instructor.instructorProfile.website,
          linkedin: instructor.instructorProfile.linkedin,
          twitter: instructor.instructorProfile.twitter,
          youtube: instructor.instructorProfile.youtube,
          expertise: (() => { try { return instructor.instructorProfile.expertise ? JSON.parse(instructor.instructorProfile.expertise) : null; } catch { return instructor.instructorProfile.expertise; } })(),
          languages: (() => { try { return instructor.instructorProfile.languages ? JSON.parse(instructor.instructorProfile.languages) : null; } catch { return instructor.instructorProfile.languages; } })(),
          ntn: instructor.instructorProfile.ntn,
          ntnVerified: instructor.instructorProfile.ntnVerified,
          applicationStatus: instructor.instructorProfile.applicationStatus,
          appliedAt: instructor.instructorProfile.appliedAt?.toISOString() ?? null,
          reviewedAt: instructor.instructorProfile.reviewedAt?.toISOString() ?? null,
          reviewedBy: instructor.instructorProfile.reviewedBy,
          rejectionReason: instructor.instructorProfile.rejectionReason,
          sampleOutline: instructor.instructorProfile.sampleOutline,
          cnic: instructor.instructorProfile.cnic,
          topicProposal: instructor.instructorProfile.topicProposal,
          createdAt: instructor.instructorProfile.createdAt.toISOString(),
        } : null,

        // Instructor settings
        instructorSettings: instructor.instructorSettings ? {
          id: instructor.instructorSettings.id,
          notifyEnrollment: instructor.instructorSettings.notifyEnrollment,
          notifyQA: instructor.instructorSettings.notifyQA,
          notifyReview: instructor.instructorSettings.notifyReview,
          notifyAssignment: instructor.instructorSettings.notifyAssignment,
          notifyMessage: instructor.instructorSettings.notifyMessage,
          notifyCourseApproved: instructor.instructorSettings.notifyCourseApproved,
          notifyPayout: instructor.instructorSettings.notifyPayout,
          notifyPromotion: instructor.instructorSettings.notifyPromotion,
          payoutSchedule: instructor.instructorSettings.payoutSchedule,
          payoutThreshold: instructor.instructorSettings.payoutThreshold,
          defaultPayoutMethodId: instructor.instructorSettings.defaultPayoutMethodId,
          profileVisibility: instructor.instructorSettings.profileVisibility,
          showEmail: instructor.instructorSettings.showEmail,
          showPhone: instructor.instructorSettings.showPhone,
          showRevenue: instructor.instructorSettings.showRevenue,
          timezone: instructor.instructorSettings.timezone,
          currency: instructor.instructorSettings.currency,
          preferredLanguage: instructor.instructorSettings.preferredLanguage,
          emailDigest: instructor.instructorSettings.emailDigest,
          deactivatedAt: instructor.instructorSettings.deactivatedAt?.toISOString() ?? null,
        } : null,

        // Application
        instructorApplication: instructor.instructorApplication ? {
          id: instructor.instructorApplication.id,
          fullName: instructor.instructorApplication.fullName,
          email: instructor.instructorApplication.email,
          phone: instructor.instructorApplication.phone,
          expertise: instructor.instructorApplication.expertise,
          experience: instructor.instructorApplication.experience,
          motivation: instructor.instructorApplication.motivation,
          linkedinProfile: instructor.instructorApplication.linkedinProfile,
          portfolioUrl: instructor.instructorApplication.portfolioUrl,
          sampleLessonDesc: instructor.instructorApplication.sampleLessonDesc,
          status: instructor.instructorApplication.status,
          adminNotes: instructor.instructorApplication.adminNotes,
          reviewedAt: instructor.instructorApplication.reviewedAt?.toISOString() ?? null,
          reviewedBy: instructor.instructorApplication.reviewedBy,
          createdAt: instructor.instructorApplication.createdAt.toISOString(),
        } : null,

        // Courses
        courses: courseDetails,

        // Payout methods
        payoutMethods: instructor.payoutMethods.map((pm) => ({
          id: pm.id,
          type: pm.type,
          isDefault: pm.isDefault,
          isActive: pm.isActive,
          bankName: pm.bankName,
          accountNumber: pm.accountNumber ? `****${pm.accountNumber.slice(-4)}` : null,
          accountHolder: pm.accountHolder,
          branchCode: pm.branchCode,
          phoneNumber: pm.phoneNumber ? `****${pm.phoneNumber.slice(-4)}` : null,
          accountName: pm.accountName,
          email: pm.email,
          countryCode: pm.countryCode,
          createdAt: pm.createdAt.toISOString(),
        })),

        // Recent payouts
        recentPayouts: payoutInfo,

        // Commission override
        commissionOverride: instructor.commissionOverride ? {
          id: instructor.commissionOverride.id,
          commissionRate: instructor.commissionOverride.commissionRate,
          reason: instructor.commissionOverride.reason,
          createdBy: instructor.commissionOverride.createdBy,
          createdAt: instructor.commissionOverride.createdAt.toISOString(),
          updatedAt: instructor.commissionOverride.updatedAt.toISOString(),
        } : null,

        // Recent transactions
        recentTransactions: recentTransactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          currency: t.currency,
          status: t.status,
          description: t.description,
          platformFee: t.platformFee,
          instructorEarning: t.instructorEarning,
          paymentMethod: t.paymentMethod,
          courseTitle: t.course?.title || null,
          studentName: t.student?.name || null,
          studentEmail: t.student?.email || null,
          createdAt: t.createdAt.toISOString(),
        })),

        // Activity logs
        activityLogs: activityLogs.map((a) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          description: a.description,
          icon: a.icon,
          severity: a.severity,
          category: a.category,
          action: a.action,
          createdAt: a.createdAt.toISOString(),
        })),

        // Active sessions
        activeSessions: activeSessions.map((s) => ({
          id: s.id,
          deviceName: s.deviceName,
          deviceType: s.deviceType,
          browser: s.browser,
          os: s.os,
          ipAddress: s.ipAddress,
          location: s.location,
          lastActivity: s.lastActivity.toISOString(),
          expiresAt: s.expiresAt.toISOString(),
        })),

        // Performance stats
        performance,

        // Admin notes
        adminNotes: (() => {
          try { return instructor.adminNotes ? JSON.parse(instructor.adminNotes) : []; }
          catch { return []; }
        })(),
      },
    });
  } catch (error) {
    console.error('Admin instructor detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instructor details' },
      { status: 500 },
    );
  }
}

// ─── PATCH /api/admin/instructors/[id] ──────────────────────────────────────
// Admin actions on instructor

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, data } = body;

    const instructor = await db.user.findUnique({
      where: { id, role: 'instructor' },
      include: { instructorProfile: true },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    }

    let updateData: Record<string, any> = {};
    let profileUpdateData: Record<string, any> = {};
    let logType = '';
    let logTitle = '';
    let logDescription = '';
    let logIcon = '📋';
    let logSeverity: string = 'info';
    let logCategory: string = 'user_management';
    let logAction: string = 'updated';
    let tempPassword: string | undefined;
    let extraResponse: Record<string, any> = {};

    switch (action) {
      // ── Status actions ──────────────────────────────────────────────────

      case 'suspend': {
        updateData = {
          status: 'suspended',
          lockedUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        };
        logType = 'user_suspended';
        logTitle = `Instructor suspended: ${instructor.name}`;
        logDescription = data?.reason ? `Account suspended by admin. Reason: ${data.reason}` : 'Account suspended by admin';
        logIcon = '🚫';
        logSeverity = 'warning';
        logAction = 'suspended';
        break;
      }

      case 'unsuspend': {
        updateData = { status: 'active', lockedUntil: null };
        logType = 'user_unsuspended';
        logTitle = `Instructor unsuspended: ${instructor.name}`;
        logDescription = 'Account reactivated by admin';
        logIcon = '✅';
        logAction = 'unsuspended';
        break;
      }

      case 'ban': {
        updateData = {
          status: 'banned',
          lockedUntil: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
        };
        logType = 'user_banned';
        logTitle = `Instructor banned: ${instructor.name}`;
        logDescription = data?.reason ? `Account permanently banned by admin. Reason: ${data.reason}` : 'Account permanently banned by admin';
        logIcon = '🔴';
        logSeverity = 'critical';
        logAction = 'banned';
        break;
      }

      case 'verify': {
        updateData = { isVerified: true };
        logType = 'user_verified';
        logTitle = `Instructor verified: ${instructor.name}`;
        logDescription = 'Email/account verified by admin';
        logIcon = '✓';
        logAction = 'verified';
        break;
      }

      // ── Flag actions ────────────────────────────────────────────────────

      case 'flag': {
        updateData = { flaggedReason: data?.reason || 'Flagged by admin' };
        logType = 'user_flagged';
        logTitle = `Instructor flagged: ${instructor.name}`;
        logDescription = data?.reason || 'Flagged by admin';
        logIcon = '⚠️';
        logSeverity = 'warning';
        logAction = 'flagged';
        break;
      }

      case 'unflag': {
        updateData = { flaggedReason: null };
        logType = 'user_unflagged';
        logTitle = `Instructor unflagged: ${instructor.name}`;
        logDescription = 'Flag removed by admin';
        logIcon = '✅';
        logAction = 'unflagged';
        break;
      }

      // ── Application actions ─────────────────────────────────────────────

      case 'approve_application': {
        if (!instructor.instructorProfile) {
          return NextResponse.json(
            { error: 'Instructor profile not found' },
            { status: 404 },
          );
        }
        profileUpdateData = {
          applicationStatus: 'approved',
          reviewedAt: new Date(),
          reviewedBy: data?.adminId || null,
        };
        updateData = { isVerified: true, status: 'active' };
        // Notify the instructor
        await db.notification.create({
          data: {
            userId: id,
            type: 'system',
            title: 'Instructor Application Approved!',
            content: 'Congratulations! Your instructor application has been approved. You can now create and publish courses on ShijlAI Academy.',
            icon: '🎉',
          },
        });
        logType = 'instructor_approved';
        logTitle = `Instructor application approved: ${instructor.name}`;
        logDescription = 'Application approved by admin';
        logIcon = '✅';
        logAction = 'approved';
        break;
      }

      case 'reject_application': {
        if (!instructor.instructorProfile) {
          return NextResponse.json(
            { error: 'Instructor profile not found' },
            { status: 404 },
          );
        }
        if (!data?.rejectionReason) {
          return NextResponse.json(
            { error: 'Rejection reason is required' },
            { status: 400 },
          );
        }
        profileUpdateData = {
          applicationStatus: 'rejected',
          reviewedAt: new Date(),
          reviewedBy: data?.adminId || null,
          rejectionReason: data.rejectionReason,
        };
        // Notify the instructor
        await db.notification.create({
          data: {
            userId: id,
            type: 'system',
            title: 'Instructor Application Update',
            content: `Your instructor application was not approved. Reason: ${data.rejectionReason}`,
            icon: '❌',
          },
        });
        logType = 'instructor_rejected';
        logTitle = `Instructor application rejected: ${instructor.name}`;
        logDescription = `Reason: ${data.rejectionReason}`;
        logIcon = '❌';
        logSeverity = 'warning';
        logAction = 'rejected';
        break;
      }

      case 'request_more_info': {
        if (!instructor.instructorProfile) {
          return NextResponse.json(
            { error: 'Instructor profile not found' },
            { status: 404 },
          );
        }
        profileUpdateData = {
          applicationStatus: 'more_info_requested',
          reviewedAt: new Date(),
        };
        // Notify the instructor
        await db.notification.create({
          data: {
            userId: id,
            type: 'system',
            title: 'Additional Information Required',
            content: 'We need some additional information to process your instructor application. Please check your email for details.',
            icon: '📧',
          },
        });
        logType = 'instructor_info_requested';
        logTitle = `More info requested from: ${instructor.name}`;
        logDescription = 'Additional information requested by admin';
        logIcon = '📧';
        logAction = 'requested';
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
          status: instructor.status === 'banned' ? instructor.status : 'active',
        };
        logType = 'password_reset';
        logTitle = `Password reset for instructor: ${instructor.name}`;
        logDescription = 'Password reset by admin';
        logIcon = '🔑';
        logSeverity = 'warning';
        logCategory = 'security';
        logAction = 'reset';
        break;
      }

      // ── Toggle MFA ──────────────────────────────────────────────────────

      case 'toggle_mfa': {
        const newMfaState = !instructor.mfaEnabled;
        updateData = {
          mfaEnabled: newMfaState,
          mfaSecret: newMfaState ? (instructor.mfaSecret || 'admin_enabled') : null,
        };
        logType = 'security_alert';
        logTitle = `MFA ${newMfaState ? 'enabled' : 'disabled'} for instructor: ${instructor.name}`;
        logDescription = `MFA was ${newMfaState ? 'enabled' : 'disabled'} by admin`;
        logIcon = newMfaState ? '🔐' : '🔓';
        logSeverity = newMfaState ? 'info' : 'warning';
        logCategory = 'security';
        logAction = newMfaState ? 'enabled' : 'disabled';
        break;
      }

      // ── Adjust commission ───────────────────────────────────────────────

      case 'adjust_commission': {
        if (data?.commissionRate === undefined || data?.commissionRate === null) {
          return NextResponse.json(
            { error: 'Commission rate is required' },
            { status: 400 },
          );
        }
        const commissionRate = Number(data.commissionRate);
        if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
          return NextResponse.json(
            { error: 'Commission rate must be a number between 0 and 100' },
            { status: 400 },
          );
        }
        await db.commissionOverride.upsert({
          where: { instructorId: id },
          update: {
            commissionRate,
            reason: data?.reason || null,
            createdBy: data?.adminId || null,
          },
          create: {
            instructorId: id,
            commissionRate,
            reason: data?.reason || null,
            createdBy: data?.adminId || null,
          },
        });
        logType = 'revenue_split_changed';
        logTitle = `Commission adjusted for instructor: ${instructor.name}`;
        logDescription = `Commission rate set to ${commissionRate}%. Reason: ${data?.reason || 'No reason provided'}`;
        logIcon = '💰';
        logSeverity = 'warning';
        logCategory = 'finance';
        logAction = 'adjusted';
        break;
      }

      // ── Adjust coins ────────────────────────────────────────────────────

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
        const newCoinBalance = Math.max(0, instructor.shijlCoins + coinAmount);
        updateData = { shijlCoins: newCoinBalance };
        logType = 'settings_updated';
        logTitle = `Coins adjusted for instructor: ${instructor.name}`;
        logDescription = `${coinAmount >= 0 ? '+' : ''}${coinAmount} coins (reason: ${data?.reason || 'No reason provided'}). New balance: ${newCoinBalance}`;
        logIcon = '🪙';
        logSeverity = coinAmount < 0 ? 'warning' : 'info';
        logCategory = 'finance';
        logAction = 'adjusted';
        break;
      }

      // ── Adjust XP ───────────────────────────────────────────────────────

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
        const newXpBalance = Math.max(0, instructor.xp + xpAmount);
        updateData = { xp: newXpBalance };
        logType = 'settings_updated';
        logTitle = `XP adjusted for instructor: ${instructor.name}`;
        logDescription = `${xpAmount >= 0 ? '+' : ''}${xpAmount} XP (reason: ${data?.reason || 'No reason provided'}). New total: ${newXpBalance}`;
        logIcon = '⚡';
        logSeverity = xpAmount < 0 ? 'warning' : 'info';
        logCategory = 'finance';
        logAction = 'adjusted';
        break;
      }

      // ── Send notification ───────────────────────────────────────────────

      case 'send_notification': {
        if (!data?.title || !data?.content) {
          return NextResponse.json(
            { error: 'Notification title and content are required' },
            { status: 400 },
          );
        }
        await db.notification.create({
          data: {
            userId: id,
            type: data?.type || 'system',
            title: data.title,
            content: data.content,
            icon: data?.icon || '📢',
            link: data?.link || null,
          },
        });
        logType = 'notification_sent';
        logTitle = `Notification sent to instructor: ${instructor.name}`;
        logDescription = `Title: ${data.title}`;
        logIcon = '📢';
        logCategory = 'admin_action';
        logAction = 'sent';
        break;
      }

      // ── Clear sessions ──────────────────────────────────────────────────

      case 'clear_sessions': {
        await db.userSession.updateMany({
          where: { userId: id, isActive: true },
          data: { isActive: false },
        });
        logType = 'security_alert';
        logTitle = `Sessions cleared for instructor: ${instructor.name}`;
        logDescription = 'All active sessions invalidated by admin';
        logIcon = '🔒';
        logSeverity = 'warning';
        logCategory = 'security';
        logAction = 'cleared';
        break;
      }

      // ── Edit profile ────────────────────────────────────────────────────

      case 'edit_profile': {
        if (data?.email && data.email !== instructor.email) {
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

        // Update user fields
        if (data?.name) updateData.name = data.name;
        if (data?.email) updateData.email = data.email;
        if (data?.phone !== undefined) updateData.phone = data.phone;
        if (data?.bio !== undefined) updateData.bio = data.bio;

        // Update instructor profile fields
        if (instructor.instructorProfile) {
          if (data?.headline !== undefined) profileUpdateData.headline = data.headline;
          if (data?.expertise !== undefined) profileUpdateData.expertise = typeof data.expertise === 'string' ? data.expertise : JSON.stringify(data.expertise);
          if (data?.website !== undefined) profileUpdateData.website = data.website;
          if (data?.linkedin !== undefined) profileUpdateData.linkedin = data.linkedin;
          if (data?.twitter !== undefined) profileUpdateData.twitter = data.twitter;
          if (data?.youtube !== undefined) profileUpdateData.youtube = data.youtube;
          if (data?.ntn !== undefined) profileUpdateData.ntn = data.ntn;
          if (data?.ntnVerified !== undefined) profileUpdateData.ntnVerified = data.ntnVerified;
          if (data?.cnic !== undefined) profileUpdateData.cnic = data.cnic;
          if (data?.topicProposal !== undefined) profileUpdateData.topicProposal = data.topicProposal;
        }

        logType = 'profile_updated';
        logTitle = `Instructor profile edited by admin: ${instructor.name}`;
        logDescription = 'Admin edited instructor profile';
        logIcon = '✏️';
        logAction = 'updated';
        break;
      }

      // ── Deactivate ──────────────────────────────────────────────────────

      case 'deactivate': {
        updateData = { status: 'suspended' };
        // Mark settings as deactivated
        await db.instructorSettings.updateMany({
          where: { instructorId: id },
          data: { deactivatedAt: new Date() },
        });
        logType = 'user_suspended';
        logTitle = `Instructor deactivated: ${instructor.name}`;
        logDescription = data?.reason ? `Instructor account deactivated. Reason: ${data.reason}` : 'Instructor account deactivated by admin';
        logIcon = '⏸️';
        logSeverity = 'warning';
        logAction = 'deactivated';
        break;
      }

      // ── Reactivate ──────────────────────────────────────────────────────

      case 'reactivate': {
        updateData = { status: 'active', lockedUntil: null };
        // Clear deactivatedAt in settings
        await db.instructorSettings.updateMany({
          where: { instructorId: id },
          data: { deactivatedAt: null },
        });
        logType = 'user_unsuspended';
        logTitle = `Instructor reactivated: ${instructor.name}`;
        logDescription = 'Instructor account reactivated by admin';
        logIcon = '▶️';
        logAction = 'reactivated';
        break;
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 },
        );
    }

    // ── Apply user update ─────────────────────────────────────────────────

    let updatedInstructor = instructor;
    if (Object.keys(updateData).length > 0) {
      updatedInstructor = await db.user.update({
        where: { id },
        data: updateData,
      });
    }

    // ── Apply profile update ──────────────────────────────────────────────

    if (Object.keys(profileUpdateData).length > 0 && instructor.instructorProfile) {
      await db.instructorProfile.update({
        where: { instructorId: id },
        data: profileUpdateData,
      });
    }

    // ── Log the action ────────────────────────────────────────────────────

    await db.activityLog.create({
      data: {
        userId: id,
        type: logType,
        title: logTitle,
        description: logDescription,
        icon: logIcon,
        action: logAction,
        targetName: instructor.name,
        targetType: 'user',
        targetId: id,
        severity: logSeverity,
        category: logCategory,
      },
    });

    // ── Build response ────────────────────────────────────────────────────

    const responseData: Record<string, any> = {
      instructor: {
        id: updatedInstructor.id,
        name: updatedInstructor.name,
        email: updatedInstructor.email,
        role: updatedInstructor.role,
        status: updatedInstructor.status,
        isVerified: updatedInstructor.isVerified,
        mfaEnabled: updatedInstructor.mfaEnabled,
        flaggedReason: updatedInstructor.flaggedReason,
        shijlCoins: updatedInstructor.shijlCoins,
        xp: updatedInstructor.xp,
      },
      message: 'Action completed successfully',
      ...extraResponse,
    };

    if (tempPassword) {
      responseData.temporaryPassword = tempPassword;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Admin instructor action API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform action on instructor' },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/admin/instructors/[id] ─────────────────────────────────────
// Soft delete instructor (change status, don't actually remove)

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const instructor = await db.user.findUnique({
      where: { id, role: 'instructor' },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    }

    // Soft delete: mark as deleted via status
    await db.user.update({
      where: { id },
      data: {
        status: 'banned',
        flaggedReason: 'Account soft-deleted by admin',
        lockedUntil: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
      },
    });

    // Mark instructor settings as deactivated
    await db.instructorSettings.updateMany({
      where: { instructorId: id },
      data: { deactivatedAt: new Date(), deletionRequestedAt: new Date() },
    });

    // Invalidate all sessions
    await db.userSession.updateMany({
      where: { userId: id, isActive: true },
      data: { isActive: false },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId: id,
        type: 'user_deleted',
        title: `Instructor soft-deleted: ${instructor.name}`,
        description: `Email: ${instructor.email}. Account soft-deleted by admin (status set to banned).`,
        icon: '🗑️',
        action: 'deleted',
        targetName: instructor.name,
        targetType: 'user',
        targetId: id,
        severity: 'critical',
        category: 'user_management',
      },
    });

    return NextResponse.json({
      message: 'Instructor soft-deleted successfully. Account status set to banned and all sessions invalidated.',
    });
  } catch (error) {
    console.error('Admin instructor delete API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete instructor' },
      { status: 500 },
    );
  }
}
