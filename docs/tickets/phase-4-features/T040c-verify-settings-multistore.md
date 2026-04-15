# T040c: Verify Settings & Multi-Store with Real Data

- **ID**: T040c
- **Phase**: 4 - Features
- **Priority**: P2
- **Status**: done
- **Complexity**: M
- **Depends on**: T004
- **Blocks**: (none)

## Problem

The settings page reads and writes tenant settings. Need to verify the full round-trip: read settings, modify, save, verify persistence. Also verify multi-store switching.

## Approach

1. **Settings** (`/dashboard/settings`):
   - Verify business details pre-populate from seed data (GSTIN, PAN, FSSAI, address)
   - Edit business name and save
   - Verify the change persists on page reload
   - Test invoice settings (prefix, round-off)
   - Test inventory alerts (low stock threshold)
   - Verify GSTIN validation (use `/api/gstin/validate`)

2. **Multi-Store**:
   - If T038 created a second store, verify store switching in dashboard layout
   - Verify data is scoped to the selected store (products, invoices, inventory)
   - Verify switching stores changes the data displayed

3. Document any failures as bugs

## Files to Modify

- None — verification only. Failures create new tickets.

## Verification

- [ ] Business details pre-populate from database
- [ ] Editing and saving business details persists
- [ ] Invoice settings (prefix, round-off) save and persist
- [ ] Inventory alert threshold saves
- [ ] GSTIN validation shows correct result
- [ ] Store switching changes displayed data
- [ ] Data is scoped to the selected store