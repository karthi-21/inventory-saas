# T036: Verify Customers CRUD with Real Data

- **ID**: T036
- **Phase**: 4 - Features
- **Priority**: P2
- **Status**: done
- **Complexity**: M
- **Depends on**: T004
- **Blocks**: (none)

## Problem

The Customers page code looks complete (real API calls, forms, CRUD operations) but has never been tested with a live database. Need to verify the full flow works end-to-end with seeded data.

## Approach

1. Log in as demo user
2. Navigate to `/dashboard/customers`
3. Verify the demo customers (Priya Sharma, Quick Mart) appear
4. Test Create: add a new customer with all fields (name, phone, email, type, GSTIN)
5. Test Read: search for the new customer, filter by type and due status
6. Test Update: edit customer details (change phone, add GSTIN)
7. Test Delete: delete a customer (soft delete)
8. Test loyalty points: check if points display correctly
9. Test credit tracking: check if outstanding credit shows
10. Document any failures as bugs

## Files to Modify

- None — verification only. Failures create new tickets.

## Verification

- [ ] Demo customers appear in the list
- [ ] Create customer succeeds and appears in list
- [ ] Search filters work correctly
- [ ] Type filter (Retail/Wholesale) works
- [ ] Edit customer saves changes
- [ ] Delete customer removes from list
- [ ] Loyalty points display (if seed data has them)
- [ ] Outstanding credit displays correctly