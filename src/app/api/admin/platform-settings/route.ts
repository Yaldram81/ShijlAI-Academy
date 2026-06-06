import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Default platform settings to seed
const DEFAULT_PLATFORM_SETTINGS = [
  {
    key: 'maintenance_mode',
    value: 'false',
    label: 'Maintenance Mode',
    type: 'boolean',
    category: 'general',
  },
  {
    key: 'registration_open',
    value: 'true',
    label: 'Registration Open',
    type: 'boolean',
    category: 'general',
  },
  {
    key: 'max_file_upload_mb',
    value: '50',
    label: 'Max File Upload (MB)',
    type: 'number',
    category: 'general',
  },
  {
    key: 'platform_commission_pct',
    value: '20',
    label: 'Platform Commission %',
    type: 'number',
    category: 'finance',
  },
  {
    key: 'min_payout_amount',
    value: '2000',
    label: 'Min Payout Amount (USD)',
    type: 'number',
    category: 'finance',
  },
  {
    key: 'auto_approve_courses',
    value: 'false',
    label: 'Auto-Approve Courses',
    type: 'boolean',
    category: 'general',
  },
  {
    key: 'email_verification_required',
    value: 'true',
    label: 'Email Verification Required',
    type: 'boolean',
    category: 'security',
  },
  {
    key: 'max_login_attempts',
    value: '5',
    label: 'Max Login Attempts',
    type: 'number',
    category: 'security',
  },
];

// GET /api/admin/platform-settings — Return all platform settings, auto-seed defaults if empty
export async function GET() {
  try {
    let settings = await db.platformSetting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    // Auto-seed default settings if table is empty
    if (settings.length === 0) {
      await db.platformSetting.createMany({ data: DEFAULT_PLATFORM_SETTINGS });
      settings = await db.platformSetting.findMany({
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
      });
    }

    const serialized = settings.map((s) => ({
      ...s,
      updatedAt: s.updatedAt.toISOString(),
    }));

    return NextResponse.json({ settings: serialized });
  } catch (error) {
    console.error('Platform settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/platform-settings — Update a platform setting (upsert)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = body as { key: string; value: string };

    if (!key || value === undefined || value === null) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    const updated = await db.platformSetting.upsert({
      where: { key },
      update: { value },
      create: {
        key,
        value,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        type: inferType(value),
        category: 'general',
      },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        type: 'settings_updated',
        title: `Platform setting "${updated.label}" updated`,
        description: `Setting "${updated.label}" changed to "${value}"`,
        icon: '⚙️',
        action: 'updated',
        targetName: updated.label,
        targetType: 'settings',
        targetId: updated.id,
        severity: key === 'maintenance_mode' ? 'warning' : 'info',
        category: 'admin_action',
        metadata: JSON.stringify({ key, value }),
      },
    });

    return NextResponse.json({
      setting: {
        ...updated,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Platform setting update error:', error);
    return NextResponse.json(
      { error: 'Failed to update platform setting' },
      { status: 500 }
    );
  }
}

// Helper: infer type from value
function inferType(value: string): string {
  if (value === 'true' || value === 'false') return 'boolean';
  if (!isNaN(Number(value)) && value.trim() !== '') return 'number';
  return 'string';
}
