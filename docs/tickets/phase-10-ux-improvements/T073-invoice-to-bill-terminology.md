# T073: Replace "Invoice" → "Bill" Across All UI

**Priority**: P0  
**Status**: done  
**Size**: M  
**Depends on**: —

## Problem

"Invoice" appears 21+ times in user-facing text across the app. A kirana shop owner thinks in "bills" — "bill banana, bill dena" — not "invoices." The POS page already says "Current Bill" which proves the right term is known but inconsistently applied. This is the single biggest comprehension barrier for the target user.

## Replacement Map

Only **user-visible labels** change. API routes, database columns, code variables, and URL paths stay as `invoice`.

| Current Text | New Text | Locations |
|-------------|----------|-----------|
| Invoices (page heading) | Bills | billing/page.tsx |
| Invoice # (table header) | Bill No. | billing/page.tsx, reports/page.tsx |
| Invoice Settings | Bill Settings | settings/page.tsx |
| Invoice Prefix | Bill Prefix | settings/page.tsx |
| Save Invoice Settings | Save Bill Settings | settings/page.tsx |
| Cancel Invoice (dialog title) | Cancel Bill | billing/page.tsx |
| Keep Invoice (button) | Don't Cancel | billing/page.tsx |
| Invoice Created (POS dialog) | Bill Created | billing/new/page.tsx |
| New Purchase Invoice | New Purchase Bill | purchases/page.tsx |
| Invoice Number | Bill Number | purchases/page.tsx |
| Invoice Date | Bill Date | purchases/page.tsx |
| Total Invoices | Total Bills | reports/page.tsx |
| Paid Invoices | Paid Bills | billing/page.tsx |
| Process Return | Return Items | billing/page.tsx (3 locations) |
| Invoice Create | Bill Create | settings/audit-log/page.tsx |
| Invoice Cancel | Bill Cancel | settings/audit-log/page.tsx |
| SalesInvoice (entity filter) | Bill | settings/audit-log/page.tsx |
| "Invoices" (stat card) | Bills | dashboard/page.tsx |

## Files to Modify

- `src/app/(dashboard)/dashboard/billing/page.tsx`
- `src/app/(dashboard)/dashboard/billing/new/page.tsx`
- `src/app/(dashboard)/dashboard/purchases/page.tsx`
- `src/app/(dashboard)/dashboard/reports/page.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/dashboard/settings/page.tsx`
- `src/app/(dashboard)/dashboard/settings/audit-log/page.tsx`

## Verification

- [ ] `/dashboard/billing` — Page heading says "Bills", table header says "Bill No."
- [ ] `/dashboard/billing/new` — POS success dialog says "Bill Created"
- [ ] `/dashboard/reports` — Summary says "Total Bills"
- [ ] `/dashboard/settings` — Card title says "Bill Settings"
- [ ] `/dashboard/settings/audit-log` — Entity filter shows "Bill" not "Invoice"
- [ ] Browser Ctrl+F on each page for "Invoice" — zero results in visible text (code variables OK)
- [ ] `npx tsc --noEmit` passes