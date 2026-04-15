# T037: Verify Vendors CRUD with Real Data

- **ID**: T037
- **Phase**: 4 - Features
- **Priority**: P2
- **Status**: done
- **Complexity**: M
- **Depends on**: T004
- **Blocks**: (none)

## Problem

The Vendors page code looks complete but has never been tested with a live database. Need to verify the full flow works end-to-end.

## Approach

1. Log in as demo user
2. Navigate to `/dashboard/vendors`
3. Verify the demo vendor (Samsung India Electronics) appears
4. Test Create: add a new vendor with all fields (name, GSTIN, PAN, bank details, state)
5. Test Read: search for the new vendor
6. Test Update: edit vendor details
7. Test Delete: delete a vendor (soft delete)
8. Test GSTIN validation integration
9. Document any failures as bugs

## Files to Modify

- None — verification only. Failures create new tickets.

## Verification

- [ ] Demo vendor appears in the list
- [ ] Create vendor succeeds with all fields
- [ ] Search works correctly
- [ ] Edit vendor saves changes
- [ ] Delete vendor removes from list
- [ ] Bank details save and display correctly
- [ ] Indian states dropdown works