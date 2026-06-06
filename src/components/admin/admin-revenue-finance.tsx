'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, Users,
  Search, Download, FileText, ArrowUpRight, ArrowDownRight,
  ChevronLeft, ChevronRight, RefreshCw, Loader2,
  AlertCircle, X, CheckCircle, XCircle, AlertTriangle,
  Clock, BarChart3, Receipt, Scale, FileDown, Building,
  Info, ChevronDown, Eye, Shield, Zap, Target, Activity,
  Settings, Sparkles, Trash2, Plus, Banknote, Percent,
  CalendarDays, ArrowRight, ThumbsUp, ThumbsDown, AlertOctagon,
} from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { CurrencyProvider, useCurrency } from '@/components/admin/currency-provider'
import { AdminStatCard, AdminStatCardGrid, ADMIN_COLORS } from './admin-stat-card'

// ─── Types ──────────────────────────────────────────────────────────────────

interface FinanceOverview {
  period: string
  overview: {
    grossRevenue: number; platformCut: number; instructorPayouts: number; refundsIssued: number
    totalEnrollments: number; totalRefundCount: number; refundRate: number
    revenueChange: number; refundsChange: number
  }
  revenueByCategory: Array<{ category: string; amount: number; percentage: number }>
  revenueByPaymentMethod: Array<{ method: string; label: string; amount: number; count: number; percentage: number }>
  openDisputes: number
}

interface TransactionItem {
  id: string; type: string; amount: number; currency: string; status: string
  description: string | null; paymentMethod: string; platformFee: number
  instructorEarning: number; invoiceNumber: string | null; refundReason: string | null
  refundedAt: string | null; createdAt: string
  student: { id: string; name: string; avatar: string | null; email: string } | null
  instructor: { id: string; name: string; avatar: string | null } | null
  course: { id: string; title: string; category: string; thumbnail: string | null } | null
  _count: { disputes: number }
}

interface RevenueSplitItem {
  instructorId: string | null
  instructor: { name: string; avatar: string | null; email: string } | null
  totalRevenue: number; platformCut: number; instructorEarning: number; enrollmentCount: number
  hasCustomCommission?: boolean
  courses: Array<{ courseId: string | null; courseTitle: string; category: string; revenue: number; instructorEarning: number; enrollmentCount: number }>
}

interface TaxReport {
  fiscalYear: string
  summary: { totalGrossRevenue: number; platformCommission: number; instructorEarnings: number; refundAmount: number; totalEnrollments: number; totalRefunds: number; totalPayouts: number; withholdingTaxCollected: number }
  monthlyBreakdown: Array<{ month: string; grossRevenue: number; platformCommission: number; enrollments: number; refunds: number }>
  instructorTaxSummary: Array<{ instructorId: string | null; name: string; email: string; grossEarnings: number; netEarnings: number; taxWithheld: number; enrollmentCount: number }>
  settings: { platformCommissionRate: number; instructorPayoutRate: number; withholdingTaxRate: number; taxId: string | null; fiscalYearStart: string } | null
}

interface DisputeItem {
  id: string; type: string; status: string; description: string
  resolutionNote: string | null; refundAmount: number | null; resolvedAt: string | null; createdAt: string; reportedBy: string
  transaction: { id: string; amount: number; type: string; status: string; paymentMethod: string; invoiceNumber: string | null; student: { id: string; name: string; avatar: string | null; email: string } | null; instructor: { id: string; name: string; avatar: string | null } | null; course: { id: string; title: string; category: string } | null }
}

interface RefundItem {
  id: string; amount: number; status: string; description: string | null
  paymentMethod: string; refundReason: string | null; refundedAt: string | null
  invoiceNumber: string | null; metadata: unknown; createdAt: string; updatedAt: string
  student: { id: string; name: string; avatar: string | null; email: string } | null
  instructor: { id: string; name: string; avatar: string | null; email: string } | null
  course: { id: string; title: string; category: string; thumbnail: string | null; price: number } | null
}

interface FinancialSettings {
  id: string; platformCommissionRate: number; instructorPayoutRate: number
  minimumPayoutAmount: number; refundPolicyDays: number; withholdingTaxRate: number
  autoApproveRefunds: boolean; disputeResolutionDays: number; payoutHoldPeriodDays: number
  defaultPayoutSchedule: string; taxId: string | null; currency: string
  supportedPayoutMethods: string[]; updatedAt: string
}

interface CommissionOverride {
  id: string; instructorId: string; commissionRate: number; reason: string | null
  createdBy: string; createdAt: string; updatedAt: string
  instructor: { id: string; name: string; email: string; avatar: string | null }
}

