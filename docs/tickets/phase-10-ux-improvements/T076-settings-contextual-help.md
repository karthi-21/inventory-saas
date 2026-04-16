# T076: Add Contextual Help Tooltips to Settings Labels

**Priority**: P1  
**Status**: done  
**Size**: S  
**Depends on**: T074 (some labels change in T074)

## Problem

The Settings page has inconsistent label clarity. Some labels like "Round Off — Round totals to nearest rupee" and "FSSAI (for food businesses)" provide helpful parenthetical explanations. But most others like "GSTIN", "PAN", "Decimal Places" provide zero context. A kirana owner who doesn't know these acronyms will be confused.

## Changes

Add `<p className="text-xs text-muted-foreground">` description text below each label that lacks one. Pattern already exists in the codebase (e.g., "Round Off" has "Round totals to nearest rupee" underneath).

| Label | Add Description |
|-------|----------------|
| GST Number (GSTIN) | "Your 15-digit tax identification number" |
| PAN (Tax ID) | "10-character tax ID for income tax filing" |
| Decimal Places | "Number of decimal places in prices (2 = ₹1.00)" |
| Low Stock Warning | "Alert me this many days before stock runs out" |
| Expiry Warning | "Alert me this many days before products expire" |
| Points earned per ₹100 | "How many points a customer earns for every ₹100 spent" |
| Each point is worth (₹) | "Cash value when customer redeems points" |
| Minimum points to use at once | "Customer needs at least this many points before they can use them" |
| Points expire after (days) | "Points expire after this many days (0 = never expire)" |
| Credit Limit Mode | "SOFT = show warning, HARD = block the sale" |

Note: Labels like "GST Number (GSTIN)" and "PAN (Tax ID)" are changed by T074. This ticket adds the descriptions underneath those changed labels.

## Files to Modify

- `src/app/(dashboard)/dashboard/settings/page.tsx`

## Verification

- [ ] `/dashboard/settings` — Screenshot shows description text under each setting
- [ ] Hover over "GST Number (GSTIN)" field — "Your 15-digit tax identification number" visible
- [ ] "PAN (Tax ID)" field — "10-character tax ID for income tax filing" visible
- [ ] Loyalty section descriptions are clear for a shopkeeper
- [ ] All descriptions use simple English
- [ ] `npx tsc --noEmit` passes