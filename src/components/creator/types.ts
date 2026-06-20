// ============================================================
// Enterprise Course Creator - Shared Types
// ============================================================

import type { CourseLevel, LessonType, QuizType, AssignmentType, SubmissionType, QuestionType } from '@/lib/types'

// ─── Wizard Form Data ───

export interface WizardModule {
  id: string
  title: string
  description: string
  order: number
  learningObjectives: string[]
  isPublished: boolean
  lessons: WizardLesson[]
  quizzes: WizardQuiz[]
  expanded?: boolean
}

export interface WizardLesson {
  id: string
  title: string
  description: string
  content: string
  type: LessonType
  videoUrl: string
  duration: number
  order: number
  resources: WizardResource[]
  objectives: string[]
  isFree: boolean
  isPublished: boolean
  transcript: string
  slideUrl: string
  captions: CaptionSetting
}

export interface WizardQuiz {
  id: string
  title: string
  description: string
  type: QuizType
  timeLimit: number
  passingScore: number
  maxAttempts: number
  randomizeQuestions: boolean
  showCorrectAnswers: 'after_submission' | 'after_course' | 'never'
  questions: WizardQuestion[]
  isNew?: boolean
}

export interface WizardQuestion {
  id: string
  text: string
  type: QuestionType
  options: string[]
  correctAnswer: string
  explanation: string
  points: number
  order: number
}

export interface WizardAssignment {
  id: string
  title: string
  description: string
  instructions: string
  type: AssignmentType
  moduleId: string | null
  maxScore: number
  dueDate: string
  rubric: RubricItem[]
  resources: WizardResource[]
  submissionType: SubmissionType
  allowedFileTypes: string[]
  maxFileSize: number
  gradingType: 'instructor' | 'ai_assisted' | 'peer_review'
  wordLimit: number | null
  order: number
}

export interface RubricItem {
  id: string
  criteria: string
  description: string
  maxPoints: number
}

export interface WizardResource {
  id: string
  title: string
  url: string
  type: 'pdf' | 'video' | 'link' | 'document' | 'code' | 'image'
}

export interface CaptionSetting {
  mode: 'none' | 'auto_generate' | 'upload_srt'
  languages: string[]
}

export interface DiscountCode {
  id: string
  code: string
  discount: number
  type: 'percentage' | 'fixed' | 'full'
  expiryDate: string
  maxUses: number
  usedCount: number
}

export interface DripScheduleItem {
  moduleId: string
  moduleTitle: string
  releaseAfterDays: number
}

// ─── Full Form Data ───

export interface CourseFormData {
  // Step 1: Basics
  title: string
  subtitle: string
  description: string
  category: string
  subcategory: string
  topicTag: string
  language: string
  subtitleLanguages: string[]
  difficultyLevel: CourseLevel
  thumbnail: string
  promoVideoUrl: string

  // Step 2: Curriculum
  modules: WizardModule[]

  // Step 3: Content (per-lesson editing, managed in modules)

  // Step 4: Pricing
  pricingModel: 'free' | 'paid' | 'subscription' | 'freemium' | 'cohort'
  priceUSD: number
  discountCodes: DiscountCode[]
  enrollmentDeadline: 'always' | 'set_date'
  enrollmentDeadlineDate: string
  studentLimitEnabled: boolean
  studentLimit: number
  certificateEnabled: boolean
  prerequisiteCourses: string[]
  accessDuration: 'lifetime' | 'limited'
  accessDurationMonths: number
  dripContent: boolean
  dripSchedule: DripScheduleItem[]

  // Step 5: SEO
  seoTitle: string
  metaDescription: string
  urlSlug: string
  searchTags: string[]
  whatYouLearn: string[]
  targetAudience: string[]
  requirements: string[]

  // Step 6: Publish
  publishOption: 'review' | 'scheduled' | 'draft'
  scheduledDate: string
  scheduledTime: string

  // Computed / flags
  estimatedDuration: number
  completionThreshold: number
}

// ─── Step Completion Status ───

export type StepStatus = 'not_started' | 'in_progress' | 'complete'

export interface StepInfo {
  id: number
  title: string
  desc: string
  icon: string
}

// ─── Auto-save ───

export interface AutoSaveState {
  lastSaved: Date | null
  isSaving: boolean
  hasUnsavedChanges: boolean
}

// ─── AI Assistant ───

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// ─── Course Health Score ───

export interface HealthCheckItem {
  id: string
  label: string
  status: 'pass' | 'warning' | 'fail'
  action?: string
  actionLabel?: string
}