interface ForecastData {
  period: string
  forecast: { projectedRevenue: number; projectedEnrollments: number; projectedPlatformCut: number; projectedInstructorPayouts: number; growthRate: number }
  confidence: { level: string; rSquared: number; revenueRSquared: number; enrollmentRSquared: number; coefficientOfVariation: number; dataPoints: number }
  trend: { historical: Array<{ month: string; revenue: number; enrollments: number; platformCut: number; instructorPayouts: number; refunds: number }>; projected: Array<{ month: string; projectedRevenue: number; projectedEnrollments: number; projectedPlatformCut: number; projectedInstructorPayouts: number }> }
  summary: { avgMonthlyRevenue: number; avgMonthlyEnrollments: number; totalHistoricalRevenue: number; totalHistoricalEnrollments: number; regressionSlope: number; regressionIntercept: number }
  settings: { platformRate: number; instructorRate: number }
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

const CATEGORY_COLORS: Record<string, string> = {
  Technology: 'bg-blue-500', Languages: 'bg-emerald-500', Business: 'bg-amber-500', Design: 'bg-purple-500', Other: 'bg-slate-400',
  IB: 'bg-emerald-500', AP: 'bg-teal-500', Cambridge: 'bg-cyan-500', IELTS: 'bg-amber-500',
  Programming: 'bg-pink-500', Mathematics: 'bg-emerald-500', Physics: 'bg-teal-500', Chemistry: 'bg-cyan-500',
  Biology: 'bg-amber-500', English: 'bg-purple-500', 'Computer Science': 'bg-pink-500',
}

const PAYMENT_COLORS: Record<string, string> = {
  credit_debit_card: 'bg-blue-500', jazzcash: 'bg-red-500', easypaisa: 'bg-green-500', bank_transfer: 'bg-purple-500', payoneer_stripe: 'bg-orange-500',
}

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

const TX_TYPE_CONFIG: Record<string, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  enrollment: { label: 'Enrollment', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', icon: <CheckCircle className="size-3" /> },
  refund: { label: 'Refund', badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400', icon: <Receipt className="size-3" /> },
  payout: { label: 'Payout', badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400', icon: <CreditCard className="size-3" /> },
  adjustment: { label: 'Adjustment', badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400', icon: <BarChart3 className="size-3" /> },
}

const TX_STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  completed: { label: 'Paid', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  pending: { label: 'Pending', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  failed: { label: 'Failed', badgeClass: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
  refunded: { label: 'Refunded', badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' },
}



// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab() {
  const [overview, setOverview] = useState<FinanceOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [forecastMini, setForecastMini] = useState<{ projectedRevenue: number; growthRate: number; confidence: string } | null>(null)

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/finance/overview?period=${period}`)
      if (!res.ok) throw new Error('Failed')
      setOverview(await res.json())
    } catch { /* */ } finally { setLoading(false) }
  }, [period])

  const fetchForecastMini = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/finance/forecast?period=next_month')
      if (res.ok) {
        const d = await res.json()
        setForecastMini({ projectedRevenue: d.forecast.projectedRevenue, growthRate: d.forecast.growthRate, confidence: d.confidence.level })
      }
    } catch { /* */ }
  }, [])

  useEffect(() => { fetchOverview() }, [fetchOverview])
  useEffect(() => { fetchForecastMini() }, [fetchForecastMini])

  const ov = overview?.overview
  const maxCat = overview ? Math.max(...overview.revenueByCategory.map(c => c.amount), 1) : 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold">Financial Overview</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px] rounded-xl h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 6 Stat Cards */}
      <AdminStatCardGrid columns={6}>
        {loading ? Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="rounded-2xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-4"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-7 w-28 mb-1" /><Skeleton className="h-3 w-16" /></CardContent></Card>
        )) : (
          <>
            <AdminStatCard icon={DollarSign} label="Gross Revenue" value={formatUSD(ov?.grossRevenue ?? 0)} color="emerald" gradientOverride="from-emerald-400 to-green-500"
              subLabel={(ov?.revenueChange ?? 0) >= 0 ? `+${ov?.revenueChange ?? 0}% MoM` : `${ov?.revenueChange ?? 0}% MoM`} />
            <AdminStatCard icon={Building} label="Platform Commission" value={formatUSD(ov?.platformCut ?? 0)} color="blue" gradientOverride="from-sky-400 to-cyan-500" />
            <AdminStatCard icon={Users} label="Instructor Payouts" value={formatUSD(ov?.instructorPayouts ?? 0)} color="teal" gradientOverride="from-teal-400 to-emerald-500" />
            <AdminStatCard icon={Receipt} label="Refunds Issued" value={formatUSD(ov?.refundsIssued ?? 0)} color="orange" gradientOverride="from-orange-400 to-red-500"
              subLabel={`${(ov?.refundRate ?? 0).toFixed(1)}% of gross`} />
            <AdminStatCard icon={TrendingUp} label="Net Revenue" value={formatUSD((ov?.grossRevenue ?? 0) - (ov?.refundsIssued ?? 0))} color="green" gradientOverride="from-emerald-400 to-teal-500" />
            <AdminStatCard icon={AlertTriangle} label="Open Disputes" value={String(overview?.openDisputes ?? 0)} color="red" gradientOverride="from-red-400 to-rose-500" />
          </>
        )}
      </AdminStatCardGrid>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-[16px] font-semibold">Revenue by Category</CardTitle></CardHeader>
          <CardContent className="px-5 pb-5">
            {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-3 w-full mb-3" />) : (
              <div className="space-y-3">{overview?.revenueByCategory.map(cat => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><div className={cn('size-2.5 rounded-full', CATEGORY_COLORS[cat.category] || 'bg-slate-400')} /><span className="text-[13px] font-medium">{cat.category}</span></div>
                    <div className="flex items-center gap-3"><span className="text-[13px] font-semibold">{formatUSD(cat.amount)}</span><span className="text-[11px] text-muted-foreground w-10 text-right">{(cat.percentage ?? 0).toFixed(0)}%</span></div>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${(cat.amount / maxCat) * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className={cn('h-full rounded-full', CATEGORY_COLORS[cat.category] || 'bg-slate-400')} /></div>
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-[16px] font-semibold">Revenue by Payment Method</CardTitle></CardHeader>
          <CardContent className="px-5 pb-5">
            {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-3 w-full mb-3" />) : (
              <div className="space-y-3.5">{overview?.revenueByPaymentMethod.map(pm => (
                <div key={pm.method} className="space-y-1.5">
                  <div className="flex items-center justify-between"><span className="text-[13px] font-medium">{pm.label}</span><span className="text-[13px] font-semibold">{(pm.percentage ?? 0).toFixed(0)}%</span></div>
                  <div className="h-3 rounded-full bg-muted/60 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${pm.percentage}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className={cn('h-full rounded-full', PAYMENT_COLORS[pm.method] || 'bg-slate-400')} /></div>
                  <div className="flex items-center justify-between"><span className="text-[11px] text-muted-foreground">{pm.count} txns</span><span className="text-[11px] text-muted-foreground">{formatUSD(pm.amount)}</span></div>
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      {!loading && overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { l: 'Paid Enrollments', v: ov?.totalEnrollments ?? 0, c: 'text-emerald-600' },
            { l: 'Refund Count', v: ov?.totalRefundCount ?? 0, c: 'text-orange-600' },
            { l: 'Refund Rate', v: `${(ov?.refundRate ?? 0).toFixed(1)}%`, c: 'text-red-600' },
            { l: 'Avg Transaction', v: formatUSD((ov?.grossRevenue ?? 0) / Math.max(ov?.totalEnrollments ?? 1, 1)), c: 'text-blue-600' },
            { l: 'Active Payments', v: overview.revenueByPaymentMethod.length, c: 'text-purple-600' },
            { l: 'Tax Collected', v: formatUSD((ov?.platformCut ?? 0) * 0.05), c: 'text-amber-600' },
          ].map(s => (
            <Card key={s.l} className="rounded-2xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-3 text-center"><p className={cn('text-[18px] font-bold', s.c)}>{s.v}</p><p className="text-[11px] text-muted-foreground">{s.l}</p></CardContent></Card>
          ))}
        </div>
      )}

      {/* Forecast Mini */}
      {forecastMini && (
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-400 to-fuchsia-500" />
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/40"><Sparkles className="size-5 text-violet-600" /></div>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-muted-foreground">Projected Next Month Revenue</p>
              <p className="text-[20px] font-bold text-foreground">{formatUSD(forecastMini.projectedRevenue)}</p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className={cn('text-[11px] rounded-md', forecastMini.growthRate >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                {forecastMini.growthRate >= 0 ? '+' : ''}{forecastMini.growthRate}% growth
              </Badge>
              <p className="text-[11px] text-muted-foreground mt-1 capitalize">{forecastMini.confidence} confidence</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Transactions Tab ────────────────────────────────────────────────────────

function TransactionsTab() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [stats, setStats] = useState({ totalAmount: 0, totalPlatformFee: 0, totalInstructorEarning: 0, count: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortFilter, setSortFilter] = useState('newest')
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  const fetchTransactions = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', search: debouncedSearch, type: typeFilter, status: statusFilter, sort: sortFilter })
      const res = await fetch(`/api/admin/finance/transactions?${params}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setTransactions(data.transactions || [])
      setPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 0 })
      setStats(data.stats || { totalAmount: 0, totalPlatformFee: 0, totalInstructorEarning: 0, count: 0 })
    } catch { /* */ } finally { setLoading(false) }
  }, [debouncedSearch, typeFilter, statusFilter, sortFilter])

  useEffect(() => { fetchTransactions(1) }, [fetchTransactions])

  const handleSearchChange = useCallback((value: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => setDebouncedSearch(value), 300)
  }, [])

  const pageNumbers = useMemo(() => {
    const pages: number[] = []; const start = Math.max(1, pagination.page - 2); const end = Math.min(pagination.totalPages, pagination.page + 2)
    for (let i = start; i <= end; i++) pages.push(i); return pages
  }, [pagination.page, pagination.totalPages])

