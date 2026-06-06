'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  Sparkles,
  Trophy,
  BarChart3,
  Award,
  Settings,
  Shield,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Languages,
  Download,
  Loader2,
  FolderOpen,
  PlusCircle,
  Users,
  ClipboardList,
  LineChart,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { View } from '@/lib/types'
import { ShijlAIBrand, ShijlAIText } from '@/components/ui/brand-text'
import { ShijlAILogo } from '@/components/ui/shijlai-logo'

/* ─── Download Helper ─── */
function useDownloadProject() {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 120000) // 2 min timeout

      const res = await fetch('/api/download', { signal: controller.signal })
      clearTimeout(timeout)

      if (!res.ok) throw new Error(`Download failed: ${res.status}`)

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const match = res.headers.get('content-disposition')?.match(/filename="(.+?)"/)
      a.download = match?.[1] || 'shijlai-academy.zip'
      document.body.appendChild(a)
      a.click()
      a.remove()
      // Delay revoking to ensure download starts
      setTimeout(() => window.URL.revokeObjectURL(url), 5000)
    } catch (err) {
      console.error('Download failed:', err)
      alert('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return { downloading, handleDownload }
}

/* ─── Badge Counter Hook ─── */
function useInstructorBadges() {
  const { currentUser } = useAppStore()
  const [badges, setBadges] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'instructor') return
    const fetchBadges = async () => {
      try {
        const [coursesRes, studentsRes, assignmentsRes, quizzesRes] = await Promise.allSettled([
          fetch(`/api/instructor/courses?instructorId=${currentUser.id}`),
          fetch(`/api/instructor/students?instructorId=${currentUser.id}`),
          fetch(`/api/instructor/assignments?instructorId=${currentUser.id}`),
          fetch(`/api/instructor/quizzes?instructorId=${currentUser.id}`),
        ])

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

        setBadges(result)
      } catch {
        // Silently fail - badges are optional
      }
    }
    fetchBadges()
  }, [currentUser])

  return badges
}

interface NavItem {
  id: View
  label: React.ReactNode
  icon: React.ReactNode
  roles?: string[]
  badge?: number
  iconColor?: string
}

/* ─── Student Mobile Tab Bar Items ─── */
const studentMobileItems: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="size-[22px]" /> },
  { id: 'courses', label: 'Courses', icon: <BookOpen className="size-[22px]" /> },
  { id: 'tutor', label: 'Tutor', icon: <Bot className="size-[22px]" /> },
  { id: 'achievements', label: 'Awards', icon: <Trophy className="size-[22px]" /> },
  { id: 'analytics', label: 'Insights', icon: <BarChart3 className="size-[22px]" /> },
]

/* ─── Instructor Mobile Tab Bar Items ─── */
const instructorMobileItems: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="size-[20px]" /> },
  { id: 'instructor-courses', label: 'Courses', icon: <FolderOpen className="size-[20px]" /> },
  { id: 'course-creator', label: 'Create', icon: <PlusCircle className="size-[20px]" /> },
  { id: 'instructor-students', label: 'Students', icon: <Users className="size-[20px]" /> },
  { id: 'instructor-analytics', label: 'Analytics', icon: <LineChart className="size-[20px]" /> },
]

/* ─── Student Desktop Nav Items ─── */
const studentDesktopItems: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="size-[18px]" />, iconColor: 'text-emerald-500' },
  { id: 'courses', label: 'Courses', icon: <BookOpen className="size-[18px]" />, roles: ['student'], iconColor: 'text-teal-500' },
  { id: 'tutor', label: <>Ask <ShijlAIText /></>, icon: <Sparkles className="size-[18px]" />, roles: ['student'], iconColor: 'text-cyan-500' },
  { id: 'achievements', label: 'Achievements', icon: <Trophy className="size-[18px]" />, roles: ['student'], iconColor: 'text-amber-500' },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="size-[18px]" />, roles: ['student'], iconColor: 'text-purple-500' },
  { id: 'certificates', label: 'Certificates', icon: <Award className="size-[18px]" />, roles: ['student'], iconColor: 'text-rose-500' },
  { id: 'settings', label: 'Settings', icon: <Settings className="size-[18px]" /> },
]

