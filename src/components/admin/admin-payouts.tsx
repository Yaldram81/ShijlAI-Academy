'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, Users, Search, Download, FileText,
  ChevronLeft, ChevronRight, RefreshCw, Loader2,
  AlertCircle, CheckCircle, XCircle, AlertTriangle,
  Clock, Shield, BarChart3, Receipt, Scale,
  FileDown, Calendar, Building, Info,
  ChevronDown, MoreHorizontal, Settings, Settings2,
  Send, Banknote, Wallet, Landmark, Phone, Mail,
  Check, X, ArrowRight, Copy, Zap, Timer,
  MessageSquare, Gavel, DollarSign, Percent,
  CircleDollarSign, HandCoins, TrendingUp, TrendingDown,
  Activity, Eye, Trash2, Plus, RotateCcw, Flag,
  StickyNote, CalendarClock, FileBadge2, Building2,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { CurrencyProvider, useCurrency } from '@/components/admin/currency-provider'
import { AdminStatCard, AdminStatCardGrid } from './admin-stat-card'

// ─── Types ──────────────────────────────────────────────────────────────────

interface PayoutItem {
  id: string
  amount: number
  currency: string
  status: string
  method: string
  payoutMethodId: string | null
  reference: string | null
  notes: string | null
  periodStart: string | null
  periodEnd: string | null
  requestedAt: string
  processedAt: string | null
  completedAt: string | null
  disputeReason: string | null
  disputeResolution: string | null
  disputedAt: string | null
  taxWithheld: number
  grossEarning: number
  createdAt: string
  instructor: {
    id: string
    name: string
    avatar: string | null
    email: string
    commissionOverride: { commissionRate: number; reason: string | null } | null
  }
  payoutMethod: {
    id: string
    type: string
    bankName: string | null
    accountNumber: string | null
    phoneNumber: string | null
    email: string | null
  } | null
}

interface PayoutSettings {
  platformCommissionRate: number
  instructorPayoutRate: number
  minimumPayoutAmount: number
  withholdingTaxRate: number
  payoutHoldPeriodDays: number
  defaultPayoutSchedule: string
  supportedPayoutMethods: string
  autoApproveRefunds?: boolean
  disputeResolutionDays?: number
}

interface CommissionOverride {
  instructorId: string
  instructorName: string
  commissionRate: number
  reason: string | null
}

