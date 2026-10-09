# APPENDIX K — PROJECT ARTIFACTS AND RESOURCES

**ShijlAI Academy — An AI-Powered Personalised Learning Platform**

---

## K.1 Source Code Repository

The complete source code of ShijlAI Academy is version-controlled and hosted on GitHub. The repositories contain the frontend application files, API route handlers, database schema declarations, process automation scripts, and project configuration layouts.

| Repository | Purpose | Visibility |
|---|---|---|
| `shijlai-academy-latest` | Main platform production-ready source code repository. | Private |
| `shijlai-academy-backup` | Backup snapshot and historical development records. | Public |
| `supporting-repositories` | Experimental features and supplementary script modules. | Private / Public |

The hosting profile and related public projects can be inspected at the primary development workspace link:
* [GitHub Profile](https://github.com/yaldram81)

> [!WARNING]
> *Sensitive credentials, including active API tokens, private passwords, cryptographic keys, NextAuth session secrets, and production database connection strings, have been omitted from all repository files and documentation assets to maintain system security.*

---

## K.2 Repository Structure

The physical directory hierarchy of the ShijlAI Academy codebase is structured as a standalone Next.js application. Below is the mapping of directories and their operational purposes within the project lifecycle:

```text
shijlai-academy/
├── .zscripts/             # Production build and server environment process scripts
├── docs/                  # Technical design documents and visual interface assets
├── prisma/                # Prisma ORM schemas, database migrations, and seed scripts
│   └── db/                # Directory containing local SQLite database instances
├── public/                # Static public assets (images, icons, brand fonts)
├── scripts/               # Global utility scripts and post-build configurations
├── src/                   # Main application source directory
│   ├── app/               # Next.js App Router entry points and API route endpoints
│   │   ├── api/           # Backend routing controllers (233 endpoint files)
│   │   └── globals.css    # Central styling specifications and custom animations
│   ├── components/        # Frontend UI components grouped by visual portal layout
│   │   ├── views/         # Dynamicaly loaded view files (57 view modules)
│   │   └── ui/            # UI components and layout primitives (48 components)
│   ├── hooks/             # Custom React state hooks (mobile view check, layout alerts)
│   └── lib/               # Global store configurations, email builders, and types
└── package.json           # Application dependencies and lifecycle build commands
```

### Directory Descriptions

| Directory | Description |
|---|---|
| `src/app/page.tsx` | Main entry point of the Single Page Application, running Zustund-driven navigation. |
| `src/app/api` | API directory structure grouping 233 route-handler controllers (Auth, Admin, Instructor, Student). |
| `src/components/views` | Modular components representing individual UI pages dynamically loaded via `React.lazy`. |
| `src/components/ui` | Modular layout component primitives generated from shadcn/ui. |
| `src/lib/store.ts` | Zustand global store configurations controlling theme, authentication state, and caching. |
| `src/lib/types.ts` | Complete TypeScript type definitions including view interfaces and API payload types. |
| `prisma/schema.prisma` | Master database schema definition specifying relation models and tables. |
| `prisma/seed.ts` | Database seeding engine containing mock curriculum, users, and activity data. |

---

## K.3 Development Environment

The development environment of the platform utilizes modern runtime tools and frameworks to ensure low execution latency and robust compilation checks.

| Component | Standard / Version | Purpose |
|---|---|---|
| **Operating System** | Windows 11 / Ubuntu Linux 22.04 LTS | Core development and server hosting platforms. |
| **Runtime Environment** | Bun v1.0+ / Node.js v18+ | JavaScript runtime engine and module installer. |
| **Language Dialect** | TypeScript v5.x | Enforcing static compile-time type verification. |
| **Frontend UI Framework** | Next.js v16.1 (React v19.0) | Application wrapper serving the client-side SPA. |
| **Database Engine** | SQLite v3 (Development) / MySQL v8.0 | Relational database storage engine. |
| **Object Relational Mapper** | Prisma ORM v6.11 | Data modeling and automated SQL query generation. |
| **State Management** | Zustand v5.0 | Lightweight global client state manager. |
| **Styling Framework** | Tailwind CSS v4.x | Utility-first cascading stylesheet layout architecture. |

---

## K.4 External Services

ShijlAI Academy integrates several external services to deliver personalized AI mentoring and support operational workflows:

| Service | Protocol / API | Purpose |
|---|---|---|
| **Google Gemini API** | HTTPS / JSON REST API | Core generative intelligence engine driving prompt processing. |
| **z-ai-web-dev-sdk** | Client SDK Package | Integration layer for speech transcription, text-to-speech, and image generation. |
| **SMTP Mail Server** | SMTP Protocol (Port 587) | Dispatching user verification codes (OTP), invoice receipts, and alerts. |
| **Caddy Server** | Reverse Proxy (HTTPS redirection) | Routing incoming web traffic (ports 80/443) to local Node.js process (port 3000). |

---

## K.5 Database Resources

Database definitions, mapping operations, and generation assets are compiled in the `/prisma` directory:

* **Prisma Schema (`prisma/schema.prisma`):** The central database configuration file detailing 40+ relational models and fields representing the entire platform.
* **Database Seed (`prisma/seed.ts`):** A comprehensive 2,227-line script setting up administrative credentials, initial course lists, student progress trees, test scores, and community forum threads.
* **Local Database (`prisma/db/custom.db`):** The local SQLite instance containing seeded structures used during verification.

---

## K.6 Deployment Resources

Automation files and configuration scripts are stored within the root directory and the `.zscripts` folder to simplify platform updates and maintenance:

* **`.zscripts/build.sh`:** Builds the platform code into a optimized Next.js standalone execution package.
* **`.zscripts/dev.sh` & `start.sh`:** Handles execution routines and keeps the development node process running.
* **`Caddyfile`:** Production config routing platform traffic, redirecting HTTP to secure HTTPS, and handling port mapping.
* **`.env.example`:** Configuration template highlighting environment dependencies (`DATABASE_URL`, `NEXTAUTH_SECRET`) while keeping credentials omitted.

---

## K.7 AI Resources

The core AI engines and components powering ShijlAI Academy's personalized learning flows are organized under the following assets:

* **Prompt Engineering Configurations:** In-source system instructions defining the behavior profiles of the five AI modes (Tutor, Quiz, Assignment Helper, Study Planner, Career Advisor).
* **Intelligence Processing Routes (`src/app/api/ai`):** Route endpoints handling the translation of client contexts (current course, page ID, past session chat) into structured prompts for Vertex AI.
* **Proactive Engagement Engine (`src/components/views/learning-companion-view.tsx`):** Front-end tracking system monitoring study statistics to generate personalized intervention suggestions and focus recommendations.

---

## K.8 Documentation Resources

System configurations and technical design document files are maintained in the `/docs` directory:

* **`docs/system_architecture.md`:** Diagrams and structural descriptions mapping the routing and storage flows of the Next.js SPA.
* **`docs/database_design.md`:** Exhaustive mapping of all table properties, constraints, unique keys, and relationship structures.
* **`docs/AI_modules.md`:** Architectural descriptions of prompt flows, Vertex API parameters, and conversation caching structures.
* **`docs/features_summary.md`:** Summaries documenting available platform capabilities across the Student, Instructor, and Admin portals.
* **`docs/screenshots.md`:** Archive of visual screenshots highlighting UI states during execution.

---

## K.9 Demonstration Resources

Demonstration systems and login profiles are set up inside the system seeder to facilitate evaluator inspection:

* **Setted Profiles:** Preloaded profiles corresponding to Student (`student@example.com`), Instructor (`instructor@example.com`), and Administrator (`admin@example.com`) roles.
* **Interactive Seeding Endpoint (`/api/seed`):** Direct trigger path enabling developers to reset and re-seed the environment from a browser.

---

## K.10 Project Statistics

The following statistics describe the scale, complexity, and structural contents of the ShijlAI Academy implementation:

| Metric | Measured Value |
|---|---|
| **Total Source Files (.ts / .tsx)** | 419 files |
| **Total Source Lines of Code** | ~196,949 lines |
| **API Route Files** | 233 files |
| **View Components (Pages)** | 57 components (~79,863 lines) |
| **Admin UI Components** | 32 components (~36,021 lines) |
| **UI Primitives (shadcn/ui)** | 48 components |
| **Prisma Models** | 40+ models |
| **Prisma Schema Lines** | 2,490 lines |
| **Database Seed Script Lines** | 2,227 lines |
| **Zustand Store Lines** | 214 lines |
| **Type Definition Lines** | 665 lines |
| **View Switcher Union Keys** | 80+ keys |
| **Lazy-Loaded View Config Entries** | 91 entries |
| **Largest View Module** | `course-player-view.tsx` (3,252 lines) |
| **Largest Layout Shell** | `instructor-shell.tsx` (1,017 lines) |
| **Largest Admin Component** | `admin-course-management.tsx` (2,636 lines) |
| **Primary Database Type** | SQLite (`db/custom.db`) |
| **Application Runtime Environment** | Bun + Next.js 16 (Standalone Output) |
| **Local Proxy System** | Caddy Proxy (Port 81 → 3000) |
| **Installed npm Package Dependencies** | 47 dependencies (38 Runtime + 9 Development) |

---

*End of Appendix K*
