'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { ShijlAIBrand } from '@/components/ui/brand-text'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

function PasswordStrengthIndicator({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains a number', pass: /\d/.test(password) },
    { label: 'Contains uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Contains special character', pass: /[^A-Za-z0-9]/.test(password) },
  ]

  const passed = checks.filter((c) => c.pass).length
  const strength = passed === 0 ? 0 : passed <= 1 ? 1 : passed <= 2 ? 2 : passed <= 3 ? 3 : 4
  const strengthColors = ['bg-muted', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500']
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']

  if (!password) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 space-y-2"
    >
      {/* Strength bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= strength ? strengthColors[strength] : 'bg-border/40'
            }`}
          />
        ))}
      </div>
      {strength > 0 && (
        <p className={`text-[12px] font-medium ${strength >= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {strengthLabels[strength]} password
        </p>
      )}
      {/* Checks list */}
      <div className="grid grid-cols-2 gap-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            {c.pass
              ? <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
              : <XCircle className="size-3 text-muted-foreground/40 shrink-0" />}
            <span className={`text-[11px] ${c.pass ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/60'}`}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export function ResetPasswordView() {
  const { setCurrentView } = useAppStore()
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Read token from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const urlToken = params.get('token')
      if (urlToken) setToken(urlToken)
    }
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token.trim()) {
      setError('Reset token is missing. Please use the link from your email.')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to reset password. Please request a new link.')
        return
      }

      setSuccess(true)
      toast.success('Password reset successfully!')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [token, newPassword, confirmPassword])

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-8">
      {/* Gradient background */}
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
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, ...springTransition }}
                className="flex flex-col items-center mb-8"
              >
                <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 mb-5">
                  <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <Lock className="size-7" />
                  </div>
                </div>
                <h1 className="text-[28px] font-bold tracking-tight">Set New Password</h1>
                <p className="text-[15px] text-muted-foreground mt-1 text-center">
                  Choose a strong password for your account
                </p>
              </motion.div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-2xl bg-red-50 dark:bg-red-950/30 p-3.5 text-[13px] text-red-600 dark:text-red-400 text-center"
                >
                  {error}
                </motion.div>
              )}

              {/* Token field (hidden if pre-filled from URL) */}
              {!token && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, ...springTransition }}
                  className="mb-4 space-y-2"
                >
                  <Label htmlFor="reset-token" className="text-[13px] font-medium text-muted-foreground">
                    Reset Token
                  </Label>
                  <Input
                    id="reset-token"
                    type="text"
                    placeholder="Paste the token from your email"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="h-12 rounded-xl text-[14px] border-border/60 bg-background/60 focus-visible:ring-primary/30 font-mono"
                  />
                  <p className="text-[12px] text-muted-foreground">
                    Copy the reset link from your email and paste only the token part here.
                  </p>
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, ...springTransition }}
                  className="space-y-2"
                >
                  <Label htmlFor="new-password" className="text-[13px] font-medium text-muted-foreground">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-12 rounded-xl pl-10 pr-10 text-[15px] border-border/60 bg-background/60 focus-visible:ring-primary/30"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={newPassword} />
                </motion.div>

                {/* Confirm Password */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, ...springTransition }}
                  className="space-y-2"
                >
                  <Label htmlFor="confirm-password" className="text-[13px] font-medium text-muted-foreground">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`h-12 rounded-xl pl-10 pr-10 text-[15px] border-border/60 bg-background/60 focus-visible:ring-primary/30 ${
                        confirmPassword && confirmPassword !== newPassword
                          ? 'border-red-400 focus-visible:ring-red-400/30'
                          : confirmPassword && confirmPassword === newPassword
                          ? 'border-emerald-400 focus-visible:ring-emerald-400/30'
                          : ''
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-[12px] text-red-500">Passwords don&apos;t match</p>
                  )}
                  {confirmPassword && confirmPassword === newPassword && (
                    <p className="text-[12px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Passwords match
                    </p>
                  )}
                </motion.div>

                {/* Submit */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, ...springTransition }}
                >
                  <Button
                    type="submit"
                    id="reset-password-submit"
                    disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-[15px] ios-press shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      'Reset Password'
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
                  <ShieldCheck className="size-7" />
                </div>
              </div>
              <h2 className="text-[24px] font-bold tracking-tight">Password Reset!</h2>
              <p className="text-[15px] text-muted-foreground mt-2 max-w-xs">
                Your password has been updated successfully. A confirmation email has been sent to you.
              </p>
              <Button
                id="go-to-login"
                onClick={() => setCurrentView('login')}
                className="mt-6 h-12 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold ios-press shadow-lg shadow-emerald-500/25"
              >
                Sign In with New Password
              </Button>
            </motion.div>
          )}

          {/* Back to Sign In (only shown on form state) */}
          {!success && (
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
          )}

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
