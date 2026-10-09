<div align="center">

# 🎓 ShijlAI Academy
### *Next-Generation AI-Native Hyper-Personalized LMS & Learning Intelligence Platform*

[![Next.js 16](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.11-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL 8.0](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Google Gemini](https://img.shields.io/badge/AI_Core-Gemini_2.5_Flash_%2F_Pro-8E75C2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Bun Runtime](https://img.shields.io/badge/Bun-1.3-FBF0DF?style=for-the-badge&logo=bun&logoColor=black)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

<br/>

**Architected for Cognitive Mastery, Adaptive Pedagogy, and Institutional Intelligence**  
*Final Year Project (FYP) Thesis — Department of Computer Science & IT, University of Malakand*  
**Authors**: Tanzeel Ur Rahman • Israr Ullah

---

</div>

## 🌟 Executive Summary

**ShijlAI Academy** is a state-of-the-art, enterprise-grade educational ecosystem engineered from the ground up to replace static, monolithic Learning Management Systems (LMS) with an **AI-native, adaptive cognitive engine**. 

Built specifically to cater to high-stakes academic curricula (FSc Pre-Medical/Pre-Engineering, Cambridge O/A-Levels, IELTS, AWS Cloud Architectures) as well as emerging international syllabi, ShijlAI Academy converges:
1. **A Single-Page-Application (SPA) within Next.js 16 SSR**: Zero full-page refreshes, persistent layout shells, and 84+ lazy-loaded views driven by dynamic Zustand state routing.
2. **A 7-Service Adaptive Learning Engine**: Continuous Bayesian Knowledge Tracing (BKT), Ebbinghaus time-decay curves, real-time engagement telemetry, and predictive dropout mitigation.
3. **An Autonomous Triple-Helix Portal System**: Seamless, role-tailored environments for **Students**, **Instructors**, and **Platform Administrators**.
4. **Enterprise Multi-LLM Governance**: Google Gemini 2.5 integration with token-budget enforcement, dynamic model routing (`fast` vs `deep` reasoning), schema-enforced structured generation, multi-key rotation, and zero-downtime failover fabrics.
5. **Emerging Market Localization**: Native Pakistani Rupee (PKR) billing rails (JazzCash, EasyPaisa, Bank Transfer, Stripe), dual English/Urdu pedagogical adaptations, and low-bandwidth asset optimizations.

---

## 📊 Platform Scale at a Glance

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SHIJLAI ACADEMY PLATFORM SCALE                       │
├───────────────────────────────┬─────────────────────────────────────────────┤
│  Total Source Code            │  ~196,000+ Lines of TypeScript / TSX        │
│  Prisma Database Models       │  148 Models across 15 Bounded Contexts      │
│  RESTful API Endpoints        │  200+ Secure Route Handlers                 │
│  Dedicated AI Endpoints       │  57 Neural API Endpoints                    │
│  Cross-Portal AI Features     │  36 Distinct AI Pedagogical Tools           │
│  Interactive Frontend Views   │  84 Lazy-Loaded Dynamic Modules             │
│  UI Component Primitives      │  45 shadcn/ui + Radix UI Atomic Components   │
│  Adaptive Learning Services   │  7 Mathematical & Heuristic Core Engines    │
└───────────────────────────────┴─────────────────────────────────────────────┘
```

---

## 🏛️ System Architecture: The Triple-Helix Portals

ShijlAI Academy unifies three distinct user tiers under an ultra-fluid, client-side routed architecture:

```mermaid
graph TD
    User([User Request / Session]) --> AuthGateway{Role Authorization}
    
    AuthGateway -->|student| StudentPortal[Student Portal: 22 Views / 8 AI Features]
    AuthGateway -->|instructor| InstructorPortal[Instructor Portal: 17 Views / 14 AI Tools]
    AuthGateway -->|admin| AdminPortal[Admin Portal: 27 Views / 6 AI Engines]
    AuthGateway -->|unauthenticated| PublicPortal[Public Catalog & Landing: 8 Views]

    subgraph CoreEngine [Shared Learning & Intelligence Fabric]
        ALE[7-Service Adaptive Learning Engine]
        LLM[Google Gemini 2.5 Multi-Key Governance]
        DB[(MySQL 8.0 / Prisma 148 Models)]
    end

    StudentPortal --> CoreEngine
    InstructorPortal --> CoreEngine
    AdminPortal --> CoreEngine
```

---

### 1. 🎓 The Student Portal (22 Views, 8 Deep AI Features)
*Designed to transform passive viewers into active, self-regulating master learners.*

* **Ask ShijlAI (Multi-Modal Socratic Tutor)**: A conversational AI mentor supporting 6 specialized pedagogical modes:
  * `Tutor Mode`: Guides students using guided questioning rather than spoon-feeding answers.
  * `Coding Agent`: Syntax-aware interactive code debugger and algorithmic mentor.
  * `Quiz Generator`: On-demand diagnostic checks tailored to the active lesson.
  * `Concept Explainer`: ELI5 (Explain Like I'm 5) vs. Academic rigor toggle.
  * `Lesson Summarizer`: Executive summaries, formula cheatsheets, and mind maps.
  * `Bilingual Translator`: Instant conceptual translation between English and Urdu.
* **AI Learning Companion (Proactive FAB)**: A persistent, floating agent with 3 selectable personalities (*Encouraging*, *Rigorous*, *Casual*) that proactively alerts students when their engagement dips or revision decay thresholds are breached.
* **AI Mock Technical Interviewer**: Full simulated interview simulator across 4 engineering domains (Fullstack, Frontend, Backend, Data Science) across 3 real-world difficulty levels, providing real-time transcripts, performance rubrics, and hiring scores.
* **Topic Mastery & Interactive Skill Graph**: A visual dependency graph illustrating prerequisite pathways, current node mastery levels, and decay warnings using Bayesian decay formulas.
* **Immersive Course Player**: Integrated video playback, timestamped Markdown note-taking, speed alteration, instant Q&A sidebar, automated progress tracking, and gamified XP triggers.
* **Full Gamification System**: Real-time XP awarding, levels, consecutive streak trackers, ShijlCoin virtual currency, unlockable achievement badges, reward shop, and regional leaderboards.

---

### 2. 👨‍🏫 The Instructor Portal (17 Views, 14+ AI Features)
*Empowering educators with an enterprise-grade curriculum creation studio and real-time class diagnostics.*

* **AI Teaching Copilot (11 Pedagogical Tools)**:
  * Course Syllabus & Curriculum Architect
  * Bloom's Taxonomy Learning Objective Generator
  * Lecture Script & Video Outline Generator
  * Automated Rubric Synthesizer
  * AI Slide Outline & Presentation Formatter
  * Concept Reading & Markdown Note Generator
  * Discussion Prompt & Forum Topic Generator
  * Coding Exercise & Test Suite Creator
  * Case Study & Practical Problem Generator
  * Glossary & Key Terminology Extractor
  * Differentiated Instruction Customizer
* **6-Step Course Creator Wizard**: Rapid end-to-end authoring (Basics $\rightarrow$ Curriculum $\rightarrow$ Lessons & Media $\rightarrow$ Pricing & Tiers $\rightarrow$ SEO & Metadata $\rightarrow$ Review & Publish).
* **Automated Branded Thumbnail Generator**: Generates 4 professional high-resolution vector/gradient thumbnails on demand using SVG templates rendered to PNG via `sharp`.
* **Smart Assessment Engine**: Multi-dimensional grading assistance, automated rubric scoring, feedback synthesis, and student submission diagnostics.
* **Intelligent Teaching Analytics**: Cohort drop-off funnels, video engagement heatmaps, quiz failure clustering, and revenue payout tracking.
* **AI Q&A & Messaging Assistant**: Auto-drafts suggested context-aware responses to student questions for instructor one-click review and dispatch.

---

### 3. 🛡️ The Admin Portal (27 Views, 6 AI Engines)
*Institutional oversight, platform governance, and automated operational intelligence.*

* **Admin Decision Intelligence Copilot**: 3-stage query decomposition pipeline routing administrative questions across 9 operational intents with real-time database synthesis.
* **5 System Intelligence Engines**:
  1. *Anomaly Detection Engine*: Flags anomalous spikes in student drop-offs or abnormal API usage.
  2. *Sentiment Analysis Engine*: Monitors course reviews and community threads for early warnings.
  3. *Platform Health & Capacity Engine*: Live latency, error-rate telemetry, and resource forecasts.
  4. *Revenue Forecasting Engine*: Univariate and linear regression models forecasting 30/60/90-day cash flows.
  5. *Fraud & Academic Integrity Engine*: Detects credential sharing, suspicious quiz completions, and payment irregularities.
* **5-Dimensional Course Quality Analyzer**: Algorithmic & LLM review evaluating *Pedagogical Clarity*, *Syllabus Completeness*, *Assessment Rigor*, *Media Quality*, and *Market Competitiveness*.
* **Global AI Configuration & Governance Fabric**: Real-time provider management, model pricing parameters, token threshold quotas, prompt template versioning, and comprehensive security audit logging.
* **Financial Management & Escrow**: Complete handling of instructor revenue splits, platform commissions, JazzCash / EasyPaisa transaction reconciliation, and automated invoice PDF generation.

---

## 🧠 The 7-Service Adaptive Learning Engine

At the heart of ShijlAI Academy lies a proprietary **7-service adaptive learning engine** that powers hyper-personalized education:

```
[ User Action / Telemetry ]
           │
           ▼
 1. Event Ingestion Service  ──────► Logs view, pause, quiz, code, forum events
           │
           ▼
 2. Feature Engine           ──────► Computes: Speed, Engagement, Consistency, DropRisk
           │
           ▼
 3. Profile Service          ──────► Updates Dynamic Student Persona & Capability Matrix
           │
           ▼
 4. Mastery Engine           ──────► Bayesian Knowledge Tracing + Ebbinghaus Decay:
           │                         M(t) = M_0 * e^(-λ * Δt)
           ▼
 5. Recommendation Engine    ──────► Multi-Heuristic Priority Scoring (Gap, Reinforce, Next)
           │
           ▼
 6. Study Planner Service    ──────► Constraint-Optimized Daily/Weekly Study Timetables
           │
           ▼
 7. Feedback & Intervention  ──────► Triggers Proactive Companion FAB Alerts & Quizzes
```

### Mathematical Foundations
* **Predictive Dropout Risk Score ($0 \le R_{drop} \le 100$)**:
  $$R_{drop} = w_1 \cdot (1 - \text{Consistency}) + w_2 \cdot (1 - \text{Engagement}) + w_3 \cdot \text{DecayPenalty} + w_4 \cdot \text{FailureRate}$$
* **Memory Retention Decay Formula**:
  $$S(t) = S_0 \cdot \exp\left(-\frac{\Delta t}{\tau \cdot (1 + \text{Reinforcements})}\right)$$
* **Weighted Topic Mastery Score**:
  $$\text{Mastery} = \frac{\sum_{i=1}^n w_i \cdot \text{Score}_i \cdot \text{Difficulty}_i}{\sum_{i=1}^n w_i \cdot \text{Difficulty}_i}$$

---

## 🛠️ Technology Stack & Engineering Matrix

| Layer | Technologies & Libraries |
| :--- | :--- |
| **Frontend Framework** | **Next.js 16.1** (App Router SPA-in-SSR) with **React 19.0** |
| **State & Data Fetching** | **Zustand 5.0** (with LocalStorage persistence) & **TanStack React Query 5** |
| **Styling & Design System** | **Tailwind CSS 4.x**, **shadcn/ui** (45 components), **Radix UI Primitives** |
| **Motion & Micro-interactions** | **Framer Motion 12.x**, **tw-animate-css** |
| **Data Visualization** | **Recharts 2.15**, Custom SVG Knowledge Graphs |
| **Rich Text & Content** | **Tiptap 3.27**, **MDXEditor 3.39**, **React Markdown**, **SyntaxHighlighter** |
| **Runtime & Server** | **Bun 1.3** / **Node.js 20+**, Next.js Standalone Server, **Caddy 2 Proxy** |
| **Database & ORM** | **MySQL 8.0+**, **Prisma ORM 6.11** (148 production models, CUID keys) |
| **AI Orchestration** | **Google Gemini 2.5 Flash & Pro** (`@google/genai`), Multi-Key Failover |
| **Image & Media Processing** | **Sharp 0.34** (Vector-to-PNG Rasterization, Image Crop), **React Player** |
| **Document Generation** | **Docx 9.7**, **jsPDF 4.2**, **html2canvas 1.4**, **PapaParse 5.5** |
| **Communication & Mail** | **Nodemailer 7.0** (HTML email templating with OTP & Invoice dispatch) |

---

## 📁 Repository Directory Structure

```text
shijlai-academy-latest/
├── Caddyfile                   # Reverse proxy configuration (Port 81 -> 3000)
├── components.json             # shadcn/ui components configuration
├── docs/                       # Comprehensive architectural & thesis documentation
│   ├── AI_modules.md           # Exhaustive technical documentation of all 36 AI modules
│   ├── database_design.md      # Detailed database schema design & ER specifications
│   ├── features_summary.md     # Catalog of all portal features and API endpoints
│   ├── system_architecture.md  # Deep architectural design and data flow breakdown
│   ├── user_manual.md          # Multi-role platform operational user manual
│   ├── admin-portal/           # Admin portal deep-dive documentation
│   ├── instructor-portal/      # Instructor portal deep-dive documentation
│   └── student-portal/         # Student portal deep-dive documentation
├── package.json                # Dependencies, build scripts, and engine specifications
├── postcss.config.mjs          # PostCSS configuration for Tailwind CSS 4
├── prisma/                     # Database layer
│   ├── schema.prisma           # Master 148-model MySQL schema definition
│   └── seed.ts                 # Seeding script with courses, users, and curriculum data
├── public/                     # Public static assets
│   ├── fonts/                  # Custom brand typography (ScriptMTBold, LatinModernRoman)
│   ├── course-thumbnails/      # Auto-generated course artwork
│   └── brand-logo.png          # High-resolution platform logos and favicons
├── scripts/                    # Build & utility scripts
│   ├── apply-brand-fonts.js    # Automated brand typography post-processor
│   └── postbuild.js            # Next.js standalone artifact bundler
├── src/                        # Core application source
│   ├── app/                    # Next.js App Router entry points
│   │   ├── [[...slug]]/page.tsx# Central Dynamic SPA View Resolver
│   │   ├── api/                # 200+ RESTful API route handlers
│   │   ├── globals.css         # Design system tokens, color palettes, and animations
│   │   └── layout.tsx          # Root HTML layout with providers and metadata
│   ├── components/             # Reusable UI component architecture
│   │   ├── admin/              # Specialized admin management views & controls
│   │   ├── ai/                 # Socratic tutor interfaces, companions, and interviewers
│   │   ├── creator/            # 6-step interactive course authoring studio
│   │   ├── instructor/         # Instructor performance cards, rosters, and tools
│   │   ├── messaging/          # Real-time chat bubbles, headers, and emoji pickers
│   │   ├── student/            # Student study trackers, streak indicators, and cards
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
* **MySQL**: `8.0`+ *(Local instance or Cloud DB such as PlanetScale, AWS RDS, or Aiven)*
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
# or if using Bun:
bun install
```

---

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory (refer to [Environment Variables](#-environment-variables-reference) below):
```env
# Database Connection (MySQL)
DATABASE_URL="mysql://root:yourpassword@localhost:3306/shijlai_academy_db"

# Google Gemini AI Key
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"

# Application Base URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# SMTP Mail Server (e.g. Gmail App Password or SendGrid)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-char-app-password"
SMTP_FROM_NAME="ShijlAI Academy"
```

---

### Step 4: Initialize the Database
Push the schema to MySQL and generate the Prisma Client:
```bash
# Push schema tables and relations directly to MySQL
npm run db:push

# Generate typed Prisma Client
npm run db:generate
```

---

### Step 5: Seed Demo Curriculum & Accounts
Populate your database with courses, modules, lessons, quizzes, discussions, and sample users across all three roles:
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

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Access Profiles

The seeder initializes turnkey testing accounts for all three portals:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Student** | `student@example.com` | `password123` | Course Player, Ask ShijlAI, Mock Interview, Hub, Skills Graph, Gamification |
| **Instructor** | `instructor@example.com` | `password123` | 6-Step Creator, AI Teaching Copilot, Smart Assessment, Analytics, Q&A |
| **Administrator** | `admin@example.com` | `password123` | Admin Copilot, System Intelligence, Quality Analyzer, AI Governance, Finances |

---

## ⚙️ Environment Variables Reference

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | MySQL connection URI including credentials and database name | `mysql://root:pass@localhost:3306/db` |
| `GEMINI_API_KEY` | **Yes** | API Key for Google Gemini 2.5 Flash / Pro models | `AIzaSy...` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Fully qualified public URL of the platform | `http://localhost:3000` |
| `SMTP_HOST` | Optional | SMTP server hostname for transactional emails | `smtp.gmail.com` |
| `SMTP_PORT` | Optional | SMTP connection port (typically 587 for TLS) | `587` |
| `SMTP_USER` | Optional | SMTP authentication username / sender address | `noreply@shijlai.com` |
| `SMTP_PASS` | Optional | SMTP authentication password or app-specific password | `xxxx xxxx xxxx xxxx` |
| `SMTP_FROM_NAME` | Optional | Sender display name appearing on dispatched emails | `ShijlAI Academy` |

---

## 🚢 Production Deployment

### Option A: Standalone Node / Bun Server
```bash
# 1. Build optimized standalone bundle and execute post-build assets copy
npm run build

# 2. Start high-performance production server
npm run start
# or:
NODE_ENV=production node .next/standalone/server.js
```

### Option B: Caddy Reverse Proxy
A pre-configured [Caddyfile](Caddyfile) is included in the project root:
```bash
caddy run --config Caddyfile
```
Caddy handles automatic HTTPS certificate provisioning, proxying traffic from port 80/443 to the local Next.js instance on port 3000.

---

## 🎓 Academic Provenance & Research Heritage

This project was conceived, designed, and defended as a **Final Year Project (FYP) Thesis** at:
* **Institution**: **University of Malakand** (UOM), Khyber Pakhtunkhwa, Pakistan
* **Department**: Department of Computer Science & Information Technology
* **Program**: Bachelor of Science in Computer Science (BSCS)
* **Lead Engineers & Authors**:
  * **Tanzeel Ur Rahman**
  * **Israr Ullah**
* **Departmental Profile & Repositories**: [github.com/yaldram81](https://github.com/yaldram81)

### Research Citations & IEEE Reference Foundation
ShijlAI Academy's adaptive engine synthesizes foundational research in knowledge modeling and cognitive science, notably:
* *Corbett, A. T., & Anderson, J. R.* (1994). **Knowledge tracing: Modeling the acquisition of procedural knowledge**. *User Modeling and User-Adapted Interaction*.
* *Ebbinghaus, H.* (1885). **Memory: A Contribution to Experimental Psychology**. *Teachers College, Columbia University*.
* *Bloom, B. S.* (1956). **Taxonomy of Educational Objectives: The Classification of Educational Goals**. *Longmans, Green*.
* *Vaswani, A., et al.* (2017). **Attention Is All You Need**. *Advances in Neural Information Processing Systems (NeurIPS)*.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.  
Academic institutions, researchers, and open-source contributors are welcome to study, adapt, and build upon this platform with appropriate scholarly attribution.

---

<div align="center">

**Built with passion, rigor, and intelligence for the learners of tomorrow.**  
*© 2025–2026 ShijlAI Academy. All rights reserved.*

</div>
