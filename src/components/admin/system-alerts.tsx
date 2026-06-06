'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, AlertTriangle, CheckCircle, Clock, Eye, Shield, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { springTransition, ALERT_CONFIG } from './constants'
import type { SystemAlert, ContentModeration } from './types'

interface SystemAlertsProps {
  systemAlerts: SystemAlert[]
  contentModeration: ContentModeration
}

export function SystemAlerts({ systemAlerts, contentModeration }: SystemAlertsProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set())

  const dismissAlert = useCallback((index: number) => {
    setDismissedAlerts(prev => new Set(prev).add(index))
  }, [])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* System Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, ...springTransition }}
        className="rounded-2xl ios-shadow-sm bg-card p-5"
      >
        <h3 className="text-[17px] font-semibold flex items-center gap-2 mb-1">
          <AlertCircle className="size-4 text-amber-500" />
          System Alerts
        </h3>
        <p className="text-[13px] text-muted-foreground mb-3">
          {systemAlerts.filter((_, i) => !dismissedAlerts.has(i)).length} active alerts
        </p>
        <div className="max-h-72 overflow-y-auto scrollbar-thin space-y-2">
          {systemAlerts.map((alert, i) => {
            if (dismissedAlerts.has(i)) return null
            const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.info
            const AlertIcon = config.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className={`flex size-8 items-center justify-center rounded-lg shrink-0 ${config.bg}`}>
                  <AlertIcon className={`size-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] line-clamp-2">{alert.message}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{alert.time}</p>
                </div>
                <button
                  onClick={() => dismissAlert(i)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <X className="size-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              </motion.div>
            )
          })}
          {systemAlerts.every((_, i) => dismissedAlerts.has(i)) && (
            <div className="flex flex-col items-center py-6 text-muted-foreground">
              <CheckCircle className="size-8 mb-2 text-emerald-500" />
              <p className="text-[13px]">All alerts cleared</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Content Moderation */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, ...springTransition }}
        className="rounded-2xl ios-shadow-sm bg-card p-5"
      >
        <h3 className="text-[17px] font-semibold flex items-center gap-2 mb-1">
          <Shield className="size-4 text-teal-500" />
          Content Moderation
        </h3>
        <p className="text-[13px] text-muted-foreground mb-3">Review &amp; moderation queue</p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Pending', value: contentModeration.pendingReviews, icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Reported', value: contentModeration.reportedContent, icon: AlertTriangle, color: 'text-red-600 dark:text-red-400' },
            { label: 'Flagged', value: contentModeration.flaggedUsers, icon: AlertCircle, color: 'text-orange-600 dark:text-orange-400' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-muted/30 p-3 text-center">
              <item.icon className={`size-4 mx-auto mb-1 ${item.color}`} />
              <p className="text-[18px] font-bold">{item.value}</p>
              <p className="text-[11px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
          {contentModeration.pendingReviews > 0 ? (
            Array.from({ length: Math.min(contentModeration.pendingReviews, 3) }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="size-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-[13px] line-clamp-1">Course awaiting review #{i + 1}</span>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 rounded-lg active:scale-[0.97] text-[11px] shrink-0">
                  <Eye className="size-3" /> Review
                </Button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center py-4 text-muted-foreground">
              <CheckCircle className="size-6 mb-1 text-emerald-500" />
              <p className="text-[12px]">All clear</p>
            </div>
          )}
          {contentModeration.reportedContent > 0 && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-50 dark:bg-red-950/20">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-2 rounded-full bg-red-500 shrink-0" />
                <span className="text-[13px] line-clamp-1">Reported content</span>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 rounded-lg active:scale-[0.97] text-[11px] shrink-0 text-red-600 dark:text-red-400">
                <Eye className="size-3" /> Review
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
