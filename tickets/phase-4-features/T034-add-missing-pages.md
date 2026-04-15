# T034: Add Missing Pages (Forgot Password, Privacy, Terms)

- **ID**: T034
- **Phase**: 4 - Features
- **Priority**: P2
- **Status**: done
- **Complexity**: M
- **Depends on**: T005
- **Blocks**: (none)

## Problem

Several linked pages don't exist, causing 404 errors:

1. `/forgot-password` — linked from login page "Forgot password?" link
2. `/privacy` — linked from landing page footer
3. `/terms` — linked from landing page footer
4. `/support` — linked from landing page footer
5. `/contact` — linked from landing page footer

The login page links to `/forgot-password` but it doesn't exist, so users who forget their password get a 404.

## Approach

1. **Forgot Password page** (`/forgot-password`):
   - Email input field
   - Call `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/login' })`
   - Show "Check your email" confirmation
   - This is a critical UX flow — users can't recover accounts without it

2. **Privacy Policy** (`/privacy`):
   - Static page with standard SaaS privacy policy
   - Cover data collection (Supabase stores auth data, business data, payment records)
   - Cover third-party services (Supabase, Razorpay)

3. **Terms of Service** (`/terms`):
   - Static page with standard SaaS terms
   - Cover subscription terms, refund policy, data ownership

4. **Support** (`/support`):
   - Static page with contact info
   - Link to email, documentation
   - For v1: simple page with email support link

5. **Contact** (`/contact`):
   - Simple contact form or redirect to support page

## Files to Modify

- `src/app/(auth)/forgot-password/page.tsx` — NEW
- `src/app/privacy/page.tsx` — NEW
- `src/app/terms/page.tsx` — NEW
- `src/app/support/page.tsx` — NEW
- `src/app/contact/page.tsx` — NEW

## Verification

- [ ] `/forgot-password` page renders and can send reset email
- [ ] `/privacy` page renders with privacy policy
- [ ] `/terms` page renders with terms of service
- [ ] `/support` page renders with contact info
- [ ] `/contact` page renders or redirects
- [ ] All footer links on landing page resolve without 404