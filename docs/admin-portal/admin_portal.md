# ShijlAI Academy — Admin Portal: Complete Implementation Documentation

> **AI-Powered Platform Intelligence & Administration System**
> Authors: Sadeed Ali [1447], Syed Awais Shah [1457]
> University of Malakand — Department of Computer Science & IT

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Admin Portal Shell](#2-admin-portal-shell)
3. [Dashboard](#3-dashboard)
4. [AI Admin Copilot — Decision Intelligence](#4-ai-admin-copilot--decision-intelligence)
5. [AI System Intelligence — 5 Intelligence Engines](#5-ai-system-intelligence--5-intelligence-engines)
6. [ShijlAI Hub — AI Report Generator & Course Quality Analyzer](#6-shijlai-hub--ai-report-generator--course-quality-analyzer)
7. [Intelligent Analytics](#7-intelligent-analytics)
8. [User Management](#8-user-management)
9. [Instructor Management & Applications](#9-instructor-management--applications)
10. [Course Management & Review](#10-course-management--review)
11. [Revenue & Finance with AI Forecasting](#11-revenue--finance-with-ai-forecasting)
12. [AI Configuration](#12-ai-configuration)
13. [Gamification Management](#13-gamification-management)
14. [Security Center](#14-security-center)
15. [Notifications & Appearance](#15-notifications--appearance)
16. [Platform Settings & Dev Tools](#16-platform-settings--dev-tools)
17. [Audit Log](#17-audit-log)
18. [Blog Management](#18-blog-management)
19. [State Management](#19-state-management)
20. [API Reference — Complete Route Catalog](#20-api-reference--complete-route-catalog)
21. [Database Schema — Admin Models](#21-database-schema--admin-models)
22. [Component Library](#22-component-library)

---

## 1. Architecture Overview

### 1.1 SPA Architecture within Admin Portal

The Admin Portal follows the same SPA pattern as the rest of ShijlAI Academy. All admin views are lazy-loaded client components dispatched from the shared `page.tsx` via the Zustand `currentView` state. The admin shell conditionally renders when `currentUser?.role === 'admin'`.

```
Admin Navigation → Zustand Store (currentView) → View Resolver → Lazy-Loaded Component
```

### 1.2 Three-Tier Data Flow

```
┌─────────────────────────────────────────────────┐
│                 PRESENTATION LAYER               │
│  React 19 + Next.js 16 + Tailwind CSS 4         │
│  22+ admin views • 33 admin components           │
│  Framer Motion • Recharts • shadcn/ui            │
│  Multi-currency support (5 currencies)            │
└──────────────────────┬──────────────────────────┘
                       │ REST API (fetch)
┌──────────────────────▼──────────────────────────┐
│                APPLICATION LAYER                  │
│  65+ API endpoints under /api/admin/              │
│  5 Intelligence Engines (rule-based + LLM)        │
│  AI Copilot with 9 intent classifiers             │
│  AI Report Generator (5 report types)             │
│  Course Quality Analyzer (5 dimensions + AI)      │
│  Revenue Forecasting (linear regression)           │
│  z-ai-web-dev-sdk for all LLM features            │
└──────────────────────┬──────────────────────────┘
                       │ Prisma ORM
┌──────────────────────▼──────────────────────────┐
│                   DATA LAYER                      │
│  SQLite (dev) / MySQL (prod)                      │
│  87+ Database Models                              │
│  CourseQualityAnalysis • GeneratedReport           │
│  FeatureFlag • AuditLog • FinancialSettings        │
│  Security models (BlockedIP, APIKey, LoginAlert)   │
└─────────────────────────────────────────────────┘
```

### 1.3 AI Intelligence Pipeline — Admin

```
Admin Request (chat / analytics / report)
    │
    ▼
┌──────────────────────────────────────────┐
│  AI Admin Copilot                        │
│  3-module pipeline:                      │
│  1. Intent Detection (9 intents)        │
│  2. Data Retrieval (8 fetchers)          │
│  3. LLM Reasoning (z-ai-web-dev-sdk)    │
│  Falls back to rule-based analysis       │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  System Intelligence Engine              │
│  5 parallel engines:                     │
│  • Platform Health (DAU/WAU/MAU)        │
│  • Engagement Intelligence (per-course)  │
│  • Course Intelligence (health scores)   │
│  • Instructor Intelligence (effectiveness)│
│  • Alert & Anomaly (8 rules)            │
│  + LLM-generated insights overlay       │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  ShijlAI Hub                             │
│  • AI Report Generator (5 types × 3     │
│    periods, LLM executive summary)       │
│  • Course Quality Analyzer (5 weighted   │
│    dimensions, AI content scoring)       │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Finance Forecasting                     │
│  Linear regression with confidence       │
│  levels for revenue projection           │
└──────────────────────────────────────────┘
```

---

## 2. Admin Portal Shell

### 2.1 Component: `admin-shell.tsx` (~787 lines)

**Three exported components:**

| Component | Purpose |
|-----------|---------|
| `AdminSidebar` | Desktop sidebar (collapsible 260px/68px) + mobile Sheet drawer |
| `AdminHeader` | Sticky glass header with search, alerts, notifications |
| `AdminBottomTabBar` | Mobile bottom bar with 4 primary items + "More" sheet |

**Desktop Layout (>768px):**
```
┌───────────────────────────────────────────────────────┐
│ AdminHeader (sticky, glassmorphism)                    │
│ [☰] [ShijlAI Academy] [🔍 Search...] [⚠️3] [🔔5] [▼]│
├──────────┬────────────────────────────────────────────┤
│ Sidebar  │                                            │
│ (260px)  │           Main Content Area                │
│          │     (lazy-loaded view component)            │
│  Admin   │                                            │
│  Panel   │                                            │
│ ──────── │                                            │
│ Dashboard│                                            │
│ Users    │                                            │
│ Courses  │                                            │
│ AI Cop.  │                                            │
│ ...22    │                                            │
│ items    │                                            │
│          │                                            │
│ [🌙][❓] │                                            │
│ [Logout] │                                            │
├──────────┴────────────────────────────────────────────┤
└───────────────────────────────────────────────────────┘
```

### 2.2 Sidebar Navigation (22 Items, 5 Sections)

**Section: Dashboard**
| # | Label | Icon | View Key |
|---|-------|------|----------|
| 1 | Dashboard | `LayoutDashboard` | `admin` |

**Section: Platform**
| # | Label | Icon | View Key |
|---|-------|------|----------|
| 2 | Users | `Users` | `admin-users` |
| 3 | Instructors | `GraduationCap` | `admin-instructors` |
| 4 | Applications | `ClipboardCheck` | `admin-applications` |
| 5 | Courses | `BookOpen` | `admin-courses` |
| 6 | Course Review | `FileCheck` | `admin-course-review` |
| 7 | Q&A & Reports | `MessageSquare` | `admin-qa-reports` |
| 8 | Intelligent Analytics | `Brain` | `admin-analytics` |
| 9 | AI Copilot | `Sparkles` | `admin-copilot` |
| 10 | AI System Intelligence | `Cpu` | `admin-system-intelligence` |
| 11 | ShijlAI Hub | `Hexagon` | `admin-shijlai-hub` |
| 12 | Blog | `Newspaper` | `admin-blog` |

**Section: Finance**
| # | Label | Icon | View Key |
|---|-------|------|----------|
| 13 | Revenue | `DollarSign` | `admin-revenue` |
| 14 | Payouts | `Wallet` | `admin-payouts` |
| 15 | Refunds | `RotateCcw` | `admin-refunds` |

**Section: Operations**
| # | Label | Icon | View Key |
|---|-------|------|----------|
| 16 | Marketing | `Megaphone` | `admin-marketing` |
| 17 | Notifications | `Bell` | `admin-notifications` |
| 18 | Live Sessions | `Video` | `admin-live-sessions` |
| 19 | Gamification | `Trophy` | `admin-gamification` |

**Section: System**
| # | Label | Icon | View Key |
|---|-------|------|----------|
| 20 | AI Config | `Bot` | `admin-ai-config` |
| 21 | Appearance | `Palette` | `admin-appearance` |
| 22 | Security | `Shield` | `admin-security` |
| 23 | Settings | `Settings` | `admin-settings` |
| 24 | Audit Log | `ScrollText` | `admin-audit-log` |
| 25 | Dev Tools | `Terminal` | `admin-dev-tools` |

### 2.3 Admin Header Components

| Component | Description |
|-----------|-------------|
| Hamburger Menu | Opens sidebar Sheet drawer on mobile |
| Brand Logo | "ShijlAI Academy" text |
| Inline Search | Search with scope: `admin` |
| Warning Alerts | Platform-level warning count |
| Notification Bell | Popover with mark-as-read |
| Role Switcher | Switch between student/instructor/admin |
| User Avatar | Profile link, Logout |

### 2.4 Mobile Bottom Tab Bar

4 primary tabs + "More" sheet with all 22 remaining items:

| Tab | Icon | View |
|-----|------|------|
| Home | `Home` | `admin` |
| Users | `Users` | `admin-users` |
| Copilot | `Sparkles` | `admin-copilot` |
| More | `MoreHorizontal` | Sheet with 22 items |

---

## 3. Dashboard

### 3.1 Component: `admin-dashboard-v2.tsx` (~1305 lines)

**API Endpoint:** `GET /api/admin/dashboard?period={7-365}`

### 3.2 Dashboard Layout

```
┌───────────────────────────────────────────────────────────────┐
│  Welcome, Admin! 👋                    [USD▼] [7d] [30d]    │
├──────────┬──────────┬──────────┬──────────┬──────────┬───────┤
│ 👥 1.2K  │ 💰 $45K  │ 📚 28    │ ⭐ 4.6   │ 📊 72%   │ 🎯84%│
│ Students │ Revenue  │ Courses  │ Rating   │ Complet. │ Eng.  │
│ +12% MoM │ +8.3%    │ +2 new   │ +0.2     │ +5%      │ +3%   │
├──────────┴──────────┴──────────┴──────────┴──────────┴───────┤
│  ⚠️ Urgent Items (6)                                         │
│  3 courses awaiting review | 2 refund requests | 1 security  │
├───────────────────────────────────────────────────────────────┤
│  💓 Platform Pulse (real-time)                                │
│  🟢 142 online | 23 watching | 8 quizzing | 5 in AI tutor   │
├───────────────────────────────────────────────────────────────┤
│  Revenue & Enrollment Chart (6 months)                        │
├───────────────────────────────────────────────────────────────┤
│  Top Courses         │  Top Instructors     │  User Growth    │
│  (by enrollment)     │  (by revenue)        │  Chart          │
├──────────────────────┴──────────────────────┴─────────────────┤
│  Recent Activity (last 10 events)                             │
├───────────────────────────────────────────────────────────────┤
│  Revenue Breakdown (by source)                                │
│  Course Sales | Subscriptions | Platform Fees | Certifications│
├───────────────────────────────────────────────────────────────┤
│  🤖 AI Usage Stats                                            │
│  1,250 tutor sessions | 340 AI generations | 5K chat messages │
├───────────────────────────────────────────────────────────────┤
│  System Health: 🟢 Online | 99.9% uptime | 45ms latency     │
├───────────────────────────────────────────────────────────────┤
│  Feature Flags | Announcements Manager                        │
└───────────────────────────────────────────────────────────────┘
```

### 3.3 Dashboard Data Sections (20+)

| # | Section | Data Source | Key Metrics |
|---|---------|-----------|-------------|
| 1 | Platform Health | User/Course/Enrollment aggregation | Total users, students, courses, revenue, signups, completion |
| 2 | Revenue Chart | Transactions | Last 6 months revenue + enrollment |
| 3 | Urgent Items | Activity logs | Awaiting review, refunds, flagged, security, applications |
| 4 | Platform Pulse | Real-time activity | Users online, watching, quizzing, AI tutor, server status |
| 5 | Top Courses | Course enrollment + revenue | Top 5 by enrollment |
| 6 | Recent Activity | Activity log | Last 10 entries |
| 7 | User Distribution | User roles | Students/instructors/admins/parents |
| 8 | Category Distribution | Course categories | Courses + enrollments per category |
| 9 | Recent Signups | User records | Last 5 new users |
| 10 | Daily Activity | DailyActivity | Last 7 days: activeUsers, xpEarned, lessonsCompleted |
| 11 | Content Moderation | Review flags | Pending reviews, reported content, flagged users |
| 12 | Revenue Breakdown | Transactions by source | Course Sales, Subscriptions, Fees, Certifications, Refunds |
| 13 | System Health | Server metrics | Uptime, DB query time, status |
| 14 | Top Instructors | Instructor revenue | Top 5 by revenue |
| 15 | Enrollment Trends | Enrollments | Last 14 days: date, enrollments, revenue |
| 16 | Engagement Metrics | Activity aggregation | Avg session, lessons/day, quiz pass rate, streaks |
| 17 | AI Usage Stats | AI activity records | Tutor sessions, generations, chat messages |
| 18 | User Growth Chart | User registration | Last 6 months: users, students, instructors |
| 19 | System Alerts | Activity logs | Warning/error/critical alerts |
| 20 | Instructor Applications | Applications | Last 20 pending |

### 3.4 Multi-Currency Support

The admin dashboard includes a `CurrencyProvider` context supporting:

| Currency | Code | Symbol |
|----------|------|--------|
| US Dollar | USD | $ |
| Euro | EUR | € |
| British Pound | GBP | £ |
| UAE Dirham | AED | د.إ |

Currency selection persists to localStorage.

---

## 4. AI Admin Copilot — Decision Intelligence

### 4.1 Overview

The AI Admin Copilot is a **conversational decision intelligence** system that allows admins to ask natural-language questions about their platform and receive data-driven AI analysis.

**Component:** `admin-copilot-view.tsx` (~850 lines)
**API Endpoint:** `POST /api/admin/copilot`
**Sidebar Endpoint:** `GET /api/admin/copilot?adminId={id}`

### 4.2 Three-Module Pipeline

```
Admin Query: "Which courses need attention right now?"
    │
    ▼
┌──────────────────────────────────────────────────────┐
│  MODULE 1: Intent Detection Engine                   │
│  Keyword-based NLP classifies the query into         │
│  one of 9 intents for targeted data retrieval        │
│  Detected: course_analysis                           │
└────────┬─────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│  MODULE 2: Data Retrieval Engine                     │
│  Fetches real DB data based on detected intent       │
│  Falls back to demo data if DB is empty              │
│  Fetcher: fetchCourseAnalysisData()                  │
│  Returns: course ratings, completion rates, warnings  │
└────────┬─────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│  MODULE 3: LLM Reasoning Layer                      │
│  Uses z-ai-web-dev-sdk for AI-generated analysis     │
│  System prompt enforces: data-driven, concise,       │
│  specific numbers, 2-3 recommended actions           │
│  Falls back to rule-based analysis if LLM fails      │
└────────┬─────────────────────────────────────────────┘
         │
         ▼
  Response: { message, intent, recommendations[] }
```

### 4.3 Intent Classification (9 Intents)

| Intent | Keywords | Data Fetcher |
|--------|----------|-------------|
| `course_analysis` | course, courses, curriculum, content | `fetchCourseAnalysisData()` |
| `instructor_analysis` | instructor, instructors, teacher, teaching | `fetchInstructorAnalysisData()` |
| `student_analysis` | student, students, learner, learning | `fetchStudentAnalysisData()` |
| `engagement_analysis` | engagement, active, participation, interaction | `fetchEngagementData()` |
| `enrollment_analysis` | enrollment, enroll, sign-up, registration | `fetchEnrollmentData()` |
| `risk_analysis` | risk, at-risk, danger, warning, critical | `fetchRiskAnalysisData()` |
| `report_generation` | report, summary, statistics, overview | `fetchPlatformOverview()` |
| `search` | find, search, lookup, who, which | `fetchSearchData(query)` |
| `platform_overview` | platform, overall, general, summary | `fetchPlatformOverview()` |

### 4.4 Intent Color Coding

| Intent | Color | Badge Style |
|--------|-------|-------------|
| `course_analysis` | Teal | `bg-teal-500/10 text-teal-600` |
| `instructor_analysis` | Fuchsia | `bg-fuchsia-500/10 text-fuchsia-600` |
| `student_analysis` | Violet | `bg-violet-500/10 text-violet-600` |
| `engagement_analysis` | Emerald | `bg-emerald-500/10 text-emerald-600` |
| `enrollment_analysis` | Sky | `bg-sky-500/10 text-sky-600` |
| `risk_analysis` | Red | `bg-red-500/10 text-red-600` |
| `report_generation` | Amber | `bg-amber-500/10 text-amber-600` |
| `search` | Cyan | `bg-cyan-500/10 text-cyan-600` |
| `platform_overview` | Blue | `bg-blue-500/10 text-blue-600` |

### 4.5 Data Fetchers (8 Functions)

Each fetcher queries the database and returns structured data with demo fallbacks:

| Fetcher | DB Queries | Fallback Demo |
|---------|-----------|---------------|
| `fetchCourseAnalysisData()` | Courses with enrollments, ratings, completion | 5 demo courses |
| `fetchInstructorAnalysisData()` | Instructors with courses, students, ratings | 5 demo instructors |
| `fetchStudentAnalysisData()` | Students with enrollments, progress, risk | At-risk/inactive/failing stats |
| `fetchEngagementData()` | DailyActivity, lesson progress | DAU/WAU/MAU stats |
| `fetchEnrollmentData()` | Enrollments by date | 7-day trend |
| `fetchRiskAnalysisData()` | Aggregates course + instructor + student risks | Risk summary |
| `fetchSearchData(query)` | Pattern-matched DB search | Keyword-based results |
| `fetchPlatformOverview()` | Full platform aggregation | Comprehensive overview |

### 4.6 LLM Integration

**System Prompt:**
```
You are an AI admin copilot for the ShijlAI Academy platform.
You have access to real platform data. Analyze the data and provide:
1. Data-driven analysis with specific numbers
2. Clear, concise insights
3. 2-3 actionable recommendations
Focus on actionable intelligence, not just descriptions.
```

**Response Format:**
```typescript
{
  message: string           // AI-generated analysis (Markdown)
  intent: string            // Classified intent
  recommendations: string[] // 2-3 follow-up actions
}
```

### 4.7 UI Layout

```
┌──────────────────────────────────────────────────────────────┐
│  🤖 AI Admin Copilot    [Intelligence]   [New Chat] [🔄]   │
├────────────────────────────────┬─────────────────────────────┤
│                                │  💡 Suggested Questions     │
│  Welcome Screen (if no msgs)   │  • Which courses need...    │
│  OR Chat Messages:             │  • Show at-risk students    │
│                                │  • Generate weekly report   │
│  [User] Which courses need     │─────────────────────────────│
│         attention?             │  🕐 Recent Insights         │
│                                │  • Course Analysis (2m ago) │
│  [AI] 🏷️ Course Analysis      │  • Risk Analysis (15m ago)  │
│  Based on current data...      │─────────────────────────────│
│  • 3 courses underperforming   │  🚨 Critical Alerts         │
│  • ML course dropped 23%       │  ⚠️ Low Engagement in ML    │
│                                │  ℹ️ Instructor Review Pending│
│  📊 Recommendations:           │─────────────────────────────│
│  → Review ML course content    │  ⚡ Copilot Intelligence     │
│  → Contact ML instructor       │  Analyzes platform data...  │
│                                │                             │
│  [Type your question...] [↑]   │                             │
│  [Courses][Students][Instr.][Risks][Report]                  │
└────────────────────────────────┴─────────────────────────────┘
```

### 4.8 Default Suggested Questions

1. "Which courses need attention?"
2. "Show at-risk students"
3. "Generate weekly report"
4. "Why are enrollments declining?"
5. "What requires immediate attention?"
6. "Which instructors need review?"
7. "How many students are inactive?"
8. "Platform summary this week"

### 4.9 Quick Action Chips

| Action | Pre-filled Query |
|--------|-----------------|
| Courses | "Which courses need attention right now?" |
| Students | "Show me at-risk students and their status" |
| Instructors | "Which instructors need review?" |
| Risks | "What are the current platform risks?" |
| Report | "Generate a platform summary report" |

---

## 5. AI System Intelligence — 5 Intelligence Engines

### 5.1 Overview

The AI System Intelligence view provides **operational reasoning** about platform health through 5 parallel intelligence engines, rule-based insights, and LLM-generated analysis.

**Component:** `admin-system-intelligence-view.tsx` (~1125 lines)
**API Endpoints:**
- `GET /api/admin/system-intelligence` — All intelligence data
- `POST /api/admin/system-intelligence/generate-insights` — LLM analysis

### 5.2 Five Intelligence Engines

#### Engine 1: Platform Health Engine

Computes core platform metrics:

| Metric | Computation |
|--------|-------------|
| DAU (Daily Active Users) | Count of users with activity today |
| WAU (Weekly Active Users) | Count of users active in last 7 days |
| MAU (Monthly Active Users) | Count of users active in last 30 days |
| Avg Session Duration | Mean time spent per session |
| Completion Rate | Avg course completion % |
| Retention Rate | % of WAU returning from last week |
| Trends | MoM changes for DAU, WAU, enrollment, completion |

#### Engine 2: Engagement Intelligence Engine

Per-course engagement breakdown with **5 sub-scores**:

| Sub-Score | Max Points | Data Source |
|-----------|-----------|-------------|
| Login Score | 0-20 | Login frequency (7 days) |
| Activity Score | 0-30 | Lesson completions, quiz attempts |
| Quiz Score | 0-20 | Quiz participation and pass rate |
| AI Score | 0-15 | AI tutor usage, AI companion interactions |
| Community Score | 0-15 | Q&A participation, forum activity |

**Total Engagement Score** = Login + Activity + Quiz + AI + Community (max 100)

**Platform Average Engagement** = mean of all course engagement scores

#### Engine 3: Course Intelligence Engine

**Health Score Formula:**
```
Health Score = enrollmentGrowth × 0.25
             + completionRate × 0.25
             + avgRating × 0.20
             + engagementRate × 0.15
             + assessmentScore × 0.15
```

**Status Classification:**

| Score Range | Status | Visual |
|------------|--------|--------|
| ≥65 | `healthy` | 🟢 Emerald ring + badge |
| 40-64 | `at_risk` | 🟡 Amber ring + badge |
| <40 | `critical` | 🔴 Red ring + badge + pulse animation |

**Per-Course Display:**
- Health score ring (SVG, color-coded)
- Status badge (healthy/at_risk/critical)
- Instructor name
- Metrics: enrollmentGrowth, completionRate, avgRating, engagementRate, assessmentScore

#### Engine 4: Instructor Intelligence Engine

**Effectiveness Score Formula:**
```
Effectiveness = completionRate × 0.30
              + avgRatings × 0.25
              + studentSuccessRate × 0.25
              + engagementScore × 0.20
```

**Auto-Generated Warnings:**

| Warning | Condition |
|---------|-----------|
| Slow Q&A Response | Average response time > 48 hours |
| Low Ratings | Average rating < 3.5 |
| Low Completion | Course completion rate < 40% |
| No New Enrollments | 0 new enrollments in last 30 days |
| Instructor Inactive | No activity in 14+ days |

#### Engine 5: Alert & Anomaly Engine

**8 Alert Rules:**

| # | Rule | Condition | Severity |
|---|------|-----------|----------|
| 1 | Enrollment Drop | Course enrollment dropped >20% | Warning |
| 2 | Completion Decrease | Course completion decreased >15% | Warning |
| 3 | Instructor Slow Response | Q&A response time >48h | Warning |
| 4 | Student Inactivity | Student inactive 14+ days | Info |
| 5 | Quiz Score Drop | Course quiz scores dropped >20% | Critical |
| 6 | Enrollment Spike | Course enrollment spiked >50% | Info |
| 7 | Low Course Rating | Course rating <3.0 | Warning |
| 8 | Instructor No Enrollments | Instructor has 0 new enrollments in 30 days | Info |

### 5.3 Rule-Based Insights

The intelligence engine generates insights across categories:

| Category | Types | Examples |
|----------|-------|---------|
| Platform Health | positive/negative | "DAU increased 12% this week" |
| Engagement | positive/warning | "ML course engagement below platform average" |
| Course Intelligence | warning/negative | "3 courses at risk of becoming critical" |
| Instructor Intelligence | warning/neutral | "2 instructors have slow Q&A response times" |
| Alert Engine | warning/critical | "5 critical alerts requiring immediate attention" |

Each insight includes:
- **engine**: Source engine name
- **type**: positive/negative/neutral/warning
- **title**: Short description
- **description**: Detailed explanation
- **actionable**: Whether action can be taken
- **actionSuggestion**: Specific recommended action

### 5.4 LLM-Generated Analysis

**Endpoint:** `POST /api/admin/system-intelligence/generate-insights`

**Process:**
1. Frontend sends full system intelligence data as request body
2. LLM receives the data with instructions to generate:
   - Executive summary (2-3 sentences)
   - Top 3 risks
   - Top 3 recommendations
   - Key trend observations
3. Max 200 words, plain text with bullet points
4. Response stored and displayed in hero card

**UI Display:**
- Orange gradient hero card with "Generate AI Analysis" button
- Loading state with spinner and "Running AI analysis on platform data..."
- Result card with orange background, Zap icon, timestamp
- Error state with red alert card

### 5.5 Type Definitions

```typescript
interface SystemIntelligenceData {
  platformHealth: {
    totalStudents: number
    totalCourses: number
    totalEnrollments: number
    dailyActiveUsers: number
    weeklyActiveUsers: number
    monthlyActiveUsers: number
    avgSessionDuration: number
    completionRate: number
    retentionRate: number
    trends: {
      dauTrend: number
      wauTrend: number
      enrollmentTrend: number
      completionTrend: number
    }
  }
  engagement: {
    courseEngagement: CourseEngagement[]
    platformAverageEngagement: number
  }
  courseIntelligence: CourseIntelligenceItem[]
  instructorIntelligence: InstructorIntelligenceItem[]
  alerts: AlertItem[]
  insights: InsightItem[]
}
```

### 5.6 UI Sections

| Section | Description |
|---------|-------------|
| Header + KPI Cards | 4 stat cards: Students, Courses, DAU, Completion Rate |
| AI Intelligence Analysis | LLM-powered hero section with generate button |
| Rule-Based Insights | Scrollable list with type-colored left borders |
| Alert Center | 3-column grid: Critical/Warning/Info alerts |
| Course Intelligence | Sortable course list with health score rings |
| Instructor Intelligence | Ranked instructor list with effectiveness scores |

---

## 6. ShijlAI Hub — AI Report Generator & Course Quality Analyzer

### 6.1 Overview

The ShijlAI Hub is the **AI control center** for platform administration, containing two major AI-powered tools in a tabbed interface.

**Component:** `admin-shijlai-hub-view.tsx` (~866 lines)
**API Endpoints:**
- `GET /api/admin/reports` — List reports
- `POST /api/admin/reports` — Generate report
- `GET /api/admin/course-quality` — List quality analyses
- `POST /api/admin/course-quality` — Run quality analysis

### 6.2 Tab 1: AI Report Generator

#### Report Types (5)

| Type | Key | Icon | Description |
|------|-----|------|-------------|
| Platform Performance | `platform_performance` | `BarChart3` | Overall platform metrics |
| Course Performance | `course_performance` | `BookOpen` | Per-course analysis |
| Instructor Performance | `instructor_performance` | `GraduationCap` | Per-instructor analysis |
| Student Engagement | `student_engagement` | `Users` | Student activity metrics |
| AI Usage | `ai_usage` | `Bot` | AI feature usage analytics |

#### Report Periods (3)

| Period | Key | Date Range |
|--------|-----|-----------|
| Weekly | `weekly` | Last 7 days |
| Monthly | `monthly` | Last 30 days |
| Quarterly | `quarterly` | Last 90 days |

#### Report Generation Pipeline

```
1. Create GeneratedReport with status "generating"
2. Compute real metrics from DB (5 computation functions)
3. Use z-ai-web-dev-sdk LLM for executive summary
4. Update report with reportData + reportSummary
5. Return completed report
```

#### Metric Computation Functions

| Function | Metrics Computed |
|----------|----------------|
| `computePlatformPerformance()` | Total students, courses, enrollments, revenue, AI usage, completion rates |
| `computeCoursePerformance(courseId?)` | Per-course: completion, progress, quiz scores, ratings |
| `computeInstructorPerformance(instructorId?)` | Per-instructor: courses, students, ratings, completion |
| `computeStudentEngagement()` | Active/at-risk students, completed lessons, quiz attempts |
| `computeAIUsage()` | Usage by feature, tokens, cost, error rate |

#### Report Summary Structure (LLM-Generated)

```typescript
{
  executive_summary: string      // 2-3 sentence overview
  key_insights: string[]         // 3-5 key findings
  risks: string[]                // 2-3 risk items
  recommendations: string[]      // 2-3 actionable recommendations
}
```

#### UI Elements

- **Generate form**: Type selector + Period selector + Generate button
- **Quick stats**: Total reports, This month, Completed, Failed
- **Recent reports list**: Clickable cards with status badges
- **Report detail dialog**: Executive Summary, Key Insights, Risks, Recommendations, Computed Metrics grid

### 6.3 Tab 2: Course Quality Analyzer

#### Quality Dimensions (5, Weighted)

| Dimension | Weight | Icon | Computation |
|-----------|--------|------|-------------|
| Structure | 25% | `BookOpen` (blue) | Module/lesson count, objectives, outcomes |
| Assessment | 25% | `Target` (violet) | Quiz count, question variety, pass rate, assignments |
| Student Success | 20% | `Users` (emerald) | completionRate × 0.4 + avgProgress × 0.3 + quizScores × 0.3 |
| Engagement | 15% | `Zap` (amber) | Recent enrollments, lesson views, time spent |
| Content | 15% | `FileText` (rose) | **AI-assisted** via z-ai-web-dev-sdk: LLM rates 0-100 |

**Overall Quality Score:**
```
qualityScore = structureScore × 0.25
             + assessmentScore × 0.25
             + successScore × 0.20
             + engagementScore × 0.15
             + contentScore × 0.15
```

#### Quality Categories

| Score | Label | Color |
|-------|-------|-------|
| ≥90 | Excellent | Emerald |
| ≥75 | Good | Blue |
| ≥60 | Needs Improvement | Amber |
| <60 | Critical | Red |

#### AI Content Scoring

The Content dimension uses LLM evaluation:

```
System Prompt: "You are an expert educational content evaluator.
Rate this course content on a scale of 0-100 based on:
1. Clarity and organization
2. Learning objective alignment
3. Topic coverage completeness
4. Consistency and coherence"

Input: Course title, description, module/lesson structure
Output: { score: number, analysis: string }
```

#### Analysis Report Structure

```typescript
{
  strengths: string[]        // 3-5 strengths
  weaknesses: string[]       // 2-4 weaknesses
  recommendations: string[] // 2-4 improvement suggestions
}
```

#### UI Elements

- **Quality Overview**: Score ring (96px), category breakdown (Excellent/Needs Work/Critical counts), distribution bar
- **Course Health Dashboard**: Clickable course cards with:
  - Score ring (48px)
  - Mini quality bars per dimension (5 colored progress bars)
  - Category badge + student count
- **Analysis Detail Dialog**:
  - Overall score ring (80px) + quality badge
  - 5 dimension progress bars with weights
  - AI Analysis: Strengths (green dots), Weaknesses (amber dots), Recommendations (blue arrows)
  - Computed Metrics grid

---

## 7. Intelligent Analytics

### 7.1 Component: `admin-analytics-view.tsx` (~1018 lines)

**API Endpoint:** `GET /api/analytics/intelligent?userId={id}&role=admin`

### 7.2 Dual-Tab Interface

| Tab | Description |
|-----|-------------|
| **AI Insights** | Risk alerts, AI-generated insights (growth/risk/opportunity/achievement), course health analysis, instructor performance ranking |
| **Statistics** | Full chart library: user growth, enrollment trends, revenue charts, category distribution, engagement metrics |

### 7.3 AI Insights Types

| Type | Icon | Color | Description |
|------|------|-------|-------------|
| `growth` | 📈 TrendingUp | Emerald | Positive growth signals |
| `risk` | ⚠️ AlertTriangle | Rose | Risk factors identified |
| `opportunity` | 💡 Lightbulb | Amber | Growth opportunities |
| `achievement` | 🏆 Trophy | Violet | Milestones reached |

---

## 8. User Management

### 8.1 Component: `admin-user-management.tsx` (~1690 lines)

### 8.2 Features

| Feature | Description |
|---------|-------------|
| **Table with Filters** | Role, status, auth provider, MFA, date range |
| **Bulk Actions** | Suspend, verify, delete, export, notify |
| **Add User Dialog** | Create new user with role assignment |
| **Pagination** | Full pagination with page size selector |
| **Row Actions** | Edit, suspend, verify, delete, view detail |
| **Search** | Name, email, ID search |

### 8.3 User Detail View (~2139 lines)

| Tab | Description |
|-----|-------------|
| Overview | Profile, stats, risk flags |
| Enrollments | Course enrollment list with progress |
| Activity | Learning activity timeline |
| Notes | Admin notes about the user |

---

## 9. Instructor Management & Applications

### 9.1 Component: `admin-instructor-management.tsx` (~2248 lines)

### 9.2 Tabs

| Tab | Description |
|-----|-------------|
| All Instructors | Full instructor list with stats |
| Applications | New instructor application queue |
| Flagged | Instructors flagged for review |

### 9.3 Application Review Workflow

```
Submit → Pending → Under Review → [Approve / Reject / Request Info]
                                    ↓
                                Approved → Onboarded
```

### 9.4 Instructor Detail View (~2438 lines)

Full instructor profile with courses, earnings, performance metrics, and application history.

### 9.5 NTN Verification

NTN (National Tax Number) verification system for Pakistani instructors, with status tracking.

---

## 10. Course Management & Review

### 10.1 Component: `admin-course-management.tsx` (~2636 lines)

### 10.2 Course Detail Panel (6 Tabs)

| Tab | Description |
|-----|-------------|
| Overview | Course info, stats, instructor |
| Content | Modules and lessons tree |
| Overrides | Price/category overrides |
| Notes | Admin notes |
| Quality | Quality analysis results |
| Reviews | Student review list |

### 10.3 Course Review

**Component:** `admin-course-review.tsx` (~1126 lines)

Review workflow with checklist, AI analysis endpoint (`/api/admin/course-review/[id]/ai-analysis`), and bulk review actions.

---

## 11. Revenue & Finance with AI Forecasting

### 11.1 Component: `admin-revenue-finance.tsx` (~1185 lines)

### 11.2 Tabs (6)

| Tab | Description |
|-----|-------------|
| **Overview** | 6 stat cards, category/payment charts, forecast |
| **Transactions** | Transaction table with detail sheet |
| **Revenue Split** | Per-instructor revenue breakdown |
| **Refunds** | Refund management |
| **Forecast** | AI-powered revenue projection |
| **Settings** | Commission rates, payout schedule |

### 11.3 Revenue Forecasting Algorithm

**Endpoint:** `GET /api/admin/finance/forecast`

Uses **linear regression** on historical transaction data:

```
Revenue Forecast:
1. Aggregate daily revenue for past N days
2. Fit linear regression: revenue = slope × dayIndex + intercept
3. Project forward for 30 days
4. Compute confidence levels (high/medium/low) based on variance
5. Return: { historical[], projected[], confidence, totalProjected }
```

**Confidence Levels:**

| Level | Condition |
|-------|-----------|
| High | Low variance, consistent trend |
| Medium | Moderate variance |
| Low | High variance, inconsistent data |

---

## 12. AI Configuration

### 12.1 Component: `admin-ai-config.tsx` (~2287 lines)

### 12.2 Configuration Sections

| Section | Description |
|---------|-------------|
| **AI Models** | CRUD for LLM model configurations |
| **Providers** | AI provider management (OpenAI, Anthropic, etc.) |
| **Prompt Templates** | Template CRUD for system prompts |
| **Usage Logs** | AI usage tracking and logs |
| **Audit Log** | AI configuration change history |
| **Seed Data** | Seed default AI configurations |

### 12.3 API Routes

| Route | Methods |
|-------|---------|
| `/api/admin/ai-config` | GET, PUT |
| `/api/admin/ai-config/models` | GET, POST |
| `/api/admin/ai-config/models/[id]` | GET, PUT, DELETE |
| `/api/admin/ai-config/providers` | GET, POST |
| `/api/admin/ai-config/providers/[id]` | GET, PUT, DELETE |
| `/api/admin/ai-config/prompt-templates` | GET, POST |
| `/api/admin/ai-config/prompt-templates/[id]` | GET, PUT, DELETE |
| `/api/admin/ai-config/usage-logs` | GET |
| `/api/admin/ai-config/audit-log` | GET |
| `/api/admin/ai-config/seed` | POST |

---

## 13. Gamification Management

### 13.1 Component: `admin-gamification.tsx` (~1604 lines)

### 13.2 Gamification Elements

| Element | Description |
|---------|-------------|
| **Challenges** | Create/manage learning challenges |
| **Badges** | Badge design and award rules |
| **XP Rules** | XP earning rules per activity type |
| **Streak Rewards** | Streak-based reward configuration |
| **Reward Shop** | Items purchasable with ShijlCoins |
| **Levels** | Level progression configuration |
| **Leaderboard** | Leaderboard management |
| **Settings** | Gamification feature toggles |

---

## 14. Security Center

### 14.1 Component: `admin-security.tsx` (~1531 lines)

### 14.2 Security Sections

| Section | Description |
|---------|-------------|
| **Login Alerts** | Monitor suspicious login attempts |
| **Blocked IPs** | IP blocking management |
| **API Keys** | API key CRUD with permissions |
| **Security Roles** | Role-based access configuration |
| **Active Sessions** | Monitor and terminate sessions |
| **Seed Data** | Seed default security configuration |

### 14.3 API Routes

| Route | Methods |
|-------|---------|
| `/api/admin/security` | GET |
| `/api/admin/security/sessions` | GET |
| `/api/admin/security/roles` | GET |
| `/api/admin/security/login-alerts` | GET |
| `/api/admin/security/blocked-ips` | GET, POST |
| `/api/admin/security/api-keys` | GET, POST |
| `/api/admin/security/seed` | POST |

---

## 15. Notifications & Appearance

### 15.1 Notifications Center (~2417 lines)

| Section | Description |
|---------|-------------|
| **Templates** | Notification template CRUD |
| **Send** | Compose and send notifications |
| **History** | Notification delivery log |
| **Settings** | Notification preferences |

### 15.2 Appearance (~2248 lines)

| Section | Description |
|---------|-------------|
| **Color Scheme** | Platform-wide color configuration |
| **Typography** | Font and text styling |
| **Logo/Branding** | Logo upload and favicon |
| **Theme Presets** | Pre-built theme configurations |
| **Preview** | Live theme preview |
| **History** | Appearance change log |

---

## 16. Platform Settings & Dev Tools

### 16.1 Platform Settings (~2069 lines)

| Tab | Description |
|-----|-------------|
| **General** | Platform name, URL, language |
| **Payments** | Payment gateway configuration (5 methods) |
| **Legal Pages** | ToS, Privacy, Refund, Cookie, Instructor Agreement |
| **Integrations** | Anthropic, Cloudflare, Google Analytics |
| **Webhooks** | Webhook endpoint CRUD with test |
| **Email Templates** | Customizable email templates |

### 16.2 Dev Tools (~2203 lines)

| Section | Description |
|---------|-------------|
| **System Info** | Runtime environment details |
| **Cache Management** | Cache clear/flush |
| **Database Tools** | DB health, query stats |
| **Feature Flags** | Toggle platform features |
| **Maintenance Mode** | Enable/disable maintenance mode |

### 16.3 Platform Settings API

**Endpoint:** `PUT /api/admin/settings`

**Update Types:**

| Type | Fields |
|------|--------|
| `settings` | 60+ platform configuration fields |
| `paymentMethod` | Stripe, JazzCash, Easypaisa, Payoneer, Bank Transfer |
| `integration` | Anthropic, Cloudflare, Google Analytics |
| `legalPage` | ToS, Privacy, Refund, Cookie, Instructor Agreement |
| `webhook` | Create, update, delete, test endpoints |
| `testEmail` | Simulate email via SMTP |
| `clearCache` | Simulate cache clear |
| `systemHealth` | Uptime, DB health, memory usage |

---

## 17. Audit Log

### 17.1 Component: `admin-audit-log.tsx` (~933 lines)

**API Endpoint:** `GET /api/admin/audit-log`

### 17.2 Log Fields

| Field | Description |
|-------|-------------|
| Action | What was performed |
| Entity | What was affected |
| Performed By | Who performed the action |
| Timestamp | When it occurred |
| Details | Additional context |

**Filterable by:** Action type, entity type, user, date range

---

## 18. Blog Management

### 18.1 Component: `AdminBlogManagement.tsx` (~1521 lines)

**API Endpoints:**
- `GET /api/admin/blog` — List blog posts
- `POST /api/admin/blog` — Create post
- `GET /api/admin/blog/[id]` — Get post detail
- `PUT /api/admin/blog/[id]` — Update post
- `DELETE /api/admin/blog/[id]` — Delete post

---

## 19. State Management

### 19.1 Zustand Store — Admin State

```typescript
// From /src/lib/store.ts
interface AppState {
  // Admin-specific state
  selectedUserId: string | null
  selectedInstructorId: string | null
  currentView: string
  userRole: 'student' | 'instructor' | 'admin'
  // ... shared state
}
```

### 19.2 View Resolution

```typescript
// resolveViewKey('dashboard', 'admin') → 'admin'
```

### 19.3 Currency Provider

```typescript
// From /src/components/admin/currency-provider.tsx
interface CurrencyContext {
  currency: 'USD' | 'EUR' | 'GBP' | 'AED'
  setCurrency: (currency: string) => void
  formatAmount: (amount: number) => string
}
```

Persisted to localStorage under `shijlai-academy-currency`.

---

## 20. API Reference — Complete Route Catalog

### 20.1 Core APIs (3 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard data (20+ sections) |
| POST | `/api/admin/dashboard/actions` | Quick actions (maintenance, cache, payouts, export) |
| GET | `/api/admin/student-insights` | Student segmentation & trends |

### 20.2 AI Intelligence (4 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/copilot` | Sidebar data (suggestions, alerts, recent) |
| POST | `/api/admin/copilot` | Chat query with intent + recommendations |
| GET | `/api/admin/system-intelligence` | All intelligence data (5 engines) |
| POST | `/api/admin/system-intelligence/generate-insights` | LLM analysis |

### 20.3 User Management (4 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/users` | List/search/create users |
| GET/PATCH/DELETE | `/api/admin/users/[id]` | User detail, suspend/ban/verify |
| POST | `/api/admin/users/bulk` | Bulk actions |
| GET | `/api/admin/users/export` | CSV/JSON export |

### 20.4 Course Management (9 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/courses` | List/create courses |
| GET/PATCH/DELETE | `/api/admin/courses/[id]` | Course detail/actions |
| PUT | `/api/admin/courses/[id]/review` | Review (approve/reject/request_changes) |
| PATCH | `/api/admin/courses/[id]/flag` | Flag/unflag |
| POST | `/api/admin/courses/[id]/duplicate` | Duplicate course |
| POST | `/api/admin/courses/bulk` | Bulk actions |
| GET | `/api/admin/courses/export` | CSV export |
| GET | `/api/admin/courses/analytics` | Course analytics |
| GET/POST | `/api/admin/course-quality` | Quality analysis list/run |
| GET | `/api/admin/course-quality/[courseId]` | Single course quality |

### 20.5 Instructor Management (6 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/instructors` | List/create/promote |
| GET/PATCH | `/api/admin/instructors/[id]` | Detail, approve/suspend |
| POST | `/api/admin/instructors/bulk` | Bulk actions |
| GET | `/api/admin/instructors/export` | Export |
| GET | `/api/admin/instructor-applications` | List applications |
| PATCH | `/api/admin/instructor-applications/[id]` | Review application |

### 20.6 Course Review (4 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/course-review` | Review queue |
| GET | `/api/admin/course-review/[id]` | Review detail |
| POST | `/api/admin/course-review/[id]/ai-analysis` | AI-powered analysis |
| POST | `/api/admin/course-review/bulk` | Bulk review |

### 20.7 Finance (12 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/finance/overview` | Financial overview |
| GET | `/api/admin/finance/transactions` | Transaction list |
| GET | `/api/admin/finance/revenue-split` | Per-instructor split |
| GET | `/api/admin/finance/refunds` | Refund management |
| GET | `/api/admin/finance/forecast` | AI revenue forecast |
| GET | `/api/admin/finance/disputes` | Dispute management |
| GET | `/api/admin/finance/tax-reports` | Tax reports |
| GET/PUT | `/api/admin/finance/settings` | Financial settings |
| GET | `/api/admin/finance/payouts` | Payout list |
| GET | `/api/admin/finance/payouts/analytics` | Payout analytics |
| GET/PUT | `/api/admin/finance/payouts/settings` | Payout settings |
| GET | `/api/admin/finance/export` | Finance export |

### 20.8 Reports (2 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/reports` | List reports |
| POST | `/api/admin/reports` | Generate report (5 types × 3 periods) |

### 20.9 AI Configuration (10 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/api/admin/ai-config` | Configuration overview |
| GET/POST | `/api/admin/ai-config/models` | Model management |
| GET/PUT/DELETE | `/api/admin/ai-config/models/[id]` | Model CRUD |
| GET/POST | `/api/admin/ai-config/providers` | Provider management |
| GET/PUT/DELETE | `/api/admin/ai-config/providers/[id]` | Provider CRUD |
| GET/POST | `/api/admin/ai-config/prompt-templates` | Template management |
| GET/PUT/DELETE | `/api/admin/ai-config/prompt-templates/[id]` | Template CRUD |
| GET | `/api/admin/ai-config/usage-logs` | Usage tracking |
| GET | `/api/admin/ai-config/audit-log` | Config audit trail |
| POST | `/api/admin/ai-config/seed` | Seed defaults |

### 20.10 Security (7 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/security` | Security overview |
| GET | `/api/admin/security/sessions` | Active sessions |
| GET | `/api/admin/security/roles` | Role definitions |
| GET | `/api/admin/security/login-alerts` | Login alerts |
| GET/POST | `/api/admin/security/blocked-ips` | IP blocking |
| GET/POST | `/api/admin/security/api-keys` | API keys |
| POST | `/api/admin/security/seed` | Seed security data |

### 20.11 Settings (6 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/api/admin/settings` | Platform settings |
| GET/PUT | `/api/admin/appearance` | Theme settings |
| GET | `/api/admin/appearance/history` | Change history |
| GET | `/api/admin/appearance/theme-presets` | Theme presets |
| GET/POST | `/api/admin/announcements` | Announcement CRUD |
| GET/PUT | `/api/admin/platform-settings` | Platform-wide settings |

### 20.12 Other (9 routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/audit-log` | Audit log retrieval |
| GET/POST | `/api/admin/blog` | Blog post list/create |
| GET/PUT/DELETE | `/api/admin/blog/[id]` | Blog post detail/update/delete |
| GET | `/api/admin/feature-flags` | Feature flags |
| GET | `/api/admin/enrollments` | Enrollment data |
| GET | `/api/admin/course-thumbnails` | Thumbnail upload |
| GET/POST | `/api/admin/content-review` | Content moderation |
| GET/POST | `/api/admin/gamification/challenges` | Challenge CRUD |
| + 10 more gamification routes | | Badges, XP, streaks, rewards, levels, leaderboard, etc. |

---

## 21. Database Schema — Admin Models

### 21.1 Course Quality

```prisma
model CourseQualityAnalysis {
  id              String   @id @default(cuid())
  courseId        String   @unique
  qualityScore    Float    @default(0)
  structureScore  Float    @default(0)    // 25% weight
  assessmentScore Float    @default(0)    // 25% weight
  successScore    Float    @default(0)    // 20% weight
  engagementScore Float    @default(0)    // 15% weight
  contentScore    Float    @default(0)    // 15% weight (AI-scored)
  analysisReport  String?                 // JSON: strengths, weaknesses, recommendations
  status          String   @default("pending")
  // ... timestamps
}
```

### 21.2 Reports

```prisma
model GeneratedReport {
  id             String   @id @default(cuid())
  reportType     String   // platform_performance, course_performance, etc.
  period         String   // weekly, monthly, quarterly
  periodStart    DateTime
  periodEnd      DateTime
  reportData     String?  // JSON: computed metrics
  reportSummary  String?  // JSON: LLM-generated summary
  status         String   @default("generating")
  generatedBy    String
  // ... timestamps
}
```

### 21.3 Feature Flags

```prisma
model FeatureFlag {
  id          String  @id @default(cuid())
  key         String  @unique
  enabled     Boolean @default(true)
  rollout     Float   @default(100)   // Percentage rollout
  description String?
}
```

### 21.4 Announcements

```prisma
model Announcement {
  id        String   @id @default(cuid())
  title     String
  content   String
  type      String   // info, warning, success, error
  target    String   // all, students, instructors
  active    Boolean  @default(true)
  // ... timestamps
}
```

### 21.5 Audit Log

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  action      String
  entity      String
  entityId    String?
  performedBy String
  details     String?  // JSON
  // ... timestamps
}
```

### 21.6 Financial Settings

```prisma
model FinancialSettings {
  id                     String  @id @default(cuid())
  defaultCommissionRate  Float   @default(20)
  minimumPayoutAmount    Float   @default(50)
  payoutSchedule         String  @default("monthly")
  taxWithholdingEnabled  Boolean @default(false)
  taxWithholdingRate     Float   @default(0)
  currency               String  @default("USD")
  // Payment methods, integrations, etc.
}
```

### 21.7 Security Models

```prisma
model BlockedIP {
  id        String   @id @default(cuid())
  ipAddress String   @unique
  reason    String?
  blockedBy String
  // ... timestamps
}

model APIKey {
  id          String   @id @default(cuid())
  name        String
  key         String   @unique
  permissions String?  // JSON
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  // ... timestamps
}

model LoginAlert {
  id          String   @id @default(cuid())
  userId      String
  ipAddress   String
  userAgent   String?
  location    String?
  isSuspicious Boolean @default(false)
  // ... timestamps
}

model SecurityRole {
  id          String   @id @default(cuid())
  name        String   @unique
  permissions String?  // JSON
  description String?
}
```

---

## 22. Component Library

### 22.1 Admin Stat Card

**File:** `src/components/admin/admin-stat-card.tsx` (~382 lines)

**12 Color Tokens:**

| Token | Gradient | Use Case |
|-------|----------|----------|
| `blue` | blue→indigo | System metrics |
| `emerald` | emerald→teal | Growth, engagement |
| `teal` | teal→cyan | Students |
| `amber` | amber→orange | Revenue, warnings |
| `rose` | rose→pink | Risk, critical |
| `violet` | violet→purple | AI features |
| `orange` | orange→red | Performance |
| `pink` | pink→rose | Ratings |
| `cyan` | cyan→sky | Analytics |
| `red` | red→rose | Security alerts |
| `sky` | sky→blue | Courses |
| `slate` | slate→gray | General stats |

**3 Size Variants:**

| Size | Padding | Font | Use Case |
|------|---------|------|----------|
| `sm` | p-3 | text-xs | Compact grids |
| `md` | p-4 | text-sm | Default |
| `lg` | p-6 | text-base | Featured cards |

### 22.2 Chart Components

| Component | File | Chart Type |
|-----------|------|-----------|
| `PlatformGrowthChart` | platform-growth-chart.tsx | Area/Line chart |
| `RevenueBreakdownChart` | revenue-breakdown-chart.tsx | Revenue bars |
| `UserDistributionChart` | user-distribution-chart.tsx | Pie chart |
| `CategoryActivityCharts` | category-activity-charts.tsx | Bar charts |

### 22.3 Widget Components

| Component | File | Description |
|-----------|------|-------------|
| `PopularCoursesTable` | popular-courses-table.tsx | Course ranking table |
| `RecentSignups` | recent-signups.tsx | New user list |
| `SystemAlerts` | system-alerts.tsx | Alert feed |
| `SystemStatus` | system-status.tsx | Status indicators |
| `FeatureFlags` | feature-flags.tsx | Toggle switches |
| `StudentInsights` | student-insights.tsx | Insight analytics |
| `WelcomeHeader` | welcome-header.tsx | Greeting + currency selector |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Admin View Components | 22+ |
| Admin Feature Components | 33 |
| Admin API Routes | 65+ |
| AI Intelligence Engines | 5 |
| AI Copilot Intents | 9 |
| AI Report Types | 5 |
| Course Quality Dimensions | 5 |
| Alert Rules | 8 |
| Sidebar Navigation Items | 22 |
| Stat Card Color Tokens | 12 |
| Supported Currencies | 4 |
| Finance Tabs | 6 |
| Security Sections | 6 |
| Gamification Elements | 8 |
| Platform Settings Fields | 60+ |

---

## Appendix A: AI Feature Matrix

| AI Feature | LLM Used | Data Source | Output Format |
|-----------|----------|-------------|---------------|
| Admin Copilot | z-ai-web-dev-sdk | 8 data fetchers | Markdown + recommendations |
| System Intelligence Insights | z-ai-web-dev-sdk | 5 engine results | Plain text analysis |
| Report Generator | z-ai-web-dev-sdk | 5 computation functions | JSON: executive_summary, key_insights, risks, recommendations |
| Course Quality Content Score | z-ai-web-dev-sdk | Course structure | 0-100 score + analysis |
| Revenue Forecasting | Linear regression | Transaction history | Projected values + confidence |
| Course Review AI Analysis | z-ai-web-dev-sdk | Course data | Analysis report |

## Appendix B: Alert Rule Reference

| # | Rule | Condition | Severity | Entity Type |
|---|------|-----------|----------|-------------|
| 1 | Enrollment Drop | >20% decrease | Warning | Course |
| 2 | Completion Decrease | >15% decrease | Warning | Course |
| 3 | Slow Q&A Response | >48h average | Warning | Instructor |
| 4 | Student Inactivity | >14 days inactive | Info | Student |
| 5 | Quiz Score Drop | >20% decrease | Critical | Course |
| 6 | Enrollment Spike | >50% increase | Info | Course |
| 7 | Low Rating | <3.0 average | Warning | Course |
| 8 | No Enrollments | 0 in 30 days | Info | Instructor |

## Appendix C: Course Quality Dimension Weights

| Dimension | Weight | Score Range | Scoring Method |
|-----------|--------|------------|----------------|
| Structure | 25% | 0-100 | Module/lesson count, objectives, outcomes |
| Assessment | 25% | 0-100 | Quiz count, variety, pass rate, assignments |
| Student Success | 20% | 0-100 | completion×0.4 + progress×0.3 + quiz×0.3 |
| Engagement | 15% | 0-100 | Enrollments, views, time spent |
| Content | 15% | 0-100 | **LLM-evaluated** on clarity, alignment, coverage |

---

*End of Admin Portal Implementation Documentation*
