'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  Loader2,
  ArrowLeft,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { ShijlAIBrand } from '@/components/ui/brand-text'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp'
import type { User } from '@/lib/types'

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }
const RESEND_COOLDOWN = 60

export function VerifyOtpView() {
  const { setCurrentView, pendingAuthEmail, setIsAuthenticated, setCurrentUser } = useAppStore()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN)
  const [resendLoading, setResendLoading] = useState(false)
  const otpInputRef = useRef<HTMLDivElement>(null)

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Auto-paste support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const pasted = e.clipboardData?.getData('text')?.trim()
      if (pasted && /^\d{6}$/.test(pasted)) {
        setOtp(pasted)
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (otp.length !== 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingAuthEmail, otpCode: otp }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid verification code')
        return
      }

      setCurrentUser(data.user as User)
      setIsAuthenticated(true)
      setCurrentView('landing')
      toast.success('Email verified successfully!')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [otp, pendingAuthEmail, setCurrentUser, setIsAuthenticated, setCurrentView])

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setResendLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingAuthEmail }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to resend code')
        return
      }

      setResendCooldown(RESEND_COOLDOWN)
      setOtp('')
      toast.success('A new verification code has been sent to your email.')
    } catch {
      setError('Failed to resend code. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  const maskedEmail = pendingAuthEmail
    ? pendingAuthEmail.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c)
    : 'your email'

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-8">
      {/* Gradient background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 size-[500px] rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-[500px] rounded-full bg-gradient-to-tr from-teal-200/40 to-emerald-200/30 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...springTransition, duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="ios-glass-thick rounded-3xl ios-shadow-lg p-8">
          {/* Header */}
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
            <h1 className="text-[28px] font-bold tracking-tight">Verify Your Email</h1>
            <p className="text-[15px] text-muted-foreground mt-1 text-center">
              We sent a 6-digit code to{' '}
              <span className="font-semibold text-foreground">{maskedEmail}</span>
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

          {/* OTP Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, ...springTransition }}
              className="flex justify-center"
              ref={otpInputRef}
            >
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
              >
                <InputOTPGroup>
                  <InputOTPSlot
                    index={0}
                    className="size-14 rounded-xl border-border/60 bg-background/60 text-[22px] font-bold data-[active=true]:border-primary data-[active=true]:ring-primary/20 first:rounded-l-xl first:rounded-r-none"
                  />
                  <InputOTPSlot
                    index={1}
                    className="size-14 rounded-none border-border/60 bg-background/60 text-[22px] font-bold data-[active=true]:border-primary data-[active=true]:ring-primary/20"
                  />
                  <InputOTPSlot
                    index={2}
                    className="size-14 rounded-none border-border/60 bg-background/60 text-[22px] font-bold data-[active=true]:border-primary data-[active=true]:ring-primary/20"
                  />
                </InputOTPGroup>
                <InputOTPSeparator className="px-1.5" />
                <InputOTPGroup>
                  <InputOTPSlot
                    index={3}
                    className="size-14 rounded-none border-border/60 bg-background/60 text-[22px] font-bold data-[active=true]:border-primary data-[active=true]:ring-primary/20"
                  />
                  <InputOTPSlot
                    index={4}
                    className="size-14 rounded-none border-border/60 bg-background/60 text-[22px] font-bold data-[active=true]:border-primary data-[active=true]:ring-primary/20"
                  />
                  <InputOTPSlot
                    index={5}
                    className="size-14 rounded-xl border-border/60 bg-background/60 text-[22px] font-bold data-[active=true]:border-primary data-[active=true]:ring-primary/20 last:rounded-r-xl last:rounded-l-none"
                  />
                </InputOTPGroup>
              </InputOTP>
            </motion.div>

            {/* Verify Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, ...springTransition }}
            >
              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-[15px] ios-press shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </motion.div>
          </form>

          {/* Resend Code */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, ...springTransition }}
            className="text-center mt-5"
          >
            {resendCooldown > 0 ? (
              <p className="text-[13px] text-muted-foreground">
                Resend code in{' '}
                <span className="font-semibold text-foreground">{resendCooldown}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="text-[13px] font-semibold text-primary hover:text-primary/80 transition-colors ios-press disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {resendLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Mail className="size-3.5" />
                )}
                Resend Code
              </button>
            )}
          </motion.div>

          {/* Back to Sign In */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, ...springTransition }}
            className="text-center mt-5"
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
