'use client'

import { createContext, useContext } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { TrendingUp, type LucideIcon } from 'lucide-react'

// ─── Size Context ──────────────────────────────────────────────────────────────

export type StatCardSize = 'sm' | 'md' | 'lg'

const StatCardSizeContext = createContext<StatCardSize>('md')

function useStatCardSize(explicit?: StatCardSize): StatCardSize {
  const fromContext = useContext(StatCardSizeContext)
  return explicit || fromContext
}

// ─── Size Config ───────────────────────────────────────────────────────────────

const SIZE_CONFIG: Record<StatCardSize, {
  padding: string
  valueText: string
  labelText: string
  subLabelText: string
  iconBox: string
  iconGlyph: string
  gap: string
  trendText: string
  trendIcon: string
  trendPad: string
}> = {
  sm: {
    padding: 'p-3',
    valueText: 'text-lg',
    labelText: 'text-[10px]',
    subLabelText: 'text-[10px]',
    iconBox: 'size-8',
    iconGlyph: 'size-3.5',
    gap: 'gap-2',
    trendText: 'text-[9px]',
    trendIcon: 'size-2',
    trendPad: 'px-1 py-0.5',
  },
  md: {
    padding: 'p-4',
    valueText: 'text-[28px]',
    labelText: 'text-[11px]',
    subLabelText: 'text-[11px]',
    iconBox: 'size-11',
    iconGlyph: 'size-5',
    gap: 'gap-3',
    trendText: 'text-[10px]',
    trendIcon: 'size-2.5',
    trendPad: 'px-1.5 py-0.5',
  },
  lg: {
    padding: 'p-5',
    valueText: 'text-[34px]',
    labelText: 'text-[12px]',
    subLabelText: 'text-[12px]',
    iconBox: 'size-14',
    iconGlyph: 'size-6',
    gap: 'gap-3',
    trendText: 'text-[11px]',
    trendIcon: 'size-3',
    trendPad: 'px-2 py-0.5',
  },
}

// ─── Color Token System ──────────────────────────────────────────────────────

