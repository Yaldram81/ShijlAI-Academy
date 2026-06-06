---
Task ID: 3
Agent: Main Agent
Task: Create the API routes for the "Ask ShijlAI" system

Work Log:
- Read worklog.md and prisma/schema.prisma to understand existing models
- Confirmed all 9 Ask ShijlAI models already exist in the schema (StudentLearningProfile, ShijlAISession, ShijlAIMessage, ConversationSummary, AIRecommendation, LearningInsight, AIQuizGeneration, StudyPlan, StudentAIActivity)
- Created 9 API route files under /api/ai/shijlai/:

1. **chat/route.ts** - Main chat endpoint (POST)
   - Accepts userId, message, mode, sessionId, courseId, language, quickAction
   - Creates new ShijlAISession if no sessionId provided
   - Saves user message as ShijlAIMessage
   - Builds context from StudentLearningProfile, course info, ConversationSummary, recent messages
   - Builds mode-specific system prompts (tutor, quiz, assignment, study_planner, career_advisor)
   - Includes student context in system prompt (level, weak/strong topics, engagement, etc.)
   - Calls z-ai-web-dev-sdk LLM for AI response
   - Saves AI response as ShijlAIMessage
   - Updates session messageCount
   - If messageCount > 20, generates conversation summary using LLM and saves as ConversationSummary
   - Logs activity in StudentAIActivity
   - Returns message, sessionId, mode

2. **sessions/route.ts** - Session management
   - GET: List sessions for a user, ordered by updatedAt desc, limit 50, includes message count
   - POST: Create new session with userId, mode, title, courseId, language

3. **sessions/[id]/route.ts** - Single session operations
   - GET: Get session with last 50 messages (chronological order) + conversation summaries
   - DELETE: Delete session and all messages (cascade)
   - PATCH: Update session (archive, title)

4. **profile/route.ts** - Learning profile
   - GET: Get or create student learning profile with auto-calculated metrics from enrollment/quiz/submission data
   - POST: Update profile after events (quiz_completed, assignment_submitted, lesson_completed) - recalculates metrics

5. **recommendations/route.ts** - Recommendations
   - GET: Get active recommendations for user (filter by type, status)
   - POST: Generate new recommendations using LLM analysis of student data, saves AIRecommendation records
   - PATCH: Update recommendation status (dismiss/complete)

6. **quiz-generator/route.ts** - Quiz generation
   - POST: Generate quiz questions using LLM with course/module context, saves AIQuizGeneration record

7. **study-plan/route.ts** - Study plan
   - GET: Get study plans for user (filter by status)
   - POST: Generate study plan using LLM based on profile, exam date, available hours, subjects
   - PATCH: Update study plan progress/status

8. **insights/route.ts** - Learning insights
   - GET: Get insights for user (filter by category, isRead)
   - POST: Generate new insights using LLM analyzing student data, creates LearningInsight records
   - PATCH: Mark insight as read

9. **search/route.ts** - Knowledge search
   - POST: Keyword-based search through lesson content in DB, returns relevant lesson chunks with scoring

- Fixed lint errors: renamed `module` variable to `courseModule` in quiz-generator and search routes (Next.js no-assign-module-variable rule)
- All routes use proper error handling with try/catch
- All routes return proper HTTP status codes (200, 400, 404, 500)
- All routes use NextResponse.json() for responses
- All LLM calls use z-ai-web-dev-sdk with thinking: { type: 'disabled' }
- All database access uses `import { db } from '@/lib/db'`
- Lint passes clean with 0 errors
- Database is already in sync (db:push confirms no schema changes needed)

Stage Summary:
- 9 API route files created under src/app/api/ai/shijlai/
- All routes are self-contained with their own imports
- Chat endpoint supports 5 modes: tutor, quiz, assignment, study_planner, career_advisor
- Profile endpoint auto-calculates metrics from enrollment/quiz/submission data
- Recommendations, insights, and study plans all use LLM for personalized generation
- Search uses keyword-based matching with relevance scoring
- All routes log activity in StudentAIActivity for tracking
