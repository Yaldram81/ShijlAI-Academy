'use client'

import { motion } from 'framer-motion'
import { Activity, Wifi, Database, HardDrive, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { springTransition } from './constants'
import type { WelcomeData } from './types'

interface SystemStatusProps {
  welcomeData: WelcomeData
}

export function SystemStatus({ welcomeData }: SystemStatusProps) {
  const services = [
    { name: 'API', icon: Wifi, status: 'operational', color: 'bg-emerald-400' },
    { name: 'Database', icon: Database, status: 'operational', color: 'bg-emerald-400' },
    { name: 'Storage', icon: HardDrive, status: 'warning', color: 'bg-amber-400' },
    { name: 'CDN', icon: Globe, status: 'operational', color: 'bg-emerald-400' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.15, ...springTransition }}
      className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 p-4 relative overflow-hidden"
    >
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.07]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold text-white flex items-center gap-2">
            <Activity className="size-4" />
            System Status
          </h3>
          <Badge className="bg-white/20 text-white border-0 rounded-xl text-[12px]">
            Uptime: {welcomeData.uptime}
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-3 py-2"
            >
              <service.icon className="size-4 text-white/80" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white">{service.name}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`size-2 rounded-full ${service.color} ${service.status === 'operational' ? 'animate-pulse' : ''}`} />
                <span className="text-[11px] text-emerald-100 capitalize">{service.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
