import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Default feature flags to seed
const DEFAULT_FEATURE_FLAGS = [
  {
    name: 'ai_tutor',
    displayName: 'Ask ShijlAI',
    description: 'Enable AI-powered tutoring for students',
    enabled: true,
    rollout: 100,
    category: 'ai',
  },
  {
    name: 'community_forum',
    displayName: 'Community Forum',
    description: 'Enable community discussion forums',
    enabled: true,
    rollout: 100,
    category: 'community',
  },
  {
    name: 'streak_system',
    displayName: 'Streak System',
    description: 'Enable daily learning streaks and rewards',
    enabled: true,
    rollout: 100,
    category: 'gamification',
  },
  {
    name: 'certificate_verification',
    displayName: 'Certificate Verification',
    description: 'Enable blockchain-verified certificates',
    enabled: false,
    rollout: 0,
    category: 'general',
  },
  {
    name: 'peer_review',
    displayName: 'Peer Review',
    description: 'Enable peer review for assignments',
    enabled: true,
    rollout: 50,
    category: 'community',
  },
  {
    name: 'live_sessions',
    displayName: 'Live Sessions',
    description: 'Enable live class sessions',
    enabled: true,
    rollout: 100,
    category: 'general',
  },
  {
    name: 'advanced_analytics',
    displayName: 'Advanced Analytics',
    description: 'Enable advanced platform analytics',
    enabled: true,
    rollout: 100,
    category: 'general',
  },
  {
    name: 'auto_grading',
    displayName: 'Auto Grading',
    description: 'Enable AI-powered auto grading',
    enabled: false,
    rollout: 0,
    category: 'ai',
  },
];

// GET /api/admin/feature-flags — Return all feature flags, auto-seed defaults if empty
export async function GET() {
  try {
    let flags = await db.featureFlag.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // Auto-seed default flags if table is empty
    if (flags.length === 0) {
      await db.featureFlag.createMany({ data: DEFAULT_FEATURE_FLAGS });
      flags = await db.featureFlag.findMany({
        orderBy: { createdAt: 'asc' },
      });
    }

    const serialized = flags.map((f) => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }));

    return NextResponse.json({ flags: serialized });
  } catch (error) {
    console.error('Feature flags fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature flags' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/feature-flags — Update a feature flag
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, enabled, rollout } = body as {
      id: string;
      enabled?: boolean;
      rollout?: number;
    };

    if (!id) {
      return NextResponse.json(
        { error: 'Feature flag ID is required' },
        { status: 400 }
      );
    }

    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {};
    if (typeof enabled === 'boolean') updateData.enabled = enabled;
    if (typeof rollout === 'number') {
      if (rollout < 0 || rollout > 100) {
        return NextResponse.json(
          { error: 'Rollout must be between 0 and 100' },
          { status: 400 }
        );
      }
      updateData.rollout = rollout;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'At least one of enabled or rollout must be provided' },
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
      data: updateData,
    });

    // Log activity
    const changes: string[] = [];
    if (typeof enabled === 'boolean') changes.push(`enabled=${enabled}`);
    if (typeof rollout === 'number') changes.push(`rollout=${rollout}%`);

    await db.activityLog.create({
      data: {
        type: 'settings_updated',
        title: `Feature flag "${existing.displayName}" updated`,
        description: `Updated ${changes.join(', ')} for "${existing.displayName}"`,
        icon: '🚩',
        action: 'updated',
        targetName: existing.displayName,
        targetType: 'settings',
        targetId: id,
        severity: 'info',
        category: 'admin_action',
        metadata: JSON.stringify({ flagName: existing.name, ...updateData }),
      },
    });

    return NextResponse.json({
      flag: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Feature flag update error:', error);
    return NextResponse.json(
      { error: 'Failed to update feature flag' },
      { status: 500 }
    );
  }
}
