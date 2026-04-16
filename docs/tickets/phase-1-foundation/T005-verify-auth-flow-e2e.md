# T005: Verify Auth Flow End-to-End

- **ID**: T005
- **Phase**: 1 - Foundation
- **Priority**: P0
- **Status**: done
- **Complexity**: M
- **Depends on**: T003, T004
- **Blocks**: T010, T011, T012, T013, T020, T021, T022, T030-T040c, T042

## Problem

Even with a working Supabase project, the auth flow has multiple points of failure that need to be verified end-to-end:
1. Supabase Auth user creation (signup) may not create a corresponding Prisma `User` record
2. The auth callback at `/api/auth/callback-server` creates the Prisma user but has no transaction safety
3. The onboarding wizard at `/onboarding` may not correctly link the user to a tenant
4. The middleware may not correctly detect authenticated sessions
5. The dashboard layout fetches some data from API (notifications) but has hardcoded user info

## Approach

1. **Test Signup → Onboarding → Dashboard flow**:
   - Navigate to `/signup`, select a plan, create account with email
   - Verify redirect to `/payment` or `/onboarding`
   - Complete onboarding (create store)
   - Verify redirect to `/dashboard`
   - Verify dashboard loads with real data

2. **Test Login flow**:
   - Log out
   - Navigate to `/login`
   - Log in with the created credentials
   - Verify redirect to `/dashboard`
   - Verify session persists on refresh

3. **Test Auth Middleware**:
   - While logged out: `/dashboard` redirects to `/login`
   - While logged in: `/login` redirects to `/dashboard`
   - API routes return `{"error":"Unauthorized"}` without session

4. **Test API with Auth**:
   - While logged in, hit `/api/stores` — should return the demo store
   - Hit `/api/products` — should return demo products
   - Hit `/api/customers` — should return demo customers

5. **Test Google OAuth** (if enabled — currently `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=false`):
   - Skip for now, but note for future

6. **Test Phone OTP** (if enabled — currently `NEXT_PUBLIC_ENABLE_PHONE_AUTH=false`):
   - Skip for now

7. **Document any failures** found during the test and create follow-up tickets

## Files to Modify

- None — this is a verification-only ticket. Failures create new tickets.

## Verification

- [ ] New user can sign up via email at `/signup`
- [ ] After signup, user is redirected to onboarding or payment
- [ ] Onboarding creates a tenant, store, and links the user
- [ ] After onboarding, dashboard loads with real data from API
- [ ] Login works with existing credentials
- [ ] Session persists across page refresh
- [ ] Auth middleware correctly redirects unauthenticated users
- [ ] Authenticated API calls return real data (not 401)
- [ ] Demo user (`demo@ezvento.karth-21.com`) can log in and see demo data