'use client'

import { motion } from 'framer-motion'
import { Calendar, Video, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function InstructorScheduleView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/40">
              <Calendar className="size-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          </div>
          <p className="text-muted-foreground text-[14px]">Manage your live sessions, office hours, and course timelines.</p>
        </div>
      </motion.div>

      {/* Empty State */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-dashed border-border/60 bg-card p-12 text-center"
      >
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-muted/60 mb-4">
          <Calendar className="size-8 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Schedule Coming Soon</h3>
        <p className="text-[14px] text-muted-foreground max-w-md mx-auto mb-6">
          Manage your live sessions, office hours, and course timelines.
        </p>
        <Button variant="outline" className="rounded-full">Get Started</Button>
      </motion.div>

      {/* Feature Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Video, title: 'Live Sessions', desc: 'Schedule and manage live video sessions with your students.', color: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400' },
          { icon: Clock, title: 'Office Hours', desc: 'Set availability for one-on-one student consultations.', color: 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400' },
          { icon: AlertCircle, title: 'Course Deadlines', desc: 'Track and manage important course milestones and due dates.', color: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950/40 dark:text-fuchsia-400' },
        ].map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            className="rounded-2xl bg-card p-5 ios-shadow-sm hover:scale-[1.02] transition-transform"
          >
            <div className={`flex size-10 items-center justify-center rounded-xl ${feature.color} mb-3`}>
              <feature.icon className="size-5" />
            </div>
            <h4 className="font-semibold text-[15px] mb-1">{feature.title}</h4>
            <p className="text-[13px] text-muted-foreground">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
