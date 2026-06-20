'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  MessageSquare,
  Inbox,
  ClipboardList,
  BarChart3,
  Brain,
  Calendar,
  DollarSign,

  Settings,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Moon,
  Sun,

  Bell,
  User,
  LogOut,
  Shield,
  CheckCheck,
  Plus,
  UserPlus,
  HelpCircle,
  Star,
  CreditCard,
  AlertTriangle,
  Info,
  Sparkles,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { resolveViewKey } from '@/lib/view-utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { InlineSearch, MobileExpandableSearch } from '@/components/universal-search'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { View, UserRole } from '@/lib/types'
import { MobileBottomBar } from '@/components/mobile-bottom-bar'
import type { BottomBarItem, MoreMenuAction } from '@/components/mobile-bottom-bar'
import { ShijlAIBrand, ShijlAIText } from '@/components/ui/brand-text'
import { ShijlAILogo } from '@/components/ui/shijlai-logo'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

/* ─── Time ago helper ─── */
function formatTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

/* ─── Notification type icon mapping ─── */
function getNotificationTypeIcon(type: string): { icon: React.ReactNode; color: string } {
  switch (type) {
    case 'enrollment':
      return { icon: <UserPlus className="size-4" />, color: 'text-emerald-500' }
    case 'qa':
      return { icon: <HelpCircle className="size-4" />, color: 'text-sky-500' }
    case 'review':
      return { icon: <Star className="size-4" />, color: 'text-amber-500' }
    case 'assignment':
      return { icon: <ClipboardList className="size-4" />, color: 'text-orange-500' }
    case 'message':
      return { icon: <MessageSquare className="size-4" />, color: 'text-blue-500' }
    case 'payout':
      return { icon: <CreditCard className="size-4" />, color: 'text-emerald-400' }
    case 'system':
      return { icon: <AlertTriangle className="size-4" />, color: 'text-slate-500' }
    case 'promotion':
      return { icon: <Sparkles className="size-4" />, color: 'text-rose-500' }
    default:
      return { icon: <Info className="size-4" />, color: 'text-muted-foreground' }
  }
}

/* ─── Real notification type from API ─── */
interface ApiNotification {
  id: string
  type: string
  title: string
  content: string
  icon: string | null
  link: string | null
  isRead: boolean
  readAt: string | null
  courseId: string | null
  senderId: string | null
  metadata: unknown
  createdAt: string
}

/* ─── Badge Counter Hook (enhanced with real data) ─── */
function useInstructorBadges() {
  const { currentUser } = useAppStore()
  const [badges, setBadges] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'instructor') return

    let cancelled = false

    const doFetch = async () => {
      try {
        const [coursesRes, studentsRes, assignmentsRes, quizzesRes, dashboardRes] = await Promise.allSettled([
          fetch(`/api/instructor/courses?instructorId=${currentUser.id}`),
          fetch(`/api/instructor/students?instructorId=${currentUser.id}`),
          fetch(`/api/instructor/assignments?instructorId=${currentUser.id}`),
          fetch(`/api/instructor/quizzes?instructorId=${currentUser.id}`),
          fetch(`/api/instructor/dashboard?instructorId=${currentUser.id}&period=30d`),
        ])

        if (cancelled) return

        const result: Record<string, number> = {}

        if (coursesRes.status === 'fulfilled' && coursesRes.value.ok) {
          const data = await coursesRes.value.json()
          result['instructor-courses'] = data.summary?.totalCourses || 0
        }
        if (studentsRes.status === 'fulfilled' && studentsRes.value.ok) {
          const data = await studentsRes.value.json()
          result['instructor-students'] = data.summary?.totalStudents || 0
        }
        if (assignmentsRes.status === 'fulfilled' && assignmentsRes.value.ok) {
          const data = await assignmentsRes.value.json()
          result['instructor-assignments'] = data.summary?.draftCount || data.summary?.totalAssignments || 0
        }
        if (quizzesRes.status === 'fulfilled' && quizzesRes.value.ok) {
          const data = await quizzesRes.value.json()
          result['instructor-quizzes'] = data.summary?.totalQuizzes || 0
        }
        // Dashboard actionRequired for Q&A unread and assignments pending
        if (dashboardRes.status === 'fulfilled' && dashboardRes.value.ok) {
          const data = await dashboardRes.value.json()
          if (data.actionRequired) {
            const qaAction = data.actionRequired.find((a: { type: string; count: number }) => a.type === 'qa')
            const assignmentsAction = data.actionRequired.find((a: { type: string; count: number }) => a.type === 'assignments')
            if (qaAction && qaAction.count > 0) {
              result['instructor-qa'] = qaAction.count
            }
            if (assignmentsAction && assignmentsAction.count > 0) {
              result['instructor-assignments'] = assignmentsAction.count
            }
          }
        }

        if (!cancelled) setBadges(result)
      } catch {
        // Silently fail - badges are optional
      }
    }

    doFetch()
    // Refresh badges every 60 seconds
    const interval = setInterval(doFetch, 60_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [currentUser])

  return badges
}

