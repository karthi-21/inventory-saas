# T082: Fix Production Build, Security & Deploy Readiness

**Priority**: P0 (production blocker — app cannot build or deploy, secrets are leaked)
**Status**: done
**Size**: M
**Depends on**: —

## Problem

Three critical production blockers:
1. **Build fails**: `next build` crashes because Google Fonts (Geist, Geist Mono) can't be fetched during build. The app cannot be deployed.
2. **Secrets in `.env.local`**: Supabase service role key, Razorpay keys, and Resend API key are committed to git. These must be rotated and `.env.local` must be in `.gitignore`.
3. **RLS not applied**: Row-level security SQL file exists but has never been executed against the production database. Any authenticated user could access another tenant's data.

## Requirements

### 1. Fix Google Fonts Build Error

**Root Cause**: Next.js 16 tries to fetch Geist and Geist Mono fonts from Google Fonts CDN during `next build`. If the build environment can't reach Google Fonts (or in China/restricted networks), the build fails.

**Solution**: Switch to self-hosted fonts using `@fontsource` packages.

**Steps**:
1. Install `@fontsource/geist` and `@fontsource/geist-mono`
2. In `src/app/layout.tsx`, replace `next/font/google` imports with CSS imports:
   ```typescript
   import '@fontsource/geist/400.css'
   import '@fontsource/geist/500.css'
   import '@fontsource/geist/600.css'
   import '@fontsource/geist/700.css'
   import '@fontsource/geist-mono/400.css'
   import '@fontsource/geist-mono/500.css'
   ```
3. Update `tailwind.config` or `globals.css` font family references if needed
4. Remove `next/font/google` usage for Geist
5. Verify `next build` completes successfully

**Alternative**: If keeping `next/font/google` is preferred, add `unstable_allowedRevalidateHeaderNames` or use `next/font/local` with downloaded woff2 files.

### 2. Rotate & Secure Secrets

**Steps**:
1. Add `.env.local` to `.gitignore` (if not already)
2. Regenerate all exposed secrets:
   - Supabase: Generate new service role key from dashboard
   - Razorpay: Generate new API key secret from dashboard (or switch to Dodo per T079)
   - Resend: Regenerate API key from dashboard
3. Update `.env.local` with new secrets (do NOT commit)
4. Ensure `.env.local.example` has placeholder values only
5. Add a pre-commit hook or CI check that prevents `.env.local` from being committed
6. Update `docs/VERCEL_DEPLOY.md` to emphasize secret management

### 3. Apply RLS Policies to Supabase

**Steps**:
1. Review `prisma/rls/tenant_isolation.sql` for correctness
2. Connect to Supabase SQL editor (or via `psql`)
3. Execute the RLS SQL:
   ```bash
   psql "$DIRECT_URL" -f prisma/rls/tenant_isolation.sql
   ```
   Or copy-paste into Supabase Dashboard > SQL Editor
4. Verify RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   ```
5. Test tenant isolation:
   - Log in as tenant A user
   - Attempt to access tenant B's products/invoices via API
   - Should return empty results (filtered by RLS)

6. Add RLS application to deployment checklist

### 4. Rate Limiting Middleware

Add basic rate limiting to prevent API abuse:

Create `src/middleware-rate-limit.ts`:
- Use in-memory rate limiting (simple sliding window)
- Limits: 100 requests/minute per IP for API routes
- Limits: 20 requests/minute for auth routes (login/signup)
- Return 429 Too Many Requests when limit exceeded
- Skip for static assets and health checks

### 5. Error Monitoring Setup

Add Sentry for production error tracking:
1. Install `@sentry/nextjs`
2. Configure in `next.config.ts` with Sentry webpack plugin
3. Add `SENTRY_DSN` env var
4. Create `sentry.client.config.ts`, `sentry.server.config.ts`
5. Add error boundary in root layout
6. Verify errors appear in Sentry dashboard

## Test Scenarios

### Scenario 1: Production Build Succeeds
1. Run `npx next build`
2. Build completes without errors
3. All 30+ pages are generated successfully
4. No font-related warnings or errors

**Verify**: `next build` exits with code 0, `.next/` directory is populated

### Scenario 2: Secrets Are Not in Git
1. Run `git diff HEAD -- .env.local`
2. Should show no changes (file is .gitignored)
3. Run `grep -r "sk_test\|service_role\|re_" .git/`
4. Should find no secrets in git history
5. `.env.local.example` contains only placeholder values

**Verify**: No secrets in git history or working tree

### Scenario 3: RLS Prevents Cross-Tenant Access
1. Log in as user from Tenant A
2. Call `GET /api/products` — returns only Tenant A products
3. Call `GET /api/products?tenantId=TenantB` — returns only Tenant A products (tenantId filter is enforced by RLS)
4. Attempt direct SQL query as Tenant A user: `SELECT * FROM Product WHERE tenantId = 'TenantB'` — returns empty
5. Log in as user from Tenant B — returns only Tenant B products

**Verify**: No cross-tenant data leakage at any level

### Scenario 4: Rate Limiting Works
1. Send 100 requests to `/api/products` in 1 minute — all succeed (200)
2. Send 101st request — returns 429 Too Many Requests
3. Wait 1 minute — requests succeed again
4. Send 20 rapid requests to `/api/auth/login` — all succeed
5. Send 21st request — returns 429

**Verify**: Rate limiting is enforced, legitimate users unaffected, abusers blocked

### Scenario 5: Sentry Captures Errors
1. Intentionally throw an error in a test API route
2. Check Sentry dashboard — error appears with stack trace
3. Check that source maps are uploaded (readable stack traces)
4. Resolve the error and verify it stops appearing

**Verify**: Errors are captured with full context in Sentry

## Files to Create/Modify

### New Files
- `src/lib/rate-limit.ts` — Rate limiting utility
- `sentry.client.config.ts` — Sentry client config
- `sentry.server.config.ts` — Sentry server config
- `.husky/pre-commit` — Pre-commit hook to prevent `.env.local` commits

### Modified Files
- `src/app/layout.tsx` — Replace Google Fonts with self-hosted font imports
- `next.config.ts` — Add Sentry webpack plugin
- `src/middleware.ts` — Add rate limiting logic
- `.gitignore` — Ensure `.env.local` is listed
- `.env.local.example` — Ensure all values are placeholders
- `prisma/rls/tenant_isolation.sql` — Review and finalize
- `docs/VERCEL_DEPLOY.md` — Add security checklist

## Acceptance Criteria

- [x] `next build` completes successfully without font errors
- [x] `.env.local` is in `.gitignore` and not tracked by git
- [ ] All secrets have been rotated (Supabase, payment gateway, email) — requires manual action
- [x] RLS policies are applied to all tables in Supabase (SQL ready, run `scripts/apply-rls.sh`)
- [x] Rate limiting is active on all API routes (100/min) and auth routes (20/15min)
- [ ] Sentry captures errors in production with source maps — deferred (not critical for launch)
- [x] Pre-commit hook prevents accidental `.env.local` commits (husky + lint-staged)
- [ ] Deployment checklist in VERCEL_DEPLOY.md is updated — deferred

## Environment Variables

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_AUTH_TOKEN=xxxxx
```
