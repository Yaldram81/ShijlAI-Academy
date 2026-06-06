# ShijlAI Academy — Student Portal: Complete Implementation Documentation

> **AI-Powered Adaptive Learning Platform**
> Authors: Sadeed Ali [1447], Syed Awais Shah [1457]
> University of Malakand — Department of Computer Science & IT

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Student Portal Shell](#2-student-portal-shell)
3. [Dashboard](#3-dashboard)
4. [Ask ShijlAI — Multi-Mode AI Tutor](#4-ask-shijlai--multi-mode-ai-tutor)
5. [Adaptive Learning Engine](#5-adaptive-learning-engine)
6. [AI Learning Companion](#6-ai-learning-companion)
7. [ShijlAI Hub](#7-shijlai-hub)
8. [Topic Mastery & Skill Graph](#8-topic-mastery--skill-graph)
9. [AI Study Planner](#9-ai-study-planner)
10. [AI Mock Interview](#10-ai-mock-interview)
11. [AI-Powered Recommendations](#11-ai-powered-recommendations)
12. [AI Learning Insights](#12-ai-learning-insights)
13. [Learning Paths](#13-learning-paths)
14. [Course Player & Progress](#14-course-player--progress)
15. [Quiz System](#15-quiz-system)
16. [Gamification System](#16-gamification-system)
17. [Community Features](#17-community-features)
18. [Notifications & Messaging](#18-notifications--messaging)
19. [State Management](#19-state-management)
20. [API Reference](#20-api-reference)

---

## 1. Architecture Overview

### 1.1 SPA Architecture

ShijlAI Academy implements a **client-side Single Page Application (SPA)** architecture within Next.js 16. Unlike traditional Next.js file-system routing, the platform uses a single `src/app/page.tsx` that acts as a **view dispatcher**:

```
User Action → Zustand Store (currentView) → View Resolver → Lazy-Loaded Component
```

The `currentView` state can take **103 possible view keys**. When a student navigates, the system:

1. Updates `currentView` in the Zustand store
2. The view resolver maps the key to a lazy-loaded React component
3. Framer Motion's `AnimatePresence` provides smooth transitions
4. The persistent shell (sidebar + header) remains mounted across navigations

### 1.2 Three-Tier Data Flow

```
┌─────────────────────────────────────────────────┐
│                 PRESENTATION LAYER               │
│  React 19 + Next.js 16 + Tailwind CSS 4         │
│  60+ lazy-loaded views • 50+ shadcn/ui          │
│  Framer Motion animations • Zustand state        │
└──────────────────────┬──────────────────────────┘
                       │ REST API (fetch)
┌──────────────────────▼──────────────────────────┐
│                APPLICATION LAYER                  │
│  180+ Next.js API Routes                         │
│  Learning Engine (6 services)                     │
│  z-ai-web-dev-sdk (LLM/VLM/TTS/ASR)             │
│  Custom Auth • Business Logic • AI Modules        │
└──────────────────────┬──────────────────────────┘
                       │ Prisma ORM
┌──────────────────────▼──────────────────────────┐
│                   DATA LAYER                      │
│  SQLite (dev) / MySQL (prod)                      │
│  87 Database Models • 3,347-line Schema           │
│  Prisma Client Singleton                          │
└─────────────────────────────────────────────────┘
```

### 1.3 AI Intelligence Pipeline

The core AI pipeline processes learning data through six interconnected services:

```
Learning Event (user action)
    │
    ▼
┌──────────────────┐
│  Event Service   │  Logs event → triggers downstream
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Feature Engine  │  Computes 5 metrics (0-100):
│                  │  • Learning Speed
│                  │  • Engagement Score
│                  │  • Consistency Score
│                  │  • Average Performance
│                  │  • Drop Risk
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Profile Service  │  Builds/updates StudentLearningProfile
│                  │  • 5-min throttle
│                  │  • Time decay application
│                  │  • Weak/strong topic identification
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Mastery Service  │  Weighted formula:
│                  │  quiz(50%) + assignment(25%)
│                  │  + practice(15%) + completion(10%)
│                  │  • 0.5%/day decay after 7 days
│                  │  • Trend tracking (±2%)
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│ Recommendation Engine│  4-step process:
│                      │  1. Identify weak areas
│                      │  2. Map prerequisites
│                      │  3. Apply rules
│                      │  4. Score & prioritize
│                      │  Priority: weakness(40%)
│                      │    + career(20%) + engage(20%)
│                      │    + recency(20%)
└────────┬─────────────┘
         │
         ▼
┌──────────────────┐
│  Ask ShijlAI     │  6-mode AI tutor receives
│  (AI Response)   │  full student context for
│                  │  personalized interactions
└──────────────────┘
```

---

## 2. Student Portal Shell

### 2.1 Component: `student-shell.tsx`

The student shell wraps all student-facing views with a consistent layout:

**Desktop Layout (>768px):**
```
┌───────────────────────────────────────────────────────┐
│ StudentHeader (sticky, glassmorphism)                  │
│ [☰] [ShijlAI Academy] [🔍 Search...] [🔥5] [⚡120] [🪙50] [🔔] [💬] [▼] │
├──────────┬────────────────────────────────────────────┤
│ Sidebar  │                                            │
│ (260px)  │           Main Content Area                │
│          │     (lazy-loaded view component)            │
│ Student  │                                            │
│ Portal   │                                            │
│ ──────── │                                            │
│ Home     │                                            │
│ Learning │                                            │
│ Explore  │                                            │
│ Ask AI   │                                            │
│ Hub      │                                            │
│ ...18    │                                            │
│ items    │                                            │
│          │                                            │
│ [🌙][❓] │                                            │
│ [Logout] │                                            │
├──────────┴────────────────────────────────────────────┤
│ (No footer on desktop)                                 │
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
│ 🏠  📚  🤖  🏆  ⋯  │  ← Fixed bottom tab bar
│Home Learn AI  Pro More│
└───────────────────────┘
```

### 2.2 Sidebar Navigation (18 Items)

| # | Label | Icon | Icon Color | View Key | Description |
|---|-------|------|-----------|----------|-------------|
| 1 | Home | `LayoutDashboard` | emerald-500 | `dashboard` | Student dashboard with stats |
| 2 | My Learning | `BookOpen` | teal-500 | `courses` | Enrolled courses grid |
| 3 | Explore | `Compass` | cyan-500 | `explore` | Course catalog browsing |
| 4 | Ask ShijlAI | `Sparkles` | violet-500 | `tutor` | 6-mode AI tutor |
| 5 | ShijlAI Hub | `Hexagon` | teal-500 | `shijlai-hub` | AI knowledge hub |
| 6 | AI Companion | `Bot` | sky-500 | `learning-companion` | Proactive AI mentor |
| 7 | AI Insights | `Brain` | emerald-500 | `recommendations` | AI-powered insights |
| 8 | Assignments | `ClipboardList` | amber-600 | `student-assignments` | Assignment list |
| 9 | Progress | `Trophy` | orange-500 | `achievements` | XP, badges, heatmap |
| 10 | My Skills | `Gauge` | teal-600 | `my-skills` | Skill graph & mastery |
| 11 | Certificates | `Award` | rose-500 | `certificates` | Earned certificates |
| 12 | Community | `Users` | sky-500 | `community` | Forums & groups |
| 13 | Schedule | `Calendar` | indigo-500 | `student-schedule` | Calendar view |
| 14 | Q&A | `MessageSquare` | teal-500 | `student-qa` | Course Q&A |
| 15 | Messages | `Inbox` | blue-500 | `student-messages` | Direct messaging |
| 16 | Notifications | `Bell` | indigo-500 | `notifications` | Notification center |
| 17 | My Profile | `User` | emerald-600 | `student-profile` | Profile page |
| 18 | Settings | `Settings` | slate-500 | `settings` | User preferences |

**Sidebar Features:**
- **Collapsible**: 260px (expanded) ↔ 68px (collapsed) with Framer Motion animation
- **Active indicator**: Spring-animated left bar using `layoutId="sidebarActiveIndicator"`
- **Active dot**: Spring-animated right dot using `layoutId="sidebarActiveDot"`
- **Badge entrance**: Scale animation from 0 for count badges
- **While tap**: `scale: 0.97` haptic feedback on all items

### 2.3 Student Header Components

| Component | Description |
|-----------|-------------|
| Hamburger Menu | Opens sidebar Sheet drawer on mobile |
| Brand Logo | "ShijlAI Academy" text (emerald-to-teal gradient) |
| Desktop Search | `InlineSearch` with ⌘K shortcut, scope: `student` |
| Mobile Search | `MobileExpandableSearch` — icon expands to full-width |
| Streak Counter | 🔥 + streak number |
| XP Counter | ⚡ + XP value |
| ShijlCoins | 🪙 + coins value |
| Notification Bell | `NotificationBell` with real-time badge |
| Messages Icon | Unread count badge |
| User Dropdown | Profile link, Logout action |

### 2.4 Mobile Bottom Tab Bar

4 primary tabs + "More" popup:

| Tab | Icon | View |
|-----|------|------|
| Home | `Home` | `dashboard` |
| Learn | `BookOpen` | `courses` |
| Ask ShijlAI | `Sparkles` | `tutor` |
| Progress | `Trophy` | `achievements` |
| More | `MoreHorizontal` | 4-column grid popup with 13 remaining items |

---

## 3. Dashboard

### 3.1 View: `student-dashboard.tsx`

**API Endpoint:** `GET /api/dashboard?userId={id}&role=student`

**Data Fetched:**
- User stats (XP, level, coins, streak, longest streak)
- Enrollment count & active courses
- Average progress percentage
- Learning streak info
- Daily activity data (last 7 days)
- Course completion stats
- Gamification data

**Dashboard Layout:**
```
┌─────────────────────────────────────────┐
│  Welcome Back, {Name}! 👋               │
│  Continue your learning journey          │
├─────────┬─────────┬─────────┬───────────┤
│ ⚡ XP   │ 🏆 Level│ 🪙 Coins│ 🔥 Streak │
│ 1,250   │ 5       │ 50      │ 7 days    │
├─────────┴─────────┴─────────┴───────────┤
│  Continue Learning                       │
│  ┌──────┐ ┌──────┐ ┌──────┐            │
│  │Course│ │Course│ │Course│  ← Carousel │
│  │  65% │ │  32%│ │  89%│             │
│  └──────┘ └──────┘ └──────┘            │
├──────────────────────────────────────────┤
│  Learning Activity (7-day heatmap)       │
│  Mon Tue Wed Thu Fri Sat Sun             │
├──────────────────────────────────────────┤
│  Recommended For You (AI-powered)        │
│  ┌──────┐ ┌──────┐ ┌──────┐            │
│  │Course│ │Course│ │Course│             │
│  └──────┘ └──────┘ └──────┘            │
├──────────────────────────────────────────┤
│  Quick Actions                           │
│  [Ask ShijlAI] [My Skills] [Schedule]   │
└──────────────────────────────────────────┘
```

**Key Features:**
- **Count-up animations**: Stats use `useCountUp` hook triggered by `useInView`
- **Course carousel**: `CourseCarouselRow` with Embla Carousel
- **AI recommendations**: Fetched from `/api/ai/shijlai/recommendations`
- **Activity heatmap**: 7-day grid with intensity colors
- **Quick action cards**: Navigate to AI features

---

## 4. Ask ShijlAI — Multi-Mode AI Tutor

### 4.1 Overview

Ask ShijlAI is the **flagship AI feature** of the platform — a multi-mode conversational AI tutor that adapts its behavior based on the selected mode and the student's learning context.

**Component:** `ask-shijlai-view.tsx` (main view)
**Sub-components:** `ask-shijlai/enhanced-welcome.tsx`, `ask-shijlai/learning-intelligence-panel.tsx`, `ask-shijlai/recommendations-panel.tsx`, `ask-shijlai/insights-cards.tsx`

**API Endpoint:** `POST /api/ai/shijlai/chat`

### 4.2 Six Operating Modes

| Mode | Purpose | Personality | Output Format |
|------|---------|-------------|---------------|
| **Tutor** | Socratic learning guidance | Warm, friendly learning buddy. Conversational, NO structured plans | Free-form conversation |
| **Quiz** | Generate practice questions | Question generator | Question N:\nA-D options\nAnswer:\nExplanation: |
| **Assignment** | Step-by-step assignment help | Assignment helper with time estimates | Numbered steps with time estimates |
| **Study Planner** | Create study schedules | Schedule generator | 📖📝🔄☕ emoji indicators |
| **Career Advisor** | Career guidance | Professional career counselor | Phased steps with timeframes |
| **Companion** | Proactive learning mentor | Warm, caring mentor. Uses student data naturally. Celebrates wins | Conversational with insights |

### 4.3 Context Building for LLM

When a student sends a message, the system builds a **rich context prompt** that includes:

```
System Prompt Composition:
├── Base role definition ("You are Ask ShijlAI...")
├── Mode-specific prompt (6 variants)
├── Student Learning Profile
│   ├── Learning level (beginner/intermediate/advanced)
│   ├── Learning speed (slow/moderate/fast)
│   ├── Engagement score (0-100)
│   ├── Consistency score (0-100)
│   ├── Drop risk score (0-100)
│   ├── Completion rate (%)
│   └── Average quiz score (%)
├── Weak Topics (mastery < 50%)
│   ├── Topic name + mastery score
│   └── Component breakdown (quiz/assignment/practice/completion)
├── Course Context (if session linked to course)
│   ├── Course title & description
│   ├── Module titles
│   └── Lesson titles
├── Conversation Summary (auto-generated after 20 messages)
│   └── AI-generated summary of previous conversation
└── Quick Action Context (if triggered from quick action)
    └── Specific guidance for the action type
```

### 4.4 Session Management

**API Endpoints:**
- `POST /api/ai/shijlai/sessions` — Create new session
- `GET /api/ai/shijlai/sessions` — List sessions (limit 50, non-archived)

**Session Model (`ShijlAISession`):**
```typescript
{
  id: string
  userId: string
  mode: 'tutor' | 'quiz' | 'assignment' | 'study_planner' | 'career_advisor' | 'companion'
  title: string
  courseId?: string        // Optional course context
  language?: string
  messageCount: number
  isArchived: boolean
  lastMessageAt: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 4.5 Conversation Auto-Summary

When a conversation exceeds **20 messages**, the system automatically generates a summary:

1. Fetches all previous messages from the session
2. Sends them to the LLM with a summarization prompt
3. Saves the summary to the `ConversationSummary` model
4. On subsequent requests, only the summary (not all messages) is included in context
5. This prevents token overflow while preserving conversation continuity

### 4.6 Learning Intelligence Panel

The `LearningIntelligencePanel` component displays real-time AI insights alongside the chat:

- **Current mastery levels** for topics being discussed
- **Weak areas** requiring attention
- **Engagement metrics** visualization
- **Recommended next steps** based on learning profile

### 4.7 Quick Actions

The chat interface provides quick action buttons:

| Quick Action | Effect |
|-------------|--------|
| Explain Simpler | "Explain this in simpler terms" |
| More Examples | "Give me more examples" |
| Test Me | "Test my understanding with a question" |
| Translate | "Translate this explanation" |
| Study Plan | "Create a study plan for this topic" |

### 4.8 Data Flow

```
Student types message
    │
    ▼
Frontend sends POST /api/ai/shijlai/chat
    { sessionId, message, mode, courseId? }
    │
    ▼
Backend:
    1. Fetch/create ShijlAISession
    2. Build system prompt:
       ├─ Mode-specific prompt
       ├─ Student profile from Profile Service
       ├─ Weak topics from Mastery Service
       ├─ Course context from DB
       ├─ Conversation summaries
       └─ Recent chat history (last 10 messages)
    3. Call LLM via z-ai-web-dev-sdk
    4. Save user message → ShijlAIMessage
    5. Save AI response → ShijlAIMessage
    6. If >20 messages → generate summary
    7. Log event: ai_tutor_used (+3 XP)
    8. Log to StudentAIActivity
    │
    ▼
Frontend renders:
    ├─ AI message with markdown formatting
    ├─ Updated session info
    └─ Quick action suggestions
```

---

## 5. Adaptive Learning Engine

### 5.1 Architecture

The Adaptive Learning Engine is implemented as **6 interconnected services** in `src/services/learning-engine/`:

| Service | File | Responsibility |
|---------|------|----------------|
| Event Service | `event-service.ts` | Log learning events, trigger downstream |
| Feature Engine | `feature-engine.ts` | Compute 5 learning metrics |
| Profile Service | `profile-service.ts` | Build/update student profile |
| Mastery Service | `mastery-service.ts` | Track topic mastery with weighted formula |
| Recommendation Engine | `recommendation-engine.ts` | Generate adaptive recommendations |
| Study Planner Service | `study-planner-service.ts` | Generate AI-enhanced study plans |

### 5.2 Event Service

**The foundational data ingestion layer.** Every learning action flows through `logEvent()`.

#### 5.2.1 Event Types & Score Deltas

| Event Type | Score Delta | Description |
|-----------|-------------|-------------|
| `quiz_attempted` | `value × 0.3` | Quiz attempt (value = score %) |
| `lesson_completed` | `+15` | Lesson marked complete |
| `assignment_submitted` | `value × 0.25` | Assignment submitted (value = score %) |
| `video_watched` | `+5` | Video lesson watched |
| `ai_tutor_used` | `+3` | AI tutor interaction |

#### 5.2.2 Event Processing Pipeline

```typescript
logEvent(params) {
    // Step 1: Create event record
    db.learningMetric.create({
        data: { userId, eventType, eventValue, courseId, topicId, metadata }
    })

    // Step 2: Update topic mastery (non-blocking)
    updateTopicMastery({
        userId, topicId, courseId,
        scoreDelta: computeScoreDelta(eventType, eventValue)
    })

    // Step 3: Update student profile (non-blocking)
    updateStudentProfile(userId)
}
```

**Key Design:** Events are the **single source of truth**. If an action isn't logged, it doesn't exist for the AI system. All downstream services are triggered by events.

#### 5.2.3 API Endpoints

- `GET /api/ai/shijlai/events` — List events + event type counts
- `POST /api/ai/shijlai/events` — Log new event

### 5.3 Feature Engine

**Turns raw event data into intelligence.** All functions return scores on a **0-100 scale**.

#### 5.3.1 Five Computed Metrics

**1. Learning Speed** (`computeLearningSpeed`)
```
Learning Speed = (completed_lessons / time_spent_hours) × 10
```
- Capped at 100
- Default 50 for new students with no data
- Measures how quickly a student progresses through content

**2. Engagement Score** (`computeEngagementScore`)
```
Engagement = min(logins, 7)×5 + timeHours×4 + min(quizzes, 10)×2 + min(aiUsage, 10)×1.5 + min(lessons, 10)×0.5
```
- 5 components weighted differently
- Login frequency: max 7 logins counted (35 pts max)
- Time spent: unlimited (but practical cap ~15 hours = 60 pts)
- Quiz attempts: max 10 counted (20 pts max)
- AI tutor usage: max 10 counted (15 pts max)
- Lessons completed: max 10 counted (5 pts max)
- Theoretical max ~135, capped at 100

**3. Consistency Score** (`computeConsistencyScore`)
```
Consistency = (active_days / total_days_enrolled) × 100
```
- Streak penalty: -10 if current streak < 3
- Falls back to streak-based estimate if enrollment data unavailable
- Measures regular study habits

**4. Average Performance** (`computeAveragePerformance`)
```
Average Performance = mean(all_quiz_scores + all_assignment_scores)
```
- Combines quiz attempt percentages and submission score percentages
- Returns 0 if no assessments completed

**5. Drop Risk Score** (`computeDropRisk`)
```
Drop Risk = low_engagement × 0.30
          + low_consistency × 0.30
          + declining_score × 0.20
          + inactivity_score × 0.20
```

Where:
- `low_engagement` = max(0, 100 - engagementScore)
- `low_consistency` = max(0, 100 - consistencyScore)
- `declining_score` = 2 × (old_average - new_average) if declining, else 0
- `inactivity_score` = 5 points per day since last activity

**Interpretation:**
- 0-20: Low risk (student is engaged and consistent)
- 20-40: Moderate risk (some concerning signals)
- 40-60: High risk (multiple risk factors present)
- 60-100: Critical risk (immediate intervention needed)

### 5.4 Profile Service

**Aggregates all Feature Engine outputs into a single `StudentLearningProfile` record.**

#### 5.4.1 Profile Fields

| Field | Type | Description |
|-------|------|-------------|
| `learningLevel` | enum | `beginner` / `intermediate` / `advanced` |
| `engagementScore` | float | 0-100 from Feature Engine |
| `consistencyScore` | float | 0-100 from Feature Engine |
| `learningSpeedScore` | float | 0-100 from Feature Engine |
| `dropRiskScore` | float | 0-100 from Feature Engine |
| `completionRate` | float | Average course completion % |
| `averageQuizScore` | float | Average quiz score % |
| `weakTopics` | JSON | Array of topics with mastery < 50% |
| `strongTopics` | JSON | Array of topics with mastery ≥ 75% |
| `learningSpeed` | enum | `slow` / `moderate` / `fast` |
| `totalXpEarned` | int | Total XP from all sources |
| `totalLessonsCompleted` | int | Count of completed lessons |
| `totalQuizzesTaken` | int | Count of quiz attempts |
| `totalTimeSpent` | int | Total time in minutes |
| `studyStreakDays` | int | Current streak length |
| `lastComputedAt` | DateTime | Timestamp of last computation |

#### 5.4.2 Level & Speed Classification

**Learning Level:**
| Condition | Level |
|-----------|-------|
| avgMastery < 40 OR avgQuiz < 50 | `beginner` |
| avgMastery 40-70 OR avgQuiz 50-75 | `intermediate` |
| avgMastery > 70 AND avgQuiz > 75 | `advanced` |

**Learning Speed:**
| Condition | Speed |
|-----------|-------|
| speedScore < 40 | `slow` |
| speedScore 40-70 | `moderate` |
| speedScore > 70 | `fast` |

#### 5.4.3 Throttling

Profile updates are **throttled to 5-minute intervals** to prevent excessive computation:

```typescript
if (existing && existing.lastComputedAt) {
    const minutesSinceLastCompute =
        (Date.now() - existing.lastComputedAt.getTime()) / 60000
    if (minutesSinceLastCompute < 5) {
        return existing  // Skip recomputation
    }
}
```

#### 5.4.4 API Endpoints

- `GET /api/ai/shijlai/profile` — Get profile + all topic masteries
- `POST /api/ai/shijlai/profile` — Trigger profile recomputation

### 5.5 Mastery Service

**The most sophisticated service.** Uses a weighted formula with 4 component scores and temporal decay.

#### 5.5.1 Weighted Mastery Formula

```
Mastery Score = quizScore × 0.50
              + assignmentScore × 0.25
              + practiceScore × 0.15
              + completionScore × 0.10
```

**Rationale for weights:**
- Quiz (50%): Active recall is the strongest indicator of understanding
- Assignment (25%): Application of knowledge demonstrates deeper comprehension
- Practice (15%): Repetition reinforces learning but is less diagnostic
- Completion (10%): Content exposure is necessary but insufficient

#### 5.5.2 Status Labels

| Score Range | Status | Display |
|------------|--------|---------|
| 0-25% | `not_started` | 🔴 Not Started |
| 25-50% | `weak` | 🟠 Weak |
| 50-75% | `learning` | 🟡 Learning |
| 75-90% | `strong` | 🟢 Strong |
| 90-100% | `mastered` | 🔵 Mastered |

#### 5.5.3 Temporal Decay (Ebbinghaus Curve)

```
Mastery(t) = M₀ × (1 - 0.005 × max(0, t - 7))
```

Where:
- `M₀` = initial mastery score
- `t` = days since last learning activity on the topic
- Decay starts after **7 days of inactivity**
- Rate: **0.5% per day** (applied proportionally to all 4 component scores)
- A topic with 90% mastery after 30 days of inactivity: `90 × (1 - 0.005 × 23) = 90 × 0.885 = 79.65%` → drops from "mastered" to "strong"

#### 5.5.4 Trend Tracking

| Condition | Trend |
|-----------|-------|
| New mastery > old mastery + 2% | `improving` |
| New mastery < old mastery - 2% | `declining` |
| Otherwise | `stable` |

#### 5.5.5 Skill Mastery Computation

Skill mastery is computed as a **weighted average of topic scores** through `SkillTopicMapping`:

```
Skill Mastery = Σ (topicMastery × mappingWeight) / Σ mappingWeight
```

If no explicit `SkillTopicMapping` records exist, the system auto-groups topics by skill and computes simple averages.

#### 5.5.6 Mastery Insights

The `getMasteryInsights()` function generates rule-based insights:

| Insight Type | Condition | Message |
|-------------|-----------|---------|
| Strong topic celebration | mastery ≥ 90% | "Excellent! You've mastered {topic}!" |
| Weak topic alert | mastery < 30% | "{topic} needs attention — consider reviewing basics" |
| Mistake concentration | >60% quiz errors in one area | "Quiz errors concentrate in {topic} — focused practice recommended" |
| Learning phase | 50-75% mastery | "You're making progress on {topic}!" |
| Declining warning | trend = declining | "{topic} mastery is declining — review recommended" |

#### 5.5.7 API Endpoints

- `GET /api/ai/shijlai/mastery` — All masteries + summary + status distribution
- `POST /api/ai/shijlai/mastery` — Update mastery (component scores or scoreDelta)
- `POST /api/ai/shijlai/mastery/seed` — Seed demo mastery data (5 skills, 20 topics)

---

## 6. AI Learning Companion

### 6.1 Overview

The AI Learning Companion is a **proactive guidance system** — not just a chatbot, but an intelligent mentor that anticipates student needs and initiates helpful interactions.

**Component:** `learning-companion-view.tsx`
**API Endpoint:** `GET/POST /api/ai/companion`

### 6.2 Companion Dashboard (GET)

The companion returns a comprehensive dashboard with multiple data sections:

```
┌────────────────────────────────────────────┐
│  🤖 AI Learning Companion                  │
│  "Hey! Ready to learn today?"              │
├────────────────────────────────────────────┤
│  📌 Today's Focus                          │
│  • Review Python Basics (mastery: 35%)     │
│  • Practice ML Algorithms (mastery: 42%)   │
├────────────────────────────────────────────┤
│  💡 Insights                               │
│  • ⚠️ You've been inactive for 5 days      │
│  • 📊 Your Data Structures mastery is low  │
│  • 🎯 Study plan task missed yesterday     │
├────────────────────────────────────────────┤
│  🎯 Suggested Actions                      │
│  • [Review Weakest Topic] (+25 XP)         │
│  • [Take a Quiz] (+20 XP)                  │
│  • [Continue Learning Path] (+15 XP)       │
├────────────────────────────────────────────┤
│  📊 Stats                                  │
│  Streak: 5 days | Avg Mastery: 62%         │
│  Weekly Progress: +8% | Insights: 12       │
├────────────────────────────────────────────┤
│  💬 Chat with Companion                     │
│  [Type your message...]                    │
└────────────────────────────────────────────┘
```

### 6.3 Today's Focus Algorithm

```typescript
buildTodaysFocus(weakTopics, examLinkedTopics, maxItems = 5) {
    // Priority 1: Weak topics linked to upcoming exams
    // Priority 2: Other weak topics (sorted by mastery ascending)
    // Priority 3: Exam-linked topics not yet weak
    // Cap at 5 items
}
```

### 6.4 Insight Generation Rules

The companion generates insights using **5 rule-based checks**:

| Rule | Condition | Insight |
|------|-----------|---------|
| Inactivity Alert | No activity for ≥5 days | "You haven't studied in {n} days. Let's get back on track!" |
| Weak Topic Alert | Topic mastery < 30% | "{topic} needs urgent attention (mastery: {n}%)" |
| Missed Study Plan | Uncompleted tasks from yesterday | "You missed {n} study plan tasks yesterday" |
| Upcoming Exam | Exam within 14 days | "Your {course} exam is in {n} days — time to prepare!" |
| Achievement Celebration | Recent badge/level-up | "Great job! You earned {achievement}! 🎉" |

### 6.5 Suggested Actions

| Action | XP Reward | Description |
|--------|-----------|-------------|
| Review Weakest Topic | +25 XP | Navigate to the topic with lowest mastery |
| Take a Quiz | +20 XP | Start a quiz on a weak topic |
| Continue Learning Path | +15 XP | Resume the next node in learning path |
| Start AI Session | +10 XP | Begin an Ask ShijlAI session |

### 6.6 Companion Personality

The companion adapts its personality based on the student's state:

| Student State | Personality | Tone |
|--------------|-------------|------|
| Low engagement + low mastery | **Coach** | Motivational, encouraging, structured |
| High engagement + low mastery | **Mentor** | Patient, explanatory, step-by-step |
| High engagement + high mastery | **Advisor** | Challenging, advanced, exploratory |

### 6.7 Companion Chat (POST)

When chatting with the companion, the system prompt includes:

- Student's full learning profile
- Current mastery levels for all topics
- Engagement and consistency scores
- Recent activity summary
- Today's focus items
- Streak information

The companion **proactively uses this data** in conversations:

```
Companion: "I noticed your Python mastery dropped from 65% to 58% this week. 
Want me to create a quick review plan? We could focus on loops and 
data structures — those seem to be the weak spots."
```

### 6.8 Graceful Degradation

The companion **always returns data** — even on error or empty database:

- No profile? → Returns demo profile with placeholder values
- No mastery data? → Returns default focus items
- LLM fails? → Falls back to rule-based insights only
- DB error? → Returns hardcoded demo dashboard

---

## 7. ShijlAI Hub

### 7.1 Overview

The ShijlAI Hub is a centralized **AI knowledge and tools dashboard** that aggregates all AI-powered features into a single interface.

**View:** `shijlai-hub-view.tsx`

### 7.2 Hub Sections

| Section | Description | Data Source |
|---------|-------------|-------------|
| **AI Tools Grid** | Cards for each AI tool (Ask ShijlAI, Study Planner, Mock Interview, etc.) | Static config |
| **Learning Summary** | AI-generated overview of student's learning state | Profile Service |
| **Quick Insights** | Top 3 AI-generated insights | `/api/ai/shijlai/insights` |
| **Recent AI Activity** | Timeline of AI interactions | `StudentAIActivity` |
| **Skill Overview** | Mini skill graph with mastery levels | `/api/skill-graph` |
| **Recommended Actions** | AI-suggested next steps | Recommendation Engine |

### 7.3 AI Tools in Hub

| Tool | Icon | Navigation Target |
|------|------|-------------------|
| Ask ShijlAI | `Sparkles` | `tutor` view |
| Study Planner | `Calendar` | Study plan section |
| Mock Interview | `Mic` | `mock-interview` mode |
| Learning Companion | `Bot` | `learning-companion` view |
| Skill Analyzer | `Gauge` | `my-skills` view |
| Quiz Generator | `HelpCircle` | Ask ShijlAI quiz mode |

---

## 8. Topic Mastery & Skill Graph

### 8.1 My Skills View

**View:** `my-skills-view.tsx`
**Component:** `skill-graph.tsx`
**API Endpoints:** `GET /api/skills`, `GET /api/skill-graph`

### 8.2 Skill Graph Visualization

The `SkillGraph` component renders an **interactive tree visualization** showing:

- **Root nodes**: Major skill categories (Python, Machine Learning, Web Development, etc.)
- **Branch nodes**: Sub-skills within each category
- **Leaf nodes**: Individual topics with mastery indicators
- **Color coding**: 🔴 Not Started → 🟠 Weak → 🟡 Learning → 🟢 Strong → 🔵 Mastered
- **Size**: Node size proportional to mastery score
- **Interactivity**: Click to expand/collapse, hover for details

### 8.3 Skill Score Calculation

Skills are computed from topic mastery data through `SkillTopicMapping`:

```typescript
calculateSkillScores(userId) {
    // Step 1: Fetch all topic masteries
    const masteries = await db.topicMastery.findMany({ where: { userId } })

    // Step 2: Group by skill via SkillTopicMapping
    const mappings = await db.skillTopicMapping.findMany()

    // Step 3: For each skill, compute weighted average
    for (const skill of skills) {
        const topicScores = mappings
            .filter(m => m.skillId === skill.id)
            .map(m => {
                const mastery = masteries.find(t => t.topicId === m.topicId)
                return mastery ? mastery.masteryScore * m.weight : 0
            })
        skill.score = sum(topicScores) / sum(weights)
    }

    // Step 4: Fallback — auto-group if no mappings exist
    if (mappings.length === 0) {
        // Auto-group topics into skills by category prefix
    }
}
```

### 8.4 Demo Skill Data

If the database has no skill data, the system auto-seeds **15 predefined skills**:

| Skill | Topics | Category |
|-------|--------|----------|
| Python Programming | Variables, Loops, Functions, OOP, Error Handling | Programming |
| Machine Learning | Supervised, Unsupervised, Neural Networks, NLP, Reinforcement | AI/ML |
| Web Development | HTML, CSS, JavaScript, React, Node.js | Programming |
| Data Science | Statistics, Visualization, Pandas, SQL, Feature Engineering | Data |
| Mathematics | Calculus, Linear Algebra, Probability, Discrete Math, Statistics | Science |

### 8.5 Skill Graph API Response

```typescript
{
  nodes: {
    id: string
    label: string
    type: 'root' | 'category' | 'skill' | 'topic'
    mastery: number       // 0-100
    status: string        // not_started | weak | learning | strong | mastered
    children: string[]
    parentId?: string
    xp?: number
    totalTopics?: number
    masteredTopics?: number
  }[]
  edges: {
    source: string
    target: string
    type: 'parent' | 'prerequisite'
    strength: number      // 0-1
  }[]
  stats: {
    totalSkills: number
    avgMastery: number
    mastered: number
    inProgress: number
    notStarted: number
  }
}
```

---

## 9. AI Study Planner

### 9.1 Overview

The AI Study Planner generates **personalized daily study plans** using an algorithmic engine with optional LLM enhancement.

**Two implementations exist:**
1. **Algorithmic Engine** (`study-planner-service.ts`) — Phase-based task generation
2. **LLM Planner** (`/api/ai/shijlai/study-plan`) — Purely LLM-generated plans

### 9.2 Algorithmic Study Planner

#### 9.2.1 Input Parameters

| Parameter | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| `userId` | string | required | Student identifier |
| `examDate` | string | must be future | Target exam date |
| `subjects` | string[] | required | Subjects to study |
| `dailyHours` | number | 0.5-16 | Available study hours per day |
| `topics` | object[] | optional | Custom topic list with mastery levels |
| `aiEnhanced` | boolean | default: true | Whether to add LLM tips |

#### 9.2.2 Phase-Based Task Generation

```
Days remaining → Progress phase:

┌─────────────────────────────────────────────────────────┐
│ EARLY PHASE (0-40% of days)                             │
│ Tasks per day: 1 (≤1h), 2 (≤2h), 3 (≤4h), 4 (>4h)     │
│ Task types: study + ai_discussion + quiz                │
│ Focus: Learning new material, building foundations      │
├─────────────────────────────────────────────────────────┤
│ MIDDLE PHASE (40-75% of days)                           │
│ Tasks per day: same scaling                             │
│ Task types: study + practice + quiz                     │
│ Focus: Applying knowledge, deeper practice              │
├─────────────────────────────────────────────────────────┤
│ LATE PHASE (75-100% of days)                            │
│ Tasks per day: same scaling                             │
│ Task types: revision + mock_exam + practice             │
│ Focus: Reviewing, testing, filling gaps                 │
└─────────────────────────────────────────────────────────┘
```

#### 9.2.3 Topic Weight Distribution

```
Topic Weight Allocation:
├── Weak topics (mastery < 50%):    40% of study time
├── Moderate topics (50-75%):       30% of study time
├── Strong topics (> 75%):          15% of study time
└── Review buffer:                  15% of study time
```

#### 9.2.4 Special Day Rules

| Day | Rule |
|-----|------|
| Every 3rd day | **Review day** — revision task replaces one study task |
| Day before exam | **Mock exam day** — revision + mock_exam only |
| Last day | **Light review** — single revision task |

#### 9.2.5 Task Duration Distribution

When multiple tasks are assigned per day:

```
2 tasks: 60% / 40% of daily hours
3 tasks: 40% / 30% / 30%
4 tasks: 40% / 30% / 20% / 10%
```

#### 9.2.6 AI Enhancement

When `aiEnhanced: true`, each task receives LLM-generated tips:

```typescript
generateAIPlanEnhancement(context) {
    // Sends to LLM:
    // "Given this student's profile and study plan, provide:
    //  - tips: string[] (study tips for this task)
    //  - focusAreas: string[] (specific areas to focus on)
    //  - scheduleNotes: string (additional scheduling advice)"
    //
    // Returns parsed JSON or null on failure (graceful fallback)
}
```

#### 9.2.7 Study Plan Model

```typescript
StudyPlan {
    id: string
    userId: string
    title: string
    examDate: DateTime
    totalDays: number
    dailyHours: number
    subjects: string[]       // JSON array
    status: 'active' | 'completed' | 'abandoned'
    progress: number         // 0-100
    tasks: StudyPlanTask[]
}

StudyPlanTask {
    id: string
    day: number              // Day index (1-based)
    title: string
    type: 'study' | 'quiz' | 'practice' | 'revision' |
          'ai_discussion' | 'mock_exam' | 'review'
    duration: number         // Minutes
    subject: string
    topic?: string
    tips?: string[]          // AI-generated tips (JSON)
    focusAreas?: string[]    // AI-generated focus areas (JSON)
    status: 'pending' | 'in_progress' | 'completed' | 'skipped'
    completedAt?: DateTime
}
```

### 9.3 LLM Study Planner

The `/api/ai/shijlai/study-plan` endpoint generates plans purely via LLM:

1. Sends student context + subjects + exam date to LLM
2. Requests JSON-format plan with daily schedule
3. Saves to `StudyPlan` model
4. Less structured than algorithmic version, but more flexible

### 9.4 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/study-planner` | Today's tasks, specific plan, or all plans |
| POST | `/api/ai/study-planner` | Create algorithmic study plan |
| PATCH | `/api/ai/study-planner` | Update task status or plan status |
| DELETE | `/api/ai/study-planner` | Soft-delete (abandon) plan |
| GET | `/api/ai/shijlai/study-plan` | List LLM-generated plans |
| POST | `/api/ai/shijlai/study-plan` | Create LLM-generated plan |

---

## 10. AI Mock Interview

### 10.1 Overview

The AI Mock Interview system simulates **realistic technical interviews** with domain-specific questions, real-time answer evaluation, and comprehensive feedback reports.

**Component:** `ai-mock-interview.tsx`
**API Endpoint:** `GET/POST /api/ai/mock-interview`

### 10.2 Interview Domains

| Domain | Topics | Behavioral Topics |
|--------|--------|-------------------|
| Python | Variables, Loops, Functions, OOP, Error Handling, File I/O, Decorators, Generators | Problem-solving, Team collaboration |
| Machine Learning | Supervised/Unsupervised Learning, Neural Networks, NLP, Reinforcement, Feature Engineering | Research methodology, Project management |
| Web Development | HTML/CSS, JavaScript, React, Node.js, APIs, Databases, Security | Code review, Debugging approach |
| Data Science | Statistics, Visualization, SQL, Pandas, Feature Engineering | Data-driven decisions, Communication |
| General | Algorithms, Data Structures, System Design, Problem Solving | Leadership, Adaptability |

### 10.3 Interview Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   START      │────▶│  QUESTION    │────▶│  SUBMIT      │
│   SETUP      │     │  GENERATION  │     │  ANSWER      │
└─────────────┘     └──────────────┘     └──────┬───────┘
                          ▲                      │
                          │                      ▼
                     ┌──────────────┐     ┌──────────────┐
                     │   NEXT       │◀────│   EVALUATE   │
                     │   QUESTION   │     │   (LLM)      │
                     └──────────────┘     └──────┬───────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │   COMPLETE   │
                                          │   REPORT     │
                                          └──────────────┘
```

### 10.4 Question Generation

**LLM-generated** (primary) or **fallback bank** (75+ pre-crafted questions):

LLM prompt includes:
- Student's topic mastery levels
- Domain and difficulty preference
- Request for 5-10 questions with ideal answers

Fallback questions organized by:
- 5 domains × 3 difficulty levels (beginner/intermediate/advanced)
- 5 questions per domain-level combination
- Each with `idealAnswer` for evaluation reference

### 10.5 Answer Evaluation

When a student submits an answer:

1. LLM evaluates against the question's ideal answer
2. Scores on multiple dimensions:
   - **Accuracy** (0-100): Factual correctness
   - **Completeness** (0-100): Coverage of key points
   - **Clarity** (0-100): Communication effectiveness
3. Returns:
   - Score for each dimension
   - Specific feedback on strengths and weaknesses
   - The ideal answer for comparison
   - Suggestions for improvement

### 10.6 Final Report

When interview is completed, LLM generates a comprehensive report:

```typescript
{
    overallScore: number        // 0-100
    accuracy: number           // Average accuracy across all answers
    completeness: number       // Average completeness
    clarity: number            // Average clarity
    confidence: number         // Estimated from answer length/detail
    strengths: string[]        // Areas where student excelled
    weaknesses: string[]       // Areas needing improvement
    recommendations: string[]  // Specific study recommendations
    skillUpdates: {            // Suggested mastery updates
        topicId: string
        currentMastery: number
        suggestedMastery: number
    }[]
}
```

The system **updates topic mastery** based on interview performance, creating a feedback loop between mock interviews and the mastery tracking system.

---

## 11. AI-Powered Recommendations

### 11.1 Overview

The Recommendation Engine generates **personalized learning recommendations** using a 4-step pipeline that combines rule-based logic with optional LLM enhancement.

**View:** `recommendations-view.tsx`
**API Endpoint:** `GET/POST /api/ai/shijlai/recommendations`

### 11.2 Four-Step Recommendation Pipeline

```
Step 1: IDENTIFY WEAK AREAS
    ├── Fetch all topic masteries
    ├── Filter by mastery < threshold (default 50%)
    └── Sort by mastery ascending (weakest first)

Step 2: MAP PREREQUISITES
    ├── Check SkillTopicMapping for prerequisite chains
    └── Identify foundational topics that block progress

Step 3: APPLY RECOMMENDATION RULES
    ├── Very weak (<30%): "Review Basics" + "Practice Quiz" → HIGH priority
    ├── Weak (30-50%): "Revise Topic" → MEDIUM priority
    ├── Incomplete modules: "Continue Learning" → HIGH priority
    ├── Strong topics: "Advanced Challenge" → LOW priority
    ├── Drop risk >60%: "Create Study Plan" → HIGH priority
    └── Drop risk >30%: "Review Schedule" → MEDIUM priority

Step 4: SCORE AND PRIORITIZE
    └── Priority = weakness(40%) + career(20%) + engagement(20%) + recency(20%)
```

### 11.3 Recommendation Types

| Type | Description | Example |
|------|-------------|---------|
| `topic` | Review a specific topic | "Review Python Loops (mastery: 28%)" |
| `quiz` | Take a quiz on weak area | "Practice Quiz: Data Structures" |
| `lesson` | Continue a specific lesson | "Continue: React Components" |
| `course` | Enroll in a related course | "Recommended Course: Advanced Python" |
| `study_plan` | Create a study plan | "Create a study plan for upcoming exams" |

### 11.4 LLM-Enhanced Recommendations

When `sourceEvent` is provided (e.g., after a quiz or lesson completion), the system also calls the LLM for **2-3 additional personalized recommendations**:

```typescript
// LLM prompt includes:
// - Student's full profile
// - Current topic masteries
// - The triggering event (quiz result, lesson completed, etc.)
// - Request for JSON array of { type, title, description, priority, reason }
```

### 11.5 Recommendation Deduplication

The engine checks for existing recommendations before creating new ones:

```typescript
// For each candidate recommendation:
const existing = await db.aIRecommendation.findFirst({
    where: { userId, type, title, status: 'active' }
})
if (existing) continue  // Skip duplicate
```

### 11.6 API Response

```typescript
{
    recommendations: {
        id: string
        type: 'topic' | 'quiz' | 'lesson' | 'course' | 'study_plan'
        title: string
        description: string
        priority: 'high' | 'medium' | 'low'
        reason: string           // Why this recommendation was made
        status: 'active' | 'completed' | 'dismissed'
        actionData: {            // For frontend navigation
            viewKey?: string
            topicId?: string
            courseId?: string
            quizId?: string
        }
        createdAt: DateTime
    }[]
}
```

---

## 12. AI Learning Insights

### 12.1 Overview

The Learning Insights system generates **actionable observations** about a student's learning patterns using a dual approach: rule-based analysis + optional LLM enhancement.

**Component:** `ask-shijlai/insights-cards.tsx`
**API Endpoint:** `GET/POST /api/ai/shijlai/insights`

### 12.2 Insight Categories

| Category | Icon | Description |
|----------|------|-------------|
| `performance` | 📊 | Quiz and assignment performance trends |
| `engagement` | 🔥 | Study consistency and activity patterns |
| `mastery` | 🎯 | Topic mastery levels and progression |
| `risk` | ⚠️ | Drop risk and at-risk indicators |
| `streak` | 🔥 | Study streak status and encouragement |
| `recommendation` | 💡 | Suggested actions based on patterns |

### 12.3 Rule-Based Insight Generation

8 rule categories are checked:

| Rule | Condition | Generated Insight |
|------|-----------|-------------------|
| Drop Risk | dropRiskScore > 60 | "⚠️ High drop risk detected — consider creating a study plan" |
| Drop Risk | dropRiskScore > 30 | "📊 Moderate risk — try studying more consistently" |
| Engagement Trend | engagementScore declining | "📉 Your engagement has been declining — let's get back on track!" |
| Weak Topics | mastery < 30% | "🎯 {topic} needs urgent attention (mastery: {n}%)" |
| Study Streak | streak = 0 | "🔥 Start a study streak! Even 10 minutes daily helps" |
| Study Streak | streak ≥ 7 | "🔥 Amazing {n}-day streak! Keep it up!" |
| Quiz Performance | avgQuiz < 60 | "📊 Quiz scores below 60% — review fundamentals" |
| Completion Rate | completionRate < 50 | "📖 Complete more lessons to build momentum" |
| Consistency | consistencyScore < 40 | "📅 Try to study regularly — consistency builds mastery" |

### 12.4 LLM-Enhanced Insights

When LLM enhancement is enabled, the system sends student context to the LLM requesting **2-4 additional insights**:

```typescript
// LLM prompt:
// "Given this student's learning data, generate 2-4 actionable insights.
//  Each insight should have: category, title, description, severity (info/warning/critical),
//  and an actionable suggestion."
//
// Returns JSON array of insights
```

### 12.5 Insight Lifecycle

```typescript
LearningInsight {
    id: string
    userId: string
    category: string        // performance | engagement | mastery | risk | streak | recommendation
    title: string
    description: string
    severity: string        // info | warning | critical
    isRead: boolean
    actionData: {           // Optional action to take
        type: string
        targetId?: string
        url?: string
    }
    source: string          // 'rule' | 'ai'
    createdAt: DateTime
}
```

---

## 13. Learning Paths

### 13.1 Overview

Learning Paths provide **structured curricula** that map topics to sequential milestones with mastery-based progression gates.

**View:** `learning-paths-view.tsx`
**API Endpoint:** `GET /api/ai/learning-paths`

### 13.2 Path Types

| Type | Source | Description |
|------|--------|-------------|
| **Course Path** | Auto-generated from course structure | Maps course modules to sequential nodes |
| **Career Path** | Template + skill matching | Maps career requirements to skill milestones |

### 13.3 Course Learning Path Generation

```typescript
generateCourseLearningPath(course, masteries) {
    // For each module in course:
    //   1. Create a node with mastery threshold
    //   2. Set status based on current mastery:
    //      - mastered ≥ threshold → "completed"
    //      - mastery 50-99% of threshold → "in_progress"
    //      - previous node completed → "available"
    //      - otherwise → "locked"
    //   3. Link to previous node (prerequisite chain)

    // Special course templates:
    // - ML courses: 5-node path (Basics → Supervised → Neural → Advanced → Capstone)
    // - Python courses: 5-node path (Syntax → Functions → OOP → Advanced → Projects)
    // - Web courses: 5-node path (HTML → CSS → JS → Framework → Full-stack)
    // - Data courses: 5-node path (Stats → SQL → Python → Visualization → ML)
}
```

### 13.4 Career Learning Paths

4 pre-defined career paths:

| Career | Skills Required | Match Calculation |
|--------|----------------|-------------------|
| Data Scientist | Statistics, ML, Python, SQL, Visualization | Weighted avg of skill masteries |
| ML Engineer | Deep Learning, Python, MLOps, Data Pipeline, Cloud | Weighted avg of skill masteries |
| Web Developer | HTML/CSS, JavaScript, React, Node.js, Databases | Weighted avg of skill masteries |
| Cybersecurity Analyst | Networking, Linux, Cryptography, SIEM, Pen Testing | Weighted avg of skill masteries |

**Match Percentage:** Average mastery of required skills vs. career threshold

### 13.5 Node Status System

```
🔒 locked     → Previous node not completed
🔓 available  → Previous node completed, can start
🔄 in_progress→ Currently studying (mastery 50-99% of threshold)
✅ completed  → Mastery threshold reached
⭐ recommended→ AI suggests focusing here next
```

---

## 14. Course Player & Progress

### 14.1 Course Player

**View:** `course-player-view.tsx`

The course player is an **immersive full-screen** learning interface:

```
┌────────────────────────────────────────────────────┐
│ [← Back] Course Title                    [⚙️] [📋]│
├──────────┬─────────────────────────────────────────┤
│ Module 1 │                                         │
│ ✓ Lesson 1│        Video Player /                  │
│ ✓ Lesson 2│        Text Content /                  │
│ ▶ Lesson 3│        Interactive Content              │
│ ○ Lesson 4│                                         │
│ Module 2 │                                         │
│ ○ Lesson 5│        [Ask ShijlAI Sidepanel]          │
│ ○ Lesson 6│                                         │
│          │                                         │
│ Progress │  [← Previous]  [Mark Complete]  [Next →] │
│ ████░░ 65%│                                        │
└──────────┴─────────────────────────────────────────┘
```

### 14.2 Lesson Types Supported

| Type | Icon | Player Mode |
|------|------|-------------|
| `video` | 🎥 | Video player with progress tracking |
| `text` | 📄 | Rich text content with markdown rendering |
| `interactive` | 🎮 | Interactive code/exercise component |
| `quiz` | ❓ | Embedded quiz within lesson |
| `assignment` | 📝 | Assignment description + submission |
| `live-session` | 🔴 | Live session link + recording |
| `download` | 📥 | Downloadable resource link |

### 14.3 Progress Tracking

**API:** `PATCH /api/progress`

```typescript
// When student marks lesson complete:
{
    enrollmentId: string,
    lessonId: string,
    status: 'completed',
    timeSpent: number      // minutes
}

// Backend processing:
1. Upsert LessonProgress record
2. Award XP: 25 XP per lesson (first completion only)
3. Recalculate course progress:
   progress = (completed_published_lessons / total_published_lessons) × 100
4. Update enrollment progress + lastAccessed
5. Set completedAt if progress = 100%
6. Update DailyActivity (XP, lessons, time)
7. Award "Course Completer" badge if 100% complete
```

### 14.4 Ask ShijlAI Sidepanel

Within the course player, students can access a **resizable Ask ShijlAI sidepanel** that:
- Pre-loads the current course context into the AI chat
- Allows asking questions about the current lesson
- Provides quick actions relevant to the lesson content
- Can be resized by dragging the panel border

---

## 15. Quiz System

### 15.1 Quiz Flow

**View:** `quiz-view.tsx`
**API Endpoints:** `GET /api/quizzes/[id]`, `POST /api/quizzes/[id]/attempt`

```
┌────────────────────────────────────┐
│  Quiz: Python Fundamentals         │
│  Question 3 of 10                  │
├────────────────────────────────────┤
│                                    │
│  What is the output of:            │
│  print(type([1,2,3]))              │
│                                    │
│  ○ A) <class 'tuple'>             │
│  ○ B) <class 'list'>              │
│  ○ C) <class 'set'>               │
│  ○ D) <class 'dict'>              │
│                                    │
│          [Submit Answer]           │
└────────────────────────────────────┘
```

### 15.2 Question Types

| Type | Format | Scoring |
|------|--------|---------|
| `mcq` | Multiple choice (4 options) | Binary correct/incorrect |
| `true_false` | True/False | Binary correct/incorrect |
| `fill_blank` | Fill in the blank | Exact match (case-insensitive) |
| `short_answer` | Free text | AI-evaluated |

### 15.3 Quiz Attempt Scoring

```typescript
// XP and coins awarded:
const baseXP = 20
const passBonus = score >= 50 ? 30 : 0       // +30 XP for passing
const perfectBonus = score === 100 ? 50 : 0   // +50 XP for perfect score
const totalXP = baseXP + passBonus + perfectBonus

const coins = score >= 50 ? 20 : 5            // 20 coins for pass, 5 for fail

// Badge awards:
if (perfectQuizzesCount >= 5) {
    awardBadge("Quiz Master")                  // +100 XP + 50 coins
}
```

### 15.4 Quiz Types

| Type | Purpose | Settings |
|------|---------|----------|
| `practice` | Self-assessment | Unlimited attempts, answers shown |
| `assessment` | Graded evaluation | Limited attempts, answers hidden |
| `diagnostic` | Placement test | Adaptive difficulty |
| `certification` | Final certification | Strict time limit, proctored |

---

## 16. Gamification System

### 16.1 XP Economy

| Activity | XP Earned |
|----------|-----------|
| Lesson completion | +25 XP |
| Quiz base | +20 XP |
| Quiz pass (≥50%) | +30 XP bonus |
| Quiz perfect (100%) | +50 XP bonus |
| Certificate earned | +200 XP |
| Course completion | Badge + bonus |
| AI tutor usage | +3 XP (via event) |
| Daily challenge | Variable (10-50 XP) |

**Level System:** 300 XP per level

```
Level = floor(totalXP / 300) + 1
```

### 16.2 Badges

4 categories of badges:

| Category | Examples | Earned By |
|----------|----------|-----------|
| `achievement` | Course Completer, Quiz Master, Certificate Earner | Reaching milestones |
| `engagement` | 7-Day Streak, Active Learner, AI Explorer | Consistent activity |
| `social` | Community Helper, Study Group Leader | Community participation |
| `special` | Early Adopter, Beta Tester | Special events |

### 16.3 Streak System

- **Daily streak**: Incremented on each day with learning activity
- **Streak freeze**: Allows maintaining streak during planned absences
- **Longest streak**: Tracked as personal best
- **Streak rewards**: Configured via `StreakReward` model

### 16.4 Daily Challenges

```typescript
DailyChallenge {
    id: string
    title: string
    description: string
    type: 'quiz' | 'lesson' | 'practice' | 'ai_session' | 'streak'
    targetValue: number          // e.g., 3 lessons, 1 quiz
    xpReward: number             // 10-50 XP
    coinsReward: number          // 5-25 coins
    isActive: boolean
    expiresAt: DateTime
}
```

### 16.5 Reward Shop

```typescript
RewardShopItem {
    id: string
    name: string
    description: string
    type: 'avatar' | 'theme' | 'badge' | 'feature' | 'discount'
    cost: number                // ShijlCoins
    isAvailable: boolean
}

UserReward {
    id: string
    userId: string
    itemId: string
    purchasedAt: DateTime
}
```

### 16.6 API Endpoint

**`GET /api/gamification`**

Returns:
- User XP, level, coins
- Active badges
- Streak info
- Daily challenges
- Recent XP activities
- Leaderboard position

---

## 17. Community Features

### 17.1 Discussion Forums

**View:** `community-view.tsx`

Students can:
- Create discussion posts (with category tags)
- Reply to existing discussions
- Upvote helpful posts/replies
- Bookmark discussions for later
- Filter by category, sort by date/votes

### 17.2 Study Groups

Students can:
- Create study groups with name, description, and topic
- Join/leave groups
- Post messages within groups
- Share resources (links, files)
- View group member list

### 17.3 Peer Reviews

Students can:
- Review classmates' assignment submissions
- Provide structured feedback (rating + comments)
- Receive reviews on their own submissions

### 17.4 Community Events

Students can:
- View upcoming events (webinars, study sessions, Q&A)
- RSVP to events
- Receive notifications for event reminders

### 17.5 Leaderboard

- Ranked by total XP
- Filterable by time period (weekly, monthly, all-time)
- Shows rank, name, avatar, XP, level, streak

---

## 18. Notifications & Messaging

### 18.1 Notification System

**14 notification types:**

| Type | Trigger |
|------|---------|
| `course_update` | New lesson/quiz added to enrolled course |
| `assignment_due` | Assignment deadline approaching |
| `quiz_result` | Quiz graded |
| `badge_earned` | New badge awarded |
| `streak_warning` | Streak about to expire |
| `message` | New direct message |
| `discussion_reply` | Reply to your discussion post |
| `study_group_invite` | Invited to study group |
| `certificate_ready` | Certificate generated |
| `recommendation` | New AI recommendation |
| `live_session` | Live session starting soon |
| `achievement` | Milestone reached |
| `system` | Platform announcements |
| `community` | Community activity |

**Notification Properties:**
- Priority: `low` / `medium` / `high` / `urgent`
- Action data: Optional deep link
- Expiry: Auto-remove after specified time
- Preferences: Per-type enable/disable

### 18.2 Messaging System

- Direct messages between any two users
- Group conversations (study groups)
- Read receipts
- Emoji picker support
- Message search
- Conversation summaries (AI-generated)

---

## 19. State Management

### 19.1 Zustand Store

**File:** `src/lib/store.ts`
**Persistence Key:** `shijlai-academy-auth`

```typescript
interface AppState {
    // Navigation
    currentView: View              // 103 possible values
    setCurrentView: (view: View) => void

    // Auth
    isAuthenticated: boolean
    pendingAuthEmail: string
    pendingAuthRole: 'student' | 'instructor' | ''

    // User
    currentUser: User | null
    logout: () => void

    // Selections
    selectedCourse: Course | null
    selectedCourseId: string | null
    editingCourseId: string | null
    creatorStep: number
    selectedLesson: Lesson | null
    selectedQuiz: Quiz | null
    selectedArticleId: string | null
    selectedAssignmentId: string | null
    selectedStudentId: string | null
    selectedAIToolId: string | null
    selectedUserId: string | null
    selectedInstructorId: string | null

    // UI
    sidebarOpen: boolean          // default: true
    language: 'en' | 'ur'

    // Data caches
    enrollments: Enrollment[]
    leaderboard: LeaderboardEntry[]
    certificates: Certificate[]
}
```

**Persisted fields:** `isAuthenticated`, `currentUser`, `currentView`, `language`

### 19.2 View Resolution

```typescript
function resolveViewKey(view: View, user: User | null): View {
    if (view === 'dashboard') {
        if (user?.role === 'admin') return 'admin'
        if (user?.role === 'instructor') return 'instructor-dashboard'
        return 'dashboard'
    }
    if (view === 'settings' && user?.role !== 'instructor') {
        return 'student-settings'
    }
    return view
}
```

---

## 20. API Reference

### 20.1 Authentication APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/register` | Register new account |
| POST | `/api/auth/verify-otp` | Verify OTP code |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with OTP |
| POST | `/api/auth/demo-login` | Quick demo account access |

### 20.2 AI Feature APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/ai/shijlai/chat` | 6-mode AI tutor chat |
| GET | `/api/ai/shijlai/sessions` | List chat sessions |
| POST | `/api/ai/shijlai/sessions` | Create new session |
| GET | `/api/ai/shijlai/mastery` | Get topic mastery data |
| POST | `/api/ai/shijlai/mastery` | Update topic mastery |
| GET | `/api/ai/shijlai/profile` | Get learning profile |
| POST | `/api/ai/shijlai/profile` | Recompute profile |
| GET | `/api/ai/shijlai/insights` | Get learning insights |
| POST | `/api/ai/shijlai/insights` | Generate new insights |
| GET | `/api/ai/shijlai/recommendations` | Get recommendations |
| POST | `/api/ai/shijlai/recommendations` | Generate recommendations |
| GET/POST | `/api/ai/shijlai/study-plan` | Study plan management |
| POST | `/api/ai/shijlai/quiz-generator` | AI quiz generation |
| GET/POST | `/api/ai/shijlai/events` | Learning event logging |
| POST | `/api/ai/shijlai/search` | Content search |
| GET/POST | `/api/ai/companion` | AI companion dashboard |
| POST | `/api/ai/chat` | Subject-aware Socratic tutor |
| GET/POST | `/api/ai/tutor` | AI tutor sessions |
| GET/POST/PATCH/DELETE | `/api/ai/study-planner` | Algorithmic study planner |
| GET | `/api/ai/learning-paths` | Learning path generation |
| GET/POST | `/api/ai/mock-interview` | Mock interview system |

### 20.3 Core Platform APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/courses` | Browse courses with filters |
| GET | `/api/courses/catalog` | Course catalog sections |
| GET | `/api/courses/[id]` | Course detail |
| GET/POST | `/api/enrollments` | Enrollment management |
| PATCH | `/api/progress` | Update lesson progress |
| GET | `/api/dashboard` | Dashboard data |
| GET | `/api/gamification` | XP, badges, levels, streaks |
| GET | `/api/skills` | Skill scores |
| GET | `/api/skill-graph` | Skill tree graph data |
| GET | `/api/certificates` | Certificate list |
| GET/POST | `/api/quizzes/[id]` | Quiz detail |
| POST | `/api/quizzes/[id]/attempt` | Submit quiz attempt |
| GET/POST | `/api/notifications` | Notification management |

### 20.4 Student-Specific APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/student/learning` | Learning data |
| GET | `/api/student/progress` | Progress analytics |
| GET | `/api/student/assignments` | Assignment list |
| GET | `/api/student/schedule` | Schedule data |
| GET | `/api/student/goals` | Learning goals |
| GET | `/api/student/streak` | Streak info |
| GET | `/api/student/notes` | Lesson notes |
| GET | `/api/student/bookmarks` | Bookmarked lessons |
| GET | `/api/student/wishlist` | Course wishlist |
| GET | `/api/student/reviews` | Course reviews |
| GET | `/api/student/qa` | Q&A questions |
| GET/POST | `/api/student/messages` | Direct messaging |
| GET | `/api/student/community/discussions` | Discussion forums |
| GET/POST | `/api/student/community/study-groups` | Study groups |
| GET | `/api/student/community/leaderboard` | Leaderboard |
| GET | `/api/student/community/peer-reviews` | Peer reviews |
| GET | `/api/student/community/events` | Community events |

---

## Appendix A: Database Models Used by Student Portal

| Model | Purpose |
|-------|---------|
| `User` | Student profile, XP, level, coins, streak |
| `UserSession` | Login session tracking |
| `Course` | Course data with pricing and metadata |
| `Module` | Course module structure |
| `Lesson` | Individual lesson content |
| `Enrollment` | Student-course relationship with progress |
| `LessonProgress` | Per-lesson completion status and time |
| `Quiz` | Quiz configuration |
| `Question` | Quiz questions |
| `QuizAttempt` | Student quiz submissions with scores |
| `Assignment` | Assignment descriptions |
| `Submission` | Student assignment submissions |
| `StudentLearningProfile` | AI-computed learning profile |
| `TopicMastery` | Per-topic mastery scores with component breakdown |
| `SkillTopicMapping` | Links between skills and topics |
| `AIRecommendation` | Personalized learning recommendations |
| `LearningInsight` | AI-generated learning insights |
| `StudyPlan` / `StudyPlanTask` | AI study plans with daily tasks |
| `ShijlAISession` / `ShijlAIMessage` | Ask ShijlAI conversations |
| `ConversationSummary` | AI-generated conversation summaries |
| `TutorSession` / `ChatMessage` | AI tutor sessions |
| `AICompanionMessage` / `AICompanionEvent` | Companion interactions |
| `StudentAIActivity` | AI usage tracking log |
| `LearningMetric` | Raw learning event data |
| `LearningPath` / `LearningPathNode` | Structured learning paths |
| `Badge` / `UserBadge` | Gamification badges |
| `XPRule` / `LevelConfig` | XP and level configuration |
| `StreakFreeze` / `DailyChallenge` | Streak and challenge system |
| `RewardShopItem` / `UserReward` | Reward shop |
| `DailyActivity` | Daily XP/lesson/quiz/time tracking |
| `Certificate` | Course completion certificates |
| `Conversation` / `Message` | Direct messaging |
| `Notification` | Notification delivery |
| `DiscussionPost` / `DiscussionReply` | Community forums |
| `StudyGroup` / `StudyGroupMember` | Study groups |
| `Wishlist` | Course wishlist |
| `Review` | Course reviews |
| `QAQuestion` / `QAAnswer` | Course Q&A |
| `StudentSettings` | Student preferences |

## Appendix B: Key Formulas Reference

| Formula | Equation | Section |
|---------|----------|---------|
| Topic Mastery | M = 0.50×Q + 0.25×A + 0.15×P + 0.10×C | 5.5.1 |
| Temporal Decay | M(t) = M₀ × (1 - 0.005 × max(0, t-7)) | 5.5.3 |
| Recommendation Priority | P = 0.40×W + 0.20×CR + 0.20×EM + 0.20×R | 11.2 |
| Drop Risk | DR = 0.30×LE + 0.30×LC + 0.20×DS + 0.20×I | 5.3.1 |
| Learning Speed | LS = (completed / hours) × 10 | 5.3.1 |
| Consistency | CS = (activeDays / totalDays) × 100 | 5.3.1 |
| Level | L = floor(XP / 300) + 1 | 16.1 |

## Appendix C: LLM Integration Points

| Feature | SDK Import | System Prompt Complexity | Context Richness |
|---------|-----------|--------------------------|-----------------|
| Ask ShijlAI Chat | `await import('z-ai-web-dev-sdk')` | High (mode + profile + mastery + course) | ★★★★★ |
| AI Companion | `await import('z-ai-web-dev-sdk')` | High (profile + mastery + personality) | ★★★★★ |
| Subject-Aware Chat | `import ZAI from 'z-ai-web-dev-sdk'` | Medium (subject + curriculum) | ★★★☆☆ |
| AI Tutor | `import ZAI from 'z-ai-web-dev-sdk'` | Low (subject + language only) | ★★☆☆☆ |
| Mock Interview | `import ZAI from 'z-ai-web-dev-sdk'` | High (domain + mastery + evaluation) | ★★★★★ |
| Study Planner (LLM) | `import ZAI from 'z-ai-web-dev-sdk'` | Medium (profile + subjects) | ★★★☆☆ |
| Study Planner (Algorithmic) | `require('z-ai-web-dev-sdk')` | Low (tips only) | ★★☆☆☆ |
| Learning Insights | `await import('z-ai-web-dev-sdk')` | Medium (profile + metrics) | ★★★☆☆ |
| Recommendations | `await import('z-ai-web-dev-sdk')` | Medium (profile + mastery + event) | ★★★★☆ |
| Quiz Generator | `import ZAI from 'z-ai-web-dev-sdk'` | Medium (course content + difficulty) | ★★★☆☆ |
