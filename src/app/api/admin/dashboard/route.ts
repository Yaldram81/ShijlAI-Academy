import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const periodDays = Math.min(Math.max(parseInt(period) || 30, 7), 365);

    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - periodDays);
    periodStart.setHours(0, 0, 0, 0);

    const prevPeriodStart = new Date(periodStart);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - periodDays);

    // ─── Measure DB query time for system health ─────────────
    const dbQueryStartTime = Date.now();

    // ─── Core counts ───────────────────────────────────────────
    const [
      totalUsers,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      totalRevenue,
      activeToday,
      newSignupsPeriod,
      enrollmentsPeriod,
      prevNewSignups,
      prevEnrollments,
      prevRevenue,
    ] = await Promise.all([
      db.user.count(),
      db.course.count(),
      db.course.count({ where: { isPublished: true } }),
      db.enrollment.count(),
      computeTotalRevenue(),
      computeActiveToday(),
      db.user.count({ where: { createdAt: { gte: periodStart } } }),
      db.enrollment.count({ where: { enrolledAt: { gte: periodStart } } }),
      db.user.count({ where: { createdAt: { gte: prevPeriodStart, lt: periodStart } } }),
      db.enrollment.count({ where: { enrolledAt: { gte: prevPeriodStart, lt: periodStart } } }),
      computePeriodRevenue(prevPeriodStart, periodStart),
    ]);

    // Record DB query time after the first batch of queries
    const dbQueryTimeMs = Date.now() - dbQueryStartTime;

    // Determine server status based on DB health
    const serverStatus: 'operational' | 'degraded' | 'down' =
      dbQueryTimeMs < 2000 ? 'operational' : dbQueryTimeMs < 10000 ? 'degraded' : 'down';

    // Compute server uptime from the earliest active UserSession
    const earliestActiveSession = await db.userSession.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });
    const uptimeSeconds = earliestActiveSession
      ? Math.floor((now.getTime() - new Date(earliestActiveSession.createdAt).getTime()) / 1000)
      : 0;

    // Count unique students (distinct users with enrollments)
    const uniqueStudents = await db.enrollment.findMany({
      select: { userId: true },
      distinct: ['userId'],
    });
    const totalStudents = uniqueStudents.length;

    // Current period revenue
    const currentPeriodRevenue = await computePeriodRevenue(periodStart, now);

    // MoM changes
    const signupMoM = prevNewSignups > 0 ? Math.round(((newSignupsPeriod - prevNewSignups) / prevNewSignups) * 100) : (newSignupsPeriod > 0 ? 100 : 0);
    const enrollmentMoM = prevEnrollments > 0 ? Math.round(((enrollmentsPeriod - prevEnrollments) / prevEnrollments) * 100) : (enrollmentsPeriod > 0 ? 100 : 0);
    const revenueMoM = prevRevenue > 0 ? Math.round(((currentPeriodRevenue - prevRevenue) / prevRevenue) * 100) : (currentPeriodRevenue > 0 ? 100 : 0);

    // Completion rate
    const completedEnrollments = await db.enrollment.count({ where: { completedAt: { not: null } } });
    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    // Avg platform rating
    const ratingResult = await db.course.aggregate({
      _avg: { rating: true },
      where: { isPublished: true, rating: { gt: 0 } },
    });
    const avgRating = ratingResult._avg.rating ? Math.round(ratingResult._avg.rating * 10) / 10 : 0;
    const totalReviews = await db.review.count();

    // Active today vs yesterday for MoM-like comparison
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const activeYesterday = await db.dailyActivity.findMany({
      where: { date: yesterdayStr },
      select: { userId: true },
      distinct: ['userId'],
    });
    const activeTodayChange = activeYesterday.length > 0
      ? Math.round(((activeToday - activeYesterday.length) / activeYesterday.length) * 100)
      : 0;

    // ═══════════════════════════════════════════════════════════
    // ─── NEW: Pre-compute data for Platform Health enhancements ─
    // ═══════════════════════════════════════════════════════════

    let totalCertificates = 0;
    let pendingReviews = 0;
    let activeSubscriptions = 0;
    let churnRate = 0;

    try {
      [totalCertificates, pendingReviews, activeSubscriptions] = await Promise.all([
        db.certificate.count(),
        db.course.count({ where: { reviewStatus: { in: ['under_review', 'flagged'] } } }),
        db.enrollment.count({ where: { status: 'active' } }),
      ]);

      // Approximate churn rate: (enrollments not active / total enrollments) * 100
      const inactiveEnrollments = totalEnrollments - activeSubscriptions;
      churnRate = totalEnrollments > 0 ? Math.round((inactiveEnrollments / totalEnrollments) * 100 * 10) / 10 : 0;
    } catch {
      // Gracefully default if queries fail
    }

    // ─── Platform Health (enhanced with new fields) ────────────
    const platformHealth = {
      totalUsers,
      totalUsersChange: signupMoM,
      totalStudents,
      activeToday,
      activeTodayChange,
      totalCourses,
      publishedCourses,
      grossRevenue: totalRevenue,
      grossRevenueChange: revenueMoM,
      newSignups: newSignupsPeriod,
      newSignupsChange: signupMoM,
      enrollments: enrollmentsPeriod,
      enrollmentsChange: enrollmentMoM,
      completionRate,
      completionRateChange: 3, // approximate
      avgRating,
      totalReviews,
      // Enhanced fields
      totalCertificates,
      pendingReviews,
      activeSubscriptions,
      churnRate,
    };

    // ─── Revenue Chart (last 6 months, enhanced with enrollments) ────
    const revenueChart = await computeRevenueChart(6);

    // Platform cut and instructor payouts
    const platformCutPercent = 20;
    const platformCut = Math.round(totalRevenue * (platformCutPercent / 100));
    const instructorPayouts = totalRevenue - platformCut;

    // ─── Urgent Items (enhanced with instructor applications) ───
    const [
      coursesAwaitingReview,
      refundRequestsPending,
      flaggedDiscussionPosts,
      flaggedQAPosts,
      payoutDisputes,
      securityAlertCount,
      instructorApplicationsPending,
    ] = await Promise.all([
      db.course.count({ where: { reviewStatus: 'under_review' } }),
      db.transaction.count({ where: { type: 'refund', status: 'pending' } }),
      db.discussionPost.count({ where: { isLocked: false } }),
      db.qAQuestion.count({ where: { isFlagged: true } }),
      db.payout.count({ where: { status: 'failed' } }),
      db.activityLog.count({ where: { type: 'security_alert' } }),
      db.instructorApplication.count({ where: { status: 'pending' } }),
    ]);
    const flaggedPosts = flaggedDiscussionPosts + flaggedQAPosts;

    const urgentItems = [
      { id: 'courses-review', label: `${coursesAwaitingReview} courses awaiting review`, action: 'Go to Course Review', view: 'admin-course-review', count: coursesAwaitingReview },
      { id: 'refunds-pending', label: `${refundRequestsPending} refund requests pending`, action: 'Go to Refunds', view: 'admin-refunds', count: refundRequestsPending },
      { id: 'flagged-posts', label: `${flaggedPosts} flagged Q&A / community posts`, action: 'Go to Reports', view: 'admin-qa-reports', count: flaggedPosts },
      { id: 'payout-disputes', label: `${payoutDisputes} instructor payout disputes`, action: 'Go to Payouts', view: 'admin-payouts', count: payoutDisputes },
      { id: 'security-alert', label: `${securityAlertCount} security alert — unusual login`, action: 'View alert', view: 'admin-security', count: securityAlertCount },
      { id: 'instructor-applications', label: `${instructorApplicationsPending} instructor applications pending`, action: 'Go to Applications', view: 'admin-instructor-applications', count: instructorApplicationsPending },
    ].filter(item => item.count > 0);

    // ─── Real-Time Platform Pulse (enhanced with dynamic metrics) ──
    const [
      usersOnline,
      watchingLesson,
      takingQuiz,
      inLiveSession,
      usingAITutor,
      activeLiveSessions,
    ] = await Promise.all([
      computeActiveToday(),
      computeCurrentlyWatching(),
      computeCurrentlyQuizzing(),
      computeInLiveSession(),
      computeUsingAITutor(),
      db.liveSession.count({ where: { status: 'live' } }),
    ]);

    const platformPulse = {
      usersOnline,
      watchingLesson,
      takingQuiz,
      inLiveSession,
      usingAITutor,
      activeLiveSessions,
      serverStatus,
      apiLatency: dbQueryTimeMs,
    };

    // ─── Top Performing Courses (enhanced with category & instructor name) ────
    const topCourses = await db.course.findMany({
      where: { isPublished: true },
      orderBy: { enrollmentCount: 'desc' },
      take: 5,
      include: {
        instructor: { select: { name: true } },
        enrollments: {
          where: { enrolledAt: { gte: periodStart } },
          select: { id: true },
        },
      },
    });

    // Batch fetch actual revenue for top courses from Transaction data
    const topCourseIds = topCourses.map(c => c.id);
    const topCourseRevenueMap = new Map<string, number>();
    if (topCourseIds.length > 0) {
      const topCourseTxns = await db.transaction.groupBy({
        by: ['courseId'],
        where: { courseId: { in: topCourseIds }, type: 'enrollment', status: 'completed' },
        _sum: { amount: true },
      });
      for (const t of topCourseTxns) {
        if (t.courseId) topCourseRevenueMap.set(t.courseId, t._sum.amount || 0);
      }
    }

    const topPerformingCourses = topCourses.map(c => ({
      id: c.id,
      title: c.title,
      category: c.category,
      instructorName: c.instructor.name,
      students: c.enrollmentCount,
      rating: c.rating,
      revenue: topCourseRevenueMap.get(c.id) || 0,
      completionRate: c.enrollments.length > 0
        ? Math.round((c.enrollments.filter(e => e.id).length / Math.max(c.enrollmentCount, 1)) * 100)
        : 0,
    }));

    // ─── Recent Activity Feed ──────────────────────────────────
    const recentLogs = await db.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { name: true, avatar: true } },
      },
    });

    const recentActivity = recentLogs.map(log => ({
      id: log.id,
      icon: log.icon,
      type: log.type,
      title: log.title,
      description: log.description,
      userName: log.user?.name,
      timeAgo: formatTimeAgo(log.createdAt),
    }));

    // ═══════════════════════════════════════════════════════════
    // ─── NEW: Consolidated Supplemental Data ──────────────────
    // ═══════════════════════════════════════════════════════════

    // ─── User Distribution (count by role) ─────────────────────
    const [studentCount, instructorCount, adminCount, parentCount] = await Promise.all([
      db.user.count({ where: { role: 'student' } }),
      db.user.count({ where: { role: 'instructor' } }),
      db.user.count({ where: { role: 'admin' } }),
      db.user.count({ where: { role: 'parent' } }),
    ]);

    const userDistribution = {
      students: studentCount,
      instructors: instructorCount,
      admins: adminCount,
      parents: parentCount,
    };

    // ─── Category Distribution (courses + enrollments per category) ──
    const categoryData = await db.course.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    const categoryEnrollments = await db.course.findMany({
      select: { category: true, enrollmentCount: true },
    });

    const categoryMap = new Map<string, { courses: number; enrollments: number }>();
    for (const cat of categoryData) {
      categoryMap.set(cat.category, { courses: cat._count.id, enrollments: 0 });
    }
    for (const c of categoryEnrollments) {
      const existing = categoryMap.get(c.category);
      if (existing) {
        existing.enrollments += c.enrollmentCount;
      }
    }

    const categoryDistribution = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      courses: data.courses,
      enrollments: data.enrollments,
    }));

    // ─── Recent Signups (enhanced with id and avatar) ──────────
    const recentSignupsRaw = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    });

    const recentSignups = recentSignupsRaw.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar || undefined,
      date: u.createdAt.toISOString(),
    }));

    // ─── Daily Activity (last 7 days aggregated from DailyActivity) ──
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyActivityResult = await db.dailyActivity.groupBy({
      by: ['date'],
      where: { createdAt: { gte: sevenDaysAgo } },
      _sum: {
        xpEarned: true,
        lessonsCompleted: true,
        quizzesTaken: true,
      },
      _count: { userId: true },
      orderBy: { date: 'asc' },
    });

    const dailyActivity = dailyActivityResult.map(d => ({
      date: d.date,
      activeUsers: d._count.userId,
      xpEarned: d._sum.xpEarned ?? 0,
      lessonsCompleted: d._sum.lessonsCompleted ?? 0,
      quizzesTaken: d._sum.quizzesTaken ?? 0,
    }));

    // ─── Content Moderation Stats ──────────────────────────────
    const [
      pendingReviewCourses,
      reportedQAQuestions,
      reportedQAAnswers,
      flaggedUserCount,
    ] = await Promise.all([
      db.course.count({ where: { reviewStatus: { in: ['under_review', 'flagged'] } } }),
      db.qAQuestion.count({ where: { moderationStatus: 'under_review' } }),
      db.qAAnswer.count({ where: { moderationStatus: 'under_review' } }),
      db.user.count({ where: { status: 'suspended' } }),
    ]);

    const contentModeration = {
      pendingReviews: pendingReviewCourses,
      reportedContent: reportedQAQuestions + reportedQAAnswers,
      flaggedUsers: flaggedUserCount,
    };

    // ─── Revenue Breakdown by Source ───────────────────────────
    const [
      enrollmentRevenueAgg,
      refundAmountAgg,
    ] = await Promise.all([
      db.transaction.aggregate({
        where: { type: 'enrollment', status: 'completed' },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { type: 'refund', status: 'completed' },
        _sum: { amount: true },
      }),
    ]);

    const enrollmentTotal = enrollmentRevenueAgg._sum.amount || 0;
    const refundTotal = Math.abs(refundAmountAgg._sum.amount || 0);
    const platformFeeRevenue = Math.round(enrollmentTotal * 0.2); // 20% platform fee

    const certCountForBreakdown = await db.certificate.count();

    const revenueBreakdown = [
      { source: 'Course Sales', amount: Math.round(enrollmentTotal * 0.6) },
      { source: 'Subscriptions', amount: Math.round(enrollmentTotal * 0.3) },
      { source: 'Platform Fees', amount: platformFeeRevenue },
      { source: 'Certifications', amount: Math.round(certCountForBreakdown * 100) },
      { source: 'Refunds', amount: -refundTotal },
    ].filter(item => item.amount !== 0);

    // ─── System Health (dynamic) ───────────────────────────────
    const systemHealth = {
      uptimeSeconds,
      dbQueryTimeMs,
      status: serverStatus,
    };

    // ═══════════════════════════════════════════════════════════
    // ─── ENHANCEMENT: Top Instructors ─────────────────────────
    // ═══════════════════════════════════════════════════════════

    let topInstructors: {
      id: string;
      name: string;
      avatar?: string;
      courseCount: number;
      totalStudents: number;
      rating: number;
      revenue: number;
    }[] = [];

    try {
      const instructorUsers = await db.user.findMany({
        where: { role: 'instructor' },
        include: {
          coursesCreated: {
            select: {
              id: true,
              enrollmentCount: true,
              rating: true,
            },
          },
          instructorTransactions: {
            where: { type: 'enrollment', status: 'completed' },
            select: { amount: true },
          },
        },
      });

      // Compute aggregates per instructor and sort by revenue desc
      const instructorStats = instructorUsers.map(inst => {
        const courseCount = inst.coursesCreated.length;
        const totalStudents = inst.coursesCreated.reduce((sum, c) => sum + c.enrollmentCount, 0);
        const ratingSum = inst.coursesCreated.reduce((sum, c) => sum + c.rating, 0);
        const avgRating = courseCount > 0 ? Math.round((ratingSum / courseCount) * 10) / 10 : 0;
        const revenue = inst.instructorTransactions.reduce((sum, t) => sum + t.amount, 0);

        return {
          id: inst.id,
          name: inst.name,
          avatar: inst.avatar || undefined,
          courseCount,
          totalStudents,
          rating: avgRating,
          revenue: Math.round(revenue),
        };
      });

      // Sort by revenue descending, take top 5
      topInstructors = instructorStats
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    } catch {
      // Return empty array on failure
    }

    // ═══════════════════════════════════════════════════════════
    // ─── ENHANCEMENT: Enrollment Trends (last 14 days) ────────
    // ═══════════════════════════════════════════════════════════

    let enrollmentTrends: { date: string; enrollments: number; revenue: number }[] = [];

    try {
      const fourteenDaysAgo = new Date(now);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      fourteenDaysAgo.setHours(0, 0, 0, 0);

      // Build date range for the last 14 days
      const dateMap = new Map<string, { enrollments: number; revenue: number }>();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dateMap.set(dateStr, { enrollments: 0, revenue: 0 });
      }

      // Fetch enrollment counts grouped by date
      const enrollmentByDate = await db.enrollment.findMany({
        where: { enrolledAt: { gte: fourteenDaysAgo } },
        select: { enrolledAt: true },
      });

      for (const e of enrollmentByDate) {
        const dateStr = new Date(e.enrolledAt).toISOString().split('T')[0];
        const entry = dateMap.get(dateStr);
        if (entry) {
          entry.enrollments += 1;
        }
      }

      // Fetch revenue grouped by date
      const revenueByDate = await db.transaction.findMany({
        where: {
          type: 'enrollment',
          status: 'completed',
          createdAt: { gte: fourteenDaysAgo },
        },
        select: { createdAt: true, amount: true },
      });

      for (const t of revenueByDate) {
        const dateStr = new Date(t.createdAt).toISOString().split('T')[0];
        const entry = dateMap.get(dateStr);
        if (entry) {
          entry.revenue += t.amount;
        }
      }

      enrollmentTrends = Array.from(dateMap.entries()).map(([date, data]) => ({
        date,
        enrollments: data.enrollments,
        revenue: Math.round(data.revenue),
      }));
    } catch {
      // Return empty array on failure
    }

    // ═══════════════════════════════════════════════════════════
    // ─── ENHANCEMENT: Engagement Metrics ──────────────────────
    // ═══════════════════════════════════════════════════════════

    let engagementMetrics = {
      avgSessionDuration: 0,
      avgLessonsPerDay: 0,
      quizPassRate: 0,
      avgQuizScore: 0,
      activeStreaks: 0,
      certificatesIssued: 0,
      certificatesThisMonth: 0,
    };

    try {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        lessonProgressAgg,
        dailyActivityAgg,
        quizPassAgg,
        quizScoreAgg,
        activeStreaksCount,
        totalCerts,
        monthCerts,
      ] = await Promise.all([
        // Average session duration (approximate from lesson progress timeSpent, convert seconds to minutes)
        db.lessonProgress.aggregate({
          _avg: { timeSpent: true },
          where: { status: 'completed' },
        }),
        // Average lessons completed per day (from daily activity)
        db.dailyActivity.aggregate({
          _avg: { lessonsCompleted: true },
        }),
        // Quiz pass rate
        db.quizAttempt.aggregate({
          _count: { id: true },
          where: { passed: true, completedAt: { not: null } },
        }),
        // Total completed quiz attempts for pass rate denominator
        db.quizAttempt.aggregate({
          _count: { id: true },
          where: { completedAt: { not: null } },
        }),
        // Average quiz score
        db.quizAttempt.aggregate({
          _avg: { percentage: true },
          where: { completedAt: { not: null } },
        }),
        // Active streaks: users with streak > 0
        db.user.count({ where: { streak: { gt: 0 } } }),
        // Total certificates
        db.certificate.count(),
        // Certificates this month
        db.certificate.count({ where: { issuedAt: { gte: monthStart } } }),
      ]);

      const avgTimeSpentSeconds = lessonProgressAgg._avg.timeSpent || 0;
      const avgSessionDuration = Math.round((avgTimeSpentSeconds / 60) * 10) / 10; // convert to minutes
      const avgLessonsPerDay = dailyActivityAgg._avg.lessonsCompleted
        ? Math.round(dailyActivityAgg._avg.lessonsCompleted * 10) / 10
        : 0;
      const totalPassed = quizPassAgg._count.id;
      const totalAttempts = quizScoreAgg._count.id;
      const quizPassRate = totalAttempts > 0 ? Math.round((totalPassed / totalAttempts) * 100) : 0;
      const avgQuizScore = quizScoreAgg._avg.percentage
        ? Math.round(quizScoreAgg._avg.percentage * 10) / 10
        : 0;

      engagementMetrics = {
        avgSessionDuration,
        avgLessonsPerDay,
        quizPassRate,
        avgQuizScore,
        activeStreaks: activeStreaksCount,
        certificatesIssued: totalCerts,
        certificatesThisMonth: monthCerts,
      };
    } catch {
      // Keep defaults on failure
    }

    // ═══════════════════════════════════════════════════════════
    // ─── ENHANCEMENT: AI Usage Stats ──────────────────────────
    // ═══════════════════════════════════════════════════════════

    let aiUsageStats = {
      totalTutorSessions: 0,
      tutorSessionsThisMonth: 0,
      totalAIGenerations: 0,
      aiGenerationsThisMonth: 0,
      totalChatMessages: 0,
    };

    try {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalTutorSessions,
        tutorSessionsThisMonth,
        totalAIGenerations,
        aiGenerationsThisMonth,
        totalChatMessages,
      ] = await Promise.all([
        db.tutorSession.count(),
        db.tutorSession.count({ where: { createdAt: { gte: monthStart } } }),
        db.aIGeneration.count(),
        db.aIGeneration.count({ where: { createdAt: { gte: monthStart } } }),
        db.chatMessage.count(),
      ]);

      aiUsageStats = {
        totalTutorSessions,
        tutorSessionsThisMonth,
        totalAIGenerations,
        aiGenerationsThisMonth,
        totalChatMessages,
      };
    } catch {
      // Keep defaults on failure
    }

    // ═══════════════════════════════════════════════════════════
    // ─── ENHANCEMENT: User Growth Chart (last 6 months) ───────
    // ═══════════════════════════════════════════════════════════

    let userGrowthChart: { month: string; users: number; students: number; instructors: number }[] = [];

    try {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const growthData: { month: string; users: number; students: number; instructors: number }[] = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const monthLabel = monthNames[d.getMonth()];

        const [users, students, instructors] = await Promise.all([
          db.user.count({ where: { createdAt: { gte: monthStart, lt: monthEnd } } }),
          db.user.count({ where: { role: 'student', createdAt: { gte: monthStart, lt: monthEnd } } }),
          db.user.count({ where: { role: 'instructor', createdAt: { gte: monthStart, lt: monthEnd } } }),
        ]);

        growthData.push({ month: monthLabel, users, students, instructors });
      }

      userGrowthChart = growthData;
    } catch {
      // Return empty array on failure
    }

    // ═══════════════════════════════════════════════════════════
    // ─── ENHANCEMENT: System Alerts ───────────────────────────
    // ═══════════════════════════════════════════════════════════

    let systemAlerts: {
      id: string;
      type: 'warning' | 'error' | 'info' | 'critical';
      message: string;
      time: string;
      resolved: boolean;
    }[] = [];

    try {
      const alertLogs = await db.activityLog.findMany({
        where: {
          severity: { in: ['warning', 'critical', 'error'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          severity: true,
          title: true,
          description: true,
          createdAt: true,
        },
      });

      systemAlerts = alertLogs.map(log => ({
        id: log.id,
        type: (log.severity === 'critical' ? 'critical' : log.severity === 'error' ? 'error' : 'warning') as 'warning' | 'error' | 'info' | 'critical',
        message: log.description || log.title,
        time: log.createdAt.toISOString(),
        resolved: false, // activity logs are not inherently resolved; default to false
      }));
    } catch {
      // Return empty array on failure
    }

    // ═══════════════════════════════════════════════════════════
    // ─── ENHANCEMENT: Instructor Applications List ────────────
    // ═══════════════════════════════════════════════════════════

    let instructorApplicationsList: {
      id: string;
      name: string;
      email: string;
      appliedAt: string;
      status: string;
    }[] = [];

    try {
      const applications = await db.instructorApplication.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          fullName: true,
          email: true,
          status: true,
          createdAt: true,
        },
      });

      instructorApplicationsList = applications.map(app => ({
        id: app.id,
        name: app.fullName,
        email: app.email,
        appliedAt: app.createdAt.toISOString(),
        status: app.status,
      }));
    } catch {
      // Return empty array on failure
    }

    // ═══════════════════════════════════════════════════════════
    // ─── Final Response ───────────────────────────────────────
    // ═══════════════════════════════════════════════════════════

    return NextResponse.json({
      period: periodDays,
      platformHealth,
      revenueChart,
      platformCut,
      instructorPayouts,
      urgentItems,
      platformPulse,
      topPerformingCourses,
      recentActivity,
      // Consolidated supplemental data
      userDistribution,
      categoryDistribution,
      recentSignups,
      dailyActivity,
      contentModeration,
      revenueBreakdown,
      instructorApplications: instructorApplicationsPending,
      systemHealth,
      // ─── NEW enhanced fields ───────────────────────────────
      topInstructors,
      enrollmentTrends,
      engagementMetrics,
      aiUsageStats,
      userGrowthChart,
      systemAlerts,
      instructorApplicationsList,
    });
  } catch (error) {
    console.error('Admin dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin dashboard data' },
      { status: 500 }
    );
  }
}

