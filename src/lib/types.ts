// Types matching the Prisma schema for ShijlAI Academy

export type UserRole = 'student' | 'instructor' | 'admin' | 'parent'
export type Language = 'en' | 'ur'
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'
export type LessonType = 'video' | 'text' | 'interactive' | 'quiz' | 'assignment' | 'live-session' | 'download'
export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed'
export type QuizType = 'practice' | 'assessment' | 'diagnostic' | 'certification'
export type AssignmentType = 'written' | 'coding' | 'project' | 'peer-review' | 'presentation'
export type SubmissionType = 'text' | 'file' | 'url' | 'multiple'
export type QuestionType = 'mcq' | 'true_false' | 'fill_blank' | 'short_answer'
export type BadgeCategory = 'learning' | 'streak' | 'social' | 'achievement'

export type View =
  // Auth views
  | 'landing'
  | 'public-courses'
  | 'public-course-detail'
  | 'pricing'
  | 'instructors'
  | 'application-status'
  | 'about'
  | 'blog'
  | 'blog-detail'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'verify-otp'
  | 'reset-password'
  // App views (authenticated)
  | 'dashboard'
  | 'courses'
  | 'course-detail'
  | 'tutor'
  | 'analytics'
  | 'achievements'
  | 'my-skills'
  | 'quiz'
  | 'certificates'
  | 'admin'
  | 'settings'
  | 'instructor-courses'
  | 'instructor-course-detail'
  | 'course-creator'
  | 'instructor-students'
  | 'instructor-student-detail'
  | 'instructor-assignments'
  | 'instructor-assignment-detail'
  | 'instructor-quizzes'
  | 'instructor-analytics'
  | 'instructor-qa'
  | 'instructor-schedule'
  | 'instructor-revenue'
  | 'instructor-marketing'
  | 'instructor-copilot'
  | 'instructor-assessment'
  | 'instructor-settings'
  | 'instructor-profile'
  | 'instructor-messages'
  | 'student-assignments'
  | 'student-assignment-detail'
  | 'student-messages'
  | 'student-profile'
  | 'student-schedule'
  | 'student-qa'
  | 'recommendations'
  | 'learning-paths'
  | 'smart-content'
  | 'explore'
  | 'community'
  | 'course-player'
  | 'notifications'
  | 'shijlai-hub'
  | 'learning-companion'
  // Admin views
  | 'admin-users'
  | 'admin-courses'
  | 'admin-qa-reports'
  | 'admin-revenue'
  | 'admin-payouts'
  | 'admin-refunds'
  | 'admin-marketing'
  | 'admin-notifications'
  | 'admin-live-sessions'
  | 'admin-gamification'
  | 'admin-blog'
  | 'admin-ai-config'
  | 'admin-appearance'
  | 'admin-security'
  | 'admin-settings'
  | 'admin-audit-log'
  | 'admin-dev-tools'
  | 'admin-user-detail'
  | 'admin-instructors'
  | 'admin-instructor-detail'
  | 'admin-course-review'
  | 'admin-course-review-detail'
  | 'admin-applications'
  | 'admin-analytics'
  | 'admin-copilot'
  | 'admin-system-intelligence'
  | 'admin-shijlai-hub'
  | 'admin-blog'

export type PublicView = Extract<View,
  | 'landing'
  | 'public-courses'
  | 'public-course-detail'
  | 'pricing'
  | 'instructors'
  | 'application-status'
  | 'about'
  | 'blog'
  | 'blog-detail'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'verify-otp'
>

export interface User {
  id: string
  email: string
  name: string
  avatar: string | null
  role: UserRole
  bio: string | null
  language: Language
  xp: number
  level: number
  shijlCoins: number
  streak: number
  longestStreak: number
  lastActiveAt: string
  createdAt: string
  updatedAt: string
}

export interface Course {
  id: string
  title: string
  description: string
  category: string
  level: CourseLevel
  language: Language
  thumbnail: string | null
  price: number
  isPublished: boolean
  isArchived: boolean
  enrollmentCount: number
  rating: number
  learningObjectives: string | null
  prerequisites: string | null
  targetAudience: string | null
  tags: string | null
  estimatedDuration: number
  certificateEnabled: boolean
  completionThreshold: number
  createdAt: string
  updatedAt: string
  instructorId: string
  instructor?: User
  modules?: Module[]
  enrollments?: Enrollment[]
  quizzes?: Quiz[]
  assignments?: Assignment[]
}

export interface Module {
  id: string
  title: string
  description: string | null
  order: number
  courseId: string
  learningObjectives: string | null
  isPublished: boolean
  lessons?: Lesson[]
  createdAt: string
  updatedAt: string
}

