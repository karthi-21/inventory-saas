# Day 2: Signup, Payment & Auth Flow

## Goal
A customer selects a plan → signs up → pays via Razorpay → lands in the store wizard. No dead ends.

---

## Why This Day Matters
This is the **first 60 seconds of the customer relationship**. If signup or payment feels complicated, they leave and never come back. It must be:
- Simple: Google/phone OTP signup — no password to remember
- Fast: Payment should take <30 seconds
- Clear: They know exactly what they're paying for

---

## Customer Journey
```
[Landing "Get Started"] → [Plan Selected] → [Signup (Google or Phone OTP)] → [Razorpay Payment] → [Store Wizard]
```

---

## Tasks

### 2.1 Signup Page (`/signup`)
- [ ] Plan pre-selected from landing page query param (`?plan=grow`)
- [ ] Display selected plan prominently at top: "You're signing up for the [Grow] plan"
- [ ] Two signup options (simple, no password):
  - **Google OAuth** (primary — 1 click)
  - **Phone OTP** (secondary — for those without Google)
- [ ] Remove email/password signup (too complex for target audience)
- [ ] Legal: Add "I agree to Terms & Privacy Policy" checkbox (required for payment)
- [ ] After signup → redirect to payment immediately

### 2.2 Supabase Auth Setup
- [ ] Configure Google OAuth provider in Supabase
- [ ] Phone OTP via Supabase (using msg91 or twilio as SMS provider — or use Supabase built-in)
- [ ] Store `plan` selection in localStorage/session before redirect
- [ ] On auth callback → restore plan selection
- [ ] Create Supabase auth user → trigger webhook/edge function to create tenant record

### 2.3 Plan Selection Page (between signup & payment)
- [ ] If user skipped landing page plan selection, show plan cards here
- [ ] Show 3 plans with clear feature comparison
- [ ] "What's included" checklist per plan
- [ ] "Change plan" link if they want to switch
- [ ] "Continue with [Plan]" CTA button

### 2.4 Razorpay Integration
- [ ] Create Razorpay account + get API keys (test mode first)
- [ ] Install razorpay SDK: `npm install razorpay`
- [ ] Create `/api/payments/create-order` route
  - Input: planId, user email/phone, tenantId (after signup)
  - Output: Razorpay order_id
- [ ] Create `/api/payments/verify` route (webhook handler)
  - Verify payment signature
  - On success: activate subscription in database
  - Update tenant plan
- [ ] Create Razorpay checkout component
  - Pre-fill email/phone from signup
  - Show plan name + amount clearly
  - Support: UPI (GPay, PhonePe, Paytm, BHIM), Card, Net Banking, Wallet

### 2.5 Payment Success Flow
- [ ] On payment success → show "Payment successful!" animation
- [ ] Auto-redirect to store wizard after 2 seconds (with skip option)
- [ ] Store payment confirmation in database immediately
- [ ] Send confirmation email/SMS (use Resend or AWS SES)
  - Subject: "Welcome to OmniBIZ! Your [Plan] plan is active"
  - Body: Receipt + "Next: Set up your store in 5 minutes"

### 2.6 Error Handling
- [ ] Payment failure: Show clear error + "Try again" button
- [ ] Payment pending (UPI): Show "Waiting for confirmation..." with auto-refresh
- [ ] Network error during payment: Save state, allow retry without losing data
- [ ] Duplicate payment prevention: Idempotency key on Razorpay order creation

### 2.7 Edge Cases
- [ ] User closes browser mid-payment → webhook still fires → tenant activated → send email with wizard link
- [ ] User signs up but doesn't pay → send reminder email after 24 hours
- [ ] Plan change mid-flow: Cancel previous order, create new one

---

## ✅ COMPLETED

### What was done:
- ✅ Signup page (`/signup`) — redesigned with plan selection + Google OAuth + Phone OTP
- ✅ Plan selector on signup page (from `?plan=` query param)
- ✅ Auth callback route (`/api/auth/callback`) — handles Google OAuth redirect
- ✅ Payment page (`/payment`) — Razorpay integration with plan display
- ✅ Payment success page (`/payment/success`) — redirect to onboarding
- ✅ Razorpay SDK installed

### Files created:
- `src/app/(auth)/signup/page.tsx` — complete rewrite (Google OAuth + Phone OTP)
- `src/app/api/auth/callback/route.ts` — OAuth callback handler
- `src/app/api/payments/create-order/route.ts` — Razorpay order creation
- `src/app/api/payments/verify/route.ts` — Webhook handler
- `src/app/payment/page.tsx` — Payment page with Razorpay
- `src/app/payment/success/page.tsx` — Success page

---

## Deliverable
A non-technical retailer can:
1. Sign up with Google in 10 seconds
2. Select "Grow" plan
3. Pay ₹2,499 via UPI in 20 seconds
4. See "Payment successful!" and auto-redirect to store setup

---

## What Already Exists
- Login page at `src/app/(auth)/login/page.tsx`
- Signup page at `src/app/(auth)/signup/page.tsx` (but not complete)
- Supabase client setup at `src/lib/supabase/client.ts` and `server.ts`
- `src/middleware.ts` for auth routing

**Does NOT exist**:
- Google OAuth configuration
- Phone OTP signup
- Razorpay integration
- `/api/auth/callback` route
- `/api/payments/create-order` route
- `/api/payments/verify` webhook route

## Key Routes to Create
```
src/app/api/auth/callback/route.ts    # OAuth callback
src/app/api/auth/get-user/route.ts    # Get session user
src/app/api/payments/create-order/route.ts  # Razorpay order
src/app/api/payments/verify/route.ts  # Webhook handler
```

See [CLARIFICATIONS.md](./CLARIFICATIONS.md) for:
- Complete auth flow diagram
- Payment flow step-by-step
- Required environment variables

## Dependencies
- Day 1 (landing page plan links)
- Supabase project configured
- Razorpay test account
- Domain/email service (Resend/SES)
