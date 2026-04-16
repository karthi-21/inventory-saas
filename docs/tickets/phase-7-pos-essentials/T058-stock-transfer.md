# T058: Stock Transfer Between Locations

**Priority**: P0 (production blocker)  
**Status**: todo  
**Size**: M  
**Depends on**: —

## Problem

Multi-store retailers need to transfer stock between stores/warehouses. The `StockMovementType` enum already has `TRANSFER_IN` and `TRANSFER_OUT` values, but there are no API endpoints or UI for creating transfers. This is essential for multi-store inventory management.

## Requirements

### Transfer Flow
- Select source location (store/warehouse)
- Select destination location
- Add products with quantities
- System validates: source has enough stock, source != destination
- On confirm: deduct stock from source, add stock to destination, create TRANSFER_OUT and TRANSFER_IN movements

### API Endpoints
- `POST /api/inventory/transfer` — Create transfer
- Body: `{ fromLocationId, toLocationId, items: [{ productId, variantId?, quantity }] }`
- `GET /api/inventory/transfers` — List transfers with filters

### Transfer UI
- New page: `/dashboard/inventory/transfers` — Transfer list with status
- New transfer dialog/form: source location, destination location, product search, quantities
- Transfer statuses: PENDING, COMPLETED, CANCELLED
- Each transfer shows: date, from, to, items, status, created by

### Stock Movement
- Transfer creates two stock movements: TRANSFER_OUT (from source) and TRANSFER_IN (to destination)
- Both movements reference the same transfer ID for traceability
- Stock adjustments are atomic (wrapped in transaction)

## Acceptance Criteria

- [ ] Can create a stock transfer between any two locations
- [ ] Source stock decreases and destination stock increases correctly
- [ ] Cannot transfer more stock than available at source
- [ ] Cannot transfer to the same location
- [ ] Transfer history is visible with all details
- [ ] Only users with `INVENTORY_EDIT` permission can create transfers
- [ ] Stock movements show transfer reference

## Files to Create/Modify

- `src/app/api/inventory/transfer/route.ts` — New: POST, GET
- `src/app/(dashboard)/dashboard/inventory/page.tsx` — Add Transfers tab
- `src/lib/db.ts` or prisma schema — Add Transfer model if not exists
- Stock movement logging updates