# Task 3 - frontend-agent: Rebuild Admin Revenue & Finance Component

## Task
Rebuild the admin Revenue & Finance page component with 8 tabs for Next.js 16 + shadcn/ui project.

## Work Completed

### File Modified
- `/src/components/admin/admin-revenue-finance.tsx` - Complete rewrite (~2,050 lines)

### What Was Built
8-tab Revenue & Finance admin component:

1. **Overview** - 6 stat cards, category/payment charts, quick stats, forecast mini-card
2. **Transactions** - Debounced search, filters, stats, table with detail Sheet, CSV export, pagination
3. **Revenue Split** - Period selector, visual split bar, instructor breakdown with expandable courses, custom commission badges
4. **Refunds** (NEW) - Stats, filter/search, table with approve/reject actions, bulk approve, detail Sheet
5. **Disputes** - Stats cards, filter, dispute cards with action dialogs (review, favor buyer/seller, escalate, cancel)
6. **Tax Reports** - Fiscal year selector, summary cards, monthly breakdown table, instructor tax summary, CSV export
7. **Financial Settings** (NEW) - Commission rates with live preview, policy/payout settings, auto-approve toggle, commission overrides CRUD
8. **Forecasting** (NEW) - Period selector, projected metrics, confidence indicator, monthly trend, key assumptions

### Key Technical Details
- Exports `AdminRevenueFinance` and `AdminRevenueFinanceWrapped` (wrapped with CurrencyProvider)
- Uses `formatPKR()` / `formatPKRFull()` for all currency display
- Null-safe `.toFixed()` calls with `?? 0`
- Design patterns from admin-user-management.tsx: springTransition, rounded-2xl cards, gradient accents, toast from sonner
- Integrates with all existing + new API endpoints (overview, transactions, revenue-split, refunds, disputes, tax-reports, settings, forecast, export)
- Lint passes clean

### Previous Agent Work Used
- Backend API routes from Task 2 finance-backend-agent: /api/admin/finance/settings, /api/admin/finance/refunds, /api/admin/finance/forecast
- Existing API routes: overview, transactions, revenue-split, disputes, tax-reports, export
- CurrencyProvider from existing currency-provider.tsx
