# T079: Replace Razorpay with Dodo Payments for SaaS Subscriptions

**Priority**: P0 (production blocker — current Razorpay keys are test-mode only and hardcoded)
**Status**: done
**Size**: L
**Depends on**: —

## Problem

The current subscription payment flow uses Razorpay for SaaS plan billing (Launch ₹999/mo, Grow ₹2,499/mo, Scale custom). Razorpay's subscription APIs for recurring billing are complex, the webhook handling is fragile, and we're currently using one-time orders instead of true subscriptions. Additionally, the test keys are committed in `.env.local`.

Dodo Payments (https://dodopayments.com) is a simpler, developer-friendly payment gateway built for SaaS subscriptions with:
- Native subscription management (create, pause, cancel, upgrade/downgrade)
- Webhook events for payment success, failure, renewal, cancellation
- Dashboard for managing subscriptions
- Lower integration complexity vs. Razorpay's recurring billing

## Current State (What We Have)

### Files to Modify
| File | Current Role | Change Needed |
|------|-------------|---------------|
| `src/app/api/payments/create-order/route.ts` | Creates Razorpay order, finds/creates Subscription in DB | Replace with Dodo Payments checkout session creation |
| `src/app/api/payments/verify/route.ts` | Razorpay webhook handler (signature verification) | Replace with Dodo Payments webhook handler |
| `src/app/api/payments/verify-payment/route.ts` | Client-side Razorpay payment verification | Replace with Dodo Payments payment confirmation |
| `src/app/api/payments/subscription-status/route.ts` | Checks if tenant has active subscription | Add Dodo subscription ID lookup + grace period logic |
| `src/app/payment/page.tsx` | Loads Razorpay JS SDK, opens Razorpay checkout | Replace with Dodo Payments hosted checkout redirect |
| `src/app/payment/success/page.tsx` | Post-payment success redirect | Update to handle Dodo callback params |
| `src/lib/supabase/client.ts` | Supabase client init | No change needed |
| `prisma/schema.prisma` | `Subscription` model has `razorpayOrderId`, `razorpaySubscriptionId` | Rename to `dodoSubscriptionId`, `dodoPaymentId`, add `dodoCustomerId` |

### Schema Changes Required

```prisma
model Subscription {
  id                     String             @id @default(cuid())
  tenantId               String
  tenant                 Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  plan                   TenantPlan         @default(STARTER)
  status                 SubscriptionStatus @default(TRIALING)
  currentPeriodStart     DateTime           @default(now())
  currentPeriodEnd       DateTime           @default(now())
  
  // Dodo Payments fields (replacing Razorpay)
  dodoCustomerId         String?             // Dodo customer ID
  dodoSubscriptionId     String?             // Dodo subscription ID
  dodoPaymentId          String?             // Latest Dodo payment ID
  
  // Legacy Razorpay fields (keep for migration reference, mark optional)
  razorpayOrderId        String?             // Legacy — nullable after migration
  razorpaySubscriptionId String?             // Legacy — nullable after migration
  
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt
}
```

## Requirements

### 1. Dodo Payments SDK Setup
- Install `dodopayments` npm package
- Add env vars: `DODO_API_KEY`, `DODO_WEBHOOK_SECRET`, `DODO_BASE_URL` (sandbox vs prod)
- Create `src/lib/dodo.ts` — Dodo Payments client wrapper:
  - `createCheckout(params)` → returns checkout URL
  - `getSubscription(subscriptionId)` → returns subscription details
  - `cancelSubscription(subscriptionId)` → cancels subscription
  - `updateSubscription(subscriptionId, params)` → changes plan
  - `verifyWebhookSignature(payload, signature)` → verifies webhook authenticity

### 2. Subscription Checkout Flow
- Replace Razorpay checkout on `/payment` page:
  - When user clicks "Pay Now", call `/api/payments/create-order` which creates a Dodo checkout session
  - Redirect user to Dodo's hosted checkout page
  - After payment, Dodo redirects back to `/payment/success?session_id=xxx`
  - On success page, verify session and activate subscription

### 3. Webhook Handler
- Create `/api/payments/dodo-webhook/route.ts`:
  - Handle events: `subscription.created`, `subscription.active`, `subscription.renewed`, `subscription.cancelled`, `subscription.past_due`, `payment.succeeded`, `payment.failed`
  - Update Subscription model status accordingly
  - For `subscription.past_due`: set grace period of 7 days, show warning in dashboard
  - For `subscription.cancelled`: downgrade tenant to STARTER, show banner

### 4. Subscription Gating Middleware
- Add subscription check to dashboard middleware or layout:
  - If tenant has no active subscription and trial has expired, redirect to `/payment`
  - Show trial days remaining banner in dashboard layout
  - 14-day trial from signup date (stored as `currentPeriodStart`)
  - After trial, restrict dashboard access to billing page only

### 5. Plan Management
- Add `/api/payments/manage-subscription/route.ts`:
  - GET: Return current plan details, next billing date, payment method
  - POST: Upgrade/downgrade plan — calls Dodo API to update subscription
  - DELETE: Cancel subscription — schedules cancellation at period end

### 6. Plan Limits Enforcement
- Create `src/lib/plan-limits.ts`:
  - STARTER: 1 store, 3 users, basic reports
  - PRO: 3 stores, 10 users, full reports, customer management
  - ENTERPRISE: unlimited stores/users, API access
  - Check limits before creating stores, inviting users, etc.
  - Show upgrade prompt when limit is hit

## Test Scenarios

### Scenario 1: New User Subscribes to Launch Plan
1. User signs up with email
2. User selects Launch plan on payment page
3. User is redirected to Dodo checkout
4. User completes payment (UPI/card)
5. Dodo webhook fires `subscription.active`
6. Subscription record is created with status=ACTIVE, plan=STARTER
7. User is redirected to onboarding wizard
8. User can access all dashboard features

**Verify**: Subscription status in DB is ACTIVE, plan is STARTER, `dodoSubscriptionId` is populated

### Scenario 2: Subscription Payment Fails
1. User on PRO plan, renewal payment fails
2. Dodo webhook fires `subscription.past_due`
3. Dashboard shows yellow banner: "Payment failed — please update your payment method"
4. Grace period of 7 days — user can still access dashboard
5. After 7 days, if still unpaid, subscription status → CANCELLED
6. User is redirected to payment page on next login

**Verify**: Banner appears, grace period works, cancellation after grace period

### Scenario 3: User Upgrades from Launch to Grow
1. User navigates to Settings > Subscription
2. Clicks "Upgrade to Grow"
3. Dodo checkout opens for upgrade payment (prorated)
4. Payment succeeds
5. Webhook fires `subscription.updated`
6. Plan changes from STARTER to PRO
7. User can now add up to 3 stores and 10 users

**Verify**: Plan changed in DB, plan limits updated, no data loss

### Scenario 4: User Cancels Subscription
1. User clicks "Cancel Subscription" in settings
2. Confirmation dialog appears
3. User confirms
4. API calls Dodo cancel (at period end)
5. Dashboard shows: "Your subscription ends on [date]"
6. On end date, subscription status → CANCELLED
7. User is redirected to payment page, can still export data for 30 days

**Verify**: Cancellation is scheduled, access continues until period end, then restricted

### Scenario 5: Webhook Replay / Security
1. Attacker sends fake webhook to `/api/payments/dodo-webhook`
2. Signature verification fails → 400 response
3. No subscription state changes occur
4. Attacker sends valid webhook with modified amount
5. Signature doesn't match payload → 400 response

**Verify**: Only authentic Dodo webhooks are processed

### Scenario 6: Trial Expiry
1. New user signs up, 14-day trial starts
2. Days 1-13: full access with "X days left in trial" banner
3. Day 14: banner turns red, "Trial expired — subscribe to continue"
4. Day 15: if not subscribed, dashboard access restricted, redirect to payment
5. User subscribes → immediate access restored

**Verify**: Trial countdown works, restriction works, upgrade restores access

### Scenario 7: Razorpay Migration (Existing Users)
1. Any existing user with `razorpayOrderId` in Subscription
2. Their subscription is treated as ACTIVE (legacy)
3. On next renewal, Dodo checkout is presented
4. Old Razorpay fields are kept for reference but no longer used

**Verify**: No disruption for existing users, smooth cutover

## Files to Create/Modify

### New Files
- `src/lib/dodo.ts` — Dodo Payments client wrapper
- `src/lib/plan-limits.ts` — Subscription plan limit definitions and enforcement
- `src/app/api/payments/dodo-webhook/route.ts` — Webhook handler
- `src/app/api/payments/create-order/route.ts` — Rewrite for Dodo checkout
- `src/app/api/payments/manage-subscription/route.ts` — Plan management API
- `src/app/(dashboard)/dashboard/settings/subscription/page.tsx` — Subscription management UI

### Modified Files
- `src/app/api/payments/verify/route.ts` — Replace Razorpay webhook with Dodo
- `src/app/api/payments/verify-payment/route.ts` — Replace Razorpay verify with Dodo session verify
- `src/app/api/payments/subscription-status/route.ts` — Add Dodo lookup + trial logic
- `src/app/payment/page.tsx` — Replace Razorpay SDK with Dodo checkout redirect
- `src/app/payment/success/page.tsx` — Handle Dodo callback
- `src/app/(dashboard)/layout.tsx` — Add subscription check + trial banner
- `prisma/schema.prisma` — Add Dodo fields, keep Razorpay optional
- `src/middleware.ts` — Add subscription gating for dashboard routes
- `.env.local.example` — Add Dodo env vars

## Acceptance Criteria

- [ ] Dodo Payments checkout works end-to-end for Launch and Grow plans
- [ ] Webhook handler processes all 6 event types correctly
- [ ] Subscription status is accurately reflected in the UI
- [ ] Trial countdown banner works (14 days from signup)
- [ ] Plan upgrade/downgrade works via Dodo API
- [ ] Plan limits are enforced (stores, users)
- [ ] Cancelled subscriptions restrict access after period end
- [ ] Failed payment triggers grace period + banner
- [ ] Razorpay test keys are removed from `.env.local` and `.env.local.example`
- [ ] All Razorpay references in UI are replaced with Dodo branding
- [ ] Webhook signature verification prevents replay/spoof attacks
- [ ] Migration script handles existing Subscription records

## Environment Variables

```env
DODO_API_KEY=dodo_test_xxxxxxxx
DODO_WEBHOOK_SECRET=whsec_xxxxxxxx
NEXT_PUBLIC_DODO_PUBLIC_KEY=dodo_pub_xxxxxxxx
# Use https://api.dodopayments.com for production
# Use https://api.sandbox.dodopayments.com for testing
DODO_BASE_URL=https://api.sandbox.dodopayments.com
```