export const ADMIN_COLORS = {
  emerald: {
    iconColor: 'text-emerald-600',
    iconBg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    iconRing: 'ring-1 ring-emerald-200/60',
    iconGlow: 'shadow-emerald-200/50',
    valueColor: 'text-emerald-700',
    trendUp: 'bg-emerald-50 text-emerald-700',
    accent: 'bg-emerald-500',
    accentLight: 'bg-emerald-100',
    sparkColor: '#10b981',
  },
  teal: {
    iconColor: 'text-teal-600',
    iconBg: 'bg-gradient-to-br from-teal-50 to-cyan-50',
    iconRing: 'ring-1 ring-teal-200/60',
    iconGlow: 'shadow-teal-200/50',
    valueColor: 'text-teal-700',
    trendUp: 'bg-teal-50 text-teal-700',
    accent: 'bg-teal-500',
    accentLight: 'bg-teal-100',
    sparkColor: '#14b8a6',
  },
  cyan: {
    iconColor: 'text-cyan-600',
    iconBg: 'bg-gradient-to-br from-cyan-50 to-blue-50',
    iconRing: 'ring-1 ring-cyan-200/60',
    iconGlow: 'shadow-cyan-200/50',
    valueColor: 'text-cyan-700',
    trendUp: 'bg-cyan-50 text-cyan-700',
    accent: 'bg-cyan-500',
    accentLight: 'bg-cyan-100',
    sparkColor: '#06b6d4',
  },
  amber: {
    iconColor: 'text-amber-600',
    iconBg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    iconRing: 'ring-1 ring-amber-200/60',
    iconGlow: 'shadow-amber-200/50',
    valueColor: 'text-amber-700',
    trendUp: 'bg-amber-50 text-amber-700',
    accent: 'bg-amber-500',
    accentLight: 'bg-amber-100',
    sparkColor: '#f59e0b',
  },
  rose: {
    iconColor: 'text-rose-600',
    iconBg: 'bg-gradient-to-br from-rose-50 to-pink-50',
    iconRing: 'ring-1 ring-rose-200/60',
    iconGlow: 'shadow-rose-200/50',
    valueColor: 'text-rose-700',
    trendUp: 'bg-rose-50 text-rose-700',
    accent: 'bg-rose-500',
    accentLight: 'bg-rose-100',
    sparkColor: '#f43f5e',
  },
  violet: {
    iconColor: 'text-violet-600',
    iconBg: 'bg-gradient-to-br from-violet-50 to-purple-50',
    iconRing: 'ring-1 ring-violet-200/60',
    iconGlow: 'shadow-violet-200/50',
    valueColor: 'text-violet-700',
    trendUp: 'bg-violet-50 text-violet-700',
    accent: 'bg-violet-500',
    accentLight: 'bg-violet-100',
    sparkColor: '#8b5cf6',
  },
  orange: {
    iconColor: 'text-orange-600',
    iconBg: 'bg-gradient-to-br from-orange-50 to-red-50',
    iconRing: 'ring-1 ring-orange-200/60',
    iconGlow: 'shadow-orange-200/50',
    valueColor: 'text-orange-700',
    trendUp: 'bg-orange-50 text-orange-700',
    accent: 'bg-orange-500',
    accentLight: 'bg-orange-100',
    sparkColor: '#f97316',
  },
  pink: {
    iconColor: 'text-pink-600',
    iconBg: 'bg-gradient-to-br from-pink-50 to-rose-50',
    iconRing: 'ring-1 ring-pink-200/60',
    iconGlow: 'shadow-pink-200/50',
    valueColor: 'text-pink-700',
    trendUp: 'bg-pink-50 text-pink-700',
    accent: 'bg-pink-500',
    accentLight: 'bg-pink-100',
    sparkColor: '#ec4899',
  },
  green: {
    iconColor: 'text-green-600',
    iconBg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    iconRing: 'ring-1 ring-green-200/60',
    iconGlow: 'shadow-green-200/50',
    valueColor: 'text-green-700',
    trendUp: 'bg-green-50 text-green-700',
    accent: 'bg-green-500',
    accentLight: 'bg-green-100',
    sparkColor: '#22c55e',
  },
  purple: {
    iconColor: 'text-purple-600',
    iconBg: 'bg-gradient-to-br from-purple-50 to-violet-50',
    iconRing: 'ring-1 ring-purple-200/60',
    iconGlow: 'shadow-purple-200/50',
    valueColor: 'text-purple-700',
    trendUp: 'bg-purple-50 text-purple-700',
    accent: 'bg-purple-500',
    accentLight: 'bg-purple-100',
    sparkColor: '#a855f7',
  },
  red: {
    iconColor: 'text-red-600',
    iconBg: 'bg-gradient-to-br from-red-50 to-rose-50',
    iconRing: 'ring-1 ring-red-200/60',
    iconGlow: 'shadow-red-200/50',
    valueColor: 'text-red-700',
    trendUp: 'bg-red-50 text-red-700',
    accent: 'bg-red-500',
    accentLight: 'bg-red-100',
    sparkColor: '#ef4444',
  },
  blue: {
    iconColor: 'text-sky-600',
    iconBg: 'bg-gradient-to-br from-sky-50 to-blue-50',
    iconRing: 'ring-1 ring-sky-200/60',
    iconGlow: 'shadow-sky-200/50',
    valueColor: 'text-sky-700',
    trendUp: 'bg-sky-50 text-sky-700',
    accent: 'bg-sky-500',
    accentLight: 'bg-sky-100',
    sparkColor: '#0ea5e9',
  },
} as const

export type AdminColorToken = keyof typeof ADMIN_COLORS

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdminStatCardProps {
  icon: LucideIcon
  value: React.ReactNode
  label: string
  color: AdminColorToken
  subLabel?: string
  trend?: number
  trendLabel?: string
  index?: number
  onClick?: () => void
  active?: boolean
  size?: StatCardSize
  iconBgOverride?: string
  iconColorOverride?: string
  gradientOverride?: string
  valueColor?: string
}

// ─── Admin Stat Card — Premium Light ─────────────────────────────────────────

