'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList, Activity, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, XCircle, Loader2, RefreshCw, Search, Download,
  FileText, X, ChevronDown, ChevronUp, Shield, Clock,
  User, BarChart3, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MobileFilterSheet, MobileFilterGroup } from '@/components/mobile-filter-sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuditLogEntry {
  id: string
  userId: string | null
  user: { id: string; name: string; email: string; avatar: string | null } | null
  type: string
  title: string
  description: string | null
  icon: string
  metadata: string | null
  action: string
  targetName: string | null
  targetType: string | null
  targetId: string | null
  ipAddress: string | null
  severity: string
  category: string
  createdAt: string
}

interface AuditLogStats {
  totalEvents: number
  thisMonth: number
  lastMonth: number
  momChange: number
  byCategory: Record<string, number>
  bySeverity: Record<string, number>
  topAdmins: Array<{ userId: string; userName: string; actionCount: number }>
}

interface AuditLogResponse {
  logs: AuditLogEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
  stats: AuditLogStats
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return num.toLocaleString()
}

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// ─── Config Maps ────────────────────────────────────────────────────────────

const ACTION_STYLE_MAP: Record<string, { color: string; label: string }> = {
  approved: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', label: 'Approved' },
  suspended: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400', label: 'Suspended' },
  removed: { color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400', label: 'Removed' },
  issued: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400', label: 'Issued' },
  changed: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400', label: 'Changed' },
  sent: { color: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400', label: 'Sent' },
  rejected: { color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400', label: 'Rejected' },
  created: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', label: 'Created' },
  blocked: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400', label: 'Blocked' },
  updated: { color: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400', label: 'Updated' },
  processed: { color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400', label: 'Processed' },
  generic: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-950/40 dark:text-gray-400', label: 'Action' },
}

const SEVERITY_STYLE_MAP: Record<string, { color: string; label: string }> = {
  info: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400', label: 'Info' },
  warning: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400', label: 'Warning' },
  critical: { color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400', label: 'Critical' },
}

const CATEGORY_STYLE_MAP: Record<string, { color: string; label: string }> = {
  admin_action: { color: 'bg-slate-100 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400', label: 'Admin Action' },
  system_event: { color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400', label: 'System Event' },
  security: { color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400', label: 'Security' },
  finance: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', label: 'Finance' },
  content: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400', label: 'Content' },
  user_management: { color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400', label: 'User Mgmt' },
}

const ALL_VALUE = '__all__'

const CATEGORY_OPTIONS = [
  { value: ALL_VALUE, label: 'All Categories' },
  { value: 'admin_action', label: 'Admin Actions' },
  { value: 'system_event', label: 'System Events' },
  { value: 'security', label: 'Security' },
  { value: 'finance', label: 'Finance' },
  { value: 'content', label: 'Content' },
  { value: 'user_management', label: 'User Management' },
]

const ACTION_OPTIONS = [
  { value: ALL_VALUE, label: 'All Actions' },
  { value: 'approved', label: 'Approved' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'removed', label: 'Removed' },
  { value: 'issued', label: 'Issued' },
  { value: 'changed', label: 'Changed' },
  { value: 'sent', label: 'Sent' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'created', label: 'Created' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'updated', label: 'Updated' },
  { value: 'processed', label: 'Processed' },
]

const SEVERITY_OPTIONS = [
  { value: ALL_VALUE, label: 'All Severities' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
]

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminAuditLog() {
  // ── Toast State ──
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const toastTimeout = useRef<NodeJS.Timeout | null>(null)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    toastTimeout.current = setTimeout(() => setToast(null), 4000)
  }, [])

  // ── Data State ──
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [stats, setStats] = useState<AuditLogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // ── Filters (use __all__ for Select compatibility; map to '' in query params) ──
  const [categoryFilter, setCategoryFilter] = useState(ALL_VALUE)
  const [actionFilter, setActionFilter] = useState(ALL_VALUE)
  const [userFilter, setUserFilter] = useState(ALL_VALUE)
  const [severityFilter, setSeverityFilter] = useState(ALL_VALUE)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // ── Expandable rows ──
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // ── Admin users for user filter dropdown ──
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; name: string }>>([])

  // ── Build query params ──
  const buildQueryParams = useCallback((pageNum: number, extraParams: Record<string, string> = {}) => {
    const params = new URLSearchParams()
    params.set('page', String(pageNum))
    params.set('limit', '20')
    if (categoryFilter && categoryFilter !== ALL_VALUE) params.set('category', categoryFilter)
    if (actionFilter && actionFilter !== ALL_VALUE) params.set('action', actionFilter)
    if (userFilter && userFilter !== ALL_VALUE) params.set('userId', userFilter)
    if (severityFilter && severityFilter !== ALL_VALUE) params.set('severity', severityFilter)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    if (searchQuery) params.set('search', searchQuery)
    for (const [key, value] of Object.entries(extraParams)) {
      params.set(key, value)
    }
    return params
  }, [categoryFilter, actionFilter, userFilter, severityFilter, dateFrom, dateTo, searchQuery])

  // ── Fetch data ──
  const fetchData = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    try {
      const params = buildQueryParams(pageNum)
      const res = await fetch(`/api/admin/audit-log?${params}`)
      if (!res.ok) throw new Error('Failed to fetch audit logs')
      const json: AuditLogResponse = await res.json()
      if (append) {
        setLogs(prev => [...prev, ...json.logs])
      } else {
        setLogs(json.logs)
      }
      setStats(json.stats)
      setPage(json.page)
      setTotalPages(json.totalPages)
      setTotal(json.total)

      // Extract unique admin users from logs + topAdmins
      const userMap = new Map<string, string>()
      for (const log of json.logs) {
        if (log.user) {
          userMap.set(log.user.id, log.user.name)
        }
      }
      if (json.stats?.topAdmins) {
        for (const admin of json.stats.topAdmins) {
          userMap.set(admin.userId, admin.userName)
        }
      }
      setAdminUsers(prev => {
        const merged = new Map(prev.map(u => [u.id, u.name]))
        for (const [id, name] of userMap) {
          merged.set(id, name)
        }
        return Array.from(merged.entries()).map(([id, name]) => ({ id, name }))
      })
    } catch {
      showToast('error', 'Failed to load audit logs')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [buildQueryParams, showToast])

  // ── Initial fetch ──
  useEffect(() => { fetchData(1) }, [fetchData])

  // ── Toggle row expansion ──
  const toggleRow = useCallback((id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // ── Clear all filters ──
  const clearFilters = useCallback(() => {
    setCategoryFilter(ALL_VALUE)
    setActionFilter(ALL_VALUE)
    setUserFilter(ALL_VALUE)
    setSeverityFilter(ALL_VALUE)
    setDateFrom('')
    setDateTo('')
    setSearchQuery('')
  }, [])

  const hasActiveFilters = (categoryFilter && categoryFilter !== ALL_VALUE) || (actionFilter && actionFilter !== ALL_VALUE) || (userFilter && userFilter !== ALL_VALUE) || (severityFilter && severityFilter !== ALL_VALUE) || dateFrom || dateTo || searchQuery

  // ── Export handlers ──
  const handleExportCSV = useCallback(() => {
    const params = buildQueryParams(1, { export: 'csv' })
    window.open(`/api/admin/audit-log?${params}`, '_blank')
    showToast('success', 'CSV export started')
  }, [buildQueryParams, showToast])

  const handleExportPDF = useCallback(() => {
    const params = buildQueryParams(1, { export: 'pdf' })
    window.open(`/api/admin/audit-log?${params}`, '_blank')
    showToast('success', 'PDF report export started')
  }, [buildQueryParams, showToast])

  // ── Get avatar initial ──
  const getInitial = useCallback((name: string | null | undefined) => {
    if (!name) return '?'
    return name.charAt(0).toUpperCase()
  }, [])

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
        <div className="space-y-3">
          <Skeleton className="h-12 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: MAIN CONTENT
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {renderToast()}

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-500 to-slate-600 ios-shadow-sm">
            <ClipboardList className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-foreground">Audit Log</h1>
            <p className="text-[15px] text-muted-foreground">Track all administrative actions and system events</p>
          </div>
        </div>
        <div className="sm:ml-auto flex items-center gap-3">
          <Badge variant="secondary" className="rounded-xl px-3 py-1.5 text-[13px] font-semibold bg-gray-100 text-gray-700 dark:bg-gray-950/40 dark:text-gray-400">
            Total: {formatNumber(stats?.totalEvents ?? 0)} events
          </Badge>
          {stats && stats.momChange !== 0 && (
            <Badge
              variant="secondary"
              className={cn(
                'rounded-xl px-2.5 py-1 text-[12px] font-semibold gap-1',
                stats.momChange > 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
              )}
            >
              {stats.momChange > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {Math.abs(stats.momChange)}% MoM
            </Badge>
          )}
        </div>
      </motion.div>

      {/* ── Stats Row ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Total Events */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-gray-500/20 to-slate-500/20">
                <Activity className="size-5 text-gray-600 dark:text-gray-400" />
              </div>
              <Badge variant="secondary" className="rounded-lg text-[11px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-950/40 dark:text-gray-400">
                All time
              </Badge>
            </div>
            <div>
              <p className="text-[22px] font-bold">{formatNumber(stats?.totalEvents ?? 0)}</p>
              <p className="text-[12px] text-muted-foreground">Total Events</p>
            </div>
          </CardContent>
        </Card>

        {/* This Month */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                <BarChart3 className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  'rounded-lg text-[11px] font-bold',
                  (stats?.momChange ?? 0) >= 0
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                )}
              >
                {(stats?.momChange ?? 0) >= 0 ? '+' : ''}{stats?.momChange ?? 0}%
              </Badge>
            </div>
            <div>
              <p className="text-[22px] font-bold">{formatNumber(stats?.thisMonth ?? 0)}</p>
              <p className="text-[12px] text-muted-foreground">This Month ({formatNumber(stats?.lastMonth ?? 0)} last month)</p>
            </div>
          </CardContent>
        </Card>

        {/* Severity Breakdown */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <Zap className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="rounded-lg text-[10px] font-bold px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                  {stats?.bySeverity?.info ?? 0}
                </Badge>
                <Badge variant="secondary" className="rounded-lg text-[10px] font-bold px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                  {stats?.bySeverity?.warning ?? 0}
                </Badge>
                <Badge variant="secondary" className="rounded-lg text-[10px] font-bold px-1.5 py-0 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                  {stats?.bySeverity?.critical ?? 0}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-[14px] font-semibold">By Severity</p>
              <p className="text-[12px] text-muted-foreground">Info / Warning / Critical</p>
            </div>
          </CardContent>
        </Card>

        {/* Top Admin */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20">
                <User className="size-5 text-teal-600 dark:text-teal-400" />
              </div>
              <Badge variant="secondary" className="rounded-lg text-[11px] font-bold bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400">
                Most Active
              </Badge>
            </div>
            <div>
              <p className="text-[14px] font-semibold truncate">{stats?.topAdmins?.[0]?.userName ?? 'N/A'}</p>
              <p className="text-[12px] text-muted-foreground">{stats?.topAdmins?.[0]?.actionCount ?? 0} actions this month</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Filters Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.1 }}
      >
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardContent className="p-4">
            {/* Search + Filters Row */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative w-full md:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="rounded-xl h-9 text-[13px] pl-9"
                />
              </div>

              {/* Mobile Filter Sheet */}
              <MobileFilterSheet
                activeCount={[
                  categoryFilter !== ALL_VALUE ? 1 : 0,
                  actionFilter !== ALL_VALUE ? 1 : 0,
                  userFilter !== ALL_VALUE ? 1 : 0,
                  severityFilter !== ALL_VALUE ? 1 : 0,
                  dateFrom ? 1 : 0,
                  dateTo ? 1 : 0,
                ].reduce((a, b) => a + b, 0)}
                onClearAll={() => {
                  setCategoryFilter(ALL_VALUE)
                  setActionFilter(ALL_VALUE)
                  setUserFilter(ALL_VALUE)
                  setSeverityFilter(ALL_VALUE)
                  setDateFrom('')
                  setDateTo('')
                }}
                title="Audit Log Filters"
              >
                <MobileFilterGroup label="Category">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="rounded-xl h-9">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </MobileFilterGroup>

                <MobileFilterGroup label="Action Type">
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="rounded-xl h-9">
                      <SelectValue placeholder="Action type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </MobileFilterGroup>

                <MobileFilterGroup label="User">
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="rounded-xl h-9">
                      <SelectValue placeholder="Admin user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>All Users</SelectItem>
                      {adminUsers.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </MobileFilterGroup>

                <MobileFilterGroup label="Severity">
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="rounded-xl h-9">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </MobileFilterGroup>

                <MobileFilterGroup label="Date From">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="rounded-xl h-9"
                  />
                </MobileFilterGroup>

                <MobileFilterGroup label="Date To">
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="rounded-xl h-9"
                  />
                </MobileFilterGroup>
              </MobileFilterSheet>

              {/* Desktop: Inline Filter Selects */}
              <div className="hidden md:flex gap-2 items-center">
                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px] rounded-xl h-9 text-[13px]" size="sm">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Action Type Filter */}
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[130px] rounded-xl h-9 text-[13px]" size="sm">
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Refresh */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl size-9 p-0"
                      onClick={() => fetchData(1)}
                    >
                      <RefreshCw className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh data</TooltipContent>
                </Tooltip>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl h-9 gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={clearFilters}
                  >
                    <X className="size-3.5" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile Clear Filters + Export */}
            <div className="flex flex-wrap items-center gap-2 md:hidden mt-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5 h-8 text-[12px]"
                  onClick={clearFilters}
                >
                  <X className="size-3" /> Clear
                </Button>
              )}
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5 h-8 text-[12px]"
                  onClick={handleExportCSV}
                >
                  <Download className="size-3" /> CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5 h-8 text-[12px]"
                  onClick={handleExportPDF}
                >
                  <FileText className="size-3" /> PDF
                </Button>
              </div>
            </div>

            {/* Desktop Export Buttons */}
            <div className="hidden md:flex items-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5 h-8 text-[12px]"
                onClick={handleExportCSV}
              >
                <Download className="size-3" /> Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5 h-8 text-[12px]"
                onClick={handleExportPDF}
              >
                <FileText className="size-3" /> Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Main Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.15 }}
      >
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardContent className="p-0">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/50">
                  <ClipboardList className="size-8 text-muted-foreground/30" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[16px] font-semibold">No audit logs found</p>
                  <p className="text-[13px] text-muted-foreground max-w-sm">
                    {hasActiveFilters
                      ? 'Try adjusting your filters to see more results'
                      : 'Audit logs will appear here as admin actions are recorded'}
                  </p>
                </div>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={clearFilters}>
                    <X className="size-3" /> Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[12px] w-[130px]">Timestamp</TableHead>
                      <TableHead className="text-[12px] w-[140px]">Admin</TableHead>
                      <TableHead className="text-[12px]">Action</TableHead>
                      <TableHead className="text-[12px] w-[140px]">Target</TableHead>
                      <TableHead className="text-[12px] w-[90px]">Severity</TableHead>
                      <TableHead className="text-[12px] w-[110px]">Category</TableHead>
                      <TableHead className="text-[12px] w-[36px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const isExpanded = expandedRows.has(log.id)
                      const actionStyle = ACTION_STYLE_MAP[log.action] || ACTION_STYLE_MAP.generic
                      const severityStyle = SEVERITY_STYLE_MAP[log.severity] || SEVERITY_STYLE_MAP.info
                      const categoryStyle = CATEGORY_STYLE_MAP[log.category] || CATEGORY_STYLE_MAP.admin_action

                      return (
                        <React.Fragment key={log.id}>
                          <TableRow
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => toggleRow(log.id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Clock className="size-3 text-muted-foreground flex-shrink-0" />
                                <span className="text-[13px] text-muted-foreground">{formatTimestamp(log.createdAt)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  'flex size-7 items-center justify-center rounded-full text-[11px] font-bold flex-shrink-0',
                                  'bg-gradient-to-br from-gray-400 to-slate-500 text-white'
                                )}>
                                  {getInitial(log.user?.name)}
                                </div>
                                <span className="text-[13px] font-medium truncate max-w-[90px]">
                                  {log.user?.name || 'System'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={cn('text-[11px] rounded-lg font-medium', actionStyle.color)}>
                                {log.title}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-[13px] text-muted-foreground truncate block max-w-[130px]">
                                {log.targetName || '—'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={cn('text-[10px] rounded-lg', severityStyle.color)}>
                                {severityStyle.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={cn('text-[10px] rounded-lg', categoryStyle.color)}>
                                {categoryStyle.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {isExpanded
                                ? <ChevronUp className="size-3.5 text-muted-foreground" />
                                : <ChevronDown className="size-3.5 text-muted-foreground" />
                              }
                            </TableCell>
                          </TableRow>

                          {/* Expanded Row Details */}
                          <AnimatePresence key={`${log.id}-detail`}>
                            {isExpanded && (
                              <TableRow className="bg-muted/30">
                                <TableCell colSpan={7} className="p-0">
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="px-6 py-4 space-y-3"
                                  >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {/* Description */}
                                      <div>
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                                        <p className="text-[13px]">{log.description || 'No description available'}</p>
                                      </div>

                                      {/* Metadata */}
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                          <span className="text-[11px] text-muted-foreground">IP Address:</span>
                                          <span className="text-[13px] font-mono">{log.ipAddress || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-[11px] text-muted-foreground">Target Type:</span>
                                          <span className="text-[13px]">{log.targetType || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-[11px] text-muted-foreground">Target ID:</span>
                                          <span className="text-[13px] font-mono text-muted-foreground">{log.targetId || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-[11px] text-muted-foreground">Log ID:</span>
                                          <span className="text-[12px] font-mono text-muted-foreground">{log.id}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Raw metadata if available */}
                                    {log.metadata && (
                                      <div>
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Metadata</p>
                                        <pre className="text-[12px] bg-muted/50 rounded-xl p-3 overflow-auto max-h-32 font-mono">
                                          {(() => {
                                            try {
                                              return JSON.stringify(JSON.parse(log.metadata), null, 2)
                                            } catch {
                                              return log.metadata
                                            }
                                          })()}
                                        </pre>
                                      </div>
                                    )}
                                  </motion.div>
                                </TableCell>
                              </TableRow>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Load More ── */}
      {logs.length > 0 && page < totalPages && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5"
            onClick={() => fetchData(page + 1, true)}
            disabled={loadingMore}
          >
            {loadingMore ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Load more ({total - logs.length} remaining)
          </Button>
        </div>
      )}

      {/* ── Footer Note ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...springTransition, delay: 0.2 }}
        className="flex items-center gap-2 px-1"
      >
        <Shield className="size-3.5 text-muted-foreground/50" />
        <p className="text-[12px] text-muted-foreground/60">
          Audit logs are retained for 12 months and cannot be deleted or modified.
        </p>
      </motion.div>
    </div>
  )
}

// ─── Wrapped Export ──────────────────────────────────────────────────────────

export function AdminAuditLogWrapped() {
  return <AdminAuditLog />
}
