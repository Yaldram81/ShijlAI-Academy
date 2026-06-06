# ShijlAI Academy — Database Design Document

> **Version:** 2.0 | **Last Updated:** 2025-03-04 | **Schema Lines:** ~3,350 | **Models:** 148  
> **ORM:** Prisma | **Default DB:** SQLite | **Migration Target:** MySQL 8.0+

---

## Table of Contents

1. [Overview & Design Philosophy](#1-overview--design-philosophy)
2. [Database Technology (SQLite vs MySQL)](#2-database-technology-sqlite-vs-mysql)
3. [ER Diagram](#3-er-diagram)
4. [Schema Organization](#4-schema-organization)
5. [Core Domain Models](#5-core-domain-models)
6. [Financial Models](#6-financial-models)
7. [AI & Learning Engine Models](#7-ai--learning-engine-models)
8. [Gamification Models](#8-gamification-models)
9. [Community & Communication Models](#9-community--communication-models)
10. [Security & Auth Models](#10-security--auth-models)
11. [Admin Platform Config Models](#11-admin-platform-config-models)
12. [Relationship Map](#12-relationship-map)
13. [Index Strategy](#13-index-strategy)
14. [Data Integrity](#14-data-integrity)
15. [Migration Strategy (SQLite → MySQL)](#15-migration-strategy-sqlite--mysql)
16. [Schema Statistics](#16-schema-statistics)

---

## 1. Overview & Design Philosophy

ShijlAI Academy is a full-stack e-learning platform built for the Pakistani education market, supporting students (FSc, O-Levels, A-Levels, IELTS, AWS), instructors, administrators, and parents. The database schema is the backbone of a system that integrates:

- **Traditional LMS** — courses, modules, lessons, enrollments, progress tracking
- **AI-Powered Intelligence** — personalized tutoring, adaptive learning, mastery tracking, smart assessment
- **Financial Engine** — PKR-denominated transactions, instructor payouts, disputes, tax withholding
- **Gamification Layer** — XP, levels, badges, streaks, reward shop, daily challenges
- **Community & Social** — Q&A, study groups, discussions, peer reviews, events
- **Admin Control Plane** — security, audit logging, feature flags, AI provider management

### Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Domain-Driven Design** | Models grouped into 15 bounded contexts; each domain is independently coherent |
| **Dual-DB Compatibility** | Identical model structure across SQLite (dev) and MySQL (prod); only type annotations differ |
| **JSON Flexibility** | Complex nested data (rubrics, checklists, criteria) stored as JSON strings to avoid over-normalization |
| **Soft Extensibility** | `metadata`, `config`, `extraData` JSON fields allow schema evolution without migrations |
| **Cascade Safety** | Hierarchical deletes (Course→Module→Lesson) cascade; cross-domain FKs use `SetNull` or restrict |
| **Audit Trail** | Every admin action logged via `ActivityLog`, `AIAuditLog`, `SecurityEvent`, or `CourseReviewHistory` |
| **CUID Primary Keys** | All `@id @default(cuid())` — collision-safe, URL-friendly, sort-friendly |
| **Bitemporal Awareness** | `createdAt` + `updatedAt` on every model; event-sourced models also carry `completedAt`, `archivedAt`, etc. |

### Architecture Diagram

```
                          ┌─────────────────────────────────────────────┐
                          │           ShijlAI Academy Platform          │
                          └─────────────────────────────────────────────┘
                                         │
          ┌──────────────────────────────┼──────────────────────────────┐
          │                              │                              │
    ┌─────▼─────┐               ┌────────▼────────┐          ┌────────▼────────┐
    │  Student   │               │   Instructor    │          │     Admin       │
    │  Portal    │               │    Portal       │          │    Portal       │
    └─────┬─────┘               └────────┬────────┘          └────────┬────────┘
          │                              │                            │
          └──────────────────────────────┼────────────────────────────┘
                                         │
                          ┌──────────────▼──────────────┐
                          │      Prisma ORM Layer        │
                          │   (schema.prisma /           │
                          │    schema_mysql.prisma)      │
                          └──────────────┬──────────────┘
                                         │
                          ┌──────────────▼──────────────┐
                          │    SQLite (dev) / MySQL 8    │
                          │    148 tables / ~3,350 LOC   │
                          └─────────────────────────────┘
```

---

## 2. Database Technology (SQLite vs MySQL)

### 2.1 Dual Schema Architecture

The project maintains **two** Prisma schema files with **identical model structure** but different database providers and type annotations:

| Aspect | `schema.prisma` (SQLite) | `schema_mysql.prisma` (MySQL) |
|--------|--------------------------|-------------------------------|
| **Provider** | `sqlite` | `mysql` |
| **Env Variable** | `DATABASE_URL` | `DATABASE_URL_MYSQL` |
| **Currency Fields** | `Float` | `Decimal @db.Decimal(10,2)` |
| **Large Text Fields** | `String` (unbounded) | `String @db.Text` or `String @db.MediumText` |
| **Lines of Code** | 3,347 | 3,351 |
| **Model Count** | 148 | 148 |

### 2.2 Type Mapping Differences

```
┌─────────────────────────────────────────────────────────────────┐
│                   SQLite ──────────── MySQL                      │
├─────────────────────────────────────────────────────────────────┤
│  price       Float        ────►   price    Decimal @db.Decimal(10,2)   │
│  content     String       ────►   content  String @db.Text             │
│  adminNotes  String?      ────►   adminNotes String? @db.MediumText    │
│  options     String       ────►   options  String @db.MediumText       │
│  answers     String       ────►   answers  String @db.MediumText       │
│  metadata    String?      ────►   metadata String? @db.MediumText      │
│  rubric      String?      ────►   rubric   String? @db.MediumText      │
│  resources   String?      ────►   resources String? @db.MediumText     │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Currency Precision

```
SQLite (Float)                     MySQL (Decimal)
──────────────────                 ──────────────────
price       Float    @default(0)   price       Decimal @db.Decimal(10,2) @default(0)
platformFee Float    @default(0)   platformFee Decimal @db.Decimal(10,2) @default(0)
amount      Float                   amount      Decimal @db.Decimal(10,2)
taxWithheld Float    @default(0)   taxWithheld Decimal @db.Decimal(10,2) @default(0)
```

> **Why Decimal(10,2)?** PKR amounts up to 99,999,999.99 — sufficient for course prices (PKR 500–50,000) and instructor payouts. Avoids IEEE 754 floating-point rounding errors in financial calculations.

### 2.4 Text Field Strategy

| Prisma Type | MySQL Storage | Max Size | Usage |
|-------------|---------------|----------|-------|
| `String` | VARCHAR(191) | 191 chars | Names, slugs, titles, enums |
| `String @db.MediumText` | MEDIUMTEXT | 16 MB | JSON blobs, rubrics, metadata, feedback |
| `String @db.Text` | TEXT | 64 KB | Markdown content, long-form text |

---

## 3. ER Diagram

### 3.1 High-Level Domain Map

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          SHIJLAI ACADEMY — ENTITY RELATIONSHIP MAP                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐         │
│  │   USER       │────▶│  ENROLLMENT │────▶│   COURSE    │────▶│   MODULE    │         │
│  │  (central)   │     │ [userId,    │     │             │     │             │         │
│  │              │     │  courseId]  │     │             │     │             │         │
│  └──────┬───────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘         │
│         │                    │                    │                    │                 │
│    ┌────┴────┐          ┌────┴────┐         ┌────┴────┐         ┌────┴────┐           │
│    │         │          │         │         │         │         │         │           │
│    ▼         ▼          ▼         ▼         ▼         ▼         ▼         ▼           │
│  Tutor    Quiz      Lesson    Review     Quiz      LiveSess   Lesson   LessonProg    │
│  Session  Attempt   Progress  Wishlist  Assign    Attendee                               │
│                                                                                        │
│  ┌───────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  GAMIFICATION     │  │  AI INTELLIGENCE │  │   FINANCE        │  │  COMMUNITY   │  │
│  │                   │  │                  │  │                  │  │              │  │
│  │  Badge ──▶UserBdg │  │  AIConfiguration│  │  Transaction ──┐ │  │  QAQuestion  │  │
│  │  XPRule           │  │  AIProvider     │  │  PayoutMethod  │ │  │  QAAnswer    │  │
│  │  LevelConfig      │  │  AIModel ──┐    │  │  Payout ──────┘ │  │  StudyGroup  │  │
│  │  GamificationSett │  │  AIUsageLog│    │  │  Dispute        │  │  Discussion  │  │
│  │  StreakReward     │  │  AIPromptTm│    │  │  FinancialSett  │  │  PeerReview  │  │
│  │  RewardShopItem   │  │  AIAuditLog│    │  │  CommissionOver │  │  Event       │  │
│  │  UserReward       │  │            │    │  │                 │  │              │  │
│  │  GamificationEvt  │  └────────────┘    │  └─────────────────┘  └──────────────┘  │
│  │  StreakFreeze     │          │          │                                         │
│  └───────────────────┘          │          │                                         │
│                        ┌────────▼────────┐ │                                         │
│                        │ ASK SHIJLAI     │ │                                         │
│                        │                 │ │                                         │
│                        │ StudentLearning │ │                                         │
│                        │ Profile         │ │                                         │
│                        │ ShijlAISession  │ │                                         │
│                        │ ShijlAIMessage  │ │                                         │
│                        │ AIRecommendation│ │                                         │
│                        │ LearningInsight │ │                                         │
│                        │ StudyPlan──▶Task│ │                                         │
│                        └─────────────────┘ │                                         │
│                                            │                                         │
│  ┌───────────────────┐  ┌──────────────────┐  ┌──────────────────┐                   │
│  │  LEARNING ENGINE  │  │ INSTRUCTOR AI    │  │   SECURITY       │                   │
│  │                   │  │    COPILOT       │  │                  │                   │
│  │  LearningMetric   │  │  AIGenOutline    │  │  UserSession     │                   │
│  │  TopicMastery     │  │  AIGenLesson     │  │  SecuritySettings│                   │
│  │  SkillTopicMap    │  │  AIGenAssignment │  │  SecurityRole    │                   │
│  │  LearningEvent    │  │  AIGenRubric     │  │  ApiKey          │                   │
│  │  QuestionTopic    │  │  AIGenQuiz       │  │  BlockedIp       │                   │
│  │                   │  │  InstructorAIAct │  │  LoginAlert      │                   │
│  └───────────────────┘  └──────────────────┘  │  SecurityEvent   │                   │
│                                              └──────────────────┘                   │
│  ┌───────────────────┐  ┌──────────────────┐  ┌──────────────────┐                   │
│  │  SMART ASSESSMENT │  │  SKILLS/CAREER   │  │   ADMIN CONFIG   │                   │
│  │                   │  │                  │  │                  │                   │
│  │  LearningOutcome  │  │  Skill (self-rel)│  │  PlatformSettings│                   │
│  │  QuestionOutcome  │  │  UserSkill       │  │  FeatureFlag     │                   │
│  │  QuestionAnalytic │  │  CourseSkill     │  │  AppearanceBrand │                   │
│  │  DistractorAnalyt │  │  LessonSkill     │  │  WebhookConfig   │                   │
│  │  AssessmentQualSc │  │  QuestionSkill   │  │  Integration     │                   │
│  │                   │  │  CareerPath      │  │  LegalPage       │                   │
│  └───────────────────┘  │  CareerPathSkill │  │  PaymentMethConf │                   │
│                         │  LearningPath    │  │  PlatformSetting │                   │
│  ┌───────────────────┐  │  LearningPathNode│  │  PlatformAnnounc │                   │
│  │  COMPANION/INTERVW│  │  TopicPrereq    │  │  ActivityLog     │                   │
│  │  AICompanionMsg   │  └──────────────────┘  └──────────────────┘                   │
│  │  AICompanionEvt   │                                                                  │
│  │  MockInterview    │                                                                  │
│  │  InterviewQuestion│                                                                  │
│  └───────────────────┘                                                                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Core Learning Flow — Detailed ER

```
User ═══╗
        ║
        ╠═══ Enrollment ═══╗[userId,courseId]
        ║        ║
        ║        ╠═══ LessonProgress ═══╗[enrollmentId,lessonId]
        ║        ║        ║
        ║        ║        ╚═══ Lesson
        ║        ║                ║
        ║        ║                ╠═══ LessonNote
        ║        ║                ╠═══ LessonBookmark
        ║        ║                ╠═══ LessonSkill
        ║        ║                ╚═══ QAQuestion
        ║        ║
        ║        ╚═══ Review
        ║
        ╠═══ QuizAttempt ═══ Quiz ═══ Question ═══ QuestionSkill
        ║                                  ║
        ║                                  ╠═══ QuestionOutcome
        ║                                  ╠═══ QuestionAnalytics
        ║                                  ╚═══ DistractorAnalytics
        ║
        ╠═══ Submission ═══ Assignment ═══ PeerReview
        ║
        ╠═══ Certificate
        ║
        ╚═══ Course (instructor) ═══ Module ═══ Lesson
                ║
                ╠═══ LearningOutcome
                ╠═══ CourseSkill
                ╠═══ CourseReviewHistory
                ╠═══ CourseQualityAnalysis
                ╚═══ AIGeneratedOutline/Lesson/Assignment/Rubric/Quiz
```

### 3.3 Financial Flow ER

```
Transaction ═════════════════════════════════════════════════╗
  ║                                                          ║
  ╠═══ Course (optional FK)                                  ║
  ╠═══ Student ─── User (TransactionStudent)                 ║
  ╠═══ Instructor ─── User (TransactionInstructor)           ║
  ║                                                          ║
  ║  ┌─────────────────────────────────────────────────┐     ║
  ║  │  REVENUE SPLIT FORMULA                          │     ║
  ║  │                                                 │     ║
  ║  │  amount = course.price (or overridePrice)        │     ║
  ║  │  platformFee = amount × commissionRate           │     ║
  ║  │  instructorEarning = amount - platformFee        │     ║
  ║  │                                                 │     ║
  ║  │  Default: platformFee = 20%, instructor = 80%    │     ║
  ║  │  Override: CommissionOverride per instructor      │     ║
  ║  └─────────────────────────────────────────────────┘     ║
  ║                                                          ║
  ╚═══ Dispute ═════════════════════════════════════════════╝

PayoutMethod ◄── User (instructor)
Payout ◄── User (instructor)
  ║
  ║  grossEarning = sum(instructorEarning) for period
  ║  taxWithheld = grossEarning × withholdingTaxRate
  ║  netPayout = grossEarning - taxWithheld
  ║
FinancialSettings (singleton config)
CommissionOverride ◄── User (one-to-one)
```

---

## 4. Schema Organization

The 148 models are organized into 15 domain groups:

| # | Domain | Models | Count | Description |
|---|--------|--------|-------|-------------|
| 1 | **Core Learning** | User, Course, Module, Lesson, Enrollment, LessonProgress, Quiz, Assignment, Question, QuizAttempt | 10 | Central LMS entities |
| 2 | **Gamification & Rewards** | Badge, UserBadge, XPRule, LevelConfig, GamificationSettings, StreakReward, RewardShopItem, UserReward, GamificationEvent, StreakFreeze | 10 | XP, coins, badges, streaks, shop |
| 3 | **Progress & Goals** | LearningGoal, DailyChallenge, UserChallenge, XpActivity | 4 | Student goals & daily challenges |
| 4 | **Q&A & Community** | QAQuestion, QAAnswer, QAUpvote, QAAnswerUpvote, QASettings, DiscussionPost, DiscussionReply, DiscussionUpvote | 8 | Course Q&A + discussion forums |
| 5 | **Community & Social** | StudyGroup, StudyGroupMember, StudyGroupMessage, StudyGroupResource, CommunityEvent, EventAttendee, PeerReview, DiscussionBookmark | 8 | Groups, events, peer reviews |
| 6 | **Messaging & Notifications** | Conversation, ConversationParticipant, Message, Notification, NotificationPreference, NotificationTemplate, NotificationLog, NotificationSettings | 8 | Direct messaging + notification system |
| 7 | **Finance & Revenue** | Transaction, PayoutMethod, Payout, Dispute, FinancialSettings, CommissionOverride | 6 | Payments, payouts, disputes |
| 8 | **Instructor & Application** | InstructorProfile, InstructorSettings, InstructorApplication, ApplicationTimeline, ApplicationInterview | 5 | Instructor onboarding & profiles |
| 9 | **AI Configuration** | AIConfiguration, AIProvider, AIModel, AIUsageLog, AIPromptTemplate, AIAuditLog | 6 | AI provider/model management |
| 10 | **Ask ShijlAI + Student AI** | StudentLearningProfile, ShijlAISession, ShijlAIMessage, ConversationSummary, AIRecommendation, LearningInsight, AIQuizGeneration, StudyPlan, StudyPlanTask, StudentAIActivity | 10 | Student AI assistant |
| 11 | **Learning Engine + Assessment** | LearningMetric, TopicMastery, SkillTopicMapping, LearningEvent, QuestionTopic, LearningOutcome, QuestionOutcome, QuestionAnalytics, DistractorAnalytics, AssessmentQualityScore, AIGeneratedOutline, AIGeneratedLesson, AIGeneratedAssignment, AIGeneratedRubric, AIGeneratedQuiz, InstructorAIActivity | 16 | Mastery tracking + smart assessment + copilot |
| 12 | **Skills & Career** | Skill, UserSkill, CourseSkill, LessonSkill, QuestionSkill, StudentSkillHistory, CareerPath, CareerPathSkill, LearningPath, LearningPathNode, TopicPrerequisite | 11 | Skill graph + career paths |
| 13 | **Security & Auth** | UserSession, SecuritySettings, SecurityRole, ApiKey, BlockedIp, LoginAlert, SecurityEvent | 7 | Auth, sessions, IP blocking |
| 14 | **Admin Platform Config** | ActivityLog, PlatformSettings, WebhookConfig, AppearanceBranding, AppearanceHistory, PaymentMethodConfig, Integration, LegalPage, FeatureFlag, PlatformSetting, PlatformAnnouncement, ContentModerationSettings | 12 | Platform-wide configuration |
| 15 | **Cross-Cutting / Misc** | Certificate, TutorSession, ChatMessage, LiveSession, SessionAttendee, Submission, Wishlist, Review, LessonNote, LessonBookmark, AIGeneration, AITemplate, AIAssistantMessage, AICompanionMessage, AICompanionEvent, MockInterview, InterviewQuestion, CourseReviewHistory, GeneratedReport, CourseQualityAnalysis, ApiUsageLog, BlogPost, ScheduleEvent, StudentSettings, ParentLink, DailyActivity, PlatformStats | 27 | Certs, live sessions, blog, schedule, stats |

**Total: 148 models**

---

## 5. Core Domain Models

### 5.1 User

The central entity — every role (student, instructor, admin, parent) is a `User` with role-based access.

```
model User {
  ┌────────────────────────────────────────────────────────────────────┐
  │ IDENTITY                                                           │
  │  id            String   @id @default(cuid())                       │
  │  email         String   @unique                                    │
  │  name          String                                              │
  │  avatar        String?                                            │
  │  role          String   @default("student")  // student|instructor │
  │  bio           String?                                      |admin │
  │  language      String   @default("en")  // en, ur                 │
  │  phone         String?                                            │
  ├────────────────────────────────────────────────────────────────────┤
  │ GAMIFICATION                                                       │
  │  xp            Int      @default(0)                                │
  │  level         Int      @default(1)                                │
  │  shijlCoins    Int      @default(0)                                │
  │  streak        Int      @default(0)                                │
  │  longestStreak Int      @default(0)                                │
  │  lastActiveAt  DateTime @default(now())                            │
  ├────────────────────────────────────────────────────────────────────┤
  │ AUTH                                                               │
  │  passwordHash        String?                                       │
  │  isVerified          Boolean  @default(false)                      │
  │  mfaEnabled          Boolean  @default(false)                      │
  │  mfaSecret           String?                                       │
  │  otpCode             String?                                       │
  │  otpExpiresAt        DateTime?                                     │
  │  resetToken          String?                                       │
  │  resetTokenExpiresAt DateTime?                                     │
  │  loginAttempts       Int      @default(0)                          │
  │  lockedUntil         DateTime?                                     │
  │  authProvider        String   @default("email")  // email|google   │
  │                                                             |facebook|apple
  ├────────────────────────────────────────────────────────────────────┤
  │ ADMIN MANAGEMENT                                                   │
  │  status        String   @default("active")  // active|suspended   │
  │                                                |banned|pending    │
  │  flaggedReason String?                                            │
  │  adminNotes    String?  // JSON [{note, adminName, date}]         │
  │  lastLoginAt   DateTime?                                          │
  │  lastLoginIp   String?                                            │
  ├────────────────────────────────────────────────────────────────────┤
  │ TIMESTAMPS                                                         │
  │  createdAt     DateTime @default(now())                            │
  │  updatedAt     DateTime @updatedAt                                 │
  ├────────────────────────────────────────────────────────────────────┤
  │ 30+ RELATION ARRAYS (see Relationship Map, §12)                    │
  └────────────────────────────────────────────────────────────────────┘
}
```

**Key design decisions:**
- Single `User` table for all roles — avoids JOIN complexity and simplifies auth
- `adminNotes` as JSON array — allows append-only note history without a separate table
- `loginAttempts` + `lockedUntil` — brute-force protection at DB level
- `authProvider` — supports OAuth (Google, Facebook, Apple) alongside email/password

### 5.2 Course

```
model Course {
  ┌──────────────────────────────────────────────────────────────┐
  │ IDENTITY                                                     │
  │  id                String   @id @default(cuid())             │
  │  title             String                                  │
  │  description       String                                  │
  │  category          String   // "FSc","O-Levels","A-Levels"  │
  │  level             String   @default("beginner")            │
  │  language          String   @default("en")                  │
  │  thumbnail         String?                                 │
  │  price             Float    @default(0)                     │
  ├──────────────────────────────────────────────────────────────┤
  │ CURRICULUM METADATA                                          │
  │  learningObjectives String?  // JSON array                  │
  │  prerequisites      String?  // JSON array                  │
  │  targetAudience     String?                                 │
  │  tags               String?  // JSON array                  │
  │  estimatedDuration  Int      @default(0)  // hours          │
  │  certificateEnabled Boolean  @default(true)                 │
  │  completionThreshold Float   @default(80)  // % needed      │
  ├──────────────────────────────────────────────────────────────┤
  │ PUBLISHING STATE                                             │
  │  isPublished       Boolean  @default(false)                 │
  │  isArchived        Boolean  @default(false)                 │
  │  enrollmentCount   Int      @default(0)                     │
  │  rating            Float    @default(0)                     │
  ├──────────────────────────────────────────────────────────────┤
  │ ADMIN REVIEW                                                 │
  │  reviewStatus      String  @default("draft")                │
  │  reviewNote        String?                                 │
  │  reviewChecklist   String?  // JSON {items: pass/fail/warn} │
  │  featured          Boolean @default(false)                  │
  │  staffPick         Boolean @default(false)                  │
  │  overridePrice     Float?                                  │
  │  overridePriceUntil DateTime?                              │
  │  ageRestriction    String  @default("none")  // none|13+|18+│
  │  regionRestricted  Boolean @default(false)                  │
  │  flaggedReason     String?                                 │
  │  adminNotes        String?  // JSON array                  │
  │  submittedForReviewAt DateTime?                            │
  │  reviewedAt        DateTime?                               │
  │  reviewedBy        String?                                 │
  │  promoVideoUrl     String?                                 │
  ├──────────────────────────────────────────────────────────────┤
  │ FK: instructorId → User (InstructorCourses)                  │
  │ RELATIONS: modules[], enrollments[], quizzes[], assignments[] │
  │   qaQuestions[], transactions[], liveSessions[], wishlists[]  │
  │   reviews[], discussionPosts[], studyGroups[], aiGenerations[]│
  │   aiGeneratedOutlines/Lessons/Assignments/Rubrics/Quiz[]     │
  │   reviewHistory[], learningOutcomes[], courseSkills[]        │
  │   qualityAnalysis?, communityEvents[], scheduleEvents[]      │
  └──────────────────────────────────────────────────────────────┘
}
```

### 5.3 Module

```
model Module {
  id                String   @id @default(cuid())
  title             String
  description       String?
  order             Int      @default(0)
  courseId          String   → Course (onDelete: Cascade)
  learningObjectives String? // JSON array
  isPublished       Boolean  @default(false)
  lessons           Lesson[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### 5.4 Lesson

```
model Lesson {
  id          String   @id @default(cuid())
  title       String
  description String?
  content     String              // Markdown body
  type        String @default("video")  // video|text|interactive|quiz|assignment|live-session|download
  videoUrl    String?
  duration    Int      @default(0)     // minutes
  order       Int      @default(0)
  moduleId    String   → Module (onDelete: Cascade)
  resources   String?  // JSON [{title, url, type}]
  objectives  String?  // JSON array of strings
  isFree      Boolean  @default(false)  // free preview
  isPublished Boolean  @default(true)
  transcript  String?
  slideUrl    String?

  // Relations
  progress    LessonProgress[]
  qaQuestions QAQuestion[]
  notes       LessonNote[]
  bookmarks   LessonBookmark[]
  lessonSkills LessonSkill[]
}
```

### 5.5 Enrollment

```
model Enrollment {
  id           String   @id @default(cuid())
  userId       String   → User
  courseId     String   → Course
  progress     Float    @default(0)   // 0–100%
  status       String   @default("active")  // active|completed|archived
  enrolledAt   DateTime @default(now())
  completedAt  DateTime?
  lastAccessed DateTime @default(now())

  lessonProgress LessonProgress[]
  review         Review?           // one review per enrollment
  notes          LessonNote[]
  bookmarks      LessonBookmark[]

  @@unique([userId, courseId])  // one enrollment per user per course
}
```

### 5.6 Quiz

```
model Quiz {
  id           String   @id @default(cuid())
  title        String
  description  String?
  type         String   @default("practice")  // practice|assessment|diagnostic|certification
  timeLimit    Int      @default(0)  // minutes; 0 = no limit
  passingScore Float    @default(70)
  courseId     String?  → Course?     // optional course FK
  moduleId     String?               // optional module FK
  maxAttempts  Int      @default(0)  // 0 = unlimited
  isPublished  Boolean  @default(true)

  questions    Question[]
  attempts     QuizAttempt[]
}
```

### 5.7 Assignment

```
model Assignment {
  id             String   @id @default(cuid())
  title          String
  description    String
  instructions   String              // Markdown
  type           String @default("written")  // written|coding|project|peer-review|presentation
  moduleId       String?             // optional module FK
  courseId       String   → Course (onDelete: Cascade)
  maxScore       Int      @default(100)
  dueDate        DateTime?
  rubric         String?  // JSON [{criteria, description, maxPoints}]
  resources      String?  // JSON [{title, url, type}]
  submissionType String @default("text")  // text|file|url|multiple
  wordLimit      Int?
  isPublished    Boolean  @default(true)
  order          Int      @default(0)

  submissions    Submission[]
  peerReviews    PeerReview[]
  aiGeneratedRubrics AIGeneratedRubric[]
}
```

---

## 6. Financial Models

### 6.1 Transaction

The central financial record. Every monetary flow (enrollment, refund, payout, adjustment) creates a Transaction.

```
model Transaction {
  id                String   @id @default(cuid())
  type              String   // enrollment|refund|payout|adjustment
  amount            Float    // MySQL: Decimal(10,2)
  currency          String   @default("PKR")
  status            String   @default("completed")  // pending|completed|failed|refunded
  description       String?

  // Linked entities
  courseId          String?  → Course?
  studentId         String?  → User? (TransactionStudent)
  instructorId      String?  → User? (TransactionInstructor)
  payoutId          String?  // linked payout if applicable

  // Financial breakdown
  paymentMethod     String @default("credit_debit_card")
    // credit_debit_card|jazzcash|easypaisa|bank_transfer|payoneer_stripe
  platformFee       Float    @default(0)  // 20% commission
  instructorEarning Float    @default(0)  // 80% payout
  invoiceNumber     String?
  refundedAt        DateTime?
  refundReason      String?
  metadata          String?  // JSON

  disputes          Dispute[]
}
```

### 6.2 Revenue Split Formulas

```
┌─────────────────────────────────────────────────────────────────┐
│                    REVENUE SPLIT CALCULATION                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Given:                                                          │
│    coursePrice     = course.price OR course.overridePrice        │
│    commissionRate  = financialSettings.platformCommissionRate    │
│                      OR commissionOverride.commissionRate        │
│                                                                  │
│  On Enrollment:                                                  │
│    transaction.amount            = coursePrice                   │
│    transaction.platformFee       = coursePrice × commissionRate% │
│    transaction.instructorEarning = coursePrice - platformFee     │
│                                                                  │
│  Default rates:                                                  │
│    platformFee = 20%                                             │
│    instructorEarning = 80%                                       │
│                                                                  │
│  Override example:                                               │
│    If CommissionOverride.commissionRate = 85                     │
│    Then instructor gets 85%, platform gets 15%                   │
│                                                                  │
│  On Payout:                                                      │
│    payout.grossEarning  = Σ transaction.instructorEarning        │
│                           WHERE period matches                   │
│    payout.taxWithheld  = grossEarning × withholdingTaxRate%      │
│                          (default 10% FBR)                       │
│    payout.amount       = grossEarning - taxWithheld              │
│                                                                  │
│  On Refund:                                                      │
│    transaction.status   = "refunded"                             │
│    transaction.refundedAt = now()                                │
│    transaction.refundReason = provided reason                    │
│    New negative Transaction created for accounting               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Payout

```
model Payout {
  id               String   @id @default(cuid())
  instructorId     String   → User
  amount           Float    // Net payout after tax
  currency         String   @default("PKR")
  status           String   @default("pending")
    // pending|processing|completed|failed|cancelled|disputed
  method           String   // bank_transfer|jazzcash|easypaisa|payoneer|stripe
  payoutMethodId   String?
  reference        String?  // external transaction reference
  notes            String?
  periodStart      DateTime?
  periodEnd        DateTime?
  requestedAt      DateTime @default(now())
  processedAt      DateTime?
  completedAt      DateTime?

  // Dispute fields
  disputeReason      String?
  disputeResolution  String?
  disputedAt         DateTime?

  // Tax
  taxWithheld      Float    @default(0)   // MySQL: Decimal(10,2)
  grossEarning     Float    @default(0)   // MySQL: Decimal(10,2)
}
```

### 6.4 Dispute

```
model Dispute {
  id              String   @id @default(cuid())
  transactionId   String   → Transaction
  reportedBy      String   // userId
  type            String   // payment_not_received|course_not_as_described|
                           // unauthorized_charge|technical_issue|other
  status          String   @default("open")
    // open|under_review|resolved_favor_buyer|resolved_favor_seller|
    // escalated|cancelled
  description     String
  evidence        String?  // JSON [{type, url, description}]
  resolutionNote  String?
  refundAmount    Float?
  resolvedAt      DateTime?
  resolvedBy      String?  // admin userId
}
```

### 6.5 FinancialSettings

```
model FinancialSettings {
  id                      String   @id @default(cuid())
  platformCommissionRate  Float    @default(20)    // %
  instructorPayoutRate    Float    @default(80)    // %
  minimumPayoutAmount     Int      @default(2000)  // PKR
  refundPolicyDays        Int      @default(30)
  withholdingTaxRate      Float    @default(10)    // % FBR
  autoApproveRefunds      Boolean  @default(false)
  disputeResolutionDays   Int      @default(14)
  fiscalYearStart         String   @default("July")
  currency                String   @default("PKR")
  taxId                   String?
  payoutHoldPeriodDays    Int      @default(14)
  defaultPayoutSchedule   String   @default("monthly")
  supportedPayoutMethods  String   @default("bank_transfer,jazzcash,easypaisa,payoneer,stripe")
}
```

### 6.6 CommissionOverride

```
model CommissionOverride {
  id              String   @id @default(cuid())
  instructorId    String   @unique  → User
  commissionRate  Float             // e.g., 85 instead of default 80
  reason          String?
  createdBy       String?           // admin userId
}
```

---

## 7. AI & Learning Engine Models

This section covers all 40+ AI-related models across 6 sub-domains.

### 7.1 AI Configuration (6 models)

#### AIConfiguration — Master AI Toggle Board

```
model AIConfiguration {
  id          String   @id @default(cuid())

  // ── AI Tutor ──
  tutorEnabled        Boolean  @default(true)
  tutorMode           String   @default("socratic")  // socratic|direct
  tutorLanguages      String   @default("en,ur")
  tutorContextWindow  Int      @default(20)     // last N messages
  tutorMaxTokens      Int      @default(800)
  tutorSafetyLevel    String   @default("strict")  // strict|moderate|off
  tutorBlockedTopics  String   @default("[]")  // JSON
  tutorSystemPrompt   String   // default Socratic prompt for Pakistan curriculum

  // ── Content Generation Toggles ──
  quizGeneratorEnabled      Boolean @default(true)
  curriculumGeneratorEnabled Boolean @default(true)
  thumbnailGeneratorEnabled Boolean @default(true)
  captionGeneratorEnabled   Boolean @default(true)
  descriptionWriterEnabled  Boolean @default(true)
  rubricGeneratorEnabled    Boolean @default(true)
  gradingAssistEnabled      Boolean @default(true)
  seoOptimizerEnabled       Boolean @default(true)

  // ── Content Moderation ──
  autoScreenQA              Boolean @default(true)
  autoScreenReviews         Boolean @default(true)
  autoScreenCourseContent   Boolean @default(true)
  flagConfidenceThreshold   Int     @default(75)  // %
  removeConfidenceThreshold Int     @default(95)  // %

  // ── Recommendations ──
  recommendationAlgorithm    String @default("hybrid")  // hybrid|collaborative|content_based
  recommendationRefreshHours Int    @default(24)
  boostNewCourses            Boolean @default(true)
  boostNewCourseDays         Int     @default(30)
  boostFeaturedCourses       Boolean @default(true)
  coldStartStrategy          String @default("onboarding_quiz")

  // ── Usage & Cost ──
  monthlySpendCap    Float   @default(300)  // USD
  spendCapEnabled    Boolean @default(false)

  // ── Provider Defaults ──
  defaultProviderId  String?
  defaultModelId     String?
  fallbackProviderId String?
  fallbackModelId    String?

  // ── Rate Limiting ──
  rateLimitEnabled   Boolean @default(true)
  rateLimitRpm       Int     @default(60)
  rateLimitTpm       Int     @default(100000)

  // ── Error Handling ──
  retryOnFailure     Boolean @default(true)
  maxRetries         Int     @default(3)
  retryDelayMs       Int     @default(1000)
  fallbackOnFailure  Boolean @default(true)

  // ── Logging ──
  logRequests        Boolean @default(true)
  logResponses       Boolean @default(false)
  logRetentionDays   Int     @default(90)
}
```

#### AIProvider

```
model AIProvider {
  id              String   @id @default(cuid())
  name            String   @unique  // "OpenAI", "Anthropic", "Google"
  slug            String   @unique  // "openai", "anthropic", "google"
  type            String   @default("llm")  // llm|image|embedding|tts|stt
  apiKey          String?           // encrypted at rest
  apiEndpoint     String?           // custom endpoint URL
  isActive        Boolean  @default(true)
  isDefault       Boolean  @default(false)
  priority        Int      @default(0)  // higher = preferred
  config          String   @default("{}")  // JSON: provider-specific
  monthlyBudget   Float?            // per-provider budget cap
  healthStatus    String   @default("unknown")  // unknown|healthy|degraded|down
  lastHealthCheck DateTime?

  models          AIModel[]
  usageLogs       AIUsageLog[]
}
```

#### AIModel

```
model AIModel {
  id                String   @id @default(cuid())
  providerId        String   → AIProvider (onDelete: Cascade)
  name              String   // "GPT-4o", "Claude 3.5 Sonnet"
  slug              String   // "gpt-4o", "claude-3.5-sonnet"
  modelId           String   // API identifier "gpt-4o-2024-08-06"
  type              String @default("chat")  // chat|completion|embedding|image|tts|stt
  isActive          Boolean @default(true)
  isDefault         Boolean @default(false)

  // Pricing (per 1M tokens)
  inputPricePer1M   Float   @default(0)   // USD
  outputPricePer1M  Float   @default(0)   // USD

  // Capabilities
  contextWindow     Int     @default(4096)
  maxOutputTokens   Int     @default(4096)
  supportsVision    Boolean @default(false)
  supportsStreaming  Boolean @default(true)
  supportsJson      Boolean @default(true)
  capabilities      String  @default("{}")

  // Rate Limits
  rpmLimit          Int?
  tpmLimit          Int?

  @@unique([providerId, slug])
}
```

#### AIUsageLog

```
model AIUsageLog {
  id               String   @id @default(cuid())
  providerId       String   → AIProvider (onDelete: Cascade)
  modelId          String?  → AIModel? (onDelete: SetNull)
  feature          String   // tutor|quiz_generator|moderation|...
  action           String   // chat_completion|embedding_create|image_generate

  // Token usage
  promptTokens     Int      @default(0)
  completionTokens Int      @default(0)
  totalTokens      Int      @default(0)

  // Cost & Performance
  costUSD          Float    @default(0)
  latencyMs        Int?
  isStreamed       Boolean  @default(false)

  // Status
  status           String   @default("success")  // success|error|rate_limited|timeout
  errorMessage     String?
  errorCode        String?

  // Context
  userId           String?
  courseId         String?
  sessionId        String?
  requestId        String?
  metadata         String   @default("{}")
}
```

#### AIPromptTemplate

```
model AIPromptTemplate {
  id              String   @id @default(cuid())
  name            String                     // "Tutor System Prompt"
  slug            String   @unique           // "tutor-system"
  category        String   @default("general")  // tutor|content|moderation|recommendation|general
  description     String?
  content         String                     // the actual prompt text
  variables       String   @default("[]")    // JSON ["course_name", "student_level"]
  version         Int      @default(1)
  isActive        Boolean  @default(true)
  isDefault       Boolean  @default(false)
  parentVersionId String?                    // for version tracking
  tags            String   @default("[]")    // JSON array
}
```

#### AIAuditLog

```
model AIAuditLog {
  id            String   @id @default(cuid())
  action        String   // config_update|provider_add|provider_toggle|model_add
  category      String   // config|provider|model|prompt|security
  description   String
  previousValue String?  // JSON snapshot
  newValue      String?  // JSON snapshot
  performedBy   String?  // userId or "system"
  ipAddress     String?
  userAgent     String?
  severity      String   @default("info")  // info|warning|critical
  metadata      String   @default("{}")
}
```

### 7.2 Ask ShijlAI — Student AI Assistant (10 models)

#### StudentLearningProfile

```
model StudentLearningProfile {
  id                    String   @id @default(cuid())
  studentId             String   @unique → User

  // Core learning signals (all 0–100)
  learningLevel         String   @default("beginner")  // beginner|intermediate|advanced
  engagementScore       Float    @default(0)     // 0–100
  consistencyScore      Float    @default(0)     // days_active / total_days_enrolled
  learningSpeedScore    Float    @default(50)    // completed_lessons / total_time_spent
  dropRiskScore         Float    @default(0)     // 0–30 safe, 30–60 warning, 60–100 high risk
  completionRate        Float    @default(0)     // %
  averageQuizScore      Float    @default(0)

  // Topic analysis
  weakTopics            String   @default("[]")  // JSON array
  strongTopics          String   @default("[]")  // JSON array
  recommendedTopics     String   @default("[]")  // JSON array
  learningSpeed         String   @default("moderate")  // slow|moderate|fast

  // Aggregates
  totalXpEarned         Int      @default(0)
  totalLessonsCompleted Int      @default(0)
  totalQuizzesTaken     Int      @default(0)
  totalTimeSpent        Int      @default(0)  // seconds
  studyStreakDays       Int      @default(0)
  lastAiInteraction     DateTime?
  lastComputedAt        DateTime?  // when feature engine last ran
}
```

**Feature Engine Computation:**
```
engagementScore  = (lessonViews + quizAttempts + assignmentSubs + tutorSessions) / daysSinceEnrolled
consistencyScore = daysActive / totalDaysEnrolled × 100
learningSpeedScore = normalize(completedLessons / totalTimeSpent)
dropRiskScore    = weighted(1 - consistencyScore, 1 - completionRate, inactivityDays, failingQuizRate)
```

#### ShijlAISession

```
model ShijlAISession {
  id                 String   @id @default(cuid())
  userId             String   → User
  title              String   @default("New Conversation")
  mode               String   @default("tutor")  // tutor|quiz|assignment|study_planner|career_advisor
  context            String?
  courseId           String?
  language           String   @default("en")
  isArchived         Boolean  @default(false)
  messageCount       Int      @default(0)
  summary            String?  // AI-generated conversation summary
  summaryGeneratedAt DateTime?

  messages           ShijlAIMessage[]
  conversationSummaries ConversationSummary[]
}
```

#### ShijlAIMessage

```
model ShijlAIMessage {
  id          String   @id @default(cuid())
  sessionId   String   → ShijlAISession (onDelete: Cascade)
  userId      String   → User
  role        String   // user|assistant|system
  content     String
  mode        String   @default("tutor")
  quickAction String?  // explain_simpler|more_examples|test_me|translate|generate_quiz|create_plan
  metadata    String?  // JSON
}
```

#### ConversationSummary

```
model ConversationSummary {
  id                String   @id @default(cuid())
  sessionId         String   → ShijlAISession (onDelete: Cascade)
  summary           String
  keyTopics         String   @default("[]")  // JSON array
  messageRangeStart Int                       // message index
  messageRangeEnd   Int
}
```

#### AIRecommendation

```
model AIRecommendation {
  id                  String   @id @default(cuid())
  userId              String   → User
  type                String   // lesson|quiz|course|topic|study_plan
  title               String
  description         String?
  reason              String?  // why recommended
  relatedId           String?  // courseId|lessonId|quizId
  relatedType         String?  // course|lesson|quiz|module
  recommendedTopicId  String?
  recommendedCourseId String?
  priority            String   @default("medium")  // low|medium|high
  priorityScore       Float    @default(50)   // 0–100 computed
  status              String   @default("active")  // active|pending|viewed|dismissed|completed
  sourceEvent         String?  // quiz_completion|assignment_submission|lesson_completion|ai_analysis
  sourceData          String?  // JSON
}
```

#### LearningInsight

```
model LearningInsight {
  id               String   @id @default(cuid())
  userId           String   → User
  type             String   // strength|weakness|trend|suggestion|warning|achievement
  title            String
  description      String
  category         String   @default("general")  // general|academic|study_habits|time_management|quiz_performance
  severity         String   @default("info")  // info|warning|critical
  relatedData      String?  // JSON
  isRead           Boolean  @default(false)
  isActionable     Boolean  @default(true)
  actionSuggestion String?
  expiresAt        DateTime?
}
```

#### AIQuizGeneration

```
model AIQuizGeneration {
  id               String   @id @default(cuid())
  instructorId     String   → User
  courseId         String?
  moduleId         String?
  topic            String
  difficulty       String   @default("medium")
  questionCount    Int      @default(5)
  questionTypes    String   @default("[]")  // JSON [mcq, true_false, ...]
  generatedContent String   // JSON with questions
  status           String   @default("generated")  // generated|reviewed|approved|rejected
  reviewNotes      String?
}
```

#### StudyPlan & StudyPlanTask

```
model StudyPlan {
  id                   String   @id @default(cuid())
  userId               String   → User
  title                String
  examDate             DateTime?
  availableHoursPerDay Float    @default(2)
  subjects             String   @default("[]")  // JSON
  planData             String   @default("{}")  // JSON: daily schedule
  status               String   @default("active")  // active|completed|abandoned
  progress             Float    @default(0)
  targetGrade          String?
  currentGrade         String?
  courseName           String?
  totalDays            Int      @default(0)
  completedTasks       Int      @default(0)
  totalTasks           Int      @default(0)
  tasks                StudyPlanTask[]
}

model StudyPlanTask {
  id            String    @id @default(cuid())
  studyPlanId   String    → StudyPlan (onDelete: Cascade)
  date          DateTime
  dayNumber     Int
  taskType      String    // study|quiz|revision|practice|mock_exam|ai_discussion|break
  title         String
  description   String?
  duration      Int       @default(60)  // minutes
  topic         String?
  status        String    @default("pending")  // pending|in_progress|completed|skipped
  completedAt   DateTime?
  orderIndex    Int       @default(0)

  @@index([studyPlanId])
  @@index([studyPlanId, date])
  @@index([studyPlanId, status])
}
```

#### StudentAIActivity

```
model StudentAIActivity {
  id           String   @id @default(cuid())
  userId       String   → User
  activityType String   // chat_message|quiz_generated|study_plan_created|recommendation_viewed|insight_viewed
  mode         String?  // tutor|quiz|assignment|study_planner|career_advisor
  sessionId    String?
  metadata     String?  // JSON

  @@index([userId])
  @@index([userId, activityType])
  @@index([userId, createdAt])
}
```

### 7.3 Learning Engine (5 models)

#### LearningMetric — Event Log Foundation

```
model LearningMetric {
  id          String   @id @default(cuid())
  userId      String   → User
  courseId    String?  // optional course context
  topicId     String?  // topic/module identifier
  eventType   String   // lesson_completed|quiz_attempted|assignment_submitted|time_spent|
                         // course_enrolled|ai_tutor_used|login|video_watched|note_created|bookmark_created
  eventValue  Float    @default(0)  // score/duration/completion (0–100 for scores, seconds for time)
  metadata    String?  // JSON

  @@index([userId])
  @@index([userId, eventType])
  @@index([userId, courseId])
  @@index([userId, topicId])
  @@index([userId, createdAt])
  @@index([createdAt])
}
```

#### TopicMastery — Weighted Formula with Decay

```
model TopicMastery {
  id                String   @id @default(cuid())
  userId            String   → User
  topicId           String   // topic/module identifier
  topicName         String
  courseId          String?
  skillId           String?  // parent skill

  // Weighted components (0–100 each)
  quizScore         Float    @default(0)    // 50% weight
  assignmentScore   Float    @default(0)    // 25% weight
  practiceScore     Float    @default(0)    // 15% weight
  completionScore   Float    @default(0)    // 10% weight

  // Combined
  masteryScore      Float    @default(0)    // 0–100 weighted
  status            String   @default("not_started")
    // not_started(0–25%)|weak(25–50%)|learning(50–75%)|strong(75–90%)|mastered(90–100%)

  // Tracking
  questionsAttempted Int     @default(0)
  questionsCorrect   Int     @default(0)
  attemptCount       Int     @default(0)
  lastAttempted      DateTime @default(now())
  trend              String  @default("stable")  // improving|declining|stable
  decayApplied       Boolean @default(false)

  @@unique([userId, topicId])
  @@index([userId])
  @@index([userId, courseId])
  @@index([userId, skillId])
  @@index([masteryScore])
  @@index([status])
}
```

**Mastery Formula:**
```
masteryScore = quizScore × 0.50
             + assignmentScore × 0.25
             + practiceScore × 0.15
             + completionScore × 0.10

Status thresholds:
  not_started: 0–25%
  weak:        25–50%
  learning:    50–75%
  strong:      75–90%
  mastered:    90–100%

Time decay (applied daily):
  If daysSinceLastAttempt > 7:
    decayedScore = masteryScore × (1 - decayRate × daysSinceLastAttempt)
    decayApplied = true
```

#### SkillTopicMapping

```
model SkillTopicMapping {
  id          String   @id @default(cuid())
  skillId     String   // "machine-learning"
  skillName   String
  topicId     String   // "regression", "classification", "neural-networks"
  topicName   String
  courseId    String?
  weight      Float    @default(1.0)  // contribution weight
  category    String   @default("general")  // programming|web|data|design|devops|soft-skills|science|math

  @@unique([skillId, topicId])
  @@index([skillId])
  @@index([topicId])
  @@index([courseId])
  @@index([category])
}
```

#### LearningEvent — Structured Analytics

```
model LearningEvent {
  id            String   @id @default(cuid())
  userId        String   → User
  courseId      String?
  moduleId      String?
  lessonId      String?
  quizId        String?
  assignmentId  String?
  eventType     String
    // LESSON_STARTED|LESSON_COMPLETED|LESSON_ABANDONED|
    // QUIZ_STARTED|QUIZ_SUBMITTED|QUIZ_PASSED|QUIZ_FAILED|
    // ASSIGNMENT_SUBMITTED|COURSE_ENROLLED|COURSE_COMPLETED|
    // AI_CHAT_USED|DISCUSSION_POSTED|VIDEO_WATCHED|
    // NOTE_CREATED|BOOKMARK_CREATED|LOGIN
  score         Float?    // 0–100
  timeSpent     Int       @default(0)  // seconds
  metadata      String?   // JSON

  @@index([userId])
  @@index([userId, eventType])
  @@index([userId, courseId])
  @@index([userId, createdAt])
  @@index([createdAt])
  @@index([eventType])
}
```

#### QuestionTopic

```
model QuestionTopic {
  id          String   @id @default(cuid())
  questionId  String
  topicId     String   // "probability", "statistics"
  topicName   String
  weight      Float    @default(1.0)  // 0–1 relevance

  @@index([questionId])
  @@index([topicId])
  @@index([questionId, topicId])
}
```

### 7.4 Instructor Copilot (6 models)

```
AIGeneratedOutline
  id, instructorId→User, courseId→Course?, prompt, generatedContent (JSON),
  status (generated|reviewed|approved|rejected), editedContent, reviewNotes

AIGeneratedLesson
  id, instructorId→User, courseId→Course?, topic, structureContent (JSON),
  lessonContent (JSON), status (structure_generated|structure_approved|
  content_generated|reviewed|approved|rejected), editedContent, reviewNotes

AIGeneratedAssignment
  id, instructorId→User, courseId→Course?, topic, difficulty,
  generatedContent (JSON), status, editedContent, reviewNotes

AIGeneratedRubric
  id, instructorId→User, courseId→Course?, assignmentId→Assignment?, topic,
  generatedContent (JSON: criteria with levels), status, editedContent, reviewNotes

AIGeneratedQuiz
  id, instructorId→User, courseId→Course?, topic, questionTypes (JSON),
  difficulty, questionCount, generatedContent (JSON), status, editedContent, reviewNotes

InstructorAIActivity
  id, instructorId→User, activityType, moduleType, title, metadata (JSON)
```

### 7.5 Smart Assessment (5 models)

```
LearningOutcome
  id, courseId→Course (Cascade), title, description, order
  → questionOutcomes[]

QuestionOutcome
  id, questionId, outcomeId→LearningOutcome (Cascade)
  @@unique([questionId, outcomeId])

QuestionAnalytics
  id, questionId @unique, attempts, correctAttempts, incorrectAttempts,
  successRate, difficultyScore, difficultyLevel (too_easy|easy|normal|difficult|too_difficult)

DistractorAnalytics
  id, questionId, optionLabel, optionText, selectionCount, selectionRate,
  isCorrect, isWeak (<5% selection for non-correct options)
  @@unique([questionId, optionLabel])

AssessmentQualityScore
  id, quizId @unique, difficultyBalance (0–100), questionVariety (0–100),
  outcomeCoverage (0–100), avgCompletionTime, overallScore (0–100)
```

### 7.6 AI Companion & Mock Interview (4 models)

```
AICompanionMessage
  id, studentId→User, message, messageType (inactivity_alert|weak_topic|
  study_plan_missed|exam_reminder|motivation|achievement|recommendation|check_in),
  priority (low|normal|high|urgent), isRead, actionType, actionData (JSON)

AICompanionEvent
  id, studentId→User, eventType (login|lesson_complete|quiz_attempt|
  study_streak|inactivity_detected|weak_topic_detected|plan_missed|goal_achieved),
  eventData (JSON)

MockInterview
  id, studentId→User, domain, difficulty, interviewType (technical|behavioral|mixed|viva),
  status (in_progress|completed|abandoned), score, accuracy%, completeness%,
  clarity%, confidence%, feedback, strengths (JSON), weaknesses (JSON),
  startedAt, completedAt
  → questions[]

InterviewQuestion
  id, interviewId→MockInterview (Cascade), question, questionType
  (conceptual|practical|scenario|behavioral|definition|comparison), topic,
  difficulty, studentAnswer, evaluation, score, idealAnswer, feedback, orderIndex
```

---

## 8. Gamification Models

### 8.1 Model Inventory

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **Badge** | Achievement definition | name, icon, category, xpReward, coinReward, requirement (JSON), isActive |
| **UserBadge** | Badge earned by user | userId, badgeId, earnedAt; `@@unique([userId, badgeId])` |
| **XPRule** | XP award rules per action | action (@unique), label, xpAwarded, coinAwarded, category, isActive |
| **LevelConfig** | Level threshold config | level (@unique), title, minXp, maxXp, badgeIcon, coinReward |
| **GamificationSettings** | Master toggles | leaderboardResetFrequency, streakXpMultiplier, streakFreezeCost, master toggles |
| **StreakReward** | Streak milestone rewards | streakDays (@unique), xpBonus, coinBonus, badgeId? |
| **RewardShopItem** | Shop items for coins | name, coinCost, xpCost, stock (-1=unlimited), category |
| **UserReward** | Purchase record | userId, itemId, coinPaid, status (active|redeemed|expired|refunded) |
| **GamificationEvent** | Limited-time events | type, xpMultiplier, coinMultiplier, startDate, endDate |
| **StreakFreeze** | Streak protection | userId, date (YYYY-MM-DD), costCoins |

### 8.2 XP Flow

```
┌─────────────────── XP AWARD PIPELINE ───────────────────┐
│                                                          │
│  Student Action          XPRule               XP Awarded │
│  ─────────────           ──────               ─────────  │
│  Complete lesson    →   complete_lesson      →  10 XP    │
│  Pass quiz (1st)    →   pass_quiz_first      →  25 XP    │
│  Pass quiz (retry)  →   pass_quiz_retry      →  10 XP    │
│  Submit assignment  →   submit_assignment     →  15 XP    │
│  Daily login        →   daily_login           →   5 XP    │
│  Streak bonus       →   streak_bonus          →  var XP   │
│  Challenge reward   →   challenge_reward      →  var XP   │
│  Course complete    →   course_complete        → 100 XP   │
│                                                          │
│  Multipliers:                                            │
│    Streak multiplier: × GamificationSettings.streakXpMult │
│    Event multiplier:  × GamificationEvent.xpMultiplier    │
│                                                          │
│  XpActivity (audit trail):                               │
│    { userId, action, xpAmount, coinAmount, description }  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 8.3 Level Progression

```
Level  Title           minXp    maxXp    CoinReward
─────  ──────────      ─────    ─────    ──────────
  1    Newcomer           0       100        0
  2    Learner          100       300       50
  3    Explorer         300       700      100
  4    Practitioner     700      1500      200
  5    Scholar         1500      3000      400
  6    Expert          3000      6000      700
  7    Master          6000     12000     1000
  8    Grandmaster    12000     99999     2000
```

---

## 9. Community & Communication Models

### 9.1 Q&A System (5 models)

```
QAQuestion
  id, userId→User, courseId→Course, lessonId→Lesson?, question, isAnswered,
  isPinned, isFlagged, upvotes, aiDraftAnswer
  // Moderation: flaggedReason, flagCount, aiAssessment, moderationStatus,
  //             moderatedAt, moderatedBy
  → answers[], upvoteRecords[]

QAAnswer
  id, questionId→QAQuestion (Cascade), userId→User, content, isAiGenerated,
  isInstructorAnswer, isEdited, isAccepted
  // Moderation: isFlagged, flaggedReason, flagCount, aiAssessment, moderationStatus
  → upvotes[]

QAUpvote     — @@unique([questionId, userId])
QAAnswerUpvote — @@unique([answerId, userId])
QASettings   — per-instructor settings: autoAnswer, emailNotifications, maxQuestionsPerDay
```

### 9.2 Discussion Forum (3 models + DiscussionBookmark)

```
DiscussionPost
  id, courseId→Course, userId→User, title, content, isPinned, isLocked,
  upvotes, replyCount, lessonId?, lessonContext?
  // Moderation: isFlagged, flaggedReason, flagCount, aiAssessment, moderationStatus
  → replies[], upvoteRecords[], bookmarks[]

DiscussionReply
  id, postId→DiscussionPost (Cascade), userId→User, content, upvotes, isEdited
  // Moderation: isFlagged, flaggedReason, flagCount, aiAssessment, moderationStatus

DiscussionUpvote — @@unique([postId, userId])
DiscussionBookmark — @@unique([userId, postId])
```

### 9.3 Study Groups (4 models)

```
StudyGroup
  id, name, description, emoji, courseId→Course?, createdById→User,
  isActive, maxMembers, memberCount
  → members[], messages[], resources[], events[]

StudyGroupMember  — @@unique([groupId, userId])
StudyGroupMessage — groupId, userId, content, type (text|resource|announcement|system)
StudyGroupResource — groupId, userId, title, url, fileType, downloads
```

### 9.4 Messaging (3 models)

```
Conversation
  id, type (direct|group), courseId?, title, lastMessageAt, lastMessageContent
  → participants[], messages[]

ConversationParticipant — @@unique([conversationId, userId])
  role (admin|member), lastReadAt, isMuted, isArchived, isStarred

Message
  conversationId→Conversation (Cascade), senderId→User, content,
  type (text|image|file|system), attachments (JSON), isRead, readBy (JSON),
  editedAt, deletedAt
```

### 9.5 Notifications (4 models)

```
Notification
  id, userId→User, type, title, content, icon?, link?, isRead, readAt,
  courseId?, senderId?, metadata?, priority (normal|high|urgent),
  category (general|academic|financial|social|system|security),
  actionUrl?, actionLabel?, dismissUrl?, dismissLabel?,
  isArchived, archivedAt, isPinned, pinnedAt, expiresAt

  @@index([userId, isRead])
  @@index([userId, isArchived])
  @@index([userId, type])
  @@index([userId, createdAt])

NotificationPreference — 14 boolean toggles + digestMode + quietHours + autoArchive/Delete
NotificationTemplate   — reusable templates with {{variables}}
NotificationLog        — bulk notification tracking: sentCount, openedCount, clickCount
NotificationSettings   — global: maxPerDay, quietHours, segments, senderInfo
```

---

## 10. Security & Auth Models

### 10.1 UserSession

```
model UserSession {
  id          String   @id @default(cuid())
  userId      String   → User (onDelete: Cascade)
  token       String   @unique
  deviceName  String?
  deviceType  String   @default("desktop")  // desktop|mobile|tablet
  browser     String?
  os          String?
  ipAddress   String?
  location    String?
  isActive    Boolean  @default(true)
  lastActivity DateTime @default(now())
  expiresAt   DateTime

  @@index([userId])
}
```

### 10.2 SecuritySettings — Singleton Config

```
model SecuritySettings {
  // Password Policy
  userPasswordMinLength     Int      @default(8)
  userPasswordUppercase     Boolean  @default(true)
  userPasswordNumber        Boolean  @default(true)
  adminPasswordMinLength    Int      @default(12)
  adminPasswordSpecial      Boolean  @default(true)
  passwordExpiryDays        Int      @default(90)
  passwordPreventReuseCount Int      @default(5)

  // MFA
  enableMFA                 Boolean  @default(false)
  force2FAForAdmins         Boolean  @default(false)
  mfaMethod                 String   @default("totp")  // totp|sms|email

  // Rate Limiting
  rateLimitingEnabled       Boolean  @default(true)
  maxRequestsPerMinute      Int      @default(60)
  loginAttemptThreshold     Int      @default(5)
  lockDurationMinutes       Int      @default(15)
  apiRateLimitPerHour       Int      @default(1000)

  // Session Management
  sessionTimeoutMinutes     Int      @default(60)
  maxConcurrentSessions     Int      @default(3)
  idleTimeoutMinutes        Int      @default(30)

  // IP & Alerts
  ipWhitelistEnabled        Boolean  @default(false)
  loginAlertsEnabled        Boolean  @default(true)
  alertOnSuspiciousIp       Boolean  @default(true)
  alertOnNewDevice          Boolean  @default(true)
}
```

### 10.3 Security Models

```
SecurityRole   — name @unique, permissions (JSON), isDefault, description
ApiKey         — name, keyPrefix, keyHash @unique, keyLastFour, permission, isActive, lastUsedAt, revokedAt
BlockedIp      — ip, reason, blockedBy, expiresAt (null=permanent)
LoginAlert     — userId?, ip, userAgent, location, eventType, isSuspicious
SecurityEvent  — type, userId?, actorId?, details (JSON), ip
```

### 10.4 Content Moderation

```
ContentModerationSettings
  autoRemoveProfanity, autoFlagExternalLinks, aiContentScreening,
  requireEmailVerification, minimumAccountAgeDays, blocklistWords (JSON)
```

Moderation fields (repeated pattern across QAQuestion, QAAnswer, DiscussionPost, DiscussionReply, Review):
```
  isFlagged       Boolean  @default(false)
  flaggedReason   String?
  flagCount       Int      @default(0)
  aiAssessment    String?
  moderationStatus String  @default("none")  // none|under_review|removed|kept|escalated
  moderatedAt     DateTime?
  moderatedBy     String?
```

---

## 11. Admin Platform Config Models

### 11.1 Model Inventory

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **ActivityLog** | Admin audit trail | type, title, description, action, targetType, targetId, severity, category |
| **PlatformSettings** | Comprehensive config | 90+ fields: general, registration, course rules, SMTP, SEO, GDPR, rate limits, moderation |
| **WebhookConfig** | Outbound webhooks | url, secret, events (JSON), isActive, lastTriggeredAt, failureCount |
| **AppearanceBranding** | UI/UX config | 80+ fields: colors, fonts, nav, footer, homepage layout, certificate design, email templates, watermark, banner |
| **AppearanceHistory** | Theme snapshots | snapshot (JSON), presetName, changedBy, changeDescription |
| **PaymentMethodConfig** | Payment gateway setup | name @unique, isConnected, config (JSON), isActive, order |
| **Integration** | Third-party integrations | name @unique, category, isConnected, config (JSON), usageInfo |
| **LegalPage** | TOS/Privacy/Refund | name @unique, content (markdown), lastUpdatedAt |
| **FeatureFlag** | Feature rollouts | name @unique, enabled, rollout (0–100%), category |
| **PlatformSetting** | Key-value config | key @unique, value, label, type, category |
| **PlatformAnnouncement** | System announcements | title, message, type, target, isActive, startsAt, expiresAt |
| **ContentModerationSettings** | Moderation config | autoRemoveProfanity, aiContentScreening, blocklistWords |

### 11.2 Activity Log Categories

```
ActivityLog.type values:
  course_published, refund_requested, post_flagged, instructor_applied,
  revenue_received, security_alert, payout_disputed, user_signup,
  enrollment_created, course_review_pending, user_suspended, user_banned,
  refund_issued, notification_sent, revenue_split_changed, course_rejected,
  content_removed, settings_updated, payout_processed, api_key_generated,
  role_created, ip_blocked, login_alert

ActivityLog.category values:
  admin_action, system_event, security, finance, content, user_management

ActivityLog.severity values:
  info, warning, critical
```

### 11.3 Integration Categories

```
Integration.category values:
  ai, video, marketing, analytics, communication, automation

Pre-defined integrations:
  anthropic, cloudflare_stream, mailchimp, firebase,
  google_analytics, facebook_pixel, twilio, zapier
```

---

## 12. Relationship Map

### 12.1 Major Foreign Key Relationships

| Source Model | FK Field | Target Model | Relation Name | Delete |
|-------------|----------|-------------|---------------|--------|
| Module | courseId | Course | — | Cascade |
| Lesson | moduleId | Module | — | Cascade |
| Enrollment | userId | User | — | Restrict |
| Enrollment | courseId | Course | — | Restrict |
| LessonProgress | enrollmentId | Enrollment | — | Cascade |
| LessonProgress | lessonId | Lesson | — | Restrict |
| Quiz | courseId | Course | — | SetNull |
| Question | quizId | Quiz | — | Cascade |
| QuizAttempt | userId | User | — | Restrict |
| QuizAttempt | quizId | Quiz | — | Restrict |
| Assignment | courseId | Course | — | Cascade |
| Submission | assignmentId | Assignment | — | Cascade |
| Submission | studentId | User | — | Restrict |
| Transaction | courseId | Course | — | SetNull |
| Transaction | studentId | User | TransactionStudent | SetNull |
| Transaction | instructorId | User | TransactionInstructor | SetNull |
| Dispute | transactionId | Transaction | — | Restrict |
| Payout | instructorId | User | — | Restrict |
| PayoutMethod | instructorId | User | — | Restrict |
| CommissionOverride | instructorId | User | — | Restrict (1:1) |
| Certificate | userId | User | — | Restrict |
| Review | userId | User | — | Restrict |
| Review | courseId | Course | — | Restrict |
| Review | enrollmentId | Enrollment | — | Restrict (1:1) |
| Wishlist | userId | User | — | Restrict |
| Wishlist | courseId | Course | — | Restrict |
| QAQuestion | userId | User | — | Restrict |
| QAQuestion | courseId | Course | — | Restrict |
| QAQuestion | lessonId | Lesson | — | SetNull |
| QAAnswer | questionId | QAQuestion | — | Cascade |
| DiscussionPost | courseId | Course | — | Restrict |
| DiscussionReply | postId | DiscussionPost | — | Cascade |
| StudyGroup | courseId | Course | — | SetNull |
| StudyGroup | createdById | User | CreatedGroups | Restrict |
| StudyGroupMember | groupId | StudyGroup | — | Cascade |
| StudyGroupMessage | groupId | StudyGroup | — | Cascade |
| CommunityEvent | courseId | Course | — | SetNull |
| CommunityEvent | createdById | User | CreatedEvents | Restrict |
| PeerReview | assignmentId | Assignment | — | Cascade |
| PeerReview | reviewerId | User | PeerReviewReviewer | Restrict |
| PeerReview | revieweeId | User | PeerReviewReviewee | Restrict |
| LiveSession | courseId | Course | — | SetNull |
| LiveSession | instructorId | User | InstructorSessions | Restrict |
| SessionAttendee | sessionId | LiveSession | — | Cascade |
| SessionAttendee | userId | User | — | Restrict |
| ConversationParticipant | conversationId | Conversation | — | Cascade |
| Message | conversationId | Conversation | — | Cascade |
| Message | senderId | User | SentMessages | Restrict |
| Notification | userId | User | — | Restrict |
| NotificationPreference | userId | User | — | Cascade (1:1) |
| InstructorProfile | instructorId | User | — | Restrict (1:1) |
| InstructorSettings | instructorId | User | — | Restrict (1:1) |
| InstructorApplication | userId | User | — | SetNull (1:1) |
| ApplicationTimeline | applicationId | InstructorApplication | — | Cascade |
| ApplicationInterview | applicationId | InstructorApplication | — | Cascade |
| UserSession | userId | User | — | Cascade |
| StudentLearningProfile | studentId | User | — | Restrict (1:1) |
| StudentSettings | studentId | User | — | Restrict (1:1) |
| AIModel | providerId | AIProvider | — | Cascade |
| AIUsageLog | providerId | AIProvider | — | Cascade |
| AIUsageLog | modelId | AIModel | — | SetNull |
| ShijlAIMessage | sessionId | ShijlAISession | — | Cascade |
| StudyPlanTask | studyPlanId | StudyPlan | — | Cascade |
| LearningPathNode | pathId | LearningPath | — | Cascade |
| InterviewQuestion | interviewId | MockInterview | — | Cascade |
| LearningOutcome | courseId | Course | — | Cascade |
| QuestionOutcome | outcomeId | LearningOutcome | — | Cascade |
| CourseSkill | courseId | Course | — | Cascade |
| LessonSkill | lessonId | Lesson | — | Cascade |
| QuestionSkill | questionId | Question | — | Cascade |
| StudentSkillHistory | userSkillId | UserSkill | — | Cascade |
| CareerPathSkill | careerPathId | CareerPath | — | Cascade |
| CourseReviewHistory | courseId | Course | — | Cascade |
| CourseQualityAnalysis | courseId | Course | — | Cascade |

### 12.2 Self-Relations

| Model | Self-Relation | Purpose |
|-------|--------------|---------|
| **Skill** | `parentSkillId → Skill.id` (SkillSubSkills) | Skill hierarchy: "Python" → "Decorators", "Generators" |
| **CareerPath** | `nextPathId → CareerPath.id` (CareerPathProgression) | Career progression: "Junior Dev" → "Mid Dev" → "Senior Dev" |
| **AIPromptTemplate** | `parentVersionId` | Version chain for prompt templates |

### 12.3 One-to-One Relationships

| Model | FK | Target | Unique Constraint |
|-------|-----|--------|-------------------|
| InstructorProfile | instructorId | User | @unique |
| InstructorSettings | instructorId | User | @unique |
| InstructorApplication | userId | User | @unique |
| StudentLearningProfile | studentId | User | @unique |
| StudentSettings | studentId | User | @unique |
| NotificationPreference | userId | User | @unique |
| CommissionOverride | instructorId | User | @unique |
| CourseQualityAnalysis | courseId | Course | @unique |
| QuestionAnalytics | questionId | Question | @unique |
| AssessmentQualityScore | quizId | Quiz | @unique |
| Review | enrollmentId | Enrollment | @unique |

### 12.4 Many-to-Many (Junction) Relationships

| Junction Model | Side A | Side B | Unique Constraint |
|---------------|--------|--------|-------------------|
| Enrollment | User | Course | `@@unique([userId, courseId])` |
| UserBadge | User | Badge | `@@unique([userId, badgeId])` |
| ParentLink | User (parent) | User (child) | `@@unique([parentId, childId])` |
| DailyActivity | User | Date | `@@unique([userId, date])` |
| LessonProgress | Enrollment | Lesson | `@@unique([enrollmentId, lessonId])` |
| QAUpvote | QAQuestion | User | `@@unique([questionId, userId])` |
| QAAnswerUpvote | QAAnswer | User | `@@unique([answerId, userId])` |
| DiscussionUpvote | DiscussionPost | User | `@@unique([postId, userId])` |
| DiscussionBookmark | DiscussionPost | User | `@@unique([userId, postId])` |
| StudyGroupMember | StudyGroup | User | `@@unique([groupId, userId])` |
| EventAttendee | CommunityEvent | User | `@@unique([eventId, userId])` |
| SessionAttendee | LiveSession | User | `@@unique([sessionId, userId])` |
| Wishlist | User | Course | `@@unique([userId, courseId])` |
| Review | User | Course | `@@unique([userId, courseId])` |
| UserChallenge | User | DailyChallenge | `@@unique([userId, challengeId])` |
| ConversationParticipant | Conversation | User | `@@unique([conversationId, userId])` |
| TopicMastery | User | Topic | `@@unique([userId, topicId])` |
| SkillTopicMapping | Skill | Topic | `@@unique([skillId, topicId])` |
| TopicPrerequisite | Topic | PrereqTopic | `@@unique([topicId, prerequisiteTopicId])` |
| CourseSkill | Course | Skill | `@@unique([courseId, skillId])` |
| LessonSkill | Lesson | Skill | `@@unique([lessonId, skillId])` |
| QuestionSkill | Question | Skill | `@@unique([questionId, skillId])` |
| QuestionOutcome | Question | LearningOutcome | `@@unique([questionId, outcomeId])` |
| DistractorAnalytics | Question | OptionLabel | `@@unique([questionId, optionLabel])` |
| CareerPathSkill | CareerPath | Skill | `@@unique([careerPathId, skillId])` |
| UserSkill | User | Skill | `@@unique([userId, skillId])` |

---

## 13. Index Strategy

### 13.1 Composite Indexes (explicit `@@index`)

| Model | Index Fields | Purpose |
|-------|-------------|---------|
| **Notification** | `[userId, isRead]` | Unread notification count query |
| **Notification** | `[userId, isArchived]` | Active notification list |
| **Notification** | `[userId, type]` | Filter by notification type |
| **Notification** | `[userId, createdAt]` | Chronological notification feed |
| **ApplicationTimeline** | `[applicationId]` | Timeline for application |
| **ApplicationInterview** | `[applicationId]` | Interviews for application |
| **UserSession** | `[userId]` | User's active sessions |
| **LessonNote** | `[userId, lessonId, enrollmentId]` | Notes for enrollment+lesson |
| **LessonBookmark** | `[userId, lessonId, enrollmentId]` | Bookmarks for enrollment+lesson |
| **UserSkill** | `[userId]` | User's skill list |
| **UserSkill** | `[userId, skillId]` | Specific skill lookup |
| **UserSkill** | `[level]` | Filter by skill level |
| **LearningMetric** | `[userId]` | User metrics |
| **LearningMetric** | `[userId, eventType]` | Filter by event type |
| **LearningMetric** | `[userId, courseId]` | Course-specific metrics |
| **LearningMetric** | `[userId, topicId]` | Topic-specific metrics |
| **LearningMetric** | `[userId, createdAt]` | Time-range queries |
| **LearningMetric** | `[createdAt]` | Global time-range analytics |
| **TopicMastery** | `[userId]` | User's mastery list |
| **TopicMastery** | `[userId, courseId]` | Course mastery |
| **TopicMastery** | `[userId, skillId]` | Skill-aligned mastery |
| **TopicMastery** | `[masteryScore]` | Low-mastery detection |
| **TopicMastery** | `[status]` | Status-based filtering |
| **SkillTopicMapping** | `[skillId]` | Topics for skill |
| **SkillTopicMapping** | `[topicId]` | Skills for topic |
| **SkillTopicMapping** | `[courseId]` | Mappings for course |
| **SkillTopicMapping** | `[category]` | Category filtering |
| **LearningEvent** | `[userId]` | User events |
| **LearningEvent** | `[userId, eventType]` | Event type filter |
| **LearningEvent** | `[userId, courseId]` | Course events |
| **LearningEvent** | `[userId, createdAt]` | Time-range |
| **LearningEvent** | `[createdAt]` | Global analytics |
| **LearningEvent** | `[eventType]` | Event type analytics |
| **QuestionTopic** | `[questionId]` | Topics for question |
| **QuestionTopic** | `[topicId]` | Questions for topic |
| **QuestionTopic** | `[questionId, topicId]` | Junction lookup |
| **StudentAIActivity** | `[userId]` | User AI activity |
| **StudentAIActivity** | `[userId, activityType]` | Activity type filter |
| **StudentAIActivity** | `[userId, createdAt]` | Time-range |
| **StudyPlanTask** | `[studyPlanId]` | Tasks for plan |
| **StudyPlanTask** | `[studyPlanId, date]` | Tasks by date |
| **StudyPlanTask** | `[studyPlanId, status]` | Tasks by status |
| **AIGeneratedOutline** | `[instructorId]`, `[courseId]` | Instructor/course filter |
| **AIGeneratedLesson** | `[instructorId]`, `[courseId]` | Instructor/course filter |
| **AIGeneratedAssignment** | `[instructorId]`, `[courseId]` | Instructor/course filter |
| **AIGeneratedRubric** | `[instructorId]`, `[courseId]` | Instructor/course filter |
| **AIGeneratedQuiz** | `[instructorId]`, `[courseId]` | Instructor/course filter |
| **InstructorAIActivity** | `[instructorId]`, `[instructorId, activityType]`, `[instructorId, createdAt]` | Activity tracking |
| **LearningOutcome** | `[courseId]` | Outcomes for course |
| **QuestionOutcome** | `[questionId]`, `[outcomeId]` | Junction lookups |
| **QuestionAnalytics** | `[difficultyLevel]`, `[successRate]` | Difficulty filtering |
| **DistractorAnalytics** | `[questionId]` | Options for question |
| **AssessmentQualityScore** | `[quizId]`, `[overallScore]` | Quality lookup |
| **CourseSkill** | `[courseId]`, `[skillId]` | Course↔Skill lookups |
| **LessonSkill** | `[lessonId]`, `[skillId]` | Lesson↔Skill lookups |
| **QuestionSkill** | `[questionId]`, `[skillId]` | Question↔Skill lookups |
| **StudentSkillHistory** | `[userId, skillId]`, `[userId, skillId, recordedAt]`, `[recordedAt]` | Timeline chart data |
| **CareerPathSkill** | `[careerPathId]`, `[skillId]` | Career↔Skill lookups |
| **LearningPath** | `[studentId]` | Student's learning paths |
| **LearningPathNode** | `[pathId, sequenceOrder]` | Ordered path traversal |
| **AICompanionMessage** | `[studentId, isRead]`, `[studentId, createdAt]` | Unread messages |
| **AICompanionEvent** | `[studentId, eventType]`, `[studentId, createdAt]` | Event tracking |
| **MockInterview** | `[studentId, domain]`, `[studentId, completedAt]` | Interview history |
| **CourseReviewHistory** | `[courseId]`, `[reviewerId]` | Review audit |
| **ApiUsageLog** | `[endpoint]`, `[createdAt]`, `[apiKeyId]` | API monitoring |
| **GeneratedReport** | `[reportType]`, `[status]`, `[createdAt]` | Report management |
| **CourseQualityAnalysis** | `[qualityScore]`, `[courseId]` | Quality ranking |

### 13.2 Index Strategy Rationale

```
┌─────────────────────────────────────────────────────────────────┐
│                    INDEX DESIGN PRINCIPLES                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. USER-CENTRIC: Nearly every index starts with [userId]        │
│     → Most queries are scoped to the current user                │
│     → Composite [userId, ...] indexes support filtered queries   │
│                                                                  │
│  2. TIME-RANGE: [userId, createdAt] indexes on event tables      │
│     → Dashboard widgets query last 7/30/90 days                  │
│     → Analytics queries need efficient date range scans          │
│                                                                  │
│  3. STATUS FILTERING: Indexes on status/masteryScore/level       │
│     → "Show all students with dropRisk > 60"                     │
│     → "Find all topics with mastery < 50"                        │
│                                                                  │
│  4. JUNCTION LOOKUP: Composite unique indexes enforce M:N        │
│     → Prevents duplicate enrollments, upvotes, badges            │
│     → Also serves as covering index for existence checks         │
│                                                                  │
│  5. NO OVER-INDEXING: SQLite doesn't benefit from many indexes   │
│     → Only indexes that match real query patterns                │
│     → MySQL migration should verify with EXPLAIN ANALYZE         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 14. Data Integrity

### 14.1 Unique Constraints

#### Single-Field Unique

| Model | Field | Purpose |
|-------|-------|---------|
| User | `email` | One account per email |
| UserSession | `token` | Session token uniqueness |
| ApiKey | `keyHash` | API key uniqueness |
| InstructorApplication | `applicationCode` | Public tracking code (INS-2024-ABC123) |
| Skill | `name` | Skill name uniqueness |
| Skill | `slug` | URL-safe skill identifier |
| CareerPath | `slug` | URL-safe career path identifier |
| Certificate | `certificateId` | Verification code (SHIJL-GIT-20241230-SA) |
| BlogPost | `slug` | SEO-friendly URL |
| XPRule | `action` | One rule per action type |
| LevelConfig | `level` | One config per level number |
| StreakReward | `streakDays` | One reward per milestone |
| NotificationTemplate | `name` | Template name uniqueness |
| AIPromptTemplate | `slug` | Template slug uniqueness |
| AIProvider | `name`, `slug` | Provider identity |
| SecurityRole | `name` | Role name uniqueness |
| PaymentMethodConfig | `name` | Gateway name uniqueness |
| Integration | `name` | Integration name uniqueness |
| LegalPage | `name` | Page name uniqueness |
| FeatureFlag | `name` | Flag name uniqueness |
| PlatformSetting | `key` | Setting key uniqueness |

#### Composite Unique Constraints

(See §12.4 — 25 junction tables with `@@unique` constraints)

### 14.2 Cascading Delete Strategy

```
┌──────────────────────────────────────────────────────────────┐
│              CASCADE DELETE HIERARCHY                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Course (DELETE) ──── Cascade ────▶ Module (DELETE)          │
│     │                               │                         │
│     │                               └─── Cascade ──▶ Lesson   │
│     │                                            │            │
│     │                                            ├── LessonProgress │
│     │                                            ├── LessonNote      │
│     │                                            ├── LessonBookmark  │
│     │                                            └── LessonSkill     │
│     │                                                         │
│     ├── Cascade ──▶ Assignment (DELETE)                       │
│     │       ├── Cascade ──▶ Submission                        │
│     │       ├── Cascade ──▶ PeerReview                        │
│     │       └── Cascade ──▶ AIGeneratedRubric                 │
│     │                                                         │
│     ├── Cascade ──▶ CourseSkill                               │
│     ├── Cascade ──▶ LearningOutcome → QuestionOutcome         │
│     ├── Cascade ──▶ CourseReviewHistory                       │
│     └── Cascade ──▶ CourseQualityAnalysis                     │
│                                                               │
│  User (DELETE) ──── Cascade ────▶ UserSession                │
│     │                  ├── NotificationPreference              │
│     │                  └── (1:1 owned records)                 │
│     │                                                         │
│  ShijlAISession ──── Cascade ────▶ ShijlAIMessage            │
│  StudyPlan ────────── Cascade ────▶ StudyPlanTask            │
│  LearningPath ─────── Cascade ────▶ LearningPathNode         │
│  MockInterview ────── Cascade ────▶ InterviewQuestion        │
│  AIProvider ───────── Cascade ────▶ AIModel, AIUsageLog      │
│                                                               │
│  SetNull on delete:                                           │
│    Transaction.courseId, Transaction.studentId,               │
│    Transaction.instructorId → preserve financial records      │
│    Quiz.courseId → orphaned quizzes remain accessible         │
│    AIUsageLog.modelId → logs survive model deletion           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 14.3 Data Validation Rules (Application Layer)

| Field | Rule | Enforced By |
|-------|------|-------------|
| `User.email` | Valid email format, unique | Prisma `@unique` + Zod validation |
| `User.role` | One of: student, instructor, admin, parent | Enum validation |
| `Course.price` | >= 0 | Default(0) + validation |
| `Course.completionThreshold` | 0–100 | Default(80) + validation |
| `Enrollment.progress` | 0–100 | Float range check |
| `Review.rating` | 1–5 | Int range check |
| `Quiz.passingScore` | 0–100 | Default(70) + validation |
| `UserSkill.overallScore` | 0–100 | Weighted formula computed |
| `TopicMastery.masteryScore` | 0–100 | Weighted formula computed |
| `MockInterview.score/accuracy/etc` | 0–100 | Float range check |
| `FeatureFlag.rollout` | 0–100 | Int range check |
| `FinancialSettings.platformCommissionRate` | 0–100 | Percentage validation |

---

## 15. Migration Strategy (SQLite → MySQL)

### 15.1 Migration Overview

```
┌──────────┐     ┌───────────┐     ┌──────────┐     ┌───────────┐
│  SQLite   │────▶│   Dump    │────▶│ Transform│────▶│   MySQL   │
│  (dev)    │     │   Data    │     │  Script  │     │  (prod)   │
└──────────┘     └───────────┘     └──────────┘     └───────────┘

Steps:
1. Set DATABASE_URL_MYSQL in .env
2. npx prisma db push --schema=prisma/schema_mysql.prisma
3. Data migration script handles type conversions
4. Verify data integrity
5. Switch application to MySQL provider
```

### 15.2 Type Conversion Rules

| SQLite Type | MySQL Type | Conversion Logic |
|-------------|-----------|-----------------|
| `String` (currency) | `Decimal(10,2)` | Parse float → format to 2 decimal places |
| `String` (short) | `VARCHAR(191)` | Direct copy |
| `String` (long JSON) | `MEDIUMTEXT` | Direct copy |
| `String` (content) | `TEXT` | Direct copy |
| `Boolean` | `TINYINT(1)` | 0/1 mapping (Prisma handles) |
| `DateTime` | `DATETIME(3)` | ISO string → MySQL datetime |
| `Int` | `INT` | Direct copy |
| `Float` | `DOUBLE` | Direct copy (except currency fields) |

### 15.3 Currency Field Migration

```sql
-- Critical: Convert Float to Decimal(10,2) for financial accuracy
-- SQLite stores: 1999.9999999999998 (float error)
-- MySQL stores: 2000.00 (exact decimal)

UPDATE Transaction
SET amount     = ROUND(amount, 2),
    platformFee = ROUND(platformFee, 2),
    instructorEarning = ROUND(instructorEarning, 2);

UPDATE Course
SET price = ROUND(price, 2),
    overridePrice = ROUND(overridePrice, 2);

UPDATE Payout
SET amount = ROUND(amount, 2),
    taxWithheld = ROUND(taxWithheld, 2),
    grossEarning = ROUND(grossEarning, 2);
```

### 15.4 Text Field Migration

```sql
-- Large JSON fields need MediumText in MySQL
-- SQLite stores all strings uniformly; MySQL differentiates

-- Fields promoted to @db.MediumText (16MB):
--   adminNotes, metadata, rubric, resources, options, answers,
--   evaluationCriteria, infoProvidedData, onboardingChecklist,
--   feedback, expertise, languages, integrations, content,
--   attachments, readBy, variables, tags, planData, generatedContent,
--   learningObjectives, prerequisites, reviewChecklist

-- Fields promoted to @db.Text (64KB):
--   Lesson.content, Assignment.instructions, Submission.content
```

### 15.5 Migration Checklist

```
□ 1.  Export SQLite data (sqlite3 .dump or prisma studio export)
□ 2.  Create MySQL database and user
□ 3.  Set DATABASE_URL_MYSQL in .env
□ 4.  Run: npx prisma db push --schema=prisma/schema_mysql.prisma
□ 5.  Verify all 148 tables created
□ 6.  Run data migration script with type conversions
□ 7.  Verify row counts match (148 tables × N rows)
□ 8.  Verify unique constraints hold
□ 9.  Run application integration tests against MySQL
□ 10. Update db.ts to use MySQL provider
□ 11. Monitor query performance; add missing indexes
□ 12. Enable MySQL-specific optimizations (query cache, innodb_buffer_pool)
```

---

## 16. Schema Statistics

### 16.1 Model Count by Domain

| Domain | Models | % of Total |
|--------|--------|-----------|
| Core Learning | 10 | 6.8% |
| Gamification & Rewards | 10 | 6.8% |
| Progress & Goals | 4 | 2.7% |
| Q&A & Community | 8 | 5.4% |
| Community & Social | 8 | 5.4% |
| Messaging & Notifications | 8 | 5.4% |
| Finance & Revenue | 6 | 4.1% |
| Instructor & Application | 5 | 3.4% |
| AI Configuration | 6 | 4.1% |
| Ask ShijlAI + Student AI | 10 | 6.8% |
| Learning Engine + Assessment + Copilot | 16 | 10.8% |
| Skills & Career | 11 | 7.4% |
| Security & Auth | 7 | 4.7% |
| Admin Platform Config | 12 | 8.1% |
| Cross-Cutting / Misc | 27 | 18.2% |
| **Total** | **148** | **100%** |

### 16.2 Field Statistics (Estimated)

| Metric | Count |
|--------|-------|
| Total models | 148 |
| Total fields (approx.) | ~1,850 |
| Total relation arrays | ~220 |
| Total scalar fields | ~1,630 |
| Fields with `@default` | ~850 |
| Fields with `@unique` | ~25 |
| Composite `@@unique` constraints | ~25 |
| Explicit `@@index` declarations | ~85 |
| Self-relations | 3 (Skill, CareerPath, AIPromptTemplate) |
| One-to-one relations | ~11 |
| Cascade delete relations | ~35 |
| SetNull delete relations | ~8 |

### 16.3 Largest Models by Field Count

| Model | Approx. Fields | Domain |
|-------|---------------|--------|
| User | 49 (19 scalar + 30 relations) | Core |
| PlatformSettings | 48 | Admin Config |
| AppearanceBranding | 68 | Admin Config |
| SecuritySettings | 32 | Security |
| InstructorSettings | 30 | Instructor |
| StudentSettings | 35 | Student |
| AIConfiguration | 40 | AI Config |
| NotificationPreference | 22 | Notifications |
| GamificationSettings | 14 | Gamification |
| Course | 28 (18 scalar + 10 relations) | Core |

### 16.4 JSON Field Usage

| JSON Purpose | Models Using It | Example Fields |
|-------------|----------------|----------------|
| Array of strings | ~30 | tags, learningObjectives, prerequisites, weakTopics, strongTopics |
| Array of objects | ~15 | resources [{title,url,type}], adminNotes [{note,adminName,date}] |
| Complex config | ~20 | rubric [{criteria,description,maxPoints}], metadata, config |
| Event/flag data | ~10 | evidence [{type,url,description}], reminders [{type,value}] |
| AI-generated content | ~10 | generatedContent, structureContent, planData |
| Moderation data | ~5 | reviewChecklist, evaluationCriteria |

### 16.5 Enum-like String Fields

The schema uses `String` with comment-annotated enums rather than Prisma `enum` type (for SQLite compatibility). Key enumerations:

| Field | Values |
|-------|--------|
| User.role | student, instructor, admin, parent |
| User.status | active, suspended, banned, pending_verification |
| User.authProvider | email, google, facebook, apple |
| Course.level | beginner, intermediate, advanced |
| Course.reviewStatus | draft, under_review, approved, rejected, changes_requested, flagged |
| Enrollment.status | active, completed, archived |
| LessonProgress.status | not_started, in_progress, completed |
| Quiz.type | practice, assessment, diagnostic, certification |
| Assignment.type | written, coding, project, peer-review, presentation |
| Question.type | mcq, true_false, fill_blank, short_answer |
| Transaction.type | enrollment, refund, payout, adjustment |
| Transaction.status | pending, completed, failed, refunded |
| Payout.status | pending, processing, completed, failed, cancelled, disputed |
| Dispute.status | open, under_review, resolved_favor_buyer, resolved_favor_seller, escalated, cancelled |
| TopicMastery.status | not_started, weak, learning, strong, mastered |
| UserSkill.level | awareness, beginner, elementary, intermediate, advanced, expert |
| MockInterview.interviewType | technical, behavioral, mixed, viva |
| Notification.priority | normal, high, urgent |
| ActivityLog.severity | info, warning, critical |
| AIProvider.healthStatus | unknown, healthy, degraded, down |
| AIUsageLog.status | success, error, rate_limited, timeout |

---

> **Document End** — ShijlAI Academy Database Design v2.0  
> Maintained in sync with `prisma/schema.prisma` and `prisma/schema_mysql.prisma`
