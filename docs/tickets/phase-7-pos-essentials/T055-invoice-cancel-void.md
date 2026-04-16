# T055: Invoice Cancel/Void Flow

**Priority**: P0 (production blocker)  
**Status**: todo  
**Size**: M  
**Depends on**: —

## Problem

There is no way to cancel or void a mistakenly created invoice. In real retail, cashiers frequently need to cancel a bill (wrong customer, wrong items, duplicate entry). Without this, every invoice is permanent and irreversibly deducts stock.

## Requirements

### Cancel Invoice (Void)
- Add `CANCELLED` status to `InvoiceStatus` enum (currently: DRAFT, ISSUED, PAID, PARTIAL, DUE, CANCELLED)
- Cancelled invoices should restore stock quantities (reverse the stock deduction)
- Only invoices with no payments or fully refunded payments can be cancelled
- Cancellation requires a reason (dropdown: "Mistake", "Customer Request", "Duplicate", "Other")
- Only users with `BILLING_CANCEL` permission can cancel invoices

### Cancel Invoice API
- `PATCH /api/billing/[id]/cancel` — sets status to CANCELLED, restores stock, logs activity
- Validates: invoice exists, not already cancelled, user has permission
- Creates a stock movement of type `SALES_RETURN` for each item
- Sets `amountPaid = 0`, `amountDue = 0` if no payments were made
- If partial payments exist, mark as `REFUNDED` and create refund record

### Cancel Invoice UI
- Add "Cancel Invoice" button on billing list (dropdown per row)
- Add "Cancel" button on invoice detail view (if we add one)
- Confirmation dialog: "Are you sure? This will restore stock and cannot be undone."
- Reason input field (required)
- After cancellation, invoice shows `CANCELLED` badge in red

### Invoice Detail View
- New page: `/dashboard/billing/[id]` showing full invoice details
- Shows: invoice number, date, customer, items, taxes, totals, payments, status
- Actions: Print, Cancel (if permitted), Record Payment (if DUE/PARTIAL)

## Acceptance Criteria

- [ ] Cancelled invoices show `CANCELLED` status badge
- [ ] Stock is restored when an invoice is cancelled
- [ ] Activity log records the cancellation with user and reason
- [ ] Users without `BILLING_CANCEL` permission cannot cancel invoices
- [ ] Already-cancelled invoices cannot be cancelled again
- [ ] Cancelled invoices are excluded from revenue totals in reports
- [ ] Billing list shows cancelled invoices with visual distinction (strikethrough or grey)

## Files to Modify

- `prisma/schema.prisma` — Add CANCELLED to InvoiceStatus enum
- `src/app/api/billing/[id]/cancel/route.ts` — New API endpoint
- `src/app/api/billing/route.ts` — Exclude cancelled from totals
- `src/app/(dashboard)/dashboard/billing/page.tsx` — Add cancel button + dialog
- `src/app/(dashboard)/dashboard/billing/[id]/page.tsx` — New invoice detail page
- `src/app/api/reports/route.ts` — Exclude cancelled from revenue calculations