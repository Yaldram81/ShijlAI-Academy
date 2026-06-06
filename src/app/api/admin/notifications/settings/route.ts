import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/notifications/settings — Get notification settings (singleton)
export async function GET() {
  try {
    let settings = await prisma.notificationSettings.findFirst();

    // If no settings exist, create with defaults
    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: {},
      });
    }

    return NextResponse.json({
      data: {
        id: settings.id,
        enableInApp: settings.enableInApp,
        enableEmail: settings.enableEmail,
        enablePush: settings.enablePush,
        enableSms: settings.enableSms,
        maxNotificationsPerDay: settings.maxNotificationsPerDay,
        maxBulkNotificationsPerDay: settings.maxBulkNotificationsPerDay,
        quietHoursStart: settings.quietHoursStart,
        quietHoursEnd: settings.quietHoursEnd,
        availableSegments: settings.availableSegments.split(',').map(s => s.trim()),
        senderName: settings.senderName,
        senderEmail: settings.senderEmail,
        updatedAt: settings.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Admin notification settings get API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/notifications/settings — Update notification settings
export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    let settings = await prisma.notificationSettings.findFirst();

    // If no settings exist, create with defaults first
    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: {},
      });
    }

    // Build update data from partial fields
    const updateData: any = {};

    if (body.enableInApp !== undefined) updateData.enableInApp = body.enableInApp;
    if (body.enableEmail !== undefined) updateData.enableEmail = body.enableEmail;
    if (body.enablePush !== undefined) updateData.enablePush = body.enablePush;
    if (body.enableSms !== undefined) updateData.enableSms = body.enableSms;
    if (body.maxNotificationsPerDay !== undefined) updateData.maxNotificationsPerDay = body.maxNotificationsPerDay;
    if (body.maxBulkNotificationsPerDay !== undefined) updateData.maxBulkNotificationsPerDay = body.maxBulkNotificationsPerDay;
    if (body.quietHoursStart !== undefined) updateData.quietHoursStart = body.quietHoursStart;
    if (body.quietHoursEnd !== undefined) updateData.quietHoursEnd = body.quietHoursEnd;
    if (body.availableSegments !== undefined) {
      updateData.availableSegments = Array.isArray(body.availableSegments)
        ? body.availableSegments.join(',')
        : body.availableSegments;
    }
    if (body.senderName !== undefined) updateData.senderName = body.senderName;
    if (body.senderEmail !== undefined) updateData.senderEmail = body.senderEmail;

    const updated = await prisma.notificationSettings.update({
      where: { id: settings.id },
      data: updateData,
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        enableInApp: updated.enableInApp,
        enableEmail: updated.enableEmail,
        enablePush: updated.enablePush,
        enableSms: updated.enableSms,
        maxNotificationsPerDay: updated.maxNotificationsPerDay,
        maxBulkNotificationsPerDay: updated.maxBulkNotificationsPerDay,
        quietHoursStart: updated.quietHoursStart,
        quietHoursEnd: updated.quietHoursEnd,
        availableSegments: updated.availableSegments.split(',').map(s => s.trim()),
        senderName: updated.senderName,
        senderEmail: updated.senderEmail,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Admin notification settings update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}
