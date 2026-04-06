# OmniBIZ - Production Launch Plan

## Ultimate Goal
**A customer should be able to**: land on our page → signup → pay → configure their store → start billing in **under 10 minutes** — no technical knowledge required.

---

## Customer Journey (The North Star)

```
[Landing Page] → [Signup + Plan Selection] → [Razorpay Payment] → [Store Wizard] → [Dashboard]
                                                                                              ↓
                                                                                    Start Billing Immediately
                                                                                         ↓
                                                         Add Products → Create Invoice → Done!
```

---

## Core Principle
**Every feature we build must serve this journey**. If it doesn't help a new user go from zero to billing in 10 minutes, it deprioritized unless it's a blocker.

---

## Key Assumptions
- Supabase Cloud for database + auth
- Vercel for frontend hosting
- Razorpay for payments (India-standard)
- Prisma as ORM
- No mobile app (web only for v1)

---

## Launch Criteria
1. A new user can signup, pay, configure store, and create an invoice in <10 minutes
2. Landing page clearly communicates value + pricing
3. No dead-end pages or "Coming Soon" in the critical path
4. GST-compliant invoices can be generated
5. Core POS (add product, create sale, print receipt) works end-to-end

---

## What's NOT in Scope for v1
- Mobile app
- Offline POS
- E-invoice/GST API integration (phase 2)
- Restaurant KOT system (phase 2)
- Multi-language (phase 2)
- White-label / custom domain
- Franchise mode
- Accounting GL export
