'use client'

import { motion } from 'framer-motion'
import { Megaphone, Tag, UserPlus, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function InstructorMarketingView() {
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
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950/40">
              <Megaphone className="size-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Marketing</h1>
          </div>
          <p className="text-muted-foreground text-[14px]">Promote your courses and grow your student base with marketing tools.</p>
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
          <Megaphone className="size-8 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Marketing Coming Soon</h3>
        <p className="text-[14px] text-muted-foreground max-w-md mx-auto mb-6">
          Promote your courses and grow your student base with marketing tools.
        </p>
        <Button variant="outline" className="rounded-full">Get Started</Button>
      </motion.div>

      {/* Feature Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Tag, title: 'Course Promotions', desc: 'Create discounts, coupons, and promotional campaigns for your courses.', color: 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400' },
          { icon: UserPlus, title: 'Student Outreach', desc: 'Engage potential students with targeted email and social campaigns.', color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
          { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track campaign performance, conversion rates, and ROI metrics.', color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400' },
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
