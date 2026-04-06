# Day 10: Backend Infrastructure, Testing & Polish

## Goal
Ensure the app is production-ready: database migrations run, environment configured, tests written, and the app handles errors gracefully.

---

## Why This Day Matters
Without proper infrastructure setup, deployment will fail. Without tests, every change risks breaking existing functionality. This day ensures everything works.

---

## Tasks

### 10.1 Prisma Database Setup
- [ ] Run `prisma migrate dev` locally to generate migrations
- [ ] Review generated SQL for correctness
- [ ] Create production migration: `prisma migrate deploy`
- [ ] Seed database with:
  - Default tenant (for testing)
  - Default admin user
  - Sample products/categories for demo store
- [ ] Create `.env.production` with all required env vars
- [ ] Verify all 40+ tables exist in Supabase

### 10.2 Environment Variables Checklist
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=postgresql://...

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Email (Resend)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 10.3 API Error Handling Audit
- [ ] All API routes must have:
  - [ ] Authentication check (`getAuthUser`)
  - [ ] Input validation (Zod schema)
  - [ ] Proper error responses (4xx, 5xx)
  - [ ] No raw error messages in response (use generic messages)
  - [ ] Rate limiting on sensitive endpoints (login, signup, payment)
- [ ] Add `try/catch` with `handlePrismaError` everywhere
- [ ] Add request logging (structured JSON logs)

### 10.4 Security Checklist
- [ ] Row Level Security (RLS) policies in Prisma schema (if using Supabase directly)
- [ ] All API routes validate `tenantId` from authenticated user
- [ ] No data leakage between tenants (test: create invoice in tenant A, try to fetch from tenant B API)
- [ ] Sanitize all user inputs (prevent XSS in product names, etc.)
- [ ] HTTPS only in production
- [ ] CORS configured for production domain only

### 10.5 Unit Tests (Basic)
- [ ] Test billing GST calculation logic
- [ ] Test invoice number generation
- [ ] Test stock movement calculations
- [ ] Test permission checking
- [ ] Use Vitest (as specified in SPEC.md)
- [ ] Target: 80% coverage on business logic (GST, discounts, inventory)

### 10.6 Integration Tests
- [ ] Test signup → onboarding → first invoice flow
- [ ] Test billing: create invoice → verify stock decremented
- [ ] Test multi-store transfer flow
- [ ] Use Playwright for E2E tests

### 10.7 Error Pages
- [ ] Custom 404 page
- [ ] Custom 500 page
- [ ] Error boundaries in React components
- [ ] Toast notifications for API errors (Sonner already installed)

### 10.8 Loading States & Skeletons
- [ ] Add skeleton loaders for:
  - Dashboard
  - Products list
  - Billing list
  - Reports
- [ ] Disable buttons during loading
- [ ] Optimistic UI updates where appropriate

### 10.9 Supabase Edge Functions (Optional)
- [ ] If using Supabase Edge Functions for any logic:
  - Configure CORS
  - Set timeout limits
  - Add error handling

### 10.10 Performance
- [ ] Add React Query caching strategies:
  - Products: cache 5 min, stale 10 min
  - Inventory: no cache (always fresh)
  - Customers: cache 1 min
- [ ] Add `loading="lazy"` to below-fold images
- [ ] Optimize Prisma queries: select only needed fields, add indexes

---

## Deliverable
A production-ready app with:
- Database migrations applied
- All environment variables configured
- Tests passing
- No security vulnerabilities
- Graceful error handling

---

## Dependencies
- All previous days complete
- Supabase project
- Vitest + Playwright installed
