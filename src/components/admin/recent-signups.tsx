'use client'

import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { springTransition, ROLE_BADGE_COLORS } from './constants'
import type { RecentSignup } from './types'

interface RecentSignupsProps {
  recentSignups: RecentSignup[]
}

export function RecentSignups({ recentSignups }: RecentSignupsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, ...springTransition }}
      className="rounded-2xl ios-shadow-sm bg-card p-5"
    >
      <h3 className="text-[17px] font-semibold flex items-center gap-2 mb-1">
        <UserPlus className="size-4 text-emerald-500" />
        Recent Signups
      </h3>
      <p className="text-[13px] text-muted-foreground mb-3">Latest platform registrations</p>
      <div className="max-h-72 overflow-y-auto scrollbar-thin space-y-1">
        {recentSignups.map((signup, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors"
          >
            <Avatar className="size-9 rounded-xl">
              <AvatarFallback className="text-[11px] bg-primary/10 rounded-xl">
                {signup.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium line-clamp-1">{signup.name}</p>
              <p className="text-[12px] text-muted-foreground line-clamp-1">{signup.email}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge
                variant="secondary"
                className={`text-[10px] rounded-lg border-0 ${ROLE_BADGE_COLORS[signup.role] || ''}`}
              >
                {signup.role}
              </Badge>
              <span className="text-[10px] text-muted-foreground">{signup.date}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
