# ShijlAI Academy — Instructor Portal: Complete Implementation Documentation

> **AI-Powered Course Creation & Teaching Intelligence Platform**
> Authors: Sadeed Ali [1447], Syed Awais Shah [1457]
> University of Malakand — Department of Computer Science & IT

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Instructor Portal Shell](#2-instructor-portal-shell)
3. [Dashboard](#3-dashboard)
4. [AI Copilot — 11 AI-Powered Teaching Tools](#4-ai-copilot--11-ai-powered-teaching-tools)
5. [Intelligent Analytics](#5-intelligent-analytics)
6. [Smart Assessment System](#6-smart-assessment-system)
7. [Course Management](#7-course-management)
8. [Student Management](#8-student-management)
9. [Q&A Management with AI Draft Answers](#9-qa-management-with-ai-draft-answers)
10. [Messaging System with AI Reply Suggestions](#10-messaging-system-with-ai-reply-suggestions)
11. [Revenue & Finance](#11-revenue--finance)
12. [Instructor Profile & AI Bio Improvement](#12-instructor-profile--ai-bio-improvement)
13. [Settings & Integrations](#13-settings--integrations)
14. [State Management](#14-state-management)
15. [AI Engine — Deep Implementation](#15-ai-engine--deep-implementation)
16. [API Reference — Complete Route Catalog](#16-api-reference--complete-route-catalog)
17. [Database Schema — Instructor Models](#17-database-schema--instructor-models)
18. [Component Library](#18-component-library)

---

## 1. Architecture Overview

### 1.1 SPA Architecture within Instructor Portal

The Instructor Portal follows the same SPA (Single Page Application) pattern as the rest of ShijlAI Academy. All instructor views are lazy-loaded client components dispatched from the shared `page.tsx` entry point via the Zustand `currentView` state.

```
User Navigation → Zustand Store (currentView) → View Resolver → Lazy-Loaded Component
```

When `userRole === 'instructor'`, the view resolver maps generic keys:
- `dashboard` → `instructor-dashboard`
- Navigation items map to 16+ instructor-specific view keys

### 1.2 Three-Tier Data Flow

```
┌─────────────────────────────────────────────────┐
│                 PRESENTATION LAYER               │
│  React 19 + Next.js 16 + Tailwind CSS 4         │
│  20 instructor views • shadcn/ui components      │
│  Framer Motion animations • Zustand state         │
│  Recharts visualizations • Rich output renderers  │
└──────────────────────┬──────────────────────────┘
                       │ REST API (fetch)
┌──────────────────────▼──────────────────────────┐
│                APPLICATION LAYER                  │
│  74 API endpoints under /api/instructor/          │
│  21 AI tool endpoints (z-ai-web-dev-sdk)          │
│  9 Copilot actions with DB persistence            │
│  Smart Assessment engine (5 analytics services)   │
│  Intelligent Analytics with LLM-generated insights│
└──────────────────────┬──────────────────────────┘
                       │ Prisma ORM
┌──────────────────────▼──────────────────────────┐
│                   DATA LAYER                      │
│  SQLite (dev) / MySQL (prod)                      │
│  23+ Instructor-specific Database Models          │
│  AI generation persistence (outline/lesson/quiz/  │
│  assignment/rubric) with status tracking           │
└─────────────────────────────────────────────────┘
```

### 1.3 AI Intelligence Pipeline — Instructor

The instructor AI pipeline enables content generation, analytics intelligence, and assessment quality analysis:

```
Instructor Request (form submit / chat message / analytics view)
    │
    ▼
┌──────────────────────────────────────────┐
│  AI Copilot Service                      │
│  9 actions via /api/instructor/copilot   │
│  Each action:                             │
│  1. Validate input                       │
│  2. Build system + user prompt           │
│  3. Call LLM via z-ai-web-dev-sdk       │
│  4. Parse JSON response                  │
│  5. Persist to DB (AIGenerated*)         │
│  6. Log activity (InstructorAIActivity)  │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  AI Tools (21 endpoints)                 │
│  Standalone tools with rich output:      │
│  • Curriculum Generator                  │
│  • Learning Outcome Generator            │
│  • Lesson Content Generator              │
│  • Quiz Generator                        │
│  • Assignment + Rubric Builder           │
│  • Rubric Generator                      │
│  • Course Description Writer             │
│  • Auto Caption & Translate              │
│  • Q&A Auto-Responder                   │
│  • Student Feedback Analyzer             │
│  • Course Improvement Insights           │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Intelligent Analytics                   │
│  • Difficult lesson detection            │
│  • Student struggle area identification  │
│  • Module drop analysis                  │
│  • LLM-generated insights & suggestions  │
│  • Engagement heatmap (7×24)             │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Smart Assessment Engine                 │
│  • Question difficulty analytics         │
│  • Distractor analysis (MCQ)             │
│  • Learning outcome mastery tracking     │
│  • Assessment quality scoring            │
│  • LLM-generated assessment insights     │
└──────────────────────────────────────────┘
```

---

## 2. Instructor Portal Shell

### 2.1 Component: `instructor-shell.tsx`

The instructor shell wraps all instructor-facing views with a consistent layout containing the `InstructorSidebar` and `InstructorHeader`.

**Desktop Layout (>768px):**
```
┌───────────────────────────────────────────────────────┐
│ InstructorHeader (sticky, glassmorphism)               │
│ [☰] [ShijlAI Academy] [🔍 Search...] [🔔5] [💬3] [▼]│
├──────────┬────────────────────────────────────────────┤
│ Sidebar  │                                            │
│ (260px)  │           Main Content Area                │
│          │     (lazy-loaded view component)            │
│Instructor│                                            │
│ Portal   │                                            │
│ ──────── │                                            │
│ Dashboard│                                            │
│ Courses  │                                            │
│ Students │                                            │
│ Analytics│                                            │
│ AI Copilot│                                           │
│ ...15    │                                            │
│ items    │                                            │
│          │                                            │
│ [🌙][❓] │                                            │
│ [Logout] │                                            │
├──────────┴────────────────────────────────────────────┤
└───────────────────────────────────────────────────────┘
```

**Mobile Layout (<768px):**
```
┌───────────────────────┐
│ [☰] ShijlAI [🔍][🔔] │  ← Sticky header
├───────────────────────┤
│                       │
│   Main Content Area   │  ← Full width
│                       │
├───────────────────────┤
│ 🏠  📚  🤖  ⋯       │  ← Fixed bottom bar
│Home Courses Copilot More│
└───────────────────────┘
```

### 2.2 Sidebar Navigation (15 Items)

| # | Label | Icon | View Key | Description |
|---|-------|------|----------|-------------|
| 1 | Dashboard | `LayoutDashboard` | `instructor-dashboard` | Main dashboard with stats & charts |
| 2 | Courses | `BookOpen` | `instructor-courses` | Course management grid/list/kanban |
| 3 | Students | `Users` | `instructor-students` | Student management table/grid/cards |
| 4 | Intelligent Analytics | `Brain` | `instructor-analytics` | AI-powered analytics dashboard |
| 5 | Q&A | `MessageSquare` | `instructor-qa` | Unanswered questions management |
| 6 | Messages | `Inbox` | `instructor-messages` | Direct messaging system |
| 7 | Assignments | `ClipboardList` | `instructor-assignments` | Assignment management |
| 8 | Schedule | `Calendar` | `instructor-schedule` | Live sessions calendar |
| 9 | Revenue | `DollarSign` | `instructor-revenue` | Earnings & financial reports |
| 10 | Marketing | `Megaphone` | `instructor-marketing` | Promotional tools |
| 11 | AI Copilot | `Sparkles` | `instructor-copilot` | 11 AI teaching tools |
| 12 | Smart Assessment | `BarChart3` | `instructor-assessment` | Question & outcome analytics |
| 13 | Profile | `User` | `instructor-profile` | Professional profile page |
| 14 | Notifications | `Bell` | `notifications` | Notification center |
| 15 | Settings | `Settings` | `instructor-settings` | Preferences & integrations |

**Sidebar Features:**
- **Collapsible**: 260px (expanded) ↔ 68px (collapsed) with Framer Motion animation
- **Active indicator**: Spring-animated left bar using `layoutId="sidebarActiveIndicator"`
- **Badge counters**: Auto-fetched from API every 60s via `useInstructorBadges()` hook
  - Courses count, Students count, Assignments pending, Quizzes count, Unanswered Q&A
- **"Create New Course" CTA**: Prominent emerald gradient button at sidebar bottom
- **Theme toggle**: Dark/light mode switch
- **Role switching**: Dropdown to switch between student/instructor/admin views

### 2.3 Instructor Header Components

| Component | Description |
|-----------|-------------|
| Hamburger Menu | Opens sidebar Sheet drawer on mobile |
| Brand Logo | "ShijlAI Academy" text |
| Desktop Search | `InlineSearch` with scope: `instructor` |
| Mobile Search | Expandable search icon |
| Notification Bell | Real notifications from `/api/instructor/notifications` with mark-as-read |
| Messages Icon | Real message count from `/api/instructor/messages`, auto-refresh every 30s |
| Role Switcher | Dropdown to switch portal (student/instructor/admin) |
| User Avatar | Profile link, Logout action |

### 2.4 Mobile Bottom Bar

3 primary tabs + "More" popup:

| Tab | Icon | View |
|-----|------|------|
| Home | `Home` | `instructor-dashboard` |
| Courses | `BookOpen` | `instructor-courses` |
| Copilot | `Sparkles` | `instructor-copilot` |
| More | `MoreHorizontal` | Sheet with remaining 12 items |

---

## 3. Dashboard

### 3.1 View: `instructor-dashboard.tsx` (~1800 lines)

**API Endpoint:** `GET /api/instructor/dashboard?instructorId={id}&period={7d|30d|90d|all}`

**Dashboard Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  Welcome, {Name}! 👋                                     │
│  Here's what's happening with your courses                │
├──────────┬──────────┬──────────┬──────────┬──────────┬───┤
│ 👥 142   │ 💰 $3.2K │ ⭐ 4.7   │ 📊 68%   │ 📚 5    │ 🎯│
│ Students │ Revenue  │ Rating   │ Completion│ Courses  │Eng.│
│  +12%    │  +8.3%   │  +0.2    │  +5%     │  new: 1  │82%│
├──────────┴──────────┴──────────┴──────────┴──────────┴───┤
│  Enrollment Trend                    Revenue by Day        │
│  ┌─────────────────────────┐  ┌─────────────────────────┐│
│  │  ▁▂▃▅▆▇█ AreaChart     │  │  ▁▂▃▄▅▆ Stacked Area   ││
│  │  (7d/30d/90d)           │  │  (per-day revenue)       ││
│  └─────────────────────────┘  └─────────────────────────┘│
├───────────────────────────────────────────────────────────┤
│  Course Performance (sortable table)                      │
│  Title | Students | Rating | Completion | Revenue | Status│
├───────────────────────────────────────────────────────────┤
│  Student Performance Distribution                         │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Excellent: 35 | Good: 45 | Average: 42 | Needs:20│    │
│  └──────────────────────────────────────────────────┘    │
├───────────────────────────────────────────────────────────┤
│  Content Pipeline          │  Top Students               │
│  ┌────────────────────┐    │  🥇 Sarah — 95% avg       │
│  │ Draft: 1           │    │  🥈 James — 92% avg       │
│  │ Review: 2          │    │  🥉 Emma — 89% avg        │
│  │ Published: 5       │    │  4. Ali — 87% avg         │
│  └────────────────────┘    │  5. Maria — 85% avg       │
├───────────────────────────────────────────────────────────┤
│  Action Required Panel                                    │
│  ⚠️ 3 ungraded submissions  ⚠️ 5 unanswered questions   │
├───────────────────────────────────────────────────────────┤
│  Engagement Heatmap (7×24 grid)                          │
│  Mon-Sun × 00-23 hours with intensity colors             │
├───────────────────────────────────────────────────────────┤
│  Financial Summary         │  Comparison Banner           │
│  Revenue: $3,200           │  vs Platform Average:        │
│  Payout: $2,560            │  Rating: 4.7 vs 4.2 ✅     │
│  Commission: 20%           │  Completion: 68% vs 55% ✅  │
│  Pending: $640             │  Quiz Pass: 78% vs 65% ✅   │
└───────────────────────────────────────────────────────────┘
```

### 3.2 Key Types

```typescript
interface InstructorDashboardData {
  role: string
  period: string
  welcomeData: {
    greeting: string
    instructorName: string
    period: string
    tip: string
  }
  stats: {
    totalStudents: number
    totalRevenue: number
    averageRating: number
    completionRate: number
    totalCourses: number
    engagementScore: number
  }
  enrollmentTrend: TimeSeriesPoint[]
  revenueByDay: TimeSeriesPoint[]
  coursePerformance: CoursePerformanceItem[]
  studentPerformanceDistribution: StudentDistribution
  topStudents: TopStudent[]
  contentPipeline: { draft: number; review: number; published: number; archived: number }
  recentStudentActivity: any[]
  reviewQueue: any[]
  announcements: any[]
  actionRequired: Array<{ type: string; count: number; label: string }>
  tip: string
  comparisonData: ComparisonData
  engagementMetrics: EngagementMetrics
  financialSummary: FinancialSummary
  submissionStats: SubmissionStats
  heatmapData: EngagementHeatmapData
}
```

### 3.3 Dashboard Data Fetching

The dashboard API (`/api/instructor/dashboard`) computes **17 data sections** in a single request:

1. **Welcome data** — Greeting with time-of-day awareness
2. **Overview stats** — Students, revenue, rating, completion, courses, engagement
3. **Enrollment trend** — Daily enrollment counts (AreaChart)
4. **Revenue by day** — Cumulative revenue with per-course stacking
5. **Course performance** — Per-course stats (students, rating, completion, revenue)
6. **Student distribution** — Excellent/Good/Average/Needs Improvement
7. **Quiz analytics** — Pass rate, avg score, by type breakdown
8. **Assignment analytics** — Submission rate, by type breakdown
9. **Top students** — Ranked by XP with medals
10. **Engagement metrics** — DAU, WAU, time spent, lessons/day
11. **Content pipeline** — Draft/Review/Published/Archived counts
12. **Comparison data** — Instructor vs platform averages
13. **Retention metrics** — Active, returning, churned students
14. **Lesson drop-off** — Per-module completion/dropoff rates
15. **Review analytics** — Distribution, sentiment, recent reviews
16. **Financial summary** — Revenue, payouts, commission, pending
17. **Engagement heatmap** — 7×24 grid (day × hour)

---

## 4. AI Copilot — 11 AI-Powered Teaching Tools

### 4.1 Overview

The AI Copilot is the **flagship AI feature** of the Instructor Portal — a suite of 11 specialized AI tools, each with dedicated form inputs, API endpoints, and rich formatted output renderers.

**Component:** `instructor-copilot-view.tsx`
**API Endpoints:** 11 routes under `/api/instructor/ai/`

### 4.2 Tool Catalog

| # | Tool ID | Title | Subtitle | Icon | Gradient | Badge |
|---|---------|-------|----------|------|----------|-------|
| 1 | `curriculum` | Course Outline Generator | Full module + lesson outline | `BookOpen` | emerald→teal | Popular |
| 2 | `outcomes` | Learning Outcome Generator | Measurable, aligned outcomes | `Target` | cyan→sky | — |
| 3 | `lesson-content` | Lesson Content Generator | Rich lesson with exercises | `FileText` | sky→blue | — |
| 4 | `quiz` | Quiz Generator | MCQ, True/False, Fill-in | `HelpCircle` | violet→purple | — |
| 5 | `assignment` | Assignment + Rubric Builder | Brief + grading rubric | `ClipboardList` | amber→orange | — |
| 6 | `rubric` | Rubric Generator | Standalone grading rubric | `Award` | orange→red | — |
| 7 | `description` | Course Description Writer | SEO-optimized copy | `PenLine` | rose→pink | AI |
| 8 | `caption` | Auto Caption & Translate | Timestamped captions | `Languages` | lime→green | — |
| 9 | `qa-responder` | Q&A Auto-Responder | Draft answers instantly | `MessageSquare` | teal→emerald | — |
| 10 | `feedback-analyzer` | Student Feedback Analyzer | Insights & action tips | `BarChart3` | slate→gray | — |
| 11 | `insights` | Course Improvement Insights | Actionable recommendations | `TrendingUp` | fuchsia→pink | New |

### 4.3 Tool Configuration Architecture

Each tool is fully configured via three objects:

#### 4.3.1 `ToolConfig` — UI Configuration

```typescript
interface ToolConfig {
  id: ToolId
  title: string              // Display name
  subtitle: string           // One-line description
  description: string        // Full description
  icon: React.ReactNode      // Lucide icon
  gradient: string           // Tailwind gradient classes
  iconBg: string             // Background color classes
  badge?: string             // Optional badge text (Popular, AI, New)
  tips: string[]             // 3 contextual tips shown when tool is active
}
```

#### 4.3.2 `TOOL_FORM_FIELDS` — Form Schema

```typescript
interface FormField {
  name: string               // Field key matching API parameter
  label: string              // Display label
  type: 'input' | 'textarea' | 'select'
  placeholder?: string
  options?: { value: string; label: string }[]  // For select fields
  required?: boolean
  rows?: number              // For textarea
}
```

**Example — Curriculum Generator form fields:**
| Field | Type | Options | Required |
|-------|------|---------|----------|
| `topic` | input | — | ✅ |
| `audience` | input | — | ❌ |
| `level` | select | beginner, intermediate, advanced | ❌ |
| `sections` | select | 3, 4, 5, 6, 8 Modules | ❌ |

**Example — Quiz Generator form fields:**
| Field | Type | Options | Required |
|-------|------|---------|----------|
| `topic` | input | — | ✅ (or sourceText) |
| `sourceText` | textarea | — | ❌ |
| `count` | select | 3, 5, 10, 15 Questions | ❌ |
| `difficulty` | select | easy, medium, hard | ❌ |

#### 4.3.3 `TOOL_API` — API Mapping

```typescript
interface ToolApiConfig {
  endpoint: string           // API route path
  bodyBuilder: (values: Record<string, string>, userId?: string) => Record<string, unknown>
  validate: (values: Record<string, string>) => string | null
}
```

### 4.4 Tool-by-Tool Deep Dive

---

#### 4.4.1 Course Outline Generator (`curriculum`)

**Purpose:** Generate a complete course curriculum with modules, lessons, and objectives.

**API Endpoint:** `POST /api/instructor/ai/generate-curriculum`

**Request Body:**
```typescript
{
  topic: string            // Required: Course topic
  audience?: string        // Target audience (default: "General students")
  level?: string           // beginner | intermediate | advanced
  sections?: number        // Number of modules (1-20, default: 5)
  title?: string           // Optional course title
  category?: string        // Optional category
  prompt?: string          // Alternative to topic (from course creator wizard)
}
```

**System Prompt (specialized):**
```
You are an expert curriculum designer specializing in international education
standards, including IB (International Baccalaureate), AP (Advanced Placement),
Cambridge (IGCSE, O-Level, A-Level), and Common Core...
```

The system prompt explicitly instructs the LLM to:
- Follow international education standards (IB, AP, Cambridge, Common Core)
- Return structured JSON with `modules[]` containing `title`, `description`, `objectives[]`, and `lessons[]`
- Each lesson has `title`, `description`, `type` (video/text/quiz/assignment/interactive/download), and `duration` (minutes)

**Response Structure:**
```typescript
{
  modules: Array<{
    title: string
    description: string
    objectives: string[]
    lessons: Array<{
      title: string
      description: string
      type: 'video' | 'text' | 'quiz' | 'assignment' | 'interactive' | 'download'
      duration: number    // minutes
    }>
  }>
  content?: string       // Raw LLM response as fallback
}
```

**Frontend Output Renderer (`CurriculumOutput`):**
- Module cards with left border accent (emerald-500)
- Module number badges
- Objective chips (outline badges)
- Lesson list with type-specific color badges:
  - `video` → rose
  - `text` → sky
  - `quiz` → violet
  - `assignment` → amber
  - `interactive` → teal
  - `download` → slate
- Duration indicators per lesson

---

#### 4.4.2 Learning Outcome Generator (`outcomes`)

**Purpose:** Generate measurable learning outcomes aligned with Bloom's Taxonomy.

**API Endpoint:** `POST /api/instructor/ai/generate-outcomes`

**Request Body:**
```typescript
{
  topic: string              // Required
  framework?: string         // "Bloom's Taxonomy" | "Competency-Based" | "Backward Design"
  level?: string             // introductory | intermediate | advanced
  count?: number             // 5, 8, 10, 12 outcomes
}
```

**System Prompt:**
Instructs the LLM to generate outcomes starting with action verbs (never "understand" or "know"), following Bloom's Taxonomy for progressive cognitive levels.

**Tips shown to instructor:**
1. "Outcomes start with action verbs, never 'understand' or 'know'"
2. "Choose Bloom's Taxonomy for progressive cognitive levels"
3. "Include assessment methods for each outcome"

---

#### 4.4.3 Lesson Content Generator (`lesson-content`)

**Purpose:** Generate comprehensive lesson content with key concepts, examples, and exercises.

**API Endpoint:** `POST /api/instructor/ai/generate-lesson-content`

**Request Body:**
```typescript
{
  topic: string              // Required
  outline?: string           // Optional lesson outline to maintain structure
  style?: string             // 'Lecture Notes' | 'Interactive Tutorial' | 'Case Study' | 'Lab Guide'
  audience?: string          // 'High School' | 'Undergraduate' | 'Graduate' | 'Professional'
}
```

**Tips shown to instructor:**
1. "Paste an outline to keep the content structured"
2. "Choose a style that matches your teaching approach"
3. "Each concept includes an analogy for better understanding"

---

#### 4.4.4 Quiz Generator (`quiz`)

**Purpose:** Generate diverse quiz questions with answers and explanations.

**API Endpoint:** `POST /api/instructor/ai/generate-quiz`

**Request Body:**
```typescript
{
  topic: string              // Required (or sourceText must be provided)
  count?: number             // 3, 5, 10, 15 questions
  difficulty?: string        // easy | medium | hard
  sourceText?: string        // Optional: paste lesson content for tailored questions
}
```

**System Prompt:**
```
You are an expert assessment designer. Generate quiz questions in JSON format.
Structure: { "questions": [{ "type": "mcq|true_false|short_answer|fill_blank",
  "text": "question text", "options": ["A","B","C","D"],
  "correctAnswer": "answer", "explanation": "why correct", "points": 1 }] }
```

**Frontend Output Renderer (`QuizOutput`):**
- Question count badge + difficulty badge + topic subtitle
- Per-question cards with:
  - Question number badge
  - Type-specific color badges (mcq→violet, true_false→amber, fill_blank→teal, short_answer→sky)
  - Options list with:
    - **Correct answer**: emerald background, emerald circle with letter, ✓ checkmark icon
    - **Incorrect options**: muted background, gray circle
  - Explanation box: amber background with 💡 lightbulb icon
  - Points indicator

**Validation:** Either `topic` OR `sourceText` must be provided.

---

#### 4.4.5 Assignment + Rubric Builder (`assignment`)

**Purpose:** Generate a complete assignment brief with a detailed grading rubric.

**API Endpoint:** `POST /api/instructor/ai/generate-assignment`

**Request Body:**
```typescript
{
  skill: string              // Required: Skill or topic
  type?: string              // 'written' | 'coding' | 'project' | 'presentation' | 'peer-review'
  course?: string            // Optional course name for context
}
```

**Frontend Output Renderer (`AssignmentOutput`):**
- **Learning Objectives card**: Checkmark icons, one per objective
- **Instructions card**: Pre-formatted text with whitespace
- **Deliverables card**: Numbered list with violet number badges
- **Word limit indicator**: Clock icon + limit text
- **Grading Rubric card**: 
  - Per-criterion sections with amber badges
  - Performance levels in 2-column grid:
    - Excellent → emerald background
    - Good → sky background
    - Satisfactory → amber background
    - Needs Improvement → rose background
  - Each level shows: label, score range badge, description

---

#### 4.4.6 Rubric Generator (`rubric`)

**Purpose:** Generate a standalone detailed grading rubric with weighted criteria.

**API Endpoint:** `POST /api/instructor/ai/generate-rubric`

**Request Body:**
```typescript
{
  topic: string              // Required
  assignmentType?: string    // 'Essay' | 'Project' | 'Presentation' | 'Lab Report' | 'Portfolio'
  criteriaCount?: number     // 3, 4, 5, 6 criteria
  gradingScale?: string      // '4-Point' | '5-Point' | 'Percentage'
}
```

**Tips shown to instructor:**
1. "Weights auto-total to 100 points"
2. "Each level includes specific indicators for clarity"
3. "Choose the assignment type for tailored criteria"

---

#### 4.4.7 Course Description Writer (`description`)

**Purpose:** Generate SEO-optimized course title, description, and learning outcomes.

**API Endpoint:** `POST /api/instructor/ai/generate-description`

**Request Body:**
```typescript
{
  topic: string              // Required
  keywords?: string          // Comma-separated SEO keywords
  tone?: string              // 'professional' | 'friendly' | 'academic' | 'inspiring'
}
```

**Frontend Output Renderer (`DescriptionOutput`):**
- **SEO Title**: Large bold heading
- **Subtitle**: Italic muted text
- **Course Description card**: PenLine icon, full description text
- **What You'll Learn card**: Rose left border, 2-column grid of outcomes with checkmarks
- **Keyword badges**: Rose-colored tag chips

---

#### 4.4.8 Auto Caption & Translate (`caption`)

**Purpose:** Generate timestamped captions from video transcripts or text, with multilingual translation.

**API Endpoint:** `POST /api/instructor/ai/auto-caption`

**Request Body:**
```typescript
{
  content: string            // Required: transcript or text
  sourceType?: string        // 'video' | 'text'
  targetLanguage?: string    // 'en'|'es'|'fr'|'de'|'ar'|'zh'|'ja'|'pt'|'hi'|'ur'
}
```

**System Prompt (specialized):**
```
You are an expert captioning and translation specialist.
1. Produce captions with timestamps [MM:SS] or [HH:MM:SS]
2. Each caption line in the target language
3. Keep each segment concise — one sentence per timestamp
4. For video transcripts: align with natural speech segments
5. For plain text: assign sequential timestamps starting from [00:00]
```

**Supported Languages:** English, Spanish, French, German, Arabic, Chinese, Japanese, Portuguese, Hindi, Urdu

---

#### 4.4.9 Q&A Auto-Responder (`qa-responder`)

**Purpose:** Draft clear, educational answers to student questions with confidence scoring.

**API Endpoint:** `POST /api/instructor/ai/auto-respond`

**Request Body:**
```typescript
{
  question: string           // Required: Student's question
  context?: string           // Optional: Course context (e.g., "IB Physics Chapter 3")
}
```

**Response Structure:**
```typescript
{
  answer: {
    answer: string           // Full drafted answer
    keyPoints: string[]      // 2-5 key takeaways
    relatedTopics: string[]  // 2-4 related topics for further exploration
    confidence: 'high' | 'medium' | 'low'  // AI confidence level
  }
  content?: string           // Raw response fallback
}
```

**Frontend Output Renderer (`QAResponderOutput`):**
- **AI-Drafted Answer card**: Teal left border, confidence badge:
  - `high` → emerald badge with ✓ icon
  - `medium` → amber badge with − icon
  - `low` → rose badge with ⚠ icon
- **Key Points card**: Zap icon + amber theme, checkmark items
- **Related Topics**: Lightbulb icon + outline badges

**System Prompt:**
```
You are an expert instructor who drafts clear, educational answers for students.
Adapt your tone to be encouraging and supportive while maintaining academic rigor.
```

---

#### 4.4.10 Student Feedback Analyzer (`feedback-analyzer`)

**Purpose:** Analyze student reviews to extract sentiment, praise, issues, and improvement tips.

**API Endpoint:** `POST /api/instructor/ai/analyze-feedback`

**Request Body:**
```typescript
{
  reviews: string            // Required: Pasted student reviews/feedback text
}
```

**Response Structure:**
```typescript
{
  analysis: {
    topPraise: string[]              // Positive themes
    topIssues: string[]              // Concerns/complaints
    sentiment: {
      positive: number               // Percentage (0-100)
      neutral: number
      negative: number
      summary: string                // 1-2 sentence tone explanation
    }
    improvementTips: Array<{
      tip: string                    // Brief title
      description: string            // Detailed recommendation
      priority: 'high' | 'medium' | 'low'
    }>
  }
  content?: string                   // Raw fallback
}
```

**System Prompt Rules:**
- `topPraise`: Distinct positive themes
- `topIssues`: Distinct concerns
- `sentiment.percentages`: Must sum to 100
- `improvementTips`: 3-5 actionable recommendations ordered by priority

---

#### 4.4.11 Course Improvement Insights (`insights`)

**Purpose:** AI analyzes course analytics data and provides prioritized improvement recommendations.

**API Endpoint:** `POST /api/instructor/ai/course-insights`

**Request Body:**
```typescript
{
  courseName?: string        // Optional: Specific course
  focus?: string             // 'All Areas' | 'Student Engagement' | 'Content Quality' | 'Assessment Design' | 'Accessibility'
  instructorId?: string      // Fetches real analytics if provided
}
```

**Analytics Integration:**
When `instructorId` is provided, the endpoint:
1. Fetches analytics from `/api/analytics/intelligent?userId={instructorId}&role=instructor`
2. Includes the real analytics data in the LLM prompt for data-driven insights

**Response Structure:**
```typescript
{
  insights: Array<{
    title: string
    description: string
    severity: 'high' | 'medium' | 'low'
    category: 'content' | 'engagement' | 'assessment' | 'structure' | 'accessibility'
    action: string           // Specific actionable step
    impact: string           // Expected impact
    effort: 'low' | 'medium' | 'high'
  }>
  overallScore: number       // 0-100
  overallRecommendation: string
  quickWins: string[]        // Quick improvement items
  longTermGoals: string[]    // Long-term improvement items
}
```

---

### 4.5 Copilot Backend — Action-Based Architecture

The `/api/instructor/copilot` endpoint uses a **POST-based action dispatch** pattern:

```
POST /api/instructor/copilot
Body: { action: string, ...params }
```

#### 4.5.1 Supported Actions (9 total)

| Action | Handler | Persistence Model | Status Tracking |
|--------|---------|-------------------|-----------------|
| `generate-outline` | `handleGenerateOutline` | `AIGeneratedOutline` | generated→reviewed→approved/rejected |
| `generate-outcomes` | `handleGenerateOutcomes` | None (direct return) | — |
| `generate-structure` | `handleGenerateStructure` | `AIGeneratedLesson` | structure_generated→content_generated→reviewed→approved/rejected |
| `generate-content` | `handleGenerateContent` | `AIGeneratedLesson` (update) | content_generated→reviewed→approved/rejected |
| `generate-quiz` | `handleGenerateQuiz` | `AIGeneratedQuiz` | generated→reviewed→approved/rejected |
| `generate-assignment` | `handleGenerateAssignment` | `AIGeneratedAssignment` | generated→reviewed→approved/rejected |
| `generate-rubric` | `handleGenerateRubric` | `AIGeneratedRubric` | generated→reviewed→approved/rejected |
| `improvement-insights` | `handleImprovementInsights` | None (direct return) | — |
| `review-approve` | `handleReviewApprove` | Any model (via type param) | approve/reject status change |

#### 4.5.2 LLM Integration Pattern

All Copilot actions follow the same LLM integration pattern:

```typescript
// 1. Create SDK instance
const zai = await ZAI.create()

// 2. Build system prompt with strict JSON output requirement
const systemPrompt = `...IMPORTANT: Respond with valid JSON only. No markdown, no code fences...`

// 3. Build user prompt with context
const userPrompt = `Generate X for:\nTopic: ${topic}\n...`

// 4. Call LLM
const completion = await zai.chat.completions.create({
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  thinking: { type: 'disabled' }
})

// 5. Parse response with markdown fence stripping
let cleaned = response.trim()
if (cleaned.startsWith('```')) {
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
}
const parsed = JSON.parse(cleaned)
```

#### 4.5.3 Activity Logging

Every Copilot action is logged to `InstructorAIActivity`:

```typescript
await logActivity(instructorId, activityType, moduleType, title, metadata)
// → db.instructorAIActivity.create({
//     data: { instructorId, activityType, moduleType, title, metadata: JSON.stringify(metadata) }
//   })
```

**Logged activity types:**
- `outline_generated`, `outcomes_generated`, `structure_generated`
- `content_generated`, `quiz_generated`, `assignment_generated`
- `rubric_generated`, `insight_viewed`

#### 4.5.4 Review & Approve Workflow

The `review-approve` action enables instructors to review, edit, and approve/reject AI-generated content:

```typescript
// Request
{
  instructorId: string
  type: 'outline' | 'lesson' | 'quiz' | 'assignment' | 'rubric'
  id: string
  action: 'approve' | 'reject'
  editedContent?: string     // Optional: instructor's edits
  reviewNotes?: string       // Optional: review comments
}
```

**Status Flow:**
```
generated → reviewed → approved
                      → rejected
```

When `editedContent` is provided, the original generated content is preserved and the edited version is stored in `editedContent` field.

#### 4.5.5 GET — Fetch Saved Records

The GET endpoint retrieves previously generated content:

```
GET /api/instructor/copilot?instructorId={id}&type={type}&limit={n}
```

| Type Parameter | Returns |
|---------------|---------|
| `outline` | `AIGeneratedOutline[]` |
| `lesson` | `AIGeneratedLesson[]` |
| `quiz` | `AIGeneratedQuiz[]` |
| `assignment` | `AIGeneratedAssignment[]` |
| `rubric` | `AIGeneratedRubric[]` |
| `activity` | `InstructorAIActivity[]` (filterable by `activityType`) |
| (default) | All types (5 each) + activities |

### 4.6 AI Assistant Chat

**Endpoint:** `POST /api/instructor/ai/assistant`

A general-purpose conversational AI assistant for instructors.

**Request:**
```typescript
{
  message: string             // Required
  history?: Array<{           // Optional: conversation history (last 20 messages)
    role: 'user' | 'assistant'
    content: string
  }>
}
```

**System Prompt Specialization:**
```
You are a helpful AI assistant for course instructors on the ShijlAI Academy platform.
Specializations:
- Course Management: Creating, organizing, and maintaining courses
- Student Engagement: Strategies to keep students motivated
- Content Creation: Designing high-quality educational content
- Teaching Strategies: Best practices for online/blended teaching
- Platform Features: Guiding instructors on ShijlAI Academy tools
- Analytics Interpretation: Understanding student performance data

Tailored to international education context (IB, AP, Cambridge, Common Core).
Familiar with Physics, Chemistry, Biology, Mathematics, English, Computer Science, etc.
```

**Chat History Persistence:**
- `GET /api/instructor/ai/assistant-messages` — Retrieve chat history
- Messages stored in `AIAssistantMessage` model with `role` (user/assistant) and `content`

### 4.7 AI Generations & Templates

**Endpoints:**
- `GET /api/instructor/ai/generations` — List all AI generations
- `GET /api/instructor/ai/generations/[id]` — Get specific generation
- `DELETE /api/instructor/ai/generations/[id]` — Delete generation
- `GET /api/instructor/ai/templates` — List prompt templates
- `POST /api/instructor/ai/templates` — Create template
- `GET /api/instructor/ai/templates/[id]` — Get template
- `PUT /api/instructor/ai/templates/[id]` — Update template
- `DELETE /api/instructor/ai/templates/[id]` — Delete template
- `GET /api/instructor/ai/usage-stats` — AI usage statistics

### 4.8 Additional AI Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/instructor/ai/generate-thumbnail` | Generate course thumbnail |
| `POST /api/instructor/ai/improve-bio` | Improve instructor bio |
| `POST /api/instructor/ai/suggest-reply` | Suggest message reply |

---

## 5. Intelligent Analytics

### 5.1 View: `instructor-analytics-view.tsx` (~2,946 lines)

**API Endpoints:**
- `GET /api/instructor/analytics?instructorId={id}&period={7d|30d|90d|all}`
- `GET /api/instructor/analytics/insights?instructorId={id}&period={period}`
- `GET /api/instructor/analytics/engagement?instructorId={id}`
- `GET /api/analytics/intelligent?userId={id}&role=instructor`

### 5.2 Analytics Dashboard Layout

```
┌───────────────────────────────────────────────────────────────┐
│  Intelligent Analytics           [7d] [30d] [90d] [All] [📊] │
├───────────────────────────────────────────────────────────────┤
│  🧠 AI Insights Panel                                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 💡 Opportunity: "Your Python course enrollment grew 23% │ │
│  │    this month — consider creating an advanced follow-up" │ │
│  │ ⚠️ Warning: "Quiz pass rate dropped to 62% in Module 3" │ │
│  │ 🏆 Achievement: "Student satisfaction at all-time high"  │ │
│  │ 💡 Suggestion: "Add practice quizzes to Module 4"        │ │
│  └─────────────────────────────────────────────────────────┘ │
├──────────┬──────────┬──────────┬──────────┬──────────┬───────┤
│ 👥 142   │ 💰 $3.2K │ ⭐ 4.7   │ 📊 68%   │ 📚 5    │ 🎯82%│
│ Students │ Revenue  │ Rating   │ Complet. │ Courses  │ Eng.  │
│ +12% MoM │ +8.3%    │ +0.2     │ +5%      │ —        │ +3%   │
├──────────┴──────────┴──────────┴──────────┴──────────┴───────┤
│  Revenue Over Time           │  Enrollment Over Time          │
│  ┌───────────────────────┐   │  ┌───────────────────────┐    │
│  │  ▁▂▃▅▆▇█ AreaChart   │   │  │  ▁▂▃▅▆▇█ AreaChart   │    │
│  └───────────────────────┘   │  └───────────────────────┘    │
├──────────────────────────────┴────────────────────────────────┤
│  Student Distribution (PieChart)                               │
│  Excellent: 35 | Good: 45 | Average: 42 | Needs Improvement:20│
├───────────────────────────────────────────────────────────────┤
│  🧠 Intelligent Analytics                                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Difficult Lessons                                         │ │
│  │ • "Intro to Pointers" — avg score 42%, 15% repeat visits │ │
│  │ • "Recursion Basics" — avg score 48%, high dropoff       │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ Student Struggle Areas                                    │ │
│  │ • Memory Management → 38% mastery, declining trend ↘     │ │
│  │ • Algorithm Design → 45% mastery, stable →               │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ Module Drop Analysis                                      │ │
│  │ • Module 3→4: -18% score drop (pointer arithmetic)       │ │
│  │ • Module 6→7: -12% score drop (advanced topics)           │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ AI Suggestions                                            │ │
│  │ 📝 add_revision → "Add review section before Module 4"   │ │
│  │ 📋 create_quiz → "Practice quiz for pointer concepts"    │ │
│  │ 🔄 update_module → "Restructure Module 6 lessons"        │ │
│  └──────────────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────────────┤
│  Course Performance (sortable table)                           │
├───────────────────────────────────────────────────────────────┤
│  Lesson Drop-off Analysis (expandable by course → module)      │
├───────────────────────────────────────────────────────────────┤
│  Quiz Analytics              │  Assignment Analytics           │
│  Pass: 78% | Avg: 72%       │  Submission: 85% | On-time: 70% │
├──────────────────────────────┴─────────────────────────────────┤
│  Review Analytics — Rating Distribution + Sentiment            │
├───────────────────────────────────────────────────────────────┤
│  Enrollment Forecast (14-day projection with 95% CI)           │
├───────────────────────────────────────────────────────────────┤
│  Category Breakdown (BarChart + grid cards)                    │
├───────────────────────────────────────────────────────────────┤
│  Top Performing Students (ranked with medals)                  │
├───────────────────────────────────────────────────────────────┤
│  Engagement Heatmap (7×24 grid)                               │
├───────────────────────────────────────────────────────────────┤
│  Live Session Analytics (by type: workshop/lecture/office_hr) │
└───────────────────────────────────────────────────────────────┘
```

### 5.3 AI Insights Generation

**Endpoint:** `GET /api/instructor/analytics/insights?instructorId={id}&period={period}`

The AI Insights pipeline:

```
Step 1: Fetch instructor data
  ├── Courses with enrollments, reviews
  ├── Quiz attempts and assignment submissions
  └── Daily activity records

Step 2: Build structured data summary string
  ├── Total students, courses, revenue
  ├── Average rating, completion rate
  ├── Quiz pass rates, assignment submission rates
  ├── Recent trends (enrollment, engagement)
  └── Review sentiment summary

Step 3: Call LLM via z-ai-web-dev-sdk
  System prompt: "You are an expert educational analytics advisor..."
  Requires JSON response: { insights[], summary, recommendations[] }

Step 4: Parse and validate insights
  ├── Normalize insight types: opportunity | warning | achievement | suggestion
  ├── Strip markdown code fences
  └── Fallback to hardcoded insights if AI fails

Step 5: Return structured insights
```

**Insight Categories:**

| Category | Icon | Color | Description |
|----------|------|-------|-------------|
| `opportunity` | 💡 | Emerald | Growth potential identified |
| `warning` | ⚠️ | Amber | Concern requiring attention |
| `achievement` | 🏆 | Violet | Positive milestone reached |
| `suggestion` | 💡 | Cyan | Improvement recommendation |

### 5.4 Intelligent Analytics Types

```typescript
interface IntelligentAnalyticsData {
  difficultLessons: DifficultLesson[]
  studentStruggles: StudentStruggle[]
  moduleDrops: ModuleDrop[]
  insights: IntelligentInsight[]
  suggestions: IntelligentSuggestion[]
}

interface DifficultLesson {
  lessonId: string
  lessonTitle: string
  moduleId: string
  moduleTitle: string
  courseId: string
  courseTitle: string
  averageScore: number          // 0-100
  repeatVisitRate: number       // % of students revisiting
  dropoffRate: number           // % of students who stopped after
  severity: 'high' | 'medium' | 'low'
}

interface StudentStruggle {
  topic: string
  masteryLevel: number          // 0-100
  trend: 'improving' | 'stable' | 'declining'
  affectedStudents: number
  recommendedAction: string
}

interface ModuleDrop {
  fromModule: string
  toModule: string
  scoreDrop: number             // Percentage points
  fromAvgScore: number
  toAvgScore: number
  courseId: string
  severity: 'high' | 'medium' | 'low'
}

interface IntelligentInsight {
  id: string
  type: 'opportunity' | 'warning' | 'achievement' | 'suggestion'
  title: string
  description: string
  category: string
  impact: 'high' | 'medium' | 'low'
  data?: Record<string, unknown>
}

interface IntelligentSuggestion {
  id: string
  type: 'add_revision' | 'create_quiz' | 'update_module' | 'add_resource' | 'schedule_session'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  targetModule?: string
  targetCourse?: string
}
```

### 5.5 Analytics API — 17 Data Sections

The `/api/instructor/analytics` endpoint computes these sections:

| # | Section | Data Source | Computation |
|---|---------|-----------|-------------|
| 1 | Overview | Courses, enrollments, transactions | Aggregation |
| 2 | Revenue Over Time | Transactions | Cumulative per-day |
| 3 | Enrollment Over Time | Enrollments | Cumulative per-day |
| 4 | Course Performance | Per-course nested includes | Per-course stats |
| 5 | Student Distribution | Lesson progress scores | Classification |
| 6 | Quiz Analytics | Quiz attempts | Pass rate, score, by type |
| 7 | Assignment Analytics | Submissions | Submission rate, by type |
| 8 | Top Students | User XP | Ranking |
| 9 | Engagement Metrics | DailyActivity, LearningMetric | DAU, time, lessons/day |
| 10 | Category Breakdown | Course categories | Per-category stats |
| 11 | Comparison | Previous period | Delta for 5 KPIs |
| 12 | Retention Metrics | Enrollments, daily activity | Active/returning/churned |
| 13 | Lesson Drop-off | Module completion rates | Per-module dropoff |
| 14 | Review Analytics | Reviews | Distribution, sentiment |
| 15 | Enrollment Forecast | Historical enrollment | Linear regression + 95% CI |
| 16 | Revenue Breakdown | Transactions | Per-course revenue |
| 17 | Live Session Analytics | LiveSession | Attendance by type |

### 5.6 Enrollment Forecast Algorithm

The forecast uses **linear regression** with 95% confidence intervals:

```typescript
// Linear regression: y = mx + b
// Where x = day index, y = cumulative enrollment

const n = dataPoints.length
const sumX = dataPoints.reduce((s, _, i) => s + i, 0)
const sumY = dataPoints.reduce((s, d) => s + d.value, 0)
const sumXY = dataPoints.reduce((s, d, i) => s + i * d.value, 0)
const sumX2 = dataPoints.reduce((s, _, i) => s + i * i, 0)

const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
const intercept = (sumY - slope * sumX) / n

// 95% confidence interval using standard error
const predictions = []
for (let i = 0; i < 14; i++) {
  const dayIndex = dataPoints.length + i
  const predicted = slope * dayIndex + intercept
  const se = standardError * Math.sqrt(1/n + (dayIndex - meanX)² / sumX2Deviation)
  predictions.push({
    date: futureDate(i),
    value: Math.max(0, Math.round(predicted)),
    lower: Math.max(0, Math.round(predicted - 1.96 * se)),
    upper: Math.round(predicted + 1.96 * se)
  })
}
```

### 5.7 Engagement Heatmap

A 7×24 grid (7 days × 24 hours) showing student activity intensity:

```
     00  01  02  ...  08  09  10  11  12  ...  20  21  22  23
Mon  ░   ░   ░       ░   ▓   █   █   ▒       ░   ░   ░   ░
Tue  ░   ░   ░       ░   ▓   █   █   █       ░   ░   ░   ░
Wed  ░   ░   ░       ░   ▒   ▓   █   █       ░   ░   ░   ░
Thu  ░   ░   ░       ░   ▓   █   █   ▒       ░   ░   ░   ░
Fri  ░   ░   ░       ░   ▒   ▓   ▓   ▒       ░   ░   ░   ░
Sat  ░   ░   ░       ░   ░   ▒   ▒   ░       ░   ░   ░   ░
Sun  ░   ░   ░       ░   ░   ░   ▒   ░       ░   ░   ░   ░
```

Color intensity: `░` (0 actions) → `▒` (1-5) → `▓` (6-15) → `█` (16+)

**Data Source:** Aggregated from `DailyActivity` records, grouped by `dayOfWeek` and `hour`.

---

## 6. Smart Assessment System

### 6.1 View: `instructor-assessment-view.tsx` (~1,754 lines)

**API Endpoints:**
- `GET /api/instructor/courses` — Course list for selector
- `GET /api/instructor/assessment/question-analytics?instructorId={id}&courseId={id}`
- `GET /api/instructor/assessment/distractor-analysis?instructorId={id}&questionId={id}`
- `GET /api/instructor/assessment/outcomes?instructorId={id}&courseId={id}`
- `GET /api/instructor/assessment/quality-scores?instructorId={id}&courseId={id}`
- `POST /api/instructor/assessment/generate-insights` — AI-powered insights

### 6.2 Tab Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Smart Assessment        Course: [▼ Select Course]          │
├─────────┬──────────┬──────────┬──────────────┬─────────────┤
│Difficulty│Distractors│ Outcomes │ Intelligence │   Quality   │
├─────────┴──────────┴──────────┴──────────────┴─────────────┤
│  (Tab content)                                               │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Tab 1: Question Difficulty

**API:** `GET /api/instructor/assessment/question-analytics`

**Summary Stats Cards:**
| Stat | Description |
|------|-------------|
| Total Questions | Count of questions in course quizzes |
| Average Success Rate | Mean of all question success rates |
| Too Difficult | Questions with ≤20% success rate |
| Too Easy | Questions with >90% success rate |

**Difficulty Distribution Badges:**
| Level | Success Rate | Color |
|-------|-------------|-------|
| Too Difficult | ≤20% | Rose |
| Difficult | ≤40% | Amber |
| Normal | ≤70% | Emerald |
| Easy | ≤90% | Sky |
| Too Easy | >90% | Slate |

**Question Cards:**
Each question card shows:
- Question text (truncated)
- Type badge (MCQ, True/False, etc.)
- Quiz title
- Progress bar for success rate with color coding
- Difficulty label with icon
- Recommendation text based on difficulty

**Computation Algorithm:**
```typescript
for each question:
  attempts = count of answers for this question
  correct = count of correct answers
  successRate = (correct / attempts) × 100
  difficultyScore = 100 - successRate
  difficultyLevel = classifyDifficulty(successRate)
    // ≤20% → too_difficult
    // ≤40% → difficult
    // ≤70% → normal
    // ≤90% → easy
    // >90% → too_easy

  // Upsert to db.questionAnalytics
  await db.questionAnalytics.upsert({
    where: { questionId },
    create: { questionId, attempts, correctCount: correct, successRate, difficultyScore, difficultyLevel },
    update: { attempts, correctCount: correct, successRate, difficultyScore, difficultyLevel }
  })
```

### 6.4 Tab 2: Distractor Analysis

**API:** `GET /api/instructor/assessment/distractor-analysis?questionId={id}`

**Purpose:** Analyze the effectiveness of MCQ/True-False distractor options.

**Analysis Process:**
1. Fetch question with options (only MCQ/true_false types)
2. Parse options from JSON
3. Fetch all attempts for the question's quiz
4. Count selections per option label (A-H)
5. Compute `selectionRate = (selectionCount / totalAttempts) × 100`
6. **Weak distractor detection**: Incorrect options with <5% selection rate
7. Upsert results to `db.distractorAnalytics`

**Response Structure:**
```typescript
{
  question: {
    id: string
    text: string
    type: string
    options: string[]
    correctAnswer: string
  }
  distractors: Array<{
    optionLabel: string       // 'A', 'B', 'C', 'D'
    optionText: string
    selectionCount: number
    selectionRate: number     // Percentage
    isCorrect: boolean
    isWeak: boolean           // <5% selection rate for non-correct options
  }>
  totalAttempts: number
  weakDistractorCount: number
  recommendation: string     // Auto-generated advice
}
```

**Weak Distractor Example:**
```
Question: "What is the time complexity of binary search?"
Options:
  A) O(n)        → 8%  (distractor, not weak)
  B) O(log n)    → 72% (correct answer)
  C) O(n²)       → 15% (distractor, not weak)
  D) O(n log n)  → 3%  ← WEAK DISTRACTOR (<5%)
  E) O(2ⁿ)       → 2%  ← WEAK DISTRACTOR (<5%)

Recommendation: "2 weak distractors detected (D, E). Consider replacing
them with more plausible alternatives like O(√n) or O(n!) to better
differentiate between understanding levels."
```

### 6.5 Tab 3: Learning Outcomes

**API:** `GET /api/instructor/assessment/outcomes`

**Features:**
- **Create outcomes** via dialog (title + description)
- **Link outcomes to questions** via dialog
- **Mastery computation** per outcome:
  - For each student, compute % of linked questions answered correctly
  - Assign mastery level: mastered (≥90%), proficient (≥70%), developing (≥50%), beginning (>0%), no_data (0%)
  - Display as circular progress rings with mastery colors
- **Expandable outcome cards** showing linked questions

**Mastery Computation Algorithm:**
```typescript
for each outcome:
  linkedQuestions = outcome.questionOutcomes.map(qo => qo.questionId)
  for each student:
    correctCount = 0
    for each linkedQuestion:
      answer = studentAnswers.find(a => a.questionId === linkedQuestion)
      if (answer?.isCorrect) correctCount++
    mastery = (correctCount / linkedQuestions.length) × 100
    classifyMastery(mastery):
      ≥90 → 'mastered'
      ≥70 → 'proficient'
      ≥50 → 'developing'
      >0  → 'beginning'
      0   → 'no_data'
  avgMastery = mean(allStudentMasteries)
```

### 6.6 Tab 4: Assessment Intelligence (AI-Powered)

**API:** `POST /api/instructor/assessment/generate-insights`

**Request:**
```typescript
{
  instructorId: string
  courseId: string
}
```

**Process:**
1. Verify course ownership
2. Gather assessment context:
   - Learning outcomes with mastery levels
   - Difficult questions (difficulty ≤ 40%)
   - Weak distractors (<5% selection)
   - Quality scores
   - Quiz attempt summary
3. Build `assessmentContext` JSON
4. Send to LLM with structured system prompt
5. Parse response into student insights + instructor insights + overall assessment

**Response Structure:**
```typescript
{
  studentInsights: Array<{
    title: string
    description: string
    severity: 'high' | 'medium' | 'low'
    affectedGroup: string
  }>
  instructorInsights: Array<{
    title: string
    description: string
    category: 'content' | 'design' | 'alignment'
    action: string
  }>
  overallAssessment: {
    healthScore: number        // 0-100
    strengths: string[]
    areasForImprovement: string[]
    priorityActions: string[]
  }
}
```

**System Prompt (specialized):**
```
You are an expert educational assessment analyst. Analyze the provided
assessment data and generate actionable insights for both students and
instructors.

Respond with JSON:
{
  "studentInsights": [...],
  "instructorInsights": [...],
  "overallAssessment": {
    "healthScore": 0-100,
    "strengths": [...],
    "areasForImprovement": [...],
    "priorityActions": [...]
  }
}
```

**Frontend Display:**
- Two-panel layout: Student Insights | Instructor Insights
- Each insight card with severity badge (high=rose, medium=amber, low=emerald)
- Overall Assessment card with:
  - Circular health score progress ring
  - Strengths list (checkmark icons)
  - Areas for improvement (alert icons)
  - Priority actions (numbered list)

### 6.7 Tab 5: Quality Scores

**API:** `GET /api/instructor/assessment/quality-scores`

**Quality Score Components:**

| Component | Description | Weight |
|-----------|-------------|--------|
| Difficulty Balance | Distribution across difficulty levels | 30% |
| Question Variety | Mix of question types | 25% |
| Outcome Coverage | % of outcomes assessed by questions | 25% |
| Distractor Quality | % of non-weak distractors | 20% |

**Overall Quality Score:**
```
overallScore = difficultyBalance × 0.30
             + questionVariety × 0.25
             + outcomeCoverage × 0.25
             + distractorQuality × 0.20
```

**Quality Labels:**
| Score | Label | Color |
|-------|-------|-------|
| ≥80 | Excellent | Emerald |
| ≥60 | Good | Sky |
| ≥40 | Fair | Amber |
| <40 | Needs Improvement | Rose |

---

## 7. Course Management

### 7.1 View: `instructor-courses-view.tsx` (~1500+ lines)

### 7.2 View Modes

| Mode | Description |
|------|-------------|
| **Grid** | Card layout with thumbnails, stats badges |
| **List** | Table rows with course info |
| **Kanban** | Columns by status (Draft/Review/Published/Archived) |

### 7.3 Course Creation Wizard (4-Step Dialog)

```
Step 1: Basics
  ├── Course title (required)
  ├── Category (select)
  ├── Level (beginner/intermediate/advanced)
  ├── Language
  └── Thumbnail upload

Step 2: Curriculum
  ├── Add modules
  ├── Add lessons within modules
  ├── Set lesson types (video/text/quiz/assignment)
  └── Reorder via drag

Step 3: Content
  ├── Lesson content editor
  ├── Quiz question builder
  └── Assignment setup

Step 4: Pricing & SEO
  ├── Price
  ├── Discount
  ├── SEO title & description
  └── Keywords
```

**AI Integration in Course Creator:**
The `ai-panel` component within the course creator provides:
- **Curriculum generation** from topic → auto-populates Step 2
- **Lesson content generation** from outline → auto-populates Step 3
- **Description generation** for SEO → auto-populates Step 4

### 7.4 Course Operations

| Operation | Endpoint | Method |
|-----------|----------|--------|
| Create course | `/api/instructor/courses` | POST |
| Get courses | `/api/instructor/courses` | GET |
| Get course detail | `/api/instructor/courses/[id]` | GET |
| Update course | `/api/instructor/courses/[id]` | PUT |
| Delete course | `/api/instructor/courses/[id]` | DELETE |
| Duplicate course | `/api/instructor/courses/[id]/duplicate` | POST |
| Archive/restore | `/api/instructor/courses/[id]/archive` | PUT |
| Reorder modules | `/api/instructor/courses/[id]/reorder` | PUT |
| Sync content | `/api/instructor/courses/[id]/sync-content` | POST |
| Bulk operations | `/api/instructor/courses/bulk` | POST |
| Add module | `/api/instructor/courses/[id]/modules` | POST |
| Add assignment | `/api/instructor/courses/[id]/assignments` | POST |

---

## 8. Student Management

### 8.1 View: `instructor-students-view.tsx` (~1300+ lines)

### 8.2 View Modes

| Mode | Description |
|------|-------------|
| **Table** | Columns: Name, Email, Course, Progress, Status, Risk |
| **Grid** | Card layout with avatar, progress ring, risk badge |
| **Cards** | Expanded cards with more details |

### 8.3 Student Risk Assessment

| Risk Level | Criteria | Color |
|-----------|----------|-------|
| Low | Progress > 70%, active within 3 days | Emerald |
| Medium | Progress 40-70%, active within 7 days | Amber |
| High | Progress < 40%, inactive > 7 days | Rose |

### 8.4 Bulk Actions

| Action | Description |
|--------|-------------|
| Announcement | Send message to selected students |
| Export CSV | Download student data as CSV |
| Revoke Access | Remove from course |

### 8.5 Filters & Search

- **Search**: Name, email
- **Filter by course**: Dropdown
- **Filter by status**: All/Active/Completed/At-Risk/Inactive
- **Sort**: Name, Progress, Last Active, Enrollment Date

---

## 9. Q&A Management with AI Draft Answers

### 9.1 View: `instructor-qa-view.tsx` (~1400+ lines)

### 9.2 Features

| Feature | Description |
|---------|-------------|
| **AI Draft Answers** | Generate AI-drafted answer for any question |
| **Pin questions** | Pin important questions to top |
| **Flag questions** | Flag for follow-up |
| **Accept answers** | Mark answer as accepted |
| **Bulk selection** | Select multiple questions for batch actions |
| **Formatting toolbar** | Bold, italic, code, links in answers |
| **Upvote system** | Students can upvote helpful answers |
| **Settings dialog** | Auto-answer toggle, email notifications |

### 9.3 Q&A Settings Model

```typescript
interface QASettings {
  autoAnswer: boolean         // AI auto-generates draft answers
  emailNotifications: boolean // Notify on new questions
  maxQuestionsPerDay: number  // Rate limit
}
```

---

## 10. Messaging System with AI Reply Suggestions

### 10.1 View: `instructor-messages-view.tsx` (~1300+ lines)

### 10.2 Features

| Feature | Description |
|---------|-------------|
| **AI Reply Suggestions** | Generate AI-suggested reply via `/api/instructor/ai/suggest-reply` |
| **Emoji picker** | Full emoji picker in message input |
| **Message search** | Search within conversations |
| **Star conversations** | Pin important conversations |
| **Mute conversations** | Silence notifications |
| **Archive** | Move old conversations to archive |
| **Bulk mark-read** | Mark multiple as read |
| **New conversation** | Start new conversation with any student |
| **Profile panel** | View student profile from chat |
| **Edit/Delete** | Edit or delete sent messages |
| **Reactions** | React to messages |
| **Typing indicator** | Real-time typing status |
| **Keyboard shortcuts** | ⌘N for new, ⌘K for search |

---

## 11. Revenue & Finance

### 11.1 View: `instructor-revenue-view.tsx` (~1200+ lines)

### 11.2 Tab Layout

| Tab | Description |
|-----|-------------|
| **Overview** | Stat cards, revenue chart, course breakdown |
| **Transactions** | Full transaction list with filters |
| **Payouts** | Payout history, request payout |
| **Tax Documents** | Annual statements, NTN verification |

### 11.3 Payout Methods

| Method | Fields |
|--------|--------|
| Bank Transfer | Bank name, account number, IBAN, SWIFT code |
| JazzCash | Phone number |
| Easypaisa | Phone number |
| Payoneer | Email |
| Stripe | Connected account |

### 11.4 Commission System

- Default commission rate: 20%
- Custom commission via `CommissionOverride` model (per-instructor)
- Dynamic commission rates based on course performance
- Tax withholding support

---

## 12. Instructor Profile & AI Bio Improvement

### 12.1 View: `instructor-profile-view.tsx` (~1200+ lines)

### 12.2 Profile Tabs

| Tab | Description |
|-----|-------------|
| **Overview** | Bio, stats, course showcase, review summary |
| **Courses** | Published courses grid |
| **Professional** | Expertise tags, languages, social links, NTN |
| **Earnings** | Revenue overview, payout history |
| **Reviews** | Review breakdown chart, individual reviews |
| **Settings** | Profile visibility, notification preferences |

### 12.3 AI Bio Improvement

**Endpoint:** `POST /api/instructor/ai/improve-bio`

The AI analyzes the instructor's current bio and suggests improvements:
- Better formatting and structure
- More impactful language
- SEO-friendly keywords
- Professional tone adjustment

### 12.4 Profile Completion Score

The profile view shows a completion percentage based on:
- Bio filled
- Avatar uploaded
- Expertise tags added
- Social links provided
- Languages specified
- NTN verified

---

## 13. Settings & Integrations

### 13.1 View: `instructor-settings-view.tsx` (~1500+ lines)

### 13.2 Settings Tabs

| Tab | Description |
|-----|-------------|
| **Profile** | Photo upload, display name, timezone |
| **Account** | Email, password, 2FA, session management |
| **Notifications** | Enrollment, Q&A, review, assignment, message toggles |
| **Appearance** | Theme (light/dark/system), density |
| **Privacy** | Profile visibility, course reviews, online status |
| **Payout** | Payout method, schedule, threshold, commission |
| **Integrations** | Zoom, Mailchimp, Zapier connections |
| **Preferences** | Language, currency, timezone, date format |

### 13.3 Auto-Save

Settings use an `useAutoSave` hook that:
1. Debounces changes (1.5s)
2. Auto-saves to `/api/instructor/settings`
3. Shows "Saving..." / "Saved" indicator
4. Handles errors with toast notifications

### 13.4 Session Management

- View active sessions (device, browser, IP, last active)
- Revoke individual sessions
- "Sign out all devices" option

### 13.5 Danger Zone

- Deactivate account
- Delete account (with confirmation)
- Export data

---

## 14. State Management

### 14.1 Zustand Store — Instructor State

```typescript
// From /src/lib/store.ts
interface AppState {
  // Instructor-specific state
  selectedStudentId: string | null
  selectedAIToolId: string | null
  editingCourseId: string | null

  // Shared state
  currentView: string
  userRole: 'student' | 'instructor' | 'admin'
  userId: string | null

  // Actions
  setCurrentView: (view: string) => void
  setSelectedStudentId: (id: string | null) => void
  setSelectedAIToolId: (id: string | null) => void
  setEditingCourseId: (id: string | null) => void
}
```

### 14.2 View Resolution

```typescript
// From /src/lib/view-utils.ts
function resolveViewKey(view: string, userRole: string): string {
  if (view === 'dashboard' && userRole === 'instructor') return 'instructor-dashboard'
  if (view === 'courses' && userRole === 'instructor') return 'instructor-courses'
  // ... etc
  return view
}
```

### 14.3 Instructor View Types

```typescript
// From /src/lib/types.ts
type InstructorView =
  | 'instructor-courses'
  | 'instructor-course-detail'
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
```

---

## 15. AI Engine — Deep Implementation

### 15.1 LLM Integration Architecture

All AI features in the Instructor Portal use `z-ai-web-dev-sdk` (ZAI) for LLM calls. The SDK is initialized as follows:

```typescript
import ZAI from 'z-ai-web-dev-sdk'

const zai = await ZAI.create()
const completion = await zai.chat.completions.create({
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  thinking: { type: 'disabled' }
})
const response = completion.choices[0]?.message?.content
```

### 15.2 JSON Response Parsing Pattern

All AI endpoints follow a consistent JSON parsing pattern with fallback:

```typescript
function parseLLMJson(text: string): unknown {
  let cleaned = text.trim()
  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }
  return JSON.parse(cleaned)
}

// Usage with fallback
try {
  const parsed = parseLLMJson(response)
  // Use parsed structured data
  return NextResponse.json({ modules: parsed.modules, content: response })
} catch {
  // JSON parsing failed — return raw content for frontend to handle
  return NextResponse.json({ content: response })
}
```

### 15.3 System Prompt Engineering Patterns

#### Pattern 1: Structured Output with Strict Schema

Used by all 11 AI tools. Forces JSON-only output:

```
IMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences,
no extra text. The JSON must follow this exact structure:
{ "field1": "type", "field2": [...] }
```

#### Pattern 2: Education Domain Specialization

Used by curriculum, outcomes, and assessment tools:

```
You are an expert curriculum designer specializing in international education
standards, including IB (International Baccalaureate), AP (Advanced Placement),
Cambridge (IGCSE, O-Level, A-Level), and Common Core.
```

#### Pattern 3: Analytics-Enhanced Prompts

Used by insights and course improvement tools:

```
Analytics Data (use this to inform your insights):
${JSON.stringify(analyticsData, null, 2)}

Focus on:
1. Difficult lessons that need revision
2. Student struggle areas that need additional support
3. Module performance drops that need restructuring
```

#### Pattern 4: Conversational with History

Used by the AI Assistant chat:

```typescript
const messages = [
  { role: 'system', content: SYSTEM_PROMPT },
  ...validatedHistory.slice(-20),  // Last 20 messages
  { role: 'user', content: message }
]
```

### 15.4 AI Content Persistence

All AI-generated content is persisted with **status tracking**:

```
┌─────────────┐     ┌─────────────┐     ┌──────────┐
│  Generated   │────▶│  Reviewed   │────▶│ Approved │
│  (initial)   │     │  (instructor│     │ (ready   │
│              │     │   reviews)  │     │  to use) │
└─────────────┘     └──────┬──────┘     └──────────┘
                           │
                           ▼
                    ┌──────────┐
                    │ Rejected │
                    │ (discard │
                    │  or edit)│
                    └──────────┘
```

**Persistence Models:**

| Model | Fields | Status Values |
|-------|--------|---------------|
| `AIGeneratedOutline` | instructorId, courseId, prompt, generatedContent, status, reviewNotes | generated, reviewed, approved, rejected |
| `AIGeneratedLesson` | instructorId, courseId, topic, structureContent, lessonContent, status | structure_generated, content_generated, reviewed, approved, rejected |
| `AIGeneratedQuiz` | instructorId, courseId, topic, questionTypes, difficulty, questionCount, generatedContent, status | generated, reviewed, approved, rejected |
| `AIGeneratedAssignment` | instructorId, courseId, topic, difficulty, generatedContent, status | generated, reviewed, approved, rejected |
| `AIGeneratedRubric` | instructorId, courseId, assignmentId, topic, generatedContent, status | generated, reviewed, approved, rejected |

### 15.5 AI Activity Tracking

The `InstructorAIActivity` model tracks every AI interaction:

```typescript
model InstructorAIActivity {
  id           String   @id @default(cuid())
  instructorId String
  activityType String   // outline_generated, quiz_generated, etc.
  moduleType   String   // outline, structure, content, quiz, assignment, rubric, insights
  title        String   // Human-readable description
  metadata     String?  // JSON string with additional context
  createdAt    DateTime @default(now())
}
```

**Activity Types:**
| Activity Type | Module Type | Description |
|--------------|-------------|-------------|
| `outline_generated` | outline | Course outline generated |
| `outcomes_generated` | outcomes | Learning outcomes generated |
| `structure_generated` | structure | Lesson structure generated |
| `content_generated` | content | Lesson content generated |
| `quiz_generated` | quiz | Quiz questions generated |
| `assignment_generated` | assignment | Assignment brief generated |
| `rubric_generated` | rubric | Grading rubric generated |
| `insight_viewed` | insights | Improvement insights viewed |

### 15.6 Fallback Strategy

All AI endpoints implement graceful degradation:

```
AI Request
    │
    ▼
LLM Call succeeds? ──Yes──▶ Parse JSON ──Success──▶ Return structured data
    │                                    │
    No                                   Fail
    │                                    │
    ▼                                    ▼
Return error message        Return raw content as fallback
(with 422 status)           (frontend handles gracefully)
```

For analytics insights specifically, there's an additional fallback:

```
AI Insights Request
    │
    ▼
LLM Call succeeds? ──Yes──▶ Parse insights ──Success──▶ Return AI insights
    │                                         │
    No                                        Fail
    │                                         │
    ▼                                         ▼
Return hardcoded insights        Return normalized fallback insights
(based on basic data stats)      (with safe default values)
```

---

## 16. API Reference — Complete Route Catalog

### 16.1 Core CRUD (18 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/instructor/dashboard` | Dashboard data with 60s cache |
| GET | `/api/instructor/courses` | List instructor's courses |
| POST | `/api/instructor/courses` | Create new course |
| GET | `/api/instructor/courses/[id]` | Get course detail |
| PUT | `/api/instructor/courses/[id]` | Update course |
| DELETE | `/api/instructor/courses/[id]` | Delete course |
| POST | `/api/instructor/courses/[id]/duplicate` | Duplicate course |
| PUT | `/api/instructor/courses/[id]/reorder` | Reorder modules |
| PUT | `/api/instructor/courses/[id]/archive` | Archive/restore course |
| POST | `/api/instructor/courses/[id]/sync-content` | Sync content |
| POST | `/api/instructor/courses/bulk` | Bulk operations |
| GET | `/api/instructor/modules/[moduleId]` | Get module |
| PUT | `/api/instructor/modules/[moduleId]` | Update module |
| DELETE | `/api/instructor/modules/[moduleId]` | Delete module |
| POST | `/api/instructor/modules/[moduleId]/lessons` | Add lesson |
| POST | `/api/instructor/modules/[moduleId]/quizzes` | Add quiz |
| PUT | `/api/instructor/modules/[moduleId]/reorder` | Reorder items |
| GET/PUT/DELETE | `/api/instructor/lessons/[lessonId]` | Lesson CRUD |

### 16.2 Student Management (3 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/instructor/students` | List with search/filter/pagination |
| GET | `/api/instructor/students/[id]` | Student detail |
| POST | `/api/instructor/students/[id]/note` | Add student note |

### 16.3 Assessment & Assignments (8 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/instructor/assignments` | List/create assignments |
| GET/PUT | `/api/instructor/assignments/[id]` | Assignment detail/update |
| GET/POST | `/api/instructor/quizzes` | List/create quizzes |
| GET/PUT/DELETE | `/api/instructor/quizzes/[id]` | Quiz CRUD |
| GET | `/api/instructor/submissions` | List submissions |
| GET/PUT | `/api/instructor/submissions/[id]` | Submission detail/grade |
| GET | `/api/instructor/certificates` | Certificate list |
| POST | `/api/instructor/courses/[id]/assignments` | Add assignment to course |

### 16.4 Analytics (4 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/instructor/analytics` | Main analytics data |
| GET | `/api/instructor/analytics/comparison` | Instructor vs platform |
| GET | `/api/instructor/analytics/insights` | AI-generated insights |
| GET | `/api/instructor/analytics/engagement` | Engagement heatmap |

### 16.5 Smart Assessment (6 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/instructor/assessment/outcomes` | Learning outcomes |
| POST | `/api/instructor/assessment/outcomes/create` | Create outcome |
| POST | `/api/instructor/assessment/outcomes/link` | Link to question |
| GET | `/api/instructor/assessment/question-analytics` | Question difficulty |
| GET | `/api/instructor/assessment/distractor-analysis` | MCQ distractor analysis |
| GET | `/api/instructor/assessment/quality-scores` | Assessment quality |
| POST | `/api/instructor/assessment/generate-insights` | AI assessment insights |

### 16.6 AI Tools (21 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/instructor/ai/generate-curriculum` | Course outline |
| POST | `/api/instructor/ai/generate-outcomes` | Learning outcomes |
| POST | `/api/instructor/ai/generate-lesson-content` | Lesson content |
| POST | `/api/instructor/ai/generate-quiz` | Quiz questions |
| POST | `/api/instructor/ai/generate-assignment` | Assignment + rubric |
| POST | `/api/instructor/ai/generate-rubric` | Standalone rubric |
| POST | `/api/instructor/ai/generate-description` | SEO course description |
| POST | `/api/instructor/ai/generate-thumbnail` | Course thumbnail |
| POST | `/api/instructor/ai/auto-respond` | Q&A auto-responder |
| POST | `/api/instructor/ai/auto-caption` | Caption + translate |
| POST | `/api/instructor/ai/analyze-feedback` | Feedback sentiment |
| POST | `/api/instructor/ai/course-insights` | Improvement insights |
| POST | `/api/instructor/ai/improve-bio` | Bio improvement |
| POST | `/api/instructor/ai/suggest-reply` | Message reply |
| POST | `/api/instructor/ai/assistant` | General AI assistant |
| GET | `/api/instructor/ai/assistant-messages` | Chat history |
| GET | `/api/instructor/ai/generations` | List generations |
| GET/DELETE | `/api/instructor/ai/generations/[id]` | Generation detail/delete |
| GET/POST | `/api/instructor/ai/templates` | Prompt templates |
| GET/PUT/DELETE | `/api/instructor/ai/templates/[id]` | Template CRUD |
| GET | `/api/instructor/ai/usage-stats` | AI usage stats |

### 16.7 AI Copilot (1 endpoint, 9 actions)

| Method | Endpoint | Actions |
|--------|----------|---------|
| POST | `/api/instructor/copilot` | generate-outline, generate-outcomes, generate-structure, generate-content, generate-quiz, generate-assignment, generate-rubric, improvement-insights, review-approve |
| GET | `/api/instructor/copilot` | Fetch saved records (by type) |

### 16.8 Finance (6 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/instructor/revenue` | Revenue data |
| GET | `/api/instructor/revenue/export` | Export CSV |
| POST | `/api/instructor/revenue/payout` | Request payout |
| GET/POST | `/api/instructor/payout-methods` | Payout methods |
| GET/PUT | `/api/instructor/financial-settings` | Financial settings |
| POST | `/api/instructor/refund` | Process refund |

### 16.9 Profile & Settings (7 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/api/instructor/profile` | Instructor profile |
| GET | `/api/instructor/profile-full` | Full profile + settings |
| GET/PUT | `/api/instructor/settings` | Settings |
| PUT | `/api/instructor/settings/account` | Account settings |
| PUT | `/api/instructor/settings/avatar` | Avatar upload |
| GET/DELETE | `/api/instructor/settings/sessions` | Session management |

### 16.10 Other (7 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/instructor/copilot` | AI Copilot |
| POST | `/api/instructor/quick-actions` | Quick actions |
| GET/POST | `/api/instructor/messages` | Messages |
| GET/POST | `/api/instructor/messages/[conversationId]` | Conversation |
| GET | `/api/instructor/messages/contacts` | Contacts |
| GET/PATCH | `/api/instructor/notifications` | Notifications |
| GET/PUT | `/api/instructor/qa` | Q&A management |
| GET/POST | `/api/instructor/schedule` | Schedule |

---

## 17. Database Schema — Instructor Models

### 17.1 Profile & Settings

```prisma
model InstructorProfile {
  id               String   @id @default(cuid())
  userId           String   @unique
  headline         String?
  expertise        String?  // JSON array
  bio              String?
  linkedin         String?
  website          String?
  youtube          String?
  ntn              String?  // National Tax Number
  cnic             String?
  applicationStatus String  @default("pending")
  // ... timestamps
}

model InstructorSettings {
  id                    String   @id @default(cuid())
  userId                String   @unique
  notifyEnrollment      Boolean  @default(true)
  notifyQA              Boolean  @default(true)
  notifyReview          Boolean  @default(true)
  notifyAssignment      Boolean  @default(true)
  notifyMessage         Boolean  @default(true)
  payoutSchedule        String   @default("monthly")
  payoutThreshold       Float    @default(50.0)
  integrations          String?  // JSON: Zoom, Mailchimp, Zapier
  theme                 String   @default("system")
  privacy               String   @default("public")
  timezone              String   @default("UTC")
  currency              String   @default("USD")
  language              String   @default("en")
  // ... timestamps
}
```

### 17.2 Application Flow

```prisma
model InstructorApplication {
  id              String   @id @default(cuid())
  userId          String
  fullName        String
  expertise       String
  experience      String
  motivation      String
  evaluationScore Float?
  status          String   @default("pending")
  // Status flow: pending → under_review → interview_scheduled → approved → onboarded
  // ... timestamps
}

model ApplicationTimeline {
  id          String   @id @default(cuid())
  applicationId String
  event       String
  fromStatus  String
  toStatus    String
  performedBy String?
  notes       String?
  // ... timestamps
}

model ApplicationInterview {
  id             String   @id @default(cuid())
  applicationId  String
  interviewType  String   // video, phone, in_person
  scheduledAt    DateTime
  meetingUrl     String?
  feedback       String?
  // ... timestamps
}
```

### 17.3 AI Generation Models

```prisma
model AIGeneration {
  id            String   @id @default(cuid())
  instructorId  String
  toolType      String
  inputParams   String?  // JSON
  resultContent String?  // JSON
  resultImages  String?  // JSON array
  isFavorite    Boolean  @default(false)
  // ... timestamps
}

model AITemplate {
  id           String   @id @default(cuid())
  instructorId String
  toolType     String
  name         String
  inputParams  String?  // JSON
  isDefault    Boolean  @default(false)
  usageCount   Int      @default(0)
  // ... timestamps
}

model AIAssistantMessage {
  id           String   @id @default(cuid())
  instructorId String
  role         String   // user, assistant
  content      String
  // ... timestamps
}

model AIGeneratedOutline {
  id               String   @id @default(cuid())
  instructorId     String
  courseId         String?
  prompt           String
  generatedContent String   // JSON
  editedContent    String?  // JSON (instructor's edits)
  status           String   @default("generated")
  reviewNotes      String?
  // ... timestamps
}

model AIGeneratedLesson {
  id               String   @id @default(cuid())
  instructorId     String
  courseId         String?
  topic            String
  structureContent String?  // JSON
  lessonContent    String?  // JSON
  editedContent    String?  // JSON
  status           String   @default("structure_generated")
  reviewNotes      String?
  // ... timestamps
}

model AIGeneratedQuiz {
  id               String   @id @default(cuid())
  instructorId     String
  courseId         String?
  topic            String
  questionTypes    String?  // JSON array
  difficulty       String?
  questionCount    Int?
  generatedContent String   // JSON
  editedContent    String?  // JSON
  status           String   @default("generated")
  reviewNotes      String?
  // ... timestamps
}

model AIGeneratedAssignment {
  id               String   @id @default(cuid())
  instructorId     String
  courseId         String?
  topic            String
  difficulty       String?
  generatedContent String   // JSON
  editedContent    String?  // JSON
  status           String   @default("generated")
  reviewNotes      String?
  // ... timestamps
}

model AIGeneratedRubric {
  id               String   @id @default(cuid())
  instructorId     String
  courseId         String?
  assignmentId     String?
  topic            String
  generatedContent String   // JSON
  editedContent    String?  // JSON
  status           String   @default("generated")
  reviewNotes      String?
  // ... timestamps
}

model InstructorAIActivity {
  id           String   @id @default(cuid())
  instructorId String
  activityType String
  moduleType   String
  title        String
  metadata     String?  // JSON
  // ... timestamps
}
```

### 17.4 Assessment Models

```prisma
model LearningOutcome {
  id          String   @id @default(cuid())
  courseId    String
  title       String
  description String?
  // Relations: questionOutcomes → QuestionOutcome[]
  // ... timestamps
}

model QuestionOutcome {
  id         String @id @default(cuid())
  questionId String
  outcomeId  String
  // Composite unique: [questionId, outcomeId]
}

model QuestionAnalytics {
  id              String  @id @default(cuid())
  questionId      String  @unique
  attempts        Int     @default(0)
  correctCount    Int     @default(0)
  successRate     Float   @default(0)
  difficultyScore Float   @default(0)
  difficultyLevel String  @default("normal")
  // ... timestamps
}

model DistractorAnalytics {
  id             String  @id @default(cuid())
  questionId     String
  optionLabel    String  // A-H
  selectionCount Int     @default(0)
  selectionRate  Float   @default(0)
  isWeak         Boolean @default(false)
  // Composite unique: [questionId, optionLabel]
  // ... timestamps
}

model AssessmentQualityScore {
  id               String  @id @default(cuid())
  courseId         String  @unique
  difficultyBalance Float  @default(0)
  questionVariety  Float   @default(0)
  outcomeCoverage  Float   @default(0)
  distractorQuality Float  @default(0)
  overallScore     Float   @default(0)
  // ... timestamps
}
```

### 17.5 Finance Models

```prisma
model CommissionOverride {
  id            String  @id @default(cuid())
  instructorId  String
  commissionRate Float
  reason        String?
  createdBy     String?
  // ... timestamps
}

model PayoutMethod {
  id           String  @id @default(cuid())
  instructorId String
  type         String  // bank, jazzcash, easypaisa, payoneer, stripe
  bankName     String?
  accountNumber String?
  iban         String?
  swiftCode    String?
  phoneNumber  String?
  email        String?
  isDefault    Boolean @default(false)
  // ... timestamps
}

model Payout {
  id           String   @id @default(cuid())
  instructorId String
  amount       Float
  status       String   @default("pending")
  period       String?
  method       String?
  disputeStatus String?
  taxWithheld  Float    @default(0)
  // ... timestamps
}
```

### 17.6 Q&A Settings

```prisma
model QASettings {
  id                  String  @id @default(cuid())
  instructorId        String  @unique
  autoAnswer          Boolean @default(false)
  emailNotifications  Boolean @default(true)
  maxQuestionsPerDay  Int     @default(50)
  // ... timestamps
}
```

---

## 18. Component Library

### 18.1 Instructor Stat Card

**File:** `src/components/instructor/instructor-stat-card.tsx`

A premium stat card component with:

**8 Color Tokens:**
| Token | Gradient | Use Case |
|-------|----------|----------|
| `emerald` | emerald-500→teal-600 | Students, engagement |
| `teal` | teal-500→cyan-600 | Courses |
| `cyan` | cyan-500→sky-600 | Analytics |
| `amber` | amber-500→orange-600 | Revenue, assignments |
| `rose` | rose-500→pink-600 | Alerts, risk |
| `violet` | violet-500→purple-600 | AI features |
| `orange` | orange-500→red-600 | Progress |
| `pink` | pink-500→rose-600 | Ratings |

**3 Size Variants:**
| Size | Padding | Font Size | Use Case |
|------|---------|-----------|----------|
| `sm` | p-3 | text-xs | Compact grids |
| `md` | p-4 | text-sm | Default |
| `lg` | p-6 | text-base | Featured cards |

**Features:**
- Mini sparkline (5 data points)
- Trend indicator (up/down/neutral with color)
- Skeleton loader variant
- Context API for size propagation

### 18.2 Course Creator Components

**Directory:** `src/components/creator/`

| File | Component | Purpose |
|------|-----------|---------|
| `step1-basics.tsx` | Course basics form | Title, category, level, language |
| `step2-curriculum.tsx` | Curriculum builder | Modules, lessons, reordering |
| `step3-content.tsx` | Content editor | Lesson content, quizzes |
| `step4-pricing.tsx` | Pricing & SEO | Price, discount, keywords |
| `step5-seo.tsx` | SEO optimization | Meta title, description |
| `step6-review.tsx` | Review & publish | Final review before publish |
| `ai-panel.tsx` | AI assistant | In-wizard AI content generation |
| `types.ts` | Type definitions | Creator-specific types |
| `constants.ts` | Constants | Categories, levels, languages |

### 18.3 Recharts Visualizations

The instructor portal uses **Recharts** for all data visualizations:

| Chart Type | Component | Used In |
|-----------|-----------|---------|
| AreaChart | Revenue, Enrollment trends | Dashboard, Analytics |
| Stacked AreaChart | Revenue by day (per-course) | Dashboard |
| PieChart | Student distribution | Analytics |
| BarChart | Category breakdown | Analytics |
| ComposedChart | Enrollment forecast + CI | Analytics |

### 18.4 Animation System

All instructor views use **Framer Motion** for:

| Animation | Implementation | Use Case |
|-----------|---------------|----------|
| Page entry | `initial={{ opacity: 0, y: 20 }}` `animate={{ opacity: 1, y: 0 }}` | All views |
| Card stagger | `transition={{ delay: i * 0.06 }}` | Tool grid, stat cards |
| Expand/collapse | `AnimatePresence` + height animation | Accordion sections |
| Hover scale | `whileHover={{ scale: 1.02 }}` | Interactive cards |
| Tab indicator | `layoutId` + spring animation | Tab switching |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Instructor View Components | 20 |
| Instructor API Routes | 74 |
| AI Tool Endpoints | 21 |
| AI Copilot Actions | 9 |
| AI Tool Types (Copilot View) | 11 |
| Database Models (Instructor-specific) | 23 |
| Navigation Items | 15 |
| Stat Card Color Tokens | 8 |
| Assessment Tabs | 5 |
| Analytics Data Sections | 17 |
| Supported Caption Languages | 10 |
| Payout Methods | 5 |
| Settings Tabs | 8 |

---

## Appendix A: AI Tool Form Field Reference

| Tool | Fields | Required | Optional |
|------|--------|----------|----------|
| Curriculum | topic, audience, level, sections | topic | audience, level, sections |
| Outcomes | topic, framework, level, count | topic | framework, level, count |
| Lesson Content | topic, outline, style, audience | topic | outline, style, audience |
| Quiz | topic, sourceText, count, difficulty | topic OR sourceText | sourceText, count, difficulty |
| Assignment | skill, type, course | skill | type, course |
| Rubric | topic, assignmentType, criteriaCount, gradingScale | topic | assignmentType, criteriaCount, gradingScale |
| Description | topic, keywords, tone | topic | keywords, tone |
| Caption | content, sourceType, targetLanguage | content | sourceType, targetLanguage |
| Q&A Responder | question, context | question | context |
| Feedback Analyzer | reviews | reviews | — |
| Insights | courseName, focus | — | courseName, focus |

## Appendix B: AI Response Schema Reference

| Tool | Top-Level Keys | Nested Structures |
|------|---------------|-------------------|
| Curriculum | `modules[]`, `content` | modules: title, description, objectives[], lessons[] |
| Quiz | `questions[]`, `meta`, `content` | questions: type, text, options[], correctAnswer, explanation, points |
| Assignment | `assignment`, `content` | assignment: title, objectives[], instructions, deliverables[], rubric[] |
| Q&A Responder | `answer`, `content` | answer: answer, keyPoints[], relatedTopics[], confidence |
| Feedback Analyzer | `analysis`, `content` | analysis: topPraise[], topIssues[], sentiment{}, improvementTips[] |
| Insights | `insights[]`, `overallScore`, `quickWins[]`, `longTermGoals[]` | insights: title, description, severity, category, action, impact, effort |

## Appendix C: Error Handling Patterns

All AI endpoints follow consistent error handling:

| Scenario | HTTP Status | Response |
|----------|------------|----------|
| Missing required field | 400 | `{ error: "Field is required" }` |
| Unauthorized access | 403 | `{ error: "Unauthorized" }` |
| Resource not found | 404 | `{ error: "Not found" }` |
| AI empty response | 422 | `{ error: "AI generated an empty response. Please try again." }` |
| AI generation failure | 500 | `{ error: "Failed to generate X" }` |
| JSON parse failure | 200 | `{ content: rawText }` (fallback) |

---

*End of Instructor Portal Implementation Documentation*
