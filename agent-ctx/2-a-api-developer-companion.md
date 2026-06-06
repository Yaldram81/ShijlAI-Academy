# Task 2-a: AI Companion API — Work Record

## Task: Create the AI Companion API at `/src/app/api/ai/companion/route.ts`

## Summary
Successfully created a comprehensive AI Companion API that acts as a proactive AI mentor (NOT a chatbot). It uses the platform's intelligence to proactively guide students.

## Architecture
```
Student Data → Companion Engine → Insight Engine → LLM Layer → Companion Messages
```

## Endpoints

### GET `/api/ai/companion?userId=xxx`
Returns companion dashboard data:
- `todaysFocus`: Topics prioritized by mastery < 30% and exam proximity (up to 5)
- `insights`: Proactive messages sorted unread-first, by priority, by date (up to 15)
- `suggestedActions`: 4 contextual actions (review_lesson, take_quiz, continue_path, start_session)
- `stats`: totalInsights, unreadCount, streakDays, avgMastery, weeklyProgress, coursesActive, quizzesThisWeek, lessonsCompleted
- `companionChat`: Personalized greeting + personality (coach/mentor/advisor)
- `skillContextForAI`: String summary for Ask ShijlAI integration

### POST `/api/ai/companion`
- `action: "chat"` — Companion chat using z-ai-web-dev-sdk LLM with full student context
- `action: "mark_read"` — Mark insight as read in DB
- `action: "run_engine"` — Run companion engine to generate fresh insights

## Companion Engine Rules (5 rules)
1. **Inactivity Alert**: No login for 5+ days → urgent/high priority message with exam context
2. **Weak Topic**: Mastery < 30% → suggests specific lessons to improve
3. **Study Plan Missed**: Today's tasks not completed → offers reschedule
4. **Exam Approaching**: Exam within 14 days → focuses on weak topics
5. **Achievement**: Streak milestone (7-day multiples) + mastery improvements

## Data Sources Used
- Topic Mastery (from DB or demo)
- Skill Graph (via topic mastery)
- Study Planner (active plans with tasks)
- Learning Path (enrollment progress)
- Course Progress (enrollment progress %)
- Quiz Results (recent quiz attempts)
- Engagement data (learning profile engagement score)

## Demo Data
- Classification (22%), Neural Networks (28%), Probability (35%)
- 7-day streak, Level 12, 2450 XP
- ML exam in 10 days, 2 active courses
- 6 demo insights with proper prioritization

## Technical Notes
- Companion messages/events queried separately from User (avoids Prisma client caching issue)
- Personality adapts: coach (default), mentor (low engagement), advisor (high mastery)
- LLM system prompt includes full student context (mastery scores, skills, progress, streak, quiz results)
- Always falls back to demo data when DB is sparse so UI always works
- AICompanionMessage and AICompanionEvent Prisma models already existed in schema

## Verification
- GET /api/ai/companion?userId=test-user-123 → 200 with full dashboard
- POST run_engine → 7 insights generated (inactivity_alert, 2x weak_topic, study_plan_missed, exam_approaching, streak_achievement, mastery_improvement)
- POST chat → Personalized LLM response referencing Classification mastery (22%)
- Lint passes clean
