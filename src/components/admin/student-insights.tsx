'use client'

import { motion } from 'framer-motion'
import {
  Users, UserPlus, Repeat, Clock, BarChart3, TrendingUp, ArrowRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { springTransition } from './constants'
import { AdminStatCard } from './admin-stat-card'

// Mock data for student insights
const MOCK_INSIGHTS = {
  newStudentsThisMonth: 47,
  newStudentsChange: 12,
  returningStudents: 234,
  returningPercent: 68,
  avgSessionsPerWeek: 3.2,
  avgCompletionRate: 42,
  segments: [
    { name: 'Highly Active', description: 'Daily', count: 89, percent: 26, color: 'bg-emerald-500' },
    { name: 'Regular', description: '2-3x/week', count: 124, percent: 36, color: 'bg-teal-500' },
    { name: 'Casual', description: 'Weekly', count: 82, percent: 24, color: 'bg-amber-500' },
    { name: 'At Risk', description: '>2 weeks inactive', count: 48, percent: 14, color: 'bg-red-500' },
  ],
  topLearningPaths: [
    { id: 1, courses: ['Python Basics', 'OOP Concepts', 'Web Development'], students: 34 },
    { id: 2, courses: ['IB Physics', 'IB Math', 'IB Chemistry'], students: 28 },
    { id: 3, courses: ['IELTS Prep', 'English Grammar', 'Academic Writing'], students: 21 },
  ],
}

export function StudentInsights() {
  const data = MOCK_INSIGHTS

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, ...springTransition }}
      className="rounded-2xl ios-shadow-sm bg-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[17px] font-semibold flex items-center gap-2">
            <Users className="size-4 text-emerald-500" />
            Student Insights
          </h3>
          <p className="text-[13px] text-muted-foreground">Engagement & learning behavior</p>
        </div>
        <Badge variant="secondary" className="rounded-xl text-[11px]">
          This Month
        </Badge>
      </div>

      {/* Stat Cards Row */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 mb-5">
        <AdminStatCard icon={UserPlus} label="New Students" value={String(data.newStudentsThisMonth)} color="emerald" trend={data.newStudentsChange} />
        <AdminStatCard icon={Repeat} label={`Returning (${data.returningPercent}%)`} value={String(data.returningStudents)} color="teal" />
        <AdminStatCard icon={Clock} label="Avg Sessions/Week" value={String(data.avgSessionsPerWeek)} color="cyan" />
        <AdminStatCard icon={TrendingUp} label="Avg Completion Rate" value={`${data.avgCompletionRate}%`} color="amber" />
      </div>

      {/* Student Segments - CSS Horizontal Bars */}
      <div className="mb-5">
        <h4 className="text-[14px] font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="size-3.5 text-muted-foreground" />
          Student Segments
        </h4>
        <div className="space-y-2.5">
          {data.segments.map((segment) => (
            <div key={segment.name} className="flex items-center gap-3">
              <div className="w-24 shrink-0">
                <p className="text-[12px] font-medium">{segment.name}</p>
                <p className="text-[10px] text-muted-foreground">{segment.description}</p>
              </div>
              <div className="flex-1 h-6 bg-muted/30 rounded-lg overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${segment.percent}%` }}
                  transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-lg ${segment.color} flex items-center justify-end pr-2`}
                >
                  <span className="text-[10px] font-semibold text-white">{segment.count}</span>
                </motion.div>
              </div>
              <span className="text-[12px] font-medium w-10 text-right">{segment.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Learning Paths */}
      <div>
        <h4 className="text-[14px] font-semibold mb-3 flex items-center gap-2">
          <ArrowRight className="size-3.5 text-muted-foreground" />
          Top Learning Paths
        </h4>
        <div className="space-y-2">
          {data.topLearningPaths.map((path) => (
            <div key={path.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                {path.courses.map((course, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-[12px]">
                    {i > 0 && <ArrowRight className="size-3 text-muted-foreground shrink-0" />}
                    <span className="line-clamp-1">{course}</span>
                  </span>
                ))}
              </div>
              <Badge variant="secondary" className="text-[10px] rounded-lg border-0 shrink-0">
                {path.students} students
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
