import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ==================== DEFAULT FEATURE FLAGS ====================
const DEFAULT_DEV_FEATURE_FLAGS = [
  {
    name: 'new_dashboard',
    displayName: 'New Dashboard',
    description: 'Enable the redesigned admin dashboard experience',
    enabled: true,
    rollout: 100,
    category: 'general',
  },
  {
    name: 'ai_course_generator',
    displayName: 'AI Course Generator',
    description: 'Allow AI-powered course content generation',
    enabled: false,
    rollout: 0,
    category: 'experimental',
  },
  {
    name: 'dark_mode_enhanced',
    displayName: 'Dark Mode Enhanced',
    description: 'Enhanced dark mode with custom theme colors',
    enabled: true,
    rollout: 100,
    category: 'general',
  },
  {
    name: 'video_streaming_hd',
    displayName: 'Video Streaming HD',
    description: 'Enable HD and 4K video streaming for courses',
    enabled: true,
    rollout: 100,
    category: 'performance',
  },
  {
    name: 'social_login',
    displayName: 'Social Login',
    description: 'Enable Google, Facebook, and Apple social login',
    enabled: true,
    rollout: 100,
    category: 'general',
  },
  {
    name: 'advanced_analytics',
    displayName: 'Advanced Analytics',
    description: 'Enable advanced platform analytics and reporting',
    enabled: false,
    rollout: 0,
    category: 'beta',
  },
  {
    name: 'bulk_user_import',
    displayName: 'Bulk User Import',
    description: 'Allow bulk importing of users via CSV',
    enabled: true,
    rollout: 100,
    category: 'general',
  },
  {
    name: 'real_time_notifications',
    displayName: 'Real-Time Notifications',
    description: 'Enable WebSocket-based real-time notifications',
    enabled: true,
    rollout: 100,
    category: 'beta',
  },
  {
    name: 'multilingual_support',
    displayName: 'Multilingual Support',
    description: 'Enable multi-language interface support',
    enabled: false,
    rollout: 0,
    category: 'experimental',
  },
  {
    name: 'api_rate_limiting',
    displayName: 'API Rate Limiting',
    description: 'Enable configurable API rate limiting',
    enabled: true,
    rollout: 100,
    category: 'security',
  },
];

