# Production Readiness Fixes - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all production readiness issues and verify the Ezvento POS SaaS system works end-to-end.

**Architecture:** Fix lint errors, RLS mismatches, E2E test failures, andenv config. Then write a comprehensive demo E2E test with video.

**Tech Stack:** Next.js 16, TypeScript, Prisma, Supabase PostgreSQL, Playwright

---

## Phase 1: Quick Static Fixes (parallelizable)

### Task 1: Fix lint errors in prisma/seed.ts

**Files:**
- Modify: `prisma/seed.ts:257,368,414,425,440`

- [ ] Replace `any[]` on line 257 with proper type
- [ ] Replace `as any` casts on lines 368, 414, 425, 440 with proper enums
- [ ] Run lint to verify 0 errors
- [ ] Commit

### Task 2: Fix RLS/schema mismatches

**Files:**
- Modify: `prisma/rls/tenant_isolation.sql`

- [ ] Remove RLS policies for `StockTransfer` and `StockTransferItem` (tables don't exist in schema)
- [ ] Rename `LoyaltyTransaction` → `LoyaltyPointsLog` in RLS policies  
- [ ] Commit

### Task 3: Fix critical lint warnings

**Files:**
- Modify: `src/components/ui/image-upload.tsx:6` (unused `Button` import)
- Modify: `src/lib/api.ts:1` (unused `NextRequest` import)
- Modify: `src/middleware.ts:36,93` (unused variables)
- Modify: `src/lib/pdf-generator.ts:17,43` (unused imports)

- [ ] Remove unused imports
- [ ] Fix unused variables
- [ ] Run lint
- [ ] Commit

---

## Phase 2: E2E Failure Investigation & Fixes (sequential, each depends on prior)

### Task 4: Fix Onboarding E2E

- [ ] Load onboarding page in browser at http://localhost:3003/onboarding
- [ ] Snapshot the page to understand structure
- [ ] Fix any mismatches between E2E selectors and actual UI
- [ ] Re-run onboarding E2E test

### Task 5: Fix Inventory CRUD E2E

### Task 6: Fix POS Billing E2E

### Task 7: Fix Settings Update E2E

### Task 8: Fix Customer Management E2E

### Task 9: Fix Report Generation E2E

---

## Phase 3: Environment & Production Config

### Task 10: Production env configuration

- [ ] Set NEXT_PUBLIC_APP_URL to production value
- [ ] Configure Upstash Redis vars
- [ ] Switch payment URLs from sandbox to production (if ready)
- [ ] Set NODE_ENV guide

---

## Phase 4: Final Verification & Demo

### Task 11: Full verification suite

- [ ] Build passes
- [ ] Lint clean (0 errors)
- [ ] Unit tests pass (79/79)
- [ ] All E2E critical flows pass

### Task 12: Demo E2E test with video

- [ ] Write comprehensive demo test covering all major flows
- [ ] Run with --video=on
- [ ] Report video path
