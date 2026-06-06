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
    instructorId: string;
    instructorName: string;
    status: 'success' | 'failed' | 'skipped';
    reason?: string;
  }>;
}

// ─── POST /api/admin/instructors/bulk ───────────────────────────────────────
// Bulk actions on instructors with comprehensive logging

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, instructorIds, data } = body;

    if (!action || !instructorIds || !Array.isArray(instructorIds) || instructorIds.length === 0) {
      return NextResponse.json(
        { error: 'Action and instructorIds array are required' },
        { status: 400 },
      );
    }

    // Limit bulk operations to 100 instructors at a time
    if (instructorIds.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 instructors per bulk operation' },
        { status: 400 },
      );
    }

    // Validate action
    const validActions = [
      'suspend', 'unsuspend', 'verify', 'flag', 'ban',
      'send_notification', 'export', 'delete',
    ];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate action-specific data
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

    // Verify all instructors exist and have instructor role
    const instructors = await db.user.findMany({
      where: { id: { in: instructorIds }, role: 'instructor' },
      select: { id: true, name: true, email: true, status: true },
    });

    // Map instructor IDs for quick lookup
    const instructorMap = new Map(instructors.map((i) => [i.id, i]));

    // Identify missing or non-instructor IDs
    const missingIds = instructorIds.filter((uid: string) => !instructorMap.has(uid));

    // ── Handle export action separately ───────────────────────────────────

    if (action === 'export') {
      const exportInstructors = await db.user.findMany({
        where: { id: { in: instructorIds }, role: 'instructor' },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          phone: true,
          createdAt: true,
          instructorProfile: {
            select: {
              headline: true,
              expertise: true,
              ntn: true,
              ntnVerified: true,
              applicationStatus: true,
            },
          },
          _count: {
            select: { coursesCreated: true },
          },
        },
      });

      await db.activityLog.create({
        data: {
          type: 'admin_action',
          title: `Bulk export of ${exportInstructors.length} instructors`,
          description: `Admin exported ${exportInstructors.length} instructor records`,
          icon: '📤',
          action: 'exported',
          targetType: 'user',
          severity: 'info',
          category: 'admin_action',
        },
      });

      return NextResponse.json({
        action: 'export',
        totalExported: exportInstructors.length,
        instructors: exportInstructors.map((i) => ({
          id: i.id,
          name: i.name,
          email: i.email,
          status: i.status,
          phone: i.phone,
          headline: i.instructorProfile?.headline || null,
          expertise: i.instructorProfile?.expertise || null,
          ntn: i.instructorProfile?.ntn || null,
          ntnVerified: i.instructorProfile?.ntnVerified || false,
          applicationStatus: i.instructorProfile?.applicationStatus || null,
          courseCount: i._count.coursesCreated,
          createdAt: i.createdAt.toISOString(),
        })),
      });
    }

    const result: BulkActionResult = {
      action,
      totalRequested: instructorIds.length,
      successCount: 0,
      failCount: 0,
      skippedCount: missingIds.length,
      details: [],
    };

    // Record skipped missing IDs
    for (const missingId of missingIds) {
      result.details.push({
        instructorId: missingId,
        instructorName: 'Unknown',
        status: 'skipped',
        reason: 'Instructor not found or not an instructor role',
      });
    }

    // ── Execute bulk action ───────────────────────────────────────────────

    switch (action) {
      case 'suspend': {
        for (const inst of instructors) {
          try {
            await db.user.update({
              where: { id: inst.id },
              data: {
                status: 'suspended',
                lockedUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              },
            });
            await db.activityLog.create({
              data: {
                userId: inst.id,
                type: 'user_suspended',
                title: `Bulk suspended instructor: ${inst.name}`,
                description: 'Bulk suspend action by admin',
                icon: '🚫',
                action: 'suspended',
                targetName: inst.name,
                targetType: 'user',
                targetId: inst.id,
                severity: 'warning',
                category: 'user_management',
              },
            });
            result.successCount++;
            result.details.push({ instructorId: inst.id, instructorName: inst.name, status: 'success' });
          } catch {
            result.failCount++;
            result.details.push({ instructorId: inst.id, instructorName: inst.name, status: 'failed', reason: 'Database error' });
          }
        }
        break;
      }

      case 'unsuspend': {
        for (const inst of instructors) {
          try {
            await db.user.update({
              where: { id: inst.id },
              data: { status: 'active', lockedUntil: null },
            });
            await db.activityLog.create({
              data: {
                userId: inst.id,
                type: 'user_unsuspended',
                title: `Bulk unsuspended instructor: ${inst.name}`,
                description: 'Bulk unsuspend action by admin',
                icon: '✅',
                action: 'unsuspended',
                targetName: inst.name,
                targetType: 'user',
                targetId: inst.id,
                severity: 'info',
                category: 'user_management',
              },
            });
            result.successCount++;
            result.details.push({ instructorId: inst.id, instructorName: inst.name, status: 'success' });
          } catch {
            result.failCount++;
            result.details.push({ instructorId: inst.id, instructorName: inst.name, status: 'failed', reason: 'Database error' });
          }
        }
        break;
      }

      case 'ban': {
        for (const inst of instructors) {
          try {
            await db.user.update({
              where: { id: inst.id },
              data: {
                status: 'banned',
                lockedUntil: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
              },
            });
            // Invalidate sessions
            await db.userSession.updateMany({
              where: { userId: inst.id, isActive: true },
              data: { isActive: false },
            });
            await db.activityLog.create({
              data: {
                userId: inst.id,
                type: 'user_banned',
                title: `Bulk banned instructor: ${inst.name}`,
                description: 'Bulk ban action by admin',
                icon: '🔴',
                action: 'banned',
                targetName: inst.name,
                targetType: 'user',
                targetId: inst.id,
                severity: 'critical',
                category: 'user_management',
              },
            });
            result.successCount++;
            result.details.push({ instructorId: inst.id, instructorName: inst.name, status: 'success' });
          } catch {
            result.failCount++;
            result.details.push({ instructorId: inst.id, instructorName: inst.name, status: 'failed', reason: 'Database error' });
          }
        }
        break;
      }

      case 'verify': {
        for (const inst of instructors) {
          try {
            await db.user.update({
              where: { id: inst.id },
              data: { isVerified: true },
            });
            // Also approve application status on profile
            const profile = await db.instructorProfile.findUnique({
              where: { instructorId: inst.id },
            });
            if (profile && profile.applicationStatus !== 'approved') {
              await db.instructorProfile.update({
                where: { instructorId: inst.id },
                data: { applicationStatus: 'approved', reviewedAt: new Date() },
              });
            }
            await db.activityLog.create({
              data: {
                userId: inst.id,
                type: 'user_verified',
                title: `Bulk verified instructor: ${inst.name}`,
                description: 'Bulk verify action by admin',
                icon: '✓',
                action: 'verified',
                targetName: inst.name,
                targetType: 'user',
                targetId: inst.id,
                severity: 'info',
                category: 'user_management',
              },
            });
            result.successCount++;
            result.details.push({ instructorId: inst.id, instructorName: inst.name, status: 'success' });
          } catch {
            result.failCount++;
            result.details.push({ instructorId: inst.id, instructorName: inst.name, status: 'failed', reason: 'Database error' });
          }
        }
        break;
      }

      case 'flag': {
        const flagReason = data?.reason || 'Bulk flagged by admin';
        for (const inst of instructors) {
          try {
            await db.user.update({
              where: { id: inst.id },
              data: { flaggedReason: flagReason },
            });
            await db.activityLog.create({
              data: {
                userId: inst.id,
                type: 'user_flagged',
                title: `Bulk flagged instructor: ${inst.name}`,
                description: `Reason: ${flagReason}`,
                icon: '⚠️',
                action: 'flagged',
                targetName: inst.name,
                targetType: 'user',
                targetId: inst.id,
                severity: 'warning',
                category: 'user_management',
              },
            });
            result.successCount++;
            result.details.push({ instructorId: inst.id, instructorName: inst.name, status: 'success' });
          } catch {
            result.failCount++;
            result.details.push({ instructorId: inst.id, instructorName: inst.name, status: 'failed', reason: 'Database error' });
          }
        }
        break;
      }

      case 'send_notification': {
        const notifTitle = data.title;
        const notifContent = data.content;
        const notifType = data?.type || 'system';
        const notifIcon = data?.icon || '📢';

        for (const inst of instructors) {
          try {
            await db.notification.create({
              data: {
                userId: inst.id,
                type: notifType,
                title: notifTitle,
                content: notifContent,
                icon: notifIcon,
              },
            });
            await db.activityLog.create({
              data: {
                userId: inst.id,
                type: 'notification_sent',
                title: `Bulk notification sent to instructor: ${inst.name}`,
                description: `Title: ${notifTitle}`,
                icon: '📢',
                action: 'sent',
                targetName: inst.name,
                targetType: 'user',
                targetId: inst.id,
                severity: 'info',
                category: 'admin_action',
              },
            });
            result.successCount++;
            result.details.push({ instructorId: inst.id, instructorName: inst.name, status: 'success' });
          } catch {
            result.failCount++;
            result.details.push({ instructorId: inst.id, instructorName: inst.name, status: 'failed', reason: 'Database error' });
          }
        }
        break;
      }

      case 'delete': {
        for (const inst of instructors) {
          try {
            // Soft delete: mark as banned
            await db.user.update({
              where: { id: inst.id },
              data: {
                status: 'banned',
                flaggedReason: 'Account soft-deleted by admin (bulk action)',
                lockedUntil: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
              },
            });
            // Invalidate all sessions
            await db.userSession.updateMany({
              where: { userId: inst.id, isActive: true },
              data: { isActive: false },
            });
            // Mark settings as deactivated
            await db.instructorSettings.updateMany({
              where: { instructorId: inst.id },
              data: { deactivatedAt: new Date(), deletionRequestedAt: new Date() },
            });
            await db.activityLog.create({
              data: {
                userId: inst.id,
                type: 'user_deleted',
                title: `Bulk deleted instructor: ${inst.name}`,
                description: `Instructor soft-deleted (bulk action). Email: ${inst.email}`,
                icon: '🗑️',
                action: 'deleted',
                targetName: inst.name,
                targetType: 'user',
                targetId: inst.id,
                severity: 'critical',
                category: 'user_management',
              },
            });
            result.successCount++;
            result.details.push({ instructorId: inst.id, instructorName: inst.name, status: 'success' });
          } catch {
            result.failCount++;
            result.details.push({ instructorId: inst.id, instructorName: inst.name, status: 'failed', reason: 'Database error' });
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
    console.error('Admin instructor bulk action API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 },
    );
  }
}