interface NavItem {
  id: View
  label: React.ReactNode
  icon: React.ReactNode
  iconColor?: string
}

/* ─── Sidebar Section Interface ─── */
interface NavSection {
  title: string
  collapsible?: boolean
  items: NavItem[]
}

/* ─── Section icon map for collapsible sections ─── */
function getSectionIcon(title: string): { icon: React.ReactNode; color: string } {
  switch (title) {
    case 'LMS':
      return { icon: <GraduationCap className="size-[18px]" />, color: 'text-emerald-500' }
    default:
      return { icon: <ChevronDown className="size-[18px]" />, color: 'text-muted-foreground' }
  }
}

/* ─── Instructor Nav Sections ─── */
const instructorNavSections: NavSection[] = [
  {
    title: 'LMS',
    collapsible: true,
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-[18px]" />, iconColor: 'text-emerald-500' },
      { id: 'instructor-courses', label: 'Courses', icon: <BookOpen className="size-[18px]" />, iconColor: 'text-teal-500' },
      { id: 'instructor-students', label: 'Students', icon: <Users className="size-[18px]" />, iconColor: 'text-cyan-500' },
      { id: 'instructor-assignments', label: 'Assignments', icon: <ClipboardList className="size-[18px]" />, iconColor: 'text-amber-500' },
      { id: 'instructor-qa', label: 'Q&A', icon: <MessageSquare className="size-[18px]" />, iconColor: 'text-sky-500' },
      { id: 'instructor-schedule', label: 'Schedule', icon: <Calendar className="size-[18px]" />, iconColor: 'text-violet-500' },
    ],
  },
  {
    title: '',
    items: [
      { id: 'instructor-analytics', label: 'Intelligent Analytics', icon: <Brain className="size-[18px]" />, iconColor: 'text-pink-500' },
      { id: 'instructor-copilot', label: 'AI Copilot', icon: <Sparkles className="size-[18px]" />, iconColor: 'text-emerald-400' },
      { id: 'instructor-assessment', label: 'Smart Assessment', icon: <BarChart3 className="size-[18px]" />, iconColor: 'text-orange-500' },
      { id: 'instructor-revenue', label: 'Revenue', icon: <DollarSign className="size-[18px]" />, iconColor: 'text-emerald-400' },
    ],
  },
  {
    title: '',
    items: [
      { id: 'instructor-messages', label: 'Messages', icon: <Inbox className="size-[18px]" />, iconColor: 'text-blue-500' },
      { id: 'instructor-profile', label: 'Profile', icon: <User className="size-[18px]" />, iconColor: 'text-violet-500' },
      { id: 'notifications', label: 'Notifications', icon: <Bell className="size-[18px]" />, iconColor: 'text-indigo-500' },
      { id: 'instructor-settings', label: 'Settings', icon: <Settings className="size-[18px]" />, iconColor: 'text-slate-500' },
    ],
  },
]

/* ─── Instructor Mobile Bottom Bar Items ─── */
/* Layout: [Home] [Courses] [⊕ Create] [AI Copilot] [More] */
const instructorBottomItems: BottomBarItem[] = [
  { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="size-[22px]" /> },
  { id: 'instructor-courses', label: 'Courses', icon: <BookOpen className="size-[22px]" /> },
  { id: 'instructor-copilot', label: 'Copilot', icon: <Sparkles className="size-[22px]" /> },
]