interface PayoutAnalytics {
  overview: {
    totalPayouts: number
    totalAmount: number
    pendingCount: number
    pendingAmount: number
    completedThisMonth: number
    completedThisMonthAmount: number
    failedCount: number
    disputedCount: number
    avgProcessingDays: number
    lastPayoutDate: string | null
  }
  monthlyTrend: Array<{ month: string; count: number; amount: number; platformCommission: number }>
  methodDistribution: Array<{ method: string; count: number; amount: number; percentage: number }>
  topInstructors: Array<{ instructorId: string; name: string; avatar: string | null; totalPayout: number; payoutCount: number }>
  recentActivity: Array<{ id: string; instructorName: string; amount: number; status: string; completedAt: string | null; method: string }>
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatUSD(num: number): string {
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return `$${num.toLocaleString()}`
}

function formatUSDFull(num: number): string {
  return `$${Math.round(num).toLocaleString()}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return formatShortDate(dateStr)
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

function getMethodLabel(method: string, payoutMethod: PayoutItem['payoutMethod']): string {
  if (method === 'bank_transfer' && payoutMethod?.bankName && payoutMethod?.accountNumber) {
    return `${payoutMethod.bankName} ****${payoutMethod.accountNumber.slice(-4)}`
  }
  if (method === 'jazzcash' && payoutMethod?.phoneNumber) {
    return `JazzCash ****${payoutMethod.phoneNumber.slice(-4)}`
  }
  if (method === 'easypaisa' && payoutMethod?.phoneNumber) {
    return `Easypaisa ****${payoutMethod.phoneNumber.slice(-4)}`
  }
  if (method === 'payoneer') return 'Payoneer'
  if (method === 'stripe') return 'Stripe'
  return method.replace(/_/g, ' ')
}

function getMethodIcon(method: string) {
  switch (method) {
    case 'bank_transfer': return <Landmark className="size-3.5" />
    case 'jazzcash': return <Phone className="size-3.5" />
    case 'easypaisa': return <Phone className="size-3.5" />
    case 'payoneer': return <DollarSign className="size-3.5" />
    case 'stripe': return <CreditCard className="size-3.5" />
    default: return <Wallet className="size-3.5" />
  }
}

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  jazzcash: 'JazzCash',
  easypaisa: 'Easypaisa',
  payoneer: 'Payoneer',
  stripe: 'Stripe',
}

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400', icon: <Clock className="size-3" /> },
  processing: { label: 'Processing', badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400', icon: <Loader2 className="size-3" /> },
  completed: { label: 'Completed', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', icon: <CheckCircle className="size-3" /> },
  failed: { label: 'Failed', badgeClass: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400', icon: <XCircle className="size-3" /> },
  cancelled: { label: 'Cancelled', badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400', icon: <X className="size-3" /> },
  disputed: { label: 'Disputed', badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400', icon: <AlertTriangle className="size-3" /> },
}

const METHOD_COLORS: Record<string, string> = {
  bank_transfer: 'bg-violet-500',
  jazzcash: 'bg-red-500',
  easypaisa: 'bg-green-500',
  payoneer: 'bg-sky-500',
  stripe: 'bg-purple-500',
}

const METHOD_BAR_COLORS: Record<string, string> = {
  bank_transfer: 'bg-violet-500',
  jazzcash: 'bg-red-500',
  easypaisa: 'bg-green-500',
  payoneer: 'bg-sky-500',
  stripe: 'bg-purple-500',
}

// ─── Payout Detail Sheet ────────────────────────────────────────────────────

function PayoutDetailSheet({ payout, open, onClose }: { payout: PayoutItem | null; open: boolean; onClose: () => void }) {
  if (!payout) return null
  const statusConf = STATUS_CONFIG[payout.status] || STATUS_CONFIG.pending
  const instructorRate = payout.instructor.commissionOverride?.commissionRate ?? 80
  const platformCut = Math.round(payout.grossEarning * (1 - instructorRate / 100))
  const netBeforeTax = payout.grossEarning - platformCut
  const taxAmount = Math.round(netBeforeTax * 0.1)

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-[18px] font-semibold">Payout Details</SheetTitle>
        </SheetHeader>
        <div className="space-y-5">
          {/* Status + Amount */}
          <div className="flex items-center justify-between">
            <Badge className={cn('text-[12px] rounded-lg px-3 py-1 gap-1.5', statusConf.badgeClass)}>
              {statusConf.icon}
              {statusConf.label}
            </Badge>
            <p className="text-[22px] font-bold">{formatUSDFull(payout.amount)}</p>
          </div>

          <Separator className="opacity-40" />

          {/* Instructor */}
          <div className="flex items-center gap-3">
            <Avatar className="size-11 rounded-xl">
              <AvatarImage src={payout.instructor.avatar || undefined} />
              <AvatarFallback className="text-[12px] bg-primary/10 rounded-xl">{getInitials(payout.instructor.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[15px] font-semibold">{payout.instructor.name}</p>
              <p className="text-[12px] text-muted-foreground">{payout.instructor.email}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-2">
            <div className="flex justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-[13px] text-muted-foreground">Method</span>
              <div className="flex items-center gap-2">
                <div className={cn('flex size-5 items-center justify-center rounded-md', METHOD_COLORS[payout.method] || 'bg-slate-400')}>
                  <span className="text-white">{getMethodIcon(payout.method)}</span>
                </div>
                <span className="text-[13px] font-medium">{getMethodLabel(payout.method, payout.payoutMethod)}</span>
              </div>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-[13px] text-muted-foreground">Gross Earning</span>
              <span className="text-[13px] font-medium">{formatUSDFull(payout.grossEarning)}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-[13px] text-muted-foreground">Platform Cut ({100 - instructorRate}%)</span>
              <span className="text-[13px] font-medium text-rose-600">- {formatUSDFull(platformCut)}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-[13px] text-muted-foreground">Tax Withheld</span>
              <span className="text-[13px] font-medium text-orange-600">- {formatUSDFull(payout.taxWithheld || taxAmount)}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
              <span className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-400">Net Payout</span>
              <span className="text-[14px] font-bold text-emerald-700 dark:text-emerald-400">{formatUSDFull(payout.amount)}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-[13px] text-muted-foreground">Requested</span>
              <span className="text-[13px] font-medium">{formatDate(payout.requestedAt)}</span>
            </div>
            {payout.processedAt && (
              <div className="flex justify-between p-3 rounded-xl bg-muted/50">
                <span className="text-[13px] text-muted-foreground">Processed</span>
                <span className="text-[13px] font-medium">{formatDate(payout.processedAt)}</span>
              </div>
            )}
            {payout.completedAt && (
              <div className="flex justify-between p-3 rounded-xl bg-muted/50">
                <span className="text-[13px] text-muted-foreground">Completed</span>
                <span className="text-[13px] font-medium">{formatDate(payout.completedAt)}</span>
              </div>
            )}
            {payout.reference && (
              <div className="flex justify-between p-3 rounded-xl bg-muted/50">
                <span className="text-[13px] text-muted-foreground">Reference</span>
                <span className="text-[13px] font-mono">{payout.reference}</span>
              </div>
            )}
            {payout.periodStart && payout.periodEnd && (
              <div className="flex justify-between p-3 rounded-xl bg-muted/50">
                <span className="text-[13px] text-muted-foreground">Period</span>
                <span className="text-[13px] font-medium">{formatShortDate(payout.periodStart)} — {formatShortDate(payout.periodEnd)}</span>
              </div>
            )}
          </div>

          {/* Dispute Info */}
          {payout.status === 'disputed' && (
            <>
              <Separator className="opacity-40" />
              <div className="rounded-xl bg-orange-50 dark:bg-orange-950/20 p-4 border border-orange-200/50 dark:border-orange-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="size-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-[13px] font-semibold text-orange-700 dark:text-orange-400">Dispute Reason</span>
                </div>
                <p className="text-[13px] text-orange-800 dark:text-orange-300 leading-relaxed">{payout.disputeReason || 'No reason provided'}</p>
              </div>
              {payout.disputeResolution && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-4 border border-emerald-200/50 dark:border-emerald-900/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-400">Resolution</span>
                  </div>
                  <p className="text-[13px] text-emerald-800 dark:text-emerald-300 leading-relaxed">{payout.disputeResolution}</p>
                </div>
              )}
            </>
          )}

          {/* Notes */}
          {payout.notes && (
            <>
              <Separator className="opacity-40" />
              <div className="rounded-xl bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <StickyNote className="size-4 text-muted-foreground" />
                  <span className="text-[13px] font-semibold">Admin Notes</span>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{payout.notes}</p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Add Note Dialog ────────────────────────────────────────────────────────

function AddNoteDialog({ open, onClose, payoutId, onSuccess }: { open: boolean; onClose: () => void; payoutId: string | null; onSuccess: () => void }) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!payoutId || !note.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/finance/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, action: 'add_note', note: note.trim() }),
      })
      if (!res.ok) throw new Error('Failed to add note')
      toast.success('Note added successfully')
      setNote('')
      onClose()
      onSuccess()
    } catch {
      toast.error('Failed to add note')
    } finally {
      setLoading(false)
    }
  }, [payoutId, note, onClose, onSuccess])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Add Note</DialogTitle>
          <DialogDescription className="text-[14px] text-muted-foreground">Add an admin note to this payout record.</DialogDescription>
        </DialogHeader>
        <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Enter note..." className="rounded-xl min-h-[100px]" />
        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={onClose}>Cancel</Button>
          <Button className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white border-0" disabled={loading || !note.trim()} onClick={handleSubmit}>
            {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <StickyNote className="size-4 mr-2" />}
            Add Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Overview Tab ───────────────────────────────────────────────────────────

function OverviewTab({ onNavigateTab }: { onNavigateTab: (tab: string) => void }) {
  const [analytics, setAnalytics] = useState<PayoutAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('year')

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/finance/payouts/analytics?period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setAnalytics(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  const ov = analytics?.overview
  const maxTrendAmount = Math.max(...(analytics?.monthlyTrend.map(m => m.amount) || [1]), 1)
  const maxInstructorAmount = Math.max(...(analytics?.topInstructors.map(i => i.totalPayout) || [1]), 1)

  return (
    <div className="space-y-5">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        {['month', 'quarter', 'year', 'all'].map(p => (
          <Button key={p} variant={period === p ? 'default' : 'outline'} size="sm" className="rounded-xl text-[12px] h-8" onClick={() => setPeriod(p)}>
            {p === 'month' ? 'This Month' : p === 'quarter' ? 'This Quarter' : p === 'year' ? 'This Year' : 'All Time'}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
              <div className="h-1 bg-muted" />
              <CardContent className="p-4"><Skeleton className="h-6 w-16 rounded-lg mx-auto" /><Skeleton className="h-3 w-20 rounded-lg mx-auto mt-2" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* 6 Stat Cards */}
          <AdminStatCardGrid columns={6}>
            <AdminStatCard icon={CircleDollarSign} label="Total Payouts" value={String(ov?.totalPayouts ?? 0)} color="pink" />
            <AdminStatCard icon={Banknote} label="Total Amount" value={formatUSD(ov?.totalAmount ?? 0)} color="emerald" />
            <AdminStatCard icon={Clock} label="Pending" value={String(ov?.pendingCount ?? 0)} color="amber" onClick={() => onNavigateTab('pending')} />
            <AdminStatCard icon={CheckCircle} label="This Month Done" value={String(ov?.completedThisMonth ?? 0)} color="teal" />
            <AdminStatCard icon={Timer} label="Avg Process Days" value={`${(ov?.avgProcessingDays ?? 0).toFixed(1)}d`} color="violet" />
            <AdminStatCard icon={AlertTriangle} label="Open Disputes" value={String(ov?.disputedCount ?? 0)} color="orange" onClick={() => onNavigateTab('disputed')} />
          </AdminStatCardGrid>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Monthly Payout Trend */}
            <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-pink-400 to-rose-500" />
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-[14px] font-semibold">Monthly Payout Trend</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="flex items-end gap-2 h-40">
                  {analytics?.monthlyTrend.map((m, i) => (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{formatUSD(m.amount)}</span>
                      <motion.div
                        className="w-full bg-gradient-to-t from-pink-500 to-rose-400 rounded-t-lg min-h-[4px]"
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max((m.amount / maxTrendAmount) * 120, 4)}px` }}
                        transition={{ delay: i * 0.08, duration: 0.5, ...springTransition }}
                      />
                      <span className="text-[9px] text-muted-foreground">{m.month.slice(5)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Method Distribution */}
            <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-violet-400 to-purple-500" />
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-[14px] font-semibold">Payout Method Distribution</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-3">
                {analytics?.methodDistribution.map(m => (
                  <div key={m.method} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn('size-3 rounded-sm', METHOD_BAR_COLORS[m.method] || 'bg-slate-400')} />
                        <span className="text-[12px] font-medium">{METHOD_LABELS[m.method] || m.method}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{m.percentage}% · {formatUSD(m.amount)}</span>
                    </div>
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                      <motion.div
                        className={cn('h-full rounded-full', METHOD_BAR_COLORS[m.method] || 'bg-slate-400')}
                        initial={{ width: 0 }}
                        animate={{ width: `${m.percentage}%` }}
                        transition={{ duration: 0.6, ...springTransition }}
                      />
                    </div>
                  </div>
                ))}
                {(!analytics?.methodDistribution || analytics.methodDistribution.length === 0) && (
                  <p className="text-[13px] text-muted-foreground text-center py-6">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Instructors + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top Instructors by Payout */}
            <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-emerald-400 to-green-500" />
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-[14px] font-semibold">Top Instructors by Payout</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="space-y-3">
                  {analytics?.topInstructors.slice(0, 5).map((inst, i) => (
                    <motion.div key={inst.instructorId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, ...springTransition }} className="flex items-center gap-3">
                      <span className="text-[12px] font-bold text-muted-foreground w-5">#{i + 1}</span>
                      <Avatar className="size-8 rounded-lg">
                        <AvatarImage src={inst.avatar || undefined} />
                        <AvatarFallback className="text-[10px] bg-primary/10 rounded-lg">{getInitials(inst.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate">{inst.name}</p>
                        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden mt-1">
                          <motion.div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${(inst.totalPayout / maxInstructorAmount) * 100}%` }} transition={{ duration: 0.5 }} />
                        </div>
                      </div>
                      <span className="text-[13px] font-semibold shrink-0">{formatUSD(inst.totalPayout)}</span>
                    </motion.div>
                  ))}
                  {(!analytics?.topInstructors || analytics.topInstructors.length === 0) && (
                    <p className="text-[13px] text-muted-foreground text-center py-6">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-[14px] font-semibold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {analytics?.recentActivity.slice(0, 5).map((act, i) => {
                    const sConf = STATUS_CONFIG[act.status] || STATUS_CONFIG.completed
                    return (
                      <motion.div key={act.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, ...springTransition }} className="flex items-center gap-3">
                        <div className={cn('flex size-8 items-center justify-center rounded-lg', sConf.badgeClass)}>
                          {sConf.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate">{act.instructorName}</p>
                          <p className="text-[11px] text-muted-foreground">{act.completedAt ? timeAgo(act.completedAt) : 'Processing'}</p>
                        </div>
                        <span className="text-[13px] font-semibold">{formatUSDFull(act.amount)}</span>
                      </motion.div>
                    )
                  })}
                  {(!analytics?.recentActivity || analytics.recentActivity.length === 0) && (
                    <p className="text-[13px] text-muted-foreground text-center py-6">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Pending Tab ────────────────────────────────────────────────────────────

function PendingTab({ onRefresh }: { onRefresh: () => void }) {
  const { formatAmount } = useCurrency()
  const [payouts, setPayouts] = useState<PayoutItem[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [showConfirmPay, setShowConfirmPay] = useState(false)
  const [selectedPayout, setSelectedPayout] = useState<PayoutItem | null>(null)
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState<string | null>(null)
  const [detailPayout, setDetailPayout] = useState<PayoutItem | null>(null)
  const [notePayoutId, setNotePayoutId] = useState<string | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncedSearch = useRef('')

  const fetchPending = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: 'pending', page: String(page), limit: '20' })
      if (debouncedSearch.current) params.set('search', debouncedSearch.current)
      if (methodFilter !== 'all') params.set('method', methodFilter)
      const res = await fetch(`/api/admin/finance/payouts?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPayouts(data.payouts || [])
      setPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 0 })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [methodFilter])

  useEffect(() => { fetchPending(1) }, [fetchPending])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      debouncedSearch.current = search
      fetchPending(1)
    }, 300)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [search, fetchPending])

  const handlePayNow = useCallback(async (payoutId: string) => {
    setPayingId(payoutId)
    try {
      const res = await fetch('/api/admin/finance/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, action: 'pay' }),
      })
      if (!res.ok) throw new Error('Failed to process payout')
      toast.success('Payout processed successfully')
      await fetchPending(pagination.page)
      onRefresh()
    } catch {
      toast.error('Failed to process payout')
    } finally {
      setPayingId(null)
      setShowConfirmPay(false)
      setSelectedPayout(null)
    }
  }, [fetchPending, pagination.page, onRefresh])

  const handleBulkAction = useCallback(async (action: string) => {
    if (selectedIds.size === 0) return
    setBulkAction(action)
    try {
      const payoutIds = Array.from(selectedIds)
      const res = await fetch('/api/admin/finance/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payoutIds }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      const count = data.updated ?? data.cancelled ?? data.processed ?? 0
      toast.success(`${count} payouts ${action === 'batch_pay' ? 'paid' : action === 'batch_cancel' ? 'cancelled' : 'processed'}`)
      setSelectedIds(new Set())
      await fetchPending(1)
      onRefresh()
    } catch {
      toast.error('Bulk action failed')
    } finally {
      setBulkAction(null)
    }
  }, [selectedIds, fetchPending, onRefresh])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (selectedIds.size === payouts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(payouts.map(p => p.id)))
    }
  }, [selectedIds.size, payouts])

  const totalPendingAmount = payouts.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-5">
      {/* Stats Summary */}
      <AdminStatCardGrid columns={4}>
        <AdminStatCard icon={Clock} label="Pending Payouts" value={String(pagination.total)} color="amber" />
        <AdminStatCard icon={Banknote} label="Total Pending" value={formatUSD(totalPendingAmount)} color="emerald" />
        <AdminStatCard icon={Landmark} label="Bank Transfers" value={String(payouts.filter(p => p.method === 'bank_transfer').length)} color="violet" />
        <AdminStatCard icon={Phone} label="Mobile Wallets" value={String(payouts.filter(p => p.method === 'jazzcash' || p.method === 'easypaisa').length)} color="red" />
      </AdminStatCardGrid>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search by instructor name..." value={search} onChange={e => setSearch(e.target.value)} className="rounded-xl pl-9 h-9" />
        </div>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="rounded-xl h-9 w-[160px]"><SelectValue placeholder="All Methods" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="jazzcash">JazzCash</SelectItem>
            <SelectItem value="easypaisa">Easypaisa</SelectItem>
            <SelectItem value="payoneer">Payoneer</SelectItem>
            <SelectItem value="stripe">Stripe</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3 rounded-2xl bg-pink-50 dark:bg-pink-950/20 border border-pink-200/50 dark:border-pink-900/30">
          <Checkbox checked={selectedIds.size === payouts.length} onCheckedChange={toggleAll} />
          <span className="text-[13px] font-medium">{selectedIds.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" className="rounded-xl h-8 gap-1.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white border-0" disabled={bulkAction === 'batch_pay'} onClick={() => handleBulkAction('batch_pay')}>
              {bulkAction === 'batch_pay' ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />} Pay Selected
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl h-8 gap-1.5" disabled={bulkAction === 'batch_process'} onClick={() => handleBulkAction('batch_process')}>
              <Timer className="size-3.5" /> Process
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl h-8 gap-1.5 text-red-600 hover:text-red-700" disabled={bulkAction === 'batch_cancel'} onClick={() => handleBulkAction('batch_cancel')}>
              <X className="size-3.5" /> Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Payouts Table */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-[40px_1fr_160px_120px_100px_100px] gap-2 items-center px-5 py-3 bg-muted/40 border-b text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          <div><Checkbox checked={selectedIds.size === payouts.length && payouts.length > 0} onCheckedChange={toggleAll} /></div>
          <div>Instructor</div>
          <div>Method</div>
          <div>Amount</div>
          <div>Requested</div>
          <div className="text-right">Action</div>
        </div>
        <div className="divide-y divide-border/40">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <Skeleton className="size-9 rounded-xl" /><Skeleton className="h-4 w-32 rounded-lg" /><Skeleton className="h-4 w-28 rounded-lg" /><Skeleton className="h-4 w-20 rounded-lg" /><Skeleton className="h-4 w-16 rounded-lg" /><Skeleton className="h-8 w-20 rounded-xl" />
              </div>
            ))
          ) : payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Banknote className="size-10 text-muted-foreground/30" />
              <p className="text-[15px] font-medium">No pending payouts</p>
              <p className="text-[13px] text-muted-foreground">All payouts are up to date</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {payouts.map((payout, i) => (
                <motion.div key={payout.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }} transition={{ delay: i * 0.02, ...springTransition }}
                  className="grid grid-cols-1 lg:grid-cols-[40px_1fr_160px_120px_100px_100px] gap-2 items-center px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setDetailPayout(payout)}>
                  <div onClick={e => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.has(payout.id)} onCheckedChange={() => toggleSelect(payout.id)} />
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-9 rounded-xl shrink-0">
                      <AvatarImage src={payout.instructor.avatar || undefined} />
                      <AvatarFallback className="text-[10px] bg-primary/10 rounded-xl">{getInitials(payout.instructor.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium truncate">{payout.instructor.name}</p>
                      <p className="text-[12px] text-muted-foreground truncate">{payout.instructor.email}</p>
                      {payout.instructor.commissionOverride && (
                        <Badge variant="secondary" className="text-[9px] rounded-md px-1.5 py-0 h-4 mt-0.5 bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400">{payout.instructor.commissionOverride.commissionRate}% rate</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn('flex size-6 items-center justify-center rounded-lg', METHOD_COLORS[payout.method] || 'bg-slate-400')}><span className="text-white">{getMethodIcon(payout.method)}</span></div>
                    <span className="text-[13px] text-muted-foreground">{getMethodLabel(payout.method, payout.payoutMethod)}</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold">{formatUSDFull(payout.amount)}</p>
                    <p className="text-[11px] text-muted-foreground">Tax: {formatUSDFull(payout.taxWithheld)}</p>
                  </div>
                  <div className="text-[13px] text-muted-foreground">{formatShortDate(payout.requestedAt)}</div>
                  <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="size-8 p-0 rounded-lg"><MoreHorizontal className="size-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => { setSelectedPayout(payout); setShowConfirmPay(true) }}><Send className="size-3.5 mr-2" /> Pay Now</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setNotePayoutId(payout.id) }}><StickyNote className="size-3.5 mr-2" /> Add Note</DropdownMenuItem>
                        <DropdownMenuItem onClick={async () => {
                          try { const r = await fetch('/api/admin/finance/payouts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payoutId: payout.id, action: 'cancel' }) }); if (!r.ok) throw new Error(); toast.success('Payout cancelled'); fetchPending(pagination.page); onRefresh(); } catch { toast.error('Failed to cancel'); }
                        }}><X className="size-3.5 mr-2" /> Cancel</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDetailPayout(payout)}><Eye className="size-3.5 mr-2" /> View Details</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </Card>

      {/* Bottom Actions */}
      {!loading && payouts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, ...springTransition }} className="flex flex-col sm:flex-row gap-3">
          <Button className="rounded-2xl h-11 gap-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white border-0 ios-shadow-sm flex-1 sm:flex-none px-8" disabled={payingId === 'batch'} onClick={() => { setSelectedIds(new Set(payouts.map(p => p.id))) }}>
            <Zap className="size-4" /> Select All & Pay — {formatUSDFull(totalPendingAmount)}
          </Button>
          <Button variant="outline" className="rounded-2xl h-11 gap-2 border-2" onClick={async () => {
            try { const r = await fetch('/api/admin/finance/payouts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'schedule_batch', scheduleDate: new Date(Date.now() + 86400000).toISOString() }) }); if (!r.ok) throw new Error(); const d = await r.json(); toast.success(`Batch scheduled for ${d.payoutCount} payouts`); } catch { toast.error('Failed to schedule'); }
          }}>
            <Timer className="size-4" /> Schedule batch payout
          </Button>
        </motion.div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted-foreground">Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</p>
          <div className="flex gap-1">
            {Array.from({ length: pagination.totalPages }).map((_, i) => (
              <Button key={i} variant={pagination.page === i + 1 ? 'default' : 'outline'} size="sm" className="rounded-xl h-8 w-8 p-0" onClick={() => fetchPending(i + 1)}>{i + 1}</Button>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Pay Dialog */}
      <Dialog open={showConfirmPay} onOpenChange={setShowConfirmPay}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">Confirm Payout</DialogTitle>
            <DialogDescription className="text-[14px] text-muted-foreground">You are about to process a payout to {selectedPayout?.instructor.name}.</DialogDescription>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50"><span className="text-[13px] text-muted-foreground">Amount</span><span className="text-[15px] font-bold">{formatUSDFull(selectedPayout.amount)}</span></div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50"><span className="text-[13px] text-muted-foreground">Method</span><span className="text-[14px] font-medium">{getMethodLabel(selectedPayout.method, selectedPayout.payoutMethod)}</span></div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50"><span className="text-[13px] text-muted-foreground">Tax Withheld</span><span className="text-[14px] font-medium text-orange-600">{formatUSDFull(selectedPayout.taxWithheld)}</span></div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowConfirmPay(false)}>Cancel</Button>
            <Button className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white border-0" disabled={payingId === selectedPayout?.id} onClick={() => selectedPayout && handlePayNow(selectedPayout.id)}>
              {payingId === selectedPayout?.id ? <Loader2 className="size-4 animate-spin mr-2" /> : <Send className="size-4 mr-2" />} Confirm & Pay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PayoutDetailSheet payout={detailPayout} open={!!detailPayout} onClose={() => setDetailPayout(null)} />
      <AddNoteDialog open={!!notePayoutId} onClose={() => setNotePayoutId(null)} payoutId={notePayoutId} onSuccess={() => fetchPending(pagination.page)} />
    </div>
  )
}

// ─── Processed Tab ──────────────────────────────────────────────────────────

function ProcessedTab({ onRefresh }: { onRefresh: () => void }) {
  const [payouts, setPayouts] = useState<PayoutItem[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [detailPayout, setDetailPayout] = useState<PayoutItem | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncedSearch = useRef('')

  const fetchProcessed = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: 'processed', page: String(page), limit: '20' })
      if (debouncedSearch.current) params.set('search', debouncedSearch.current)
      if (methodFilter !== 'all') params.set('method', methodFilter)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      const res = await fetch(`/api/admin/finance/payouts?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPayouts(data.payouts || [])
      setPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 0 })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [methodFilter, dateFrom, dateTo])

  useEffect(() => { fetchProcessed(1) }, [fetchProcessed])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { debouncedSearch.current = search; fetchProcessed(1) }, 300)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [search, fetchProcessed])

  const handleExportCSV = useCallback(() => {
    window.open('/api/admin/finance/export?format=csv&type=payouts_processed', '_blank')
    toast.success('Export started')
  }, [])

  const totalProcessed = payouts.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-5">
      {/* Stats + Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="grid grid-cols-3 gap-3 flex-1">
          {[
            { label: 'Processed', value: String(pagination.total), color: 'text-emerald-600' },
            { label: 'Total Paid', value: formatUSD(totalProcessed), color: '' },
            { label: 'Tax Withheld', value: formatUSD(payouts.reduce((s, p) => s + p.taxWithheld, 0)), color: 'text-orange-600' },
          ].map(s => (
            <Card key={s.label} className="rounded-xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-3 text-center"><p className={cn('text-[18px] font-bold', s.color)}>{s.value}</p><p className="text-[11px] text-muted-foreground">{s.label}</p></CardContent></Card>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-9" onClick={handleExportCSV}><FileDown className="size-3.5" /> CSV</Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search by name or reference..." value={search} onChange={e => setSearch(e.target.value)} className="rounded-xl pl-9 h-9" />
        </div>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="rounded-xl h-9 w-[150px]"><SelectValue placeholder="All Methods" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="jazzcash">JazzCash</SelectItem>
            <SelectItem value="easypaisa">Easypaisa</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="rounded-xl h-9 w-[140px]" />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="rounded-xl h-9 w-[140px]" />
      </div>

      {/* Processed Table */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-[1fr_150px_100px_100px_100px_120px] gap-2 items-center px-5 py-3 bg-muted/40 border-b text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          <div>Instructor</div><div>Method</div><div>Amount</div><div>Requested</div><div>Completed</div><div className="text-right">Reference</div>
        </div>
        <div className="divide-y divide-border/40">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (<div key={i} className="flex items-center gap-3 px-5 py-4"><Skeleton className="size-9 rounded-xl" /><Skeleton className="h-4 w-32 rounded-lg" /><Skeleton className="h-4 w-24 rounded-lg" /><Skeleton className="h-4 w-16 rounded-lg" /><Skeleton className="h-4 w-16 rounded-lg" /><Skeleton className="h-4 w-20 rounded-lg" /></div>))
          ) : payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3"><CheckCircle className="size-10 text-muted-foreground/30" /><p className="text-[15px] font-medium">No processed payouts</p><p className="text-[13px] text-muted-foreground">Completed payouts will appear here</p></div>
          ) : (
            <AnimatePresence mode="popLayout">
              {payouts.map((payout, i) => (
                <motion.div key={payout.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ delay: i * 0.02, ...springTransition }}
                  className="grid grid-cols-1 lg:grid-cols-[1fr_150px_100px_100px_100px_120px] gap-2 items-center px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setDetailPayout(payout)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-9 rounded-xl shrink-0"><AvatarImage src={payout.instructor.avatar || undefined} /><AvatarFallback className="text-[10px] bg-primary/10 rounded-xl">{getInitials(payout.instructor.name)}</AvatarFallback></Avatar>
                    <div className="min-w-0"><p className="text-[14px] font-medium truncate">{payout.instructor.name}</p><p className="text-[12px] text-muted-foreground truncate">{payout.instructor.email}</p></div>
                  </div>
                  <div className="flex items-center gap-2"><div className={cn('flex size-6 items-center justify-center rounded-lg', METHOD_COLORS[payout.method] || 'bg-slate-400')}><span className="text-white">{getMethodIcon(payout.method)}</span></div><span className="text-[13px] text-muted-foreground">{getMethodLabel(payout.method, payout.payoutMethod)}</span></div>
                  <div><p className="text-[14px] font-semibold text-emerald-600">{formatUSDFull(payout.amount)}</p><p className="text-[11px] text-muted-foreground">Gross: {formatUSD(payout.grossEarning)}</p></div>
                  <div className="text-[13px] text-muted-foreground">{formatShortDate(payout.requestedAt)}</div>
                  <div className="text-[13px] text-muted-foreground">{formatDate(payout.completedAt)}</div>
                  <div className="flex justify-end">
                    {payout.reference ? (
                      <Tooltip><TooltipTrigger asChild><Badge variant="secondary" className="text-[10px] rounded-md px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400 cursor-pointer gap-1"><Copy className="size-2.5" />{payout.reference.length > 10 ? `${payout.reference.slice(0, 10)}…` : payout.reference}</Badge></TooltipTrigger><TooltipContent className="rounded-xl"><p className="text-[12px]">{payout.reference}</p></TooltipContent></Tooltip>
                    ) : <span className="text-[12px] text-muted-foreground">—</span>}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted-foreground">Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</p>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(pagination.totalPages, 7) }).map((_, i) => (
              <Button key={i} variant={pagination.page === i + 1 ? 'default' : 'outline'} size="sm" className="rounded-xl h-8 w-8 p-0" onClick={() => fetchProcessed(i + 1)}>{i + 1}</Button>
            ))}
          </div>
        </div>
      )}

      <PayoutDetailSheet payout={detailPayout} open={!!detailPayout} onClose={() => setDetailPayout(null)} />
    </div>
  )
}

// ─── Failed Tab ─────────────────────────────────────────────────────────────

function FailedTab({ onRefresh }: { onRefresh: () => void }) {
  const [payouts, setPayouts] = useState<PayoutItem[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [detailPayout, setDetailPayout] = useState<PayoutItem | null>(null)
  const [notePayoutId, setNotePayoutId] = useState<string | null>(null)

  const fetchFailed = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: 'failed', page: String(page), limit: '20' })
      const res = await fetch(`/api/admin/finance/payouts?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPayouts(data.payouts || [])
      setPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 0 })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFailed(1) }, [fetchFailed])

  const handleAction = useCallback(async (payoutId: string, action: string) => {
    setActionLoading(payoutId + action)
    try {
      const res = await fetch('/api/admin/finance/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, action }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(action === 'retry' ? 'Payout queued for retry' : 'Payout cancelled')
      await fetchFailed(pagination.page)
      onRefresh()
    } catch {
      toast.error('Action failed')
    } finally {
      setActionLoading(null)
    }
  }, [fetchFailed, pagination.page, onRefresh])

  const totalFailedAmount = payouts.reduce((s, p) => s + p.amount, 0)
  const allPayoutsCount = pagination.total
  const failureRate = allPayoutsCount > 0 ? ((allPayoutsCount / (allPayoutsCount + 1)) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Failed', value: String(pagination.total), gradient: 'from-red-400 to-rose-500', color: 'text-red-600' },
          { label: 'Amount at Risk', value: formatUSD(totalFailedAmount), gradient: 'from-orange-400 to-amber-500', color: 'text-orange-600' },
          { label: 'Failure Rate', value: `${failureRate}%`, gradient: 'from-rose-400 to-pink-500', color: 'text-rose-600' },
          { label: 'Tax Withheld', value: formatUSD(payouts.reduce((s, p) => s + p.taxWithheld, 0)), gradient: 'from-amber-400 to-yellow-500', color: 'text-amber-600' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, ...springTransition }}>
            <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
              <div className={cn('h-1 bg-gradient-to-r', stat.gradient)} />
              <CardContent className="p-4 text-center">
                <p className={cn('text-[22px] font-bold', stat.color)}>{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Failed Table */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-[1fr_150px_100px_100px_120px] gap-2 items-center px-5 py-3 bg-muted/40 border-b text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          <div>Instructor</div><div>Method</div><div>Amount</div><div>Requested</div><div className="text-right">Actions</div>
        </div>
        <div className="divide-y divide-border/40">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (<div key={i} className="flex items-center gap-3 px-5 py-4"><Skeleton className="size-9 rounded-xl" /><Skeleton className="h-4 w-32 rounded-lg" /><Skeleton className="h-4 w-24 rounded-lg" /><Skeleton className="h-4 w-16 rounded-lg" /><Skeleton className="h-8 w-28 rounded-xl" /></div>))
          ) : payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3"><CheckCircle className="size-10 text-muted-foreground/30" /><p className="text-[15px] font-medium">No failed payouts</p><p className="text-[13px] text-muted-foreground">All payouts are processing smoothly</p></div>
          ) : (
            <AnimatePresence mode="popLayout">
              {payouts.map((payout, i) => (
                <motion.div key={payout.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ delay: i * 0.02, ...springTransition }}
                  className="grid grid-cols-1 lg:grid-cols-[1fr_150px_100px_100px_120px] gap-2 items-center px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => setDetailPayout(payout)}>
                    <Avatar className="size-9 rounded-xl shrink-0"><AvatarImage src={payout.instructor.avatar || undefined} /><AvatarFallback className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 rounded-xl">{getInitials(payout.instructor.name)}</AvatarFallback></Avatar>
                    <div className="min-w-0"><p className="text-[14px] font-medium truncate">{payout.instructor.name}</p><p className="text-[12px] text-muted-foreground truncate">{payout.instructor.email}</p></div>
                  </div>
                  <div className="flex items-center gap-2"><div className={cn('flex size-6 items-center justify-center rounded-lg', METHOD_COLORS[payout.method] || 'bg-slate-400')}><span className="text-white">{getMethodIcon(payout.method)}</span></div><span className="text-[13px] text-muted-foreground">{getMethodLabel(payout.method, payout.payoutMethod)}</span></div>
                  <div><p className="text-[14px] font-semibold text-red-600">{formatUSDFull(payout.amount)}</p></div>
                  <div className="text-[13px] text-muted-foreground">{formatShortDate(payout.requestedAt)}</div>
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="outline" className="rounded-xl h-8 gap-1 text-[12px]" disabled={actionLoading === payout.id + 'retry'} onClick={() => handleAction(payout.id, 'retry')}>
                      {actionLoading === payout.id + 'retry' ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3" />} Retry
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="size-8 p-0 rounded-lg"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => setNotePayoutId(payout.id)}><StickyNote className="size-3.5 mr-2" /> Add Note</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleAction(payout.id, 'cancel')}><X className="size-3.5 mr-2" /> Cancel</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDetailPayout(payout)}><Eye className="size-3.5 mr-2" /> View Details</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </Card>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted-foreground">Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0" disabled={pagination.page <= 1} onClick={() => fetchFailed(pagination.page - 1)}><ChevronLeft className="size-4" /></Button>
            <Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchFailed(pagination.page + 1)}><ChevronRight className="size-4" /></Button>
          </div>
        </div>
      )}

      <PayoutDetailSheet payout={detailPayout} open={!!detailPayout} onClose={() => setDetailPayout(null)} />
      <AddNoteDialog open={!!notePayoutId} onClose={() => setNotePayoutId(null)} payoutId={notePayoutId} onSuccess={() => fetchFailed(pagination.page)} />
    </div>
  )
}

