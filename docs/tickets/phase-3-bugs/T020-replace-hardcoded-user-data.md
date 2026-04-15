# T020: Replace Hardcoded User Data in Dashboard Layout

- **ID**: T020
- **Phase**: 3 - Critical Bugs
- **Priority**: P1
- **Status**: done
- **Complexity**: S
- **Depends on**: T005
- **Blocks**: (none)

## Problem

The dashboard layout (`src/app/(dashboard)/layout.tsx`) has hardcoded user data instead of fetching from the API or auth session:

- User name: "Rajesh K." (line ~322) — hardcoded
- User email: "rajesh@sharmaelectronics.in" (line ~327-328) — hardcoded
- Store selector: "Chennai Showroom" and "Coimbatore Branch" (lines ~167-172) — hardcoded dropdown items
- Plan label: "Pro Plan" (line ~158) — hardcoded

These values never change regardless of who is logged in.

## Approach

1. Fetch user data from auth session + API:
   - Use `supabase.auth.getUser()` for email
   - Fetch `/api/tenant` for plan and business name
   - Fetch `/api/stores` for real store list
2. Replace hardcoded strings with dynamic values from API responses
3. Add loading skeletons for user info while data loads
4. Keep the store selector as a proper dropdown populated from `/api/stores`

## Files to Modify

- `src/app/(dashboard)/layout.tsx` — replace hardcoded data with API calls

## Verification

- [ ] User name shows the actual logged-in user's name
- [ ] User email shows the actual logged-in user's email
- [ ] Store selector shows real stores from the database
- [ ] Plan label shows the actual tenant's plan (STARTER/PRO/ENTERPRISE)
- [ ] Values update when switching users