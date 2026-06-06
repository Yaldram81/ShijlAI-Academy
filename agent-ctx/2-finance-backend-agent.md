# Task 2 - Finance Backend API Routes Agent

## Task: Create enhanced backend API routes for admin Revenue & Finance page

## Work Completed:

### 1. `/api/admin/finance/settings/route.ts` (GET + PATCH)
- **GET**: Returns FinancialSettings row (creates with defaults if not exists). Returns all CommissionOverride entries with instructor details and full instructor list.
- **PATCH**: Supports 3 actions:
  - `update_settings` — Updates any FinancialSettings field with validation (rates 0-100, non-negative amounts, valid schedules). Parses supportedPayoutMethods array to comma-separated string for storage.
  - `add_commission_override` — Upserts CommissionOverride for an instructor. Validates rate (0-100), verifies instructor exists. Creates ActivityLog entry and sends Notification to affected instructor.
  - `remove_commission_override` — Deletes CommissionOverride. Validates it exists. Creates ActivityLog entry and sends Notification to instructor about removal.
- All actions log to ActivityLog with proper type, icon, action, targetType, category, severity fields.

### 2. `/api/admin/finance/refunds/route.ts` (GET + PATCH)
- **GET**: Lists refund transactions with:
  - Filtering by status (pending/approved/rejected/processed/refunded), search (description, invoice, student name/email, instructor name, course title), date range, courseId, instructorId
  - Sorting by newest/oldest/amount_high/amount_low
  - Pagination (page, limit with max 100)
  - Includes student, instructor, course details with each refund
  - Parses metadata JSON with try/catch fallback
  - Stats: totalRefundAmount, pendingCount, approvedCount, processedCount, rejectedCount, avgProcessingDays, total
  - avgProcessingDays calculated from last 50 processed refunds
- **PATCH**: Supports 4 actions:
  - `approve` — Approves pending refund, updates status to 'refunded'. Logs to ActivityLog, sends Notification to both student and instructor.
  - `reject` — Rejects pending refund with required reason, reverts status to 'completed'. Logs to ActivityLog, sends Notification to both student and instructor.
  - `process` — Marks approved (unprocessed) refund as processed by setting refundedAt. Logs to ActivityLog, sends Notification to student.
  - `bulk_approve` — Approves up to 100 pending refunds at once. Validates all are pending refunds. Batch updates, single ActivityLog entry, individual notifications for each affected student/instructor.

### 3. `/api/admin/finance/forecast/route.ts` (GET)
- **GET**: Revenue forecasting based on last 6 months of historical data:
  - `period` param: next_month (1 month), next_quarter (3 months), next_year (12 months)
  - Uses simple linear regression (y = mx + b) on revenue and enrollment data
  - Calculates R-squared for confidence assessment
  - Returns:
    - Forecast: projectedRevenue, projectedEnrollments, projectedPlatformCut, projectedInstructorPayouts, growthRate
    - Confidence: level (low/medium/high), rSquared, revenueRSquared, enrollmentRSquared, coefficientOfVariation, dataPoints
    - Trend: historical (6 months) and projected arrays for chart display
    - Summary: avgMonthlyRevenue, avgMonthlyEnrollments, totalHistoricalRevenue, totalHistoricalEnrollments, regressionSlope, regressionIntercept
    - Settings: current platformRate and instructorRate from FinancialSettings

## Technical Details:
- All routes use `import { db } from '@/lib/db'` (NOT `new PrismaClient()`)
- Next.js 16 patterns: `export async function GET/PATCH(request: Request)`
- All routes wrapped in try/catch with console.error
- Proper NextResponse.json() with status codes
- All dates converted to ISO strings in responses
- JSON fields parsed with try/catch fallbacks
- Batch queries used where possible to avoid N+1
- Edge cases handled (missing records, invalid data, validation)
- Lint passes clean
