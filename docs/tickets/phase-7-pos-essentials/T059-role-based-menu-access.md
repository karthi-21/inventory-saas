# T059: Role-Based Menu & Page Access

**Priority**: P0 (production blocker)  
**Status**: todo  
**Size**: M  
**Depends on**: —

## Problem

The permission system is fully implemented in the backend (`requirePermission()` in all API routes), but the frontend completely ignores it. All users see all menu items regardless of their role. A cashier should only see Billing and limited inventory views, not Reports, Settings, or Team management.

## Requirements

### Menu Filtering
- Dashboard layout reads the current user's persona/permissions from API
- Navigation items are filtered based on permissions:
  - `STORE_VIEW`: Dashboard, Stores
  - `BILLING_VIEW`: Billing
  - `BILLING_CREATE`: Billing > New Sale
  - `INVENTORY_VIEW`: Inventory
  - `CUSTOMER_VIEW`: Customers
  - `VENDOR_VIEW`: Vendors
  - `REPORT_VIEW`: Reports
  - `USER_VIEW`: Team
  - `SETTINGS_VIEW`: Settings
- Users without permission see "You don't have access" page when navigating directly

### Permission Fetching
- Add `/api/auth/permissions` endpoint that returns current user's permissions
- Cache permissions in Zustand store
- Layout component uses permissions to render/hide nav items
- Pages check permissions on mount and redirect to unauthorized page if needed

### Unauthorized Page
- Simple "You don't have access to this page" component
- Shows which permission is required
- Link back to dashboard

## Acceptance Criteria

- [ ] Cashier role sees only: Dashboard, Billing, Inventory (view only)
- [ ] Manager role sees: Dashboard, Stores, Billing, Inventory, Customers, Vendors, Reports
- [ ] Owner/Admin sees all menu items
- [ ] Direct URL navigation to unauthorized pages shows "No access" message
- [ ] API routes already enforce permissions (no changes needed there)
- [ ] New user created with "Cashier" role only sees permitted pages

## Files to Modify

- `src/stores/pos-store.ts` — Add permissions state
- `src/app/(dashboard)/layout.tsx` — Filter navItems by permissions
- `src/app/api/auth/permissions/route.ts` — New endpoint
- `src/components/unauthorized-page.tsx` — New component
- All dashboard pages — Add permission check on mount