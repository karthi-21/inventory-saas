# T069: Staff Performance Report

**Priority**: P2  
**Status**: todo  
**Size**: S  
**Depends on**: T067

## Problem

There is no way to see how each team member (cashier, salesperson) is performing. Store owners need to know who's selling the most, who's handling the most transactions, and identify training needs. The `createdBy` field on invoices links sales to users, but this data is never surfaced in a report.

## Requirements

### Staff Performance Page
- New tab in Reports: "Staff" or "Team Performance"
- Show per-user performance metrics for the selected period:
  - **Total sales amount**: Sum of all invoice totals created by this user
  - **Number of transactions**: Count of invoices created
  - **Average transaction value**: Total / Count
  - **Items per transaction**: Average line items per invoice
  - **Credit sales**: How many credit sales vs cash sales
  - **Returns/cancellations**: Number of cancelled invoices (if T055 is done)

### Leaderboard
- Ranked list of staff by sales amount (descending)
- Show: rank, name, role, total sales, transaction count, avg value
- Highlight: top performer (green), below average (yellow)

### Comparison
- Side-by-side comparison of 2+ staff members
- Date range filter for fair comparison (e.g., comparing this month vs last month)

### Trend
- Per-user sales trend over time (daily/weekly)
- Identify if a staff member's performance is improving or declining

### API Endpoint
- `GET /api/reports/staff-performance?from=&to=&storeId=&userId=`
  - Returns: per-user summary, transaction breakdown, trend data
  - Uses `Invoice.createdBy` to attribute sales

### Access Control
- Only users with `REPORT_VIEW` and `USER_VIEW` can see this report
- Cashier role should NOT see other staff members' performance

## Acceptance Criteria

- [ ] Staff performance report shows per-user sales metrics
- [ ] Leaderboard ranks staff by total sales
- [ ] Date range filter works correctly
- [ ] Store filter works for multi-store
- [ ] Average transaction value is calculated correctly
- [ ] Credit vs cash split is shown per user
- [ ] Only authorized users can view the report
- [ ] CSV export works

## Files to Create/Modify

- `src/app/api/reports/staff-performance/route.ts` — New: staff metrics
- `src/app/(dashboard)/dashboard/reports/page.tsx` — Add Staff tab
- `src/middleware.ts` or permission check — Restrict access appropriately