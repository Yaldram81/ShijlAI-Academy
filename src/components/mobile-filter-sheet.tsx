'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

/**
 * A reusable "Filters" button + Sheet drawer for mobile.
 * - Shows a button with active filter count badge
 * - Opens a Sheet with the provided filter content
 * - Includes "Clear All" and "Apply" actions
 */
export function MobileFilterSheet({
  activeCount,
  onClearAll,
  children,
  title = 'Filters',
}: {
  activeCount: number
  onClearAll: () => void
  children: React.ReactNode
  title?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Filter button - mobile only */}
      <Button
        variant="outline"
        size="sm"
        className="md:hidden shrink-0 h-8 gap-1.5 rounded-lg text-[12px] relative"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal className="size-3.5" />
        Filters
        {activeCount > 0 && (
          <Badge className="size-4 p-0 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[9px] font-bold border-0 absolute -top-1.5 -right-1.5">
            {activeCount}
          </Badge>
        )}
      </Button>

      {/* Sheet drawer - mobile only */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="md:hidden rounded-t-2xl max-h-[75vh] overflow-y-auto">
          <SheetHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-[16px] font-bold">{title}</SheetTitle>
              {activeCount > 0 && (
                <button
                  onClick={() => {
                    onClearAll()
                    setOpen(false)
                  }}
                  className="flex items-center gap-1 text-[12px] font-medium text-primary hover:text-primary/80"
                >
                  <X className="size-3" />
                  Clear all
                </button>
              )}
            </div>
            <SheetDescription className="sr-only">Filter options</SheetDescription>
          </SheetHeader>

          {/* Filter content */}
          <div className="py-4 space-y-4">
            {children}
          </div>

          {/* Apply button */}
          <div className="sticky bottom-0 bg-background pt-3 pb-4 border-t border-border/40">
            <Button
              className="w-full h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold"
              onClick={() => setOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

/**
 * A single filter group inside the mobile filter sheet.
 * Renders a label + the filter control (Select, etc.)
 */
export function MobileFilterGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

/**
 * A scrollable horizontal pill/tabs container for mobile.
 * Shows pills that can be scrolled horizontally.
 */
export function ScrollableFilterPills({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1 -mx-3 px-3', className)}>
      {children}
    </div>
  )
}
