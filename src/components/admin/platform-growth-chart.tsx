'use client'

import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { springTransition } from './constants'
import type { PlatformGrowthItem } from './types'

function GrowthTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
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

interface PlatformGrowthChartProps {
  data: PlatformGrowthItem[]
}

export function PlatformGrowthChart({ data }: PlatformGrowthChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, ...springTransition }}
      className="rounded-2xl ios-shadow-sm bg-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[17px] font-semibold flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-500" />
            Platform Growth
          </h3>
          <p className="text-[13px] text-muted-foreground">30-day user &amp; enrollment trends</p>
        </div>
        <Badge variant="secondary" className="rounded-xl text-[11px]">
          Last 30 days
        </Badge>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
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
            <Tooltip content={<GrowthTooltip />} />
            <Area
              type="monotone"
              dataKey="users"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#userGradient)"
              name="Users"
            />
            <Area
              type="monotone"
              dataKey="enrollments"
              stroke="#14b8a6"
              strokeWidth={2}
              fill="url(#enrollmentGradient)"
              name="Enrollments"
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
