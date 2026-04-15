# T021: Fix Non-Transactional Tenant Creation Routes

- **ID**: T021
- **Phase**: 3 - Critical Bugs
- **Priority**: P1
- **Status**: done
- **Complexity**: M
- **Depends on**: T005
- **Blocks**: (none)

## Problem

Two API routes create tenant + user + store records without using a Prisma transaction. If any step fails partway through, orphaned records are left in the database:

1. `/api/tenants/route.ts` (POST) — creates Tenant, then User, then Store, then StoreAccess sequentially with no `$transaction()`
2. `/api/auth/callback-server/route.ts` (POST) — creates Tenant, then User, then Subscription sequentially with no `$transaction()`

The main onboarding route `/api/onboarding/route.ts` (POST) correctly uses `prisma.$transaction()` — this is the pattern to follow.

## Approach

1. Wrap `/api/tenants/route.ts` POST handler in `prisma.$transaction()`:
   ```typescript
   const result = await prisma.$transaction(async (tx) => {
     const tenant = await tx.tenant.create({...})
     const user = await tx.user.create({...})
     const store = await tx.store.create({...})
     // ... etc
     return { tenant, user, store }
   })
   ```

2. Wrap `/api/auth/callback-server/route.ts` POST handler in `prisma.$transaction()` similarly

3. Test failure scenarios: if store creation fails, tenant and user should be rolled back

## Files to Modify

- `src/app/api/tenants/route.ts` — wrap in transaction
- `src/app/api/auth/callback-server/route.ts` — wrap in transaction

## Verification

- [ ] Both routes use `prisma.$transaction()`
- [ ] Simulated failure (e.g., invalid store data) rolls back all records
- [ ] Successful creation still works as before