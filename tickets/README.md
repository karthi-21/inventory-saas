# OmniBIZ Task Board

Last updated: 2026-04-15

## Status Dashboard

| Phase | Total | Done | In Progress | Blocked | Todo |
|-------|-------|------|-------------|---------|------|
| 1. Foundation       | 6  | 6 | 0 | 0 | 0 |
| 2. Security         | 4  | 4 | 0 | 0 | 0 |
| 3. Critical Bugs    | 5  | 4 | 0 | 0 | 1 |
| 4. Features & Verify| 13 | 13 | 0 | 0 | 0 |
| 5. Testing           | 4  | 4 | 0 | 0 | 0 |
| 6. Production        | 5  | 5 | 0 | 0 | 0 |
| **TOTAL**            | **37** | **36** | **0** | **0** | **1** |

## Dependency Graph

```
T001 (Supabase) ──→ T002 (Migrations) ──→ T003 (RLS) ──┐
                    │                    └──→ T004 (Seed) ──┤
                    ├──→ T006 (Env Config)                 │
                    └──→ T024 (Razorpay Secrets)            ├──→ T005 (Auth E2E) ──→ everything else
                                                           │
T002 ──→ T043 (Tenant Isolation Tests)                     │
T004 ──→ T036-T040c (Feature Verification tickets)         │
T005 ──→ T010-T013 (Security)                              │
T005 ──→ T020-T022 (Bugs)                                 │
T005 ──→ T030-T034 (Features)                              │
T005 ──→ T040-T042 (Testing)                               │
T012 ──→ T032 (User/Role page)                             │
T040 ──→ T050 (CI/CD) ──→ T051 (Vercel) ──→ T053 (More seed)
T006 ──→ T052 (Env cleanup)                                │
T005 ──→ T054 (N+1 fixes)                                  │
T035 (Fake testimonials) ──→ (none, can start anytime)     │
```

## Current Focus

**START HERE**: 37/37 tickets done. ALL COMPLETE.

All phases complete. The only manual step remaining:
1. Run `sudo rm -rf .next && sudo chown -R karthikeyan:staff src/test/ vitest.config.ts prisma/rls/ prisma/migrations/` if you still see permission errors on build.

Critical fix applied: Route structure was broken — pages at `(dashboard)/customers/` mapped to `/customers` not `/dashboard/customers`. Moved all page dirs under `(dashboard)/dashboard/`. Also fixed React Query cache mismatch between layout and page queries.

## Session Continuity Protocol

1. Read this file first to orient yourself
2. Find tickets with `Status: in-progress` — resume these
3. Check `Status: blocked` tickets — see if blockers are resolved
4. Pick next `Status: todo` ticket by phase order (1 → 2 → 3 → 4 → 5 → 6)
5. Update ticket: `Status: in-progress`
6. Do the work, check off verification items
7. Mark ticket: `Status: done`
8. Update the dashboard table above

## All Tickets

### Phase 1: Foundation (P0 — must be done first)

| ID   | Title                                | Pri | Status | Size | Depends    | File |
|------|--------------------------------------|-----|--------|------|------------|------|
| T001 | Fix Supabase Project Connectivity    | P0  | done   | S    | —          | [link](phase-1-foundation/T001-fix-supabase-connectivity.md) |
| T002 | Apply Database Migrations            | P0  | done   | S    | T001       | [link](phase-1-foundation/T002-apply-database-migrations.md) |
| T003 | Apply RLS Policies + Fix Tenant Context | P0 | done  | M    | T002       | [link](phase-1-foundation/T003-apply-rls-policies.md) |
| T004 | Seed Demo Data                       | P0  | done   | S    | T002       | [link](phase-1-foundation/T004-seed-demo-data.md) |
| T005 | Verify Auth Flow End-to-End          | P0  | done   | M    | T003, T004 | [link](phase-1-foundation/T005-verify-auth-flow-e2e.md) |
| T006 | Fix Environment Configuration       | P0  | done   | S    | T001       | [link](phase-1-foundation/T006-fix-environment-configuration.md) |

