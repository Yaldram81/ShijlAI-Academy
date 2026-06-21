'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, BarChart3, Loader2, AlertCircle, RefreshCw, Users, DollarSign,
  CheckCircle, Zap, Shield, HeartPulse, GraduationCap, AlertTriangle,
  Sparkles, Lightbulb, Award, TrendingUp, TrendingDown,
  BookOpen, Activity, PieChart as PieChartIcon, CreditCard, UserCheck,
  UserPlus, ChevronRight, Crown, Medal, Trophy
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AreaChart, BarChart, PieChart, ComposedChart, Area, Bar, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line
} from 'recharts'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Papa from 'papaparse'

type TabType = 'ai-insights' | 'statistics'

// ─── Format Helpers ─────────────────────────────────────────────
function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`
  return n.toLocaleString()
}

function formatUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

// ─── Chart Colors ───────────────────────────────────────────────
const USER_DIST_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#06b6d4']
const CATEGORY_COLORS: Record<string, string> = {
  IB: '#10b981', AP: '#14b8a6', Cambridge: '#06b6d4',
  IELTS: '#f59e0b', AWS: '#8b5cf6', Programming: '#ec4899', General: '#6b7280',
  Mathematics: '#10b981', Physics: '#14b8a6', Chemistry: '#06b6d4',
  Biology: '#f59e0b', English: '#8b5cf6', 'Computer Science': '#ec4899',
}
const REVENUE_BREAKDOWN_COLORS = ['#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ef4444']

// ─── Pie Label Helper ───────────────────────────────────────────
const RADIAN = Math.PI / 180
function renderCustomizedLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-semibold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ─── Insight Type Config ────────────────────────────────────────
const INSIGHT_TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string; badgeBg: string; badgeText: string }> = {
  growth: { icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40', badgeText: 'text-emerald-700 dark:text-emerald-400' },
  risk: { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', badgeBg: 'bg-red-100 dark:bg-red-900/40', badgeText: 'text-red-700 dark:text-red-400' },
  opportunity: { icon: Lightbulb, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', badgeBg: 'bg-amber-100 dark:bg-amber-900/40', badgeText: 'text-amber-700 dark:text-amber-400' },
  achievement: { icon: Award, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-200 dark:border-teal-800', badgeBg: 'bg-teal-100 dark:bg-teal-900/40', badgeText: 'text-teal-700 dark:text-teal-400' },
  strength: { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40', badgeText: 'text-emerald-700 dark:text-emerald-400' },
  weakness: { icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', badgeBg: 'bg-red-100 dark:bg-red-900/40', badgeText: 'text-red-700 dark:text-red-400' },
  trend: { icon: TrendingUp, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-200 dark:border-cyan-800', badgeBg: 'bg-cyan-100 dark:bg-cyan-900/40', badgeText: 'text-cyan-700 dark:text-cyan-400' },
  warning: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', badgeBg: 'bg-amber-100 dark:bg-amber-900/40', badgeText: 'text-amber-700 dark:text-amber-400' },
  suggestion: { icon: Lightbulb, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-200 dark:border-teal-800', badgeBg: 'bg-teal-100 dark:bg-teal-900/40', badgeText: 'text-teal-700 dark:text-teal-400' },
}

function getInsightConfig(type: string) {
  return INSIGHT_TYPE_CONFIG[type] || INSIGHT_TYPE_CONFIG.opportunity
}

// ─── Animation Variants ─────────────────────────────────────────
const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
}

// ─── Custom Tooltip Component ───────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border/50 bg-card px-3 py-2 shadow-lg">
      <p className="text-[11px] font-semibold text-muted-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-[12px]">
          <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold">{typeof entry.value === 'number' && entry.name?.toLowerCase().includes('revenue') ? formatUSD(entry.value) : formatNumber(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────
export function AdminAnalyticsView() {
  const { currentUser } = useAppStore()
  const [intelligentData, setIntelligentData] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('ai-insights')

  const fetchData = useCallback(async () => {
    if (!currentUser?.id) return
    setLoading(true)
    setError(null)
    try {
      const [intRes, dashRes] = await Promise.all([
        fetch(`/api/analytics/intelligent?userId=${currentUser.id}&role=admin`),
        fetch('/api/admin/dashboard?period=30'),
      ])
      if (!intRes.ok || !dashRes.ok) throw new Error('Failed to fetch analytics data')
      const [intJson, dashJson] = await Promise.all([intRes.json(), dashRes.json()])
      setIntelligentData(intJson)
      setDashboardData(dashJson)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleExportPDF = async () => {
    const element = document.getElementById('analytics-dashboard')
    if (!element) return
    try {
      setLoading(true)
      const canvas = await html2canvas(element, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save('Admin_Analytics_Report.pdf')
    } catch (err) {
      console.error('PDF Export failed', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!intelligentData || !dashboardData) return
    const csvContent = Papa.unparse(dashboardData.enrollmentTrends || [])
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'Enrollment_Trends.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ─── Loading State ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-emerald-500" />
        <span className="ml-2 text-muted-foreground">Loading analytics...</span>
      </div>
    )
  }

  // ─── Error State ──────────────────────────────────────────────
  if (error || !intelligentData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="size-10 text-rose-500" />
        <p className="text-[15px] font-medium">{error || 'Failed to load analytics'}</p>
        <Button variant="outline" size="sm" className="rounded-full" onClick={fetchData}>
          <RefreshCw className="size-3.5 mr-1" /> Try Again
        </Button>
      </div>
    )
  }

  // ─── Destructure Intelligent API Data ─────────────────────────
  const { metrics, courseHealth = [], instructorPerformance = [], riskAlerts = [], insights = [] } = intelligentData
  const criticalCourses = courseHealth.filter((c: any) => c.status === 'critical')
  const atRiskCourses = courseHealth.filter((c: any) => c.status === 'at_risk')
  const healthyCourses = courseHealth.filter((c: any) => c.status === 'healthy')
  const lowPerformingInstructors = instructorPerformance.filter((i: any) => i.performanceScore < 40)

  // ─── Destructure Dashboard API Data ───────────────────────────
  const dash = dashboardData || {}
  const platformHealth = dash.platformHealth || {}
  const userDistribution = dash.userDistribution || { students: 0, instructors: 0, admins: 0, parents: 0 }
  const categoryDistribution = dash.categoryDistribution || []
  const dailyActivity = dash.dailyActivity || []
  const enrollmentTrends = dash.enrollmentTrends || []
  const revenueBreakdown = dash.revenueBreakdown || []
  const userGrowthChart = dash.userGrowthChart || []
  const topPerformingCourses = dash.topPerformingCourses || []
  const topInstructors = dash.topInstructors || []
  const platformCut = dash.platformCut || 0
  const instructorPayouts = dash.instructorPayouts || 0

  // ─── Pie chart data for user distribution ─────────────────────
  const userDistPieData = [
    { name: 'Students', value: userDistribution.students || 0 },
    { name: 'Instructors', value: userDistribution.instructors || 0 },
    { name: 'Admins', value: userDistribution.admins || 0 },
    { name: 'Parents', value: userDistribution.parents || 0 },
  ].filter(d => d.value > 0)

  // ─── Category chart data ──────────────────────────────────────
  const categoryChartData = categoryDistribution.map((c: any) => ({
    category: c.category,
    enrollments: c.enrollments,
    courses: c.courses,
  }))

  // ─── Revenue breakdown pie data ───────────────────────────────
  const revenueBreakdownPieData = revenueBreakdown
    .filter((r: any) => r.amount > 0)
    .map((r: any) => ({ name: r.source, value: r.amount }))

  return (
    <div className="space-y-6 pb-4" id="analytics-dashboard">
      {/* ═══ Header ══════════════════════════════════════════════════ */}
      <motion.div {...fadeInUp} className="relative rounded-2xl overflow-hidden shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 opacity-10" />
        <div className="relative p-5 bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                <Brain className="size-5" />
              </div>
              <div>
                <h1 className="text-[28px] font-bold tracking-tight">Intelligent Analytics</h1>
                <p className="text-[13px] text-muted-foreground">
                  {currentUser?.name ? `${currentUser.name} — ` : ''}Platform intelligence & data-driven insights
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={handleExportCSV}>
                CSV Export
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={handleExportPDF}>
                PDF Report
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30" onClick={fetchData}>
                <RefreshCw className="size-3.5" /> Refresh
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ Tab Navigation ═════════════════════════════════════════ */}
      <motion.div {...fadeInUp} transition={{ delay: 0.05 }}>
        <div className="flex items-center rounded-full bg-muted/60 p-1 w-fit">
          <button
            onClick={() => setActiveTab('ai-insights')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-all',
              activeTab === 'ai-insights'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Brain className="size-3.5" /> AI Insights
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-all',
              activeTab === 'statistics'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <BarChart3 className="size-3.5" /> Statistics
          </button>
        </div>
      </motion.div>

      {/* ═══ Tab Content ═══════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {activeTab === 'ai-insights' ? (
          <motion.div
            key="ai-insights"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* ─── Platform Risk Summary ────────────────────────── */}
            <motion.div {...fadeInUp} transition={{ delay: 0.05 }}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Critical Courses', value: criticalCourses.length, bg: 'bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/50', text: 'text-red-600 dark:text-red-400', icon: <AlertTriangle className="size-4" /> },
                  { label: 'At-Risk Courses', value: atRiskCourses.length, bg: 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50', text: 'text-amber-600 dark:text-amber-400', icon: <Shield className="size-4" /> },
                  { label: 'Low-Perf Instructors', value: lowPerformingInstructors.length, bg: 'bg-orange-50 dark:bg-orange-950/30 border border-orange-200/50 dark:border-orange-800/50', text: 'text-orange-600 dark:text-orange-400', icon: <Users className="size-4" /> },
                  { label: 'Active Users (7d)', value: metrics?.activeUsers || 0, bg: 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/50', text: 'text-emerald-600 dark:text-emerald-400', icon: <Zap className="size-4" /> },
                ].map((item, i) => (
                  <div key={i} className={cn('rounded-xl p-3 text-center', item.bg)}>
                    <div className={cn('flex items-center justify-center mb-1', item.text)}>{item.icon}</div>
                    <p className={cn('text-[24px] font-bold', item.text)}>{item.value}</p>
                    <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ─── Risk Alerts ──────────────────────────────────── */}
            {riskAlerts.length > 0 && (
              <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
                <div className="rounded-2xl shadow-sm bg-card overflow-hidden">
                  <div className="flex items-center gap-2 p-4 border-b border-border/30">
                    <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-rose-500/10">
                      <AlertTriangle className="size-4 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold">Risk Alerts</h3>
                      <p className="text-[11px] text-muted-foreground">{riskAlerts.length} alert{riskAlerts.length !== 1 ? 's' : ''} detected</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                    {riskAlerts.map((alert: any) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          'rounded-xl border p-3',
                          alert.severity === 'critical'
                            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[13px] font-semibold">{alert.title}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1.5 py-0 border-0',
                              alert.severity === 'critical'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                            )}
                          >
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{alert.description}</p>
                        {alert.actionSuggestion && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                            <ChevronRight className="size-3" /> {alert.actionSuggestion}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── AI Insights ──────────────────────────────────── */}
            {insights.length > 0 && (
              <motion.div {...fadeInUp} transition={{ delay: 0.15 }}>
                <div className="rounded-2xl shadow-sm bg-card overflow-hidden">
                  <div className="flex items-center gap-2 p-4 border-b border-border/30">
                    <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/10">
                      <Sparkles className="size-4 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold">AI Insights</h3>
                      <p className="text-[11px] text-muted-foreground">{insights.length} insight{insights.length !== 1 ? 's' : ''} generated</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                    {insights.map((insight: any) => {
                      const config = getInsightConfig(insight.type)
                      const IconComp = config.icon
                      return (
                        <motion.div
                          key={insight.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn('rounded-xl border p-3', config.bg, config.border)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <IconComp className={cn('size-3.5', config.color)} />
                            <span className="text-[13px] font-semibold">{insight.title}</span>
                            {insight.category && (
                              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 border-0', config.badgeBg, config.badgeText)}>
                                {insight.category?.replace(/_/g, ' ')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{insight.description}</p>
                          {insight.actionSuggestion && (
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                              <ChevronRight className="size-3" /> {insight.actionSuggestion}
                            </p>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {insights.length === 0 && riskAlerts.length === 0 && (
              <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
                <div className="rounded-2xl bg-card shadow-sm p-12 text-center">
                  <Sparkles className="size-8 text-emerald-300 mx-auto mb-2" />
                  <p className="text-[14px] font-medium text-muted-foreground">No insights available yet</p>
                  <p className="text-[12px] text-muted-foreground/60">AI insights will appear as more platform data accumulates.</p>
                </div>
              </motion.div>
            )}

            {/* ─── Course Health Analysis ───────────────────────── */}
            <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
              <div className="rounded-2xl shadow-sm bg-card overflow-hidden">
                <div className="flex items-center gap-2 p-4 border-b border-border/30">
                  <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/10">
                    <HeartPulse className="size-4 text-teal-500" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold">Course Health Analysis</h3>
                    <p className="text-[11px] text-muted-foreground">{courseHealth.length} courses monitored</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-0 text-[11px]">Critical: {criticalCourses.length}</Badge>
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-0 text-[11px]">At Risk: {atRiskCourses.length}</Badge>
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0 text-[11px]">Healthy: {healthyCourses.length}</Badge>
                  </div>
                </div>
                <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {criticalCourses.length > 0 && (
                    <div>
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-0 text-[11px] mb-2">Critical ({criticalCourses.length})</Badge>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {criticalCourses.slice(0, 6).map((course: any) => (
                          <div key={course.courseId} className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-3">
                            <p className="text-[13px] font-semibold">{course.courseTitle}</p>
                            <p className="text-[11px] text-muted-foreground">{course.instructorName}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[10px]">Health: <b className="text-red-600 dark:text-red-400">{course.healthScore}</b></span>
                              <span className="text-[10px]">Completion: <b>{course.completionRate}%</b></span>
                              <span className="text-[10px]">Rating: <b>{course.rating}</b></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {atRiskCourses.length > 0 && (
                    <div>
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-0 text-[11px] mb-2">At Risk ({atRiskCourses.length})</Badge>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {atRiskCourses.slice(0, 6).map((course: any) => (
                          <div key={course.courseId} className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                            <p className="text-[13px] font-semibold">{course.courseTitle}</p>
                            <p className="text-[11px] text-muted-foreground">{course.instructorName}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[10px]">Health: <b className="text-amber-600 dark:text-amber-400">{course.healthScore}</b></span>
                              <span className="text-[10px]">Completion: <b>{course.completionRate}%</b></span>
                              <span className="text-[10px]">Rating: <b>{course.rating}</b></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {healthyCourses.length > 0 && (
                    <div>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0 text-[11px] mb-2">Healthy ({healthyCourses.length})</Badge>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {healthyCourses.slice(0, 6).map((course: any) => (
                          <div key={course.courseId} className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
                            <p className="text-[13px] font-semibold">{course.courseTitle}</p>
                            <p className="text-[11px] text-muted-foreground">{course.instructorName}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[10px]">Health: <b className="text-emerald-600 dark:text-emerald-400">{course.healthScore}</b></span>
                              <span className="text-[10px]">Completion: <b>{course.completionRate}%</b></span>
                              <span className="text-[10px]">Rating: <b>{course.rating}</b></span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {healthyCourses.length > 6 && (
                        <p className="text-[11px] text-muted-foreground mt-2 text-center">+{healthyCourses.length - 6} more healthy courses</p>
                      )}
                    </div>
                  )}
                  {courseHealth.length === 0 && (
                    <p className="text-[13px] text-muted-foreground text-center py-6">No course health data available</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ─── Instructor Performance Ranking ────────────────── */}
            <motion.div {...fadeInUp} transition={{ delay: 0.25 }}>
              <div className="rounded-2xl shadow-sm bg-card overflow-hidden">
                <div className="flex items-center gap-2 p-4 border-b border-border/30">
                  <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10">
                    <GraduationCap className="size-4 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold">Instructor Performance Ranking</h3>
                    <p className="text-[11px] text-muted-foreground">Top {Math.min(instructorPerformance.length, 10)} of {instructorPerformance.length} instructors</p>
                  </div>
                </div>
                <div className="p-4">
                  {instructorPerformance.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="text-left font-semibold text-muted-foreground py-2 px-2">#</th>
                            <th className="text-left font-semibold text-muted-foreground py-2 px-2">Instructor</th>
                            <th className="text-center font-semibold text-muted-foreground py-2 px-2">Courses</th>
                            <th className="text-center font-semibold text-muted-foreground py-2 px-2">Performance</th>
                            <th className="text-center font-semibold text-muted-foreground py-2 px-2 hidden sm:table-cell">Completion</th>
                            <th className="text-center font-semibold text-muted-foreground py-2 px-2 hidden md:table-cell">Rating</th>
                            <th className="text-center font-semibold text-muted-foreground py-2 px-2 hidden md:table-cell">Students</th>
                          </tr>
                        </thead>
                        <tbody>
                          {instructorPerformance.slice(0, 10).map((inst: any, i: number) => (
                            <tr key={inst.instructorId} className="border-b border-border/20 hover:bg-accent/30 transition-colors">
                              <td className="py-2.5 px-2">
                                <span className={cn(
                                  'flex size-6 items-center justify-center rounded-full text-[10px] font-bold',
                                  i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                                  i === 1 ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' :
                                  i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' :
                                  'bg-muted/50 text-muted-foreground'
                                )}>
                                  {i === 0 ? <Crown className="size-3" /> : i === 1 ? <Medal className="size-3" /> : i === 2 ? <Trophy className="size-3" /> : i + 1}
                                </span>
                              </td>
                              <td className="py-2.5 px-2">
                                <p className="font-medium text-foreground">{inst.instructorName}</p>
                                <p className="text-[10px] text-muted-foreground">{inst.courseCount} course{inst.courseCount !== 1 ? 's' : ''}</p>
                              </td>
                              <td className="py-2.5 px-2 text-center">{inst.courseCount}</td>
                              <td className="py-2.5 px-2">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-20 h-2 rounded-full bg-muted/50 overflow-hidden">
                                    <div
                                      className={cn(
                                        'h-full rounded-full transition-all',
                                        inst.performanceScore >= 70 ? 'bg-emerald-500' :
                                        inst.performanceScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                      )}
                                      style={{ width: `${Math.min(inst.performanceScore, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-semibold">{inst.performanceScore}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-2 text-center hidden sm:table-cell">{inst.avgCompletionRate}%</td>
                              <td className="py-2.5 px-2 text-center hidden md:table-cell">{inst.avgRating?.toFixed(1)}</td>
                              <td className="py-2.5 px-2 text-center hidden md:table-cell">{inst.totalStudents}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-[13px] text-muted-foreground text-center py-6">No instructor data available</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* ═══════════════════════════════════════════════════════════
             STATISTICS TAB
             ═══════════════════════════════════════════════════════════ */
          <motion.div
            key="statistics"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* ─── KPI Cards Row 1 ─────────────────────────────── */}
            <motion.div {...fadeInUp} transition={{ delay: 0.05 }}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Total Users', value: formatNumber(platformHealth.totalUsers || metrics?.totalUsers || 0), icon: <Users className="size-5 text-emerald-500" />, change: platformHealth.totalUsersChange },
                  { label: 'Active Users (7d)', value: formatNumber(metrics?.activeUsers || platformHealth.activeToday || 0), icon: <Zap className="size-5 text-teal-500" />, change: platformHealth.activeTodayChange },
                  { label: 'Total Revenue', value: formatUSD(platformHealth.grossRevenue || metrics?.totalRevenue || 0), icon: <DollarSign className="size-5 text-cyan-500" />, change: platformHealth.grossRevenueChange },
                  { label: 'Completion Rate', value: `${metrics?.completionRates || platformHealth.completionRate || 0}%`, icon: <CheckCircle className="size-5 text-emerald-500" />, change: platformHealth.completionRateChange },
                ].map((kpi, i) => (
                  <div key={i} className="rounded-2xl bg-card shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {kpi.icon}
                      <p className="text-[11px] font-medium text-muted-foreground">{kpi.label}</p>
                    </div>
                    <div className="flex items-end gap-2">
                      <p className="text-[22px] font-bold tracking-tight">{kpi.value}</p>
                      {kpi.change !== undefined && kpi.change !== 0 && (
                        <span className={cn(
                          'text-[11px] font-semibold mb-1 flex items-center gap-0.5',
                          kpi.change > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                        )}>
                          {kpi.change > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                          {Math.abs(kpi.change)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ─── KPI Cards Row 2 ─────────────────────────────── */}
            <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Published Courses', value: formatNumber(platformHealth.publishedCourses || metrics?.totalCourses || 0), icon: <BookOpen className="size-5 text-teal-500" /> },
                  { label: 'Daily Active Users', value: formatNumber(platformHealth.activeToday || metrics?.dailyActiveUsers || 0), icon: <Activity className="size-5 text-cyan-500" /> },
                  { label: 'Instructors', value: formatNumber(metrics?.instructorCount || 0), icon: <GraduationCap className="size-5 text-amber-500" /> },
                  { label: 'Students', value: formatNumber(metrics?.studentCount || 0), icon: <UserCheck className="size-5 text-emerald-500" /> },
                ].map((kpi, i) => (
                  <div key={i} className="rounded-2xl bg-card shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-1">
                      {kpi.icon}
                      <p className="text-[11px] font-medium text-muted-foreground">{kpi.label}</p>
                    </div>
                    <p className="text-[22px] font-bold tracking-tight">{kpi.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ─── Charts Section: User Growth + Enrollment Trends ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* ── User Growth Chart ───────────────────────────── */}
              <motion.div {...fadeInUp} transition={{ delay: 0.15 }}>
                <div className="rounded-2xl bg-card shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <UserPlus className="size-4 text-emerald-500" />
                    <h3 className="text-[15px] font-semibold">User Growth</h3>
                    <span className="text-[11px] text-muted-foreground ml-auto">Last 6 months</span>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={userGrowthChart} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="users" name="All Users" stroke="#10b981" fill="url(#colorUsers)" strokeWidth={2} />
                        <Area type="monotone" dataKey="students" name="Students" stroke="#14b8a6" fill="url(#colorStudents)" strokeWidth={2} />
                        <Line type="monotone" dataKey="instructors" name="Instructors" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>

              {/* ── Enrollment Trends Chart ─────────────────────── */}
              <motion.div {...fadeInUp} transition={{ delay: 0.18 }}>
                <div className="rounded-2xl bg-card shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="size-4 text-teal-500" />
                    <h3 className="text-[15px] font-semibold">Enrollment Trends</h3>
                    <span className="text-[11px] text-muted-foreground ml-auto">Last 14 days</span>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={enrollmentTrends} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: string) => v.slice(5)} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: number) => formatUSD(v)} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar yAxisId="left" dataKey="enrollments" name="Enrollments" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={16} />
                        <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ─── Charts Row 2: Pie + Category Bar ────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* ── User Distribution Pie ───────────────────────── */}
              <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
                <div className="rounded-2xl bg-card shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <PieChartIcon className="size-4 text-cyan-500" />
                    <h3 className="text-[15px] font-semibold">User Distribution</h3>
                  </div>
                  <div className="h-72 flex items-center justify-center">
                    {userDistPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={userDistPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                            labelLine={false}
                            label={renderCustomizedLabel}
                          >
                            {userDistPieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={USER_DIST_COLORS[index % USER_DIST_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-[13px] text-muted-foreground">No user data available</p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* ── Category Distribution Bar ───────────────────── */}
              <motion.div {...fadeInUp} transition={{ delay: 0.23 }}>
                <div className="rounded-2xl bg-card shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="size-4 text-emerald-500" />
                    <h3 className="text-[15px] font-semibold">Category Distribution</h3>
                    <span className="text-[11px] text-muted-foreground ml-auto">Courses by category</span>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="enrollments" name="Enrollments" radius={[4, 4, 0, 0]} barSize={28}>
                          {categoryChartData.map((entry: any, index: number) => (
                            <Cell key={`cat-${index}`} fill={CATEGORY_COLORS[entry.category] || '#6b7280'} />
                          ))}
                        </Bar>
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ─── Daily Activity Area Chart ───────────────────── */}
            <motion.div {...fadeInUp} transition={{ delay: 0.25 }}>
              <div className="rounded-2xl bg-card shadow-sm p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="size-4 text-teal-500" />
                  <h3 className="text-[15px] font-semibold">Daily Activity</h3>
                  <span className="text-[11px] text-muted-foreground ml-auto">Last 7 days</span>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyActivity} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorActiveUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorXpEarned" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorLessons" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorQuizzes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: string) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="activeUsers" name="Active Users" stroke="#10b981" fill="url(#colorActiveUsers)" strokeWidth={2} />
                      <Area type="monotone" dataKey="xpEarned" name="XP Earned" stroke="#14b8a6" fill="url(#colorXpEarned)" strokeWidth={2} />
                      <Area type="monotone" dataKey="lessonsCompleted" name="Lessons Completed" stroke="#06b6d4" fill="url(#colorLessons)" strokeWidth={2} />
                      <Area type="monotone" dataKey="quizzesTaken" name="Quizzes Taken" stroke="#f59e0b" fill="url(#colorQuizzes)" strokeWidth={2} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

            {/* ─── Top Courses Table ───────────────────────────── */}
            <motion.div {...fadeInUp} transition={{ delay: 0.28 }}>
              <div className="rounded-2xl shadow-sm bg-card overflow-hidden">
                <div className="flex items-center gap-2 p-4 border-b border-border/30">
                  <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/10">
                    <BookOpen className="size-4 text-emerald-500" />
                  </div>
                  <h3 className="text-[15px] font-semibold">Top Courses by Enrollment</h3>
                </div>
                <div className="p-4 overflow-x-auto">
                  {courseHealth.length > 0 || topPerformingCourses.length > 0 ? (
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left font-semibold text-muted-foreground py-2 px-2">Course</th>
                          <th className="text-left font-semibold text-muted-foreground py-2 px-2 hidden sm:table-cell">Instructor</th>
                          <th className="text-center font-semibold text-muted-foreground py-2 px-2">Enrolled</th>
                          <th className="text-center font-semibold text-muted-foreground py-2 px-2 hidden md:table-cell">Completed</th>
                          <th className="text-center font-semibold text-muted-foreground py-2 px-2">Rating</th>
                          <th className="text-center font-semibold text-muted-foreground py-2 px-2">Health</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...courseHealth]
                          .sort((a: any, b: any) => b.enrollments - a.enrollments)
                          .slice(0, 10)
                          .map((course: any) => (
                            <tr key={course.courseId} className="border-b border-border/20 hover:bg-accent/30 transition-colors">
                              <td className="py-2 px-2 font-medium max-w-[200px] truncate">{course.courseTitle}</td>
                              <td className="py-2 px-2 text-muted-foreground hidden sm:table-cell">{course.instructorName}</td>
                              <td className="py-2 px-2 text-center">{course.enrollments}</td>
                              <td className="py-2 px-2 text-center hidden md:table-cell">{course.completions}</td>
                              <td className="py-2 px-2 text-center">{course.rating}</td>
                              <td className="py-2 px-2 text-center">
                                <span className={cn(
                                  'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                                  course.status === 'healthy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                                  course.status === 'at_risk' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                                  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                )}>
                                  {course.healthScore}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-[13px] text-muted-foreground text-center py-6">No course data available</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ─── Top Instructors Table ───────────────────────── */}
            <motion.div {...fadeInUp} transition={{ delay: 0.3 }}>
              <div className="rounded-2xl shadow-sm bg-card overflow-hidden">
                <div className="flex items-center gap-2 p-4 border-b border-border/30">
                  <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10">
                    <GraduationCap className="size-4 text-amber-500" />
                  </div>
                  <h3 className="text-[15px] font-semibold">Top Instructors by Performance</h3>
                </div>
                <div className="p-4 overflow-x-auto">
                  {instructorPerformance.length > 0 ? (
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left font-semibold text-muted-foreground py-2 px-2">#</th>
                          <th className="text-left font-semibold text-muted-foreground py-2 px-2">Instructor</th>
                          <th className="text-center font-semibold text-muted-foreground py-2 px-2">Courses</th>
                          <th className="text-center font-semibold text-muted-foreground py-2 px-2 hidden sm:table-cell">Students</th>
                          <th className="text-center font-semibold text-muted-foreground py-2 px-2 hidden md:table-cell">Avg Rating</th>
                          <th className="text-center font-semibold text-muted-foreground py-2 px-2">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {instructorPerformance.slice(0, 10).map((inst: any, i: number) => (
                          <tr key={inst.instructorId} className="border-b border-border/20 hover:bg-accent/30 transition-colors">
                            <td className="py-2 px-2">
                              <span className={cn(
                                'flex size-6 items-center justify-center rounded-full text-[10px] font-bold',
                                i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                                i === 1 ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' :
                                i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' :
                                'bg-muted/50 text-muted-foreground'
                              )}>
                                {i === 0 ? <Crown className="size-3" /> : i === 1 ? <Medal className="size-3" /> : i === 2 ? <Trophy className="size-3" /> : i + 1}
                              </span>
                            </td>
                            <td className="py-2 px-2 font-medium">{inst.instructorName}</td>
                            <td className="py-2 px-2 text-center">{inst.courseCount}</td>
                            <td className="py-2 px-2 text-center hidden sm:table-cell">{inst.totalStudents}</td>
                            <td className="py-2 px-2 text-center hidden md:table-cell">{inst.avgRating?.toFixed(1)}</td>
                            <td className="py-2 px-2">
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="w-14 h-2 rounded-full bg-muted/50 overflow-hidden">
                                  <div
                                    className={cn(
                                      'h-full rounded-full transition-all',
                                      inst.performanceScore >= 70 ? 'bg-emerald-500' :
                                      inst.performanceScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                    )}
                                    style={{ width: `${inst.performanceScore}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-semibold min-w-[20px]">{inst.performanceScore}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-[13px] text-muted-foreground text-center py-6">No instructor data available</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ─── Revenue Overview ─────────────────────────────── */}
            <motion.div {...fadeInUp} transition={{ delay: 0.32 }}>
              <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 p-4 border-b border-border/30">
                  <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/10">
                    <CreditCard className="size-4 text-cyan-500" />
                  </div>
                  <h3 className="text-[15px] font-semibold">Revenue Overview</h3>
                </div>
                <div className="p-4">
                  {/* Revenue KPIs */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-4">
                      <p className="text-[11px] text-muted-foreground">Total Revenue</p>
                      <p className="text-[24px] font-bold text-emerald-600 dark:text-emerald-400">
                        {formatUSD(platformHealth.grossRevenue || metrics?.totalRevenue || 0)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-cyan-50 dark:bg-cyan-950/20 p-4">
                      <p className="text-[11px] text-muted-foreground">Avg. Revenue per Course</p>
                      <p className="text-[24px] font-bold text-cyan-600 dark:text-cyan-400">
                        {formatUSD(
                          (platformHealth.grossRevenue || metrics?.totalRevenue || 0) > 0 && (platformHealth.publishedCourses || metrics?.totalCourses || 0) > 0
                            ? Math.round((platformHealth.grossRevenue || metrics?.totalRevenue || 0) / (platformHealth.publishedCourses || metrics?.totalCourses || 1))
                            : 0
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Revenue Breakdown Pie + Platform Cut vs Payouts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Revenue Breakdown Pie */}
                    {revenueBreakdownPieData.length > 0 && (
                      <div>
                        <h4 className="text-[13px] font-semibold mb-3">Revenue Breakdown</h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={revenueBreakdownPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={85}
                                paddingAngle={3}
                                dataKey="value"
                                labelLine={false}
                                label={renderCustomizedLabel}
                              >
                                {revenueBreakdownPieData.map((_, index) => (
                                  <Cell key={`rev-${index}`} fill={REVENUE_BREAKDOWN_COLORS[index % REVENUE_BREAKDOWN_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                              <Legend wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Platform Cut vs Instructor Payouts */}
                    <div>
                      <h4 className="text-[13px] font-semibold mb-3">Platform vs Instructor Payouts</h4>
                      <div className="space-y-3 mt-4">
                        <div>
                          <div className="flex items-center justify-between text-[12px] mb-1">
                            <span className="text-muted-foreground">Platform Cut (20%)</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatUSD(platformCut)}</span>
                          </div>
                          <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                              style={{ width: `${(platformHealth.grossRevenue || metrics?.totalRevenue || 0) > 0 ? Math.min((platformCut / (platformHealth.grossRevenue || metrics?.totalRevenue || 1)) * 100, 100) : 0}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-[12px] mb-1">
                            <span className="text-muted-foreground">Instructor Payouts (80%)</span>
                            <span className="font-semibold text-teal-600 dark:text-teal-400">{formatUSD(instructorPayouts)}</span>
                          </div>
                          <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-500"
                              style={{ width: `${(platformHealth.grossRevenue || metrics?.totalRevenue || 0) > 0 ? Math.min((instructorPayouts / (platformHealth.grossRevenue || metrics?.totalRevenue || 1)) * 100, 100) : 0}%` }}
                            />
                          </div>
                        </div>
                        {/* Revenue breakdown list */}
                        <div className="mt-4 space-y-1.5">
                          {revenueBreakdown.map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-[12px]">
                              <div className="flex items-center gap-2">
                                <span className="size-2.5 rounded-full" style={{ backgroundColor: REVENUE_BREAKDOWN_COLORS[i % REVENUE_BREAKDOWN_COLORS.length] }} />
                                <span className="text-muted-foreground">{item.source}</span>
                              </div>
                              <span className={cn('font-semibold', item.amount < 0 ? 'text-red-500' : '')}>
                                {item.amount < 0 ? '-' : ''}{formatUSD(Math.abs(item.amount))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
