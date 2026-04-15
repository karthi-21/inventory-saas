# T013: Fix Reports Stock-Movement Bug

- **ID**: T013
- **Phase**: 2 - Security
- **Priority**: P1
- **Status**: done
- **Complexity**: S
- **Depends on**: T005
- **Blocks**: (none)

## Problem

In `src/app/api/reports/route.ts`, the `getStockMovement()` function has a bug on lines 326-327:

```typescript
where: {
  storeId: tenantId,  // BUG: uses tenantId as storeId
  storeId: storeId,    // Overwrites with actual storeId (or undefined)
  ...
}
```

When no `storeId` query parameter is provided, the filter becomes `{ storeId: tenantId }` which filters stock movements by a store ID equal to the tenant ID — returning zero results because no store has an ID equal to the tenant ID.

The correct pattern (used in other queries) is: `{ store: { tenantId } }`

## Approach

1. In `src/app/api/reports/route.ts`, find the `getStockMovement()` function
2. Change the `where` clause to:
   ```typescript
   where: {
     store: { tenantId },
     ...(storeId && { storeId }),
     ...
   }
   ```
3. Test with and without `storeId` filter

## Files to Modify

- `src/app/api/reports/route.ts` — fix `getStockMovement()` where clause

## Verification

- [ ] `GET /api/reports?type=stock-movement` returns results (not empty)
- [ ] `GET /api/reports?type=stock-movement&storeId=<id>` returns results for that store
- [ ] Other report types still work correctly