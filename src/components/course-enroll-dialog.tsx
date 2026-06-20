'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, AlertTriangle, Play, BookOpen, Clock, BarChart3, Tag } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import type { Course } from '@/lib/types'
import { toast } from 'sonner'

export function CourseEnrollDialog({
  course,
  open,
  onOpenChange,
}: {
  course: Course | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { currentUser, setEnrollments, setCurrentView, setSelectedCourseId } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEnroll = async () => {
    if (!currentUser || !course) {
      toast.error('You must be logged in to enroll.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          courseId: course.id,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to enroll in course')
      }

      // Fetch updated enrollments to refresh global state
      const enrollRes = await fetch(`/api/enrollments?userId=${currentUser.id}`)
      if (enrollRes.ok) {
        const enrollData = await enrollRes.json()
        setEnrollments(enrollData.enrollments || [])
      }

      setSuccess(true)
      toast.success('Successfully enrolled!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoToCourse = () => {
    onOpenChange(false)
    if (course) {
      setSelectedCourseId(course.id)
      setCurrentView('course-player')
    }
  }

  // Reset state when dialog opens
  if (!open && (loading || success || error)) {
    setTimeout(() => {
      setLoading(false)
      setSuccess(false)
      setError(null)
    }, 300)
  }

  if (!course) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-[24px]">
        {/* Dynamic Header Background based on course category */}
        <div className="relative h-32 bg-gradient-to-br from-emerald-500 to-teal-600 flex flex-col items-center justify-center text-white px-6">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
          <BookOpen className="size-10 mb-2 relative z-10" />
          <h2 className="text-[18px] font-bold text-center relative z-10 drop-shadow-sm line-clamp-1">{course.title}</h2>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="text-center space-y-2">
                  <DialogTitle className="text-[20px] font-bold">Ready to enroll?</DialogTitle>
                  <p className="text-[14px] text-muted-foreground">
                    You are about to enroll in this course. It will be added to your learning dashboard.
                  </p>
                </div>

                {/* Course Quick Stats */}
                <div className="bg-muted/40 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-center text-[12px] font-medium">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Clock className="size-4" /> {course.estimatedDuration} hrs</span>
                  <span className="flex items-center gap-1.5 text-muted-foreground"><BarChart3 className="size-4" /> {course.level}</span>
                  {course.category && (
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Tag className="size-4" /> {course.category}</span>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-[13px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-11"
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 rounded-xl h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white ios-press"
                    onClick={handleEnroll}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">Enroll Now</span>
                    )}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-4 text-center space-y-4"
              >
                <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 mx-auto text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-8" />
                </div>
                <div>
                  <h3 className="text-[20px] font-bold text-foreground">You&apos;re Enrolled!</h3>
                  <p className="text-[14px] text-muted-foreground mt-1.5">
                    The course has been added to your dashboard. You can start learning right away.
                  </p>
                </div>
                <div className="pt-4">
                  <Button
                    className="w-full rounded-xl h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white ios-press"
                    onClick={handleGoToCourse}
                  >
                    <Play className="size-4 mr-2" />
                    Go to Course
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
