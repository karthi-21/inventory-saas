# T056: Returns & Exchanges (Credit Notes)

**Priority**: P0 (production blocker)  
**Status**: todo  
**Size**: L  
**Depends on**: T055

## Problem

Customers frequently return or exchange products. Without a returns flow, retailers cannot process refunds or exchanges, and stock is not restored for returned items. The `SalesReturn` model exists in Prisma but has zero API endpoints or UI.

## Requirements

### Returns Flow
- New model: `SalesReturn` already exists with `SalesReturnItem` (items returned per return)
- Return types: FULL_REFUND, PARTIAL_REFUND, EXCHANGE
- Process: Select original invoice → select items to return → choose return type → process

### API Endpoints
- `POST /api/returns` — Create a return with items, return type, reason
- `GET /api/returns` — List returns with filters (date, store, invoice)
- `GET /api/returns/[id]` — Get return details

### Return Processing Logic
- For each returned item, restore stock quantity (create `SALES_RETURN` stock movement)
- For FULL_REFUND: refund entire invoice amount
- For PARTIAL_REFUND: refund only returned items' amounts
- For EXCHANGE: no refund, just swap items (deduct exchange item stock, restore returned item stock)
- Update original invoice: reduce `amountPaid` or `amountDue` by refund amount
- If refund to customer credit: increase `creditBalance` on Customer
- If refund via UPI/cash: record payment method

### UI
- Returns page at `/dashboard/returns` with list of returns
- "New Return" flow: search invoice → select items → choose return type → confirm
- Return reasons: Defective, Wrong Item, Customer Changed Mind, Duplicate, Other
- Return detail view showing original invoice, returned items, refund amount

## Acceptance Criteria

- [ ] Can create a full refund return that restores all stock and refunds the customer
- [ ] Can create a partial return that restores specific item stock
- [ ] Can process an exchange (return item A, take item B) with stock adjustments
- [ ] Returns are tracked with `SalesReturn` model and activity log
- [ ] Original invoice is updated (reduced totals or marked as refunded)
- [ ] Customer credit balance is adjusted correctly
- [ ] Returns list page shows all returns with filtering
- [ ] Only users with `BILLING_CANCEL` permission can process returns

## Files to Create/Modify

- `src/app/api/returns/route.ts` — New: GET, POST
- `src/app/api/returns/[id]/route.ts` — New: GET
- `src/app/(dashboard)/dashboard/returns/page.tsx` — New: Returns list page
- `src/app/(dashboard)/dashboard/returns/new/page.tsx` — New: Create return flow
- `src/app/(dashboard)/dashboard/layout.tsx` — Add Returns nav item