// ==================== HARDCODED API ENDPOINTS ====================
const API_ENDPOINTS = [
  // User Management
  { method: 'GET', path: '/api/admin/users', description: 'List all users', category: 'User Management' },
  { method: 'POST', path: '/api/admin/users', description: 'Create a new user', category: 'User Management' },
  { method: 'GET', path: '/api/admin/users/[id]', description: 'Get user by ID', category: 'User Management' },
  { method: 'PUT', path: '/api/admin/users/[id]', description: 'Update user by ID', category: 'User Management' },
  { method: 'DELETE', path: '/api/admin/users/[id]', description: 'Delete user by ID', category: 'User Management' },
  { method: 'POST', path: '/api/admin/users/bulk', description: 'Bulk user operations', category: 'User Management' },
  { method: 'GET', path: '/api/admin/users/export', description: 'Export users to CSV', category: 'User Management' },

  // Course Management
  { method: 'GET', path: '/api/admin/courses', description: 'List all courses', category: 'Course Management' },
  { method: 'POST', path: '/api/admin/courses', description: 'Create a new course', category: 'Course Management' },
  { method: 'GET', path: '/api/admin/courses/[id]', description: 'Get course by ID', category: 'Course Management' },
  { method: 'PUT', path: '/api/admin/courses/[id]', description: 'Update course by ID', category: 'Course Management' },
  { method: 'DELETE', path: '/api/admin/courses/[id]', description: 'Delete course by ID', category: 'Course Management' },
  { method: 'POST', path: '/api/admin/courses/[id]/review', description: 'Review course submission', category: 'Course Management' },
  { method: 'POST', path: '/api/admin/courses/[id]/flag', description: 'Flag course for review', category: 'Course Management' },
  { method: 'POST', path: '/api/admin/courses/[id]/duplicate', description: 'Duplicate a course', category: 'Course Management' },
  { method: 'POST', path: '/api/admin/courses/bulk', description: 'Bulk course operations', category: 'Course Management' },
  { method: 'GET', path: '/api/admin/courses/analytics', description: 'Course analytics data', category: 'Course Management' },
  { method: 'GET', path: '/api/admin/courses/export', description: 'Export courses to CSV', category: 'Course Management' },
  { method: 'POST', path: '/api/admin/course-thumbnails', description: 'Upload course thumbnail', category: 'Course Management' },

  // Course Review
  { method: 'GET', path: '/api/admin/course-review', description: 'List course reviews', category: 'Course Review' },
  { method: 'GET', path: '/api/admin/course-review/[id]', description: 'Get course review details', category: 'Course Review' },
  { method: 'PUT', path: '/api/admin/course-review/[id]', description: 'Update course review', category: 'Course Review' },
  { method: 'POST', path: '/api/admin/course-review/[id]/ai-analysis', description: 'Run AI analysis on course', category: 'Course Review' },
  { method: 'POST', path: '/api/admin/course-review/bulk', description: 'Bulk course review actions', category: 'Course Review' },

  // Enrollments
  { method: 'GET', path: '/api/admin/enrollments', description: 'List all enrollments', category: 'Enrollments' },

  // Finance
  { method: 'GET', path: '/api/admin/finance/overview', description: 'Finance overview dashboard', category: 'Finance' },
  { method: 'GET', path: '/api/admin/finance/transactions', description: 'List transactions', category: 'Finance' },
  { method: 'GET', path: '/api/admin/finance/payouts', description: 'List payouts', category: 'Finance' },
  { method: 'PUT', path: '/api/admin/finance/payouts/settings', description: 'Update payout settings', category: 'Finance' },
  { method: 'GET', path: '/api/admin/finance/payouts/analytics', description: 'Payout analytics', category: 'Finance' },
  { method: 'GET', path: '/api/admin/finance/disputes', description: 'List financial disputes', category: 'Finance' },
  { method: 'GET', path: '/api/admin/finance/refunds', description: 'List refund requests', category: 'Finance' },
  { method: 'GET', path: '/api/admin/finance/revenue-split', description: 'Get revenue split config', category: 'Finance' },
  { method: 'PUT', path: '/api/admin/finance/revenue-split', description: 'Update revenue split config', category: 'Finance' },
  { method: 'GET', path: '/api/admin/finance/forecast', description: 'Revenue forecast data', category: 'Finance' },
  { method: 'GET', path: '/api/admin/finance/tax-reports', description: 'Tax reports data', category: 'Finance' },
  { method: 'GET', path: '/api/admin/finance/export', description: 'Export finance data', category: 'Finance' },
  { method: 'PUT', path: '/api/admin/finance/settings', description: 'Update finance settings', category: 'Finance' },

  // Instructors
  { method: 'GET', path: '/api/admin/instructors', description: 'List all instructors', category: 'Instructors' },
  { method: 'GET', path: '/api/admin/instructors/[id]', description: 'Get instructor by ID', category: 'Instructors' },
  { method: 'PUT', path: '/api/admin/instructors/[id]', description: 'Update instructor by ID', category: 'Instructors' },
  { method: 'POST', path: '/api/admin/instructors/bulk', description: 'Bulk instructor operations', category: 'Instructors' },
  { method: 'GET', path: '/api/admin/instructors/export', description: 'Export instructors to CSV', category: 'Instructors' },

  // Instructor Applications
  { method: 'GET', path: '/api/admin/instructor-applications', description: 'List instructor applications', category: 'Instructor Applications' },
  { method: 'GET', path: '/api/admin/instructor-applications/[id]', description: 'Get application details', category: 'Instructor Applications' },
  { method: 'PUT', path: '/api/admin/instructor-applications/[id]', description: 'Review application', category: 'Instructor Applications' },

  // Security
  { method: 'GET', path: '/api/admin/security', description: 'Get security settings', category: 'Security' },
  { method: 'PUT', path: '/api/admin/security', description: 'Update security settings', category: 'Security' },
  { method: 'GET', path: '/api/admin/security/api-keys', description: 'List API keys', category: 'Security' },
  { method: 'POST', path: '/api/admin/security/api-keys', description: 'Create API key', category: 'Security' },
  { method: 'GET', path: '/api/admin/security/roles', description: 'List security roles', category: 'Security' },
  { method: 'POST', path: '/api/admin/security/roles', description: 'Create security role', category: 'Security' },
  { method: 'GET', path: '/api/admin/security/blocked-ips', description: 'List blocked IPs', category: 'Security' },
  { method: 'POST', path: '/api/admin/security/blocked-ips', description: 'Block an IP address', category: 'Security' },
  { method: 'GET', path: '/api/admin/security/login-alerts', description: 'List login alerts', category: 'Security' },
  { method: 'POST', path: '/api/admin/security/seed', description: 'Seed security data', category: 'Security' },

  // Settings
  { method: 'GET', path: '/api/admin/settings', description: 'Get platform settings', category: 'Settings' },
  { method: 'PUT', path: '/api/admin/settings', description: 'Update platform settings', category: 'Settings' },
  { method: 'GET', path: '/api/admin/settings/integrations', description: 'List integrations', category: 'Settings' },
  { method: 'PUT', path: '/api/admin/settings/integrations', description: 'Update integrations', category: 'Settings' },
  { method: 'GET', path: '/api/admin/settings/payment-methods', description: 'List payment methods', category: 'Settings' },
  { method: 'PUT', path: '/api/admin/settings/payment-methods', description: 'Update payment methods', category: 'Settings' },
  { method: 'GET', path: '/api/admin/settings/webhooks', description: 'List webhooks', category: 'Settings' },
  { method: 'POST', path: '/api/admin/settings/webhooks', description: 'Create webhook', category: 'Settings' },
  { method: 'GET', path: '/api/admin/settings/legal-pages', description: 'List legal pages', category: 'Settings' },
  { method: 'PUT', path: '/api/admin/settings/legal-pages', description: 'Update legal pages', category: 'Settings' },

  // Notifications
  { method: 'GET', path: '/api/admin/notifications/settings', description: 'Get notification settings', category: 'Notifications' },
  { method: 'PUT', path: '/api/admin/notifications/settings', description: 'Update notification settings', category: 'Notifications' },
  { method: 'GET', path: '/api/admin/notifications/templates', description: 'List notification templates', category: 'Notifications' },
  { method: 'POST', path: '/api/admin/notifications/templates', description: 'Create notification template', category: 'Notifications' },
  { method: 'GET', path: '/api/admin/notifications/history', description: 'List notification history', category: 'Notifications' },
  { method: 'POST', path: '/api/admin/notifications/send', description: 'Send notification', category: 'Notifications' },

  // Feature Flags
  { method: 'GET', path: '/api/admin/feature-flags', description: 'List feature flags', category: 'Feature Flags' },
  { method: 'PUT', path: '/api/admin/feature-flags', description: 'Update feature flag', category: 'Feature Flags' },

  // Platform Settings
  { method: 'GET', path: '/api/admin/platform-settings', description: 'Get platform configuration', category: 'Platform' },

  // Appearance
  { method: 'GET', path: '/api/admin/appearance', description: 'Get appearance settings', category: 'Appearance' },
  { method: 'PUT', path: '/api/admin/appearance', description: 'Update appearance settings', category: 'Appearance' },
  { method: 'GET', path: '/api/admin/appearance/theme-presets', description: 'List theme presets', category: 'Appearance' },
  { method: 'GET', path: '/api/admin/appearance/history', description: 'Appearance change history', category: 'Appearance' },

  // AI Config
  { method: 'GET', path: '/api/admin/ai-config', description: 'Get AI configuration', category: 'AI Configuration' },
  { method: 'PUT', path: '/api/admin/ai-config', description: 'Update AI configuration', category: 'AI Configuration' },
  { method: 'GET', path: '/api/admin/ai-config/providers', description: 'List AI providers', category: 'AI Configuration' },
  { method: 'POST', path: '/api/admin/ai-config/providers', description: 'Create AI provider', category: 'AI Configuration' },
  { method: 'GET', path: '/api/admin/ai-config/models', description: 'List AI models', category: 'AI Configuration' },
  { method: 'POST', path: '/api/admin/ai-config/models', description: 'Create AI model', category: 'AI Configuration' },
  { method: 'GET', path: '/api/admin/ai-config/prompt-templates', description: 'List prompt templates', category: 'AI Configuration' },
  { method: 'POST', path: '/api/admin/ai-config/prompt-templates', description: 'Create prompt template', category: 'AI Configuration' },
  { method: 'GET', path: '/api/admin/ai-config/usage-logs', description: 'List AI usage logs', category: 'AI Configuration' },
  { method: 'GET', path: '/api/admin/ai-config/audit-log', description: 'List AI audit logs', category: 'AI Configuration' },

  // Gamification
  { method: 'GET', path: '/api/admin/gamification', description: 'Get gamification overview', category: 'Gamification' },
  { method: 'GET', path: '/api/admin/gamification/badges', description: 'List badges', category: 'Gamification' },
  { method: 'POST', path: '/api/admin/gamification/badges', description: 'Create badge', category: 'Gamification' },
  { method: 'POST', path: '/api/admin/gamification/badge-award', description: 'Award badge to user', category: 'Gamification' },
  { method: 'GET', path: '/api/admin/gamification/leaderboard', description: 'Get leaderboard data', category: 'Gamification' },
  { method: 'GET', path: '/api/admin/gamification/challenges', description: 'List daily challenges', category: 'Gamification' },
  { method: 'GET', path: '/api/admin/gamification/events', description: 'List gamification events', category: 'Gamification' },
  { method: 'GET', path: '/api/admin/gamification/levels', description: 'List level configurations', category: 'Gamification' },
  { method: 'GET', path: '/api/admin/gamification/streak-rewards', description: 'List streak rewards', category: 'Gamification' },
  { method: 'GET', path: '/api/admin/gamification/xp-rules', description: 'List XP rules', category: 'Gamification' },
  { method: 'GET', path: '/api/admin/gamification/xp-activity', description: 'List XP activity', category: 'Gamification' },
  { method: 'GET', path: '/api/admin/gamification/reward-shop', description: 'List reward shop items', category: 'Gamification' },
  { method: 'GET', path: '/api/admin/gamification/settings', description: 'Get gamification settings', category: 'Gamification' },
  { method: 'POST', path: '/api/admin/gamification/bulk-actions', description: 'Bulk gamification actions', category: 'Gamification' },

  // Dashboard
  { method: 'GET', path: '/api/admin/dashboard', description: 'Get admin dashboard data', category: 'Dashboard' },
  { method: 'POST', path: '/api/admin/dashboard/actions', description: 'Execute dashboard quick actions', category: 'Dashboard' },

  // Audit Log
  { method: 'GET', path: '/api/admin/audit-log', description: 'List audit log entries', category: 'Audit' },

  // Announcements
  { method: 'GET', path: '/api/admin/announcements', description: 'List announcements', category: 'Announcements' },
  { method: 'POST', path: '/api/admin/announcements', description: 'Create announcement', category: 'Announcements' },

  // Student Insights
  { method: 'GET', path: '/api/admin/student-insights', description: 'Get student insights data', category: 'Analytics' },
  { method: 'GET', path: '/api/admin/export-report', description: 'Export platform report', category: 'Analytics' },

  // Dev Tools
  { method: 'GET', path: '/api/admin/dev-tools', description: 'Get DevTools dashboard data', category: 'Dev Tools' },
  { method: 'PUT', path: '/api/admin/dev-tools', description: 'Execute DevTools actions', category: 'Dev Tools' },

  // Auth
  { method: 'POST', path: '/api/auth/login', description: 'User login', category: 'Authentication' },
  { method: 'POST', path: '/api/auth/register', description: 'User registration', category: 'Authentication' },
  { method: 'POST', path: '/api/auth/forgot-password', description: 'Request password reset', category: 'Authentication' },
  { method: 'POST', path: '/api/auth/reset-password', description: 'Reset password', category: 'Authentication' },
  { method: 'POST', path: '/api/auth/verify-otp', description: 'Verify OTP code', category: 'Authentication' },
  { method: 'POST', path: '/api/auth/demo-login', description: 'Demo login', category: 'Authentication' },
  { method: 'POST', path: '/api/auth/social', description: 'Social authentication', category: 'Authentication' },

  // Public APIs
  { method: 'GET', path: '/api/courses', description: 'List published courses', category: 'Public' },
  { method: 'GET', path: '/api/courses/[id]', description: 'Get course details', category: 'Public' },
  { method: 'GET', path: '/api/courses/[id]/public', description: 'Get public course info', category: 'Public' },
  { method: 'GET', path: '/api/courses/catalog', description: 'Course catalog', category: 'Public' },
  { method: 'GET', path: '/api/courses/categories', description: 'List course categories', category: 'Public' },

  // Certificates
  { method: 'GET', path: '/api/certificates', description: 'List certificates', category: 'Certificates' },
  { method: 'GET', path: '/api/certificates/verify', description: 'Verify a certificate', category: 'Certificates' },
  { method: 'GET', path: '/api/certificates/download', description: 'Download certificate PDF', category: 'Certificates' },

  // AI
  { method: 'POST', path: '/api/ai/chat', description: 'AI chat completion', category: 'AI' },
  { method: 'POST', path: '/api/ai/tutor', description: 'Ask ShijlAI request', category: 'AI' },
];

