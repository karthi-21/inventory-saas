# T072: Fix Signup Page 500 Crash

**Priority**: P0  
**Status**: done  
**Size**: S  
**Depends on**: —

## Problem

The signup page at `/signup` returns a 500 Internal Server Error, blocking all new user registration. The error message displayed is "missing required error components, refreshing..." in a loop.

## Root Cause

`src/app/(auth)/signup/page.tsx` line 3 exports `export const dynamic = 'force-dynamic'` on a `'use client'` component. In Next.js App Router, route segment config exports (`dynamic`, `revalidate`, etc.) must come from Server Components. A Client Component cannot export these, causing a build/render failure that manifests as a 500 error.

Additionally, there is no `error.tsx` boundary in the `(auth)` route group, so errors bubble up to the root error boundary which produces the "missing required error components" message.

## Fix

1. Remove `export const dynamic = 'force-dynamic'` from line 3 of `src/app/(auth)/signup/page.tsx`
2. Create `src/app/(auth)/error.tsx` — an error boundary for the auth route group to prevent unhelpful error messages

## Verification

- [ ] Navigate to `http://localhost:3003/signup` — page renders without 500 error
- [ ] Use browser inspector to screenshot the signup page — form is visible and interactive
- [ ] Email signup form shows properly
- [ ] Plan selector shows Launch/Grow/Scale options
- [ ] `npx tsc --noEmit` passes with no new errors

## Files to Create/Modify

- `src/app/(auth)/signup/page.tsx` — Remove `export const dynamic = 'force-dynamic'`
- `src/app/(auth)/error.tsx` — New: auth error boundary