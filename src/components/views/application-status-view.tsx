'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ShijlAIBrand, ShijlAIText } from '@/components/ui/brand-text'
import { ShijlAILogo } from '@/components/ui/shijlai-logo'
import {
  GraduationCap, ArrowRight, Search, Clock, CheckCircle,
  XCircle, Mail, Calendar, ChevronRight, AlertCircle,
  Loader2, ArrowLeft, Copy, Check, Phone, Video, MapPin,
  User, FileText, Sparkles
} from 'lucide-react'

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

// Status config
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; description: string }> = {
  pending: {
    label: 'Pending',
    color: 'text-amber-600',
    bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    icon: <Clock className="size-4" />,
    description: 'Your application has been submitted and is waiting for review.',
  },
  under_review: {
    label: 'Under Review',
    color: 'text-blue-600',
    bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
    icon: <Search className="size-4" />,
    description: 'Our team is actively reviewing your application.',
  },
  more_info_requested: {
    label: 'More Info Needed',
    color: 'text-teal-600',
    bg: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
    icon: <AlertCircle className="size-4" />,
    description: 'We need additional information to continue processing your application.',
  },
  info_provided: {
    label: 'Info Provided',
    color: 'text-cyan-600',
    bg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400',
    icon: <CheckCircle className="size-4" />,
    description: 'You have provided the requested information. We will continue our review.',
  },
  interview_scheduled: {
    label: 'Interview Scheduled',
    color: 'text-purple-600',
    bg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
    icon: <Calendar className="size-4" />,
    description: 'An interview has been scheduled. Check the details below.',
  },
  interview_completed: {
    label: 'Interview Completed',
    color: 'text-indigo-600',
    bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
    icon: <CheckCircle className="size-4" />,
    description: 'Your interview has been completed. We will notify you of our decision soon.',
  },
  approved: {
    label: 'Approved',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    icon: <CheckCircle className="size-4" />,
    description: 'Congratulations! Your application has been approved.',
  },
  onboarded: {
    label: 'Onboarded',
    color: 'text-green-600',
    bg: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
    icon: <Sparkles className="size-4" />,
    description: 'You have completed onboarding. Welcome to the team!',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-600',
    bg: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
    icon: <XCircle className="size-4" />,
    description: 'Your application was not approved at this time.',
  },
  withdrawn: {
    label: 'Withdrawn',
    color: 'text-gray-600',
    bg: 'bg-gray-100 text-gray-700 dark:bg-gray-950/40 dark:text-gray-400',
    icon: <ArrowLeft className="size-4" />,
    description: 'Your application has been withdrawn.',
  },
}

// Pipeline steps for visual progress
const PIPELINE_STEPS = [
  { key: 'pending', label: 'Applied' },
  { key: 'under_review', label: 'Review' },
  { key: 'interview_scheduled', label: 'Interview' },
  { key: 'approved', label: 'Approved' },
  { key: 'onboarded', label: 'Onboarded' },
]

function getPipelineStepIndex(status: string): number {
  const idx = PIPELINE_STEPS.findIndex(s => s.key === status)
  return idx >= 0 ? idx : -1
}

// Nav
function StatusNav() {
  const { setCurrentView } = useAppStore()
  return (
    <nav className="ios-glass-thick sticky top-0 z-50 border-b border-border/30">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
        <button onClick={() => setCurrentView('landing')} className="flex items-center gap-2 ios-press">
          <ShijlAILogo size="sm" className="shrink-0" />
          <div>
            <span className="text-[17px] font-bold text-foreground"><ShijlAIText /></span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-primary ml-1">Academy</span>
          </div>
        </button>
        <Button variant="ghost" size="sm" onClick={() => setCurrentView('instructors')} className="text-[13px] font-medium rounded-full">
          <ArrowLeft className="size-4 mr-1" />
          Back to Apply
        </Button>
      </div>
    </nav>
  )
}

// Timeline icon
function TimelineIcon({ event }: { event: string }) {
  switch (event) {
    case 'application_submitted': return <FileText className="size-4 text-blue-500" />
    case 'status_change': return <ArrowRight className="size-4 text-emerald-500" />
    case 'email_sent': return <Mail className="size-4 text-purple-500" />
    case 'interview_scheduled': return <Calendar className="size-4 text-violet-500" />
    case 'interview_completed': return <CheckCircle className="size-4 text-indigo-500" />
    case 'note_added': return <FileText className="size-4 text-amber-500" />
    case 'evaluation_updated': return <User className="size-4 text-teal-500" />
    default: return <Clock className="size-4 text-muted-foreground" />
  }
}

