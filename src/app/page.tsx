'use client'

import { useEffect, useState, Suspense, lazy, type ComponentType } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, GraduationCap } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { TooltipProvider } from '@/components/ui/tooltip'
import { NotificationProvider, NotificationBell } from '@/components/notification-bell'
import type { View } from '@/lib/types'
import { resolveViewKey } from '@/lib/view-utils'
import { cn } from '@/lib/utils'

// View loaders - defined as functions so they are only evaluated when called
const viewLoaders: Record<string, () => Promise<{ default: ComponentType }>> = {
  'landing': () => import('@/components/views/landing-view').then(m => ({ default: m.LandingView })),
  'login': () => import('@/components/views/login-view').then(m => ({ default: m.LoginView })),
  'register': () => import('@/components/views/register-view').then(m => ({ default: m.RegisterView })),
  'forgot-password': () => import('@/components/views/forgot-password-view').then(m => ({ default: m.ForgotPasswordView })),
  'verify-otp': () => import('@/components/views/verify-otp-view').then(m => ({ default: m.VerifyOtpView })),
  'reset-password': () => import('@/components/views/reset-password-view').then(m => ({ default: m.ResetPasswordView })),
  'public-courses': () => import('@/components/views/public-courses-view').then(m => ({ default: m.PublicCoursesView })),
  'public-course-detail': () => import('@/components/views/public-course-detail-view').then(m => ({ default: m.PublicCourseDetailView })),
  'pricing': () => import('@/components/views/pricing-view').then(m => ({ default: m.PricingView })),
  'instructors': () => import('@/components/views/instructors-view').then(m => ({ default: m.InstructorsView })),
  'application-status': () => import('@/components/views/application-status-view').then(m => ({ default: m.ApplicationStatusView })),
  'about': () => import('@/components/views/about-view').then(m => ({ default: m.AboutView })),
  'blog': () => import('@/components/views/blog-view').then(m => ({ default: m.BlogView })),
  'blog-detail': () => import('@/components/views/blog-detail-view').then(m => ({ default: m.BlogDetailView })),
  'dashboard': () => import('@/components/views/dashboard-view').then(m => ({ default: m.DashboardView })),
  'tutor': () => import('@/components/views/ask-shijlai-view').then(m => ({ default: m.AskShijlAIView })),
  'achievements': () => import('@/components/views/progress-analytics-view').then(m => ({ default: m.ProgressAnalyticsView })),
  'my-skills': () => import('@/components/views/my-skills-view').then(m => ({ default: m.MySkillsView })),
  'courses': () => import('@/components/views/my-learning-view').then(m => ({ default: m.MyLearningView })),
  'course-detail': () => import('@/components/views/course-detail-view').then(m => ({ default: m.CourseDetailView })),
  'quiz': () => import('@/components/views/quiz-view').then(m => ({ default: m.QuizView })),
  'analytics': () => import('@/components/views/analytics-view').then(m => ({ default: m.AnalyticsView })),
  'certificates': () => import('@/components/views/certificates-view').then(m => ({ default: m.CertificatesView })),
  'settings': () => import('@/components/views/settings-view').then(m => ({ default: m.SettingsView })),
  'student-settings': () => import('@/components/views/student-settings-view').then(m => ({ default: m.StudentSettingsView })),
  'student-assignments': () => import('@/components/views/student-assignments-view').then(m => ({ default: m.StudentAssignmentsView })),
  'student-assignment-detail': () => import('@/components/views/student-assignment-detail-view').then(m => ({ default: m.StudentAssignmentDetailView })),
  'student-messages': () => import('@/components/views/student-messages-view').then(m => ({ default: m.StudentMessagesView })),
  'student-schedule': () => import('@/components/views/student-schedule-view').then(m => ({ default: m.StudentScheduleView })),
  'student-qa': () => import('@/components/views/student-qa-view').then(m => ({ default: m.StudentQAView })),
  'recommendations': () => import('@/components/views/recommendations-view').then(m => ({ default: m.RecommendationsView })),
  'shijlai-hub': () => import('@/components/views/shijlai-hub-view').then(m => ({ default: m.ShijlAIHubView })),
  'learning-companion': () => import('@/components/views/learning-companion-view').then(m => ({ default: m.LearningCompanionView })),
  'student-profile': () => import('@/components/views/student-profile-view').then(m => ({ default: m.StudentProfileView })),
  'explore': () => import('@/components/views/explore-view').then(m => ({ default: m.ExploreView })),
  'community': () => import('@/components/views/community-view').then(m => ({ default: m.CommunityView })),
  'notifications': () => import('@/components/notifications-page').then(m => ({ default: m.NotificationsPage })),
  'course-player': () => import('@/components/views/course-player-view').then(m => ({ default: m.CoursePlayerView })),
  'course-creator': () => import('@/components/views/course-creator-view').then(m => ({ default: m.CourseCreatorView })),
  'instructor-dashboard': () => import('@/components/views/instructor-dashboard').then(m => ({ default: m.InstructorDashboard })),
  'instructor-courses': () => import('@/components/views/instructor-courses-view').then(m => ({ default: m.InstructorCoursesView })),
  'instructor-course-detail': () => import('@/components/views/instructor-course-detail-view').then(m => ({ default: m.InstructorCourseDetailView })),
  'instructor-students': () => import('@/components/views/instructor-students-view').then(m => ({ default: m.InstructorStudentsView })),
  'instructor-student-detail': () => import('@/components/views/instructor-student-detail-view').then(m => ({ default: m.InstructorStudentDetailView })),
  'instructor-quizzes': () => import('@/components/views/instructor-quizzes-view').then(m => ({ default: m.InstructorQuizzesView })),
  'instructor-assignments': () => import('@/components/views/instructor-assignments-view').then(m => ({ default: m.InstructorAssignmentsView })),
  'instructor-assignment-detail': () => import('@/components/views/instructor-assignment-detail-view').then(m => ({ default: m.InstructorAssignmentDetailView })),
  'instructor-analytics': () => import('@/components/views/instructor-analytics-view').then(m => ({ default: m.InstructorAnalyticsView })),
  'instructor-qa': () => import('@/components/views/instructor-qa-view').then(m => ({ default: m.InstructorQAView })),
  'instructor-schedule': () => import('@/components/views/instructor-schedule-view').then(m => ({ default: m.InstructorScheduleView })),
  'instructor-revenue': () => import('@/components/views/instructor-revenue-view').then(m => ({ default: m.InstructorRevenueView })),
  'instructor-marketing': () => import('@/components/views/instructor-marketing-view').then(m => ({ default: m.InstructorMarketingView })),
  'instructor-copilot': () => import('@/components/views/instructor-copilot-view').then(m => ({ default: m.InstructorCopilotView })),
  'instructor-assessment': () => import('@/components/views/instructor-assessment-view').then(m => ({ default: m.InstructorAssessmentView })),
  'instructor-settings': () => import('@/components/views/instructor-settings-view').then(m => ({ default: m.InstructorSettingsView })),
  'instructor-messages': () => import('@/components/views/instructor-messages-view').then(m => ({ default: m.InstructorMessagesView })),
  'instructor-profile': () => import('@/components/views/instructor-profile-view').then(m => ({ default: m.InstructorProfileView })),
  'admin': () => import('@/components/admin/admin-dashboard-v2').then(m => ({ default: m.AdminDashboardV2 })),
  'admin-users': () => import('@/components/admin/admin-user-management').then(m => ({ default: m.AdminUserManagement })),
  'admin-courses': () => import('@/components/admin/admin-course-management').then(m => ({ default: m.AdminCourseManagementWrapped })),
  'admin-qa-reports': () => import('@/components/views/admin-views').then(m => ({ default: m.AdminQAReportsView })),
  'admin-revenue': () => import('@/components/admin/admin-revenue-finance').then(m => ({ default: m.AdminRevenueFinanceWrapped })),
  'admin-payouts': () => import('@/components/views/admin-views').then(m => ({ default: m.AdminPayoutsView })),
  'admin-refunds': () => import('@/components/views/admin-views').then(m => ({ default: m.AdminRefundsView })),
  'admin-marketing': () => import('@/components/views/admin-views').then(m => ({ default: m.AdminMarketingView })),
  'admin-notifications': () => import('@/components/views/admin-views').then(m => ({ default: m.AdminNotificationsView })),
  'admin-live-sessions': () => import('@/components/views/admin-views').then(m => ({ default: m.AdminLiveSessionsView })),
  'admin-gamification': () => import('@/components/views/admin-views').then(m => ({ default: m.AdminGamificationView })),
  'admin-ai-config': () => import('@/components/views/admin-views').then(m => ({ default: m.AdminAIConfigView })),
  'admin-appearance': () => import('@/components/views/admin-views').then(m => ({ default: m.AdminAppearanceView })),
  'admin-security': () => import('@/components/views/admin-views').then(m => ({ default: m.AdminSecurityView })),
  'admin-settings': () => import('@/components/views/admin-views').then(m => ({ default: m.AdminSettingsView })),
  'admin-audit-log': () => import('@/components/views/admin-views').then(m => ({ default: m.AdminAuditLogView })),
  'admin-dev-tools': () => import('@/components/views/admin-views').then(m => ({ default: m.AdminDevToolsView })),
  'admin-user-detail': () => import('@/components/views/admin-user-detail-view').then(m => ({ default: m.AdminUserDetailView })),
  'admin-instructors': () => import('@/components/admin/admin-instructor-management').then(m => ({ default: m.AdminInstructorManagement })),
  'admin-instructor-detail': () => import('@/components/views/admin-instructor-detail-view').then(m => ({ default: m.AdminInstructorDetailView })),
  'admin-course-review': () => import('@/components/admin/admin-course-review').then(m => ({ default: m.AdminCourseReview })),
  'admin-course-review-detail': () => import('@/components/admin/admin-course-review-detail').then(m => ({ default: m.AdminCourseReviewDetail })),
  'admin-applications': () => import('@/components/admin/admin-application-management').then(m => ({ default: m.AdminApplicationManagement })),
  'admin-analytics': () => import('@/components/views/admin-analytics-view').then(m => ({ default: m.AdminAnalyticsView })),
  'admin-copilot': () => import('@/components/views/admin-copilot-view').then(m => ({ default: m.AdminCopilotView })),
  'admin-system-intelligence': () => import('@/components/views/admin-system-intelligence-view').then(m => ({ default: m.AdminSystemIntelligenceView })),
  'admin-shijlai-hub': () => import('@/components/views/admin-shijlai-hub-view').then(m => ({ default: m.AdminShijlAIHubView })),
  'admin-blog': () => import('@/components/admin/AdminBlogManagement').then(m => ({ default: m.AdminBlogManagement })),
}

