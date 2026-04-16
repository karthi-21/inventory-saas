# T060: Shift Management (Open/Close Shift)

**Priority**: P1  
**Status**: todo  
**Size**: M  
**Depends on**: —

## Problem

Retail stores need to track cashier shifts for cash reconciliation. The `Shift` model exists in Prisma with `openingCash`, `closingCash`, `expectedCash`, `variance`, `openedAt`, `closedAt`, `cashierId`, `locationId`, but there are no API endpoints or UI for shift management.

## Requirements

### Open Shift
- Cashier opens a shift by entering opening cash amount
- Records: cashier (userId), location (counter), opening cash, timestamp
- Only one active shift per counter at a time
- POS billing page shows active shift info (cashier name, shift start time)

### Close Shift
- Cashier enters closing cash count
- System calculates expected cash = opening cash + all cash sales during shift
- Variance = closing cash - expected cash
- Displays summary: total sales, cash sales, card/UPI sales, cash variance
- Shift status changes from OPEN to CLOSED

### API Endpoints
- `POST /api/shifts` — Open shift (openingCash, locationId)
- `PATCH /api/shifts/[id]/close` — Close shift (closingCash)
- `GET /api/shifts/current` — Get current active shift for user/location
- `GET /api/shifts` — List shifts with filters (date, location, cashier)

### UI
- POS page: show shift status bar at top (open/closed, cashier name, start time)
- Open shift dialog when POS loads without an active shift
- Close shift dialog: enter cash count, see variance, confirm close
- Shifts history page (accessible from Reports or Settings)

## Acceptance Criteria

- [ ] Cashier can open a shift with opening cash amount
- [ ] POS shows active shift info (who, when, location)
- [ ] Cashier can close shift and enter closing cash count
- [ ] Variance is calculated automatically (expected vs actual)
- [ ] Cannot open a new shift on a counter that has an active shift
- [ ] Shift summary shows total sales, cash/card/UPI split, variance
- [ ] Shift history is viewable in a list page

## Files to Create/Modify

- `src/app/api/shifts/route.ts` — New: GET, POST
- `src/app/api/shifts/[id]/close/route.ts` — New: PATCH
- `src/app/api/shifts/current/route.ts` — New: GET
- `src/app/(dashboard)/dashboard/shifts/page.tsx` — New: Shift history
- `src/app/(dashboard)/dashboard/billing/new/page.tsx` — Add shift status bar + open/close dialogs
- `src/stores/pos-store.ts` — Add shift state