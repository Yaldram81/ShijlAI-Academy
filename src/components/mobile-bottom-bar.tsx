'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

/* ─── Types ─── */

export interface BottomBarItem {
  id: string
  label: React.ReactNode
  icon: React.ReactNode
  iconColor?: string
}

export interface CenterButton {
  icon: React.ReactNode
  label: React.ReactNode
  onClick: () => void
}

export interface MoreMenuAction {
  id: string
  label: React.ReactNode
  icon: React.ReactNode
  iconColor?: string
  onClick: () => void
}

interface MobileBottomBarProps {
  /** Primary tab items shown in the bar. When centerButton is set, first 2 go before center, rest go after */
  items: BottomBarItem[]
  /** Items shown in the "More" popup grid */
  moreItems: MoreMenuAction[]
  /** Optional center button (sits in the center of the bar) */
  centerButton?: CenterButton
  /** How many items to show BEFORE the center button (default 2) */
  beforeCenterCount?: number
  /** How many items to show AFTER the center button (default 1). Remaining items overflow to More. */
  afterCenterCount?: number
  /** Accent color for active state — defaults to emerald */
  accent?: 'emerald' | 'blue'
  /** The current active view id — used to highlight the active tab */
  activeView?: string
  /** Callback when a tab item is clicked */
  onItemSelect: (id: string) => void
  /** Title for the More popup */
  moreTitle?: string
}

