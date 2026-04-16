# T086: CI/CD Pipeline, Test Coverage & Deployment

**Priority**: P1 (essential for production confidence, not a day-1 blocker for demo)
**Status**: todo
**Size**: L
**Depends on**: T082 (build fix)

## Problem

The codebase has near-zero test coverage (4 skeleton test files, 1 E2E test). There's no CI/CD pipeline, no automated testing, no deployment automation. For a production SaaS handling financial transactions, this is a critical gap.

## Current State

- `vitest.config.ts` exists with basic config
- `src/__tests__/` has 4 test files (tenant isolation, billing, products, stores)
- `src/test/` has setup and mock files (MSW handlers)
- `e2e/auth.spec.ts` — 1 Playwright test file
- No GitHub Actions workflows
- No lint checks in CI
- No deployment pipeline (Vercel deployment guide exists but not automated)
- No seed data script tested
- Build fails (see T082)

## Requirements

### 1. GitHub Actions CI Pipeline

Create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
  
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx tsc --noEmit
  
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx prisma generate
      - run: npm run test -- --coverage
      - uses: actions/upload-artifact@v4
        with: { name: coverage, path: coverage/ }
  
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

### 2. Unit Tests — Critical Paths

Write tests for the most critical business logic:

#### `src/__tests__/api/billing.test.ts` (Expand existing)
- Create invoice with valid data → 201
- Create invoice with invalid data → 400
- Create invoice with insufficient stock → 400
- Create invoice with credit payment → checks credit limit
- Create invoice with mixed payment → validates total matches
- Cancel invoice → stock restored, credit reversed
- Return invoice → partial return calculates correctly

#### `src/__tests__/api/customers.test.ts` (New)
- Create customer → 201
- Create customer with duplicate phone → 409
- Get customer with outstanding → includes credit balance
- Settle payment → reduces outstanding balance
- Credit limit enforcement → blocks sale if over limit

#### `src/__tests__/api/products.test.ts` (Expand existing)
- Create product with all fields → 201
- Create product with duplicate SKU → 409
- Search products by name → returns matches
- Search products by barcode → returns exact match
- CSV import with valid data → creates products
- CSV import with invalid data → returns errors

#### `src/__tests__/api/inventory.test.ts` (New)
- Stock adjustment (damage) → reduces stock
- Stock adjustment (found) → increases stock
- Stock transfer between locations → correct deduction and addition
- Low stock alert → triggers notification

#### `src/__tests__/api/reports.test.ts` (New)
- Sales report with date filter → correct totals
- GST report → correct CGST/SGST/IGST breakdown
- Profitability report → correct margin calculation
- GSTR-1 report → correct outward supply data

#### `src/__tests__/lib/escpos.test.ts` (New)
- ESC/POS builder generates correct byte sequences
- Receipt template produces valid commands
- Barcode generation works
- QR code generation works

#### `src/__tests__/lib/emails.test.ts` (New)
- Template rendering produces valid HTML
- Email sending with Resend (mocked) works
- Failed email is logged with error
- Email preferences respected (skip when disabled)

### 3. E2E Tests — Critical User Journeys

#### `e2e/auth.spec.ts` (Expand existing)
- Login with valid credentials → dashboard
- Login with invalid credentials → error message
- Signup with email → creates account
- Signup with existing email → error message
- Logout → redirects to login

#### `e2e/billing.spec.ts` (New)
- Create invoice with cash payment → invoice appears in list
- Create invoice with credit → customer balance updated
- Cancel invoice → status changes to CANCELLED
- Search product by name → product appears in results
- Hold and recall bill → held bill restored

#### `e2e/inventory.spec.ts` (New)
- Add new product → product appears in list
- Adjust stock → quantity updated
- Search products → results filtered

#### `e2e/customers.spec.ts` (New)
- Add new customer → customer appears in list
- View customer details → shows outstanding balance
- Send payment reminder → email triggered (mocked)

#### `e2e/reports.spec.ts` (New)
- View sales report → shows correct data
- Download CSV → file downloads
- View GST report → correct breakdown

### 4. Vercel Deployment Pipeline

