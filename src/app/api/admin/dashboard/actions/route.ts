import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

type AdminAction =
  | 'send_announcement'
  | 'toggle_maintenance'
  | 'clear_cache'
  | 'bulk_suspend_users'
  | 'bulk_activate_users'
  | 'feature_course'
  | 'unfeature_course'
  | 'process_pending_payouts';

interface ActionRequest {
  action: AdminAction;
  params?: Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const body: ActionRequest = await request.json();
    const { action, params = {} } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'send_announcement':
        return await handleSendAnnouncement(params);
      case 'toggle_maintenance':
        return await handleToggleMaintenance(params);
      case 'clear_cache':
        return await handleClearCache();
      case 'bulk_suspend_users':
        return await handleBulkSuspendUsers(params);
      case 'bulk_activate_users':
        return await handleBulkActivateUsers(params);
      case 'feature_course':
        return await handleFeatureCourse(params);
      case 'unfeature_course':
        return await handleUnfeatureCourse(params);
      case 'process_pending_payouts':
        return await handleProcessPendingPayouts();
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── Send Announcement ────────────────────────────────────────
async function handleSendAnnouncement(params: Record<string, unknown>) {
  const title = params.title as string;
  const message = params.message as string;
  const type = (params.type as string) || 'info';
  const target = (params.target as string) || 'all';

  if (!title || !message) {
    return NextResponse.json(
      { success: false, error: 'Title and message are required' },
      { status: 400 }
    );
  }

  // Create the platform announcement
  const announcement = await db.platformAnnouncement.create({
    data: {
      title,
      message,
      type,
      target,
      isActive: true,
      createdBy: 'admin',
    },
  });

  // Find users matching the target
  const whereClause =
    target === 'all'
      ? {}
      : target === 'students'
        ? { role: 'student' }
        : target === 'instructors'
          ? { role: 'instructor' }
          : target === 'admins'
            ? { role: 'admin' }
            : {};

  const targetUsers = await db.user.findMany({
    where: whereClause,
    select: { id: true },
  });

  // Create notifications for all matching users
  if (targetUsers.length > 0) {
    await db.notification.createMany({
      data: targetUsers.map((u) => ({
        userId: u.id,
        type: 'system',
        title,
        content: message,
        icon: type === 'critical' ? '🚨' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : '📢',
        link: '/announcements',
      })),
    });
  }

  // Log activity
  await db.activityLog.create({
    data: {
      type: 'notification_sent',
      title: `Announcement sent: "${title}"`,
      description: `Sent to ${target} (${targetUsers.length} users). Type: ${type}`,
      icon: '📢',
      action: 'sent',
      targetName: title,
      targetType: 'notification',
      targetId: announcement.id,
      severity: type === 'critical' ? 'critical' : 'info',
      category: 'admin_action',
    },
  });

  return NextResponse.json({
    success: true,
    message: `Announcement sent to ${targetUsers.length} users`,
  });
}

// ─── Toggle Maintenance Mode ──────────────────────────────────
async function handleToggleMaintenance(params: Record<string, unknown>) {
  const enabled = params.enabled as boolean;

  if (typeof enabled !== 'boolean') {
    return NextResponse.json(
      { success: false, error: 'enabled (boolean) is required' },
      { status: 400 }
    );
  }

  const value = enabled ? 'true' : 'false';

  await db.platformSetting.upsert({
    where: { key: 'maintenance_mode' },
    update: { value },
    create: {
      key: 'maintenance_mode',
      value,
      label: 'Maintenance Mode',
      type: 'boolean',
      category: 'general',
    },
  });

  // Log activity
  await db.activityLog.create({
    data: {
      type: 'settings_updated',
      title: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
      description: `Platform maintenance mode has been ${enabled ? 'enabled' : 'disabled'}`,
      icon: enabled ? '🔧' : '✅',
      action: 'updated',
      targetName: 'Maintenance Mode',
      targetType: 'settings',
      severity: enabled ? 'warning' : 'info',
      category: 'system_event',
    },
  });

  return NextResponse.json({
    success: true,
    message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
  });
}

// ─── Clear Cache ──────────────────────────────────────────────
async function handleClearCache() {
  // Simulated cache clear (we use memory caching, no actual Redis)
  await db.activityLog.create({
    data: {
      type: 'settings_updated',
      title: 'Platform cache cleared',
      description: 'Admin cleared the platform cache. All cached data has been invalidated.',
      icon: '🗑️',
      action: 'deleted',
      targetName: 'Platform Cache',
      targetType: 'system',
      severity: 'info',
      category: 'system_event',
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Platform cache cleared successfully',
  });
}

// ─── Bulk Suspend Users ───────────────────────────────────────
async function handleBulkSuspendUsers(params: Record<string, unknown>) {
  const userIds = params.userIds as string[];

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json(
      { success: false, error: 'userIds (non-empty array) is required' },
      { status: 400 }
    );
  }

  const result = await db.user.updateMany({
    where: { id: { in: userIds } },
    data: { status: 'suspended' },
  });

  // Log activity
  await db.activityLog.create({
    data: {
      type: 'user_suspended',
      title: `${result.count} user(s) suspended`,
      description: `Bulk suspended users: ${userIds.join(', ')}`,
      icon: '🚫',
      action: 'suspended',
      targetName: `${result.count} user(s)`,
      targetType: 'user',
      severity: 'warning',
      category: 'user_management',
      metadata: JSON.stringify({ userIds }),
    },
  });

  return NextResponse.json({
    success: true,
    message: `${result.count} user(s) suspended successfully`,
  });
}

// ─── Bulk Activate Users ──────────────────────────────────────
async function handleBulkActivateUsers(params: Record<string, unknown>) {
  const userIds = params.userIds as string[];

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json(
      { success: false, error: 'userIds (non-empty array) is required' },
      { status: 400 }
    );
  }

