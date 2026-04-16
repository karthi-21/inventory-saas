# T084: Thermal Receipt Printer Integration (58mm/80mm)

**Priority**: P0 (production blocker — retailers need printed bills)
**Status**: todo
**Size**: M
**Depends on**: —

## Problem

Indian retail shops use thermal receipt printers (58mm or 80mm paper width) connected via USB/Bluetooth/WiFi. The current implementation uses `window.print()` which opens a browser print dialog — not suitable for fast retail billing where a receipt must auto-print in 1-2 seconds.

Current state:
- `src/lib/pdf-generator.ts` generates receipt HTML (571 lines)
- `src/app/api/print/receipt/route.ts` serves receipt HTML
- POS calls `window.print()` after billing — this opens browser dialog, not auto-print
- No ESC/POS commands for thermal printers
- No printer configuration UI

## Requirements

### 1. Dual Print Strategy

Support two printing methods:

**Method A: Browser Print (Current, Enhanced)**
- Keep existing HTML receipt generation
- Auto-trigger print dialog (not just `window.print()`)
- Add receipt-specific CSS: 58mm/80mm widths, monospace font, no margins
- Add "Reprint" button on billing list for previously printed invoices

**Method B: ESC/POS Raw Print (New)**
- For thermal printers connected via USB or network
- Generate ESC/POS byte commands for:
  - Text alignment (center, left, right)
  - Bold, underline
  - Character size (double height, double width)
  - Barcodes (Code128 for invoice number)
  - QR codes (for UPI payment link or e-invoice QR)
  - Cut paper (full/partial)
  - Cash drawer kick
- Send raw bytes to printer via Web Serial API (USB) or WebSocket (network printers)

### 2. Printer Configuration

Add to Settings > Printer:
- Select printer type: "Browser Print" or "Thermal (ESC/POS)"
- For ESC/POS:
  - Connection: USB (Web Serial) or Network (IP:Port)
  - Paper width: 58mm or 80mm
  - Auto-cut: yes/no
  - Cash drawer: yes/no
- For Browser Print:
  - Auto-print: yes/no (auto-trigger print dialog)
  - Receipt CSS width: 58mm or 80mm
- Test print button

**Prisma schema addition:**
```prisma
model PrinterConfig {
  id              String   @id @default(cuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  storeId         String?
  store           Store?   @relation(fields: [storeId], references: [id], onDelete: Cascade)
  name            String   @default("Default Printer")
  type            String   @default("BROWSER")  // BROWSER, ESCPOS_USB, ESCPOS_NETWORK
  paperWidth      Int      @default(80)          // 58 or 80
  autoCut         Boolean  @default(true)
  cashDrawer      Boolean  @default(false)
  networkHost     String?  // IP address for network printers
  networkPort     Int?     @default(9100)       // Default ESC/POS port
  autoPrint       Boolean  @default(true)       // Auto-trigger print after billing
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### 3. ESC/POS Command Generator

Create `src/lib/escpos.ts`:
```typescript
class ESCPOSBuilder {
  text(str: string): this
  bold(on: boolean): this
  underline(on: boolean): this
  align(mode: 'left' | 'center' | 'right'): this
  size(width: 1|2, height: 1|2): this
  barcode(data: string, type?: 'CODE128' | 'EAN13'): this
  qrCode(data: string): this
  cut(partial?: boolean): this
  cashDrawer(): this
  line(lines?: number): this
  separator(char?: string): this
  tableRow(columns: {text: string, width: number, align: 'left'|'right'}[]): this
  build(): Uint8Array
}
```

### 4. Receipt Template

Create receipt template for 80mm thermal paper (48 chars/line at 12cpi):
```
================================
       STORE NAME
    123 Address, City
    GSTIN: 29XXXXX1234A1Z5
    Phone: +91-9876543210
================================
Bill No: INV-2024-001
Date:   16/04/2026 14:30
Cashier: John
--------------------------------
ITEM          QTY   RATE   AMT
--------------------------------
Samsung S24     1  89900  89900
  CGST 9%                 8091
  SGST 9%                 8091
USB Cable       2    299    598
  CGST 9%                   54
  SGST 9%                   54
--------------------------------
         Subtotal:       90498
         Discount:        -500
         CGST:            8145
         SGST:            8145
         Round Off:        -43
================================
         TOTAL:       ₹98,245
================================
         CASH:        ₹98,245
================================
     Thank you for visiting!
    Visit again - Store Name
        [QR CODE]
   Scan for e-invoice / UPI pay
