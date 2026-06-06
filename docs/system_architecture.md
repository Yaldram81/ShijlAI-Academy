# ShijlAI Academy — System Architecture Document

> **Version**: 1.0  
> **Last Updated**: 2025-01-07  
> **Platform**: ShijlAI Academy — AI-Powered E-Learning Platform  
> **Runtime**: Bun + Next.js 16 (Standalone)  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Database Architecture](#6-database-architecture)
7. [AI Engine Architecture](#7-ai-engine-architecture)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [State Management](#9-state-management)
10. [Gateway & Proxy Architecture](#10-gateway--proxy-architecture)
11. [Component Architecture](#11-component-architecture)
12. [Real-Time & Communication](#12-real-time--communication)
13. [Deployment Architecture](#13-deployment-architecture)
14. [Security Architecture](#14-security-architecture)
15. [Performance Architecture](#15-performance-architecture)
16. [Scalability Considerations](#16-scalability-considerations)
17. [Development Workflow](#17-development-workflow)
18. [Key Architectural Decisions](#18-key-architectural-decisions)

---

## 1. Executive Summary

ShijlAI Academy is a full-stack AI-powered e-learning platform built on a **SPA-within-SSR** architecture pattern. The entire application is served from a single Next.js page route (`/`), with all navigation handled client-side through a Zustand store. The platform supports three distinct user roles — **Student**, **Instructor**, and **Admin** — each with dedicated shell layouts, 100+ lazy-loaded views, and 200+ API routes.

The platform's distinguishing feature is its **7-service Learning Engine** that powers adaptive learning through real-time event tracking, weighted mastery scoring, engagement analysis, drop-risk prediction, and AI-augmented study planning. The AI layer integrates the `z-ai-web-dev-sdk` across 57 API endpoints spanning tutoring, quiz generation, curriculum design, and conversational AI companions.

**Key Metrics:**

| Metric | Count |
|---|---|
| Prisma Models | 148 |
| API Routes | 200+ |
| Lazy-Loaded Views | 84 |
| UI Components (shadcn/ui) | 45 |
| AI API Endpoints | 57 |
| Learning Engine Services | 7 |
| TypeScript Type Definitions | 673 lines |
| Blog Articles (Static) | 8 |
| Email Templates | 9 |
| Shell Scripts (Deployment) | 5 |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            INTERNET / CLIENTS                               │
│                     (Browsers, Mobile Browsers, PWAs)                       │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ HTTP/HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CADDY REVERSE PROXY (:81)                            │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Default Route     → localhost:3000 (Next.js)                       │   │
│  │  XTransformPort    → localhost:{dynamic} (Mini-services)            │   │
│  │  Proxy Headers     → Host, X-Forwarded-For, X-Forwarded-Proto,     │   │
│  │                       X-Real-IP                                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS 16 APP (BUN RUNTIME :3000)                      │
│                                                                             │
│  ┌───────────────────────────┐  ┌───────────────────────────────────────┐   │
│  │     SINGLE PAGE ROUTE     │  │            API ROUTES (200+)           │   │
│  │       (page.tsx)          │  │                                       │   │
│  │                           │  │  /api/auth/*          (7 routes)      │   │
│  │  ┌─────────────────────┐  │  │  /api/ai/*            (20 routes)    │   │
│  │  │  Zustand Store      │  │  │  /api/ai/shijlai/*   (13 routes)    │   │
│  │  │  (Navigation +      │  │  │  /api/instructor/*   (50+ routes)   │   │
│  │  │   Auth State)       │  │  │  /api/instructor/ai/* (18 routes)   │   │
│  │  └────────┬────────────┘  │  │  /api/student/*      (30+ routes)   │   │
│  │           │               │  │  /api/admin/*        (60+ routes)   │   │
│  │           ▼               │  │  /api/courses/*      /api/blog/*    │   │
│  │  ┌─────────────────────┐  │  │  /api/certificates/* /api/seed      │   │
│  │  │  View Resolution    │  │  │  /api/analytics/*    /api/skills/*  │   │
│  │  │  resolveViewKey()   │  │  │  /api/notifications/*               │   │
│  │  └────────┬────────────┘  │  │  /api/gamification/*                │   │
│  │           │               │  └───────────────┬───────────────────────┘   │
│  │           ▼               │                  │                           │
│  │  ┌─────────────────────┐  │                  ▼                           │
│  │  │  Shell Router       │  │  ┌──────────────────────────────────────┐   │
│  │  │  ┌───────────────┐  │  │  │         LIB LAYER                    │   │
│  │  │  │ Auth Shell     │  │  │  │  db.ts (PrismaClient singleton)     │   │
│  │  │  │ Public Shell   │  │  │  │  store.ts (Zustand global state)    │   │
│  │  │  │ Student Shell  │  │  │  │  types.ts (673-line type defs)     │   │
│  │  │  │ Instructor Sh. │  │  │  │  view-utils.ts (view resolution)   │   │
│  │  │  │ Admin Shell    │  │  │  │  email.ts (9 HTML templates)       │   │
│  │  │  │ Course Player  │  │  │  │  utils.ts (cn() utility)           │   │
│  │  │  └───────────────┘  │  │  │  blog-data.ts (8 static articles)  │   │
│  │  └─────────────────────┘  │  └──────────────────────────────────────┘   │
│  └───────────────────────────┘                                            │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │                    LEARNING ENGINE (7 Services)                        │   │
│  │  event-service → feature-engine → profile-service → mastery-service   │   │
│  │       ↓                ↓                                  ↓           │   │
│  │  recommendation-engine ←──────────────┘         study-planner-service │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │                    AI INTEGRATION LAYER                                │   │
│  │  z-ai-web-dev-sdk → LLM Chat Completions → 36 AI Features            │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                                      │
│                                                                             │
│  ┌───────────────────────┐    ┌───────────────────────────────────────────┐  │
│  │  SQLite (DEFAULT)     │    │  MySQL (schema_mysql.prisma AVAILABLE)    │  │
│  │  file:./db/custom.db │    │  Requires: DATABASE_URL_MYSQL env var     │  │
│  │  148 Models           │    │  148 Models (~3,350 lines)               │  │
│  │  via Prisma ORM       │    │  via db_mysql.ts                         │  │
│  └───────────────────────┘    └───────────────────────────────────────────┘  │
│                                                                             │
│  Prisma Client: import { db } from '@/lib/db'                              │
│  Hot-reload safe singleton pattern via globalThis                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### 3.1 Core Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 16.1.1 | SSR/SSG framework, API routes, standalone output |
| **Language** | TypeScript | 5.x | Static typing, 673-line type definition file |
| **Runtime** | Bun | latest | Package manager, script runner, production server |
| **React** | React | 19.0.0 | UI rendering, concurrent features |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS, JIT compilation |
| **UI Library** | shadcn/ui (New York) | 45 components | Pre-built Radix UI primitives with Tailwind |
| **ORM** | Prisma | 6.11.1 | Type-safe database access, 148 models |
| **Database** | SQLite | default | File-based development/production DB |
| **Database** | MySQL | schema available | Production-grade alternative schema |

### 3.2 State & Data

| Technology | Version | Purpose |
|---|---|---|
| Zustand | 5.0.6 | Global client state, navigation, auth, persistence |
| TanStack Query | 5.82.0 | Server state management, caching, background refetch |
| TanStack Table | 8.21.3 | Data table rendering with sorting/filtering/pagination |
| react-hook-form | 7.60.0 | Form state management with validation |
| zod | 4.0.2 | Schema validation (forms, API payloads) |

### 3.3 AI & Intelligence

| Technology | Version | Purpose |
|---|---|---|
| z-ai-web-dev-sdk | 0.0.18 | LLM integration (chat completions, streaming) |

### 3.4 UI Enhancement

| Technology | Version | Purpose |
|---|---|---|
| Framer Motion | 12.23.2 | Page transitions (AnimatePresence), micro-interactions |
| Recharts | 2.15.4 | Data visualization (line, bar, pie, radar charts) |
| lucide-react | 0.525.0 | Icon library (1000+ icons) |
| sonner | 2.0.6 | Toast notifications (top-center position) |
| cmdk | 1.1.1 | Command palette (⌘K search) |
| embla-carousel | 8.6.0 | Carousel/slider component |
| vaul | 1.1.2 | Drawer component (mobile-friendly) |
| react-markdown | 10.1.0 | Markdown rendering (AI responses, content) |
| react-syntax-highlighter | 15.6.1 | Code syntax highlighting |
| @mdxeditor/editor | 3.39.1 | Rich text/MDX editing |
| react-resizable-panels | 3.0.3 | Resizable panel layouts |
| @dnd-kit/core | 6.3.1 | Drag and drop (course builder, reordering) |
| date-fns | 4.1.0 | Date manipulation/formatting |
| react-day-picker | 9.8.0 | Calendar/date picker |
| input-otp | 1.4.2 | OTP input component |
| sharp | 0.34.3 | Server-side image processing |

### 3.5 Cross-Cutting

| Technology | Version | Purpose |
|---|---|---|
| next-themes | 0.4.6 | Dark mode / theme switching (class-based) |
| next-intl | 4.3.4 | Internationalization (English / Urdu) |
| next-auth | 4.24.11 | Installed (unused — custom auth routes used instead) |
| @hookform/resolvers | 5.1.1 | Zod resolver for react-hook-form |
| tailwind-merge | 3.3.1 | Intelligent Tailwind class merging (cn utility) |
| class-variance-authority | 0.7.1 | Component variant system |
| uuid | 11.1.0 | Unique ID generation |
| docx | 9.7.1 | Word document generation (certificates, reports) |
| @reactuses/core | 6.0.5 | Additional React hooks |

---

## 4. Frontend Architecture

### 4.1 SPA-within-SSR Pattern

The entire platform operates as a **single-page application embedded within a server-side rendered Next.js page**. There is exactly ONE route — `src/app/page.tsx` — and all navigation is handled client-side via the Zustand store's `currentView` state.

```
┌─────────────────────────────────────────────────────────────────┐
│                    page.tsx (THE ONLY ROUTE)                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  1. Mount → Fetch /api/seed → Initialize app state      │   │
│  │  2. Read currentView from Zustand store                  │   │
│  │  3. Read currentUser.role from Zustand store             │   │
│  │  4. Resolve view key: resolveViewKey(view, userRole)     │   │
│  │  5. Select shell based on role + view category           │   │
│  │  6. Render shell (Header + Sidebar + Main + BottomBar)   │   │
│  │  7. Lazy-load view component via viewLoaders map         │   │
│  │  8. Animate transition with Framer Motion                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 View Resolution System

Navigation is driven by the Zustand store's `currentView` field, which is a union type of 100+ string literals. The `resolveViewKey()` function in `@/lib/view-utils` maps ambiguous view keys to their correct component based on the user's role:

```typescript
// src/lib/view-utils.ts
export function resolveViewKey(view: View, userRole?: UserRole): string {
  if (view === 'dashboard' && userRole === 'instructor') return 'instructor-dashboard'
  if (view === 'dashboard' && userRole === 'admin') return 'admin'
  if (view === 'settings' && userRole !== 'instructor') return 'student-settings'
  return view
}
```

**Role-based view resolution matrix:**

| User clicks `currentView` | Student sees | Instructor sees | Admin sees |
|---|---|---|---|
| `dashboard` | `dashboard` | `instructor-dashboard` | `admin` |
| `settings` | `student-settings` | `instructor-settings` | `admin-settings` |

### 4.3 Lazy Loading Architecture

All 84 view components are loaded on-demand via a `viewLoaders` map using dynamic `import()`:

```typescript
const viewLoaders: Record<string, () => Promise<{ default: ComponentType }>> = {
  'landing': () => import('@/components/views/landing-view').then(m => ({ default: m.LandingView })),
  'login':    () => import('@/components/views/login-view').then(m => ({ default: m.LoginView })),
  'admin':    () => import('@/components/admin/admin-dashboard-v2').then(m => ({ default: m.AdminDashboardV2 })),
  // ... 81 more entries
}
```

**Lazy component creation strategy:**

```
Module Load Time:
  ├── Object.keys(viewLoaders).forEach(key => getOrCreateLazy(key))
  │     → Pre-creates ALL React.lazy() wrappers at module scope
  │     → Does NOT trigger any network requests
  │
Render Time:
  ├── getOrCreateLazy(viewKey) → Returns pre-created lazy component
  ├── <Suspense fallback={<ViewLoading />}> → Shows spinner during chunk load
  └── Chunk loads → Component renders
```

**Key optimization:** Lazy wrappers are pre-created at module scope (not during render), preventing React from recreating lazy components on every render cycle.

### 4.4 Shell Architecture

The platform uses **5 distinct shell layouts**, each providing a different chrome around the main content area:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SHELL SELECTION LOGIC                         │
│                                                                      │
│  if (authViews.includes(currentView))                                │
│    → AUTH SHELL: Full-screen, no chrome                              │
│                                                                      │
│  else if (publicViews.includes(currentView))                         │
│    → PUBLIC SHELL: Full-screen + PublicBottomBar (mobile)            │
│                                                                      │
│  else if (currentView === 'course-player')                           │
│    → COURSE PLAYER SHELL: Immersive, h-screen, overflow-hidden       │
│                                                                      │
│  else if (currentUser.role === 'admin')                              │
│    → ADMIN SHELL: Header + Sidebar + Main + BottomTabBar             │
│                                                                      │
│  else if (currentUser.role === 'instructor')                         │
│    → INSTRUCTOR SHELL: Header + Sidebar + Main + BottomTabBar +      │
│                         NotificationProvider                          │
│                                                                      │
│  else (student / default)                                            │
│    → STUDENT SHELL: Header + Sidebar + Main + BottomTabBar +         │
│                      NotificationProvider                             │
└─────────────────────────────────────────────────────────────────────┘
```

**Common shell structure (Admin/Instructor/Student):**

```
┌──────────────────────────────────────────────────┐
│  Header (role-specific navigation, search, user) │
├──────────┬───────────────────────────────────────┤
│          │                                       │
│ Sidebar  │   Main Content Area                   │
│ (role-   │   ┌───────────────────────────────┐   │
│ specific │   │ AnimatePresence + motion.div  │   │
│ nav      │   │   → LazyViewContent            │   │
│ items)   │   │     → Resolved View Component │   │
│          │   └───────────────────────────────┘   │
│          │                                       │
│          │   Footer ("ShijlAI Academy — Panel")  │
├──────────┴───────────────────────────────────────┤
│  BottomTabBar (mobile-only, role-specific tabs)   │
└──────────────────────────────────────────────────┘
```

**Full-width views** (no sidebar padding, no overflow scroll): `student-messages`, `instructor-messages`, `tutor`, `recommendations`, `shijlai-hub`, `learning-companion`

### 4.5 Page Transition Animations

```typescript
const pageTransition = {
  initial:    { opacity: 0, y: 8 },
  animate:    { opacity: 1, y: 0 },
  exit:       { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] },
}
```

- Uses Framer Motion `AnimatePresence` with `mode="wait"`
- Key is set to `resolvedViewKey` to ensure proper unmount/remount on view changes
- Subtle 8px vertical slide + fade for a polished feel

### 4.6 View Categories & Counts

| Category | View Count | Views |
|---|---|---|
| **Auth** | 4 | `login`, `register`, `forgot-password`, `verify-otp` |
| **Public** | 8 | `landing`, `public-courses`, `public-course-detail`, `pricing`, `instructors`, `about`, `blog`, `blog-detail` |
| **Student** | 22 | `dashboard`, `courses`, `course-detail`, `tutor`, `achievements`, `my-skills`, `quiz`, `certificates`, `student-assignments`, `student-messages`, `student-schedule`, `student-qa`, `recommendations`, `shijlai-hub`, `learning-companion`, `explore`, `community`, `course-player`, `notifications`, `student-profile`, `student-settings`, `student-assignment-detail` |
| **Instructor** | 17 | `instructor-dashboard`, `instructor-courses`, `instructor-course-detail`, `instructor-students`, `instructor-quizzes`, `instructor-assignments`, `instructor-analytics`, `instructor-qa`, `instructor-schedule`, `instructor-revenue`, `instructor-marketing`, `instructor-copilot`, `instructor-assessment`, `instructor-settings`, `instructor-messages`, `instructor-profile`, `course-creator` |
| **Admin** | 27 | `admin`, `admin-users`, `admin-courses`, `admin-qa-reports`, `admin-revenue`, `admin-payouts`, `admin-refunds`, `admin-marketing`, `admin-notifications`, `admin-live-sessions`, `admin-gamification`, `admin-ai-config`, `admin-appearance`, `admin-security`, `admin-settings`, `admin-audit-log`, `admin-dev-tools`, `admin-user-detail`, `admin-instructors`, `admin-instructor-detail`, `admin-course-review`, `admin-course-review-detail`, `admin-applications`, `admin-analytics`, `admin-copilot`, `admin-system-intelligence`, `admin-shijlai-hub`, `admin-blog` |
| **Other** | 6 | `application-status`, `analytics`, `learning-paths`, `smart-content`, `instructor-ai-tools`, `instructor-ai-tool-detail` |
| **Total** | **84** | |

---

## 5. Backend Architecture

### 5.1 API Route Organization

The API layer follows REST conventions organized by domain/role. All routes use Next.js App Router route handlers (`route.ts` files).

```
src/app/api/
├── auth/                        # Authentication (7 routes)
│   ├── login/route.ts
│   ├── register/route.ts
│   ├── verify-otp/route.ts
│   ├── forgot-password/route.ts
│   ├── reset-password/route.ts
│   ├── social/route.ts
│   └── demo-login/route.ts
│
├── ai/                          # AI Services (33 routes)
│   ├── chat/route.ts
│   ├── tutor/route.ts
│   ├── tutor/sessions/route.ts
│   ├── tutor/sessions/[id]/route.ts
│   ├── study-planner/route.ts
│   ├── companion/route.ts
│   ├── mock-interview/route.ts
│   ├── learning-paths/route.ts
│   └── shijlai/                 # ShijlAI Hub (13 routes)
│       ├── chat/route.ts
│       ├── insights/route.ts
│       ├── profile/route.ts
│       ├── recommendations/route.ts
│       ├── search/route.ts
│       ├── study-plan/route.ts
│       ├── quiz-generator/route.ts
│       ├── events/route.ts
│       ├── sessions/route.ts
│       ├── sessions/[id]/route.ts
│       ├── mastery/route.ts
│       ├── mastery/seed/route.ts
│       └── events/route.ts
│
├── instructor/                  # Instructor APIs (68+ routes)
│   ├── courses/                 # Course CRUD + management
│   ├── modules/                 # Module & lesson management
│   ├── assignments/             # Assignment management
│   ├── students/                # Student roster & details
│   ├── revenue/                 # Revenue, payouts, exports
│   ├── analytics/               # Insights, comparison, engagement
│   ├── qa/                      # Q&A management
│   ├── schedule/                # Schedule management
│   ├── quizzes/                 # Quiz management
│   ├── messages/                # Messaging
│   ├── profile/                 # Profile management
│   ├── certificates/            # Certificate issuance
│   ├── notifications/           # Notification management
│   ├── dashboard/               # Dashboard data
│   ├── copilot/                 # Instructor AI copilot
│   ├── assessment/              # Smart assessment tools
│   ├── settings/                # Account & avatar settings
│   ├── payout-methods/          # Payout configuration
│   ├── financial-settings/      # Financial preferences
│   ├── quick-actions/           # Quick action triggers
│   ├── submissions/             # Assignment submissions
│   ├── refund/                  # Refund management
│   ├── lessons/                 # Lesson management
│   └── ai/                      # Instructor AI tools (18 routes)
│       ├── generate-curriculum/route.ts
│       ├── generate-quiz/route.ts
│       ├── generate-rubric/route.ts
│       ├── generate-outcomes/route.ts
│       ├── generate-lesson-content/route.ts
│       ├── generate-assignment/route.ts
│       ├── generate-description/route.ts
│       ├── generate-thumbnail/route.ts
│       ├── auto-respond/route.ts
│       ├── suggest-reply/route.ts
│       ├── auto-caption/route.ts
│       ├── analyze-feedback/route.ts
│       ├── improve-bio/route.ts
│       ├── assistant/route.ts
│       ├── assistant-messages/route.ts
│       ├── templates/route.ts
│       ├── templates/[id]/route.ts
│       ├── course-insights/route.ts
│       ├── usage-stats/route.ts
│       └── generations/route.ts (+ [id])
│
├── student/                     # Student APIs (30+ routes)
│   ├── assignments/route.ts
│   ├── bookmarks/route.ts
│   ├── challenges/route.ts
│   ├── community/               # Study groups, discussions, peer reviews
│   │   ├── study-groups/
│   │   ├── discussions/
│   │   ├── peer-reviews/
│   │   ├── leaderboard/
│   │   └── events/
│   ├── course-player/route.ts
│   ├── daily-plan/route.ts
│   ├── goals/route.ts
│   ├── learning/route.ts
│   ├── messages/                # Conversation-based messaging
│   ├── notes/route.ts
│   ├── progress/route.ts
│   ├── profile/route.ts
│   ├── qa/route.ts
│   ├── recommendations/route.ts
│   ├── reviews/route.ts
│   ├── schedule/route.ts
│   ├── settings/route.ts
│   ├── streak/route.ts
│   ├── activity/route.ts
│   └── wishlist/route.ts
│
├── admin/                       # Admin APIs (60+ routes)
│   ├── users/                   # CRUD, bulk, export, [id]
│   ├── courses/                 # CRUD, bulk, export, analytics, [id]
│   ├── finance/                 # Overview, payouts, refunds, transactions,
│   │                            # export, disputes, tax-reports, forecast,
│   │                            # revenue-split, settings
│   ├── security/                # API keys, roles, blocked IPs, sessions,
│   │                            # login-alerts, seed
│   ├── ai-config/               # Providers, models, prompt templates,
│   │                            # usage-logs, audit-log, seed
│   ├── gamification/            # Challenges, badges, levels, XP rules,
│   │                            # events, leaderboard, streak-rewards,
│   │                            # reward-shop, settings, bulk-actions
│   ├── notifications/           # Templates, history, settings, send
│   ├── settings/                # Platform settings, payment methods,
│   │                            # legal pages, integrations, webhooks
│   ├── course-review/           # Review workflow, AI analysis, bulk
│   ├── instructors/             # CRUD, bulk, export, [id]
│   ├── instructor-applications/ # Application management
│   ├── content-review/          # Content review workflow
│   ├── audit-log/route.ts
│   ├── dashboard/               # Dashboard data, actions
│   ├── dev-tools/route.ts
│   ├── appearance/              # Theme presets, history
│   ├── copilot/route.ts
│   ├── system-intelligence/     # Insights generation
│   ├── course-thumbnails/route.ts
│   ├── announcements/route.ts
│   ├── enrollments/route.ts
│   ├── export-report/route.ts
│   ├── feature-flags/route.ts
│   ├── student-insights/route.ts
│   ├── platform-settings/route.ts
│   ├── reports/route.ts
│   └── blog/                    # CRUD, [id]
│
├── courses/                     # Public course APIs
│   ├── route.ts                 # Course listing
│   ├── catalog/route.ts         # Catalog with filters
│   ├── categories/route.ts      # Category list
│   └── [id]/                    # Course detail, public, reviews
│
├── certificates/                # Certificate APIs
│   ├── route.ts                 # List certificates
│   ├── download/route.ts        # Download certificate
│   └── verify/route.ts          # Verify certificate
│
├── analytics/                   # Platform analytics
│   ├── route.ts
│   ├── events/route.ts
│   └── intelligent/route.ts
│
├── notifications/               # Notification APIs
│   ├── route.ts
│   ├── preferences/route.ts
│   └── seed/route.ts
│
├── blog/                        # Blog APIs
│   ├── route.ts
│   ├── seed/route.ts
│   └── [id]/route.ts
│
├── gamification/route.ts
├── skills/route.ts
├── skill-graph/route.ts
├── search/route.ts
├── enrollments/route.ts
├── progress/route.ts
├── dashboard/route.ts
├── quizzes/[id]/route.ts
├── quizzes/[id]/attempt/route.ts
├── instructor-applications/     # Public instructor applications
├── users/me/route.ts
├── download/route.ts
├── seed/route.ts
└── route.ts                     # API root
```

### 5.2 REST Conventions

| HTTP Method | Purpose | Example |
|---|---|---|
| `GET` | Read/list resources | `GET /api/admin/users` |
| `POST` | Create resource or action | `POST /api/auth/login` |
| `PUT` | Full resource update | `PUT /api/admin/users/[id]` |
| `PATCH` | Partial update | `PATCH /api/admin/courses/[id]/flag` |
| `DELETE` | Delete resource | `DELETE /api/admin/users/[id]` |

### 5.3 Response Patterns

All API routes follow a consistent response pattern using `NextResponse.json()`:

```typescript
// Success response
return NextResponse.json({ data, message: 'Success' })

// Error response
return NextResponse.json({ error: 'Description' }, { status: 400 })

// Auth error
return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

// Not found
return NextResponse.json({ error: 'Resource not found' }, { status: 404 })

// Rate limited
return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

// Account locked
return NextResponse.json({ error: 'Account locked' }, { status: 423 })
```

### 5.4 Auth on API Routes

There is **no middleware** — each route handles its own authentication check by reading user data from the request body or requiring user ID parameters. The login route returns a safe user object (stripping `passwordHash`, `mfaSecret`, etc.) that the client stores in Zustand/localStorage.

---

## 6. Database Architecture

### 6.1 ORM Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRISMA ORM CONFIGURATION                      │
│                                                                  │
│  Generator: prisma-client-js                                     │
│  Default DB: SQLite → file:./db/custom.db                       │
│  Alt DB:     MySQL  → schema_mysql.prisma (same 148 models)     │
│  Client:     import { db } from '@/lib/db'                       │
│  Alt Client: import { dbMySQL } from '@/lib/db_mysql'            │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Connection Management (Hot-Reload Safe Singleton)

```typescript
// src/lib/db.ts
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

**Why this pattern:** In development with hot-reloading, Next.js recreates modules on every file change. Without the `globalThis` guard, each hot-reload would create a new PrismaClient, exhausting database connections. The singleton pattern ensures one client persists across hot-reloads.

### 6.3 MySQL Alternative

```typescript
// src/lib/db_mysql.ts
// To activate: npx prisma generate --schema=prisma/schema_mysql.prisma
// Ensure DATABASE_URL_MYSQL is set in .env

export const dbMySQL =
  globalForPrismaMySQL.prismaMySQL ??
  new PrismaClient({ log: ... })
```

The MySQL schema is maintained in parallel at `prisma/schema_mysql.prisma` with identical model definitions but MySQL-specific types and features (e.g., `@db.Text`, `@db.Json`).

### 6.4 Schema Overview (148 Models)

The schema spans approximately 3,350 lines per schema file. Key model groups:

| Domain | Models | Key Models |
|---|---|---|
| **Core** | 4 | User, Course, Module, Lesson |
| **Enrollment & Progress** | 3 | Enrollment, LessonProgress, DailyActivity |
| **Assessment** | 5 | Quiz, Question, QuizAttempt, Assignment, Submission |
| **Gamification** | 8 | Badge, UserBadge, XpActivity, StreakFreeze, UserChallenge, LearningGoal, UserReward, DailyChallenge |
| **Communication** | 5 | Conversation, ConversationParticipant, Message, Notification, NotificationPreference |
| **AI & Learning** | 12 | TutorSession, ChatMessage, StudentLearningProfile, TopicMastery, LearningMetric, AIRecommendation, ShijlAISession, ShijlAIMessage, StudentAIActivity, LearningInsight, AIQuizGeneration, StudyPlan + StudyPlanTask |
| **Instructor AI** | 7 | AIGeneration, AITemplate, AIAssistantMessage, AIGeneratedOutline, AIGeneratedLesson, AIGeneratedAssignment, AIGeneratedRubric, AIGeneratedQuiz |
| **Finance** | 5 | Transaction, Payout, PayoutMethod, CommissionOverride, Dispute |
| **Community** | 10 | DiscussionPost, DiscussionReply, StudyGroup, StudyGroupMember, StudyGroupMessage, StudyGroupResource, PeerReview, CommunityEvent, EventAttendee, DiscussionBookmark, DiscussionUpvote |
| **Instructor** | 4 | InstructorProfile, InstructorSettings, InstructorApplication, ApplicationTimeline, ApplicationInterview |
| **Admin** | 8 | ActivityLog, UserSession, CourseReviewHistory, CourseQualityAnalysis, LearningOutcome, PlatformStats, FeatureFlag, SystemInsight |
| **Blog** | 2 | BlogPost, BlogCategory |
| **Skills** | 4 | Skill, UserSkill, CourseSkill, LessonSkill, QuestionSkill, SkillTopicMapping |
| **Other** | 12 | Certificate, Review, Wishlist, LessonNote, LessonBookmark, LiveSession, SessionAttendee, ScheduleEvent, ParentLink, AICompanionMessage, AICompanionEvent, MockInterview, LearningPath, LearningPathNode |

### 6.5 Key Database Design Patterns

**JSON Fields:** Complex/nested data is stored as JSON strings in SQLite (which lacks native JSON columns). Examples:
- `Course.tags` → JSON array of strings
- `Assignment.rubric` → JSON array of `{criteria, description, maxPoints}`
- `User.adminNotes` → JSON array of `{note, adminName, date}`
- `StudentLearningProfile.weakTopics` → JSON array of topic names

**Status Machines:** Multiple models use string-based status fields with defined state machines:
- `InstructorApplication.status`: `pending → under_review → interview_scheduled → approved → onboarded` (or `rejected`)
- `Course.reviewStatus`: `draft → under_review → approved → rejected → changes_requested → flagged`
- `Payout.status`: `pending → processing → completed → failed → cancelled → disputed`
- `User.status`: `active → suspended → banned → pending_verification`

**Composite Unique Constraints:**
- `Enrollment`: `@@unique([userId, courseId])` — one enrollment per user per course
- `LessonProgress`: `@@unique([enrollmentId, lessonId])` — one progress record per lesson per enrollment
- `UserBadge`: `@@unique([userId, badgeId])` — one badge instance per user
- `QAUpvote`: `@@unique([questionId, userId])` — one upvote per user per question

---

## 7. AI Engine Architecture

### 7.1 Overview

The AI Engine is the platform's intelligence core, consisting of 7 interconnected services that transform raw learning events into adaptive recommendations and AI-augmented study plans.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     LEARNING ENGINE PIPELINE                         │
│                                                                      │
│  Student Action                                                      │
│       │                                                              │
│       ▼                                                              │
│  ┌─────────────┐     ┌──────────────┐     ┌───────────────────┐    │
│  │  EVENT       │────▶│  FEATURE     │────▶│  PROFILE          │    │
│  │  SERVICE     │     │  ENGINE      │     │  SERVICE          │    │
│  │             │     │              │     │                   │    │
│  │ logEvent()  │     │ compute-     │     │ getOrCreate-      │    │
│  │ compute-    │     │  Learning-   │     │  Profile()        │    │
│  │  Score-     │     │  Speed()     │     │ updateStudent-    │    │
│  │  Delta()    │     │ compute-     │     │  Profile()        │    │
│  │             │     │  Engagement- │     │                   │    │
│  │             │     │  Score()     │     │ → learningLevel   │    │
│  │             │     │ compute-     │     │ → engagementScore │    │
│  │             │     │  Consistency │     │ → dropRiskScore   │    │
│  │             │     │ compute-     │     │ → weakTopics      │    │
│  │             │     │  AvgPerf()   │     │ → strongTopics    │    │
│  │             │     │ compute-     │     │ → learningSpeed   │    │
│  │             │     │  DropRisk()  │     │                   │    │
│  └──────┬──────┘     └──────────────┘     └────────┬──────────┘    │
│         │                                          │               │
│         ▼                                          ▼               │
│  ┌─────────────┐     ┌──────────────┐     ┌───────────────────┐    │
│  │  MASTERY     │────▶│  RECOMMEND-  │◀────│  STUDY PLANNER    │    │
│  │  SERVICE     │     │  ATION       │     │  SERVICE          │    │
│  │             │     │  ENGINE      │     │                   │    │
│  │ update-     │     │              │     │ generateStudy-    │    │
│  │  Topic-     │     │ generate-    │     │  Plan()           │    │
│  │  Mastery()  │     │  Recommend-  │     │ generateAIPlan-   │    │
│  │ apply-      │     │  ations()    │     │  Enhancement()    │    │
│  │  TimeDecay()│     │              │     │ getStudentStudy-  │    │
│  │ compute-    │     │ compute-     │     │  Plans()          │    │
│  │  Weighted-  │     │  Priority-   │     │ updateStudyPlan-  │    │
│  │  Mastery()  │     │  Score()     │     │  Task()           │    │
│  │ getWeak-    │     │              │     │ getTodayTasks()   │    │
│  │  Topics()   │     │ → type       │     │                   │    │
│  │ getStrong-  │     │ → title      │     │ → daily tasks     │    │
│  │  Topics()   │     │ → reason     │     │ → AI tips         │    │
│  │             │     │ → priority   │     │ → topic weights   │    │
│  └─────────────┘     └──────────────┘     └───────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Service Deep-Dives

#### 7.2.1 Event Service (`event-service.ts`)

The **foundation** of the learning engine. Every student action must be logged here — "if an action is NOT logged, it does NOT exist for AI."

**Primary function:** `logEvent(params: LogEventParams)`

```typescript
interface LogEventParams {
  userId: string
  eventType: string        // 'quiz_attempted', 'lesson_completed', etc.
  eventValue?: number      // Score, time, etc.
  courseId?: string
  topicId?: string
  metadata?: Record<string, unknown>
}
```

**Event pipeline:**
1. Insert `LearningMetric` record in database
2. If `topicId` is specified → compute `scoreDelta` and update topic mastery
3. Trigger profile recomputation (throttled: at most once per 5 minutes)

**Score delta computation by event type:**

| Event Type | Score Delta |
|---|---|
| `quiz_attempted` | `eventValue * 0.3` (30% weight) |
| `lesson_completed` | Fixed `15` points |
| `assignment_submitted` | `eventValue * 0.25` (25% weight) |
| `video_watched` | Fixed `5` points |
| `ai_tutor_used` | Fixed `3` points |
| Default | `eventValue * 0.1` |

**Helper functions:** `getRecentEvents()`, `getEventCount()`, `getEventSum()`

#### 7.2.2 Feature Engine (`feature-engine.ts`)

Transforms raw event data into **normalized 0-100 metric scores**. Five computed features:

| Feature | Function | Formula / Logic |
|---|---|---|
| **Learning Speed** | `computeLearningSpeed()` | `(completedLessons / totalTimeHours) * 10`, clamped 0-100. Default 50 for new students. |
| **Engagement Score** | `computeEngagementScore()` | Weighted: login frequency (max 35) + time spent (max 28) + quiz attempts (max 20) + AI usage (max 15) + lessons (max 5). 7-day window for most metrics, 30-day for logins. |
| **Consistency Score** | `computeConsistencyScore()` | `(activeDays / totalDaysEnrolled) * 100` with streak penalty (−10 if streak < 3) |
| **Average Performance** | `computeAveragePerformance()` | Mean of all quiz percentages and assignment score percentages |
| **Drop Risk** | `computeDropRisk()` | `(lowEngagement * 0.3) + (lowConsistency * 0.3) + (decliningScore * 0.2) + (inactivityScore * 0.2)`. Ranges: 0-30 safe, 30-60 warning, 60-100 high risk. |

**Drop risk deep-dive:**
```
dropRisk = (100 - engagement) × 0.3   // Low engagement is biggest signal
         + (100 - consistency) × 0.3   // Irregular study patterns
         + decliningScore × 0.2         // Recent quiz scores dropping vs. older
         + inactivityScore × 0.2        // 5 points per inactive day
```

#### 7.2.3 Profile Service (`profile-service.ts`)

Aggregates feature engine outputs into a **StudentLearningProfile** record that serves as the single source of truth for a student's learning state.

**Key function:** `updateStudentProfile(userId)`

**Throttling:** Profile is recomputed at most once every 5 minutes (checks `lastComputedAt`).

**Profile fields computed:**

| Field | Source |
|---|---|
| `learningLevel` | `beginner/intermediate/advanced` based on performance + engagement |
| `engagementScore` | From feature engine |
| `consistencyScore` | From feature engine |
| `learningSpeedScore` | From feature engine |
| `dropRiskScore` | From feature engine |
| `completionRate` | `(completed enrollments / total enrollments) * 100` |
| `averageQuizScore` | From feature engine (averagePerformance) |
| `weakTopics` | JSON array from mastery service (score < 50) |
| `strongTopics` | JSON array from mastery service (score >= 75) |
| `learningSpeed` | `slow/moderate/fast` label |
| `totalXpEarned` | From user record |
| `totalLessonsCompleted` | Aggregated from enrollments |
| `totalQuizzesTaken` | Count of quiz attempts |
| `totalTimeSpent` | Aggregated from lesson progress |
| `studyStreakDays` | From user streak |
| `lastComputedAt` | Timestamp of last computation |

**Fallback logic:** If no mastery data exists, weak/strong topics are derived from enrollment completion rates by course category.

#### 7.2.4 Mastery Service (`mastery-service.ts`)

The **weighted mastery engine** that tracks per-topic proficiency using a four-component scoring formula.

**Weighted Formula:**

```
masteryScore = quizScore × 0.50        // Quizzes are the strongest signal
             + assignmentScore × 0.25   // Assignments demonstrate application
             + practiceScore × 0.15     // Practice shows repetition
             + completionScore × 0.10   // Completion shows consistency
```

**Status Labels:**

| Score Range | Status | Display | Color |
|---|---|---|---|
| 90-100% | `mastered` | 🟢 Mastered | Emerald |
| 75-89% | `strong` | 🔵 Strong | Blue |
| 50-74% | `learning` | 🟡 Learning | Amber |
| 25-49% | `weak` | 🔴 Weak | Red |
| 0-24% | `not_started` | ⚪ Not Started | Slate |

**Trend Detection:**
- `improving`: masteryScore increased by > 2 points
- `declining`: masteryScore decreased by > 2 points
- `stable`: within ±2 points

**Time Decay:** Topics not attempted in 7+ days decay at 0.5% per day, applied proportionally to all four component scores. Decay is triggered during profile updates.

**Skill Aggregation:** `computeSkillMasteries()` aggregates topic-level scores into skill-level scores using weighted averages from `SkillTopicMapping` records, or auto-groups by `skillId` if no mappings exist.

**Mastery Insights:** `getMasteryInsights()` generates human-readable insights like:
- "You perform well in [topics]."
- "You struggle most with [topics]."
- "X% of your mistakes come from your weak topics."
- "X topics are declining — review [topic] soon."
- Mistake concentration analysis (% of errors from weak topics)

#### 7.2.5 Recommendation Engine (`recommendation-engine.ts`)

Generates **adaptive learning recommendations** based on mastery data, engagement profiles, and drop risk.

**4-Step Pipeline:**

```
Step 1: Identify weak areas (mastery < 50%)
         ├── Very weak (< 30%): recommend basics + practice quizzes
         └── Weak (< 50%): recommend revision content

Step 2: Map prerequisites (incomplete modules in enrolled courses)

Step 3: Apply recommendation rules (based on performance level)

Step 4: Score and prioritize using priority formula
```

**Priority Scoring Formula:**

```
priorityScore = weaknessWeight × 0.4     // How weak the topic is
              + careerRelevance × 0.2     // Relevance to learning path
              + engagementMatch × 0.2     // Student engagement level match
              + recencyNeed × 0.2         // Time-sensitivity
```

**Recommendation Types:** `topic`, `quiz`, `lesson`, `course`, `study_plan`

**Drop Risk Recommendations:**
- Score > 60: "Create a Study Plan" (high priority, score 85)
- Score > 30: "Review Your Study Schedule" (medium priority, score 60)

**Deduplication:** Checks for existing active recommendations with the same type + title before creating new ones.

#### 7.2.6 Study Planner Service (`study-planner-service.ts`)

Generates **structured, multi-day study plans** with AI-augmented tips.

**Input Parameters:**

```typescript
interface GenerateStudyPlanParams {
  userId: string
  courseId?: string
  courseName?: string
  examDate: string          // ISO date
  targetGrade?: string
  currentGrade?: string
  dailyHours: number        // Hours available per day
  weakTopics?: string[]
  strongTopics?: string[]
}
```

**Topic Distribution Algorithm:**

| Topic Type | Weight Allocation |
|---|---|
| Weak topics | 40% of study time |
| Moderate topics | 30% of study time |
| Strong topics (revision only) | 15% of study time |
| Free time | 15% for practice/quizzes |

**Task Types:** `study`, `quiz`, `revision`, `practice`, `mock_exam`, `ai_discussion`

**Phase-Based Task Selection:**

| Phase | Day Range | Task Allocation |
|---|---|---|
| Early (0-40%) | Days 1-12 (of 30) | Study → AI Discussion → Quiz |
| Middle (40-75%) | Days 13-22 | Study → Practice → Quiz |
| Late (75-100%) | Days 23-30 | Revision → Mock Exam → Practice |

**Daily Task Count:** Based on available hours: 1hr→1 task, 2hr→2 tasks, 4hr→3 tasks, 4hr+→4 tasks

**Time Split Per Day:** Tasks are split 40%/30%/20%/10% of daily hours.

**AI Enhancement:** Optionally calls `z-ai-web-dev-sdk` to generate personalized tips, focus areas, and schedule notes. Graceful fallback if AI is unavailable.

**Max Plan Duration:** 90 days (plans beyond this become unwieldy).

### 7.3 LLM Integration

The platform uses `z-ai-web-dev-sdk` for AI features across 57 API endpoints:

**SDK Import Patterns:**

```typescript
// Dynamic import (Student/Admin routes — avoids cold-start penalty)
const { z } = await import('z-ai-web-dev-sdk')
const zai = await z.ai.create()

// Direct import (Instructor routes — always loaded)
import { z } from 'z-ai-web-dev-sdk'
```

**AI Feature Categories:**

| Category | Features | Endpoints |
|---|---|---|
| **Student AI** | AI Tutor, Ask ShijlAI Chat, Learning Companion, Mock Interview, Study Planner | 20 |
| **ShijlAI Hub** | Chat, Insights, Profile, Recommendations, Search, Study Plan, Quiz Generator, Events, Sessions, Mastery | 13 |
| **Instructor AI** | Curriculum Generation, Quiz Generation, Rubric Generation, Auto-Respond, Suggest Reply, Generate Lesson Content, Generate Assignment, Generate Description, Generate Thumbnail, Auto-Caption, Analyze Feedback, Improve Bio, Assistant Messages, Course Insights, Usage Stats | 18 |
| **Admin AI** | AI Config (Providers, Models, Prompt Templates, Usage Logs), Copilot, System Intelligence | 6 |

**Typical LLM Call Pattern:**

```typescript
const completion = await zai.chat.completions.create({
  messages: [
    { role: 'system', content: 'You are a [domain] assistant...' },
    { role: 'user', content: prompt },
  ],
  thinking: { type: 'disabled' },
})
const response = completion.choices?.[0]?.message?.content || ''
```

---

## 8. Authentication & Authorization

### 8.1 Custom Auth Architecture

The platform implements a **custom authentication system** rather than using the installed `next-auth@4.24.11`. There is **no `src/middleware.ts`** — auth is entirely client-side with API-level validation.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AUTH FLOW ARCHITECTURE                          │
│                                                                      │
│  ┌──────────┐     ┌──────────────┐     ┌─────────────────────────┐  │
│  │  CLIENT   │     │  API ROUTES  │     │  DATABASE               │  │
│  │           │     │              │     │                         │  │
│  │ Zustand   │────▶│ /api/auth/   │────▶│ User model              │  │
│  │ Store     │     │   login      │     │  → passwordHash         │  │
│  │           │     │   register   │     │  → mfaEnabled           │  │
│  │ Persisted │◀────│   verify-otp │     │  → mfaSecret            │  │
│  │ to        │     │   forgot-pw  │     │  → otpCode/otpExpiresAt │  │
│  │ local-    │     │   reset-pw   │     │  → resetToken           │  │
│  │ Storage   │     │   social     │     │  → loginAttempts        │  │
│  │           │     │   demo-login │     │  → lockedUntil          │  │
│  └──────────┘     └──────────────┘     │  → isVerified           │  │
│                                         │  → authProvider          │  │
│                                         └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Auth API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/login` | POST | Email/password login with attempt tracking & account locking |
| `/api/auth/register` | POST | User registration with role selection |
| `/api/auth/verify-otp` | POST | OTP verification for MFA/email verification |
| `/api/auth/forgot-password` | POST | Initiate password reset (generates token) |
| `/api/auth/reset-password` | POST | Complete password reset with token |
| `/api/auth/social` | POST | Social login (Google, Facebook, Apple) |
| `/api/auth/demo-login` | POST | Quick demo account login |

### 8.3 Login Flow

```
1. Client sends POST /api/auth/login { email, password }
2. Server finds user by email
3. Check if account locked (lockedUntil > now) → 423 if locked
4. Verify password: simpleHash(password) === user.passwordHash
5. On failure:
   a. Increment loginAttempts
   b. If attempts >= 5, set lockedUntil = now + 15 minutes
   c. Return 401
6. On success:
   a. Reset loginAttempts and lockedUntil
   b. Update lastActiveAt
   c. Return safe user object (no passwordHash, mfaSecret, etc.)
7. Client stores user in Zustand → persisted to localStorage
```

**Password Hashing:** Uses a simple hash function (NOT bcrypt/argon2 — acceptable for current scope, should be upgraded for production):

```typescript
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + str.length
}
```

### 8.4 Session Management

- **No server-side sessions** — auth state is purely client-side
- `UserSession` model exists in the database (with `token`, `deviceName`, `ipAddress`, `expiresAt`) but is not actively used for request auth
- The client reads `isAuthenticated` and `currentUser` from Zustand/localStorage on mount
- Each API route independently validates user context from request parameters

### 8.5 Role-Based Access

| Role | Access Scope | Shell |
|---|---|---|
| `student` | Student views + public views | Student Shell |
| `instructor` | Instructor views + student views + public views | Instructor Shell |
| `admin` | All views | Admin Shell |
| `parent` | Limited (model exists, views not yet implemented) | N/A |

**View guards:** The shell router in `page.tsx` selects the appropriate shell based on `currentUser.role`. The `resolveViewKey()` function maps ambiguous views to role-specific components.

---

## 9. State Management

### 9.1 Zustand Store Schema

The global state store is defined in `src/lib/store.ts` using Zustand with the `persist` middleware.

```typescript
interface AppState {
  // ─── Navigation ───────────────────────────────────────────
  currentView: View                    // Active view key (100+ literals)
  setCurrentView: (view: View) => void

  // ─── Auth State ───────────────────────────────────────────
  isAuthenticated: boolean
  setIsAuthenticated: (val: boolean) => void
  pendingAuthEmail: string             // Email between register → OTP steps
  setPendingAuthEmail: (email: string) => void
  pendingAuthRole: 'student' | 'instructor' | ''
  setPendingAuthRole: (role: ...) => void

  // ─── User ─────────────────────────────────────────────────
  currentUser: User | null
  setCurrentUser: (user: User | null) => void

  // ─── Course Selection ─────────────────────────────────────
  selectedCourse: Course | null
  setSelectedCourse: (course: Course | null) => void
  selectedCourseId: string | null
  setSelectedCourseId: (id: string | null) => void

  // ─── Course Creator ───────────────────────────────────────
  editingCourseId: string | null
  setEditingCourseId: (id: string | null) => void
  creatorStep: number
  setCreatorStep: (step: number) => void

  // ─── Lesson/Quiz/Article Selection ────────────────────────
  selectedLesson: Lesson | null
  selectedQuiz: Quiz | null
  selectedArticleId: string | null
  selectedAssignmentId: string | null
  selectedStudentId: string | null     // Instructor context
  selectedAIToolId: string | null

  // ─── Admin Selection ──────────────────────────────────────
  selectedUserId: string | null
  selectedInstructorId: string | null

  // ─── UI State ─────────────────────────────────────────────
  sidebarOpen: boolean
  language: 'en' | 'ur'

  // ─── Data Caches ──────────────────────────────────────────
  enrollments: Enrollment[]
  leaderboard: LeaderboardEntry[]
  certificates: Certificate[]

  // ─── Loading ──────────────────────────────────────────────
  initializing: boolean

  // ─── Auth Helper ──────────────────────────────────────────
  logout: () => void                   // Resets all state to defaults
}
```

### 9.2 Persistence Strategy

```typescript
persist(
  (set) => ({ /* store definition */ }),
  {
    name: 'shijlai-academy-auth',        // localStorage key
    partialize: (state) => ({             // Only persist these fields:
      isAuthenticated: state.isAuthenticated,
      currentUser: state.currentUser,
      currentView: state.currentView,
      language: state.language,
    }),
    merge: (persistedState, currentState) => {
      // Merge persisted data, filtering out functions
      return {
        ...currentState,
        ...Object.fromEntries(
          Object.entries(persisted).filter(
            ([key]) => typeof currentState[key] !== 'function'
          )
        ),
      }
    },
  }
)
```

**Key design decisions:**
- **Partial persistence:** Only `isAuthenticated`, `currentUser`, `currentView`, and `language` are persisted. Selections (courses, quizzes, etc.) reset on page reload.
- **Function exclusion:** The merge strategy strips functions from persisted state to prevent serialization issues.
- **Logout behavior:** Resets all navigation, selection, and cache state to defaults while preserving the persisted fields' defaults.

### 9.3 View Resolution Flow

```
User clicks nav item
       │
       ▼
setCurrentView('dashboard')
       │
       ▼
Zustand store updates currentView
       │
       ▼
page.tsx re-renders
       │
       ▼
resolveViewKey(currentView, currentUser.role)
       │
       ├── 'dashboard' + 'student'    → 'dashboard'
       ├── 'dashboard' + 'instructor' → 'instructor-dashboard'
       └── 'dashboard' + 'admin'      → 'admin'
       │
       ▼
viewLoaders[resolvedKey] → dynamic import
       │
       ▼
React.lazy component renders in <Suspense>
       │
       ▼
AnimatePresence + motion.div transition
```

---

## 10. Gateway & Proxy Architecture

### 10.1 Caddy Configuration

```
:81 {
    @transform_port_query {
        query XTransformPort=*
    }

    handle @transform_port_query {
        reverse_proxy localhost:{query.XTransformPort} {
            header_up Host {host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
            header_up X-Real-IP {remote_host}
        }
    }

    handle {
        reverse_proxy localhost:3000 {
            header_up Host {host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
            header_up X-Real-IP {remote_host}
        }
    }
}
```

### 10.2 Routing Logic

```
┌───────────────────────────────────────────────────────────────────┐
│                    CADDY ROUTING (:81)                             │
│                                                                    │
│  Incoming Request                                                  │
│       │                                                            │
│       ▼                                                            │
│  Has ?XTransformPort=XXXX query parameter?                        │
│       │                                                            │
│    YES ──▶ reverse_proxy to localhost:XXXX                        │
│       │     (Mini-service routing for auxiliary services)         │
│       │                                                            │
│    NO ───▶ reverse_proxy to localhost:3000                        │
│             (Main Next.js application)                             │
│                                                                    │
│  Proxy Headers (both routes):                                      │
│    Host:            {host}                                         │
│    X-Forwarded-For: {remote_host}                                  │
│    X-Forwarded-Proto: {scheme}                                     │
│    X-Real-IP:       {remote_host}                                  │
└───────────────────────────────────────────────────────────────────┘
```

### 10.3 Mini-Service Support

The `XTransformPort` query parameter enables routing to auxiliary services running on dynamic ports. This supports:
- WebSocket servers (chat, live sessions)
- Background job processors
- Specialized AI inference services
- Preview/deployment services (`.space-z.ai` origins)

---

## 11. Component Architecture

### 11.1 shadcn/ui Components (45)

All components use the **New York** style variant from shadcn/ui, built on Radix UI primitives:

| Component | Radix Primitive | Usage |
|---|---|---|
| accordion | Radix Accordion | FAQ sections, course modules |
| alert | Custom | Alert messages, status indicators |
| alert-dialog | Radix AlertDialog | Confirmation dialogs |
| aspect-ratio | Radix AspectRatio | Media containers |
| avatar | Radix Avatar | User avatars, profile images |
| badge | Custom | Status labels, tags, categories |
| breadcrumb | Custom | Navigation breadcrumbs |
| button | Custom (CVA) | Primary actions, 6 variants |
| calendar | react-day-picker | Date selection, schedule |
| card | Custom | Content containers, stat cards |
| carousel | embla-carousel | Course carousels, image galleries |
| checkbox | Radix Checkbox | Multi-select, preferences |
| collapsible | Radix Collapsible | Expandable sections |
| command | cmdk | Command palette (⌘K) |
| context-menu | Radix ContextMenu | Right-click actions |
| dialog | Radix Dialog | Modals, forms |
| drawer | vaul | Mobile-friendly bottom drawers |
| dropdown-menu | Radix DropdownMenu | User menus, actions |
| form | react-hook-form | Form wrapper with validation |
| hover-card | Radix HoverCard | User previews, tooltips |
| input | Custom | Text input fields |
| input-otp | input-otp | OTP verification input |
| label | Radix Label | Form labels |
| menubar | Radix Menubar | Menu bars |
| navigation-menu | Radix NavigationMenu | Top-level navigation |
| pagination | Custom | List pagination |
| popover | Radix Popover | Date pickers, dropdowns |
| progress | Radix Progress | Completion bars, XP progress |
| radio-group | Radix RadioGroup | Single-select options |
| resizable | react-resizable-panels | Split-panel layouts |
| scroll-area | Radix ScrollArea | Custom scrollbars |
| select | Radix Select | Dropdown selection |
| separator | Radix Separator | Visual dividers |
| sheet | Radix Dialog | Side panels |
| sidebar | Custom (shadcn) | Navigation sidebars |
| skeleton | Custom | Loading placeholders |
| slider | Radix Slider | Range inputs |
| sonner | sonner | Toast notifications |
| switch | Radix Switch | Toggle preferences |
| table | Custom (TanStack) | Data tables |
| tabs | Radix Tabs | Tab panels |
| textarea | Custom | Multi-line input |
| toast | Radix Toast | Legacy toast (replaced by sonner) |
| toaster | Custom | Toast container |
| toggle | Radix Toggle | Format buttons |
| toggle-group | Radix ToggleGroup | Button groups |
| tooltip | Radix Tooltip | Hover information |
| chart | Recharts | Chart wrapper |

### 11.2 Custom Components by Domain

**Admin Components** (`src/components/admin/`):
| Component | Purpose |
|---|---|
| `admin-dashboard-v2` | Main admin dashboard |
| `admin-user-management` | User CRUD with bulk operations |
| `admin-course-management` | Course management + review |
| `admin-revenue-finance` | Revenue charts, payout management |
| `admin-instructor-management` | Instructor CRUD |
| `admin-ai-config` | AI provider/model/prompt config |
| `admin-gamification` | Badges, levels, XP rules |
| `admin-appearance` | Theme presets, customization |
| `admin-security` | API keys, IP blocking, roles |
| `admin-audit-log` | Activity log viewer |
| `admin-notifications-center` | Notification management |
| `admin-course-review` | Course review workflow |
| `admin-course-review-detail` | Single course review detail |
| `admin-application-management` | Instructor applications |
| `admin-content-review` | Content review workflow |
| `admin-platform-settings` | Platform-wide settings |
| `AdminBlogManagement` | Blog post CRUD |
| `admin-dev-tools` | Development/debugging tools |
| `admin-stat-card` | Reusable stat card |
| `admin-copilot` | Admin AI assistant |
| `system-status` | System health indicators |
| `system-alerts` | Alert feed |
| `welcome-header` | Admin welcome banner |
| `feature-flags` | Feature flag toggles |
| `currency-provider` | Currency context provider |
| `student-insights` | Student analytics cards |
| Charts: `user-distribution`, `platform-growth`, `revenue-breakdown`, `category-activity`, `popular-courses-table`, `recent-signups` |

**Instructor Components** (`src/components/instructor/`):
- `instructor-stat-card` — Reusable stat card for instructor dashboard

**Student Components** (`src/components/student/`):
- `student-stat-card` — Reusable stat card for student dashboard

**Messaging Components** (`src/components/messaging/`):
- `conversation-list-item`, `message-bubble`, `chat-header`, `date-separator`, `emoji-picker`
- Shared between `student-messages` and `instructor-messages` views

**AI Components** (`src/components/ai/`):
- `ai-message-renderer` — Renders AI responses with markdown + syntax highlighting

**Course Creator** (`src/components/creator/`):
- 6-step wizard: `step1-basics` → `step2-curriculum` → `step3-content` → `step4-pricing` → `step5-seo` → `step6-review`
- `ai-panel` — AI assistance sidebar for course creation
- `types` + `constants` — Creator-specific types and configuration

**Ask ShijlAI** (`src/components/ask-shijlai/`):
- `enhanced-welcome` — Welcome screen with suggestions
- `insights-cards` — AI-generated insight cards
- `recommendations-panel` — Recommended actions
- `learning-intelligence-panel` — Learning analytics panel

**Layout Components:**
- `admin-shell` — Admin sidebar + header + bottom tab bar
- `instructor-shell` — Instructor sidebar + header + bottom tab bar
- `student-shell` — Student sidebar + header + bottom tab bar
- `header` — Shared header
- `sidebar` — Shared sidebar
- `public-nav` — Public page navigation
- `public-bottom-bar` — Mobile bottom navigation for public pages
- `mobile-bottom-bar` — Shared mobile bottom bar
- `notification-bell` — Notification indicator + dropdown
- `notification-provider` — Notification context provider

**Feature Components:**
- `skill-graph` — Interactive skill visualization
- `course-carousel-row` — Course card carousel
- `universal-search` — Global search component
- `companion-chatbot` — AI learning companion chat
- `ai-mock-interview` — Mock interview interface
- `ai-learning-companion` — Learning companion sidebar
- `resizable-sidepanel` — Resizable panel wrapper
- `mobile-filter-sheet` — Mobile filter drawer
- `notifications-page` — Full notifications view

---

## 12. Real-Time & Communication

### 12.1 Notification System

```
┌────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION ARCHITECTURE                        │
│                                                                     │
│  ┌──────────────────┐    ┌────────────────────────────────────┐    │
│  │  API Routes       │    │  Notification Model                │    │
│  │                   │    │                                    │    │
│  │  /api/notifications   │  type: enrollment|qa|review|       │    │
│  │  /api/notifications/  │    assignment|message|payout|      │    │
│  │    preferences        │    system|promotion|achievement|   │    │
│  │  /api/notifications/  │    reminder|security|social|       │    │
│  │    templates          │    course_update|live_session       │    │
│  │  /api/notifications/  │                                    │    │
│  │    send               │  priority: normal|high|urgent      │    │
│  │  /api/notifications/  │  category: general|academic|       │    │
│  │    history            │    financial|social|system|         │    │
│  │  /api/notifications/  │    security                         │    │
│  │    seed               │                                    │    │
│  └──────────────────┘    │  actionUrl + actionLabel            │    │
│                          │  dismissUrl + dismissLabel          │    │
│  ┌──────────────────┐    │  isRead, isArchived, isPinned      │    │
│  │  Client-Side      │    │  expiresAt (time-sensitive)        │    │
│  │                   │    └────────────────────────────────────┘    │
│  │  NotificationProvider                                        │    │
│  │  NotificationBell    → Polls API for unread count             │    │
│  │  notifications-page  → Full notification list view            │    │
│  │  Sonner Toaster     → Toast for new notifications             │    │
│  └──────────────────┘                                           │    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  NotificationPreference Model (per-user)                     │  │
│  │  enableInApp | enableEmail | enablePush                      │  │
│  │  Type-specific toggles (14 types)                            │  │
│  │  digestMode: instant | daily | weekly                        │  │
│  │  quietHours: start/end                                       │  │
│  │  soundEnabled | desktopAlerts                                │  │
│  │  autoArchiveReadAfterDays: 30                                │  │
│  │  autoDeleteArchivedAfterDays: 90                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

### 12.2 Messaging System

The messaging system uses a conversation-based model shared between students and instructors:

```
Conversation Model:
  ├── type: 'direct' | 'group'
  ├── courseId: optional context
  ├── participants[] → ConversationParticipant[]
  │     ├── role: 'admin' | 'member'
  │     ├── lastReadAt
  │     ├── isMuted, isArchived, isStarred
  │     └── joinedAt
  └── messages[] → Message[]
        ├── content, type (text|image|file|system)
        ├── isRead, readBy (JSON array of userIds)
        ├── attachments (JSON: [{url, name, type, size}])
        └── editedAt, deletedAt
```

**API endpoints:**
- `GET /api/student/messages` — List conversations
- `GET /api/student/messages/contacts` — Available contacts
- `GET /api/student/messages/[conversationId]` — Messages in conversation
- Same pattern for `/api/instructor/messages/`

### 12.3 Email System

Custom email service in `src/lib/email.ts` with 9 HTML templates for instructor application workflows:

| Template | Purpose |
|---|---|
| Application Received | Acknowledges instructor application submission |
| Application Under Review | Notifies application moved to review stage |
| More Info Requested | Admin needs additional information |
| Interview Scheduled | Interview date/time confirmation |
| Interview Reminder | 24-hour interview reminder |
| Application Approved | Welcome aboard notification |
| Application Rejected | Rejection with feedback |
| Onboarding Welcome | New instructor onboarding guide |
| Info Provided Confirmation | Confirms applicant provided requested info |

**Current status:** Templates are built but emails are logged to console (not sent via SMTP). Ready for SMTP provider integration.

---

## 13. Deployment Architecture

### 13.1 Production Build

```bash
# Build command (package.json)
next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/

# Start command
NODE_ENV=production bun .next/standalone/server.js 2>&1 | tee server.log
```

**Next.js Config:**

```typescript
const nextConfig: NextConfig = {
  output: "standalone",                    // Self-contained deployment bundle
  typescript: { ignoreBuildErrors: true }, // Skip TS errors in build
  reactStrictMode: false,                  // Disabled for performance
  allowedDevOrigins: [
    ".space-z.ai",                         // Preview domain
    "preview-chat-*.space-z.ai",           // Chat preview domains
  ],
}
```

### 13.2 Runtime Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                          │
│                                                                    │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────┐  │
│  │  Caddy :81  │───▶│  Bun Process │    │  SQLite Database    │  │
│  │  (Gateway)  │    │  (Next.js    │    │  file:./db/         │  │
│  │             │    │   Standalone) │    │    custom.db        │  │
│  └─────────────┘    │  :3000       │    └─────────────────────┘  │
│                      └──────────────┘                             │
│                                                                    │
│  Process Management:                                               │
│  ├── spawn-server.js    → Detached Next.js dev server              │
│  ├── daemon.sh          → Background daemon process                │
│  ├── keep-alive.sh      → Health check + auto-restart              │
│  ├── persist.sh         → Persistence management                   │
│  ├── run-dev.sh         → Development startup                      │
│  ├── start-dev.sh       → Development startup (alt)               │
│  └── check-and-start.sh → Conditional startup with checks         │
└───────────────────────────────────────────────────────────────────┘
```

### 13.3 Shell Scripts

| Script | Purpose |
|---|---|
| `spawn-server.js` | Spawns Next.js dev server as detached child process with `--max-old-space-size=4096`, logs to `dev.log` |
| `daemon.sh` | Runs the server as a background daemon |
| `keep-alive.sh` | Periodically checks if server is responding, restarts if down |
| `persist.sh` | Ensures server persists across session disconnects |
| `run-dev.sh` | Standard development startup script |
| `start-dev.sh` | Alternative development startup |
| `check-and-start.sh` | Checks if server is already running before starting |

### 13.4 No Docker

The platform runs directly on Bun + Caddy without containerization. This simplifies deployment but reduces environment isolation.

---

## 14. Security Architecture

### 14.1 Authentication Security

| Feature | Implementation |
|---|---|
| **Password Hashing** | Custom `simpleHash()` function (hash + length encoding) |
| **Account Locking** | After 5 failed attempts, account locked for 15 minutes |
| **OTP Verification** | Email-based OTP with expiry (`otpCode`, `otpExpiresAt`) |
| **MFA Support** | Schema support (`mfaEnabled`, `mfaSecret`) — not fully activated |
| **Password Reset** | Token-based reset flow (`resetToken`, `resetTokenExpiresAt`) |
| **Social Auth** | Google, Facebook, Apple providers (schema support) |
| **Demo Login** | Quick-access demo accounts for testing |

### 14.2 Admin Security Module

| Feature | API Endpoint | Purpose |
|---|---|---|
| **API Key Management** | `/api/admin/security/api-keys` | Generate, revoke, list API keys |
| **Role Management** | `/api/admin/security/roles` | Custom role CRUD |
| **IP Blocking** | `/api/admin/security/blocked-ips` | Block malicious IP addresses |
| **Session Management** | `/api/admin/security/sessions` | View/terminate active sessions |
| **Login Alerts** | `/api/admin/security/login-alerts` | Suspicious login notifications |
| **Security Seed** | `/api/admin/security/seed` | Seed default security configuration |

### 14.3 User Model Security Fields

```typescript
// From Prisma schema
model User {
  passwordHash          String?
  isVerified            Boolean  @default(false)
  mfaEnabled            Boolean  @default(false)
  mfaSecret             String?
  otpCode               String?
  otpExpiresAt          DateTime?
  resetToken            String?
  resetTokenExpiresAt   DateTime?
  loginAttempts         Int      @default(0)
  lockedUntil           DateTime?
  authProvider          String   @default("email")
  status                String   @default("active")  // active, suspended, banned
  flaggedReason         String?
  lastLoginIp           String?
}
```

### 14.4 API Security

- **No middleware-level auth** — each route validates independently
- **Safe user serialization** — login route strips `passwordHash`, `mfaSecret`, `otpCode`, `resetToken`
- **CORS** — Handled by Caddy proxy headers
- **Rate limiting** — Account locking serves as basic brute-force protection
- **Audit logging** — `ActivityLog` model tracks all admin actions with IP, severity, category

---

## 15. Performance Architecture

### 15.1 Code Splitting & Lazy Loading

```
┌───────────────────────────────────────────────────────────────────┐
│                  CODE SPLITTING STRATEGY                          │
│                                                                    │
│  Initial Bundle (always loaded):                                   │
│  ├── React + React DOM                                            │
│  ├── Zustand store                                                 │
│  ├── Next.js runtime                                              │
│  ├── Framer Motion (AnimatePresence)                               │
│  └── Layout shell components (lazy but pre-created)               │
│                                                                    │
│  On-Demand Chunks (loaded when view is first visited):            │
│  ├── Each of the 84 view components                               │
│  ├── Admin sub-components (15+ heavy components)                  │
│  ├── Shell components (Header, Sidebar, BottomTabBar per role)    │
│  └── AI/Chart libraries (loaded only for AI/analytics views)      │
│                                                                    │
│  Result: Initial page load only includes ~5% of total JS.         │
│          Each view adds its own chunk on first navigation.         │
└───────────────────────────────────────────────────────────────────┘
```

### 15.2 Lazy Component Pre-Creation

```typescript
// Pre-create all lazy components at module scope (not during render)
const lazyComponents: Record<string, React.LazyExoticComponent<ComponentType>> = {}
function getOrCreateLazy(view: string): React.LazyExoticComponent<ComponentType> {
  if (!lazyComponents[view]) {
    const loader = viewLoaders[view] || viewLoaders['landing']!
    lazyComponents[view] = lazy(loader)
  }
  return lazyComponents[view]
}

// Eagerly create all at module load time
Object.keys(viewLoaders).forEach(key => getOrCreateLazy(key))
```

**Why this matters:** Without pre-creation, React would create a new lazy component instance on every render, causing the component to unmount/remount and the chunk to re-fetch. Pre-creation ensures each view's lazy reference is stable across renders.

### 15.3 Profile Recomputation Throttling

The `updateStudentProfile()` function includes a 5-minute throttle:

```typescript
if (profile.lastComputedAt) {
  const minutesSinceLastCompute = (Date.now() - new Date(profile.lastComputedAt).getTime()) / (1000 * 60)
  if (minutesSinceLastCompute < 5) return profile
}
```

This prevents excessive database queries when multiple events fire in quick succession.

### 15.4 Database Query Optimization

- **Parallel computation:** Profile service runs all 5 feature engine computations via `Promise.all()`
- **Selective includes:** API routes use `include` and `select` to fetch only needed fields
- **Pagination:** List endpoints use `take`/`skip` for cursor-based pagination
- **Indexing:** Key fields have `@@index` directives (e.g., `Notification` has indexes on `userId+isRead`, `userId+isArchived`, `userId+type`, `userId+createdAt`)

### 15.5 Caching

| Layer | Strategy | Implementation |
|---|---|---|
| **Client** | Zustand data caches | `enrollments`, `leaderboard`, `certificates` arrays in store |
| **Client** | TanStack Query | Server state caching with background refetch |
| **Client** | localStorage | Persisted auth state (survives page reload) |
| **Server** | Prisma query cache | Implicit via Prisma's internal connection pooling |
| **CDN** | Not yet implemented | Future: Static assets, public course thumbnails |

---

## 16. Scalability Considerations

### 16.1 MySQL Migration Path

The MySQL schema is maintained in parallel at `prisma/schema_mysql.prisma`. Migration steps:

1. Set `DATABASE_URL_MYSQL` environment variable
2. Run `npx prisma generate --schema=prisma/schema_mysql.prisma`
3. Switch import from `@/lib/db` to `@/lib/db_mysql`
4. Update `src/lib/db.ts` to export `dbMySQL` as `db`
5. MySQL provides: connection pooling, concurrent writes, replication support, full-text search

### 16.2 Caching Layer (Recommended)

```
┌─────────────────────────────────────────────────────────────────┐
│                 PROPOSED CACHING ARCHITECTURE                    │
│                                                                  │
│  ┌───────────┐   ┌──────────┐   ┌──────────┐   ┌───────────┐  │
│  │  CDN      │   │  Redis   │   │  React   │   │  SQLite/  │  │
│  │  (Cloud-  │   │  Cache   │   │  Query   │   │  MySQL    │  │
│  │   flare)  │   │          │   │  Cache   │   │           │  │
│  │           │   │          │   │          │   │           │  │
│  │ Static    │   │ Session  │   │ API      │   │ Persist-  │  │
│  │ Assets    │   │ Data     │   │ Response │   │ ent Data  │  │
│  │ Images    │   │ Leader-  │   │ Course   │   │           │  │
│  │ Fonts     │   │ boards   │   │ Catalog  │   │           │  │
│  │ JS/CSS    │   │ Notifs   │   │ User     │   │           │  │
│  └───────────┘   └──────────┘   └──────────┘   └───────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 16.3 Horizontal Scaling Considerations

| Current Bottleneck | Solution | Priority |
|---|---|---|
| SQLite single-writer | Migrate to MySQL with read replicas | High |
| No server-side sessions | Add Redis session store | Medium |
| No CDN | Serve static assets via CloudFlare/CDN | High |
| Single Bun process | PM2 cluster mode or Kubernetes | Medium |
| No WebSocket | Socket.io for real-time messaging | Medium |
| File-based email logging | SMTP provider (SendGrid, Resend) | High |

### 16.4 Recommended Architecture Evolution

```
Phase 1 (Current):  Caddy → Bun/Next.js → SQLite
Phase 2 (Near-term): Caddy → Bun/Next.js → MySQL + Redis + CDN
Phase 3 (Scale):     Load Balancer → [Next.js × N] → MySQL Cluster + Redis Cluster + CDN + S3
```

---

## 17. Development Workflow

### 17.1 Development Commands

```bash
# Start development server (port 3000)
bun run dev

# Build for production
bun run build

# Start production server (standalone)
bun run start

# Lint code
bun run lint

# Database management
bun run db:push       # Push schema changes without migration
bun run db:generate   # Regenerate Prisma Client
bun run db:migrate    # Run migrations (dev)
bun run db:reset      # Reset database (destructive)
```

### 17.2 Development Server

On mount, `page.tsx` automatically calls `GET /api/seed` to ensure the database has initial data:

```typescript
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
```

### 17.3 Database Management

| Command | Purpose | Safety |
|---|---|---|
| `db:push` | Push schema to DB without migration files | Safe for dev, no rollback |
| `db:generate` | Regenerate Prisma Client after schema changes | Non-destructive |
| `db:migrate` | Create and apply migrations | Creates migration files |
| `db:reset` | Drop and recreate database | **Destructive** |

### 17.4 Environment Configuration

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | SQLite connection string | `file:./db/custom.db` |
| `DATABASE_URL_MYSQL` | MySQL connection string (when using MySQL) | — |
| `NODE_ENV` | Environment mode | `development` |

---

## 18. Key Architectural Decisions

### 18.1 SPA-within-SSR vs. Traditional Next.js Routing

**Decision:** Single `page.tsx` with client-side navigation via Zustand store.

**Rationale:**
- ✅ Zero page reloads during navigation (SPA feel)
- ✅ Shared state persists across all "pages" without URL params
- ✅ Framer Motion page transitions work naturally
- ✅ Simpler mental model — one component tree, one state store
- ❌ No server-side rendering of individual pages (SEO impact)
- ❌ No direct URL access to specific views (e.g., `/admin/users`)
- ❌ Browser back/forward doesn't map to views
- ❌ View state lost on hard refresh (except persisted fields)

**When to reconsider:** If SEO for public pages becomes critical, implement Next.js routing for public views while keeping the SPA pattern for authenticated views.

### 18.2 SQLite vs. MySQL

**Decision:** SQLite as default with MySQL schema maintained in parallel.

**Rationale:**
- ✅ Zero configuration — just a file
- ✅ Perfect for single-server deployment
- ✅ Fast reads for the current scale
- ✅ Easy development and testing
- ❌ Single-writer limitation (concurrent writes queue)
- ❌ No built-in replication
- ❌ Limited full-text search capabilities
- ❌ No connection pooling (single connection)

**Migration trigger:** When concurrent users exceed ~100 active writers or when read replicas are needed.

### 18.3 Custom Auth vs. NextAuth

**Decision:** Custom auth routes despite `next-auth@4.24.11` being installed.

**Rationale:**
- ✅ Full control over login flow, session management, and user model
- ✅ No provider configuration complexity
- ✅ Simpler integration with existing User model and Zustand store
- ✅ Custom OTP/MFA flow without fighting NextAuth abstractions
- ❌ No industry-standard session management
- ❌ No built-in CSRF protection
- ❌ No secure cookie-based sessions
- ❌ Client-side auth state can be manipulated

**When to reconsider:** If security requirements demand server-side sessions, CSRF tokens, or OAuth provider integration, migrate to NextAuth or a similar library.

### 18.4 No Middleware

**Decision:** No `src/middleware.ts` — auth handled per-route and client-side.

**Rationale:**
- ✅ Simpler architecture — no middleware edge runtime constraints
- ✅ Each route has full control over auth logic
- ✅ No cold-start penalty from middleware on every request
- ❌ Auth logic duplicated across routes
- ❌ No automatic redirect for unauthenticated users
- ❌ No server-side route protection

### 18.5 Zustand vs. URL State

**Decision:** Navigation and selection state in Zustand instead of URL params.

**Rationale:**
- ✅ State survives across complex navigation flows
- ✅ No URL serialization/deserialization of complex objects
- ✅ Instant navigation (no route resolution)
- ✅ Centralized state management
- ❌ No shareable URLs (can't share a link to a specific view)
- ❌ No browser history integration
- ❌ State reset on hard refresh (partial — only 4 fields persisted)

### 18.6 Standalone Output

**Decision:** `output: "standalone"` in Next.js config.

**Rationale:**
- ✅ Self-contained deployment bundle (no `node_modules` needed)
- ✅ Smaller Docker-compatible output
- ✅ Faster cold starts
- ❌ Requires manual copy of `.next/static` and `public` directories

### 18.7 TypeScript `ignoreBuildErrors`

**Decision:** `typescript: { ignoreBuildErrors: true }` in Next.js config.

**Rationale:**
- ✅ Faster builds during rapid development
- ✅ No blocking on type errors in a large codebase
- ❌ Type errors can slip into production
- ❌ Reduced type safety guarantees

**When to reconsider:** Once the codebase stabilizes, enable strict build checks and fix type errors incrementally.

---

## Appendix A: View Type Union

The complete `View` type definition from `src/lib/types.ts`:

```typescript
export type View =
  // Auth views (4)
  | 'login' | 'register' | 'forgot-password' | 'verify-otp'
  // Public views (8)
  | 'landing' | 'public-courses' | 'public-course-detail' | 'pricing'
  | 'instructors' | 'about' | 'blog' | 'blog-detail'
  // Shared
  | 'application-status'
  // Student views (22)
  | 'dashboard' | 'courses' | 'course-detail' | 'tutor'
  | 'achievements' | 'my-skills' | 'quiz' | 'certificates'
  | 'student-assignments' | 'student-assignment-detail'
  | 'student-messages' | 'student-schedule' | 'student-qa'
  | 'recommendations' | 'shijlai-hub' | 'learning-companion'
  | 'student-profile' | 'explore' | 'community'
  | 'course-player' | 'notifications'
  | 'student-settings' | 'settings'
  // Instructor views (17)
  | 'instructor-dashboard' | 'instructor-courses'
  | 'instructor-course-detail' | 'instructor-students'
  | 'instructor-student-detail' | 'instructor-quizzes'
  | 'instructor-assignments' | 'instructor-assignment-detail'
  | 'instructor-analytics' | 'instructor-qa'
  | 'instructor-schedule' | 'instructor-revenue'
  | 'instructor-marketing' | 'instructor-copilot'
  | 'instructor-assessment' | 'instructor-settings'
  | 'instructor-messages' | 'instructor-profile'
  | 'course-creator'
  // AI views
  | 'analytics' | 'learning-paths' | 'smart-content'
  | 'instructor-ai-tools' | 'instructor-ai-tool-detail'
  // Admin views (27)
  | 'admin' | 'admin-users' | 'admin-courses' | 'admin-qa-reports'
  | 'admin-revenue' | 'admin-payouts' | 'admin-refunds'
  | 'admin-marketing' | 'admin-notifications' | 'admin-live-sessions'
  | 'admin-gamification' | 'admin-ai-config' | 'admin-appearance'
  | 'admin-security' | 'admin-settings' | 'admin-audit-log'
  | 'admin-dev-tools' | 'admin-user-detail' | 'admin-instructors'
  | 'admin-instructor-detail' | 'admin-course-review'
  | 'admin-course-review-detail' | 'admin-applications'
  | 'admin-analytics' | 'admin-copilot' | 'admin-system-intelligence'
  | 'admin-shijlai-hub' | 'admin-blog'
```

---

## Appendix B: API Route Count Summary

| Domain | Route Count | Key Operations |
|---|---|---|
| Auth | 7 | Login, register, OTP, password reset, social, demo |
| AI (General) | 20 | Chat, tutor, study planner, companion, mock interview, learning paths |
| AI (ShijlAI) | 13 | Chat, insights, profile, recommendations, search, study plan, quiz gen, events, sessions, mastery |
| Instructor | 50+ | Courses, modules, assignments, students, revenue, analytics, QA, schedule, settings, certificates |
| Instructor AI | 18 | Curriculum gen, quiz gen, rubric gen, auto-respond, suggest-reply, lesson content, thumbnail, etc. |
| Student | 30+ | Assignments, bookmarks, challenges, community, course-player, goals, learning, messages, notes, progress |
| Admin | 60+ | Users, courses, finance, security, gamification, AI config, notifications, settings, appearance, dev tools |
| Shared | 10+ | Courses catalog, certificates, analytics, notifications, blog, gamification, skills, search, seed |
| **Total** | **200+** | |

---

## Appendix C: Root Layout Configuration

```typescript
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased bg-background text-foreground overflow-x-hidden">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors position="top-center" toastOptions={{ style: { borderRadius: '14px' } }} />
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Fonts:** Geist Sans (`--font-geist-sans`) + Geist Mono (`--font-geist-mono`) via `next/font/google`

**Theme:** `next-themes` with `attribute="class"` (Tailwind dark mode class strategy), `defaultTheme="system"`, `enableSystem=true`, `disableTransitionOnChange=true`

**Toaster:** Sonner with `richColors`, `position="top-center"`, rounded corners (`14px`)

---

*End of System Architecture Document*
