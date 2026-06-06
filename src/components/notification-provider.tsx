'use client'

import { useState, useEffect, useCallback, useRef, createContext, useContext, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, X, CheckCircle, AlertTriangle, AlertCircle, Info,
  ExternalLink, Loader2, BookOpen, DollarSign, Shield,
  MessageSquare, Users, Gift, Settings, Megaphone, Clock,
  Star, BookmarkCheck, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

// ─── Types ──────────────────────────────────────────────────────────────────

interface NotificationItem {
  id: string
  type: string
  title: string
  content: string
  icon: string | null
  link: string | null
  isRead: boolean
  priority: string
  category: string
  actionUrl: string | null
  actionLabel: string | null
  dismissLabel: string | null
  isPinned: boolean
  createdAt: string
  expiresAt: string | null
}

interface NotificationContextType {
  notifications: NotificationItem[]
  unreadCount: number
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  dismissNotification: (id: string) => void
  refreshNotifications: () => void
  isLoading: boolean
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}

// ─── Category config ────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, {
  gradient: string
  bgLight: string
  icon: ReactNode
}> = {
  academic: {
    gradient: 'from-blue-500 to-blue-600',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    icon: <BookOpen className="size-3.5" />,
  },
  financial: {
    gradient: 'from-emerald-500 to-emerald-600',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    icon: <DollarSign className="size-3.5" />,
  },
  social: {
    gradient: 'from-violet-500 to-violet-600',
    bgLight: 'bg-violet-50 dark:bg-violet-950/40',
    icon: <Users className="size-3.5" />,
  },
  system: {
    gradient: 'from-slate-500 to-slate-600',
    bgLight: 'bg-slate-50 dark:bg-slate-800/40',
    icon: <Settings className="size-3.5" />,
  },
  security: {
    gradient: 'from-red-500 to-red-600',
    bgLight: 'bg-red-50 dark:bg-red-950/40',
    icon: <Shield className="size-3.5" />,
  },
  general: {
    gradient: 'from-indigo-500 to-indigo-600',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/40',
    icon: <Bell className="size-3.5" />,
  },
}

function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general
}

// ─── Type icon mapper ───────────────────────────────────────────────────────

function getTypeIcon(type: string, className = 'size-3.5') {
  const icons: Record<string, ReactNode> = {
    enrollment: <BookOpen className={className} />,
    qa: <MessageSquare className={className} />,
    review: <Star className={className} />,
    assignment: <BookmarkCheck className={className} />,
    message: <MessageSquare className={className} />,
    payout: <DollarSign className={className} />,
    system: <Settings className={className} />,
    promotion: <Megaphone className={className} />,
    achievement: <Gift className={className} />,
    reminder: <Clock className={className} />,
    security: <Shield className={className} />,
    social: <Users className={className} />,
    course_update: <BookOpen className={className} />,
    live_session: <Zap className={className} />,
  }
  return icons[type] || <Bell className={className} />
}

// ─── Priority config ────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<string, {
  label: string
  accentClass: string
  borderClass: string
  badgeClass: string
  glowClass: string
}> = {
  urgent: {
    label: 'Urgent',
    accentClass: 'text-red-600 dark:text-red-400',
    borderClass: 'border-l-red-500 dark:border-l-red-400',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
    glowClass: 'shadow-red-200/50 dark:shadow-red-900/30',
  },
  high: {
    label: 'High',
    accentClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-l-amber-500 dark:border-l-amber-400',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    glowClass: 'shadow-amber-200/50 dark:shadow-amber-900/30',
  },
  normal: {
    label: '',
    accentClass: '',
    borderClass: '',
    badgeClass: '',
    glowClass: '',
  },
}

function getPriorityConfig(priority: string) {
  return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.normal
}

// ─── Relative time helper ───────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = new Date().getTime()
  const then = new Date(dateStr).getTime()
  const diff = now - then

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Animation variants ─────────────────────────────────────────────────────

const popupVariants = {
  initial: { opacity: 0, y: -12, scale: 0.96, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, x: 60, scale: 0.95, filter: 'blur(2px)' },
}

const popupTransition = { type: 'spring' as const, stiffness: 500, damping: 30, mass: 0.8 }

