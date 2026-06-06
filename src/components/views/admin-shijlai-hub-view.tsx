'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  GraduationCap,
  BarChart3,
  Users,
  Bot,
  Sparkles,
  RefreshCw,
  Download,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Calendar,
  Eye,
  ArrowUpRight,
  Shield,
  BookOpen,
  Target,
  Zap,
  FileBarChart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { ShijlAIText } from '@/components/ui/brand-text'

/* ─── Types ─── */
interface GeneratedReport {
  id: string
  reportType: string
  period: string
  periodStart: string
  periodEnd: string
  reportData: string
  reportSummary: string | null
  status: string
  createdAt: string
}

interface CourseQualityAnalysis {
  id: string
  courseId: string
  qualityScore: number
  structureScore: number
  assessmentScore: number
  successScore: number
  engagementScore: number
  contentScore: number
  analysisReport: string | null
  status: string
  createdAt: string
  updatedAt: string
  course: {
    id: string
    title: string
    category: string
    thumbnail: string | null
    enrollmentCount: number
    rating: number
    instructor: { name: string }
  }
}

/* ─── Helpers ─── */
const reportTypeLabels: Record<string, string> = {
  platform_performance: 'Platform Performance',
  course_performance: 'Course Performance',
  instructor_performance: 'Instructor Performance',
  student_engagement: 'Student Engagement',
  ai_usage: 'AI Usage',
}

const reportTypeIcons: Record<string, React.ReactNode> = {
  platform_performance: <BarChart3 className="size-4" />,
  course_performance: <BookOpen className="size-4" />,
  instructor_performance: <GraduationCap className="size-4" />,
  student_engagement: <Users className="size-4" />,
  ai_usage: <Bot className="size-4" />,
}

const periodLabels: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
}

