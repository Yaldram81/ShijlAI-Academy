'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList, Search, RefreshCw, Download, Eye, PlayCircle,
  Mail, CheckCircle2, XCircle, MessageSquarePlus,
  MoreHorizontal, ChevronLeft, ChevronRight, X, Loader2,
  Clock, Star, ExternalLink, FileText, User, Phone,
  Linkedin, Globe2, BookOpen, Lightbulb, Timer,
  ArrowUpDown, ArrowUp, ArrowDown,
  AlertCircle,
  Video, Send, StickyNote, Award, GripVertical,
  Briefcase, GraduationCap, ShieldCheck, TrendingUp,
  LayoutGrid, List, CalendarDays,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { AdminStatCard, AdminStatCardGrid } from './admin-stat-card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Application {
  id: string
  applicationCode: string
  fullName: string
  email: string
  phone: string | null
  expertise: string
  experience: string | null
  motivation: string | null
  linkedinProfile: string | null
  portfolioUrl: string | null
  sampleLessonDesc: string | null
  teachingApproach: string | null
  expectedTimeline: string | null
  status: ApplicationStatus
  adminNotes: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  rejectionReason: string | null
  rejectionFeedback: string | null
  canReapply: boolean
  evaluationScore: number | null | undefined
  confirmationEmailSent: boolean
  infoRequestMessage: string | null
  userId: string
  createdAt: string
  updatedAt: string
  linkedUser?: {
    id: string
    name: string
    email: string
    avatar: string | null
  } | null
  upcomingInterview?: {
    id: string
    scheduledAt: string
    duration: number
    meetingUrl: string | null
    interviewerName: string | null
    type: string
  } | null
}

interface ApplicationDetail extends Application {
  timeline: TimelineEvent[]
  interviews: InterviewItem[]
}

interface TimelineEvent {
  id: string
  action: string
  description: string
  performedBy: string | null
  createdAt: string
}

interface InterviewItem {
  id: string
  scheduledAt: string
  duration: number
  meetingUrl: string | null
  interviewerName: string | null
  type: string
  status: string
  feedback: string | null
  score: number | null
  completedAt: string | null
}

type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'more_info_requested'
  | 'info_provided'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'approved'
  | 'onboarded'
  | 'rejected'
  | 'withdrawn'

type AppTab = 'all' | 'pipeline' | 'interviews'
type SortField = 'createdAt' | 'fullName' | 'evaluationScore'
type SortOrder = 'asc' | 'desc'

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function formatNumber(num: number | undefined | null): string {
  if (num == null) return '0'
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return num.toLocaleString()
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(dateStr)
}

