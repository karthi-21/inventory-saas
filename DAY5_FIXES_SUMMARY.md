# Day 5 Fixes - Payment & Onboarding Flow

## Problem Summary
The signup → payment → onboarding flow was broken. Users could sign up but couldn't proceed to payment or complete onboarding.

---

## Issues Identified

### 1. Auth Callback Issues (`/api/auth/callback/route.ts`)
- After email confirmation, the session wasn't being properly established before redirect
- User was being redirected to `/payment` without a proper tenant/subscription set up
- The callback was trying to access `localStorage` server-side (which doesn't exist)

### 2. Middleware Issues (`/middleware.ts`)
- Middleware was redirecting authenticated users from `/onboarding` to `/dashboard`
- Payment page wasn't in the public routes list
- No distinction between users who completed onboarding vs those who haven't

### 3. Payment Page Issues (`/payment/page.tsx`)
- Razorpay script loading wasn't handled properly (no check for existing script)
- No subscription status check - users with active subscriptions could still see payment page
- Payment verification handler was calling webhook endpoint incorrectly

### 4. Onboarding Page Issues (`/onboarding/page.tsx`)
- No check for existing store setup
- Users who already completed onboarding could access the page again

### 5. Dashboard Issues (`/dashboard/layout.tsx`)
- No redirect to onboarding for users who haven't completed setup
- Dashboard accessible without checking if store exists

---

## Files Created

### New API Routes
1. `/src/app/api/payments/subscription-status/route.ts` - Check if user has active subscription
2. `/src/app/api/payments/verify-payment/route.ts` - Verify Razorpay payment signature client-side
3. `/src/app/api/onboarding/status/route.ts` - Check if user has completed onboarding

### New Files
1. `/src/.env.local.example` - Environment variable template

---

## Files Modified

### 1. `/src/app/api/auth/callback/route.ts`
**Changes:**
- Removed `localStorage` access (server-side code)
- Simplified token verification flow
- Fixed user creation to include tenant/subscriptions in query
- Removed premature store creation (deferred to onboarding wizard)

### 2. `/src/middleware.ts`
**Changes:**
- Added `/payment` to public routes
- Added check for onboarding page access
- Removed redirect for authenticated users on `/onboarding`

### 3. `/src/app/payment/page.tsx`
**Changes:**
- Added `hasActiveSubscription` state check
- Added `isCheckingSubscription` loading state
- Added `isRazorpayReady` check for existing script
- Fixed payment handler to call `/api/payments/verify-payment` instead of webhook
- Added proper error handling and loading states
- Added redirect to `/onboarding` after successful payment

### 4. `/src/app/(onboarding)/page.tsx`
**Changes:**
- Added `isChecking` state for initial load
- Added `hasExistingStore` check via API
- Added redirect to dashboard if store already exists
- Added loading UI for checking states

### 5. `/src/app/(dashboard)/layout.tsx`
**Changes:**
- Added `isCheckingOnboarding` state
- Added `shouldRedirectToOnboarding` state
- Added effect to check onboarding status on mount
- Added redirect to `/onboarding` if user hasn't completed setup

---

## User Flow (Fixed)

```
1. Landing Page (/)
   └─> User selects plan
       └─> Redirects to /signup?plan=grow

2. Signup Page (/signup)
   └─> User signs up via:
       - Email/Password → receives confirmation email
       - Google OAuth → immediate redirect
       - Phone OTP → receives SMS code
   └─> After verification → /api/auth/callback

3. Auth Callback (/api/auth/callback)
   └─> Creates tenant (minimal) + trial subscription
   └─> Redirects to /payment?plan=grow

4. Payment Page (/payment)
   └─> Checks subscription status
   └─> If already active → redirect to dashboard
   └─> If not → show Razorpay payment
   └─> After payment → /onboarding

5. Onboarding Page (/onboarding)
   └─> Checks if store already exists
   └─> If yes → redirect to dashboard
   └─> If no → show setup wizard
   └─> After completion → /dashboard

6. Dashboard (/dashboard)
   └─> Checks if onboarding completed
   └─> If no → redirect to /onboarding
   └─> If yes → show dashboard
```

---

## Testing Checklist

- [ ] Sign up with email/password
- [ ] Click email confirmation link
- [ ] Verify redirect to payment page
- [ ] Complete Razorpay test payment
- [ ] Verify redirect to onboarding
- [ ] Complete onboarding wizard
- [ ] Verify redirect to dashboard
- [ ] Verify dashboard shows (not redirecting back to onboarding)
- [ ] Try accessing /onboarding again (should redirect to dashboard)
- [ ] Try accessing /payment again (should show "Already Subscribed")

---

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
DATABASE_URL=postgresql://...

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
```

---

## Known Limitations

1. **Webhook verification** - The `/api/payments/verify` route is for Razorpay webhooks only. Client-side verification happens in `/api/payments/verify-payment`.

2. **Email confirmation** - Supabase email confirmation requires the user to click the link in their email. The session is established when they click the link.

3. **Trial period** - Currently set to 30 days in the onboarding API, 14 days in auth callback. Should be standardized.

4. **Store creation** - Store is now created during onboarding wizard (not during auth callback), which is the correct flow.

---

## Next Steps (If Issues Persist)

1. Check Supabase logs for auth errors
2. Verify Razorpay test keys are correct
3. Ensure Prisma client is generated: `npx prisma generate`
4. Run migrations: `npx prisma migrate dev`
5. Check browser console for client-side errors
6. Verify middleware is not caching old routes

---

## Commands to Run

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

Access the app at: http://localhost:3003
