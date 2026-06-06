import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Default moderation settings
const DEFAULT_SETTINGS = {
  autoRemoveProfanity: true,
  autoFlagExternalLinks: true,
  aiContentScreening: true,
  requireEmailVerification: true,
  minimumAccountAgeDays: 1,
  blocklistWordCount: 0,
  blocklistWords: '[]',
};

// Format settings for response — parse blocklistWords JSON
function formatSettings(settings: any) {
  let parsedWords: string[] = [];
  try {
    parsedWords = settings.blocklistWords ? JSON.parse(settings.blocklistWords) : [];
  } catch {
    parsedWords = [];
  }

  return {
    id: settings.id,
    autoRemoveProfanity: settings.autoRemoveProfanity,
    autoFlagExternalLinks: settings.autoFlagExternalLinks,
    aiContentScreening: settings.aiContentScreening,
    requireEmailVerification: settings.requireEmailVerification,
    minimumAccountAgeDays: settings.minimumAccountAgeDays,
    blocklistWordCount: settings.blocklistWordCount,
    blocklistWords: parsedWords,
    updatedAt: settings.updatedAt?.toISOString(),
  };
}

// GET /api/admin/content-review/settings — Get moderation settings
export async function GET() {
  try {
    let settings = await db.contentModerationSettings.findFirst();

    if (!settings) {
      settings = await db.contentModerationSettings.create({
        data: DEFAULT_SETTINGS,
      });
    }

    return NextResponse.json({
      settings: formatSettings(settings),
    });
  } catch (error) {
    console.error('Admin content review settings GET API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/content-review/settings — Update moderation settings
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    let settings = await db.contentModerationSettings.findFirst();

    if (!settings) {
      settings = await db.contentModerationSettings.create({
        data: DEFAULT_SETTINGS,
      });
    }

    const updateData: any = {};

    if (body.autoRemoveProfanity !== undefined) {
      updateData.autoRemoveProfanity = Boolean(body.autoRemoveProfanity);
    }
    if (body.autoFlagExternalLinks !== undefined) {
      updateData.autoFlagExternalLinks = Boolean(body.autoFlagExternalLinks);
    }
    if (body.aiContentScreening !== undefined) {
      updateData.aiContentScreening = Boolean(body.aiContentScreening);
    }
    if (body.requireEmailVerification !== undefined) {
      updateData.requireEmailVerification = Boolean(body.requireEmailVerification);
    }
    if (body.minimumAccountAgeDays !== undefined) {
      const days = parseInt(body.minimumAccountAgeDays);
      if (isNaN(days) || days < 0) {
        return NextResponse.json(
          { error: 'minimumAccountAgeDays must be a non-negative integer' },
          { status: 400 }
        );
      }
      updateData.minimumAccountAgeDays = days;
    }
    if (body.blocklistWords !== undefined) {
      if (!Array.isArray(body.blocklistWords)) {
        return NextResponse.json(
          { error: 'blocklistWords must be an array of strings' },
          { status: 400 }
        );
      }

      const validWords = body.blocklistWords.filter(
        (w: any) => typeof w === 'string' && w.trim().length > 0
      );

      updateData.blocklistWords = JSON.stringify(validWords);
      updateData.blocklistWordCount = validWords.length;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      );
    }

    const updated = await db.contentModerationSettings.update({
      where: { id: settings.id },
      data: updateData,
    });

    await db.activityLog.create({
      data: {
        type: 'security_alert',
        title: 'Content moderation settings updated',
        description: `Settings updated: ${Object.keys(updateData).join(', ')}`,
        icon: '⚙️',
        metadata: JSON.stringify({
          action: 'update_moderation_settings',
          updatedFields: Object.keys(updateData),
        }),
      },
    });

    return NextResponse.json({
      settings: formatSettings(updated),
    });
  } catch (error) {
    console.error('Admin content review settings PATCH API error:', error);
    return NextResponse.json(
      { error: 'Failed to update moderation settings' },
      { status: 500 }
    );
  }
}
