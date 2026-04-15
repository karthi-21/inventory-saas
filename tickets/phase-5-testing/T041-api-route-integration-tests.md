# T041: API Route Integration Tests

- **ID**: T041
- **Phase**: 5 - Testing
- **Priority**: P1
- **Status**: done
- **Complexity**: L
- **Depends on**: T040
- **Blocks**: (none)

## Problem

Zero test coverage for API routes. All 30+ API endpoints have no automated tests. Any change could break them silently.

## Approach

1. Write integration tests that hit real API routes with authenticated requests:
   - Use Supabase Auth to get a real session token
   - Test each route's GET, POST, PUT, DELETE methods
   - Verify response status codes and data shapes

2. Priority routes to test first:
   - `/api/stores` — simplest CRUD, good for establishing patterns
   - `/api/products` — core entity, most complex queries
   - `/api/billing` — most important business logic (invoice creation with stock deduction)
   - `/api/reports` — aggregation queries

3. Test patterns:
   - Auth required: unauthenticated request returns 401
   - Tenant isolation: user A can't see user B's data
   - CRUD: create, read, update, delete all work
   - Validation: missing required fields return 400
   - Pagination: limit/offset work correctly

4. Create test helper utilities:
   - `createTestUser()` — signup + login helper
   - `apiCall(method, path, body, token)` — authenticated fetch wrapper
   - `cleanupTestData()` — delete test records after each suite

## Files to Modify

- `src/test/api/stores.test.ts` — NEW
- `src/test/api/products.test.ts` — NEW
- `src/test/api/billing.test.ts` — NEW
- `src/test/api/reports.test.ts` — NEW
- `src/test/helpers/` — NEW: test utility functions

## Verification

- [ ] `npm run test -- src/test/api/` runs and completes
- [ ] Tests verify auth is required for protected routes
- [ ] Tests verify CRUD operations work
- [ ] Tests verify tenant isolation
- [ ] Tests verify input validation