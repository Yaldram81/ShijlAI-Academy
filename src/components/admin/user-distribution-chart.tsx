'use client'

import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts'
import { springTransition, USER_DIST_COLORS } from './constants'
import type { UserDistribution } from './types'

const RADIAN = Math.PI / 180
function renderCustomizedLabel({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number
}) {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-semibold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

interface UserDistributionChartProps {
  userDistribution: UserDistribution
}

export function UserDistributionChart({ userDistribution }: UserDistributionChartProps) {
  const userDistData = [
    { name: 'Students', value: userDistribution.students, color: USER_DIST_COLORS[0] },
    { name: 'Instructors', value: userDistribution.instructors, color: USER_DIST_COLORS[1] },
    { name: 'Admins', value: userDistribution.admins, color: USER_DIST_COLORS[2] },
    { name: 'Parents', value: userDistribution.parents, color: USER_DIST_COLORS[3] },
  ]

  const total = userDistData.reduce((s, d) => s + d.value, 0)

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.25, ...springTransition }}
      className="rounded-2xl ios-shadow-sm bg-card p-5"
    >
      <h3 className="text-[17px] font-semibold flex items-center gap-2 mb-1">
        <Users className="size-4 text-emerald-500" />
        User Distribution
      </h3>
      <p className="text-[13px] text-muted-foreground mb-4">Platform user breakdown by role</p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-48 h-48 sm:w-52 sm:h-52 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={userDistData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                labelLine={false}
                label={renderCustomizedLabel}
                strokeWidth={2}
                stroke="var(--card)"
              >
                {userDistData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => value.toLocaleString()}
                contentStyle={{ borderRadius: '12px', border: '1px solid oklch(0.91 0.01 166)', fontSize: '13px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 w-full space-y-3">
          {userDistData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[14px]">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold">{item.value.toLocaleString()}</span>
                <span className="text-[11px] text-muted-foreground">
                  ({((item.value / total) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
