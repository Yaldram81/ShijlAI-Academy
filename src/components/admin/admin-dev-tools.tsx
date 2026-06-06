'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flag, Play, BarChart3, Activity, Database, Zap,
  Plus, X, Search, RefreshCw, Loader2, CheckCircle, XCircle,
  Trash2, Edit3, ToggleLeft, ToggleRight, ChevronRight,
  Server, HardDrive, Clock, Globe, Shield, Cpu,
  MemoryStick, ArrowDown, ArrowUp, AlertTriangle, Info,
  Save, Send, Copy, ExternalLink, Terminal, Users,
  Table2, Wrench, Gauge, Wifi, WifiOff, Timer,
  Hash, FileJson, Code2, Eye, Download,
  Settings, Power, PowerOff, RotateCcw,
  Trash, CircleAlert, CircleCheck, CircleDot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'

// ─── Types ──────────────────────────────────────────────────────────────────

interface FeatureFlagItem {
  id: string
  name: string
  displayName: string
  description: string
  key: string
  category: string
  enabled: boolean
  rollout: number
  createdAt: string
  updatedAt: string
}

interface ApiEndpoint {
  id: string
  method: string
  path: string
  description: string
  category: string
}

interface ApiResponse {
  status: number
  statusText: string
  body: string
  responseTime: number
  headers?: Record<string, string>
}

interface RequestHistoryItem {
  id: string
  method: string
  url: string
  status: number
  responseTime: number
  timestamp: string
}

interface ApiUsageStats {
  totalRequestsToday: number
  avgResponseTime: number
  errorRate: number
  peakHour: string
  topEndpoints: { path: string; method: string; requests: number; avgResponseTime: number }[]
  statusCodeDistribution: { code: string; count: number }[]
  recentCalls: { id: string; time: string; endpoint: string; method: string; status: number; responseTime: number; ip: string }[]
}

interface SystemHealthData {
  healthScore: string
  uptime: string
  uptimePercent: number
  memory: { rss: number; heapUsed: number; heapTotal: number }
  dbHealth: { status: string; responseTime: number }
  tableCounts: { name: string; count: number }[]
  activeSessions: number
  webhookHealth: { active: number; failed: number }
  lastRefreshed: string
}

interface DatabaseInfo {
  tables: { name: string; rows: number; size: string }[]
  version: string
  fileSize: string
  totalRows: number
  recentQueries: { query: string; time: string; duration: number }[]
}

