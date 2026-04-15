# T038: Verify Stores & Categories with Real Data

- **ID**: T038
- **Phase**: 4 - Features
- **Priority**: P2
- **Status**: done
- **Complexity**: M
- **Depends on**: T004
- **Blocks**: (none)

## Problem

Stores and Categories pages code looks complete but needs end-to-end verification with live data.

## Approach

1. **Stores** (`/dashboard/stores`):
   - Verify demo store (Chennai Main Store) appears
   - Test Create: add a second store (e.g., "Bangalore Branch")
   - Test Edit: change store name, type, GSTIN
   - Test Archive: archive a store, verify it moves to Archived tab
   - Test Restore: restore an archived store
   - Test search: filter stores by name

2. **Categories** (`/dashboard/categories`):
   - Verify demo categories appear in tree view (Mobiles, TVs, Accessories, Audio)
   - Test Create: add a new category with HSN code
   - Test Create Sub-category: add child category under an existing one
   - Test Edit: rename a category, change parent
   - Test Delete: try deleting category with products (should fail), delete empty category
   - Test tree expand/collapse

3. Document any failures as bugs

## Files to Modify

- None — verification only. Failures create new tickets.

## Verification

- [ ] Demo store appears in active stores list
- [ ] Create/edit/archive/restore store works
- [ ] Demo categories appear in tree view
- [ ] Create/edit/delete category works
- [ ] Sub-categories display correctly under parent
- [ ] Category with products cannot be deleted
- [ ] Store type selection works (ELECTRONICS, GROCERY, etc.)