/* ─── Popup Overlay + Panel ─── */
function BottomPopup({
  open,
  onClose,
  title,
  subtitle,
  accent,
  activeView,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  accent: 'emerald' | 'blue'
  activeView?: string
  children: React.ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Delay to avoid the opening click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler)
      document.addEventListener('touchstart', handler)
    }, 50)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] md:hidden"
            onClick={onClose}
          />

          {/* Popup panel - sits right above the bottom bar */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28, mass: 0.8 }}
            className="fixed bottom-[68px] left-3 right-3 z-[61] md:hidden"
          >
            <div className="rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                <div>
                  <h3 className="text-[15px] font-bold text-foreground">{title}</h3>
                  {subtitle && (
                    <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="flex size-7 items-center justify-center rounded-full bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-3 pb-3">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ─── Tab Item Renderer ─── */
function TabItem({
  item,
  isActive,
  accentClasses,
  onClick,
}: {
  item: BottomBarItem
  isActive: boolean
  accentClasses: { active: string; indicator: string; bg: string }
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-0.5 min-w-[48px] py-1 ios-press transition-colors duration-200 relative',
        isActive ? accentClasses.active : 'text-muted-foreground/60'
      )}
    >
      <div className={cn(
        'transition-transform duration-200',
        isActive && 'scale-110'
      )}>
        {item.icon}
      </div>
      <span className={cn(
        'text-[10px] font-medium transition-all duration-200',
        isActive && 'font-semibold'
      )}>
        {item.label}
      </span>
      {isActive && (
        <motion.div
          layoutId={`${accentClasses.indicator}TabIndicator-${item.id}`}
          className={cn('absolute -top-0.5 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full', accentClasses.indicator)}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  )
}

/* ─── Main Component ─── */

export function MobileBottomBar({
  items,
  moreItems,
  centerButton,
  beforeCenterCount = 2,
  afterCenterCount = 1,
  accent = 'emerald',
  activeView,
  onItemSelect,
  moreTitle = 'More',
}: MobileBottomBarProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  // When centerButton exists: split items into before-center and after-center groups
  // When no centerButton: show up to 4 items + More
  const beforeItems = centerButton ? items.slice(0, beforeCenterCount) : items.slice(0, 4)
  const afterItems = centerButton ? items.slice(beforeCenterCount, beforeCenterCount + afterCenterCount) : []

  const isMoreActive = moreItems.some(m => m.id === activeView)

  const accentClasses = accent === 'blue'
    ? { active: 'text-blue-600 dark:text-blue-400', indicator: 'bg-blue-500', bg: 'bg-blue-500/10' }
    : { active: 'text-emerald-600 dark:text-emerald-400', indicator: 'bg-emerald-500', bg: 'bg-emerald-500/10' }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 pb-safe md:hidden">
        <div className="flex items-center justify-around px-1 pt-1 pb-1">
          {/* Items BEFORE center button */}
          {beforeItems.map((item) => (
            <TabItem
              key={item.id}
              item={item}
              isActive={activeView === item.id}
              accentClasses={accentClasses}
              onClick={() => onItemSelect(item.id)}
            />
          ))}

          {/* Center Button (Plus) */}
          {centerButton && (
            <button
              onClick={() => setCreateOpen(true)}
              className="flex flex-col items-center gap-0.5 min-w-[56px] ios-press relative"
            >
              <div className={cn(
                'flex size-12 items-center justify-center rounded-2xl text-white -mt-5 ios-shadow-lg transition-transform duration-200 active:scale-95',
                accent === 'blue'
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600'
              )}>
                {centerButton.icon}
              </div>
              <span className="text-[10px] font-medium text-muted-foreground/60 mt-0.5">
                {centerButton.label}
              </span>
            </button>
          )}

          {/* Items AFTER center button */}
          {afterItems.map((item) => (
            <TabItem
              key={item.id}
              item={item}
              isActive={activeView === item.id}
              accentClasses={accentClasses}
              onClick={() => onItemSelect(item.id)}
            />
          ))}

          {/* More Button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex flex-col items-center gap-0.5 min-w-[48px] py-1 ios-press transition-colors duration-200 relative',
              isMoreActive ? accentClasses.active : 'text-muted-foreground/60'
            )}
          >
            <div className="size-[22px] flex flex-col items-center justify-center gap-[3px]">
              <div className="flex gap-[3px]">
                <span className={cn('size-[5px] rounded-full', isMoreActive ? accentClasses.indicator : 'bg-current')} />
                <span className={cn('size-[5px] rounded-full', isMoreActive ? accentClasses.indicator : 'bg-current')} />
                <span className={cn('size-[5px] rounded-full', isMoreActive ? accentClasses.indicator : 'bg-current')} />
              </div>
              <div className="flex gap-[3px]">
                <span className={cn('size-[5px] rounded-full', isMoreActive ? accentClasses.indicator : 'bg-current')} />
                <span className={cn('size-[5px] rounded-full', isMoreActive ? accentClasses.indicator : 'bg-current')} />
                <span className={cn('size-[5px] rounded-full', isMoreActive ? accentClasses.indicator : 'bg-current')} />
              </div>
            </div>
            <span className={cn(
              'text-[10px] font-medium transition-all duration-200',
              isMoreActive && 'font-semibold'
            )}>
              More
            </span>
          </button>
        </div>
      </nav>

      {/* More Menu Popup */}
      <BottomPopup
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title={moreTitle}
        subtitle="Quick access to all sections"
        accent={accent}
        activeView={activeView}
      >
        <div className="grid grid-cols-4 gap-1">
          {moreItems.map((item) => {
            const isActive = activeView === item.id
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  item.onClick()
                  setMoreOpen(false)
                }}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition-colors duration-200',
                  isActive
                    ? cn(accentClasses.bg, accentClasses.active)
                    : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn(
                  'flex size-9 items-center justify-center rounded-lg transition-colors',
                  isActive
                    ? cn(accentClasses.bg, accentClasses.active)
                    : 'bg-muted/60'
                )}>
                  <span className={cn(isActive && item.iconColor)}>
                    {item.icon}
                  </span>
                </div>
                <span className="text-[10px] font-medium leading-tight text-center line-clamp-2">
                  {item.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </BottomPopup>

      {/* Create Options Popup (for instructor center button) */}
      {centerButton && (
        <BottomPopup
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Create New"
          subtitle="What would you like to create?"
          accent={accent}
          activeView={activeView}
        >
          <div className="space-y-1.5">
            <button
              onClick={() => {
                const { setEditingCourseId, setCurrentView } = useAppStore.getState()
                setEditingCourseId(null)
                setCurrentView('course-creator')
                setCreateOpen(false)
              }}
              className="w-full flex items-center gap-3 rounded-xl p-3 transition-colors duration-200 hover:bg-accent/50 text-left group"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <Plus className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold">Create Course</p>
                <p className="text-[11px] text-muted-foreground">Build a new course from scratch</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
            </button>
            <button
              onClick={() => {
                const { setCurrentView } = useAppStore.getState()
                setCurrentView('instructor-assignments')
                setCreateOpen(false)
              }}
              className="w-full flex items-center gap-3 rounded-xl p-3 transition-colors duration-200 hover:bg-accent/50 text-left group"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Plus className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold">Create Assignment</p>
                <p className="text-[11px] text-muted-foreground">Add a new assignment for your students</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
            </button>
          </div>
        </BottomPopup>
      )}
    </>
  )
}
