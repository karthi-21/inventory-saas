# T030: Implement Billing Export (CSV/Excel)

- **ID**: T030
- **Phase**: 4 - Features
- **Priority**: P2
- **Status**: done
- **Complexity**: M
- **Depends on**: T005
- **Blocks**: (none)

## Problem

The billing page at `/dashboard/billing` has an "Export" button (line ~94-96) that has no `onClick` handler. It's a dead button. Users cannot export their invoice list to CSV or Excel.

## Approach

1. Create a download handler that fetches filtered invoices and converts to CSV
2. Use the existing `xlsx` library (already in package.json) for Excel export
3. Add a dropdown to the Export button: "Export as CSV" / "Export as Excel"
4. Reuse the same search/status filters from the current view
5. Generate the file client-side using Blob URLs

## Files to Modify

- `src/app/(dashboard)/billing/page.tsx` — add export handler to button
- `src/app/api/billing/route.ts` — may need to add a `format=csv` or `format=xlsx` response mode (or handle client-side)

## Verification

- [ ] Clicking "Export" shows CSV/Excel options
- [ ] CSV export downloads a file with all visible invoices
- [ ] Excel export downloads a properly formatted .xlsx file
- [ ] Export respects current search and status filters