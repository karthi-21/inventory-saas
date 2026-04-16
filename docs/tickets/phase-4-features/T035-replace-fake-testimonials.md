# T035: Replace Landing Page Fake Testimonials

- **ID**: T035
- **Phase**: 4 - Features
- **Priority**: P2
- **Status**: done
- **Complexity**: S
- **Depends on**: (none)
- **Blocks**: (none)

## Problem

The landing page testimonials are completely fabricated:
- "Rajesh Kumar" — Sharma Electronics, Chennai (fake)
- "Priya Patel" — FreshMart Supermarket, Ahmedabad (fake)
- "Mohammed Ali" — Fresh Zone, Hyderabad (fake)

Using fake testimonials is a legal risk (FTC/ASCI guidelines in India require real testimonials) and undermines trust.

Also, the "Watch Demo" button is a no-op (no onClick handler).

## Approach

1. Replace testimonials with either:
   - **Option A**: Remove the testimonial section entirely (cleanest for v1)
   - **Option B**: Replace with feature highlights or stats
   - **Option C**: Use real testimonials from beta users (requires actual users)

2. For v1, recommend Option A or B — remove the section or replace with:
   - "500+ businesses trust Ezvento" (stat-based, no fake quotes)
   - Feature comparison table
   - Use case cards

3. Fix "Watch Demo" button:
   - Link to a demo video URL (if one exists)
   - Or remove the button
   - Or link to `/signup` with a free trial

## Files to Modify

- `src/app/page.tsx` — remove/replace testimonials section, fix Watch Demo button

## Verification

- [ ] No fabricated testimonial quotes or names appear on the landing page
- [ ] "Watch Demo" button either works or is removed
- [ ] Landing page still looks professional without testimonials