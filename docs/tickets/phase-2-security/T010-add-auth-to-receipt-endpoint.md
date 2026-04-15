# T010: Add Auth to Receipt Endpoint

- **ID**: T010
- **Phase**: 2 - Security
- **Priority**: P1
- **Status**: done
- **Complexity**: S
- **Depends on**: T005
- **Blocks**: (none)

## Problem

The `/api/print/receipt` endpoint has NO authentication check. Anyone can hit this endpoint and generate receipt HTML. While it doesn't expose database data (it only formats input), it's an unauthenticated API endpoint that should be protected.

## Approach

1. Add `getAuthUser()` call at the top of the POST handler in `src/app/api/print/receipt/route.ts`
2. Return 401 if user is not authenticated
3. This is a one-line fix — add the same pattern used in all other API routes

## Files to Modify

- `src/app/api/print/receipt/route.ts` — add auth check

## Verification

- [ ] `curl -X POST http://localhost:3003/api/print/receipt` without auth returns 401
- [ ] Authenticated users can still generate receipts