// ==================== HELPER FUNCTIONS ====================

function getDateRange(period: 'today' | 'week' | 'month') {
  const now = new Date();
  const start = new Date();
  if (period === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setMonth(now.getMonth() - 1);
    start.setHours(0, 0, 0, 0);
  }
  return { start, end: now };
}

function serializeDates<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (value instanceof Date) {
      (result as Record<string, unknown>)[key] = value.toISOString();
    }
  }
  return result;
}

// ==================== SEED API USAGE DATA ====================

async function seedApiUsageData() {
  const endpoints = [
    '/api/admin/users', '/api/admin/courses', '/api/admin/finance/overview',
    '/api/admin/dashboard', '/api/admin/enrollments', '/api/admin/security',
    '/api/auth/login', '/api/courses', '/api/courses/catalog',
    '/api/admin/instructors', '/api/admin/finance/transactions',
    '/api/admin/feature-flags', '/api/admin/notifications/history',
    '/api/admin/audit-log', '/api/ai/chat', '/api/admin/gamification',
    '/api/admin/settings', '/api/admin/appearance', '/api/admin/ai-config',
    '/api/certificates/verify',
  ];
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  const ips = ['192.168.1.1', '10.0.0.42', '172.16.0.8', '203.0.113.50', '198.51.100.23'];
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1',
    'Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0',
    'ShijlAI-AdminPanel/1.0',
    'ShijlAI-MobileApp/2.3.1',
  ];

  const logs = [];
  const now = new Date();

  for (let i = 0; i < 200; i++) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const method = methods[Math.floor(Math.random() * methods.length)];
    const isError = Math.random() < 0.08;
    const isClientError = !isError && Math.random() < 0.05;
    let statusCode = 200;
    if (isError) {
      statusCode = Math.random() < 0.5 ? 500 : 503;
    } else if (isClientError) {
      statusCode = Math.random() < 0.5 ? 404 : 400;
    }

    const createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    logs.push({
      endpoint,
      method,
      statusCode,
      responseTime: Math.floor(Math.random() * 800) + 20,
      ipAddress: ips[Math.floor(Math.random() * ips.length)],
      userAgent: agents[Math.floor(Math.random() * agents.length)],
      requestBody: method !== 'GET' ? JSON.stringify({ test: true }) : null,
      error: isError ? (statusCode === 500 ? 'Internal Server Error' : 'Service Unavailable') : null,
      createdAt,
    });
  }

  await db.apiUsageLog.createMany({ data: logs });
  return logs.length;
}