================================
```

### 5. Auto-Print Flow

After POS billing completes:
1. If `autoPrint` is enabled in printer config:
   - Browser Print: auto-trigger `window.print()` with receipt iframe
   - ESC/POS: auto-send commands to configured printer
2. If `autoPrint` is disabled:
   - Show "Print Receipt" button on success screen
   - Show "Print Later" option (adds to print queue)

### 6. Reprint Functionality

- On billing list, each invoice has a "Reprint" button
- Clicking reprint regenerates the receipt and prints
- Reprint action is logged in ActivityLog for audit

## Test Scenarios

### Scenario 1: Browser Print — 80mm Receipt
1. Complete a bill in POS
2. Auto-print dialog opens with formatted 80mm receipt
3. Receipt contains: store name, GSTIN, items, GST breakdown, total, payment method
4. Print preview shows correct formatting (no extra margins, proper font)
5. After printing, cashier returns to POS

**Verify**: Receipt prints correctly, formatting matches template

### Scenario 2: Browser Print — 58mm Receipt
1. Store is configured for 58mm paper
2. Complete a bill in POS
3. Receipt text wraps properly for 32-char width
4. QR code fits within 58mm width
5. Print completes successfully

**Verify**: 58mm receipt formatting is correct, no text overflow

### Scenario 3: ESC/POS USB Printer
1. Connect ESC/POS-compatible thermal printer via USB
2. Configure in Settings: type=ESCPOS_USB, paper=80mm, autoCut=true
3. Click "Test Print" — test page prints
4. Complete a bill in POS
5. Receipt auto-prints via Web Serial API
6. Paper auto-cuts after receipt
7. Cash drawer kicks (if enabled)

**Verify**: Raw ESC/POS bytes sent correctly, receipt prints, auto-cuts

### Scenario 4: ESC/POS Network Printer
1. Configure network printer (IP: 192.168.1.50, Port: 9100)
2. Test connection with "Test Print"
3. Complete a bill — receipt prints over TCP
4. Print speed < 3 seconds from bill completion to print start

**Verify**: Network printer works, low latency

### Scenario 5: Reprint from Billing List
1. Go to Billing list
2. Find an invoice from yesterday
3. Click "Reprint" icon
4. Receipt prints again with same content
5. Activity log records: "Reprinted invoice INV-2024-001 by User X"

**Verify**: Reprint works, audit trail maintained

### Scenario 6: Printer Not Connected
1. Printer is turned off or disconnected
2. Cashier completes a bill
3. Print attempt fails gracefully
4. Toast: "Printer not available — receipt saved. You can print it later."
5. Receipt is added to print queue
6. When printer is reconnected, queued receipts can be printed

**Verify**: No crash, graceful fallback, print queue works

### Scenario 7: QR Code on Receipt
1. Generate bill with e-invoice IRN
2. Receipt includes QR code for e-invoice verification
3. QR code contains IRN data
4. Scan QR with phone → opens e-invoice verification page
5. For bills without IRN: QR contains UPI payment link

**Verify**: QR generates correctly, scans to right destination

## Files to Create/Modify

### New Files
- `src/lib/escpos.ts` — ESC/POS command builder
- `src/lib/printer.ts` — Printer connection manager (Web Serial, WebSocket, browser print)
- `src/app/(dashboard)/dashboard/settings/printers/page.tsx` — Printer configuration UI
- `src/app/api/printers/route.ts` — CRUD for printer configs
- `src/app/api/print/test/route.ts` — Test print endpoint

### Modified Files
- `src/app/(dashboard)/dashboard/billing/new/page.tsx` — Replace window.print() with printer manager
- `src/lib/pdf-generator.ts` — Enhance receipt template for thermal widths
- `src/app/api/print/receipt/route.ts` — Support ESC/POS output format
- `src/app/api/billing/route.ts` — Auto-print trigger after invoice creation
- `src/app/(dashboard)/dashboard/billing/page.tsx` — Add reprint button
- `src/app/(dashboard)/dashboard/settings/page.tsx` — Add "Printers" link
- `prisma/schema.prisma` — Add PrinterConfig model

## Acceptance Criteria

- [ ] Browser print works for 58mm and 80mm paper widths
- [ ] ESC/POS USB printing works via Web Serial API
- [ ] ESC/POS network printing works via TCP/WebSocket
- [ ] Auto-print triggers after POS billing (when enabled)
- [ ] Receipt contains all mandatory GST fields (store name, GSTIN, HSN, tax breakdown)
- [ ] QR code prints on receipt (e-invoice IRN or UPI payment link)
- [ ] Reprint works from billing list with audit logging
- [ ] Printer configuration UI allows selecting type, paper width, auto-cut, etc.
- [ ] Test print button works for all printer types
- [ ] Graceful fallback when printer is disconnected
- [ ] Print queue for offline/failed prints
- [ ] Cash drawer kick works when enabled in settings

## Dependencies

```json
{
  "escpos": "^3.x"
}
```
Note: We may need to implement Web Serial API connection ourselves rather than using a library, as Next.js runs in browser context.