// Main component
export function ApplicationStatusView() {
  const { setCurrentView } = useAppStore()
  const [trackingCode, setTrackingCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [application, setApplication] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const handleLookup = useCallback(async () => {
    if (!trackingCode.trim()) {
      setError('Please enter your tracking code')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/instructor-applications?code=${encodeURIComponent(trackingCode.trim())}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Application not found')
        setApplication(null)
        return
      }
      setApplication(data.application)
    } catch {
      setError('Something went wrong. Please try again.')
      setApplication(null)
    } finally {
      setLoading(false)
    }
  }, [trackingCode])

  const handleCopy = useCallback(() => {
    if (application?.applicationCode) {
      navigator.clipboard.writeText(application.applicationCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [application])

  const statusConfig = application ? STATUS_CONFIG[application.status] : null
  const pipelineIdx = application ? getPipelineStepIndex(application.status) : -1

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusNav />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-4 py-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400 mb-4">
            <Search className="size-3.5" />
            Track Your Application
          </div>
          <h1 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
            Application{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Status
            </span>
          </h1>
          <p className="mt-2 text-[17px] text-muted-foreground max-w-xl mx-auto">
            Enter your application tracking code to see your current status, timeline, and next steps.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="max-w-md mx-auto mb-8"
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="INS-2025-ABC123"
                className="h-11 rounded-xl pl-9 font-mono"
                value={trackingCode}
                onChange={(e) => { setTrackingCode(e.target.value.toUpperCase()); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              />
            </div>
            <Button
              onClick={handleLookup}
              disabled={loading}
              className="h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'Track'}
            </Button>
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-[13px] text-red-500 text-center"
            >
              {error}
            </motion.p>
          )}
        </motion.div>

        {/* Application Details */}
        {application && statusConfig && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springTransition}
            className="space-y-6"
          >
            {/* Status Card */}
            <Card className="rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-6 border-b border-border/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${statusConfig.bg} rounded-lg px-3 py-1 text-[12px] font-semibold gap-1.5`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <h2 className="text-xl font-bold">{application.fullName}</h2>
                    <p className="text-[13px] text-muted-foreground mt-0.5">
                      Applied for: <span className="font-medium text-foreground">{application.expertise}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-[11px] text-muted-foreground">Tracking Code</p>
                      <p className="font-mono font-bold text-[15px]">{application.applicationCode}</p>
                    </div>
                    <Button variant="outline" size="icon" className="size-8 rounded-lg" onClick={handleCopy}>
                      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-[15px] text-muted-foreground">{statusConfig.description}</p>

                {/* Rejection info */}
                {application.status === 'rejected' && application.rejectionReason && (
                  <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-4">
                    <p className="text-[13px] font-semibold text-red-600 dark:text-red-400 mb-1">Reason:</p>
                    <p className="text-[13px] text-red-700 dark:text-red-300">{application.rejectionReason}</p>
                    {application.canReapply && application.reapplyAfter && (
                      <p className="text-[12px] text-red-500 dark:text-red-400 mt-2">
                        You can reapply after {new Date(application.reapplyAfter).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
                      </p>
                    )}
                  </div>
                )}

                {/* More info requested */}
                {application.status === 'more_info_requested' && application.infoRequestMessage && (
                  <div className="mt-4 rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/30 p-4">
                    <p className="text-[13px] font-semibold text-teal-600 dark:text-teal-400 mb-1">Information Requested:</p>
                    <p className="text-[13px] text-teal-700 dark:text-teal-300">{application.infoRequestMessage}</p>
                  </div>
                )}

                {/* Submission date */}
                <p className="text-[12px] text-muted-foreground mt-4">
                  Submitted on {new Date(application.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </CardContent>
            </Card>

            {/* Pipeline Progress */}
            {pipelineIdx >= 0 && (
              <Card className="rounded-2xl shadow-sm p-6">
                <h3 className="text-[15px] font-semibold mb-4">Application Progress</h3>
                <div className="flex items-center justify-between">
                  {PIPELINE_STEPS.map((step, i) => {
                    const isCompleted = i <= pipelineIdx
                    const isCurrent = i === pipelineIdx
                    return (
                      <div key={step.key} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex size-10 items-center justify-center rounded-full transition-all duration-300 ${
                              isCompleted
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm'
                                : isCurrent
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/30'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {isCompleted ? <CheckCircle className="size-5" /> : <span className="text-[13px] font-bold">{i + 1}</span>}
                          </div>
                          <span className={`mt-1.5 text-[11px] font-medium text-center ${isCompleted || isCurrent ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                            {step.label}
                          </span>
                        </div>
                        {i < PIPELINE_STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-300 ${i < pipelineIdx ? 'bg-emerald-500' : 'bg-border'}`} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Upcoming Interview */}
            {application.interviews && application.interviews.length > 0 && (
              <Card className="rounded-2xl shadow-sm p-6">
                <h3 className="text-[15px] font-semibold mb-4">Upcoming Interview</h3>
                {application.interviews.map((interview: any) => (
                  <div key={interview.id} className="rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30 p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/40 shrink-0">
                        {interview.interviewType === 'video_call' ? (
                          <Video className="size-5 text-purple-600 dark:text-purple-400" />
                        ) : interview.interviewType === 'phone' ? (
                          <Phone className="size-5 text-purple-600 dark:text-purple-400" />
                        ) : (
                          <MapPin className="size-5 text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-[15px] font-semibold">{new Date(interview.scheduledAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="text-[13px] text-muted-foreground">
                          {new Date(interview.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} &middot; {interview.duration} minutes
                        </p>
                        <p className="text-[13px] text-muted-foreground mt-1">With: {interview.interviewerName || 'ShijlAI Team'}</p>
                        {interview.meetingUrl && (
                          <a href={interview.meetingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-[13px] font-medium text-primary hover:underline">
                            Join Meeting <ChevronRight className="size-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </Card>
            )}

            {/* Timeline */}
            {application.timeline && application.timeline.length > 0 && (
              <Card className="rounded-2xl shadow-sm p-6">
                <h3 className="text-[15px] font-semibold mb-4">Activity Timeline</h3>
                <div className="space-y-0">
                  {application.timeline.map((event: any, i: number) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                          <TimelineIcon event={event.event} />
                        </div>
                        {i < application.timeline.length - 1 && (
                          <div className="w-px h-8 bg-border" />
                        )}
                      </div>
                      <div className="pb-6">
                        <p className="text-[14px] font-medium">{event.title}</p>
                        {event.description && (
                          <p className="text-[12px] text-muted-foreground mt-0.5">{event.description}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {event.performedByName && <span>by {event.performedByName} &middot; </span>}
                          {new Date(event.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setCurrentView('instructors')}
                variant="outline"
                className="flex-1 rounded-full"
              >
                <ArrowLeft className="size-4 mr-1" />
                Back to Apply
              </Button>
              <Button
                onClick={() => setCurrentView('landing')}
                className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
              >
                Go to Homepage
                <ArrowRight className="size-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* No Application - Help Section */}
        {!application && !loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="rounded-2xl shadow-sm p-8 text-center max-w-lg mx-auto">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 mx-auto mb-4">
                <Search className="size-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-[17px] font-semibold mb-2">Track Your Application</h3>
              <p className="text-[14px] text-muted-foreground leading-relaxed mb-6">
                Enter the tracking code you received in your confirmation email. Your code looks like: <span className="font-mono font-semibold">INS-2025-ABC123</span>
              </p>
              <Separator className="mb-6" />
              <div className="space-y-3 text-left">
                <p className="text-[13px] font-medium">Don&apos;t have a tracking code?</p>
                <Button
                  onClick={() => setCurrentView('instructors')}
                  variant="outline"
                  className="w-full rounded-xl h-10"
                >
                  Apply to Become an Instructor
                  <ArrowRight className="size-4 ml-1" />
                </Button>
                <p className="text-[12px] text-muted-foreground">
                  After submitting your application, you&apos;ll receive a confirmation email with your tracking code.
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-auto">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 text-center">
          <p className="text-[12px] text-muted-foreground">
            <ShijlAIBrand variant="compact" /> &middot; The World&apos;s AI-Powered Learning Platform
          </p>
        </div>
      </footer>
    </div>
  )
}