// ==================== GET HANDLER ====================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // 1. Feature Flags — seed defaults if empty
    let featureFlags = await db.featureFlag.findMany({ orderBy: { createdAt: 'asc' } });
    if (featureFlags.length === 0) {
      await db.featureFlag.createMany({ data: DEFAULT_DEV_FEATURE_FLAGS });
      featureFlags = await db.featureFlag.findMany({ orderBy: { createdAt: 'asc' } });
    }

    // 2. API Usage Stats
    let apiUsageLogs = await db.apiUsageLog.findMany({ orderBy: { createdAt: 'desc' } });

    // Seed sample API usage data if empty
    if (apiUsageLogs.length === 0) {
      await seedApiUsageData();
      apiUsageLogs = await db.apiUsageLog.findMany({ orderBy: { createdAt: 'desc' } });
    }

    const todayRange = getDateRange('today');
    const weekRange = getDateRange('week');
    const monthRange = getDateRange('month');

    const todayLogs = apiUsageLogs.filter(l => new Date(l.createdAt) >= todayRange.start);
    const weekLogs = apiUsageLogs.filter(l => new Date(l.createdAt) >= weekRange.start);
    const monthLogs = apiUsageLogs.filter(l => new Date(l.createdAt) >= monthRange.start);

    const avgResponseTime = apiUsageLogs.length > 0
      ? Math.round(apiUsageLogs.reduce((sum, l) => sum + l.responseTime, 0) / apiUsageLogs.length)
      : 0;

    const errorCount = apiUsageLogs.filter(l => l.statusCode >= 400).length;
    const errorRate = apiUsageLogs.length > 0
      ? parseFloat(((errorCount / apiUsageLogs.length) * 100).toFixed(2))
      : 0;

    // Top endpoints by request count
    const endpointCounts: Record<string, number> = {};
    for (const log of apiUsageLogs) {
      endpointCounts[log.endpoint] = (endpointCounts[log.endpoint] || 0) + 1;
    }
    const topEndpoints = Object.entries(endpointCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    // Status code distribution
    const statusCodeDist: Record<number, number> = {};
    for (const log of apiUsageLogs) {
      const group = Math.floor(log.statusCode / 100) * 100;
      statusCodeDist[group] = (statusCodeDist[group] || 0) + 1;
    }
    const statusDistribution = Object.entries(statusCodeDist)
      .map(([code, count]) => ({ code: parseInt(code), count }))
      .sort((a, b) => a.code - b.code);

    // Recent API calls (paginated)
    const totalLogs = apiUsageLogs.length;
    const totalPages = Math.ceil(totalLogs / pageSize);
    const paginatedLogs = apiUsageLogs.slice((page - 1) * pageSize, page * pageSize);

    const apiUsageStats = {
      totalRequests: {
        today: todayLogs.length,
        thisWeek: weekLogs.length,
        thisMonth: monthLogs.length,
        allTime: totalLogs,
      },
      averageResponseTime: avgResponseTime,
      errorRate,
      topEndpoints,
      statusDistribution,
      recentCalls: {
        data: paginatedLogs.map(serializeDates),
        pagination: {
          page,
          pageSize,
          totalItems: totalLogs,
          totalPages,
        },
      },
    };

    // 3. System Health
    const memoryUsage = process.memoryUsage();
    const uptimeSeconds = process.uptime();

    let dbConnected = false;
    let dbResponseTime = 0;
    try {
      const dbStart = Date.now();
      await db.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStart;
      dbConnected = true;
    } catch {
      dbConnected = false;
    }

    // Table counts
    const [
      userCount,
      courseCount,
      enrollmentCount,
      certificateCount,
      quizCount,
      assignmentCount,
      discussionPostCount,
      transactionCount,
      notificationCount,
      liveSessionCount,
      activityLogCount,
      apiUsageLogCount,
    ] = await Promise.all([
      db.user.count(),
      db.course.count(),
      db.enrollment.count(),
      db.certificate.count(),
      db.quiz.count(),
      db.assignment.count(),
      db.discussionPost.count(),
      db.transaction.count(),
      db.notification.count(),
      db.liveSession.count(),
      db.activityLog.count(),
      db.apiUsageLog.count(),
    ]);

    // Active sessions
    const activeSessions = await db.userSession.count({
      where: {
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    // Webhook health
    const activeWebhooks = await db.webhookConfig.count({ where: { isActive: true } });
    const totalWebhooks = await db.webhookConfig.count();
    const recentWebhookFailures = await db.webhookConfig.count({
      where: { failureCount: { gt: 0 } },
    });

    const systemHealth = {
      uptime: {
        seconds: Math.floor(uptimeSeconds),
        formatted: formatUptime(uptimeSeconds),
      },
      memory: {
        rss: formatBytes(memoryUsage.rss),
        heapUsed: formatBytes(memoryUsage.heapUsed),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        rssBytes: memoryUsage.rss,
        heapUsedBytes: memoryUsage.heapUsed,
        heapTotalBytes: memoryUsage.heapTotal,
      },
      database: {
        connected: dbConnected,
        responseTime: dbResponseTime,
      },
      tableCounts: {
        users: userCount,
        courses: courseCount,
        enrollments: enrollmentCount,
        certificates: certificateCount,
        quizzes: quizCount,
        assignments: assignmentCount,
        discussionPosts: discussionPostCount,
        transactions: transactionCount,
        notifications: notificationCount,
        liveSessions: liveSessionCount,
        activityLogs: activityLogCount,
        apiUsageLogs: apiUsageLogCount,
      },
      activeSessions,
      webhooks: {
        active: activeWebhooks,
        total: totalWebhooks,
        recentFailures: recentWebhookFailures,
      },
    };

    // 4. API Endpoints (hardcoded)
    const apiEndpoints = API_ENDPOINTS;

    // 5. DB Stats
    const dbStats = {
      users: userCount,
      courses: courseCount,
      enrollments: enrollmentCount,
      certificates: certificateCount,
      quizzes: quizCount,
      assignments: assignmentCount,
      modules: await db.module.count(),
      lessons: await db.lesson.count(),
      questions: await db.question.count(),
      badges: await db.badge.count(),
      transactions: transactionCount,
      payouts: await db.payout.count(),
      notifications: notificationCount,
      messages: await db.message.count(),
      discussions: discussionPostCount,
      studyGroups: await db.studyGroup.count(),
      featureFlags: featureFlags.length,
      apiKeys: await db.apiKey.count(),
      webhooks: totalWebhooks,
      activityLogs: activityLogCount,
      apiUsageLogs: apiUsageLogCount,
      liveSessions: liveSessionCount,
      userSessions: await db.userSession.count(),
    };

    return NextResponse.json({
      featureFlags: featureFlags.map(serializeDates),
      apiUsageStats,
      systemHealth,
      apiEndpoints,
      dbStats,
    });
  } catch (error) {
    console.error('DevTools GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DevTools data' },
      { status: 500 }
    );
  }
}

// ==================== PUT HANDLER ====================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body as { type: string };

    switch (type) {
      case 'featureFlag': {
        return await handleFeatureFlagAction(body);
      }
      case 'seedApiUsage': {
        return await handleSeedApiUsage(body);
      }
      case 'clearApiLogs': {
        return await handleClearApiLogs();
      }
      case 'runDiagnostics': {
        return await handleRunDiagnostics();
      }
      case 'testEndpoint': {
        return await handleTestEndpoint(body);
      }
      case 'optimizeDb': {
        return await handleOptimizeDb();
      }
      default: {
        return NextResponse.json(
          { error: `Unknown action type: ${type}` },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error('DevTools PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to execute DevTools action' },
      { status: 500 }
    );
  }
}

// ==================== FEATURE FLAG ACTIONS ====================

async function handleFeatureFlagAction(body: {
  action: 'create' | 'update' | 'delete' | 'toggle';
  id?: string;
  name?: string;
  displayName?: string;
  description?: string;
  enabled?: boolean;
  rollout?: number;
  category?: string;
}) {
  const { action } = body;

  switch (action) {
    case 'create': {
      const { name, displayName, description, enabled, rollout, category } = body;
      if (!name || !displayName) {
        return NextResponse.json(
          { error: 'name and displayName are required' },
          { status: 400 }
        );
      }

      const existing = await db.featureFlag.findUnique({ where: { name } });
      if (existing) {
        return NextResponse.json(
          { error: `Feature flag with name "${name}" already exists` },
          { status: 409 }
        );
      }

      const flag = await db.featureFlag.create({
        data: {
          name,
          displayName,
          description: description || null,
          enabled: enabled ?? false,
          rollout: rollout ?? 100,
          category: category || 'general',
        },
      });

      await db.activityLog.create({
        data: {
          type: 'settings_updated',
          title: `Feature flag "${displayName}" created`,
          description: `Created feature flag "${name}" in category "${category || 'general'}"`,
          icon: '🚩',
          action: 'created',
          targetName: displayName,
          targetType: 'settings',
          targetId: flag.id,
          severity: 'info',
          category: 'admin_action',
          metadata: JSON.stringify({ flagName: name, enabled: enabled ?? false, rollout: rollout ?? 100 }),
        },
      });

      return NextResponse.json({ flag: serializeDates(flag) });
    }

    case 'update': {
      const { id, name, displayName, description, enabled, rollout, category } = body;
      if (!id) {
        return NextResponse.json(
          { error: 'Feature flag ID is required' },
          { status: 400 }
        );
      }

      const existing = await db.featureFlag.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json(
          { error: 'Feature flag not found' },
          { status: 404 }
        );
      }

      const updateData: Record<string, unknown> = {};
      if (displayName !== undefined) updateData.displayName = displayName;
      if (description !== undefined) updateData.description = description;
      if (enabled !== undefined) updateData.enabled = enabled;
      if (rollout !== undefined) {
        if (rollout < 0 || rollout > 100) {
          return NextResponse.json(
            { error: 'Rollout must be between 0 and 100' },
            { status: 400 }
          );
        }
        updateData.rollout = rollout;
      }
      if (category !== undefined) updateData.category = category;

      const updated = await db.featureFlag.update({
        where: { id },
        data: updateData,
      });

      await db.activityLog.create({
        data: {
          type: 'settings_updated',
          title: `Feature flag "${existing.displayName}" updated`,
          description: `Updated feature flag "${existing.name}": ${Object.keys(updateData).join(', ')}`,
          icon: '🚩',
          action: 'updated',
          targetName: existing.displayName,
          targetType: 'settings',
          targetId: id,
          severity: 'info',
          category: 'admin_action',
          metadata: JSON.stringify({ flagName: existing.name, changes: updateData }),
        },
      });

      return NextResponse.json({ flag: serializeDates(updated) });
    }

    case 'delete': {
      const { id } = body;
      if (!id) {
        return NextResponse.json(
          { error: 'Feature flag ID is required' },
          { status: 400 }
        );
      }

      const existing = await db.featureFlag.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json(
          { error: 'Feature flag not found' },
          { status: 404 }
        );
      }

      await db.featureFlag.delete({ where: { id } });

      await db.activityLog.create({
        data: {
          type: 'settings_updated',
          title: `Feature flag "${existing.displayName}" deleted`,
          description: `Deleted feature flag "${existing.name}"`,
          icon: '🚩',
          action: 'deleted',
          targetName: existing.displayName,
          targetType: 'settings',
          targetId: id,
          severity: 'warning',
          category: 'admin_action',
          metadata: JSON.stringify({ flagName: existing.name }),
        },
      });

      return NextResponse.json({ success: true, deletedId: id });
    }

    case 'toggle': {
      const { id } = body;
      if (!id) {
        return NextResponse.json(
          { error: 'Feature flag ID is required' },
          { status: 400 }
        );
      }

      const existing = await db.featureFlag.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json(
          { error: 'Feature flag not found' },
          { status: 404 }
        );
      }

      const updated = await db.featureFlag.update({
        where: { id },
        data: { enabled: !existing.enabled },
      });

      await db.activityLog.create({
        data: {
          type: 'settings_updated',
          title: `Feature flag "${existing.displayName}" ${updated.enabled ? 'enabled' : 'disabled'}`,
          description: `Toggled feature flag "${existing.name}" to ${updated.enabled ? 'enabled' : 'disabled'}`,
          icon: updated.enabled ? '✅' : '❌',
          action: 'updated',
          targetName: existing.displayName,
          targetType: 'settings',
          targetId: id,
          severity: 'info',
          category: 'admin_action',
          metadata: JSON.stringify({ flagName: existing.name, enabled: updated.enabled }),
        },
      });

      return NextResponse.json({ flag: serializeDates(updated) });
    }

    default: {
      return NextResponse.json(
        { error: `Unknown feature flag action: ${action}` },
        { status: 400 }
      );
    }
  }
}

