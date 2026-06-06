import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function safeJsonParse(str: string | null | undefined, fallback: unknown = null) {
  try { return str ? JSON.parse(str) : fallback } catch { return fallback }
}

// POST /api/admin/notifications/send — Send a notification
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      type,
      targetAudience,
      targetDetails,
      title,
      message,
      link,
      priority,
      schedule,
      templateId,
    } = body;

    // Validate required fields
    if (!type || !targetAudience || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, targetAudience, title, message' },
        { status: 400 }
      );
    }

    // Determine if sending now or scheduled
    const isNow = schedule === 'now' || !schedule;
    const now = new Date();

    // Count target users based on targetAudience
    let targetUserIds: string[] = [];

    switch (targetAudience) {
      case 'all_users': {
        if (isNow) {
          const users = await prisma.user.findMany({
            select: { id: true },
            take: 50,
          });
          targetUserIds = users.map(u => u.id);
        }
        break;
      }
      case 'all_students': {
        if (isNow) {
          const users = await prisma.user.findMany({
            where: { role: 'student' },
            select: { id: true },
            take: 50,
          });
          targetUserIds = users.map(u => u.id);
        }
        break;
      }
      case 'all_instructors': {
        if (isNow) {
          const users = await prisma.user.findMany({
            where: { role: 'instructor' },
            select: { id: true },
            take: 50,
          });
          targetUserIds = users.map(u => u.id);
        }
        break;
      }
      case 'specific_user': {
        const userId = targetDetails?.userId;
        if (!userId) {
          return NextResponse.json(
            { error: 'targetDetails.userId is required for specific_user audience' },
            { status: 400 }
          );
        }
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          return NextResponse.json(
            { error: 'Specified user not found' },
            { status: 404 }
          );
        }
        targetUserIds = [userId];
        break;
      }
      case 'segment': {
        if (isNow) {
          const segmentName = targetDetails?.segmentName || 'unknown';
          let segmentWhere: any = {};
          if (segmentName === 'inactive_30d') {
            segmentWhere = { lastActiveAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
          } else if (segmentName === 'inactive_7d') {
            segmentWhere = { lastActiveAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
          } else if (segmentName === 'new_users_7d') {
            segmentWhere = { createdAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
          } else if (segmentName === 'top_spenders') {
            segmentWhere = { enrollments: { some: { course: { price: { gt: 0 } } } } };
          } else if (segmentName === 'free_users') {
            segmentWhere = { enrollments: { some: { course: { price: 0 } } } };
          } else if (segmentName === 'paid_users') {
            segmentWhere = { enrollments: { some: { course: { price: { gt: 0 } } } } };
          }
          const users = await prisma.user.findMany({
            where: segmentWhere,
            select: { id: true },
            take: 50,
          });
          targetUserIds = users.map(u => u.id);
        }
        break;
      }
      case 'course_enrollees': {
        const courseId = targetDetails?.courseId;
        if (!courseId) {
          return NextResponse.json(
            { error: 'targetDetails.courseId is required for course_enrollees audience' },
            { status: 400 }
          );
        }
        if (isNow) {
          const enrollments = await prisma.enrollment.findMany({
            where: { courseId },
            select: { userId: true },
            take: 50,
          });
          targetUserIds = enrollments.map(e => e.userId);
        }
        break;
      }
      default:
        return NextResponse.json(
          { error: `Invalid targetAudience: ${targetAudience}` },
          { status: 400 }
        );
    }

    // sentCount reflects actual notifications created, not total eligible users
    const sentCount = targetUserIds.length;

    // If template was specified, load it for reference
    if (templateId) {
      const template = await prisma.notificationTemplate.findUnique({
        where: { id: templateId },
      });
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }
    }

    // Build NotificationLog data
    const logData: any = {
      title,
      message,
      type,
      targetAudience,
      targetDetails: targetDetails ? JSON.stringify(targetDetails) : null,
      priority: priority || 'normal',
      link: link || null,
      sentCount,
      templateId: templateId || null,
      status: isNow ? 'sent' : 'scheduled',
      sentAt: isNow ? now : null,
      scheduledAt: isNow ? null : (
        schedule && typeof schedule === 'object'
          ? new Date(`${schedule.date}T${schedule.time || '00:00'}`)
          : new Date()
      ),
    };

    // Create the NotificationLog
    const notificationLog = await prisma.notificationLog.create({
      data: logData,
    });

    // For immediate send, create individual Notification records (capped at 50 for demo)
    if (isNow && targetUserIds.length > 0) {
      const notificationType = type === 'all' ? 'system' : type === 'in_app' ? 'system' : 'promotion';

      await prisma.notification.createMany({
        data: targetUserIds.map(userId => ({
          userId,
          type: notificationType,
          title,
          content: message,
          icon: '📢',
          link: link || null,
          metadata: JSON.stringify({
            logId: notificationLog.id,
            priority: priority || 'normal',
            targetAudience,
          }),
        })),
      });
    }

    return NextResponse.json({
      data: {
        id: notificationLog.id,
        title: notificationLog.title,
        message: notificationLog.message,
        type: notificationLog.type,
        targetAudience: notificationLog.targetAudience,
        priority: notificationLog.priority,
        status: notificationLog.status,
        sentCount: notificationLog.sentCount,
        sentAt: notificationLog.sentAt?.toISOString() || null,
        scheduledAt: notificationLog.scheduledAt?.toISOString() || null,
        templateId: notificationLog.templateId,
        createdAt: notificationLog.createdAt.toISOString(),
      },
      sentCount: notificationLog.sentCount,
    }, { status: 201 });
  } catch (error) {
    console.error('Admin notification send API error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
