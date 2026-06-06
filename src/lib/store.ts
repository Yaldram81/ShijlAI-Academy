import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  View,
  User,
  Course,
  Lesson,
  Quiz,
  Enrollment,
  LeaderboardEntry,
  Certificate,
} from '@/lib/types'

interface AppState {
  // Navigation
  currentView: View
  setCurrentView: (view: View) => void

  // Auth state
  isAuthenticated: boolean
  setIsAuthenticated: (val: boolean) => void
  pendingAuthEmail: string
  setPendingAuthEmail: (email: string) => void
  pendingAuthRole: 'student' | 'instructor' | ''
  setPendingAuthRole: (role: 'student' | 'instructor' | '') => void

  // User
  currentUser: User | null
  setCurrentUser: (user: User | null) => void

  // Course
  selectedCourse: Course | null
  setSelectedCourse: (course: Course | null) => void
  selectedCourseId: string | null
  setSelectedCourseId: (id: string | null) => void

  // Course Creator
  editingCourseId: string | null
  setEditingCourseId: (id: string | null) => void
  creatorStep: number
  setCreatorStep: (step: number) => void

  // Lesson
  selectedLesson: Lesson | null
  setSelectedLesson: (lesson: Lesson | null) => void

  // Quiz
  selectedQuiz: Quiz | null
  setSelectedQuiz: (quiz: Quiz | null) => void

  // Blog
  selectedArticleId: string | null
  setSelectedArticleId: (id: string | null) => void

  // Assignment
  selectedAssignmentId: string | null
  setSelectedAssignmentId: (id: string | null) => void

  // Student (instructor context)
  selectedStudentId: string | null
  setSelectedStudentId: (id: string | null) => void

  // AI Tools
  selectedAIToolId: string | null
  setSelectedAIToolId: (id: string | null) => void

  // Admin
  selectedUserId: string | null
  setSelectedUserId: (id: string | null) => void
  selectedInstructorId: string | null
  setSelectedInstructorId: (id: string | null) => void

  // UI
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  language: 'en' | 'ur'
  setLanguage: (lang: 'en' | 'ur') => void

  // Data caches
  enrollments: Enrollment[]
  setEnrollments: (enrollments: Enrollment[]) => void
  leaderboard: LeaderboardEntry[]
  setLeaderboard: (entries: LeaderboardEntry[]) => void
  certificates: Certificate[]
  setCertificates: (certs: Certificate[]) => void

  // Loading states
  initializing: boolean
  setInitializing: (val: boolean) => void

  // Auth helpers
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Navigation
      currentView: 'landing',
      setCurrentView: (view) => set({ currentView: view }),

      // Auth state
      isAuthenticated: false,
      setIsAuthenticated: (val) => set({ isAuthenticated: val }),
      pendingAuthEmail: '',
      setPendingAuthEmail: (email) => set({ pendingAuthEmail: email }),
      pendingAuthRole: '',
      setPendingAuthRole: (role) => set({ pendingAuthRole: role }),

      // User
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),

      // Course
      selectedCourse: null,
      setSelectedCourse: (course) => set({ selectedCourse: course }),
      selectedCourseId: null,
      setSelectedCourseId: (id) => set({ selectedCourseId: id }),

      // Course Creator
      editingCourseId: null,
      setEditingCourseId: (id) => set({ editingCourseId: id }),
      creatorStep: 0,
      setCreatorStep: (step) => set({ creatorStep: step }),

      // Lesson
      selectedLesson: null,
      setSelectedLesson: (lesson) => set({ selectedLesson: lesson }),

      // Quiz
      selectedQuiz: null,
      setSelectedQuiz: (quiz) => set({ selectedQuiz: quiz }),

      // Blog
      selectedArticleId: null,
      setSelectedArticleId: (id) => set({ selectedArticleId: id }),

      // Assignment
      selectedAssignmentId: null,
      setSelectedAssignmentId: (id) => set({ selectedAssignmentId: id }),

      // Student (instructor context)
      selectedStudentId: null,
      setSelectedStudentId: (id) => set({ selectedStudentId: id }),

      // AI Tools
      selectedAIToolId: null,
      setSelectedAIToolId: (id) => set({ selectedAIToolId: id }),

      // Admin
      selectedUserId: null,
      setSelectedUserId: (id) => set({ selectedUserId: id }),
      selectedInstructorId: null,
      setSelectedInstructorId: (id) => set({ selectedInstructorId: id }),

      // UI
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),

      // Data caches
      enrollments: [],
      setEnrollments: (enrollments) => set({ enrollments }),
      leaderboard: [],
      setLeaderboard: (entries) => set({ leaderboard: entries }),
      certificates: [],
      setCertificates: (certs) => set({ certificates: certs }),

      // Loading states
      initializing: true,
      setInitializing: (val) => set({ initializing: val }),

      // Auth helpers
      logout: () => set({
        isAuthenticated: false,
        currentUser: null,
        currentView: 'landing',
        selectedCourse: null,
        selectedLesson: null,
        selectedQuiz: null,
        selectedArticleId: null,
        selectedAssignmentId: null,
        selectedStudentId: null,
        selectedCourseId: null,
        selectedUserId: null,
        selectedInstructorId: null,
        selectedAIToolId: null,
        enrollments: [],
        certificates: [],
        editingCourseId: null,
        creatorStep: 0,
      }),
    }),
    {
      name: 'shijlai-academy-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
        currentView: state.currentView,
        language: state.language,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AppState>
        return {
          ...currentState,
          ...Object.fromEntries(
            Object.entries(persisted).filter(([key]) => typeof currentState[key as keyof AppState] !== 'function')
          ),
        }
      },
    }
  )
)
