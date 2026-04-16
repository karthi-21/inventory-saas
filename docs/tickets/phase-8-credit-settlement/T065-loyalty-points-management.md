# T065: Loyalty Points Management Page

**Priority**: P2  
**Status**: done
**Size**: S  
**Depends on**: —

## Problem

Loyalty points earn and redemption work in the billing flow (points are earned on purchase, redeemed at checkout), but there is no management page to view points history, manually adjust points, or configure the loyalty program. Store owners need visibility and control over the loyalty system.

## Requirements

### Loyalty Program Settings
- Add settings section for loyalty configuration:
  - `loyaltyEnabled`: boolean (enable/disable loyalty)
  - `pointsPerRupee`: number (e.g., 1 point per ₹100 spent)
  - `rupeePerPoint`: number (e.g., ₹1 per point for redemption)
  - `minimumRedemption`: number (minimum points needed to redeem)
  - `pointsExpiryDays`: number (days until points expire, 0 = never)
- Store in TenantSettings or a new LoyaltyConfig model

### Loyalty Points History
- New page or tab on customer detail: `/dashboard/customers/[id]` → Loyalty tab
- Show points ledger: date, transaction (earn/redeem/adjust/expiry), points, running balance
- Each row links to the source invoice or adjustment record
- Filter by date range, transaction type

### Manual Points Adjustment
- Store owner can add/deduct points manually (with reason)
- Reasons: "Welcome bonus", "Goodwill adjustment", "Correction", "Other"
- Only users with `CUSTOMER_EDIT` permission can adjust points
- All adjustments logged in ActivityLog

### Points Summary on Customer List
- Add "Points" column to customer list/table
- Sortable by points balance
- Quick search: "Customers with > X points"

### Loyalty Dashboard Widget
- Small widget on main dashboard showing:
  - Total active points across all customers
  - Points earned this month
  - Points redeemed this month
  - Top loyal customers by points

## Acceptance Criteria

- [ ] Loyalty settings are configurable (points per rupee, rupee per point, minimum redemption)
- [ ] Points history is visible on customer detail page
- [ ] Manual points adjustment works with required reason field
- [ ] All adjustments are logged in the activity log
- [ ] Customer list shows points column
- [ ] Loyalty can be disabled per tenant
- [ ] Points expiry calculation is correct (if configured)

## Files to Create/Modify

- `src/app/(dashboard)/settings/page.tsx` — Add loyalty settings section
- `src/app/(dashboard)/customers/[id]/page.tsx` — Add Loyalty tab
- `src/app/api/customers/[id]/loyalty/route.ts` — New: GET points history, POST manual adjustment
- `src/app/api/settings/loyalty/route.ts` — New: GET/PUT loyalty config
- `prisma/schema.prisma` — Add LoyaltyConfig to TenantSettings
- `src/app/(dashboard)/dashboard/page.tsx` — Add loyalty widget