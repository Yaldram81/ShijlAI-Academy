'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageSquare,
  DollarSign,
  CreditCard,
  Receipt,
  Bell,
  Trophy,
  Bot,
  Shield,
  Settings,
  ClipboardList,
  Wrench,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Moon,
  Sun,
  User,
  LogOut,
  CheckCheck,
  CircleHelp,
  AlertTriangle,
  TrendingUp,
  UserPlus,
  Flag,
  Newspaper,
  Menu,
  Brain,
  Cpu,
  Sparkles,
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

/* ─── Nav Items Interface ─── */
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
      return { icon: <GraduationCap className="size-[18px]" />, color: 'text-blue-500' }
    case 'Finance':
      return { icon: <DollarSign className="size-[18px]" />, color: 'text-emerald-500' }
    default:
      return { icon: <ChevronDown className="size-[18px]" />, color: 'text-muted-foreground' }
  }
}

/* ─── Admin Nav Sections ─── */
const adminNavSections: NavSection[] = [
  {
    title: 'LMS',
    collapsible: true,
    items: [
      { id: 'admin', label: 'Dashboard', icon: <LayoutDashboard className="size-[18px]" />, iconColor: 'text-blue-500' },
      { id: 'admin-users', label: 'Users', icon: <Users className="size-[18px]" />, iconColor: 'text-violet-500' },
      { id: 'admin-courses', label: 'Courses', icon: <BookOpen className="size-[18px]" />, iconColor: 'text-teal-500' },
      { id: 'admin-instructors', label: 'Instructors', icon: <GraduationCap className="size-[18px]" />, iconColor: 'text-fuchsia-500' },
      { id: 'admin-applications', label: 'Applications', icon: <ClipboardList className="size-[18px]" />, iconColor: 'text-violet-500' },
      { id: 'admin-course-review', label: 'Content Review', icon: <ClipboardList className="size-[18px]" />, iconColor: 'text-rose-500' },
      { id: 'admin-qa-reports', label: 'Q&A & Reports', icon: <MessageSquare className="size-[18px]" />, iconColor: 'text-sky-500' },
    ],
  },
  {
    title: '',
    items: [
      { id: 'admin-analytics', label: 'Intelligent Analytics', icon: <Brain className="size-[18px]" />, iconColor: 'text-emerald-500' },
      { id: 'admin-copilot', label: 'AI Copilot', icon: <Sparkles className="size-[18px]" />, iconColor: 'text-blue-500' },
      { id: 'admin-system-intelligence', label: 'AI System Intelligence', icon: <Cpu className="size-[18px]" />, iconColor: 'text-orange-500' },
      { id: 'admin-shijlai-hub', label: <><ShijlAIText /> Hub</>, icon: <Sparkles className="size-[18px]" />, iconColor: 'text-amber-500' },
      { id: 'admin-blog', label: 'Blog', icon: <Newspaper className="size-[18px]" />, iconColor: 'text-emerald-500' },
    ],
  },
  {
    title: 'Finance',
    collapsible: true,
    items: [
      { id: 'admin-revenue', label: 'Revenue', icon: <DollarSign className="size-[18px]" />, iconColor: 'text-emerald-500' },
      { id: 'admin-payouts', label: 'Payouts', icon: <CreditCard className="size-[18px]" />, iconColor: 'text-pink-500' },
      { id: 'admin-refunds', label: 'Refunds', icon: <Receipt className="size-[18px]" />, iconColor: 'text-orange-500' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { id: 'admin-notifications', label: 'Notifications', icon: <Bell className="size-[18px]" />, iconColor: 'text-indigo-500' },
      { id: 'admin-gamification', label: 'Gamification', icon: <Trophy className="size-[18px]" />, iconColor: 'text-yellow-500' },
    ],
  },
  {
    title: 'System',
    items: [
      { id: 'admin-ai-config', label: 'AI Config', icon: <Bot className="size-[18px]" />, iconColor: 'text-purple-500' },
      { id: 'admin-settings', label: 'Settings', icon: <Settings className="size-[18px]" />, iconColor: 'text-slate-500' },
      { id: 'admin-audit-log', label: 'Audit Log', icon: <ClipboardList className="size-[18px]" />, iconColor: 'text-gray-500' },
      { id: 'admin-dev-tools', label: 'Dev Tools', icon: <Wrench className="size-[18px]" />, iconColor: 'text-lime-600' },
    ],
  },
]

/* ─── Admin Mobile Bottom Bar Items ─── */
const adminBottomItems: BottomBarItem[] = [
  { id: 'admin', label: 'Home', icon: <LayoutDashboard className="size-[22px]" /> },
  { id: 'admin-users', label: 'Users', icon: <Users className="size-[22px]" /> },
  { id: 'admin-courses', label: 'Courses', icon: <BookOpen className="size-[22px]" /> },
  { id: 'admin-revenue', label: 'Revenue', icon: <DollarSign className="size-[22px]" /> },
]

const adminMoreItems: MoreMenuAction[] = [
  { id: 'admin-instructors', label: 'Instructors', icon: <GraduationCap className="size-[18px]" />, iconColor: 'text-fuchsia-500', onClick: () => useAppStore.getState().setCurrentView('admin-instructors') },
  { id: 'admin-applications', label: 'Applications', icon: <ClipboardList className="size-[18px]" />, iconColor: 'text-violet-500', onClick: () => useAppStore.getState().setCurrentView('admin-applications') },
  { id: 'admin-course-review', label: 'Course Review', icon: <ClipboardList className="size-[18px]" />, iconColor: 'text-rose-500', onClick: () => useAppStore.getState().setCurrentView('admin-course-review') },
  { id: 'admin-qa-reports', label: 'Q&A & Reports', icon: <MessageSquare className="size-[18px]" />, iconColor: 'text-sky-500', onClick: () => useAppStore.getState().setCurrentView('admin-qa-reports') },
  { id: 'admin-analytics', label: 'Intelligent Analytics', icon: <Brain className="size-[18px]" />, iconColor: 'text-emerald-500', onClick: () => useAppStore.getState().setCurrentView('admin-analytics') },
  { id: 'admin-copilot', label: 'AI Copilot', icon: <Sparkles className="size-[18px]" />, iconColor: 'text-blue-500', onClick: () => useAppStore.getState().setCurrentView('admin-copilot') },
  { id: 'admin-system-intelligence', label: 'AI System Intelligence', icon: <Cpu className="size-[18px]" />, iconColor: 'text-orange-500', onClick: () => useAppStore.getState().setCurrentView('admin-system-intelligence') },
  { id: 'admin-shijlai-hub', label: 'ShijlAI Hub', icon: <Sparkles className="size-[18px]" />, iconColor: 'text-amber-500', onClick: () => useAppStore.getState().setCurrentView('admin-shijlai-hub') },
  { id: 'admin-blog', label: 'Blog', icon: <Newspaper className="size-[18px]" />, iconColor: 'text-emerald-500', onClick: () => useAppStore.getState().setCurrentView('admin-blog') },
  { id: 'admin-payouts', label: 'Payouts', icon: <CreditCard className="size-[18px]" />, iconColor: 'text-pink-500', onClick: () => useAppStore.getState().setCurrentView('admin-payouts') },
  { id: 'admin-refunds', label: 'Refunds', icon: <Receipt className="size-[18px]" />, iconColor: 'text-orange-500', onClick: () => useAppStore.getState().setCurrentView('admin-refunds') },
  { id: 'admin-notifications', label: 'Notifications', icon: <Bell className="size-[18px]" />, iconColor: 'text-indigo-500', onClick: () => useAppStore.getState().setCurrentView('admin-notifications') },
  { id: 'admin-gamification', label: 'Gamification', icon: <Trophy className="size-[18px]" />, iconColor: 'text-yellow-500', onClick: () => useAppStore.getState().setCurrentView('admin-gamification') },
  { id: 'admin-ai-config', label: 'AI Config', icon: <Bot className="size-[18px]" />, iconColor: 'text-purple-500', onClick: () => useAppStore.getState().setCurrentView('admin-ai-config') },
  { id: 'admin-settings', label: 'Settings', icon: <Settings className="size-[18px]" />, iconColor: 'text-slate-500', onClick: () => useAppStore.getState().setCurrentView('admin-settings') },
  { id: 'admin-audit-log', label: 'Audit Log', icon: <ClipboardList className="size-[18px]" />, iconColor: 'text-gray-500', onClick: () => useAppStore.getState().setCurrentView('admin-audit-log') },
  { id: 'admin-dev-tools', label: 'Dev Tools', icon: <Wrench className="size-[18px]" />, iconColor: 'text-lime-600', onClick: () => useAppStore.getState().setCurrentView('admin-dev-tools') },
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
                ? 'bg-gradient-to-br from-blue-500/15 to-indigo-500/10 text-primary shadow-sm shadow-blue-500/10'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {item.icon}
            {badgeCount !== undefined && badgeCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex min-w-[16px] h-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white px-1">
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
          ? 'bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-transparent text-primary shadow-sm shadow-blue-500/5'
          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
      )}
    >
      {/* Active left indicator bar */}
      {isActive && (
        <motion.div
          layoutId="adminSidebarActiveIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-blue-500 to-indigo-500"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}

      {/* Icon with colored background on active */}
      <div className={cn(
        'flex items-center justify-center rounded-full transition-all duration-200 shrink-0',
        isSecondary ? 'size-7' : 'size-8',
        isActive
          ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/15'
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
          className="flex min-w-[20px] h-5 items-center justify-center rounded-full bg-blue-500/15 text-[10px] font-bold text-blue-600 dark:text-blue-400 px-1.5 shrink-0"
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </motion.span>
      )}

      {/* Active dot indicator (right side) */}
      {isActive && sidebarOpen && (
        <motion.div
          layoutId="adminSidebarActiveDot"
          className="ml-auto size-[6px] rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shrink-0"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  )
}

/* ─── Admin Notification type ─── */
interface AdminNotification {
  id: string
  icon: React.ReactNode
  text: string
  timestamp: string
  unread: boolean
  type: 'info' | 'warning' | 'alert'
}

const mockAdminNotifications: AdminNotification[] = [
  { id: '1', icon: <Flag className="size-4 text-red-500" />, text: 'Content flagged: "Advanced Physics" — 3 reports', timestamp: '5m ago', unread: true, type: 'alert' },
  { id: '2', icon: <AlertTriangle className="size-4 text-amber-500" />, text: 'Server storage at 85% capacity', timestamp: '12m ago', unread: true, type: 'warning' },
  { id: '3', icon: <UserPlus className="size-4 text-blue-500" />, text: '15 new user registrations today', timestamp: '1h ago', unread: true, type: 'info' },
  { id: '4', icon: <DollarSign className="size-4 text-emerald-500" />, text: 'Revenue target reached: $500K this month', timestamp: '3h ago', unread: false, type: 'info' },
  { id: '5', icon: <TrendingUp className="size-4 text-violet-500" />, text: 'Enrollment spike: 40% increase in "IB Math"', timestamp: 'Yesterday', unread: false, type: 'info' },
]

/* ─── Role switching helpers ─── */
const roleLabels: Record<UserRole, string> = {
  student: 'Student',
  instructor: 'Instructor',
  admin: 'Super Admin',
  parent: 'Parent',
}

const roleIcons: Record<UserRole, React.ReactNode> = {
  student: <GraduationCap className="size-4" />,
  instructor: <BookOpen className="size-4" />,
  admin: <Shield className="size-4" />,
  parent: <User className="size-4" />,
}

/* ═══════════════════════════════════════════════════════════
   ADMIN SIDEBAR
   ═══════════════════════════════════════════════════════════ */
export function AdminSidebar() {
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
    // Auto-expand sections that contain the currently active view
    const initial: Record<string, boolean> = {}
    adminNavSections.forEach((section) => {
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
              <span className="text-[16px] font-bold tracking-tight bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Admin Panel</span>
            </SheetTitle>
            <SheetDescription className="sr-only">Navigation menu</SheetDescription>
          </SheetHeader>

          {/* Nav Items - Sectioned */}
          <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-1">
            {adminNavSections.map((section, sectionIdx) => {
              const isExpanded = section.collapsible ? isSectionExpanded(section.title) : true
              const hasActiveItem = section.items.some(item => resolveViewKey(currentView, currentUser?.role) === item.id || currentView === item.id)

              return (
              <div key={sectionIdx} className={sectionIdx > 0 ? 'mt-3' : ''}>
                {section.title && !section.collapsible && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1.5 px-3">
                    {section.title}
                  </p>
                )}
                {section.title && section.collapsible && (
                  <button
                    onClick={() => toggleSection(section.title)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 rounded-[12px] text-[13px] font-semibold transition-all duration-200',
                      hasActiveItem
                        ? 'text-primary bg-blue-500/10'
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
                                  ? 'bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-transparent text-primary shadow-sm shadow-blue-500/5'
                                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                              )}
                            >
                              {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-blue-500 to-indigo-500" />
                              )}
                              <div className={cn(
                                'flex items-center justify-center rounded-full transition-all duration-200 shrink-0',
                                section.collapsible ? 'size-7' : 'size-8',
                                isActive
                                  ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/15'
                                  : 'group-hover:bg-accent/60'
                              )}>
                                <span className={cn('transition-colors duration-200', isActive ? item.iconColor || 'text-primary' : '')}>
                                  {item.icon}
                                </span>
                              </div>
                              <span className="flex-1 text-left">{item.label}</span>
                              {isActive && (
                                <div className="size-[6px] rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shrink-0" />
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
              <CircleHelp className="size-4" />
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
        className="hidden md:flex flex-col h-full rounded-[28px] overflow-hidden ios-glass-thick shrink-0 bg-gradient-to-b from-blue-50/30 to-indigo-50/20 dark:from-blue-950/10 dark:to-indigo-950/5"
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
              <TooltipContent side="right" className="rounded-xl">Admin Panel</TooltipContent>
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
                    <h1 className="text-[16px] font-bold tracking-tight bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Admin Panel</h1>
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
          {adminNavSections.map((section, sectionIdx) => {
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
                      ? 'text-primary bg-blue-500/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  <div className={cn(
                    'flex size-8 items-center justify-center rounded-full shrink-0',
                    hasActiveItem ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/15' : ''
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
              {/* Collapsed sidebar: show Finance icon as toggle */}
              {section.collapsible && !sidebarOpen && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => toggleSection(section.title)}
                      className={cn(
                        'flex size-10 w-full items-center justify-center rounded-full transition-all duration-200 relative',
                        hasActiveItem
                          ? 'bg-gradient-to-br from-blue-500/15 to-indigo-500/10 text-primary shadow-sm shadow-blue-500/10'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      <span className={getSectionIcon(section.title).color}>{getSectionIcon(section.title).icon}</span>
                      {hasActiveItem && (
                        <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-blue-500" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="rounded-xl">
                    {section.title} {isExpanded ? '(expanded)' : '(collapsed)'}
                  </TooltipContent>
                </Tooltip>
              )}
              {/* Non-collapsible section title */}
              {!section.collapsible && sidebarOpen && section.title && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1.5 px-3">
                  {section.title}
                </p>
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
              <CircleHelp className="size-4" />
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
   ADMIN HEADER
   ═══════════════════════════════════════════════════════════ */
export function AdminHeader() {
  const { currentUser, setCurrentUser, setSidebarOpen } = useAppStore()
  const [notifications, setNotifications] = useState<AdminNotification[]>(mockAdminNotifications)
  const unreadCount = notifications.filter((n) => n.unread).length
  const alertCount = notifications.filter((n) => n.type === 'alert' && n.unread).length
  const warningCount = notifications.filter((n) => n.type === 'warning' && n.unread).length

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
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
        <InlineSearch scope="admin" className="w-full" />
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
        {/* Mobile search icon */}
        <MobileExpandableSearch scope="admin" className="md:hidden" />
        {/* Alert indicator (⚠ 3) */}
        {warningCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/30 cursor-default">
                <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">{warningCount}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="rounded-xl">{warningCount} warning{warningCount > 1 ? 's' : ''}</TooltipContent>
          </Tooltip>
        )}

        {/* Notification Bell */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative size-9 rounded-full hover:bg-accent">
              <Bell className="size-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount}
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
              <div className="divide-y divide-border/40">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 transition-colors',
                      n.unread && 'bg-primary/5'
                    )}
                  >
                    <div className={cn(
                      'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
                      n.type === 'alert' ? 'bg-red-100 dark:bg-red-950/30' :
                      n.type === 'warning' ? 'bg-amber-100 dark:bg-amber-950/30' :
                      'bg-muted/60'
                    )}>
                      {n.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        'text-[13px] leading-snug',
                        n.unread ? 'font-medium' : 'text-muted-foreground'
                      )}>
                        {n.text}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/60">{n.timestamp}</p>
                    </div>
                    {n.unread && <div className="mt-2 size-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* User menu — Super Admin dropdown */}
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 gap-2 rounded-full px-2 hover:bg-accent">
                <Avatar className="size-8 ring-2 ring-blue-500/20">
                  <AvatarImage src={currentUser.avatar || undefined} alt={currentUser.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-xs font-bold">
                    {currentUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-[13px] font-medium text-foreground max-w-[100px] truncate">
                  Super Admin
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
              <DropdownMenuItem className="gap-2 rounded-[10px]">
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
   ADMIN MOBILE BOTTOM TAB BAR
   ═══════════════════════════════════════════════════════════ */
export function AdminBottomTabBar() {
  const { currentView, setCurrentView } = useAppStore()

  return (
    <MobileBottomBar
      items={adminBottomItems}
      moreItems={adminMoreItems}
      accent="blue"
      activeView={currentView}
      onItemSelect={(id) => setCurrentView(id as any)}
      moreTitle="Admin Panel"
    />
  )
}