  return (
    <div className="space-y-5">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" /><Input placeholder="Search by student, course, invoice #..." className="pl-9 rounded-xl h-9" onChange={e => handleSearchChange(e.target.value)} /></div>
          <div className="flex flex-wrap gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-[130px] rounded-xl h-9" size="sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="enrollment">Enrollment</SelectItem><SelectItem value="refund">Refund</SelectItem><SelectItem value="payout">Payout</SelectItem><SelectItem value="adjustment">Adjustment</SelectItem></SelectContent></Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[120px] rounded-xl h-9" size="sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="failed">Failed</SelectItem><SelectItem value="refunded">Refunded</SelectItem></SelectContent></Select>
            <Select value={sortFilter} onValueChange={setSortFilter}><SelectTrigger className="w-[130px] rounded-xl h-9" size="sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">Newest</SelectItem><SelectItem value="oldest">Oldest</SelectItem><SelectItem value="amount_high">Amount: High</SelectItem><SelectItem value="amount_low">Amount: Low</SelectItem></SelectContent></Select>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-9" onClick={() => window.open('/api/admin/finance/export?format=csv&type=transactions', '_blank')}><FileDown className="size-3.5" /> CSV</Button>
        </div>
      </CardContent></Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-[18px] font-bold">{stats.count}</p><p className="text-[11px] text-muted-foreground">Count</p></CardContent></Card>
        <Card className="rounded-xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-[18px] font-bold text-emerald-600">{formatUSD(stats.totalAmount)}</p><p className="text-[11px] text-muted-foreground">Total Amount</p></CardContent></Card>
        <Card className="rounded-xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-[18px] font-bold text-sky-600">{formatUSD(stats.totalPlatformFee)}</p><p className="text-[11px] text-muted-foreground">Platform Fees</p></CardContent></Card>
        <Card className="rounded-xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-[18px] font-bold text-teal-600">{formatUSD(stats.totalInstructorEarning)}</p><p className="text-[11px] text-muted-foreground">Instructor Earnings</p></CardContent></Card>
      </div>

      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-[90px_1fr_130px_90px_90px_100px_80px] gap-2 items-center px-4 py-3 bg-muted/40 border-b text-[11px] font-medium text-muted-foreground uppercase tracking-wide"><div>Date</div><div>Student/Instructor</div><div>Course</div><div>Amount</div><div>Fee</div><div>Earning</div><div className="text-right">Status</div></div>
        <div className="divide-y divide-border/40">
          {loading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="flex items-center gap-3 px-4 py-3">{Array.from({ length: 7 }).map((_, j) => <Skeleton key={j} className="h-4 w-16 rounded-lg" />)}</div>) : transactions.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3"><Receipt className="size-10 text-muted-foreground/30" /><p className="text-[15px] font-medium">No transactions found</p></div>
          ) : transactions.map(tx => {
            const tc = TX_TYPE_CONFIG[tx.type] || TX_TYPE_CONFIG.enrollment; const sc = TX_STATUS_CONFIG[tx.status] || TX_STATUS_CONFIG.completed
            return (
              <button key={tx.id} onClick={() => setSelectedTx(tx)} className="w-full grid grid-cols-1 lg:grid-cols-[90px_1fr_130px_90px_90px_100px_80px] gap-2 items-center px-4 py-3 hover:bg-muted/30 transition-colors text-left">
                <div className="text-[13px] text-muted-foreground">{formatShortDate(tx.createdAt)}</div>
                <div className="flex items-center gap-2 min-w-0"><Badge variant="secondary" className={cn('text-[10px] rounded-md px-1.5 py-0 h-5 gap-0.5', tc.badgeClass)}>{tc.icon} {tc.label}</Badge><p className="text-[13px] font-medium truncate">{tx.student?.name || tx.instructor?.name || '—'}</p></div>
                <div className="hidden lg:block text-[13px] text-muted-foreground truncate">{tx.course?.title || '—'}</div>
                <div className={cn('text-[14px] font-semibold', tx.type === 'refund' ? 'text-orange-600' : '')}>{tx.type === 'refund' ? '-' : ''}{formatUSDFull(tx.amount)}</div>
                <div className="hidden lg:block text-[13px] text-muted-foreground">{formatUSDFull(tx.platformFee)}</div>
                <div className="hidden lg:block text-[13px] text-muted-foreground">{formatUSDFull(tx.instructorEarning)}</div>
                <div className="flex justify-end"><Badge variant="secondary" className={cn('text-[10px] rounded-md px-2 py-0.5', sc.badgeClass)}>{sc.label}</Badge></div>
              </button>
            )
          })}
        </div>
      </Card>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between"><p className="text-[13px] text-muted-foreground">Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0" disabled={pagination.page <= 1} onClick={() => fetchTransactions(pagination.page - 1)}><ChevronLeft className="size-4" /></Button>
            {pageNumbers.map(p => <Button key={p} variant={p === pagination.page ? 'default' : 'outline'} size="sm" className="rounded-xl h-8 w-8 p-0" onClick={() => fetchTransactions(p)}>{p}</Button>)}
            <Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchTransactions(pagination.page + 1)}><ChevronRight className="size-4" /></Button>
          </div>
        </div>
      )}

      <Sheet open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <SheetContent><SheetHeader><SheetTitle>Transaction Detail</SheetTitle></SheetHeader>
          {selectedTx && <ScrollArea className="h-[calc(100vh-100px)]"><div className="space-y-4 p-4">
            <div className="flex items-center gap-2"><Badge className={cn(TX_TYPE_CONFIG[selectedTx.type]?.badgeClass)}>{TX_TYPE_CONFIG[selectedTx.type]?.label}</Badge><Badge className={cn(TX_STATUS_CONFIG[selectedTx.status]?.badgeClass)}>{TX_STATUS_CONFIG[selectedTx.status]?.label}</Badge></div>
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div><p className="text-muted-foreground">Amount</p><p className="font-semibold">{formatUSDFull(selectedTx.amount)}</p></div>
              <div><p className="text-muted-foreground">Platform Fee</p><p className="font-semibold">{formatUSDFull(selectedTx.platformFee)}</p></div>
              <div><p className="text-muted-foreground">Instructor Earning</p><p className="font-semibold">{formatUSDFull(selectedTx.instructorEarning)}</p></div>
              <div><p className="text-muted-foreground">Payment Method</p><p className="capitalize">{selectedTx.paymentMethod.replace(/_/g, ' ')}</p></div>
              <div><p className="text-muted-foreground">Invoice #</p><p>{selectedTx.invoiceNumber || 'N/A'}</p></div>
              <div><p className="text-muted-foreground">Date</p><p>{formatDate(selectedTx.createdAt)}</p></div>
            </div>
            <Separator />
            {selectedTx.student && <div><p className="text-[12px] text-muted-foreground mb-1">Student</p><div className="flex items-center gap-2"><Avatar className="size-7"><AvatarFallback className="text-[10px]">{getInitials(selectedTx.student.name)}</AvatarFallback></Avatar><div><p className="text-[13px] font-medium">{selectedTx.student.name}</p><p className="text-[11px] text-muted-foreground">{selectedTx.student.email}</p></div></div></div>}
            {selectedTx.instructor && <div><p className="text-[12px] text-muted-foreground mb-1">Instructor</p><div className="flex items-center gap-2"><Avatar className="size-7"><AvatarFallback className="text-[10px]">{getInitials(selectedTx.instructor.name)}</AvatarFallback></Avatar><p className="text-[13px] font-medium">{selectedTx.instructor.name}</p></div></div>}
            {selectedTx.course && <div><p className="text-[12px] text-muted-foreground mb-1">Course</p><p className="text-[13px] font-medium">{selectedTx.course.title}</p><p className="text-[11px] text-muted-foreground">{selectedTx.course.category}</p></div>}
            {selectedTx.refundReason && <div><p className="text-[12px] text-muted-foreground mb-1">Refund Reason</p><p className="text-[13px]">{selectedTx.refundReason}</p></div>}
            <div><p className="text-[12px] text-muted-foreground mb-1">Disputes</p><p className="text-[13px]">{selectedTx._count.disputes}</p></div>
          </div></ScrollArea>}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ─── Revenue Split Tab ───────────────────────────────────────────────────────