const instructorMoreItems: MoreMenuAction[] = [
  { id: 'instructor-students', label: 'Students', icon: <Users className="size-[18px]" />, iconColor: 'text-cyan-500', onClick: () => useAppStore.getState().setCurrentView('instructor-students') },
  { id: 'instructor-analytics', label: 'Intelligent Analytics', icon: <Brain className="size-[18px]" />, iconColor: 'text-pink-500', onClick: () => useAppStore.getState().setCurrentView('instructor-analytics') },
  { id: 'instructor-qa', label: 'Q&A', icon: <MessageSquare className="size-[18px]" />, iconColor: 'text-sky-500', onClick: () => useAppStore.getState().setCurrentView('instructor-qa') },
  { id: 'instructor-messages', label: 'Messages', icon: <Inbox className="size-[18px]" />, iconColor: 'text-blue-500', onClick: () => useAppStore.getState().setCurrentView('instructor-messages') },
  { id: 'instructor-assignments', label: 'Assignments', icon: <ClipboardList className="size-[18px]" />, iconColor: 'text-amber-500', onClick: () => useAppStore.getState().setCurrentView('instructor-assignments') },
  { id: 'instructor-schedule', label: 'Schedule', icon: <Calendar className="size-[18px]" />, iconColor: 'text-violet-500', onClick: () => useAppStore.getState().setCurrentView('instructor-schedule') },
  { id: 'instructor-revenue', label: 'Revenue', icon: <DollarSign className="size-[18px]" />, iconColor: 'text-emerald-400', onClick: () => useAppStore.getState().setCurrentView('instructor-revenue') },
  { id: 'instructor-assessment', label: 'Smart Assessment', icon: <BarChart3 className="size-[18px]" />, iconColor: 'text-orange-500', onClick: () => useAppStore.getState().setCurrentView('instructor-assessment') },
  { id: 'instructor-profile', label: 'Profile', icon: <User className="size-[18px]" />, iconColor: 'text-violet-500', onClick: () => useAppStore.getState().setCurrentView('instructor-profile') },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="size-[18px]" />, iconColor: 'text-indigo-500', onClick: () => useAppStore.getState().setCurrentView('notifications') },
  { id: 'instructor-settings', label: 'Settings', icon: <Settings className="size-[18px]" />, iconColor: 'text-slate-500', onClick: () => useAppStore.getState().setCurrentView('instructor-settings') },
]

