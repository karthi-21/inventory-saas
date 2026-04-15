# T043: Tenant Isolation Tests

- **ID**: T043
- **Phase**: 5 - Testing
- **Priority**: P1
- **Status**: done
- **Complexity**: M
- **Depends on**: T003
- **Blocks**: (none)

## Problem

Multi-tenant data isolation is a core security requirement but has no automated tests. The existing test at `src/test/utils/tenant-isolation.test.ts` has type errors and doesn't actually test isolation.

## Approach

1. Fix the existing test file or rewrite it
2. Test tenant isolation at multiple levels:
   - **API level**: User A's API request returns only their tenant's data
   - **Database level** (if RLS is applied): Direct Supabase queries respect RLS policies
   - **Cross-tenant access**: User A cannot access User B's products, customers, invoices, etc.

3. Test scenarios:
   - Create two tenants with data
   - Login as tenant A, verify only A's data visible
   - Try to access tenant B's data by ID → 403 or 404
   - Try to create data in tenant B → rejected
   - Switch to tenant B user, verify only B's data visible

## Files to Modify

- `src/test/utils/tenant-isolation.test.ts` — fix or rewrite
- `src/test/api/tenant-isolation.test.ts` — NEW: API-level isolation tests

## Verification

- [ ] User A's API calls return only A's data
- [ ] User A cannot read User B's data by ID
- [ ] User A cannot create data in User B's tenant
- [ ] RLS policies (if applied) block cross-tenant access at database level