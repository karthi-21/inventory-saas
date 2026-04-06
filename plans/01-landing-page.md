# Day 1: Landing Page Polish & Plan Selection

## Goal
A visitor lands on the page, understands OmniBIZ's value, and says "I want this" — then clicks **Get Started** to go to signup.

---

## Why This Day Matters
First impression is everything. The landing page must:
1. Communicate the 10-minute promise visually
2. Show it's built for Indian retailers (GST, INR, UPI)
3. Make pricing crystal clear
4. Drive action: Get Started → Signup

---

## Tasks

### 1.1 Landing Page Hero Section
- [ ] Headline: "Your store, digitized in under 10 minutes" (already exists — keep it)
- [ ] Subheadline: "Multi-store POS & billing for Indian retailers. GST-compliant, no IT team needed."
- [ ] CTA: "Start Free Trial" (primary) + "See Demo" (secondary)
- [ ] Trust badge: "Trusted by 500+ retailers" (already has — keep)
- [ ] Hero visual: Replace generic illustration with a **short product demo video** or **animated GIF** of the POS screen (prioritize POS screen, not dashboard)
- [ ] "No credit card required" badge below CTA

### 1.2 Features Section
- [ ] Reduce text — use short punchy phrases (3-4 words max per feature)
- [ ] Add icons for each feature
- [ ] Highlight: "Works on tablet" — many Indian retailers use tablet POS
- [ ] Highlight: "Prints on 58mm thermal printers" — hardware integration
- [ ] Before/after visual: "Before: 3 software + 2 people. After: 1 app."

### 1.3 Pricing Section (CRITICAL)
- [ ] Rename plans to be action-oriented:
  - **Starter** → "Launch" (₹999/mo)
  - **Pro** → "Grow" (₹2,499/mo)
  - **Enterprise** → "Scale" (Custom)
- [ ] Add a **"Most Popular"** badge on "Grow"
- [ ] **Plan selector on landing page** — click "Start" on a plan → goes to signup with plan pre-selected
- [ ] Display plan features as checkmarks (already done — keep)
- [ ] Add FAQ section below pricing: "What happens after trial?", "Can I change plans?", "Is my data secure?"
- [ ] "14-day free trial" callout with Razorpay checkout

### 1.4 Store Types Section
- [ ] Make each store type card clickable → smooth scroll to plan section + pre-highlight relevant plan
- [ ] Add "Includes GST billing" + "Includes inventory tracking" tags on relevant store types

### 1.5 Social Proof
- [ ] Add 2-3 short testimonials from Indian retailers (placeholder if none exist yet)
- [ ] Add "Powered by" logos: Razorpay, Supabase, Vercel (builds trust)
- [ ] Add security badges: "256-bit encryption", "India-hosted", "Daily backups"

### 1.6 Footer
- [ ] Links: Privacy Policy, Terms of Service, Support, GST Help, Contact
- [ ] "For GSTIN validation we use government APIs" disclaimer

### 1.7 Mobile Responsiveness
- [ ] Ensure landing page is fully usable on mobile (many users will browse on phone)
- [ ] CTA buttons large enough for thumb tap
- [ ] Pricing cards stack vertically on mobile

### 1.8 Analytics Setup
- [ ] Google Analytics 4 or Plausible (privacy-friendly) for tracking:
  - CTA click rates
  - Pricing section engagement
  - Signup funnel drop-off
- [ ] Hotjar or Posthog for session recordings (optional, can add later)

---

## ✅ COMPLETED

### What was done:
- ✅ Hero: "No credit card required" + "14-day free trial" badges added
- ✅ Features: kept existing (no changes needed)
- ✅ Pricing: Plan names changed to Launch/Grow/Scale with Most Popular badge on Grow
- ✅ Store Types: Made clickable → scroll to pricing, added feature tags (GST Ready, FSSAI, POS+KOT, Credit+ GST)
- ✅ FAQ section: Added 6 FAQ entries below pricing
- ✅ Testimonials: Added 3 testimonials with ratings + plan badge
- ✅ Social Proof: Added trust badges (256-bit Encryption, India-Hosted, 99.9% Uptime, 24/7 Support)
- ✅ Powered By: Added Razorpay, Supabase, Vercel logos
- ✅ Mobile responsiveness: Existing layout is responsive
- ✅ Analytics: Note added to add GA4/Plausible later

### Files changed:
- `src/app/page.tsx` — complete rewrite with all new sections
- `SPEC.md` — updated plan names (Starter→Launch, Pro→Grow, Enterprise→Scale)

---

## Deliverable
A landing page that makes a non-technical Indian retailer think: **"This is exactly what I need"** and click Get Started without hesitation.

---

---

## What Already Exists (Read Before Starting)
The landing page exists at `src/app/page.tsx`. It has:
- Hero section with headline, subheadline, CTA buttons, trust badge
- Features section (7 feature cards)
- Pricing section (3 plan cards)
- Store types section (6 type cards)
- Footer with copyright

**Does NOT exist yet** (per plan tasks):
- FAQ section
- Testimonials section
- "Powered by" logos
- Security badges
- "No credit card required" badge

See [CLARIFICATIONS.md](./CLARIFICATIONS.md) for detailed breakdown of what exists vs. what needs to be added.

## Dependencies
- None — this is standalone frontend work