/* ─── Instructor Desktop Nav Items (ONLY 7 items) ─── */
const instructorDesktopItems: NavItem[] = [
  { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="size-[18px]" />, iconColor: 'text-emerald-500' },
  { id: 'instructor-courses', label: 'My Courses', icon: <FolderOpen className="size-[18px]" />, iconColor: 'text-teal-500' },
  { id: 'course-creator', label: 'Create Course', icon: <PlusCircle className="size-[18px]" />, iconColor: 'text-emerald-400' },
  { id: 'instructor-students', label: 'My Students', icon: <Users className="size-[18px]" />, iconColor: 'text-cyan-500' },
  { id: 'instructor-assignments', label: 'Assignments', icon: <ClipboardList className="size-[18px]" />, iconColor: 'text-amber-500' },
  { id: 'instructor-quizzes', label: 'Quizzes', icon: <HelpCircle className="size-[18px]" />, iconColor: 'text-violet-500' },
  { id: 'instructor-analytics', label: 'Analytics', icon: <LineChart className="size-[18px]" />, iconColor: 'text-rose-500' },
]

/* ─── Admin Desktop Nav Items ─── */
const adminDesktopItems: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="size-[18px]" />, iconColor: 'text-emerald-500' },
  { id: 'admin', label: 'Admin Panel', icon: <Shield className="size-[18px]" />, roles: ['admin'], iconColor: 'text-rose-500' },
  { id: 'settings', label: 'Settings', icon: <Settings className="size-[18px]" /> },
]

function getLevelProgress(xp: number, level: number): number {
  const xpForCurrentLevel = level * 500
  const xpForNextLevel = (level + 1) * 500
  const progressInLevel = xp - xpForCurrentLevel
  const levelRange = xpForNextLevel - xpForCurrentLevel
  return Math.min(Math.max((progressInLevel / levelRange) * 100, 0), 100)
}

/* ─── Sidebar Download Button ─── */
function SidebarDownloadButton({ sidebarOpen }: { sidebarOpen: boolean }) {
  const { downloading, handleDownload } = useDownloadProject()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
          className={cn(
            'w-full gap-1.5 text-xs h-9 rounded-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all duration-200 font-semibold',
            !sidebarOpen && 'justify-center px-0'
          )}
        >
          {downloading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {sidebarOpen && (
            <span>{downloading ? 'Zipping...' : 'Download Code'}</span>
          )}
        </Button>
      </TooltipTrigger>
      {!sidebarOpen && (
        <TooltipContent side="right" className="rounded-xl">
          Download project source code
        </TooltipContent>
      )}
    </Tooltip>
  )
}