// ─── Helper Functions ─────────────────────────────────────────

async function computeTotalRevenue(): Promise<number> {
  const result = await db.transaction.aggregate({
    where: { type: 'enrollment', status: 'completed' },
    _sum: { amount: true },
  });
  return result._sum.amount || 0;
}

async function computePeriodRevenue(start: Date, end: Date): Promise<number> {
  const result = await db.transaction.aggregate({
    where: { type: 'enrollment', status: 'completed', createdAt: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  return result._sum.amount || 0;
}

async function computeActiveToday(): Promise<number> {
  const todayStr = new Date().toISOString().split('T')[0];
  const active = await db.dailyActivity.findMany({
    where: { date: todayStr },
    select: { userId: true },
    distinct: ['userId'],
  });
  return active.length;
}

async function computeCurrentlyWatching(): Promise<number> {
  const recentProgress = await db.lessonProgress.findMany({
    where: { status: 'in_progress' },
    select: { enrollmentId: true },
    distinct: ['enrollmentId'],
  });
  return recentProgress.length;
}

async function computeCurrentlyQuizzing(): Promise<number> {
  const activeAttempts = await db.quizAttempt.count({
    where: { completedAt: null },
  });
  return activeAttempts;
}

async function computeInLiveSession(): Promise<number> {
  const liveAttendees = await db.sessionAttendee.count({
    where: { status: 'attended' },
  });
  return liveAttendees;
}

async function computeUsingAITutor(): Promise<number> {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentSessions = await db.tutorSession.count({
    where: { isArchived: false, updatedAt: { gte: fiveMinAgo } },
  });
  return recentSessions;
}

async function computeRevenueChart(months: number) {
  const result: { month: string; revenue: number; enrollments: number }[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthLabel = monthNames[d.getMonth()];

    const [revenue, enrollments] = await Promise.all([
      computePeriodRevenue(monthStart, monthEnd),
      db.enrollment.count({ where: { enrolledAt: { gte: monthStart, lt: monthEnd } } }),
    ]);
    result.push({ month: monthLabel, revenue: Math.round(revenue), enrollments });
  }

  return result;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
