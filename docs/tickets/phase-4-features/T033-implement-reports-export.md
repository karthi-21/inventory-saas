# T033: Implement Reports Export to CSV/Excel

- **ID**: T033
- **Phase**: 4 - Features
- **Priority**: P2
- **Status**: done
- **Complexity**: M
- **Depends on**: T005
- **Blocks**: (none)

## Problem

The reports page at `/dashboard/reports` has "CSV" and "Excel" export buttons that show a toast "coming soon!" instead of actually exporting (line ~226-228). All four report types (sales, GST, inventory, outstanding) have no export capability.

## Approach

1. Add export logic to the `handleExport` function in the reports page
2. Use the `xlsx` library (already in dependencies) for Excel
3. Generate CSV manually (simple for tabular data)
4. Support all 4 report types:
   - Sales report: date, invoice#, customer, items, subtotal, GST, total
   - GST summary: HSN code, taxable value, CGST, SGST, IGST, total
   - Inventory: product, SKU, stock, value, location
   - Outstanding: customer, total due, invoices pending

5. Add file naming convention: `{report-type}-{date-range}.csv` or `.xlsx`

## Files to Modify

- `src/app/(dashboard)/reports/page.tsx` — replace "coming soon" toast with actual export logic

## Verification

- [ ] Clicking "CSV" on Sales report downloads a .csv file
- [ ] Clicking "Excel" on Sales report downloads an .xlsx file
- [ ] GST summary export includes HSN codes and tax breakdowns
- [ ] Inventory export includes stock levels and values
- [ ] Outstanding export includes customer names and due amounts
- [ ] File names include report type and date range