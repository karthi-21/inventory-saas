# T051: Vercel Deployment Configuration

- **ID**: T051
- **Phase**: 6 - Production
- **Priority**: P1
- **Status**: done
- **Complexity**: S
- **Depends on**: T050
- **Blocks**: T053

## Problem

The project has never been deployed to production. Vercel configuration needs to be set up with proper environment variables, domain, and build settings.

## Approach

1. Connect repo to Vercel:
   - Import from GitHub repository
   - Configure build: `next build`
   - Set output directory: `.next`

2. Configure environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `RAZORPAY_KEY_ID` (production key)
   - `RAZORPAY_KEY_SECRET` (production secret)
   - `RAZORPAY_WEBHOOK_SECRET`
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (production domain)
   - `NEXT_PUBLIC_APP_NAME`

3. Configure custom domain (if available)
4. Set up preview deployments for PRs

## Files to Modify

- No code changes — Vercel dashboard configuration only

## Verification

- [ ] Vercel deployment succeeds
- [ ] Production URL loads the landing page
- [ ] Signup flow works on production
- [ ] Environment variables are set (check `/api/gstin/validate` works)
- [ ] Preview deployments work for PRs