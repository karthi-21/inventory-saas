# T071: E-Invoicing Integration (GSTN IRN)

**Priority**: P2  
**Status**: done
**Size**: L  
**Depends on**: T066

## Problem

E-invoicing is mandatory for businesses with turnover above ₹5Cr in India (and the threshold keeps lowering). The government requires invoices to be registered on the GSTN portal to get an Invoice Reference Number (IRN) and a signed QR code. Without e-invoicing, the app cannot serve medium and large retailers who are legally required to e-invoice.

## Requirements

### E-Invoice Generation Flow
1. User creates an invoice in the POS/billing system
2. System generates the e-invoice JSON in the government-prescribed format
3. JSON is sent to GSTN via a GST Suvidha Provider (GSP)
4. GSTN returns: IRN (Invoice Reference Number), signed QR code, acknowledgement number
5. IRN and QR code are stored on the Invoice record
6. Invoice PDF is updated to include the IRN and QR code

### GSTN Integration
- Integrate with a GST Suvidha Provider (GSP):
  - **ClearTax/GSTN** — Most popular GSP
  - **Zoho GST** — Alternative
  - **Effortless** — Budget option
- GSP handles: authentication, token management, API calls, error handling
- API endpoints:
  - Generate IRN: `POST /e-invoice/api/v1/IRN`
  - Cancel IRN: `POST /e-invoice/api/v1/Cancel`
  - Get IRN details: `GET /e-invoice/api/v1/IRN/{irn}`
  - Get GSTIN details: `GET /e-invoice/api/v1/Master/GSTIN/{gstin}`

### E-Invoice JSON Format
- Generate JSON as per NIC e-invoice specification v1.1
- Required fields: seller GSTIN, buyer GSTIN, invoice number, date, items with HSN, tax amounts
- Map our `Invoice` + `InvoiceItem` models to the e-invoice JSON structure
- Handle both B2B (with buyer GSTIN) and B2C invoices

### Settings
- New settings section: "E-Invoicing"
  - GSP provider selection
  - GSP API credentials (client ID, client secret)
  - Auto-generate IRN on invoice creation (toggle)
  - GSTIN verification on customer creation

### IRN on Invoice
- Add fields to Invoice model: `irn` (string), `qrCode` (string), `irnStatus` (enum: PENDING, GENERATED, CANCELLED)
- After IRN generation, store IRN and QR code on the invoice
- Include QR code on printed invoices/PDFs
- Show IRN on invoice detail view

### Error Handling
- If IRN generation fails, invoice is still created locally but marked `IRN_PENDING`
- Retry mechanism: automatically retry failed IRN generation
- Manual retry button on invoice detail
- Show error details from GSTN (validation errors, GSTIN errors)

### Cancellation
- When an invoice is cancelled (T055), cancel the IRN on GSTN within 24 hours
- IRN cancellation reason codes: DUPLICATE, DATA_ENTRY_MISTAKE, OTHER

## Acceptance Criteria

- [ ] E-invoice JSON is generated in NIC v1.1 format
- [ ] IRN is obtained from GSTN for B2B invoices
- [ ] IRN and QR code are stored on the Invoice record
- [ ] Invoice PDF includes the IRN and QR code
- [ ] Failed IRN generation is retried automatically
- [ ] Invoice cancellation cancels the IRN on GSTN
- [ ] GSP credentials are configurable in settings
- [ ] Error messages from GSTN are displayed to the user
- [ ] B2C invoices (no buyer GSTIN) are handled correctly (not e-invoiced)

## Files to Create/Modify

- `prisma/schema.prisma` — Add IRN fields to Invoice model
- `src/app/api/billing/route.ts` — Trigger IRN generation after invoice creation
- `src/app/api/billing/[id]/cancel/route.ts` — Cancel IRN when invoice cancelled
- `src/app/api/e-invoice/generate/route.ts` — New: generate e-invoice JSON
- `src/app/api/e-invoice/irn/route.ts` — New: get/cancel IRN
- `src/lib/e-invoice.ts` — New: e-invoice JSON generator, GSP client
- `src/lib/gsp-client.ts` — New: GSP API client (auth, IRN, cancel)
- `src/app/(dashboard)/settings/page.tsx` — Add e-invoicing settings section