function getQualityCategory(score: number) {
  if (score >= 90) return { label: 'Excellent', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800' }
  if (score >= 75) return { label: 'Good', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' }
  if (score >= 60) return { label: 'Needs Improvement', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800' }
  return { label: 'Critical', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800' }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ScoreRing({ score, size = 64, strokeWidth = 4 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const category = getQualityCategory(score)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/20" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className={cn(
            score >= 90 ? 'stroke-emerald-500' : score >= 75 ? 'stroke-blue-500' : score >= 60 ? 'stroke-amber-500' : 'stroke-red-500'
          )}
          style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-sm font-bold', category.color)}>{score}</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   REPORT GENERATOR TAB
   ═══════════════════════════════════════════════════════════ */
function ReportGeneratorTab() {
  const [reports, setReports] = useState<GeneratedReport[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('platform_performance')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly')
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null)

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reports')
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReports() }, [fetchReports])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: selectedType,
          period: selectedPeriod,
          generatedBy: 'admin',
        }),
      })
      if (res.ok) {
        toast.success('Report generation started!')
        setTimeout(() => fetchReports(), 2000)
      } else {
        toast.error('Failed to generate report')
      }
    } catch {
      toast.error('Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const reportSummaryData = selectedReport?.reportSummary
    ? (() => {
        try { return JSON.parse(selectedReport.reportSummary) } catch { return null }
      })()
    : null

  const reportMetrics = selectedReport?.reportData
    ? (() => {
        try { return JSON.parse(selectedReport.reportData) } catch { return null }
      })()
    : null

  return (
    <div className="space-y-6">
      {/* Generate New Report Section */}
      <Card className="border-dashed border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-primary" />
            Generate New Report
          </CardTitle>
          <CardDescription>AI-powered reports with real computed metrics and intelligent analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Report type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(reportTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      {reportTypeIcons[key]}
                      {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(periodLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="size-4 animate-spin" /> : <FileBarChart className="size-4" />}
              {generating ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Reports', value: reports.length, icon: <FileText className="size-4 text-blue-500" /> },
          { label: 'This Month', value: reports.filter(r => new Date(r.createdAt).getMonth() === new Date().getMonth()).length, icon: <Calendar className="size-4 text-emerald-500" /> },
          { label: 'Completed', value: reports.filter(r => r.status === 'completed').length, icon: <CheckCircle2 className="size-4 text-green-500" /> },
          { label: 'Failed', value: reports.filter(r => r.status === 'failed').length, icon: <XCircle className="size-4 text-red-500" /> },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-2 mb-1">
              {stat.icon}
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="size-5 text-muted-foreground" />
              Recent Reports
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchReports} className="gap-1">
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="size-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No reports generated yet.</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Generate your first report above!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
              {reports.map((report) => (
                <motion.button
                  key={report.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedReport(report)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left',
                    'hover:bg-accent/50 hover:border-primary/20',
                    selectedReport?.id === report.id && 'border-primary/30 bg-primary/5'
                  )}
                >
                  <div className={cn(
                    'flex size-10 items-center justify-center rounded-lg shrink-0',
                    report.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' :
                    report.status === 'failed' ? 'bg-red-50 dark:bg-red-950/30 text-red-600' :
                    'bg-amber-50 dark:bg-amber-950/30 text-amber-600'
                  )}>
                    {reportTypeIcons[report.reportType] || <FileText className="size-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{reportTypeLabels[report.reportType] || report.reportType}</p>
                    <p className="text-xs text-muted-foreground">
                      {periodLabels[report.period] || report.period} • {formatDate(report.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={cn(
                      'text-[10px]',
                      report.status === 'completed' && 'border-emerald-200 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400',
                      report.status === 'failed' && 'border-red-200 text-red-600 dark:border-red-800 dark:text-red-400',
                      report.status === 'generating' && 'border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400',
                    )}>
                      {report.status === 'generating' && <Loader2 className="size-3 mr-1 animate-spin" />}
                      {report.status}
                    </Badge>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reportTypeIcons[selectedReport?.reportType || '']}
              {selectedReport ? reportTypeLabels[selectedReport.reportType] : 'Report'}
            </DialogTitle>
            <DialogDescription>
              {selectedReport ? `${periodLabels[selectedReport.period]} • ${formatDate(selectedReport.periodStart)} – ${formatDate(selectedReport.periodEnd)}` : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedReport?.status === 'generating' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating report...</p>
            </div>
          )}

          {selectedReport?.status === 'failed' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <XCircle className="size-8 text-red-500" />
              <p className="text-sm text-red-600">Report generation failed. Please try again.</p>
            </div>
          )}

          {selectedReport?.status === 'completed' && reportSummaryData && (
            <div className="space-y-4">
              {/* Executive Summary */}
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <FileText className="size-4 text-primary" />
                  Executive Summary
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {reportSummaryData.executive_summary || reportSummaryData.executiveSummary || 'No summary available.'}
                </p>
              </div>

              {/* Key Insights */}
              {reportSummaryData.key_insights?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <TrendingUp className="size-4 text-emerald-500" />
                    Key Insights
                  </h4>
                  <ul className="space-y-1.5">
                    {reportSummaryData.key_insights.map((insight: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risks */}
              {reportSummaryData.risks?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <AlertTriangle className="size-4 text-amber-500" />
                    Risks
                  </h4>
                  <ul className="space-y-1.5">
                    {reportSummaryData.risks.map((risk: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {reportSummaryData.recommendations?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Zap className="size-4 text-blue-500" />
                    Recommendations
                  </h4>
                  <ul className="space-y-1.5">
                    {reportSummaryData.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ArrowUpRight className="size-3.5 text-blue-500 mt-0.5 shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Raw Metrics Preview */}
              {reportMetrics && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Computed Metrics</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(reportMetrics).slice(0, 12).map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-muted/40 p-2">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{key.replace(/_/g, ' ')}</p>
                          <p className="text-sm font-semibold">{typeof value === 'number' ? value.toLocaleString() : String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   COURSE QUALITY ANALYZER TAB
   ═══════════════════════════════════════════════════════════ */
function CourseQualityTab() {
  const [analyses, setAnalyses] = useState<CourseQualityAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<CourseQualityAnalysis | null>(null)

  const fetchAnalyses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/course-quality')
      if (res.ok) {
        const data = await res.json()
        setAnalyses(data.analyses || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAnalyses() }, [fetchAnalyses])

  const handleAnalyzeAll = async () => {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/admin/course-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analyzeAll: true }),
      })
      if (res.ok) {
        toast.success('Course quality analysis started!')
        setTimeout(() => fetchAnalyses(), 3000)
      } else {
        toast.error('Failed to start analysis')
      }
    } catch {
      toast.error('Failed to start analysis')
    } finally {
      setAnalyzing(false)
    }
  }

  const analysisReport = selectedAnalysis?.analysisReport
    ? (() => { try { return JSON.parse(selectedAnalysis.analysisReport) } catch { return null } })()
    : null

  const qualityDimensions = selectedAnalysis ? [
    { name: 'Structure', score: selectedAnalysis.structureScore, icon: <BookOpen className="size-3.5" />, weight: '25%', color: 'blue' },
    { name: 'Assessment', score: selectedAnalysis.assessmentScore, icon: <Target className="size-3.5" />, weight: '25%', color: 'violet' },
    { name: 'Student Success', score: selectedAnalysis.successScore, icon: <Users className="size-3.5" />, weight: '20%', color: 'emerald' },
    { name: 'Engagement', score: selectedAnalysis.engagementScore, icon: <Zap className="size-3.5" />, weight: '15%', color: 'amber' },
    { name: 'Content', score: selectedAnalysis.contentScore, icon: <FileText className="size-3.5" />, weight: '15%', color: 'rose' },
  ] : []

  // Summary stats
  const avgScore = analyses.length > 0 ? Math.round(analyses.reduce((sum, a) => sum + a.qualityScore, 0) / analyses.length) : 0
  const excellentCount = analyses.filter(a => a.qualityScore >= 90).length
  const criticalCount = analyses.filter(a => a.qualityScore < 60).length
  const needsImprovementCount = analyses.filter(a => a.qualityScore >= 60 && a.qualityScore < 75).length

  return (
    <div className="space-y-6">
      {/* Quality Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1 flex flex-col items-center justify-center p-6">
          <ScoreRing score={avgScore} size={96} strokeWidth={6} />
          <p className="mt-2 text-sm font-medium">Average Quality</p>
          <Badge className={cn('mt-1', getQualityCategory(avgScore).bg, getQualityCategory(avgScore).color, getQualityCategory(avgScore).border)} variant="outline">
            {getQualityCategory(avgScore).label}
          </Badge>
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:col-span-3">
          {[
            { label: 'Excellent', count: excellentCount, icon: <CheckCircle2 className="size-4 text-emerald-500" />, color: 'text-emerald-600', sub: 'Score 90+' },
            { label: 'Needs Improvement', count: needsImprovementCount, icon: <AlertTriangle className="size-4 text-amber-500" />, color: 'text-amber-600', sub: 'Score 60-74' },
            { label: 'Critical', count: criticalCount, icon: <XCircle className="size-4 text-red-500" />, color: 'text-red-600', sub: 'Below 60' },
          ].map((stat) => (
            <Card key={stat.label} className="p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                {stat.icon}
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className={cn('text-2xl font-bold', stat.color)}>{stat.count}</p>
              <p className="text-[11px] text-muted-foreground/60">{stat.sub}</p>
            </Card>
          ))}
          <Card className="p-4 flex flex-col justify-between sm:col-span-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Quality Distribution</span>
              <Button variant="outline" size="sm" onClick={handleAnalyzeAll} disabled={analyzing} className="gap-1.5">
                {analyzing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                {analyzing ? 'Analyzing...' : 'Analyze All'}
              </Button>
            </div>
            <div className="flex items-center gap-1 h-3 rounded-full overflow-hidden bg-muted">
              {analyses.length > 0 && (
                <>
                  {excellentCount > 0 && <div className="bg-emerald-500 h-full rounded-l-full" style={{ width: `${(excellentCount / analyses.length) * 100}%` }} />}
                  {(analyses.filter(a => a.qualityScore >= 75 && a.qualityScore < 90).length) > 0 && <div className="bg-blue-500 h-full" style={{ width: `${(analyses.filter(a => a.qualityScore >= 75 && a.qualityScore < 90).length / analyses.length) * 100}%` }} />}
                  {needsImprovementCount > 0 && <div className="bg-amber-500 h-full" style={{ width: `${(needsImprovementCount / analyses.length) * 100}%` }} />}
                  {criticalCount > 0 && <div className="bg-red-500 h-full rounded-r-full" style={{ width: `${(criticalCount / analyses.length) * 100}%` }} />}
                </>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" /> Excellent</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-blue-500" /> Good</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-500" /> Needs Work</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-red-500" /> Critical</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Course Quality Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="size-5 text-muted-foreground" />
              Course Health Dashboard
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="size-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No quality analyses yet.</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Click &quot;Analyze All&quot; to evaluate course quality.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
              {analyses.map((analysis) => {
                const cat = getQualityCategory(analysis.qualityScore)
                return (
                  <motion.button
                    key={analysis.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedAnalysis(analysis)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left',
                      'hover:bg-accent/50 hover:border-primary/20',
                      selectedAnalysis?.id === analysis.id && 'border-primary/30 bg-primary/5'
                    )}
                  >
                    {/* Score */}
                    <div className="shrink-0">
                      <ScoreRing score={Math.round(analysis.qualityScore)} size={48} strokeWidth={3} />
                    </div>

                    {/* Course Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{analysis.course.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {analysis.course.category} • by {analysis.course.instructor.name}
                      </p>
                      {/* Mini quality bars */}
                      <div className="flex items-center gap-2 mt-1.5">
                        {[
                          { label: 'Str', score: analysis.structureScore, color: 'bg-blue-500' },
                          { label: 'Ass', score: analysis.assessmentScore, color: 'bg-violet-500' },
                          { label: 'Suc', score: analysis.successScore, color: 'bg-emerald-500' },
                          { label: 'Eng', score: analysis.engagementScore, color: 'bg-amber-500' },
                          { label: 'Con', score: analysis.contentScore, color: 'bg-rose-500' },
                        ].map((dim) => (
                          <div key={dim.label} className="flex items-center gap-1" title={`${dim.label}: ${dim.score}`}>
                            <div className="w-8 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className={cn('h-full rounded-full', dim.color)} style={{ width: `${dim.score}%` }} />
                            </div>
                            <span className="text-[9px] text-muted-foreground">{dim.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status & Category */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge className={cn(cat.bg, cat.color, cat.border)} variant="outline">
                        {cat.label}
                      </Badge>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Users className="size-3" />
                        {analysis.course.enrollmentCount} students
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Detail Dialog */}
      <Dialog open={!!selectedAnalysis} onOpenChange={() => setSelectedAnalysis(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              {selectedAnalysis?.course?.title}
            </DialogTitle>
            <DialogDescription>
              Course Quality Analysis • by {selectedAnalysis?.course?.instructor?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedAnalysis && (
            <div className="space-y-5">
              {/* Overall Score */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <ScoreRing score={Math.round(selectedAnalysis.qualityScore)} size={80} strokeWidth={5} />
                <div>
                  <p className="text-sm font-medium">Overall Quality Score</p>
                  <Badge className={cn('mt-1', getQualityCategory(selectedAnalysis.qualityScore).bg, getQualityCategory(selectedAnalysis.qualityScore).color, getQualityCategory(selectedAnalysis.qualityScore).border)} variant="outline">
                    {getQualityCategory(selectedAnalysis.qualityScore).label}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedAnalysis.course.enrollmentCount} students • Rating {selectedAnalysis.course.rating.toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Quality Dimensions */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Quality Dimensions</h4>
                <div className="space-y-3">
                  {qualityDimensions.map((dim) => (
                    <div key={dim.name} className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 w-28 shrink-0">
                        {dim.icon}
                        <span className="text-xs font-medium">{dim.name}</span>
                      </div>
                      <Progress value={dim.score} className="flex-1 h-2" />
                      <span className="text-xs font-bold w-8 text-right">{dim.score}</span>
                      <span className="text-[10px] text-muted-foreground w-8">{dim.weight}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* AI Analysis */}
              {analysisReport && (
                <div className="space-y-4">
                  {analysisReport.strengths?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <CheckCircle2 className="size-4 text-emerald-500" />
                        Strengths
                      </h4>
                      <ul className="space-y-1.5">
                        {analysisReport.strengths.map((s: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="size-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisReport.weaknesses?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <AlertTriangle className="size-4 text-amber-500" />
                        Weaknesses
                      </h4>
                      <ul className="space-y-1.5">
                        {analysisReport.weaknesses.map((w: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="size-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisReport.recommendations?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <Zap className="size-4 text-blue-500" />
                        Recommendations
                      </h4>
                      <ul className="space-y-1.5">
                        {analysisReport.recommendations.map((r: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <ArrowUpRight className="size-3.5 text-blue-500 mt-0.5 shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN VIEW
   ═══════════════════════════════════════════════════════════ */
export function AdminShijlAIHubView() {
  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <Sparkles className="size-5" />
            </div>
            <ShijlAIText /> Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1 ml-11">
            AI-powered intelligence for platform administration
          </p>
        </div>
        <div className="flex items-center gap-2 ml-11 sm:ml-0">
          <Badge variant="outline" className="gap-1 text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
            <Sparkles className="size-3" />
            AI Control Center
          </Badge>
        </div>
      </motion.div>

      {/* Architecture Info Bar */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-100/50 dark:border-blue-900/30"
      >
        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
          <BarChart3 className="size-3.5" />
          System Intelligence
        </div>
        <ChevronRight className="size-3 text-blue-400" />
        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
          <Shield className="size-3.5" />
          Risk Detection
        </div>
        <ChevronRight className="size-3 text-blue-400" />
        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
          <BookOpen className="size-3.5" />
          Quality Analysis
        </div>
        <ChevronRight className="size-3 text-blue-400" />
        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
          <FileBarChart className="size-3.5" />
          Report Generation
        </div>
      </motion.div>

      {/* Main Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Tabs defaultValue="reports" className="space-y-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="reports" className="gap-2">
              <FileBarChart className="size-4" />
              AI Report Generator
            </TabsTrigger>
            <TabsTrigger value="quality" className="gap-2">
              <Shield className="size-4" />
              Course Quality Analyzer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <ReportGeneratorTab />
          </TabsContent>

          <TabsContent value="quality">
            <CourseQualityTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
