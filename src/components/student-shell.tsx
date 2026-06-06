'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  ClipboardList,
  Trophy,
  Award,
  Users,
  Calendar,
  MessageSquare,
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
  Menu,
  Flame,
  Coins,
  Target,
  HelpCircle,
  Compass,
  Inbox,
  Brain,
  Hexagon,
  BarChart3,
  Gauge,
  UserPlus,
  Star,
  CreditCard,
  AlertTriangle,
  Info,
  CheckCheck,
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
import { toast } from 'sonner'
import type { View, UserRole } from '@/lib/types'
import { MobileBottomBar } from '@/components/mobile-bottom-bar'
import { ShijlAIBrand, ShijlAIText } from '@/components/ui/brand-text'
import { ShijlAILogo } from '@/components/ui/shijlai-logo'
import type { BottomBarItem, MoreMenuAction } from '@/components/mobile-bottom-bar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

/* ─── Types ─── */
interface NavItem {
  id: View
  label: React.ReactNode
  icon: React.ReactNode
  iconColor?: string
  badge?: number
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

/* ─── Student Sidebar Nav Sections ─── */
const studentNavSections: NavSection[] = [
  {
    title: 'LMS',
    collapsible: true,
    items: [
      { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="size-[18px]" />, iconColor: 'text-emerald-500' },
      { id: 'courses', label: 'My Learning', icon: <BookOpen className="size-[18px]" />, iconColor: 'text-teal-500' },
      { id: 'explore', label: 'Explore', icon: <Compass className="size-[18px]" />, iconColor: 'text-cyan-500' },
      { id: 'student-assignments', label: 'Assignments', icon: <ClipboardList className="size-[18px]" />, iconColor: 'text-amber-600' },
      { id: 'student-qa', label: 'Q&A', icon: <MessageSquare className="size-[18px]" />, iconColor: 'text-teal-500' },
      { id: 'student-schedule', label: 'Schedule', icon: <Calendar className="size-[18px]" />, iconColor: 'text-indigo-500' },
    ],
  },
  {
    title: '',
    items: [
      { id: 'tutor', label: <>Ask <ShijlAIText /></>, icon: <Sparkles className="size-[18px]" />, iconColor: 'text-violet-500' },
      { id: 'shijlai-hub', label: <><ShijlAIText /> Hub</>, icon: <Hexagon className="size-[18px]" />, iconColor: 'text-teal-500' },
      { id: 'recommendations', label: 'AI Insights', icon: <Brain className="size-[18px]" />, iconColor: 'text-emerald-500' },
      { id: 'achievements', label: 'Progress', icon: <Trophy className="size-[18px]" />, iconColor: 'text-orange-500' },
      { id: 'my-skills', label: 'My Skills', icon: <Gauge className="size-[18px]" />, iconColor: 'text-teal-600' },
      { id: 'certificates', label: 'Certificates', icon: <Award className="size-[18px]" />, iconColor: 'text-rose-500' },
      { id: 'community', label: 'Community', icon: <Users className="size-[18px]" />, iconColor: 'text-sky-500' },
    ],
  },
  {
    title: '',
    items: [
      { id: 'student-messages', label: 'Messages', icon: <Inbox className="size-[18px]" />, iconColor: 'text-blue-500' },
      { id: 'notifications', label: 'Notifications', icon: <Bell className="size-[18px]" />, iconColor: 'text-indigo-500' },
      { id: 'student-profile', label: 'My Profile', icon: <User className="size-[18px]" />, iconColor: 'text-emerald-600' },
      { id: 'settings', label: 'Settings', icon: <Settings className="size-[18px]" />, iconColor: 'text-slate-500' },
    ],
  },
]

/* ─── Student Mobile Bottom Bar Items ─── */
const studentBottomItems: BottomBarItem[] = [
  { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="size-[22px]" /> },
  { id: 'courses', label: 'Learn', icon: <BookOpen className="size-[22px]" /> },
  { id: 'tutor', label: <>Ask <ShijlAIText /></>, icon: <Sparkles className="size-[22px]" /> },
  { id: 'achievements', label: 'Progress', icon: <Trophy className="size-[22px]" /> },
]

const studentMoreItems: MoreMenuAction[] = [
  { id: 'explore', label: 'Explore', icon: <Compass className="size-[18px]" />, iconColor: 'text-cyan-500', onClick: () => useAppStore.getState().setCurrentView('explore') },
  { id: 'shijlai-hub', label: <><ShijlAIText /> Hub</>, icon: <Hexagon className="size-[18px]" />, iconColor: 'text-teal-500', onClick: () => useAppStore.getState().setCurrentView('shijlai-hub') },
  { id: 'recommendations', label: 'AI Insights', icon: <Brain className="size-[18px]" />, iconColor: 'text-emerald-500', onClick: () => useAppStore.getState().setCurrentView('recommendations') },
  { id: 'my-skills', label: 'My Skills', icon: <Gauge className="size-[18px]" />, iconColor: 'text-teal-600', onClick: () => useAppStore.getState().setCurrentView('my-skills') },
  { id: 'student-assignments', label: 'Assignments', icon: <ClipboardList className="size-[18px]" />, iconColor: 'text-amber-500', onClick: () => useAppStore.getState().setCurrentView('student-assignments') },
  { id: 'certificates', label: 'Certificates', icon: <Award className="size-[18px]" />, iconColor: 'text-rose-500', onClick: () => useAppStore.getState().setCurrentView('certificates') },
  { id: 'community', label: 'Community', icon: <Users className="size-[18px]" />, iconColor: 'text-sky-500', onClick: () => useAppStore.getState().setCurrentView('community') },
  { id: 'student-schedule', label: 'Schedule', icon: <Calendar className="size-[18px]" />, iconColor: 'text-indigo-500', onClick: () => useAppStore.getState().setCurrentView('student-schedule') },
  { id: 'student-qa', label: 'Q&A', icon: <MessageSquare className="size-[18px]" />, iconColor: 'text-teal-500', onClick: () => useAppStore.getState().setCurrentView('student-qa') },
  { id: 'student-messages', label: 'Messages', icon: <Inbox className="size-[18px]" />, iconColor: 'text-blue-500', onClick: () => useAppStore.getState().setCurrentView('student-messages') },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="size-[18px]" />, iconColor: 'text-indigo-500', onClick: () => useAppStore.getState().setCurrentView('notifications') },
  { id: 'student-profile', label: 'Profile', icon: <User className="size-[18px]" />, iconColor: 'text-emerald-600', onClick: () => useAppStore.getState().setCurrentView('student-profile') },
]

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
function getStudentNotificationTypeIcon(type: string): { icon: React.ReactNode; color: string } {
  switch (type) {
    case 'enrollment':
      return { icon: <UserPlus className="size-4" />, color: 'text-emerald-500' }
    case 'achievement':
      return { icon: <Trophy className="size-4" />, color: 'text-amber-500' }
    case 'course_update':
      return { icon: <BookOpen className="size-4" />, color: 'text-teal-500' }
    case 'assignment':
      return { icon: <ClipboardList className="size-4" />, color: 'text-orange-500' }
    case 'qa':
      return { icon: <HelpCircle className="size-4" />, color: 'text-sky-500' }
    case 'review':
      return { icon: <Star className="size-4" />, color: 'text-amber-500' }
    case 'live_session':
      return { icon: <Calendar className="size-4" />, color: 'text-violet-500' }
    case 'reminder':
      return { icon: <Target className="size-4" />, color: 'text-blue-500' }
    case 'security':
      return { icon: <AlertTriangle className="size-4" />, color: 'text-slate-500' }
    case 'promotion':
      return { icon: <Sparkles className="size-4" />, color: 'text-rose-500' }
    case 'system':
      return { icon: <AlertTriangle className="size-4" />, color: 'text-slate-500' }
    case 'announcement':
      return { icon: <MessageSquare className="size-4" />, color: 'text-indigo-500' }
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
  isPinned: boolean
  priority: string | null
  category: string | null
  courseId: string | null
  senderId: string | null
  metadata: unknown
  createdAt: string
}

/* ─── Nav Item Button ─── */
function NavItemButton({
  item,
  isActive,
  sidebarOpen,
  badgeCount,
  onClick,
}: {
  item: NavItem
  isActive: boolean
  sidebarOpen: boolean
  badgeCount?: number
  onClick: () => void
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
        isActive
          ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent text-primary shadow-sm shadow-emerald-500/5'
          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
      )}
    >
      {/* Active left indicator bar */}
      {isActive && (
        <motion.div
          layoutId="studentSidebarActiveIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-emerald-500 to-teal-500"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}

      {/* Icon with colored background on active */}
      <div className={cn(
        'flex size-8 items-center justify-center rounded-full transition-all duration-200 shrink-0',
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
          layoutId="studentSidebarActiveDot"
          className="ml-auto size-[6px] rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  )
}

/* ═══════════════════════════════════════════════════════════
   STUDENT SIDEBAR
   ═══════════════════════════════════════════════════════════ */
export function StudentSidebar() {
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

  // Collapsible section state — track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    studentNavSections.forEach((section) => {
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
              <ShijlAILogo size="xs" className="shrink-0" />
              <span className="text-[16px] font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">Student Portal</span>
            </SheetTitle>
            <SheetDescription className="sr-only">Navigation menu</SheetDescription>
          </SheetHeader>

          {/* Nav Items — Sectioned */}
          <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-1">
            {studentNavSections.map((section, sectionIdx) => {
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
                        const isActive = resolveViewKey(currentView, currentUser?.role) === item.id || currentView === item.id
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
        className="hidden md:flex flex-col h-full rounded-[28px] overflow-hidden ios-glass-thick shrink-0"
      >
        {/* Portal identity area */}
        <div className="flex h-14 items-center gap-2.5 px-4">
          {!sidebarOpen ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full hover:opacity-90 transition-all duration-200"
                  title="Expand sidebar"
                >
                  <ShijlAILogo size="sm" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="rounded-xl">Student Portal</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <ShijlAILogo size="xs" className="shrink-0" />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap flex-1"
                  >
                    <h1 className="text-[16px] font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">Student Portal</h1>
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

        {/* Main Navigation — Sectioned */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2">
          {studentNavSections.map((section, sectionIdx) => {
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
                          const isActive = resolveViewKey(currentView, currentUser?.role) === item.id || currentView === item.id
                          return (
                            <li key={item.id}>
                              <NavItemButton
                                item={item}
                                isActive={isActive}
                                sidebarOpen={sidebarOpen}
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
                    return (
                      <li key={item.id}>
                        <NavItemButton
                          item={item}
                          isActive={isActive}
                          sidebarOpen={sidebarOpen}
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
          <div className="px-2 pb-3">
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
   STUDENT HEADER
   ═══════════════════════════════════════════════════════════ */
export function StudentHeader() {
  const { currentUser, setCurrentUser, setSidebarOpen, setCurrentView } = useAppStore()
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

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
      const res = await fetch(`/api/notifications?userId=${currentUser.id}&role=student&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.counts?.unread || 0)
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
      const res = await fetch(`/api/student/messages?studentId=${currentUser.id}`)
      if (res.ok) {
        const data = await res.json()
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
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          userId: currentUser.id,
          notificationIds: unreadIds,
        }),
      })
      if (res.ok) {
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
      <div className="flex items-center gap-2 shrink-0 ml-1 md:ml-0 md:w-[300px] cursor-pointer" onClick={() => setCurrentView('landing')}>
        <ShijlAILogo size="sm" className="shrink-0" />
        <span className="text-[15px] font-bold text-foreground tracking-tight hidden sm:block"><ShijlAIBrand variant="nav" /></span>
      </div>

      {/* CENTER: Desktop search — starts at 300px from left */}
      <div className="hidden md:block flex-1 max-w-md">
        <InlineSearch scope="student" className="w-full" />
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
        {/* Mobile search icon */}
        <MobileExpandableSearch scope="student" className="md:hidden" />
        {/* Streak */}
        {currentUser && currentUser.streak > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden md:flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1">
                <Flame className="size-3.5 text-orange-500 streak-fire" />
                <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">{currentUser.streak}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="rounded-xl">{currentUser.streak}-day streak</TooltipContent>
          </Tooltip>
        )}

        {/* XP */}
        {currentUser && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden md:flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">⚡ {currentUser.xp.toLocaleString()}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="rounded-xl">Experience: {currentUser.xp} XP</TooltipContent>
          </Tooltip>
        )}

        {/* Coins */}
        {currentUser && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden lg:flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1">
                <Coins className="size-3 text-amber-600 dark:text-amber-400" />
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">{currentUser.shijlCoins}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="rounded-xl">ShijlCoins: {currentUser.shijlCoins}</TooltipContent>
          </Tooltip>
        )}

        {/* Notifications - Proper Popover dropdown */}
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
                    const typeInfo = getStudentNotificationTypeIcon(n.type)
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
                            fetch('/api/notifications', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                action: 'mark_read',
                                userId: currentUser.id,
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
                    setCurrentView('notifications')
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
              onClick={() => setCurrentView('student-messages')}
            >
              <Inbox className="size-[18px]" />
              {messageCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {messageCount > 99 ? '99+' : messageCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="rounded-xl">{messageCount > 0 ? `${messageCount} unread message${messageCount !== 1 ? 's' : ''}` : 'Messages'}</TooltipContent>
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
              <DropdownMenuItem className="gap-2 rounded-[10px]" onClick={() => setCurrentView('student-profile')}>
                <User className="size-4" />
                <span className="text-[13px]">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 rounded-[10px] text-destructive focus:text-destructive"
                onClick={() => {
                  const { setCurrentUser: setCU, setCurrentView: setCV } = useAppStore.getState()
                  setCU(null)
                  setCV('landing')
                  toast.success('Logged out successfully')
                }}
              >
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
   STUDENT MOBILE BOTTOM TAB BAR
   ═══════════════════════════════════════════════════════════ */
export function StudentBottomTabBar() {
  const { currentView, setCurrentView } = useAppStore()

  return (
    <MobileBottomBar
      items={studentBottomItems}
      moreItems={studentMoreItems}
      accent="emerald"
      activeView={currentView}
      onItemSelect={(id) => setCurrentView(id as any)}
      moreTitle="Student Portal"
    />
  )
}
