// ─── Admin Dashboard Types ──────────────────────────────────────────────────

export interface WelcomeData {
  greeting: string
  date: string
  systemStatus: string
  uptime: string
}

export interface Stats {
  totalUsers: number
  totalCourses: number
  totalEnrollments: number
  totalRevenue: number
  activeUsersToday: number
  activeUsersWeek: number
  avgSessionDuration: number
  totalCertificates: number
  newUsersMonth: number
  churnRate: number
}

export interface PlatformGrowthItem {
  date: string
  users: number
  enrollments: number
}

export interface UserDistribution {
  students: number
  instructors: number
  admins: number
  parents: number
}

export interface CategoryDistributionItem {
  category: string
  courses: number
  enrollments: number
}

export interface PopularCourse {
  id: string
  title: string
  category: string
  enrollmentCount: number
  rating: number
  instructor: string
  revenue: number
}

export interface RecentSignup {
  name: string
  email: string
  role: string
  date: string
}

export interface DailyActivityItem {
  date: string
  activeUsers: number
  xpEarned: number
  lessonsCompleted: number
  quizzesTaken: number
}

export interface SystemAlert {
  type: string
  message: string
  time: string
}

export interface ContentModeration {
  pendingReviews: number
  reportedContent: number
  flaggedUsers: number
}

export interface FeatureFlag {
  name: string
  enabled: boolean
  rollout: number
}

export interface RevenueBreakdownItem {
  source: string
  amount: number
}

export interface AdminDashboardData {
  role: string
  welcomeData: WelcomeData
  stats: Stats
  platformGrowth: PlatformGrowthItem[]
  userDistribution: UserDistribution
  categoryDistribution: CategoryDistributionItem[]
  popularCourses: PopularCourse[]
  recentSignups: RecentSignup[]
  dailyActivity: DailyActivityItem[]
  systemAlerts: SystemAlert[]
  contentModeration: ContentModeration
  featureFlags: FeatureFlag[]
  revenueBreakdown: RevenueBreakdownItem[]
}

export interface CurrencyConfig {
  code: string
  symbol: string
  name: string
  rate: number
}

// Widget IDs for layout management
export type WidgetId =
  | 'welcome'
  | 'stats'
  | 'system-status'
  | 'growth'
  | 'distribution'
  | 'courses'
  | 'category-activity'
  | 'signups'
  | 'alerts'
  | 'feature-flags'
  | 'student-insights'
