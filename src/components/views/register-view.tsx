'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  Check,
  Brain,
  Bot,
  Sparkles,
  Trophy,
  Flame,
  Zap,
  BookOpen,
  Target,
  ArrowRight,
} from 'lucide-react'
import { ShijlAIBrand } from '@/components/ui/brand-text'
import { ShijlAILogo } from '@/components/ui/shijlai-logo'
import { PublicNav } from '@/components/public-nav'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score <= 3) return { score, label: 'Medium', color: 'bg-yellow-500' }
  return { score, label: 'Strong', color: 'bg-emerald-500' }
}

// Social button icons as SVG paths
function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

export function RegisterView() {
  const { setCurrentView, setPendingAuthEmail, setPendingAuthRole } = useAppStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [otpToast, setOtpToast] = useState<string | null>(null)

  const passwordStrength = getPasswordStrength(password)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!termsAccepted) {
      setError('Please accept the terms and conditions')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'student' }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create account')
        return
      }

      // Store email and role for OTP verification
      setPendingAuthEmail(email)
      setPendingAuthRole('student')

      // Show OTP in a toast for demo
      if (data.otpCode) {
        setOtpToast(data.otpCode)
        // Auto-hide after 15 seconds
        setTimeout(() => setOtpToast(null), 15000)
      }

      // Navigate to OTP verification
      setCurrentView('verify-otp')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [name, email, password, termsAccepted, setPendingAuthEmail, setPendingAuthRole, setCurrentView])

  const handleSocialAuth = async (provider: string) => {
    setSocialLoading(provider)
    setError('')

    try {
      const res = await fetch('/api/auth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Social authentication failed')
        return
      }

      // Social auth auto-verifies, stay on landing page
      const { setIsAuthenticated, setCurrentUser } = useAppStore.getState()
      setCurrentUser(data.user)
      setIsAuthenticated(true)
      setCurrentView('landing')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSocialLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNav activeView="register" />
      <div className="flex-1 flex items-center justify-center py-12">
      {/* OTP Demo Toast */}
      {otpToast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 ios-glass-thick rounded-2xl ios-shadow-lg px-5 py-3.5 flex items-center gap-3"
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
            <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground font-medium">Demo OTP Code</p>
            <p className="text-[20px] font-bold tracking-widest text-foreground">{otpToast}</p>
          </div>
        </motion.div>
      )}

      <div className="w-full max-w-5xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 rounded-3xl overflow-hidden ios-shadow-xl border border-border/30 bg-card">
          
          {/* Left Column — Branding & Features */}
          <div className="hidden lg:flex flex-col justify-between relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-10 text-white overflow-hidden">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-300/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

            {/* Top — Logo & Heading */}
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <ShijlAILogo size="lg" variant="light" />
                <span className="text-xl font-bold tracking-tight"><ShijlAIBrand variant="light" /></span>
              </div>
              <h2 className="text-3xl font-bold leading-tight mb-3">
                Start Your<br />Learning Journey
              </h2>
              <p className="text-emerald-100 text-[15px] leading-relaxed max-w-sm">
                Join 50,000+ students learning smarter with AI-powered tutoring, personalized paths, and gamified experiences.
              </p>
            </div>
          </div>


          {/* Right Column — Registration Form */}
          <div className="p-8 sm:p-10 flex flex-col justify-center">
            {/* Mobile logo (shown on small screens) */}
            <div className="lg:hidden flex flex-col items-center mb-6">
              <ShijlAILogo size="lg" className="mb-3" />
              <h1 className="text-[26px] font-bold tracking-tight">Create Your Account</h1>
              <p className="text-[14px] text-muted-foreground mt-1">Start your learning journey</p>
            </div>

            {/* Desktop header */}
            <div className="hidden lg:block mb-8">
              <h1 className="text-[28px] font-bold tracking-tight">Create Your Account</h1>
              <p className="text-[15px] text-muted-foreground mt-1">Start your learning journey</p>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/30 p-3.5 text-[13px] text-red-600 dark:text-red-400 text-center"
              >
                {error}
              </motion.div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, ...springTransition }}
                className="space-y-2"
              >
                <Label htmlFor="reg-name" className="text-[13px] font-medium text-muted-foreground">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 rounded-xl pl-10 text-[15px] border-border/60 bg-background/60 focus-visible:ring-primary/30"
                    required
                  />
                </div>
              </motion.div>

              {/* Email */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, ...springTransition }}
                className="space-y-2"
              >
                <Label htmlFor="reg-email" className="text-[13px] font-medium text-muted-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl pl-10 text-[15px] border-border/60 bg-background/60 focus-visible:ring-primary/30"
                    required
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, ...springTransition }}
                className="space-y-2"
              >
                <Label htmlFor="reg-password" className="text-[13px] font-medium text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl pl-10 pr-10 text-[15px] border-border/60 bg-background/60 focus-visible:ring-primary/30"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            level <= (passwordStrength.score <= 1 ? 1 : passwordStrength.score <= 3 ? 2 : 3)
                              ? passwordStrength.color
                              : 'bg-border/40'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-[11px] font-medium ${
                      passwordStrength.label === 'Weak' ? 'text-red-500' :
                      passwordStrength.label === 'Medium' ? 'text-yellow-600' :
                      'text-emerald-600'
                    }`}>
                      {passwordStrength.label}
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Terms & Conditions */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.28, ...springTransition }}
                className="flex items-start gap-3 pt-1"
              >
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-[13px] text-muted-foreground leading-relaxed cursor-pointer">
                  I agree to the{' '}
                  <span className="text-primary font-medium">Terms of Service</span>
                  {' '}and{' '}
                  <span className="text-primary font-medium">Privacy Policy</span>
                </label>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, ...springTransition }}
              >
                <Button
                  type="submit"
                  disabled={loading || !termsAccepted}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-[15px] ios-press shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.36, ...springTransition }}
              className="flex items-center gap-3 my-6"
            >
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/60 to-border/60" />
              <span className="text-[12px] text-muted-foreground font-medium whitespace-nowrap">or sign up with</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border/60 to-border/60" />
            </motion.div>

            {/* Social Auth Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, ...springTransition }}
              className="flex gap-3"
            >
              {[
                { name: 'google', icon: GoogleIcon, label: 'Google' },
                { name: 'facebook', icon: FacebookIcon, label: 'Facebook' },
                { name: 'apple', icon: AppleIcon, label: 'Apple' },
              ].map((social) => (
                <motion.button
                  key={social.name}
                  type="button"
                  onClick={() => handleSocialAuth(social.name)}
                  disabled={socialLoading !== null}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border border-border/60 bg-background/60 hover:bg-accent/50 transition-colors ios-press disabled:opacity-50"
                >
                  {socialLoading === social.name ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <social.icon />
                      <span className="text-[13px] font-medium text-foreground">{social.label}</span>
                    </>
                  )}
                </motion.button>
              ))}
            </motion.div>

            {/* Sign In Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.44, ...springTransition }}
              className="text-center mt-6"
            >
              <p className="text-[14px] text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setCurrentView('login')}
                  className="font-semibold text-primary hover:text-primary/80 transition-colors ios-press"
                >
                  Sign in
                </button>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}