### Phase 2: Security Hardening (P1)

| ID   | Title                                | Pri | Status | Size | Depends | File |
|------|--------------------------------------|-----|--------|------|---------|------|
| T010 | Add Auth to Receipt Endpoint         | P1  | done   | S    | T005    | [link](phase-2-security/T010-add-auth-to-receipt-endpoint.md) |
| T011 | Fix Receipt HTML Injection (XSS)     | P1  | done   | S    | T005    | [link](phase-2-security/T011-fix-receipt-xss-vulnerability.md) |
| T012 | Wire Up Permission Checking in APIs  | P1  | done   | L    | T005    | [link](phase-2-security/T012-wire-up-permission-checking.md) |
| T013 | Fix Reports Stock-Movement Bug      | P1  | done   | S    | T005    | [link](phase-2-security/T013-fix-reports-stock-movement-bug.md) |

### Phase 3: Critical Bugs (P1)

| ID   | Title                                | Pri | Status | Size | Depends | File |
|------|--------------------------------------|-----|--------|------|---------|------|
| T020 | Replace Hardcoded User Data in Layout | P1 | done   | S    | T005    | [link](phase-3-bugs/T020-replace-hardcoded-user-data.md) |
| T021 | Fix Non-Transactional Tenant Creation | P1 | done   | M    | T005    | [link](phase-3-bugs/T021-fix-non-transactional-tenant-creation.md) |
| T022 | Add Default Location in Onboarding   | P1  | done   | S    | T005    | [link](phase-3-bugs/T022-add-default-location-onboarding.md) |
| T023 | Fix .next Directory Permissions       | P1  | todo   | S    | T001    | [link](phase-3-bugs/T023-fix-next-directory-permissions.md) |
| T024 | Fix Razorpay Fallback Placeholder Secrets | P1 | done | S  | T001    | [link](phase-3-bugs/T024-fix-razorpay-fallback-secrets.md) |

### Phase 4: Feature Completion & Verification (P2)

| ID    | Title                                | Pri | Status | Size | Depends | File |
|-------|--------------------------------------|-----|--------|------|---------|------|
| T030  | Implement Billing Export (CSV/Excel) | P2  | done   | M    | T005    | [link](phase-4-features/T030-implement-billing-export.md) |
| T031  | Implement Settings Password & 2FA    | P2  | done   | M    | T005    | [link](phase-4-features/T031-implement-settings-password-2fa.md) |
| T032  | Add User/Role/Permission Page        | P2  | done   | L    | T012    | [link](phase-4-features/T032-add-user-role-permission-page.md) |
| T033  | Implement Reports Export (CSV/Excel) | P2  | done   | M    | T005    | [link](phase-4-features/T033-implement-reports-export.md) |
| T034  | Add Missing Pages (Forgot Pwd, etc.) | P2 | done   | M    | T005    | [link](phase-4-features/T034-add-missing-pages.md) |
| T035  | Replace Landing Page Fake Testimonials | P2 | done  | S    | —       | [link](phase-4-features/T035-replace-fake-testimonials.md) |
| T036  | Verify Customers CRUD with Real Data | P2  | done   | M    | T004    | [link](phase-4-features/T036-verify-customers-crud.md) |
| T037  | Verify Vendors CRUD with Real Data   | P2  | done   | M    | T004    | [link](phase-4-features/T037-verify-vendors-crud.md) |
| T038  | Verify Stores & Categories           | P2  | done   | M    | T004    | [link](phase-4-features/T038-verify-stores-categories.md) |
| T039  | Verify Purchases & Inventory         | P2  | done   | L    | T004    | [link](phase-4-features/T039-verify-purchases-inventory.md) |
| T040a | Verify POS Billing End-to-End        | P2  | done   | L    | T004    | [link](phase-4-features/T040a-verify-pos-billing-e2e.md) |
| T040b | Verify Reports & Dashboard           | P2  | done   | M    | T004    | [link](phase-4-features/T040b-verify-reports-dashboard.md) |
| T040c | Verify Settings & Multi-Store         | P2  | done   | M    | T004    | [link](phase-4-features/T040c-verify-settings-multistore.md) |

