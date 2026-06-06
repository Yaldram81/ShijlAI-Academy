'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  BookOpen,
  Shield,
  Download,
  Info,
  Copy,
  Check,
  ChevronDown,
  UserCircle,
  Sparkles,
  Brain,
  Bot,
  Trophy,
  Flame,
  Award,
  ArrowRight,
  Zap,
  Users,
} from 'lucide-react'
import { ShijlAIBrand } from '@/components/ui/brand-text'
import { ShijlAILogo } from '@/components/ui/shijlai-logo'
import { PublicNav } from '@/components/public-nav'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { User } from '@/lib/types'

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

type DemoRole = 'student' | 'instructor' | 'admin'

// Demo credentials data
const DEMO_CREDENTIALS: { role: DemoRole; email: string; password: string; label: string; icon: typeof GraduationCap; color: string; gradient: string }[] = [
  {
    role: 'student',
    email: 'ahmed.khan@shijlai.com',
    password: 'demo123',
    label: 'Student',
    icon: GraduationCap,
    color: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    role: 'instructor',
    email: 'sara.malik@shijlai.com',
    password: 'demo123',
    label: 'Instructor',
    icon: BookOpen,
    color: 'text-teal-600 dark:text-teal-400',
    gradient: 'from-teal-500 to-cyan-600',
  },
  {
    role: 'admin',
    email: 'admin@shijlai.com',
    password: 'demo123',
    label: 'Admin',
    icon: Shield,
    color: 'text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-500 to-orange-600',
  },
]

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

