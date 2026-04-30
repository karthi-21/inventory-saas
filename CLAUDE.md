@AGENTS.md

## Quick Reference

```bash
npm run dev          # Next.js dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest unit tests (79 tests)
npm run test:e2e     # Playwright E2E tests (47 tests)
npm run db:seed      # Seed local DB
npm run db:studio    # Prisma Studio
```

## Stack

Next.js 16 (App Router) · Prisma + Supabase PG · Supabase Auth (PKCE) · Tailwind CSS + shadcn/ui · React Hook Form v7 + Zod v4 · Vitest · Playwright · Resend (emails) · Dodo Payments (billing)

## Environment

Copy `.env.local.example` → `.env.local`. Required vars:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` — transactional emails (invoice, password reset)
- `DODO_API_KEY`, `DODO_WEBHOOK_SECRET` — SaaS subscription payments
- `DATABASE_URL` — Prisma connection string

## Task Board

Before starting any work, read `docs/tickets/README.md` to understand current project status and find the next ticket to work on. Follow the Session Continuity Protocol defined there.

## Project Structure

- `src/` — Application source code (Next.js app router, components, lib)
- `docs/` — All project documentation
  - `docs/spec.md` — Product specification
  - `docs/reports/` — Audit reports, QA reports, status docs
  - `docs/plans/` — Development phase plans
  - `docs/tickets/` — Project ticket/issue tracking
  - `docs/testing/` — E2E test flow documentation
  - `docs/design-system/` — Design system specs
- `e2e/` — Playwright end-to-end tests
- `prisma/` — Database schema, migrations, RLS policies
- `scripts/` — Utility scripts (RLS applier, seed data)
- `public/` — Static assets

## Patterns & Gotchas

- **Tenant isolation**: Every DB query must filter by `tenantId` derived from the authenticated user. Prisma `findFirst/findMany` always include `where: { tenantId }`.
- **Permissions**: `requirePermission(module, action)` in `src/lib/api.ts` checks user persona permissions. Mutations also call `requireActiveSubscription()`.
- **Tests use globalThis mocks**: `vi.mock('@/lib/supabase/server')` and `vi.mock('@/lib/db')` read auth/prisma data from `globalThis.__EZVENTO_TEST_*__` keys. See `src/__tests__/api/helpers.ts` for shared factories.
- **InventoryStock compound key**: `[productId, variantId, storeId, locationId]` — use `variantId: ''` sentinel for products without variants.
- **Billing uses $transaction**: Invoice creation wraps invoice + items + payments + stock movement in `prisma.$transaction()`.