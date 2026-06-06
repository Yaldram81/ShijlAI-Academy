import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BulkActionResult {
  action: string;
  totalRequested: number;
  successCount: number;
  failCount: number;
  skippedCount: number;
  details: Array<{
    userId: string;
    userName: string;
    status: 'success' | 'failed' | 'skipped';
    reason?: string;
  }>;
}

// ─── POST /api/admin/users/bulk ─────────────────────────────────────────────
// Bulk actions on users with comprehensive logging and admin protection

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, userIds, data } = body;

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Action and userIds array are required' },
        { status: 400 },
      );
    }

    // Limit bulk operations to 100 users at a time
    if (userIds.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 users per bulk operation' },
        { status: 400 },
      );
    }

    // Validate action
    const validActions = [
      'suspend', 'unsuspend', 'ban', 'delete', 'verify', 'flag',
      'change_role', 'send_notification', 'send_email',
    ];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate action-specific data
    if (action === 'change_role' && !data?.role) {
      return NextResponse.json(
        { error: 'Role is required for change_role action' },
        { status: 400 },
      );
    }

    if (action === 'flag' && !data?.reason) {
      return NextResponse.json(
        { error: 'Reason is required for flag action' },
        { status: 400 },
      );
    }

    if (action === 'send_notification' && (!data?.title || !data?.content)) {
      return NextResponse.json(
        { error: 'Title and content are required for send_notification action' },
        { status: 400 },
      );
    }

    // Verify all users exist
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, role: true, status: true },
    });

    // Map user IDs for quick lookup
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Identify missing users
    const missingIds = userIds.filter((uid: string) => !userMap.has(uid));
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: `Users not found: ${missingIds.join(', ')}` },
        { status: 404 },
      );
    }

    // ── Never allow admin users to be targeted ────────────────────────────

    const adminUserIds = users
      .filter((u) => u.role === 'admin')
      .map((u) => u.id);

    // Admins are always skipped (not an error, just skipped)
    const nonAdminUsers = users.filter((u) => u.role !== 'admin');
    const nonAdminIds = nonAdminUsers.map((u) => u.id);

    const result: BulkActionResult = {
      action,
      totalRequested: userIds.length,
      successCount: 0,
      failCount: 0,
      skippedCount: adminUserIds.length, // admins are always skipped
      details: [],
    };

    // Record skipped admins
    for (const adminId of adminUserIds) {
      const adminUser = userMap.get(adminId)!;
      result.details.push({
        userId: adminId,
        userName: adminUser.name,
        status: 'skipped',
        reason: 'Cannot perform this action on admin users',
      });
    }

    // ── Execute bulk action ───────────────────────────────────────────────

    switch (action) {
      case 'suspend': {
        for (const u of nonAdminUsers) {
          try {
            await db.user.update({
              where: { id: u.id },
              data: {
                status: 'suspended',
                lockedUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              },
            });
            await db.activityLog.create({
              data: {
                userId: u.id,
                type: 'user_suspended',
                title: `Bulk suspended: ${u.name}`,
                description: `Bulk suspend action by admin`,
                icon: '🚫',
                action: 'suspended',
                targetName: u.name,
                targetType: 'user',
                targetId: u.id,
                severity: 'warning',
                category: 'user_management',
              },
            });
            result.successCount++;
            result.details.push({ userId: u.id, userName: u.name, status: 'success' });
          } catch {
            result.failCount++;
            result.details.push({ userId: u.id, userName: u.name, status: 'failed', reason: 'Database error' });
          }
        }
        break;
      }

      case 'unsuspend': {
        for (const u of nonAdminUsers) {
          try {
            await db.user.update({
              where: { id: u.id },
              data: { status: 'active', lockedUntil: null },
            });
            await db.activityLog.create({
              data: {
                userId: u.id,
                type: 'user_unsuspended',
                title: `Bulk unsuspended: ${u.name}`,
                description: 'Bulk unsuspend action by admin',
                icon: '✅',
                action: 'unsuspended',
                targetName: u.name,
                targetType: 'user',
                targetId: u.id,
                severity: 'info',
                category: 'user_management',
              },
            });
            result.successCount++;
            result.details.push({ userId: u.id, userName: u.name, status: 'success' });
          } catch {
            result.failCount++;
            result.details.push({ userId: u.id, userName: u.name, status: 'failed', reason: 'Database error' });
          }
        }
        break;
      }

      case 'ban': {
        for (const u of nonAdminUsers) {
          try {
            await db.user.update({
              where: { id: u.id },
              data: {
                status: 'banned',
                lockedUntil: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
              },
            });
            await db.activityLog.create({
              data: {
                userId: u.id,
                type: 'user_banned',
                title: `Bulk banned: ${u.name}`,
                description: 'Bulk ban action by admin',
                icon: '🔴',
                action: 'banned',
                targetName: u.name,
                targetType: 'user',
                targetId: u.id,
                severity: 'critical',
                category: 'user_management',
              },
            });
            result.successCount++;
            result.details.push({ userId: u.id, userName: u.name, status: 'success' });
          } catch {
            result.failCount++;
            result.details.push({ userId: u.id, userName: u.name, status: 'failed', reason: 'Database error' });
          }
        }
        break;
      }

      case 'delete': {
        for (const u of nonAdminUsers) {
          try {
            await db.user.delete({ where: { id: u.id } });
            await db.activityLog.create({
              data: {
                type: 'user_deleted',
                title: `Bulk deleted: ${u.name}`,
                description: `Bulk delete action by admin. User email: ${u.email}`,
                icon: '🗑️',
                action: 'deleted',
                targetName: u.name,
                targetType: 'user',
                targetId: u.id,
                severity: 'critical',
                category: 'user_management',
              },
            });
            result.successCount++;
            result.details.push({ userId: u.id, userName: u.name, status: 'success' });
          } catch {
            result.failCount++;
            result.details.push({ userId: u.id, userName: u.name, status: 'failed', reason: 'Database error' });
          }
        }
        break;
      }

      case 'verify': {
        for (const u of nonAdminUsers) {
          try {
            await db.user.update({
              where: { id: u.id },
              data: { isVerified: true },
            });
            await db.activityLog.create({
              data: {
                userId: u.id,
                type: 'user_verified',
                title: `Bulk verified: ${u.name}`,
                description: 'Bulk verify action by admin',
                icon: '✓',
                action: 'verified',
                targetName: u.name,
                targetType: 'user',
                targetId: u.id,
                severity: 'info',
                category: 'user_management',
              },
            });
            result.successCount++;
            result.details.push({ userId: u.id, userName: u.name, status: 'success' });
          } catch {
            result.failCount++;
            result.details.push({ userId: u.id, userName: u.name, status: 'failed', reason: 'Database error' });
          }
        }
        break;
      }

      case 'flag': {
        const flagReason = data?.reason || 'Bulk flagged by admin';
        for (const u of nonAdminUsers) {
          try {
            await db.user.update({
              where: { id: u.id },
              data: { flaggedReason: flagReason },
            });
            await db.activityLog.create({
              data: {
                userId: u.id,
                type: 'user_flagged',
                title: `Bulk flagged: ${u.name}`,
                description: `Reason: ${flagReason}`,
                icon: '⚠️',
                action: 'flagged',
                targetName: u.name,
                targetType: 'user',
                targetId: u.id,
                severity: 'warning',
                category: 'user_management',
              },
            });
            result.successCount++;
            result.details.push({ userId: u.id, userName: u.name, status: 'success' });
          } catch {
            result.failCount++;
            result.details.push({ userId: u.id, userName: u.name, status: 'failed', reason: 'Database error' });
          }
        }
        break;
      }

      case 'change_role': {
        const newRole = data.role;
        const validRoles = ['student', 'instructor', 'admin', 'parent'];
        if (!validRoles.includes(newRole)) {
          return NextResponse.json(
            { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
            { status: 400 },
          );
        }
        for (const u of nonAdminUsers) {
          try {
            const updatePayload: Record<string, unknown> = { role: newRole };
            if (newRole === 'instructor') {
              updatePayload.isVerified = true;
            }
            await db.user.update({
              where: { id: u.id },
              data: updatePayload,
            });
            // Create instructor profile if changing to instructor
            if (newRole === 'instructor') {
              const existingProfile = await db.instructorProfile.findUnique({
                where: { instructorId: u.id },
              });
              if (!existingProfile) {
                await db.instructorProfile.create({
                  data: { instructorId: u.id, applicationStatus: 'approved' },
                });
              } else {
                await db.instructorProfile.update({
                  where: { instructorId: u.id },
                  data: { applicationStatus: 'approved' },
                });
              }
            }
            await db.activityLog.create({
              data: {
                userId: u.id,
                type: 'user_role_changed',
                title: `Bulk role change: ${u.name}`,
                description: `Role changed from ${u.role} to ${newRole}`,
                icon: '🔄',
                action: 'changed',
                targetName: u.name,
                targetType: 'user',
                targetId: u.id,
                severity: 'warning',
                category: 'user_management',
              },
            });
            result.successCount++;
            result.details.push({ userId: u.id, userName: u.name, status: 'success' });
          } catch {
            result.failCount++;
            result.details.push({ userId: u.id, userName: u.name, status: 'failed', reason: 'Database error' });
          }
        }
        break;
      }

      case 'send_notification': {
        const notifTitle = data.title;
        const notifContent = data.content;
        const notifType = data?.type || 'system';
        const notifIcon = data?.icon || '📢';

        for (const u of nonAdminUsers) {
          try {
            await db.notification.create({
              data: {
                userId: u.id,
                type: notifType,
                title: notifTitle,
                content: notifContent,
                icon: notifIcon,
              },
            });
            await db.activityLog.create({
              data: {
                userId: u.id,
                type: 'notification_sent',
                title: `Bulk notification sent to: ${u.name}`,
                description: `Title: ${notifTitle}`,
                icon: '📢',
                action: 'sent',
                targetName: u.name,
                targetType: 'user',
                targetId: u.id,
                severity: 'info',
                category: 'admin_action',
              },
            });
            result.successCount++;
            result.details.push({ userId: u.id, userName: u.name, status: 'success' });
          } catch {
            result.failCount++;
            result.details.push({ userId: u.id, userName: u.name, status: 'failed', reason: 'Database error' });
          }
        }
        break;
      }

      case 'send_email': {
        // Simulated email: create notifications instead
        const emailSubject = data?.subject || 'Message from Admin';
        const emailMessage = data?.message || 'You have a message from the platform admin.';

        for (const u of nonAdminUsers) {
          try {
            await db.notification.create({
              data: {
                userId: u.id,
                type: 'system',
                title: emailSubject,
                content: emailMessage,
                icon: '📧',
              },
            });
            await db.activityLog.create({
              data: {
                userId: u.id,
                type: 'bulk_email',
                title: `Bulk email sent to: ${u.name}`,
                description: `Subject: ${emailSubject}`,
                icon: '📧',
                action: 'sent',
                targetName: u.name,
                targetType: 'user',
                targetId: u.id,
                severity: 'info',
                category: 'admin_action',
              },
            });
            result.successCount++;
            result.details.push({ userId: u.id, userName: u.name, status: 'success' });
          } catch {
            result.failCount++;
            result.details.push({ userId: u.id, userName: u.name, status: 'failed', reason: 'Database error' });
          }
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 },
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin bulk action API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 },
    );
  }
}