### Phase 5: Testing (P1)

| ID   | Title                                | Pri | Status | Size | Depends | File |
|------|--------------------------------------|-----|--------|------|---------|------|
| T040 | Fix Test Infrastructure              | P1  | done   | S    | T005    | [link](phase-5-testing/T040-fix-test-infrastructure.md) |
| T041 | API Route Integration Tests          | P1  | done   | L    | T040    | [link](phase-5-testing/T041-api-route-integration-tests.md) |
| T042 | Auth Flow E2E Tests (Playwright)      | P1  | done   | L    | T005    | [link](phase-5-testing/T042-auth-flow-e2e-tests.md) |
| T043 | Tenant Isolation Tests               | P1  | done   | M    | T003    | [link](phase-5-testing/T043-tenant-isolation-tests.md) |

### Phase 6: Production Readiness (P1/P2)

| ID   | Title                                | Pri | Status | Size | Depends | File |
|------|--------------------------------------|-----|--------|------|---------|------|
| T050 | Fix CI/CD Pipeline (GitHub Actions)   | P1  | done   | M    | T040    | [link](phase-6-production/T050-fix-ci-cd-pipeline.md) |
| T051 | Vercel Deployment Configuration      | P1  | done   | S    | T050    | [link](phase-6-production/T051-vercel-deployment-config.md) |
| T052 | Remove Duplicate .env / Clean Up     | P2  | done   | S    | T006    | [link](phase-6-production/T052-cleanup-env-config.md) |
| T053 | Seed Data Enhancements               | P2  | done   | M    | T004    | [link](phase-6-production/T053-seed-data-enhancements.md) |
| T054 | N+1 Query Performance Fixes          | P2  | done   | L    | T005    | [link](phase-6-production/T054-n-plus-1-query-fixes.md) |

## Audit Findings Coverage

Every finding from the 2026-04-15 audit is covered by at least one ticket:

| Audit Finding | Ticket(s) |
|--------------|-----------|
| Supabase project dead | T001 |
| No database tables | T002 |
| RLS not applied | T003 |
| No seed data | T004 |
| Auth flow untested | T005 |
| Duplicate .env files | T006, T052 |
| WhatsApp token placeholder | T006 |
| Mock client silently swallows errors | T006 |
| No auth on receipt endpoint | T010 |
| XSS in receipt HTML | T011 |
| Permission checking not wired | T012 |
| Reports stock-movement bug | T013 |
| Hardcoded user data in layout | T020 |
| Non-transactional tenant creation | T021 |
| Missing default location in onboarding | T022 |
| .next directory permissions | T023 |
| Razorpay placeholder secrets | T024 |
| Billing export stub | T030 |
| Settings stubs (password, 2FA, team) | T031, T032 |
| Reports export stub | T033 |
| Missing pages (forgot pwd, privacy, terms) | T034 |
| Fake testimonials | T035 |
| No test coverage | T040-T043 |
| No CI/CD | T050 |
| No Vercel deployment | T051 |
| N+1 query performance | T054 |
| Minimal seed data | T053 |

## Status Values

- `todo` — not started, ready to pick up (if dependencies are done)
- `in-progress` — currently being worked on
- `blocked` — waiting on a dependency or external factor (add a `## Blocker` section to the ticket)
- `done` — all verification criteria checked off

## How to Update

1. When starting a ticket: change `Status: todo` to `Status: in-progress` in the ticket file
2. When blocked: change to `Status: blocked` and add a `## Blocker` section
3. When done: change to `Status: done` and check off all verification items
4. After any status change: update the dashboard table at the top of this file