// ==================== SEED API USAGE ====================

async function handleSeedApiUsage(body: { count?: number }) {
  const count = body.count || 200;
  const endpoints = [
    '/api/admin/users', '/api/admin/courses', '/api/admin/finance/overview',
    '/api/admin/dashboard', '/api/admin/enrollments', '/api/admin/security',
    '/api/auth/login', '/api/courses', '/api/courses/catalog',
    '/api/admin/instructors', '/api/admin/finance/transactions',
    '/api/admin/feature-flags', '/api/admin/notifications/history',
    '/api/admin/audit-log', '/api/ai/chat', '/api/admin/gamification',
    '/api/admin/settings', '/api/admin/appearance', '/api/admin/ai-config',
    '/api/certificates/verify',
  ];
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  const ips = ['192.168.1.1', '10.0.0.42', '172.16.0.8', '203.0.113.50', '198.51.100.23'];
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1',
    'Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0',
    'ShijlAI-AdminPanel/1.0',
    'ShijlAI-MobileApp/2.3.1',
  ];

  const logs = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const method = methods[Math.floor(Math.random() * methods.length)];
    const isError = Math.random() < 0.08;
    const isClientError = !isError && Math.random() < 0.05;
    let statusCode = 200;
    if (isError) {
      statusCode = Math.random() < 0.5 ? 500 : 503;
    } else if (isClientError) {
      statusCode = Math.random() < 0.5 ? 404 : 400;
    }

    const createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    logs.push({
      endpoint,
      method,
      statusCode,
      responseTime: Math.floor(Math.random() * 800) + 20,
      ipAddress: ips[Math.floor(Math.random() * ips.length)],
      userAgent: agents[Math.floor(Math.random() * agents.length)],
      requestBody: method !== 'GET' ? JSON.stringify({ test: true }) : null,
      error: isError ? (statusCode === 500 ? 'Internal Server Error' : 'Service Unavailable') : null,
      createdAt,
    });
  }

  await db.apiUsageLog.createMany({ data: logs });

  await db.activityLog.create({
    data: {
      type: 'settings_updated',
      title: 'API usage data seeded',
      description: `Seeded ${count} sample API usage log entries`,
      icon: '🌱',
      action: 'created',
      targetType: 'system',
      severity: 'info',
      category: 'system_event',
      metadata: JSON.stringify({ count }),
    },
  });

  return NextResponse.json({ success: true, count });
}