// ─── Disputed Tab ───────────────────────────────────────────────────────────

function DisputedTab({ counts, onRefresh }: { counts: { pending: number; processed: number; disputed: number; failed: number }; onRefresh: () => void }) {
  const [payouts, setPayouts] = useState<PayoutItem[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showResolveDialog, setShowResolveDialog] = useState(false)
  const [showAdjustDialog, setShowAdjustDialog] = useState(false)
  const [selectedDispute, setSelectedDispute] = useState<PayoutItem | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')
  const [adjustmentAmount, setAdjustmentAmount] = useState('')
  const [detailPayout, setDetailPayout] = useState<PayoutItem | null>(null)
  const [notePayoutId, setNotePayoutId] = useState<string | null>(null)

  const fetchDisputed = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: 'disputed', page: String(page), limit: '20' })
      const res = await fetch(`/api/admin/finance/payouts?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPayouts(data.payouts || [])
      setPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 0 })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDisputed(1) }, [fetchDisputed])

  const handleAction = useCallback(async (payoutId: string, action: string, extra?: Record<string, unknown>) => {
    setActionLoading(payoutId + action)
    try {
      const res = await fetch('/api/admin/finance/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, action, ...extra }),
      })
      if (!res.ok) throw new Error('Failed to process action')
      toast.success(`Dispute ${action === 'resolve_dispute' ? 'resolved' : action === 'escalate_dispute' ? 'escalated' : 'updated'}`)
      await fetchDisputed(pagination.page)
      onRefresh()
    } catch {
      toast.error('Action failed')
    } finally {
      setActionLoading(null)
      setShowResolveDialog(false)
      setShowAdjustDialog(false)
      setSelectedDispute(null)
      setResolutionNote('')
      setAdjustmentAmount('')
    }
  }, [fetchDisputed, pagination.page, onRefresh])

  const getPriority = (disputedAt: string | null) => {
    if (!disputedAt) return { label: 'Low', color: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' }
    const daysSince = (Date.now() - new Date(disputedAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince > 7) return { label: 'High', color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' }
    if (daysSince > 3) return { label: 'Medium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' }
    return { label: 'Low', color: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' }
  }

  const RESOLUTION_TEMPLATES = [
    'Payment verified and released to instructor.',
    'Adjustment issued — discrepancy in course revenue calculation.',
    'Dispute resolved in favor of instructor — full amount released.',
    'Partial adjustment applied — tax withholding corrected.',
    'Dispute escalated to senior admin for review.',
  ]

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Open Disputes', value: String(counts.disputed), color: 'text-orange-600' },
          { label: 'Disputed Amount', value: formatUSD(payouts.reduce((s, p) => s + p.amount, 0)), color: '' },
          { label: 'Tax in Dispute', value: formatUSD(payouts.reduce((s, p) => s + p.taxWithheld, 0)), color: 'text-red-600' },
        ].map(s => (
          <Card key={s.label} className="rounded-xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-3 text-center"><p className={cn('text-[18px] font-bold', s.color)}>{s.value}</p><p className="text-[11px] text-muted-foreground">{s.label}</p></CardContent></Card>
        ))}
      </div>

      {/* Disputed Cards */}
      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => (<Card key={i} className="rounded-2xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-5 space-y-4"><Skeleton className="h-5 w-40 rounded-lg" /><Skeleton className="h-4 w-full rounded-lg" /><Skeleton className="h-4 w-3/4 rounded-lg" /></CardContent></Card>))}</div>
      ) : payouts.length === 0 ? (
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-8 flex flex-col items-center justify-center gap-3"><Scale className="size-10 text-muted-foreground/30" /><p className="text-[15px] font-medium">No disputed payouts</p><p className="text-[13px] text-muted-foreground">Disputes from instructors will appear here</p></CardContent></Card>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            {payouts.map((payout, i) => {
              const platformCut = Math.round(payout.grossEarning * (1 - (payout.instructor.commissionOverride?.commissionRate ?? 80) / 100))
              const instructorRate = payout.instructor.commissionOverride?.commissionRate ?? 80
              const netBeforeTax = payout.grossEarning - platformCut
              const taxAmount = Math.round(netBeforeTax * 0.1)
              const priority = getPriority(payout.disputedAt)
              const isLoading = actionLoading === payout.id + 'resolve' || actionLoading === payout.id + 'adjustment' || actionLoading === payout.id + 'escalate'

              return (
                <motion.div key={payout.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ delay: i * 0.05, ...springTransition }}>
                  <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-orange-400 to-red-500" />
                    <CardContent className="p-5 space-y-4">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 rounded-xl shrink-0"><AvatarImage src={payout.instructor.avatar || undefined} /><AvatarFallback className="text-[11px] bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 rounded-xl">{getInitials(payout.instructor.name)}</AvatarFallback></Avatar>
                          <div>
                            <p className="text-[15px] font-semibold">{payout.instructor.name}</p>
                            <p className="text-[12px] text-muted-foreground">{payout.instructor.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn('text-[10px] rounded-md px-2 py-0.5', priority.color)}><Flag className="size-2.5 mr-1" />{priority.label} Priority</Badge>
                          <Badge variant="secondary" className="text-[11px] rounded-lg px-2.5 py-1 self-start bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                            <AlertTriangle className="size-3 mr-1" />Disputed — {formatUSDFull(payout.amount)}
                          </Badge>
                        </div>
                      </div>

                      <Separator className="opacity-40" />

                      {/* Dispute Timeline */}
                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5"><Clock className="size-3" /><span>Requested: {formatShortDate(payout.requestedAt)}</span></div>
                        {payout.disputedAt && <div className="flex items-center gap-1.5"><AlertTriangle className="size-3 text-orange-500" /><span>Disputed: {formatShortDate(payout.disputedAt)}</span></div>}
                        <div className="flex items-center gap-1.5"><Timer className="size-3" /><span>{payout.disputedAt ? `${Math.floor((Date.now() - new Date(payout.disputedAt).getTime()) / (1000 * 60 * 60 * 24))}d open` : 'N/A'}</span></div>
                      </div>

                      {/* Instructor's Claim */}
                      <div className="rounded-xl bg-orange-50 dark:bg-orange-950/20 p-4 border border-orange-200/50 dark:border-orange-900/30">
                        <div className="flex items-center gap-2 mb-2"><MessageSquare className="size-4 text-orange-600 dark:text-orange-400" /><span className="text-[13px] font-semibold text-orange-700 dark:text-orange-400">Instructor&apos;s Claim</span></div>
                        <p className="text-[13px] text-orange-800 dark:text-orange-300 leading-relaxed">{payout.disputeReason || 'No reason provided'}</p>
                      </div>

                      {/* System Calculation */}
                      <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                        <div className="flex items-center gap-2 mb-2"><BarChart3 className="size-4 text-muted-foreground" /><span className="text-[13px] font-semibold">System Calculation</span></div>
                        <div className="space-y-1.5 font-mono text-[12px]">
                          <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span className="font-medium">{formatUSDFull(payout.grossEarning)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Platform cut {100 - instructorRate}%</span><span className="font-medium text-rose-600">= {formatUSDFull(platformCut)}</span></div>
                          <Separator className="my-1 opacity-30" />
                          <div className="flex justify-between"><span className="text-muted-foreground">Instructor share</span><span className="font-medium">{formatUSDFull(netBeforeTax)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Withholding tax</span><span className="font-medium text-orange-600">- {formatUSDFull(taxAmount)}</span></div>
                          <Separator className="my-1 opacity-30" />
                          <div className="flex justify-between font-bold"><span>Net payout</span><span className="text-emerald-600">{formatUSDFull(netBeforeTax - taxAmount)}</span></div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button size="sm" className="rounded-xl h-9 gap-1.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white border-0" disabled={isLoading} onClick={() => { setSelectedDispute(payout); setShowResolveDialog(true) }}>
                          <Gavel className="size-3.5" /> Resolve
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl h-9 gap-1.5" disabled={isLoading} onClick={() => { setSelectedDispute(payout); setShowAdjustDialog(true) }}>
                          <CircleDollarSign className="size-3.5" /> Adjust
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl h-9 gap-1.5 text-orange-600" disabled={isLoading} onClick={() => handleAction(payout.id, 'escalate_dispute')}>
                          <AlertTriangle className="size-3.5" /> Escalate
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl h-9 gap-1.5" onClick={() => setNotePayoutId(payout.id)}>
                          <StickyNote className="size-3.5" /> Note
                        </Button>
                        <Button size="sm" variant="ghost" className="rounded-xl h-9 gap-1.5" onClick={() => setDetailPayout(payout)}>
                          <Eye className="size-3.5" /> Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted-foreground">Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0" disabled={pagination.page <= 1} onClick={() => fetchDisputed(pagination.page - 1)}><ChevronLeft className="size-4" /></Button>
            <Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchDisputed(pagination.page + 1)}><ChevronRight className="size-4" /></Button>
          </div>
        </div>
      )}

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">Resolve Dispute</DialogTitle><DialogDescription>Resolve the dispute for {selectedDispute?.instructor.name}&apos;s payout of {selectedDispute ? formatUSDFull(selectedDispute.amount) : ''}.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <Textarea value={resolutionNote} onChange={e => setResolutionNote(e.target.value)} placeholder="Resolution note..." className="rounded-xl min-h-[80px]" />
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-2">Quick Templates:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {RESOLUTION_TEMPLATES.map((tmpl, i) => (
                  <button key={i} className="w-full text-left text-[12px] p-2 rounded-lg hover:bg-muted/50 transition-colors" onClick={() => setResolutionNote(tmpl)}>{tmpl}</button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowResolveDialog(false)}>Cancel</Button>
            <Button className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white border-0" disabled={!resolutionNote.trim()} onClick={() => selectedDispute && handleAction(selectedDispute.id, 'resolve_dispute', { resolutionNote })}>
              <Gavel className="size-4 mr-2" /> Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjustment Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">Issue Adjustment</DialogTitle><DialogDescription>Adjust the payout amount for {selectedDispute?.instructor.name}.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[13px]">Adjustment Amount (USD)</Label>
              <Input type="number" value={adjustmentAmount} onChange={e => setAdjustmentAmount(e.target.value)} placeholder="e.g. 5000" className="rounded-xl mt-1" />
              <p className="text-[11px] text-muted-foreground mt-1">Positive = add to payout, Negative = subtract</p>
            </div>
            <Textarea value={resolutionNote} onChange={e => setResolutionNote(e.target.value)} placeholder="Reason for adjustment..." className="rounded-xl min-h-[60px]" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowAdjustDialog(false)}>Cancel</Button>
            <Button className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white border-0" disabled={!adjustmentAmount} onClick={() => selectedDispute && handleAction(selectedDispute.id, 'issue_adjustment', { resolutionNote, adjustmentAmount: Number(adjustmentAmount) })}>
              <CircleDollarSign className="size-4 mr-2" /> Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PayoutDetailSheet payout={detailPayout} open={!!detailPayout} onClose={() => setDetailPayout(null)} />
      <AddNoteDialog open={!!notePayoutId} onClose={() => setNotePayoutId(null)} payoutId={notePayoutId} onSuccess={() => fetchDisputed(pagination.page)} />
    </div>
  )
}

// ─── Settings Tab ───────────────────────────────────────────────────────────

function SettingsTab() {
  const [settings, setSettings] = useState<PayoutSettings | null>(null)
  const [overrides, setOverrides] = useState<Array<{ instructorId: string; instructor: { id: string; name: string; email: string; avatar: string | null }; commissionRate: number; reason: string | null }>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddOverride, setShowAddOverride] = useState(false)
  const [newOverrideInstructor, setNewOverrideInstructor] = useState('')
  const [newOverrideRate, setNewOverrideRate] = useState('')
  const [newOverrideReason, setNewOverrideReason] = useState('')
  const [instructors, setInstructors] = useState<Array<{ id: string; name: string; email: string; avatar: string | null }>>([])
  const [autoPayoutEnabled, setAutoPayoutEnabled] = useState(false)
  const [autoPayoutSchedule, setAutoPayoutSchedule] = useState('monthly')
  const [autoPayoutMinAmount, setAutoPayoutMinAmount] = useState('1000')

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/finance/payouts/settings')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setSettings(data.settings)
      setOverrides(data.commissionOverrides || [])
      setInstructors(data.instructors || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSaveSettings = useCallback(async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/finance/payouts/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Settings saved successfully')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }, [settings])

  const handleAddOverride = useCallback(async () => {
    if (!newOverrideInstructor || !newOverrideRate) return
    try {
      const res = await fetch('/api/admin/finance/payouts/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionOverride: { instructorId: newOverrideInstructor, commissionRate: Number(newOverrideRate), reason: newOverrideReason } }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Commission override added')
      setShowAddOverride(false)
      setNewOverrideInstructor('')
      setNewOverrideRate('')
      setNewOverrideReason('')
      fetchSettings()
    } catch {
      toast.error('Failed to add override')
    }
  }, [newOverrideInstructor, newOverrideRate, newOverrideReason, fetchSettings])

  const handleRemoveOverride = useCallback(async (instructorId: string) => {
    try {
      const res = await fetch('/api/admin/finance/payouts/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeOverride: true, instructorId }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Override removed')
      fetchSettings()
    } catch {
      toast.error('Failed to remove override')
    }
  }, [fetchSettings])

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => (<Card key={i} className="rounded-2xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-6 space-y-3"><Skeleton className="h-5 w-40 rounded-lg" /><Skeleton className="h-4 w-full rounded-lg" /><Skeleton className="h-4 w-3/4 rounded-lg" /></CardContent></Card>))}</div>
  }

  return (
    <div className="space-y-5">
      {/* Revenue Split */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-pink-400 to-rose-500" />
        <CardHeader className="pb-3 pt-4 px-5"><CardTitle className="text-[16px] font-semibold">Revenue Split & Rates</CardTitle></CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          {/* Visual Split Bar */}
          <div className="h-8 rounded-xl overflow-hidden flex">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center" style={{ width: `${settings?.platformCommissionRate ?? 20}%` }}>
              <span className="text-white text-[11px] font-bold">Platform {settings?.platformCommissionRate ?? 20}%</span>
            </div>
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center flex-1">
              <span className="text-white text-[11px] font-bold">Instructor {settings?.instructorPayoutRate ?? 80}%</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><Label className="text-[13px]">Platform Commission %</Label><Input type="number" value={settings?.platformCommissionRate ?? 20} onChange={e => setSettings(s => s ? { ...s, platformCommissionRate: Number(e.target.value) } : s)} className="rounded-xl mt-1" /></div>
            <div><Label className="text-[13px]">Instructor Payout %</Label><Input type="number" value={settings?.instructorPayoutRate ?? 80} onChange={e => setSettings(s => s ? { ...s, instructorPayoutRate: Number(e.target.value) } : s)} className="rounded-xl mt-1" /></div>
            <div><Label className="text-[13px]">Withholding Tax %</Label><Input type="number" value={settings?.withholdingTaxRate ?? 10} onChange={e => setSettings(s => s ? { ...s, withholdingTaxRate: Number(e.target.value) } : s)} className="rounded-xl mt-1" /></div>
          </div>
        </CardContent>
      </Card>

      {/* Supported Methods */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-400 to-purple-500" />
        <CardHeader className="pb-3 pt-4 px-5"><CardTitle className="text-[16px] font-semibold">Supported Payout Methods</CardTitle></CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {['bank_transfer', 'jazzcash', 'easypaisa', 'payoneer', 'stripe'].map(method => {
              const methods = settings?.supportedPayoutMethods ? settings.supportedPayoutMethods.split(',') : []
              const isEnabled = methods.includes(method)
              return (
                <div key={method} className={cn('flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors cursor-pointer', isEnabled ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20' : 'border-border/50 bg-muted/30 opacity-50')}
                  onClick={() => {
                    const current = settings?.supportedPayoutMethods ? settings.supportedPayoutMethods.split(',') : []
                    const next = isEnabled ? current.filter(m => m !== method) : [...current, method]
                    setSettings(s => s ? { ...s, supportedPayoutMethods: next.join(',') } : s)
                  }}>
                  <div className={cn('flex size-8 items-center justify-center rounded-lg', isEnabled ? METHOD_COLORS[method] : 'bg-slate-300')}><span className="text-white">{getMethodIcon(method)}</span></div>
                  <span className="text-[11px] font-medium">{METHOD_LABELS[method]}</span>
                  {isEnabled && <CheckCircle className="size-4 text-emerald-500" />}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payout Policy */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
        <CardHeader className="pb-3 pt-4 px-5"><CardTitle className="text-[16px] font-semibold">Payout Policy</CardTitle></CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label className="text-[13px]">Minimum Payout Amount (USD)</Label><Input type="number" value={settings?.minimumPayoutAmount ?? 1000} onChange={e => setSettings(s => s ? { ...s, minimumPayoutAmount: Number(e.target.value) } : s)} className="rounded-xl mt-1" /></div>
            <div><Label className="text-[13px]">Payout Hold Period (Days)</Label><Input type="number" value={settings?.payoutHoldPeriodDays ?? 7} onChange={e => setSettings(s => s ? { ...s, payoutHoldPeriodDays: Number(e.target.value) } : s)} className="rounded-xl mt-1" /></div>
            <div><Label className="text-[13px]">Default Payout Schedule</Label>
              <Select value={settings?.defaultPayoutSchedule ?? 'monthly'} onValueChange={v => setSettings(s => s ? { ...s, defaultPayoutSchedule: v } : s)}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="biweekly">Bi-Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="text-[13px]">Dispute Resolution Days</Label><Input type="number" value={settings?.disputeResolutionDays ?? 14} onChange={e => setSettings(s => s ? { ...s, disputeResolutionDays: Number(e.target.value) } : s)} className="rounded-xl mt-1" /></div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Payout Rules */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-teal-400 to-cyan-500" />
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[16px] font-semibold">Auto-Payout Rules</CardTitle>
            <Switch checked={autoPayoutEnabled} onCheckedChange={setAutoPayoutEnabled} />
          </div>
        </CardHeader>
        {autoPayoutEnabled && (
          <CardContent className="px-5 pb-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label className="text-[13px]">Auto-Payout Schedule</Label>
                <Select value={autoPayoutSchedule} onValueChange={setAutoPayoutSchedule}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="weekly">Weekly (Every Monday)</SelectItem><SelectItem value="biweekly">Bi-Weekly</SelectItem><SelectItem value="monthly">Monthly (1st of month)</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label className="text-[13px]">Minimum Amount for Auto-Payout (USD)</Label><Input type="number" value={autoPayoutMinAmount} onChange={e => setAutoPayoutMinAmount(e.target.value)} className="rounded-xl mt-1" /></div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-900/30">
              <Info className="size-4 text-teal-600 shrink-0" />
              <p className="text-[12px] text-teal-700 dark:text-teal-400">Auto-payout will process all eligible pending payouts that meet the minimum amount threshold on the configured schedule.</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tax Compliance (FBR) */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-400 to-green-500" />
        <CardHeader className="pb-3 pt-4 px-5"><CardTitle className="text-[16px] font-semibold">Tax Compliance (FBR)</CardTitle></CardHeader>
        <CardContent className="px-5 pb-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <Building2 className="size-5 text-muted-foreground" />
              <div><p className="text-[13px] font-medium">FBR Withholding Tax</p><p className="text-[11px] text-muted-foreground">Section 153 — Services</p></div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <Percent className="size-5 text-muted-foreground" />
              <div><p className="text-[13px] font-medium">Current Rate: {settings?.withholdingTaxRate ?? 10}%</p><p className="text-[11px] text-muted-foreground">Applied at source on instructor payouts</p></div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30">
            <CheckCircle className="size-4 text-emerald-600 shrink-0" />
            <p className="text-[12px] text-emerald-700 dark:text-emerald-400">Tax withholding is active and compliant with FBR regulations. All instructor payouts are taxed at source.</p>
          </div>
        </CardContent>
      </Card>

      {/* Commission Overrides */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-orange-400 to-amber-500" />
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[16px] font-semibold">Commission Overrides</CardTitle>
            <Button size="sm" className="rounded-xl h-8 gap-1.5" onClick={() => setShowAddOverride(true)}><Plus className="size-3.5" /> Add Override</Button>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {overrides.length === 0 ? (
            <p className="text-[13px] text-muted-foreground text-center py-6">No commission overrides configured</p>
          ) : (
            <div className="space-y-2">
              {overrides.map(ov => (
                <div key={ov.instructorId} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <Avatar className="size-8 rounded-lg"><AvatarImage src={ov.instructor.avatar || undefined} /><AvatarFallback className="text-[9px] rounded-lg">{getInitials(ov.instructor.name)}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{ov.instructor.name}</p>
                    {ov.reason && <p className="text-[11px] text-muted-foreground truncate">{ov.reason}</p>}
                  </div>
                  <Badge variant="secondary" className="text-[11px] rounded-md px-2 bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">{ov.commissionRate}% rate</Badge>
                  <Button variant="ghost" size="sm" className="size-7 p-0 text-red-500 hover:text-red-700" onClick={() => handleRemoveOverride(ov.instructorId)}><Trash2 className="size-3.5" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="rounded-2xl h-11 gap-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white border-0 ios-shadow-sm px-8" disabled={saving} onClick={handleSaveSettings}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Save Settings
        </Button>
      </div>

      {/* Add Override Dialog */}
      <Dialog open={showAddOverride} onOpenChange={setShowAddOverride}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">Add Commission Override</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-[13px]">Instructor</Label>
              <Select value={newOverrideInstructor} onValueChange={setNewOverrideInstructor}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Select instructor" /></SelectTrigger>
                <SelectContent>{instructors.map(inst => (<SelectItem key={inst.id} value={inst.id}>{inst.name} ({inst.email})</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-[13px]">Commission Rate %</Label><Input type="number" value={newOverrideRate} onChange={e => setNewOverrideRate(e.target.value)} placeholder="e.g. 85" className="rounded-xl mt-1" /></div>
            <div><Label className="text-[13px]">Reason (optional)</Label><Input value={newOverrideReason} onChange={e => setNewOverrideReason(e.target.value)} placeholder="Reason for override" className="rounded-xl mt-1" /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowAddOverride(false)}>Cancel</Button>
            <Button className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white border-0" disabled={!newOverrideInstructor || !newOverrideRate} onClick={handleAddOverride}>Add Override</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Main AdminPayouts Component ────────────────────────────────────────────

export function AdminPayouts() {
  const { setCurrentView } = useAppStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [counts, setCounts] = useState({ pending: 0, processed: 0, disputed: 0, failed: 0 })
  const [loadingCounts, setLoadingCounts] = useState(true)

  const fetchCounts = useCallback(async () => {
    setLoadingCounts(true)
    try {
      const res = await fetch('/api/admin/finance/payouts?status=all&limit=1')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      const s = data.stats || {}
      setCounts({
        pending: s.pending ?? 0,
        processed: s.processed ?? 0,
        disputed: s.disputed ?? 0,
        failed: s.failed ?? 0,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingCounts(false)
    }
  }, [])

  useEffect(() => { fetchCounts() }, [fetchCounts])

  const handleExport = useCallback(() => {
    window.open('/api/admin/finance/export?format=csv&type=payouts', '_blank')
    toast.success('Export started')
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 ios-shadow-sm">
            <CreditCard className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold leading-tight">Payout Management</h1>
            <p className="text-[13px] text-muted-foreground">Manage instructor payouts, disputes & settings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-9" onClick={fetchCounts} disabled={loadingCounts}>
            <RefreshCw className={cn('size-3.5', loadingCounts && 'animate-spin')} /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-9" onClick={handleExport}>
            <FileDown className="size-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1 rounded-2xl h-auto flex-wrap">
          <TabsTrigger value="overview" className="rounded-xl text-[13px] gap-1.5 data-[state=active]:bg-background data-[state=active]:ios-shadow-sm px-4 py-2">
            <BarChart3 className="size-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-xl text-[13px] gap-1.5 data-[state=active]:bg-background data-[state=active]:ios-shadow-sm px-4 py-2">
            <Clock className="size-3.5" /> Pending
            {counts.pending > 0 && <Badge className="ml-1 bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 text-[10px] rounded-md px-1.5 py-0 h-4">{counts.pending}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="processed" className="rounded-xl text-[13px] gap-1.5 data-[state=active]:bg-background data-[state=active]:ios-shadow-sm px-4 py-2">
            <CheckCircle className="size-3.5" /> Processed
          </TabsTrigger>
          <TabsTrigger value="failed" className="rounded-xl text-[13px] gap-1.5 data-[state=active]:bg-background data-[state=active]:ios-shadow-sm px-4 py-2">
            <XCircle className="size-3.5" /> Failed
            {counts.failed > 0 && <Badge className="ml-1 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-[10px] rounded-md px-1.5 py-0 h-4">{counts.failed}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="disputed" className="rounded-xl text-[13px] gap-1.5 data-[state=active]:bg-background data-[state=active]:ios-shadow-sm px-4 py-2">
            <AlertTriangle className="size-3.5" /> Disputed
            {counts.disputed > 0 && <Badge className="ml-1 bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 text-[10px] rounded-md px-1.5 py-0 h-4">{counts.disputed}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl text-[13px] gap-1.5 data-[state=active]:bg-background data-[state=active]:ios-shadow-sm px-4 py-2">
            <Settings2 className="size-3.5" /> Settings
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="mt-5">
            <TabsContent value="overview" className="mt-0"><OverviewTab onNavigateTab={setActiveTab} /></TabsContent>
            <TabsContent value="pending" className="mt-0"><PendingTab onRefresh={fetchCounts} /></TabsContent>
            <TabsContent value="processed" className="mt-0"><ProcessedTab onRefresh={fetchCounts} /></TabsContent>
            <TabsContent value="failed" className="mt-0"><FailedTab onRefresh={fetchCounts} /></TabsContent>
            <TabsContent value="disputed" className="mt-0"><DisputedTab counts={counts} onRefresh={fetchCounts} /></TabsContent>
            <TabsContent value="settings" className="mt-0"><SettingsTab /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  )
}

// ─── Wrapped Export ─────────────────────────────────────────────────────────

export function AdminPayoutsWrapped() {
  return (
    <CurrencyProvider>
      <AdminPayouts />
    </CurrencyProvider>
  )
}
