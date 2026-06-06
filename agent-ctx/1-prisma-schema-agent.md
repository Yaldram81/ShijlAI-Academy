# Task 1: Add Ask ShijlAI Prisma Models

**Date:** 2025-03-06

## Work Summary
Added 9 new Prisma models for the "Ask ShijlAI" system and 8 new relation fields to the User model.

## Changes Made

### File: `prisma/schema.prisma`

**User model — new relation fields added:**
- `learningProfile StudentLearningProfile?` (1:1, via studentId)
- `shijlAISessions ShijlAISession[]` (1:many)
- `shijlAIMessages ShijlAIMessage[]` (1:many, via userId)
- `aiRecommendations AIRecommendation[]` (1:many)
- `learningInsights LearningInsight[]` (1:many)
- `aiQuizGenerations AIQuizGeneration[]` (1:many, instructor relation)
- `studyPlans StudyPlan[]` (1:many)
- `aiActivities StudentAIActivity[]` (1:many)

**New models added (appended after BlogPost model):**

1. **StudentLearningProfile** — Student learning profile with AI-tracked metrics (learning level, engagement, completion rate, quiz scores, weak/strong topics, XP, streak)
2. **ShijlAISession** — Ask ShijlAI conversation sessions (mode: tutor/quiz/assignment/study_planner/career_advisor, with summary and message count)
3. **ShijlAIMessage** — Messages in ShijlAI sessions (role: user/assistant/system, quick actions, metadata)
4. **ConversationSummary** — Memory system summaries for sessions (key topics, message range)
5. **AIRecommendation** — AI-generated learning recommendations (type, priority, status, source event)
6. **LearningInsight** — AI-generated learning insights (strength/weakness/trend/suggestion, severity, actionability)
7. **AIQuizGeneration** — Quiz generation logs (instructor-generated, with difficulty, question types, status)
8. **StudyPlan** — AI-generated study plans (exam date, subjects, daily schedule, progress)
9. **StudentAIActivity** — Track student AI interactions for analytics (with indexes on userId, activityType, createdAt)

**Note:** Added `userId` and `user` fields to `ShijlAIMessage` model (not in original spec) because Prisma requires an opposite relation field when `User` has `shijlAIMessages ShijlAIMessage[]`. This enables direct user-to-messages queries.

## Verification
- `bun run db:push` — successful, database synced
- Prisma Client regenerated successfully (v6.19.2)
- No existing models were modified (only additions)