export interface Lesson {
  id: string
  title: string
  description: string | null
  content: string
  type: LessonType
  videoUrl: string | null
  duration: number
  order: number
  moduleId: string
  resources: string | null
  objectives: string | null
  isFree: boolean
  isPublished: boolean
  transcript: string | null
  slideUrl: string | null
  progress?: LessonProgress[]
  createdAt: string
  updatedAt: string
}

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  progress: number
  enrolledAt: string
  completedAt: string | null
  lastAccessed: string
  course?: Course
  user?: User
  lessonProgress?: LessonProgress[]
}

export interface LessonProgress {
  id: string
  enrollmentId: string
  lessonId: string
  status: LessonProgressStatus
  timeSpent: number
  completedAt: string | null
  xpEarned: number
  lesson?: Lesson
}

export interface Quiz {
  id: string
  title: string
  description: string | null
  type: QuizType
  timeLimit: number
  passingScore: number
  courseId: string | null
  moduleId: string | null
  maxAttempts: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
  questions?: Question[]
  attempts?: QuizAttempt[]
}

export interface Question {
  id: string
  quizId: string
  text: string
  type: QuestionType
  options: string // JSON string for MCQ options
  correctAnswer: string
  explanation: string | null
  points: number
  order: number
  createdAt: string
}

export interface QuizAttempt {
  id: string
  userId: string
  quizId: string
  score: number
  maxScore: number
  percentage: number
  passed: boolean
  answers: string // JSON string of user answers
  startedAt: string
  completedAt: string | null
  xpEarned: number
  quiz?: Quiz
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: BadgeCategory
  xpReward: number
  coinReward: number
  requirement: string // JSON string describing unlock criteria
}

export interface UserBadge {
  id: string
  userId: string
  badgeId: string
  earnedAt: string
  badge?: Badge
}

export interface Certificate {
  id: string
  userId: string
  courseId: string
  courseTitle: string
  userName: string
  instructorName: string | null
  score: number
  issuedAt: string
  certificateId: string
  verificationHash: string | null
  templateType: string
}

export interface TutorSession {
  id: string
  userId: string
  title: string
  context: string | null
  language: string
  isArchived: boolean
  createdAt: string
  updatedAt: string
  messages?: ChatMessage[]
}

export interface ChatMessage {
  id: string
  userId: string
  sessionId: string | null
  role: 'user' | 'assistant'
  content: string
  context: string | null
  language: string
  quickAction: string | null
  createdAt: string
}

export interface ParentLink {
  id: string
  parentId: string
  childId: string
}

export interface DailyActivity {
  id: string
  userId: string
  date: string // YYYY-MM-DD format
  xpEarned: number
  lessonsCompleted: number
  quizzesTaken: number
  timeSpent: number
}

export interface PlatformStats {
  id: string
  totalUsers: number
  totalCourses: number
  totalEnrollments: number
  totalCertificates: number
  activeUsers: number
  updatedAt: string
}

