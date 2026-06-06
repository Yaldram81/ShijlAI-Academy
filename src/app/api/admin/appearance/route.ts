import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper: serialize appearance config dates to ISO strings
function serializeConfig(config: Record<string, unknown>) {
  return {
    ...config,
    updatedAt: (config.updatedAt as Date)?.toISOString?.() ?? config.updatedAt,
  }
}

// Helper: create a history snapshot before updating
async function createHistorySnapshot(configId: string, changeDescription?: string) {
  const config = await db.appearanceBranding.findUnique({ where: { id: configId } })
  if (!config) return

  const { id, updatedAt, ...rest } = config
  await db.appearanceHistory.create({
    data: {
      snapshot: JSON.stringify(rest),
      presetName: (rest as Record<string, unknown>).themePreset as string | null,
      changeDescription: changeDescription ?? 'Appearance settings updated',
    },
  })
}

// GET /api/admin/appearance — Fetch appearance & branding config
// Supports ?action=export for JSON snapshot export
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    let config = await db.appearanceBranding.findFirst()
    if (!config) {
      config = await db.appearanceBranding.create({ data: {} })
    }

    // Export action: return a clean JSON snapshot
    if (action === 'export') {
      const { id, updatedAt, ...exportData } = config
      return NextResponse.json({
        snapshot: exportData,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      })
    }

    return NextResponse.json({ config: serializeConfig(config) })
  } catch (error) {
    console.error('Appearance config fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appearance configuration' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/appearance — Update appearance & branding config
// Creates a history snapshot before updating
// Supports theme preset auto-application
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()

    let config = await db.appearanceBranding.findFirst()
    if (!config) {
      config = await db.appearanceBranding.create({ data: {} })
    }

    // Create history snapshot before updating
    await createHistorySnapshot(config.id, 'Appearance settings updated')

    const { id, updatedAt, ...updateFields } = body

    // If themePreset is changing and it's not "custom", apply preset colors
    if (updateFields.themePreset && updateFields.themePreset !== 'custom') {
      const presetColors = getPresetColors(updateFields.themePreset as string)
      if (presetColors) {
        // Only override colors if they weren't explicitly provided in the update
        const colorFields = [
          'primaryColor', 'secondaryColor', 'accentColor',
          'darkPrimaryColor', 'darkSecondaryColor', 'darkAccentColor',
          'darkBgColor', 'darkCardColor', 'lightBgColor', 'lightCardColor',
        ] as const
        for (const field of colorFields) {
          if (updateFields[field] === undefined) {
            updateFields[field] = presetColors[field]
          }
        }
      }
    }

    const data: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        data[key] = value
      }
    }

    const updated = await db.appearanceBranding.update({
      where: { id: config.id },
      data,
    })

    // Log the activity
    await db.activityLog.create({
      data: {
        type: 'appearance_updated',
        title: 'Appearance settings updated',
        description: 'Admin updated appearance & branding configuration',
        icon: '🎨',
        action: 'updated',
        targetType: 'settings',
        category: 'admin_action',
      },
    })

    return NextResponse.json({ config: serializeConfig(updated) })
  } catch (error) {
    console.error('Appearance config update error:', error)
    return NextResponse.json(
      { error: 'Failed to update appearance configuration' },
      { status: 500 }
    )
  }
}

