# T053: Seed Data Enhancements (More Test Records)

- **ID**: T053
- **Phase**: 6 - Production
- **Priority**: P2
- **Status**: done
- **Complexity**: M
- **Depends on**: T004
- **Blocks**: (none)

## Problem

The current seed data (`prisma/seed.ts`) is minimal:
- 1 tenant, 1 user, 1 store, 4 products, 2 customers, 1 vendor
- No sales invoices, no purchase invoices, no stock movements
- No loyalty points logs, no shift records, no activity logs

This makes it hard to test dashboards, reports, and data-heavy features. A demo store should look "lived in" with realistic data.

## Approach

Enhance `prisma/seed.ts` to create:

1. **More products**: 15-20 products across categories with varied GST rates
2. **More customers**: 8-10 customers (mix of retail/wholesale, some with GSTIN)
3. **More vendors**: 3-4 vendors with different categories
4. **Sales invoices**: 10-15 invoices over the past 30 days with varied:
   - Payment methods (CASH, UPI, CARD, split)
   - Status (PAID, PARTIAL, DUE)
   - Customer (mix of walk-in and named customers)
   - Items per invoice (1-5 items)
5. **Purchase invoices**: 3-5 purchase invoices
6. **Stock movements**: Derived from invoices (auto-created during invoice creation)
7. **Loyalty points**: A few points log entries
8. **Activity log entries**: 10-20 entries for various actions

Use a deterministic random seed so data is reproducible.

## Files to Modify

- `prisma/seed.ts` — add more data creation

## Verification

- [ ] Seed creates 15+ products across all categories
- [ ] Seed creates 8+ customers with varied types
- [ ] Seed creates 10+ sales invoices with varied statuses and payment methods
- [ ] Dashboard shows non-zero stats
- [ ] Reports show data for all report types
- [ ] Customer outstanding credit shows for DUE invoices