// ==================== CLEAR API LOGS ====================

async function handleClearApiLogs() {
  const result = await db.apiUsageLog.deleteMany({});

  await db.activityLog.create({
    data: {
      type: 'settings_updated',
      title: 'API usage logs cleared',
      description: `Cleared ${result.count} API usage log entries`,
      icon: '🗑️',
      action: 'deleted',
      targetType: 'system',
      severity: 'warning',
      category: 'system_event',
      metadata: JSON.stringify({ deletedCount: result.count }),
    },
  });

  return NextResponse.json({ success: true, deletedCount: result.count });
}

// ==================== RUN DIAGNOSTICS ====================

async function handleRunDiagnostics() {
  const checks: {
    name: string;
    status: 'healthy' | 'warning' | 'error';
    message: string;
    responseTime?: number;
    details?: Record<string, unknown>;
  }[] = [];

  // 1. Database connectivity
  try {
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    const dbTime = Date.now() - dbStart;
    checks.push({
      name: 'Database Connectivity',
      status: dbTime < 100 ? 'healthy' : dbTime < 500 ? 'warning' : 'error',
      message: `Database responded in ${dbTime}ms`,
      responseTime: dbTime,
    });
  } catch {
    checks.push({
      name: 'Database Connectivity',
      status: 'error',
      message: 'Database connection failed',
    });
  }

  // 2. Memory check
  const memory = process.memoryUsage();
  const heapUsedPercent = (memory.heapUsed / memory.heapTotal) * 100;
  checks.push({
    name: 'Memory Usage',
    status: heapUsedPercent < 70 ? 'healthy' : heapUsedPercent < 90 ? 'warning' : 'error',
    message: `Heap usage at ${heapUsedPercent.toFixed(1)}% (${formatBytes(memory.heapUsed)} / ${formatBytes(memory.heapTotal)})`,
    details: {
      rss: formatBytes(memory.rss),
      heapUsed: formatBytes(memory.heapUsed),
      heapTotal: formatBytes(memory.heapTotal),
      rssBytes: memory.rss,
      heapUsedBytes: memory.heapUsed,
      heapTotalBytes: memory.heapTotal,
    },
  });

  // 3. Process uptime
  const uptime = process.uptime();
  checks.push({
    name: 'Process Uptime',
    status: uptime > 60 ? 'healthy' : 'warning',
    message: `Process running for ${formatUptime(uptime)}`,
    details: { uptimeSeconds: Math.floor(uptime) },
  });

  // 4. Active sessions check
  try {
    const activeSessions = await db.userSession.count({
      where: { isActive: true, expiresAt: { gt: new Date() } },
    });
    checks.push({
      name: 'Active Sessions',
      status: 'healthy',
      message: `${activeSessions} active user sessions`,
      details: { count: activeSessions },
    });
  } catch {
    checks.push({
      name: 'Active Sessions',
      status: 'error',
      message: 'Failed to check active sessions',
    });
  }

  // 5. API error rate check
  try {
    const recentLogs = await db.apiUsageLog.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });
    const errorLogs = recentLogs.filter(l => l.statusCode >= 400);
    const rate = recentLogs.length > 0 ? (errorLogs.length / recentLogs.length) * 100 : 0;
    checks.push({
      name: 'API Error Rate (24h)',
      status: rate < 5 ? 'healthy' : rate < 15 ? 'warning' : 'error',
      message: `${rate.toFixed(2)}% error rate (${errorLogs.length}/${recentLogs.length} requests)`,
      details: { errorRate: rate, totalRequests: recentLogs.length, errorRequests: errorLogs.length },
    });
  } catch {
    checks.push({
      name: 'API Error Rate (24h)',
      status: 'warning',
      message: 'Unable to calculate error rate',
    });
  }

  // 6. Webhook health
  try {
    const failedWebhooks = await db.webhookConfig.count({ where: { failureCount: { gt: 3 } } });
    const totalWebhooks = await db.webhookConfig.count();
    checks.push({
      name: 'Webhook Health',
      status: failedWebhooks === 0 ? 'healthy' : failedWebhooks < 3 ? 'warning' : 'error',
      message: `${failedWebhooks} of ${totalWebhooks} webhooks have recent failures`,
      details: { failedWebhooks, totalWebhooks },
    });
  } catch {
    checks.push({
      name: 'Webhook Health',
      status: 'warning',
      message: 'Unable to check webhook health',
    });
  }

  // 7. API keys check
  try {
    const activeApiKeys = await db.apiKey.count({ where: { isActive: true } });
    checks.push({
      name: 'API Keys',
      status: 'healthy',
      message: `${activeApiKeys} active API keys`,
      details: { activeApiKeys },
    });
  } catch {
    checks.push({
      name: 'API Keys',
      status: 'warning',
      message: 'Unable to check API keys',
    });
  }

  // 8. Feature flags check
  try {
    const enabledFlags = await db.featureFlag.count({ where: { enabled: true } });
    const totalFlags = await db.featureFlag.count();
    checks.push({
      name: 'Feature Flags',
      status: 'healthy',
      message: `${enabledFlags}/${totalFlags} feature flags enabled`,
      details: { enabledFlags, totalFlags },
    });
  } catch {
    checks.push({
      name: 'Feature Flags',
      status: 'warning',
      message: 'Unable to check feature flags',
    });
  }

  const healthyCount = checks.filter(c => c.status === 'healthy').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const errorCount = checks.filter(c => c.status === 'error').length;

  const overallStatus = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'healthy';

  await db.activityLog.create({
    data: {
      type: 'settings_updated',
      title: 'System diagnostics run',
      description: `Diagnostics complete: ${healthyCount} healthy, ${warningCount} warnings, ${errorCount} errors`,
      icon: '🔍',
      action: 'generic',
      targetType: 'system',
      severity: overallStatus === 'healthy' ? 'info' : overallStatus === 'warning' ? 'warning' : 'critical',
      category: 'system_event',
      metadata: JSON.stringify({ overallStatus, healthyCount, warningCount, errorCount }),
    },
  });

  return NextResponse.json({
    overallStatus,
    summary: { healthy: healthyCount, warnings: warningCount, errors: errorCount },
    checks,
    timestamp: new Date().toISOString(),
  });
}

