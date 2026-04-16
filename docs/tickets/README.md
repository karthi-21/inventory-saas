# OmniBIZ Task Board

Last updated: 2026-04-16

## Status Dashboard

| Phase | Total | Done | In Progress | Blocked | Todo |
|-------|-------|------|-------------|---------|------|
| 1. Foundation       | 6  | 6 | 0 | 0 | 0 |
| 2. Security         | 4  | 4 | 0 | 0 | 0 |
| 3. Critical Bugs    | 5  | 5 | 0 | 0 | 0 |
| 4. Features & Verify| 13 | 13 | 0 | 0 | 0 |
| 5. Testing           | 4  | 4 | 0 | 0 | 0 |
| 6. Production        | 5  | 5 | 0 | 0 | 0 |
| **7. POS Essentials** | **8** | **8** | **0** | **0** | **0** |
| **8. Credit & Settlement** | **3** | **3** | **0** | **0** | **0** |
| **9. Reporting & Compliance** | **6** | **6** | **0** | **0** | **0** |
| **10. UX Improvements** | **7** | **7** | **0** | **0** | **0** |
| **11. Production Readiness** | **9** | **9** | **0** | **0** | **0** |
| **TOTAL**            | **70** | **70** | **0** | **0** | **0** |

## Current Focus

**NEW**: Phase 11 — Production Readiness. 9 tickets covering all remaining work to get OmniBIZ from demo-ready to customer-ready.

### Phase 11 Priority Order (Work in This Sequence):

1. **T082** (P0) — Fix build, secure secrets, apply RLS, rate limiting → *Unblocks deployment*
2. **T079** (P0) — Replace Razorpay with Dodo Payments → *Unblocks subscription billing*
3. **T080** (P0) — PhonePe POS payments → *Unblocks in-store billing*
4. **T084** (P0) — Thermal receipt printing → *Unblocks physical retail*
5. **T083** (P0) — Offline POS with PWA → *Unblocks Indian retail (unreliable internet)*
6. **T081** (P0) — Transactional emails via Resend → *Unblocks customer communication*
7. **T085** (P1) — Outstanding payment reminders (email) → *Credit management*
8. **T086** (P1) — CI/CD, testing, deployment → *Production confidence*
9. **T087** (P2) — Barcode, multi-store, Excel, 2FA, mobile → *Polish*

### Key Architecture Decisions:
- **Dodo Payments** replaces Razorpay for SaaS subscriptions (Launch/Grow/Scale plans)
- **PhonePe** handles POS payment collection from store customers (UPI, QR)
- **Resend** handles all transactional emails (no SMS/WhatsApp — future scope)
- **PWA + IndexedDB** enables offline POS billing
- **ESC/POS + Web Serial API** enables thermal printer integration

## Session Continuity Protocol

1. Read this file first to orient yourself
2. Find tickets with `Status: in-progress` — resume these
3. Check `Status: blocked` tickets — see if blockers are resolved
4. Pick next `Status: todo` ticket by priority order (T082 → T079 → T080 → ...)
5. Update ticket: `Status: in-progress`
6. Do the work, check off verification items
7. Mark ticket: `Status: done`
8. Update the dashboard table above

## All Tickets

### Phase 1-6: See individual ticket files in `docs/tickets/phase-1-*` through `phase-6-*`

All 36 tickets complete. See previous README versions for history.

### Phase 7: POS Essentials (P0/P1 — production blockers)

| ID   | Title                                | Pri | Status | Size | Depends | File |
|------|--------------------------------------|-----|--------|------|---------|------|
| T055 | Invoice Cancel/Void Flow            | P0  | done   | M    | —       | [link](phase-7-pos-essentials/T055-invoice-cancel-void.md) |
| T056 | Returns & Exchanges (Credit Notes)   | P0  | done   | L    | T055    | [link](phase-7-pos-essentials/T056-returns-exchanges.md) |
| T057 | Split/Mixed Payment UI               | P0  | done   | M    | —       | [link](phase-7-pos-essentials/T057-split-mixed-payment-ui.md) |
| T058 | Stock Transfer Between Locations     | P0  | done   | M    | —       | [link](phase-7-pos-essentials/T058-stock-transfer.md) |
| T059 | Role-Based Menu & Page Access        | P0  | done   | M    | —       | [link](phase-7-pos-essentials/T059-role-based-menu-access.md) |
| T060 | Shift Management (Open/Close Shift)  | P1  | done   | M    | —       | [link](phase-7-pos-essentials/T060-shift-management.md) |
| T061 | Credit Limit Enforcement in Billing  | P1  | done   | S    | —       | [link](phase-7-pos-essentials/T061-credit-limit-enforcement.md) |
| T062 | Industry Presets in Onboarding       | P2  | done   | S    | —       | [link](phase-7-pos-essentials/T062-industry-presets-onboarding.md) |

### Phase 8: Credit & Settlement (P0/P1)

