'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  Mail,
  Loader2,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react'
import { ShijlAIBrand } from '@/components/ui/brand-text'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

export function ForgotPasswordView() {
  const { setCurrentView } = useAppStore()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send reset link')
        return
      }

      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-8">
      {/* Gradient background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 size-[500px] rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/30 blur-3xl" />
        <div className="absolute -bottom-60 -left-40 size-[500px] rounded-full bg-gradient-to-tr from-teal-200/30 to-emerald-200/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...springTransition, duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="ios-glass-thick rounded-3xl ios-shadow-lg p-8">
          {!success ? (
            <>
              {/* Illustration Area */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, ...springTransition }}
                className="flex flex-col items-center mb-8"
              >
                <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 mb-5">
                  <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <ShieldCheck className="size-7" />
                  </div>
                </div>
                <h1 className="text-[28px] font-bold tracking-tight">Reset Your Password</h1>
                <p className="text-[15px] text-muted-foreground mt-1 text-center">
                  Enter your email and we&apos;ll send you a link to reset your password
                </p>
              </motion.div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-2xl bg-red-50 dark:bg-red-950/30 p-3.5 text-[13px] text-red-600 dark:text-red-400 text-center"
                >
                  {error}
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, ...springTransition }}
                  className="space-y-2"
                >
                  <Label htmlFor="forgot-email" className="text-[13px] font-medium text-muted-foreground">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-xl pl-10 text-[15px] border-border/60 bg-background/60 focus-visible:ring-primary/30"
                      required
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, ...springTransition }}
                >
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-[15px] ios-press shadow-lg shadow-emerald-500/25 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </motion.div>
              </form>
            </>
          ) : (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springTransition}
              className="flex flex-col items-center text-center"
            >
              <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 mb-5">
                <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <Mail className="size-7" />
                </div>
              </div>
              <h2 className="text-[24px] font-bold tracking-tight">Check Your Email</h2>
              <p className="text-[15px] text-muted-foreground mt-2 max-w-xs">
                We&apos;ve sent a password reset link to{' '}
                <span className="font-semibold text-foreground">{email}</span>.
                Click the link in the email to reset your password.
              </p>
              <p className="text-[13px] text-muted-foreground mt-3">
                Didn&apos;t receive it? Check your spam folder or try a different email.
              </p>
              <Button
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
                variant="outline"
                className="mt-6 rounded-xl h-11 px-6"
              >
                Try a different email
              </Button>
            </motion.div>
          )}

          {/* Back to Sign In */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, ...springTransition }}
            className="text-center mt-6"
          >
            <button
              type="button"
              onClick={() => setCurrentView('login')}
              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-primary hover:text-primary/80 transition-colors ios-press"
            >
              <ArrowLeft className="size-4" />
              Back to Sign In
            </button>
          </motion.div>

          {/* Logo watermark */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, ...springTransition }}
            className="flex items-center justify-center gap-1.5 mt-6 text-muted-foreground/40"
          >
            <GraduationCap className="size-4" />
            <span className="text-[11px] font-medium"><ShijlAIBrand variant="compact" /></span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
