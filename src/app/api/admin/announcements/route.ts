import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/announcements — Return all announcements ordered by createdAt desc
export async function GET() {
  try {
    const announcements = await db.platformAnnouncement.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const serialized = announcements.map((a) => ({
      ...a,
      startsAt: a.startsAt.toISOString(),
      expiresAt: a.expiresAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));

    return NextResponse.json({ announcements: serialized });
  } catch (error) {
    console.error('Announcements fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

// POST /api/admin/announcements — Create a new announcement and send notifications
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, type, target, expiresAt } = body as {
      title: string;
      message: string;
      type?: string;
      target?: string;
      expiresAt?: string;
    };

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    const announcementType = type || 'info';
    const announcementTarget = target || 'all';

    const announcement = await db.platformAnnouncement.create({
      data: {
        title,
        message,
        type: announcementType,
        target: announcementTarget,
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: 'admin',
      },
    });

    // Find users matching the target and send notifications
    const whereClause =
      announcementTarget === 'all'
        ? {}
        : announcementTarget === 'students'
          ? { role: 'student' }
          : announcementTarget === 'instructors'
            ? { role: 'instructor' }
            : announcementTarget === 'admins'
              ? { role: 'admin' }
              : {};

    const targetUsers = await db.user.findMany({
      where: whereClause,
      select: { id: true },
    });

    if (targetUsers.length > 0) {
      await db.notification.createMany({
        data: targetUsers.map((u) => ({
          userId: u.id,
          type: 'system',
          title,
          content: message,
          icon:
            announcementType === 'critical'
              ? '🚨'
              : announcementType === 'warning'
                ? '⚠️'
                : announcementType === 'success'
                  ? '✅'
                  : '📢',
          link: '/announcements',
        })),
      });
    }

    // Log activity
    await db.activityLog.create({
      data: {
        type: 'notification_sent',
        title: `Announcement created: "${title}"`,
        description: `New announcement sent to ${announcementTarget} (${targetUsers.length} users). Type: ${announcementType}`,
        icon: '📢',
        action: 'created',
        targetName: title,
        targetType: 'notification',
        targetId: announcement.id,
        severity: announcementType === 'critical' ? 'critical' : 'info',
        category: 'admin_action',
        metadata: JSON.stringify({
          announcementId: announcement.id,
          target: announcementTarget,
          userCount: targetUsers.length,
        }),
      },
    });

    return NextResponse.json({
      announcement: {
        ...announcement,
        startsAt: announcement.startsAt.toISOString(),
        expiresAt: announcement.expiresAt?.toISOString() ?? null,
        createdAt: announcement.createdAt.toISOString(),
        updatedAt: announcement.updatedAt.toISOString(),
      },
      notifiedUsers: targetUsers.length,
    });
  } catch (error) {
    console.error('Announcement creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/announcements — Deactivate an announcement
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.platformAnnouncement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    const updated = await db.platformAnnouncement.update({
      where: { id },
      data: { isActive: false },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        type: 'notification_sent',
        title: `Announcement deactivated: "${existing.title}"`,
        description: `Announcement "${existing.title}" has been deactivated`,
        icon: '🔇',
        action: 'updated',
        targetName: existing.title,
        targetType: 'notification',
        targetId: id,
        severity: 'info',
        category: 'admin_action',
      },
    });

    return NextResponse.json({
      announcement: {
        ...updated,
        startsAt: updated.startsAt.toISOString(),
        expiresAt: updated.expiresAt?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Announcement deactivation error:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate announcement' },
      { status: 500 }
    );
  }
}
