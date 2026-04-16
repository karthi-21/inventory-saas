# T070: PDF Export for Reports & Invoices

**Priority**: P1  
**Status**: done
**Size**: M  
**Depends on**: —

## Problem

The Reports page has CSV export but no PDF export. The Excel export button shows "coming soon". In Indian retail, business owners need PDF invoices to send to customers and PDF reports for accounting/auditing. Receipts currently use `window.print()` which is not professional-quality output.

## Requirements

### Invoice PDF
- Generate professional invoice PDFs that match the invoice detail view
- Include: store logo/name, GSTIN, customer details, line items, taxes, totals
- Support both A4 (full invoice) and thermal 80mm (receipt) formats
- Add "Download PDF" button on invoice detail page (T055)
- Add "Print Receipt" button that generates thermal receipt PDF for download

### Report PDFs
- All report tabs (Sales, GST, Inventory, Outstanding, Profitability, Staff) should have a "Download PDF" button
- PDF should include:
  - Store name and logo
  - Report title and period
  - Applied filters
  - Summary cards at top
  - Data tables
  - Page numbers and footer
- Landscape orientation for wide tables

### Implementation Approach
- Use a server-side PDF generation library (not browser-dependent):
  - **@react-pdf/renderer** — React components → PDF (good for complex layouts)
  - **Puppeteer/Playwright** — HTML → PDF (good for consistent rendering)
  - **jsPDF** — Lightweight, client-side generation
- Recommended: `@react-pdf/renderer` for invoices (custom layout), Playwright for reports (HTML tables)
- Alternative: Use a single approach for consistency

### API Endpoints
- `GET /api/billing/[id]/pdf` — Generate invoice PDF
- `GET /api/reports/sales/pdf?from=&to=&storeId=` — Sales report PDF
- `GET /api/reports/gst/pdf?from=&to=&storeId=` — GST report PDF
- `GET /api/reports/inventory/pdf?storeId=` — Inventory report PDF
- `GET /api/reports/outstanding/pdf?storeId=` — Outstanding report PDF
- All return `application/pdf` content type

### PDF Design
- Professional, clean layout matching the OmniBIZ design system
- Company branding: name, address, GSTIN, contact
- Consistent header and footer
- Tables with alternating row colors
- Tax breakdown in proper format (for GST invoices)

## Acceptance Criteria

- [ ] Invoice PDF is generated with correct data matching the invoice
- [ ] Invoice PDF includes all required GST details (GSTIN, HSN, tax breakdown)
- [ ] Thermal receipt PDF (80mm format) is generated for receipts
- [ ] All report tabs have a "Download PDF" button
- [ ] Report PDFs include store name, period, and filters
- [ ] PDFs are generated server-side (not dependent on browser)
- [ ] PDF layout is professional and matches design system
- [ ] Download works in Chrome, Firefox, and Safari

## Files to Create/Modify

- `src/app/api/billing/[id]/pdf/route.ts` — New: invoice PDF generation
- `src/app/api/reports/sales/pdf/route.ts` — New: sales report PDF
- `src/app/api/reports/gst/pdf/route.ts` — New: GST report PDF
- `src/app/api/reports/inventory/pdf/route.ts` — New: inventory report PDF
- `src/app/api/reports/outstanding/pdf/route.ts` — New: outstanding report PDF
- `src/lib/pdf-templates.ts` — New: PDF template definitions
- `src/lib/pdf-generator.ts` — New: PDF generation utilities
- `package.json` — Add @react-pdf/renderer or similar library