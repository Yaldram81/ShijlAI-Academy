# Task 3 - Backend Agent: Admin Instructor Management API Routes

## Task Summary
Created comprehensive backend API routes for admin instructor management with full CRUD, filtering, pagination, stats, bulk actions, and export capabilities.

## Files Created

### 1. `/api/admin/instructors/route.ts` (GET, POST)
- **GET**: Lists all instructors with advanced filtering, sorting, pagination, and stats
  - Filters: search, status, applicationStatus, ntnVerified, hasCourses, joinedAfter, joinedBefore
  - Sort fields: name, createdAt, lastActiveAt, totalStudents, totalEarnings
  - Stats: totalInstructors, activeInstructors, suspendedInstructors, bannedInstructors, pendingApplications, approvedThisMonth, rejectedThisMonth, totalEarnings, avgRating, ntnVerifiedCount
  - Includes: instructor profile, course stats, earnings, payout method, commission override
  - Batch queries to avoid N+1 performance issues
- **POST**: Create instructor via promote (existing user) or create (new user)
  - Creates instructor profile, settings, session token, welcome notification, activity log

### 2. `/api/admin/instructors/[id]/route.ts` (GET, PATCH, DELETE)
- **GET**: Full instructor detail with all related data
  - User info, instructor profile, settings, application, courses, payout methods, recent payouts, commission override, recent transactions, activity logs, active sessions, performance stats, monthly earnings trend, admin notes
- **PATCH**: 17 admin actions
  - Status: suspend, unsuspend, ban, verify
  - Flags: flag, unflag
  - Applications: approve_application, reject_application, request_more_info
  - Security: reset_password, toggle_mfa, clear_sessions
  - Finance: adjust_commission, adjust_coins, adjust_xp
  - Profile: edit_profile, send_notification
  - Account: deactivate, reactivate
- **DELETE**: Soft delete (status=banned, sessions cleared, settings deactivated)

### 3. `/api/admin/instructors/bulk/route.ts` (POST)
- Actions: suspend, unsuspend, verify, flag, ban, send_notification, export, delete
- 100 instructor limit, per-instructor tracking, activity logging

### 4. `/api/admin/instructors/export/route.ts` (GET)
- CSV or JSON export with filters (status, applicationStatus, search)
- Includes all key instructor fields with batch-computed stats

## Patterns Followed
- Next.js 16 `params: Promise<{ id: string }>` pattern
- `import { db } from '@/lib/db'` for database access
- `NextResponse` from 'next/server'
- try/catch with console.error and `{ error: string }` responses
- Activity log creation for all admin actions
- Notification creation for instructor-facing actions
- Batch queries for performance optimization

## Validation
- Lint passes clean
- Dev server running successfully
