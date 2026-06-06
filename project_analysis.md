# ShijlAI Academy — Complete Project Analysis

> **Document Version:** 1.0  
> **Last Updated:** 2025-03-06  
> **Project Status:** Active Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [SPA Routing System](#4-spa-routing-system)
5. [State Management (Zustand)](#5-state-management-zustand)
6. [Database Schema (Prisma/SQLite)](#6-database-schema-prismasqlite)
7. [API Architecture](#7-api-architecture)
8. [Three-Portal Design](#8-three-portal-design)
9. [View Components (Pages)](#9-view-components-pages)
10. [Shell Components (Layouts)](#10-shell-components-layouts)
11. [Mobile-First Design System](#11-mobile-first-design-system)
12. [Theming & Visual Design](#12-theming--visual-design)
13. [Search & Filter System](#13-search--filter-system)
14. [AI Integration](#14-ai-integration)
15. [Authentication & Authorization](#15-authentication--authorization)
16. [Real-Time Features](#16-real-time-features)
17. [Gamification System](#17-gamification-system)
18. [Development Environment](#18-development-environment)
19. [Build & Deployment](#19-build--deployment)
20. [Complete Change Log](#20-complete-change-log)
21. [Known Issues & Technical Debt](#21-known-issues--technical-debt)
22. [Project Statistics](#22-project-statistics)

---

## 1. Executive Summary

**ShijlAI Academy** is a comprehensive, AI-powered e-learning platform built as a single-page application (SPA) on Next.js 16. It features three distinct portals — Student, Instructor, and Admin — each with its own sidebar navigation, header, and mobile bottom tab bar. The platform supports course creation, video/text content delivery, quizzes, assignments, real-time messaging, AI tutoring, gamification (XP, streaks, badges, coins), community features, and a full instructor application workflow.

### Key Design Principles

- **Single-Page Architecture**: No Next.js file-based routing. The entire app lives in one `page.tsx` with client-side view switching via Zustand state.
- **Mobile-First**: Every feature is designed for mobile with iOS-inspired aesthetics (frosted glass, spring animations, safe areas).
- **Three-Portal System**: Each user role (student, instructor, admin) gets a distinct shell with its own sidebar, header, and bottom tab bar.
- **Lazy-Loaded Views**: 91 views are dynamically imported using `React.lazy()` for optimal code splitting.
- **AI-First**: Built-in AI tutor, AI-powered course creation assistant, AI pre-grading for assignments, and AI-generated Q&A answers.

---

## 2. Technology Stack

### Core Framework

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16.1 | Framework (App Router, standalone output) |
| **React** | 19.0 | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **Prisma** | 6.11 | ORM (SQLite adapter) |
| **Zustand** | 5.0 | Client state management |

### UI & Component Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| **shadcn/ui** (New York style) | — | Component library (48 primitives) |
| **Radix UI** | Various | Headless UI primitives (25+ packages) |
| **Framer Motion** | 12.x | Animations & page transitions |
| **Lucide React** | 0.525 | Icon library |
| **Recharts** | 2.15 | Data visualization |
| **cmdk** | 1.1 | Command palette (search) |
| **vaul** | 1.1 | Drawer component |
| **react-day-picker** | 9.8 | Date selection |
| **embla-carousel** | 8.6 | Carousel/slider |
| **react-markdown** | 10.1 | Markdown rendering |
| **react-syntax-highlighter** | 15.6 | Code highlighting |
| **@mdxeditor/editor** | 3.39 | Rich text editor |

### Data & State

| Library | Version | Purpose |
|---------|---------|---------|
| **TanStack React Query** | 5.82 | Server state management |
| **TanStack React Table** | 8.21 | Table component |
| **react-hook-form** | 7.60 | Form management |
| **zod** | 4.0 | Schema validation |
| **next-auth** | 4.24 | Authentication |

### AI & SDKs

| Library | Version | Purpose |
|---------|---------|---------|
| **z-ai-web-dev-sdk** | 0.0.18 | AI capabilities (LLM, VLM, TTS, ASR, Image Gen, Search, Web Reader) |

### Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **Bun** | Latest | Runtime & package manager |
| **ESLint** | 9 | Linting (mostly disabled rules) |
| **sharp** | 0.34 | Image processing |
| **sonner** | 2.0 | Toast notifications |
| **next-themes** | 0.4 | Dark/light mode |
| **uuid** | 11.1 | ID generation |
| **date-fns** | 4.1 | Date formatting |

---

## 3. Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Caddy Reverse Proxy                       │
│                     (Port 81 → Port 3000)                        │
│                   XTransformPort for Mini-Services                │
└───────────────────────┬─────────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│                    Next.js 16 App (Port 3000)                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    src/app/page.tsx                       │   │
│  │  Single entry point — SPA with Zustand-driven routing    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │
│  │  Views   │  │  Shells   │  │  Store   │  │  API Routes   │   │
│  │  (57)    │  │  (3+nav)  │  │  (Zustand)│  │  (233 files)  │   │
│  └─────────┘  └──────────┘  └──────────┘  └───────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               Prisma ORM → SQLite (db/custom.db)         │   │
│  │                    40+ Models                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── app/
│   ├── page.tsx              # SPA entry point (333 lines)
│   ├── layout.tsx            # Root layout (fonts, ThemeProvider, Toaster)
│   ├── globals.css           # Theme variables, iOS styles, animations (517 lines)
│   └── api/                  # 233 API route files
│       ├── auth/             # Login, register, forgot-password, verify-otp, social, demo-login
│       ├── admin/            # ~90 routes (users, courses, instructors, finance, blog, etc.)
│       ├── instructor/       # ~50 routes (courses, assignments, students, analytics, AI, etc.)
│       ├── student/          # ~30 routes (assignments, bookmarks, goals, progress, etc.)
│       ├── ai/               # Chat, tutor, sessions
│       ├── courses/          # CRUD, catalog, categories, reviews
│       ├── blog/             # CRUD + seed
│       ├── notifications/    # List, preferences, seed
│       └── ...               # analytics, certificates, enrollments, gamification, progress, etc.
├── components/
│   ├── views/                # 57 view components (the "pages")
│   ├── admin/                # 32 admin-specific components
│   ├── creator/              # 8 course creation wizard steps
│   ├── messaging/            # 10 chat/messaging components
│   ├── instructor/           # 1 instructor stat card
│   ├── ui/                   # 48 shadcn/ui primitives
│   ├── student-shell.tsx     # Student portal layout (700 lines)
│   ├── instructor-shell.tsx  # Instructor portal layout (1,017 lines)
│   ├── admin-shell.tsx       # Admin portal layout (790 lines)
│   ├── mobile-bottom-bar.tsx # Mobile bottom navigation
│   ├── public-bottom-bar.tsx # Public pages bottom nav
│   ├── universal-search.tsx  # InlineSearch + MobileExpandableSearch
│   ├── mobile-filter-sheet.tsx # MobileFilterSheet + MobileFilterGroup
│   ├── notification-bell.tsx # Notification bell + provider
│   ├── header.tsx            # Shared header utilities
│   └── ...
├── hooks/
│   ├── use-mobile.ts         # Mobile detection hook
│   └── use-toast.ts          # Toast hook
└── lib/
    ├── store.ts              # Zustand store (214 lines)
    ├── types.ts              # TypeScript types (665 lines)
    ├── view-utils.ts         # resolveViewKey() (14 lines)
    ├── db.ts                 # Prisma singleton (13 lines)
    ├── utils.ts              # cn() helper (6 lines)
    ├── blog-data.ts          # Hardcoded blog articles (455 lines)
    └── email.ts              # Email templates + service (584 lines)
```

---

## 4. SPA Routing System

### How It Works

Unlike standard Next.js applications that use file-based routing, ShijlAI Academy uses **Zustand state** to drive navigation. The entire app renders from a single `page.tsx` file.

#### Flow

```
1. User clicks nav item → setCurrentView('instructor-courses')
2. Zustand store updates currentView
3. page.tsx re-renders, reads currentView
4. resolveViewKey() maps view name (considering user role)
5. getOrCreateLazy(viewKey) returns pre-created React.lazy() component
6. Suspense + AnimatePresence renders the view with page transition
```

#### View Loaders Map

The `viewLoaders` map in `page.tsx` defines **91 lazy import entries**:

```typescript
const viewLoaders: Record<string, () => Promise<{ default: ComponentType }>> = {
  'landing': () => import('@/components/views/landing-view').then(m => ({ default: m.LandingView })),
  'login': () => import('@/components/views/login-view').then(m => ({ default: m.LoginView })),
  'instructor-dashboard': () => import('@/components/views/instructor-dashboard').then(m => ({ default: m.InstructorDashboard })),
  // ... 88 more entries
}
```

#### Role-Based View Resolution

The `resolveViewKey()` function in `src/lib/view-utils.ts` handles role-based overrides:

```typescript
export function resolveViewKey(view: View, userRole?: UserRole): string {
  if (view === 'dashboard' && userRole === 'instructor') return 'instructor-dashboard'
  if (view === 'dashboard' && userRole === 'admin') return 'admin'
  if (view === 'settings' && userRole !== 'instructor') return 'student-settings'
  return view
}
```

This means:
- A student clicking "Dashboard" sees `dashboard-view.tsx`
- An instructor clicking "Dashboard" sees `instructor-dashboard.tsx`
- An admin clicking "Dashboard" sees `admin-dashboard-v2.tsx`

#### Layout Selection

Based on the current view and user role, `page.tsx` selects a shell:

| Condition | Shell | Components |
|-----------|-------|------------|
| Auth views (login, register, forgot-password, verify-otp) | None | Full-screen, no navigation |
| Public views (landing, courses, pricing, blog, etc.) | PublicBottomBar only | Bottom nav bar |
| Admin role | Admin Shell | AdminHeader + AdminSidebar + AdminBottomTabBar |
| Instructor role | Instructor Shell | InstructorHeader + InstructorSidebar + InstructorBottomTabBar |
| Student role (default) | Student Shell | StudentHeader + StudentSidebar + StudentBottomTabBar |
| Course Player | Immersive | Full-screen, no navigation |
| Messages / Tutor / AI Tool Detail | Full-view | No sidebar padding |

#### Page Transitions

All view transitions use Framer Motion with a consistent animation:

```typescript
const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] },
}
```

---

## 5. State Management (Zustand)

### Store Architecture

A **single global store** (`src/lib/store.ts`) manages all application state, persisted to localStorage under the key `shijlai-academy-auth`.

### State Categories

#### Navigation State
| Field | Type | Purpose |
|-------|------|---------|
| `currentView` | `View` (80+ string union) | Active page/view key |
| `sidebarOpen` | `boolean` | Sidebar toggle state |

#### Authentication State
| Field | Type | Purpose |
|-------|------|---------|
| `isAuthenticated` | `boolean` | Auth flag |
| `currentUser` | `User \| null` | Logged-in user data |
| `pendingAuthEmail` | `string` | Registration flow email |
| `pendingAuthRole` | `'student' \| 'instructor' \| ''` | Registration flow role |

#### Selection State (Context for Detail Views)
| Field | Type | Purpose |
|-------|------|---------|
| `selectedCourse` | `Course \| null` | Active course (full object) |
| `selectedCourseId` | `string \| null` | Active course ID |
| `selectedLesson` | `Lesson \| null` | Active lesson |
| `selectedQuiz` | `Quiz \| null` | Active quiz |
| `selectedArticleId` | `string \| null` | Active blog article |
| `selectedAssignmentId` | `string \| null` | Active assignment |
| `selectedStudentId` | `string \| null` | Active student (instructor context) |
| `selectedAIToolId` | `string \| null` | Active AI tool |
| `selectedUserId` | `string \| null` | Active user (admin context) |
| `selectedInstructorId` | `string \| null` | Active instructor (admin context) |

#### Course Creator State
| Field | Type | Purpose |
|-------|------|---------|
| `editingCourseId` | `string \| null` | Course being edited |
| `creatorStep` | `number` | Current wizard step |

#### Data Caches
| Field | Type | Purpose |
|-------|------|---------|
| `enrollments` | `Enrollment[]` | Cached enrollment data |
| `leaderboard` | `LeaderboardEntry[]` | Cached leaderboard |
| `certificates` | `Certificate[]` | Cached certificates |

#### Other
| Field | Type | Purpose |
|-------|------|---------|
| `language` | `'en' \| 'ur'` | Bilingual support |
| `initializing` | `boolean` | App boot state |

### Persistence Strategy

Only essential state is persisted across page refreshes:

```typescript
partialize: (state) => ({
  isAuthenticated: state.isAuthenticated,
  currentUser: state.currentUser,
  currentView: state.currentView,
  language: state.language,
})
```

### Custom Merge Function

A critical fix was implemented to prevent Zustand's `persist` middleware from overwriting **function** properties during hydration from localStorage:

```typescript
merge: (persistedState, currentState) => {
  const persisted = persistedState as Partial<AppState>
  return {
    ...currentState,
    ...Object.fromEntries(
      Object.entries(persisted).filter(([key]) => typeof currentState[key as keyof AppState] !== 'function')
    ),
  }
}
```

**Why this was needed**: When new setter functions (like `setSelectedCourseId`) were added to the store, existing localStorage data from previous sessions didn't contain these functions. During hydration, the persisted state (without functions) would override the current state (with functions), causing `setSelectedCourseId is not a function` runtime errors.

### Logout

The `logout()` function resets all selection state and data caches while preserving the `initializing` flag:

```typescript
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
})
```

### Defensive Selector Pattern

To guard against hydration issues, views use individual selectors instead of object destructuring:

```typescript
// SAFE: Each selector independently reads from the store
const setSelectedCourseId = useAppStore((s) => s.setSelectedCourseId)
const setCurrentView = useAppStore((s) => s.setCurrentView)

// UNSAFE: Destructuring may capture stale state during hydration
const { setSelectedCourseId, setCurrentView } = useAppStore()
```

---

## 6. Database Schema (Prisma/SQLite)

### Overview

- **Database**: SQLite (`db/custom.db`)
- **Schema File**: `prisma/schema.prisma` (2,490 lines)
- **Seed Script**: `prisma/seed.ts` (2,227 lines)
- **Total Models**: 40+

### Entity Relationship Diagram (Simplified)

```
User ─┬── Enrollment ──── Course ─┬── Module ──── Lesson
      │                           ├── Quiz ────── Question
      │                           ├── Assignment ── Submission
      │                           ├── Review
      │                           └── Wishlist
      ├── QuizAttempt
      ├── UserBadge ────── Badge
      ├── Certificate
      ├── TutorSession ─── ChatMessage
      ├── InstructorProfile
      ├── InstructorSettings
      ├── InstructorApplication ── ApplicationTimeline
      │                            └── ApplicationInterview
      ├── Submission
      ├── ConversationParticipant ── Conversation ── Message
      ├── Notification
      ├── NotificationPreference
      ├── Transaction
      ├── PayoutMethod
      ├── Payout
      ├── UserSession
      ├── LiveSession ──── SessionAttendee
      ├── LessonNote
      ├── LessonBookmark
      ├── LearningGoal
      ├── UserChallenge
      ├── StreakFreeze
      ├── XpActivity
      ├── UserReward
      ├── DiscussionPost ── DiscussionReply
      ├── StudyGroup ──── StudyGroupMember
      ├── PeerReview
      ├── CommunityEvent ── EventAttendee
      ├── QAQuestion ── QAAnswer
      ├── AIGeneration
      ├── AITemplate
      ├── AIAssistantMessage
      └── BlogPost
```

### Core Models

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| **User** | email, name, role, xp, level, shijlCoins, streak, passwordHash, mfaEnabled | Central user entity |
| **Course** | title, category, level, price, isPublished, enrollmentCount, rating, instructorId | Course catalog |
| **Module** | title, order, courseId | Course structure (chapters) |
| **Lesson** | title, type, content, videoUrl, duration, moduleId | Learning content |
| **Enrollment** | userId, courseId, progress, status | Student-course relationship |
| **LessonProgress** | enrollmentId, lessonId, status, timeSpent | Per-lesson progress tracking |

### Assessment Models

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| **Quiz** | title, type, timeLimit, passingScore, courseId | Quizzes & assessments |
| **Question** | text, type (mcq/true_false/fill_blank/short_answer), options, correctAnswer | Quiz questions |
| **QuizAttempt** | userId, quizId, score, percentage, passed | Student quiz attempts |
| **Assignment** | title, type, courseId, maxScore, dueDate, rubric | Course assignments |
| **Submission** | assignmentId, studentId, content, status, score, feedback, aiPreGrade | Student submissions |

### Gamification Models

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| **Badge** | name, icon, category, xpReward, coinReward, requirement | Achievement badges |
| **UserBadge** | userId, badgeId, earnedAt | Badge awards |
| **DailyActivity** | userId, date, xpEarned, lessonsCompleted | Daily activity tracking |
| **LearningGoal** | type, target, current, status | Student learning goals |
| **DailyChallenge** | type, target, xpReward, difficulty | Daily challenges |
| **XpActivity** | action, xpAmount, coinAmount | XP transaction log |
| **StreakFreeze** | date, costCoins | Streak protection |
| **UserReward** | — | Gamification rewards |

### Communication Models

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| **Conversation** | type (direct/group), courseId, lastMessageAt | Chat containers |
| **ConversationParticipant** | userId, role, lastReadAt, isMuted | Chat membership |
| **Message** | senderId, content, type (text/image/file/system), isRead | Chat messages |
| **Notification** | type, title, content, isRead, priority, actionUrl | In-app notifications |
| **NotificationPreference** | — | Granular notification settings |

### Finance Models

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| **Transaction** | type, amount, currency (PKR), platformFee (20%), instructorEarning (80%) | Financial transactions |
| **Payout** | instructorId, amount, method, status, taxWithheld | Instructor payouts |
| **PayoutMethod** | type (bank/jazzcash/easypaisa/payoneer/stripe), accountNumber | Instructor payout methods |
| **CommissionOverride** | — | Custom commission rates |
| **Dispute** | — | Payout disputes |

### Instructor Application Models

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| **InstructorApplication** | fullName, email, expertise, status (10 states), evaluationScore | Application workflow |
| **ApplicationTimeline** | event, fromStatus, toStatus, performedBy | Application audit trail |
| **ApplicationInterview** | interviewType, scheduledAt, feedbackScore | Interview scheduling |

### AI Models

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| **AIGeneration** | — | AI generation logs |
| **AITemplate** | — | AI prompt templates |
| **AIAssistantMessage** | — | AI chat history |
| **AIConfig** | — | AI provider configuration |
| **AIProvider** | — | AI provider settings |
| **AIModel** | — | AI model settings |
| **PromptTemplate** | — | Reusable prompts |
| **AIUsageLog** | — | Usage tracking |

### Community Models

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| **DiscussionPost** | — | Forum posts |
| **DiscussionReply** | — | Post replies |
| **StudyGroup** | — | Student study groups |
| **CommunityEvent** | — | Community events |
| **PeerReview** | — | Peer review system |

### Admin Models

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| **ActivityLog** | type, action, severity, category | Audit trail |
| **UserSession** | token, deviceType, ipAddress | Session management |
| **FeatureFlag** | — | Feature toggles |
| **SystemAlert** | — | System alerts |
| **ThemePreset** | — | Theme management |
| **Announcement** | — | Platform announcements |
| **ContentReviewSettings** | — | Review configuration |
| **CourseReviewHistory** | — | Review audit trail |

---

## 7. API Architecture

### Overview

- **Total API Route Files**: 233
- **Pattern**: Next.js App Router API routes (`src/app/api/...`)
- **Database Access**: Prisma Client via `import { db } from '@/lib/db'`
- **Authentication**: Session-based (user ID from request body/query)

### API Route Domains

#### Auth Routes (7 endpoints)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/login` | POST | Email/password login |
| `/api/auth/register` | POST | User registration |
| `/api/auth/forgot-password` | POST | Password reset request |
| `/api/auth/reset-password` | POST | Password reset confirmation |
| `/api/auth/verify-otp` | POST | OTP verification |
| `/api/auth/social` | POST | Social login (Google, Facebook, Apple) |
| `/api/auth/demo-login` | POST | Demo account login |

#### Student Routes (~30 endpoints)
| Domain | Routes | Purpose |
|--------|--------|---------|
| `/api/student/activity` | GET | Activity tracking |
| `/api/student/assignments` | GET | Assignments list |
| `/api/student/bookmarks` | GET, POST, DELETE | Lesson bookmarks |
| `/api/student/challenges` | GET | Daily challenges |
| `/api/student/community/*` | GET, POST | Community features |
| `/api/student/course-player` | GET | Course player data |
| `/api/student/goals` | GET, POST | Learning goals |
| `/api/student/learning` | GET | Learning progress |
| `/api/student/messages` | GET, POST | Messaging |
| `/api/student/notes` | GET, POST, DELETE | Lesson notes |
| `/api/student/progress` | GET | Progress data |
| `/api/student/schedule` | GET | Schedule events |
| `/api/student/settings` | GET, PUT | Student settings |
| `/api/student/streak` | GET, POST | Streak management |
| `/api/student/wishlist` | GET, POST, DELETE | Course wishlist |

#### Instructor Routes (~50 endpoints)
| Domain | Routes | Purpose |
|--------|--------|---------|
| `/api/instructor/ai/*` | GET, POST | AI tools (quiz gen, outline gen, etc.) |
| `/api/instructor/analytics` | GET | Course analytics |
| `/api/instructor/assignments` | GET, POST | Assignment CRUD |
| `/api/instructor/assignments/[id]` | GET, PUT, DELETE | Assignment detail |
| `/api/instructor/courses` | GET, POST | Course listing & creation |
| `/api/instructor/courses/[id]` | GET, PUT, DELETE | Course detail |
| `/api/instructor/dashboard` | GET | Dashboard data |
| `/api/instructor/lessons` | GET, POST | Lesson CRUD |
| `/api/instructor/messages` | GET, POST | Messaging |
| `/api/instructor/modules` | GET, POST | Module CRUD |
| `/api/instructor/notifications` | GET | Notifications |
| `/api/instructor/profile` | GET, PUT | Profile management |
| `/api/instructor/quizzes` | GET, POST | Quiz CRUD |
| `/api/instructor/revenue` | GET | Revenue data |
| `/api/instructor/students` | GET | Student list |
| `/api/instructor/submissions` | GET, PUT | Submission management |

#### Admin Routes (~90 endpoints)
| Domain | Routes | Purpose |
|--------|--------|---------|
| `/api/admin/ai-config` | GET, PUT | AI configuration |
| `/api/admin/blog` | GET, POST, PUT, DELETE | Blog management |
| `/api/admin/courses` | GET, PUT | Course management |
| `/api/admin/dashboard` | GET | Dashboard stats |
| `/api/admin/finance` | GET | Financial data |
| `/api/admin/instructor-applications` | GET, PUT | Application management |
| `/api/admin/instructors` | GET, PUT | Instructor management |
| `/api/admin/notifications` | GET, POST | Notification management |
| `/api/admin/security` | GET, PUT | Security settings |
| `/api/admin/settings` | GET, PUT | Platform settings |
| `/api/admin/users` | GET, PUT, DELETE | User management |
| ... | ... | ... |

#### Shared Routes
| Domain | Routes | Purpose |
|--------|--------|---------|
| `/api/ai/chat` | POST | AI chat endpoint |
| `/api/ai/tutor` | POST | AI tutor endpoint |
| `/api/ai/tutor/sessions` | GET, POST | Tutor sessions |
| `/api/courses` | GET, POST | Course catalog |
| `/api/blog` | GET, POST | Blog posts |
| `/api/notifications` | GET | Notifications |
| `/api/search` | GET | Universal search |
| `/api/seed` | GET | Database seeding |
| `/api/enrollments` | GET, POST | Enrollment management |
| `/api/analytics` | GET | Platform analytics |
| `/api/gamification` | GET | Gamification data |
| `/api/progress` | GET | Progress tracking |
| `/api/quizzes` | GET, POST | Quiz management |
| `/api/certificates` | GET | Certificate management |

### API Bug Note

There is a typo in 4 route paths: `instructor/modules/oduleId]` should be `instructor/modules/[moduleId]` (missing opening bracket).

---

## 8. Three-Portal Design

### Portal Architecture

Each portal is defined by a **shell component** that provides:
1. **Sidebar** (desktop) — collapsible, with role-specific navigation
2. **Header** (always visible) — with search, notifications, and profile dropdown
3. **Bottom Tab Bar** (mobile only) — with primary actions and "More" popup

### Student Portal

**Shell**: `src/components/student-shell.tsx` (700 lines)

**Sidebar Navigation**:
| Item | View Key | Icon |
|------|----------|------|
| Dashboard | `dashboard` | `LayoutDashboard` |
| My Learning | `courses` | `BookOpen` |
| Explore | `explore` | `Compass` |
| Assignments | `student-assignments` | `ClipboardList` |
| Schedule | `student-schedule` | `Calendar` |
| Messages | `student-messages` | `MessageCircle` |
| Q&A | `student-qa` | `HelpCircle` |
| Community | `community` | `Users` |
| Progress | `analytics` | `BarChart3` |
| Achievements | `achievements` | `Trophy` |
| Certificates | `certificates` | `Award` |
| AI Tutor | `tutor` | `Sparkles` |
| Settings | `settings` | `Settings` |

**Bottom Tab Bar**:
| Tab | View Key |
|-----|----------|
| Home | `dashboard` |
| Courses | `courses` |
| Assignments | `student-assignments` |
| Messages | `student-messages` |
| Profile | `student-profile` |

### Instructor Portal

**Shell**: `src/components/instructor-shell.tsx` (1,017 lines — largest shell)

**Sidebar Navigation**:
| Item | View Key | Icon |
|------|----------|------|
| Dashboard | `dashboard` | `LayoutDashboard` |
| Courses | `instructor-courses` | `BookOpen` |
| Students | `instructor-students` | `Users` |
| Assignments | `instructor-assignments` | `ClipboardList` |
| Quizzes | `instructor-quizzes` | `Brain` |
| Analytics | `instructor-analytics` | `BarChart3` |
| Q&A | `instructor-qa` | `MessageCircle` |
| Schedule | `instructor-schedule` | `Calendar` |
| Revenue | `instructor-revenue` | `DollarSign` |
| Marketing | `instructor-marketing` | `Megaphone` |
| AI Tools | `instructor-ai-tools` | `Sparkles` |
| Messages | `instructor-messages` | `Mail` |
| Settings | `settings` | `Settings` |
| Profile | `instructor-profile` | `User` |
| **+** (Create) | — | `Plus` |

**Bottom Tab Bar**:
| Tab | View Key |
|-----|----------|
| Home | `dashboard` |
| Courses | `instructor-courses` |
| Students | `instructor-students` |
| More | (popup with remaining items) |

**Create Popup** (center "+" button):
- Create Course → `course-creator`
- Create Assignment → Assignment creation

### Admin Portal

**Shell**: `src/components/admin-shell.tsx` (790 lines)

**Sidebar Navigation** (organized in sections):
| Section | Item | View Key |
|---------|------|----------|
| Platform | Dashboard | `admin` |
| | Users | `admin-users` |
| | Instructors | `admin-instructors` |
| | Courses | `admin-courses` |
| | Course Review | `admin-course-review` |
| | Applications | `admin-applications` |
| Finance | Revenue | `admin-revenue` |
| | Payouts | `admin-payouts` |
| | Refunds | `admin-refunds` |
| Operations | Marketing | `admin-marketing` |
| | Notifications | `admin-notifications` |
| | Live Sessions | `admin-live-sessions` |
| | Q&A Reports | `admin-qa-reports` |
| System | Blog | `admin-blog` |
| | Gamification | `admin-gamification` |
| | AI Config | `admin-ai-config` |
| | Appearance | `admin-appearance` |
| | Security | `admin-security` |
| | Settings | `admin-settings` |
| | Audit Log | `admin-audit-log` |
| | Dev Tools | `admin-dev-tools` |

**Bottom Tab Bar**:
| Tab | View Key |
|-----|----------|
| Home | `admin` |
| Users | `admin-users` |
| Courses | `admin-courses` |
| Revenue | `admin-revenue` |
| More | (popup with remaining items) |

---

## 9. View Components (Pages)

### Complete View Inventory

The application has **57 view components** in `src/components/views/`. Below is the complete list organized by portal:

#### Public Views (8)
| View | File | Lines | Description |
|------|------|-------|-------------|
| Landing | `landing-view.tsx` | ~800 | Homepage with hero, features, testimonials, CTA |
| Public Courses | `public-courses-view.tsx` | 2,559 | Course catalog browsing |
| Public Course Detail | `public-course-detail-view.tsx` | — | Individual course preview before enrollment |
| Pricing | `pricing-view.tsx` | — | Subscription/pricing plans |
| Instructors | `instructors-view.tsx` | — | Instructor directory |
| About | `about-view.tsx` | — | About ShijlAI Academy |
| Blog | `blog-view.tsx` | — | Blog listing |
| Blog Detail | `blog-detail-view.tsx` | — | Individual blog post |
| Application Status | `application-status-view.tsx` | — | Instructor application tracking |

#### Auth Views (4)
| View | File | Description |
|------|------|-------------|
| Login | `login-view.tsx` | Email/password + social login |
| Register | `register-view.tsx` | Student/instructor registration |
| Forgot Password | `forgot-password-view.tsx` | Password reset request |
| Verify OTP | `verify-otp-view.tsx` | OTP verification |

#### Student Views (15+)
| View | File | Lines | Description |
|------|------|-------|-------------|
| Dashboard | `dashboard-view.tsx` | 17 | Wrapper (resolves to student/instructor/admin) |
| My Learning | `my-learning-view.tsx` | — | Enrolled courses with progress |
| Course Detail | `course-detail-view.tsx` | 2,406 | Course content view with modules/lessons |
| Course Player | `course-player-view.tsx` | 3,252 | **Largest view** — video/text player with sidebar |
| Course Creator | `course-creator-view.tsx` | — | 6-step course creation wizard |
| Explore | `explore-view.tsx` | — | Course discovery/search |
| Student Assignments | `student-assignments-view.tsx` | — | Assignments list with Kanban/Grid/List |
| Student Assignment Detail | `student-assignment-detail-view.tsx` | — | Assignment submission view |
| Student Messages | `student-messages-view.tsx` | — | Chat interface |
| Student Schedule | `student-schedule-view.tsx` | — | Calendar view |
| Student Q&A | `student-qa-view.tsx` | — | Q&A per course |
| Student Profile | `student-profile-view.tsx` | — | Public profile |
| Student Settings | `student-settings-view.tsx` | 2,299 | Settings page |
| Progress & Analytics | `progress-analytics-view.tsx` | — | Learning progress with heatmap |
| Analytics | `analytics-view.tsx` | — | Detailed analytics |
| Achievements | (same as progress) | — | Badges, XP, streaks |
| Certificates | `certificates-view.tsx` | — | Earned & in-progress certificates |
| Quiz | `quiz-view.tsx` | — | Quiz taking interface |
| Tutor | `tutor-view.tsx` | — | AI tutor chat |
| Community | `community-view.tsx` | — | Discussion forums, study groups |
| Notifications | `notifications-page.tsx` | — | Notification center |

#### Instructor Views (15+)
| View | File | Lines | Description |
|------|------|-------|-------------|
| Instructor Dashboard | `instructor-dashboard.tsx` | — | Stats, course overview, action items |
| Instructor Courses | `instructor-courses-view.tsx` | 2,479 | Course management with grid/list view |
| Instructor Course Detail | `instructor-course-detail-view.tsx` | — | Course analytics and management |
| Instructor Students | `instructor-students-view.tsx` | — | Student roster and progress |
| Instructor Student Detail | `instructor-student-detail-view.tsx` | — | Individual student progress |
| Instructor Assignments | `instructor-assignments-view.tsx` | 2,249 | Assignment management |
| Instructor Assignment Detail | `instructor-assignment-detail-view.tsx` | 2,333 | Assignment grading & submissions |
| Instructor Quizzes | `instructor-quizzes-view.tsx` | — | Quiz management |
| Instructor Analytics | `instructor-analytics-view.tsx` | 2,372 | Course analytics with charts |
| Instructor Q&A | `instructor-qa-view.tsx` | 2,222 | Q&A management |
| Instructor Schedule | `instructor-schedule-view.tsx` | 68 | Schedule view (stub) |
| Instructor Revenue | `instructor-revenue-view.tsx` | — | Revenue dashboard |
| Instructor Marketing | `instructor-marketing-view.tsx` | 68 | Marketing tools (stub) |
| Instructor AI Tools | `instructor-ai-tools-view.tsx` | — | AI tool catalog |
| Instructor AI Tool Detail | `instructor-ai-tool-detail-view.tsx` | — | Individual AI tool interface |
| Instructor Settings | `instructor-settings-view.tsx` | — | Settings page |
| Instructor Profile | `instructor-profile-view.tsx` | — | Profile management |
| Instructor Messages | `instructor-messages-view.tsx` | — | Chat interface |

#### Admin Views (20+)
| View | File | Lines | Description |
|------|------|-------|-------------|
| Admin Dashboard | `admin-dashboard-v2.tsx` | — | Platform stats, charts |
| Admin User Management | `admin-user-management.tsx` | — | User CRUD, roles, status |
| Admin User Detail | `admin-user-detail-view.tsx` | — | Individual user detail |
| Admin Instructor Management | `admin-instructor-management.tsx` | — | Instructor management |
| Admin Instructor Detail | `admin-instructor-detail-view.tsx` | 2,438 | Instructor detail view |
| Admin Course Management | `admin-course-management.tsx` | 2,636 | Course review & management |
| Admin Course Review | `admin-course-review.tsx` | — | Course review workflow |
| Admin Course Review Detail | `admin-course-review-detail.tsx` | — | Individual course review |
| Admin Application Management | `admin-application-management.tsx` | — | Instructor applications |
| Admin Revenue & Finance | `admin-revenue-finance.tsx` | — | Financial dashboard |
| Admin Blog Management | `AdminBlogManagement.tsx` | — | Blog CRUD |
| Admin Notifications | `admin-notifications-center.tsx` | 2,417 | Notification management |
| Admin AI Config | `admin-ai-config.tsx` | 2,287 | AI provider/model configuration |
| Admin Appearance | `admin-appearance.tsx` | 2,256 | Theme & appearance settings |
| Admin Security | (admin-views.tsx) | — | Security settings (stub) |
| Admin Audit Log | `admin-audit-log.tsx` | — | Activity log viewer |
| Admin Settings | (admin-views.tsx) | — | Platform settings (stub) |
| Admin Gamification | (admin-views.tsx) | — | Badge/XP management (stub) |
| Admin Dev Tools | (admin-views.tsx) | — | Developer tools (stub) |
| ... | `admin-views.tsx` | 236 | Shared stub views for Q&A Reports, Payouts, Refunds, Marketing, Live Sessions, Notifications, Gamification, AI Config, Appearance, Security, Settings, Audit Log, Dev Tools |

---

## 10. Shell Components (Layouts)

### Shell Architecture

Each shell provides three exported components:
1. **Sidebar** — Desktop collapsible sidebar with navigation
2. **Header** — Top bar with search, notifications, profile
3. **BottomTabBar** — Mobile bottom navigation

### Student Shell (`student-shell.tsx` — 700 lines)

```
┌─────────────────────────────────────────────────────────┐
│ StudentHeader                                            │
│ [☰ Menu] [InlineSearch] [🔔] [👤 Profile]              │
├──────────┬──────────────────────────────────────────────┤
│ Sidebar  │ Main Content Area                             │
│ ┌──────┐ │ ┌──────────────────────────────────────────┐ │
│ │ 🏠   │ │ │                                          │ │
│ │ 📚   │ │ │  <Current View Component>                │ │
│ │ 🧭   │ │ │                                          │ │
│ │ 📋   │ │ │  Scrollable, rounded-xl                  │ │
│ │ 📅   │ │ │  p-4 md:p-5 lg:p-6                      │ │
│ │ 💬   │ │ │                                          │ │
│ │ ❓   │ │ │                                          │ │
│ │ 👥   │ │ │                                          │ │
│ │ 📊   │ │ │                                          │ │
│ │ 🏆   │ │ │                                          │ │
│ │ 📜   │ │ │                                          │ │
│ │ ✨   │ │ │                                          │ │
│ │ ⚙️   │ │ │                                          │ │
│ └──────┘ │ └──────────────────────────────────────────┘ │
├──────────┴──────────────────────────────────────────────┤
│ 🏠 Home  📚 Courses  📋 Assignments  💬 Messages  👤   │
│              (Mobile Bottom Tab Bar)                     │
└─────────────────────────────────────────────────────────┘
```

### Sidebar Features

- **Collapsible**: Toggles between full width (~220px) and icon-only (~68px)
- **Animated**: Framer Motion `animate={{ width: ... }}` with smooth easing
- **Circular Icons**: All nav items have `rounded-full` backgrounds
- **Rounded Container**: `rounded-[28px]` border radius
- **Active State**: Highlighted background on current view item
- **Mobile Drawer**: Sheet component slides from left on mobile (`isMobile && sidebarOpen`)
- **Logo + Title**: Portal branding at top (hidden when collapsed)
- **Collapse Button**: Small circular chevron button at top-right of expanded sidebar

### Header Features

- **Hamburger Menu** (`md:hidden`): Opens mobile sidebar drawer
- **Inline Search** (`hidden md:block`): Always-visible search bar with dropdown results
- **Mobile Expandable Search** (`md:hidden`): Tap icon to expand inline search
- **Notification Bell**: With unread count badge
- **Profile Dropdown**: Name, email, Profile link, Logout

---

## 11. Mobile-First Design System

### Responsive Breakpoints

Using Tailwind CSS responsive prefixes:
- **Default**: Mobile (< 768px)
- **md:**: Tablet/Desktop (≥ 768px)
- **lg:**: Large desktop (≥ 1024px)

### Mobile Bottom Tab Bar

**Pattern**: The `MobileBottomBar` component in `mobile-bottom-bar.tsx` renders a fixed bottom navigation bar for each portal. The "More" button opens a `BottomPopup` — a custom popup panel that appears directly above the bottom bar (not a dialog).

**BottomPopup Features**:
- Appears above the bottom bar with spring animation
- Has backdrop overlay
- Closes on outside click/tap
- Uses 4-column grid for items
- Has close button

### Mobile Sidebar Drawer

On mobile, clicking the hamburger icon opens a `Sheet` (vaul) component sliding from the left:
- Starts below the navbar (`top-14 h-[calc(100vh-3.5rem)]`)
- Has rounded right edges (`rounded-r-2xl`)
- Contains full nav items matching desktop sidebar
- Bottom actions (theme toggle, help, logout)
- Auto-closes when a nav item is clicked

### Mobile Filter Sheet

The `MobileFilterSheet` component provides a bottom drawer for filter controls on list pages:
- Triggered by a filter button in the search bar
- Shows `MobileFilterGroup` sections with filter options
- Displays active filter count badge
- "Clear All" and "Apply" buttons

### Mobile Search

Two search component variants:

1. **InlineSearch** (desktop): Always-visible search bar with dropdown results
2. **MobileExpandableSearch** (mobile): Compact search icon that expands inline when tapped

Both use:
- Debounced API calls to `/api/search`
- Scope-aware filtering (student/instructor/admin/public)
- Grouped results (Courses, Lessons, Users, etc.)
- ⌘K keyboard shortcut (desktop)

### Safe Areas

```css
.pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }
.pt-safe { padding-top: env(safe-area-inset-top, 0px); }
```

### Touch Targets

All interactive elements have a minimum 44px touch target (enforced via `size-10`/`size-11` buttons).

---

## 12. Theming & Visual Design

### Color System

The app uses an **Emerald/Teal** primary color palette with oklch color space:

| Variable | Light | Dark |
|----------|-------|------|
| `--primary` | `oklch(0.596 0.145 163.225)` | `oklch(0.696 0.17 162.48)` |
| `--background` | `oklch(0.97 0.003 166)` | `oklch(0.13 0.01 260)` |
| `--card` | `oklch(1 0 0)` | `oklch(0.18 0.015 260)` |
| `--sidebar` | `oklch(0.98 0.005 166)` | `oklch(0.16 0.012 260)` |

### iOS-Inspired Design Elements

| Element | CSS Class | Description |
|---------|-----------|-------------|
| Frosted Glass | `.ios-glass` | 72% opacity + blur(20px) + saturate(180%) |
| Thick Glass | `.ios-glass-thick` | 85% opacity + blur(40px) + saturate(200%) |
| Card Shadow | `.ios-shadow` | Multi-layer shadow with 0.5px border |
| Small Shadow | `.ios-shadow-sm` | Lighter version |
| Large Shadow | `.ios-shadow-lg` | Deeper shadow for elevated elements |
| Spring Animation | `.ios-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| Press Feedback | `.ios-press:active` | `scale(0.97)` on press |
| Tab Indicator | `.ios-tab-active::after` | 5px dot below active tab |
| Message Bubble | `.ios-bubble` | `border-radius: 20px` with one corner reduced |
| XP Glow | `.xp-glow` | Emerald glow effect on progress bars |
| Streak Fire | `.streak-fire` | Pulsing scale animation |

### Dark Mode

- Implemented with `next-themes`
- `.dark` class on HTML element
- All CSS variables have both light and dark values
- Smooth transition: `transition: color-scheme 0.3s ease`

### Custom Animations

| Animation | CSS Class | Duration |
|-----------|-----------|----------|
| Gradient Mesh | `.animate-gradient-mesh` | 15s infinite |
| Gradient Shift | `.animate-gradient-shift` | 8s infinite |
| Subtle Float | `.animate-float` | 4s infinite |
| Pulse Glow | `.animate-pulse-glow` | 2s infinite |
| Slow Spin | `.animate-spin-slow` | 20s linear |
| Shimmer | `.animate-shimmer` | 3s linear |
| Fire Pulse | `.streak-fire` | 1.5s infinite |
| Icon Pulse | `.icon-bg-pulse` | 3s infinite |

### Print Styles

Comprehensive print styles for admin PDF export:
- Hides navigation, sidebars, headers, footers
- Removes shadows and rounded corners
- Simplifies gradients
- Prevents page breaks inside cards
- Sets reasonable margins

---

## 13. Search & Filter System

### Universal Search

The `universal-search.tsx` component provides two search variants:

1. **InlineSearch** — For desktop viewports
   - Always visible in the header
   - Dropdown results appear below input
   - Minimum 2 characters to trigger search
   - Debounced (300ms) API calls to `/api/search`
   - Groups results by type (Courses, Lessons, Users, etc.)
   - ⌘K keyboard shortcut

2. **MobileExpandableSearch** — For mobile viewports
   - Shows as a search icon when collapsed
   - Expands inline to full-width search bar when tapped
   - Same dropdown results and API integration
   - Closes on outside click, item selection, or X button

### Search Scopes

| Scope | Searches |
|-------|----------|
| `student` | Courses, Lessons, Quizzes, Assignments |
| `instructor` | Courses, Students, Assignments, Quizzes |
| `admin` | Users, Courses, Instructors, Blog Posts |
| `public` | Courses, Blog Posts |

### Filter System

#### Desktop: Single-Row Filter Bar

All filter/search controls are consolidated into a **single row** on desktop (md+):

```
[Search Input] [Select 1] [Select 2] [Sort Select] [View Toggle] [Clear btn]
```

Key patterns:
- Search input uses `flex-1 max-w-xs`
- Select dropdowns use `w-[120px]` or `w-[130px]`
- Container uses `hidden md:flex items-center gap-2` (no flex-wrap)
- Unnecessary filters removed from desktop (available in mobile sheet)

#### Mobile: MobileFilterSheet

On mobile, a bottom sheet provides all filter controls:

```typescript
<MobileFilterSheet
  activeCount={activeFilterCount}
  onClearAll={clearAllFilters}
>
  <MobileFilterGroup title="Category">
    <Select>...</Select>
  </MobileFilterGroup>
  <MobileFilterGroup title="Sort By">
    <Select>...</Select>
  </MobileFilterGroup>
</MobileFilterSheet>
```

#### Pages with Optimized Filters

**Student Portal:**
- `explore-view.tsx` — Search, Category, Level, Price, Sort
- `student-assignments-view.tsx` — Tabs, Search, Sort, View Toggle

**Instructor Portal:**
- `instructor-courses-view.tsx` — Search, Sort, Export, View Toggle, Create
- `instructor-assignments-view.tsx` — Search, Course, Type, Sort, View Toggle
- `instructor-students-view.tsx` — Search, Course, Status, Sort, View Toggle, Export
- `instructor-qa-view.tsx` — Search, Course, Status, Sort

**Admin Portal:**
- `admin-user-management.tsx` — Search, Role, Status, Sort, Sort Order, Refresh
- `admin-instructor-management.tsx` — Search, Status, Sort, Sort Order, Refresh
- `admin-course-management.tsx` — Search, Category, Sort, View Toggle, Refresh
- `admin-course-review.tsx` — Search, Category, Sort, Refresh
- `admin-audit-log.tsx` — Search, Category, Action Type, Refresh
- `AdminBlogManagement.tsx` — Search, Status Tabs, Category, Sort, Featured

---

## 14. AI Integration

### AI Capabilities via z-ai-web-dev-sdk

The platform integrates AI through the `z-ai-web-dev-sdk` package (backend only):

| Capability | Backend Usage | Frontend View |
|-----------|---------------|---------------|
| **LLM (Large Language Model)** | `/api/ai/chat`, `/api/ai/tutor` | AI Tutor, AI Chat |
| **VLM (Vision Language Model)** | Image understanding | — |
| **TTS (Text to Speech)** | Audio generation | — |
| **ASR (Speech to Text)** | Audio transcription | — |
| **Image Generation** | AI image creation | Course thumbnails |
| **Web Search** | Real-time information | AI Tutor knowledge |
| **Web Reader** | Page content extraction | AI Tutor sources |

### AI-Powered Features

1. **AI Tutor** (`tutor-view.tsx`)
   - Chat-based tutoring with context awareness
   - Quick actions: "Explain simpler", "More examples", "Test me", "Translate"
   - Session management with history
   - Multi-language support (English, Urdu)

2. **AI Course Creation Assistant** (`course-creator-view.tsx`)
   - AI-generated course outlines
   - Quiz generation from content
   - Content suggestions and improvements

3. **AI Pre-Grading** (Assignments)
   - Automatic feedback on student submissions
   - AI-generated rubric scores
   - Instructor reviews AI assessment before finalizing

4. **AI Q&A Answers**
   - AI drafts answers to student questions
   - Instructors review and approve

5. **Instructor AI Tools** (`instructor-ai-tools-view.tsx`)
   - Dedicated AI tool catalog
   - Individual tool interfaces (`instructor-ai-tool-detail-view.tsx`)
   - Tools include: Quiz Generator, Outline Generator, Content Improver, etc.

---

## 15. Authentication & Authorization

### Auth Flow

```
1. User visits login page → enters email + password
2. POST /api/auth/login → validates credentials
3. Returns user object → stored in Zustand + localStorage
4. setCurrentView('dashboard') → routes to role-specific dashboard
5. API routes check userId from request body/query for authorization
```

### Social Login

Supported providers:
- Google
- Facebook
- Apple

### Demo Login

`/api/auth/demo-login` provides quick access to demo accounts for testing.

### Registration Flow

```
1. User fills registration form (name, email, password, role)
2. POST /api/auth/register → creates user
3. OTP sent to email (simulated)
4. setCurrentView('verify-otp')
5. POST /api/auth/verify-otp → verifies OTP
6. User is authenticated → routed to dashboard
```

### Authorization Bug Fix

**Problem**: Instructor assignment detail API (`/api/instructor/assignments/[id]`) required `instructorId` as a query parameter, but the frontend fetch call didn't pass it. This caused "not authorized" errors.

**Fix**: Added `instructorId` to the fetch URL:
```typescript
fetch(`/api/instructor/assignments/${id}?instructorId=${currentUser.id}`)
```

### Profile Dropdown Simplification

The "Switch Role (Demo)" feature was removed from all three portal profile dropdowns. Each dropdown now shows:
- Name & Email
- Profile → navigates to profile view
- Log out → calls `logout()`

---

## 16. Real-Time Features

### Messaging System

The messaging system uses a **component-based architecture** in `src/components/messaging/`:

| Component | Purpose |
|-----------|---------|
| Conversation list | Shows all conversations with last message preview |
| Chat area | Message bubbles, input bar, attachments |
| Emoji picker | Emoji selection for messages |
| Message types | Text, image, file, system |

**Note**: Currently uses polling-based updates. WebSocket support is available but not yet implemented as a mini-service.

### Notification System

| Component | Purpose |
|-----------|---------|
| `notification-bell.tsx` | Bell icon with unread count, dropdown preview |
| `NotificationProvider` | Context provider for real-time notification updates |
| `notifications-page.tsx` | Full notification center with filters |

### Planned WebSocket Support

Mini-services infrastructure exists in `mini-services/` but is currently empty. The pattern for WebSocket integration:

1. Create a new bun project in `mini-services/chat-service/`
2. Use socket.io for real-time communication
3. Frontend connects via `io("/?XTransformPort=3030")`
4. Caddy proxy forwards via `XTransformPort` query parameter

---

## 17. Gamification System

### XP & Levels

- Users earn XP for completing lessons, quizzes, and assignments
- XP determines user level (1, 2, 3, ...)
- Level progress bar shows XP to next level
- XP glow effect (`.xp-glow`) on progress bars

### Streaks

- Daily learning streaks tracked in `User.streak` and `User.longestStreak`
- Streak fire animation (`.streak-fire`) on active streaks
- Streak freezes purchasable with ShijlCoins
- Streak rewards via `StreakReward` model

### Badges

- 4 badge categories: Learning, Streak, Social, Achievement
- Each badge has XP and coin rewards
- Badge requirements stored as JSON
- `UserBadge` tracks earned badges and timestamps

### ShijlCoins

- Virtual currency earned alongside XP
- Can be spent on streak freezes, cosmetic items, etc.
- Tracked in `User.shijlCoins`

### Daily Challenges

- Type: lesson, quiz, streak, xp, time, assignment
- Difficulty: easy, medium, hard
- XP and coin rewards for completion
- Tracked in `UserChallenge`

### Learning Goals

- Types: weekly_xp, weekly_time, weekly_lessons, monthly_xp, monthly_courses, custom
- Status: active, completed, failed, abandoned
- Progress tracking with current vs. target

### Leaderboard

- Ranked by XP
- Shows rank, name, avatar, XP, level, streak
- `isCurrentUser` flag for highlighting

---

## 18. Development Environment

### Prerequisites

- **Bun** runtime (package manager and executor)
- **Node.js** compatible environment
- **SQLite** (included via Prisma)

### Development Server

```bash
bun run dev    # Starts Next.js dev server on port 3000
               # Logs output to dev.log
```

The dev server runs in the background and supports hot module replacement.

### Database Commands

```bash
bun run db:push      # Push schema changes to SQLite
bun run db:generate   # Generate Prisma Client
bun run db:migrate    # Run migrations
bun run db:reset      # Reset database
```

### Seeding

On first load, `page.tsx` calls `GET /api/seed` which runs `prisma/seed.ts` (2,227 lines) to populate:
- Demo users (student, instructor, admin)
- Sample courses with modules and lessons
- Quiz questions, assignments
- Notifications, messages
- Badges, transactions, etc.

### Linting

```bash
bun run lint    # ESLint check
```

Note: Most ESLint rules are disabled in `eslint.config.mjs` for development speed.

### Dev Log

Server logs are written to `dev.log`. Check this file for compilation errors or runtime issues.

---

## 19. Build & Deployment

### Next.js Configuration

```typescript
// next.config.ts
{
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  allowedDevOrigins: [".space-z.ai"]
}
```

### Caddy Reverse Proxy

The `Caddyfile` configures a reverse proxy from port 81 to localhost:3000:
- All API requests go through the proxy
- Mini-service requests use `XTransformPort` query parameter
- WebSocket connections are supported

### Build Process

```bash
bun run build    # Creates standalone build in .next/standalone/
bun run start    # Runs production server from standalone build
```

---

## 20. Complete Change Log

### Phase 1: Core Platform Setup

The initial project was scaffolded with Next.js 16, TypeScript, Tailwind CSS, Prisma, and shadcn/ui. The core SPA architecture was established with Zustand-based routing.

### Phase 2: Mobile Bottom Bar & Public Navigation

**Task 1**: Replaced Dialog-based "More" and "Create" menus with mobile-app-style popup in MobileBottomBar; added public view bottom bar.

- Rewrote `mobile-bottom-bar.tsx`: replaced `Dialog`/`DialogContent` with custom `BottomPopup` component
- `BottomPopup` renders a popup panel directly above the bottom bar with spring animation
- Updated `public-bottom-bar.tsx` with Home/Courses/Blog tabs + More popup
- Public views get their own bottom bar

### Phase 3: Hamburger Menu & Mobile Sidebar

**Task 2**: Added hamburger menu + mobile sidebar drawer for all three portals.

- Added `Sheet` component imports to all three shells
- Hamburger button (Menu icon) in each header, `md:hidden`
- Sheet drawer slides from left with full nav items
- Auto-close on mobile mount
- Nav items close drawer when clicked

### Phase 4: Search Optimization

**Task 3**: Optimized mobile sidebar, navbar, and search across all portals.

- Replaced `CommandDialog`-based search with `InlineSearch` component
- Inline search bar shows directly in navbar (no dialog)
- Dropdown results appear below input when typing
- Mobile sidebars start below navbar with rounded right edges
- Consistent search behavior across all portals

**Task 4**: Added mobile expandable search, removed role switching, updated public bottom bar.

- Added `MobileExpandableSearch` component (icon → expandable search)
- Desktop: `InlineSearch` (always visible)
- Mobile: `MobileExpandableSearch` (expandable icon)
- Removed "Switch Role (Demo)" from all profile dropdowns
- Updated public bottom bar: Home, Courses, Teach, About

### Phase 5: Mobile Public View Fixes

**Task 5**: Fixed mobile public navbar search, added padding, fixed bottom bar overlap, prevented zoom/overflow.

- Added visible search icon on mobile public navbar
- Added `overflow-x-hidden` to public view wrapper
- Added `maximum-scale=1` to viewport meta tag
- Changed bottom bar from transparent glass to solid background
- Removed negative margins from 8 public view files (9 occurrences)

### Phase 6: Mobile Filter Sheets for Instructor Pages

**Task 2-a**: Optimized Courses + Assignments pages.
**Task 2-b**: Optimized Students + Q&A pages.

- Added `MobileFilterSheet` + `MobileFilterGroup` to all 4 instructor pages
- Search bar full-width on mobile
- Tab pills horizontally scrollable
- Desktop filters wrapped in `hidden md:flex`
- Active filter count badge on MobileFilterSheet button

### Phase 7: Mobile Filter Sheets for Admin Pages

**Task 2-a**: Optimized Users + Instructors pages.
**Task 2-b**: Optimized Courses + Blogs + Audit Log pages.

- Added `MobileFilterSheet` to all 5 admin pages
- Same pattern as instructor pages
- Audit Log got separate mobile Clear/Export row

### Phase 8: Sidebar Fixes

**Task 7**: Fixed sidebar crash and made icons circular.

- **Root Cause**: CSS `transition-[width]` conflicted with Framer Motion `animate={{ width: ... }}`
- Removed CSS transition, added explicit Framer Motion transition
- Changed all sidebar icons to `rounded-full`
- Applied consistently across all 3 shells

**Task 8**: Fixed sidebar expand/collapse button, rounded edges, plus icon size.

- Redesigned sidebar header: collapsed = ChevronRight button, expanded = logo + ChevronLeft
- Collapse button is plain `<button>` (not `motion.button`) for reliability
- Changed sidebar container from `rounded-2xl` to `rounded-3xl`
- Fixed instructor Plus icon from `size-5` to `size-[18px]`

**Task 1** (continued): Fixed sidebar dark overlay on desktop expand.

- **Root Cause**: Sheet component opened on desktop because `open={sidebarOpen}` was always true
- Fixed: `open={isMobile && sidebarOpen}` — Sheet only opens on mobile
- Increased sidebar border-radius to `rounded-[28px]`
- Changed instructor plus icon from heavy gradient to subtle style

### Phase 9: Desktop Single-Row Filter Optimization

**Student Portal**:
- `explore-view.tsx`: Removed Language, Duration, Rating filters. Consolidated to: `[Search] [Category] [Level] [Price] [Sort] [Clear]`
- `student-assignments-view.tsx`: Removed Priority filter. Consolidated to: `[Tabs] [Search] [Sort] [View Toggle] [Clear]`

**Instructor Portal**:
- `instructor-courses-view.tsx`: Removed Price, Category, Level, showFilters. Consolidated to: `[Search] [Sort] [Export] [View Toggle] [Create Course]`
- `instructor-students-view.tsx`: Removed Joined, Progress Range, XP Range. Consolidated to: `[Search] [Course] [Status] [Sort] [View Toggle] [Export] [Clear]`
- `instructor-assignments-view.tsx`: Consolidated to: `[Search] [Course] [Type] [Sort] [View Toggle] [Clear]`
- `instructor-qa-view.tsx`: Removed Lesson, Date, Student filters. Consolidated to: `[Search] [Course] [Status] [Sort] [Clear]`

**Admin Portal**:
- `admin-user-management.tsx`: Removed Verification, Chips. Consolidated to: `[Search] [Role] [Status] [Sort] [Sort Order] [Refresh] [Clear]`
- `admin-instructor-management.tsx`: Removed AppStatus, HasCourses, Chips. Consolidated to: `[Search] [Status] [Sort] [Sort Order] [Refresh] [Clear]`
- `admin-course-management.tsx`: Removed Level, Featured, StaffPick from inline. Consolidated to: `[Search] [Category] [Sort] [View Toggle] [Refresh] [Clear]`
- `admin-course-review.tsx`: Removed Level from inline. Consolidated to: `[Search] [Category] [Sort] [Refresh] [Clear]`
- `admin-audit-log.tsx`: Removed User, Severity, Date Range from inline. Consolidated to: `[Search] [Category] [Action Type] [Refresh] [Clear]`

### Phase 10: Student Portal Duplicate Fix

- Fixed duplicate search and filters on student Assignments page
- Made standalone search bar and status chips `md:hidden` (mobile-only)
- Desktop single-row bar remains visible at `md:` and above

### Phase 11: Instructor Portal Footer Removal

- Removed "ShijlAI Academy — Instructor Portal" footer from instructor-shell.tsx

### Phase 12: Instructor Assignment Authorization Fix

- Fixed "not authorized" error when clicking assignments in instructor portal
- Added `instructorId` query parameter to API fetch URL

### Phase 13: Instructor Dashboard Clickable Items

- Made course rows, student items, activity items, action-required items, financial cards clickable
- Added `setSelectedCourseId` and `setSelectedStudentId` to Zustand store
- Course rows navigate to `instructor-course-detail`
- Student items navigate to `instructor-student-detail`
- Assignment items navigate to `instructor-assignment-detail`

### Phase 14: Instructor Analytics Limited Spaces

- Added proper limited spaces with "Show more/less" toggles:
  - Lesson Dropoff: 3 courses, 5 modules
  - Revenue Breakdown: top 5
  - Recent Reviews: 3
  - Top Students: 5
  - Category Breakdown: 5
- Scrollable containers with max heights

### Phase 15: Zustand Hydration Fix

- **Problem**: `setSelectedCourseId is not a function` runtime error
- **Root Cause**: Zustand persist middleware hydrating from old localStorage, overriding newly-added functions
- **Fix 1**: Custom merge function that preserves functions from currentState
- **Fix 2**: Defensive selector pattern using individual selectors

### Phase 16: Instructor Course Detail View

- **Problem**: Clicking a course in instructor dashboard redirected to homepage
- **Root Cause**: `instructor-course-detail` had no entry in `viewLoaders` map, fell back to `'landing'`
- **Fix**: Created `instructor-course-detail-view.tsx` and added it to `viewLoaders`
- Basic implementation with course header, stats, modules, quizzes, action buttons

---

## 21. Known Issues & Technical Debt

### Bugs

1. **API Route Typo**: `instructor/modules/oduleId]` should be `instructor/modules/[moduleId]` (missing opening bracket) — affects 4 route files
2. **Hardcoded Blog Data**: `blog-data.ts` has 8 articles embedded as code rather than DB-sourced
3. **Simulated Email**: `email.ts` logs to console — no real email provider connected
4. **Simulated Payments**: No real payment gateway integration

### Architecture Debt

1. **Massive View Components**: Many views exceed 2,000 lines (course-player: 3,252 lines) — could benefit from decomposition
2. **No Server Components**: The entire app is client-side rendered. Views could benefit from server components for data fetching
3. **Permissive ESLint**: Nearly all rules disabled — should be progressively re-enabled
4. **No WebSocket Implementation**: Mini-services folder is empty; real-time features use polling
5. **No Unit/Integration Tests**: No test infrastructure exists

### Performance Considerations

1. **91 Lazy-Loaded Views**: Pre-created at module level — good for performance but increases initial bundle assessment
2. **Large Seed Script**: 2,227 lines executed on every first load
3. **No Image Optimization**: Thumbnails use static paths, not Next.js Image optimization
4. **SQLite Limitations**: Not suitable for production scale — would need migration to PostgreSQL

### Missing Features

1. **Internationalization**: `language: 'en' | 'ur'` state exists but Urdu translations are not implemented
2. **Instructor AI Tool Detail Pages**: Individual tool pages are stubs
3. **Admin Stub Views**: Multiple admin views share `admin-views.tsx` with placeholder content (Q&A Reports, Payouts, Refunds, Marketing, Live Sessions, Gamification, etc.)
4. **Instructor Schedule/Marketing**: Both are minimal stubs (68 lines each)
5. **Pakistani Context Removal**: Some locale-specific references (PKR, NTN, CNIC, JazzCash, EasyPaisa) remain in the schema and should be internationalized

---

## 22. Project Statistics

| Metric | Value |
|--------|-------|
| Total source files (.ts/.tsx) | **419** |
| Total source lines of code | **~196,949** |
| API route files | **233** |
| View components | **57** (~79,863 lines) |
| Admin components | **32** (~36,021 lines) |
| UI primitives (shadcn/ui) | **48** |
| Course creator steps | **8** |
| Messaging components | **10** |
| Prisma models | **40+** |
| Prisma schema lines | **2,490** |
| Seed script lines | **2,227** |
| Zustand store lines | **214** |
| Type definition lines | **665** |
| View union members | **80+** |
| Lazy-loaded view entries | **91** |
| Largest view component | `course-player-view.tsx` (3,252 lines) |
| Largest shell | `instructor-shell.tsx` (1,017 lines) |
| Largest admin component | `admin-course-management.tsx` (2,636 lines) |
| Database | SQLite (`db/custom.db`) |
| Runtime | Bun + Next.js 16 (standalone output) |
| Proxy | Caddy (port 81 → 3000) |
| Package manager | Bun |
| Total npm dependencies | **47** (38 runtime + 9 dev) |

---

## Appendix A: View Type Union

The complete `View` type from `src/lib/types.ts`:

```typescript
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
  // App views (authenticated)
  | 'dashboard'
  | 'courses'
  | 'course-detail'
  | 'tutor'
  | 'analytics'
  | 'achievements'
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
  | 'instructor-ai-tools'
  | 'instructor-ai-tool-detail'
  | 'instructor-settings'
  | 'instructor-profile'
  | 'instructor-messages'
  | 'student-assignments'
  | 'student-assignment-detail'
  | 'student-messages'
  | 'student-profile'
  | 'student-schedule'
  | 'student-qa'
  | 'learning-paths'
  | 'smart-content'
  | 'explore'
  | 'community'
  | 'course-player'
  | 'notifications'
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
  | 'admin-blog'
```

## Appendix B: Key File Reference

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/page.tsx` | 333 | SPA entry point, view routing, shell selection |
| `src/app/layout.tsx` | — | Root layout (fonts, ThemeProvider, Toaster) |
| `src/app/globals.css` | 517 | Theme variables, iOS styles, animations |
| `src/lib/store.ts` | 214 | Zustand store with persistence |
| `src/lib/types.ts` | 665 | TypeScript type definitions |
| `src/lib/view-utils.ts` | 14 | resolveViewKey() for role-based routing |
| `src/lib/db.ts` | 13 | Prisma singleton |
| `src/lib/utils.ts` | 6 | cn() helper |
| `src/lib/blog-data.ts` | 455 | Hardcoded blog articles |
| `src/lib/email.ts` | 584 | Email service + templates |
| `prisma/schema.prisma` | 2,490 | Database schema (40+ models) |
| `prisma/seed.ts` | 2,227 | Database seeder |
| `components.json` | — | shadcn/ui configuration (new-york style) |
| `Caddyfile` | — | Reverse proxy configuration |
| `package.json` | 96 | Dependencies and scripts |

---

*This document was generated on 2025-03-06. For the latest code state, refer to the source files in the `/home/z/my-project/` directory.*