// ─── Provider Component ─────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAppStore()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [popupQueue, setPopupQueue] = useState<NotificationItem[]>([])
  const fetchInterval = useRef<NodeJS.Timeout | null>(null)
  const lastFetchTime = useRef<number>(0)

  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) return
    const now = Date.now()
    if (now - lastFetchTime.current < 5000) return
    lastFetchTime.current = now

    try {
      setIsLoading(true)
      const roleParam = currentUser?.role ? `&role=${currentUser.role}` : ''
      const res = await fetch(`/api/notifications?userId=${currentUser.id}&limit=20&filter=unread${roleParam}`)
      if (!res.ok) return
      const data = await res.json()
      const newNotifs = data.notifications || []
      setNotifications(newNotifs)
      setUnreadCount(data.counts?.unread || 0)

      const previousIds = new Set(notifications.map(n => n.id))
      const freshNotifs = newNotifs.filter(
        (n: NotificationItem) => !previousIds.has(n.id) && !n.isRead && n.priority !== 'normal'
      )
      if (freshNotifs.length > 0) {
        setPopupQueue(prev => [...prev, ...freshNotifs.slice(0, 3)])
      }
    } catch {
      // Silent
    } finally {
      setIsLoading(false)
    }
  }, [currentUser?.id, currentUser?.role, notifications])

  useEffect(() => {
    if (!currentUser?.id) return
    const init = async () => {
      try {
        await fetch(`/api/notifications/seed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id }),
        })
      } catch { /* ignore */ }
      fetchNotifications()
    }
    init()
  }, [currentUser?.id, fetchNotifications])  // Note: seed already reads role from DB

  useEffect(() => {
    if (!currentUser?.id) return
    fetchInterval.current = setInterval(fetchNotifications, 30000)
    return () => {
      if (fetchInterval.current) clearInterval(fetchInterval.current)
    }
  }, [currentUser?.id, fetchNotifications])

  const markAsRead = useCallback(async (id: string) => {
    if (!currentUser?.id) return
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', notificationIds: [id], userId: currentUser.id }),
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* silent */ }
  }, [currentUser?.id])

  const markAllAsRead = useCallback(async () => {
    if (!currentUser?.id) return
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', userId: currentUser.id }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch { /* silent */ }
  }, [currentUser?.id])

  const dismissNotification = useCallback(async (id: string) => {
    if (!currentUser?.id) return
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive', notificationIds: [id], userId: currentUser.id }),
      })
      setNotifications(prev => {
        const notif = prev.find(n => n.id === id)
        if (notif && !notif.isRead) setUnreadCount(p => Math.max(0, p - 1))
        return prev.filter(n => n.id !== id)
      })
    } catch { /* silent */ }
  }, [currentUser?.id])

  const dismissPopup = useCallback((id: string) => {
    setPopupQueue(prev => prev.filter(n => n.id !== id))
  }, [])

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    isOpen,
    setIsOpen,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    refreshNotifications: fetchNotifications,
    isLoading,
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}

      {/* ═══════════════════════════════════════════════════════════════════
          NOTIFICATION POPUP TOASTS — Modern card design with left accent
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="fixed top-4 right-4 z-[90] flex flex-col gap-3 pointer-events-none w-[360px]">
        <AnimatePresence mode="popLayout">
          {popupQueue.slice(0, 3).map((notif) => {
            const catConfig = getCategoryConfig(notif.category)
            const priConfig = getPriorityConfig(notif.priority)
            const isUrgentOrHigh = notif.priority === 'urgent' || notif.priority === 'high'

            return (
              <motion.div
                key={notif.id}
                variants={popupVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={popupTransition}
                layout
                className={cn(
                  'pointer-events-auto w-full rounded-xl overflow-hidden',
                  'bg-white dark:bg-zinc-900 border border-border/60',
                  'shadow-lg shadow-black/[0.04] dark:shadow-black/20',
                  isUrgentOrHigh && `shadow-md ${priConfig.glowClass}`,
                )}
              >
                <div className="flex">
                  {/* Left accent bar */}
                  <div className={cn(
                    'w-1 shrink-0 bg-gradient-to-b',
                    catConfig.gradient,
                    isUrgentOrHigh && 'w-1.5',
                  )} />

                  <div className="flex-1 min-w-0">
                    {/* Header row: type icon + title + priority badge + close */}
                    <div className="flex items-start gap-2.5 px-3 pt-3 pb-1">
                      {/* Type icon */}
                      <div className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white',
                        catConfig.gradient,
                      )}>
                        {getTypeIcon(notif.type)}
                      </div>

                      {/* Title + meta */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-semibold leading-tight truncate">
                            {notif.title}
                          </p>
                          {priConfig.label && (
                            <span className={cn(
                              'shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider leading-none',
                              priConfig.badgeClass,
                            )}>
                              {priConfig.label}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                          {notif.content}
                        </p>
                      </div>

                      {/* Close button */}
                      <button
                        onClick={() => dismissPopup(notif.id)}
                        className="shrink-0 -mt-0.5 -mr-0.5 size-6 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>

                    {/* Footer: time + action buttons */}
                    <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
                      <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                        {timeAgo(notif.createdAt)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {notif.actionLabel && notif.actionUrl && (
                          <button
                            onClick={() => {
                              markAsRead(notif.id)
                              dismissPopup(notif.id)
                            }}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold',
                              'bg-gradient-to-br text-white shadow-sm',
                              catConfig.gradient,
                              'hover:opacity-90 active:scale-[0.97] transition-all',
                            )}
                          >
                            {notif.actionLabel}
                          </button>
                        )}
                        <button
                          onClick={() => { markAsRead(notif.id); dismissPopup(notif.id) }}
                          className="inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        >
                          {notif.dismissLabel || 'Dismiss'}
                        </button>
                      </div>
                    </div>

                    {/* Auto-dismiss progress bar */}
                    <AutoDismissBar
                      onDismiss={() => dismissPopup(notif.id)}
                      duration={notif.priority === 'urgent' ? 12000 : 8000}
                      colorClass={cn('bg-gradient-to-r', catConfig.gradient)}
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          NOTIFICATION DROPDOWN PANEL — Inbox-style with category badges
          ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80]"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="fixed top-16 right-2 sm:right-4 left-2 sm:left-auto z-[85] sm:w-[400px] max-h-[80vh] sm:max-h-[540px] rounded-2xl border bg-white dark:bg-zinc-900 shadow-2xl shadow-black/[0.06] dark:shadow-black/30 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b bg-gradient-to-r from-muted/50 to-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white">
                    <Bell className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold leading-tight">Notifications</h3>
                    {unreadCount > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        {unreadCount} unread
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-semibold text-primary hover:underline px-2.5 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              {/* Notification list */}
              <div className="overflow-y-auto flex-1 min-h-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
                {isLoading && notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="rounded-2xl bg-muted/30 p-3">
                      <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                    <p className="text-[13px] text-muted-foreground">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-3">
                      <CheckCircle className="size-7 text-emerald-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-[14px] font-semibold">All caught up!</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">No new notifications</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-1">
                    {notifications.slice(0, 15).map((notif) => {
                      const catConfig = getCategoryConfig(notif.category)
                      const priConfig = getPriorityConfig(notif.priority)

                      return (
                        <div
                          key={notif.id}
                          className={cn(
                            'group relative px-4 py-3 transition-colors cursor-pointer',
                            'hover:bg-muted/30',
                            !notif.isRead && 'bg-primary/[0.02]',
                          )}
                          onClick={() => markAsRead(notif.id)}
                        >
                          {/* Unread indicator dot */}
                          {!notif.isRead && (
                            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 size-2 rounded-full bg-primary shadow-sm shadow-primary/30" />
                          )}

                          <div className="flex items-start gap-3">
                            {/* Category icon */}
                            <div className={cn(
                              'flex size-9 shrink-0 items-center justify-center rounded-xl text-white mt-0.5',
                              'bg-gradient-to-br shadow-sm',
                              catConfig.gradient,
                            )}>
                              {getTypeIcon(notif.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className={cn(
                                  'text-[13px] truncate leading-tight',
                                  !notif.isRead ? 'font-semibold' : 'font-medium text-muted-foreground',
                                )}>
                                  {notif.title}
                                </p>
                                {priConfig.label && (
                                  <span className={cn(
                                    'shrink-0 rounded px-1.5 py-px text-[9px] font-bold uppercase tracking-wider leading-none',
                                    priConfig.badgeClass,
                                  )}>
                                    {priConfig.label}
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5 leading-snug">
                                {notif.content}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                                  {timeAgo(notif.createdAt)}
                                </span>
                                {notif.actionLabel && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary hover:underline">
                                    {notif.actionLabel}
                                    <ExternalLink className="size-2.5" />
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Category pill */}
                            <div className={cn(
                              'shrink-0 self-start rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider leading-none',
                              catConfig.bgLight,
                              'opacity-0 group-hover:opacity-100 transition-opacity',
                            )}>
                              {notif.category}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t px-4 py-3 bg-muted/20">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    useAppStore.getState().setCurrentView('notifications')
                  }}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 rounded-xl py-2 text-[12px] font-semibold',
                    'text-primary hover:bg-primary/10 transition-colors',
                  )}
                >
                  View All Notifications
                  <ExternalLink className="size-3" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  )
}

// ─── Auto-dismiss progress bar ──────────────────────────────────────────────

function AutoDismissBar({
  onDismiss,
  duration,
  colorClass,
}: {
  onDismiss: () => void
  duration: number
  colorClass?: string
}) {
  const [progress, setProgress] = useState(100)
  const startTime = useRef(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime.current
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        onDismiss()
      }
    }, 100)
    return () => clearInterval(interval)
  }, [duration, onDismiss])

  return (
    <div className="h-[2px] bg-muted/20">
      <div
        className={cn('h-full transition-all duration-100 ease-linear opacity-60', colorClass || 'bg-primary/40')}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