// Pre-create lazy components at module level (not during render)
const lazyComponents: Record<string, React.LazyExoticComponent<ComponentType>> = {}
function getOrCreateLazy(view: string): React.LazyExoticComponent<ComponentType> {
  if (!lazyComponents[view]) {
    const loader = viewLoaders[view] || viewLoaders['landing']!
    lazyComponents[view] = lazy(loader)
  }
  return lazyComponents[view]
}

// Pre-create all lazy components eagerly at module scope
Object.keys(viewLoaders).forEach(key => {
  getOrCreateLazy(key)
})

// Shell lazy components - created at module level, not during render
const LazyAdminSidebar = lazy(() => import('@/components/admin-shell').then(m => ({ default: m.AdminSidebar })))
const LazyAdminHeader = lazy(() => import('@/components/admin-shell').then(m => ({ default: m.AdminHeader })))
const LazyAdminBottomTabBar = lazy(() => import('@/components/admin-shell').then(m => ({ default: m.AdminBottomTabBar })))
const LazyInstructorSidebar = lazy(() => import('@/components/instructor-shell').then(m => ({ default: m.InstructorSidebar })))
const LazyInstructorHeader = lazy(() => import('@/components/instructor-shell').then(m => ({ default: m.InstructorHeader })))
const LazyInstructorBottomTabBar = lazy(() => import('@/components/instructor-shell').then(m => ({ default: m.InstructorBottomTabBar })))
const LazyStudentSidebar = lazy(() => import('@/components/student-shell').then(m => ({ default: m.StudentSidebar })))
const LazyStudentHeader = lazy(() => import('@/components/student-shell').then(m => ({ default: m.StudentHeader })))
const LazyStudentBottomTabBar = lazy(() => import('@/components/student-shell').then(m => ({ default: m.StudentBottomTabBar })))
const LazyPublicBottomBar = lazy(() => import('@/components/public-bottom-bar').then(m => ({ default: m.PublicBottomBar })))

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] },
}

const publicPageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] },
}

const authViews: View[] = ['login', 'register', 'forgot-password', 'verify-otp', 'reset-password']
const publicViews: View[] = ['landing', 'public-courses', 'public-course-detail', 'pricing', 'instructors', 'about', 'blog', 'blog-detail']

// resolveViewKey is now imported from @/lib/view-utils

// Loading fallback for Suspense
function ViewLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-2">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  )
}

// Lazy view renderer - uses pre-created lazy components
function LazyViewContent({ view, userRole }: { view: View; userRole?: UserRole }) {
  const viewKey = resolveViewKey(view, userRole)
  const Comp = getOrCreateLazy(viewKey)
  return (
    <Suspense fallback={<ViewLoading />}>
      <Comp />
    </Suspense>
  )
}

export default function Home() {
  const { currentView, initializing, setInitializing, currentUser } = useAppStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Handle URL-based navigation (e.g., ?view=reset-password&token=xxx, ?view=application-status&code=xxx from email links)
  const { setCurrentView } = useAppStore()
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const view = params.get('view')
    if (view === 'reset-password') {
      setCurrentView('reset-password')
    } else if (view === 'application-status') {
      setCurrentView('application-status')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scroll to top when view changes
  useEffect(() => {
    if (!mounted) return
    // For portal shells (admin/instructor/student), scroll the main content area
    const mainEl = document.querySelector('main.overflow-y-auto')
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'instant' })
    }
    // For public views and auth views, scroll the window
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [currentView, mounted])

  useEffect(() => {
    if (!mounted) return
    const initApp = async () => {
      try {
        await fetch('/api/seed')
      } catch {
        // Ignore seed errors - may already be seeded
      } finally {
        setInitializing(false)
      }
    }
    initApp()
  }, [mounted, setInitializing])

  // No auto-redirect: logged-in users can browse public pages freely

  if (!mounted || initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" suppressHydrationWarning>
        <div className="flex flex-col items-center gap-5">
          <div className="flex size-20 items-center justify-center rounded-[22px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
            <GraduationCap className="size-10" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <h2 className="text-[20px] font-bold text-foreground"><span style={{fontFamily:"ScriptMTBold, cursive", fontWeight:"bold"}}>Shijl</span><span style={{fontFamily:"LatinModernRoman, serif", fontWeight:"bold"}}>AI</span> Academy</h2>
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span className="text-[13px] text-muted-foreground">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Compute the resolved view key for consistent rendering & keying
  const resolvedViewKey = resolveViewKey(currentView, currentUser?.role)

  const isAuthView = authViews.includes(currentView)
  const isPublicView = publicViews.includes(currentView)
  const isCoursePlayer = currentView === 'course-player'
  const isInstructor = currentUser?.role === 'instructor'
  const isAdmin = currentUser?.role === 'admin'
  const isMessagesView = currentView === 'student-messages' || currentView === 'instructor-messages'
  const isFullView = isMessagesView || currentView === 'tutor' || currentView === 'recommendations' || currentView === 'shijlai-hub'

  // Auth views: full-screen without sidebar/header
  if (isAuthView) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <AnimatePresence mode="wait">
            <motion.div key={currentView} {...publicPageTransition} style={{ willChange: 'auto' }}>
              <LazyViewContent view={currentView} userRole={currentUser?.role} />
            </motion.div>
          </AnimatePresence>
        </div>
      </TooltipProvider>
    )
  }

  // Public views: full-screen with their own navigation + mobile bottom bar
  if (isPublicView) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-background p-0">
          <AnimatePresence mode="wait">
            <motion.div key={currentView} {...publicPageTransition} style={{ willChange: 'auto' }}>
              <LazyViewContent view={currentView} userRole={currentUser?.role} />
            </motion.div>
          </AnimatePresence>
          {/* Spacer for fixed bottom bar on mobile */}
          <div className="h-20 md:hidden" />
        </div>
        <Suspense fallback={null}><LazyPublicBottomBar /></Suspense>
      </TooltipProvider>
    )
  }

  // Course Player: Immersive full-screen layout
  if (isCoursePlayer) {
    return (
      <TooltipProvider>
        <div className="h-screen bg-background overflow-hidden">
          <LazyViewContent view={currentView} userRole={currentUser?.role} />
        </div>
      </TooltipProvider>
    )
  }

  // Admin Shell
  if (isAdmin) {
    return (
      <TooltipProvider>
        <div className="flex flex-col min-h-screen md:h-screen">
          <Suspense fallback={null}><LazyAdminHeader /></Suspense>
          <div className="flex flex-1 overflow-hidden p-2 gap-2">
            <Suspense fallback={null}><LazyAdminSidebar /></Suspense>
            <main className={cn(
              'flex-1 rounded-xl',
              isFullView ? 'overflow-hidden p-0' : 'overflow-y-auto scrollbar-thin p-4 md:p-5 lg:p-6 pb-24 md:pb-6'
            )}>
              <AnimatePresence mode="wait">
                <motion.div key={resolvedViewKey} {...pageTransition} className={isFullView ? 'h-full' : ''}>
                  <LazyViewContent view={currentView} userRole={currentUser?.role} />
                </motion.div>
              </AnimatePresence>
              {!isFullView && (
                <footer className="mt-8 pt-4 pb-2 text-center text-[11px] text-muted-foreground/50">
                  <p><span style={{fontFamily:"ScriptMTBold, cursive", fontWeight:"bold"}}>Shijl</span><span style={{fontFamily:"LatinModernRoman, serif", fontWeight:"bold"}}>AI</span> Academy — Admin Panel</p>
                </footer>
              )}
            </main>
          </div>
        </div>
        <Suspense fallback={null}><LazyAdminBottomTabBar /></Suspense>
      </TooltipProvider>
    )
  }

  // Instructor Shell
  if (isInstructor) {
    return (
      <TooltipProvider>
        <NotificationProvider>
          <div className="flex flex-col min-h-screen md:h-screen">
            <Suspense fallback={null}><LazyInstructorHeader /></Suspense>
            <div className="flex flex-1 overflow-hidden p-2 gap-2">
              <Suspense fallback={null}><LazyInstructorSidebar /></Suspense>
              <main className={cn(
                'flex-1 rounded-xl',
                isFullView ? 'overflow-hidden p-0' : 'overflow-y-auto scrollbar-thin p-4 md:p-5 lg:p-6 pb-24 md:pb-6'
              )}>
                <AnimatePresence mode="wait">
                  <motion.div key={resolvedViewKey} {...pageTransition} className={isFullView ? 'h-full' : ''}>
                    <LazyViewContent view={currentView} userRole={currentUser?.role} />
                  </motion.div>
                </AnimatePresence>

              </main>
            </div>
          </div>
          <Suspense fallback={null}><LazyInstructorBottomTabBar /></Suspense>
        </NotificationProvider>
      </TooltipProvider>
    )
  }

  // Student Shell
  return (
    <TooltipProvider>
      <NotificationProvider>
        <div className="flex flex-col min-h-screen md:h-screen">
          <Suspense fallback={null}><LazyStudentHeader /></Suspense>
          <div className="flex flex-1 overflow-hidden p-2 gap-2">
            <Suspense fallback={null}><LazyStudentSidebar /></Suspense>
            <main className={cn(
              'flex-1 rounded-xl',
              isFullView ? 'overflow-hidden p-0' : 'overflow-y-auto scrollbar-thin p-4 md:p-5 lg:p-6 pb-24 md:pb-6'
            )}>
              <AnimatePresence mode="wait">
                <motion.div key={resolvedViewKey} {...pageTransition} className={isFullView ? 'h-full' : ''}>
                  <LazyViewContent view={currentView} userRole={currentUser?.role} />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
        <Suspense fallback={null}><LazyStudentBottomTabBar /></Suspense>
      </NotificationProvider>
    </TooltipProvider>
  )
}
