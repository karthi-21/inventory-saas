# T024: Fix Razorpay Fallback Placeholder Secrets

- **ID**: T024
- **Phase**: 3 - Critical Bugs
- **Priority**: P1
- **Status**: done
- **Complexity**: S
- **Depends on**: T001
- **Blocks**: (none)

## Problem

Three Razorpay-related API routes use `|| 'placeholder'` as fallback for environment variables:

1. `src/app/api/payments/create-order/route.ts` — `process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'`
2. `src/app/api/payments/verify/route.ts` — `process.env.RAZORPAY_WEBHOOK_SECRET || 'placeholder'`
3. `src/app/api/payments/verify-payment/route.ts` — `process.env.RAZORPAY_KEY_SECRET || 'placeholder'`

If these env vars are missing:
- Order creation will call Razorpay with invalid credentials → API error
- Payment verification will use wrong secret → signatures won't match → all payments rejected
- Webhook verification will use wrong secret → all webhooks rejected

This is a security issue: in the worst case, a placeholder secret could accidentally match a test key.

## Approach

1. Replace `|| 'placeholder'` with explicit error throwing:
   ```typescript
   const keyId = process.env.RAZORPAY_KEY_ID
   if (!keyId) throw new Error('RAZORPAY_KEY_ID is not configured')
   ```
2. Return a proper 500 error response instead of proceeding with invalid credentials
3. Do this for all three routes

## Files to Modify

- `src/app/api/payments/create-order/route.ts` — remove placeholder fallback
- `src/app/api/payments/verify/route.ts` — remove placeholder fallback
- `src/app/api/payments/verify-payment/route.ts` — remove placeholder fallback

## Verification

- [ ] Missing `RAZORPAY_KEY_ID` returns 500 with clear error message
- [ ] Missing `RAZORPAY_KEY_SECRET` returns 500 with clear error message
- [ ] Missing `RAZORPAY_WEBHOOK_SECRET` returns 500 with clear error message
- [ ] With env vars set, payment flow works normally