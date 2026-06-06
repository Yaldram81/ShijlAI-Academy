# Task 5: Smart Assessment Backend APIs

## Summary
Built 7 backend API routes for the Smart Assessment System under `src/app/api/instructor/assessment/`.

## Files Created

| File | Method | Description |
|------|--------|-------------|
| `question-analytics/route.ts` | GET | Calculates and upserts QuestionAnalytics for all instructor questions |
| `distractor-analysis/route.ts` | GET | Analyzes MCQ option selection distribution, identifies weak distractors |
| `outcomes/route.ts` | GET | Fetches learning outcomes with mastery calculations per outcome |
| `outcomes/create/route.ts` | POST | Creates new LearningOutcome with auto-ordering |
| `outcomes/link/route.ts` | POST | Links a question to a learning outcome via QuestionOutcome |
| `quality-scores/route.ts` | GET | Calculates composite assessment quality score per quiz |
| `generate-insights/route.ts` | POST | Uses ZAI SDK to generate student and instructor insights |

## Key Implementation Details

### Question Analytics
- Parses QuizAttempt answers JSON to count correct/incorrect per question
- Calculates successRate, difficultyScore (inverse), and difficultyLevel
- Difficulty levels: too_difficult (0-20%), difficult (20-40%), normal (40-70%), easy (70-90%), too_easy (90-100%)
- Upserts QuestionAnalytics records for caching

### Distractor Analysis
- Counts how many times each MCQ option was selected across all attempts
- Calculates selection rates, marks weak distractors (<5% selection for non-correct options)
- Generates recommendations based on weak distractor count

### Outcomes
- Mastery calculation: for each student, % correct on linked questions, then average across students
- Mastery levels: mastered (≥90%), proficient (≥70%), developing (≥50%), beginning (>0%), no_data (0%)
- Create endpoint auto-assigns next order value

### Quality Scores
- difficultyBalance: 100 - (stdDev of success rates / 50 * 100), normalized 0-100
- questionVariety: % of different question types used (out of mcq, true_false, fill_blank, short_answer)
- outcomeCoverage: % of course outcomes covered by linked questions
- timeFactor: normalized completion time vs ideal time
- Composite: difficultyBalance×0.30 + questionVariety×0.25 + outcomeCoverage×0.25 + timeFactor×0.20

### Generate Insights
- Gathers: outcome data, difficult questions, weak distractors, quality scores, attempt summary
- Calls ZAI SDK (z-ai-web-dev-sdk) following existing pattern from instructor/ai/ routes
- Returns studentInsights, instructorInsights, and overallAssessment

## Prisma Models Used
- LearningOutcome, QuestionOutcome, QuestionAnalytics, DistractorAnalytics, AssessmentQualityScore
- Quiz, Question, QuizAttempt, Course (existing models)

## Lint Status
✅ Clean - no errors
