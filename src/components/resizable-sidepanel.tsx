'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'
import { ShijlAIText } from '@/components/ui/brand-text'
import { cn } from '@/lib/utils'

interface ResizableSidepanelProps {
  /** Sidepanel header content — visible when expanded */
  header: React.ReactNode
  /** Sidepanel body content — hidden when minimized */
  children: React.ReactNode
  /** Default width in pixels */
  defaultWidth?: number
  /** Minimum width in pixels */
  minWidth?: number
  /** Maximum width in pixels */
  maxWidth?: number
  /** Whether to show on desktop (lg breakpoint). Default: true */
  showOnDesktop?: boolean
  /** Additional class names for the panel container */
  className?: string
  /** Unique storage key for persisting width. If omitted, width is not persisted */
  storageKey?: string
}

/**
 * A resizable, minimizable sidepanel component.
 * - Drag the left edge to resize horizontally (double-arrow cursor on hover)
 * - Click X button to minimize to a floating "Ask ShijlAI" button
 * - Click the floating button to restore the full panel
 * - Width is persisted in localStorage if storageKey is provided
 */
export function ResizableSidepanel({
  header,
  children,
  defaultWidth = 340,
  minWidth = 280,
  maxWidth = 600,
  showOnDesktop = true,
  className,
  storageKey,
}: ResizableSidepanelProps) {
  // Load persisted width
  const getStoredWidth = useCallback(() => {
    if (!storageKey || typeof window === 'undefined') return defaultWidth
    try {
      const stored = localStorage.getItem(`sidepanel-width-${storageKey}`)
      return stored ? Math.min(maxWidth, Math.max(minWidth, parseInt(stored, 10))) : defaultWidth
    } catch {
      return defaultWidth
    }
  }, [defaultWidth, maxWidth, minWidth, storageKey])

  const [expandedWidth, setExpandedWidth] = useState(() => getStoredWidth())
  const [isMinimized, setIsMinimized] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  // Persist width changes
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined' && !isMinimized) {
      try {
        localStorage.setItem(`sidepanel-width-${storageKey}`, String(expandedWidth))
      } catch {
        // Silently fail
      }
    }
  }, [expandedWidth, storageKey, isMinimized])

  // Handle mouse/touch move during resize
  const handleResizeMove = useCallback((clientX: number) => {
    const delta = startXRef.current - clientX // Moving left = expanding
    const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + delta))
    setExpandedWidth(newWidth)
  }, [maxWidth, minWidth])

  const handleResizeStart = useCallback((clientX: number) => {
    setIsResizing(true)
    startXRef.current = clientX
    startWidthRef.current = expandedWidth
  }, [expandedWidth])

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
  }, [])

  // Mouse events for resizing
  useEffect(() => {
    if (!isResizing) return

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      handleResizeMove(e.clientX)
    }
    const onMouseUp = () => handleResizeEnd()
    const onTouchMove = (e: TouchEvent) => {
      handleResizeMove(e.touches[0].clientX)
    }
    const onTouchEnd = () => handleResizeEnd()

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('touchmove', onTouchMove)
    document.addEventListener('touchend', onTouchEnd)

    // Prevent text selection during resize
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'ew-resize'

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isResizing, handleResizeMove, handleResizeEnd])

  const minimize = () => setIsMinimized(true)
  const expand = () => setIsMinimized(false)

  return (
    <>
      {/* ═══ MINIMIZED STATE: Floating "Ask ShijlAI" button ═══ */}
      <AnimatePresence>
        {isMinimized && (
          <motion.button
            key="minimized-fab"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={expand}
            className={cn(
              'fixed bottom-6 right-6 z-50 hidden lg:flex items-center gap-2.5',
              'px-4 py-3 rounded-2xl',
              'bg-gradient-to-r from-emerald-500 to-teal-600 text-white',
              'shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30',
              'hover:from-emerald-600 hover:to-teal-700',
              'transition-all active:scale-95 group cursor-pointer',
              className
            )}
            title="Open Ask ShijlAI"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-white/20 shrink-0 group-hover:bg-white/30 transition-colors">
              <Sparkles className="size-4" />
            </div>
            <span className="text-[13px] font-semibold whitespace-nowrap">
              Ask <ShijlAIText />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ═══ EXPANDED STATE: Full sidepanel ═══ */}
      {!isMinimized && (
        <motion.div
          ref={panelRef}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: expandedWidth, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            'hidden lg:flex shrink-0 border-l border-border/40 bg-card flex-col h-full relative',
            isResizing && 'pointer-events-none',
            className
          )}
          style={{ width: expandedWidth }}
        >
          {/* Resize Handle (left edge) with double-arrow cursor */}
          <div
            onMouseDown={(e) => {
              e.preventDefault()
              handleResizeStart(e.clientX)
            }}
            onTouchStart={(e) => {
              handleResizeStart(e.touches[0].clientX)
            }}
            className={cn(
              'absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize z-10 group',
              'hover:bg-emerald-500/10 transition-colors duration-150',
              isResizing && 'bg-emerald-500/20'
            )}
          >
            {/* Grip dots indicator on hover */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex flex-col gap-[2px]">
                <div className="flex gap-[2px]">
                  <div className="size-[3px] rounded-full bg-emerald-500/40" />
                  <div className="size-[3px] rounded-full bg-emerald-500/40" />
                </div>
                <div className="flex gap-[2px]">
                  <div className="size-[3px] rounded-full bg-emerald-500/40" />
                  <div className="size-[3px] rounded-full bg-emerald-500/40" />
                </div>
                <div className="flex gap-[2px]">
                  <div className="size-[3px] rounded-full bg-emerald-500/40" />
                  <div className="size-[3px] rounded-full bg-emerald-500/40" />
                </div>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="relative shrink-0">
            {header}

            {/* Close / X Button */}
            <button
              onClick={minimize}
              className="absolute top-2 right-2 z-20 flex size-6 items-center justify-center rounded-md bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/30 transition-colors"
              title="Minimize panel"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {children}
          </div>

          {/* Resize indicator (shows current width during drag) */}
          <AnimatePresence>
            {isResizing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-background/90 border border-border/50 shadow-lg px-3 py-1.5 z-30"
              >
                <span className="text-[11px] font-medium text-foreground">{expandedWidth}px</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  )
}
