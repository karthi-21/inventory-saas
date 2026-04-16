# T061: Credit Limit Enforcement in Billing

**Priority**: P1  
**Status**: todo  
**Size**: S  
**Depends on**: —

## Problem

The `creditLimit` field exists on the Customer model and is editable in the customer form, but the billing API does not check it. A customer can exceed their credit limit, creating uncontrolled credit exposure.

## Requirements

### Billing Validation
- When creating an invoice with `billingType: CREDIT` or `paymentStatus: DUE/PARTIAL`, check the customer's `creditLimit`
- If `(existing creditBalance + new invoice amountDue) > creditLimit`, show a warning
- If `creditLimit = 0` or `null`, skip the check (no limit)
- Two modes: HARD limit (block the sale) or SOFT limit (warn but allow) — configurable in settings
- Default: SOFT limit (warn but proceed)

### UI
- In POS payment dialog, if credit sale would exceed limit, show yellow/red warning:
  - "Customer credit limit: ₹X. Current outstanding: ₹Y. This sale would bring total to ₹Z (exceeds limit by ₹W)."
- Warning should be dismissible for SOFT mode, blocking for HARD mode
- In customer detail view, show credit utilization bar (current balance / limit)

### Settings
- Add `creditLimitMode` to TenantSettings: 'SOFT' (default) or 'HARD'

## Acceptance Criteria

- [ ] Billing API checks customer credit limit before creating credit/partial invoices
- [ ] POS shows warning when credit sale would exceed limit
- [ ] SOFT mode: warning displayed, cashier can proceed
- [ ] HARD mode: sale is blocked, cashier cannot proceed
- [ ] Customers with no credit limit set (null/0) bypass the check
- [ ] Customer detail view shows credit utilization

## Files to Modify

- `src/app/api/billing/route.ts` — Add credit limit validation
- `src/app/(dashboard)/dashboard/billing/new/page.tsx` — Show credit limit warning in payment dialog
- `src/app/(dashboard)/dashboard/customers/[id]/page.tsx` — Add credit utilization display
- `prisma/schema.prisma` — Add creditLimitMode to TenantSettings