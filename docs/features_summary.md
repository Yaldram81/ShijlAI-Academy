# ShijlAI Academy — Features Summary

> **Complete Feature Catalog** | Version 2.0 | Last Updated: 2025-03-04
> **Platform**: ShijlAI Academy — AI-Powered E-Learning Platform
> **Authors**: Tanzeel Ur Rahman, Israr Ullah
> **University of Malakand — Department of Computer Science & IT**

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Feature Statistics](#2-feature-statistics)
3. [Public Features (Unauthenticated)](#3-public-features-unauthenticated)
4. [Authentication System](#4-authentication-system)
5. [Student Portal Features](#5-student-portal-features)
6. [Instructor Portal Features](#6-instructor-portal-features)
7. [Admin Portal Features](#7-admin-portal-features)
8. [AI Engine Features (Cross-Portal)](#8-ai-engine-features-cross-portal)
9. [Cross-Portal Features](#9-cross-portal-features)
10. [Gamification System](#10-gamification-system)
11. [Financial System](#11-financial-system)
12. [Community & Social Features](#12-community--social-features)
13. [Security & Compliance](#13-security--compliance)
14. [Platform Configuration](#14-platform-configuration)
15. [Feature Matrix by Role](#15-feature-matrix-by-role)
16. [API Route Summary](#16-api-route-summary)
17. [Component & View Summary](#17-component--view-summary)

---

## 1. Platform Overview

ShijlAI Academy is a full-stack AI-powered e-learning platform built for the Pakistani education market (FSc, O-Levels, A-Levels, IELTS, AWS). The platform serves **three distinct user roles** through dedicated portals, unified under a single-page application architecture.

```
┌──────────────────────────────────────────────────────────────────────┐
│                       ShijlAI Academy Platform                       │
│                                                                      │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐│
│  │  STUDENT       │  │  INSTRUCTOR   │  │  ADMIN                    ││
│  │  PORTAL        │  │  PORTAL       │  │  PORTAL                   ││
│  │               │  │               │  │                           ││
│  │  22 Views     │  │  17 Views     │  │  27 Views                 ││
│  │  8 AI Feats   │  │  14+ AI Feats │  │  6 AI Feats               ││
│  │  30+ APIs     │  │  68+ APIs     │  │  60+ APIs                 ││
│  │  18 Nav Items │  │  15 Nav Items │  │  22 Nav Items             ││
│  └───────────────┘  └───────────────┘  └───────────────────────────┘│
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │              SHARED INFRASTRUCTURE                                ││
│  │  • 7-Service Learning Engine  • 148 Prisma Models                ││
│  │  • 57 AI API Endpoints        • 84 Lazy-Loaded Views            ││
│  │  • 45 shadcn/ui Components    • z-ai-web-dev-sdk (LLM)          ││
│  │  • 200+ Total API Routes      • Zustand + TanStack Query        ││
│  └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

**Target Market**: Pakistani students (FSc, O-Levels, A-Levels, IELTS, AWS certifications)

**Key Differentiators**:
- **36 AI features** across all portals — the most AI-integrated LMS in the market
- **Adaptive Learning Engine** with 7 interconnected services for personalized education
- **PKR-denominated** financial system with Pakistani payment methods (JazzCash, EasyPaisa)
- **International curriculum alignment** (IB, AP, Cambridge, Common Core)
- **Bilingual support** (English / Urdu)

---

## 2. Feature Statistics

### 2.1 Overall Platform Metrics

| Metric | Count |
|--------|-------|
| Total Prisma Models | 148 |
| Total API Routes | 200+ |
| Total Lazy-Loaded Views | 84 |
| Total shadcn/ui Components | 45 |
| AI API Endpoints | 57 |
| AI Features | 36 |
| Learning Engine Services | 7 |
| TypeScript Type Definitions | 673 lines |
| Blog Articles (Static) | 8 |
| Email Templates | 9 |
| Shell Scripts (Deployment) | 5 |

### 2.2 Feature Count by Portal

| Portal | Views | AI Features | API Endpoints | Navigation Items | Components |
|--------|-------|-------------|---------------|------------------|------------|
| **Student** | 22 | 8 | 30+ | 18 | 15+ |
| **Instructor** | 17 | 14+ | 68+ | 15 | 20+ |
| **Admin** | 27 | 6 | 60+ | 22 | 33+ |
| **Public** | 8 | 0 | 7 | 5 | 5 |
| **Cross-Portal** | 6 | 1 | 10+ | — | — |
| **Total** | **84** | **36** | **200+** | — | **100+** |

### 2.3 AI Feature Distribution

| Category | Features | LLM Calls | Models Used |
|----------|----------|-----------|-------------|
| Student AI | 8 | 15 endpoints | z-ai-web-dev-sdk (default) |
| Instructor AI | 14+ | 26 endpoints | z-ai-web-dev-sdk (direct import) |
| Admin AI | 6 | 15 endpoints | z-ai-web-dev-sdk (dynamic import) |
| Learning Engine | 7 services | 2 endpoints | Algorithmic + LLM hybrid |
| **Total** | **36** | **57** | — |

---

## 3. Public Features (Unauthenticated)

These features are accessible without login through the **Public Shell** (full-screen layout with PublicBottomBar on mobile).

### 3.1 Landing Page

| Feature | Description |
|---------|-------------|
| Hero Banner | Platform introduction with CTA buttons |
| Trending Courses Row | Carousel of most popular courses (`CourseCarouselRow`) |
| Recommended For You Row | AI-recommended course carousel |
| Feature Highlights | Platform capabilities showcase |
| Testimonials | Student success stories |
| Statistics | Platform-wide metrics (students, courses, instructors) |
| Footer | Sticky footer with links and branding |

### 3.2 Public Course Catalog

| Feature | Description |
|---------|-------------|
| Course Grid | Paginated course listing with thumbnails |
| Category Filters | Filter by FSc, O-Levels, A-Levels, etc. |
| Level Filters | Beginner, Intermediate, Advanced |
| Search | Text-based course search |
| Sorting | By rating, enrollment, price, newest |

### 3.3 Public Course Detail

| Feature | Description |
|---------|-------------|
| Course Overview | Title, description, instructor, rating, enrollment count |
| Curriculum Preview | Module/lesson structure (free lessons accessible) |
| Reviews | Student review list with ratings |
| Instructor Profile | Linked instructor bio and stats |
| Price & Enroll CTA | Course price in PKR with enrollment button |
| Related Courses | Similar course recommendations |

### 3.4 Other Public Pages

| Page | Description |
|------|-------------|
| **Pricing** | Course pricing tiers and payment methods |
| **Instructors** | Public instructor directory with profiles |
| **About** | Platform mission, team, and history |
| **Blog** | 8 static articles on education topics |
| **Blog Detail** | Individual article view with related posts |
| **Application Status** | Instructor application status tracker |

---

## 4. Authentication System

### 4.1 Auth Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   REGISTER   │────▶│  VERIFY OTP │────▶│   LOGIN     │────▶│  DASHBOARD   │
│  (Email,     │     │  (6-digit   │     │  (Email +   │     │  (Role-based │
│   Name,      │     │   OTP code) │     │   Password) │     │   redirect)  │
│   Password,  │     └─────────────┘     └─────────────┘     └──────────────┘
│   Role)      │           │                     │
└─────────────┘           │                     │
                          ▼                     ▼
                   ┌──────────────┐     ┌──────────────┐
                   │  RESEND OTP  │     │  FORGOT      │
                   │              │     │  PASSWORD     │
                   └──────────────┘     └──────┬───────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │  RESET        │
                                        │  PASSWORD     │
                                        └──────────────┘
```

### 4.2 Auth Features

| Feature | Description |
|---------|-------------|
| Email/Password Registration | With role selection (student/instructor) |
| OTP Verification | 6-digit code sent to email with expiry |
| Login | Email + password with brute-force protection |
| Social Auth | Google, Facebook, Apple OAuth support |
| Forgot Password | Reset token generation with email link |
| Reset Password | Token-verified password reset |
| Demo Login | Quick role-based demo access (student/instructor/admin) |
| MFA Support | TOTP-based multi-factor authentication (DB-ready) |
| Account Locking | Auto-lock after failed login attempts |

### 4.3 Auth Security

| Security Feature | Implementation |
|-----------------|----------------|
| Password Hashing | `passwordHash` field (bcrypt-style) |
| OTP Expiry | `otpExpiresAt` timestamp |
| Reset Token Expiry | `resetTokenExpiresAt` timestamp |
| Login Attempt Tracking | `loginAttempts` counter + `lockedUntil` timestamp |
| Session Management | `UserSession` model with device/IP tracking |
| Auth Provider | `authProvider` field (email/google/facebook/apple) |

### 4.4 Auth API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Create new account |
| `/api/auth/verify-otp` | POST | Verify email OTP |
| `/api/auth/login` | POST | Authenticate user |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset with token |
| `/api/auth/social` | POST | OAuth authentication |
| `/api/auth/demo-login` | POST | Quick demo access |

---

## 5. Student Portal Features

### 5.1 Dashboard

| Feature | Description |
|---------|-------------|
| Welcome Card | Personalized greeting with name |
| Stats Cards | XP, Level, ShijlCoins, Streak (with count-up animations) |
| Continue Learning | Carousel of enrolled courses with progress bars |
| Learning Activity | 7-day activity heatmap |
| AI Recommendations | Personalized course recommendations |
| Quick Actions | One-click access to Ask ShijlAI, My Skills, Schedule |
| Daily Activity | XP earned, lessons completed, quizzes taken |

### 5.2 Course Management

| Feature | Description |
|---------|-------------|
| My Learning | Enrolled courses grid with progress indicators |
| Course Detail | Full course info with module/lesson navigation |
| Course Player | Immersive full-screen lesson viewer |
| Lesson Progress | Per-lesson tracking (not_started/in_progress/completed) |
| Lesson Notes | Per-lesson note-taking |
| Lesson Bookmarks | Bookmark specific lessons for quick access |
| Video Playback | Video lesson streaming with transcript |
| Content Viewing | Text, interactive, and download content types |
| Free Preview | Access to marked-free lessons without enrollment |

### 5.3 Ask ShijlAI — 6-Mode AI Tutor

The **flagship AI feature** — a multi-mode conversational AI tutor that adapts behavior based on mode and student context.

| Mode | Purpose | Output Style |
|------|---------|-------------|
| **Tutor** | Socratic learning guidance | Warm, conversational, no structured plans |
| **Quiz** | Generate practice questions | Structured Q&A with options and explanations |
| **Assignment** | Step-by-step assignment help | Numbered steps with time estimates |
| **Study Planner** | Create study schedules | Day-by-day plan with emoji task indicators |
| **Career Advisor** | Career guidance | Phase-based roadmaps with timeframes |
| **Companion** | Proactive learning mentor | Warm, caring, data-driven observations |

**Key Capabilities**:
- **Context Engineering**: 9-layer system prompt construction with student profile, weak topics, course structure, conversation summaries, and adaptive behavior
- **Adaptive Behavior**: Extra encouragement for high drop-risk students, interactive prompts for low engagement, daily habit encouragement for low consistency
- **Quick Actions**: Explain Simpler, More Examples, Test Me, Translate (to Urdu)
- **Session Management**: Auto-create/update sessions, archive old sessions, limit 50 active
- **Conversation Summaries**: Auto-generate after 20 messages to prevent token overflow
- **XP Rewards**: +3 XP per AI interaction
- **Learning Event Logging**: Every interaction logged to Learning Engine

### 5.4 AI Learning Companion

A **proactive guidance system** that anticipates student needs and initiates helpful interactions.

| Feature | Description |
|---------|-------------|
| Today's Focus | Priority-sorted focus topics (weak topics + exam-linked) |
| Proactive Insights | 5 rule-based insight rules (inactivity, weak topics, missed plans, exams, achievements) |
| Suggested Actions | Actionable next steps with XP rewards |
| Companion Chat | LLM-powered personalized conversations using full student context |
| Stats Dashboard | Streak, mastery average, weekly progress, insight count |
| 3 Personality Modes | Coach (motivational), Mentor (patient), Advisor (analytical) |
| Graceful Degradation | Always returns data — even on error or empty DB |

### 5.5 AI Mock Interview

| Feature | Description |
|---------|-------------|
| 4 Interview Domains | Python, Machine Learning, Web Development, Data Science |
| 3 Difficulty Levels | Beginner, Intermediate, Advanced |
| 4 Interview Types | Technical, Behavioral, Mixed, Viva |
| LLM-Generated Questions | AI-generated questions per domain/difficulty |
| AI Answer Evaluation | 0-100 score with feedback, improvements, key points |
| Heuristic Fallback | Keyword-matching evaluation when LLM fails |
| Interview History | Past interview records and statistics |
| 4-Phase UX | Dashboard → Setup → Interview → Report |

### 5.6 AI Study Planner

| Feature | Description |
|---------|-------------|
| Algorithmic Planning | Phase-based task generation (Early/Middle/Late) |
| Topic Weight Allocation | 40% weak, 30% moderate, 15% strong, 15% review |
| AI Enhancement | Optional LLM-generated tips and focus areas |
| Daily Hours Configuration | 0.5-16 hours per day |
| Exam Countdown | Days-until-exam awareness |
| Task Status Tracking | pending → in_progress → completed/skipped |
| Review Days | Every 3rd day is review-only |
| Plan Abandonment | Delete/abandon plans |

### 5.7 AI Learning Paths

| Feature | Description |
|---------|-------------|
| Course Learning Path | Module-by-module progression within enrolled course |
| Career Learning Path | Multi-course roadmap toward career goal |
| 4 Career Paths | Data Scientist, ML Engineer, Web Developer, Cybersecurity Analyst |
| Node Status Logic | locked → started → in_progress → completed (based on mastery) |
| Visual Graph | Interactive path visualization |

### 5.8 ShijlAI Hub

| Feature | Description |
|---------|-------------|
| AI Tools Grid | Cards for each AI tool with navigation |
| Learning Summary | AI-generated overview of student's learning state |
| Quick Insights | Top 3 AI-generated insights |
| Recent AI Activity | Timeline of AI interactions |
| Skill Overview | Mini skill graph with mastery levels |
| Recommended Actions | AI-suggested next steps |

### 5.9 Skill Graph & Mastery

| Feature | Description |
|---------|-------------|
| Interactive Skill Graph | Tree visualization with color-coded mastery |
| Topic Mastery Tracking | Weighted formula: quiz(50%) + assignment(25%) + practice(15%) + completion(10%) |
| 5 Mastery Statuses | Not Started (0-25%), Weak (25-50%), Learning (50-75%), Strong (75-90%), Mastered (90-100%) |
| Time Decay | 0.5%/day decay after 7 days of inactivity (Ebbinghaus curve) |
| Trend Detection | Improving/Stable/Declining based on ±2% change |
| Skill Mastery Aggregation | Weighted average of topic scores via SkillTopicMapping |
| 15 Predefined Skills | Auto-seeded if no data exists |
| Mastery Insights | Rule-based insights (celebration, alerts, concentration warnings) |

### 5.10 AI-Powered Recommendations

| Feature | Description |
|---------|-------------|
| 4-Step Pipeline | Identify weak areas → Map prerequisites → Apply rules → Score & prioritize |
| 6 Recommendation Rules | Very weak, weak, incomplete, strong→advance, high/medium drop risk |
| Priority Scoring | weakness(40%) + careerRelevance(20%) + engagementMatch(20%) + recencyNeed(20%) |
| 5 Recommendation Types | topic, quiz, lesson, course, study_plan |

### 5.11 Quiz System

| Feature | Description |
|---------|-------------|
| Multiple Quiz Types | Practice, Assessment, Diagnostic, Certification |
| Question Types | MCQ, True/False, Fill-in-blank, Short Answer |
| Timed Quizzes | Configurable time limit per quiz |
| Max Attempts | Configurable (0 = unlimited) |
| Auto-Grading | Instant scoring with answer explanations |
| Pass/Fail | Configurable passing score (default 70%) |
| XP Rewards | XP earned based on quiz performance |

### 5.12 Assignment System

| Feature | Description |
|---------|-------------|
| Assignment Types | Written, Coding, Project, Peer-Review, Presentation |
| Submission Types | Text, File, URL, Multiple |
| Due Dates | Configurable deadlines |
| Rubrics | JSON-based grading criteria |
| Resources | Attached reference materials |
| Word Limits | Optional word count constraints |

### 5.13 Community Features

| Feature | Description |
|---------|-------------|
| Course Q&A | Per-lesson question posting with AI draft answers |
| Discussion Forums | Course-level discussion posts with replies |
| Upvoting | Upvote questions and replies |
| Study Groups | Create/join study groups with messaging and resources |
| Community Events | Create/attend community events |
| Peer Reviews | Review and rate peer assignments |
| Leaderboards | XP-based and mastery-based rankings |
| Discussion Bookmarks | Save important discussions |

### 5.14 Messaging System

| Feature | Description |
|---------|-------------|
| Conversation-Based | Direct messaging with conversation threads |
| Contacts List | All enrolled course instructors |
| Real-Time | Auto-refresh every 30 seconds |
| Message History | Full conversation history |
| AI Reply Suggestions | LLM-suggested responses for instructors |

### 5.15 Certificates

| Feature | Description |
|---------|-------------|
| Auto-Issuance | Certificate on course completion (if enabled) |
| Verification Hash | Unique hash for certificate validation |
| Verification Page | Public certificate verification |
| Download | Download certificate as document |
| In-Progress Tracking | Show near-completion courses with estimated time |

### 5.16 Progress & Achievements

| Feature | Description |
|---------|-------------|
| Activity Heatmap | GitHub-style 7-day learning activity visualization |
| XP System | XP earned from lessons, quizzes, AI interactions |
| Level System | Level progression based on XP thresholds |
| Badge Collection | Learning, Streak, Social, Achievement badge categories |
| Streak Tracking | Daily streak with freeze support |
| Learning Goals | Custom weekly/monthly goals |
| Daily Challenges | Rotating daily tasks with XP/coin rewards |
| XP Activity Log | Detailed XP earning history |

### 5.17 Schedule

| Feature | Description |
|---------|-------------|
| Calendar View | Monthly calendar with events |
| Live Sessions | Scheduled live session attendance |
| Study Plan Tasks | Integrated with AI Study Planner |
| Due Date Reminders | Assignment and quiz due dates |

### 5.18 Student Profile & Settings

| Feature | Description |
|---------|-------------|
| Profile View | Avatar, bio, stats, enrollment summary |
| Profile Editing | Update name, bio, avatar |
| Language Preference | English / Urdu toggle |
| Notification Preferences | Per-category notification toggles |
| Account Settings | Password change, email update |
| Privacy Settings | Profile visibility controls |

---

## 6. Instructor Portal Features

### 6.1 Dashboard

| Feature | Description |
|---------|-------------|
| Welcome Card | Personalized greeting with time-of-day awareness |
| 6 Stat Cards | Students, Revenue, Rating, Completion, Courses, Engagement |
| Enrollment Trend | Daily enrollment counts (7d/30d/90d AreaChart) |
| Revenue by Day | Cumulative revenue with per-course stacking |
| Course Performance | Per-course stats table (sortable) |
| Student Distribution | Excellent/Good/Average/Needs Improvement breakdown |
| Top Students | Ranked by XP with medals |
| Content Pipeline | Draft/Review/Published/Archived counts |
| Action Required | Ungraded submissions, unanswered questions |
| Engagement Heatmap | 7×24 grid (day × hour) |
| Financial Summary | Revenue, payouts, commission, pending |
| Comparison Banner | Instructor vs platform averages |
| Period Selector | 7d/30d/90d/all time ranges |

### 6.2 Course Management

| Feature | Description |
|---------|-------------|
| Course List | Grid/list/kanban view of instructor's courses |
| Course Detail | Full course info with management tabs |
| Course Creator | 6-step wizard (Basics → Curriculum → Content → Pricing → SEO → Review) |
| Module Management | Create, reorder, delete modules |
| Lesson Management | Create, edit, delete lessons with rich content |
| Content Sync | Sync course content updates |
| Course Duplication | Clone existing courses |
| Archive/Restore | Archive old courses |
| Bulk Actions | Bulk status changes |
| Draft/Publish | Course publishing workflow |

### 6.3 AI Copilot — 11 AI Teaching Tools

The **flagship AI feature** of the Instructor Portal — a suite of 11 specialized AI tools.

| # | Tool | Purpose | AI Output |
|---|------|---------|-----------|
| 1 | **Course Outline Generator** | Full curriculum with modules + lessons | JSON: modules → objectives → lessons |
| 2 | **Learning Outcome Generator** | Bloom's Taxonomy-aligned outcomes | JSON: outcomes with bloom levels |
| 3 | **Lesson Content Generator** | Rich lesson with exercises | JSON: concepts, examples, exercises |
| 4 | **Quiz Generator** | MCQ, True/False, Fill-in questions | JSON: questions with types |
| 5 | **Assignment + Rubric Builder** | Assignment brief + grading rubric | JSON: objectives, deliverables, rubric |
| 6 | **Rubric Generator** | Standalone grading rubric | JSON: weighted criteria with levels |
| 7 | **Course Description Writer** | SEO-optimized copy | JSON: seoTitle, keywords, outcomes |
| 8 | **Auto Caption & Translate** | Timestamped captions | Text: [MM:SS] format, 10 languages |
| 9 | **Q&A Auto-Responder** | Draft answers to student questions | JSON: answer, keyPoints, confidence |
| 10 | **Student Feedback Analyzer** | Sentiment analysis of reviews | JSON: praise, issues, sentiment, tips |
| 11 | **Course Improvement Insights** | Data-driven recommendations | JSON: insights, score, quick wins |

**Copilot Backend Architecture**:
- 9 action dispatch handlers via `POST /api/instructor/copilot`
- Review & Approve workflow: `generated → reviewed → approved/rejected`
- Activity logging to `InstructorAIActivity` for every action
- JSON parsing with markdown fence stripping

### 6.4 AI Assistant Chat

| Feature | Description |
|---------|-------------|
| General-Purpose Chat | Conversational AI for course management questions |
| 6 Specializations | Course management, student engagement, content creation, teaching strategies, platform features, analytics interpretation |
| Chat History | Persistent via `AIAssistantMessage` model |
| International Context | IB, AP, Cambridge, Common Core awareness |

### 6.5 AI Generations & Templates

| Feature | Description |
|---------|-------------|
| Generation History | View all AI-generated content |
| Template Library | Save and reuse AI generation templates |
| Usage Statistics | Track AI usage counts and types |

### 6.6 Smart Assessment

| Feature | Description |
|---------|-------------|
| Question Analytics | Difficulty, discrimination, response distribution |
| Distractor Analysis | MCQ option effectiveness tracking |
| Learning Outcome Mastery | Per-outcome mastery tracking across students |
| Assessment Quality Scores | Automated quality assessment |
| AI Assessment Insights | LLM-generated insights (dual perspective: student + instructor) |
| Outcome-Question Linking | Map questions to specific learning outcomes |

### 6.7 Intelligent Analytics

| Feature | Description |
|---------|-------------|
| Difficult Lesson Detection | Identify lessons with low completion rates |
| Student Struggle Areas | Pinpoint topics where students fail |
| Module Drop Analysis | Find where students abandon courses |
| LLM-Generated Insights | AI-suggested improvement strategies |
| Engagement Heatmap | 7×24 student activity grid |
| Comparison Analytics | Instructor vs platform average benchmarks |

### 6.8 Student Management

| Feature | Description |
|---------|-------------|
| Student Roster | Table/grid/card views of enrolled students |
| Student Detail | Individual progress, submissions, quiz scores |
| Notes on Students | Instructor notes per student |
| Export Student Data | CSV export of student information |

### 6.9 Q&A Management

| Feature | Description |
|---------|-------------|
| Unanswered Questions | Priority queue of student questions |
| AI Draft Answers | LLM-generated answer suggestions |
| Reply Management | Post and manage answers |

### 6.10 Messaging with AI Reply Suggestions

| Feature | Description |
|---------|-------------|
| Student Conversations | Direct messaging with enrolled students |
| AI Suggest Reply | LLM-generated reply suggestions (DeepSeek-V3 model) |
| Auto-Respond | AI-generated answers to common questions |
| Contact List | All enrolled students |

### 6.11 Revenue & Finance

| Feature | Description |
|---------|-------------|
| Revenue Dashboard | Earnings overview with period selection |
| Payout Tracking | Payout history and status |
| Revenue by Course | Per-course earnings breakdown |
| Export Reports | CSV export of financial data |
| Payout Methods | Configure JazzCash, EasyPaisa, bank transfer, Payoneer |
| Financial Settings | Commission rates, payout schedule preferences |
| Refund Management | View and process refund requests |

### 6.12 Schedule Management

| Feature | Description |
|---------|-------------|
| Calendar View | Monthly/weekly schedule |
| Live Sessions | Schedule and manage live sessions |
| Event Management | Create and edit schedule events |

### 6.13 Marketing Tools

| Feature | Description |
|---------|-------------|
| Promotional Tools | Course promotion features |
| Coupon Management | Create discount coupons |
| Student Outreach | Communication tools |

### 6.14 Profile & Settings

| Feature | Description |
|---------|-------------|
| Professional Profile | Bio, headline, expertise, avatar |
| AI Bio Improvement | LLM-enhanced professional bio |
| Account Settings | Password, email, notifications |
| Session Management | Active session tracking |
| Avatar Upload | Profile image management |

---

## 7. Admin Portal Features

### 7.1 Dashboard

| Feature | Description |
|---------|-------------|
| 6 Stat Cards | Students, Revenue, Courses, Rating, Completion, Engagement |
| Urgent Items | Awaiting review, refunds, flagged, security alerts |
| Platform Pulse | Real-time: online users, watching, quizzing, AI tutor usage |
| Revenue & Enrollment Chart | 6-month trend visualization |
| Top Courses | By enrollment count |
| Top Instructors | By revenue |
| User Growth Chart | Registration trends |
| Recent Activity | Last 10 platform events |
| User Distribution | By role (students/instructors/admins/parents) |
| Category Distribution | Courses + enrollments per category |
| Recent Signups | Last 5 new users |
| Revenue Breakdown | By source (sales, subscriptions, fees, certifications) |
| System Health | Uptime, DB query time, status |
| AI Usage Stats | Tutor sessions, generations, chat messages |
| Feature Flags | Toggle platform features |
| Announcements Manager | Platform-wide announcements |
| Instructor Applications | Last 20 pending |
| Multi-Currency | USD, EUR, GBP, AED, PKR |

### 7.2 AI Admin Copilot — Decision Intelligence

A **conversational decision intelligence** system with 3-module pipeline.

| Module | Description |
|--------|-------------|
| **Intent Detection** | 9-intent keyword-based NLP classifier |
| **Data Retrieval** | 8 fetcher functions with DB queries and demo fallbacks |
| **LLM Reasoning** | z-ai-web-dev-sdk analysis with rule-based fallback |

**9 Classified Intents**:

| Intent | Keywords | Data Fetcher |
|--------|----------|-------------|
| `course_analysis` | course, curriculum, content | `fetchCourseAnalysisData()` |
| `instructor_analysis` | instructor, teacher | `fetchInstructorAnalysisData()` |
| `student_analysis` | student, learner | `fetchStudentAnalysisData()` |
| `engagement_analysis` | engagement, participation | `fetchEngagementData()` |
| `enrollment_analysis` | enrollment, registration | `fetchEnrollmentData()` |
| `risk_analysis` | risk, danger, critical | `fetchRiskAnalysisData()` |
| `report_generation` | report, statistics | `fetchPlatformOverview()` |
| `search` | find, search, who | `fetchSearchData(query)` |
| `platform_overview` | platform, overall | `fetchPlatformOverview()` |

**UI Features**: Chat interface, suggested questions, quick action chips, recent insights, critical alerts, intent color coding.

### 7.3 AI System Intelligence — 5 Intelligence Engines

| Engine | Purpose | Key Metrics |
|--------|---------|-------------|
| **Platform Health** | Core platform vitality | DAU, WAU, MAU, session duration, completion rate, retention |
| **Engagement Intelligence** | Per-course engagement | Login/Activity/Quiz/AI/Community sub-scores (total 100) |
| **Course Intelligence** | Course health scoring | Health formula: enrollment(25%) + completion(25%) + rating(20%) + engagement(15%) + assessment(15%) |
| **Instructor Intelligence** | Instructor effectiveness | Effectiveness: completion(30%) + ratings(25%) + success(25%) + engagement(20%) |
| **Alert & Anomaly** | Proactive issue detection | 8 alert rules (enrollment drop, completion decrease, slow response, etc.) |

**Additional Features**:
- Rule-based insights across 5 categories
- LLM-generated executive analysis (max 200 words)
- Alert center with Critical/Warning/Info severity levels
- Course health score rings (SVG, color-coded)
- Instructor effectiveness rankings

### 7.4 ShijlAI Hub — AI Report Generator & Course Quality Analyzer

#### AI Report Generator

| Feature | Description |
|---------|-------------|
| 5 Report Types | Platform Performance, Course Performance, Instructor Performance, Student Engagement, AI Usage |
| 3 Report Periods | Weekly, Monthly, Quarterly |
| LLM Executive Summary | AI-generated summary with insights, risks, recommendations |
| Real Metrics | 5 computation functions pulling from live DB |
| Report History | List of generated reports with status |
| Report Detail Dialog | Full report view with all sections |

#### Course Quality Analyzer

| Feature | Description |
|---------|-------------|
| 5 Quality Dimensions | Structure (25%), Assessment (25%), Student Success (20%), Engagement (15%), Content (15%) |
| AI Content Scoring | LLM rates course content 0-100 on clarity, alignment, coverage, coherence |
| Quality Categories | Excellent (≥90), Good (≥75), Needs Improvement (≥60), Critical (<60) |
| Analysis Reports | Strengths, weaknesses, recommendations |
| Course Health Dashboard | Visual quality cards with score rings |
| Quality Distribution | Overview of course quality across platform |

### 7.5 Intelligent Analytics (Admin)

| Feature | Description |
|---------|-------------|
| AI Insights Tab | Risk alerts, growth signals, opportunities, achievements |
| Statistics Tab | User growth, enrollment trends, revenue charts, category distribution |
| 4 Insight Types | Growth (emerald), Risk (rose), Opportunity (amber), Achievement (violet) |
| Chart Library | Recharts-based line, bar, pie, and radar charts |

### 7.6 User Management

| Feature | Description |
|---------|-------------|
| User Table | Filtered by role, status, auth provider, MFA, date range |
| Bulk Actions | Suspend, verify, delete, export, notify |
| Add User Dialog | Create new user with role assignment |
| Row Actions | Edit, suspend, verify, delete, view detail |
| Search | Name, email, ID search |
| Pagination | Full pagination with page size selector |
| User Detail View | 4 tabs: Overview, Enrollments, Activity, Notes |
| Export Users | CSV export of user data |

### 7.7 Instructor Management & Applications

| Feature | Description |
|---------|-------------|
| All Instructors Tab | Full list with stats and badges |
| Applications Tab | New instructor application queue |
| Flagged Tab | Instructors flagged for review |
| Application Workflow | Submit → Pending → Under Review → Approve/Reject/Request Info |
| Instructor Detail View | Full profile with courses, earnings, performance |
| NTN Verification | National Tax Number verification for Pakistani instructors |
| Bulk Actions | Bulk approve, reject, export |
| Export | CSV export of instructor data |

### 7.8 Course Management & Review

| Feature | Description |
|---------|-------------|
| Course Table | All courses with filters and search |
| Course Detail Panel | 6 tabs: Overview, Content, Overrides, Notes, Quality, Reviews |
| Course Review | AI-assisted review with checklist |
| AI Analysis | LLM-generated course analysis |
| Bulk Review | Mass approve/reject/flag actions |
| Price Overrides | Admin price override with expiry |
| Flagging | Flag courses for content issues |
| Export | CSV export of course data |

### 7.9 Revenue & Finance with AI Forecasting

| Feature | Description |
|---------|-------------|
| Overview Tab | 6 stat cards, category/payment charts, forecast |
| Transactions Tab | Transaction table with detail sheet |
| Revenue Split Tab | Per-instructor revenue breakdown |
| Refunds Tab | Refund management with resolution workflow |
| Forecast Tab | AI-powered revenue projection (linear regression) |
| Settings Tab | Commission rates, payout schedule |
| Revenue Forecasting | Linear regression on historical data with confidence levels |
| Multi-Currency | PKR, USD, EUR, GBP, AED |
| Tax Reports | FBR-compliant tax reporting |
| Dispute Management | Full dispute resolution workflow |

### 7.10 AI Configuration

| Feature | Description |
|---------|-------------|
| AI Providers | Add/edit/disable LLM providers |
| AI Models | Configure models per provider (with enable/disable) |
| Prompt Templates | Create/edit/delete system prompt templates |
| Usage Logs | Track AI usage per feature per provider |
| Audit Log | Every AI configuration change logged |
| Seed Data | Demo data generation for AI config |

### 7.11 Gamification Management

| Feature | Description |
|---------|-------------|
| Challenges | Create/edit daily challenges |
| Badges | Badge creation and award management |
| Levels | Configure XP thresholds per level |
| XP Rules | Define XP rewards per action type |
| Events | Track gamification events |
| Leaderboard | View global leaderboard |
| Streak Rewards | Configure streak milestone rewards |
| Reward Shop | Manage purchasable rewards |
| Settings | Global gamification toggles |
| Bulk Actions | Mass award badges, reset XP |

### 7.12 Security Center

| Feature | Description |
|---------|-------------|
| API Key Management | Create/revoke API keys |
| Role Management | Define security roles with permissions |
| IP Blocking | Block/unblock suspicious IP addresses |
| Session Management | View/terminate active user sessions |
| Login Alerts | Configure and view login anomaly alerts |
| Security Events | Full security event log |
| Security Settings | Global security configuration |
| Seed Demo Data | Generate test security data |

### 7.13 Notifications & Appearance

| Feature | Description |
|---------|-------------|
| Notification Templates | Create/edit notification templates |
| Notification History | View all sent notifications |
| Notification Settings | Configure per-type notification preferences |
| Send Notifications | Manual notification dispatch |
| Appearance Branding | Logo, colors, favicon configuration |
| Theme Presets | Pre-built theme configurations |
| Appearance History | Track appearance changes |

### 7.14 Platform Settings & Dev Tools

| Feature | Description |
|---------|-------------|
| Platform Settings | Global platform configuration |
| Payment Methods | Configure payment providers |
| Legal Pages | Terms, privacy policy, refund policy editor |
| Integrations | Third-party service configuration |
| Webhooks | Webhook endpoint management |
| Feature Flags | Toggle platform features on/off |
| Announcements | Platform-wide announcement management |
| Audit Log | Complete admin action audit trail |
| Dev Tools | Debugging and testing utilities |
| Content Moderation | Review and moderate user content |
| Blog Management | CRUD for platform blog posts |

---

## 8. AI Engine Features (Cross-Portal)

### 8.1 Adaptive Learning Engine (7 Services)

The data backbone of all student-facing AI features — a pipeline of 7 services that transform raw learning events into personalized intelligence.

```
Event Service → Feature Engine → Profile Service → Mastery Service
                      ↓                                     ↓
              Recommendation Engine  ←─────────── Study Planner Service
```

#### Service 1: Event Service

| Feature | Description |
|---------|-------------|
| Single Entry Point | All learning actions flow through `logEvent()` |
| Score Delta Computation | 5 event types with weighted deltas |
| Non-Blocking | Downstream updates don't block the response |
| Event Type Counts | API endpoint for event statistics |

**Score Delta Table**:

| Event Type | Delta | Rationale |
|-----------|-------|-----------|
| `quiz_attempted` | `value × 0.3` | 30% of quiz score |
| `lesson_completed` | `+15` | Fixed bonus |
| `assignment_submitted` | `value × 0.25` | 25% of score |
| `video_watched` | `+5` | Small bonus |
| `ai_tutor_used` | `+3` | Small bonus |

#### Service 2: Feature Engine

| Feature | Formula | Scale |
|---------|---------|-------|
| Learning Speed | `(completedLessons / hoursSpent) × 10` | 0-100 |
| Engagement Score | `logins×5 + hours×4 + quizzes×2 + ai×1.5 + lessons×0.5` | 0-100 |
| Consistency Score | `(activeDays / totalDays) × 100` with streak penalty | 0-100 |
| Average Performance | Mean of all quiz + assignment scores | 0-100 |
| Drop Risk | `lowEngagement×0.30 + lowConsistency×0.30 + declining×0.20 + inactivity×0.20` | 0-100 |

#### Service 3: Profile Service

| Feature | Description |
|---------|-------------|
| 5-Metric Aggregation | Runs all Feature Engine computations in parallel |
| Time Decay Application | Applies mastery decay to stale topics |
| Weak/Strong Topic Identification | Weak (<50%), Strong (>75%) |
| Learning Level Classification | Beginner/Intermediate/Advanced |
| Learning Speed Classification | Slow/Moderate/Fast |
| 5-Minute Throttle | Prevents excessive recomputation |
| Upsert Pattern | Create or update student profile |

#### Service 4: Mastery Service

| Feature | Description |
|---------|-------------|
| Weighted Formula | quiz(50%) + assignment(25%) + practice(15%) + completion(10%) |
| Time Decay | 0.5%/day after 7 days of inactivity |
| Trend Detection | ±2% threshold for improving/declining/stable |
| Skill Mastery | Weighted average via SkillTopicMapping |
| Mastery Insights | 5 rule-based insight types |

#### Service 5: Recommendation Engine

| Feature | Description |
|---------|-------------|
| 4-Step Pipeline | Weak areas → Prerequisites → Rules → Priority scoring |
| 6 Rules | Very weak, weak, incomplete, strong→advance, high/medium drop risk |
| Priority Formula | weakness(40%) + career(20%) + engagement(20%) + recency(20%) |
| 5 Recommendation Types | topic, quiz, lesson, course, study_plan |

#### Service 6: Study Planner Service

| Feature | Description |
|---------|-------------|
| Phase-Based Tasks | Early (study+quiz), Middle (practice+quiz), Late (revision+mock_exam) |
| Topic Weight Allocation | 40% weak, 30% moderate, 15% strong, 15% review |
| Review Days | Every 3rd day |
| Daily Task Scaling | 1-4 tasks based on daily hours |
| AI Enhancement | Optional LLM tips and focus areas |

#### Service 7: Index Service

Aggregates all services for unified import/export.

### 8.2 LLM Integration Patterns

| Pattern | Usage | SDK Import |
|---------|-------|------------|
| Dynamic Import | Student & Admin routes | `(await import('z-ai-web-dev-sdk')).default` |
| Direct Import | Instructor routes | `import ZAI from 'z-ai-web-dev-sdk'` |
| Model Selection | Instructor suggest-reply | `model: 'deepseek-ai/DeepSeek-V3'` |

**Common LLM Call Pattern**:
```typescript
const zai = await ZAI.create()
const completion = await zai.chat.completions.create({
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ],
  thinking: { type: 'disabled' },
})
```

### 8.3 System Prompt Architecture

```
Layer 1: Mode-specific base prompt
Layer 2: Student profile metrics (level, engagement, drop risk)
Layer 3: Adaptive context (high drop risk → extra encouragement)
Layer 4: Low engagement context (< 30 → make interactive)
Layer 5: Low consistency context (< 30 → encourage daily habits)
Layer 6: Weak topic mastery details
Layer 7: Current course structure
Layer 8: Previous conversation summary
Layer 9: Quick action context
```

### 8.4 JSON Response Parsing (4-Layer Strategy)

```
1. Trim whitespace
2. Strip markdown code fences (```json ... ```)
3. JSON.parse()
4. Validate structure / fallback to raw text
```

### 8.5 Intelligent Analytics Engine (Cross-Portal)

Shared analytics engine with **role-based rules**:

| Role | Categories | Example Insights |
|------|-----------|------------------|
| **Student** | 12 categories | Topic mastery trends, study time analysis, quiz performance |
| **Instructor** | 8 categories | Course health, student engagement, content effectiveness |
| **Admin** | 6 categories | Platform growth, revenue trends, system health |

---

## 9. Cross-Portal Features

### 9.1 Notification System

| Feature | Description |
|---------|-------------|
| Notification Center | Unified notification list per user |
| Notification Types | Course updates, assignments, messages, achievements, system alerts |
| Mark as Read | Individual and bulk read marking |
| Notification Preferences | Per-type enable/disable |
| Notification Templates | Admin-configurable templates |
| Notification History | Full delivery log |
| Real-Time Badge | Header bell icon with unread count |

### 9.2 Search

| Feature | Description |
|---------|-------------|
| Universal Search | ⌘K command palette search |
| Scoped Search | Per-role search (student/instructor/admin) |
| Search Targets | Courses, users, lessons, Q&A |
| Mobile Search | Expandable search on mobile |

### 9.3 Theme System

| Feature | Description |
|---------|-------------|
| Dark Mode | next-themes class-based dark mode |
| Light Mode | Default light theme |
| Theme Toggle | Available in all portal sidebars |
| Theme Persistence | Saved to localStorage |

### 9.4 Internationalization

| Feature | Description |
|---------|-------------|
| English | Default language |
| Urdu | Full Urdu language support |
| Language Toggle | Available in all portal sidebars |
| RTL Support | Right-to-left text rendering for Urdu |
| next-intl | Integration with next-intl library |

### 9.5 Email System

| Feature | Description |
|---------|-------------|
| 9 HTML Templates | Welcome, OTP, Password Reset, Course Enrollment, Certificate, Payout, etc. |
| Email Service | `src/lib/email.ts` with template rendering |
| Transactional Emails | OTP verification, password reset, enrollment confirmations |

---

## 10. Gamification System

### 10.1 XP (Experience Points)

| Action | XP Reward |
|--------|-----------|
| Complete Lesson | +10 XP |
| Pass Quiz | +15-50 XP (based on score) |
| Submit Assignment | +20 XP |
| AI Tutor Interaction | +3-5 XP |
| Review Weakest Topic | +25 XP |
| Take a Quiz (Companion) | +20 XP |
| Continue Learning Path | +15 XP |
| Start AI Session | +10 XP |
| Daily Login | +5 XP |
| Maintain Streak | +2 XP/day |

### 10.2 Levels

| Feature | Description |
|---------|-------------|
| Level Progression | XP-threshold-based level system |
| Level Display | Shown in header, profile, and leaderboard |
| Admin Configuration | Level thresholds configurable by admin |

### 10.3 Badges

| Category | Examples |
|----------|---------|
| **Learning** | First Lesson, Course Complete, Quiz Master |
| **Streak** | 7-Day Streak, 30-Day Streak, Streak Champion |
| **Social** | First Q&A, Helpful Answer, Study Group Creator |
| **Achievement** | Perfect Score, Speed Learner, AI Pioneer |

### 10.4 ShijlCoins

| Feature | Description |
|---------|-------------|
| Coin Earning | Earned alongside XP from activities |
| Reward Shop | Spend coins on rewards |
| Streak Freeze | Buy streak protection with coins |
| Coin Display | Header coin counter |

### 10.5 Streaks

| Feature | Description |
|---------|-------------|
| Daily Streak | Consecutive days of activity |
| Longest Streak | Personal record tracking |
| Streak Freeze | Protect streak on missed days (coin purchase) |
| Streak Rewards | Milestone bonuses at 7, 14, 30, 60, 90 days |

### 10.6 Daily Challenges

| Feature | Description |
|---------|-------------|
| Challenge Types | lesson, quiz, streak, xp, time, assignment |
| Difficulty Levels | easy, medium, hard |
| Rotating Daily | New challenges each day |
| XP + Coin Rewards | Both currencies rewarded |
| Progress Tracking | Per-challenge progress |

### 10.7 Leaderboards

| Feature | Description |
|---------|-------------|
| Global Leaderboard | Top students by XP |
| Course Leaderboard | Per-course ranking |
| Weekly/Monthly | Time-bounded leaderboards |

---

## 11. Financial System

### 11.1 Payment Methods

| Method | Code | Description |
|--------|------|-------------|
| Credit/Debit Card | `credit_debit_card` | Standard card payment |
| JazzCash | `jazzcash` | Pakistani mobile wallet |
| EasyPaisa | `easypaisa` | Pakistani mobile wallet |
| Bank Transfer | `bank_transfer` | Direct bank transfer |
| Payoneer/Stripe | `payoneer_stripe` | International payment |

### 11.2 Revenue Split

```
Course Price × Commission Rate = Platform Fee
Course Price - Platform Fee = Instructor Earning

Default: Platform 20% | Instructor 80%
Override: Per-instructor custom commission rates
```

### 11.3 Payout System

| Feature | Description |
|---------|-------------|
| Gross Earning | Sum of instructor earnings for period |
| Tax Withholding | 10% FBR default (configurable) |
| Net Payout | Gross - Tax |
| Payout Methods | JazzCash, EasyPaisa, Bank Transfer, Payoneer |
| Payout Status | pending → processing → completed → failed → cancelled → disputed |

### 11.4 Dispute System

| Feature | Description |
|---------|-------------|
| Dispute Types | Payment not received, Course not as described, Unauthorized charge, Technical issue |
| Resolution Workflow | open → under_review → resolved_favor_buyer/seller → escalated |
| Evidence Upload | JSON-based evidence with type, URL, description |
| Refund Processing | Full/partial refund with negative transaction |
| Admin Resolution | Admin-assigned dispute resolution |

### 11.5 Multi-Currency

| Currency | Code | Symbol | Use |
|----------|------|--------|-----|
| Pakistani Rupee | PKR | ₨ | Primary (all transactions) |
| US Dollar | USD | $ | Admin dashboard display |
| Euro | EUR | € | Admin dashboard display |
| British Pound | GBP | £ | Admin dashboard display |
| UAE Dirham | AED | د.إ | Admin dashboard display |

---

## 12. Community & Social Features

### 12.1 Q&A System

| Feature | Description |
|---------|-------------|
| Per-Lesson Questions | Ask questions on specific lessons |
| Answers | Multiple answers per question |
| Upvoting | Upvote questions and answers |
| AI Draft Answers | LLM-generated answer suggestions for instructors |
| Q&A Settings | Per-course Q&A configuration |

### 12.2 Discussion Forums

| Feature | Description |
|---------|-------------|
| Discussion Posts | Course-level discussion creation |
| Replies | Threaded replies to discussions |
| Upvoting | Upvote discussions |
| Bookmarks | Save important discussions |

### 12.3 Study Groups

| Feature | Description |
|---------|-------------|
| Group Creation | Create study groups per course |
| Group Membership | Join/leave groups |
| Group Messaging | Real-time group chat |
| Resource Sharing | Share links, files within groups |
| Group Management | Creator-admin with moderation tools |

### 12.4 Community Events

| Feature | Description |
|---------|-------------|
| Event Creation | Schedule community events |
| Event Attendance | RSVP and attend events |
| Event Details | Time, location, description |

### 12.5 Peer Reviews

| Feature | Description |
|---------|-------------|
| Peer Assignment Review | Review and rate peer submissions |
| Anonymous Reviews | Optional anonymous review mode |
| Review Criteria | Rubric-based evaluation |

---

## 13. Security & Compliance

### 13.1 Authentication Security

| Feature | Description |
|---------|-------------|
| Password Hashing | Secure password storage |
| OTP Verification | Email-based 6-digit OTP |
| MFA Support | TOTP-based multi-factor auth |
| Account Locking | Auto-lock after failed attempts |
| Session Management | Track and terminate sessions |

### 13.2 Access Control

| Feature | Description |
|---------|-------------|
| Role-Based Access | Student, Instructor, Admin, Parent roles |
| View Resolution | Role-based view mapping |
| API Authorization | Per-route role checks |
| Role Switching | Admin can view any portal |

### 13.3 Platform Security

| Feature | Description |
|---------|-------------|
| API Key Management | Scoped API keys with rotation |
| IP Blocking | Block malicious IP addresses |
| Login Alerts | Anomalous login detection |
| Security Events | Comprehensive event logging |
| Security Roles | Custom role definitions |
| Audit Logging | Every admin action logged |

### 13.4 Data Protection

| Feature | Description |
|---------|-------------|
| Safe User Objects | API strips passwordHash, mfaSecret, etc. |
| Input Validation | Zod schema validation on forms and APIs |
| Content Moderation | Admin content review system |
| Age Restriction | Course age gating (none, 13+, 18+) |
| Region Restriction | Course geographic restrictions |

---

## 14. Platform Configuration

### 14.1 Feature Flags

| Feature | Description |
|---------|-------------|
| Toggle Features | Enable/disable platform features without code deploy |
| Flag Categories | AI, Gamification, Community, Payments |
| Admin Interface | Toggle from admin dashboard |
| Persistence | Database-stored flag state |

### 14.2 Appearance Branding

| Feature | Description |
|---------|-------------|
| Logo Upload | Platform logo customization |
| Color Scheme | Primary/secondary color configuration |
| Favicon | Custom favicon support |
| Theme Presets | Pre-built appearance themes |
| Change History | Track appearance modifications |

### 14.3 Legal Pages

| Feature | Description |
|---------|-------------|
| Terms of Service | Rich text editor for ToS |
| Privacy Policy | GDPR-compliant privacy editor |
| Refund Policy | Customizable refund policy |
| About Page | Platform about page editor |

### 14.4 Webhooks & Integrations

| Feature | Description |
|---------|-------------|
| Webhook Endpoints | Register webhook URLs |
| Event Subscriptions | Choose which events trigger webhooks |
| Integration Config | Third-party service settings |
| Delivery Logging | Webhook delivery status tracking |

### 14.5 Platform Announcements

| Feature | Description |
|---------|-------------|
| Create Announcements | Platform-wide announcement creation |
| Schedule | Time-based announcement scheduling |
| Target Audience | Role-based targeting |
| Dismiss Tracking | Track user dismissal |

---

## 15. Feature Matrix by Role

### 15.1 Complete Feature Access Matrix

| Feature | Student | Instructor | Admin |
|---------|:-------:|:----------:|:-----:|
| **Course Browsing** | ✅ | ✅ | ✅ |
| **Course Enrollment** | ✅ | ❌ | ❌ |
| **Course Creation** | ❌ | ✅ | ✅ |
| **Course Player** | ✅ | ❌ | ❌ |
| **Lesson Progress** | ✅ | ✅ (view) | ✅ (view) |
| **Quiz Taking** | ✅ | ❌ | ❌ |
| **Quiz Creation** | ❌ | ✅ | ❌ |
| **Assignment Submission** | ✅ | ❌ | ❌ |
| **Assignment Grading** | ❌ | ✅ | ❌ |
| **Ask ShijlAI (6 modes)** | ✅ | ❌ | ❌ |
| **AI Learning Companion** | ✅ | ❌ | ❌ |
| **AI Mock Interview** | ✅ | ❌ | ❌ |
| **AI Study Planner** | ✅ | ❌ | ❌ |
| **AI Learning Paths** | ✅ | ❌ | ❌ |
| **AI Recommendations** | ✅ | ❌ | ❌ |
| **AI Tutor** | ✅ | ❌ | ❌ |
| **AI Copilot (11 tools)** | ❌ | ✅ | ❌ |
| **AI Assistant Chat** | ❌ | ✅ | ❌ |
| **Smart Assessment** | ❌ | ✅ | ✅ (view) |
| **Intelligent Analytics** | ✅ (12) | ✅ (8) | ✅ (6) |
| **AI Admin Copilot** | ❌ | ❌ | ✅ |
| **System Intelligence** | ❌ | ❌ | ✅ |
| **AI Report Generator** | ❌ | ❌ | ✅ |
| **Course Quality Analyzer** | ❌ | ❌ | ✅ |
| **Revenue Forecasting** | ❌ | ✅ (own) | ✅ (all) |
| **User Management** | ❌ | ❌ | ✅ |
| **Instructor Management** | ❌ | ❌ | ✅ |
| **Course Review** | ❌ | ❌ | ✅ |
| **Security Center** | ❌ | ❌ | ✅ |
| **AI Configuration** | ❌ | ❌ | ✅ |
| **Gamification Management** | ❌ | ❌ | ✅ |
| **Appearance Branding** | ❌ | ❌ | ✅ |
| **Feature Flags** | ❌ | ❌ | ✅ |
| **Audit Log** | ❌ | ❌ | ✅ |
| **Dev Tools** | ❌ | ❌ | ✅ |
| **Messaging** | ✅ | ✅ | ❌ |
| **Notifications** | ✅ | ✅ | ✅ |
| **Community** | ✅ | ❌ | ❌ |
| **Q&A** | ✅ | ✅ (manage) | ❌ |
| **Certifications** | ✅ (earn) | ✅ (issue) | ✅ (verify) |
| **Gamification (earn)** | ✅ | ❌ | ❌ |
| **Blog** | ✅ (read) | ❌ | ✅ (manage) |
| **Skill Graph** | ✅ | ❌ | ❌ |
| **Search** | ✅ | ✅ | ✅ |
| **Dark Mode** | ✅ | ✅ | ✅ |
| **i18n (EN/UR)** | ✅ | ✅ | ✅ |

---

## 16. API Route Summary

### 16.1 Route Count by Domain

| Domain | Routes | Key Endpoints |
|--------|--------|---------------|
| `/api/auth/*` | 7 | login, register, verify-otp, forgot-password, reset-password, social, demo-login |
| `/api/ai/*` | 20 | chat, tutor, study-planner, companion, mock-interview, learning-paths |
| `/api/ai/shijlai/*` | 13 | chat, insights, profile, recommendations, search, study-plan, quiz-generator, events, sessions, mastery |
| `/api/instructor/*` | 68+ | courses, modules, assignments, students, revenue, analytics, qa, schedule, quizzes, messages, profile, copilot, assessment, ai/* |
| `/api/instructor/ai/*` | 18 | generate-curriculum, generate-quiz, generate-rubric, generate-outcomes, generate-lesson-content, generate-assignment, generate-description, auto-respond, suggest-reply, auto-caption, analyze-feedback, improve-bio, assistant, templates, course-insights, usage-stats, generations |
| `/api/student/*` | 30+ | assignments, bookmarks, challenges, community/*, course-player, daily-plan, goals, learning, messages, notes, progress, profile, qa, recommendations, reviews, schedule, settings, streak, wishlist |
| `/api/admin/*` | 60+ | users, courses, finance/*, security/*, ai-config/*, gamification/*, notifications/*, settings/*, course-review, instructors, content-review, audit-log, dashboard, dev-tools, appearance, copilot, system-intelligence, reports, blog |
| `/api/courses/*` | 5 | route, catalog, categories, [id], [id]/public, [id]/reviews |
| `/api/certificates/*` | 3 | route, download, verify |
| `/api/analytics/*` | 3 | route, events, intelligent |
| `/api/notifications/*` | 3 | route, preferences, seed |
| `/api/blog/*` | 3 | route, seed, [id] |
| Other | 10+ | gamification, skills, skill-graph, search, enrollments, progress, dashboard, quizzes, users/me, seed |
| **Total** | **200+** | |

### 16.2 AI-Specific API Routes (57 Total)

| Portal | Count | Routes |
|--------|-------|--------|
| Student AI | 15 | `/api/ai/chat`, `/api/ai/tutor`, `/api/ai/study-planner`, `/api/ai/companion`, `/api/ai/mock-interview`, `/api/ai/learning-paths`, `/api/ai/shijlai/*` (13) |
| Instructor AI | 26 | `/api/instructor/copilot`, `/api/instructor/ai/*` (18), `/api/instructor/assessment/*` (5), `/api/instructor/ai/generations/*` (2) |
| Admin AI | 15 | `/api/admin/copilot`, `/api/admin/system-intelligence/*` (2), `/api/admin/reports`, `/api/admin/course-quality/*` (2), `/api/admin/course-review/*/ai-analysis`, `/api/admin/ai-config/*` (7) |
| Cross-Portal AI | 1 | `/api/analytics/intelligent` |

---

## 17. Component & View Summary

### 17.1 View Count by Category

| Category | Count | Views |
|----------|-------|-------|
| Auth | 4 | login, register, forgot-password, verify-otp |
| Public | 8 | landing, public-courses, public-course-detail, pricing, instructors, about, blog, blog-detail |
| Student | 22 | dashboard, courses, course-detail, tutor, achievements, my-skills, quiz, certificates, student-assignments, student-messages, student-schedule, student-qa, recommendations, shijlai-hub, learning-companion, explore, community, course-player, notifications, student-profile, student-settings, student-assignment-detail |
| Instructor | 17 | instructor-dashboard, instructor-courses, instructor-course-detail, instructor-students, instructor-quizzes, instructor-assignments, instructor-analytics, instructor-qa, instructor-schedule, instructor-revenue, instructor-marketing, instructor-copilot, instructor-assessment, instructor-settings, instructor-messages, instructor-profile, course-creator |
| Admin | 27 | admin, admin-users, admin-courses, admin-qa-reports, admin-revenue, admin-payouts, admin-refunds, admin-marketing, admin-notifications, admin-live-sessions, admin-gamification, admin-ai-config, admin-appearance, admin-security, admin-settings, admin-audit-log, admin-dev-tools, admin-user-detail, admin-instructors, admin-instructor-detail, admin-course-review, admin-course-review-detail, admin-applications, admin-analytics, admin-copilot, admin-system-intelligence, admin-shijlai-hub, admin-blog |
| Other | 6 | application-status, analytics, learning-paths, smart-content, instructor-ai-tools, instructor-ai-tool-detail |
| **Total** | **84** | |

### 17.2 Key Custom Components

| Component | Portal | Lines | Description |
|-----------|--------|-------|-------------|
| `student-shell.tsx` | Student | ~300 | Shell layout with sidebar + header |
| `instructor-shell.tsx` | Instructor | ~300 | Shell layout with sidebar + header |
| `admin-shell.tsx` | Admin | ~787 | Shell with sidebar + header + bottom bar |
| `student-dashboard.tsx` | Student | ~1500 | Student dashboard |
| `instructor-dashboard.tsx` | Instructor | ~1800 | Instructor dashboard |
| `admin-dashboard-v2.tsx` | Admin | ~1305 | Admin dashboard |
| `ask-shijlai-view.tsx` | Student | ~1200 | Ask ShijlAI chat interface |
| `learning-companion-view.tsx` | Student | ~1000 | AI companion dashboard |
| `instructor-copilot-view.tsx` | Instructor | ~1800 | AI Copilot with 11 tools |
| `admin-copilot-view.tsx` | Admin | ~850 | Admin AI Copilot |
| `admin-system-intelligence-view.tsx` | Admin | ~1125 | System Intelligence |
| `admin-shijlai-hub-view.tsx` | Admin | ~866 | Report Generator + Quality Analyzer |
| `admin-user-management.tsx` | Admin | ~1690 | User management table |
| `admin-course-management.tsx` | Admin | ~2636 | Course management |
| `admin-instructor-management.tsx` | Admin | ~2248 | Instructor management |
| `admin-revenue-finance.tsx` | Admin | ~1185 | Revenue & finance |
| `admin-security.tsx` | Admin | ~900 | Security center |
| `admin-gamification.tsx` | Admin | ~1100 | Gamification management |
| `course-creator-view.tsx` | Instructor | ~800 | 6-step course creator |
| `skill-graph.tsx` | Student | ~600 | Interactive skill tree |
| `ai-mock-interview.tsx` | Student | ~800 | Mock interview 4-phase UX |
| `companion-chatbot.tsx` | Student | ~400 | Floating FAB companion |
| `notification-bell.tsx` | Cross | ~200 | Header notification bell |
| `universal-search.tsx` | Cross | ~300 | ⌘K search palette |
| `course-carousel-row.tsx` | Cross | ~200 | Embla-based course carousel |

### 17.3 shadcn/ui Component Library (45 Components)

| Component | Usage |
|-----------|-------|
| alert, alert-dialog | Confirmation dialogs, error messages |
| accordion | FAQ sections, sidebar sections |
| avatar | User avatars in headers and lists |
| badge | Status indicators, counts, labels |
| button | All interactive elements |
| calendar | Date pickers, schedule views |
| card | Dashboard cards, stat cards, content cards |
| carousel | Course carousels, testimonial sliders |
| chart | Recharts integration |
| checkbox | Filters, form fields |
| collapsible | Sidebar sections, expandable content |
| command | ⌘K search palette |
| context-menu | Right-click actions |
| dialog | Modals, forms, detail views |
| drawer | Mobile sheet drawers |
| dropdown-menu | User menus, action menus |
| form | React Hook Form integration |
| hover-card | Tooltips on hover |
| input, textarea, select | Form fields |
| label | Form labels |
| menubar | Top menu navigation |
| navigation-menu | Primary navigation |
| pagination | Table pagination |
| popover | Dropdowns, tooltips |
| progress | Progress bars, mastery indicators |
| radio-group | Single selection |
| resizable | Panel resizing |
| scroll-area | Custom scrollbars |
| separator | Visual dividers |
| sheet | Mobile sidebars, drawers |
| sidebar | Portal sidebars |
| skeleton | Loading placeholders |
| slider | Range inputs |
| sonner, toast | Notifications |
| switch | Toggle controls |
| table | Data tables |
| tabs | Tabbed interfaces |
| toggle, toggle-group | View mode toggles |
| tooltip | Hover information |
| input-otp | OTP verification input |
| aspect-ratio | Media aspect ratios |
| breadcrumb | Navigation breadcrumbs |

---

## Appendix A: Algorithm & Formula Reference

### A.1 Mastery Score

```
masteryScore = quizScore × 0.50 + assignmentScore × 0.25 + practiceScore × 0.15 + completionScore × 0.10
```

### A.2 Drop Risk Score

```
dropRisk = (100 - engagementScore) × 0.30
         + (100 - consistencyScore) × 0.30
         + max(0, 2 × (olderAvg - recentAvg)) × 0.20
         + min(100, daysInactive × 5) × 0.20
```

### A.3 Priority Score (Recommendations)

```
priorityScore = weakness × 0.40 + careerRelevance × 0.20 + engagementMatch × 0.20 + recencyNeed × 0.20
```

### A.4 Course Health Score (Admin)

```
healthScore = enrollmentGrowth × 0.25 + completionRate × 0.25 + avgRating × 0.20 + engagementRate × 0.15 + assessmentScore × 0.15
```

### A.5 Instructor Effectiveness Score

```
effectiveness = completionRate × 0.30 + avgRatings × 0.25 + studentSuccessRate × 0.25 + engagementScore × 0.20
```

### A.6 Quality Score (Course Quality Analyzer)

```
qualityScore = structureScore × 0.25 + assessmentScore × 0.25 + successScore × 0.20 + engagementScore × 0.15 + contentScore × 0.15
```

### A.7 Engagement Score (Feature Engine)

```
engagement = min(logins, 7)×5 + hours×4 + min(quizzes, 10)×2 + min(aiUsage, 10)×1.5 + min(lessons, 10)×0.5
Capped at 100
```

### A.8 Time Decay (Ebbinghaus)

```
decayFactor = 1 - (0.005 × max(0, daysSinceLastActivity - 7))
Applied proportionally to all component scores
```

### A.9 Learning Speed

```
learningSpeed = (completedLessons / hoursSpent) × 10
Capped at 100, default 50
```

### A.10 Consistency Score

```
consistency = (activeDays / totalDaysEnrolled) × 100
Penalty: -10 if current streak < 3
```

### A.11 Topic Weight Allocation (Study Planner)

```
Weak topics (mastery < 50%):     40% of study time
Moderate topics (50-75%):        30% of study time
Strong topics (> 75%):           15% of study time
Review buffer:                   15% of study time
```

### A.12 Revenue Split

```
platformFee = coursePrice × commissionRate%
instructorEarning = coursePrice - platformFee
Default: 20% platform / 80% instructor
```

### A.13 Payout Calculation

```
grossEarning = Σ instructorEarning for period
taxWithheld = grossEarning × withholdingTaxRate% (default 10% FBR)
netPayout = grossEarning - taxWithheld
```

---

## Appendix B: Threshold Reference

| Metric | Threshold | Action |
|--------|-----------|--------|
| Drop Risk > 60 | High risk | Immediate intervention, AI companion check-in |
| Drop Risk 30-60 | Moderate risk | Study plan, reminders |
| Engagement < 30 | Low engagement | Interactive prompts in AI |
| Consistency < 30 | Low consistency | Daily habit encouragement |
| Topic Mastery < 30 | Very weak | High-priority recommendation |
| Topic Mastery < 50 | Weak | Medium-priority recommendation |
| Topic Mastery > 75 | Strong | Advance to next topic |
| Topic Mastery > 90 | Mastered | Celebration insight |
| Inactivity > 5 days | Alert | Companion inactivity insight |
| Streak < 3 | Penalty | -10 consistency score |
| Last Activity > 7 days | Decay trigger | 0.5%/day mastery decay |
| Messages > 20 | Summary trigger | Auto-generate conversation summary |
| Quiz Score Drop > 20% | Critical alert | Admin notification |
| Enrollment Drop > 20% | Warning alert | Admin notification |
| Q&A Response Time > 48h | Slow response | Instructor warning |
| Course Rating < 3.0 | Low rating | Warning alert |

---

*This document provides a comprehensive summary of all features in ShijlAI Academy. For detailed implementation documentation, refer to:*
- *Student Portal: `docs/student-portal/STUDENT-PORTAL-COMPLETE-IMPLEMENTATION.md`*
- *Instructor Portal: `docs/instructor-portal/Instructor_portal.md`*
- *Admin Portal: `docs/admin-portal/admin_portal.md`*
- *AI Modules: `docs/AI_modules.md`*
- *Database Design: `docs/database_design.md`*
- *System Architecture: `docs/system_architecture.md`*
