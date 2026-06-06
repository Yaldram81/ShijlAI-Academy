import { NextResponse } from 'next/server'

// Theme preset definitions
const THEME_PRESETS = [
  {
    name: 'ocean',
    label: 'Ocean',
    description: 'Cool blues with warm accents',
    colors: {
      primary: '#0EA5E9',
      secondary: '#06B6D4',
      accent: '#F59E0B',
      darkPrimary: '#38BDF8',
      darkSecondary: '#22D3EE',
      darkAccent: '#FBBF24',
      darkBg: '#0C1222',
      darkCard: '#1A2332',
      lightBg: '#F0F9FF',
      lightCard: '#E0F2FE',
    },
  },
  {
    name: 'forest',
    label: 'Forest',
    description: 'Natural greens with golden highlights',
    colors: {
      primary: '#16A34A',
      secondary: '#15803D',
      accent: '#EAB308',
      darkPrimary: '#4ADE80',
      darkSecondary: '#86EFAC',
      darkAccent: '#FDE047',
      darkBg: '#0A1F0A',
      darkCard: '#163016',
      lightBg: '#F0FDF4',
      lightCard: '#DCFCE7',
    },
  },
  {
    name: 'sunset',
    label: 'Sunset',
    description: 'Warm oranges with purple accents',
    colors: {
      primary: '#F97316',
      secondary: '#EF4444',
      accent: '#A855F7',
      darkPrimary: '#FB923C',
      darkSecondary: '#F87171',
      darkAccent: '#C084FC',
      darkBg: '#1A0A0A',
      darkCard: '#2A1515',
      lightBg: '#FFF7ED',
      lightCard: '#FFEDD5',
    },
  },
  {
    name: 'midnight',
    label: 'Midnight',
    description: 'Deep purples with pink accents',
    colors: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      accent: '#EC4899',
      darkPrimary: '#818CF8',
      darkSecondary: '#A78BFA',
      darkAccent: '#F472B6',
      darkBg: '#0F0B1A',
      darkCard: '#1E1530',
      lightBg: '#EEF2FF',
      lightCard: '#E0E7FF',
    },
  },
  {
    name: 'minimal',
    label: 'Minimal',
    description: 'Clean neutrals with amber highlights',
    colors: {
      primary: '#18181B',
      secondary: '#71717A',
      accent: '#F59E0B',
      darkPrimary: '#FAFAFA',
      darkSecondary: '#A1A1AA',
      darkAccent: '#FBBF24',
      darkBg: '#09090B',
      darkCard: '#18181B',
      lightBg: '#FAFAFA',
      lightCard: '#F4F4F5',
    },
  },
]

// GET /api/admin/appearance/theme-presets — List available theme presets
export async function GET() {
  try {
    return NextResponse.json({ presets: THEME_PRESETS })
  } catch (error) {
    console.error('Theme presets fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch theme presets' },
      { status: 500 }
    )
  }
}
