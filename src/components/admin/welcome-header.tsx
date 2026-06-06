'use client'

import { motion } from 'framer-motion'
import { Shield, Activity, UserPlus, Settings, Printer, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { springTransition, CURRENCIES } from './constants'
import { useCurrency } from './currency-provider'
import type { WelcomeData, CurrencyConfig } from './types'

interface WelcomeHeaderProps {
  welcomeData: WelcomeData
  onExportPDF: () => void
  onCustomizeLayout: () => void
  isCustomizing: boolean
}

export function WelcomeHeader({ welcomeData, onExportPDF, onCustomizeLayout, isCustomizing }: WelcomeHeaderProps) {
  const { currency, setCurrency } = useCurrency()

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="rounded-2xl ios-shadow-sm bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 p-5 text-white relative overflow-hidden print:hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/20 translate-y-1/3 -translate-x-1/4" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Shield className="size-5" />
              </div>
              <h1 className="text-[26px] font-bold tracking-tight">Admin Command Center</h1>
            </div>
            <p className="text-emerald-100 text-[15px] mt-1">
              {welcomeData.greeting} &middot; {welcomeData.date}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-[13px] text-emerald-100">System {welcomeData.systemStatus === 'healthy' ? 'Healthy' : welcomeData.systemStatus}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="size-3.5 text-emerald-200" />
                <span className="text-[13px] text-emerald-100">Uptime: {welcomeData.uptime}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Currency Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 rounded-xl bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-0"
                >
                  {currency.symbol} {currency.code}
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                {CURRENCIES.map((c: CurrencyConfig) => (
                  <DropdownMenuItem
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={currency.code === c.code ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''}
                  >
                    <span className="mr-2 font-medium">{c.symbol}</span>
                    {c.code} — {c.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 rounded-xl bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-0 active:scale-[0.97]"
              onClick={onExportPDF}
            >
              <Printer className="size-3.5" />
              Export PDF
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className={`gap-1.5 rounded-xl backdrop-blur-sm border-0 active:scale-[0.97] ${isCustomizing ? 'bg-white/40 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
              onClick={onCustomizeLayout}
            >
              <Settings className="size-3.5" />
              {isCustomizing ? 'Done' : 'Customize'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 rounded-xl bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-0 active:scale-[0.97]"
            >
              <UserPlus className="size-3.5" />
              Add User
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
