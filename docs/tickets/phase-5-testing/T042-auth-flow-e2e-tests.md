# T042: Auth Flow E2E Tests

- **ID**: T042
- **Phase**: 5 - Testing
- **Priority**: P1
- **Status**: done
- **Complexity**: L
- **Depends on**: T005
- **Blocks**: (none)

## Problem

The authentication flow (signup → onboarding → dashboard → login → logout) has no automated tests. Previous fixes (documented in DAY5_FIXES_SUMMARY.md) were manual only.

## Approach

1. Use Playwright for E2E tests (already available via MCP plugin)
2. Write test scenarios:
   - **Signup flow**: Navigate to /signup → select plan → create account → verify redirect
   - **Onboarding flow**: After signup → fill onboarding form → create store → verify redirect to dashboard
   - **Login flow**: Navigate to /login → enter credentials → verify dashboard loads
   - **Logout flow**: Click logout → verify redirect to /login → verify session is gone
   - **Protected routes**: While logged out, navigate to /dashboard → verify redirect to /login
   - **Auth redirect**: While logged in, navigate to /login → verify redirect to /dashboard

3. Test utilities:
   - Create a test user in Supabase Auth before tests
   - Clean up test user after tests
   - Use the demo user for login tests

## Files to Modify

- `src/test/e2e/auth.spec.ts` — NEW: Playwright E2E test
- `playwright.config.ts` — NEW: Playwright configuration

## Verification

- [ ] `npx playwright test` runs the auth test suite
- [ ] Signup flow test passes
- [ ] Login flow test passes
- [ ] Logout flow test passes
- [ ] Protected route redirect test passes