export interface Assignment {
  id: string
  title: string
  description: string
  instructions: string
  type: AssignmentType
  moduleId: string | null
  courseId: string
  maxScore: number
  dueDate: string | null
  rubric: string | null
  resources: string | null
  submissionType: SubmissionType
  wordLimit: number | null
  isPublished: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface LeaderboardEntry {
  userId: string
  userName: string
  avatar: string | null
  xp: number
  level: number
  streak: number
  rank: number
}

// Helper types for parsed JSON fields
export interface MCQOptions {
  options: string[]
}

export interface UserAnswer {
  questionId: string
  answer: string
  timeSpent?: number
}

export interface BadgeRequirement {
  type: string
  value: number
  description: string
}

export interface Skill {
  id: string
  name: string
  category: string
  description: string | null
  icon: string | null
}

export interface UserSkill {
  id: string
  userId: string
  skillId: string
  skill?: Skill
  level: string // beginner, intermediate, advanced, expert
  progress: number // 0-100
  xpEarned: number
}

export interface ProgressOverview {
  totalLearningTime: number // seconds
  thisMonthTime: number // seconds
  totalLessonsCompleted: number
  thisMonthLessons: number
  quizStats: {
    total: number
    passed: number
    passRate: number
  }
  assignmentStats: {
    total: number
    submitted: number
    rate: number
  }
}

export interface ProgressHeatmapPoint {
  date: string
  day: number
  week: number
  xp: number
  active: boolean
}

export interface CourseProgress {
  enrollmentId: string
  courseId: string
  courseTitle: string
  category: string
  level: string
  thumbnail: string | null
  progress: number
  status: string
  enrolledAt: string
  completedAt: string | null
  lastAccessed: string
  totalLessons: number
  completedLessons: number
  totalTimeSpent: number
  totalXpEarned: number
  quizStats: {
    total: number
    passed: number
    avgScore: number
  }
  assignmentStats: {
    total: number
    submitted: number
    graded: number
  }
}

export interface SkillProgress {
  id: string
  skillId: string
  name: string
  category: string
  icon: string | null
  level: string
  progress: number
  xpEarned: number
}

export interface BadgeWithStatus {
  id: string
  name: string
  description: string
  icon: string
  category: string
  xpReward: number
  coinReward: number
  earned: boolean
  earnedAt: string | null
  requirement?: string
}

export interface XPData {
  total: number
  level: number
  levelProgress: number
  xpToNextLevel: number
  coins: number
  streak: number
  longestStreak: number
  leaderboardRank: number
  totalStudents: number
}

export interface ProgressData {
  overview: ProgressOverview
  heatmap: ProgressHeatmapPoint[]
  courses: CourseProgress[]
  skills: SkillProgress[]
  achievements: {
    earned: BadgeWithStatus[]
    locked: BadgeWithStatus[]
  }
  xp: XPData
}

export interface InProgressCertificate {
  enrollmentId: string
  courseId: string
  courseTitle: string
  progress: number
  totalLessons: number
  completedLessons: number
  remainingItems: string[] // e.g., ["Lesson 3.2", "Lesson 3.3", "Section 4", "Final Quiz"]
  estimatedTimeToComplete: number // minutes
  category: string
  thumbnail: string | null
  certificateEnabled: boolean
}

export interface CertificateVerification {
  isValid: boolean
  certificate: {
    certificateId: string
    userName: string
    courseTitle: string
    instructorName: string | null
    score: number
    issuedAt: string
    templateType: string
  } | null
  message: string
}

export interface CertificatesPageData {
  earned: Certificate[]
  inProgress: InProgressCertificate[]
  totalEarned: number
  totalInProgress: number
}

// ==================== PROGRESS & GOALS ====================

export interface LearningGoal {
  id: string
  userId: string
  type: 'weekly_xp' | 'weekly_time' | 'weekly_lessons' | 'monthly_xp' | 'monthly_courses' | 'custom'
  title: string
  target: number
  current: number
  unit: 'xp' | 'minutes' | 'lessons' | 'courses' | 'quizzes'
  period: 'weekly' | 'monthly' | 'custom'
  status: 'active' | 'completed' | 'failed' | 'abandoned'
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
}

export interface DailyChallenge {
  id: string
  title: string
  description: string
  type: 'lesson' | 'quiz' | 'streak' | 'xp' | 'time' | 'assignment'
  target: number
  unit: 'lessons' | 'xp' | 'minutes' | 'quizzes' | 'assignments'
  xpReward: number
  coinReward: number
  icon: string
  difficulty: 'easy' | 'medium' | 'hard'
  date: string
  isActive: boolean
  userProgress?: UserChallenge
}

export interface UserChallenge {
  id: string
  userId: string
  challengeId: string
  progress: number
  completed: boolean
  completedAt: string | null
}

export interface XpActivity {
  id: string
  userId: string
  action: string
  xpAmount: number
  coinAmount: number
  description: string
  metadata: string | null
  createdAt: string
}

export interface StreakFreeze {
  id: string
  userId: string
  date: string
  usedAt: string
  costCoins: number
}

export interface StreakInfo {
  current: number
  longest: number
  freezesUsedThisMonth: number
  maxFreezesPerMonth: number
  freezeCost: number
  canFreeze: boolean
  userCoins: number
  lastActiveDate: string | null
}

export interface WeeklyReport {
  currentWeek: {
    xpEarned: number
    lessonsCompleted: number
    timeSpent: number
    quizzesTaken: number
    activeDays: number
  }
  previousWeek: {
    xpEarned: number
    lessonsCompleted: number
    timeSpent: number
    quizzesTaken: number
    activeDays: number
  }
  change: {
    xpPercent: number
    lessonsPercent: number
    timePercent: number
    quizzesPercent: number
    activeDaysPercent: number
  }
  topSkill: string | null
  streakDaysThisWeek: number
}

export interface LeaderboardEntry {
  userId: string
  userName: string
  avatar: string | null
  xp: number
  level: number
  streak: number
  rank: number
  isCurrentUser: boolean
}

export interface EnhancedProgressData extends ProgressData {
  goals: LearningGoal[]
  challenges: DailyChallenge[]
  xpActivity: XpActivity[]
  weeklyReport: WeeklyReport
  streakInfo: StreakInfo
  leaderboard: LeaderboardEntry[]
}