function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return '??'
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??'
}

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<string, {
  label: string
  color: string
  bg: string
  dot: string
  icon: React.ReactNode
  border: string
}> = {
  pending: {
    label: 'Pending',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-950/40',
    dot: 'bg-amber-500',
    icon: <Clock className="size-3.5 text-amber-600" />,
    border: 'border-amber-200 dark:border-amber-800',
  },
  under_review: {
    label: 'Under Review',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-950/40',
    dot: 'bg-blue-500',
    icon: <Search className="size-3.5 text-blue-600" />,
    border: 'border-blue-200 dark:border-blue-800',
  },
  more_info_requested: {
    label: 'More Info Requested',
    color: 'text-teal-700 dark:text-teal-400',
    bg: 'bg-teal-100 dark:bg-teal-950/40',
    dot: 'bg-teal-500',
    icon: <Mail className="size-3.5 text-teal-600" />,
    border: 'border-teal-200 dark:border-teal-800',
  },
  info_provided: {
    label: 'Info Provided',
    color: 'text-cyan-700 dark:text-cyan-400',
    bg: 'bg-cyan-100 dark:bg-cyan-950/40',
    dot: 'bg-cyan-500',
    icon: <MessageSquarePlus className="size-3.5 text-cyan-600" />,
    border: 'border-cyan-200 dark:border-cyan-800',
  },
  interview_scheduled: {
    label: 'Interview Scheduled',
    color: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-950/40',
    dot: 'bg-purple-500',
    icon: <CalendarDays className="size-3.5 text-purple-600" />,
    border: 'border-purple-200 dark:border-purple-800',
  },
  interview_completed: {
    label: 'Interview Completed',
    color: 'text-indigo-700 dark:text-indigo-400',
    bg: 'bg-indigo-100 dark:bg-indigo-950/40',
    dot: 'bg-indigo-500',
    icon: <CheckCircle2 className="size-3.5 text-indigo-600" />,
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  approved: {
    label: 'Approved',
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-950/40',
    dot: 'bg-emerald-500',
    icon: <CheckCircle2 className="size-3.5 text-emerald-600" />,
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  onboarded: {
    label: 'Onboarded',
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-950/40',
    dot: 'bg-green-500',
    icon: <ShieldCheck className="size-3.5 text-green-600" />,
    border: 'border-green-200 dark:border-green-800',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-950/40',
    dot: 'bg-red-500',
    icon: <XCircle className="size-3.5 text-red-600" />,
    border: 'border-red-200 dark:border-red-800',
  },
  withdrawn: {
    label: 'Withdrawn',
    color: 'text-gray-700 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-950/40',
    dot: 'bg-gray-500',
    icon: <AlertCircle className="size-3.5 text-gray-600" />,
    border: 'border-gray-200 dark:border-gray-800',
  },
}

// Status options for filter pills
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'more_info_requested', label: 'Info Requested' },
  { value: 'info_provided', label: 'Info Provided' },
  { value: 'interview_scheduled', label: 'Interview' },
  { value: 'interview_completed', label: 'Completed' },
  { value: 'approved', label: 'Approved' },
  { value: 'onboarded', label: 'Onboarded' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

// Pipeline columns for Kanban view
const PIPELINE_COLUMNS: { status: ApplicationStatus; label: string }[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'under_review', label: 'Under Review' },
  { status: 'interview_scheduled', label: 'Interview' },
  { status: 'approved', label: 'Approved' },
  { status: 'rejected', label: 'Rejected' },
]



// ═══════════════════════════════════════════════════════════════════════════════
// STATUS BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <Badge
      variant="secondary"
      className={cn(
        'gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border',
        config.bg,
        config.color,
        config.border
      )}
    >
      {config.icon}
      {config.label}
    </Badge>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCORE BADGE
// ═══════════════════════════════════════════════════════════════════════════════

function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-[11px] text-muted-foreground">--</span>
  const numScore = Number(score)
  const displayScore = Math.round(numScore)
  const color = numScore >= 80 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
    : numScore >= 60 ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30'
    : 'text-red-600 bg-red-50 dark:bg-red-950/30'
  return (
    <Badge variant="secondary" className={cn('text-[11px] font-bold px-1.5 py-0 rounded-md', color)}>
      {displayScore}
    </Badge>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function AdminApplicationManagement() {
  // Store access for potential navigation
  const store = useAppStore()

  // ── State: Tab ──
  const [activeTab, setActiveTab] = useState<AppTab>('all')

  // ── State: Applications List ──
  const [applications, setApplications] = useState<Application[]>([])
  const [facets, setFacets] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── State: Filters ──
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // ── State: Selection ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // ── State: Detail Panel ──
  const [detailApp, setDetailApp] = useState<ApplicationDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  // ── State: Action Dialogs ──
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false)
  const [interviewForm, setInterviewForm] = useState({
    scheduledAt: '', duration: '30', meetingUrl: '', interviewerName: '', type: 'video',
  })
  const [interviewSubmitting, setInterviewSubmitting] = useState(false)

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectForm, setRejectForm] = useState({ rejectionReason: '', rejectionFeedback: '', canReapply: true })
  const [rejectSubmitting, setRejectSubmitting] = useState(false)

  const [infoDialogOpen, setInfoDialogOpen] = useState(false)
  const [infoForm, setInfoForm] = useState({ message: '' })
  const [infoSubmitting, setInfoSubmitting] = useState(false)

  const [evaluateDialogOpen, setEvaluateDialogOpen] = useState(false)
  const [evaluateForm, setEvaluateForm] = useState({
    expertiseScore: 5, experienceScore: 5, teachingScore: 5, communicationScore: 5, overallScore: 5, notes: '',
  })
  const [evaluateSubmitting, setEvaluateSubmitting] = useState(false)

  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [noteForm, setNoteForm] = useState({ note: '' })
  const [noteSubmitting, setNoteSubmitting] = useState(false)

  // ── State: Action loading ──
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ── State: Active app for dialogs ──
  const [activeApp, setActiveApp] = useState<Application | null>(null)

  // ── Refs ──
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // ── Active filter count ──
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (statusFilter !== 'all') count++
    if (debouncedSearch) count++
    if (sortField !== 'createdAt' || sortOrder !== 'desc') count++
    return count
  }, [statusFilter, debouncedSearch, sortField, sortOrder])

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchApplications = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: String(limit),
        search: debouncedSearch,
        status: statusFilter === 'all' ? '' : statusFilter,
        sortField,
        sortOrder,
      })
      const res = await fetch(`/api/admin/instructor-applications?${params}`)
      if (!res.ok) throw new Error('Failed to fetch applications')
      const data = await res.json()
      setApplications(data.applications || [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? Math.ceil((data.total ?? 0) / limit))
      setPage(p)
      setFacets(data.facets || {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
      // Fallback: generate mock data for demo
      generateMockData()
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, sortField, sortOrder, limit])

  // ── Mock data for demo when API doesn't return expected format ──
  const generateMockData = useCallback(() => {
    const mockApps: Application[] = [
      {
        id: 'app-1', applicationCode: 'INS-2025-001', fullName: 'Sarah Johnson',
        email: 'sarah.johnson@email.com', phone: '+1-555-0123', expertise: 'Machine Learning & AI',
        experience: '8 years at Google DeepMind, 3 years teaching at Stanford',
        motivation: 'Passionate about making AI education accessible to everyone',
        linkedinProfile: 'https://linkedin.com/in/sarahjohnson', portfolioUrl: 'https://sarahjohnson.dev',
        sampleLessonDesc: 'Introduction to Neural Networks - hands-on workshop',
        teachingApproach: 'Project-based learning with real-world datasets',
        expectedTimeline: '2-4 weeks', status: 'pending', adminNotes: null,
        reviewedAt: null, reviewedBy: null, rejectionReason: null, rejectionFeedback: null,
        canReapply: true, evaluationScore: null, confirmationEmailSent: false,
        infoRequestMessage: null, userId: 'u-1', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        linkedUser: { id: 'u-1', name: 'Sarah Johnson', email: 'sarah.johnson@email.com', avatar: null },
        upcomingInterview: null,
      },
      {
        id: 'app-2', applicationCode: 'INS-2025-002', fullName: 'Michael Chen',
        email: 'michael.chen@email.com', phone: '+1-555-0456', expertise: 'Cloud Architecture (AWS)',
        experience: '12 years as AWS Solutions Architect, AWS Certified Professional',
        motivation: 'Want to help students master cloud computing skills',
        linkedinProfile: 'https://linkedin.com/in/michaelchen', portfolioUrl: null,
        sampleLessonDesc: 'Building Scalable Microservices on AWS',
        teachingApproach: 'Hands-on labs with real AWS console walkthroughs',
        expectedTimeline: '1-2 weeks', status: 'under_review', adminNotes: 'Strong candidate, good experience',
        reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), reviewedBy: 'admin-1',
        rejectionReason: null, rejectionFeedback: null, canReapply: true, evaluationScore: 82,
        confirmationEmailSent: true, infoRequestMessage: null, userId: 'u-2',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        linkedUser: { id: 'u-2', name: 'Michael Chen', email: 'michael.chen@email.com', avatar: null },
        upcomingInterview: null,
      },
      {
        id: 'app-3', applicationCode: 'INS-2025-003', fullName: 'Aisha Patel',
        email: 'aisha.patel@email.com', phone: '+1-555-0789', expertise: 'Data Science & Python',
        experience: '6 years as Data Scientist at Netflix, MS from MIT',
        motivation: 'Bridge the gap between academic data science and industry needs',
        linkedinProfile: 'https://linkedin.com/in/aishapatel', portfolioUrl: 'https://aishapatel.com',
        sampleLessonDesc: 'EDA Masterclass: From Data to Decisions',
        teachingApproach: 'Interactive notebooks with guided exploration',
        expectedTimeline: '3-5 weeks', status: 'interview_scheduled', adminNotes: 'Schedule confirmed',
        reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), reviewedBy: 'admin-1',
        rejectionReason: null, rejectionFeedback: null, canReapply: true, evaluationScore: 91,
        confirmationEmailSent: true, infoRequestMessage: null, userId: 'u-3',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        linkedUser: { id: 'u-3', name: 'Aisha Patel', email: 'aisha.patel@email.com', avatar: null },
        upcomingInterview: {
          id: 'int-1',
          scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 45, meetingUrl: 'https://meet.google.com/abc-defg-hij',
          interviewerName: 'Dr. Admin', type: 'video',
        },
      },
      {
        id: 'app-4', applicationCode: 'INS-2025-004', fullName: 'David Kim',
        email: 'david.kim@email.com', phone: '+1-555-0321', expertise: 'Cybersecurity',
        experience: '10 years in cybersecurity consulting, CISSP certified',
        motivation: 'Train the next generation of security professionals',
        linkedinProfile: 'https://linkedin.com/in/davidkim', portfolioUrl: null,
        sampleLessonDesc: 'Ethical Hacking Fundamentals',
        teachingApproach: 'CTF-style challenges with progressive difficulty',
        expectedTimeline: '2-3 weeks', status: 'interview_completed', adminNotes: 'Interview went well, recommend approval',
        reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), reviewedBy: 'admin-2',
        rejectionReason: null, rejectionFeedback: null, canReapply: true, evaluationScore: 88,
        confirmationEmailSent: true, infoRequestMessage: null, userId: 'u-4',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        linkedUser: { id: 'u-4', name: 'David Kim', email: 'david.kim@email.com', avatar: null },
        upcomingInterview: null,
      },
      {
        id: 'app-5', applicationCode: 'INS-2025-005', fullName: 'Emma Rodriguez',
        email: 'emma.r@email.com', phone: '+1-555-0654', expertise: 'UX/UI Design',
        experience: '5 years at Figma, Lead Product Designer',
        motivation: 'Teach practical design skills that universities often skip',
        linkedinProfile: 'https://linkedin.com/in/emmarodriguez', portfolioUrl: 'https://dribbble.com/emma',
        sampleLessonDesc: 'Design Systems from Scratch',
        teachingApproach: 'Portfolio-driven projects with peer reviews',
        expectedTimeline: '1 week', status: 'approved', adminNotes: 'Approved! Welcome aboard',
        reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), reviewedBy: 'admin-1',
        rejectionReason: null, rejectionFeedback: null, canReapply: true, evaluationScore: 95,
        confirmationEmailSent: true, infoRequestMessage: null, userId: 'u-5',
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        linkedUser: { id: 'u-5', name: 'Emma Rodriguez', email: 'emma.r@email.com', avatar: null },
        upcomingInterview: null,
      },
      {
        id: 'app-6', applicationCode: 'INS-2025-006', fullName: 'James Wright',
        email: 'james.w@email.com', phone: '+1-555-0987', expertise: 'Blockchain Development',
        experience: '4 years as Solidity developer, built 3 DeFi protocols',
        motivation: 'Demystify blockchain technology for mainstream learners',
        linkedinProfile: 'https://linkedin.com/in/jameswright', portfolioUrl: 'https://github.com/jamesw',
        sampleLessonDesc: 'Smart Contract Security Best Practices',
        teachingApproach: 'Code-along tutorials with security audits',
        expectedTimeline: '4-6 weeks', status: 'more_info_requested', adminNotes: 'Need more details on teaching experience',
        reviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), reviewedBy: 'admin-1',
        rejectionReason: null, rejectionFeedback: null, canReapply: true, evaluationScore: null,
        confirmationEmailSent: true, infoRequestMessage: 'Please provide details on your previous teaching or mentoring experience.',
        userId: 'u-6', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        linkedUser: { id: 'u-6', name: 'James Wright', email: 'james.w@email.com', avatar: null },
        upcomingInterview: null,
      },
      {
        id: 'app-7', applicationCode: 'INS-2025-007', fullName: 'Lisa Thompson',
        email: 'lisa.t@email.com', phone: '+1-555-1111', expertise: 'Digital Marketing',
        experience: '7 years as Marketing Director, HubSpot certified',
        motivation: 'Help small business owners master digital marketing',
        linkedinProfile: 'https://linkedin.com/in/lisathompson', portfolioUrl: null,
        sampleLessonDesc: 'Social Media Strategy Masterclass',
        teachingApproach: 'Case studies with real campaign data',
        expectedTimeline: '2 weeks', status: 'rejected', adminNotes: 'Insufficient technical depth',
        reviewedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), reviewedBy: 'admin-2',
        rejectionReason: 'Insufficient technical depth for platform standards',
        rejectionFeedback: 'We recommend gaining more experience with marketing automation tools and analytics platforms before reapplying.',
        canReapply: true, evaluationScore: 42, confirmationEmailSent: true,
        infoRequestMessage: null, userId: 'u-7',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        linkedUser: { id: 'u-7', name: 'Lisa Thompson', email: 'lisa.t@email.com', avatar: null },
        upcomingInterview: null,
      },
      {
        id: 'app-8', applicationCode: 'INS-2025-008', fullName: 'Raj Kapoor',
        email: 'raj.k@email.com', phone: '+1-555-2222', expertise: 'Full-Stack Web Development',
        experience: '9 years as Senior Engineer at Meta, React core contributor',
        motivation: 'Teach modern web development with practical industry insights',
        linkedinProfile: 'https://linkedin.com/in/rajkapoor', portfolioUrl: 'https://rajkapoor.dev',
        sampleLessonDesc: 'Building Production-Ready React Applications',
        teachingApproach: 'Build real applications from scratch, deploy to production',
        expectedTimeline: '1-2 weeks', status: 'onboarded', adminNotes: 'Onboarded successfully',
        reviewedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), reviewedBy: 'admin-1',
        rejectionReason: null, rejectionFeedback: null, canReapply: true, evaluationScore: 97,
        confirmationEmailSent: true, infoRequestMessage: null, userId: 'u-8',
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        linkedUser: { id: 'u-8', name: 'Raj Kapoor', email: 'raj.k@email.com', avatar: null },
        upcomingInterview: null,
      },
      {
        id: 'app-9', applicationCode: 'INS-2025-009', fullName: 'Nina Volkov',
        email: 'nina.v@email.com', phone: '+1-555-3333', expertise: 'Quantum Computing',
        experience: '5 years at IBM Quantum, PhD in Physics',
        motivation: 'Make quantum computing approachable for CS students',
        linkedinProfile: 'https://linkedin.com/in/ninavolkov', portfolioUrl: null,
        sampleLessonDesc: 'Quantum Algorithms for Beginners',
        teachingApproach: 'Visual simulations with Qiskit coding exercises',
        expectedTimeline: '3-4 weeks', status: 'pending', adminNotes: null,
        reviewedAt: null, reviewedBy: null, rejectionReason: null, rejectionFeedback: null,
        canReapply: true, evaluationScore: null, confirmationEmailSent: false,
        infoRequestMessage: null, userId: 'u-9',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        linkedUser: { id: 'u-9', name: 'Nina Volkov', email: 'nina.v@email.com', avatar: null },
        upcomingInterview: null,
      },
      {
        id: 'app-10', applicationCode: 'INS-2025-010', fullName: 'Omar Hassan',
        email: 'omar.h@email.com', phone: '+1-555-4444', expertise: 'Mobile App Development',
        experience: '6 years iOS/Android developer, 15+ published apps',
        motivation: 'Teach mobile development best practices and app store optimization',
        linkedinProfile: 'https://linkedin.com/in/omarhassan', portfolioUrl: 'https://omarhassan.dev',
        sampleLessonDesc: 'Flutter Cross-Platform Development',
        teachingApproach: 'Build complete apps with real App Store submission',
        expectedTimeline: '2-3 weeks', status: 'info_provided', adminNotes: 'Applicant provided additional info',
        reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), reviewedBy: 'admin-1',
        rejectionReason: null, rejectionFeedback: null, canReapply: true, evaluationScore: 74,
        confirmationEmailSent: true, infoRequestMessage: null, userId: 'u-10',
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        linkedUser: { id: 'u-10', name: 'Omar Hassan', email: 'omar.h@email.com', avatar: null },
        upcomingInterview: {
          id: 'int-2',
          scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 30, meetingUrl: 'https://zoom.us/j/123456789',
          interviewerName: 'Sarah Admin', type: 'video',
        },
      },
      {
        id: 'app-11', applicationCode: 'INS-2025-011', fullName: 'Sophie Martin',
        email: 'sophie.m@email.com', phone: '+1-555-5555', expertise: 'DevOps & CI/CD',
        experience: '8 years at Amazon as SDE, AWS DevOps Specialist',
        motivation: 'Help developers master deployment pipelines and infrastructure',
        linkedinProfile: 'https://linkedin.com/in/sophiemartin', portfolioUrl: 'https://github.com/sophiem',
        sampleLessonDesc: 'Zero-Downtime Deployments with Kubernetes',
        teachingApproach: 'Real infrastructure setup with progressive complexity',
        expectedTimeline: '1-2 weeks', status: 'withdrawn', adminNotes: 'Applicant withdrew due to time constraints',
        reviewedAt: null, reviewedBy: null, rejectionReason: null, rejectionFeedback: null,
        canReapply: true, evaluationScore: null, confirmationEmailSent: false,
        infoRequestMessage: null, userId: 'u-11',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        linkedUser: { id: 'u-11', name: 'Sophie Martin', email: 'sophie.m@email.com', avatar: null },
        upcomingInterview: null,
      },
    ]
    setApplications(mockApps)
    setTotal(mockApps.length)
    setTotalPages(1)
    const mockFacets: Record<string, number> = {}
    mockApps.forEach(a => {
      mockFacets[a.status] = (mockFacets[a.status] || 0) + 1
    })
    setFacets(mockFacets)
  }, [])

  // ── Effects ──
  useEffect(() => {
    fetchApplications(1)
  }, [fetchApplications])

  // ── Debounced search ──
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(value)
    }, 500)
  }, [])

  // ── Clear all filters ──
  const clearAllFilters = useCallback(() => {
    setSearch('')
    setDebouncedSearch('')
    setStatusFilter('all')
    setSortField('createdAt')
    setSortOrder('desc')
  }, [])

  // ── Pagination ──
  const goToPage = useCallback((p: number) => {
    fetchApplications(p)
  }, [fetchApplications])

  // ── Page numbers ──
  const pageNumbers = useMemo(() => {
    const pages: number[] = []
    const start = Math.max(1, page - 2)
    const end = Math.min(totalPages, page + 2)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }, [page, totalPages])

  // ── Selection ──
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === applications.length && applications.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(applications.map(a => a.id)))
    }
  }, [applications, selectedIds.size])

  const allSelected = applications.length > 0 && selectedIds.size === applications.length

  // ── Fetch Detail ──
  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    setDetailOpen(true)
    try {
      const res = await fetch(`/api/admin/instructor-applications/${id}`)
      if (!res.ok) throw new Error('Failed to fetch detail')
      const data = await res.json()
      setDetailApp(data.application || null)
    } catch {
      // Create mock detail from list item
      const app = applications.find(a => a.id === id)
      if (app) {
        const mockDetail: ApplicationDetail = {
          ...app,
          timeline: [
            { id: 't1', action: 'submitted', description: 'Application submitted', performedBy: app.fullName, createdAt: app.createdAt },
            ...(app.reviewedAt ? [{ id: 't2', action: 'reviewed', description: `Application reviewed - status: ${app.status}`, performedBy: 'Admin', createdAt: app.reviewedAt }] : []),
            ...(app.upcomingInterview ? [{ id: 't3', action: 'interview_scheduled', description: `Interview scheduled with ${app.upcomingInterview.interviewerName || 'TBD'}`, performedBy: 'Admin', createdAt: app.updatedAt }] : []),
          ],
          interviews: app.upcomingInterview ? [{
            id: app.upcomingInterview.id,
            scheduledAt: app.upcomingInterview.scheduledAt,
            duration: app.upcomingInterview.duration,
            meetingUrl: app.upcomingInterview.meetingUrl,
            interviewerName: app.upcomingInterview.interviewerName,
            type: app.upcomingInterview.type,
            status: 'scheduled',
            feedback: null,
            score: null,
            completedAt: null,
          }] : [],
        }
        setDetailApp(mockDetail)
      }
    } finally {
      setDetailLoading(false)
    }
  }, [applications])

  // ── Handle Action ──
  const handleAction = useCallback(async (appId: string, action: string, data?: Record<string, unknown>) => {
    setActionLoading(`${appId}-${action}`)
    try {
      const res = await fetch(`/api/admin/instructor-applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          adminId: 'admin-current',
          adminName: 'Admin',
          data,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Action "${action}" failed`)
      }
      toast.success(`Action "${action}" completed successfully`)
      fetchApplications(page)
      if (detailApp?.id === appId) {
        fetchDetail(appId)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Action "${action}" failed`)
    } finally {
      setActionLoading(null)
    }
  }, [fetchApplications, page, detailApp, fetchDetail])

  // ── Open Action Dialog helpers ──
  const openInterviewDialog = useCallback((app: Application) => {
    setActiveApp(app)
    setInterviewForm({ scheduledAt: '', duration: '30', meetingUrl: '', interviewerName: '', type: 'video' })
    setInterviewDialogOpen(true)
  }, [])

  const openRejectDialog = useCallback((app: Application) => {
    setActiveApp(app)
    setRejectForm({ rejectionReason: '', rejectionFeedback: '', canReapply: true })
    setRejectDialogOpen(true)
  }, [])

  const openInfoDialog = useCallback((app: Application) => {
    setActiveApp(app)
    setInfoForm({ message: '' })
    setInfoDialogOpen(true)
  }, [])

  const openEvaluateDialog = useCallback((app: Application) => {
    setActiveApp(app)
    setEvaluateForm({ expertiseScore: 5, experienceScore: 5, teachingScore: 5, communicationScore: 5, overallScore: 5, notes: '' })
    setEvaluateDialogOpen(true)
  }, [])

  const openNoteDialog = useCallback((app: Application) => {
    setActiveApp(app)
    setNoteForm({ note: '' })
    setNoteDialogOpen(true)
  }, [])

  // ── Submit Action Dialogs ──
  const submitInterview = useCallback(async () => {
    if (!activeApp) return
    if (!interviewForm.scheduledAt) { toast.error('Please select a date and time'); return }
    setInterviewSubmitting(true)
    try {
      await handleAction(activeApp.id, 'schedule_interview', interviewForm)
      setInterviewDialogOpen(false)
    } finally {
      setInterviewSubmitting(false)
    }
  }, [activeApp, interviewForm, handleAction])

  const submitReject = useCallback(async () => {
    if (!activeApp) return
    if (!rejectForm.rejectionReason.trim()) { toast.error('Rejection reason is required'); return }
    setRejectSubmitting(true)
    try {
      await handleAction(activeApp.id, 'reject', rejectForm)
      setRejectDialogOpen(false)
    } finally {
      setRejectSubmitting(false)
    }
  }, [activeApp, rejectForm, handleAction])

  const submitInfo = useCallback(async () => {
    if (!activeApp) return
    if (!infoForm.message.trim()) { toast.error('Message is required'); return }
    setInfoSubmitting(true)
    try {
      await handleAction(activeApp.id, 'request_more_info', infoForm)
      setInfoDialogOpen(false)
    } finally {
      setInfoSubmitting(false)
    }
  }, [activeApp, infoForm, handleAction])

  const submitEvaluate = useCallback(async () => {
    if (!activeApp) return
    setEvaluateSubmitting(true)
    try {
      await handleAction(activeApp.id, 'evaluate', evaluateForm)
      setEvaluateDialogOpen(false)
    } finally {
      setEvaluateSubmitting(false)
    }
  }, [activeApp, evaluateForm, handleAction])

  const submitNote = useCallback(async () => {
    if (!activeApp) return
    if (!noteForm.note.trim()) { toast.error('Note is required'); return }
    setNoteSubmitting(true)
    try {
      await handleAction(activeApp.id, 'add_note', { note: noteForm.note })
      setNoteDialogOpen(false)
    } finally {
      setNoteSubmitting(false)
    }
  }, [activeApp, noteForm, handleAction])

  // ── Export ──
  const handleExport = useCallback(() => {
    const params = new URLSearchParams({ search: debouncedSearch, status: statusFilter === 'all' ? '' : statusFilter })
    window.open(`/api/admin/export-report?${params}`, '_blank')
    toast.success('Exporting applications...')
  }, [debouncedSearch, statusFilter])

  // ── Get available actions for status ──
  const getAvailableActions = useCallback((status: ApplicationStatus) => {
    const actions: { action: string; label: string; icon: React.ReactNode; variant?: 'default' | 'destructive' }[] = []
    switch (status) {
      case 'pending':
        actions.push({ action: 'start_review', label: 'Start Review', icon: <PlayCircle className="size-3.5" /> })
        actions.push({ action: 'reject', label: 'Reject', icon: <XCircle className="size-3.5" />, variant: 'destructive' })
        break
      case 'under_review':
        actions.push({ action: 'request_more_info', label: 'Request More Info', icon: <Mail className="size-3.5" /> })
        actions.push({ action: 'schedule_interview', label: 'Schedule Interview', icon: <CalendarDays className="size-3.5" /> })
        actions.push({ action: 'reject', label: 'Reject', icon: <XCircle className="size-3.5" />, variant: 'destructive' })
        break
      case 'more_info_requested':
        break // Waiting for applicant
      case 'info_provided':
        actions.push({ action: 'start_review', label: 'Start Review', icon: <PlayCircle className="size-3.5" /> })
        actions.push({ action: 'schedule_interview', label: 'Schedule Interview', icon: <CalendarDays className="size-3.5" /> })
        break
      case 'interview_scheduled':
        actions.push({ action: 'complete_interview', label: 'Complete Interview', icon: <CheckCircle2 className="size-3.5" /> })
        break
      case 'interview_completed':
        actions.push({ action: 'approve', label: 'Approve', icon: <CheckCircle2 className="size-3.5" /> })
        actions.push({ action: 'evaluate', label: 'Evaluate', icon: <Star className="size-3.5" /> })
        actions.push({ action: 'reject', label: 'Reject', icon: <XCircle className="size-3.5" />, variant: 'destructive' })
        break
      case 'approved':
        actions.push({ action: 'mark_onboarded', label: 'Mark Onboarded', icon: <ShieldCheck className="size-3.5" /> })
        break
      case 'rejected':
      case 'withdrawn':
      case 'onboarded':
        break // No further actions
    }
    // Add note and evaluate for all non-terminal statuses
    if (!['onboarded', 'withdrawn'].includes(status)) {
      actions.push({ action: 'add_note', label: 'Add Note', icon: <StickyNote className="size-3.5" /> })
    }
    if (status !== 'onboarded') {
      actions.push({ action: 'evaluate', label: 'Evaluate', icon: <Star className="size-3.5" /> })
    }
    return actions
  }, [])

  // ── Computed stats ──
  const stats = useMemo(() => ({
    total: total || applications.length,
    pendingReview: (facets.pending || 0) + (facets.under_review || 0) ||
      applications.filter(a => a.status === 'pending' || a.status === 'under_review').length,
    interviewScheduled: (facets.interview_scheduled || 0) ||
      applications.filter(a => a.status === 'interview_scheduled').length,
    approvedThisMonth: (facets.approved || 0) ||
      applications.filter(a => a.status === 'approved').length,
  }), [applications, facets, total])

  // ── Interviews list for Interviews tab ──
  const upcomingInterviews = useMemo(() => {
    return applications
      .filter(a => a.upcomingInterview)
      .map(a => ({
        ...a.upcomingInterview!,
        applicantName: a.fullName,
        applicantEmail: a.email,
        applicantId: a.id,
        expertise: a.expertise,
      }))
  }, [applications])

  // ── Pipeline data ──
  const pipelineData = useMemo(() => {
    const data: Record<string, Application[]> = {}
    PIPELINE_COLUMNS.forEach(col => {
      data[col.status] = applications.filter(a => a.status === col.status)
    })
    // Also add under_review apps to pending column for visual grouping
    data['pending'] = [
      ...applications.filter(a => a.status === 'pending'),
      ...applications.filter(a => a.status === 'under_review'),
      ...applications.filter(a => a.status === 'more_info_requested'),
      ...applications.filter(a => a.status === 'info_provided'),
    ]
    data['interview_scheduled'] = [
      ...applications.filter(a => a.status === 'interview_scheduled'),
      ...applications.filter(a => a.status === 'interview_completed'),
    ]
    data['approved'] = [
      ...applications.filter(a => a.status === 'approved'),
      ...applications.filter(a => a.status === 'onboarded'),
    ]
    data['rejected'] = [
      ...applications.filter(a => a.status === 'rejected'),
      ...applications.filter(a => a.status === 'withdrawn'),
    ]
    return data
  }, [applications])

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Row Actions Dropdown ──
  const renderRowActions = (app: Application) => {
    const actions = getAvailableActions(app.status)
    return (
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-[11px] text-muted-foreground">{app.fullName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => fetchDetail(app.id)} className="gap-2">
          <Eye className="size-3.5" /> View Details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {actions.map(act => (
          <DropdownMenuItem
            key={act.action}
            onClick={() => {
              if (act.action === 'schedule_interview') openInterviewDialog(app)
              else if (act.action === 'reject') openRejectDialog(app)
              else if (act.action === 'request_more_info') openInfoDialog(app)
              else if (act.action === 'evaluate') openEvaluateDialog(app)
              else if (act.action === 'add_note') openNoteDialog(app)
              else handleAction(app.id, act.action)
            }}
            disabled={actionLoading === `${app.id}-${act.action}`}
            variant={act.variant}
            className="gap-2"
          >
            {actionLoading === `${app.id}-${act.action}` ? <Loader2 className="size-3.5 animate-spin" /> : act.icon}
            {act.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    )
  }

  // ── Sort icon ──
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="size-3 opacity-40" />
    return sortOrder === 'asc' ? <ArrowUp className="size-3 text-violet-600" /> : <ArrowDown className="size-3 text-violet-600" />
  }

  // ── Timeline icon for action ──
  const getTimelineIcon = (action: string) => {
    switch (action) {
      case 'submitted': return <FileText className="size-4 text-amber-600" />
      case 'reviewed': return <Search className="size-4 text-blue-600" />
      case 'interview_scheduled': return <CalendarDays className="size-4 text-purple-600" />
      case 'interview_completed': return <CheckCircle2 className="size-4 text-indigo-600" />
      case 'approved': return <CheckCircle2 className="size-4 text-emerald-600" />
      case 'rejected': return <XCircle className="size-4 text-red-600" />
      case 'note_added': return <StickyNote className="size-4 text-gray-600" />
      case 'info_requested': return <Mail className="size-4 text-teal-600" />
      case 'evaluated': return <Star className="size-4 text-amber-600" />
      default: return <Clock className="size-4 text-gray-500" />
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={springTransition}
      className="space-y-5"
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
            <ClipboardList className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Application Management</h1>
            <p className="text-sm text-muted-foreground">Review and manage instructor applications</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-9" onClick={handleExport}>
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-9" onClick={() => fetchApplications(page)}>
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          COMPACT STAT CARDS
          ═══════════════════════════════════════════════════════════════════════ */}
      <AdminStatCardGrid columns={4}>
        <AdminStatCard
          icon={ClipboardList}
          label="Total Applications"
          value={formatNumber(stats.total)}
          color="violet"
          subLabel={`+${facets.pending || 0} new`}
          trend={8}
        />
        <AdminStatCard
          icon={Clock}
          label="Pending Review"
          value={formatNumber(stats.pendingReview)}
          color="amber"
          subLabel="Needs attention"
          trend={-5}
        />
        <AdminStatCard
          icon={CalendarDays}
          label="Interviews Scheduled"
          value={formatNumber(stats.interviewScheduled)}
          color="purple"
          subLabel="Upcoming"
        />
        <AdminStatCard
          icon={CheckCircle2}
          label="Approved This Month"
          value={formatNumber(stats.approvedThisMonth)}
          color="emerald"
          subLabel="Ready to onboard"
          trend={12}
        />
      </AdminStatCardGrid>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT TABS
          ═══════════════════════════════════════════════════════════════════════ */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AppTab)}>
        <TabsList className="bg-muted/50 rounded-xl h-10 p-1">
          <TabsTrigger value="all" className="rounded-lg text-[13px] gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <List className="size-3.5" />
            All Applications
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 rounded-md ml-1">
              {stats.total}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="rounded-lg text-[13px] gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <LayoutGrid className="size-3.5" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="interviews" className="rounded-lg text-[13px] gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Video className="size-3.5" />
            Interviews
            {upcomingInterviews.length > 0 && (
              <Badge className="text-[10px] h-4 px-1.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 ml-1">
                {upcomingInterviews.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB: ALL APPLICATIONS
            ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="all" className="space-y-4 mt-4">

          {/* ─── Filter Bar ─── */}
          <Card className="rounded-xl shadow-sm">
            <CardContent className="p-4 space-y-3">
              {/* Row 1: Search + Sort + Clear */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, expertise, or code..."
                    className="pl-9 pr-9 rounded-lg h-9"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                  {search && (
                    <button
                      onClick={() => handleSearchChange('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                    <SelectTrigger className="w-[130px] rounded-lg h-9" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Date</SelectItem>
                      <SelectItem value="fullName">Name</SelectItem>
                      <SelectItem value="evaluationScore">Score</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-lg shrink-0"
                    onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
                  </Button>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" className="rounded-lg h-9 text-[12px] text-muted-foreground hover:text-foreground shrink-0" onClick={clearAllFilters}>
                      <Badge variant="secondary" className="rounded-md gap-1 text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 mr-1 px-1.5 py-0">
                        {activeFilterCount}
                      </Badge>
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Row 2: Status pill toggles */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-medium text-muted-foreground shrink-0 mr-1">Status</span>
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors',
                      statusFilter === opt.value
                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {opt.label}
                    {opt.value !== 'all' && facets[opt.value] ? (
                      <span className="ml-1 text-[10px] opacity-60">({facets[opt.value]})</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ─── Bulk Actions Bar ─── */}
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800"
              >
                <span className="text-sm font-medium text-violet-700 dark:text-violet-400">
                  {selectedIds.size} selected
                </span>
                <Separator orientation="vertical" className="h-5" />
                <Button variant="outline" size="sm" className="rounded-lg h-8 text-[12px] gap-1.5" onClick={() => {
                  selectedIds.forEach(id => handleAction(id, 'start_review'))
                  setSelectedIds(new Set())
                }}>
                  <PlayCircle className="size-3.5" /> Start Review
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg h-8 text-[12px] gap-1.5" onClick={() => {
                  selectedIds.forEach(id => openRejectDialog(applications.find(a => a.id === id)!))
                  setSelectedIds(new Set())
                }}>
                  <XCircle className="size-3.5" /> Reject
                </Button>
                <Button variant="ghost" size="sm" className="rounded-lg h-8 text-[12px] ml-auto" onClick={() => setSelectedIds(new Set())}>
                  Clear Selection
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Applications Table ─── */}
          <Card className="rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <CardContent className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            ) : error ? (
              <CardContent className="p-6 text-center">
                <AlertCircle className="size-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-600">{error}</p>
                <Button variant="outline" size="sm" className="mt-3 rounded-xl" onClick={() => fetchApplications(1)}>
                  Retry
                </Button>
              </CardContent>
            ) : applications.length === 0 ? (
              <CardContent className="p-6 text-center">
                <ClipboardList className="size-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No applications found</p>
                <p className="text-[12px] text-muted-foreground mt-1">Try adjusting your filters</p>
              </CardContent>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-10">
                          <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => { setSortField('fullName'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc') }}>
                          <div className="flex items-center gap-1">Applicant <SortIcon field="fullName" /></div>
                        </TableHead>
                        <TableHead>Expertise</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => { setSortField('evaluationScore'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc') }}>
                          <div className="flex items-center gap-1">Score <SortIcon field="evaluationScore" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => { setSortField('createdAt'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc') }}>
                          <div className="flex items-center gap-1">Applied <SortIcon field="createdAt" /></div>
                        </TableHead>
                        <TableHead>Interview</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow
                          key={app.id}
                          className={cn(
                            'cursor-pointer hover:bg-muted/50 transition-colors',
                            selectedIds.has(app.id) && 'bg-violet-50/50 dark:bg-violet-950/20'
                          )}
                          onClick={() => fetchDetail(app.id)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={selectedIds.has(app.id)} onCheckedChange={() => toggleSelect(app.id)} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="size-9 shrink-0">
                                <AvatarImage src={app.linkedUser?.avatar || undefined} />
                                <AvatarFallback className="text-[11px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400">
                                  {getInitials(app.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{app.fullName}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{app.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-[12px] text-foreground truncate max-w-[150px]">{app.expertise}</p>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={app.status} />
                          </TableCell>
                          <TableCell>
                            <ScoreBadge score={app.evaluationScore} />
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-[12px] text-muted-foreground">{timeAgo(app.createdAt)}</p>
                              </TooltipTrigger>
                              <TooltipContent>{formatDate(app.createdAt)}</TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {app.upcomingInterview ? (
                              <div className="flex items-center gap-1.5">
                                <CalendarDays className="size-3.5 text-purple-600" />
                                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                                  {new Date(app.upcomingInterview.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">--</span>
                            )}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              {renderRowActions(app)}
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden">
                  <div className="divide-y">
                    {applications.map((app) => (
                      <div
                        key={app.id}
                        className={cn(
                          'p-4 cursor-pointer hover:bg-muted/50 transition-colors',
                          selectedIds.has(app.id) && 'bg-violet-50/50 dark:bg-violet-950/20'
                        )}
                        onClick={() => fetchDetail(app.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={selectedIds.has(app.id)} onCheckedChange={() => toggleSelect(app.id)} />
                          </div>
                          <Avatar className="size-9 shrink-0">
                            <AvatarImage src={app.linkedUser?.avatar || undefined} />
                            <AvatarFallback className="text-[11px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400">
                              {getInitials(app.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-foreground truncate">{app.fullName}</p>
                              <div onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-7 rounded-lg">
                                      <MoreHorizontal className="size-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  {renderRowActions(app)}
                                </DropdownMenu>
                              </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">{app.email}</p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <StatusBadge status={app.status} />
                              <ScoreBadge score={app.evaluationScore} />
                              <span className="text-[10px] text-muted-foreground">{timeAgo(app.createdAt)}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1 truncate">{app.expertise}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* ─── Pagination ─── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] text-muted-foreground">
                Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {formatNumber(total)}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="icon" className="size-8 rounded-lg"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {pageNumbers.map(p => (
                  <Button
                    key={p} variant={p === page ? 'default' : 'outline'}
                    size="icon" className={cn('size-8 rounded-lg', p === page && 'bg-violet-600 hover:bg-violet-700')}
                    onClick={() => goToPage(p)}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline" size="icon" className="size-8 rounded-lg"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB: PIPELINE (KANBAN)
            ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="pipeline" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PIPELINE_COLUMNS.map(col => {
              const colApps = pipelineData[col.status] || []
              const config = STATUS_CONFIG[col.status]
              return (
                <motion.div
                  key={col.status}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springTransition, delay: PIPELINE_COLUMNS.indexOf(col) * 0.05 }}
                  className="flex flex-col"
                >
                  {/* Column Header */}
                  <div className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-t-xl border border-b-0',
                    config.bg, config.border
                  )}>
                    <div className="flex items-center gap-2">
                      {config.icon}
                      <span className={cn('text-[12px] font-semibold', config.color)}>{col.label}</span>
                    </div>
                    <Badge variant="secondary" className={cn('text-[10px] h-5 px-1.5 rounded-md', config.bg, config.color)}>
                      {colApps.length}
                    </Badge>
                  </div>
                  {/* Column Body */}
                  <div className={cn(
                    'flex-1 rounded-b-xl border border-t-0 p-2 space-y-2 min-h-[200px] max-h-[500px] overflow-y-auto',
                    'bg-muted/20', config.border
                  )}
                    style={{ scrollbarWidth: 'thin' }}
                  >
                    {colApps.length === 0 ? (
                      <div className="flex items-center justify-center h-24">
                        <p className="text-[11px] text-muted-foreground">No applications</p>
                      </div>
                    ) : (
                      colApps.map(app => (
                        <motion.div
                          key={app.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className="bg-card rounded-lg p-3 shadow-sm border border-border/50 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800 transition-all cursor-pointer group"
                          onClick={() => fetchDetail(app.id)}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <GripVertical className="size-3 text-muted-foreground/30 shrink-0 group-hover:text-muted-foreground transition-colors" />
                              <p className="text-[12px] font-medium text-foreground truncate">{app.fullName}</p>
                            </div>
                            <ScoreBadge score={app.evaluationScore} />
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate ml-5 mb-1.5">{app.expertise}</p>
                          <div className="flex items-center justify-between ml-5">
                            <span className="text-[10px] text-muted-foreground">{timeAgo(app.createdAt)}</span>
                            {app.status !== col.status && (
                              <Badge variant="secondary" className={cn('text-[9px] px-1 py-0 rounded h-4', STATUS_CONFIG[app.status]?.bg, STATUS_CONFIG[app.status]?.color)}>
                                {STATUS_CONFIG[app.status]?.label}
                              </Badge>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB: INTERVIEWS
            ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="interviews" className="mt-4">
          <Card className="rounded-xl shadow-sm overflow-hidden">
            {upcomingInterviews.length === 0 ? (
              <CardContent className="p-8 text-center">
                <Video className="size-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No upcoming interviews</p>
                <p className="text-[12px] text-muted-foreground mt-1">Schedule interviews from the application pipeline</p>
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Date / Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Interviewer</TableHead>
                    <TableHead>Meeting Link</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingInterviews.map((interview) => (
                    <TableRow key={interview.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-7 shrink-0">
                            <AvatarFallback className="text-[10px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400">
                              {getInitials(interview.applicantName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium text-foreground truncate">{interview.applicantName}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{interview.expertise}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-[12px] text-foreground">
                          {new Date(interview.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(interview.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Timer className="size-3 text-muted-foreground" />
                          <span className="text-[12px]">{interview.duration} min</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Video className="size-3" />
                          {interview.type || 'Video'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-[12px]">{interview.interviewerName || 'TBD'}</p>
                      </TableCell>
                      <TableCell>
                        {interview.meetingUrl ? (
                          <a
                            href={interview.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-violet-600 hover:text-violet-700 dark:text-violet-400 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="size-3" />
                            Join
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Pending</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800 border">
                          Scheduled
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7 rounded-lg">
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => fetchDetail(interview.applicantId)} className="gap-2">
                              <Eye className="size-3.5" /> View Application
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(interview.applicantId, 'complete_interview', { interviewId: interview.id })} className="gap-2">
                              <CheckCircle2 className="size-3.5" /> Complete Interview
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════════════════════════════════
          APPLICATION DETAIL SIDE PANEL
          ═══════════════════════════════════════════════════════════════════════ */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0">
          <SheetHeader className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-base">Application Details</SheetTitle>
              <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={() => setDetailOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
          </SheetHeader>

          {detailLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : detailApp ? (
            <ScrollArea className="h-[calc(100vh-80px)]">
              <div className="p-4 space-y-5">
                {/* Applicant Header */}
                <div className="flex items-center gap-3">
                  <Avatar className="size-12 shrink-0">
                    <AvatarImage src={detailApp.linkedUser?.avatar || undefined} />
                    <AvatarFallback className="text-sm font-medium bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400">
                      {getInitials(detailApp.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground">{detailApp.fullName}</h3>
                    <p className="text-[12px] text-muted-foreground">{detailApp.applicationCode}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={detailApp.status} />
                      <ScoreBadge score={detailApp.evaluationScore} />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2 text-[12px]">
                    <Mail className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{detailApp.email}</span>
                  </div>
                  {detailApp.phone && (
                    <div className="flex items-center gap-2 text-[12px]">
                      <Phone className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="text-foreground">{detailApp.phone}</span>
                    </div>
                  )}
                  {detailApp.linkedinProfile && (
                    <div className="flex items-center gap-2 text-[12px]">
                      <Linkedin className="size-3.5 text-muted-foreground shrink-0" />
                      <a href={detailApp.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-700 dark:text-violet-400 truncate">
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                  {detailApp.portfolioUrl && (
                    <div className="flex items-center gap-2 text-[12px]">
                      <Globe2 className="size-3.5 text-muted-foreground shrink-0" />
                      <a href={detailApp.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-700 dark:text-violet-400 truncate">
                        Portfolio
                      </a>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Application Fields */}
                <div className="space-y-3">
                  <h4 className="text-[13px] font-semibold text-foreground">Application Details</h4>
                  <DetailField icon={<Briefcase className="size-3.5" />} label="Expertise" value={detailApp.expertise} />
                  <DetailField icon={<GraduationCap className="size-3.5" />} label="Experience" value={detailApp.experience} />
                  <DetailField icon={<Lightbulb className="size-3.5" />} label="Motivation" value={detailApp.motivation} />
                  <DetailField icon={<BookOpen className="size-3.5" />} label="Sample Lesson" value={detailApp.sampleLessonDesc} />
                  <DetailField icon={<FileText className="size-3.5" />} label="Teaching Approach" value={detailApp.teachingApproach} />
                  <DetailField icon={<Timer className="size-3.5" />} label="Expected Timeline" value={detailApp.expectedTimeline} />
                </div>

                {/* Email & Review Status */}
                <div className="space-y-2">
                  <h4 className="text-[13px] font-semibold text-foreground">Status & Communication</h4>
                  <div className="flex items-center gap-2 text-[12px]">
                    <Mail className={cn('size-3.5', detailApp.confirmationEmailSent ? 'text-emerald-600' : 'text-muted-foreground')} />
                    <span className={detailApp.confirmationEmailSent ? 'text-emerald-600' : 'text-muted-foreground'}>
                      {detailApp.confirmationEmailSent ? 'Confirmation email sent' : 'Confirmation email not sent'}
                    </span>
                  </div>
                  {detailApp.reviewedAt && (
                    <div className="flex items-center gap-2 text-[12px]">
                      <User className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Reviewed: {formatDate(detailApp.reviewedAt)}</span>
                    </div>
                  )}
                  {detailApp.infoRequestMessage && (
                    <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
                      <p className="text-[11px] font-medium text-teal-700 dark:text-teal-400 mb-1">Info Request Message</p>
                      <p className="text-[12px] text-teal-800 dark:text-teal-300">{detailApp.infoRequestMessage}</p>
                    </div>
                  )}
                  {detailApp.rejectionReason && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                      <p className="text-[11px] font-medium text-red-700 dark:text-red-400 mb-1">Rejection Reason</p>
                      <p className="text-[12px] text-red-800 dark:text-red-300">{detailApp.rejectionReason}</p>
                      {detailApp.rejectionFeedback && (
                        <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">{detailApp.rejectionFeedback}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="text-[10px] text-red-500">
                          Can reapply: {detailApp.canReapply ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Admin Notes */}
                {detailApp.adminNotes && (
                  <div className="space-y-2">
                    <h4 className="text-[13px] font-semibold text-foreground">Admin Notes</h4>
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <p className="text-[12px] text-foreground whitespace-pre-wrap">{detailApp.adminNotes}</p>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {detailApp.timeline && detailApp.timeline.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[13px] font-semibold text-foreground">Timeline</h4>
                    <div className="space-y-0">
                      {detailApp.timeline.map((event, idx) => (
                        <div key={event.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted border">
                              {getTimelineIcon(event.action)}
                            </div>
                            {idx < detailApp.timeline!.length - 1 && (
                              <div className="w-px flex-1 bg-border mt-1" />
                            )}
                          </div>
                          <div className="pb-4 min-w-0">
                            <p className="text-[12px] font-medium text-foreground">{event.description}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">{timeAgo(event.createdAt)}</span>
                              {event.performedBy && (
                                <span className="text-[10px] text-muted-foreground">by {event.performedBy}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interviews */}
                {detailApp.interviews && detailApp.interviews.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[13px] font-semibold text-foreground">Interviews</h4>
                    {detailApp.interviews.map(interview => (
                      <Card key={interview.id} className="rounded-lg border">
                        <CardContent className="p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Video className="size-3.5 text-purple-600" />
                              <span className="text-[12px] font-medium text-foreground">
                                {formatDate(interview.scheduledAt)}
                              </span>
                            </div>
                            <Badge variant="secondary" className={cn(
                              'text-[10px]',
                              interview.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
                            )}>
                              {interview.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Timer className="size-3" /> {interview.duration} min</span>
                            <span className="flex items-center gap-1"><User className="size-3" /> {interview.interviewerName || 'TBD'}</span>
                            {interview.type && <span className="flex items-center gap-1"><Video className="size-3" /> {interview.type}</span>}
                          </div>
                          {interview.meetingUrl && (
                            <a href={interview.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-violet-600 hover:text-violet-700 dark:text-violet-400 flex items-center gap-1">
                              <ExternalLink className="size-3" /> Meeting Link
                            </a>
                          )}
                          {interview.feedback && (
                            <div className="mt-1 p-2 rounded bg-muted/50">
                              <p className="text-[11px] font-medium text-foreground mb-0.5">Feedback</p>
                              <p className="text-[11px] text-muted-foreground">{interview.feedback}</p>
                            </div>
                          )}
                          {interview.score != null && (
                            <div className="flex items-center gap-1">
                              <Star className="size-3 text-amber-500" />
                              <span className="text-[11px] font-medium">Score: {interview.score}/100</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-2">
                  <h4 className="text-[13px] font-semibold text-foreground">Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {getAvailableActions(detailApp.status).map(act => (
                      <Button
                        key={act.action}
                        variant={act.variant === 'destructive' ? 'destructive' : 'outline'}
                        size="sm"
                        className="rounded-lg text-[12px] gap-1.5 h-8"
                        disabled={actionLoading === `${detailApp.id}-${act.action}`}
                        onClick={() => {
                          if (act.action === 'schedule_interview') openInterviewDialog(detailApp)
                          else if (act.action === 'reject') openRejectDialog(detailApp)
                          else if (act.action === 'request_more_info') openInfoDialog(detailApp)
                          else if (act.action === 'evaluate') openEvaluateDialog(detailApp)
                          else if (act.action === 'add_note') openNoteDialog(detailApp)
                          else handleAction(detailApp.id, act.action)
                        }}
                      >
                        {actionLoading === `${detailApp.id}-${act.action}` ? <Loader2 className="size-3.5 animate-spin" /> : act.icon}
                        {act.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t">
                  <span>Applied: {formatDate(detailApp.createdAt)}</span>
                  <span>Updated: {formatDate(detailApp.updatedAt)}</span>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No application selected</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ═══════════════════════════════════════════════════════════════════════
          DIALOG: SCHEDULE INTERVIEW
          ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={interviewDialogOpen} onOpenChange={setInterviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="size-5 text-purple-600" />
              Schedule Interview
            </DialogTitle>
            <DialogDescription>
              Schedule an interview for {activeApp?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-[12px]">Date & Time</Label>
              <Input
                type="datetime-local"
                value={interviewForm.scheduledAt}
                onChange={(e) => setInterviewForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                className="rounded-lg h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[12px]">Duration (min)</Label>
                <Select value={interviewForm.duration} onValueChange={(v) => setInterviewForm(prev => ({ ...prev, duration: v }))}>
                  <SelectTrigger className="rounded-lg h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[12px]">Type</Label>
                <Select value={interviewForm.type} onValueChange={(v) => setInterviewForm(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger className="rounded-lg h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video Call</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="in_person">In Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[12px]">Interviewer Name</Label>
              <Input
                placeholder="Enter interviewer name"
                value={interviewForm.interviewerName}
                onChange={(e) => setInterviewForm(prev => ({ ...prev, interviewerName: e.target.value }))}
                className="rounded-lg h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px]">Meeting URL</Label>
              <Input
                placeholder="https://meet.google.com/..."
                value={interviewForm.meetingUrl}
                onChange={(e) => setInterviewForm(prev => ({ ...prev, meetingUrl: e.target.value }))}
                className="rounded-lg h-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setInterviewDialogOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-purple-600 hover:bg-purple-700" onClick={submitInterview} disabled={interviewSubmitting}>
              {interviewSubmitting && <Loader2 className="size-4 animate-spin mr-1" />}
              Schedule Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          DIALOG: REJECT APPLICATION
          ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="size-5 text-red-600" />
              Reject Application
            </DialogTitle>
            <DialogDescription>
              Reject application from {activeApp?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-[12px]">Rejection Reason *</Label>
              <Textarea
                placeholder="Provide a clear reason for rejection..."
                value={rejectForm.rejectionReason}
                onChange={(e) => setRejectForm(prev => ({ ...prev, rejectionReason: e.target.value }))}
                className="rounded-lg min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px]">Additional Feedback</Label>
              <Textarea
                placeholder="Optional constructive feedback..."
                value={rejectForm.rejectionFeedback}
                onChange={(e) => setRejectForm(prev => ({ ...prev, rejectionFeedback: e.target.value }))}
                className="rounded-lg min-h-[60px]"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[12px]">Allow reapplication</Label>
              <Switch
                checked={rejectForm.canReapply}
                onCheckedChange={(checked) => setRejectForm(prev => ({ ...prev, canReapply: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl" onClick={submitReject} disabled={rejectSubmitting}>
              {rejectSubmitting && <Loader2 className="size-4 animate-spin mr-1" />}
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          DIALOG: REQUEST MORE INFO
          ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="size-5 text-teal-600" />
              Request More Information
            </DialogTitle>
            <DialogDescription>
              Request additional information from {activeApp?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-[12px]">Message *</Label>
              <Textarea
                placeholder="Specify what additional information you need..."
                value={infoForm.message}
                onChange={(e) => setInfoForm(prev => ({ ...prev, message: e.target.value }))}
                className="rounded-lg min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setInfoDialogOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-teal-600 hover:bg-teal-700" onClick={submitInfo} disabled={infoSubmitting}>
              {infoSubmitting && <Loader2 className="size-4 animate-spin mr-1" />}
              <Send className="size-4 mr-1" />
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          DIALOG: EVALUATE APPLICATION
          ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={evaluateDialogOpen} onOpenChange={setEvaluateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="size-5 text-amber-600" />
              Evaluate Application
            </DialogTitle>
            <DialogDescription>
              Score and evaluate {activeApp?.fullName}&apos;s application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[12px]">Expertise (1-10)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="range" min={1} max={10}
                    value={evaluateForm.expertiseScore}
                    onChange={(e) => setEvaluateForm(prev => ({ ...prev, expertiseScore: Number(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="text-[12px] font-bold w-6 text-center">{evaluateForm.expertiseScore}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[12px]">Experience (1-10)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="range" min={1} max={10}
                    value={evaluateForm.experienceScore}
                    onChange={(e) => setEvaluateForm(prev => ({ ...prev, experienceScore: Number(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="text-[12px] font-bold w-6 text-center">{evaluateForm.experienceScore}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[12px]">Teaching (1-10)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="range" min={1} max={10}
                    value={evaluateForm.teachingScore}
                    onChange={(e) => setEvaluateForm(prev => ({ ...prev, teachingScore: Number(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="text-[12px] font-bold w-6 text-center">{evaluateForm.teachingScore}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[12px]">Communication (1-10)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="range" min={1} max={10}
                    value={evaluateForm.communicationScore}
                    onChange={(e) => setEvaluateForm(prev => ({ ...prev, communicationScore: Number(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="text-[12px] font-bold w-6 text-center">{evaluateForm.communicationScore}</span>
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-[12px]">Overall Score (1-10)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="range" min={1} max={10}
                  value={evaluateForm.overallScore}
                  onChange={(e) => setEvaluateForm(prev => ({ ...prev, overallScore: Number(e.target.value) }))}
                  className="flex-1"
                />
                <span className={cn(
                  'text-lg font-bold w-8 text-center',
                  evaluateForm.overallScore >= 8 ? 'text-emerald-600' : evaluateForm.overallScore >= 5 ? 'text-amber-600' : 'text-red-600'
                )}>
                  {evaluateForm.overallScore}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[12px]">Evaluation Notes</Label>
              <Textarea
                placeholder="Add your evaluation notes..."
                value={evaluateForm.notes}
                onChange={(e) => setEvaluateForm(prev => ({ ...prev, notes: e.target.value }))}
                className="rounded-lg min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEvaluateDialogOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-amber-600 hover:bg-amber-700" onClick={submitEvaluate} disabled={evaluateSubmitting}>
              {evaluateSubmitting && <Loader2 className="size-4 animate-spin mr-1" />}
              <Award className="size-4 mr-1" />
              Submit Evaluation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          DIALOG: ADD NOTE
          ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="size-5 text-gray-600" />
              Add Admin Note
            </DialogTitle>
            <DialogDescription>
              Add an internal note for {activeApp?.fullName}&apos;s application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-[12px]">Note *</Label>
              <Textarea
                placeholder="Enter your note..."
                value={noteForm.note}
                onChange={(e) => setNoteForm(prev => ({ ...prev, note: e.target.value }))}
                className="rounded-lg min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
            <Button className="rounded-xl" onClick={submitNote} disabled={noteSubmitting}>
              {noteSubmitting && <Loader2 className="size-4 animate-spin mr-1" />}
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETAIL FIELD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function DetailField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex gap-2.5">
      <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground mb-0.5">{label}</p>
        <p className="text-[12px] text-foreground whitespace-pre-wrap">{value}</p>
      </div>
    </div>
  )
}
