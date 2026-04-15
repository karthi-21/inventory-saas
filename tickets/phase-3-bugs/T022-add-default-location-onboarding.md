# T022: Add Default Location in Onboarding Create-Store

- **ID**: T022
- **Phase**: 3 - Critical Bugs
- **Priority**: P1
- **Status**: done
- **Complexity**: S
- **Depends on**: T005
- **Blocks**: (none)

## Problem

The `/api/stores` POST route creates a default Location record ("Main Showroom" of type SHOWROOM) when a new store is created. However, `/api/onboarding/create-store/route.ts` does NOT create a default location. This means stores created during onboarding have no locations, which could cause issues with inventory tracking (InventoryStock references locationId).

## Approach

1. In `src/app/api/onboarding/create-store/route.ts`, after creating the store, add:
   ```typescript
   await tx.location.create({
     data: {
       name: 'Main Location',
       type: 'SHOWROOM',
       storeId: store.id,
       tenantId: user.tenantId,
     }
   })
   ```
2. Match the same pattern as `/api/stores/route.ts`

## Files to Modify

- `src/app/api/onboarding/create-store/route.ts` — add location creation after store creation

## Verification

- [ ] Creating a store via onboarding also creates a default location
- [ ] The location appears in the store's locations list
- [ ] Inventory can be assigned to the default location