function RevenueSplitTab() {
  const [splits, setSplits] = useState<RevenueSplitItem[]>([])
  const [totals, setTotals] = useState({ grossRevenue: 0, platformCut: 0, instructorEarnings: 0, totalEnrollments: 0, platformRate: 20, instructorRate: 80 })
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('year')
  const [expandedInstructor, setExpandedInstructor] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchSplits = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/finance/revenue-split?period=${period}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setSplits(data.revenueSplit || [])
      setTotals(data.totals || totals)
    } catch { /* */ } finally { setLoading(false) }
  }, [period])

  useEffect(() => { fetchSplits() }, [fetchSplits])

  const filtered = useMemo(() => {
    if (!search) return splits
    return splits.filter(s => s.instructor?.name?.toLowerCase().includes(search.toLowerCase()))
  }, [splits, search])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h2 className="text-[18px] font-semibold">Revenue Split</h2><p className="text-[13px] text-muted-foreground">Platform: {totals.platformRate}% | Instructors: {totals.instructorRate}%</p></div>
        <Select value={period} onValueChange={setPeriod}><SelectTrigger className="w-[140px] rounded-xl h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="month">This Month</SelectItem><SelectItem value="quarter">This Quarter</SelectItem><SelectItem value="year">This Year</SelectItem><SelectItem value="all">All Time</SelectItem></SelectContent></Select>
      </div>

      {!loading && (
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden"><CardContent className="p-5">
          <div className="h-8 rounded-full bg-muted/60 overflow-hidden flex">
            <motion.div initial={{ width: 0 }} animate={{ width: `${totals.platformRate}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 flex items-center justify-center"><span className="text-[11px] font-bold text-white">Platform {totals.platformRate}%</span></motion.div>
            <motion.div initial={{ width: 0 }} animate={{ width: `${totals.instructorRate}%` }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }} className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center"><span className="text-[11px] font-bold text-white">Instructor {totals.instructorRate}%</span></motion.div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center mt-4">
            <div><p className="text-[20px] font-bold">{formatUSD(totals.grossRevenue)}</p><p className="text-[12px] text-muted-foreground">Gross Revenue</p></div>
            <div><p className="text-[20px] font-bold text-sky-600">{formatUSD(totals.platformCut)}</p><p className="text-[12px] text-muted-foreground">Platform Cut</p></div>
            <div><p className="text-[20px] font-bold text-teal-600">{formatUSD(totals.instructorEarnings)}</p><p className="text-[12px] text-muted-foreground">Instructor Earnings</p></div>
          </div>
        </CardContent></Card>
      )}

      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 pt-5 px-5"><div className="flex items-center justify-between"><CardTitle className="text-[16px] font-semibold">Per-Instructor Breakdown</CardTitle>
          <div className="relative w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" /><Input placeholder="Search instructors..." className="pl-8 rounded-lg h-8 text-[12px]" value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div></CardHeader>
        <CardContent className="px-5 pb-5">
          {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />) : (
            <div className="space-y-2">{filtered.slice(0, 20).map(split => (
              <div key={split.instructorId}>
                <button onClick={() => setExpandedInstructor(expandedInstructor === split.instructorId ? null : split.instructorId)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors text-left">
                  <Avatar className="size-9 rounded-xl shrink-0"><AvatarFallback className="text-[10px] bg-primary/10 rounded-xl">{split.instructor ? getInitials(split.instructor.name) : '?'}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="text-[14px] font-medium truncate">{split.instructor?.name || 'Unknown'}</p>{split.hasCustomCommission && <Badge className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0">Custom</Badge>}</div><p className="text-[12px] text-muted-foreground">{split.enrollmentCount} enrollments</p></div>
                  <div className="text-right shrink-0"><p className="text-[14px] font-semibold text-teal-600">{formatUSD(split.instructorEarning)}</p><p className="text-[11px] text-muted-foreground">of {formatUSD(split.totalRevenue)}</p></div>
                  <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', expandedInstructor === split.instructorId && 'rotate-180')} />
                </button>
                <AnimatePresence>{expandedInstructor === split.instructorId && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden ml-12">
                    <div className="space-y-2 pb-2">{split.courses.map((c, ci) => (
                      <div key={ci} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-[12px]">
                        <div><p className="font-medium">{c.courseTitle}</p><p className="text-muted-foreground">{c.category} · {c.enrollmentCount} enrollments</p></div>
                        <div className="text-right"><p className="font-medium">{formatUSD(c.revenue)}</p><p className="text-teal-600">{formatUSD(c.instructorEarning)} earned</p></div>
                      </div>
                    ))}</div>
                  </motion.div>
                )}</AnimatePresence>
              </div>
            ))}</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Refunds Tab ─────────────────────────────────────────────────────────────

function RefundsTab() {
  const [refunds, setRefunds] = useState<RefundItem[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [stats, setStats] = useState({ totalRefundAmount: 0, pendingCount: 0, approvedCount: 0, processedCount: 0, rejectedCount: 0, avgProcessingDays: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedRefund, setSelectedRefund] = useState<RefundItem | null>(null)
  const [rejectDialog, setRejectDialog] = useState<RefundItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  const fetchRefunds = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', status: statusFilter, search: debouncedSearch, sort: 'newest' })
      const res = await fetch(`/api/admin/finance/refunds?${params}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setRefunds(data.refunds || [])
      setPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 0 })
      setStats(data.stats || { totalRefundAmount: 0, pendingCount: 0, approvedCount: 0, processedCount: 0, rejectedCount: 0, avgProcessingDays: 0 })
    } catch { /* */ } finally { setLoading(false) }
  }, [statusFilter, debouncedSearch])

  useEffect(() => { fetchRefunds(1) }, [fetchRefunds])

  const handleSearchChange = useCallback((v: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => setDebouncedSearch(v), 300)
  }, [])

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) { n.delete(id) } else { n.add(id) }; return n })

  const handleRefundAction = useCallback(async (action: string, transactionId: string, extra?: Record<string, unknown>) => {
    setActionLoading(transactionId)
    try {
      const res = await fetch('/api/admin/finance/refunds', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, transactionId, ...extra }) })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed') }
      toast.success(`Refund ${action} successful`)
      fetchRefunds(pagination.page)
      setSelectedRefund(null); setRejectDialog(null)
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
    finally { setActionLoading(null) }
  }, [fetchRefunds, pagination.page])

  const handleBulkApprove = useCallback(async () => {
    if (selectedIds.size === 0) return
    setActionLoading('bulk')
    try {
      const res = await fetch('/api/admin/finance/refunds', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'bulk_approve', transactionIds: Array.from(selectedIds) }) })
      if (!res.ok) throw new Error('Failed')
      toast.success(`Bulk approved ${selectedIds.size} refunds`)
      setSelectedIds(new Set())
      fetchRefunds(1)
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
    finally { setActionLoading(null) }
  }, [selectedIds, fetchRefunds])

  const REFUND_STATUS: Record<string, { label: string; badge: string }> = {
    pending: { label: 'Pending', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
    refunded: { label: 'Approved', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
    completed: { label: 'Rejected', badge: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-[18px] font-bold text-amber-600">{stats.pendingCount}</p><p className="text-[11px] text-muted-foreground">Pending</p></CardContent></Card>
        <Card className="rounded-xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-[18px] font-bold text-emerald-600">{stats.approvedCount}</p><p className="text-[11px] text-muted-foreground">Approved</p></CardContent></Card>
        <Card className="rounded-xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-[18px] font-bold">{formatUSD(stats.totalRefundAmount)}</p><p className="text-[11px] text-muted-foreground">Total Refund Amount</p></CardContent></Card>
        <Card className="rounded-xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-[18px] font-bold text-blue-600">{(stats.avgProcessingDays ?? 0).toFixed(1)}d</p><p className="text-[11px] text-muted-foreground">Avg Processing</p></CardContent></Card>
      </div>

      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" /><Input placeholder="Search refunds..." className="pl-9 rounded-xl h-9" onChange={e => handleSearchChange(e.target.value)} /></div>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[140px] rounded-xl h-9" size="sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem><SelectItem value="processed">Processed</SelectItem></SelectContent></Select>
        </div>
      </CardContent></Card>

      {selectedIds.size > 0 && (
        <Card className="rounded-xl shadow-sm border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"><CardContent className="p-3 flex items-center gap-3 flex-wrap">
          <span className="text-[13px] font-medium">{selectedIds.size} selected</span><Separator orientation="vertical" className="h-6" />
          <Button size="sm" className="rounded-lg gap-1.5 h-8 text-[12px]" onClick={handleBulkApprove} disabled={actionLoading === 'bulk'}><CheckCircle className="size-3" /> Bulk Approve</Button>
          <Button variant="ghost" size="sm" className="h-7 text-[11px] rounded-lg" onClick={() => setSelectedIds(new Set())}>Deselect</Button>
        </CardContent></Card>
      )}

      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-[40px_90px_1fr_120px_90px_1fr_90px_120px] gap-2 items-center px-4 py-3 bg-muted/40 border-b text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          <div /><div>Date</div><div>Student</div><div>Course</div><div>Amount</div><div>Reason</div><div>Status</div><div className="text-right">Actions</div>
        </div>
        <div className="divide-y divide-border/40">
          {loading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="px-4 py-3"><Skeleton className="h-4 w-full" /></div>) : refunds.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3"><Receipt className="size-10 text-muted-foreground/30" /><p className="text-[15px] font-medium">No refunds found</p></div>
          ) : refunds.map(r => {
            const rs = REFUND_STATUS[r.status] || REFUND_STATUS.pending
            const isPending = r.status === 'pending'
            return (
              <div key={r.id} className="grid grid-cols-1 lg:grid-cols-[40px_90px_1fr_120px_90px_1fr_90px_120px] gap-2 items-center px-4 py-3 hover:bg-muted/30">
                <Checkbox checked={selectedIds.has(r.id)} onCheckedChange={() => toggleSelect(r.id)} />
                <div className="text-[13px] text-muted-foreground">{formatShortDate(r.createdAt)}</div>
                <div className="text-[13px] font-medium truncate">{r.student?.name || '—'}</div>
                <div className="text-[13px] text-muted-foreground truncate">{r.course?.title || '—'}</div>
                <div className="text-[14px] font-semibold text-orange-600">{formatUSDFull(r.amount)}</div>
                <div className="text-[12px] text-muted-foreground truncate">{r.refundReason || r.description || '—'}</div>
                <Badge variant="secondary" className={cn('text-[10px] rounded-md px-2 py-0.5', rs.badge)}>{rs.label}</Badge>
                <div className="flex justify-end gap-1">
                  {isPending && <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg gap-1" disabled={actionLoading === r.id} onClick={() => handleRefundAction('approve', r.id)}><CheckCircle className="size-3" /></Button>}
                  {isPending && <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg gap-1 text-red-600" disabled={actionLoading === r.id} onClick={() => setRejectDialog(r)}><XCircle className="size-3" /></Button>}
                  <Button size="sm" variant="ghost" className="h-7 text-[11px] rounded-lg" onClick={() => setSelectedRefund(r)}><Eye className="size-3" /></Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {pagination.totalPages > 1 && <div className="flex items-center justify-between"><p className="text-[13px] text-muted-foreground">Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</p><div className="flex gap-1"><Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0" disabled={pagination.page <= 1} onClick={() => fetchRefunds(pagination.page - 1)}><ChevronLeft className="size-4" /></Button><Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchRefunds(pagination.page + 1)}><ChevronRight className="size-4" /></Button></div></div>}

      <Sheet open={!!selectedRefund} onOpenChange={() => setSelectedRefund(null)}>
        <SheetContent><SheetHeader><SheetTitle>Refund Detail</SheetTitle></SheetHeader>
          {selectedRefund && <ScrollArea className="h-[calc(100vh-100px)]"><div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div><p className="text-muted-foreground">Amount</p><p className="font-semibold text-orange-600">{formatUSDFull(selectedRefund.amount)}</p></div>
              <div><p className="text-muted-foreground">Status</p><Badge className={cn(REFUND_STATUS[selectedRefund.status]?.badge)}>{REFUND_STATUS[selectedRefund.status]?.label}</Badge></div>
              <div><p className="text-muted-foreground">Payment Method</p><p className="capitalize">{selectedRefund.paymentMethod.replace(/_/g, ' ')}</p></div>
              <div><p className="text-muted-foreground">Requested</p><p>{formatDate(selectedRefund.createdAt)}</p></div>
              <div><p className="text-muted-foreground">Processed</p><p>{formatDate(selectedRefund.refundedAt)}</p></div>
            </div>
            {selectedRefund.student && <div><p className="text-[12px] text-muted-foreground mb-1">Student</p><p className="text-[13px] font-medium">{selectedRefund.student.name}</p><p className="text-[11px] text-muted-foreground">{selectedRefund.student.email}</p></div>}
            {selectedRefund.instructor && <div><p className="text-[12px] text-muted-foreground mb-1">Instructor</p><p className="text-[13px] font-medium">{selectedRefund.instructor.name}</p></div>}
            {selectedRefund.course && <div><p className="text-[12px] text-muted-foreground mb-1">Course</p><p className="text-[13px] font-medium">{selectedRefund.course.title}</p></div>}
            {selectedRefund.refundReason && <div><p className="text-[12px] text-muted-foreground mb-1">Reason</p><p className="text-[13px]">{selectedRefund.refundReason}</p></div>}
          </div></ScrollArea>}
        </SheetContent>
      </Sheet>

      <Dialog open={!!rejectDialog} onOpenChange={() => { setRejectDialog(null); setRejectReason('') }}>
        <DialogContent><DialogHeader><DialogTitle>Reject Refund</DialogTitle><DialogDescription>Provide a reason for rejecting this refund request.</DialogDescription></DialogHeader>
          <Textarea placeholder="Rejection reason..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
          <DialogFooter><Button variant="outline" onClick={() => { setRejectDialog(null); setRejectReason('') }}>Cancel</Button><Button variant="destructive" disabled={!rejectReason.trim() || actionLoading === rejectDialog?.id} onClick={() => rejectDialog && handleRefundAction('reject', rejectDialog.id, { reason: rejectReason })}>Reject</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Disputes Tab ────────────────────────────────────────────────────────────

function DisputesTab() {
  const [disputes, setDisputes] = useState<DisputeItem[]>([])
  const [stats, setStats] = useState({ open: 0, underReview: 0, resolved: 0, escalated: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionDialog, setActionDialog] = useState<{ dispute: DisputeItem; action: string } | null>(null)
  const [actionNote, setActionNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchDisputes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: statusFilter, limit: '50' })
      const res = await fetch(`/api/admin/finance/disputes?${params}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setDisputes(data.disputes || [])
      setStats({ open: data.stats?.open ?? 0, underReview: data.stats?.underReview ?? 0, resolved: data.stats?.resolved ?? 0, escalated: data.stats?.escalated ?? 0 })
    } catch { /* */ } finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { fetchDisputes() }, [fetchDisputes])

  const handleAction = useCallback(async () => {
    if (!actionDialog) return
    setActionLoading(true)
    try {
      const actionMap: Record<string, string> = { review: 'under_review', resolve_buyer: 'resolved', resolve_seller: 'resolved', escalate: 'escalated', cancel: 'cancelled' }
      const res = await fetch(`/api/admin/finance/disputes/${actionDialog.dispute.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: actionMap[actionDialog.action] || actionDialog.action, resolutionNote: actionNote, favor: actionDialog.action === 'resolve_buyer' ? 'buyer' : actionDialog.action === 'resolve_seller' ? 'seller' : undefined }) })
      if (!res.ok) throw new Error('Failed')
      toast.success(`Dispute ${actionDialog.action.replace('_', ' ')} successful`)
      setActionDialog(null); setActionNote(''); fetchDisputes()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
    finally { setActionLoading(false) }
  }, [actionDialog, actionNote, fetchDisputes])

  const DS: Record<string, { label: string; badge: string }> = {
    open: { label: 'Open', badge: 'bg-amber-100 text-amber-700' }, under_review: { label: 'Under Review', badge: 'bg-blue-100 text-blue-700' },
    resolved: { label: 'Resolved', badge: 'bg-emerald-100 text-emerald-700' }, escalated: { label: 'Escalated', badge: 'bg-red-100 text-red-700' }, cancelled: { label: 'Cancelled', badge: 'bg-slate-100 text-slate-700' },
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-[18px] font-bold text-amber-600">{stats.open}</p><p className="text-[11px] text-muted-foreground">Open</p></CardContent></Card>
        <Card className="rounded-xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-[18px] font-bold text-blue-600">{stats.underReview}</p><p className="text-[11px] text-muted-foreground">Under Review</p></CardContent></Card>
        <Card className="rounded-xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-[18px] font-bold text-emerald-600">{stats.resolved}</p><p className="text-[11px] text-muted-foreground">Resolved</p></CardContent></Card>
        <Card className="rounded-xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-[18px] font-bold text-red-600">{stats.escalated}</p><p className="text-[11px] text-muted-foreground">Escalated</p></CardContent></Card>
      </div>

      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-4">
        <div className="flex gap-2 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[140px] rounded-xl h-9" size="sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="open">Open</SelectItem><SelectItem value="under_review">Under Review</SelectItem><SelectItem value="resolved">Resolved</SelectItem><SelectItem value="escalated">Escalated</SelectItem></SelectContent></Select>
          <Button variant="outline" size="sm" className="rounded-xl h-9 gap-1.5" onClick={fetchDisputes}><RefreshCw className="size-3.5" /> Refresh</Button>
        </div>
      </CardContent></Card>

      <div className="space-y-3">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />) : disputes.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3"><AlertOctagon className="size-10 text-muted-foreground/30" /><p className="text-[15px] font-medium">No disputes found</p></div>
        ) : disputes.map(d => {
          const dc = DS[d.status] || DS.open
          return (
            <Card key={d.id} className="rounded-2xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1"><div className="flex items-center gap-2 mb-1"><Badge variant="secondary" className={cn('text-[10px] rounded-md', dc.badge)}>{dc.label}</Badge><Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600">{d.type}</Badge><span className="text-[12px] text-muted-foreground">{formatDate(d.createdAt)}</span></div>
                  <p className="text-[14px] font-medium">{d.description}</p>
                </div>
                <p className="text-[16px] font-bold text-orange-600">{d.refundAmount ? formatUSDFull(d.refundAmount) : '—'}</p>
              </div>
              <div className="flex items-center gap-4 text-[12px] text-muted-foreground mb-3">
                {d.transaction.student && <span>Student: <strong className="text-foreground">{d.transaction.student.name}</strong></span>}
                {d.transaction.instructor && <span>Instructor: <strong className="text-foreground">{d.transaction.instructor.name}</strong></span>}
                {d.transaction.course && <span>Course: <strong className="text-foreground">{d.transaction.course.title}</strong></span>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {(d.status === 'open' || d.status === 'escalated') && <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg gap-1" onClick={() => setActionDialog({ dispute: d, action: 'review' })}><Eye className="size-3" /> Review</Button>}
                {(d.status === 'open' || d.status === 'under_review') && <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg gap-1 text-emerald-600" onClick={() => setActionDialog({ dispute: d, action: 'resolve_buyer' })}><ThumbsUp className="size-3" /> Favor Buyer</Button>}
                {(d.status === 'open' || d.status === 'under_review') && <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg gap-1 text-blue-600" onClick={() => setActionDialog({ dispute: d, action: 'resolve_seller' })}><ThumbsDown className="size-3" /> Favor Seller</Button>}
                {(d.status === 'open' || d.status === 'under_review') && <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg gap-1 text-red-600" onClick={() => setActionDialog({ dispute: d, action: 'escalate' })}><AlertTriangle className="size-3" /> Escalate</Button>}
                {d.status !== 'resolved' && d.status !== 'cancelled' && <Button size="sm" variant="ghost" className="h-7 text-[11px] rounded-lg" onClick={() => setActionDialog({ dispute: d, action: 'cancel' })}>Cancel</Button>}
              </div>
            </CardContent></Card>
          )
        })}
      </div>

      <Dialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setActionNote('') }}>
        <DialogContent><DialogHeader><DialogTitle>{actionDialog?.action === 'review' ? 'Review Dispute' : actionDialog?.action === 'resolve_buyer' ? 'Resolve: Favor Buyer' : actionDialog?.action === 'resolve_seller' ? 'Resolve: Favor Seller' : actionDialog?.action === 'escalate' ? 'Escalate Dispute' : 'Cancel Dispute'}</DialogTitle><DialogDescription>Dispute for {formatUSDFull(actionDialog?.dispute.refundAmount ?? 0)} — {actionDialog?.dispute.description}</DialogDescription></DialogHeader>
          <Textarea placeholder="Optional note..." value={actionNote} onChange={e => setActionNote(e.target.value)} />
          <DialogFooter><Button variant="outline" onClick={() => { setActionDialog(null); setActionNote('') }}>Cancel</Button><Button disabled={actionLoading} onClick={handleAction}>{actionDialog?.action === 'cancel' ? 'Cancel Dispute' : 'Confirm'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Tax Reports Tab ─────────────────────────────────────────────────────────

function TaxReportsTab() {
  const [report, setReport] = useState<TaxReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [fiscalYear, setFiscalYear] = useState('FY2024-25')

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/finance/tax-reports?fiscalYear=${fiscalYear}`)
      if (!res.ok) throw new Error('Failed')
      setReport(await res.json())
    } catch { /* */ } finally { setLoading(false) }
  }, [fiscalYear])

  useEffect(() => { fetchReport() }, [fetchReport])

  const s = report?.summary
  const ts = report?.settings

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold">Tax Reports</h2>
        <div className="flex gap-2">
          <Select value={fiscalYear} onValueChange={setFiscalYear}><SelectTrigger className="w-[140px] rounded-xl h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FY2024-25">FY 2024-25</SelectItem><SelectItem value="FY2023-24">FY 2023-24</SelectItem><SelectItem value="FY2022-23">FY 2022-23</SelectItem></SelectContent></Select>
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-9" onClick={() => window.open(`/api/admin/finance/export?format=csv&type=tax&fiscalYear=${fiscalYear}`, '_blank')}><FileDown className="size-3.5" /> Export CSV</Button>
        </div>
      </div>

      {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />) : (
        <>
          <AdminStatCardGrid columns={4}>
            <AdminStatCard icon={DollarSign} label="Gross Revenue" value={formatUSD(s?.totalGrossRevenue ?? 0)} color="emerald" gradientOverride="from-emerald-400 to-green-500" />
            <AdminStatCard icon={Building} label="Platform Commission" value={formatUSD(s?.platformCommission ?? 0)} color="blue" gradientOverride="from-sky-400 to-cyan-500" />
            <AdminStatCard icon={Users} label="Instructor Earnings" value={formatUSD(s?.instructorEarnings ?? 0)} color="teal" gradientOverride="from-teal-400 to-emerald-500" />
            <AdminStatCard icon={Percent} label="Withholding Tax" value={formatUSD(s?.withholdingTaxCollected ?? 0)} color="amber" gradientOverride="from-amber-400 to-orange-500" />
          </AdminStatCardGrid>

          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-[16px] font-semibold">Monthly Breakdown</CardTitle></CardHeader>
            <CardContent className="px-5 pb-5">
              <ScrollArea className="max-h-96">
                <table className="w-full text-[13px]">
                  <thead><tr className="border-b text-muted-foreground text-[11px] uppercase"><th className="text-left py-2">Month</th><th className="text-right py-2">Revenue</th><th className="text-right py-2">Commission</th><th className="text-right py-2">Enrollments</th><th className="text-right py-2">Refunds</th></tr></thead>
                  <tbody>{report?.monthlyBreakdown.map(m => (
                    <tr key={m.month} className="border-b border-border/40"><td className="py-2">{m.month}</td><td className="text-right font-medium">{formatUSD(m.grossRevenue)}</td><td className="text-right">{formatUSD(m.platformCommission)}</td><td className="text-right">{m.enrollments}</td><td className="text-right text-orange-600">{formatUSD(m.refunds)}</td></tr>
                  ))}</tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-[16px] font-semibold">Instructor Tax Summary</CardTitle></CardHeader>
            <CardContent className="px-5 pb-5">
              <ScrollArea className="max-h-96">
                <table className="w-full text-[13px]">
                  <thead><tr className="border-b text-muted-foreground text-[11px] uppercase"><th className="text-left py-2">Name</th><th className="text-right py-2">Gross</th><th className="text-right py-2">Net</th><th className="text-right py-2">Tax Withheld</th><th className="text-right py-2">Enrollments</th></tr></thead>
                  <tbody>{report?.instructorTaxSummary.map(inst => (
                    <tr key={inst.instructorId ?? inst.name} className="border-b border-border/40"><td className="py-2 font-medium">{inst.name}</td><td className="text-right">{formatUSD(inst.grossEarnings)}</td><td className="text-right">{formatUSD(inst.netEarnings)}</td><td className="text-right text-amber-600">{formatUSD(inst.taxWithheld)}</td><td className="text-right">{inst.enrollmentCount}</td></tr>
                  ))}</tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>

          {ts && (
            <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-4">
              <p className="text-[13px] font-medium mb-2">Tax Settings</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
                <div><span className="text-muted-foreground">Commission Rate</span><p className="font-semibold">{(ts.platformCommissionRate ?? 0)}%</p></div>
                <div><span className="text-muted-foreground">Payout Rate</span><p className="font-semibold">{(ts.instructorPayoutRate ?? 0)}%</p></div>
                <div><span className="text-muted-foreground">WHT Rate</span><p className="font-semibold">{(ts.withholdingTaxRate ?? 0)}%</p></div>
                <div><span className="text-muted-foreground">Tax ID</span><p className="font-semibold">{ts.taxId || 'N/A'}</p></div>
              </div>
            </CardContent></Card>
          )}
        </>
      )}
    </div>
  )
}

// ─── Financial Settings Tab ──────────────────────────────────────────────────

function FinancialSettingsTab() {
  const [settings, setSettings] = useState<FinancialSettings | null>(null)
  const [overrides, setOverrides] = useState<CommissionOverride[]>([])
  const [instructors, setInstructors] = useState<Array<{ id: string; name: string; email: string; avatar: string | null }>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<FinancialSettings>>({})
  const [addOverrideOpen, setAddOverrideOpen] = useState(false)
  const [overrideForm, setOverrideForm] = useState({ instructorId: '', commissionRate: 0, reason: '' })
  const [removeOverrideId, setRemoveOverrideId] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/finance/settings')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setSettings(data.settings)
      setOverrides(data.commissionOverrides || [])
      setInstructors(data.instructors || [])
      setForm({
        platformCommissionRate: data.settings.platformCommissionRate,
        instructorPayoutRate: data.settings.instructorPayoutRate,
        minimumPayoutAmount: data.settings.minimumPayoutAmount,
        refundPolicyDays: data.settings.refundPolicyDays,
        withholdingTaxRate: data.settings.withholdingTaxRate,
        autoApproveRefunds: data.settings.autoApproveRefunds,
        disputeResolutionDays: data.settings.disputeResolutionDays,
        payoutHoldPeriodDays: data.settings.payoutHoldPeriodDays,
        defaultPayoutSchedule: data.settings.defaultPayoutSchedule,
        taxId: data.settings.taxId,
      })
    } catch { /* */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/finance/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_settings', ...form }) })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed') }
      toast.success('Financial settings saved successfully')
      fetchSettings()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed to save') }
    finally { setSaving(false) }
  }, [form, fetchSettings])

  const handleAddOverride = useCallback(async () => {
    if (!overrideForm.instructorId) { toast.error('Select an instructor'); return }
    try {
      const res = await fetch('/api/admin/finance/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_commission_override', instructorId: overrideForm.instructorId, commissionRate: overrideForm.commissionRate, reason: overrideForm.reason }) })
      if (!res.ok) throw new Error('Failed')
      toast.success('Commission override added')
      setAddOverrideOpen(false); setOverrideForm({ instructorId: '', commissionRate: 0, reason: '' }); fetchSettings()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
  }, [overrideForm, fetchSettings])

  const handleRemoveOverride = useCallback(async (instructorId: string) => {
    try {
      const res = await fetch('/api/admin/finance/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove_commission_override', instructorId }) })
      if (!res.ok) throw new Error('Failed')
      toast.success('Commission override removed')
      setRemoveOverrideId(null); fetchSettings()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
  }, [fetchSettings])

  if (loading) return <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h2 className="text-[18px] font-semibold">Financial Settings</h2><Button className="rounded-xl gap-1.5" disabled={saving} onClick={handleSave}>{saving && <Loader2 className="size-4 animate-spin" />}Save Settings</Button></div>

      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm"><CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-[16px] font-semibold">Commission & Rates</CardTitle></CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><Label className="text-[12px]">Platform Commission Rate (%)</Label><Input type="number" className="rounded-xl h-9" value={form.platformCommissionRate ?? 0} onChange={e => setForm(p => ({ ...p, platformCommissionRate: Number(e.target.value) }))} /></div>
            <div><Label className="text-[12px]">Instructor Payout Rate (%)</Label><Input type="number" className="rounded-xl h-9" value={form.instructorPayoutRate ?? 0} onChange={e => setForm(p => ({ ...p, instructorPayoutRate: Number(e.target.value) }))} /></div>
            <div><Label className="text-[12px]">Withholding Tax Rate (%)</Label><Input type="number" className="rounded-xl h-9" value={form.withholdingTaxRate ?? 0} onChange={e => setForm(p => ({ ...p, withholdingTaxRate: Number(e.target.value) }))} /></div>
          </div>
          {form.platformCommissionRate !== undefined && (
            <div className="p-3 rounded-xl bg-muted/40">
              <p className="text-[12px] text-muted-foreground mb-2">Live Split Preview</p>
              <div className="h-6 rounded-full bg-muted/60 overflow-hidden flex">
                <div className="h-full bg-sky-500 flex items-center justify-center" style={{ width: `${form.platformCommissionRate ?? 0}%` }}><span className="text-[10px] font-bold text-white">Platform {form.platformCommissionRate ?? 0}%</span></div>
                <div className="h-full bg-teal-500 flex items-center justify-center" style={{ width: `${form.instructorPayoutRate ?? 0}%` }}><span className="text-[10px] font-bold text-white">Instructor {form.instructorPayoutRate ?? 0}%</span></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm"><CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-[16px] font-semibold">Policy & Payout</CardTitle></CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><Label className="text-[12px]">Minimum Payout Amount (USD)</Label><Input type="number" className="rounded-xl h-9" value={form.minimumPayoutAmount ?? 0} onChange={e => setForm(p => ({ ...p, minimumPayoutAmount: Number(e.target.value) }))} /></div>
            <div><Label className="text-[12px]">Refund Policy Days</Label><Input type="number" className="rounded-xl h-9" value={form.refundPolicyDays ?? 0} onChange={e => setForm(p => ({ ...p, refundPolicyDays: Number(e.target.value) }))} /></div>
            <div><Label className="text-[12px]">Dispute Resolution Days</Label><Input type="number" className="rounded-xl h-9" value={form.disputeResolutionDays ?? 0} onChange={e => setForm(p => ({ ...p, disputeResolutionDays: Number(e.target.value) }))} /></div>
            <div><Label className="text-[12px]">Payout Hold Period Days</Label><Input type="number" className="rounded-xl h-9" value={form.payoutHoldPeriodDays ?? 0} onChange={e => setForm(p => ({ ...p, payoutHoldPeriodDays: Number(e.target.value) }))} /></div>
            <div><Label className="text-[12px]">Default Payout Schedule</Label><Select value={form.defaultPayoutSchedule ?? 'monthly'} onValueChange={v => setForm(p => ({ ...p, defaultPayoutSchedule: v }))}><SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="biweekly">Biweekly</SelectItem><SelectItem value="weekly">Weekly</SelectItem></SelectContent></Select></div>
            <div><Label className="text-[12px]">Tax ID</Label><Input className="rounded-xl h-9" value={form.taxId ?? ''} onChange={e => setForm(p => ({ ...p, taxId: e.target.value }))} /></div>
          </div>
          <div className="flex items-center gap-3"><Switch checked={form.autoApproveRefunds ?? false} onCheckedChange={v => setForm(p => ({ ...p, autoApproveRefunds: v }))} /><Label className="text-[13px]">Auto-Approve Refunds</Label></div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 pt-5 px-5"><div className="flex items-center justify-between"><CardTitle className="text-[16px] font-semibold">Commission Overrides</CardTitle><Button size="sm" className="rounded-xl gap-1.5 h-8" onClick={() => setAddOverrideOpen(true)}><Plus className="size-3.5" /> Add Override</Button></div></CardHeader>
        <CardContent className="px-5 pb-5">
          {overrides.length === 0 ? <p className="text-[13px] text-muted-foreground text-center py-6">No commission overrides configured</p> : (
            <div className="space-y-2">{overrides.map(co => (
              <div key={co.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3"><Avatar className="size-8"><AvatarFallback className="text-[10px]">{getInitials(co.instructor.name)}</AvatarFallback></Avatar><div><p className="text-[13px] font-medium">{co.instructor.name}</p><p className="text-[11px] text-muted-foreground">{co.instructor.email}</p></div></div>
                <div className="flex items-center gap-4">
                  <div className="text-right"><p className="text-[14px] font-bold text-amber-600">{co.commissionRate}%</p>{co.reason && <p className="text-[11px] text-muted-foreground">{co.reason}</p>}</div>
                  <Badge variant="secondary" className="text-[10px]">{co.createdBy}</Badge>
                  <Button size="sm" variant="ghost" className="h-7 text-red-600" onClick={() => setRemoveOverrideId(co.instructorId)}><Trash2 className="size-3.5" /></Button>
                </div>
              </div>
            ))}</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOverrideOpen} onOpenChange={setAddOverrideOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add Commission Override</DialogTitle><DialogDescription>Set a custom commission rate for an instructor.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Instructor</Label><Select value={overrideForm.instructorId} onValueChange={v => setOverrideForm(p => ({ ...p, instructorId: v }))}><SelectTrigger className="rounded-xl h-9"><SelectValue placeholder="Select instructor" /></SelectTrigger><SelectContent>{instructors.map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.email})</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Commission Rate (%)</Label><Input type="number" className="rounded-xl h-9" value={overrideForm.commissionRate} onChange={e => setOverrideForm(p => ({ ...p, commissionRate: Number(e.target.value) }))} /></div>
            <div><Label>Reason</Label><Textarea className="rounded-xl" value={overrideForm.reason} onChange={e => setOverrideForm(p => ({ ...p, reason: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddOverrideOpen(false)}>Cancel</Button><Button onClick={handleAddOverride}>Add Override</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!removeOverrideId} onOpenChange={() => setRemoveOverrideId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Remove Override</DialogTitle><DialogDescription>Are you sure? The default commission rate will apply.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setRemoveOverrideId(null)}>Cancel</Button><Button variant="destructive" onClick={() => removeOverrideId && handleRemoveOverride(removeOverrideId)}>Remove</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Forecasting Tab ─────────────────────────────────────────────────────────

function ForecastingTab() {
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('next_quarter')

  const fetchForecast = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/finance/forecast?period=${period}`)
      if (!res.ok) throw new Error('Failed')
      setForecast(await res.json())
    } catch { /* */ } finally { setLoading(false) }
  }, [period])

  useEffect(() => { fetchForecast() }, [fetchForecast])

  const f = forecast?.forecast
  const c = forecast?.confidence
  const s = forecast?.summary
  const maxRev = Math.max(...(forecast?.trend.historical.map(h => h.revenue) || [1]), ...(forecast?.trend.projected.map(p => p.projectedRevenue) || [1]), 1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold">Revenue Forecasting</h2>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}><SelectTrigger className="w-[150px] rounded-xl h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="next_month">Next Month</SelectItem><SelectItem value="next_quarter">Next Quarter</SelectItem><SelectItem value="next_year">Next Year</SelectItem></SelectContent></Select>
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-9" onClick={fetchForecast}><RefreshCw className="size-3.5" /> Refresh</Button>
        </div>
      </div>

      {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />) : forecast && (
        <>
          <AdminStatCardGrid columns={5}>
            <AdminStatCard icon={Sparkles} label="Projected Revenue" value={formatUSD(f?.projectedRevenue ?? 0)} color="violet" gradientOverride="from-violet-400 to-fuchsia-500" />
            <AdminStatCard icon={Users} label="Projected Enrollments" value={String(f?.projectedEnrollments ?? 0)} color="green" gradientOverride="from-emerald-400 to-teal-500" />
            <AdminStatCard icon={Building} label="Platform Cut" value={formatUSD(f?.projectedPlatformCut ?? 0)} color="blue" gradientOverride="from-sky-400 to-cyan-500" />
            <AdminStatCard icon={CreditCard} label="Instructor Payouts" value={formatUSD(f?.projectedInstructorPayouts ?? 0)} color="teal" gradientOverride="from-teal-400 to-emerald-500" />
            <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
              <div className={cn('h-1', (f?.growthRate ?? 0) >= 0 ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-red-400 to-rose-500')} />
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1"><span className="text-[12px] font-medium text-muted-foreground">Growth Rate</span>{(f?.growthRate ?? 0) >= 0 ? <TrendingUp className="size-4 text-emerald-600" /> : <TrendingDown className="size-4 text-red-600" />}</div>
                <p className={cn('text-[22px] font-bold', (f?.growthRate ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600')}>{(f?.growthRate ?? 0) >= 0 ? '+' : ''}{f?.growthRate ?? 0}%</p>
              </CardContent>
            </Card>
          </AdminStatCardGrid>

          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn('size-3 rounded-full', c?.level === 'high' ? 'bg-emerald-500' : c?.level === 'medium' ? 'bg-amber-500' : 'bg-red-500')} />
              <span className="text-[14px] font-medium capitalize">{c?.level} Confidence</span>
              <Badge variant="secondary" className="text-[10px]">R² = {c?.rSquared ?? 0}</Badge>
              <Badge variant="secondary" className="text-[10px]">{c?.dataPoints ?? 0} data points</Badge>
            </div>
            <Progress value={c?.level === 'high' ? 90 : c?.level === 'medium' ? 60 : 30} className="h-2" />
          </CardContent></Card>

          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-[16px] font-semibold">Monthly Trend</CardTitle></CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-2">
                {forecast.trend.historical.map(h => (
                  <div key={h.month} className="flex items-center gap-3">
                    <span className="text-[12px] text-muted-foreground w-16 shrink-0">{h.month}</span>
                    <div className="flex-1 h-5 rounded-full bg-muted/40 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${(h.revenue / maxRev) * 100}%` }} />
                    </div>
                    <span className="text-[12px] font-medium w-24 text-right">{formatUSD(h.revenue)}</span>
                  </div>
                ))}
                {forecast.trend.projected.length > 0 && <Separator className="my-2" />}
                {forecast.trend.projected.map(p => (
                  <div key={p.month} className="flex items-center gap-3">
                    <span className="text-[12px] text-violet-600 w-16 shrink-0">{p.month}</span>
                    <div className="flex-1 h-5 rounded-full bg-muted/40 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500 opacity-70 border border-dashed border-violet-300" style={{ width: `${(p.projectedRevenue / maxRev) * 100}%` }} />
                    </div>
                    <span className="text-[12px] font-medium w-24 text-right text-violet-600">{formatUSD(p.projectedRevenue)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm"><CardContent className="p-4">
            <p className="text-[13px] font-medium mb-2">Key Assumptions</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[12px]">
              <div><span className="text-muted-foreground">Avg Monthly Revenue</span><p className="font-semibold">{formatUSD(s?.avgMonthlyRevenue ?? 0)}</p></div>
              <div><span className="text-muted-foreground">Avg Monthly Enrollments</span><p className="font-semibold">{s?.avgMonthlyEnrollments ?? 0}</p></div>
              <div><span className="text-muted-foreground">Regression Slope</span><p className="font-semibold">{s?.regressionSlope ?? 0}</p></div>
              <div><span className="text-muted-foreground">Revenue R²</span><p className="font-semibold">{c?.revenueRSquared ?? 0}</p></div>
              <div><span className="text-muted-foreground">Enrollment R²</span><p className="font-semibold">{c?.enrollmentRSquared ?? 0}</p></div>
              <div><span className="text-muted-foreground">Coeff. of Variation</span><p className="font-semibold">{c?.coefficientOfVariation ?? 0}</p></div>
            </div>
          </CardContent></Card>
        </>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminRevenueFinance() {
  const { formatAmount } = useCurrency()
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => { setRefreshing(false); toast.success('Data refreshed') }, 800)
  }, [])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={springTransition} className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
            <DollarSign className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Revenue & Finance</h1>
            <p className="text-sm text-muted-foreground">Track revenue, manage payouts, and analyze financial data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="rounded-lg gap-1.5 h-9"><Download className="size-3.5" /><span className="hidden sm:inline">Export</span><ChevronDown className="size-3" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent><DropdownMenuItem onClick={() => window.open('/api/admin/finance/export?format=csv', '_blank')}><FileDown className="size-3.5 mr-2" /> Export CSV</DropdownMenuItem><DropdownMenuItem onClick={() => window.open('/api/admin/finance/export?format=json', '_blank')}><FileText className="size-3.5 mr-2" /> Export JSON</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" className="rounded-lg h-9" onClick={handleRefresh} disabled={refreshing}><RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} /></Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <ScrollArea className="w-full">
          <TabsList className="w-full justify-start gap-1 bg-muted/50 p-1 rounded-xl overflow-x-auto">
            {[
              { value: 'overview', label: 'Overview', icon: <BarChart3 className="size-3.5" /> },
              { value: 'transactions', label: 'Transactions', icon: <Receipt className="size-3.5" /> },
              { value: 'revenue-split', label: 'Revenue Split', icon: <Scale className="size-3.5" /> },
              { value: 'refunds', label: 'Refunds', icon: <ArrowRight className="size-3.5" /> },
              { value: 'disputes', label: 'Disputes', icon: <AlertTriangle className="size-3.5" /> },
              { value: 'tax-reports', label: 'Tax Reports', icon: <FileText className="size-3.5" /> },
              { value: 'settings', label: 'Settings', icon: <Settings className="size-3.5" /> },
              { value: 'forecasting', label: 'Forecasting', icon: <Sparkles className="size-3.5" /> },
            ].map(t => (
              <TabsTrigger key={t.value} value={t.value} className="rounded-lg gap-1.5 text-[12px] px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                {t.icon}{t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            <TabsContent value="overview" className="mt-5"><OverviewTab /></TabsContent>
            <TabsContent value="transactions" className="mt-5"><TransactionsTab /></TabsContent>
            <TabsContent value="revenue-split" className="mt-5"><RevenueSplitTab /></TabsContent>
            <TabsContent value="refunds" className="mt-5"><RefundsTab /></TabsContent>
            <TabsContent value="disputes" className="mt-5"><DisputesTab /></TabsContent>
            <TabsContent value="tax-reports" className="mt-5"><TaxReportsTab /></TabsContent>
            <TabsContent value="settings" className="mt-5"><FinancialSettingsTab /></TabsContent>
            <TabsContent value="forecasting" className="mt-5"><ForecastingTab /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  )
}

export function AdminRevenueFinanceWrapped() {
  return (
    <CurrencyProvider>
      <AdminRevenueFinance />
    </CurrencyProvider>
  )
}
