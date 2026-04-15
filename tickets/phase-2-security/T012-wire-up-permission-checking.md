# T012: Wire Up Permission Checking in API Routes

- **ID**: T012
- **Phase**: 2 - Security
- **Priority**: P1
- **Status**: done
- **Complexity**: L
- **Depends on**: T005
- **Blocks**: T032

## Problem

The `hasPermission()` function exists in `src/lib/api.ts` (lines ~90-110) and checks against `PersonaPermission` records in the database. However, **it is never called in any API route**. Every authenticated user can perform every action (create, update, delete) regardless of their assigned role/permissions.

The schema defines 26 permission modules (PRODUCT, INVOICE, CUSTOMER, etc.) and 5 actions (CREATE, READ, UPDATE, DELETE, MANAGE) but these are only stored in the database — never enforced at runtime.

## Approach

1. Define a middleware helper that wraps API route handlers with permission checks:
   ```typescript
   // src/lib/api.ts (add)
   export function requirePermission(module: PermissionModule, action: PermissionAction) {
     return async (handler: Function) => {
       const user = await getAuthUserWithAccess()
       if (!user) return unauthorizedResponse()
       const hasAccess = await hasPermission(user, module, action)
       if (!hasAccess) return errorResponse('Forbidden', 403)
       return handler(user)
     }
   }
   ```

2. Add permission checks to each API route:
   - `POST /api/products` → `requirePermission('PRODUCT', 'CREATE')`
   - `PUT /api/products/[id]` → `requirePermission('PRODUCT', 'UPDATE')`
   - `DELETE /api/products/[id]` → `requirePermission('PRODUCT', 'DELETE')`
   - Same pattern for all CRUD routes across modules

3. For read operations, use `requirePermission(module, 'READ')` — less restrictive but still enforced

4. Ensure the onboarding seed creates default permissions for the "Owner/Admin" persona

5. Add a 403 Forbidden response type to the API helpers

## Files to Modify

- `src/lib/api.ts` — add `requirePermission` wrapper + 403 response helper
- `src/app/api/products/route.ts` — add permission checks
- `src/app/api/products/[id]/route.ts` — add permission checks
- `src/app/api/customers/route.ts` — add permission checks
- `src/app/api/customers/[id]/route.ts` — add permission checks
- `src/app/api/vendors/route.ts` — add permission checks
- `src/app/api/vendors/[id]/route.ts` — add permission checks
- `src/app/api/billing/route.ts` — add permission checks
- `src/app/api/stores/route.ts` — add permission checks
- `src/app/api/stores/[id]/route.ts` — add permission checks
- `src/app/api/inventory/route.ts` — add permission checks
- `src/app/api/categories/route.ts` — add permission checks
- `src/app/api/categories/[id]/route.ts` — add permission checks
- `src/app/api/purchase-invoices/route.ts` — add permission checks
- `src/app/api/reports/route.ts` — add permission checks
- `src/app/api/settings/route.ts` — add permission checks

## Verification

- [ ] User without `PRODUCT:CREATE` permission gets 403 on `POST /api/products`
- [ ] User with `PRODUCT:CREATE` permission can still create products
- [ ] Read operations require at least `READ` permission
- [ ] Delete operations require `DELETE` permission
- [ ] Owner/Admin persona has all permissions by default