| ID   | Title                                | Pri | Status | Size | Depends | File |
|------|--------------------------------------|-----|--------|------|---------|------|
| T063 | Customer Payment Settlement UI       | P0  | done   | M    | T061    | [link](phase-8-credit-settlement/T063-customer-payment-settlement.md) |
| T064 | Outstanding Payment Reminder System  | P1  | done   | M    | —       | [link](phase-8-credit-settlement/T064-outstanding-payment-reminders.md) |
| T065 | Loyalty Points Management Page       | P2  | done   | S    | —       | [link](phase-8-credit-settlement/T065-loyalty-points-management.md) |

### Phase 9: Reporting & Compliance (P0-P2)

| ID   | Title                                | Pri | Status | Size | Depends | File |
|------|--------------------------------------|-----|--------|------|---------|------|
| T066 | GSTR-1 & GSTR-3B Report Generation  | P0  | done   | L    | —       | [link](phase-9-reporting-compliance/T066-gstr-reports.md) |
| T067 | Audit Log Viewer                     | P1  | done   | M    | —       | [link](phase-9-reporting-compliance/T067-audit-log-viewer.md) |
| T068 | Profitability Report (Margin Analysis)| P1 | done   | M    | —       | [link](phase-9-reporting-compliance/T068-profitability-report.md) |
| T069 | Staff Performance Report              | P2  | done   | S    | T067    | [link](phase-9-reporting-compliance/T069-staff-performance-report.md) |
| T070 | PDF Export for Reports & Invoices     | P1  | done   | M    | —       | [link](phase-9-reporting-compliance/T070-pdf-export.md) |
| T071 | E-Invoicing Integration (GSTN IRN)   | P2  | done   | L    | T066    | [link](phase-9-reporting-compliance/T071-e-invoicing.md) |

### Phase 10: UX Improvements (P0-P2)

| ID   | Title                                | Pri | Status | Size | Depends | File |
|------|--------------------------------------|-----|--------|------|---------|------|
| T072 | Fix Signup Page 500 Crash           | P0  | done   | S    | —       | [link](phase-10-ux-improvements/T072-fix-signup-crash.md) |
| T073 | Replace "Invoice" → "Bill" Across UI| P0  | done   | M    | —       | [link](phase-10-ux-improvements/T073-invoice-to-bill-terminology.md) |
| T074 | Replace Jargon with Plain English   | P0  | done   | M    | —       | [link](phase-10-ux-improvements/T074-replace-jargon-plain-english.md) |
| T075 | Replace Browser confirm() with Styled Dialogs | P1 | done | M    | —       | [link](phase-10-ux-improvements/T075-styled-confirm-dialogs.md) |
| T076 | Add Contextual Help to Settings     | P1  | done   | S    | T074    | [link](phase-10-ux-improvements/T076-settings-contextual-help.md) |
| T077 | Simplify Cancel/Return Dialog Text  | P1  | done   | S    | T073    | [link](phase-10-ux-improvements/T077-simplify-cancel-return-dialogs.md) |
| T078 | Add POS Keyboard Shortcuts Discoverability | P2 | done | S    | —       | [link](phase-10-ux-improvements/T078-pos-keyboard-shortcuts.md) |

### Phase 11: Production Readiness (P0-P2)

| ID   | Title                                      | Pri | Status | Size | Depends | File |
|------|--------------------------------------------|-----|--------|------|---------|------|
| T079 | Replace Razorpay with Dodo Payments (SaaS Subscriptions) | P0 | done | L | — | [link](phase-11-production-readiness/T079-dodo-payments-subscription.md) |
| T080 | PhonePe POS Payment Integration            | P0  | done   | XL   | —       | [link](phase-11-production-readiness/T080-phonepe-pos-payments.md) |
| T081 | Transactional Email System via Resend      | P0  | done   | L    | T080    | [link](phase-11-production-readiness/T081-email-transactional-system.md) |
| T082 | Fix Production Build, Security & Deploy   | P0  | done   | M    | —       | [link](phase-11-production-readiness/T082-production-build-fix-security.md) |
| T083 | Offline-Capable POS with PWA              | P0  | done   | XL   | —       | [link](phase-11-production-readiness/T083-offline-pos-pwa.md) |
| T084 | Thermal Receipt Printer Integration        | P0  | done   | M    | —       | [link](phase-11-production-readiness/T084-thermal-receipt-printing.md) |
| T085 | Outstanding Payment Reminders (Email)      | P1  | done   | M    | T081    | [link](phase-11-production-readiness/T085-outstanding-payment-reminders.md) |
| T086 | CI/CD Pipeline, Testing & Deployment       | P1  | done   | L    | T082    | [link](phase-11-production-readiness/T086-ci-cd-testing-deploy.md) |
| T087 | Remaining UX Features (Barcode, Multi-Store, Excel, 2FA, Mobile) | P2 | done | XL | — | [link](phase-11-production-readiness/T087-remaining-ux-features.md) |

## Status Values

- `todo` — not started, ready to pick up (if dependencies are done)
- `in-progress` — currently being worked on
- `blocked` — waiting on a dependency or external factor
- `done` — all verification criteria checked off