export function LoginView() {
  const { setCurrentView, setIsAuthenticated, setCurrentUser } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [demoLoading, setDemoLoading] = useState<DemoRole | null>(null)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [credentialsExpanded, setCredentialsExpanded] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)

  // Check form validity
  useEffect(() => {
    const emailValid = email.length > 0 && email.includes('@')
    const passwordValid = password.length >= 4
    setIsFormValid(emailValid && passwordValid)
  }, [email, password])

  // Copy email to clipboard
  const copyToClipboard = useCallback(async (text: string, role: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedEmail(role)
      toast.success(`${role} email copied!`)
      setTimeout(() => setCopiedEmail(null), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedEmail(role)
      toast.success(`${role} email copied!`)
      setTimeout(() => setCopiedEmail(null), 2000)
    }
  }, [])

  const handleDownloadProject = async () => {
    setDownloading(true)
    toast.info('Preparing project archive... This may take a few seconds.', { duration: 5000 })
    try {
      const link = document.createElement('a')
      link.href = '/api/download'
      link.download = 'shijlai-academy.zip'
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => {
        setDownloading(false)
        toast.success('Download started!')
      }, 3000)
    } catch (err) {
      console.error('Download failed:', err)
      toast.error('Download failed. Please try again.')
      setDownloading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.needsVerification) {
          setCurrentView('verify-otp')
          return
        }
        setError(data.error || 'Invalid email or password')
        return
      }

      setCurrentUser(data.user as User)
      setIsAuthenticated(true)
      setCurrentView('landing')
      toast.success(`Welcome back, ${data.user?.name || 'User'}!`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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

      setCurrentUser(data.user as User)
      setIsAuthenticated(true)
      setCurrentView('landing')
      toast.success(`Welcome, ${data.user?.name || 'User'}!`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSocialLoading(null)
    }
  }

  const handleDemoLogin = async (role: DemoRole) => {
    setDemoLoading(role)
    setError('')

    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Demo login failed. Please try again.')
        toast.error(data.error || 'Demo login failed')
        return
      }

      if (data.user) {
        setCurrentUser(data.user as User)
        setIsAuthenticated(true)
        setCurrentView('landing')
        toast.success(`Welcome! Logged in as ${data.user.name}`)
      } else {
        setError('No demo user found for this role.')
        toast.error('No demo user available')
      }
    } catch (err) {
      console.error('Demo login error:', err)
      setError('Network error. Please check your connection.')
      toast.error('Network error. Please try again.')
    } finally {
      setDemoLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNav activeView="login" />
      <div className="flex-1 flex items-center justify-center py-12">
      <div className="w-full max-w-5xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 rounded-3xl overflow-hidden ios-shadow-xl border border-border/30 bg-card">
          
          {/* Left Column — Branding & Illustration */}
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
                Welcome Back to<br />Smarter Learning
              </h2>
              <p className="text-emerald-100 text-[15px] leading-relaxed max-w-sm">
                Sign in to continue your personalized learning journey with AI-powered tutoring, gamified experiences, and 50,000+ students worldwide.
              </p>
            </div>
          </div>

          {/* Right Column — Login Form */}
          <div className="p-8 sm:p-10 flex flex-col justify-center">
            {/* Mobile logo (shown on small screens) */}
            <div className="lg:hidden flex flex-col items-center mb-6">
              <ShijlAILogo size="lg" className="mb-3" />
              <h1 className="text-[26px] font-bold tracking-tight">Welcome Back</h1>
              <p className="text-[14px] text-muted-foreground mt-1">Sign in to continue learning</p>
            </div>

            {/* Desktop header */}
            <div className="hidden lg:block mb-8">
              <h1 className="text-[28px] font-bold tracking-tight">Welcome Back</h1>
              <p className="text-[15px] text-muted-foreground mt-1">Sign in to continue learning</p>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -5, height: 0 }}
                  className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/30 p-3.5 text-[13px] text-red-600 dark:text-red-400 text-center overflow-hidden"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, ...springTransition }}
                className="space-y-2"
              >
                <Label htmlFor="login-email" className="text-[13px] font-medium text-muted-foreground">
                  Email
                </Label>
                <div className="relative group">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 size-4 transition-colors duration-200 ${emailFocused ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    className={`h-12 rounded-xl pl-10 text-[15px] border-border/60 bg-background/60 transition-all duration-300 ${
                      emailFocused
                        ? 'ring-2 ring-emerald-500/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
                        : 'focus-visible:ring-primary/30'
                    }`}
                    required
                  />
                  <AnimatePresence>
                    {email.length > 0 && email.includes('@') && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <div className="size-5 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="size-3 text-white" strokeWidth={3} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, ...springTransition }}
                className="space-y-2"
              >
                <Label htmlFor="login-password" className="text-[13px] font-medium text-muted-foreground">
                  Password
                </Label>
                <div className="relative group">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 size-4 transition-colors duration-200 ${passwordFocused ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className={`h-12 rounded-xl pl-10 pr-10 text-[15px] border-border/60 bg-background/60 transition-all duration-300 ${
                      passwordFocused
                        ? 'ring-2 ring-emerald-500/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
                        : 'focus-visible:ring-primary/30'
                    }`}
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
              </motion.div>

              {/* Forgot Password & Form validity */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, ...springTransition }}
                className="flex justify-between items-center"
              >
                <AnimatePresence>
                  {isFormValid && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"
                    >
                      <Check className="size-3.5" />
                      <span className="text-[12px] font-medium">Ready to sign in</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  type="button"
                  onClick={() => setCurrentView('forgot-password')}
                  className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors ios-press ml-auto"
                >
                  Forgot Password?
                </button>
              </motion.div>

              {/* Sign In Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, ...springTransition }}
              >
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-[15px] ios-press shadow-lg shadow-emerald-500/25 transition-all relative overflow-hidden group"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                    animate={isFormValid && !loading ? { translateX: ['-100%', '100%'] } : {}}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
                  />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4 opacity-80" />
                        Sign In
                      </>
                    )}
                  </span>
                </Button>
              </motion.div>
            </form>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, ...springTransition }}
              className="flex items-center gap-3 my-6"
            >
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/60 to-border/60" />
              <span className="text-[12px] text-muted-foreground font-medium whitespace-nowrap">or sign in with</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border/60 to-border/60" />
            </motion.div>

            {/* Social Auth Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, ...springTransition }}
              className="flex gap-3"
            >
              {[
                { name: 'google', icon: GoogleIcon, label: 'Google' },
                { name: 'facebook', icon: FacebookIcon, label: 'Facebook' },
                { name: 'apple', icon: AppleIcon, label: 'Apple' },
              ].map((social, idx) => (
                <motion.button
                  key={social.name}
                  type="button"
                  onClick={() => handleSocialAuth(social.name)}
                  disabled={socialLoading !== null}
                  whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.05, ...springTransition }}
                  className="flex-1 flex items-center justify-center gap-2 h-[52px] rounded-xl border border-border/60 bg-background/60 hover:bg-accent/50 transition-colors disabled:opacity-50 shadow-sm"
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

            {/* Sign Up Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, ...springTransition }}
              className="text-center mt-6"
            >
              <p className="text-[14px] text-muted-foreground">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setCurrentView('register')}
                  className="font-semibold text-primary hover:text-primary/80 transition-colors ios-press"
                >
                  Sign up
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
