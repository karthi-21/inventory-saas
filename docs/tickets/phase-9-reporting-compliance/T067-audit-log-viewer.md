# T067: Audit Log Viewer

**Priority**: P1  
**Status**: todo  
**Size**: M  
**Depends on**: —

## Problem

All API routes call `logActivity()` which writes entries to the `ActivityLog` table in the database. However, there is no UI to view these logs. Store owners and managers need to see who did what and when — for accountability, troubleshooting, and compliance. The data exists; it just needs a viewer.

## Requirements

### Audit Log Page
- New page: `/dashboard/settings/audit-log` or `/dashboard/audit-log`
- Accessible to users with `SETTINGS_VIEW` or `USER_VIEW` permission
- Show a filterable, sortable table of activity logs:
  - Columns: Timestamp, User (name + role), Action, Entity Type, Entity ID, Details
  - Action types: CREATE, UPDATE, DELETE, LOGIN, CANCEL, VOID, ADJUST, etc.
  - Entity types: Invoice, Product, Customer, User, Store, Category, etc.

### Filters
- Date range (today, last 7 days, last 30 days, custom)
- User filter (dropdown of team members)
- Action type filter (multi-select)
- Entity type filter (multi-select)
- Search by entity ID or details text

### Pagination
- Server-side pagination (logs can grow very large)
- Default: 50 entries per page
- Show total count and page numbers

### Detail View
- Click on a log entry to see full details
- Show: before/after values for updates (diff view)
- Show: IP address, user agent (if stored)
- Link to the relevant entity (e.g., click invoice ID → go to invoice)

### Export
- Export filtered logs as CSV
- Date range export (e.g., "export all logs from March 2026")

### API Endpoint
- `GET /api/audit-logs` — List logs with filters
  - Query params: `userId`, `action`, `entityType`, `entityId`, `from`, `to`, `page`, `limit`, `search`
  - Returns paginated results with total count

### Dashboard Widget
- Small widget on dashboard showing "Recent Activity" (last 5 actions)
- Quick link to full audit log

## Acceptance Criteria

- [ ] Audit log page shows all activity with filters
- [ ] Can filter by date range, user, action type, entity type
- [ ] Pagination works correctly for large log sets
- [ ] Clicking a log entry shows detail with before/after values
- [ ] Entity IDs are clickable links to the relevant record
- [ ] CSV export works for filtered results
- [ ] Only authorized users can access the audit log
- [ ] Dashboard shows recent activity widget

## Files to Create/Modify

- `src/app/api/audit-logs/route.ts` — New: GET with filters + pagination
- `src/app/(dashboard)/settings/audit-log/page.tsx` — New: Audit log viewer page
- `src/app/(dashboard)/dashboard/page.tsx` — Add recent activity widget
- `src/lib/activity-log.ts` — Enhance: store before/after values for updates
- `prisma/schema.prisma` — Ensure ActivityLog has all needed fields