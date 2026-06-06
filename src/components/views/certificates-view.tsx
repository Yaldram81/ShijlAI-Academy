'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award,
  Download,
  Share2,
  Eye,
  Loader2,
  ExternalLink,
  CheckCircle,
  X,
  Sparkles,
  Lock,
  Play,
  Clock,
  BookOpen,
  Shield,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Linkedin,
  Link2,
  Search,
  CheckCheck,
  GraduationCap,
  AlertCircle,
  Grid,
  List,
  Star,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import type { Certificate, InProgressCertificate } from '@/lib/types'
import { ShijlAIBrand } from '@/components/ui/brand-text'
import { ShijlAILogo } from '@/components/ui/shijlai-logo'

/* ─── Animation Config ─── */
const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }
const staggerDelay = 0.06

/* ─── Helper: format date ─── */
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/* ─── Helper: format minutes to hours/minutes ─── */
function formatTime(minutes: number) {
  if (minutes < 60) return `~${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `~${hours}h ${mins}m` : `~${hours}h`
}

/* ─── Helper: get template badge ─── */
function getTemplateBadge(type: string) {
  switch (type) {
    case 'distinction':
      return { label: 'Distinction', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20' }
    case 'excellence':
      return { label: 'Excellence', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' }
    default:
      return { label: 'Completion', color: 'bg-primary/10 text-primary border-primary/15' }
  }
}

/* ─── Helper: get progress color ─── */
function getProgressColor(progress: number) {
  if (progress >= 90) return 'from-emerald-500 to-teal-500'
  if (progress >= 70) return 'from-teal-500 to-cyan-500'
  if (progress >= 50) return 'from-amber-500 to-orange-500'
  return 'from-rose-500 to-pink-500'
}

/* ═══════════════════════════════════════════════════════════
   CERTIFICATE CARD (earned)
   ═══════════════════════════════════════════════════════════ */
function EarnedCertificateCard({
  cert,
  index,
  onPreview,
  onDownloadPdf,
  onDownloadPng,
  onShare,
  onVerify,
  viewMode = 'grid',
}: {
  cert: Certificate
  index: number
  onPreview: (cert: Certificate) => void
  onDownloadPdf: (cert: Certificate) => void
  onDownloadPng: (cert: Certificate) => void
  onShare: (cert: Certificate) => void
  onVerify: (cert: Certificate) => void
  viewMode?: 'grid' | 'list'
}) {
  const templateBadge = getTemplateBadge(cert.templateType)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * staggerDelay, ...springTransition }}
      className="group flex flex-col h-full"
    >
      <div className={`rounded-2xl ios-shadow-sm bg-card overflow-hidden transition-shadow duration-300 group-hover:shadow-lg border border-border/40 flex-1 flex ${viewMode === 'list' ? 'flex-row h-48' : 'flex-col'}`}>
        {/* Certificate visual preview (mini) */}
        <div
          className={`relative cursor-pointer ios-press overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/30 flex items-center justify-center ${viewMode === 'list' ? 'w-56 shrink-0 border-r border-border/40 h-full' : 'h-48 w-full border-b border-border/40'}`}
          onClick={() => onPreview(cert)}
        >
          {/* Scaled down preview of the certificate */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ transform: viewMode === 'list' ? 'scale(0.24)' : 'scale(0.35)', transformOrigin: 'center center' }}>
            <div className="w-[800px] h-[550px] bg-white border-[6px] border-emerald-600 rounded-[32px] p-12 relative flex flex-col items-center justify-center text-emerald-950 shadow-2xl">
              <div className="absolute top-6 left-6 size-20 border-t-[6px] border-l-[6px] rounded-tl-[40px] border-emerald-400" />
              <div className="absolute top-6 right-6 size-20 border-t-[6px] border-r-[6px] rounded-tr-[40px] border-emerald-400" />
              <div className="absolute bottom-6 left-6 size-20 border-b-[6px] border-l-[6px] rounded-bl-[40px] border-emerald-400" />
              <div className="absolute bottom-6 right-6 size-20 border-b-[6px] border-r-[6px] rounded-br-[40px] border-emerald-400" />

              <ShijlAILogo size="xl" className="shrink-0 mb-6 scale-[2]" />
              <p className="text-[24px] font-medium tracking-[0.3em] text-emerald-600 mb-4">
                🎓 <ShijlAIBrand variant="compact" />
              </p>
              <h3 className="text-[56px] font-serif font-bold text-slate-900 mb-6">Certificate of Completion</h3>
              
              <div className="w-56 h-1.5 bg-emerald-400 mb-8" />
              
              <p className="text-[28px] text-slate-600 mb-2">This certifies that</p>
              <p className="text-[52px] font-serif font-bold text-emerald-700 mb-8 truncate w-full text-center px-12">{cert.userName}</p>
              
              <p className="text-[28px] text-slate-600 mb-2">has successfully completed</p>
              <p className="text-[38px] font-serif font-semibold text-slate-900 truncate w-full text-center px-12">{cert.courseTitle}</p>
            </div>
          </div>
          
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
            <Badge className="bg-emerald-500/90 text-white hover:bg-emerald-500 text-[10px] rounded-lg shadow-sm border-0 backdrop-blur-sm">
              {cert.score ?? 0}%
            </Badge>
            <Badge variant="outline" className={`text-[10px] rounded-lg border bg-background/90 shadow-sm ${templateBadge.color} backdrop-blur-sm`}>
              {templateBadge.label}
            </Badge>
          </div>
        </div>

        {/* Certificate info */}
        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-[15px] line-clamp-2 leading-snug">{cert.courseTitle}</h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[12px] text-muted-foreground">{cert.userName}</p>
              {cert.instructorName && (
                <>
                  <span className="text-[10px] text-muted-foreground/50">·</span>
                  <p className="text-[12px] text-muted-foreground">by {cert.instructorName}</p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>Issued: {formatDateShort(cert.issuedAt)}</span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-muted/50 rounded-lg px-2.5 py-1.5">
            <Shield className="size-3 shrink-0 text-emerald-500" />
            <span className="truncate">{cert.certificateId}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 pt-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 h-8 text-[12px] rounded-xl ios-press flex-1"
                  onClick={() => onDownloadPdf(cert)}
                >
                  <FileText className="size-3" />
                  PDF
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-xl">Download PDF</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 h-8 text-[12px] rounded-xl ios-press flex-1"
                  onClick={() => onDownloadPng(cert)}
                >
                  <ImageIcon className="size-3" />
                  PNG
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-xl">Download PNG</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 h-8 text-[12px] rounded-xl ios-press"
                  onClick={() => onShare(cert)}
                >
                  <Linkedin className="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-xl">Add to LinkedIn</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 h-8 text-[12px] rounded-xl ios-press"
                  onClick={() => onShare(cert)}
                >
                  <Share2 className="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-xl">Share</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 h-8 text-[12px] rounded-xl ios-press"
                  onClick={() => onVerify(cert)}
                >
                  <Shield className="size-3 text-emerald-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-xl">Verify</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   IN-PROGRESS CERTIFICATE CARD
   ═══════════════════════════════════════════════════════════ */
function InProgressCertificateCard({
  cert,
  index,
  onContinue,
}: {
  cert: InProgressCertificate
  index: number
  onContinue: (cert: InProgressCertificate) => void
}) {
  const progressColor = getProgressColor(cert.progress)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * staggerDelay, ...springTransition }}
    >
      <div className="rounded-2xl ios-shadow-sm bg-card overflow-hidden border border-border/40 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/15">
            <Lock className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[14px] leading-snug">{cert.courseTitle} Certificate</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Complete all lessons + pass final quiz to earn
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-medium">Progress: {cert.progress}%</span>
            <span className="text-muted-foreground">{cert.completedLessons}/{cert.totalLessons} lessons</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted/60 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${cert.progress}%` }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full bg-gradient-to-r ${progressColor}`}
            />
          </div>
        </div>

        {/* Remaining items */}
        {cert.remainingItems.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">
              Remaining:
            </p>
            <div className="flex flex-wrap gap-1">
              {cert.remainingItems.slice(0, 5).map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-lg bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  {item}
                </span>
              ))}
              {cert.remainingItems.length > 5 && (
                <span className="inline-flex items-center rounded-lg bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                  +{cert.remainingItems.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Estimated time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Clock className="size-3.5" />
            <span>Est. time to earn: {formatTime(cert.estimatedTimeToComplete)}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 h-8 text-[12px] rounded-xl text-primary hover:text-primary hover:bg-primary/10 ios-press"
            onClick={() => onContinue(cert)}
          >
            Continue course
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   CERTIFICATE PREVIEW MODAL
   ═══════════════════════════════════════════════════════════ */
function CertificatePreviewModal({
  cert,
  open,
  onClose,
  onDownloadPdf,
  onDownloadPng,
  onShare,
  onVerify,
}: {
  cert: Certificate | null
  open: boolean
  onClose: () => void
  onDownloadPdf: (cert: Certificate) => void
  onDownloadPng: (cert: Certificate) => void
  onShare: (cert: Certificate) => void
  onVerify: (cert: Certificate) => void
}) {
  const certRef = useRef<HTMLDivElement>(null)

  if (!cert) return null

  const templateBadge = getTemplateBadge(cert.templateType)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Certificate Preview</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 z-10 size-8 rounded-xl ios-press"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>

          {/* Certificate design */}
          <div
            ref={certRef}
            className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/30 p-6 md:p-10"
          >
            {/* Decorative border */}
            <div className="border-2 border-emerald-200 dark:border-emerald-800 rounded-3xl p-5 md:p-8 relative">
              {/* Corner decorations */}
              <div className="absolute top-3 left-3 size-8 border-t-2 border-l-2 rounded-tl-2xl border-emerald-400 dark:border-emerald-600" />
              <div className="absolute top-3 right-3 size-8 border-t-2 border-r-2 rounded-tr-2xl border-emerald-400 dark:border-emerald-600" />
              <div className="absolute bottom-3 left-3 size-8 border-b-2 border-l-2 rounded-bl-2xl border-emerald-400 dark:border-emerald-600" />
              <div className="absolute bottom-3 right-3 size-8 border-b-2 border-r-2 rounded-br-2xl border-emerald-400 dark:border-emerald-600" />

              <div className="text-center space-y-4">
                {/* Seal / Logo */}
                <div className="flex justify-center">
                  <ShijlAILogo size="xl" className="shrink-0" />
                </div>

                <div>
                  <p className="text-[11px] font-medium tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
                    🎓 <ShijlAIBrand variant="compact" />
                  </p>
                  <h3 className="mt-2 text-[26px] md:text-[32px] font-serif font-bold text-foreground">
                    Certificate of Completion
                  </h3>
                  {cert.templateType !== 'completion' && (
                    <Badge variant="outline" className={`mt-1 text-[10px] rounded-lg border ${templateBadge.color}`}>
                      {templateBadge.label}
                    </Badge>
                  )}
                </div>

                <div className="w-24 h-px bg-emerald-300 dark:bg-emerald-700 mx-auto" />

                <div className="space-y-1">
                  <p className="text-[13px] text-muted-foreground">This certifies that</p>
                  <p className="text-[22px] md:text-[28px] font-serif font-bold text-emerald-700 dark:text-emerald-400">
                    {cert.userName}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[13px] text-muted-foreground">has successfully completed</p>
                  <p className="text-[17px] md:text-[22px] font-serif font-semibold text-foreground">
                    {cert.courseTitle}
                  </p>
                </div>

                {cert.instructorName && (
                  <p className="text-[12px] text-muted-foreground">
                    Instructed by <span className="font-medium text-foreground">{cert.instructorName}</span>
                  </p>
                )}

                <div className="flex items-center justify-center gap-8 pt-2">
                  <div className="text-center">
                    <p className="text-[28px] font-bold text-emerald-600 dark:text-emerald-400">{cert.score ?? 0}%</p>
                    <p className="text-[11px] text-muted-foreground">Score</p>
                  </div>
                  <div className="w-px h-8 bg-emerald-200 dark:bg-emerald-700" />
                  <div className="text-center">
                    <p className="text-[13px] font-medium">
                      {formatDate(cert.issuedAt)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Date Issued</p>
                  </div>
                </div>

                {/* Verification info */}
                <div className="pt-4 border-t border-emerald-200 dark:border-emerald-800 space-y-1.5">
                  <p className="text-[11px] text-muted-foreground">
                    Credential ID: <span className="font-mono font-medium">{cert.certificateId}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Verify at: <span className="text-emerald-600 dark:text-emerald-400 font-medium">shijlai.academy/verify/{cert.certificateId}</span>
                  </p>
                  {cert.verificationHash && (
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/60">
                      <Shield className="size-3" />
                      <span className="font-mono">Blockchain verified: {cert.verificationHash?.slice(0, 18)}...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 p-4 border-t bg-muted/30">
            <Button
              className="gap-2 rounded-2xl h-11 text-[14px] font-semibold ios-press"
              onClick={() => onDownloadPdf(cert)}
            >
              <Download className="size-4" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              className="gap-2 rounded-2xl h-11 text-[14px] ios-press"
              onClick={() => onDownloadPng(cert)}
            >
              <ImageIcon className="size-4" />
              Download PNG
            </Button>
            <Button
              variant="outline"
              className="gap-2 rounded-2xl h-11 text-[14px] ios-press"
              onClick={() => onShare(cert)}
            >
              <Linkedin className="size-4" />
              Add to LinkedIn
            </Button>
            <Button
              variant="outline"
              className="gap-2 rounded-2xl h-11 text-[14px] ios-press"
              onClick={() => onShare(cert)}
            >
              <Share2 className="size-4" />
              Share
            </Button>
            <Button
              variant="outline"
              className="gap-2 rounded-2xl h-11 text-[14px] ios-press"
              onClick={() => onVerify(cert)}
            >
              <Shield className="size-4 text-emerald-500" />
              Verify
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ═══════════════════════════════════════════════════════════
   VERIFICATION MODAL
   ═══════════════════════════════════════════════════════════ */
function VerificationModal({
  open,
  onClose,
  cert,
}: {
  open: boolean
  onClose: () => void
  cert: Certificate | null
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Certificate Verification</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="flex flex-col items-center gap-3 text-center">
            {cert ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15"
                >
                  <CheckCircle className="size-8 text-emerald-500" />
                </motion.div>
                <h3 className="text-[20px] font-bold text-foreground">Certificate Verified!</h3>
                <p className="text-[13px] text-muted-foreground">
                  This certificate is authentic and blockchain-secured.
                </p>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="flex size-16 items-center justify-center rounded-full bg-red-500/15"
                >
                  <AlertCircle className="size-8 text-red-500" />
                </motion.div>
                <h3 className="text-[20px] font-bold text-foreground">Certificate Not Found</h3>
                <p className="text-[13px] text-muted-foreground">
                  The credential ID could not be verified.
                </p>
              </>
            )}
          </div>

          {cert && (
            <div className="rounded-2xl bg-muted/50 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">Credential ID</span>
                <span className="font-mono font-medium">{cert.certificateId}</span>
              </div>
              <Separator className="opacity-50" />
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">Recipient</span>
                <span className="font-medium">{cert.userName}</span>
              </div>
              <Separator className="opacity-50" />
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">Course</span>
                <span className="font-medium text-right max-w-[180px] truncate">{cert.courseTitle}</span>
              </div>
              <Separator className="opacity-50" />
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">Score</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{cert.score ?? 0}%</span>
              </div>
              <Separator className="opacity-50" />
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">Issued</span>
                <span className="font-medium">{formatDate(cert.issuedAt)}</span>
              </div>
              {cert.verificationHash && (
                <>
                  <Separator className="opacity-50" />
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                    <Shield className="size-3" />
                    <span className="font-mono">Blockchain: {cert.verificationHash?.slice(0, 20)}...</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN CERTIFICATES VIEW
   ═══════════════════════════════════════════════════════════ */
export function CertificatesView() {
  const { currentUser, setCurrentView } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [earnedCerts, setEarnedCerts] = useState<Certificate[]>([])
  const [inProgressCerts, setInProgressCerts] = useState<InProgressCertificate[]>([])
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null)
  const [verifyCert, setVerifyCert] = useState<Certificate | null>(null)
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')

  // Fetch certificates data
  useEffect(() => {
    if (!currentUser) return

    const fetchCertificates = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/certificates?userId=${currentUser.id}`)
        if (res.ok) {
          const json = await res.json()
          setEarnedCerts(json.earned || [])
          setInProgressCerts(json.inProgress || [])
        } else {
          setError('Failed to load certificates')
        }
      } catch {
        setError('Network error loading certificates')
      } finally {
        setLoading(false)
      }
    }

    fetchCertificates()
  }, [currentUser])

  // Download PDF handler (client-side generation)
  const handleDownloadPdf = useCallback(async (cert: Certificate) => {
    setDownloadLoading(cert.id)
    try {
      // Fetch download data from API
      const res = await fetch(`/api/certificates/download?certificateId=${cert.certificateId}&format=pdf`)
      if (!res.ok) throw new Error('Download failed')

      // Generate a printable HTML file as PDF alternative
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(generateCertificateHTML(cert))
        printWindow.document.close()
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }
      toast.success('Certificate ready for download!')
    } catch {
      toast.error('Failed to download certificate')
    } finally {
      setDownloadLoading(null)
    }
  }, [])

  // Download PNG handler (client-side canvas generation)
  const handleDownloadPng = useCallback(async (cert: Certificate) => {
    setDownloadLoading(cert.id)
    try {
      // Use html2canvas-like approach: open the certificate in a new window for screenshot
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(generateCertificateHTML(cert))
        printWindow.document.close()
        toast.info('Right-click the certificate image → Save as PNG')
      }
      toast.success('Certificate opened for PNG export')
    } catch {
      toast.error('Failed to download certificate')
    } finally {
      setDownloadLoading(null)
    }
  }, [])

  // Share handler
  const handleShare = useCallback(async (cert: Certificate) => {
    const shareData = {
      title: `${cert.courseTitle} — ShijlAI Academy Certificate`,
      text: `I've earned a certificate for "${cert.courseTitle}" on ShijlAI Academy! Score: ${cert.score ?? 0}%`,
      url: `https://shijlai.academy/verify/${cert.certificateId}`,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Copy link to clipboard
      await navigator.clipboard.writeText(shareData.url)
      toast.success('Certificate link copied to clipboard!')
    }
  }, [])

  // Verify handler
  const handleVerify = useCallback(async (cert: Certificate) => {
    try {
      const res = await fetch(`/api/certificates/verify?certificateId=${cert.certificateId}`)
      if (res.ok) {
        const json = await res.json()
        if (json.isValid) {
          setVerifyCert(cert)
        } else {
          setVerifyCert(null)
        }
      }
    } catch {
      toast.error('Verification failed')
    }
  }, [])

  // Continue course handler
  const handleContinueCourse = useCallback((cert: InProgressCertificate) => {
    setCurrentView('courses')
  }, [setCurrentView])

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
        <p className="text-[13px] text-muted-foreground">Loading certificates...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Award className="size-12 text-muted-foreground/30" />
        <p className="text-[13px] text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl ios-press"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    )
  }

  const hasAnyData = earnedCerts.length > 0 || inProgressCerts.length > 0

  const filteredEarnedCerts = earnedCerts.filter(cert => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!cert.courseTitle.toLowerCase().includes(q) && !cert.certificateId.toLowerCase().includes(q)) {
        return false
      }
    }
    if (filterType !== 'all' && cert.templateType !== filterType) {
      return false
    }
    return true
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={springTransition}
      className="space-y-6"
    >
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-[28px] md:text-[34px] font-bold flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white ios-shadow-sm">
              <Award className="size-5" />
            </div>
            My Certificates
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="outline" className="rounded-lg text-[12px] gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="size-3" />
              {earnedCerts.length} earned
            </Badge>
            <Badge variant="outline" className="rounded-lg text-[12px] gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400">
              <Clock className="size-3" />
              {inProgressCerts.length} in progress
            </Badge>
          </div>
        </div>
      </div>

      {/* ── Empty state ── */}
      {!hasAnyData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16 gap-4 text-center"
        >
          <div className="rounded-2xl bg-accent/30 p-8">
            <Award className="size-12 text-muted-foreground/40" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[22px] font-bold">No Certificates Yet</h3>
            <p className="text-[15px] text-muted-foreground max-w-sm">
              Complete a course to earn your first certificate. Keep learning and showcase your achievements!
            </p>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Sparkles className="size-3.5 text-amber-500" />
            <span>Complete courses with quizzes to earn certificates</span>
          </div>
          <Button
            className="mt-2 rounded-2xl gap-2 ios-press"
            onClick={() => setCurrentView('public-courses')}
          >
            <BookOpen className="size-4" />
            Explore Courses
          </Button>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════
          EARNED SECTION
          ═══════════════════════════════════════════════════════ */}
      {earnedCerts.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="h-px flex-1 sm:w-12 bg-gradient-to-r from-emerald-500/30 to-transparent" />
              <h3 className="text-[15px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2 shrink-0">
                <Star className="size-4" />
                Earned
              </h3>
              <div className="h-px flex-1 sm:w-12 bg-gradient-to-l from-emerald-500/30 to-transparent sm:hidden" />
            </div>
            
            <div className="flex-1 w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search certificates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 rounded-xl bg-card border-border/60"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-[140px] h-10 rounded-xl bg-card border-border/60">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="completion">Completion</SelectItem>
                    <SelectItem value="distinction">Distinction</SelectItem>
                    <SelectItem value="excellence">Excellence</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center bg-card rounded-xl p-1 border border-border/60 h-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`px-2 h-full rounded-lg ${viewMode === 'grid' ? 'bg-accent text-foreground shadow-sm' : 'text-muted-foreground'} ios-press`}
                  >
                    <Grid className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`px-2 h-full rounded-lg ${viewMode === 'list' ? 'bg-accent text-foreground shadow-sm' : 'text-muted-foreground'} ios-press`}
                  >
                    <List className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {filteredEarnedCerts.length > 0 ? (
            <div className={viewMode === 'grid' ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}>
              {filteredEarnedCerts.map((cert, index) => (
                <EarnedCertificateCard
                  key={cert.id}
                  cert={cert}
                  index={index}
                  onPreview={setPreviewCert}
                  onDownloadPdf={handleDownloadPdf}
                  onDownloadPng={handleDownloadPng}
                  onShare={handleShare}
                  onVerify={handleVerify}
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-2xl border border-border/40">
              <p className="text-muted-foreground text-[14px]">No certificates match your search criteria.</p>
              <Button variant="link" onClick={() => {setSearchQuery(''); setFilterType('all');}} className="mt-2 text-[13px]">Clear filters</Button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          IN PROGRESS SECTION
          ═══════════════════════════════════════════════════════ */}
      {inProgressCerts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-amber-500/30 to-transparent" />
            <h3 className="text-[15px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Lock className="size-4" />
              In Progress
            </h3>
            <div className="h-px flex-1 bg-gradient-to-l from-amber-500/30 to-transparent" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {inProgressCerts.map((cert, index) => (
              <InProgressCertificateCard
                key={cert.enrollmentId}
                cert={cert}
                index={index}
                onContinue={handleContinueCourse}
              />
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          CERTIFICATE VERIFICATION SECTION
          ═══════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent" />
          <h3 className="text-[15px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <Shield className="size-4" />
            Certificate Verification
          </h3>
          <div className="h-px flex-1 bg-gradient-to-l from-blue-500/30 to-transparent" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...springTransition }}
          className="rounded-2xl ios-shadow-sm bg-card border border-border/40 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 p-5 md:p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15">
                <Shield className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-[16px] font-semibold">Verify Certificate Authenticity</h4>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Anyone can verify your certificate at{' '}
                  <span className="font-medium text-blue-600 dark:text-blue-400">shijlai.academy/verify</span>.
                  Enter a Credential ID below to confirm authenticity — blockchain secured.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Enter Credential ID (e.g., SHIJL-GIT-20241230-SA)"
                className="flex-1 h-10 rounded-xl bg-background border-border/60 text-[13px] font-mono"
                id="verify-input"
              />
              <Button
                className="gap-2 rounded-xl h-10 ios-press"
                onClick={async () => {
                  const input = document.getElementById('verify-input') as HTMLInputElement
                  const certId = input?.value?.trim()
                  if (!certId) {
                    toast.error('Please enter a Credential ID')
                    return
                  }
                  try {
                    const res = await fetch(`/api/certificates/verify?certificateId=${encodeURIComponent(certId)}`)
                    if (res.ok) {
                      const json = await res.json()
                      if (json.isValid && json.certificate) {
                        setVerifyCert(json.certificate as Certificate)
                      } else {
                        setVerifyCert(null)
                      }
                    }
                  } catch {
                    toast.error('Verification failed')
                  }
                }}
              >
                <Search className="size-4" />
                Verify
              </Button>
            </div>

            {earnedCerts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-[11px] text-muted-foreground">Your credential IDs:</span>
                {earnedCerts.map((cert) => (
                  <button
                    key={cert.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-muted/60 px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ios-press"
                    onClick={() => {
                      const input = document.getElementById('verify-input') as HTMLInputElement
                      if (input) input.value = cert.certificateId
                    }}
                  >
                    <Shield className="size-2.5 text-emerald-500" />
                    {cert.certificateId}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MODALS
          ═══════════════════════════════════════════════════════ */}
      <CertificatePreviewModal
        cert={previewCert}
        open={!!previewCert}
        onClose={() => setPreviewCert(null)}
        onDownloadPdf={handleDownloadPdf}
        onDownloadPng={handleDownloadPng}
        onShare={handleShare}
        onVerify={handleVerify}
      />

      <VerificationModal
        open={verifyCert !== null}
        onClose={() => setVerifyCert(null)}
        cert={verifyCert}
      />
    </motion.div>
  )
}

/* ─── Helper: Generate printable certificate HTML ─── */
function generateCertificateHTML(cert: Certificate): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Certificate - ${cert.courseTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; background: #f0fdf4;
      font-family: Georgia, 'Times New Roman', serif;
    }
    .cert {
      width: 800px; padding: 60px; background: white;
      border: 3px solid #059669; border-radius: 20px; position: relative;
    }
    .corner { position: absolute; width: 30px; height: 30px; border-color: #10b981; }
    .corner-tl { top: 15px; left: 15px; border-top: 3px solid; border-left: 3px solid; border-radius: 8px 0 0 0; }
    .corner-tr { top: 15px; right: 15px; border-top: 3px solid; border-right: 3px solid; border-radius: 0 8px 0 0; }
    .corner-bl { bottom: 15px; left: 15px; border-bottom: 3px solid; border-left: 3px solid; border-radius: 0 0 0 8px; }
    .corner-br { bottom: 15px; right: 15px; border-bottom: 3px solid; border-right: 3px solid; border-radius: 0 0 8px 0; }
    .logo { text-align: center; margin-bottom: 10px; }
    .logo-circle {
      display: inline-flex; width: 64px; height: 64px; align-items: center; justify-content: center;
      border-radius: 50%; background: linear-gradient(135deg, #10b981, #14b8a6); color: white;
      font-size: 28px; font-weight: bold;
    }
    .academy { font-size: 12px; letter-spacing: 5px; text-transform: uppercase; color: #059669; text-align: center; }
    .title { font-size: 32px; font-weight: bold; text-align: center; color: #111; margin: 15px 0; }
    .subtitle { font-size: 14px; color: #6b7280; text-align: center; }
    .name { font-size: 28px; font-weight: bold; text-align: center; color: #059669; margin: 20px 0 5px; }
    .course { font-size: 22px; font-weight: 600; text-align: center; color: #111; margin: 10px 0; }
    .divider { width: 100px; height: 2px; background: #10b981; margin: 20px auto; }
    .info { display: flex; justify-content: center; gap: 40px; margin-top: 20px; }
    .info-item { text-align: center; }
    .info-value { font-size: 24px; font-weight: bold; color: #059669; }
    .info-label { font-size: 11px; color: #9ca3af; margin-top: 2px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; }
    .footer p { font-size: 11px; color: #9ca3af; }
    .credential { font-family: monospace; font-size: 11px; color: #6b7280; }
    @media print {
      body { background: white; }
      .cert { border: 3px solid #059669; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="cert">
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>
    <div class="logo"><div class="logo-circle">🎓</div></div>
    <p class="academy">ShijlAI Academy</p>
    <h1 class="title">Certificate of Completion</h1>
    <p class="subtitle">This is to certify that</p>
    <p class="name">${cert.userName}</p>
    <p class="subtitle">has successfully completed</p>
    <p class="course">${cert.courseTitle}</p>
    ${cert.instructorName ? `<p class="subtitle" style="margin-top:10px">Instructed by ${cert.instructorName}</p>` : ''}
    <div class="divider"></div>
    <div class="info">
      <div class="info-item">
        <div class="info-value">${cert.score ?? 0}%</div>
        <div class="info-label">Score</div>
      </div>
      <div class="info-item">
        <div class="info-value" style="font-size:16px">${formatDate(cert.issuedAt)}</div>
        <div class="info-label">Date Issued</div>
      </div>
    </div>
    <div class="footer">
      <p>Credential ID: <span class="credential">${cert.certificateId}</span></p>
      <p>Verify at: <span style="color:#059669">shijlai.academy/verify/${cert.certificateId}</span></p>
    </div>
  </div>
</body>
</html>`
}
