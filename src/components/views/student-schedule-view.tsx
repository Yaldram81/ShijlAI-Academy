'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  BookOpen,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Video,
  HelpCircle,
  Users,
  GraduationCap,
  Zap,
  Bell,
  Target,
  Globe,
  Coffee,
  CheckCircle2,
  Plus,
  X,
  MapPin,
  Tag,
  Trash2,
  Edit3,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Brain,
  Filter,
  LayoutGrid,
  List,
  CalendarDays,
  CalendarRange,
  StickyNote,
  Eye,
  PartyPopper,
  PanelRight,
} from 'lucide-react'
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, parseISO, getHours, getMinutes } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { StudentStatCard, StudentStatCardGrid } from '@/components/student/student-stat-card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { MobileFilterSheet, MobileFilterGroup } from '@/components/mobile-filter-sheet'
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType = 'class' | 'quiz' | 'assignment' | 'live-session' | 'study' | 'break' | 'exam' | 'personal' | 'reminder' | 'community-event' | 'study-group'
type EventColor = 'emerald' | 'teal' | 'amber' | 'rose' | 'violet' | 'sky' | 'orange' | 'cyan'
type EventPriority = 'low' | 'medium' | 'high' | 'urgent'
type EventSource = 'custom' | 'live-session' | 'assignment' | 'quiz' | 'community' | 'study-group'
type ViewMode = 'week' | 'day' | 'month' | 'list'

interface ScheduleEvent {
  id: string
  title: string
  description: string | null
  type: EventType
  color: EventColor
  startDate: string
  endDate: string | null
  duration: number
  allDay: boolean
  location: string | null
  meetingUrl: string | null
  courseId: string | null
  courseName: string | null
  courseThumbnail: string | null
  status: string
  priority: EventPriority
  source: EventSource
  isRecurring: boolean
  tags: string[] | null
  instructorName: string | null
}

interface ScheduleStats {
  todayEvents: number
  weekEvents: number
  pendingDeadlines: number
  upcomingLiveSessions: number
  totalStudyHours: number
}

interface DeadlineItem {
  id: string
  title: string
  type: string
  dueDate: string
  courseId: string | null
  courseName: string | null
  color: string
  priority: string
}

interface Deadlines {
  urgent: DeadlineItem[]
  soon: DeadlineItem[]
  upcoming: DeadlineItem[]
}