// POST /api/admin/appearance — Import a configuration snapshot
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    if (action === 'import') {
      const { snapshot } = body
      if (!snapshot || typeof snapshot !== 'object') {
        return NextResponse.json(
          { error: 'Invalid snapshot data' },
          { status: 400 }
        )
      }

      let config = await db.appearanceBranding.findFirst()
      if (!config) {
        config = await db.appearanceBranding.create({ data: {} })
      }

      // Create history snapshot before importing
      await createHistorySnapshot(config.id, 'Configuration imported from snapshot')

      // Apply snapshot data, filtering to only allowed appearance fields
      const ALLOWED_APPEARANCE_FIELDS = [
        'platformName', 'tagline', 'logoLightUrl', 'logoDarkUrl', 'faviconUrl', 'appleTouchIconUrl', 'ogImageUrl',
        'primaryColor', 'secondaryColor', 'accentColor', 'successColor', 'warningColor', 'errorColor',
        'fontFamily', 'headingFontFamily', 'baseFontSize', 'lineHeight',
        'themePreset', 'darkPrimaryColor', 'darkSecondaryColor', 'darkAccentColor',
        'darkBgColor', 'darkCardColor', 'lightBgColor', 'lightCardColor',
        'navStyle', 'navShowSearch', 'navShowNotifications', 'navTransparentOnLanding',
        'footerVisible', 'footerContent', 'footerSocialLinks', 'footerCopyrightText',
        'ogTitle', 'ogDescription', 'twitterHandle',
        'heroVisible',
      ] as const

      const { id, updatedAt, ...importData } = snapshot as Record<string, unknown>
      const data: Record<string, unknown> = {}
      for (const field of ALLOWED_APPEARANCE_FIELDS) {
        if (importData[field] !== undefined) {
          data[field] = importData[field]
        }
      }

      const updated = await db.appearanceBranding.update({
        where: { id: config.id },
        data,
      })

      // Log the activity
      await db.activityLog.create({
        data: {
          type: 'appearance_imported',
          title: 'Appearance configuration imported',
          description: 'Admin imported an appearance configuration snapshot',
          icon: '📥',
          action: 'updated',
          targetType: 'settings',
          category: 'admin_action',
        },
      })

      return NextResponse.json({ config: serializeConfig(updated) })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Appearance config import error:', error)
    return NextResponse.json(
      { error: 'Failed to import appearance configuration' },
      { status: 500 }
    )
  }
}

// Theme preset color definitions
function getPresetColors(preset: string): Record<string, string> | null {
  const presets: Record<string, Record<string, string>> = {
    ocean: {
      primaryColor: '#0EA5E9',
      secondaryColor: '#06B6D4',
      accentColor: '#F59E0B',
      darkPrimaryColor: '#38BDF8',
      darkSecondaryColor: '#22D3EE',
      darkAccentColor: '#FBBF24',
      darkBgColor: '#0C1222',
      darkCardColor: '#1A2332',
      lightBgColor: '#F0F9FF',
      lightCardColor: '#E0F2FE',
    },
    forest: {
      primaryColor: '#16A34A',
      secondaryColor: '#15803D',
      accentColor: '#EAB308',
      darkPrimaryColor: '#4ADE80',
      darkSecondaryColor: '#86EFAC',
      darkAccentColor: '#FDE047',
      darkBgColor: '#0A1F0A',
      darkCardColor: '#163016',
      lightBgColor: '#F0FDF4',
      lightCardColor: '#DCFCE7',
    },
    sunset: {
      primaryColor: '#F97316',
      secondaryColor: '#EF4444',
      accentColor: '#A855F7',
      darkPrimaryColor: '#FB923C',
      darkSecondaryColor: '#F87171',
      darkAccentColor: '#C084FC',
      darkBgColor: '#1A0A0A',
      darkCardColor: '#2A1515',
      lightBgColor: '#FFF7ED',
      lightCardColor: '#FFEDD5',
    },
    midnight: {
      primaryColor: '#6366F1',
      secondaryColor: '#8B5CF6',
      accentColor: '#EC4899',
      darkPrimaryColor: '#818CF8',
      darkSecondaryColor: '#A78BFA',
      darkAccentColor: '#F472B6',
      darkBgColor: '#0F0B1A',
      darkCardColor: '#1E1530',
      lightBgColor: '#EEF2FF',
      lightCardColor: '#E0E7FF',
    },
    minimal: {
      primaryColor: '#18181B',
      secondaryColor: '#71717A',
      accentColor: '#F59E0B',
      darkPrimaryColor: '#FAFAFA',
      darkSecondaryColor: '#A1A1AA',
      darkAccentColor: '#FBBF24',
      darkBgColor: '#09090B',
      darkCardColor: '#18181B',
      lightBgColor: '#FAFAFA',
      lightCardColor: '#F4F4F5',
    },
  }

  return presets[preset] ?? null
}
