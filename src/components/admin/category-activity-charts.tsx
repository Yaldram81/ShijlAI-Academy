'use client'

import { motion } from 'framer-motion'
import { BarChart3, Activity } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { springTransition, CATEGORY_COLORS } from './constants'
import type { CategoryDistributionItem, DailyActivityItem } from './types'

function CategoryTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: CategoryDistributionItem }> }) {
  if (!active || !payload?.[0]) return null
  const data = payload[0].payload
  return (
    <div className="rounded-xl bg-card p-3 ios-shadow-sm border border-border/50 text-sm">
      <p className="font-semibold text-foreground mb-1">{data.category}</p>
      <p className="text-[13px] text-emerald-600 dark:text-emerald-400">Enrollments: {data.enrollments.toLocaleString()}</p>
      <p className="text-[13px] text-teal-600 dark:text-teal-400">Courses: {data.courses}</p>
    </div>
  )
}

function ActivityTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="rounded-xl bg-card p-3 ios-shadow-sm border border-border/50 text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-[13px]" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

interface CategoryActivityChartsProps {
  categoryDistribution: CategoryDistributionItem[]
  dailyActivity: DailyActivityItem[]
}

export function CategoryActivityCharts({ categoryDistribution, dailyActivity }: CategoryActivityChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Category Distribution */}
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.35, ...springTransition }}
        className="rounded-2xl ios-shadow-sm bg-card p-5"
      >
        <h3 className="text-[17px] font-semibold flex items-center gap-2 mb-1">
          <BarChart3 className="size-4 text-teal-500" />
          Category Distribution
        </h3>
        <p className="text-[13px] text-muted-foreground mb-4">Enrollments by course category</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryDistribution} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 166)" vertical={false} />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CategoryTooltip />} />
              <Bar dataKey="enrollments" radius={[6, 6, 0, 0]} maxBarSize={40}>
                {categoryDistribution.map((entry) => (
                  <Cell
                    key={entry.category}
                    fill={CATEGORY_COLORS[entry.category] || '#6b7280'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Daily Platform Activity */}
      <motion.div
        initial={{ opacity: 0, x: 15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.35, ...springTransition }}
        className="rounded-2xl ios-shadow-sm bg-card p-5"
      >
        <h3 className="text-[17px] font-semibold flex items-center gap-2 mb-1">
          <Activity className="size-4 text-cyan-500" />
          Daily Platform Activity
        </h3>
        <p className="text-[13px] text-muted-foreground mb-4">Active users over last 14 days</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyActivity} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 166)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<ActivityTooltip />} />
              <Area
                type="monotone"
                dataKey="activeUsers"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#activityGradient)"
                name="Active Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  )
}
