# T057: Split/Mixed Payment UI

**Priority**: P0 (production blocker)  
**Status**: todo  
**Size**: M  
**Depends on**: —

## Problem

Indian retail customers frequently pay with a combination of cash + UPI or cash + card. The current POS only supports a single payment method per invoice. The `MIXED` billing type and `payments` array exist in the data model, but there is no UI for entering multiple payments.

## Requirements

### Mixed Payment Dialog
- When "Mixed" payment button is clicked, open a dialog with multiple payment rows
- Each row: payment method dropdown (Cash, UPI, Card, Credit), amount input
- Auto-calculate remaining amount after each payment entry
- Add/remove payment rows
- Validate total payments = invoice total (or mark as partial)
- Default: one payment row pre-filled with invoice total

### API Changes
- The billing POST already accepts `payments` array with `method` and `amount`
- Validate: sum of payments must equal `totalAmount` for PAID status, or less for PARTIAL
- For CREDIT payments: add to customer `creditBalance` instead of marking as paid

### Payment Recording
- Each `Payment` record stores: method, amount, reference number (optional for UPI/card), timestamp
- Payment records visible in invoice detail view
- Partial payments: invoice status = PARTIAL, `amountPaid` = sum of payments, `amountDue` = total - amountPaid

## Acceptance Criteria

- [ ] Clicking "Mixed" in POS opens multi-payment dialog
- [ ] Can add 2+ payment rows with different methods
- [ ] Remaining amount auto-calculates as payments are entered
- [ ] Cannot process if payments total doesn't match invoice total (unless credit)
- [ ] Credit payment method adds to customer's balance
- [ ] Payment records are stored and visible in invoice detail
- [ ] Partial payments work: invoice shows PARTIAL status with amount paid/due

## Files to Modify

- `src/app/(dashboard)/dashboard/billing/new/page.tsx` — Mixed payment dialog UI
- `src/app/api/billing/route.ts` — Validate mixed payments, handle CREDIT method