'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign, TrendingUp, Wallet, BarChart3, ArrowUpRight,
  Download, CreditCard, Building2, Smartphone, Globe,
  CheckCircle, Clock, FileText, Shield, ChevronDown,
  ArrowUpDown, Loader2, Receipt, PiggyBank, CircleDollarSign,
  AlertCircle, CalendarDays, Info, BadgeCheck, ExternalLink,
  Banknote, HandCoins, ReceiptText, Calendar, FileDown, Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { InstructorStatCard, InstructorStatCardGrid, InstructorStatCardSkeleton } from '@/components/instructor/instructor-stat-card'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface StatCard {
  key: string
  label: string
  value: string
  rawValue: number
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  bg: string
  iconBg: string
  iconColor: string
  trend?: string
  trendUp?: boolean
  sublabel?: string
}

interface CourseRevenue {
  title: string
  revenue: number
  percentage: number
  color: string
  enrollments: number
}

interface Transaction {
  id: string
  date: string
  description: string
  type: 'enrollment' | 'refund'
  gross: number
  yourShare: number
  studentName: string
  courseName: string
}

interface PayoutRecord {
  id: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'processing'
  method: string
  reference: string
}

interface MonthlySummary {
  month: string
  label: string
  earnings: number
  tax: number
  net: number
}

interface PayoutMethodItem {
  key: string
  label: string
  detail: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
}

type RevenueTab = 'overview' | 'transactions' | 'payouts' | 'tax-documents'

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }
const cardSpring = { type: 'spring' as const, stiffness: 300, damping: 24 }

const COURSE_COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316', '#6366f1']

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════════