/* ─── iOS Bottom Tab Bar (Mobile) ─── */
export function BottomTabBar() {
  const { currentView, setCurrentView, currentUser } = useAppStore()
  const role = currentUser?.role || 'student'

  const mobileItems = role === 'instructor' ? instructorMobileItems : studentMobileItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 ios-glass-thick border-t border-border/50 pb-safe md:hidden">
      <div className="flex items-center justify-around px-2 pt-1.5 pb-1.5">
        {mobileItems.map((item) => {
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 min-w-[56px] py-1 ios-press transition-colors duration-200 relative',
                isActive ? 'text-primary' : 'text-muted-foreground/60'
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
                  layoutId="iosTabIndicator"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

/* ─── Nav Item with Badge ─── */
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
              'flex size-11 w-full items-center justify-center rounded-[12px] transition-all duration-200 ios-press relative',
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
          layoutId="sidebarActiveIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-emerald-500 to-teal-500"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}

      {/* Icon with colored background on active */}
      <div className={cn(
        'flex size-8 items-center justify-center rounded-[10px] transition-all duration-200 shrink-0',
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
          layoutId="sidebarActiveDot"
          className="ml-auto size-[6px] rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  )
}

/* ─── iOS Sidebar (Desktop) ─── */
export function Sidebar() {
  const {
    currentView,
    setCurrentView,
    currentUser,
    sidebarOpen,
    setSidebarOpen,
    language,
    setLanguage,
  } = useAppStore()
  const { theme, setTheme } = useTheme()
  const instructorBadges = useInstructorBadges()

  const isDark = theme === 'dark'
  const isMultilingual = language === 'ur' || language === 'ar'
  const role = currentUser?.role || 'student'

  // Select nav items based on role
  let desktopNavItems: NavItem[]
  if (role === 'instructor') {
    desktopNavItems = instructorDesktopItems
  } else if (role === 'admin') {
    desktopNavItems = adminDesktopItems
  } else {
    desktopNavItems = studentDesktopItems
  }

  const levelProgress = currentUser
    ? getLevelProgress(currentUser.xp, currentUser.level)
    : 0

  const xpForNextLevel = currentUser
    ? (currentUser.level + 1) * 500
    : 500

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 68 }}
        className={cn(
          'hidden md:flex flex-col h-screen border-r border-border/60 ios-glass-thick transition-[width] duration-300 ease-out shrink-0',
          role === 'instructor' && 'bg-gradient-to-b from-emerald-50/30 to-teal-50/20 dark:from-emerald-950/10 dark:to-teal-950/5'
        )}
      >
        {/* Logo area */}
        <div className="flex h-14 items-center gap-2.5 px-4">
          <ShijlAILogo size="sm" className="shrink-0" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <ShijlAIBrand as="h1" />
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="ghost"
            size="icon"
            className="ml-auto hidden size-7 shrink-0 text-muted-foreground hover:text-foreground md:flex"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </Button>
        </div>

        {/* Role badge (for instructor) */}
        {sidebarOpen && role === 'instructor' && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-3 mb-2"
          >
            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-3 py-2 border border-emerald-500/10 dark:border-emerald-500/5">
              <div className="flex size-6 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <BookOpen className="size-3 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Instructor Portal</p>
                <p className="text-[9px] text-muted-foreground">Manage your courses & students</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2">
          <ul className="space-y-0.5">
            {desktopNavItems.map((item) => {
              const isActive = currentView === item.id
              const badgeCount = role === 'instructor' ? instructorBadges[item.id] : undefined

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
        </nav>

        {/* Separator */}
        <Separator className="mx-3 w-auto opacity-50" />

        {/* Bottom section */}
        <div className="p-3 space-y-2.5">
          {/* Download Project */}
          <SidebarDownloadButton sidebarOpen={sidebarOpen} />

          {/* Toggle controls */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(isMultilingual ? 'en' : 'ur')}
              className={cn(
                'flex-1 gap-1.5 text-xs h-9 rounded-[10px]',
                isMultilingual && 'bg-primary/10 text-primary'
              )}
            >
              <Languages className="size-4" />
              {sidebarOpen && <span>{isMultilingual ? 'اردو' : 'EN'}</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="flex-1 gap-1.5 text-xs h-9 rounded-[10px]"
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {sidebarOpen && <span>{isDark ? 'Light' : 'Dark'}</span>}
            </Button>
          </div>

          {/* User profile card */}
          {currentUser && (
            <div
              className={cn(
                'flex items-center gap-3 rounded-[14px] bg-accent/50 p-2.5 ios-shadow-sm transition-all',
                !sidebarOpen && 'justify-center p-2'
              )}
            >
              <Avatar className="size-9 shrink-0 ring-2 ring-primary/20">
                <AvatarImage src={currentUser.avatar || undefined} alt={currentUser.name} />
                <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-bold">
                  {currentUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="min-w-0 flex-1 overflow-hidden"
                >
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-[13px] font-semibold text-foreground">
                      {currentUser.name}
                    </p>
                    {currentUser.streak > 0 && (
                      <span className="streak-fire text-xs shrink-0">🔥</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span>Lv.{currentUser.level}</span>
                    <span>·</span>
                    <span>{currentUser.xp.toLocaleString()} XP</span>
                  </div>
                  <div className="mt-1.5">
                    <Progress value={levelProgress} className="h-[3px] rounded-full xp-glow" />
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground/60 whitespace-nowrap">
                      {(xpForNextLevel - currentUser.xp).toLocaleString()} XP to Lv.{currentUser.level + 1}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.aside>
    </>
  )
}
