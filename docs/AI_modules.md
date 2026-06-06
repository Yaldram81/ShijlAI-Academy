# ShijlAI Academy — AI Modules: Complete Technical Documentation

> Comprehensive technical documentation of every AI feature, algorithm, LLM integration pattern, and data model across all three portals (Student, Instructor, Admin).

---

## Table of Contents

1. [AI Architecture Overview](#1-ai-architecture-overview)
2. [Adaptive Learning Engine](#2-adaptive-learning-engine)
3. [Student Portal — AI Features](#3-student-portal--ai-features)
4. [Instructor Portal — AI Features](#4-instructor-portal--ai-features)
5. [Admin Portal — AI Features](#5-admin-portal--ai-features)
6. [Cross-Portal — Intelligent Analytics Engine](#6-cross-portal--intelligent-analytics-engine)
7. [LLM Integration Patterns](#7-llm-integration-patterns)
8. [AI Message Renderer](#8-ai-message-renderer)
9. [AI Configuration & Governance](#9-ai-configuration--governance)
10. [Prisma Models for AI](#10-prisma-models-for-ai)
11. [API Reference — Complete Catalog](#11-api-reference--complete-catalog)
12. [Algorithms & Formulas Reference](#12-algorithms--formulas-reference)

---

## 1. AI Architecture Overview

### 1.1 Platform AI Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ShijlAI Academy — AI Ecosystem                       │
├─────────────────────┬───────────────────────┬───────────────────────────────┤
│   Student Portal    │  Instructor Portal    │       Admin Portal            │
│                     │                       │                               │
│ ┌─────────────────┐ │ ┌───────────────────┐ │ ┌───────────────────────────┐ │
│ │ Ask ShijlAI     │ │ │ AI Copilot (9     │ │ │ Admin Copilot (3-module   │ │
│ │ (6 modes)       │ │ │  actions)         │ │ │  pipeline, 9 intents)     │ │
│ └────────┬────────┘ │ └────────┬──────────┘ │ └───────────┬───────────────┘ │
│ ┌────────┴────────┐ │ ┌────────┴──────────┐ │ ┌───────────┴───────────────┐ │
│ │ Learning        │ │ │ 14 Standalone     │ │ │ System Intelligence       │ │
│ │ Companion       │ │ │ AI Endpoints      │ │ │ (5 engines)               │ │
│ │ (5 rules)       │ │ │                   │ │ └───────────┬───────────────┘ │
│ └────────┬────────┘ │ └────────┬──────────┘ │ ┌───────────┴───────────────┐ │
│ ┌────────┴────────┐ │ ┌────────┴──────────┐ │ │ AI Report Generator       │ │
│ │ Mock Interview  │ │ │ Smart Assessment  │ │ │ (5 report types)          │ │
│ │ (4 domains, 3   │ │ │ (5 tabs, AI-     │ │ └───────────┬───────────────┘ │
│ │  difficulties)  │ │ │  powered insights)│ │ ┌───────────┴───────────────┐ │
│ └────────┬────────┘ │ └────────┬──────────┘ │ │ Course Quality Analyzer   │ │
│ ┌────────┴────────┐ │ ┌────────┴──────────┐ │ │ (5 dimensions)            │ │
│ │ Floating        │ │ │ Intelligent       │ │ └───────────┬───────────────┘ │
│ │ Companion FAB   │ │ │ Analytics (AI     │ │ ┌───────────┴───────────────┐ │
│ │ (3 personalities│ │ │  insights)        │ │ │ Revenue Forecasting       │ │
│ └────────┬────────┘ │ └────────┬──────────┘ │ │ (linear regression)       │ │
│ ┌────────┴────────┐ │ ┌────────┴──────────┐ │ └───────────┬───────────────┘ │
│ │ AI Study        │ │ │ Course Creator    │ │ ┌───────────┴───────────────┐ │
│ │ Planner         │ │ │ AI Panel          │ │ │ AI Config & Governance    │ │
│ │ (algorithmic +  │ │ │ (6 quick actions) │ │ │ (providers, models,       │ │
│ │  AI-enhanced)   │ │ │                   │ │ │  templates, audit)        │ │
│ └────────┬────────┘ │ └──────────────────┘ │ └───────────┬───────────────┘ │
│ ┌────────┴────────┐ │                       │ ┌───────────┴───────────────┐ │
│ │ Recommendation  │ │                       │ │ Course Review AI Analysis │ │
│ │ Engine          │ │                       │ │ (structured LLM review)   │ │
│ └────────┬────────┘ │                       │ └───────────────────────────┘ │
│ ┌────────┴────────┐ │                       │                               │
│ │ Learning Paths  │ │                       │                               │
│ │ (course + career│ │                       │                               │
│ │  path AI)       │ │                       │                               │
│ └─────────────────┘ │                       │                               │
├─────────────────────┴───────────────────────┴───────────────────────────────┤
│                     Adaptive Learning Engine (7 Services)                    │
│  Event → Feature → Profile → Mastery → Recommendation → Study Planner      │
├─────────────────────────────────────────────────────────────────────────────┤
│                     LLM Layer — z-ai-web-dev-sdk                            │
│  Dynamic import (Student/Admin) │ Direct import (Instructor)                │
├─────────────────────────────────────────────────────────────────────────────┤
│                     Database Layer — Prisma/SQLite                           │
│  28+ AI-specific models + 20+ AI API routes + 10 AI views                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 AI Feature Count Summary

| Portal | AI Features | API Endpoints | Components | Views |
|--------|------------|---------------|------------|-------|
| **Student** | 8 | 15 | 5 | 8 |
| **Instructor** | 14+ | 26 | 2 | 4 |
| **Admin** | 6 | 15 | 1 | 4 |
| **Cross-Portal** | 1 (Intelligent Analytics) | 1 | 0 | 0 |
| **Learning Engine** | 7 services | — | — | — |
| **Total** | **36** | **57** | **8** | **16** |

### 1.3 SDK Integration Pattern

```typescript
// Pattern 1: Dynamic import (Student & Admin routes)
const ZAI = (await import('z-ai-web-dev-sdk')).default
const zai = await ZAI.create()
const completion = await zai.chat.completions.create({
  messages: [...],
  thinking: { type: 'disabled' },
})

// Pattern 2: Direct import (Instructor routes)
import ZAI from 'z-ai-web-dev-sdk'
const zai = await ZAI.create()
const completion = await zai.chat.completions.create({
  messages: [...],
  thinking: { type: 'disabled' },
})

// Pattern 3: Specific model selection (Instructor suggest-reply)
const result = await sdk.chat.completions.create({
  messages: [...],
  model: 'deepseek-ai/DeepSeek-V3',
})
```

---

## 2. Adaptive Learning Engine

> The Learning Engine is the **data backbone** of all student-facing AI features. It is a pipeline of 7 services that transform raw learning events into personalized intelligence.

### 2.1 Service Dependency Graph

```
                    ┌──────────────┐
                    │ Event Service │ ← User Actions (frontend)
                    └──────┬───────┘
                           │ logEvent()
              ┌────────────┼────────────────┐
              ▼                              ▼
    ┌──────────────────┐          ┌──────────────────┐
    │  Mastery Service │          │ Profile Service  │
    │  updateTopic     │          │  updateStudent   │
    │  Mastery()       │          │  Profile()       │
    └────────┬─────────┘          └────────┬─────────┘
             │                             │
             │  getWeakTopics()            │ 5x Feature Engine
             │  getStrongTopics()          │ compute*()
             │  getAllMasteries()          │
             ▼                             ▼
    ┌──────────────────────────────────────────────┐
    │           Recommendation Engine               │
    │    generateRecommendations()                  │
    │    computePriorityScore()                     │
    └──────────────────┬───────────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────────┐
    │            Study Planner Service              │
    │    generateStudyPlan()                        │
    │    generateAIPlanEnhancement()                │
    └──────────────────────────────────────────────┘
```

### 2.2 Event Service (`event-service.ts`)

**Purpose**: Single entry point for all learning events. If an action is not logged here, it does not exist for the AI system.

```typescript
// File: src/services/learning-engine/event-service.ts

interface LogEventParams {
  userId: string
  eventType: string
  eventValue?: number
  courseId?: string
  topicId?: string
  metadata?: Record<string, unknown>
}

async function logEvent(params: LogEventParams): Promise<void> {
  // 1. Insert event record
  await db.learningMetric.create({ data: { ... } })

  // 2. Update topic mastery if topic specified
  if (topicId) {
    const scoreDelta = computeScoreDelta(eventType, eventValue)
    await updateTopicMastery({ userId, topicId, courseId, scoreDelta })
  }

  // 3. Trigger profile recomputation (5-min throttle)
  await updateStudentProfile(userId)
}
```

**Score Delta Table**:

| Event Type | Score Delta | Rationale |
|-----------|-------------|-----------|
| `quiz_attempted` | `value × 0.3` | 30% of quiz score contributes to mastery |
| `lesson_completed` | `+15` | Fixed bonus for completing a lesson |
| `assignment_submitted` | `value × 0.25` | 25% of assignment score |
| `video_watched` | `+5` | Small bonus for content consumption |
| `ai_tutor_used` | `+3` | Small bonus for AI interaction |
| Default | `value × 0.1` | 10% fallback |

### 2.3 Feature Engine (`feature-engine.ts`)

**Purpose**: Computes 5 student metrics from raw events. All metrics are 0-100 scaled.

#### 2.3.1 Learning Speed

```typescript
async function computeLearningSpeed(userId: string): Promise<number> {
  // Formula: (completedLessons / hoursSpent) × 10
  // Capped: 0-100
  // Default: 50 (no data)
}
```

| Score Range | Interpretation |
|-------------|---------------|
| 0-30 | Slow learner — needs more time per lesson |
| 30-70 | Moderate speed |
| 70-100 | Fast learner — quick comprehension |

#### 2.3.2 Engagement Score

```typescript
async function computeEngagementScore(userId: string): Promise<number> {
  // Components (7-day window):
  //   logins × 5        (max 35 pts from 7 logins)
  // + hours × 4         (uncapped, practical max ~60)
  // + quizzes × 2       (max 20 pts from 10 quizzes)
  // + aiUsage × 1.5     (max 15 pts from 10 uses)
  // + lessons × 0.5     (max 5 pts from 10 lessons)
  // Capped: 0-100
}
```

| Component | Weight | Practical Max |
|-----------|--------|--------------|
| Login frequency | 5× per login | 35 (7 logins) |
| Time spent | 4× per hour | ~60 (15 hrs) |
| Quiz attempts | 2× per quiz | 20 (10 quizzes) |
| AI tutor usage | 1.5× per use | 15 (10 uses) |
| Lessons completed | 0.5× per lesson | 5 (10 lessons) |

#### 2.3.3 Consistency Score

```typescript
async function computeConsistencyScore(userId: string): Promise<number> {
  // Formula: (activeDays / totalDaysEnrolled) × 100
  // Penalty: -10 if streak < 3
  // Capped: 0-100
}
```

#### 2.3.4 Average Performance

```typescript
async function computeAveragePerformance(userId: string): Promise<number> {
  // Average of all quiz scores + assignment grades
  // Returns: 0-100
}
```

#### 2.3.5 Drop Risk Score

```typescript
async function computeDropRisk(userId: string): Promise<number> {
  // Weighted formula:
  //   lowEngagement  × 0.30   // 100 - engagementScore
  // + lowConsistency × 0.30   // 100 - consistencyScore
  // + decliningScore × 0.20   // 2 × (olderAvg - recentAvg) if declining
  // + inactivity     × 0.20   // min(100, daysInactive × 5)
  // Capped: 0-100
}
```

| Score | Risk Level | Recommended Action |
|-------|-----------|-------------------|
| 0-20 | Low | Continue normal learning |
| 20-40 | Moderate | Increase study consistency |
| 40-60 | High | Create study plan, set reminders |
| 60-80 | Critical | Immediate intervention, AI companion check-in |
| 80-100 | Severe | Academic advisor notification |

### 2.4 Profile Service (`profile-service.ts`)

**Purpose**: Aggregates all 5 feature metrics into a unified student profile with caching.

```typescript
async function updateStudentProfile(userId: string) {
  // THROTTLE: Skip if computed < 5 minutes ago

  // STEP 1: Run all 5 features in parallel
  const [learningSpeed, engagement, consistency, performance, dropRisk] =
    await Promise.all([
      computeLearningSpeed(userId),
      computeEngagementScore(userId),
      computeConsistencyScore(userId),
      computeAveragePerformance(userId),
      computeDropRisk(userId),
    ])

  // STEP 2: Apply time decay to stale topics
  await applyTimeDecay(userId)

  // STEP 3: Get weak (<50%) and strong (>75%) topics
  const weakTopics = await getWeakTopics(userId, 50)
  const strongTopics = await getStrongTopics(userId, 75)

  // STEP 4: Determine learning level
  //   avgMastery < 40 || performance < 50  → beginner
  //   avgMastery < 70 || performance < 75  → intermediate
  //   otherwise                            → advanced

  // STEP 5: Determine learning speed category
  //   < 40 → slow, 40-70 → moderate, > 70 → fast

  // STEP 6: Upsert StudentLearningProfile
}
```

### 2.5 Mastery Service (`mastery-service.ts`)

**Purpose**: Tracks per-topic mastery with weighted scoring and time decay.

#### Weighted Mastery Formula

```
masteryScore = quizScore × 0.50
             + assignmentScore × 0.25
             + practiceScore × 0.15
             + completionScore × 0.10
```

#### Mastery Status Labels

| Score Range | Status | Display |
|-------------|--------|---------|
| 0-25% | `not_started` | ⚪ Not Started |
| 25-50% | `weak` | 🔴 Weak |
| 50-75% | `learning` | 🟡 Learning |
| 75-90% | `strong` | 🟢 Strong |
| 90-100% | `mastered` | 🌟 Mastered |

#### Time Decay Algorithm

```typescript
async function applyTimeDecay(userId: string): Promise<number> {
  // Trigger: Last practiced > 7 days ago, decay not yet applied
  // Formula: decayFactor = 1 - (0.005 × daysOverThreshold)
  // Applied to ALL component scores proportionally
}
```

**Decay Example**:
```
Topic: Python Loops
- Last practiced: 30 days ago
- Original scores: quiz=85, assignment=70, practice=60, completion=90
- Days over threshold: 30 - 7 = 23
- Decay factor: 1 - (0.005 × 23) = 0.885
- New scores: quiz=75.2, assignment=61.9, practice=53.1, completion=79.7
- New mastery: 75.2×0.5 + 61.9×0.25 + 53.1×0.15 + 79.7×0.1 = 69.9
- Status change: "strong" → "learning"
```

#### Trend Detection

```typescript
// After updating mastery:
const delta = newMastery - existing.masteryScore
if (delta > 2) trend = 'improving'
else if (delta < -2) trend = 'declining'
else trend = 'stable'
```

#### Skill Mastery Aggregation

```typescript
async function computeSkillMasteries(userId: string) {
  // Group TopicMastery records by skillId via SkillTopicMapping
  // Weighted average: Σ(score × weight) / Σ(weight)
  // Fallback: auto-group by topicId prefix if no mappings exist
}
```

### 2.6 Recommendation Engine (`recommendation-engine.ts`)

**Purpose**: Generates adaptive, prioritized learning recommendations.

#### 4-Step Pipeline

1. **Identify weak areas** — Fetch weak topics, profile, and all masteries
2. **Map prerequisites** — Find incomplete modules in enrolled courses
3. **Apply recommendation rules** — 5 rules (see below)
4. **Score and prioritize** — `computePriorityScore()` with weighted factors

#### Recommendation Rules

| Rule | Condition | Type | Priority |
|------|-----------|------|----------|
| Very weak topic | mastery < 30% | `topic` + `quiz` | HIGH |
| Weak topic | mastery 30-50% | `lesson` | MEDIUM |
| Incomplete modules | module mastery < 40% | `lesson` | HIGH |
| Strong topic → advance | mastery > 75% | `course` | LOW |
| High drop risk | dropRisk > 60% | `study_plan` | HIGH |
| Moderate drop risk | dropRisk 30-60% | `study_plan` | MEDIUM |

#### Priority Score Formula

```
priorityScore = weakness × 0.40
              + careerRelevance × 0.20
              + engagementMatch × 0.20
              + recencyNeed × 0.20
```

**Weight Rationale**: Weakness dominates (40%) because students should focus on struggling areas. The remaining 60% is equally split between career alignment, engagement level, and urgency.

### 2.7 Study Planner Service (`study-planner-service.ts`)

**Purpose**: Generates algorithmic study plans with optional AI enhancement.

#### Plan Generation Algorithm

```
STEP 1: Calculate days remaining until exam
STEP 2: Fetch student profile + enrolled courses
STEP 3: Build topic list (merge profile masteries + custom topics)
STEP 4: Distribute topics by weight:
         weak topics:    40% allocation
         moderate:       30% allocation
         strong:         15% allocation
STEP 5: Generate daily tasks with phase-based types:
         Early (0-40%):  study, ai_discussion, quiz
         Middle (40-75%): study, practice, quiz
         Late (75-100%):  revision, mock_exam, practice
         Every 3rd day: review day (all revision)
         Day before exam: mock_exam first
STEP 6: AI enhancement (optional):
         generateAIPlanEnhancement() → tips + focus areas
STEP 7: Save to DB (StudyPlan + StudyPlanTask records)
```

#### Task Duration Distribution

| Daily Hours | Tasks Per Day |
|-------------|--------------|
| ≤ 1 hour | 1 task |
| 1-2 hours | 2 tasks |
| 2-4 hours | 3 tasks |
| > 4 hours | 4 tasks |

---

## 3. Student Portal — AI Features

### 3.1 Ask ShijlAI — Conversational AI

**Endpoint**: `POST /api/ai/shijlai/chat`

**6 AI Modes**:

| Mode | Purpose | Output Style |
|------|---------|-------------|
| `tutor` | General learning buddy | Conversational, encouraging, no structured plans |
| `quiz` | Practice questions | Structured Q&A with options and explanations |
| `assignment` | Assignment helper | Numbered steps with time estimates |
| `study_planner` | Study schedules | Day-by-day plan with emoji task indicators |
| `career_advisor` | Career guidance | Phase-based roadmaps with timeframes |
| `companion` | Learning companion | Warm, caring, proactive observations |

**Context Engineering Pipeline**:

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Student      │    │ Weak Topic   │    │ Course       │    │ Conversation │
│ Profile      │    │ Mastery      │    │ Structure    │    │ Summary      │
│ (metrics,    │ ──▶│ (top 5 weak  │ ──▶│ (modules,    │ ──▶│ (if msgCount │
│  drop risk,  │    │  with trend) │    │  lessons)    │    │  > 20)       │
│  engagement) │    │              │    │              │    │              │
└─────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ System Prompt Construction                                       │
│                                                                   │
│ 1. Mode-specific base prompt                                     │
│ 2. + Student profile metrics (level, engagement, drop risk)     │
│ 3. + Drop risk context (high > 60: extra encouragement)         │
│ 4. + Low engagement context (< 30: make interactive)            │
│ 5. + Low consistency context (< 30: encourage daily habits)     │
│ 6. + Weak topic mastery details (extra explanations for these)  │
│ 7. + Current course structure (if courseId provided)             │
│ 8. + Previous conversation summary (if available)                │
│ 9. + Quick action context (simpler/examples/test/translate)      │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ LLM Call → z-ai-web-dev-sdk                                     │
│ messages: [systemPrompt, ...recentMessages(10)]                  │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Post-Processing                                                   │
│ 1. Save AI response to ShijlAIMessage                            │
│ 2. Update session message count                                  │
│ 3. If msgCount > 20: generate conversation summary via LLM      │
│ 4. Log ai_tutor_used event for learning engine                   │
│ 5. Create StudentAIActivity record                               │
└─────────────────────────────────────────────────────────────────┘
```

**Adaptive Behavior Examples**:

| Student State | System Prompt Addition |
|--------------|----------------------|
| Drop risk > 60 | "⚠️ IMPORTANT: This student has a HIGH drop risk score. Be especially encouraging, offer specific study strategies, and suggest breaking work into smaller achievable tasks." |
| Engagement < 30 | "Note: This student's engagement is low. Try to make the conversation interactive and engaging. Ask questions and provide quick wins." |
| Consistency < 30 | "Note: This student's consistency is low. Encourage daily study habits and small consistent steps." |

**Quick Actions**:

| Action | Context Added |
|--------|-------------|
| `explain_simpler` | "The student wants a simpler explanation. Break it down into basic concepts." |
| `more_examples` | "The student wants more examples. Provide 2-3 additional examples." |
| `test_me` | "The student wants to be tested. Generate a practice question." |
| `translate` | "The student wants a translation. Provide content in Urdu as well." |

### 3.2 AI Learning Companion

**Endpoint**: `GET/POST /api/ai/companion`

**5 Proactive Rules**:

| Rule | Trigger | Insight Type |
|------|---------|-------------|
| Inactivity Alert | No activity ≥ 5 days | `warning` |
| Weak Topic Alert | Topic mastery < 30% | `alert` |
| Study Plan Missed | Overdue study plan task | `reminder` |
| Exam Approaching | Exam ≤ 14 days away | `urgent` |
| Achievement | Streak milestone or mastery improvement | `celebration` |

**Companion Engine Pipeline**:

```
1. buildStudentDataContext(userId)
   → Fetches: topic masteries, enrollments, study plans, quiz attempts, learning profile

2. runCompanionEngine(context)
   → Evaluates 5 rules against context
   → Generates insights with urgency levels

3. buildTodaysFocus(weakTopics, studyPlans)
   → Priority-sorted focus topics for today

4. buildSuggestedActions(insights, profile)
   → Actionable next steps

5. buildCompanionChat(context, userMessage)
   → LLM-powered personalized chat response
```

**3 Personality Modes** (Floating FAB):

| Mode | Style |
|------|-------|
| Coach | Motivational, challenging, accountability-focused |
| Mentor | Wise, patient, experienced guidance |
| Advisor | Strategic, analytical, goal-oriented |

**Dashboard Response Schema**:

```typescript
interface CompanionDashboardResponse {
  focusTopics: FocusTopic[]       // Today's priority topics
  insights: CompanionInsight[]    // AI-generated insights
  suggestedActions: SuggestedAction[]
  stats: CompanionStats           // unread, streak, mastery, topics
  companionChat: CompanionChat    // Chat messages
}
```

### 3.3 AI Mock Interview

**Endpoint**: `GET/POST /api/ai/mock-interview`

**4 Interview Domains**:

| Domain | Technical Topics | Behavioral Topics |
|--------|-----------------|-------------------|
| Python | Variables, OOP, Data Structures, Decorators, Async | Problem-solving, Team collaboration |
| Machine Learning | Supervised/Unsupervised, Neural Networks, NLP, MLOps | Project approach, Ethics |
| Web Development | HTML/CSS, JavaScript, React, APIs, Security | User empathy, Debugging approach |
| Data Science | Statistics, SQL, Visualization, ETL, Big Data | Communication, Stakeholder management |

**3 Difficulty Levels**: Beginner, Intermediate, Advanced

**4 Interview Types**: Technical, Behavioral, Mixed, Viva

**4-Phase UX**:

```
Dashboard → Setup → Interview → Report
   │          │         │          │
   │          │         │          └─ Skill updates, strengths/weaknesses
   │          │         └─ Submit answers, real-time evaluation
   │          └─ Select domain, difficulty, type
   └─ View past interviews, stats
```

**LLM Integration**:

- `generateQuestionsWithLLM()` — AI-generated interview questions per domain/difficulty
- `evaluateAnswerWithLLM()` — AI answer evaluation with 0-100 score, feedback, and improvement tips
- **Heuristic fallback**: `evaluateAnswerHeuristic()` — keyword matching when LLM fails

**Evaluation Result Schema**:

```typescript
interface EvaluationResult {
  score: number           // 0-100
  feedback: string        // What was good
  improvements: string    // What to improve
  keyPoints: string[]     // Expected answer points
  coveredPoints: string[] // Points the student addressed
  missedPoints: string[]  // Points the student missed
}
```

### 3.4 AI Tutor (Standalone)

**Endpoint**: `POST /api/ai/tutor`

**Features**:
- Socratic method — asks probing questions rather than giving direct answers
- Session management — auto-create/update tutor sessions
- Quick actions — `explain_simpler`, `more_examples`, `test_me`, `translate`
- XP rewards — +5 XP per AI interaction
- Multilingual support — responds in student's preferred language
- International curriculum alignment — references IB, AP, Cambridge, Common Core

### 3.5 AI Study Planner

**Endpoint**: `GET/POST/PATCH/DELETE /api/ai/study-planner`

**HTTP Methods**:

| Method | Purpose |
|--------|---------|
| `GET` | List plans, get today's tasks, view specific plan |
| `POST` | Create new study plan with AI enhancement |
| `PATCH` | Update task status (`pending`→`in_progress`→`completed`/`skipped`) |
| `DELETE` | Abandon/delete a plan |

**Request Schema**:

```typescript
interface GenerateStudyPlanRequest {
  userId: string
  courseId?: string
  courseName?: string
  examDate: string        // ISO date, must be future
  targetGrade?: string
  currentGrade?: string
  dailyHours?: number     // 0.5-16, default 2
  weakTopics?: string[]
  strongTopics?: string[]
}
```

### 3.6 AI Learning Paths

**Endpoint**: `GET /api/ai/learning-paths`

**Two Path Types**:

1. **Course Learning Path** — Module-by-module progression within an enrolled course
2. **Career Learning Path** — Multi-course roadmap toward a career goal (Data Scientist, ML Engineer, Web Developer, Cybersecurity Analyst)

**Node Status Logic**:

```typescript
function determineNodeStatus(mastery: number): string {
  if (mastery >= 90) return 'completed'
  if (mastery >= 50) return 'in_progress'
  if (mastery > 0) return 'started'
  return 'locked'
}
```

### 3.7 AI Recommendations View

**Endpoint**: `GET /api/ai/shijlai/recommendations`

Powered by the Recommendation Engine (Section 2.6). Returns priority-scored recommendations with types: `topic`, `quiz`, `lesson`, `course`, `study_plan`.

### 3.8 ShijlAI Hub

**Central AI features hub** that provides navigation to all student AI features:
- Ask ShijlAI Chat
- Learning Companion
- Mock Interview
- Study Planner
- Learning Paths
- Recommendations
- AI Tutor

---

## 4. Instructor Portal — AI Features

### 4.1 AI Copilot — Central Command

**Endpoint**: `POST/GET /api/instructor/copilot`

**9 Copilot Actions**:

| Action | Purpose | LLM Output |
|--------|---------|-----------|
| `generate-outline` | Course outline generation | JSON: modules → lessons |
| `generate-outcomes` | Learning outcomes | JSON: outcomes[] |
| `generate-structure` | Lesson structure | JSON: keyConcepts, examples, quizQuestions |
| `generate-content` | Detailed lesson content | JSON: notes, examples, exercises |
| `generate-quiz` | Quiz question generation | JSON: questions[] with types |
| `generate-assignment` | Assignment brief | JSON: title, instructions, deliverables |
| `generate-rubric` | Grading rubric | JSON: criteria with 4 performance levels |
| `improvement-insights` | Course improvement advice | JSON: insights with severity/action |
| `review-approve` | Review AI-generated content | DB update: approve/reject |

**LLM Call Pattern**:

```typescript
async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const zai = await ZAI.create()
  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })
  return completion.choices[0]?.message?.content || ''
}
```

**JSON Parsing Pattern** (used across all instructor AI endpoints):

```typescript
function parseLLMJson(text: string): unknown {
  let cleaned = text.trim()
  // Strip markdown code fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*\n?/, '')
      .replace(/\n?```\s*$/, '')
  }
  return JSON.parse(cleaned)
}
```

**Activity Logging** (every copilot action):

```typescript
await db.instructorAIActivity.create({
  data: {
    instructorId,
    activityType: 'outline_generated', // etc.
    moduleType: 'outline',
    title: 'Generated outline: Machine Learning',
    metadata: JSON.stringify({ outlineId: outline.id }),
  },
})
```

### 4.2 Standalone AI Endpoints (14 routes)

#### 4.2.1 Generate Curriculum

**Endpoint**: `POST /api/instructor/ai/generate-curriculum`

```typescript
// Input
{
  topic: string           // or prompt (from course creator wizard)
  audience?: string       // default: "General students"
  level?: string          // beginner | intermediate | advanced
  sections?: number       // 1-20, default 5
  title?: string
  category?: string
}

// Output
{
  modules: Array<{
    title: string
    description: string
    objectives: string[]
    lessons: Array<{
      title: string
      description: string
      type: "video" | "text" | "quiz" | "assignment" | "interactive" | "download"
      duration: number    // minutes
    }>
  }>,
  content?: string        // raw LLM response fallback
}
```

**Special**: Aligns with international education standards (IB, AP, Cambridge, Common Core).

#### 4.2.2 Generate Quiz

**Endpoint**: `POST /api/instructor/ai/generate-quiz`

```typescript
// Input
{
  topic: string
  count?: number          // 1-20, default 5
  difficulty?: string     // default "medium"
  questionTypes?: string[] // mcq, true_false, fill_blank, short_answer
  moduleId?: string
  courseId?: string
}

// Output
{
  questions: Array<{
    text: string
    type: string
    options: string[]      // 4 for mcq, ["True","False"] for true_false
    correctAnswer: string
    explanation: string | null
    points: number         // 1-5
    order: number
  }>,
  meta: { topic, count, difficulty, questionTypes, moduleId, courseId }
}
```

#### 4.2.3 Generate Assignment

**Endpoint**: `POST /api/instructor/ai/generate-assignment`

```typescript
// Input
{ skill: string, type?: string, course?: string }

// Output
{
  assignment: {
    title: string
    objectives: string[]
    instructions: string
    deliverables: string[]
    wordLimit: string
    rubric: Array<{
      criterion: string
      description: string
      levels: Array<{ label: string, range: string, description: string }>
    }>
  }
}
```

#### 4.2.4 Generate Rubric

**Endpoint**: `POST /api/instructor/ai/generate-rubric`

```typescript
// Input
{
  topic: string
  criteriaCount?: number   // 3-8, default 5
  gradingScale?: string    // default "4-Point"
  assignmentType?: string  // default "Essay"
}

// Output
{
  rubric: {
    title: string
    description: string
    criteria: Array<{
      name: string
      weight: number       // totals 100
      description: string
      levels: Array<{
        label: string
        score: number
        description: string
        indicators: string[]
      }>
    }>
    totalPoints: number
    gradingNotes: string
  }
}
```

#### 4.2.5 Generate Description (SEO-Optimized)

**Endpoint**: `POST /api/instructor/ai/generate-description`

```typescript
// Output
{
  description: {
    seoTitle: string       // < 60 chars
    subtitle: string       // < 120 chars
    description: string    // 200-400 words, SEO-optimized
    learningOutcomes: string[]
    keywords: string[]     // 5-8 SEO keywords
  }
}

// Tone options: professional, friendly, academic, inspiring
```

#### 4.2.6 Generate Outcomes (Bloom's Taxonomy)

**Endpoint**: `POST /api/instructor/ai/generate-outcomes`

```typescript
// Output
{
  outcomes: Array<{
    statement: string       // "Students will be able to ..."
    bloomLevel: string      // Remember|Understand|Apply|Analyze|Evaluate|Create
    domain: string          // Cognitive|Affective|Psychomotor
    actionVerb: string
    measurable: boolean
    assessmentMethod: string
  }>,
  summary: string,
  alignment: string
}
```

#### 4.2.7 Generate Lesson Content

**Endpoint**: `POST /api/instructor/ai/generate-lesson-content`

```typescript
// Output
{
  lesson: {
    title: string
    introduction: string
    keyConcepts: Array<{ name, explanation, analogy }>
    examples: Array<{ title, content, takeaway }>
    exercises: Array<{ title, instructions, difficulty, hint }>
    summary: string
    furtherReading: string[]
  }
}
```

#### 4.2.8 Suggest Reply

**Endpoint**: `POST /api/instructor/ai/suggest-reply`

```typescript
// Input
{ studentName, courseName, lastMessage }

// Output
{ suggestion: string }  // 2-4 sentence warm, professional reply

// Uses model: 'deepseek-ai/DeepSeek-V3'
```

#### 4.2.9 Analyze Feedback

**Endpoint**: `POST /api/instructor/ai/analyze-feedback`

```typescript
// Input
{ reviews: string }  // Raw student feedback text

// Output
{
  analysis: {
    topPraise: string[]
    topIssues: string[]
    sentiment: { positive: number, neutral: number, negative: number, summary: string }
    improvementTips: Array<{ tip, description, priority: "high"|"medium"|"low" }>
  }
}
```

#### 4.2.10 Auto-Respond

**Endpoint**: `POST /api/instructor/ai/auto-respond`

```typescript
// Input
{ question: string, context?: string }

// Output
{
  answer: {
    answer: string
    keyPoints: string[]
    relatedTopics: string[]
    confidence: "high" | "medium" | "low"
  }
}
```

#### 4.2.11 Improve Bio

**Endpoint**: `POST /api/instructor/ai/improve-bio`

```typescript
// Input
{ bio: string, headline?: string }

// Output
{ bio: string }  // Improved professional, SEO-friendly bio (< 300 words)
```

#### 4.2.12 Auto-Caption

**Endpoint**: `POST /api/instructor/ai/auto-caption`

```typescript
// Input
{ content: string, sourceType: "video"|"text", targetLanguage?: string }

// Output
{ captions: string }  // Timestamped captions: [00:00] Caption text
```

#### 4.2.13 Course Insights

**Endpoint**: `POST /api/instructor/ai/course-insights`

```typescript
// Output
{
  insights: Array<{
    title, description, severity, category, action, impact, effort
  }>,
  overallScore: number,
  overallRecommendation: string,
  quickWins: string[],
  longTermGoals: string[]
}
```

### 4.3 Smart Assessment

**3 AI-Powered Assessment Endpoints**:

#### 4.3.1 Generate Assessment Insights

**Endpoint**: `POST /api/instructor/assessment/generate-insights`

```
Data Gathering → AI Analysis → Dual Perspective Output
     │                │
     │                ├─ Student Insights (performance, difficulty, study strategy, knowledge gap)
     │                └─ Instructor Insights (question quality, assessment design, content alignment)
     │
     └─ Sources: learning outcomes, question analytics, distractor analytics,
                 quality scores, quiz attempt summaries
```

#### 4.3.2 Quality Scores

**Endpoint**: `GET /api/instructor/assessment/quality-scores`

**Composite Quality Formula**:

```
overallScore = difficultyBalance × 0.30
             + questionVariety × 0.25
             + outcomeCoverage × 0.25
             + timeFactor × 0.20
```

| Component | Computation |
|-----------|------------|
| Difficulty Balance | `100 - (stdDev of success rates / 50 × 100)` |
| Question Variety | `(unique question types / 4) × 100` |
| Outcome Coverage | `(covered outcomes / total outcomes) × 100` |
| Time Factor | `100` if within ideal, decreasing if over |

#### 4.3.3 Distractor Analysis

**Endpoint**: `GET /api/instructor/assessment/distractor-analysis`

**Weak Distractor Detection**: An incorrect option is **weak** if `selectionRate < 5%` — meaning almost no student chooses it, indicating a poorly designed distractor.

### 4.4 Intelligent Analytics (Instructor)

**Endpoint**: `GET /api/instructor/analytics/insights`

**Data → LLM Pipeline**:

```
Instructor's Courses → Enrollment/Revenue/Completion/Rating Metrics
     → Period-over-Period Comparison (7d/30d/90d)
     → Active/Returning Students
     → Quiz Pass Rates
     → Review Sentiment
     → Data Summary Text
     → LLM Analysis
     → Structured Insights (4-8 items)
```

**Insight Types**: `opportunity`, `warning`, `achievement`, `suggestion`

### 4.5 Course Creator AI Panel

**Component**: `src/components/creator/ai-panel.tsx`

**6 Quick Actions** available during course creation:

| Action | API Called |
|--------|----------|
| Generate Curriculum | `/api/instructor/ai/generate-curriculum` |
| Write Description | `/api/instructor/ai/generate-description` |
| Create Quiz | `/api/instructor/ai/generate-quiz` |
| Suggest Thumbnail | `/api/instructor/ai/generate-thumbnail` |
| Optimize SEO | `/api/instructor/ai/generate-description` (with keywords) |
| Generate Rubric | `/api/instructor/ai/generate-rubric` |

---

## 5. Admin Portal — AI Features

### 5.1 Admin AI Copilot

**Endpoint**: `POST /api/admin/copilot`

**3-Module Pipeline**:

```
┌─────────────────────────────────────────────────────────────┐
│ Module 1: Intent Detection Engine                            │
│                                                               │
│ Input: admin query string                                     │
│ Process: Keyword matching → 9 intents with confidence scores │
│ Output: { intent, confidence }                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Module 2: Data Retrieval Engine                               │
│                                                               │
│ Input: detected intent                                        │
│ Process: 8 data fetcher functions (with demo fallbacks)      │
│ Output: Structured data object for the intent                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Module 3: LLM Reasoning Layer                                 │
│                                                               │
│ Input: intent + data                                          │
│ Process: LLM generates response (fallback: rule-based)       │
│ Output: Natural language response with data citations         │
└─────────────────────────────────────────────────────────────┘
```

**9 Intent Classifiers**:

| Intent | Keywords | Data Fetcher |
|--------|----------|-------------|
| `course_analysis` | course, courses, content | `fetchCourseAnalysisData()` |
| `instructor_analysis` | instructor, teacher | `fetchInstructorAnalysisData()` |
| `student_analysis` | student, learner | `fetchStudentAnalysisData()` |
| `engagement_analysis` | engagement, active | `fetchEngagementData()` |
| `enrollment_analysis` | enrollment, signup | `fetchEnrollmentData()` |
| `risk_analysis` | risk, dropout, at-risk | `fetchRiskAnalysisData()` |
| `report_generation` | report, summary | Platform overview data |
| `search` | find, search, locate | `fetchSearchData()` |
| `platform_overview` | overview, dashboard, summary | `fetchPlatformOverview()` |

### 5.2 System Intelligence

**Endpoint**: `GET /api/admin/system-intelligence`

**5 Intelligence Engines**:

#### Engine 1: Platform Health

| Metric | Computation |
|--------|------------|
| DAU | Users active today |
| WAU | Users active in last 7 days |
| MAU | Users active in last 30 days |
| Avg Session Duration | From daily activity |
| Completion Rate | Enrollments with completedAt / total |
| Retention | WAU/MAU ratio |
| Trends | Comparing current vs previous period |

#### Engine 2: Engagement Intelligence

Per-course engagement score with 4 sub-components:

```
engagementScore = loginScore × 0.25
               + activityScore × 0.25
               + quizScore × 0.25
               + aiUsageScore × 0.15
               + communityScore × 0.10
```

#### Engine 3: Course Intelligence

Course health score:

```
healthScore = enrollmentGrowth × 0.25
            + completionRate × 0.25
            + avgRating × 0.20
            + engagementScore × 0.15
            + assessmentScore × 0.15
```

**Status Categories**:
- 🟢 Excellent: healthScore ≥ 80
- 🟡 Good: healthScore 60-79
- 🟠 Needs Attention: healthScore 40-59
- 🔴 Critical: healthScore < 40

#### Engine 4: Instructor Intelligence

Effectiveness scores with warnings:
- ⚠️ Slow response time (>48 hours to Q&A)
- ⚠️ Low ratings (<3.5/5)
- ⚠️ Low completion rates (<30%)
- ⚠️ Inactivity (>14 days)

#### Engine 5: Alert & Anomaly Engine

**8 Alert Rules**:

| Rule | Condition | Severity |
|------|-----------|----------|
| Enrollment Drop | Course enrollment decrease > 20% vs previous period | `warning` |
| Completion Decrease | Course completion rate drops > 10% | `warning` |
| Instructor Response Time | Avg response > 48 hours | `warning` |
| Student Inactivity | > 20% students inactive > 14 days | `critical` |
| Assessment Quality Drop | Quiz pass rate < 40% | `warning` |
| Enrollment Spike | Course enrollment increase > 50% | `info` |
| Low Course Rating | Course rating < 2.5/5 | `critical` |
| Instructor Inactivity | No activity > 14 days | `warning` |

**AI Insight Generation**:

**Endpoint**: `POST /api/admin/system-intelligence/generate-insights`

Uses LLM to generate insights from the system intelligence data, limited to 200 words.

### 5.3 AI Report Generator

**Endpoint**: `POST/GET /api/admin/reports`

**5 Report Types**:

| Type | Metrics Computed |
|------|-----------------|
| `platform_performance` | Total revenue, enrollments, completion rate, active users, growth rate |
| `course_performance` | Per-course enrollment, rating, completion, revenue, health score |
| `instructor_performance` | Per-instructor courses, students, revenue, rating, response time |
| `student_engagement` | DAU/WAU/MAU, avg session, quiz attempts, AI usage, retention |
| `ai_usage` | Total AI calls, tokens, cost, feature breakdown, error rate |

**Report Generation Pipeline**:

```
1. Create report record (status: "generating")
2. Compute metrics from database
3. Generate LLM executive summary
4. Update report record (status: "completed")
5. Return report with metrics + AI summary
```

**Period Options**: `weekly`, `monthly`, `quarterly`

### 5.4 Course Quality Analyzer

**Endpoint**: `POST/GET /api/admin/course-quality`

**5 Quality Dimensions**:

```
overallScore = structureScore × 0.20
             + assessmentScore × 0.20
             + successScore × 0.20
             + engagementScore × 0.20
             + contentScore × 0.20
```

| Dimension | Computation |
|-----------|------------|
| Structure | Module count, lesson count, objectives, outcomes |
| Assessment | Question count, question variety, quiz pass rate |
| Success | Completion rate, student progress, avg quiz scores |
| Engagement | Recent enrollments, lesson views, time spent |
| Content | **AI-assisted** — LLM evaluates description, objectives, lesson quality |

**AI Analysis** (`generateAIAnalysis()`):
- Uses LLM to produce: `strengths[]`, `weaknesses[]`, `recommendations[]`
- Falls back to `deriveStrengthsAndWeaknesses()` + `deriveRecommendations()` (rule-based)

### 5.5 Revenue Forecasting

**Endpoint**: `GET /api/admin/finance/forecast`

**Algorithm**: Linear Regression

```
For revenue forecasting:
  x = month index (0, 1, 2, ...)
  y = revenue for that month
  slope = (n × Σxy - Σx × Σy) / (n × Σx² - (Σx)²)
  intercept = (Σy - slope × Σx) / n
  forecast = slope × futureMonth + intercept

R² (coefficient of determination):
  SS_res = Σ(yi - predicted)²
  SS_tot = Σ(yi - mean_y)²
  R² = 1 - (SS_res / SS_tot)
```

**Confidence Levels**:

| R² Value | Confidence |
|----------|-----------|
| R² ≥ 0.8 | High |
| R² ≥ 0.5 | Medium |
| R² < 0.5 | Low |

**Forecast Periods**: `next_month`, `next_quarter`, `next_year`

**Output**:
```typescript
{
  projectedRevenue: number
  projectedEnrollments: number
  projectedPlatformCut: number
  projectedInstructorPayouts: number
  confidence: { level: string, rSquared: number, dataPoints: number }
  trend: Array<{ month, revenue, enrollments, isProjected }>
}
```

### 5.6 Course Review AI Analysis

**Endpoint**: `POST /api/admin/course-review/[id]/ai-analysis`

**Detailed Review Process**:

```
1. Fetch full course structure (modules, lessons, quizzes, assignments)
2. Fetch instructor profile
3. Build LLM system prompt covering:
   - Curriculum design evaluation
   - Content quality assessment
   - Pricing analysis
   - Educational standard alignment (IB, AP, Cambridge, IELTS)
4. Call LLM with structured JSON output format
5. Parse response (3-layer: direct parse → markdown fence → regex)
6. Fallback: buildPartialAnalysis() — rule-based checks for:
   - Structure completeness (modules ≥ 3, lessons per module ≥ 2)
   - Thumbnail and promo video presence
   - Description length (> 100 chars)
   - Learning objectives presence
   - Video content percentage
7. Log to ActivityLog
```

**AI Review Output**:

```typescript
{
  qualityScore: number           // 0-100
  contentCompleteness: number    // 0-100
  descriptionQuality: number     // 0-100
  structureAssessment: {
    score: number
    modulesSufficient: boolean
    lessonsPerModule: number
    hasObjectives: boolean
  }
  pricingAssessment: {
    score: number
    isReasonable: boolean
    comparisonNote: string
  }
  issues: Array<{ severity, description }>
  recommendations: string[]
  suggestedDecision: "approve" | "request_changes" | "reject"
}
```

---

## 6. Cross-Portal — Intelligent Analytics Engine

**Endpoint**: `GET /api/analytics/intelligent?userId=xxx&role=student|instructor|admin`

**Role-Based Routing**:

### 6.1 Student Analytics

```
Parallel Data Fetch:
  Profile, Quiz Attempts, Enrollments, Daily Activities,
  Lesson Progress, Learning Metrics, Topic Masteries

Computation:
  → Engagement, Consistency, Drop Risk, Performance, Learning Speed
  → Topic Mastery Engine (weak/strong/mastered counts)
  → Rule-Based Insight Generator (12 rules)
  → Recommendation Engine (5 recommendation types)
  → Learning Profile (level, speed, metrics)
  → 30-Day Activity Heatmap
  → 8-Week Trend
```

**12 Student Insight Rules**:
1. Low engagement (< 30) → engagement warning
2. High drop risk (> 60) → risk alert
3. Declining quiz scores → performance warning
4. Inactive > 7 days → inactivity alert
5. Strong mastery in multiple topics → achievement
6. Study streak > 7 days → consistency praise
7. All courses low progress → progress warning
8. High AI usage + low scores → strategy suggestion
9. Recent improvement in weak topic → encouragement
10. No quiz attempts → practice suggestion
11. Strong topic with no advancement → growth opportunity
12. Exam approaching → urgency alert

### 6.2 Instructor Analytics

```
Course Metrics → Difficult Lessons → Student Struggle Areas → Module Score Drops
  → Rule-Based Instructor Insights (8 rules) → Instructor Suggestions (5 types)
```

**Difficult Lesson Detection**:
- Low completion rate (< 40%)
- High repeat visits (students re-opening)
- High dropoff rate (students leaving after this lesson)

**Module Score Drop Detection**:
- Compare first-half vs second-half module quiz averages
- Flag modules where second-half scores drop > 15%

### 6.3 Admin Analytics

```
Platform-Wide Metrics → Course Health Analysis → Instructor Performance Ranking
  → Risk Alert Generation → Admin Insights (6 categories)
```

**Risk Alerts**:
- High dropout courses
- Inactive students
- Critical courses (health < 40)
- Low-performing instructors

---

## 7. LLM Integration Patterns

### 7.1 System Prompt Architecture

Every LLM call uses a structured system prompt with these layers:

```
┌──────────────────────────────────────┐
│ 1. Role Definition                    │
│    "You are an expert [role]..."      │
├──────────────────────────────────────┤
│ 2. Output Format Specification        │
│    "Respond with valid JSON only..."  │
├──────────────────────────────────────┤
│ 3. JSON Schema Definition             │
│    Exact structure with field types   │
├──────────────────────────────────────┤
│ 4. Rules & Constraints                │
│    Validation rules, edge cases       │
├──────────────────────────────────────┤
│ 5. Context Injection                  │
│    Student profile, course data, etc. │
├──────────────────────────────────────┤
│ 6. Adaptive Context (conditional)     │
│    Drop risk, engagement, etc.        │
└──────────────────────────────────────┘
```

### 7.2 JSON Response Parsing Strategy

All instructor and admin AI endpoints use a 3-layer parsing strategy:

```typescript
// Layer 1: Direct JSON.parse
try {
  return JSON.parse(response)
} catch {}

// Layer 2: Strip markdown code fences, then parse
try {
  let cleaned = response.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*\n?/, '')
      .replace(/\n?```\s*$/, '')
  }
  return JSON.parse(cleaned)
} catch {}

// Layer 3: Regex extraction of JSON object/array
const match = cleaned.match(/\{[\s\S]*\}/) || cleaned.match(/\[[\s\S]*\]/)
if (match) return JSON.parse(match[0])

// Layer 4: Fallback — return raw content
return { content: response }
```

### 7.3 Error Handling Patterns

```typescript
// Pattern 1: Non-blocking (Student features)
try {
  await logEvent({ ... })
} catch {
  console.error('Failed to log event')
  // Don't throw — event logging is non-blocking
}

// Pattern 2: Graceful degradation (Admin features)
try {
  const response = await callLLM(systemPrompt, userPrompt)
  return parseLLMJson(response)
} catch {
  // Fallback to rule-based response
  return generateRuleBasedResponse(data)
}

// Pattern 3: Partial analysis fallback (Course Review)
if (!llmAnalysis) {
  return buildPartialAnalysis(course)  // Rule-based checks
}
```

### 7.4 Conversation Summary Pattern

When a chat session exceeds 20 messages, Ask ShijlAI auto-generates a conversation summary:

```typescript
if (updatedSession.messageCount > 20 && !updatedSession.summaryGeneratedAt) {
  const allMessages = await db.shijlAIMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: 'asc' },
  })
  const conversationText = allMessages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n')

  const summaryCompletion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: 'Summarize this conversation concisely...' },
      { role: 'user', content: conversationText },
    ],
  })

  await db.conversationSummary.create({
    data: { sessionId, summary: summaryText, keyTopics: '[]', ... }
  })
}
```

---

## 8. AI Message Renderer

**Component**: `src/components/ai/ai-message-renderer.tsx`

**Purpose**: Transforms raw LLM text output into rich, interactive UI components based on the AI mode.

### 8.1 Mode-Aware Rendering

| Mode | Primary Renderer | Special Components |
|------|-----------------|-------------------|
| `tutor` | Markdown (prose) | Code blocks with syntax highlighting |
| `quiz` | QuizCard | Interactive quiz with A/B/C/D selection, feedback |
| `assignment` | StepCard | Expandable numbered steps with time estimates |
| `study_planner` | PlanDayCard | Day-by-day timeline with emoji task indicators |
| `career_advisor` | CareerMilestoneCard | Phase-based roadmap with timeframes |
| `companion` | Markdown (conversational) | Short paragraphs, natural formatting |

### 8.2 Content Parsers

```typescript
// Quiz Parser — Extracts structured quiz questions from LLM output
parseQuizQuestions(content: string): QuizQuestion[]

// Steps Parser — Extracts numbered steps
parseSteps(content: string): StepItem[]

// Plan Parser — Extracts day-by-day study plan
parsePlanDays(content: string): PlanDay[]

// Career Parser — Extracts career milestones
parseCareerMilestones(content: string): CareerMilestone[]
```

### 8.3 Interactive Sub-Components

**QuizCard**: Students can click options, see correct/incorrect feedback, view explanations.

**StepCard**: Expandable steps with completion tracking.

**PlanDayCard**: Timeline-style day cards with task lists and duration indicators.

**CareerMilestoneCard**: Phase-based cards with required skills and timeframes.

**CodeBlock**: Syntax-highlighted code with copy-to-clipboard functionality.

---

## 9. AI Configuration & Governance

**Component**: `src/components/admin/admin-ai-config.tsx`

### 9.1 AI Configuration API

**Endpoint**: `GET/PUT /api/admin/ai-config`

**Configuration Fields**:

```typescript
interface AIConfiguration {
  id: string
  defaultProviderId: string
  defaultModelId: string
  maxTokensPerRequest: number
  maxRequestsPerDay: number
  maxRequestsPerUser: number
  enableAI: boolean
  enableStudentAI: boolean
  enableInstructorAI: boolean
  enableAdminAI: boolean
  contentFilterLevel: string    // strict, moderate, permissive
  logAllRequests: boolean
  costAlertThreshold: number
  // ... computed stats
}
```

**Computed Usage Stats** (on GET):
- Monthly cost, total tokens, avg latency, error rate
- Breakdown by provider, model, feature
- Daily breakdown for 30 days
- Status distribution (success/error/timeout)

### 9.2 AI Providers

**Endpoint**: `GET/POST /api/admin/ai-config/providers`

```typescript
interface AIProvider {
  id: string
  name: string
  slug: string           // e.g., "openai", "anthropic"
  apiKey: string         // Masked in GET responses
  baseUrl: string?
  isActive: boolean
  isDefault: boolean
  priority: number       // Lower = higher priority
  models: AIModel[]
}
```

### 9.3 AI Models

**Endpoint**: `GET/POST /api/admin/ai-config/models`

```typescript
interface AIModel {
  id: string
  providerId: string
  name: string
  slug: string           // Unique within provider
  isActive: boolean
  isDefault: boolean
  contextWindow: number
  maxOutputTokens: number
  inputPricePer1k: number
  outputPricePer1k: number
  capabilities: string   // JSON: ["chat", "completion", "vision"]
  rateLimitRpm: number
  rateLimitRpd: number
}
```

### 9.4 Prompt Templates

**Endpoint**: `GET/POST /api/admin/ai-config/prompt-templates`

```typescript
interface AIPromptTemplate {
  id: string
  name: string
  slug: string           // Auto-versioned if duplicate
  category: string       // "student_tutor", "instructor_copilot", "admin_analysis"
  systemPrompt: string
  userPromptTemplate: string  // Variables: {{topic}}, {{level}}, etc.
  isActive: boolean
  version: number
  parentVersionId: string?
  description: string
}
```

**Auto-versioning**: If a template with the same slug exists, the version is auto-incremented and the parent version is tracked.

### 9.5 Usage Logs

**Endpoint**: `GET /api/admin/ai-config/usage-logs`

**Filters**: providerId, modelId, feature, status, date range
**Aggregates**: Total tokens, cost, avg latency, status/feature distributions

### 9.6 Audit Log

**Endpoint**: `GET /api/admin/ai-config/audit-log`

**Filters**: category, action, severity, date range
**Distributions**: By category, severity, action

**Audit Entries**:
- Provider created/updated/deleted
- Model created/updated/deleted
- Template created/updated
- Configuration changes (stores previous + new values)

---

## 10. Prisma Models for AI

### 10.1 Core AI Models

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| `AIConfiguration` | Global AI settings | defaultProvider, maxTokens, enable flags, cost thresholds |
| `AIProvider` | Provider configs | name, slug, apiKey (masked), baseUrl, priority |
| `AIModel` | Model specs | contextWindow, pricing, capabilities, rate limits |
| `AIUsageLog` | Token/usage tracking | providerId, modelId, feature, tokens, cost, latency, status |
| `AIPromptTemplate` | Customizable prompts | systemPrompt, userPromptTemplate, category, version |
| `AIAuditLog` | Action audit trail | category, action, previousValue, newValue, severity |

### 10.2 Student AI Models

| Model | Purpose |
|-------|---------|
| `ShijlAISession` | Chat sessions (mode, title, message count, summary) |
| `ShijlAIMessage` | Chat messages (role, content, mode, quickAction) |
| `StudentLearningProfile` | Aggregated metrics (engagement, consistency, drop risk, mastery) |
| `TopicMastery` | Per-topic mastery (quiz/assignment/practice/completion scores, trend) |
| `SkillTopicMapping` | Skill-to-topic weight mappings |
| `LearningMetric` | Raw learning events |
| `LearningEvent` | Alternative event records |
| `AIRecommendation` | Generated recommendations (priority, reason, status) |
| `LearningInsight` | AI learning insights |
| `AIQuizGeneration` | Quiz generation records |
| `StudentAIActivity` | Student AI interaction logs |
| `AICompanionMessage` | Companion chat messages |
| `AICompanionEvent` | Companion trigger events |
| `MockInterview` | Interview sessions and reports |
| `LearningPath` / `LearningPathNode` / `TopicPrerequisite` | AI learning path structures |
| `StudyPlan` / `StudyPlanTask` | Study plan and daily tasks |

### 10.3 Instructor AI Models

| Model | Purpose |
|-------|---------|
| `AIGeneratedOutline` | Course outline records |
| `AIGeneratedLesson` | Lesson structure + content records |
| `AIGeneratedAssignment` | Assignment generation records |
| `AIGeneratedRubric` | Rubric generation records |
| `AIGeneratedQuiz` | Quiz generation records |
| `InstructorAIActivity` | AI interaction logs |
| `LearningOutcome` | Course learning outcomes |
| `QuestionTopic` | Quiz question topic mapping |
| `AssessmentQualityScore` | Quiz quality scores (4 dimensions) |
| `DistractorAnalytics` | MCQ option selection analysis |
| `QuestionAnalytics` | Per-question analytics |
| `AIGeneration` | General AI generation records |
| `AITemplate` | Instructor AI templates |
| `AIAssistantMessage` | AI assistant chat messages |

### 10.4 Admin AI Models

| Model | Purpose |
|-------|---------|
| `CourseQualityAnalysis` | Course quality scores (5 dimensions) |
| `CourseReviewHistory` | Course review records |
| `ConversationSummary` | Chat conversation summaries |

---

## 11. API Reference — Complete Catalog

### 11.1 Student AI APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/ai/chat` | General AI chat |
| POST | `/api/ai/companion` | Learning companion (GET dashboard, POST chat/engine/mark_read) |
| GET/POST | `/api/ai/mock-interview` | Mock interviews (GET dashboard, POST start/submit/complete) |
| POST | `/api/ai/tutor` | AI tutor with Socratic method |
| GET/POST/PATCH/DELETE | `/api/ai/study-planner` | Study plan CRUD |
| GET | `/api/ai/learning-paths` | Learning paths + career paths |
| POST | `/api/ai/shijlai/chat` | Ask ShijlAI (6 modes) |
| GET | `/api/ai/shijlai/insights` | Learning insights |
| GET | `/api/ai/shijlai/profile` | Student learning profile |
| GET | `/api/ai/shijlai/recommendations` | AI recommendations |
| GET | `/api/ai/shijlai/search` | AI semantic search |
| GET | `/api/ai/shijlai/mastery` | Topic mastery data |
| POST | `/api/ai/shijlai/mastery/seed` | Seed mastery data |
| GET/POST | `/api/ai/shijlai/study-plan` | AI study plan |
| POST | `/api/ai/shijlai/quiz-generator` | AI quiz generation |
| GET/POST/DELETE | `/api/ai/shijlai/sessions` | Session management |
| POST | `/api/ai/shijlai/events` | Learning event logging |
| GET | `/api/student/recommendations` | Student recommendations |
| GET | `/api/student/daily-plan` | AI daily plan |
| GET | `/api/skill-graph` | Skill graph data |
| GET | `/api/skills` | Skills data |

### 11.2 Instructor AI APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST/GET | `/api/instructor/copilot` | AI Copilot (9 actions + GET records) |
| POST | `/api/instructor/ai/generate-curriculum` | Course curriculum |
| POST | `/api/instructor/ai/generate-quiz` | Quiz questions |
| POST | `/api/instructor/ai/generate-assignment` | Assignment brief |
| POST | `/api/instructor/ai/generate-rubric` | Grading rubric |
| POST | `/api/instructor/ai/generate-description` | SEO description |
| POST | `/api/instructor/ai/generate-outcomes` | Learning outcomes |
| POST | `/api/instructor/ai/generate-lesson-content` | Lesson content |
| POST | `/api/instructor/ai/suggest-reply` | Reply suggestion |
| POST | `/api/instructor/ai/analyze-feedback` | Feedback analysis |
| POST | `/api/instructor/ai/auto-respond` | Auto-answer questions |
| POST | `/api/instructor/ai/improve-bio` | Bio improvement |
| POST | `/api/instructor/ai/auto-caption` | Multilingual captions |
| POST | `/api/instructor/ai/course-insights` | Course improvement insights |
| POST | `/api/instructor/ai/assistant` | AI assistant chat |
| GET/POST | `/api/instructor/ai/assistant-messages` | Assistant messages |
| GET/POST | `/api/instructor/ai/templates` | Prompt templates |
| GET/POST | `/api/instructor/ai/generations` | Generation history |
| GET | `/api/instructor/ai/usage-stats` | AI usage statistics |
| POST | `/api/instructor/assessment/generate-insights` | Assessment insights |
| GET | `/api/instructor/assessment/quality-scores` | Quality scores |
| GET | `/api/instructor/assessment/distractor-analysis` | Distractor analysis |
| GET | `/api/instructor/analytics/insights` | AI teaching insights |
| GET | `/api/instructor/analytics` | Analytics data |
| GET | `/api/instructor/analytics/comparison` | Course comparison |
| GET | `/api/instructor/analytics/engagement` | Student engagement |

### 11.3 Admin AI APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/admin/copilot` | Admin AI Copilot |
| GET | `/api/admin/system-intelligence` | System Intelligence (5 engines) |
| POST | `/api/admin/system-intelligence/generate-insights` | LLM-powered insights |
| POST/GET | `/api/admin/course-quality` | Course quality analysis |
| POST/GET | `/api/admin/reports` | AI report generation |
| GET | `/api/admin/finance/forecast` | Revenue forecasting |
| POST | `/api/admin/course-review/[id]/ai-analysis` | Course review AI analysis |
| GET/PUT | `/api/admin/ai-config` | AI configuration |
| GET/POST | `/api/admin/ai-config/providers` | Provider management |
| GET/POST | `/api/admin/ai-config/models` | Model management |
| GET/POST | `/api/admin/ai-config/prompt-templates` | Template management |
| GET | `/api/admin/ai-config/usage-logs` | Usage logs |
| GET | `/api/admin/ai-config/audit-log` | Audit log |
| POST | `/api/admin/ai-config/seed` | Seed AI configuration |
| GET | `/api/admin/student-insights` | Student insights |
| GET | `/api/analytics/intelligent` | Intelligent analytics (role-based) |

---

## 12. Algorithms & Formulas Reference

### 12.1 Complete Formula Table

| Algorithm | Formula | Source |
|-----------|---------|--------|
| **Weighted Mastery** | `quiz×0.50 + assignment×0.25 + practice×0.15 + completion×0.10` | `mastery-service.ts` |
| **Score Delta** (quiz) | `value × 0.3` | `event-service.ts` |
| **Score Delta** (lesson) | `+15` (fixed) | `event-service.ts` |
| **Score Delta** (assignment) | `value × 0.25` | `event-service.ts` |
| **Score Delta** (video) | `+5` (fixed) | `event-service.ts` |
| **Score Delta** (AI tutor) | `+3` (fixed) | `event-service.ts` |
| **Learning Speed** | `(completedLessons / hoursSpent) × 10` (0-100) | `feature-engine.ts` |
| **Engagement Score** | `logins×5 + hours×4 + quizzes×2 + aiUsage×1.5 + lessons×0.5` (capped 100) | `feature-engine.ts` |
| **Consistency Score** | `(activeDays / totalDays) × 100 - (streak<3 ? 10 : 0)` | `feature-engine.ts` |
| **Drop Risk** | `lowEngagement×0.30 + lowConsistency×0.30 + declining×0.20 + inactivity×0.20` | `feature-engine.ts` |
| **Time Decay** | `factor = 1 - (0.005 × daysOver7Threshold)` | `mastery-service.ts` |
| **Priority Score** | `weakness×0.40 + careerRelevance×0.20 + engagementMatch×0.20 + recency×0.20` | `recommendation-engine.ts` |
| **Course Health** | `enrollmentGrowth×0.25 + completion×0.25 + rating×0.20 + engagement×0.15 + assessment×0.15` | `system-intelligence/route.ts` |
| **Course Quality** | `structure×0.20 + assessment×0.20 + success×0.20 + engagement×0.20 + content×0.20` | `course-quality/route.ts` |
| **Quiz Quality** | `difficultyBalance×0.30 + questionVariety×0.25 + outcomeCoverage×0.25 + timeFactor×0.20` | `quality-scores/route.ts` |
| **Engagement Intelligence** | `login×0.25 + activity×0.25 + quiz×0.25 + aiUsage×0.15 + community×0.10` | `system-intelligence/route.ts` |
| **Linear Regression** | `slope = (n×Σxy - Σx×Σy) / (n×Σx² - (Σx)²)` | `finance/forecast/route.ts` |
| **R-Squared** | `R² = 1 - (SS_res / SS_tot)` | `finance/forecast/route.ts` |

### 12.2 Threshold Reference Table

| Metric | Threshold | Action |
|--------|-----------|--------|
| Mastery — Not Started | 0-25% | Display: ⚪ |
| Mastery — Weak | 25-50% | Extra AI explanations |
| Mastery — Learning | 50-75% | Encouragement |
| Mastery — Strong | 75-90% | Advanced challenges |
| Mastery — Mastered | 90-100% | Celebration |
| Drop Risk — Low | 0-20% | Normal learning |
| Drop Risk — Moderate | 20-40% | Increase consistency |
| Drop Risk — High | 40-60% | Create study plan |
| Drop Risk — Critical | 60-80% | Immediate intervention |
| Drop Risk — Severe | 80-100% | Advisor notification |
| Profile Throttle | 5 minutes | Skip recomputation |
| Conversation Summary | > 20 messages | Auto-generate summary |
| Time Decay Trigger | > 7 days inactive | Apply 0.5%/day decay |
| Weak Distractor | < 5% selection rate | Flag for revision |
| Difficult Lesson | < 40% completion | Flag in analytics |
| Module Score Drop | > 15% second-half decline | Flag in analytics |
| Enrollment Spike | > 50% increase | Info alert |
| Enrollment Drop | > 20% decrease | Warning alert |
| Low Course Rating | < 2.5/5 | Critical alert |
| Instructor Inactivity | > 14 days | Warning alert |
| Student Inactivity | > 14 days (20%+ of base) | Critical alert |
| Forecast Confidence High | R² ≥ 0.8 | Trust forecast |
| Forecast Confidence Medium | R² ≥ 0.5 | Moderate trust |
| Forecast Confidence Low | R² < 0.5 | Use with caution |

---

## Appendix A: File Structure

```
src/
├── services/learning-engine/
│   ├── index.ts                          # Barrel export
│   ├── event-service.ts                  # Event logging & triggers
│   ├── feature-engine.ts                 # 5 metric computations
│   ├── profile-service.ts                # Student profile aggregation
│   ├── mastery-service.ts                # Weighted mastery tracking
│   ├── recommendation-engine.ts          # Adaptive recommendations
│   └── study-planner-service.ts          # Algorithmic study plans
│
├── components/ai/
│   └── ai-message-renderer.tsx           # Rich AI message renderer
│
├── components/ask-shijlai/
│   ├── enhanced-welcome.tsx
│   ├── learning-intelligence-panel.tsx
│   ├── recommendations-panel.tsx
│   └── insights-cards.tsx
│
├── components/creator/
│   └── ai-panel.tsx                      # Course Creator AI assistant
│
├── components/admin/
│   ├── admin-ai-config.tsx               # AI configuration panel
│   ├── student-insights.tsx              # Student insights
│   └── system-status.tsx                 # System status
│
├── components/
│   ├── ai-learning-companion.tsx         # Learning Companion dashboard
│   ├── ai-mock-interview.tsx             # Mock Interview system
│   ├── companion-chatbot.tsx             # Floating companion FAB
│   ├── skill-graph.tsx                   # Skill visualization
│   └── learning-path-tab.tsx             # Learning path display
│
├── components/views/
│   ├── ask-shijlai-view.tsx              # Ask ShijlAI main view
│   ├── shijlai-hub-view.tsx              # AI features hub
│   ├── learning-companion-view.tsx       # Learning Companion view
│   ├── tutor-view.tsx                    # AI Tutor view
│   ├── recommendations-view.tsx          # Recommendations view
│   ├── learning-paths-view.tsx           # Learning Paths view
│   ├── progress-analytics-view.tsx       # Progress Analytics view
│   ├── my-skills-view.tsx                # My Skills view
│   ├── instructor-copilot-view.tsx       # Instructor AI Copilot
│   ├── instructor-ai-tools-view.tsx      # AI Tools Gallery
│   ├── instructor-ai-tool-detail-view.tsx # AI Tool Detail
│   ├── instructor-analytics-view.tsx     # Intelligent Analytics
│   ├── instructor-assessment-view.tsx    # Smart Assessment
│   ├── admin-copilot-view.tsx            # Admin AI Copilot
│   ├── admin-system-intelligence-view.tsx # System Intelligence
│   ├── admin-shijlai-hub-view.tsx        # Admin ShijlAI Hub
│   └── admin-analytics-view.tsx          # Admin Analytics
│
├── app/api/ai/
│   ├── chat/route.ts                     # General AI chat
│   ├── companion/route.ts                # Learning Companion
│   ├── mock-interview/route.ts           # Mock Interview
│   ├── tutor/route.ts                    # AI Tutor
│   ├── study-planner/route.ts            # Study Planner
│   ├── learning-paths/route.ts           # Learning Paths
│   └── shijlai/
│       ├── chat/route.ts                 # Ask ShijlAI chat
│       ├── insights/route.ts             # Learning insights
│       ├── profile/route.ts              # Student profile
│       ├── recommendations/route.ts      # Recommendations
│       ├── search/route.ts               # Semantic search
│       ├── mastery/route.ts              # Topic mastery
│       ├── mastery/seed/route.ts         # Seed mastery
│       ├── study-plan/route.ts           # Study plan
│       ├── quiz-generator/route.ts       # Quiz generation
│       ├── sessions/route.ts             # Session management
│       ├── sessions/[id]/route.ts        # Individual session
│       └── events/route.ts               # Learning events
│
├── app/api/instructor/
│   ├── copilot/route.ts                  # Instructor AI Copilot
│   ├── ai/
│   │   ├── generate-curriculum/route.ts
│   │   ├── generate-quiz/route.ts
│   │   ├── generate-assignment/route.ts
│   │   ├── generate-rubric/route.ts
│   │   ├── generate-description/route.ts
│   │   ├── generate-outcomes/route.ts
│   │   ├── generate-lesson-content/route.ts
│   │   ├── generate-thumbnail/route.ts
│   │   ├── improve-bio/route.ts
│   │   ├── auto-caption/route.ts
│   │   ├── auto-respond/route.ts
│   │   ├── suggest-reply/route.ts
│   │   ├── analyze-feedback/route.ts
│   │   ├── course-insights/route.ts
│   │   ├── assistant/route.ts
│   │   ├── assistant-messages/route.ts
│   │   ├── templates/route.ts
│   │   ├── templates/[id]/route.ts
│   │   ├── generations/route.ts
│   │   ├── generations/[id]/route.ts
│   │   └── usage-stats/route.ts
│   ├── assessment/
│   │   ├── generate-insights/route.ts
│   │   ├── outcomes/route.ts
│   │   ├── outcomes/create/route.ts
│   │   ├── outcomes/link/route.ts
│   │   ├── quality-scores/route.ts
│   │   ├── distractor-analysis/route.ts
│   │   └── question-analytics/route.ts
│   └── analytics/
│       ├── insights/route.ts
│       ├── route.ts
│       ├── comparison/route.ts
│       └── engagement/route.ts
│
├── app/api/admin/
│   ├── copilot/route.ts                  # Admin AI Copilot
│   ├── system-intelligence/route.ts      # System Intelligence
│   ├── system-intelligence/generate-insights/route.ts
│   ├── course-quality/route.ts           # Course Quality Analyzer
│   ├── reports/route.ts                  # AI Report Generator
│   ├── finance/forecast/route.ts         # Revenue Forecasting
│   ├── course-review/[id]/ai-analysis/route.ts
│   ├── student-insights/route.ts
│   └── ai-config/
│       ├── route.ts                      # AI Configuration
│       ├── providers/route.ts
│       ├── providers/[id]/route.ts
│       ├── models/route.ts
│       ├── models/[id]/route.ts
│       ├── prompt-templates/route.ts
│       ├── prompt-templates/[id]/route.ts
│       ├── usage-logs/route.ts
│       ├── audit-log/route.ts
│       └── seed/route.ts
│
└── app/api/analytics/
    ├── intelligent/route.ts              # Intelligent Analytics
    ├── route.ts
    └── events/route.ts
```

---

## Appendix B: Hook & Store Reference

### Hook: `useLearningEvents()`

**File**: `src/hooks/use-learning-events.ts`

```typescript
// Client-side hook that logs learning events to /api/ai/shijlai/events
// Silently fails to not block UX
function useLearningEvents() {
  const logEvent = async (params: {
    eventType: string
    eventValue?: number
    courseId?: string
    topicId?: string
    metadata?: Record<string, unknown>
  }) => {
    try {
      await fetch('/api/ai/shijlai/events', {
        method: 'POST',
        body: JSON.stringify({ ...params, userId: currentUserId }),
      })
    } catch {
      // Silent failure — non-blocking
    }
  }
  return { logEvent }
}
```

### Store: AI Tool Selection (Zustand)

**File**: `src/lib/store.ts`

```typescript
// Instructor portal AI tool selection state
selectedAIToolId: string | null
setSelectedAIToolId: (id: string | null) => void
// Reset on logout
```

---

*This document covers all 36 AI features, 57 API endpoints, 7 learning engine services, and 28+ Prisma models that comprise the ShijlAI Academy AI ecosystem.*
