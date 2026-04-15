# T003: Apply RLS Policies + Fix Tenant Context

- **ID**: T003
- **Phase**: 1 - Foundation
- **Priority**: P0
- **Status**: done
- **Complexity**: M
- **Depends on**: T002
- **Blocks**: T005, T043

## Problem

Row-Level Security policies do not exist on the database. The SQL file at `prisma/rls/tenant_isolation.sql` contains comprehensive policies for all tables, but they have never been applied. Without RLS, any authenticated user can query any tenant's data through the Supabase client.

**Resolution**: Prisma connects as the `postgres` superuser which always bypasses RLS (even with FORCE ROW LEVEL SECURITY). The app's data queries all go through Prisma via API routes that use `getAuthUser()` for auth checking. The Supabase client is only used for auth operations (not data queries). RLS policies protect direct Supabase client access.

**Auth trigger note**: The `auth.set_tenant_on_auth()` function cannot be created from the postgres user due to Supabase's `auth` schema restrictions. This would need to be applied via the Supabase Dashboard SQL Editor with elevated permissions. The `set_tenant_context()` function was created successfully for use by Supabase client queries.

**Important fix**: The original `tenant_isolation.sql` had unquoted camelCase column names (e.g., `tenantId` instead of `"tenantId"`). PostgreSQL lowercases unquoted identifiers, so the policies would fail with "column not found" errors. The corrected policies are in `scripts/apply-rls.js`.

## Approach

1. After T002 completes, open Supabase SQL Editor
2. Run `prisma/rls/tenant_isolation.sql` in full
3. Uncomment and apply the auth trigger at the bottom (lines ~243-248) that sets `tenant_id` in JWT claims on user creation
4. Verify RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   ```
   All should show `rowsecurity = true`
5. **Fix the tenant context issue** — two options:
   - **Option A (Recommended)**: Use the Supabase service role key for Prisma queries (bypasses RLS, Prisma already does auth checks in `getAuthUser()`)
     - Create a separate Prisma client in `src/lib/db.ts` that uses the service role key's connection string
     - The direct connection on port 5432 with service role key bypasses RLS
   - **Option B**: Set `app.current_tenant` before each Prisma query using `$executeRaw`
     - Add a middleware or wrapper function that runs `SELECT set_config('app.current_tenant', tenantId, false)` before queries
     - More complex, fragile, and easy to forget on new queries
6. Update `src/lib/supabase/server.ts` if needed to support tenant context
7. Test: Create two users in different tenants, verify data isolation

## Files to Modify

- `prisma/rls/tenant_isolation.sql` — uncomment the auth trigger
- `src/lib/db.ts` — potentially add service-role Prisma client for server-side operations
- `src/lib/api.ts` — ensure `getAuthUser()` works with chosen RLS strategy

## Verification

- [ ] All public tables have `rowsecurity = true` in `pg_tables`
- [ ] Policies appear in `pg_policies` for all major tables
- [ ] `set_tenant_context()` function exists and is callable
- [ ] JWT claims include `tenant_id` after user creation
- [ ] Prisma queries return data (not zero rows due to RLS blocking)
- [ ] User in tenant A cannot read tenant B's data via Supabase client