/* ─── Nav Item Button ─── */
function NavItemButton({
  item,
  isActive,
  sidebarOpen,
  badgeCount,
  onClick,
  isSecondary,
}: {
  item: NavItem
  isActive: boolean
  sidebarOpen: boolean
  badgeCount?: number
  onClick: () => void
  isSecondary?: boolean
}) {
  // Collapsed sidebar
  if (!sidebarOpen) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'flex size-10 w-full items-center justify-center rounded-full transition-all duration-200 ios-press relative',
              isActive
                ? 'bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-primary shadow-sm shadow-emerald-500/10'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {item.icon}
            {badgeCount !== undefined && badgeCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex min-w-[16px] h-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white px-1">
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="rounded-xl">
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  // Expanded sidebar
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ios-press relative',
        isSecondary && 'py-2 text-[12px]',
        isActive
          ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent text-primary shadow-sm shadow-emerald-500/5'
          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
      )}
    >
      {/* Active left indicator bar */}
      {isActive && (
        <motion.div
          layoutId="instructorSidebarActiveIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-emerald-500 to-teal-500"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}

      {/* Icon with colored background on active */}
      <div className={cn(
        'flex items-center justify-center rounded-full transition-all duration-200 shrink-0',
        isSecondary ? 'size-7' : 'size-8',
        isActive
          ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/15'
          : 'group-hover:bg-accent/60'
      )}>
        <span className={cn(
          'transition-colors duration-200',
          isActive ? item.iconColor || 'text-primary' : ''
        )}>
          {item.icon}
        </span>
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="overflow-hidden whitespace-nowrap flex-1 text-left"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Badge */}
      {sidebarOpen && badgeCount !== undefined && badgeCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex min-w-[20px] h-5 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-1.5 shrink-0"
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </motion.span>
      )}

      {/* Active dot indicator (right side) */}
      {isActive && sidebarOpen && (
        <motion.div
          layoutId="instructorSidebarActiveDot"
          className="ml-auto size-[6px] rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  )
}

/* ─── Role switching helpers ─── */
const roleLabels: Record<UserRole, string> = {
  student: 'Student',
  instructor: 'Instructor',
  admin: 'Admin',
  parent: 'Parent',
}

const roleIcons: Record<UserRole, React.ReactNode> = {
  student: <GraduationCap className="size-4" />,
  instructor: <BookOpen className="size-4" />,
  admin: <Shield className="size-4" />,
  parent: <User className="size-4" />,
}

/* ═══════════════════════════════════════════════════════════
   INSTRUCTOR SIDEBAR
   ═══════════════════════════════════════════════════════════ */
export function InstructorSidebar() {
  const {
    currentView,
    setCurrentView,
    currentUser,
    sidebarOpen,
    setSidebarOpen,
  } = useAppStore()

  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  const isMobile = useIsMobile()

  const instructorBadges = useInstructorBadges()

  // Collapsible section state — track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    instructorNavSections.forEach((section) => {
      if (section.collapsible && section.title) {
        const hasActiveItem = section.items.some(
          (item) => item.id === currentView
        )
        initial[section.title] = hasActiveItem
      }
    })
    return initial
  })

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  const isSectionExpanded = (title: string) => expandedSections[title] ?? false

  // Close mobile sidebar on mount (sidebarOpen defaults to true for desktop)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [setSidebarOpen])

  return (
    <>
      {/* Mobile Sidebar Drawer - only opens on mobile */}
      <Sheet open={isMobile && sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0 md:hidden top-14 h-[calc(100vh-3.5rem)] rounded-r-2xl border-r-0">
          {/* Header */}
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="flex items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                <BookOpen className="size-4" />
              </div>
              <span className="text-[16px] font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">Instructor Portal</span>
            </SheetTitle>
            <SheetDescription className="sr-only">Navigation menu</SheetDescription>
          </SheetHeader>

          {/* Create Course CTA */}
          <div className="mx-3 mb-2">
            <button
              onClick={() => {
                const { setEditingCourseId, setCurrentView } = useAppStore.getState()
                setEditingCourseId(null)
                setCurrentView('course-creator')
                setSidebarOpen(false)
              }}
              className="w-full flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-3 py-2.5 text-[13px] font-semibold ios-shadow-sm ios-press transition-all"
            >
              <Plus className="size-4 shrink-0" />
              <span className="truncate">Create New Course</span>
            </button>
          </div>

          {/* Nav Items — Sectioned */}
          <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-1">
            {instructorNavSections.map((section, sectionIdx) => {
              const isExpanded = section.collapsible ? isSectionExpanded(section.title) : true
              const hasActiveItem = section.items.some(item => resolveViewKey(currentView, currentUser?.role) === item.id || currentView === item.id)

              return (
              <div key={sectionIdx} className={sectionIdx > 0 ? 'mt-3' : ''}>
                {section.title && section.collapsible && (
                  <button
                    onClick={() => toggleSection(section.title)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 rounded-[12px] text-[13px] font-semibold transition-all duration-200',
                      hasActiveItem
                        ? 'text-primary bg-emerald-500/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    <span className={cn('shrink-0', getSectionIcon(section.title).color)}>{getSectionIcon(section.title).icon}</span>
                    <span className="flex-1 text-left">{section.title}</span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0"
                    >
                      <ChevronDown className="size-4 text-muted-foreground" />
                    </motion.div>
                  </button>
                )}
                {sectionIdx > 0 && !section.title && (
                  <Separator className="my-2 opacity-30" />
                )}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.ul
                      initial={section.collapsible ? { height: 0, opacity: 0 } : false}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className={cn('space-y-0.5 overflow-hidden', section.collapsible && 'ml-2')}
                    >
                      {section.items.map((item) => {
                        const isActive = resolveViewKey(currentView, currentUser?.role) === item.id || currentView === item.id || (item.id === 'instructor-copilot' && currentView === 'instructor-copilot')
                        const badgeCount = instructorBadges[item.id]
                        return (
                          <li key={item.id}>
                            <button
                              onClick={() => {
                                setCurrentView(item.id)
                                setSidebarOpen(false)
                              }}
                              className={cn(
                                'group flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ios-press relative',
                                section.collapsible && 'py-2 text-[12px]',
                                isActive
                                  ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent text-primary shadow-sm shadow-emerald-500/5'
                                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                              )}
                            >
                              {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-emerald-500 to-teal-500" />
                              )}
                              <div className={cn(
                                'flex items-center justify-center rounded-full transition-all duration-200 shrink-0',
                                section.collapsible ? 'size-7' : 'size-8',
                                isActive
                                  ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/15'
                                  : 'group-hover:bg-accent/60'
                              )}>
                                <span className={cn('transition-colors duration-200', isActive ? item.iconColor || 'text-primary' : '')}>
                                  {item.icon}
                                </span>
                              </div>
                              <span className="flex-1 text-left">{item.label}</span>
                              {badgeCount !== undefined && badgeCount > 0 && (
                                <span className="flex min-w-[20px] h-5 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-1.5 shrink-0">
                                  {badgeCount > 99 ? '99+' : badgeCount}
                                </span>
                              )}
                              {isActive && (
                                <div className="size-[6px] rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0" />
                              )}
                            </button>
                          </li>
                        )
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
              )
            })}
          </nav>

          {/* Bottom actions */}
          <div className="mx-3 mb-3 rounded-xl bg-muted/40 border border-border/30 p-2 flex items-center gap-1">
            <button
              onClick={() => { setTheme(isDark ? 'light' : 'dark') }}
              className="flex-1 flex flex-col items-center gap-1 rounded-lg py-2 px-1 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              <span className="text-[10px] leading-none">{isDark ? 'Light' : 'Dark'}</span>
            </button>
            <button
              onClick={() => toast.info('Help docs coming soon!')}
              className="flex-1 flex flex-col items-center gap-1 rounded-lg py-2 px-1 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              <HelpCircle className="size-4" />
              <span className="text-[10px] leading-none">Help</span>
            </button>
            <button
              onClick={() => {
                useAppStore.getState().logout()
                toast.success('Logged out successfully')
                setSidebarOpen(false)
              }}
              className="flex-1 flex flex-col items-center gap-1 rounded-lg py-2 px-1 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="size-4" />
              <span className="text-[10px] leading-none">Logout</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 68 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="hidden md:flex flex-col h-full rounded-[28px] overflow-hidden ios-glass-thick shrink-0 bg-gradient-to-b from-emerald-50/30 to-teal-50/20 dark:from-emerald-950/10 dark:to-teal-950/5"
      >
        {/* Portal identity area */}
        <div className="flex h-14 items-center gap-2.5 px-4">
          {!sidebarOpen ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  title="Expand sidebar"
                >
                  <ChevronRight className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="rounded-xl">Expand</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                <BookOpen className="size-4" />
              </div>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap flex-1"
                  >
                    <h1 className="text-[16px] font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent ml-1">Instructor Portal</h1>
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-auto hidden md:flex size-7 shrink-0 items-center justify-center rounded-full bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 border border-border/40 hover:border-border"
                title="Collapse sidebar"
              >
                <ChevronLeft className="size-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Create Course CTA */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-3 mb-2"
          >
            <button
              onClick={() => {
                const { setEditingCourseId, setCurrentView } = useAppStore.getState()
                setEditingCourseId(null)
                setCurrentView('course-creator')
              }}
              className="w-full flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-3 py-2.5 text-[13px] font-semibold ios-shadow-sm ios-press transition-all"
            >
              <Plus className="size-4 shrink-0" />
              <span className="truncate">Create New Course</span>
            </button>
          </motion.div>
        )}
        {!sidebarOpen && (
          <div className="px-3 mb-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    const { setEditingCourseId, setCurrentView } = useAppStore.getState()
                    setEditingCourseId(null)
                    setCurrentView('course-creator')
                  }}
                  className="flex size-10 w-full items-center justify-center rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                >
                  <Plus className="size-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="rounded-xl">Create New Course</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Main Navigation — Sectioned */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2">
          {instructorNavSections.map((section, sectionIdx) => {
            const isExpanded = section.collapsible ? isSectionExpanded(section.title) : true
            const hasActiveItem = section.items.some(item => resolveViewKey(currentView, currentUser?.role) === item.id || currentView === item.id)

            return (
            <div key={sectionIdx} className={sectionIdx > 0 ? 'mt-3' : ''}>
              {/* Collapsible section header */}
              {section.collapsible && sidebarOpen && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 rounded-[12px] text-[13px] font-semibold transition-all duration-200',
                    hasActiveItem
                      ? 'text-primary bg-emerald-500/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  <div className={cn(
                    'flex size-8 items-center justify-center rounded-full shrink-0',
                    hasActiveItem ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/15' : ''
                  )}>
                    <span className={getSectionIcon(section.title).color}>{getSectionIcon(section.title).icon}</span>
                  </div>
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="overflow-hidden whitespace-nowrap flex-1 text-left"
                      >
                        {section.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </motion.div>
                </button>
              )}
              {/* Collapsed sidebar: show section icon as toggle */}
              {section.collapsible && !sidebarOpen && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => toggleSection(section.title)}
                      className={cn(
                        'flex size-10 w-full items-center justify-center rounded-full transition-all duration-200 relative',
                        hasActiveItem
                          ? 'bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-primary shadow-sm shadow-emerald-500/10'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      <span className={getSectionIcon(section.title).color}>{getSectionIcon(section.title).icon}</span>
                      {hasActiveItem && (
                        <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="rounded-xl">
                    {section.title} {isExpanded ? '(expanded)' : '(collapsed)'}
                  </TooltipContent>
                </Tooltip>
              )}
              {/* Collapsed section divider */}
              {!sidebarOpen && sectionIdx > 0 && (
                <Separator className="my-2 opacity-30" />
              )}
              {/* Collapsible: show/hide items with animation */}
              {section.collapsible ? (
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <ul className={cn('space-y-0.5', sidebarOpen && 'ml-2')}>
                        {section.items.map((item) => {
                          const isActive = resolveViewKey(currentView, currentUser?.role) === item.id || currentView === item.id || (item.id === 'instructor-copilot' && currentView === 'instructor-copilot')
                          const badgeCount = instructorBadges[item.id]
                          return (
                            <li key={item.id}>
                              <NavItemButton
                                item={item}
                                isActive={isActive}
                                sidebarOpen={sidebarOpen}
                                badgeCount={badgeCount}
                                onClick={() => setCurrentView(item.id)}
                                isSecondary
                              />
                            </li>
                          )
                        })}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              ) : (
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = resolveViewKey(currentView, currentUser?.role) === item.id || currentView === item.id
                    const badgeCount = instructorBadges[item.id]
                    return (
                      <li key={item.id}>
                        <NavItemButton
                          item={item}
                          isActive={isActive}
                          sidebarOpen={sidebarOpen}
                          badgeCount={badgeCount}
                          onClick={() => setCurrentView(item.id)}
                        />
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
            )
          })}
        </nav>

        {/* Separator */}
        <Separator className="mx-3 w-auto opacity-50" />

        {/* Bottom actions */}
        {sidebarOpen ? (
          <div className="mx-3 mb-3 rounded-xl bg-muted/40 border border-border/30 p-2 flex items-center gap-1">
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="flex-1 flex flex-col items-center gap-1 rounded-lg py-2 px-1 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              <span className="text-[10px] leading-none">{isDark ? 'Light' : 'Dark'}</span>
            </button>
            <button
              onClick={() => toast.info('Help docs coming soon!')}
              className="flex-1 flex flex-col items-center gap-1 rounded-lg py-2 px-1 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              <HelpCircle className="size-4" />
              <span className="text-[10px] leading-none">Help</span>
            </button>
            <button
              onClick={() => {
                useAppStore.getState().logout()
                toast.success('Logged out successfully')
              }}
              className="flex-1 flex flex-col items-center gap-1 rounded-lg py-2 px-1 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="size-4" />
              <span className="text-[10px] leading-none">Logout</span>
            </button>
          </div>
        ) : (
          <div className="px-2 pb-3 flex flex-col gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => toast.info('Help docs coming soon!')}
                  className="flex size-10 w-full items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                >
                  <HelpCircle className="size-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="rounded-xl">Help</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    useAppStore.getState().logout()
                    toast.success('Logged out successfully')
                  }}
                  className="flex size-10 w-full items-center justify-center rounded-full text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="size-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="rounded-xl">Logout</TooltipContent>
            </Tooltip>
          </div>
        )}
      </motion.aside>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════
   INSTRUCTOR HEADER (with real notifications & messages)
   ═══════════════════════════════════════════════════════════ */
export function InstructorHeader() {
  const { currentUser, setCurrentUser, setSidebarOpen, setCurrentView } = useAppStore()

  // ─── Real notifications state ───
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  // ─── Real message count state ───
  const [messageCount, setMessageCount] = useState(0)

  // ─── Fetch notifications from API ───
  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) return
    setLoadingNotifications(true)
    try {
      const res = await fetch(`/api/instructor/notifications?instructorId=${currentUser.id}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        // Get unread count from header
        const headerUnread = res.headers.get('X-Unread-Count')
        setUnreadCount(headerUnread ? parseInt(headerUnread, 10) : 0)
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingNotifications(false)
    }
  }, [currentUser?.id])

  // ─── Fetch message count from API ───
  const fetchMessageCount = useCallback(async () => {
    if (!currentUser?.id) return
    try {
      const res = await fetch(`/api/instructor/messages?instructorId=${currentUser.id}`)
      if (res.ok) {
        const data = await res.json()
        // Count conversations with unread messages
        const unreadConversations = (data.conversations || []).filter(
          (c: { unreadCount: number }) => c.unreadCount > 0
        )
        setMessageCount(unreadConversations.length)
      }
    } catch {
      // Silently fail
    }
  }, [currentUser?.id])

  // ─── Initial fetch + auto-refresh every 30 seconds ───
  useEffect(() => {
    fetchNotifications()
    fetchMessageCount()

    const interval = setInterval(() => {
      fetchNotifications()
      fetchMessageCount()
    }, 30_000)

    return () => clearInterval(interval)
  }, [fetchNotifications, fetchMessageCount])

  // ─── Mark all as read ───
  const handleMarkAllRead = async () => {
    if (!currentUser?.id || notifications.length === 0) return
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
    if (unreadIds.length === 0) return

    try {
      const res = await fetch('/api/instructor/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: currentUser.id,
          notificationIds: unreadIds,
        }),
      })
      if (res.ok) {
        // Update local state immediately
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
        toast.success('All notifications marked as read')
      }
    } catch {
      toast.error('Failed to mark notifications as read')
    }
  }

  const handleSwitchRole = async (role: UserRole) => {
    if (!currentUser) return
    try {
      const res = await fetch(`/api/users/me?role=${role}`)
      if (res.ok) {
        const data = await res.json()
        if (data.user) setCurrentUser(data.user)
      }
    } catch {
      setCurrentUser({
        ...currentUser,
        role,
        name: role === 'admin' ? 'Shijl Admin' : role === 'instructor' ? 'Dr. Sara Malik' : role === 'parent' ? 'Parent User' : 'Ahmed Khan',
      })
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center ios-glass-thick border-b border-border/40 px-3 md:px-6 rounded-b-2xl">
      {/* LEFT: Hamburger + Brand */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden shrink-0 size-9"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>
      <div className="flex items-center gap-2 shrink-0 ml-1 md:ml-0 md:w-[300px] cursor-pointer" onClick={() => useAppStore.getState().setCurrentView('landing')}>
        <ShijlAILogo size="sm" className="shrink-0 hidden sm:block" />
        <span className="text-[15px] font-bold text-foreground tracking-tight hidden sm:block">
          <ShijlAIBrand variant="nav" />
        </span>
      </div>

      {/* CENTER: Desktop search — starts at 300px from left */}
      <div className="hidden md:block flex-1 max-w-md">
        <InlineSearch scope="instructor" className="w-full" />
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
        {/* Mobile search icon */}
        <MobileExpandableSearch scope="instructor" className="md:hidden" />
        {/* Notification Bell */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative size-9 rounded-full hover:bg-accent">
              <Bell className="size-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 rounded-2xl ios-shadow-lg overflow-hidden" align="end">
            <div className="flex items-center justify-between px-4 py-3">
              <h4 className="text-[15px] font-semibold">Notifications</h4>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-[13px] text-primary hover:text-primary/80"
                  onClick={handleMarkAllRead}
                >
                  <CheckCheck className="mr-1 size-3.5" />
                  Mark all read
                </Button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
              {loadingNotifications && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="ml-2 text-[13px] text-muted-foreground">Loading...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Bell className="size-8 mb-2 opacity-30" />
                  <p className="text-[13px]">No notifications yet</p>
                  <p className="text-[11px] opacity-60">We&apos;ll let you know when something arrives</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {notifications.map((n) => {
                    const typeInfo = getNotificationTypeIcon(n.type)
                    return (
                      <div
                        key={n.id}
                        className={cn(
                          'flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-accent/50',
                          !n.isRead && 'bg-primary/5'
                        )}
                        onClick={() => {
                          // Mark single notification as read
                          if (!n.isRead && currentUser?.id) {
                            fetch('/api/instructor/notifications', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                instructorId: currentUser.id,
                                notificationIds: [n.id],
                              }),
                            }).then(() => {
                              setNotifications(prev =>
                                prev.map(pn => pn.id === n.id ? { ...pn, isRead: true } : pn)
                              )
                              setUnreadCount(prev => Math.max(0, prev - 1))
                            }).catch(() => {})
                          }
                        }}
                      >
                        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/60">
                          <span className={typeInfo.color}>{typeInfo.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn(
                            'text-[13px] leading-snug',
                            !n.isRead ? 'font-medium' : 'text-muted-foreground'
                          )}>
                            {n.title}
                          </p>
                          {n.content && (
                            <p className="mt-0.5 text-[11px] text-muted-foreground/80 line-clamp-2">{n.content}</p>
                          )}
                          <p className="mt-0.5 text-[11px] text-muted-foreground/60">{formatTimeAgo(n.createdAt)}</p>
                        </div>
                        {!n.isRead && <div className="mt-2 size-2 shrink-0 rounded-full bg-primary" />}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="border-t border-border/40 px-4 py-2">
                <button
                  className="w-full text-center text-[12px] font-medium text-primary hover:text-primary/80 transition-colors"
                  onClick={() => {
                    const { setCurrentView } = useAppStore.getState()
                    setCurrentView('dashboard')
                  }}
                >
                  View all notifications
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Messages */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative size-9 rounded-full hover:bg-accent"
              onClick={() => {
                const { setCurrentView } = useAppStore.getState()
                setCurrentView('instructor-messages')
              }}
            >
              <Inbox className="size-[18px]" />
              {messageCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {messageCount > 99 ? '99+' : messageCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="rounded-xl">
            {messageCount > 0 ? `${messageCount} unread conversation${messageCount !== 1 ? 's' : ''}` : 'Messages'}
          </TooltipContent>
        </Tooltip>

        {/* User menu */}
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 gap-2 rounded-full px-2 hover:bg-accent">
                <Avatar className="size-8 ring-2 ring-primary/15">
                  <AvatarImage src={currentUser.avatar || undefined} alt={currentUser.name} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-bold">
                    {currentUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-[13px] font-medium text-foreground max-w-[100px] truncate">
                  {currentUser.name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-2xl ios-shadow-lg" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-[13px] font-medium">{currentUser.name}</p>
                  <p className="text-[11px] text-muted-foreground">{currentUser.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 rounded-[10px]" onClick={() => setCurrentView('instructor-profile')}>
                <User className="size-4" />
                <span className="text-[13px]">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 rounded-[10px] text-destructive focus:text-destructive" onClick={() => { useAppStore.getState().logout(); toast.success('Logged out successfully') }}>
                <LogOut className="size-4" />
                <span className="text-[13px]">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

      </div>
    </header>
  )
}

/* ═══════════════════════════════════════════════════════════
   INSTRUCTOR MOBILE BOTTOM TAB BAR
   ═══════════════════════════════════════════════════════════ */
export function InstructorBottomTabBar() {
  const { currentView, setCurrentView } = useAppStore()

  return (
    <MobileBottomBar
      items={instructorBottomItems}
      moreItems={instructorMoreItems}
      centerButton={{
        icon: <Plus className="size-6" />,
        label: 'Create',
        onClick: () => {}, // Handled internally by MobileBottomBar
      }}
      accent="emerald"
      activeView={currentView}
      onItemSelect={(id) => setCurrentView(id as any)}
      moreTitle="Instructor Portal"
    />
  )
}
