import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function safeJsonParse(str: string | null | undefined, fallback: unknown = null) {
  try { return str ? JSON.parse(str) : fallback } catch { return fallback }
}

// GET /api/admin/notifications/history — List notification history with pagination and filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const type = searchParams.get('type') || '';
    const targetAudience = searchParams.get('targetAudience') || '';
    const priority = searchParams.get('priority') || '';
    const status = searchParams.get('status') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (targetAudience) {
      where.targetAudience = targetAudience;
    }

    if (priority) {
      where.priority = priority;
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { message: { contains: search } },
      ];
    }

    // Get paginated results and total count
    const [logs, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notificationLog.count({ where }),
    ]);

    // Get aggregate stats
    const totalLogs = await prisma.notificationLog.count();

    const sentAggregate = await prisma.notificationLog.aggregate({
      _sum: { sentCount: true },
      where: { status: 'sent' },
    });

    const openedAggregate = await prisma.notificationLog.aggregate({
      _sum: { openedCount: true, sentCount: true },
      where: { status: 'sent', sentCount: { gt: 0 } },
    });

    const clickAggregate = await prisma.notificationLog.aggregate({
      _sum: { clickCount: true, sentCount: true },
      where: { status: 'sent', sentCount: { gt: 0 } },
    });

    const totalSent = sentAggregate._sum.sentCount || 0;
    const totalOpened = openedAggregate._sum.openedCount || 0;
    const totalSentForOpenRate = openedAggregate._sum.sentCount || 0;
    const totalClicks = clickAggregate._sum.clickCount || 0;
    const totalSentForCtr = clickAggregate._sum.sentCount || 0;

    // Calculate average rates
    const avgOpenRate = totalSentForOpenRate > 0
      ? Math.round((totalOpened / totalSentForOpenRate) * 10000) / 100 // percentage with 2 decimal places
      : 0;

    const avgCtr = totalSentForCtr > 0
      ? Math.round((totalClicks / totalSentForCtr) * 10000) / 100
      : 0;

    const formattedLogs = logs.map(log => ({
      id: log.id,
      title: log.title,
      message: log.message,
      type: log.type,
      targetAudience: log.targetAudience,
      targetDetails: safeJsonParse(log.targetDetails, null),
      priority: log.priority,
      link: log.link,
      sentCount: log.sentCount,
      openedCount: log.openedCount,
      clickCount: log.clickCount,
      openRate: log.sentCount > 0
        ? Math.round((log.openedCount / log.sentCount) * 10000) / 100
        : 0,
      ctr: log.sentCount > 0
        ? Math.round((log.clickCount / log.sentCount) * 10000) / 100
        : 0,
      status: log.status,
      scheduledAt: log.scheduledAt?.toISOString() || null,
      sentAt: log.sentAt?.toISOString() || null,
      templateId: log.templateId,
      createdBy: log.createdBy,
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({
      data: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalSent,
        avgOpenRate,
        avgCtr,
        totalLogs,
      },
    });
  } catch (error) {
    console.error('Admin notification history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification history' },
      { status: 500 }
    );
  }
}