interface CachePerformanceData {
  hitRate: number
  missRate: number
  totalEntries: number
  entries: { key: string; type: string; ttl: string; size: string; lastAccessed: string }[]
  pageLoadTimes: { page: string; avgMs: number; p50: number; p95: number; p99: number }[]
  rateLimiting: { endpoint: string; limit: number; window: string; current: number }[]
  cdnStatus: { origin: string; cacheHitRate: number; bandwidth: string; requests: number }[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return (num ?? 0).toLocaleString()
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

// ─── Category Colors ────────────────────────────────────────────────────────

const FLAG_CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  general: { label: 'General', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' },
  experimental: { label: 'Experimental', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  beta: { label: 'Beta', color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400' },
  performance: { label: 'Performance', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  security: { label: 'Security', color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
  ai: { label: 'AI', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' },
  community: { label: 'Community', color: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400' },
  gamification: { label: 'Gamification', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' },
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  POST: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  PATCH: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
}

const STATUS_COLORS: Record<string, string> = {
  '2xx': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  '3xx': 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  '4xx': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  '5xx': 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
}

// ─── Mock Data Generators ───────────────────────────────────────────────────

function generateMockEndpoints(): ApiEndpoint[] {
  return [
    { id: '1', method: 'GET', path: '/api/admin/dashboard', description: 'Dashboard stats overview', category: 'Admin' },
    { id: '2', method: 'GET', path: '/api/admin/users', description: 'List all users', category: 'Admin' },
    { id: '3', method: 'POST', path: '/api/admin/users', description: 'Create a new user', category: 'Admin' },
    { id: '4', method: 'GET', path: '/api/admin/courses', description: 'List all courses', category: 'Admin' },
    { id: '5', method: 'GET', path: '/api/admin/feature-flags', description: 'Get all feature flags', category: 'Admin' },
    { id: '6', method: 'PUT', path: '/api/admin/feature-flags', description: 'Update a feature flag', category: 'Admin' },
    { id: '7', method: 'GET', path: '/api/admin/security', description: 'Get security settings', category: 'Admin' },
    { id: '8', method: 'GET', path: '/api/courses', description: 'Public course catalog', category: 'Public' },
    { id: '9', method: 'GET', path: '/api/courses/categories', description: 'List course categories', category: 'Public' },
    { id: '10', method: 'GET', path: '/api/admin/ai-config', description: 'Get AI configuration', category: 'AI' },
    { id: '11', method: 'PUT', path: '/api/admin/ai-config', description: 'Update AI configuration', category: 'AI' },
    { id: '12', method: 'GET', path: '/api/admin/gamification', description: 'Get gamification settings', category: 'AI' },
    { id: '13', method: 'GET', path: '/api/auth/login', description: 'User login', category: 'Auth' },
    { id: '14', method: 'POST', path: '/api/auth/register', description: 'User registration', category: 'Auth' },
    { id: '15', method: 'GET', path: '/api/student/progress', description: 'Get student progress', category: 'Student' },
    { id: '16', method: 'GET', path: '/api/instructor/courses', description: 'Instructor courses', category: 'Instructor' },
  ]
}

function generateMockApiUsage(): ApiUsageStats {
  return {
    totalRequestsToday: 14523,
    avgResponseTime: 142,
    errorRate: 2.3,
    peakHour: '2:00 PM',
    topEndpoints: [
      { path: '/api/courses', method: 'GET', requests: 3421, avgResponseTime: 85 },
      { path: '/api/admin/dashboard', method: 'GET', requests: 2104, avgResponseTime: 230 },
      { path: '/api/auth/login', method: 'POST', requests: 1876, avgResponseTime: 320 },
      { path: '/api/student/progress', method: 'GET', requests: 1543, avgResponseTime: 95 },
      { path: '/api/admin/users', method: 'GET', requests: 1234, avgResponseTime: 180 },
    ],
    statusCodeDistribution: [
      { code: '2xx', count: 13187 },
      { code: '3xx', count: 845 },
      { code: '4xx', count: 312 },
      { code: '5xx', count: 179 },
    ],
    recentCalls: Array.from({ length: 15 }, (_, i) => ({
      id: `call-${i + 1}`,
      time: new Date(Date.now() - i * 180000).toISOString(),
      endpoint: ['/api/courses', '/api/admin/dashboard', '/api/auth/login', '/api/student/progress', '/api/admin/users'][i % 5],
      method: ['GET', 'GET', 'POST', 'GET', 'GET'][i % 5],
      status: [200, 200, 401, 200, 200, 201, 200, 403, 200, 500, 200, 200, 304, 200, 200][i],
      responseTime: Math.floor(Math.random() * 400) + 30,
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    })),
  }
}

function generateMockSystemHealth(): SystemHealthData {
  return {
    healthScore: 'healthy',
    uptime: '14d 7h 23m',
    uptimePercent: 99.97,
    memory: { rss: 142, heapUsed: 89, heapTotal: 128 },
    dbHealth: { status: 'healthy', responseTime: 3 },
    tableCounts: [
      { name: 'Users', count: 12450 },
      { name: 'Courses', count: 342 },
      { name: 'Enrollments', count: 28910 },
      { name: 'Lessons', count: 4521 },
      { name: 'Assignments', count: 1230 },
      { name: 'Quizzes', count: 890 },
      { name: 'Certificates', count: 4560 },
      { name: 'Payments', count: 15230 },
      { name: 'Activity Logs', count: 89420 },
      { name: 'Notifications', count: 34510 },
    ],
    activeSessions: 234,
    webhookHealth: { active: 12, failed: 1 },
    lastRefreshed: new Date().toISOString(),
  }
}

function generateMockDatabaseInfo(): DatabaseInfo {
  return {
    tables: [
      { name: 'User', rows: 12450, size: '4.2 MB' },
      { name: 'Course', rows: 342, size: '1.8 MB' },
      { name: 'Enrollment', rows: 28910, size: '6.1 MB' },
      { name: 'Lesson', rows: 4521, size: '2.3 MB' },
      { name: 'Assignment', rows: 1230, size: '0.8 MB' },
      { name: 'Quiz', rows: 890, size: '0.6 MB' },
      { name: 'Certificate', rows: 4560, size: '1.2 MB' },
      { name: 'Payment', rows: 15230, size: '3.8 MB' },
      { name: 'ActivityLog', rows: 89420, size: '12.4 MB' },
      { name: 'Notification', rows: 34510, size: '5.6 MB' },
      { name: 'FeatureFlag', rows: 8, size: '0.01 MB' },
      { name: 'Session', rows: 234, size: '0.1 MB' },
    ],
    version: '3.44.2',
    fileSize: '38.9 MB',
    totalRows: 190306,
    recentQueries: [
      { query: 'SELECT * FROM "User" WHERE role = $1 LIMIT 50', time: new Date(Date.now() - 30000).toISOString(), duration: 12 },
      { query: 'SELECT COUNT(*) FROM "Enrollment" WHERE "createdAt" > $1', time: new Date(Date.now() - 60000).toISOString(), duration: 8 },
      { query: 'UPDATE "FeatureFlag" SET enabled = $1 WHERE id = $2', time: new Date(Date.now() - 120000).toISOString(), duration: 3 },
      { query: 'SELECT * FROM "Course" ORDER BY "enrollmentCount" DESC LIMIT 10', time: new Date(Date.now() - 180000).toISOString(), duration: 15 },
      { query: 'INSERT INTO "ActivityLog" (type, title, ...) VALUES (...)', time: new Date(Date.now() - 240000).toISOString(), duration: 5 },
    ],
  }
}

function generateMockCacheData(): CachePerformanceData {
  return {
    hitRate: 87.3,
    missRate: 12.7,
    totalEntries: 12450,
    entries: [
      { key: 'courses:catalog', type: 'page', ttl: '5m', size: '245 KB', lastAccessed: new Date(Date.now() - 10000).toISOString() },
      { key: 'users:leaderboard', type: 'data', ttl: '10m', size: '128 KB', lastAccessed: new Date(Date.now() - 25000).toISOString() },
      { key: 'admin:dashboard:stats', type: 'data', ttl: '2m', size: '56 KB', lastAccessed: new Date(Date.now() - 15000).toISOString() },
      { key: 'courses:categories', type: 'page', ttl: '30m', size: '12 KB', lastAccessed: new Date(Date.now() - 40000).toISOString() },
      { key: 'gamification:xp-rules', type: 'data', ttl: '15m', size: '8 KB', lastAccessed: new Date(Date.now() - 60000).toISOString() },
      { key: 'student:progress:*', type: 'session', ttl: '1h', size: '340 KB', lastAccessed: new Date(Date.now() - 5000).toISOString() },
      { key: 'ai:config', type: 'config', ttl: '5m', size: '4 KB', lastAccessed: new Date(Date.now() - 20000).toISOString() },
      { key: 'search:index', type: 'data', ttl: '20m', size: '1.2 MB', lastAccessed: new Date(Date.now() - 35000).toISOString() },
    ],
    pageLoadTimes: [
      { page: 'Dashboard', avgMs: 320, p50: 280, p95: 620, p99: 1200 },
      { page: 'Course Catalog', avgMs: 180, p50: 150, p95: 340, p99: 890 },
      { page: 'Course Player', avgMs: 450, p50: 380, p95: 890, p99: 1500 },
      { page: 'Admin Panel', avgMs: 520, p50: 440, p95: 980, p99: 2100 },
      { page: 'Student Profile', avgMs: 210, p50: 180, p95: 420, p99: 780 },
    ],
    rateLimiting: [
      { endpoint: '/api/auth/login', limit: 10, window: '15min', current: 3 },
      { endpoint: '/api/admin/*', limit: 1000, window: '1hr', current: 234 },
      { endpoint: '/api/courses', limit: 500, window: '1hr', current: 156 },
      { endpoint: '/api/ai/chat', limit: 30, window: '1hr', current: 8 },
      { endpoint: '/api/student/*', limit: 200, window: '1hr', current: 87 },
    ],
    cdnStatus: [
      { origin: 'US East', cacheHitRate: 94.2, bandwidth: '12.4 GB', requests: 89420 },
      { origin: 'EU West', cacheHitRate: 91.8, bandwidth: '8.1 GB', requests: 52340 },
      { origin: 'Asia Pacific', cacheHitRate: 88.5, bandwidth: '6.3 GB', requests: 31210 },
    ],
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminDevTools() {
  // ── Active Tab ──
  const [activeTab, setActiveTab] = useState('feature-flags')

  // ── Toast State ──
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const toastTimeout = useRef<NodeJS.Timeout | null>(null)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    toastTimeout.current = setTimeout(() => setToast(null), 4000)
  }, [])

  // ── Loading State ──
  const [loading, setLoading] = useState(true)

  // ── Feature Flags State ──
  const [flags, setFlags] = useState<FeatureFlagItem[]>([])
  const [flagSearch, setFlagSearch] = useState('')
  const [flagCategoryFilter, setFlagCategoryFilter] = useState('all')
  const [createFlagOpen, setCreateFlagOpen] = useState(false)
  const [editFlagOpen, setEditFlagOpen] = useState(false)
  const [deleteFlagOpen, setDeleteFlagOpen] = useState(false)
  const [editingFlag, setEditingFlag] = useState<FeatureFlagItem | null>(null)
  const [deletingFlagId, setDeletingFlagId] = useState<string | null>(null)
  const [flagForm, setFlagForm] = useState({ name: '', displayName: '', description: '', key: '', category: 'general', enabled: true, rollout: 100 })
  const [bulkToggling, setBulkToggling] = useState(false)

  // ── API Playground State ──
  const [endpoints] = useState<ApiEndpoint[]>(generateMockEndpoints)
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null)
  const [requestMethod, setRequestMethod] = useState('GET')
  const [requestUrl, setRequestUrl] = useState('')
  const [requestBody, setRequestBody] = useState('')
  const [requestHeaders, setRequestHeaders] = useState('{\n  "Content-Type": "application/json"\n}')
  const [sendingRequest, setSendingRequest] = useState(false)
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null)
  const [requestHistory, setRequestHistory] = useState<RequestHistoryItem[]>([])
  const [playgroundCategory, setPlaygroundCategory] = useState('all')

  // ── API Usage State ──
  const [apiUsage, setApiUsage] = useState<ApiUsageStats | null>(null)
  const [usageMethodFilter, setUsageMethodFilter] = useState('all')
  const [usageStatusFilter, setUsageStatusFilter] = useState('all')

  // ── System Health State ──
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [runningDiagnostics, setRunningDiagnostics] = useState(false)
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null)

  // ── Database Tools State ──
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null)
  const [dbActionLoading, setDbActionLoading] = useState<string | null>(null)

  // ── Cache & Performance State ──
  const [cacheData, setCacheData] = useState<CachePerformanceData | null>(null)
  const [clearCacheOpen, setClearCacheOpen] = useState(false)
  const [purgeAllOpen, setPurgeAllOpen] = useState(false)
  const [clearingCache, setClearingCache] = useState(false)

  // ── Fetch Data ──
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/dev-tools')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      // Use API flags if available, otherwise use empty array (will be populated by fallback)
      setFlags(json.flags || [])
    } catch {
      // Fallback: try feature-flags API
      try {
        const res2 = await fetch('/api/admin/feature-flags')
        if (res2.ok) {
          const json2 = await res2.json()
          const mapped = (json2.flags || []).map((f: Record<string, unknown>) => ({
            id: f.id || String(Math.random()),
            name: f.name || '',
            displayName: f.displayName || f.name || '',
            description: f.description || '',
            key: f.name || '',
            category: f.category || 'general',
            enabled: !!f.enabled,
            rollout: f.rollout ?? 0,
            createdAt: f.createdAt || new Date().toISOString(),
            updatedAt: f.updatedAt || new Date().toISOString(),
          }))
          setFlags(mapped)
        }
      } catch {
        // Use mock data
        setFlags([
          { id: '1', name: 'ai_tutor', displayName: 'Ask ShijlAI', description: 'Enable AI-powered tutoring for students', key: 'ai_tutor', category: 'ai', enabled: true, rollout: 100, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '2', name: 'community_forum', displayName: 'Community Forum', description: 'Enable community discussion forums', key: 'community_forum', category: 'community', enabled: true, rollout: 100, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '3', name: 'streak_system', displayName: 'Streak System', description: 'Enable daily learning streaks and rewards', key: 'streak_system', category: 'gamification', enabled: true, rollout: 100, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '4', name: 'dark_mode', displayName: 'Dark Mode', description: 'Enable dark mode theme for users', key: 'dark_mode', category: 'general', enabled: true, rollout: 75, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '5', name: 'auto_grading', displayName: 'Auto Grading', description: 'Enable AI-powered auto grading for assignments', key: 'auto_grading', category: 'experimental', enabled: false, rollout: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '6', name: 'video_streaming', displayName: 'Video Streaming', description: 'Enable optimized video streaming', key: 'video_streaming', category: 'performance', enabled: true, rollout: 50, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '7', name: 'two_factor', displayName: 'Two-Factor Auth', description: 'Force 2FA for admin accounts', key: 'two_factor', category: 'security', enabled: true, rollout: 100, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '8', name: 'peer_review', displayName: 'Peer Review', description: 'Enable peer review for assignments', key: 'peer_review', category: 'beta', enabled: true, rollout: 25, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Load tab-specific data
  useEffect(() => {
    if (activeTab === 'api-usage' && !apiUsage) {
      setApiUsage(generateMockApiUsage())
    }
    if (activeTab === 'system-health' && !systemHealth) {
      setSystemHealth(generateMockSystemHealth())
    }
    if (activeTab === 'database-tools' && !databaseInfo) {
      setDatabaseInfo(generateMockDatabaseInfo())
    }
    if (activeTab === 'cache-performance' && !cacheData) {
      setCacheData(generateMockCacheData())
    }
  }, [activeTab, apiUsage, systemHealth, databaseInfo, cacheData])

  // Auto-refresh for system health
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshInterval.current = setInterval(() => {
        setSystemHealth(generateMockSystemHealth())
      }, 10000)
    } else {
      if (autoRefreshInterval.current) clearInterval(autoRefreshInterval.current)
    }
    return () => {
      if (autoRefreshInterval.current) clearInterval(autoRefreshInterval.current)
    }
  }, [autoRefresh])

  // ── Feature Flag Actions ──
  const handleToggleFlag = useCallback(async (flag: FeatureFlagItem) => {
    const newEnabled = !flag.enabled
    const newRollout = newEnabled ? (flag.rollout || 100) : 0
    setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, enabled: newEnabled, rollout: newRollout } : f))
    try {
      await fetch('/api/admin/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: flag.id, enabled: newEnabled, rollout: newRollout }),
      })
      showToast('success', `${flag.displayName} ${newEnabled ? 'enabled' : 'disabled'}`)
    } catch {
      showToast('error', 'Failed to update flag')
      setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, enabled: flag.enabled, rollout: flag.rollout } : f))
    }
  }, [showToast])

  const handleBulkToggle = useCallback(async (enable: boolean) => {
    setBulkToggling(true)
    setFlags(prev => prev.map(f => ({ ...f, enabled: enable, rollout: enable ? 100 : 0 })))
    try {
      await Promise.all(flags.map(f =>
        fetch('/api/admin/feature-flags', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: f.id, enabled: enable, rollout: enable ? 100 : 0 }),
        })
      ))
      showToast('success', `All flags ${enable ? 'enabled' : 'disabled'}`)
    } catch {
      showToast('error', 'Failed to bulk toggle flags')
    } finally {
      setBulkToggling(false)
    }
  }, [flags, showToast])

  const openCreateFlag = useCallback(() => {
    setEditingFlag(null)
    setFlagForm({ name: '', displayName: '', description: '', key: '', category: 'general', enabled: true, rollout: 100 })
    setCreateFlagOpen(true)
  }, [])

  const openEditFlag = useCallback((flag: FeatureFlagItem) => {
    setEditingFlag(flag)
    setFlagForm({
      name: flag.name,
      displayName: flag.displayName,
      description: flag.description,
      key: flag.key,
      category: flag.category,
      enabled: flag.enabled,
      rollout: flag.rollout,
    })
    setEditFlagOpen(true)
  }, [])

  const handleSaveFlag = useCallback(async () => {
    if (!flagForm.name || !flagForm.displayName) {
      showToast('error', 'Name and display name are required')
      return
    }
    try {
      if (editingFlag) {
        const res = await fetch('/api/admin/dev-tools', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'featureFlag', action: 'update', id: editingFlag.id, ...flagForm }),
        })
        if (!res.ok) throw new Error()
        setFlags(prev => prev.map(f => f.id === editingFlag.id ? { ...f, ...flagForm } : f))
        showToast('success', `Flag "${flagForm.displayName}" updated`)
      } else {
        const res = await fetch('/api/admin/dev-tools', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'featureFlag', action: 'create', ...flagForm }),
        })
        if (!res.ok) throw new Error()
        const json = await res.json()
        const created = json.flag
        const newFlag: FeatureFlagItem = {
          id: created?.id || `flag-${Date.now()}`,
          name: created?.name || flagForm.name,
          displayName: created?.displayName || flagForm.displayName,
          description: created?.description || flagForm.description,
          key: created?.name || flagForm.key || flagForm.name,
          category: created?.category || flagForm.category,
          enabled: created?.enabled ?? flagForm.enabled,
          rollout: created?.rollout ?? flagForm.rollout,
          createdAt: created?.createdAt || new Date().toISOString(),
          updatedAt: created?.updatedAt || new Date().toISOString(),
        }
        setFlags(prev => [...prev, newFlag])
        showToast('success', `Flag "${flagForm.displayName}" created`)
      }
      setCreateFlagOpen(false)
      setEditFlagOpen(false)
    } catch {
      showToast('error', 'Failed to save flag')
    }
  }, [flagForm, editingFlag, showToast])

  const handleDeleteFlag = useCallback(async () => {
    if (!deletingFlagId) return
    try {
      const res = await fetch('/api/admin/dev-tools', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'featureFlag', action: 'delete', id: deletingFlagId }),
      })
      if (!res.ok) throw new Error()
      setFlags(prev => prev.filter(f => f.id !== deletingFlagId))
      setDeleteFlagOpen(false)
      setDeletingFlagId(null)
      showToast('success', 'Flag deleted')
    } catch {
      showToast('error', 'Failed to delete flag')
    }
  }, [deletingFlagId, showToast])

  // ── API Playground Actions ──
  const handleSelectEndpoint = useCallback((ep: ApiEndpoint) => {
    setSelectedEndpoint(ep)
    setRequestMethod(ep.method)
    setRequestUrl(ep.path)
    if (['POST', 'PUT', 'PATCH'].includes(ep.method)) {
      setRequestBody('{\n  \n}')
    } else {
      setRequestBody('')
    }
  }, [])

  const handleSendRequest = useCallback(async () => {
    if (!requestUrl) return
    setSendingRequest(true)
    const startTime = Date.now()
    try {
      let fetchOptions: RequestInit = { method: requestMethod }
      if (['POST', 'PUT', 'PATCH'].includes(requestMethod) && requestBody) {
        fetchOptions = {
          ...fetchOptions,
          headers: { 'Content-Type': 'application/json' },
          body: requestBody,
        }
      }
      const res = await fetch(requestUrl, fetchOptions)
      const elapsed = Date.now() - startTime
      let bodyText = ''
      try {
        const json = await res.json()
        bodyText = JSON.stringify(json, null, 2)
      } catch {
        try { bodyText = await res.text() } catch { bodyText = 'No response body' }
      }
      const response: ApiResponse = {
        status: res.status,
        statusText: res.statusText,
        body: bodyText,
        responseTime: elapsed,
      }
      setApiResponse(response)
      setRequestHistory(prev => [
        { id: `req-${Date.now()}`, method: requestMethod, url: requestUrl, status: res.status, responseTime: elapsed, timestamp: new Date().toISOString() },
        ...prev.slice(0, 19),
      ])
    } catch (err) {
      const elapsed = Date.now() - startTime
      setApiResponse({
        status: 0,
        statusText: 'Network Error',
        body: err instanceof Error ? err.message : 'Request failed',
        responseTime: elapsed,
      })
    } finally {
      setSendingRequest(false)
    }
  }, [requestUrl, requestMethod, requestBody])

  // ── API Usage Actions ──
  const handleSeedApiData = useCallback(() => {
    setApiUsage(generateMockApiUsage())
    showToast('success', 'Sample API usage data generated')
  }, [showToast])

  const handleClearApiLogs = useCallback(() => {
    if (apiUsage) {
      setApiUsage({ ...apiUsage, recentCalls: [], totalRequestsToday: 0, statusCodeDistribution: [] })
    }
    showToast('success', 'API logs cleared')
  }, [apiUsage, showToast])

  // ── System Health Actions ──
  const handleRunDiagnostics = useCallback(async () => {
    setRunningDiagnostics(true)
    await new Promise(resolve => setTimeout(resolve, 2500))
    setSystemHealth(generateMockSystemHealth())
    setRunningDiagnostics(false)
    showToast('success', 'Diagnostics complete — all systems healthy')
  }, [showToast])

  // ── Database Actions ──
  const handleDbAction = useCallback(async (action: string) => {
    setDbActionLoading(action)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setDbActionLoading(null)
    showToast('success', `${action} completed successfully`)
  }, [showToast])

  // ── Cache Actions ──
  const handleClearCache = useCallback(async () => {
    setClearingCache(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setCacheData(prev => prev ? { ...prev, totalEntries: 0, entries: [], hitRate: 0, missRate: 100 } : prev)
    setClearingCache(false)
    setClearCacheOpen(false)
    showToast('success', 'Cache cleared successfully')
  }, [showToast])

  const handlePurgeAllCaches = useCallback(async () => {
    setClearingCache(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setCacheData(prev => prev ? { ...prev, totalEntries: 0, entries: [], hitRate: 0, missRate: 100, cdnStatus: prev.cdnStatus.map(c => ({ ...c, cacheHitRate: 0 })) } : prev)
    setClearingCache(false)
    setPurgeAllOpen(false)
    showToast('success', 'All caches purged successfully')
  }, [showToast])

  // ── Filtered flags ──
  const filteredFlags = flags.filter(f => {
    const matchesSearch = !flagSearch ||
      f.displayName.toLowerCase().includes(flagSearch.toLowerCase()) ||
      f.name.toLowerCase().includes(flagSearch.toLowerCase()) ||
      f.description.toLowerCase().includes(flagSearch.toLowerCase())
    const matchesCategory = flagCategoryFilter === 'all' || f.category === flagCategoryFilter
    return matchesSearch && matchesCategory
  })

  const flagCategories = ['all', ...Array.from(new Set(flags.map(f => f.category)))]

  // ── Filtered endpoints for playground ──
  const endpointCategories = ['all', ...Array.from(new Set(endpoints.map(e => e.category)))]
  const filteredEndpoints = endpoints.filter(e => playgroundCategory === 'all' || e.category === playgroundCategory)

  // ── Filtered API usage recent calls ──
  const filteredRecentCalls = (apiUsage?.recentCalls || []).filter(c => {
    const matchesMethod = usageMethodFilter === 'all' || c.method === usageMethodFilter
    const matchesStatus = usageStatusFilter === 'all' ||
      (usageStatusFilter === '2xx' && c.status >= 200 && c.status < 300) ||
      (usageStatusFilter === '3xx' && c.status >= 300 && c.status < 400) ||
      (usageStatusFilter === '4xx' && c.status >= 400 && c.status < 500) ||
      (usageStatusFilter === '5xx' && c.status >= 500)
    return matchesMethod && matchesStatus
  })

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TOAST
  // ═══════════════════════════════════════════════════════════════

  const renderToast = () => (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className={cn(
            'fixed top-6 left-1/2 z-[100] flex items-center gap-2 rounded-2xl px-5 py-3 ios-shadow-lg text-[14px] font-medium',
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          )}
        >
          {toast.type === 'success' ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: LOADING
  // ═══════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 1 — FEATURE FLAGS
  // ═══════════════════════════════════════════════════════════════

  const renderFeatureFlagsTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      {/* Header Card */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-lime-500/20 to-green-500/20">
                <Flag className="size-5 text-lime-600 dark:text-lime-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Feature Flags</CardTitle>
                <p className="text-[13px] text-muted-foreground">{flags.length} flags · {flags.filter(f => f.enabled).length} enabled</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8 text-[12px]" onClick={() => handleBulkToggle(true)} disabled={bulkToggling}>
                <Power className="size-3" /> Enable All
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8 text-[12px]" onClick={() => handleBulkToggle(false)} disabled={bulkToggling}>
                <PowerOff className="size-3" /> Disable All
              </Button>
              <Button className="rounded-xl gap-1.5 h-9 text-[12px] bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white" onClick={openCreateFlag}>
                <Plus className="size-4" /> New Flag
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search flags..."
                value={flagSearch}
                onChange={e => setFlagSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            <Select value={flagCategoryFilter} onValueChange={setFlagCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                {flagCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : (FLAG_CATEGORY_CONFIG[cat]?.label || cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Flags Grid */}
          {filteredFlags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Flag className="size-10 text-muted-foreground/30" />
              <p className="text-[15px] font-medium">No flags found</p>
              <p className="text-[13px] text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredFlags.map((flag, i) => {
                const catConfig = FLAG_CATEGORY_CONFIG[flag.category] || { label: flag.category, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' }
                return (
                  <motion.div
                    key={flag.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, ...springTransition }}
                    className={cn(
                      'rounded-2xl border p-4 transition-all hover:shadow-md',
                      flag.enabled ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-800/30 dark:bg-emerald-950/10' : 'border-border bg-card'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className={cn('size-2 rounded-full shrink-0', flag.enabled ? 'bg-emerald-500' : 'bg-gray-400')} />
                          <p className="text-[14px] font-semibold truncate">{flag.displayName}</p>
                        </div>
                        <p className="text-[12px] text-muted-foreground line-clamp-2">{flag.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={cn('rounded-lg text-[10px] font-semibold', catConfig.color)}>
                            {catConfig.label}
                          </Badge>
                          <code className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{flag.key}</code>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">Rollout</span>
                            <span className={cn('text-[11px] font-semibold', flag.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500')}>{flag.rollout}%</span>
                          </div>
                          <Progress value={flag.rollout} className="h-1.5 rounded-full" />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Switch checked={flag.enabled} onCheckedChange={() => handleToggleFlag(flag)} />
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditFlag(flag)}
                            className="size-7 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          >
                            <Edit3 className="size-3.5" />
                          </button>
                          <button
                            onClick={() => { setDeletingFlagId(flag.id); setDeleteFlagOpen(true) }}
                            className="size-7 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 2 — API PLAYGROUND
  // ═══════════════════════════════════════════════════════════════

  const renderApiPlaygroundTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Endpoints List */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                <Globe className="size-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Endpoints</CardTitle>
                <p className="text-[13px] text-muted-foreground">{endpoints.length} available</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {endpointCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setPlaygroundCategory(cat)}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all border',
                    playgroundCategory === cat
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card text-muted-foreground border-border hover:text-foreground'
                  )}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-1">
                {filteredEndpoints.map(ep => (
                  <button
                    key={ep.id}
                    onClick={() => handleSelectEndpoint(ep)}
                    className={cn(
                      'w-full text-left rounded-xl p-2.5 transition-all flex items-center gap-2',
                      selectedEndpoint?.id === ep.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted/50 border border-transparent'
                    )}
                  >
                    <Badge variant="secondary" className={cn('rounded-md text-[10px] font-bold px-1.5 shrink-0', METHOD_COLORS[ep.method])}>
                      {ep.method}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-mono truncate">{ep.path}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{ep.description}</p>
                    </div>
                    <ChevronRight className="size-3 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Request Builder */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                  <Terminal className="size-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <CardTitle className="text-[18px] font-bold">Request Builder</CardTitle>
                  <p className="text-[13px] text-muted-foreground">Construct and send API requests</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Method + URL */}
              <div className="flex gap-3">
                <Select value={requestMethod} onValueChange={setRequestMethod}>
                  <SelectTrigger className="w-[120px] rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                      <SelectItem key={m} value={m}>
                        <span className={cn('font-bold', m === 'GET' ? 'text-emerald-600' : m === 'POST' ? 'text-blue-600' : m === 'DELETE' ? 'text-red-600' : 'text-amber-600')}>{m}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input value={requestUrl} onChange={e => setRequestUrl(e.target.value)} placeholder="/api/..." className="flex-1 rounded-xl font-mono text-[13px]" />
              </div>

              {/* Request Body */}
              {['POST', 'PUT', 'PATCH'].includes(requestMethod) && (
                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold">Request Body (JSON)</Label>
                  <Textarea
                    value={requestBody}
                    onChange={e => setRequestBody(e.target.value)}
                    className="rounded-xl font-mono text-[12px] min-h-[120px]"
                    placeholder='{"key": "value"}'
                  />
                </div>
              )}

              {/* Headers */}
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold">Headers</Label>
                <Textarea
                  value={requestHeaders}
                  onChange={e => setRequestHeaders(e.target.value)}
                  className="rounded-xl font-mono text-[12px] min-h-[80px]"
                />
              </div>

              {/* Send Button */}
              <Button
                className="w-full rounded-xl gap-2 h-11 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white"
                onClick={handleSendRequest}
                disabled={sendingRequest || !requestUrl}
              >
                {sendingRequest ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {sendingRequest ? 'Sending...' : 'Send Request'}
              </Button>
            </CardContent>
          </Card>

          {/* Response Viewer */}
          {apiResponse && (
            <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex size-10 items-center justify-center rounded-xl',
                      apiResponse.status >= 200 && apiResponse.status < 300 ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20' :
                        apiResponse.status >= 400 ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20' :
                        'bg-gradient-to-br from-amber-500/20 to-yellow-500/20'
                    )}>
                      {apiResponse.status >= 200 && apiResponse.status < 300 ? <CircleCheck className="size-5 text-emerald-600 dark:text-emerald-400" /> :
                        apiResponse.status >= 400 ? <CircleAlert className="size-5 text-red-600 dark:text-red-400" /> :
                        <CircleDot className="size-5 text-amber-600 dark:text-amber-400" />}
                    </div>
                    <div>
                      <CardTitle className="text-[18px] font-bold">Response</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={cn(
                          'rounded-lg text-[11px] font-bold',
                          apiResponse.status >= 200 && apiResponse.status < 300 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                            apiResponse.status >= 400 ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        )}>
                          {apiResponse.status} {apiResponse.statusText}
                        </Badge>
                        <span className="text-[12px] text-muted-foreground flex items-center gap-1">
                          <Timer className="size-3" /> {apiResponse.responseTime}ms
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8 text-[12px]" onClick={() => { navigator.clipboard.writeText(apiResponse.body); showToast('success', 'Response copied to clipboard') }}>
                    <Copy className="size-3" /> Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[300px]">
                  <pre className="text-[12px] font-mono bg-muted/50 rounded-xl p-4 whitespace-pre-wrap break-words">
                    {apiResponse.body}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Request History */}
          {requestHistory.length > 0 && (
            <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500/20 to-gray-500/20">
                      <Clock className="size-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <CardTitle className="text-[18px] font-bold">Request History</CardTitle>
                      <p className="text-[13px] text-muted-foreground">{requestHistory.length} recent requests</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8 text-[12px]" onClick={() => setRequestHistory([])}>
                    <Trash2 className="size-3" /> Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-1">
                    {requestHistory.map(item => (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/30 transition-colors">
                        <Badge variant="secondary" className={cn('rounded-md text-[10px] font-bold px-1.5 shrink-0', METHOD_COLORS[item.method])}>
                          {item.method}
                        </Badge>
                        <span className="text-[12px] font-mono flex-1 truncate">{item.url}</span>
                        <Badge className={cn(
                          'rounded-md text-[10px] shrink-0',
                          item.status >= 200 && item.status < 300 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                            'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                        )}>
                          {item.status}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground shrink-0">{item.responseTime}ms</span>
                        <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(item.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 3 — API USAGE
  // ═══════════════════════════════════════════════════════════════

  const renderApiUsageTab = () => {
    if (!apiUsage) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <BarChart3 className="size-12 text-muted-foreground/30" />
          <p className="text-[15px] font-medium">No API usage data</p>
          <p className="text-[13px] text-muted-foreground">Generate sample data to explore API analytics</p>
          <Button className="rounded-xl gap-1.5" onClick={handleSeedApiData}>
            <Zap className="size-4" /> Seed Sample Data
          </Button>
        </div>
      )
    }

    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Requests Today', value: formatNumber(apiUsage.totalRequestsToday), icon: Activity, gradient: 'from-cyan-500/20 to-blue-500/20', iconColor: 'text-cyan-600 dark:text-cyan-400' },
            { label: 'Avg Response Time', value: `${apiUsage.avgResponseTime}ms`, icon: Timer, gradient: 'from-amber-500/20 to-orange-500/20', iconColor: 'text-amber-600 dark:text-amber-400' },
            { label: 'Error Rate', value: `${apiUsage.errorRate}%`, icon: AlertTriangle, gradient: 'from-red-500/20 to-rose-500/20', iconColor: 'text-red-600 dark:text-red-400' },
            { label: 'Peak Hour', value: apiUsage.peakHour, icon: Clock, gradient: 'from-violet-500/20 to-purple-500/20', iconColor: 'text-violet-600 dark:text-violet-400' },
          ].map(card => {
            const IconComp = card.icon
            return (
              <Card key={card.label} className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex size-10 items-center justify-center rounded-xl bg-gradient-to-br shrink-0', card.gradient)}>
                      <IconComp className={cn('size-5', card.iconColor)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] text-muted-foreground truncate">{card.label}</p>
                      <p className="text-[20px] font-bold text-foreground">{card.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Top Endpoints */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                <ArrowUp className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Top Endpoints</CardTitle>
                <p className="text-[13px] text-muted-foreground">Most frequently accessed API endpoints</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[12px]">Endpoint</TableHead>
                    <TableHead className="text-[12px]">Method</TableHead>
                    <TableHead className="text-[12px] text-right">Requests</TableHead>
                    <TableHead className="text-[12px] text-right">Avg Response</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiUsage.topEndpoints.map((ep, i) => (
                    <TableRow key={i}>
                      <TableCell><code className="text-[13px] font-mono">{ep.path}</code></TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn('rounded-md text-[10px] font-bold px-1.5', METHOD_COLORS[ep.method])}>
                          {ep.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[13px] text-right font-semibold">{formatNumber(ep.requests)}</TableCell>
                      <TableCell className="text-[13px] text-right">
                        <span className={cn('font-medium', ep.avgResponseTime > 300 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')}>
                          {ep.avgResponseTime}ms
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Status Code Distribution */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                <Hash className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Status Code Distribution</CardTitle>
                <p className="text-[13px] text-muted-foreground">HTTP response code breakdown</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {apiUsage.statusCodeDistribution.map(sc => {
                const total = apiUsage.statusCodeDistribution.reduce((a, b) => a + b.count, 0) || 1
                const pct = ((sc.count / total) * 100).toFixed(1)
                return (
                  <div key={sc.code} className="rounded-2xl border p-4 text-center space-y-2">
                    <Badge className={cn('rounded-lg text-[12px] font-bold', STATUS_COLORS[sc.code])}>{sc.code}</Badge>
                    <p className="text-[20px] font-bold">{formatNumber(sc.count)}</p>
                    <p className="text-[12px] text-muted-foreground">{pct}%</p>
                    <Progress
                      value={parseFloat(pct)}
                      className="h-2 rounded-full"
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent API Calls */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500/20 to-gray-500/20">
                  <Clock className="size-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <CardTitle className="text-[18px] font-bold">Recent API Calls</CardTitle>
                  <p className="text-[13px] text-muted-foreground">{apiUsage.recentCalls.length} recent calls</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={usageMethodFilter} onValueChange={setUsageMethodFilter}>
                  <SelectTrigger className="w-[110px] rounded-xl h-8 text-[12px]">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={usageStatusFilter} onValueChange={setUsageStatusFilter}>
                  <SelectTrigger className="w-[110px] rounded-xl h-8 text-[12px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="2xx">2xx</SelectItem>
                    <SelectItem value="3xx">3xx</SelectItem>
                    <SelectItem value="4xx">4xx</SelectItem>
                    <SelectItem value="5xx">5xx</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8 text-[12px]" onClick={handleSeedApiData}>
                  <Zap className="size-3" /> Seed Data
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8 text-[12px] text-red-500 hover:text-red-600" onClick={handleClearApiLogs}>
                  <Trash2 className="size-3" /> Clear Logs
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[12px]">Time</TableHead>
                    <TableHead className="text-[12px]">Endpoint</TableHead>
                    <TableHead className="text-[12px]">Method</TableHead>
                    <TableHead className="text-[12px]">Status</TableHead>
                    <TableHead className="text-[12px] text-right">Response</TableHead>
                    <TableHead className="text-[12px]">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecentCalls.map(call => (
                    <TableRow key={call.id}>
                      <TableCell className="text-[13px] text-muted-foreground">{timeAgo(call.time)}</TableCell>
                      <TableCell><code className="text-[13px] font-mono">{call.endpoint}</code></TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn('rounded-md text-[10px] font-bold px-1.5', METHOD_COLORS[call.method])}>
                          {call.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          'rounded-md text-[10px]',
                          call.status >= 200 && call.status < 300 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                            call.status >= 400 && call.status < 500 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                            call.status >= 500 ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                        )}>
                          {call.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[13px] text-right">
                        <span className={cn('font-medium', call.responseTime > 300 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')}>
                          {call.responseTime}ms
                        </span>
                      </TableCell>
                      <TableCell className="text-[13px] font-mono text-muted-foreground">{call.ip}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            {filteredRecentCalls.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <BarChart3 className="size-8 text-muted-foreground/30" />
                <p className="text-[13px] text-muted-foreground">No calls match your filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 4 — SYSTEM HEALTH
  // ═══════════════════════════════════════════════════════════════

  const renderSystemHealthTab = () => {
    if (!systemHealth) return null

    const healthConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof CircleCheck }> = {
      healthy: { label: 'Healthy', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-950/40', icon: CircleCheck },
      degraded: { label: 'Degraded', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-950/40', icon: AlertTriangle },
      unhealthy: { label: 'Unhealthy', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-950/40', icon: CircleAlert },
    }

    const health = healthConfig[systemHealth.healthScore] || healthConfig.healthy
    const HealthIcon = health.icon

    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
        {/* Health Score Banner */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn('flex size-14 items-center justify-center rounded-2xl', health.bgColor)}>
                  <HealthIcon className={cn('size-7', health.color)} />
                </div>
                <div>
                  <p className="text-[22px] font-bold">System {health.label}</p>
                  <p className="text-[13px] text-muted-foreground">All core services operational · Last refreshed: {timeAgo(systemHealth.lastRefreshed)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border p-2.5">
                  <Label className="text-[12px]">Auto-refresh</Label>
                  <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                </div>
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-9 text-[12px]" onClick={handleRunDiagnostics} disabled={runningDiagnostics}>
                  {runningDiagnostics ? <Loader2 className="size-3.5 animate-spin" /> : <Activity className="size-3.5" />}
                  {runningDiagnostics ? 'Running...' : 'Run Diagnostics'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Uptime */}
          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                  <Clock className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[12px] text-muted-foreground">Uptime</p>
                  <p className="text-[18px] font-bold">{systemHealth.uptime}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Uptime %</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{systemHealth.uptimePercent}%</span>
                </div>
                <Progress value={systemHealth.uptimePercent} className="h-2 rounded-full" />
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                  <Users className="size-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-[12px] text-muted-foreground">Active Sessions</p>
                  <p className="text-[24px] font-bold">{formatNumber(systemHealth.activeSessions)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Health */}
          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex size-10 items-center justify-center rounded-xl',
                  systemHealth.dbHealth.status === 'healthy' ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20' : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20'
                )}>
                  <Database className={cn('size-5', systemHealth.dbHealth.status === 'healthy' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')} />
                </div>
                <div>
                  <p className="text-[12px] text-muted-foreground">Database</p>
                  <div className="flex items-center gap-2">
                    <Badge className={cn('rounded-lg text-[10px]',
                      systemHealth.dbHealth.status === 'healthy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    )}>
                      {systemHealth.dbHealth.status}
                    </Badge>
                    <span className="text-[13px] text-muted-foreground">{systemHealth.dbHealth.responseTime}ms</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Webhook Health */}
          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                  <Wifi className="size-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <p className="text-[12px] text-muted-foreground">Webhooks</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-bold text-emerald-600 dark:text-emerald-400">{systemHealth.webhookHealth.active}</span>
                    <span className="text-[12px] text-muted-foreground">active</span>
                    {systemHealth.webhookHealth.failed > 0 && (
                      <>
                        <span className="text-[12px] text-muted-foreground">·</span>
                        <span className="text-[16px] font-bold text-red-600 dark:text-red-400">{systemHealth.webhookHealth.failed}</span>
                        <span className="text-[12px] text-muted-foreground">failed</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Memory Usage */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <MemoryStick className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Memory Usage</CardTitle>
                <p className="text-[13px] text-muted-foreground">Current process memory allocation</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'RSS', value: systemHealth.memory.rss, total: 256, color: 'bg-cyan-500' },
                { label: 'Heap Used', value: systemHealth.memory.heapUsed, total: systemHealth.memory.heapTotal, color: 'bg-amber-500' },
                { label: 'Heap Total', value: systemHealth.memory.heapTotal, total: 512, color: 'bg-emerald-500' },
              ].map(mem => {
                const pct = Math.min((mem.value / mem.total) * 100, 100)
                return (
                  <div key={mem.label} className="rounded-2xl border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold">{mem.label}</span>
                      <span className="text-[13px] font-bold">{mem.value} MB</span>
                    </div>
                    <Progress value={pct} className="h-3 rounded-full" />
                    <p className="text-[11px] text-muted-foreground">{pct.toFixed(1)}% of {mem.total} MB</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Table Counts */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20">
                <Table2 className="size-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Table Counts</CardTitle>
                <p className="text-[13px] text-muted-foreground">Row counts for key database tables</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {systemHealth.tableCounts.map(tc => (
                <div key={tc.name} className="rounded-2xl border p-3 text-center">
                  <p className="text-[18px] font-bold">{formatNumber(tc.count)}</p>
                  <p className="text-[11px] text-muted-foreground">{tc.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 5 — DATABASE TOOLS
  // ═══════════════════════════════════════════════════════════════

  const renderDatabaseToolsTab = () => {
    if (!databaseInfo) return null

    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
        {/* Warning Banner */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40 shrink-0 mt-0.5">
                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-amber-800 dark:text-amber-300">Production Warning</p>
                <p className="text-[12px] text-amber-700/80 dark:text-amber-400/80">Database operations like vacuum, rebuild, and integrity checks should be performed during maintenance windows. These actions may temporarily affect performance.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Config */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500/20 to-gray-500/20">
                  <Database className="size-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-[12px] text-muted-foreground">SQLite Version</p>
                  <p className="text-[16px] font-bold">{databaseInfo.version}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                  <HardDrive className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[12px] text-muted-foreground">Database Size</p>
                  <p className="text-[16px] font-bold">{databaseInfo.fileSize}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                  <Table2 className="size-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-[12px] text-muted-foreground">Total Rows</p>
                  <p className="text-[16px] font-bold">{formatNumber(databaseInfo.totalRows)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table Overview */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20">
                <Table2 className="size-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Table Overview</CardTitle>
                <p className="text-[13px] text-muted-foreground">{databaseInfo.tables.length} tables in database</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[350px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[12px]">Table Name</TableHead>
                    <TableHead className="text-[12px] text-right">Rows</TableHead>
                    <TableHead className="text-[12px] text-right">Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {databaseInfo.tables.map(t => (
                    <TableRow key={t.name}>
                      <TableCell className="text-[13px] font-mono font-medium">{t.name}</TableCell>
                      <TableCell className="text-[13px] text-right">{formatNumber(t.rows)}</TableCell>
                      <TableCell className="text-[13px] text-right text-muted-foreground">{t.size}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
                <Wrench className="size-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Quick Actions</CardTitle>
                <p className="text-[13px] text-muted-foreground">Database maintenance operations</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { action: 'Vacuum Database', desc: 'Reclaim unused space and optimize file', icon: HardDrive, loadingKey: 'vacuum' },
                { action: 'Rebuild Indexes', desc: 'Rebuild all database indexes for performance', icon: RefreshCw, loadingKey: 'rebuild' },
                { action: 'Check Integrity', desc: 'Run integrity check on the entire database', icon: Shield, loadingKey: 'integrity' },
              ].map(item => {
                const IconComp = item.icon
                return (
                  <button
                    key={item.loadingKey}
                    onClick={() => handleDbAction(item.action)}
                    disabled={!!dbActionLoading}
                    className="rounded-2xl border p-4 text-left hover:bg-muted/30 transition-all disabled:opacity-50 space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-muted/50">
                        {dbActionLoading === item.loadingKey ? <Loader2 className="size-4 animate-spin" /> : <IconComp className="size-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold">{item.action}</p>
                        <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Queries */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
                <Code2 className="size-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Recent Queries</CardTitle>
                <p className="text-[13px] text-muted-foreground">Simulated query log</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[250px]">
              <div className="space-y-2">
                {databaseInfo.recentQueries.map((q, i) => (
                  <div key={i} className="rounded-xl border p-3 space-y-1">
                    <code className="text-[12px] font-mono text-foreground line-clamp-2">{q.query}</code>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground">{timeAgo(q.time)}</span>
                      <Badge variant="secondary" className={cn('rounded-md text-[10px]', q.duration > 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400')}>
                        {q.duration}ms
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 6 — CACHE & PERFORMANCE
  // ═══════════════════════════════════════════════════════════════

  const renderCachePerformanceTab = () => {
    if (!cacheData) return null

    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
        {/* Cache Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Hit Rate', value: `${cacheData.hitRate}%`, icon: CircleCheck, gradient: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Miss Rate', value: `${cacheData.missRate}%`, icon: CircleAlert, gradient: 'from-amber-500/20 to-orange-500/20', iconColor: 'text-amber-600 dark:text-amber-400' },
            { label: 'Total Entries', value: formatNumber(cacheData.totalEntries), icon: Database, gradient: 'from-violet-500/20 to-purple-500/20', iconColor: 'text-violet-600 dark:text-violet-400' },
            { label: 'Cache Status', value: cacheData.hitRate > 80 ? 'Excellent' : cacheData.hitRate > 60 ? 'Good' : 'Needs Attention', icon: Gauge, gradient: 'from-cyan-500/20 to-blue-500/20', iconColor: 'text-cyan-600 dark:text-cyan-400' },
          ].map(card => {
            const IconComp = card.icon
            return (
              <Card key={card.label} className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex size-10 items-center justify-center rounded-xl bg-gradient-to-br shrink-0', card.gradient)}>
                      <IconComp className={cn('size-5', card.iconColor)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] text-muted-foreground truncate">{card.label}</p>
                      <p className="text-[20px] font-bold text-foreground">{card.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Cache Actions */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20">
                  <Zap className="size-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-[18px] font-bold">Cache Actions</CardTitle>
                  <p className="text-[13px] text-muted-foreground">Manage application cache</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-9 text-[12px]" onClick={() => setClearCacheOpen(true)} disabled={clearingCache}>
                  <Trash className="size-3.5" /> Clear Cache
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-9 text-[12px] text-red-500 hover:text-red-600 border-red-200 dark:border-red-800" onClick={() => setPurgeAllOpen(true)} disabled={clearingCache}>
                  <RotateCcw className="size-3.5" /> Purge All Caches
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Performance Metrics */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <Gauge className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Page Load Times</CardTitle>
                <p className="text-[13px] text-muted-foreground">Response time percentiles by page</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[12px]">Page</TableHead>
                    <TableHead className="text-[12px] text-right">Avg (ms)</TableHead>
                    <TableHead className="text-[12px] text-right">P50</TableHead>
                    <TableHead className="text-[12px] text-right">P95</TableHead>
                    <TableHead className="text-[12px] text-right">P99</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cacheData.pageLoadTimes.map(pl => (
                    <TableRow key={pl.page}>
                      <TableCell className="text-[13px] font-medium">{pl.page}</TableCell>
                      <TableCell className="text-[13px] text-right">
                        <span className={cn('font-medium', pl.avgMs > 400 ? 'text-red-600 dark:text-red-400' : pl.avgMs > 250 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')}>
                          {pl.avgMs}
                        </span>
                      </TableCell>
                      <TableCell className="text-[13px] text-right">{pl.p50}</TableCell>
                      <TableCell className="text-[13px] text-right">{pl.p95}</TableCell>
                      <TableCell className="text-[13px] text-right font-semibold text-red-600 dark:text-red-400">{pl.p99}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Rate Limiting */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20">
                <Shield className="size-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Rate Limiting</CardTitle>
                <p className="text-[13px] text-muted-foreground">Current rate limit configuration and usage</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[12px]">Endpoint</TableHead>
                    <TableHead className="text-[12px]">Limit</TableHead>
                    <TableHead className="text-[12px]">Window</TableHead>
                    <TableHead className="text-[12px] text-right">Current Usage</TableHead>
                    <TableHead className="text-[12px] text-right">Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cacheData.rateLimiting.map(rl => {
                    const pct = (rl.current / rl.limit) * 100
                    return (
                      <TableRow key={rl.endpoint}>
                        <TableCell><code className="text-[13px] font-mono">{rl.endpoint}</code></TableCell>
                        <TableCell className="text-[13px]">{formatNumber(rl.limit)}</TableCell>
                        <TableCell className="text-[13px]">{rl.window}</TableCell>
                        <TableCell className="text-[13px] text-right">{formatNumber(rl.current)}</TableCell>
                        <TableCell className="text-[13px] text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={pct} className="h-2 w-16 rounded-full" />
                            <span className={cn('text-[11px] font-semibold', pct > 80 ? 'text-red-600 dark:text-red-400' : pct > 50 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')}>
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* CDN Cache Status */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20">
                <Globe className="size-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">CDN Cache Status</CardTitle>
                <p className="text-[13px] text-muted-foreground">Edge cache performance by region</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {cacheData.cdnStatus.map(cdn => (
                <div key={cdn.origin} className="rounded-2xl border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-semibold">{cdn.origin}</span>
                    <Badge className="rounded-lg text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      {cdn.cacheHitRate}% hit
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-muted-foreground">Bandwidth</span>
                      <span className="font-medium">{cdn.bandwidth}</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-muted-foreground">Requests</span>
                      <span className="font-medium">{formatNumber(cdn.requests)}</span>
                    </div>
                    <Progress value={cdn.cacheHitRate} className="h-2 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cache Entries */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20">
                <Database className="size-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Cache Entries</CardTitle>
                <p className="text-[13px] text-muted-foreground">{cacheData.entries.length} cached items</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {cacheData.entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Database className="size-8 text-muted-foreground/30" />
                <p className="text-[13px] text-muted-foreground">Cache is empty</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[350px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[12px]">Key</TableHead>
                      <TableHead className="text-[12px]">Type</TableHead>
                      <TableHead className="text-[12px]">TTL</TableHead>
                      <TableHead className="text-[12px] text-right">Size</TableHead>
                      <TableHead className="text-[12px]">Last Accessed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cacheData.entries.map(entry => (
                      <TableRow key={entry.key}>
                        <TableCell><code className="text-[12px] font-mono">{entry.key}</code></TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="rounded-md text-[10px] font-semibold">
                            {entry.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[13px]">{entry.ttl}</TableCell>
                        <TableCell className="text-[13px] text-right">{entry.size}</TableCell>
                        <TableCell className="text-[13px] text-muted-foreground">{timeAgo(entry.lastAccessed)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: MAIN
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {renderToast()}

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-500/20 to-green-500/20">
          <Wrench className="size-6 text-lime-600 dark:text-lime-400" />
        </div>
        <div>
          <h2 className="text-[22px] font-bold">Developer Tools</h2>
          <p className="text-[14px] text-muted-foreground">Feature flags, API playground, system health, and more</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap gap-1 bg-muted/50 p-1.5 rounded-2xl">
          {[
            { value: 'feature-flags', label: 'Feature Flags', icon: Flag },
            { value: 'api-playground', label: 'API Playground', icon: Play },
            { value: 'api-usage', label: 'API Usage', icon: BarChart3 },
            { value: 'system-health', label: 'System Health', icon: Activity },
            { value: 'database-tools', label: 'Database Tools', icon: Database },
            { value: 'cache-performance', label: 'Cache & Perf', icon: Zap },
          ].map(tab => {
            const TabIcon = tab.icon
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-xl gap-1.5 text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-2"
              >
                <TabIcon className="size-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <div className="mt-4">
          <AnimatePresence mode="wait">
            {activeTab === 'feature-flags' && <div key="feature-flags">{renderFeatureFlagsTab()}</div>}
            {activeTab === 'api-playground' && <div key="api-playground">{renderApiPlaygroundTab()}</div>}
            {activeTab === 'api-usage' && <div key="api-usage">{renderApiUsageTab()}</div>}
            {activeTab === 'system-health' && <div key="system-health">{renderSystemHealthTab()}</div>}
            {activeTab === 'database-tools' && <div key="database-tools">{renderDatabaseToolsTab()}</div>}
            {activeTab === 'cache-performance' && <div key="cache-performance">{renderCachePerformanceTab()}</div>}
          </AnimatePresence>
        </div>
      </Tabs>

      {/* ── Create Flag Dialog ── */}
      <Dialog open={createFlagOpen} onOpenChange={setCreateFlagOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold">Create Feature Flag</DialogTitle>
            <DialogDescription>Add a new feature flag to control platform functionality</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-[13px] font-semibold">Display Name *</Label>
              <Input value={flagForm.displayName} onChange={e => setFlagForm(p => ({ ...p, displayName: e.target.value }))} className="rounded-xl" placeholder="e.g., Ask ShijlAI" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold">Key *</Label>
                <Input value={flagForm.key} onChange={e => setFlagForm(p => ({ ...p, key: e.target.value }))} className="rounded-xl font-mono" placeholder="e.g., ai_tutor" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold">Internal Name</Label>
                <Input value={flagForm.name} onChange={e => setFlagForm(p => ({ ...p, name: e.target.value }))} className="rounded-xl" placeholder="Auto from key" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-semibold">Description</Label>
              <Textarea value={flagForm.description} onChange={e => setFlagForm(p => ({ ...p, description: e.target.value }))} className="rounded-xl min-h-[80px]" placeholder="What does this flag control?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold">Category</Label>
                <Select value={flagForm.category} onValueChange={v => setFlagForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FLAG_CATEGORY_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold">Rollout %</Label>
                <Input type="number" value={flagForm.rollout} onChange={e => setFlagForm(p => ({ ...p, rollout: parseInt(e.target.value) || 0 }))} className="rounded-xl" min={0} max={100} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <Label className="text-[13px] font-semibold">Enabled</Label>
              <Switch checked={flagForm.enabled} onCheckedChange={v => setFlagForm(p => ({ ...p, enabled: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setCreateFlagOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white" onClick={handleSaveFlag}>Create Flag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Flag Dialog ── */}
      <Dialog open={editFlagOpen} onOpenChange={setEditFlagOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold">Edit Feature Flag</DialogTitle>
            <DialogDescription>Update flag settings for &quot;{editingFlag?.displayName}&quot;</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-[13px] font-semibold">Display Name</Label>
              <Input value={flagForm.displayName} onChange={e => setFlagForm(p => ({ ...p, displayName: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-semibold">Description</Label>
              <Textarea value={flagForm.description} onChange={e => setFlagForm(p => ({ ...p, description: e.target.value }))} className="rounded-xl min-h-[80px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold">Category</Label>
                <Select value={flagForm.category} onValueChange={v => setFlagForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FLAG_CATEGORY_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold">Rollout %</Label>
                <Input type="number" value={flagForm.rollout} onChange={e => setFlagForm(p => ({ ...p, rollout: parseInt(e.target.value) || 0 }))} className="rounded-xl" min={0} max={100} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <Label className="text-[13px] font-semibold">Enabled</Label>
              <Switch checked={flagForm.enabled} onCheckedChange={v => setFlagForm(p => ({ ...p, enabled: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditFlagOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white" onClick={handleSaveFlag}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Flag Dialog ── */}
      <Dialog open={deleteFlagOpen} onOpenChange={setDeleteFlagOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold">Delete Feature Flag</DialogTitle>
            <DialogDescription>Are you sure you want to delete this flag? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => { setDeleteFlagOpen(false); setDeletingFlagId(null) }}>Cancel</Button>
            <Button className="rounded-xl bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteFlag}>Delete Flag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Clear Cache Dialog ── */}
      <Dialog open={clearCacheOpen} onOpenChange={setClearCacheOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold">Clear Application Cache</DialogTitle>
            <DialogDescription>This will clear all in-memory cache entries. The cache will rebuild automatically as requests come in. Continue?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setClearCacheOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white" onClick={handleClearCache} disabled={clearingCache}>
              {clearingCache ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Clear Cache
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Purge All Caches Dialog ── */}
      <Dialog open={purgeAllOpen} onOpenChange={setPurgeAllOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold">Purge All Caches</DialogTitle>
            <DialogDescription>This will purge application cache, CDN cache, and reset all rate limit counters. This may temporarily impact performance. Continue?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setPurgeAllOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-red-600 hover:bg-red-700 text-white" onClick={handlePurgeAllCaches} disabled={clearingCache}>
              {clearingCache ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Purge All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function AdminDevToolsWrapped() {
  return <AdminDevTools />
}
