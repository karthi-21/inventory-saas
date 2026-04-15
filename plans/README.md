# OmniBIZ Production Launch Plans

## Overview
14-day detailed execution plan to take OmniBIZ from current state to production launch. Each day is designed to be achievable by 1 developer in 1 day.

## The Promise
> A customer lands on our page → signs up → pays → configures their store → starts billing in **under 10 minutes**. No technical knowledge required.

---

## Day-by-Day Summary

| Day | Focus | Key Deliverable |
|-----|-------|----------------|
| 0 | [Goal & Vision](./00-goal.md) | Shared understanding of what we're building and why |
| 1 | [Landing Page](./01-landing-page.md) | Polished landing page that converts visitors |
| 2 | [Signup + Payment](./02-signup-payment.md) | User signs up, pays via Razorpay, activated instantly |
| 3 | [Store Wizard](./03-onboarding-wizard.md) | Configure store in 5 minutes, auto-detect settings |
| 4 | [POS Screen](./04-pos-screen.md) | Create invoice in <60 seconds, print receipt |
| 5 | [Products Catalog](./05-products-catalog.md) | Add 100 products in 5 minutes via CSV |
| 6 | [Customers + Vendors](./06-customers-vendors.md) | Manage customers (B2B GST, credit, loyalty) |
| 7 | [Reports + GST](./07-reports-gstr.md) | Download GSTR-1/3B data in 2 clicks |
| 8 | [Purchase Flow](./08-purchase-flow.md) | Record purchases, replenish stock |
| 9 | [Multi-Store + Settings](./09-multi-store-settings.md) | Manage stores, users, configure app |
| 10 | [Backend + Testing](./10-backend-testing.md) | Production-ready with tests |
| 11 | [Deployment + CI/CD](./11-deployment-ci-cd.md) | Live on Vercel, auto-deploy |
| 12 | [Notifications + Loyalty](./12-notifications-loyalty.md) | WhatsApp receipts, loyalty program |
| 13 | [Restaurant Mode](./13-restaurant-food.md) | Table management, KOT for restaurants |
| 14 | [UX Polish](./14-polish-ux.md) | Performance, accessibility, mobile |

---

## Critical Path (Days 1-5)
These 5 days are **mandatory** for the "under 10 minutes" promise:

```
Day 1: Landing Page
         ↓
Day 2: Signup + Payment (Razorpay)
         ↓
Day 3: Store Onboarding Wizard
         ↓
Day 4: POS Screen (billing)
         ↓
Day 5: Product Catalog (so POS has products to sell)
```

**After Day 5**: A customer can go from landing page → billing their first invoice.

---

## Post-Launch (Phase 2)
These are important but not blocking for v1:
- Days 6-9: Full feature completeness
- Days 10-11: Infrastructure & deployment
- Days 12-14: Polish & additional channels

---

## Dependencies Flow
```
Day 1 (Landing) ─────────────────┐
                                 ↓
Day 2 (Signup+Payment) ←───────┘
                                 ↓
Day 3 (Onboarding Wizard) ───────┐
                                 ↓
Day 4 (POS) ────────────────────┼──┐
                                 ↓  │
Day 5 (Products) ────────────────┼──┘
                                 ↓
Day 6 (Customers/Vendors) ←─────┘
                                 ↓
Day 7 (Reports/GST)
                                 ↓
Day 8 (Purchase Flow)
                                 ↓
Day 9 (Multi-Store/Settings)
                                 ↓
Day 10 (Testing/Infrastructure)
                                 ↓
Day 11 (Deployment)
                                 ↓
Day 12 (Notifications)
                                 ↓
Day 13 (Restaurant)
                                 ↓
Day 14 (Polish)
```

---

## Progress Tracking

### Phase 1: MVP Launch (Days 1-5) — ✅ COMPLETE
- [x] Day 1: Landing Page ✅
- [x] Day 2: Signup + Payment ✅
- [x] Day 3: Onboarding Wizard ✅
- [x] Day 4: POS Screen ✅
- [x] Day 5: Product Catalog ✅ (core features complete)

### Phase 2: Feature Complete (Days 6-9)
- [ ] Day 6: Customers + Vendors
- [ ] Day 7: Reports + GST
- [ ] Day 8: Purchase Flow
- [ ] Day 9: Multi-Store + Settings

### Phase 3: Production Ready (Days 10-11)
- [ ] Day 10: Backend + Testing
- [ ] Day 11: Deployment + CI/CD

### Phase 4: Polish (Days 12-14)
- [ ] Day 12: Notifications + Loyalty
- [ ] Day 13: Restaurant Mode
- [ ] Day 14: UX Polish

---

## Current Status
**Overall Progress: ~85%** (Days 1-5 complete ✅)

**MVP is functional!** The critical path (landing → signup → payment → onboarding → POS → products) works.

**Next steps:** Day 6-9 features (Customers, Vendors, Reports, GST, Purchases, Multi-store).

---

## How to Use These Plans

1. **Start with Day 1** — each day's plan is self-contained
2. **Check dependencies** — some days depend on previous days
3. **Read [CLARIFICATIONS.md](./CLARIFICATIONS.md)** — this contains:
   - All missing API routes that need to be created
   - File structure conventions
   - Clarifications on ambiguous instructions
   - Exact code patterns and examples
4. **Mark progress** — update the checkbox in this README
5. **Review daily** — at end of each day, review what was done
6. **Adapt as needed** — if something takes longer, adjust

> **Important**: Every day plan references routes, components, and files. The [CLARIFICATIONS.md](./CLARIFICATIONS.md) has the complete list of missing files to create. Read it first to understand the full scope.

---

## Quick Start

To begin production launch:
```bash
cd plans
# Review Day 1 plan
open 01-landing-page.md
# Start implementing
```

---

*Last updated: 2026-04-06*
