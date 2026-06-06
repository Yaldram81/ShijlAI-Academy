import type { CurrencyConfig, WidgetId } from './types'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'

// ─── Animation ──────────────────────────────────────────────────────────────

export const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

// ─── Chart Colors ───────────────────────────────────────────────────────────

export const USER_DIST_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#06b6d4']
export const REVENUE_COLORS = ['#10b981', '#f59e0b', '#06b6d4']

export const CATEGORY_COLORS: Record<string, string> = {
  IB: '#10b981',
  AP: '#14b8a6',
  Cambridge: '#06b6d4',
  IELTS: '#f59e0b',
  AWS: '#8b5cf6',
  Programming: '#ec4899',
  General: '#6b7280',
  Mathematics: '#10b981',
  Physics: '#14b8a6',
  Chemistry: '#06b6d4',
  Biology: '#f59e0b',
  English: '#8b5cf6',
  'Computer Science': '#ec4899',
}

// ─── Role Badges ────────────────────────────────────────────────────────────

export const ROLE_BADGE_COLORS: Record<string, string> = {
  student: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  instructor: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
  admin: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  parent: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400',
}

// ─── Alert Config ───────────────────────────────────────────────────────────

export const ALERT_CONFIG: Record<string, { icon: typeof AlertCircle; color: string; bg: string }> = {
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-950/40',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-950/40',
  },
  info: {
    icon: Info,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-100 dark:bg-cyan-950/40',
  },
}

// ─── Currency ───────────────────────────────────────────────────────────────

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.0036 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.0033 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.0028 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 0.013 },
]

export const DEFAULT_CURRENCY = 'USD'

// ─── Widget Layout ──────────────────────────────────────────────────────────

export const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  'welcome',
  'stats',
  'student-insights',
  'system-status',
  'growth',
  'distribution',
  'courses',
  'category-activity',
  'signups',
  'alerts',
  'feature-flags',
]

export const WIDGET_LABELS: Record<WidgetId, string> = {
  'welcome': 'Welcome Header',
  'stats': 'Stats Grid',
  'system-status': 'System Status',
  'growth': 'Platform Growth',
  'distribution': 'User & Revenue Distribution',
  'courses': 'Popular Courses',
  'category-activity': 'Category & Activity',
  'signups': 'Recent Signups',
  'alerts': 'System Alerts',
  'feature-flags': 'Feature Flags',
  'student-insights': 'Student Insights',
}

export const STORAGE_KEY_CURRENCY = 'shijlai_currency'
export const STORAGE_KEY_WIDGET_ORDER = 'shijlai_admin_widget_order'