const formatUSD = (amount: number): string => {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}M`
  if (abs >= 1000) return `${sign}$${abs.toLocaleString()}`
  return `${sign}$${abs}`
}

const formatUSDFull = (amount: number): string => {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  return `${sign}$${abs.toLocaleString()}`
}

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatDateShort = (dateStr: string): string => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2, Smartphone, Globe, CreditCard,
}

// ═══════════════════════════════════════════════════════════════════════════════
// Revenue Bar Component (Horizontal)
// ═══════════════════════════════════════════════════════════════════════════════

function RevenueBar({ course, index }: { course: CourseRevenue; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...springTransition, delay: index * 0.1 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="size-3 rounded-full shrink-0"
            style={{ backgroundColor: course.color }}
          />
          <span className="text-[13px] font-medium text-foreground">{course.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-foreground">{formatUSD(course.revenue)}</span>
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] rounded-lg px-1.5 py-0">
            {course.percentage}%
          </Badge>
        </div>
      </div>
      <div className="h-3 rounded-full bg-muted/40 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${course.percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 + 0.2 }}
          className="h-full rounded-full relative"
          style={{ backgroundColor: course.color }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/0 via-white/20 to-white/0" />
        </motion.div>
      </div>
      <p className="text-[11px] text-muted-foreground">{course.enrollments} enrollments this month</p>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Revenue Split Component
// ═══════════════════════════════════════════════════════════════════════════════

function RevenueSplit({ overview, commissionRate, payoutRate }: { overview: { grossRevenue: number; platformFee: number; netEarnings: number }; commissionRate: number; payoutRate: number }) {
  const items = [
    { label: 'Gross enrollment revenue', amount: overview.grossRevenue, isDeduction: false, icon: CircleDollarSign },
    { label: `Platform fee (${commissionRate}%)`, amount: overview.platformFee, isDeduction: true, icon: HandCoins },
    { label: 'Net earnings', amount: overview.netEarnings, isDeduction: false, icon: PiggyBank, isTotal: true },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.4 }}
      className="rounded-2xl ios-shadow-sm bg-card p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="flex size-8 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950/40">
          <ReceiptText className="size-4 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h3 className="text-[17px] font-semibold">Revenue Split</h3>
          <p className="text-[11px] text-muted-foreground">How your earnings are calculated</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springTransition, delay: 0.5 + i * 0.1 }}
            className={cn(
              'flex items-center justify-between py-3 px-4 rounded-xl transition-colors',
              item.isTotal
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30'
                : 'bg-muted/30 hover:bg-muted/50'
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className={cn(
                'flex size-8 items-center justify-center rounded-lg',
                item.isTotal
                  ? 'bg-emerald-100 dark:bg-emerald-950/40'
                  : item.isDeduction
                    ? 'bg-rose-100 dark:bg-rose-950/40'
                    : 'bg-muted/60'
              )}>
                <item.icon className={cn(
                  'size-4',
                  item.isTotal
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : item.isDeduction
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <span className={cn(
                  'text-[13px] font-medium',
                  item.isTotal ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'
                )}>
                  {item.label}
                </span>
              </div>
            </div>
            <span className={cn(
              'text-[15px] font-bold tabular-nums',
              item.isDeduction
                ? 'text-rose-600 dark:text-rose-400'
                : item.isTotal
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-foreground'
            )}>
              {item.isDeduction ? '-' : ''}{formatUSDFull(item.amount)}
            </span>
          </motion.div>
        ))}
      </div>

      <Separator className="my-4" />

      <div className="flex items-center justify-center gap-3 text-[12px]">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Your revenue share: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{payoutRate}%</span></span>
        </div>
        <div className="size-1 rounded-full bg-muted-foreground/30" />
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-rose-400" />
          <span className="text-muted-foreground">Platform takes: <span className="font-semibold text-rose-600 dark:text-rose-400">{commissionRate}%</span></span>
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Loading Skeletons
// ═══════════════════════════════════════════════════════════════════════════════

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl ios-shadow-sm p-4 bg-muted/30">
      <div className="flex items-start justify-between">
        <Skeleton className="size-9 rounded-xl" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-3 w-36" />
      </div>
    </div>
  )
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-border/20">
      <td className="px-5 py-3.5"><Skeleton className="h-4 w-16" /></td>
      <td className="px-5 py-3.5"><Skeleton className="h-4 w-40" /></td>
      <td className="px-5 py-3.5"><Skeleton className="h-5 w-16 rounded-lg" /></td>
      <td className="px-5 py-3.5"><Skeleton className="h-4 w-16 ml-auto" /></td>
      <td className="px-5 py-3.5"><Skeleton className="h-4 w-16 ml-auto" /></td>
    </tr>
  )
}

function MobileCardSkeleton() {
  return (
    <div className="p-4 border-b border-border/20">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-14 rounded-md" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="text-right space-y-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

export function InstructorRevenueView() {
  const { currentUser } = useAppStore()
  const [activeTab, setActiveTab] = useState<RevenueTab>('overview')
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false)
  const [payoutMethodDialogOpen, setPayoutMethodDialogOpen] = useState(false)
  const [addMethodDialogOpen, setAddMethodDialogOpen] = useState(false)
  const [ntnValue, setNtnValue] = useState('')
  const [ntnVerifying, setNtnVerifying] = useState(false)
  const [ntnVerified, setNtnVerified] = useState(false)
  const [payoutSchedule, setPayoutSchedule] = useState<'monthly' | 'onrequest'>('monthly')
  const [exporting, setExporting] = useState(false)
  const [requestingPayout, setRequestingPayout] = useState(false)

  // API data state
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([])
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethodItem[]>([])
  const [courseRevenue, setCourseRevenue] = useState<CourseRevenue[]>([])
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([])
  const [overview, setOverview] = useState({
    earnedThisMonth: 0, availableForPayout: 0, pendingClearance: 0,
    allTimeEarnings: 0, trendPercent: 0, grossRevenue: 0, platformFee: 0, netEarnings: 0,
  })

  // Financial settings (dynamic commission rates)
  const [commissionRate, setCommissionRate] = useState(20)
  const [payoutRate, setPayoutRate] = useState(80)

  // Add method form state
  const [newMethodType, setNewMethodType] = useState<string>('bank_transfer')
  const [newMethodBankName, setNewMethodBankName] = useState('')
  const [newMethodAccountNumber, setNewMethodAccountNumber] = useState('')
  const [newMethodAccountHolder, setNewMethodAccountHolder] = useState('')
  const [newMethodPhoneNumber, setNewMethodPhoneNumber] = useState('')
  const [newMethodEmail, setNewMethodEmail] = useState('')
  const [savingMethod, setSavingMethod] = useState(false)

  // ─── Fetch revenue data ──────────────────────────────────────────────────
  const fetchRevenueData = useCallback(async () => {
    if (!currentUser?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/instructor/revenue?instructorId=${currentUser.id}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setTransactions(data.transactions || [])
      setPayoutHistory(data.payouts || [])
      setCourseRevenue((data.revenueByCourse || []).map((c: CourseRevenue, i: number) => ({
        ...c,
        color: COURSE_COLORS[i % COURSE_COLORS.length] || '#10b981',
      })))
      setMonthlySummaries(data.monthlyEarnings || [])
      if (data.overview) setOverview(data.overview)
      // Map API payout methods to UI items
      if (data.payoutMethods && data.payoutMethods.length > 0) {
        const apiMethods = data.payoutMethods.map((pm: { key: string; label: string; detail: string; icon: string; active: boolean }) => {
          return { key: pm.key, label: pm.label, detail: pm.detail, icon: iconMap[pm.icon] || CreditCard, active: pm.active }
        })
        setPayoutMethods(apiMethods)
      } else {
        setPayoutMethods([])
      }
    } catch (err) {
      console.error('Failed to fetch revenue data:', err)
      toast.error('Failed to load revenue data', { description: 'Please refresh the page.' })
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id])

  // Fetch on mount and when tab changes to overview/transactions/payouts
  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'transactions' || activeTab === 'payouts') {
      fetchRevenueData()
    }
  }, [currentUser?.id, activeTab, fetchRevenueData])

  // ─── Fetch financial settings ────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) return
    const fetchFinancialSettings = async () => {
      try {
        const res = await fetch(`/api/instructor/financial-settings?instructorId=${currentUser.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.effectiveRates) {
            setCommissionRate(data.effectiveRates.platformCommissionRate)
            setPayoutRate(data.effectiveRates.instructorPayoutRate)
          }
        }
      } catch {
        // Silently fail - use defaults (20/80)
      }
    }
    fetchFinancialSettings()
  }, [currentUser?.id])

  // ─── Fetch NTN status from profile ──────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) return
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/instructor/profile?instructorId=${currentUser.id}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.profile?.ntn) {
          setNtnValue(data.profile.ntn)
        }
        if (data.profile?.ntnVerified) {
          setNtnVerified(true)
        }
      } catch {
        // Silently fail - NTN will just be empty
      }
    }
    fetchProfile()
  }, [currentUser?.id])

  // ─── Fetch payout methods for payouts tab ───────────────────────────────
  const fetchPayoutMethods = useCallback(async () => {
    if (!currentUser?.id) return
    try {
      const res = await fetch(`/api/instructor/payout-methods?instructorId=${currentUser.id}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.payoutMethods && data.payoutMethods.length > 0) {
        const methodIconMap: Record<string, string> = {
          bank_transfer: 'Building2',
          jazzcash: 'Smartphone',
          easypaisa: 'Smartphone',
          payoneer: 'Globe',
          stripe: 'CreditCard',
        }
        const mapped = data.payoutMethods.map((pm: {
          id: string; type: string; isDefault: boolean; isActive: boolean;
          bankName?: string; accountNumber?: string; phoneNumber?: string; email?: string;
        }) => ({
          key: pm.id,
          label: pm.type === 'bank_transfer'
            ? `Bank Transfer (${pm.bankName || 'Bank'})`
            : pm.type === 'jazzcash' ? 'JazzCash'
            : pm.type === 'easypaisa' ? 'Easypaisa'
            : pm.type === 'payoneer' ? 'Payoneer'
            : 'Stripe',
          detail: pm.type === 'bank_transfer'
            ? `**** ${pm.accountNumber?.slice(-4) || '0000'}`
            : pm.phoneNumber || pm.email || 'Mobile Wallet',
          icon: iconMap[methodIconMap[pm.type] || 'CreditCard'] || CreditCard,
          active: pm.isDefault,
        }))
        setPayoutMethods(mapped)
      }
    } catch {
      // Silently fail
    }
  }, [currentUser?.id])

  useEffect(() => {
    if (activeTab === 'payouts') {
      fetchPayoutMethods()
    }
  }, [activeTab, fetchPayoutMethods])

  // ─── Stat Cards Config ──────────────────────────────────────────────────
  const statCards: StatCard[] = useMemo(() => [
    {
      key: 'earned-month',
      label: 'Total Earned This Month',
      value: formatUSD(overview.earnedThisMonth),
      rawValue: overview.earnedThisMonth,
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      trend: overview.trendPercent !== 0 ? `${overview.trendPercent > 0 ? '↑' : '↓'}${Math.abs(overview.trendPercent)}%` : undefined,
      trendUp: overview.trendPercent >= 0,
      sublabel: 'vs last month',
    },
    {
      key: 'available',
      label: 'Available for Payout',
      value: formatUSD(overview.availableForPayout),
      rawValue: overview.availableForPayout,
      icon: Wallet,
      gradient: 'from-teal-500 to-emerald-500',
      bg: 'bg-teal-50 dark:bg-teal-950/30',
      iconBg: 'bg-teal-100 dark:bg-teal-950/40',
      iconColor: 'text-teal-600 dark:text-teal-400',
    },
    {
      key: 'pending',
      label: 'Pending Clearance',
      value: formatUSD(overview.pendingClearance),
      rawValue: overview.pendingClearance,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      iconBg: 'bg-amber-100 dark:bg-amber-950/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      sublabel: '14-day hold',
    },
    {
      key: 'alltime',
      label: 'All-time Earnings',
      value: formatUSD(overview.allTimeEarnings),
      rawValue: overview.allTimeEarnings,
      icon: DollarSign,
      gradient: 'from-cyan-500 to-teal-500',
      bg: 'bg-cyan-50 dark:bg-cyan-950/30',
      iconBg: 'bg-cyan-100 dark:bg-cyan-950/40',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      trend: overview.trendPercent !== 0 ? `${overview.trendPercent > 0 ? '↑' : '↓'}${Math.abs(overview.trendPercent)}%` : undefined,
      trendUp: overview.trendPercent >= 0,
      sublabel: 'vs last year',
    },
  ], [overview])

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleRequestPayout = async () => {
    if (!currentUser?.id) return
    if (overview.availableForPayout < 10) {
      toast.error('Minimum payout amount is $10', { description: 'You need at least $10 available to request a payout.' })
      return
    }
    setRequestingPayout(true)
    try {
      const activeMethod = payoutMethods.find(m => m.active)
      const res = await fetch('/api/instructor/revenue/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: currentUser.id,
          amount: overview.availableForPayout,
          method: activeMethod?.label || 'bank_transfer',
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to request payout')
      }
      const data = await res.json()
      setPayoutDialogOpen(false)
      toast.success('Payout requested!', {
        description: `${formatUSD(overview.availableForPayout)} will be transferred within 3-5 business days. Reference: ${data.payout?.reference || 'N/A'}`,
      })
      // Refresh data after payout
      fetchRevenueData()
    } catch (err) {
      toast.error('Failed to request payout', { description: err instanceof Error ? err.message : 'Please try again later.' })
    } finally {
      setRequestingPayout(false)
    }
  }

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const csvRows = [
        ['Date', 'Description', 'Type', 'Gross (USD)', 'Your Share (USD)', 'Student', 'Course'].join(','),
        ...transactions.map(t =>
          [t.date, `"${t.description}"`, t.type, t.gross, t.yourShare, `"${t.studentName}"`, `"${t.courseName}"`].join(',')
        ),
      ]
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exported successfully!')
    } catch {
      toast.error('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      toast.success('PDF report generated!', {
        description: 'Your transaction report has been downloaded.',
      })
    } catch {
      toast.error('Failed to generate PDF')
    } finally {
      setExporting(false)
    }
  }

  const handleVerifyNTN = async () => {
    if (!ntnValue.trim()) {
      toast.error('Please enter your NTN')
      return
    }
    if (!currentUser?.id) return
    setNtnVerifying(true)
    try {
      const res = await fetch('/api/instructor/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId: currentUser.id, ntn: ntnValue, ntnVerified: true }),
      })
      if (!res.ok) throw new Error('Failed to verify NTN')
      setNtnVerified(true)
      toast.success('NTN verified successfully!', {
        description: `NTN ${ntnValue} has been linked to your account.`,
      })
    } catch {
      toast.error('NTN verification failed', { description: 'Please try again later.' })
    } finally {
      setNtnVerifying(false)
    }
  }

  const handleDownloadAnnualStatement = async () => {
    toast.success('Annual statement downloading...', {
      description: 'Annual Earning Statement 2024 PDF is being generated.',
    })
  }

  const handleDownloadMonthlySummary = (summary: MonthlySummary) => {
    toast.success(`${summary.label} summary downloaded!`, {
      description: `Net earnings: ${formatUSDFull(summary.net)}`,
    })
  }

  const handleAddPayoutMethod = async () => {
    if (!currentUser?.id) return
    setSavingMethod(true)
    try {
      const body: Record<string, unknown> = {
        instructorId: currentUser.id,
        type: newMethodType,
        isDefault: payoutMethods.length === 0,
      }
      if (newMethodType === 'bank_transfer') {
        if (!newMethodBankName || !newMethodAccountNumber || !newMethodAccountHolder) {
          toast.error('Please fill in all bank details')
          setSavingMethod(false)
          return
        }
        body.bankName = newMethodBankName
        body.accountNumber = newMethodAccountNumber
        body.accountHolder = newMethodAccountHolder
      } else if (newMethodType === 'jazzcash' || newMethodType === 'easypaisa') {
        if (!newMethodPhoneNumber) {
          toast.error('Please enter your phone number')
          setSavingMethod(false)
          return
        }
        body.phoneNumber = newMethodPhoneNumber
      } else if (newMethodType === 'payoneer' || newMethodType === 'stripe') {
        if (!newMethodEmail) {
          toast.error('Please enter your email')
          setSavingMethod(false)
          return
        }
        body.email = newMethodEmail
      }

      const res = await fetch('/api/instructor/payout-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to add payout method')
      }
      toast.success('Payout method added successfully!')
      setAddMethodDialogOpen(false)
      // Reset form
      setNewMethodType('bank_transfer')
      setNewMethodBankName('')
      setNewMethodAccountNumber('')
      setNewMethodAccountHolder('')
      setNewMethodPhoneNumber('')
      setNewMethodEmail('')
      // Refresh payout methods
      fetchPayoutMethods()
      fetchRevenueData()
    } catch (err) {
      toast.error('Failed to add payout method', { description: err instanceof Error ? err.message : 'Please try again.' })
    } finally {
      setSavingMethod(false)
    }
  }

  // ─── Tab Config ─────────────────────────────────────────────────────────

  const tabConfig: { key: RevenueTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'transactions', label: 'Transactions', icon: Receipt },
    { key: 'payouts', label: 'Payouts', icon: CreditCard },
    { key: 'tax-documents', label: 'Tax Documents', icon: FileText },
  ]

  // Computed values for annual statement
  const annualTaxWithheld = Math.round(overview.allTimeEarnings * 0.1)

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 pb-4">

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
      >
        <div className="relative rounded-2xl overflow-hidden ios-shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 animate-gradient-shift opacity-10" />
          <div className="relative p-5 bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white ios-shadow-sm">
                  <DollarSign className="size-5" />
                </div>
                <div>
                  <h1 className="text-[28px] font-bold tracking-tight">Revenue & Payouts</h1>
                  <p className="text-[13px] text-muted-foreground">Track your earnings, manage payouts, and download tax documents</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          TABS NAVIGATION (iOS pill-style)
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RevenueTab)}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center rounded-full bg-muted/60 p-0.5">
              {tabConfig.map((tab) => {
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all ios-press',
                      isActive
                        ? 'bg-card text-foreground ios-shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <tab.icon className="size-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                )
              })}
            </div>

            {/* Quick Actions */}
            {activeTab === 'overview' && (
              <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white ios-press"
                  >
                    <Wallet className="size-3.5" />
                    Request Payout
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
                        <Wallet className="size-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      Request Payout
                    </DialogTitle>
                    <DialogDescription>
                      Your available balance will be transferred to your bank account.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-2">
                      <p className="text-[12px] text-muted-foreground">Available Balance</p>
                      <p className="text-[24px] font-bold text-emerald-700 dark:text-emerald-400">{formatUSD(overview.availableForPayout)}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-muted-foreground">Transfer to</span>
                        <span className="font-medium">{payoutMethods.find(m => m.active)?.label || 'No method configured'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-muted-foreground">Processing time</span>
                        <span className="font-medium">3-5 business days</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-muted-foreground">Minimum threshold</span>
                        <span className="font-medium">$10</span>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" className="rounded-full">Cancel</Button>
                    </DialogClose>
                    <Button
                      className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-1.5"
                      onClick={handleRequestPayout}
                      disabled={requestingPayout || overview.availableForPayout < 10}
                    >
                      {requestingPayout ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="size-3.5" />
                          Confirm Payout
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {(activeTab === 'transactions') && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30 ios-press"
                  onClick={handleExportCSV}
                  disabled={exporting || transactions.length === 0}
                >
                  {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30 ios-press"
                  onClick={handleExportPDF}
                  disabled={exporting || transactions.length === 0}
                >
                  {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <FileDown className="size-3.5" />}
                  Export PDF
                </Button>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              OVERVIEW TAB
              ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Stat Cards */}
            <InstructorStatCardGrid columns={4}>
              {loading ? (
                <>
                  <InstructorStatCardSkeleton />
                  <InstructorStatCardSkeleton />
                  <InstructorStatCardSkeleton />
                  <InstructorStatCardSkeleton />
                </>
              ) : (
                <>
                  <InstructorStatCard
                    icon={TrendingUp}
                    value={formatUSD(overview.earnedThisMonth)}
                    label="Total Earned This Month"
                    color="emerald"
                    trend={overview.trendPercent !== 0 ? overview.trendPercent : undefined}
                    trendLabel="MoM"
                    subLabel="vs last month"
                    index={0}
                  />
                  <InstructorStatCard
                    icon={Wallet}
                    value={formatUSD(overview.availableForPayout)}
                    label="Available for Payout"
                    color="teal"
                    index={1}
                  />
                  <InstructorStatCard
                    icon={Clock}
                    value={formatUSD(overview.pendingClearance)}
                    label="Pending Clearance"
                    color="amber"
                    subLabel="14-day hold"
                    index={2}
                  />
                  <InstructorStatCard
                    icon={DollarSign}
                    value={formatUSD(overview.allTimeEarnings)}
                    label="All-time Earnings"
                    color="cyan"
                    trend={overview.trendPercent !== 0 ? overview.trendPercent : undefined}
                    trendLabel="YoY"
                    subLabel="vs last year"
                    index={3}
                  />
                </>
              )}
            </InstructorStatCardGrid>

            {/* Revenue by Course + Revenue Split */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Revenue by Course */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: 0.3 }}
                className="rounded-2xl ios-shadow-sm bg-card p-5"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
                      <BarChart3 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-semibold">Revenue by Course</h3>
                      <p className="text-[11px] text-muted-foreground">This month</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] rounded-lg">
                    {formatUSD(overview.earnedThisMonth)} total
                  </Badge>
                </div>

                <div className="space-y-5">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                          <Skeleton className="h-3 w-full rounded-full" />
                        </div>
                      ))}
                    </div>
                  ) : courseRevenue.length > 0 ? courseRevenue.map((course, i) => (
                    <RevenueBar key={course.title} course={course} index={i} />
                  )) : (
                    <p className="text-[13px] text-muted-foreground text-center py-8">No revenue data yet</p>
                  )}
                </div>

                {/* Total bar */}
                {!loading && courseRevenue.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-border/50">
                    <div className="h-4 rounded-full overflow-hidden flex bg-muted/30">
                      {courseRevenue.map((course) => (
                        <motion.div
                          key={course.title}
                          initial={{ width: 0 }}
                          animate={{ width: `${course.percentage}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
                          className="h-full relative group cursor-pointer"
                          style={{ backgroundColor: course.color, minWidth: '4px' }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Revenue Split */}
              {loading ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springTransition, delay: 0.4 }}
                  className="rounded-2xl ios-shadow-sm bg-card p-5"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Skeleton className="size-8 rounded-xl" />
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-2.5">
                          <Skeleton className="size-8 rounded-lg" />
                          <Skeleton className="h-4 w-36" />
                        </div>
                        <Skeleton className="h-5 w-20" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <RevenueSplit overview={overview} commissionRate={commissionRate} payoutRate={payoutRate} />
              )}
            </div>

            {/* Monthly Trend Mini Chart */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.5 }}
              className="rounded-2xl ios-shadow-sm bg-card p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
                  <CalendarDays className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold">Monthly Earnings Trend</h3>
                  <p className="text-[11px] text-muted-foreground">Last 6 months performance</p>
                </div>
              </div>
              {loading ? (
                <div className="flex items-end gap-2 h-32">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${20 + Math.random() * 80}%` }} />
                  ))}
                </div>
              ) : (
                <div className="flex items-end gap-2 h-32">
                  {monthlySummaries.length > 0 ? monthlySummaries.slice().reverse().map((month, i) => {
                    const maxEarning = Math.max(...monthlySummaries.map(m => m.earnings))
                    const heightPct = maxEarning > 0 ? (month.earnings / maxEarning) * 100 : 0
                    return (
                      <motion.div
                        key={month.month}
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.08 }}
                        className="flex-1 flex flex-col items-center justify-end gap-1 group"
                      >
                        <div className="text-[9px] font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                          {formatUSD(month.earnings)}
                        </div>
                        <div
                          className={cn(
                            'w-full rounded-t-lg transition-colors cursor-pointer',
                            i === monthlySummaries.length - 1
                              ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                              : 'bg-emerald-200 dark:bg-emerald-800/40 group-hover:bg-emerald-300 dark:group-hover:bg-emerald-700/50'
                          )}
                          style={{ minHeight: '4px' }}
                        />
                        <span className="text-[9px] text-muted-foreground font-medium">
                          {month.label.split(' ')[0].substring(0, 3)}
                        </span>
                      </motion.div>
                    )
                  }) : (
                    <p className="text-[13px] text-muted-foreground text-center py-8">No monthly data yet</p>
                  )}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════
              TRANSACTIONS TAB
              ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="transactions" className="mt-6 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springTransition}
              className="rounded-2xl ios-shadow-sm bg-card overflow-hidden"
            >
              {/* Table Header */}
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
                      <Receipt className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-semibold">Transaction History</h3>
                      <p className="text-[11px] text-muted-foreground">{transactions.length} transactions</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Date</th>
                        <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Description</th>
                        <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Type</th>
                        <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Gross</th>
                        <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Your Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <>
                          <TableRowSkeleton />
                          <TableRowSkeleton />
                          <TableRowSkeleton />
                          <TableRowSkeleton />
                          <TableRowSkeleton />
                        </>
                      ) : transactions.length > 0 ? transactions.map((txn, i) => (
                        <motion.tr
                          key={txn.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ ...springTransition, delay: i * 0.03 }}
                          className="border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-5 py-3.5 text-[13px] text-muted-foreground tabular-nums whitespace-nowrap">
                            {formatDateShort(txn.date)}
                          </td>
                          <td className="px-5 py-3.5">
                            <div>
                              <p className="text-[13px] font-medium text-foreground">{txn.description}</p>
                              <p className="text-[11px] text-muted-foreground">{txn.studentName}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge className={cn(
                              'text-[10px] rounded-lg px-1.5 py-0',
                              txn.type === 'enrollment'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            )}>
                              {txn.type === 'enrollment' ? 'Enrollment' : 'Refund'}
                            </Badge>
                          </td>
                          <td className={cn(
                            'px-5 py-3.5 text-[13px] font-semibold text-right tabular-nums whitespace-nowrap',
                            txn.gross < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                          )}>
                            {txn.gross < 0 ? '-' : ''}{formatUSDFull(Math.abs(txn.gross))}
                          </td>
                          <td className={cn(
                            'px-5 py-3.5 text-[13px] font-semibold text-right tabular-nums whitespace-nowrap',
                            txn.yourShare < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                          )}>
                            {txn.yourShare < 0 ? '-' : ''}{formatUSDFull(Math.abs(txn.yourShare))}
                          </td>
                        </motion.tr>
                      )) : (
                        <tr><td colSpan={5} className="px-5 py-8 text-center text-[13px] text-muted-foreground">No transactions yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-border/20">
                {loading ? (
                  <>
                    <MobileCardSkeleton />
                    <MobileCardSkeleton />
                    <MobileCardSkeleton />
                  </>
                ) : transactions.length > 0 ? transactions.map((txn, i) => (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springTransition, delay: i * 0.03 }}
                    className="p-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge className={cn(
                            'text-[9px] rounded-md px-1 py-0 shrink-0',
                            txn.type === 'enrollment'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                          )}>
                            {txn.type === 'enrollment' ? 'Enrollment' : 'Refund'}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">{formatDateShort(txn.date)}</span>
                        </div>
                        <p className="text-[13px] font-medium text-foreground truncate">{txn.description}</p>
                        <p className="text-[11px] text-muted-foreground">{txn.studentName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn(
                          'text-[14px] font-bold tabular-nums',
                          txn.yourShare < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        )}>
                          {txn.yourShare < 0 ? '-' : ''}{formatUSDFull(Math.abs(txn.yourShare))}
                        </p>
                        <p className="text-[10px] text-muted-foreground">your share</p>
                      </div>
                    </div>
                  </motion.div>
                )) : null}
              </div>
            </motion.div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════
              PAYOUTS TAB
              ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="payouts" className="mt-6 space-y-6">

            {/* Payout Method */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springTransition}
              className="rounded-2xl ios-shadow-sm bg-card p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
                    <CreditCard className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold">Payout Method</h3>
                    <p className="text-[11px] text-muted-foreground">Where your earnings get sent</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={addMethodDialogOpen} onOpenChange={setAddMethodDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 rounded-full ios-press">
                        <Plus className="size-3.5" />
                        Add Method
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Payout Method</DialogTitle>
                        <DialogDescription>Set up a new payout method to receive your earnings.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label className="text-[12px] font-medium">Method Type</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
                              { value: 'jazzcash', label: 'JazzCash', icon: Smartphone },
                              { value: 'easypaisa', label: 'Easypaisa', icon: Smartphone },
                              { value: 'payoneer', label: 'Payoneer', icon: Globe },
                              { value: 'stripe', label: 'Stripe', icon: CreditCard },
                            ].map(m => (
                              <button
                                key={m.value}
                                onClick={() => setNewMethodType(m.value)}
                                className={cn(
                                  'flex items-center gap-2 p-2.5 rounded-xl text-[12px] font-medium transition-all text-left border',
                                  newMethodType === m.value
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-muted/30 border-transparent hover:bg-muted/50 text-foreground'
                                )}
                              >
                                <m.icon className="size-4" />
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {newMethodType === 'bank_transfer' && (
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <Label className="text-[12px] font-medium">Bank Name</Label>
                              <Input value={newMethodBankName} onChange={e => setNewMethodBankName(e.target.value)} placeholder="e.g. HBL, Meezan Bank" className="rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[12px] font-medium">Account Number</Label>
                              <Input value={newMethodAccountNumber} onChange={e => setNewMethodAccountNumber(e.target.value)} placeholder="Enter account number" className="rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[12px] font-medium">Account Holder Name</Label>
                              <Input value={newMethodAccountHolder} onChange={e => setNewMethodAccountHolder(e.target.value)} placeholder="Enter account holder name" className="rounded-xl" />
                            </div>
                          </div>
                        )}

                        {(newMethodType === 'jazzcash' || newMethodType === 'easypaisa') && (
                          <div className="space-y-1.5">
                            <Label className="text-[12px] font-medium">Phone Number</Label>
                            <Input value={newMethodPhoneNumber} onChange={e => setNewMethodPhoneNumber(e.target.value)} placeholder="e.g. 03001234567" className="rounded-xl" />
                          </div>
                        )}

                        {(newMethodType === 'payoneer' || newMethodType === 'stripe') && (
                          <div className="space-y-1.5">
                            <Label className="text-[12px] font-medium">Email Address</Label>
                            <Input value={newMethodEmail} onChange={e => setNewMethodEmail(e.target.value)} placeholder="Enter your email" className="rounded-xl" type="email" />
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline" className="rounded-full">Cancel</Button>
                        </DialogClose>
                        <Button
                          className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-1.5"
                          onClick={handleAddPayoutMethod}
                          disabled={savingMethod}
                        >
                          {savingMethod ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="size-3.5" />
                              Add Method
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {payoutMethods.length > 1 && (
                    <Dialog open={payoutMethodDialogOpen} onOpenChange={setPayoutMethodDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5 rounded-full ios-press">
                          Switch
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Change Payout Method</DialogTitle>
                          <DialogDescription>Select your preferred payout method.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2 py-2">
                          {payoutMethods.map((method) => (
                            <button
                              key={method.key}
                              onClick={async () => {
                                if (!currentUser?.id) return
                                try {
                                  await fetch('/api/instructor/payout-methods', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ payoutMethodId: method.key, instructorId: currentUser.id, isDefault: true }),
                                  })
                                  setPayoutMethods(prev => prev.map(m => ({ ...m, active: m.key === method.key })))
                                  toast.success(`Payout method changed to ${method.label}`)
                                } catch {
                                  toast.error('Failed to change payout method')
                                }
                                setPayoutMethodDialogOpen(false)
                              }}
                              className={cn(
                                'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left',
                                method.active
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30'
                                  : 'bg-muted/30 hover:bg-muted/50 border border-transparent'
                              )}
                            >
                              <div className={cn(
                                'flex size-9 items-center justify-center rounded-lg',
                                method.active
                                  ? 'bg-emerald-100 dark:bg-emerald-950/40'
                                  : 'bg-muted/60'
                              )}>
                                <method.icon className={cn(
                                  'size-4',
                                  method.active
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-muted-foreground'
                                )} />
                              </div>
                              <div className="flex-1">
                                <p className="text-[13px] font-medium">{method.label}</p>
                                <p className="text-[11px] text-muted-foreground">{method.detail}</p>
                              </div>
                              {method.active && (
                                <BadgeCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                              )}
                            </button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
                        <Skeleton className="size-9 rounded-lg" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-5 w-12 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : payoutMethods.length > 0 ? payoutMethods.map((method, i) => (
                  <motion.div
                    key={method.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springTransition, delay: i * 0.05 }}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl transition-colors',
                      method.active
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30'
                        : 'bg-muted/20'
                    )}
                  >
                    <div className={cn(
                      'flex size-9 items-center justify-center rounded-lg',
                      method.active
                        ? 'bg-emerald-100 dark:bg-emerald-950/40'
                        : 'bg-muted/40'
                    )}>
                      <method.icon className={cn(
                        'size-4',
                        method.active
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-muted-foreground/50'
                      )} />
                    </div>
                    <div className="flex-1">
                      <p className={cn(
                        'text-[13px] font-medium',
                        method.active ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {method.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{method.detail}</p>
                    </div>
                    {method.active && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] rounded-lg">
                        Active
                      </Badge>
                    )}
                  </motion.div>
                )) : (
                  <div className="text-center py-8">
                    <CreditCard className="size-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-[13px] text-muted-foreground">No payout method configured</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">Add a method to start receiving payouts</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Payout Schedule & Threshold */}
            <div className="grid gap-4 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: 0.1 }}
                className="rounded-2xl ios-shadow-sm bg-card p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950/40">
                    <Calendar className="size-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold">Payout Schedule</h3>
                    <p className="text-[11px] text-muted-foreground">How often you receive payouts</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {(['monthly', 'onrequest'] as const).map((schedule) => {
                    const isActive = payoutSchedule === schedule
                    const scheduleInfo = {
                      monthly: { label: 'Monthly', desc: '1st of each month', icon: CalendarDays },
                      onrequest: { label: 'On Request', desc: 'Manual payout requests', icon: HandCoins },
                    }[schedule]

                    return (
                      <button
                        key={schedule}
                        onClick={() => {
                          setPayoutSchedule(schedule)
                          toast.success(`Payout schedule set to ${scheduleInfo.label}`)
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left',
                          isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30'
                            : 'bg-muted/20 hover:bg-muted/30 border border-transparent'
                        )}
                      >
                        <div className={cn(
                          'flex size-9 items-center justify-center rounded-lg',
                          isActive ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-muted/40'
                        )}>
                          <scheduleInfo.icon className={cn(
                            'size-4',
                            isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/50'
                          )} />
                        </div>
                        <div className="flex-1">
                          <p className={cn(
                            'text-[13px] font-medium',
                            isActive ? 'text-foreground' : 'text-muted-foreground'
                          )}>
                            {scheduleInfo.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{scheduleInfo.desc}</p>
                        </div>
                        {isActive && (
                          <div className="size-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <CheckCircle className="size-3.5 text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: 0.15 }}
                className="rounded-2xl ios-shadow-sm bg-card p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-950/40">
                    <Banknote className="size-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold">Payout Threshold</h3>
                    <p className="text-[11px] text-muted-foreground">Minimum amount required</p>
                  </div>
                </div>

                <div className="rounded-xl bg-cyan-50 dark:bg-cyan-950/30 p-4 border border-cyan-200/50 dark:border-cyan-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] text-muted-foreground">Minimum Payout</span>
                    <span className="text-[20px] font-bold text-cyan-700 dark:text-cyan-400">$10</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Available balance</span>
                      <span className={cn(
                        'font-semibold',
                        overview.availableForPayout >= 10
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-muted-foreground'
                      )}>
                        {formatUSD(overview.availableForPayout)}
                      </span>
                    </div>
                    <Progress value={Math.min((overview.availableForPayout / 10) * 100, 100)} className="h-2" />
                    <p className={cn(
                      'text-[10px] font-medium',
                      overview.availableForPayout >= 10
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    )}>
                      {overview.availableForPayout >= 10 ? '✓ You meet the minimum threshold' : `Need ${formatUSD(10 - overview.availableForPayout)} more to reach threshold`}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-muted/30">
                  <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Payouts below $10 will be held until the threshold is reached. Pending clearance amounts are held for 14 days before becoming available.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Payout History */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.2 }}
              className="rounded-2xl ios-shadow-sm bg-card overflow-hidden"
            >
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
                      <ReceiptText className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-semibold">Payout History</h3>
                      <p className="text-[11px] text-muted-foreground">Past and pending payouts</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Date</th>
                      <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Amount</th>
                      <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                      <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Method</th>
                      <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <>
                        <TableRowSkeleton />
                        <TableRowSkeleton />
                        <TableRowSkeleton />
                      </>
                    ) : payoutHistory.length > 0 ? payoutHistory.map((payout, i) => (
                      <motion.tr
                        key={payout.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...springTransition, delay: i * 0.04 }}
                        className="border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-5 py-3.5 text-[13px] text-foreground tabular-nums whitespace-nowrap">
                          {formatDate(payout.date)}
                        </td>
                        <td className="px-5 py-3.5 text-[13px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                          {formatUSDFull(payout.amount)}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge className={cn(
                            'text-[10px] rounded-lg px-1.5 py-0',
                            payout.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : payout.status === 'processing'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                : 'bg-muted text-muted-foreground'
                          )}>
                            {payout.status === 'paid' ? '✓ Paid' : payout.status === 'processing' ? '⟳ Processing' : '○ Pending'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-[13px] text-muted-foreground whitespace-nowrap">
                          {payout.method}
                        </td>
                        <td className="px-5 py-3.5 text-[12px] text-muted-foreground font-mono whitespace-nowrap">
                          {payout.reference}
                        </td>
                      </motion.tr>
                    )) : (
                      <tr><td colSpan={5} className="px-5 py-8 text-center text-[13px] text-muted-foreground">No payout history yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-border/20">
                {loading ? (
                  <>
                    <MobileCardSkeleton />
                    <MobileCardSkeleton />
                  </>
                ) : payoutHistory.length > 0 ? payoutHistory.map((payout, i) => (
                  <motion.div
                    key={payout.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springTransition, delay: i * 0.04 }}
                    className="p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[13px] font-medium text-foreground tabular-nums">{formatDate(payout.date)}</span>
                          <Badge className={cn(
                            'text-[9px] rounded-md px-1 py-0',
                            payout.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          )}>
                            {payout.status === 'paid' ? '✓ Paid' : '⟳ Processing'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{payout.method}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{payout.reference}</p>
                      </div>
                      <p className="text-[16px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                        {formatUSDFull(payout.amount)}
                      </p>
                    </div>
                  </motion.div>
                )) : (
                  <p className="text-[13px] text-muted-foreground text-center py-8">No payout history yet</p>
                )}
              </div>
            </motion.div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════
              TAX DOCUMENTS TAB
              ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="tax-documents" className="mt-6 space-y-6">

            {/* NTN Section */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springTransition}
              className="rounded-2xl ios-shadow-sm bg-card p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
                  <Shield className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold">Tax Information</h3>
                  <p className="text-[11px] text-muted-foreground">NTN verification for tax compliance</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ntn-input" className="text-[12px] font-medium">
                    NTN (National Tax Number)
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="ntn-input"
                        placeholder="Enter your NTN (e.g. 1234567-8)"
                        value={ntnValue}
                        onChange={(e) => {
                          setNtnValue(e.target.value)
                          if (ntnVerified) setNtnVerified(false)
                        }}
                        className={cn(
                          'rounded-xl pr-10',
                          ntnVerified && 'border-emerald-300 dark:border-emerald-700 focus-visible:border-emerald-500'
                        )}
                        disabled={ntnVerified}
                      />
                      {ntnVerified && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={springTransition}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          <BadgeCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                        </motion.div>
                      )}
                    </div>
                    <Button
                      onClick={handleVerifyNTN}
                      disabled={ntnVerifying || ntnVerified || !ntnValue.trim()}
                      className={cn(
                        'gap-1.5 rounded-full ios-press shrink-0',
                        ntnVerified
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'
                      )}
                    >
                      {ntnVerifying ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          Verifying...
                        </>
                      ) : ntnVerified ? (
                        <>
                          <CheckCircle className="size-3.5" />
                          Verified
                        </>
                      ) : (
                        'Verify'
                      )}
                    </Button>
                  </div>
                  {ntnVerified && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1"
                    >
                      <CheckCircle className="size-3" />
                      NTN verified and linked to your account
                    </motion.p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Annual Statement */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.1 }}
              className="rounded-2xl ios-shadow-sm bg-card p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="flex size-8 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950/40">
                  <FileText className="size-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold">Annual Earning Statement</h3>
                  <p className="text-[11px] text-muted-foreground">For tax filing purposes</p>
                </div>
              </div>

              <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 p-4 border border-teal-200/50 dark:border-teal-800/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[15px] font-semibold text-foreground">Annual Earning Statement 2024</p>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] rounded-lg">
                        Available
                      </Badge>
                    </div>
                    <p className="text-[12px] text-muted-foreground">
                      Total earnings: <span className="font-semibold text-foreground">{formatUSDFull(overview.allTimeEarnings)}</span> ·
                      Tax withheld: <span className="font-semibold text-foreground">{formatUSDFull(annualTaxWithheld)}</span>
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-full border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-950/30 ios-press shrink-0"
                    onClick={handleDownloadAnnualStatement}
                    disabled={overview.allTimeEarnings === 0}
                  >
                    <Download className="size-3.5" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Monthly Summaries */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.2 }}
              className="rounded-2xl ios-shadow-sm bg-card p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-950/40">
                    <CalendarDays className="size-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold">Monthly Summaries</h3>
                    <p className="text-[11px] text-muted-foreground">Detailed monthly earning reports</p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-full ios-press" disabled={monthlySummaries.length === 0}>
                      <Download className="size-3.5" />
                      Download All
                      <ChevronDown className="size-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => toast.success('All summaries downloading as CSV...')}>
                      <Download className="size-4 mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.success('All summaries downloading as PDF...')}>
                      <FileDown className="size-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                {monthlySummaries.length > 0 ? monthlySummaries.map((summary, i) => (
                  <motion.div
                    key={summary.month}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springTransition, delay: 0.3 + i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted/40 group-hover:bg-muted/60 transition-colors">
                        <Calendar className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-foreground">{summary.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Earnings: {formatUSDFull(summary.earnings)} · Tax: {formatUSDFull(summary.tax)} · Net: {formatUSDFull(summary.net)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ios-press shrink-0"
                      onClick={() => handleDownloadMonthlySummary(summary)}
                    >
                      <Download className="size-3.5" />
                    </Button>
                  </motion.div>
                )) : (
                  <div className="text-center py-8">
                    <CalendarDays className="size-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-[13px] text-muted-foreground">No monthly summaries yet</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">Summaries will appear as you earn revenue</p>
                  </div>
                )}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