Update `vercel.json` and add deployment workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 5. Seed Data for Testing

Update `prisma/seed.ts`:
- Create demo tenant with stores
- Create demo user (demo@ezvento.karth-21.com / Demo@123456)
- Create sample products with categories
- Create sample customers
- Create sample invoices (paid, unpaid, cancelled)
- Create sample vendors
- Make idempotent (check if data exists before creating)

Add npm script: `npm run db:seed`

### 6. Pre-commit Hooks

Install `husky` + `lint-staged`:
- Pre-commit: run `eslint` and `prettier` on staged files
- Pre-push: run `vitest run` (unit tests)

## Test Scenarios

### Scenario 1: CI Pipeline Runs on PR
1. Developer creates PR
2. GitHub Actions triggers CI workflow
3. Lint, typecheck, and test jobs all pass
4. PR is approved and merged
5. Deploy workflow triggers → Vercel deployment

**Verify**: All CI checks pass, deployment succeeds

### Scenario 2: CI Catches a Bug
1. Developer introduces a bug in billing API
2. Pushes to branch
3. CI runs unit tests
4. `billing.test.ts` fails
5. PR shows failed check
6. Developer fixes the bug
7. CI passes on next push

**Verify**: Bug caught before merge, CI prevents regression

### Scenario 3: E2E Test Covers Signup Flow
1. Playwright runs E2E tests
2. Opens browser, navigates to /signup
3. Fills form, submits
4. Verifies redirect to onboarding
5. Verifies dashboard loads

**Verify**: Full signup flow works end-to-end

### Scenario 4: Seed Data Works
1. Run `npm run db:seed`
2. Demo user created: demo@ezvento.karth-21.com
3. Login with demo user
4. Dashboard shows sample data
5. Products, customers, invoices visible

**Verify**: Seed script is idempotent, creates realistic data

### Scenario 5: Coverage Report
1. Run `npm run test:coverage`
2. Coverage report generated
3. Key files have >80% coverage:
   - `src/lib/api.ts`
   - `src/app/api/billing/route.ts`
   - `src/app/api/customers/route.ts`
4. Overall coverage >60%

**Verify**: Coverage report accurate, key files well-tested

## Files to Create/Modify

### New Files
- `.github/workflows/ci.yml` — CI pipeline
- `.github/workflows/deploy.yml` — Deploy to Vercel
- `src/__tests__/api/customers.test.ts` — Customer API tests
- `src/__tests__/api/inventory.test.ts` — Inventory API tests
- `src/__tests__/api/reports.test.ts` — Reports API tests
- `src/__tests__/lib/escpos.test.ts` — ESC/POS tests
- `src/__tests__/lib/emails.test.ts` — Email tests
- `e2e/billing.spec.ts` — Billing E2E tests
- `e2e/inventory.spec.ts` — Inventory E2E tests
- `e2e/customers.spec.ts` — Customer E2E tests
- `e2e/reports.spec.ts` — Reports E2E tests

### Modified Files
- `src/__tests__/api/billing.test.ts` — Expand with more scenarios
- `src/__tests__/api/products.test.ts` — Expand with more scenarios
- `prisma/seed.ts` — Add comprehensive demo data
- `package.json` — Add test:coverage script, lint-staged, husky
- `vercel.json` — Add cron job config for reminders

## Acceptance Criteria

- [ ] CI pipeline runs on every PR (lint, typecheck, test)
- [ ] CI pipeline runs on every push to main (lint, typecheck, test, deploy)
- [ ] Unit tests cover critical API routes (billing, customers, products, inventory, reports)
- [ ] Unit test coverage >60% overall, >80% on critical paths
- [ ] E2E tests cover auth, billing, inventory, customers, reports
- [ ] E2E tests run in CI with test Supabase project
- [ ] Vercel deployment is automated from main branch
- [ ] Seed data script creates realistic demo data
- [ ] Seed data script is idempotent (can run multiple times)
- [ ] Pre-commit hooks run lint and format
- [ ] Pre-push hooks run unit tests
- [ ] Coverage report is generated and accessible