export function AdminStatCard({
  icon: Icon,
  value,
  label,
  color,
  subLabel,
  trend,
  trendLabel,
  index = 0,
  onClick,
  active,
  size: sizeProp,
  iconBgOverride,
  iconColorOverride,
  gradientOverride: _gradientOverride,
  valueColor,
}: AdminStatCardProps) {
  const ct = ADMIN_COLORS[color]
  const iconBg = iconBgOverride || ct.iconBg
  const iconColor = iconColorOverride || ct.iconColor
  const size = useStatCardSize(sizeProp)
  const s = SIZE_CONFIG[size]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
    >
      <div
        className={cn(
          'group relative rounded-3xl overflow-hidden',
          'bg-white dark:bg-white/[0.06]',
          'border border-gray-100 dark:border-white/[0.08]',
          'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)]',
          'dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.1)]',
          'transition-all duration-300 ease-out',
          'hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]',
          'dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.15)]',
          'hover:-translate-y-0.5',
          onClick && 'cursor-pointer',
          active && 'ring-2 ring-primary/20',
        )}
        onClick={onClick}
      >
        <div className={s.padding}>
          <div className={cn('flex items-start justify-between', s.gap)}>
            {/* Left: label + value */}
            <div className="min-w-0 flex-1">
              <p className={cn('font-semibold text-gray-400 dark:text-white/40 tracking-wider uppercase truncate', s.labelText)}>
                {label}
              </p>
              <p className={cn(
                'font-bold leading-tight tracking-tight mt-1',
                s.valueText,
                valueColor || ct.valueColor,
              )}>
                {value}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                {trend !== undefined && (
                  <span className={cn(
                    'inline-flex items-center gap-0.5 rounded-md font-bold',
                    s.trendPad, s.trendText,
                    trend >= 0 ? ct.trendUp : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
                  )}>
                    <TrendingUp className={cn(s.trendIcon, trend < 0 && 'rotate-180')} />
                    {trend >= 0 ? '+' : ''}{trend}%
                  </span>
                )}
                {(subLabel || (trendLabel && trend === undefined)) && (
                  <span className={cn('text-gray-400 dark:text-white/30 font-medium truncate', s.subLabelText)}>
                    {subLabel || trendLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Icon */}
            <div className={cn(
              'flex shrink-0 items-center justify-center rounded-2xl',
              s.iconBox,
              iconBg,
              'shadow-sm transition-transform duration-200 group-hover:scale-105',
            )}
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <Icon className={cn(iconColor, s.iconGlyph)} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Stat Card Grid ──────────────────────────────────────────────────────────

function inferSizeFromColumns(columns: number): StatCardSize {
  if (columns <= 2) return 'lg'
  if (columns <= 4) return 'md'
  return 'sm'
}

export interface AdminStatCardGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4 | 5 | 6
  size?: StatCardSize
  className?: string
}

export function AdminStatCardGrid({ children, columns = 4, size: sizeProp, className }: AdminStatCardGridProps) {
  const colMap: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  }

  const size = sizeProp || inferSizeFromColumns(columns)

  return (
    <StatCardSizeContext.Provider value={size}>
      <div className={cn('grid gap-4', colMap[columns], className)}>
        {children}
      </div>
    </StatCardSizeContext.Provider>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function AdminStatCardSkeleton({ size: sizeProp }: { size?: StatCardSize }) {
  const size = useStatCardSize(sizeProp)
  const s = SIZE_CONFIG[size]

  return (
    <div className="rounded-3xl bg-white dark:bg-white/[0.06] border border-gray-100 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className={s.padding}>
        <div className={cn('flex items-start justify-between', s.gap)}>
          <div className="min-w-0 flex-1">
            <div className={cn('rounded bg-gray-100 dark:bg-white/10 mb-3 animate-pulse', s.labelText === 'text-[10px]' ? 'h-2 w-16' : s.labelText === 'text-[12px]' ? 'h-3 w-24' : 'h-2.5 w-20')} />
            <div className={cn('rounded bg-gray-100 dark:bg-white/10 animate-pulse', s.valueText === 'text-lg' ? 'h-5 w-14' : s.valueText === 'text-[34px]' ? 'h-9 w-24' : 'h-7 w-16')} />
          </div>
          <div className={cn('rounded-2xl bg-gray-50 dark:bg-white/10 shrink-0 animate-pulse', s.iconBox)} />
        </div>
      </div>
    </div>
  )
}
