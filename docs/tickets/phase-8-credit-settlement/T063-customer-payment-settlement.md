# T063: Customer Payment Settlement UI

**Priority**: P0 (production blocker)  
**Status**: todo  
**Size**: M  
**Depends on**: T061

## Problem

The `creditBalance` field on Customer tracks outstanding dues, and the `Outstanding` report shows who owes what, but there is no UI to record a payment against a customer's credit balance. In Indian retail, "Khata" (credit book) management is critical — shopkeepers need to record when a customer pays back partial or full amounts against their outstanding credit.

## Requirements

### Payment Settlement Page
- New page: `/dashboard/customers/[id]/settlement` or a dialog on the customer detail page
- Shows: customer name, current credit balance, outstanding invoices list
- "Record Payment" form: amount, payment mode (Cash/UPI/Card/Bank Transfer), date, reference number (optional)
- On submit: reduce `creditBalance` on Customer, create a `Payment` record linked to the customer
- Support partial payments: customer can pay any amount ≤ creditBalance

### Invoice-Level Settlement
- When recording a payment, optionally allocate to specific invoices
- Show invoice list with: invoice number, date, total, amount paid, balance due
- Cashier can check which invoices this payment covers
- If no specific invoice is selected, payment reduces the overall credit balance

### Payment History
- Show payment history on customer detail page
- Each entry: date, amount, mode, reference, allocated invoices
- Filter by date range, payment mode

### API Endpoints
- `POST /api/customers/[id]/settle` — Record a payment against credit balance
  - Body: `{ amount, paymentMode, date?, reference?, allocations?: [{ invoiceId, amount }] }`
- `GET /api/customers/[id]/payments` — Payment history for a customer
- `PATCH /api/payments/[id]` — Edit/delete a payment (with permission check)

### Customer Detail View Enhancement
- Add "Credit" tab to customer detail page showing:
  - Credit balance prominently displayed
  - Credit utilization bar (if credit limit is set — from T061)
  - Outstanding invoices table
  - Payment history table
  - "Record Payment" button

## Acceptance Criteria

- [ ] Can record a payment against a customer's credit balance
- [ ] Credit balance decreases by the payment amount
- [ ] Can allocate payment to specific invoices
- [ ] Partial payments are supported
- [ ] Payment history is visible on customer detail page
- [ ] Outstanding invoices show balance due per invoice
- [ ] Only users with `CUSTOMER_EDIT` permission can record payments
- [ ] Activity log records each payment settlement

## Files to Create/Modify

- `src/app/api/customers/[id]/settle/route.ts` — New: POST payment settlement
- `src/app/api/customers/[id]/payments/route.ts` — New: GET payment history
- `src/app/(dashboard)/customers/[id]/page.tsx` — Add Credit tab with settlement UI
- `src/app/(dashboard)/customers/[id]/settle/page.tsx` — New: dedicated settlement page (or dialog)
- `src/lib/db.ts` or Prisma — Ensure Payment model supports customer-level allocation