// ==================== TEST ENDPOINT ====================

async function handleTestEndpoint(body: {
  endpoint: string;
  method?: string;
  requestBody?: string;
}) {
  const { endpoint, method = 'GET', requestBody } = body;

  if (!endpoint) {
    return NextResponse.json(
      { error: 'Endpoint is required' },
      { status: 400 }
    );
  }

  const startTime = Date.now();
  let statusCode = 200;
  let error: string | null = null;
  let responseData: unknown = null;

  try {
    // Test the endpoint by making an internal fetch
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}${endpoint}`;

    const fetchOptions: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (requestBody && method !== 'GET') {
      fetchOptions.body = requestBody;
    }

    const response = await fetch(url, fetchOptions);
    statusCode = response.status;
    const responseTime = Date.now() - startTime;

    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }

    // Log the test to ApiUsageLog
    await db.apiUsageLog.create({
      data: {
        endpoint,
        method,
        statusCode,
        responseTime,
        ipAddress: '127.0.0.1',
        userAgent: 'DevTools-EndpointTester/1.0',
        requestBody: requestBody || null,
        error: statusCode >= 400 ? `HTTP ${statusCode}` : null,
      },
    });

    return NextResponse.json({
      success: statusCode < 400,
      endpoint,
      method,
      statusCode,
      responseTime,
      response: responseData,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const responseTime = Date.now() - startTime;
    error = err instanceof Error ? err.message : 'Unknown error';
    statusCode = 0;

    // Log the failed test
    await db.apiUsageLog.create({
      data: {
        endpoint,
        method,
        statusCode,
        responseTime,
        ipAddress: '127.0.0.1',
        userAgent: 'DevTools-EndpointTester/1.0',
        requestBody: requestBody || null,
        error,
      },
    });

    return NextResponse.json({
      success: false,
      endpoint,
      method,
      statusCode,
      responseTime,
      error,
      timestamp: new Date().toISOString(),
    });
  }
}

// ==================== OPTIMIZE DB ====================

async function handleOptimizeDb() {
  const results: { operation: string; status: string; details: string }[] = [];
  const tables = '`User`, `Course`, `Enrollment`, `Lesson`, `Module`, `Quiz`, `Assignment`, `Transaction`, `Notification`, `ActivityLog`';

  // 1. OPTIMIZE TABLE (MySQL)
  try {
    const optimizeStart = Date.now();
    await db.$executeRawUnsafe(`OPTIMIZE TABLE ${tables}`);
    const optimizeTime = Date.now() - optimizeStart;
    results.push({
      operation: 'OPTIMIZE TABLE',
      status: 'success',
      details: `Completed in ${optimizeTime}ms — defragmented and reclaimed unused space`,
    });
  } catch (err) {
    results.push({
      operation: 'OPTIMIZE TABLE',
      status: 'error',
      details: err instanceof Error ? err.message : 'OPTIMIZE TABLE failed',
    });
  }

  // 2. ANALYZE TABLE (MySQL)
  try {
    const analyzeStart = Date.now();
    await db.$executeRawUnsafe(`ANALYZE TABLE ${tables}`);
    const analyzeTime = Date.now() - analyzeStart;
    results.push({
      operation: 'ANALYZE TABLE',
      status: 'success',
      details: `Completed in ${analyzeTime}ms — updated table optimizer statistics`,
    });
  } catch (err) {
    results.push({
      operation: 'ANALYZE TABLE',
      status: 'error',
      details: err instanceof Error ? err.message : 'ANALYZE TABLE failed',
    });
  }

  // 3. CHECK TABLE (MySQL)
  try {
    const integrityStart = Date.now();
    const integrityResult = await db.$queryRawUnsafe(`CHECK TABLE ${tables}`) as Array<{ Msg_text: string }>;
    const integrityTime = Date.now() - integrityStart;
    const isOk = integrityResult.every(row => row.Msg_text === 'OK' || row.Msg_text === 'Table is already up to date');
    results.push({
      operation: 'Integrity Check',
      status: isOk ? 'success' : 'error',
      details: `${isOk ? 'OK' : 'Issues found'} — completed in ${integrityTime}ms`,
    });
  } catch (err) {
    results.push({
      operation: 'Integrity Check',
      status: 'error',
      details: err instanceof Error ? err.message : 'Integrity check failed',
    });
  }

  // 4. Record counts summary
  try {
    const tableCounts: Record<string, number> = {};
    const tables = ['User', 'Course', 'Enrollment', 'Lesson', 'Module', 'Quiz', 'Assignment', 'Transaction', 'Notification', 'ActivityLog', 'ApiUsageLog'];
    for (const table of tables) {
      try {
        const count = await (db as Record<string, { count: () => Promise<number> }>)[table.charAt(0).toLowerCase() + table.slice(1)].count();
        tableCounts[table] = count;
      } catch {
        tableCounts[table] = -1;
      }
    }
    results.push({
      operation: 'Table Counts',
      status: 'success',
      details: `Verified ${tables.length} tables`,
    });
  } catch {
    results.push({
      operation: 'Table Counts',
      status: 'error',
      details: 'Failed to count tables',
    });
  }

  // Log activity
  await db.activityLog.create({
    data: {
      type: 'settings_updated',
      title: 'Database optimization performed',
      description: `Ran ${results.length} optimization operations: ${results.filter(r => r.status === 'success').length} succeeded, ${results.filter(r => r.status === 'error').length} failed`,
      icon: '⚡',
      action: 'updated',
      targetType: 'system',
      severity: 'info',
      category: 'system_event',
      metadata: JSON.stringify({ operations: results.map(r => ({ operation: r.operation, status: r.status })) }),
    },
  });

  return NextResponse.json({
    success: results.every(r => r.status === 'success'),
    results,
    timestamp: new Date().toISOString(),
  });
}

// ==================== UTILITY FUNCTIONS ====================

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}
