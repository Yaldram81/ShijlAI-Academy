// ============================================================
// Enterprise Course Creator - Shared Constants
// ============================================================

import type { CourseLevel, LessonType, QuizType, AssignmentType, QuestionType, SubmissionType } from '@/lib/types'
import type { StepInfo } from './types'

export const STEPS: StepInfo[] = [
  { id: 0, title: 'Basics', desc: 'Title, description & details', icon: 'PenTool' },
  { id: 1, title: 'Structure', desc: 'Modules, lessons & curriculum', icon: 'Layers' },
  { id: 2, title: 'Content', desc: 'Lesson content & resources', icon: 'BookOpen' },
  { id: 3, title: 'Pricing', desc: 'Price, access & enrollment', icon: 'DollarSign' },
  { id: 4, title: 'SEO', desc: 'Discoverability & metadata', icon: 'Search' },
  { id: 5, title: 'Review', desc: 'Quality check & publish', icon: 'Rocket' },
]

export const CATEGORIES = [
  'IB', 'AP', 'Cambridge', 'IELTS', 'AWS',
  'Technology', 'Programming', 'Web Dev', 'Data Science',
  'Business', 'Science', 'Mathematics', 'Languages',
  'Arts & Design', 'Health', 'Social Sciences', 'Engineering',
  'Other',
]

export const SUBCATEGORIES: Record<string, string[]> = {
  IB: ['Physics HL', 'Chemistry HL', 'Mathematics HL', 'Biology HL', 'Economics'],
  AP: ['Calculus BC', 'Physics C', 'Computer Science A', 'Statistics', 'Chemistry'],
  Cambridge: ['Sciences', 'Commerce', 'Humanities'],
  IELTS: ['Academic', 'General Training'],
  AWS: ['Solutions Architect', 'Developer', 'SysOps', 'DevOps'],
  Technology: ['Programming', 'Web Development', 'Data Science', 'AI/ML', 'Cloud Computing', 'Cybersecurity', 'DevOps', 'Mobile Dev'],
  Programming: ['Python', 'JavaScript', 'Java', 'C++', 'Go', 'Rust'],
  'Web Dev': ['Frontend', 'Backend', 'Full Stack', 'React', 'Node.js'],
  'Data Science': ['Machine Learning', 'Deep Learning', 'Data Analysis', 'NLP', 'Computer Vision'],
  Business: ['Management', 'Marketing', 'Finance', 'Entrepreneurship', 'Project Management', 'Accounting'],
  Science: ['Physics', 'Chemistry', 'Biology', 'Environmental Science', 'Astronomy'],
  Mathematics: ['Algebra', 'Calculus', 'Statistics', 'Geometry', 'Discrete Math'],
  Languages: ['English', 'Arabic', 'Chinese', 'French', 'German', 'Spanish', 'IELTS', 'TOEFL', 'Japanese', 'Korean'],
  'Arts & Design': ['Graphic Design', 'UI/UX', 'Photography', 'Music', 'Film', 'Animation'],
  Health: ['Medicine', 'Nursing', 'Public Health', 'Nutrition', 'Mental Health', 'Pharmacy'],
  'Social Sciences': ['Psychology', 'Sociology', 'Political Science', 'Economics', 'History'],
  Engineering: ['Civil', 'Mechanical', 'Electrical', 'Chemical', 'Software', 'Biomedical'],
  Other: ['General', 'Personal Development', 'Test Prep', 'Vocational'],
}

export const LEVELS: Array<{ value: CourseLevel; label: string; desc: string }> = [
  { value: 'beginner', label: 'Beginner', desc: 'No prior experience needed' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Some foundational knowledge required' },
  { value: 'advanced', label: 'Advanced', desc: 'Strong prerequisites expected' },
]

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ur', label: 'Urdu' },
  { value: 'ar', label: 'Arabic' },
  { value: 'both', label: 'Multilingual' },
]

export const LESSON_TYPES: Array<{ value: LessonType; label: string; icon: string; color: string }> = [
  { value: 'video', label: 'Video', icon: '▶', color: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' },
  { value: 'text', label: 'Text/Article', icon: '📄', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
  { value: 'quiz', label: 'Quiz', icon: '❓', color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
  { value: 'interactive', label: 'Code Lab', icon: '💻', color: 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400' },
  { value: 'assignment', label: 'Assignment', icon: '📎', color: 'bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400' },
  { value: 'live-session', label: 'Live Session', icon: '🔴', color: 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' },
  { value: 'download', label: 'Resource File', icon: '🗂', color: 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400' },
]

export const QUIZ_TYPES: Array<{ value: QuizType; label: string }> = [
  { value: 'practice', label: 'Practice' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'certification', label: 'Certification' },
]

export const ASSIGNMENT_TYPES: Array<{ value: AssignmentType; label: string }> = [
  { value: 'written', label: 'Written' },
  { value: 'coding', label: 'Coding' },
  { value: 'project', label: 'Project' },
  { value: 'peer-review', label: 'Peer Review' },
  { value: 'presentation', label: 'Presentation' },
]

export const QUESTION_TYPES: Array<{ value: QuestionType; label: string }> = [
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True/False' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'short_answer', label: 'Short Answer' },
]

export const SUBMISSION_TYPES: Array<{ value: SubmissionType; label: string }> = [
  { value: 'text', label: 'Text' },
  { value: 'file', label: 'File Upload' },
  { value: 'url', label: 'Link' },
  { value: 'multiple', label: 'Multiple' },
]

export const PRICING_MODELS = [
  { value: 'free' as const, label: 'Free', desc: 'Free forever, no enrollment barrier' },
  { value: 'paid' as const, label: 'Paid', desc: 'Set a price below' },
  { value: 'subscription' as const, label: 'Subscription', desc: 'Only accessible with Pro subscription' },
  { value: 'freemium' as const, label: 'Freemium', desc: 'First N lessons free, rest paid' },
  { value: 'cohort' as const, label: 'Cohort', desc: 'Sold as part of a bundle / bootcamp' },
]

export const SPRING = { type: 'spring' as const, stiffness: 400, damping: 25 }
export const CARD_SPRING = { type: 'spring' as const, stiffness: 300, damping: 24 }

export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const EMPTY_FORM_DATA = (): import('./types').CourseFormData => ({
  title: '',
  subtitle: '',
  description: '',
  category: '',
  subcategory: '',
  topicTag: '',
  language: 'en',
  subtitleLanguages: [],
  difficultyLevel: 'beginner',
  thumbnail: '',
  promoVideoUrl: '',
  modules: [],
  pricingModel: 'paid',
  priceUSD: 0,
  discountCodes: [],
  enrollmentDeadline: 'always',
  enrollmentDeadlineDate: '',
  studentLimitEnabled: false,
  studentLimit: 0,
  certificateEnabled: true,
  prerequisiteCourses: [],
  accessDuration: 'lifetime',
  accessDurationMonths: 6,
  dripContent: false,
  dripSchedule: [],
  seoTitle: '',
  metaDescription: '',
  urlSlug: '',
  searchTags: [],
  whatYouLearn: [],
  targetAudience: [],
  requirements: [],
  publishOption: 'draft',
  scheduledDate: '',
  scheduledTime: '',
  estimatedDuration: 0,
  completionThreshold: 80,
})