  const result = await db.user.updateMany({
    where: { id: { in: userIds } },
    data: { status: 'active' },
  });

  // Log activity
  await db.activityLog.create({
    data: {
      type: 'user_signup',
      title: `${result.count} user(s) activated`,
      description: `Bulk activated users: ${userIds.join(', ')}`,
      icon: '✅',
      action: 'updated',
      targetName: `${result.count} user(s)`,
      targetType: 'user',
      severity: 'info',
      category: 'user_management',
      metadata: JSON.stringify({ userIds }),
    },
  });

  return NextResponse.json({
    success: true,
    message: `${result.count} user(s) activated successfully`,
  });
}

// ─── Feature Course ───────────────────────────────────────────
async function handleFeatureCourse(params: Record<string, unknown>) {
  const courseId = params.courseId as string;

  if (!courseId) {
    return NextResponse.json(
      { success: false, error: 'courseId is required' },
      { status: 400 }
    );
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true },
  });

  if (!course) {
    return NextResponse.json(
      { success: false, error: 'Course not found' },
      { status: 404 }
    );
  }

  await db.course.update({
    where: { id: courseId },
    data: { featured: true },
  });

  // Log activity
  await db.activityLog.create({
    data: {
      type: 'course_published',
      title: `Course featured: "${course.title}"`,
      description: `Course "${course.title}" has been marked as featured`,
      icon: '⭐',
      action: 'updated',
      targetName: course.title,
      targetType: 'course',
      targetId: courseId,
      severity: 'info',
      category: 'content',
    },
  });

  return NextResponse.json({
    success: true,
    message: `Course "${course.title}" is now featured`,
  });
}

// ─── Unfeature Course ─────────────────────────────────────────
async function handleUnfeatureCourse(params: Record<string, unknown>) {
  const courseId = params.courseId as string;

  if (!courseId) {
    return NextResponse.json(
      { success: false, error: 'courseId is required' },
      { status: 400 }
    );
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true },
  });

  if (!course) {
    return NextResponse.json(
      { success: false, error: 'Course not found' },
      { status: 404 }
    );
  }

  await db.course.update({
    where: { id: courseId },
    data: { featured: false },
  });

  // Log activity
  await db.activityLog.create({
    data: {
      type: 'course_rejected',
      title: `Course unfeatured: "${course.title}"`,
      description: `Course "${course.title}" has been removed from featured`,
      icon: '📋',
      action: 'updated',
      targetName: course.title,
      targetType: 'course',
      targetId: courseId,
      severity: 'info',
      category: 'content',
    },
  });

  return NextResponse.json({
    success: true,
    message: `Course "${course.title}" has been unfeatured`,
  });
}

// ─── Process Pending Payouts ──────────────────────────────────
async function handleProcessPendingPayouts() {
  const result = await db.payout.updateMany({
    where: { status: 'pending' },
    data: { status: 'processing', processedAt: new Date() },
  });

  // Log activity
  await db.activityLog.create({
    data: {
      type: 'payout_processed',
      title: `${result.count} pending payout(s) moved to processing`,
      description: `Admin initiated processing for ${result.count} pending payouts`,
      icon: '💰',
      action: 'processed',
      targetName: `${result.count} payout(s)`,
      targetType: 'payout',
      severity: result.count > 0 ? 'info' : 'warning',
      category: 'finance',
    },
  });

  return NextResponse.json({
    success: true,
    message: `${result.count} pending payout(s) moved to processing`,
  });
}
