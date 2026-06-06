'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { springTransition } from './constants'
import type { FeatureFlag } from './types'

interface FeatureFlagsProps {
  initialFlags: FeatureFlag[]
}

export function FeatureFlags({ initialFlags }: FeatureFlagsProps) {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>(initialFlags)

  const toggleFeatureFlag = useCallback((index: number) => {
    setFeatureFlags(prev =>
      prev.map((flag, i) =>
        i === index ? { ...flag, enabled: !flag.enabled, rollout: flag.enabled ? 0 : 100 } : flag
      )
    )
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, ...springTransition }}
      className="rounded-2xl ios-shadow-sm bg-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[17px] font-semibold flex items-center gap-2">
            <Zap className="size-4 text-amber-500" />
            Feature Flags
          </h3>
          <p className="text-[13px] text-muted-foreground">Manage platform feature rollouts</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {featureFlags.map((flag, i) => (
          <motion.div
            key={flag.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i, ...springTransition }}
            className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1 min-w-0 mr-3">
              <div className="flex items-center gap-2">
                <div className={`size-2 rounded-full ${flag.enabled ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                <span className="text-[14px] font-medium">{flag.name}</span>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground">Rollout</span>
                  <span className="text-[11px] font-medium">{flag.rollout}%</span>
                </div>
                <Progress
                  value={flag.rollout}
                  className="h-1.5 rounded-full"
                />
              </div>
            </div>
            <Switch
              checked={flag.enabled}
              onCheckedChange={() => toggleFeatureFlag(i)}
              className="shrink-0"
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
