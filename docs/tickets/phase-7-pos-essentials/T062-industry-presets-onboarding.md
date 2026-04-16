# T062: Industry Presets in Onboarding

**Priority**: P2  
**Status**: todo  
**Size**: S  
**Depends on**: —

## Problem

The deep research report specifies that onboarding should adapt based on industry (grocery, pharmacy, clothing, electronics, general retail). The `storeType` field exists in the schema but is not part of the onboarding form. Industry presets would set appropriate defaults for GST rates, product categories, units, and workflow configurations.

## Requirements

### Onboarding Step
- Add industry selection step to onboarding (after store name, before completion)
- Options: Electronics, Clothing & Fashion, Grocery & Supermarket, Pharmacy, Restaurant & Food, General Retail
- Each option shows an icon and brief description

### Industry Presets
When an industry is selected, auto-configure:
- **Default categories**: Electronics → Mobiles, Laptops, Accessories, etc.; Grocery → Vegetables, Fruits, Dairy, etc.
- **Default GST rates**: Electronics mostly 18%; Grocery essentials 5%, processed 12%; Pharmacy 5%/12%
- **Default units**: Electronics → Pieces; Grocery → Kg, L, Pieces; Pharmacy → Pieces, Strips
- **Workflow flags**: Grocery → enable weight-based billing; Pharmacy → enable batch/expiry tracking

### Implementation
- Create industry preset config object mapping store types to defaults
- After onboarding, run a seed function that creates default categories with appropriate GST rates
- Store the industry type on the Store model (already has `storeType` field)

## Acceptance Criteria

- [ ] Onboarding flow includes industry selection step
- [ ] Selecting an industry auto-creates relevant default categories
- [ ] Categories have appropriate GST rates for the industry
- [ ] Store `storeType` is saved during onboarding
- [ ] POS and inventory pages adapt slightly based on store type (e.g., weight fields for grocery)

## Files to Modify

- `src/app/(onboarding)/page.tsx` or `/src/app/onboarding/page.tsx` — Add industry step
- `src/app/api/onboarding/create-store/route.ts` — Accept storeType, create categories
- `src/lib/industry-presets.ts` — New: industry configuration presets
- `prisma/seed.ts` — Update seed data with industry-aware categories