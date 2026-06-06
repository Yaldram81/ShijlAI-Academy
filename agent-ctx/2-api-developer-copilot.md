# Task 2 — AI Admin Copilot API

## Agent: API Developer
## Task: Build the Admin Copilot backend API at `/src/app/api/admin/copilot/route.ts`

## Work Log

- Read worklog.md — understood prior work on Skill Graph, Learning Paths, AI Companion, Mock Interview, and System Intelligence APIs
- Read Prisma schema — confirmed all available models (User, Course, Enrollment, QuizAttempt, Review, Transaction, QAQuestion, QAAnswer, etc.)
- Read existing admin API patterns from system-intelligence route and generate-insights route
- Read z-ai-web-dev-sdk usage patterns across the codebase
- Created `/src/app/api/admin/copilot/route.ts` (~680 lines) with 4-module architecture:

### Module 1: Intent Detection Engine
- 9 intents: course_analysis, instructor_analysis, student_analysis, engagement_analysis, enrollment_analysis, risk_analysis, report_generation, search, platform_overview
- Keyword arrays with multi-word scoring (longer phrases score higher)
- Word-level boost system for individual important words (risk, urgent, immediate, inactive, etc.)
- Fallback to platform_overview when no clear match

### Module 2: Data Retrieval Engine
- **course_analysis**: Fetches courses with enrollments, reviews, computes completion rates, ratings, identifies underperforming
- **instructor_analysis**: Fetches instructors with courses, Q&A answers, computes effectiveness scores, response times, warnings
- **student_analysis**: Fetches students with enrollments, quiz attempts, learning profiles, identifies at-risk/inactive/failing
- **engagement_analysis**: Daily/weekly/monthly active users, AI usage, course engagement scores
- **enrollment_analysis**: Enrollment counts, trends, popular/declining courses
- **risk_analysis**: Aggregates course + instructor + student data, identifies critical/high/medium risks
- **search**: Parses query for patterns (e.g., "inactive for N days"), returns matching results
- **platform_overview**: Full platform metrics (users, courses, enrollments, revenue, DAU/WAU/MAU, alerts)
- All queries wrapped in try/catch with realistic demo data fallbacks

### Module 3: LLM Reasoning Layer
- Uses z-ai-web-dev-sdk with structured system prompt
- System prompt includes REAL platform data and enforces data-driven analysis
- Rule-based fallback when LLM is unavailable (generates structured markdown response per intent)
- Always includes specific numbers from the data

### Module 4: Recommendations Engine
- Generates 2-3 actionable recommendations per intent based on data
- Context-aware: different recommendations for different intents
- Handles edge cases with sensible defaults

### GET Endpoint (Sidebar Data)
- Returns recent queries (in-memory, last 5 per admin)
- Returns 8 suggested questions
- Returns critical alerts auto-detected from live DB data
- Falls back to demo alerts on DB errors

### POST Endpoint (Chat)
- Input: { adminId, query, sessionId? }
- Output: { message, sessionId, intent, data, recommendations }
- Pipeline: Intent Detection → Data Retrieval → LLM Reasoning → Recommendations

- Fixed intent detection: Added "requires immediate attention" and "immediate attention" keywords to risk_analysis
- Added word-level boost system for better intent matching on partial keyword overlaps
- All intent tests passing: enrollment_analysis, instructor_analysis, risk_analysis, platform_overview
- Lint passes clean
- All curl tests return 200 with correct data

## Stage Summary

- API endpoint: POST /api/admin/copilot — main chat with full 4-module pipeline
- API endpoint: GET /api/admin/copilot?adminId=xxx — sidebar data (recent queries, suggested questions, critical alerts)
- 9 intents detected via keyword matching + word-level boosts
- Data fetched from real DB with comprehensive demo data fallbacks
- LLM-powered analysis with rule-based fallback
- 2-3 actionable recommendations generated per response
- No new Prisma models added (queries stored in-memory)
