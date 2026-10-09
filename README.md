<div align="center">

# 🎓 ShijlAI Academy
### *An Enterprise-Scale, AI-Native Adaptive Learning Management & Educational Intelligence Platform*

[![Next.js 16](https://img.shields.io/badge/Next.js-16.1_App_Router-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0_Concurrent-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.x_Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4.x_Engine-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.11_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL 8.0](https://img.shields.io/badge/MySQL-8.0_InnoDB-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Google Gemini](https://img.shields.io/badge/AI_Orchestration-Gemini_2.5_Flash_%2F_Pro-8E75C2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Bun Runtime](https://img.shields.io/badge/Runtime-Bun_1.3_%2F_Node_20+-FBF0DF?style=for-the-badge&logo=bun&logoColor=black)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge)](LICENSE)

<br/>

**Cognitive Mastery • Bayesian Knowledge Tracing • Pedagogical Intelligence • Multi-Tier Governance**

*Department of Computer Science & Information Technology — University of Malakand (UOM), Pakistan*  
**Engineered & Authored by**: **Tanzeel Ur Rahman** • **Israr Ullah**  
*Bachelor of Science in Computer Science (BSCS) — Final Year Project (FYP) Capstone*

---

</div>

## 📑 Table of Contents

1. [Executive Summary](#-executive-summary)
2. [Architectural Highlights & Quantitative Scale](#-architectural-highlights--quantitative-scale)
3. [The Triple-Helix Portal Ecosystem](#-the-triple-helix-portal-ecosystem)
   - [Student Portal (Cognitive Mastery & Active Learning)](#1-student-portal-cognitive-mastery--active-learning)
   - [Instructor Portal (Curriculum Engineering & Teaching Intelligence)](#2-instructor-portal-curriculum-engineering--teaching-intelligence)
   - [Admin Portal (System Governance & Decision Intelligence)](#3-admin-portal-system-governance--decision-intelligence)
   - [Public Discovery & Academic Catalog](#4-public-discovery--academic-catalog)
4. [The 7-Service Adaptive Learning Engine (Mathematical Formulations)](#-the-7-service-adaptive-learning-engine)
5. [Neural Orchestration & Enterprise AI Governance](#-neural-orchestration--enterprise-ai-governance)
6. [Data Architecture & Domain Modeling (148 Prisma Models)](#-data-architecture--domain-modeling)
7. [System Topology & SPA-within-SSR Execution Model](#-system-topology--spa-within-ssr-execution-model)
8. [Repository Structure](#-repository-structure)
9. [Quickstart & Installation Guide](#-quickstart--installation-guide)
10. [Turnkey Demonstration Credentials](#-turnkey-demonstration-credentials)
11. [Environment Configuration Reference](#-environment-configuration-reference)
12. [Production Deployment & Proxy Topology](#-production-deployment--proxy-topology)
13. [Academic Heritage, Citations & Research Provenance](#-academic-heritage-citations--research-provenance)
14. [License & Acknowledgments](#-license--acknowledgments)

---

## 🔬 Executive Summary

**ShijlAI Academy** is an enterprise-scale, AI-native Learning Management System (LMS) and Educational Intelligence Platform engineered to transcend the limitations of conventional, static e-learning portals. Built on modern software engineering paradigms and empirical cognitive science research, ShijlAI Academy delivers a unified, reactive environment that continuously senses student behavior, computes cognitive mastery decay, and synthesizes personalized pedagogical interventions in real time.

### Core Value Propositions:
* **Real-Time Cognitive Personalization**: Integrates Bayesian Knowledge Tracing (BKT) and modified Ebbinghaus forgetting curves to model student memory decay and recommend optimal remediation pathways.
* **Triple-Helix Operational Model**: Houses dedicated, uncompromised workspaces for **Students** (adaptive learning, mock technical interviews, interactive mastery graphs), **Instructors** (11-tool AI authoring studio, automated rubric grading, cohort dropout analytics), and **Administrators** (5 system intelligence engines, 9-intent decision copilot, linear regression cash-flow forecasting).
* **Enterprise Multi-LLM Governance Fabric**: Employs Google Gemini 2.5 Flash and Gemini 2.5 Pro with structured schema enforcement, automated API key load-balancing, latency tracking, token expenditure auditing, and circuit-breaker failover mechanisms.
* **Localized Financial & Pedagogical Infrastructure**: Full native support for the Pakistani education market (FSc Pre-Engineering/Pre-Medical, Cambridge O/A-Levels, IELTS, AWS Cloud Architectures) combined with PKR-denominated fiscal rails (JazzCash, EasyPaisa, Direct Bank Transfer, Stripe) and dual English/Urdu instructional adaptations.

---

## 📈 Architectural Highlights & Quantitative Scale

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    SHIJLAI ACADEMY PLATFORM BENCHMARKS                       │
├────────────────────────────────┬─────────────────────────────────────────────┤
│ Total Source Code Base         │ ~196,000+ Lines of Strict TypeScript / TSX  │
│ Database Schema Complexity     │ 148 Relational Models (15 Bounded Contexts) │
│ Backend REST API Controllers   │ 200+ Route Handlers (/api/*)                │
│ Dedicated AI Neural Endpoints  │ 57 Endpoints (Generation, Audit, Analysis)  │
│ Distinct AI Capabilities       │ 36 Pedagogical & Operational AI Features    │
│ Client-Side Routed Views       │ 84 Lazy-Loaded Dynamic Modules              │
│ Atomic UI Component Primitives │ 45 shadcn/ui & Radix Component Primitives   │
│ Adaptive Learning Services     │ 7 Interconnected Heuristic & Math Services  │
│ Static Technical Publications  │ 8 Pre-seeded Deep-Dive Engineering Articles │
│ Supported Curricula Standards  │ Cambridge (O/A-Levels), FSc, IB, AP, AWS    │
└────────────────────────────────┴─────────────────────────────────────────────┘
```

---

## 🏛️ The Triple-Helix Portal Ecosystem

ShijlAI Academy unifies three independent user tiers through a high-performance **Single Page Application within Next.js Server-Side Rendering (SPA-in-SSR)** architecture:

```mermaid
graph TD
    UserRequest([HTTP Request / Session Token]) --> EdgeGateway{Role Gatekeeper}
    
    EdgeGateway -->|Role: student| StudentTier[Student Portal: 22 Views • 8 Deep AI Tools]
    EdgeGateway -->|Role: instructor| InstructorTier[Instructor Portal: 17 Views • 14+ AI Authoring Tools]
    EdgeGateway -->|Role: admin| AdminTier[Admin Portal: 27 Views • 6 Intelligence Engines]
    EdgeGateway -->|Role: guest / unauthenticated| PublicTier[Public Portal: 8 Views • Course Discovery & Catalog]

    subgraph CoreEngine [Shared Core Intelligence & Persistence Tier]
        ALE[7-Service Adaptive Learning Engine]
        LLM[Google Gemini 2.5 Orchestration Fabric]
        DB[(MySQL 8.0 / Prisma 148 Models)]
    end

    StudentTier --> CoreEngine
    InstructorTier --> CoreEngine
    AdminTier --> CoreEngine
```

---

### 1. 🎓 Student Portal (Cognitive Mastery & Active Learning)
*22 Dynamic Views • 8 Deep AI Features • 30+ Dedicated APIs*

The Student Portal transforms passive video consumption into an active, self-regulating learning cycle:

* **Ask ShijlAI (Multi-Modal Socratic AI Tutor)**:
  * `Tutor Mode`: Guides learners through complex mathematical and programming problems using Socratic questioning without outputting direct answers.
  * `Coding Agent`: Interactive syntax debugger, code explanation engine, and time-complexity analyzer.
  * `Quiz Generator`: Dynamically synthesizes 5-question conceptual checkups based on the active lesson.
  * `Concept Explainer`: Toggleable complexity modes (*ELI5 Elementary* vs. *Rigorous Academic*).
  * `Lesson Summarizer`: Produces executive synopses, key takeaways, and mathematical formula cheat-sheets.
  * `Bilingual Urdu/English Bridge`: Instant bidirectional translation and vernacular explanations of technical concepts.
* **Proactive AI Learning Companion (Persistent FAB)**:
  * Context-aware floating agent with three selectable pedagogic behavioral modes: *Encouraging Mentor*, *Academic Taskmaster*, and *Casual Peer*.
  * Real-time intervention heuristics: Detects tab inactivity, repeated video re-winding, and consecutive quiz failures to propose timely pauses or refresher readings.
* **AI Mock Technical Interviewer**:
  * Real-world simulated technical screening across 4 engineering domains: *Fullstack Web*, *Frontend Architecture*, *Backend & Distributed Systems*, and *Data Engineering & AI*.
  * 3 calibrated difficulty settings (*Junior*, *Mid-Level*, *Senior Staff*).
  * Evaluates responses against four criteria: *Technical Accuracy*, *Algorithmic Efficiency*, *Communication Clarity*, and *Problem Decomposition*, producing an instant hiring scorecard.
* **Bayesian Topic Mastery & Interactive Skill Graph**:
  * Visual directed acyclic graph (DAG) mapping prerequisite topics and dependency chains.
  * Real-time node coloring reflecting topic mastery states (`Mastered`, `Proficient`, `Review Needed`, `At Risk`).
* **Immersive Course Player**:
  * Dual-mode playback supporting native HTML5 video and streaming platforms with auto-syncing transcripts.
  * Timestamped Markdown note-taking with single-click `.txt` / `.md` note exportation.
  * In-player Q&A thread drawer with instructor and AI co-responses.
* **Full Gamification & Social Economy**:
  * Experience Points (XP), dynamic leveling system, consecutive daily streak counters.
  * ShijlCoins virtual currency redeemable in the Reward Shop for course discounts and avatar badges.
  * Real-time global and cohort leaderboards, peer study groups, and community discussion boards.

---

### 2. 👨‍🏫 Instructor Portal (Curriculum Engineering & Teaching Intelligence)
*17 Dynamic Views • 14+ AI Tools • 68+ Dedicated APIs*

The Instructor Portal provides educators with an automated curriculum development studio and cohort telemetry dashboard:

* **AI Teaching Copilot (11 Dedicated Authoring Tools)**:
  * *Curriculum Architect*: Generates module structures from course titles and target outcomes.
  * *Bloom’s Taxonomy Objective Formatter*: Formats measurable pedagogical goals across cognitive levels.
  * *Lecture Script & Teleprompter Writer*: Drafts conversational video scripts with visual cues.
  * *Rubric Synthesizer*: Builds multi-tier grading rubrics with point distributions and qualitative benchmarks.
  * *Slide Deck Outline Formatter*: Produces structured Markdown/bullet slide outlines.
  * *Lesson Content Synthesizer*: Compiles rich Markdown textbook-style reading materials.
  * *Discussion Prompt Generator*: Crafts engaging ethical and technical dilemma questions for forums.
  * *Coding Exercise Builder*: Designs programming challenges with starter templates and hidden test suites.
  * *Case Study Generator*: Produces contextualized real-world industry scenarios.
  * *Glossary & Concept Indexer*: Extracts key vocabulary terms and definitions automatically.
  * *Differentiated Instruction Customizer*: Tailors difficulty levels for beginner, intermediate, and advanced tracks.
* **6-Step Interactive Course Creator Wizard**:
  * Step-by-step authoring workflow: *General Metadata* $\rightarrow$ *Curriculum Modules* $\rightarrow$ *Media Uploads* $\rightarrow$ *Pricing & Tiers* $\rightarrow$ *SEO & Social Tags* $\rightarrow$ *Quality Inspection & Publish*.
* **Sharp/SVG Automated Branded Thumbnail Generator**:
  * On-demand vector generation engine producing 4 modern layout variants rendered to high-resolution PNGs via `sharp`.
* **Smart Assessment & Rubric Evaluation Engine**:
  * Automated student submission scoring against customizable criteria.
  * Distractor analysis for multiple-choice questions (flags misleading or ambiguous answer options).
* **Intelligent Teaching Telemetry**:
  * Video drop-off retention curves pinpointing exact seconds where student attention declines.
  * Real-time cohort progression funnels and student at-risk identification tables.
  * Comprehensive PKR financial ledger detailing gross enrollments, platform fees, and pending JazzCash/EasyPaisa payouts.

---

### 3. 🛡️ Admin Portal (System Governance & Decision Intelligence)
*27 Dynamic Views • 6 AI Engines • 60+ Dedicated APIs*

The Admin Portal serves as the institutional command center for platform oversight, security auditing, and financial management:

* **Admin Decision Intelligence Copilot**:
  * 3-stage query decomposition pipeline parsing natural language administrative questions across 9 operational intents (*Financial*, *Pedagogical*, *Operational*, *Security*, *User Management*, *Course Moderation*, *Infrastructure*, *Compliance*, *Platform Growth*).
* **5 Real-Time System Intelligence Engines**:
  1. *Anomaly Detection Engine*: Continuously identifies atypical spikes in account registrations, rapid quiz completions, or failed API calls.
  2. *Sentiment Analysis Engine*: Analyzes student reviews and forum interactions to alert administrators to course dissatisfaction.
  3. *Platform Capacity & Health Engine*: Monitors server response latencies, database connection pool exhaustion, and error rates.
  4. *Revenue Forecasting Engine*: Implements linear regression models to project 30, 60, and 90-day cash flows.
  5. *Fraud & Academic Integrity Engine*: Identifies concurrent multi-IP session logins and suspicious certificate claims.
* **5-Dimensional Course Quality Analyzer**:
  * Algorithmic + LLM evaluation scoring courses across: *Pedagogical Clarity*, *Syllabus Thoroughness*, *Assessment Rigor*, *Media Fidelity*, and *Market Alignment*.
* **AI Provider Fabric & Key Governance**:
  * Dynamic round-robin API key rotation, provider health checks, token quotas, and system prompt template version control.
* **Financial Clearinghouse & Tax Compliance**:
  * Automated instructor revenue split calculations, withholding tax documentation, payout approval pipelines, and transaction reconciliation.

---

### 4. 🌐 Public Discovery & Academic Catalog
*8 Dynamic Views • Search & Filter Pipeline*

* Responsive landing experience with interactive curriculum carousels and feature demonstrations.
* Multi-dimensional catalog filtration by category, academic level, language, duration, and price tier (Free vs. Paid in ₨ PKR).
* 8 pre-seeded deep-dive technical publications exploring modern computing, study strategies, and machine learning pedagogy.
* Cryptographically verifiable digital certificates accessible via `/verify/[certificateId]` public endpoints.

---

## 🧮 The 7-Service Adaptive Learning Engine

The core educational engine operates as a continuous, reactive pipeline processing student interaction events into actionable pedagogical interventions:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 ADAPTIVE LEARNING ENGINE INTERACTION PIPELINE               │
└─────────────────────────────────────────────────────────────────────────────┘
  1. Event Ingestion Service  ──► Intercepts lesson views, pauses, quiz attempts
              │
              ▼
  2. Feature Engine           ──► Computes Speed, Engagement, Consistency & Drop Risk
              │
              ▼
  3. Profile Service          ──► Synthesizes Dynamic Student Persona Matrix
              │
              ▼
  4. Mastery Engine           ──► Evaluates BKT Probability & Ebbinghaus Time Decay
              │
              ▼
  5. Recommendation Engine    ──► Generates Multi-Heuristic Remediations & Next Steps
              │
              ▼
  6. Study Planner Service    ──► Builds Constraint-Optimized Daily Timetables
              │
              ▼
  7. Feedback & Intervention  ──► Triggers Proactive Alerts & Targeted Practice
```

### Mathematical Formulations

#### 1. Predictive Dropout Risk Model ($R_{drop} \in [0, 100]$)
Estimates the immediate probability of student course abandonment:
$$R_{drop} = 100 \times \left( w_1 \cdot (1 - C_{cons}) + w_2 \cdot (1 - E_{eng}) + w_3 \cdot D_{decay} + w_4 \cdot F_{quiz} \right)$$
*Where:*
* $C_{cons} \in [0, 1]$ represents login and study session regularity over a 14-day rolling window.
* $E_{eng} \in [0, 1]$ represents video completion ratio and note-taking interaction frequency.
* $D_{decay} \in [0, 1]$ is the normalized topic mastery decay penalty across enrolled subjects.
* $F_{quiz} \in [0, 1]$ is the rolling quiz failure rate ($1 - \text{average quiz score}$).
* Default weights: $w_1 = 0.30, \; w_2 = 0.30, \; w_3 = 0.20, \; w_4 = 0.20$.

#### 2. Modified Ebbinghaus Memory Retention Decay
Models the decay of conceptual mastery over time in the absence of reinforcement:
$$M(t) = M_0 \cdot \exp\left( -\frac{\Delta t}{S \cdot (1 + \ln(1 + R))} \right)$$
*Where:*
* $M_0$ is the initial mastery score achieved upon quiz completion ($0 \le M_0 \le 100$).
* $\Delta t$ is the elapsed time in days since the last active review.
* $S$ is the topic stability factor (inherent complexity index).
* $R$ is the cumulative count of successful reinforcements and practice completions.

#### 3. Weighted Knowledge Tracing Mastery Formulation
Calculates aggregate competence across hierarchical modules:
$$\text{Mastery}_{topic} = \frac{\sum_{i=1}^n w_i \cdot \text{Score}_i \cdot \text{Difficulty}_i}{\sum_{i=1}^n w_i \cdot \text{Difficulty}_i} \times \left( 1 - \gamma \cdot \text{MistakeCount} \right)$$

---

## ⚡ Neural Orchestration & Enterprise AI Governance

ShijlAI Academy implements an abstracted AI service layer (`AIService`) that encapsulates Google Gemini models through `@google/genai`:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ENTERPRISE AI ORCHESTRATION FABRIC                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Client View Request (e.g. Ask ShijlAI, Copilot, Interviewer)               │
│                                  │                                          │
│                                  ▼                                          │
│  AIService.chat() / AIService.generateJSON<T>()                             │
│                                  │                                          │
│         ┌────────────────────────┴────────────────────────┐                 │
│         ▼                                                 ▼                 │
│  Complexity: 'fast'                             Complexity: 'deep'          │
│  Gemini 2.5 Flash                               Gemini 2.5 Pro              │
│  (Chat, Summaries, Hints)                       (Rubrics, Analysis, Plans)  │
│         │                                                 │                 │
│         └────────────────────────┬────────────────────────┘                 │
│                                  ▼                                          │
│  AIConfigManager: Key Rotation • Quota Check • Circuit Breaker              │
│                                  │                                          │
│                                  ▼                                          │
│  GeminiProvider: JSON Schema Enforcement • Safety Filter Audit              │
│                                  │                                          │
│                                  ▼                                          │
│  AIAuditLog: Token Count • Latency Telemetry • Audit Trail Recorded         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Safety & Resilience Controls:
* **JSON Schema Enforcement**: All structured outputs (rubrics, quizzes, outlines) enforce strict JSON schemas directly in the Gemini provider call to prevent malformed responses.
* **Multi-Key Failover**: Automatically rotates API keys when rate limits (HTTP 429) or quota restrictions are detected.
* **Audit Trail**: Every inference records token consumption, model IDs, latency (ms), calling user IDs, and costs in the database (`AIAuditLog` and `AIUsageLog`).

---

## 💾 Data Architecture & Domain Modeling

The database is built on **MySQL 8.0** via **Prisma ORM** featuring **148 models** organized across 15 bounded contexts:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 148 PRISMA MODELS ACROSS 15 BOUNDED CONTEXTS                │
├───────────────────────────────┬─────────────────────────────────────────────┤
│ 1. Identity & Auth (9)        │ User, Session, VerificationToken, LoginAlert│
│ 2. LMS Core Domain (16)       │ Course, Module, Lesson, Enrollment, Review  │
│ 3. Assessment & Quizzes (14)  │ Quiz, Question, Choice, Submission, Outcome │
│ 4. AI & Learning Engine (28)  │ AIProvider, AIModel, StudyPlan, Mastery     │
│ 5. Financial Systems (12)     │ Transaction, Payout, TaxReport, Coupon      │
│ 6. Gamification System (11)   │ Badge, UserBadge, XPTransaction, Streak     │
│ 7. Community & Social (15)    │ DiscussionPost, Reply, StudyGroup, Event    │
│ 8. Messaging & Chat (8)       │ Conversation, Message, Participant, Status  │
│ 9. Notifications (7)          │ Notification, Preference, Template, Broadcast│
│ 10. Analytics & Telemetry (9) │ AnalyticsEvent, RetentionMetric, Heatmap    │
│ 11. Security Center (6)       │ SecurityEvent, BlockedIP, AuditRecord       │
│ 12. Blog & Publications (4)   │ BlogPost, Category, Comment, Tag            │
│ 13. Certificate Engine (3)    │ Certificate, Template, VerificationLog      │
│ 14. Course Moderation (3)     │ ReviewHistory, QualityChecklist, Feedback   │
│ 15. System Intelligence (3)   │ AnomalyLog, SentimentSnapshot, CapacityLog  │
└───────────────────────────────┴─────────────────────────────────────────────┘
```

* **CUID Primary Keys**: All relational entities utilize Collision-Resistant Unique Identifiers (`@id @default(cuid())`).
* **Cascade Delete Protection**: Structural cascades (Course $\rightarrow$ Module $\rightarrow$ Lesson) delete child entities safely, while cross-domain references use `SetNull` to preserve financial and audit integrity.
* **Bitemporal Awareness**: Every entity tracks `createdAt` and `updatedAt` with explicit index optimizations on query predicates.

---

## 🌐 System Topology & SPA-within-SSR Execution Model

ShijlAI Academy implements a **Single-Page Application inside Next.js App Router**:

```
[ Web Browser / Mobile Device ]
              │  HTTP / WebSocket (:80 / :443)
              ▼
[ Caddy 2 Reverse Proxy (:81) ]
              │  Reverse Proxy -> localhost:3000
              ▼
[ Next.js 16 (Bun / Node Runtime) ]
              │
    ┌─────────┴────────────────────────────────────────┐
    ▼                                                  ▼
[ Static Entrypoint: src/app/[[...slug]]/page.tsx ]   [ REST APIs: src/app/api/* ]
    │                                                  │
    ▼                                                  ▼
[ Zustand Global Store (currentView State) ]          [ Prisma Client Singleton ]
    │                                                  │
    ▼                                                  ▼
[ Dynamic View Resolver (84 Lazy Components) ]       [ MySQL 8.0 Database Cluster ]
```

* **Instantaneous Navigation**: Page switching updates the Zustand `currentView` store, causing the view dispatcher to swap views with Framer Motion animations with **0ms full-page reloads**.
* **Persistent Shell Architecture**: Sidebars, top bars, audio players, and floating companions stay continuously mounted across route changes.

---

## 📂 Repository Structure

```text
shijlai-academy-latest/
├── Caddyfile                   # Caddy reverse proxy routing (Port 81 -> 3000)
├── components.json             # shadcn/ui components configuration
├── docs/                       # Comprehensive architectural & thesis documentation
│   ├── AI_modules.md           # 36 AI modules technical specifications
│   ├── database_design.md      # 148-model relational schema documentation
│   ├── features_summary.md     # Complete feature catalog across all 3 portals
│   ├── system_architecture.md  # System architecture & SPA-in-SSR design
│   ├── user_manual.md          # Multi-role platform user handbook
│   ├── admin-portal/           # Admin portal deep-dive documentation
│   ├── instructor-portal/      # Instructor portal deep-dive documentation
│   └── student-portal/         # Student portal deep-dive documentation
├── package.json                # Project dependencies, scripts & metadata
├── postcss.config.mjs          # PostCSS configuration for Tailwind CSS 4
├── prisma/                     # Database schema & seeding
│   ├── schema.prisma           # Master MySQL schema (148 models)
│   └── seed.ts                 # Production-grade seed script
├── public/                     # Static public assets
│   ├── fonts/                  # Custom brand typography (ScriptMTBold, LatinModernRoman)
│   ├── course-thumbnails/      # Auto-generated SVG/PNG course artwork
│   └── brand-logo.png          # High-resolution platform logos and favicons
├── scripts/                    # Build & asset automation
│   ├── apply-brand-fonts.js    # JSX typography post-processor
│   └── postbuild.js            # Standalone build asset bundler
├── src/                        # Platform source code
│   ├── app/                    # Next.js App Router entry points
│   │   ├── [[...slug]]/page.tsx# Central Dynamic SPA View Resolver
│   │   ├── api/                # 200+ RESTful API endpoints
│   │   ├── globals.css         # Tailwind tokens, CSS variables & animations
│   │   └── layout.tsx          # Root layout shell & metadata
│   ├── components/             # Reusable UI component architecture
│   │   ├── admin/              # Specialized admin management views & controls
│   │   ├── ai/                 # Socratic tutor interfaces, companions, interviewers
│   │   ├── creator/            # 6-step interactive course authoring studio
│   │   ├── instructor/         # Instructor performance cards, rosters, and tools
│   │   ├── messaging/          # Real-time chat bubbles, headers, emoji pickers
│   │   ├── student/            # Student study trackers, streak indicators, cards
│   │   ├── ui/                 # 45 shadcn/ui atomic components
│   │   └── views/              # 71 modular, lazy-loaded screen views
│   ├── hooks/                  # Custom React hooks (learning events, viewport, toasts)
│   ├── lib/                    # Core utilities, types, database clients, and Zustand store
│   │   ├── db.ts               # Production Prisma client singleton
│   │   ├── email.ts            # Transporter & responsive HTML email templates
│   │   ├── store.ts            # Global Zustand navigation and session state
│   │   └── types.ts            # Unified TypeScript domain definitions
│   └── services/               # Isolated backend business logic
│       ├── ai/                 # Google Gemini provider, config manager, thumbnail engine
│       └── learning-engine/    # 7-service adaptive learning engine
├── tailwind.config.ts          # Tailwind CSS design system extensions
└── tsconfig.json               # TypeScript compiler configuration
```

---

## 🚀 Quickstart & Installation Guide

### Prerequisites
* **Node.js**: `v20.x` or higher *(or **Bun**: `v1.2`+)*
* **MySQL Server**: `8.0`+ *(Local instance or Cloud DB such as PlanetScale, AWS RDS, or Aiven)*
* **Google Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/yaldram81/shijlai-academy-latest.git
cd shijlai-academy-latest
```

---

### Step 2: Install Dependencies
```bash
npm install
# or with Bun:
bun install
```

---

### Step 3: Configure Environment Variables
Create a `.env` file in the project root:
```env
# Database Connection (MySQL)
DATABASE_URL="mysql://root:yourpassword@localhost:3306/shijlai_academy_db"

# Google Gemini API Key
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"

# Base Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# SMTP Mail Server (Optional for transactional emails)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-char-app-password"
SMTP_FROM_NAME="ShijlAI Academy"
```

---

### Step 4: Initialize the Database Schema
Push the schema to MySQL and compile the typed Prisma Client:
```bash
# Push schema tables and relations directly to MySQL
npm run db:push

# Generate typed Prisma Client
npm run db:generate
```

---

### Step 5: Seed Demo Curriculum & Accounts
Execute the comprehensive seeder to populate courses, modules, lessons, quizzes, discussions, and sample users across all three roles:
```bash
npx tsx prisma/seed.ts
```

---

### Step 6: Launch Development Server
```bash
npm run dev
# or:
bun run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Turnkey Demonstration Credentials

The database seeder pre-configures testing accounts across all three platform roles:

| Role | Email Address | Password | Operational Access |
| :--- | :--- | :--- | :--- |
| 🎓 **Student** | `ahmed.khan@shijlai.com` | `demo123` | Course Player, Ask ShijlAI, Mock Interviewer, Hub, Skills Graph, Gamification |
| 👨‍🏫 **Instructor** | `sara.malik@shijlai.com` | `demo123` | 6-Step Creator, AI Teaching Copilot, Smart Assessment, Analytics, Q&A |
| 🛡️ **Administrator** | `admin@shijlai.com` | `demo123` | Admin Copilot, System Intelligence, Quality Analyzer, AI Governance, Finances |

---

## ⚙️ Environment Configuration Reference

| Environment Variable | Required | Description | Default / Example |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | MySQL connection URI with credentials and database name | `mysql://root:pass@localhost:3306/db` |
| `GEMINI_API_KEY` | **Yes** | Google Gemini API key for Generative AI operations | `AIzaSy...` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Host address used for callback URLs and certificate links | `http://localhost:3000` |
| `SMTP_HOST` | Optional | SMTP mail host for verification codes and receipts | `smtp.gmail.com` |
| `SMTP_PORT` | Optional | SMTP port (typically 587 for TLS) | `587` |
| `SMTP_USER` | Optional | SMTP username / sender account | `noreply@shijlai.com` |
| `SMTP_PASS` | Optional | SMTP password or app-specific authentication token | `xxxx xxxx xxxx xxxx` |
| `SMTP_FROM_NAME` | Optional | Display name on dispatched transactional emails | `ShijlAI Academy` |

---

## 🚢 Production Deployment & Proxy Topology

### Option A: Standalone High-Performance Server
```bash
# 1. Build optimized standalone bundle and execute post-build assets copy
npm run build

# 2. Launch production standalone server
npm run start
# or:
NODE_ENV=production node .next/standalone/server.js
```

### Option B: Caddy Reverse Proxy
A pre-configured [Caddyfile](Caddyfile) is included in the project root:
```bash
caddy run --config Caddyfile
```
Caddy handles automatic HTTPS certificate provisioning and proxies incoming port 80/443 traffic to the local Next.js instance on port 3000.

---

## 🎓 Academic Heritage, Citations & Research Provenance

This platform was conceived, developed, and defended as a **Final Year Project (FYP) Capstone** at:
* **Institution**: **University of Malakand** (UOM), Khyber Pakhtunkhwa, Pakistan
* **Department**: Department of Computer Science & Information Technology
* **Degree Program**: Bachelor of Science in Computer Science (BSCS)
* **Lead Engineers & Authors**:
  * **Tanzeel Ur Rahman**
  * **Israr Ullah**
* **Project Profile & Source Repositories**: [github.com/yaldram81](https://github.com/yaldram81)

### Foundational Research Citations
1. **Corbett, A. T., & Anderson, J. R.** (1994). *Knowledge tracing: Modeling the acquisition of procedural knowledge*. User Modeling and User-Adapted Interaction, 4(4), 253-278.
2. **Ebbinghaus, H.** (1885). *Memory: A Contribution to Experimental Psychology*. Teachers College, Columbia University.
3. **Bloom, B. S.** (1956). *Taxonomy of Educational Objectives: The Classification of Educational Goals*. Longmans, Green.
4. **Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, Ł., & Polosukhin, I.** (2017). *Attention Is All You Need*. Advances in Neural Information Processing Systems (NeurIPS 2017).

---

## 📜 License & Acknowledgments

This project is open-source under the terms of the **[MIT License](LICENSE)**.

Special gratitude to the faculty and advisors of the **Department of Computer Science & IT at the University of Malakand** for their technical guidance, academic mentorship, and unwavering support throughout the research and implementation of this capstone platform.

---

<div align="center">

**ShijlAI Academy — Pioneering the Future of Cognitive Learning.**  
*© 2025–2026 Tanzeel Ur Rahman & Israr Ullah. All rights reserved.*

</div>