interface ScheduleResponse {
  events: ScheduleEvent[]
  stats: ScheduleStats
  deadlines: Deadlines
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPE_CONFIG: Record<EventType, { icon: React.ElementType; color: string; bg: string; border: string; label: string; dot: string }> = {
  'class': { icon: BookOpen, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-300 dark:border-emerald-700', label: 'Class', dot: 'bg-emerald-500' },
  'quiz': { icon: HelpCircle, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-300 dark:border-violet-700', label: 'Quiz', dot: 'bg-violet-500' },
  'assignment': { icon: Target, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-300 dark:border-amber-700', label: 'Assignment', dot: 'bg-amber-500' },
  'live-session': { icon: Globe, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/30', border: 'border-sky-300 dark:border-sky-700', label: 'Live Session', dot: 'bg-sky-500' },
  'study': { icon: GraduationCap, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-300 dark:border-teal-700', label: 'Study', dot: 'bg-teal-500' },
  'break': { icon: Coffee, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-300 dark:border-orange-700', label: 'Break', dot: 'bg-orange-500' },
  'exam': { icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-300 dark:border-rose-700', label: 'Exam', dot: 'bg-rose-500' },
  'personal': { icon: StickyNote, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-300 dark:border-cyan-700', label: 'Personal', dot: 'bg-cyan-500' },
  'reminder': { icon: Bell, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-300 dark:border-violet-700', label: 'Reminder', dot: 'bg-violet-500' },
  'community-event': { icon: PartyPopper, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-300 dark:border-rose-700', label: 'Community', dot: 'bg-rose-500' },
  'study-group': { icon: Users, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-300 dark:border-teal-700', label: 'Study Group', dot: 'bg-teal-500' },
}

const COLOR_OPTIONS: { value: EventColor; label: string; bg: string; ring: string }[] = [
  { value: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { value: 'teal', label: 'Teal', bg: 'bg-teal-500', ring: 'ring-teal-500' },
  { value: 'amber', label: 'Amber', bg: 'bg-amber-500', ring: 'ring-amber-500' },
  { value: 'rose', label: 'Rose', bg: 'bg-rose-500', ring: 'ring-rose-500' },
  { value: 'violet', label: 'Violet', bg: 'bg-violet-500', ring: 'ring-violet-500' },
  { value: 'sky', label: 'Sky', bg: 'bg-sky-500', ring: 'ring-sky-500' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-500', ring: 'ring-orange-500' },
  { value: 'cyan', label: 'Cyan', bg: 'bg-cyan-500', ring: 'ring-cyan-500' },
]

const PRIORITY_CONFIG: Record<EventPriority, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
  medium: { label: 'Medium', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-950/30' },
  high: { label: 'High', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/30' },
  urgent: { label: 'Urgent', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950/30' },
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 6AM to 10PM
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCountdown(dateStr: string): string {
  const due = new Date(dateStr)
  const now = new Date()
  const diffMs = due.getTime() - now.getTime()
  if (diffMs < 0) return 'Overdue!'
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h left`
  if (diffHours > 0) return `${diffHours}h ${Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))}m left`
  const diffMins = Math.floor(diffMs / (1000 * 60))
  return `${diffMins}m left`
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

function getEventTypeDefaultColor(type: EventType): EventColor {
  const mapping: Record<EventType, EventColor> = {
    'class': 'emerald', 'quiz': 'violet', 'assignment': 'amber', 'live-session': 'sky',
    'study': 'teal', 'break': 'orange', 'exam': 'rose', 'personal': 'cyan',
    'reminder': 'violet', 'community-event': 'rose', 'study-group': 'teal',
  }
  return mapping[type] || 'emerald'
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function ScheduleSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      {/* Stats bar skeleton */}
      <Skeleton className="h-9 w-full rounded-lg" />
      {/* Filter chips skeleton */}
      <Skeleton className="h-7 w-96 rounded-full" />
      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <Skeleton className="h-[520px] rounded-xl" />
        <div className="space-y-0">
          <Skeleton className="h-[520px] rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ─── Focus Timer (compact, for sidebar integration) ───────────────────────────

function FocusTimer({ linkedEvent }: { linkedEvent?: ScheduleEvent | null }) {
  const WORK_DURATION = 25 * 60
  const BREAK_DURATION = 5 * 60
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION)
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (!isBreak) {
              setSessions((s) => s + 1)
              toast.success('Focus session complete! Time for a break.', { icon: '🎉' })
              setIsBreak(true)
              return BREAK_DURATION
            } else {
              toast.success('Break over! Ready for another session?', { icon: '💪' })
              setIsBreak(false)
              return WORK_DURATION
            }
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, isBreak])

  const toggleTimer = () => setIsRunning(!isRunning)
  const resetTimer = () => {
    setIsRunning(false)
    setIsBreak(false)
    setTimeLeft(WORK_DURATION)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const totalDuration = isBreak ? BREAK_DURATION : WORK_DURATION
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const circumference = 2 * Math.PI * 28
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="flex items-center gap-4 py-3">
      {/* Mini timer ring */}
      <div className="relative size-16 shrink-0">
        <svg className="size-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="3" />
          <circle
            cx="32" cy="32" r="28" fill="none"
            className={isBreak ? 'text-teal-500' : 'text-emerald-500'}
            stroke="currentColor" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-bold tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className="text-[7px] text-muted-foreground font-semibold uppercase tracking-wider">
            {isBreak ? 'Break' : 'Focus'}
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Button size="sm" variant="outline" className="size-7 p-0" onClick={resetTimer}>
            <RotateCcw className="size-3" />
          </Button>
          <Button size="sm" className={cn('gap-1 h-7 px-3 text-xs', isBreak ? 'bg-teal-600 hover:bg-teal-700' : 'bg-emerald-600 hover:bg-emerald-700')} onClick={toggleTimer}>
            {isRunning ? <Pause className="size-3" /> : <Play className="size-3" />}
            {isRunning ? 'Pause' : 'Start'}
          </Button>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cn(
              'size-1.5 rounded-full transition-colors',
              i < sessions ? 'bg-emerald-500' : 'bg-muted'
            )} />
          ))}
          <span className="text-[9px] text-muted-foreground ml-1">{sessions} sessions</span>
        </div>
        {linkedEvent && (
          <div className={cn('mt-1.5 rounded px-2 py-1 text-[10px] flex items-center gap-1.5 truncate', EVENT_TYPE_CONFIG[linkedEvent.type]?.bg || 'bg-muted')}>
            {(() => { const Ic = EVENT_TYPE_CONFIG[linkedEvent.type]?.icon || BookOpen; return <Ic className="size-2.5 shrink-0" /> })()}
            <span className="truncate font-medium">{linkedEvent.title}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Event Block (Week Grid) ──────────────────────────────────────────────────

function EventBlock({
  event,
  style,
  compact = false,
  onClick,
}: {
  event: ScheduleEvent
  style?: React.CSSProperties
  compact?: boolean
  onClick: () => void
}) {
  const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG['study']
  const Icon = config.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, zIndex: 20 }}
      className={cn(
        'absolute left-0.5 right-0.5 rounded-lg border cursor-pointer overflow-hidden transition-shadow hover:shadow-md',
        config.bg,
        config.border,
        event.allDay && 'inset-x-0',
      )}
      style={style}
      onClick={onClick}
    >
      <div className="flex items-start gap-1 p-1.5">
        <Icon className={cn('size-3 shrink-0 mt-0.5', config.color)} />
        <div className="min-w-0 flex-1">
          <p className={cn('font-medium leading-tight truncate', compact ? 'text-[10px]' : 'text-[11px]', config.color)}>
            {event.title}
          </p>
          {!compact && !event.allDay && (
            <p className="text-[9px] text-muted-foreground mt-0.5">
              {format(parseISO(event.startDate), 'h:mm a')}
              {event.duration ? ` · ${event.duration}m` : ''}
            </p>
          )}
        </div>
        {event.priority === 'urgent' && (
          <Zap className="size-3 text-red-500 shrink-0" />
        )}
      </div>
    </motion.div>
  )
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({
  events,
  selectedDate,
  onEventClick,
}: {
  events: ScheduleEvent[]
  selectedDate: Date
  onEventClick: (event: ScheduleEvent) => void
}) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const gridRef = useRef<HTMLDivElement>(null)

  const eventsByDay = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>()
    weekDays.forEach(day => {
      map.set(format(day, 'yyyy-MM-dd'), [])
    })
    events.forEach(event => {
      const eventDate = format(parseISO(event.startDate), 'yyyy-MM-dd')
      if (map.has(eventDate)) {
        map.get(eventDate)!.push(event)
      }
    })
    return map
  }, [events, weekDays])

  useEffect(() => {
    if (gridRef.current) {
      const now = new Date()
      const currentHour = getHours(now)
      if (currentHour >= 6 && currentHour <= 22) {
        const scrollTo = (currentHour - 6) * 60
        gridRef.current.scrollTop = scrollTo - 60
      }
    }
  }, [])

  return (
    <div ref={gridRef} className="overflow-y-auto max-h-[560px] relative">
      <div className="min-w-[640px]">
        {/* Header Row */}
        <div className="sticky top-0 z-30 bg-background border-b">
          <div className="grid grid-cols-[48px_repeat(7,1fr)]">
            <div className="p-1.5" />
            {weekDays.map((day) => {
              const dayEvents = eventsByDay.get(format(day, 'yyyy-MM-dd')) || []
              return (
                <div key={day.toISOString()} className={cn(
                  'py-2 px-1 text-center border-l',
                  isToday(day) ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                )}>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase">
                    {format(day, 'EEE')}
                  </p>
                  <p className={cn(
                    'text-base font-bold mt-0.5',
                    isToday(day) ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                  )}>
                    {format(day, 'd')}
                  </p>
                  {dayEvents.length > 0 && (
                    <Badge variant="secondary" className="text-[8px] mt-0.5 px-1 py-0 h-3.5">
                      {dayEvents.length}
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Time Grid */}
        <div className="relative">
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-border/30">
              <div className="p-1 text-[9px] text-muted-foreground text-right pr-1.5 -mt-2 h-[56px]">
                {formatHour(hour)}
              </div>
              {weekDays.map((day) => {
                const dayKey = format(day, 'yyyy-MM-dd')
                const dayEvents = eventsByDay.get(dayKey) || []
                const hourEvents = dayEvents.filter(e => {
                  if (e.allDay) return false
                  const startHour = getHours(parseISO(e.startDate))
                  return startHour === hour
                })
                return (
                  <div key={day.toISOString() + hour} className={cn(
                    'h-[56px] border-l relative group',
                    isToday(day) ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : '',
                    'hover:bg-muted/30 transition-colors'
                  )}>
                    {isToday(day) && getHours(new Date()) === hour && (
                      <div
                        className="absolute left-0 right-0 z-20 h-0.5 bg-red-500"
                        style={{ top: `${(getMinutes(new Date()) / 60) * 100}%` }}
                      >
                        <div className="absolute -left-1 -top-1 size-2.5 rounded-full bg-red-500" />
                      </div>
                    )}
                    {hourEvents.map(event => {
                      const startMin = getMinutes(parseISO(event.startDate))
                      const topOffset = (startMin / 60) * 56
                      const height = Math.max((event.duration / 60) * 56, 20)
                      return (
                        <EventBlock
                          key={event.id}
                          event={event}
                          compact={height < 40}
                          style={{ top: topOffset, height, zIndex: 10 }}
                          onClick={() => onEventClick(event)}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}

          {/* All Day Events Row */}
          {events.some(e => e.allDay) && (
            <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-border/30">
              <div className="p-1 text-[9px] text-muted-foreground text-right pr-1.5 py-2">
                All Day
              </div>
              {weekDays.map((day) => {
                const dayKey = format(day, 'yyyy-MM-dd')
                const dayEvents = (eventsByDay.get(dayKey) || []).filter(e => e.allDay)
                return (
                  <div key={day.toISOString() + '-allday'} className={cn(
                    'p-1 border-l min-h-[28px]',
                    isToday(day) ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                  )}>
                    {dayEvents.map(event => {
                      const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG['study']
                      return (
                        <div key={event.id} className={cn('rounded px-1 py-0.5 text-[9px] font-medium truncate cursor-pointer hover:opacity-80', config.bg, config.color)} onClick={() => onEventClick(event)}>
                          {event.title}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({
  events,
  selectedDate,
  onEventClick,
}: {
  events: ScheduleEvent[]
  selectedDate: Date
  onEventClick: (event: ScheduleEvent) => void
}) {
  const dayKey = format(selectedDate, 'yyyy-MM-dd')
  const dayEvents = useMemo(() =>
    events.filter(e => format(parseISO(e.startDate), 'yyyy-MM-dd') === dayKey),
    [events, dayKey]
  )
  const timedEvents = dayEvents.filter(e => !e.allDay)
  const allDayEvents = dayEvents.filter(e => e.allDay)

  return (
    <ScrollArea className="h-[560px]">
      {allDayEvents.length > 0 && (
        <div className="px-3 py-2 border-b">
          <p className="text-[10px] font-medium text-muted-foreground mb-1.5">All Day</p>
          <div className="space-y-1">
            {allDayEvents.map(event => {
              const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG['study']
              const Icon = config.icon
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ x: 4 }}
                  className={cn('flex items-center gap-2.5 rounded-lg border p-2 cursor-pointer hover:shadow-sm transition-shadow', config.bg, config.border)}
                  onClick={() => onEventClick(event)}
                >
                  <Icon className={cn('size-3.5 shrink-0', config.color)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{event.title}</p>
                    {event.courseName && <p className="text-[10px] text-muted-foreground">{event.courseName}</p>}
                  </div>
                  <Badge className={cn('text-[8px] border-0 px-1.5', config.bg, config.color)}>{config.label}</Badge>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      <div className="relative">
        {HOURS.map((hour) => {
          const hourEvents = timedEvents.filter(e => getHours(parseISO(e.startDate)) === hour)
          return (
            <div key={hour} className="flex border-b border-border/30 min-h-[56px]">
              <div className="w-14 shrink-0 p-1.5 text-[10px] text-muted-foreground text-right pr-2 -mt-2">
                {formatHour(hour)}
              </div>
              <div className="flex-1 p-1 border-l relative">
                {isToday(selectedDate) && getHours(new Date()) === hour && (
                  <div
                    className="absolute left-0 right-0 z-20 h-0.5 bg-red-500"
                    style={{ top: `${(getMinutes(new Date()) / 60) * 100}%` }}
                  >
                    <div className="absolute -left-1 -top-1 size-2.5 rounded-full bg-red-500" />
                  </div>
                )}
                <div className="space-y-1">
                  {hourEvents.map(event => {
                    const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG['study']
                    const Icon = config.icon
                    const endTime = event.endDate ? format(parseISO(event.endDate), 'h:mm a') : ''
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ x: 4 }}
                        className={cn('flex items-center gap-2.5 rounded-lg border p-2 cursor-pointer hover:shadow-sm transition-shadow', config.bg, config.border)}
                        onClick={() => onEventClick(event)}
                      >
                        <div className={cn('flex size-8 items-center justify-center rounded-lg shrink-0', config.bg)}>
                          <Icon className={cn('size-3.5', config.color)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{event.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Clock className="size-2.5" />
                              {format(parseISO(event.startDate), 'h:mm a')}
                              {endTime && ` — ${endTime}`}
                            </span>
                            {event.location && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <MapPin className="size-2.5" />
                                {event.location}
                              </span>
                            )}
                          </div>
                          {event.courseName && <p className="text-[10px] text-muted-foreground mt-0.5">{event.courseName}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {event.priority === 'urgent' && <Zap className="size-3 text-red-500" />}
                          <Badge className={cn('text-[8px] border-0 px-1.5', config.bg, config.color)}>{config.label}</Badge>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {dayEvents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarDays className="size-10 text-muted-foreground/30 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">No events scheduled</p>
          <p className="text-xs text-muted-foreground/50 mt-0.5">Add a new event or switch to another day</p>
        </div>
      )}
    </ScrollArea>
  )
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({
  events,
  selectedDate,
  onDateSelect,
  onEventClick,
}: {
  events: ScheduleEvent[]
  selectedDate: Date
  onDateSelect: (date: Date) => void
  onEventClick: (event: ScheduleEvent) => void
}) {
  const monthStart = startOfMonth(selectedDate)
  const monthEnd = endOfMonth(selectedDate)
  const days = eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 1 }), end: endOfWeek(monthEnd, { weekStartsOn: 1 }) })

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>()
    days.forEach(day => map.set(format(day, 'yyyy-MM-dd'), []))
    events.forEach(event => {
      const key = format(parseISO(event.startDate), 'yyyy-MM-dd')
      if (map.has(key)) map.get(key)!.push(event)
    })
    return map
  }, [events, days])

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="py-1.5 text-center text-[10px] font-semibold text-muted-foreground uppercase">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-border/30 rounded-lg overflow-hidden">
        {days.map(day => {
          const dayKey = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDate.get(dayKey) || []
          const isCurrentMonth = isSameMonth(day, selectedDate)

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[72px] md:min-h-[90px] p-1.5 bg-background cursor-pointer transition-colors hover:bg-muted/30',
                !isCurrentMonth && 'opacity-40',
                isToday(day) && 'bg-emerald-50/50 dark:bg-emerald-950/20',
                isSameDay(day, selectedDate) && 'ring-2 ring-inset ring-emerald-500/50',
              )}
              onClick={() => onDateSelect(day)}
            >
              <p className={cn(
                'text-[11px] font-medium mb-0.5',
                isToday(day) ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-foreground'
              )}>
                {format(day, 'd')}
              </p>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(event => {
                  const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG['study']
                  return (
                    <div
                      key={event.id}
                      className={cn('rounded px-1 py-0.5 text-[8px] font-medium truncate cursor-pointer hover:opacity-80', config.bg, config.color)}
                      onClick={(e) => { e.stopPropagation(); onEventClick(event) }}
                    >
                      {!event.allDay && format(parseISO(event.startDate), 'h:mm ')}{event.title}
                    </div>
                  )
                })}
                {dayEvents.length > 3 && (
                  <p className="text-[8px] text-muted-foreground font-medium pl-1">
                    +{dayEvents.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({
  events,
  onEventClick,
}: {
  events: ScheduleEvent[]
  onEventClick: (event: ScheduleEvent) => void
}) {
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>()
    const sorted = [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    sorted.forEach(event => {
      const key = format(parseISO(event.startDate), 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(event)
    })
    return map
  }, [events])

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <List className="size-10 text-muted-foreground/30 mb-2" />
        <p className="text-sm font-medium text-muted-foreground">No events to display</p>
        <p className="text-xs text-muted-foreground/50 mt-0.5">Add events or adjust your filters</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[560px]">
      <div className="space-y-3 p-1">
        {Array.from(eventsByDate.entries()).map(([dateKey, dayEvents]) => (
          <div key={dateKey}>
            <div className="flex items-center gap-2 mb-1.5 sticky top-0 bg-background py-1 z-10">
              <p className="text-xs font-bold">
                {isToday(parseISO(dateKey)) ? 'Today' : isSameDay(parseISO(dateKey), addDays(new Date(), 1)) ? 'Tomorrow' : format(parseISO(dateKey), 'EEE, MMM d')}
              </p>
              <Separator className="flex-1" />
              <Badge variant="secondary" className="text-[9px]">{dayEvents.length}</Badge>
            </div>
            <div className="space-y-1">
              {dayEvents.map(event => {
                const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG['study']
                const Icon = config.icon
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ x: 4 }}
                    className={cn('flex items-center gap-2.5 rounded-lg border p-2.5 cursor-pointer hover:shadow-sm transition-all', config.bg, config.border)}
                    onClick={() => onEventClick(event)}
                  >
                    <div className={cn('flex size-9 items-center justify-center rounded-lg shrink-0', config.bg)}>
                      <Icon className={cn('size-4', config.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate">{event.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {!event.allDay && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="size-2.5" />
                            {format(parseISO(event.startDate), 'h:mm a')}
                            {event.duration ? ` · ${event.duration}m` : ''}
                          </span>
                        )}
                        {event.courseName && (
                          <span className="text-[10px] text-muted-foreground truncate">{event.courseName}</span>
                        )}
                        {event.location && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <MapPin className="size-2.5" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge className={cn('text-[8px] border-0 px-1.5', config.bg, config.color)}>{config.label}</Badge>
                      {event.priority === 'urgent' && <Zap className="size-3 text-red-500" />}
                      {event.meetingUrl && <Video className="size-3 text-sky-500" />}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

// ─── Unified Sidebar Panel ────────────────────────────────────────────────────

function SidebarPanel({
  events,
  selectedDate,
  onDateSelect,
  deadlines,
  linkedEvent,
  onAddEvent,
}: {
  events: ScheduleEvent[]
  selectedDate: Date
  onDateSelect: (date: Date) => void
  deadlines: Deadlines
  linkedEvent: ScheduleEvent | null
  onAddEvent: () => void
}) {
  const eventDates = useMemo(() => {
    const set = new Set<string>()
    events.forEach(e => set.add(format(parseISO(e.startDate), 'yyyy-MM-dd')))
    return set
  }, [events])

  const allDeadlines = useMemo(() => [
    ...deadlines.urgent.map(d => ({ ...d, urgency: 'urgent' as const })),
    ...deadlines.soon.map(d => ({ ...d, urgency: 'soon' as const })),
    ...deadlines.upcoming.map(d => ({ ...d, urgency: 'normal' as const })),
  ].slice(0, 6), [deadlines])

  // Get unique event types present for the legend
  const presentTypes = useMemo(() => {
    const set = new Set<EventType>()
    events.forEach(e => set.add(e.type))
    return Array.from(set)
  }, [events])

  return (
    <Card className="overflow-hidden h-full">
      <div className="flex flex-col h-full">
        {/* Mini Calendar */}
        <div className="p-2">
          <ShadcnCalendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateSelect(date)}
            className="rounded-md [&_.rdp]:text-xs [&_.rdp-day]:size-7 [&_.rdp-head_cell]:size-7 [&_.rdp-cell]:size-7"
            modifiers={{ hasEvents: (date) => eventDates.has(format(date, 'yyyy-MM-dd')) }}
            modifiersClassNames={{ hasEvents: 'relative' }}
            components={{
              DayButton: ({ day, modifiers, ...props }) => {
                const hasEvent = eventDates.has(format(day.date, 'yyyy-MM-dd'))
                return (
                  <button
                    {...props}
                    className={cn(props.className, 'relative')}
                  >
                    {format(day.date, 'd')}
                    {hasEvent && !modifiers.selected && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 size-1 rounded-full bg-emerald-500" />
                    )}
                  </button>
                )
              }
            }}
          />
        </div>

        <Separator />

        {/* Event Type Legend */}
        <div className="px-3 py-2.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Legend</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {presentTypes.map(type => {
              const config = EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG['study']
              return (
                <div key={type} className="flex items-center gap-1">
                  <span className={cn('size-2 rounded-full shrink-0', config.dot)} />
                  <span className="text-[10px] text-muted-foreground">{config.label}</span>
                </div>
              )
            })}
            {presentTypes.length === 0 && (
              <span className="text-[10px] text-muted-foreground/50">No events yet</span>
            )}
          </div>
        </div>

        <Separator />

        {/* Upcoming Deadlines */}
        <div className="px-3 py-2.5 flex-1 min-h-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Bell className="size-3 text-amber-500" />
            Deadlines
          </p>
          {allDeadlines.length === 0 ? (
            <p className="text-[10px] text-muted-foreground/50 text-center py-3">No upcoming deadlines</p>
          ) : (
            <ScrollArea className="max-h-[140px]">
              <div className="space-y-1 pr-1">
                {allDeadlines.map((deadline) => {
                  const typeConfig = EVENT_TYPE_CONFIG[deadline.type as EventType] || EVENT_TYPE_CONFIG['assignment']
                  const Icon = typeConfig.icon
                  return (
                    <div
                      key={deadline.id}
                      className={cn(
                        'flex items-center gap-2 rounded-md border p-1.5 transition-all hover:shadow-sm cursor-pointer',
                        deadline.urgency === 'urgent' ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' :
                        deadline.urgency === 'soon' ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20' :
                        'border-border'
                      )}
                    >
                      <div className={cn('flex size-6 items-center justify-center rounded shrink-0', typeConfig.bg)}>
                        <Icon className={cn('size-3', typeConfig.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold truncate">{deadline.title}</p>
                        {deadline.courseName && (
                          <p className="text-[8px] text-muted-foreground truncate">{deadline.courseName}</p>
                        )}
                      </div>
                      <Badge className={cn(
                        'text-[7px] border-0 px-1 shrink-0',
                        deadline.urgency === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                        deadline.urgency === 'soon' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {deadline.urgency === 'urgent' && <Zap className="size-2 mr-0.5" />}
                        {formatCountdown(deadline.dueDate)}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <Separator />

        {/* Focus Timer */}
        <div className="px-3 py-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Brain className="size-3 text-teal-500" />
            Focus Timer
          </p>
          <FocusTimer linkedEvent={linkedEvent} />
        </div>

        <Separator />

        {/* Quick Add */}
        <div className="p-2">
          <Button
            variant="outline"
            className="w-full gap-1.5 h-8 text-xs border-dashed hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            onClick={onAddEvent}
          >
            <Plus className="size-3.5" /> Quick Add Event
          </Button>
        </div>
      </div>
    </Card>
  )
}

// ─── Event Detail Dialog ──────────────────────────────────────────────────────

function EventDetailDialog({
  event,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  event: ScheduleEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (event: ScheduleEvent) => void
  onDelete: (eventId: string) => void
  onStatusChange: (eventId: string, status: string) => void
}) {
  if (!event) return null
  const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG['study']
  const Icon = config.icon
  const priorityConfig = PRIORITY_CONFIG[event.priority] || PRIORITY_CONFIG['medium']

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={cn('flex size-10 items-center justify-center rounded-xl shrink-0', config.bg)}>
              <Icon className={cn('size-5', config.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg">{event.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className={cn('text-[10px] border-0 px-2', config.bg, config.color)}>{config.label}</Badge>
                <Badge className={cn('text-[10px] border-0 px-2', priorityConfig.bg, priorityConfig.color)}>{priorityConfig.label}</Badge>
                {event.isRecurring && (
                  <Badge variant="outline" className="text-[10px] px-2">
                    <RotateCcw className="size-2.5 mr-1" />Recurring
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div className="flex items-center gap-3 text-sm">
            <Clock className="size-4 text-muted-foreground shrink-0" />
            <div>
              {event.allDay ? (
                <span>All Day — {format(parseISO(event.startDate), 'EEE, MMM d, yyyy')}</span>
              ) : (
                <span>
                  {format(parseISO(event.startDate), 'EEE, MMM d · h:mm a')}
                  {event.endDate && ` — ${format(parseISO(event.endDate), 'h:mm a')}`}
                  {event.duration > 0 && <span className="text-muted-foreground"> ({event.duration} min)</span>}
                </span>
              )}
            </div>
          </div>

          {event.location && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="size-4 text-muted-foreground shrink-0" />
              <span>{event.location}</span>
            </div>
          )}

          {event.meetingUrl && (
            <div className="flex items-center gap-3 text-sm">
              <Video className="size-4 text-sky-500 shrink-0" />
              <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1">
                Join Meeting <ExternalLink className="size-3" />
              </a>
            </div>
          )}

          {event.courseName && (
            <div className="flex items-center gap-3 text-sm">
              <BookOpen className="size-4 text-muted-foreground shrink-0" />
              <span>{event.courseName}</span>
            </div>
          )}

          {event.instructorName && (
            <div className="flex items-center gap-3 text-sm">
              <GraduationCap className="size-4 text-muted-foreground shrink-0" />
              <span>{event.instructorName}</span>
            </div>
          )}

          {event.description && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              {event.description}
            </div>
          )}

          {event.tags && event.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="size-3.5 text-muted-foreground" />
              {event.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Source: <span className="font-medium capitalize">{event.source.replace('-', ' ')}</span></span>
            <span>·</span>
            <span>Status: <span className="font-medium capitalize">{event.status}</span></span>
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between mt-2">
          <div className="flex items-center gap-2">
            {event.source === 'custom' && (
              <>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { onEdit(event); onOpenChange(false) }}>
                  <Edit3 className="size-3.5" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => { onDelete(event.id); onOpenChange(false) }}>
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {event.status !== 'completed' && (
              <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={() => { onStatusChange(event.id, 'completed'); onOpenChange(false) }}>
                <CheckCircle2 className="size-3.5" /> Complete
              </Button>
            )}
            {event.meetingUrl && (
              <Button size="sm" className="gap-1.5 bg-sky-600 hover:bg-sky-700" onClick={() => window.open(event.meetingUrl!, '_blank')}>
                <Video className="size-3.5" /> Join
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Add/Edit Event Dialog ────────────────────────────────────────────────────

function EventFormDialog({
  open,
  onOpenChange,
  editEvent,
  userId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editEvent: ScheduleEvent | null
  userId: string
  onSaved: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<EventType>('study')
  const [color, setColor] = useState<EventColor>('emerald')
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState(format(new Date(), 'HH:mm'))
  const [duration, setDuration] = useState(60)
  const [allDay, setAllDay] = useState(false)
  const [priority, setPriority] = useState<EventPriority>('medium')
  const [location, setLocation] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title)
      setDescription(editEvent.description || '')
      setType(editEvent.type)
      setColor(editEvent.color)
      setStartDate(format(parseISO(editEvent.startDate), 'yyyy-MM-dd'))
      setStartTime(format(parseISO(editEvent.startDate), 'HH:mm'))
      setDuration(editEvent.duration || 60)
      setAllDay(editEvent.allDay)
      setPriority(editEvent.priority)
      setLocation(editEvent.location || '')
      setMeetingUrl(editEvent.meetingUrl || '')
      setTags(editEvent.tags?.join(', ') || '')
    } else {
      setTitle('')
      setDescription('')
      setType('study')
      setColor('emerald')
      setStartDate(format(new Date(), 'yyyy-MM-dd'))
      setStartTime(format(new Date(), 'HH:mm'))
      setDuration(60)
      setAllDay(false)
      setPriority('medium')
      setLocation('')
      setMeetingUrl('')
      setTags('')
    }
  }, [editEvent, open])

  useEffect(() => {
    setColor(getEventTypeDefaultColor(type))
  }, [type])

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }
    setSaving(true)
    try {
      const startDateTime = allDay
        ? new Date(startDate + 'T00:00:00')
        : new Date(startDate + 'T' + startTime + ':00')

      const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : null

      if (editEvent) {
        const res = await fetch('/api/student/schedule', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: editEvent.id,
            title: title.trim(),
            description: description || null,
            type,
            color,
            startDate: startDateTime.toISOString(),
            duration,
            allDay,
            priority,
            location: location || null,
            meetingUrl: meetingUrl || null,
            tags: tagsArray,
          }),
        })
        if (!res.ok) throw new Error('Failed to update event')
        toast.success('Event updated successfully')
      } else {
        const res = await fetch('/api/student/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            title: title.trim(),
            description: description || null,
            type,
            color,
            startDate: startDateTime.toISOString(),
            duration,
            allDay,
            priority,
            location: location || null,
            meetingUrl: meetingUrl || null,
            tags: tagsArray,
          }),
        })
        if (!res.ok) throw new Error('Failed to create event')
        toast.success('Event created successfully')
      }
      onSaved()
      onOpenChange(false)
    } catch {
      toast.error('Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          <DialogDescription>
            {editEvent ? 'Update the details of your event.' : 'Fill in the details to create a new schedule event.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="event-title">Title *</Label>
            <Input id="event-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as EventType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => {
                    const Ic = cfg.icon
                    return (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <Ic className="size-3.5" /> {cfg.label}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as EventPriority)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c.value}
                  className={cn(
                    'size-6 rounded-full transition-all',
                    c.bg,
                    color === c.value ? 'ring-2 ring-offset-2 ring-offset-background ' + c.ring : 'hover:scale-110'
                  )}
                  onClick={() => setColor(c.value)}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            {!allDay && (
              <div className="space-y-1.5">
                <Label>Time</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!allDay && (
              <div className="space-y-1.5">
                <Label>Duration (minutes)</Label>
                <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[15, 30, 45, 60, 90, 120, 180].map(d => (
                      <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5 flex items-end">
              <div className="flex items-center gap-2 pb-2">
                <Switch checked={allDay} onCheckedChange={setAllDay} id="all-day" />
                <Label htmlFor="all-day" className="cursor-pointer">All Day</Label>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Room, building, or address" />
          </div>

          <div className="space-y-1.5">
            <Label>Meeting URL</Label>
            <Input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://zoom.us/..." />
          </div>

          <div className="space-y-1.5">
            <Label>Notes / Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add notes..." rows={3} />
          </div>

          <div className="space-y-1.5">
            <Label>Tags (comma separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. important, review" />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            {saving ? 'Saving...' : editEvent ? 'Update Event' : 'Create Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StudentScheduleView() {
  const { currentUser } = useAppStore()
  const userId = currentUser?.id || ''

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [stats, setStats] = useState<ScheduleStats | null>(null)
  const [deadlines, setDeadlines] = useState<Deadlines>({ urgent: [], soon: [], upcoming: [] })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ type: 'all', source: 'all', priority: 'all', course: 'all' })

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null)
  const [editEvent, setEditEvent] = useState<ScheduleEvent | null>(null)

  // Sidebar mobile
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Fetch schedule data
  const fetchSchedule = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const dateParam = format(selectedDate, 'yyyy-MM-dd')
      const res = await fetch(`/api/student/schedule?userId=${userId}&view=${viewMode === 'list' ? 'week' : viewMode}&date=${dateParam}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data: ScheduleResponse = await res.json()
      setEvents(data.events || [])
      setStats(data.stats || { todayEvents: 0, weekEvents: 0, pendingDeadlines: 0, upcomingLiveSessions: 0, totalStudyHours: 0 })
      setDeadlines(data.deadlines || { urgent: [], soon: [], upcoming: [] })
    } catch {
      toast.error('Failed to load schedule')
      setEvents([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [userId, selectedDate, viewMode])

  useEffect(() => {
    fetchSchedule()
  }, [fetchSchedule])

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (filters.type !== 'all' && event.type !== filters.type) return false
      if (filters.source !== 'all' && event.source !== filters.source) return false
      if (filters.priority !== 'all' && event.priority !== filters.priority) return false
      if (filters.course !== 'all' && event.courseName !== filters.course) return false
      return true
    })
  }, [events, filters])

  // Unique courses for filter
  const uniqueCourses = useMemo(() => {
    const set = new Set<string>()
    events.forEach(e => { if (e.courseName) set.add(e.courseName) })
    return Array.from(set).sort()
  }, [events])

  // Unique event types present
  const presentEventTypes = useMemo(() => {
    const set = new Set<EventType>()
    events.forEach(e => set.add(e.type))
    return Array.from(set)
  }, [events])

  // Date navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'day') {
      setSelectedDate(direction === 'next' ? addDays(selectedDate, 1) : subDays(selectedDate, 1))
    } else if (viewMode === 'week' || viewMode === 'list') {
      setSelectedDate(direction === 'next' ? addWeeks(selectedDate, 1) : subWeeks(selectedDate, 1))
    } else {
      setSelectedDate(direction === 'next' ? addMonths(selectedDate, 1) : subMonths(selectedDate, 1))
    }
  }

  const goToToday = () => setSelectedDate(new Date())

  // Event handlers
  const handleEventClick = (event: ScheduleEvent) => {
    setSelectedEvent(event)
    setShowDetailDialog(true)
  }

  const handleEditEvent = (event: ScheduleEvent) => {
    setEditEvent(event)
    setShowAddDialog(true)
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/student/schedule?eventId=${eventId}&userId=${userId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Event deleted')
      fetchSchedule()
    } catch {
      toast.error('Failed to delete event')
    }
  }

  const handleStatusChange = async (eventId: string, status: string) => {
    // For non-custom events (assignments, quizzes, live sessions) with synthetic IDs,
    // update local state only since they aren't in the scheduleEvent table
    const event = events.find(e => e.id === eventId)
    if (!event || event.source !== 'custom') {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status } : e))
      toast.success(`Event marked as ${status}`)
      return
    }
    try {
      const res = await fetch('/api/student/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, status, userId }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Event marked as ${status}`)
      fetchSchedule()
    } catch {
      toast.error('Failed to update event status')
    }
  }

  // Format header date range
  const headerDateLabel = useMemo(() => {
    if (viewMode === 'day') return format(selectedDate, 'EEEE, MMMM d, yyyy')
    if (viewMode === 'week') {
      const wkStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
      const wkEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
      return `${format(wkStart, 'MMM d')} — ${format(wkEnd, 'MMM d, yyyy')}`
    }
    if (viewMode === 'month') return format(selectedDate, 'MMMM yyyy')
    const wkStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const wkEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
    return `${format(wkStart, 'MMM d')} — ${format(wkEnd, 'MMM d, yyyy')}`
  }, [viewMode, selectedDate])

  // Stats data for inline bar
  const statItems = useMemo(() => [
    { label: 'Today', value: stats?.todayEvents ?? 0, icon: CalendarDays, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'This Week', value: stats?.weekEvents ?? 0, icon: CalendarRange, color: 'text-teal-600 dark:text-teal-400' },
    { label: 'Deadlines', value: stats?.pendingDeadlines ?? 0, icon: AlertCircle, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Live', value: stats?.upcomingLiveSessions ?? 0, icon: Video, color: 'text-sky-600 dark:text-sky-400' },
    { label: 'Study Hours', value: stats?.totalStudyHours ?? 0, icon: Clock, color: 'text-violet-600 dark:text-violet-400' },
  ], [stats])

  const hasActiveFilters = filters.type !== 'all' || filters.source !== 'all' || filters.priority !== 'all' || filters.course !== 'all'

  const clearFilters = () => {
    setFilters({ type: 'all', source: 'all', priority: 'all', course: 'all' })
  }

  if (loading && events.length === 0) {
    return <ScheduleSkeleton />
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="space-y-3"
      >
        {/* ═══════════════════════════════════════════════════════════════════════
            COMPACT HEADER TOOLBAR — Everything in one row
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Title + Date */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm shrink-0">
              <Calendar className="size-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground leading-tight">Schedule</h1>
              <p className="text-xs text-muted-foreground truncate">{headerDateLabel}</p>
            </div>
          </div>

          {/* Right: Nav + Switcher + Add */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Navigation arrows + Today */}
            <div className="flex items-center gap-0.5">
              <Button variant="outline" size="icon" className="size-7" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" className="size-7" onClick={() => navigateDate('next')}>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>

            {/* Segmented View Switcher */}
            <div className="flex items-center bg-muted rounded-md p-0.5">
              {([
                { mode: 'day' as ViewMode, icon: CalendarDays, label: 'Day' },
                { mode: 'week' as ViewMode, icon: LayoutGrid, label: 'Week' },
                { mode: 'month' as ViewMode, icon: CalendarRange, label: 'Month' },
                { mode: 'list' as ViewMode, icon: List, label: 'List' },
              ]).map(v => (
                <Tooltip key={v.mode}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'gap-1 h-6 px-2 text-[11px] rounded-sm',
                        viewMode === v.mode && 'bg-background shadow-sm text-foreground'
                      )}
                      onClick={() => setViewMode(v.mode)}
                    >
                      <v.icon className="size-3" />
                      <span className="hidden md:inline">{v.label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{v.label} View</TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Add Event */}
            <Button size="sm" className="gap-1 h-7 px-3 text-[11px] bg-emerald-600 hover:bg-emerald-700" onClick={() => { setEditEvent(null); setShowAddDialog(true) }}>
              <Plus className="size-3.5" /> <span className="hidden sm:inline">Add Event</span>
            </Button>

            {/* Mobile sidebar toggle */}
            <Button variant="outline" size="icon" className="size-7 lg:hidden" onClick={() => setSidebarOpen(true)}>
              <PanelRight className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            STATS BAR — StudentStatCard grid
            ═══════════════════════════════════════════════════════════════════════ */}
        <StudentStatCardGrid columns={5}>
          <StudentStatCard
            icon={CalendarDays}
            value={stats?.todayEvents ?? 0}
            label="Today"
            color="emerald"
            index={0}
          />
          <StudentStatCard
            icon={CalendarRange}
            value={stats?.weekEvents ?? 0}
            label="This Week"
            color="teal"
            index={1}
          />
          <StudentStatCard
            icon={AlertCircle}
            value={stats?.pendingDeadlines ?? 0}
            label="Deadlines"
            color="amber"
            pulse={(stats?.pendingDeadlines ?? 0) > 0}
            index={2}
          />
          <StudentStatCard
            icon={Video}
            value={stats?.upcomingLiveSessions ?? 0}
            label="Live"
            color="sky"
            index={3}
          />
          <StudentStatCard
            icon={Clock}
            value={stats?.totalStudyHours ?? 0}
            label="Study Hours"
            color="violet"
            index={4}
          />
        </StudentStatCardGrid>

        {/* ═══════════════════════════════════════════════════════════════════════
            FILTER CHIPS — Inline, not a popover
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="size-3.5 text-muted-foreground shrink-0" />

          {/* Type filter: clickable color-coded dots — scrollable on mobile */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin -mx-3 px-3 sm:mx-0 sm:px-0">
            <button
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all border whitespace-nowrap',
                filters.type === 'all'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
              )}
              onClick={() => setFilters({ ...filters, type: 'all' })}
            >
              All
            </button>
            {presentEventTypes.map(type => {
              const config = EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG['study']
              return (
                <Tooltip key={type}>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all border whitespace-nowrap',
                        filters.type === type
                          ? cn(config.bg, config.color, config.border)
                          : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                      )}
                      onClick={() => setFilters({ ...filters, type: filters.type === type ? 'all' : type })}
                    >
                      <span className={cn('size-1.5 rounded-full', config.dot)} />
                      <span className="hidden md:inline">{config.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{config.label}</TooltipContent>
                </Tooltip>
              )
            })}
          </div>

          {/* Desktop: Source + Priority + Course selects */}
          <div className="hidden md:flex items-center gap-1.5">
            {/* Source filter chip */}
            <Select value={filters.source} onValueChange={(v) => setFilters({ ...filters, source: v })}>
              <SelectTrigger className="h-6 w-auto min-w-[80px] max-w-[120px] text-[10px] gap-1 rounded-full border-transparent bg-muted/50 hover:bg-muted px-2">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="live-session">Live Session</SelectItem>
                <SelectItem value="assignment">Assignment</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="study-group">Study Group</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority filter chip */}
            <Select value={filters.priority} onValueChange={(v) => setFilters({ ...filters, priority: v })}>
              <SelectTrigger className="h-6 w-auto min-w-[70px] max-w-[110px] text-[10px] gap-1 rounded-full border-transparent bg-muted/50 hover:bg-muted px-2">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Course filter chip (only if courses exist) */}
            {uniqueCourses.length > 0 && (
              <Select value={filters.course} onValueChange={(v) => setFilters({ ...filters, course: v })}>
                <SelectTrigger className="h-6 w-auto min-w-[80px] max-w-[140px] text-[10px] gap-1 rounded-full border-transparent bg-muted/50 hover:bg-muted px-2">
                  <SelectValue placeholder="Course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {uniqueCourses.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Mobile: Filter sheet button */}
          <MobileFilterSheet
            activeCount={[filters.source !== 'all', filters.priority !== 'all', filters.course !== 'all'].filter(Boolean).length}
            onClearAll={clearFilters}
            title="Schedule Filters"
          >
            <MobileFilterGroup label="Source">
              <Select value={filters.source} onValueChange={(v) => setFilters({ ...filters, source: v })}>
                <SelectTrigger className="w-full rounded-xl h-10 text-[13px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="live-session">Live Session</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="study-group">Study Group</SelectItem>
                </SelectContent>
              </Select>
            </MobileFilterGroup>
            <MobileFilterGroup label="Priority">
              <Select value={filters.priority} onValueChange={(v) => setFilters({ ...filters, priority: v })}>
                <SelectTrigger className="w-full rounded-xl h-10 text-[13px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </MobileFilterGroup>
            {uniqueCourses.length > 0 && (
              <MobileFilterGroup label="Course">
                <Select value={filters.course} onValueChange={(v) => setFilters({ ...filters, course: v })}>
                  <SelectTrigger className="w-full rounded-xl h-10 text-[13px]">
                    <SelectValue placeholder="Course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {uniqueCourses.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </MobileFilterGroup>
            )}
          </MobileFilterSheet>

          {/* Clear all */}
          {hasActiveFilters && (
            <button
              className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={clearFilters}
            >
              <X className="size-2.5" /> Clear
            </button>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            MAIN CONTENT — Two-column: Calendar (70%) + Sidebar Panel (30%)
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          {/* Calendar View */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={viewMode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {viewMode === 'week' && (
                    <WeekView events={filteredEvents} selectedDate={selectedDate} onEventClick={handleEventClick} />
                  )}
                  {viewMode === 'day' && (
                    <DayView events={filteredEvents} selectedDate={selectedDate} onEventClick={handleEventClick} />
                  )}
                  {viewMode === 'month' && (
                    <MonthView
                      events={filteredEvents}
                      selectedDate={selectedDate}
                      onDateSelect={setSelectedDate}
                      onEventClick={handleEventClick}
                    />
                  )}
                  {viewMode === 'list' && (
                    <ListView events={filteredEvents} onEventClick={handleEventClick} />
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Right Sidebar — Desktop: Single cohesive panel */}
          <div className="hidden lg:block">
            <SidebarPanel
              events={events}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              deadlines={deadlines}
              linkedEvent={selectedEvent?.source === 'custom' ? selectedEvent : null}
              onAddEvent={() => { setEditEvent(null); setShowAddDialog(true) }}
            />
          </div>
        </div>

        {/* Mobile Sidebar Sheet */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="right" className="w-[320px] p-0 overflow-y-auto">
            <SheetHeader className="px-4 pt-4">
              <SheetTitle className="text-sm">Schedule Tools</SheetTitle>
              <SheetDescription className="text-xs">Calendar, deadlines, and focus timer</SheetDescription>
            </SheetHeader>
            <div className="px-2 pb-4">
              <SidebarPanel
                events={events}
                selectedDate={selectedDate}
                onDateSelect={(d) => { setSelectedDate(d); setSidebarOpen(false) }}
                deadlines={deadlines}
                linkedEvent={selectedEvent?.source === 'custom' ? selectedEvent : null}
                onAddEvent={() => { setEditEvent(null); setShowAddDialog(true); setSidebarOpen(false) }}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Event Detail Dialog */}
        <EventDetailDialog
          event={selectedEvent}
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
          onStatusChange={handleStatusChange}
        />

        {/* Add/Edit Event Dialog */}
        <EventFormDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          editEvent={editEvent}
          userId={userId}
          onSaved={fetchSchedule}
        />
      </motion.div>
    </TooltipProvider>
  )
}
