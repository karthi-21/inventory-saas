# T066: GSTR-1 & GSTR-3B Report Generation

**Priority**: P0 (production blocker)  
**Status**: todo  
**Size**: L  
**Depends on**: —

## Problem

Indian GST law requires businesses to file GSTR-1 (outward supply details) and GSTR-3B (summary return) monthly/quarterly. The current Reports page has a GST Summary tab but it only shows a basic HSN-wise breakdown. There is no formatted report that matches the government's prescribed format, no B2B invoice listing, no intra/inter-state supply bifurcation, and no export capability in the GST return format.

## Requirements

### GSTR-1 Report
The GSTR-1 return requires these sections:
- **B2B Invoices**: List of all B2B (inter-state) supplies with GSTIN of buyer
  - Fields: buyer GSTIN, invoice number, date, taxable value, CGST, SGST, IGST, total
- **B2C Large**: Inter-state supplies to unregistered persons > ₹2.5L (for small taxpayers)
- **B2C Small**: Supplies to unregistered persons (intra-state and inter-state)
  - Grouped by rate and state
- **HSN Summary**: HSN-wise summary of outward supplies (mandatory for turnover > ₹5Cr)
  - Fields: HSN code, description, quantity, taxable value, CGST, SGST, IGST, total tax
- **Credit/Debit Notes**: All credit/debit notes (linked to returns in T056)
- **Document Summary**: Count of invoices issued per series

### GSTR-3B Summary
- Summary of outward supplies (same data as GSTR-1 but in aggregate form)
- Input tax credit (ITC) claimed
- Tax liability and tax paid
- Show as a simple table matching the GSTR-3B format:
  - Table 3.1: Outward supplies (rate-wise, split by intra/inter-state)
  - Table 4: Inward supplies (ITC)
  - Net tax liability

### Report UI
- New tab in Reports: "GST Returns"
- Sub-tabs: GSTR-1, GSTR-3B
- Filters: period (month/quarter), store (if multi-store)
- Each section is expandable/collapsible
- Data matches invoice records exactly (no discrepancies)

### Export
- **JSON export**: GSTR-1 in the government-prescribed JSON format (uploadable to GST portal)
  - Format spec: https://developer.gst.gov.in/apiportal/taxpayer/gstr-1
- **Excel export**: Human-readable Excel with all GSTR-1 sections as separate sheets
- **PDF export**: Formatted PDF matching GSTR-3B form layout

### API Endpoints
- `GET /api/reports/gstr1?period=YYYY-MM&storeId=` — Generate GSTR-1 data
- `GET /api/reports/gstr3b?period=YYYY-MM&storeId=` — Generate GSTR-3B summary
- `GET /api/reports/gstr1/export?format=json&period=YYYY-MM` — Export in GST portal JSON format

## Acceptance Criteria

- [ ] GSTR-1 report shows all B2B invoices with buyer GSTIN
- [ ] GSTR-1 report shows HSN-wise summary with correct tax breakdown
- [ ] GSTR-1 correctly bifurcates intra-state (CGST+SGST) vs inter-state (IGST)
- [ ] GSTR-3B shows rate-wise outward supply summary matching Table 3.1 format
- [ ] Reports can be filtered by month/quarter and store
- [ ] JSON export matches the GST portal upload format
- [ ] Cancelled invoices are excluded from GST reports
- [ ] Credit/debit notes are included in GSTR-1 (if T056 is implemented)
- [ ] All tax calculations match the source invoices exactly

## Files to Create/Modify

- `src/app/api/reports/gstr1/route.ts` — New: GSTR-1 data generation
- `src/app/api/reports/gstr3b/route.ts` — New: GSTR-3B summary generation
- `src/app/api/reports/gstr1/export/route.ts` — New: JSON/Excel/PDF export
- `src/app/(dashboard)/dashboard/reports/page.tsx` — Add GST Returns tab
- `src/lib/gst-formats.ts` — New: GSTR-1 JSON format specification
- `src/lib/gst-calculations.ts` — New: GST calculation helpers (bifurcation, rounding)