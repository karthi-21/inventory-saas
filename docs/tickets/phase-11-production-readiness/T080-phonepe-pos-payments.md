# T080: PhonePe POS Payment Integration for In-Store Billing

**Priority**: P0 (production blocker — retailers need to collect payments from customers)
**Status**: done
**Size**: XL
**Depends on**: —

## Problem

Indian retail stores need to accept payments from customers at the point of sale. Currently, the POS supports recording payment method (Cash/UPI/Card) but has no actual payment gateway integration. Store owners need PhonePe integration so customers can pay via UPI directly at the counter, and store owners can track payment status in real-time.

PhonePe is the dominant UPI payment app in India (75%+ UPI market share). PhonePe PG (Payment Gateway) supports:
- UPI Intent flow (customer opens PhonePe app, confirms payment)
- UPI QR code generation (customer scans QR to pay)
- Card payments (debit/credit)
- Payment status polling
- Webhooks for async payment confirmation
- Refunds

## Current State

### What Exists
- `src/app/(dashboard)/dashboard/billing/new/page.tsx` — POS page with `paymentModes` array: `CASH`, `UPI`, `CARD`, `MIXED`
- `src/app/api/billing/route.ts` — POST creates invoice with `payments` array recording method & amount
- Payment model in Prisma schema with `method`, `amount`, `reference` fields
- `billingType` enum: `CASH`, `UPI`, `CARD`, `MIXED`, `CREDIT`
- No actual payment gateway is called — methods are just labels

### What's Missing
- No UPI QR code generation
- No PhonePe PG integration
- No payment status tracking (pending, completed, failed)
- No payment confirmation polling
- No refund/cancellation flow through gateway
- No way for customer to pay from their phone

## Requirements

### 1. PhonePe PG SDK Setup
- Install PhonePe PG Node.js SDK or use REST API
- Add env vars: `PHONEPE_MERCHANT_ID`, `PHONEPE_SALT_KEY`, `PHONEPE_SALT_INDEX`, `PHONEPE_API_URL` (sandbox vs prod)
- Create `src/lib/phonepe.ts`:
  - `initiatePayment(params)` → creates PhonePe transaction, returns redirect URL + transaction ID
  - `checkPaymentStatus(transactionId)` → polls payment status
  - `generateUPIQr(amount, vpa, name)` → generates UPI deep link QR
  - `initiateRefund(transactionId, amount)` → processes refund
  - `verifyWebhook(payload, signature)` → verifies webhook authenticity

### 2. Payment Flow Architecture

#### Flow A: UPI Intent (Customer Has PhonePe Installed)
```
Cashier selects "UPI" → System calls PhonePe PG → Gets redirect URL
→ Opens PhonePe app on customer's phone (or shows QR)
→ Customer confirms payment in PhonePe
→ PhonePe sends webhook → POS shows "Payment Received ✓"
→ Invoice marked as PAID
```

#### Flow B: UPI QR Code (Walk-in Customer)
```
Cashier selects "UPI QR" → System generates QR with amount + merchant VPA
→ QR displayed on screen (and optionally on second display)
→ Customer scans with any UPI app
→ Payment confirmed via PhonePe webhook
→ Invoice marked as PAID
```

#### Flow C: Cash (No Integration Needed)
```
Cashier selects "Cash" → Records cash payment
→ Invoice marked as PAID
→ No gateway interaction
```

#### Flow D: Card (Future — Not in This Ticket)
```
Card payments are out of scope for this ticket.
Cashier records "Card" payment manually for now.
```

### 3. API Endpoints

#### `POST /api/payments/pos/initiate`
```typescript
// Request body
{
  invoiceId: string        // The invoice to pay for
  amount: number          // Amount to collect (can be partial for split payment)
  method: 'UPI' | 'UPI_QR'  // Payment method
  customerPhone?: string  // Optional: for sending payment link via SMS/email
  customerEmail?: string  // Optional: for sending payment link via email
}

// Response
{
  transactionId: string    // PhonePe transaction ID
  redirectUrl: string      // PhonePe payment page URL (for UPI intent)
  qrData?: string          // UPI QR data string (for UPI_QR)
  upiDeepLink?: string     // upi://pay?... deep link
  status: 'PENDING'        // Initial status
}
```

#### `GET /api/payments/pos/status/:transactionId`
```typescript
// Polls PhonePe for payment status
// Returns:
{
  transactionId: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
  amount: number
  paymentMethod?: string   // e.g., 'UPI', 'PHONEPE'
  upiTransactionId?: string
  completedAt?: string
}
```

#### `POST /api/payments/pos/webhook`
```typescript
// PhonePe server-to-server callback
// Verifies signature, updates Payment record
// Triggers: invoice status update, notification to POS
```

#### `POST /api/payments/pos/refund`
```typescript
// For cancelled invoices
{
  transactionId: string
  amount: number           // Can be partial refund
  reason: string
}
```

### 4. POS UI Changes

#### Payment Dialog Enhancements
When cashier clicks a payment method in the POS:

**Cash**: 
- Existing flow (record amount, mark as paid)
- No changes needed

**UPI Intent**:
- Dialog shows "Waiting for payment..." with spinner
- Auto-polls `/api/payments/pos/status/:transactionId` every 3 seconds
- On success: green checkmark, "Payment of ₹{amount} received!"
- On failure: red X, "Payment failed. Try again or choose another method."
- Cancel button to abort and try different method

**UPI QR Code**:
- Dialog shows QR code (generated from `upi://pay?pa={VPA}&pn={merchantName}&am={amount}&cu=INR`)
- Amount pre-filled in QR
- Auto-polls for payment confirmation
- On success: green checkmark, invoice auto-completes

**Mixed Payment**:
- Each row in the split payment can independently choose Cash/UPI/UPI_QR
- UPI rows show payment status next to amount
- Total must balance before invoice can be completed

### 5. Prisma Schema Updates

```prisma
model Payment {
  id                 String        @id @default(cuid())
  salesInvoiceId     String
  salesInvoice       SalesInvoice  @relation(fields: [salesInvoiceId], references: [id], onDelete: Cascade)
  method             PaymentMethod
  amount             Decimal       @db.Decimal(12, 2)
  reference          String?       // UPI transaction ID or cash reference
  
  // PhonePe integration fields
  phonePeTransactionId String?     @unique  // PhonePe transaction ID
  phonePeMerchantTxnId String?               // Our reference ID sent to PhonePe
  paymentStatus       PaymentGatewayStatus @default(PENDING)
  paymentCompletedAt  DateTime?               // When payment was confirmed
  
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
}

enum PaymentGatewayStatus {
  PENDING       // Initiated, waiting for customer action
  SUCCESS       // Payment confirmed
  FAILED        // Payment failed
  REFUNDED      // Full refund processed
  PARTIALLY_REFUNDED  // Partial refund processed
}
```

### 6. Email Integration (Resend)
After payment success, automatically send receipt email:
- Template: payment-receipt
- Includes: invoice number, amount, date, store name, payment method
- Uses Resend API (already configured)
- Create `src/lib/emails.ts` with reusable email sending functions

### 7. Store-Level Payment Configuration
Add to `TenantSettings` or new `StorePaymentConfig` model:
```prisma
model StorePaymentConfig {
  id                String   @id @default(cuid())
  storeId           String   @unique
  store             Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  merchantVPA       String   // PhonePe merchant VPA (e.g., merchant@phonepe)
  merchantName      String   // Display name for UPI
  phonepeEnabled    Boolean  @default(true)
  cashEnabled       Boolean  @default(true)
  cardEnabled       Boolean  @default(false)
  upiQrEnabled      Boolean  @default(true)
  autoSendReceipt   Boolean  @default(true)
  receiptEmailTemplate String? // Custom email template ID
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

Settings page section: "Payment Methods" where store owner can:
- Toggle Cash/UPI/QR/Card on/off
- Set merchant VPA
- Set merchant display name (shown in UPI apps)
- Toggle auto-send receipt

## Test Scenarios

### Scenario 1: UPI Intent Payment Success
1. Cashier adds items to cart, total = ₹1,250
2. Clicks "UPI" button
3. Dialog shows "Waiting for payment..." with ₹1,250
4. PhonePe checkout URL is generated
5. Customer scans QR / receives link and pays via PhonePe app
6. Webhook fires → POS shows green checkmark "₹1,250 received"
7. Invoice status → PAID, Payment record created with `phonePeTransactionId`
8. Receipt email sent automatically

**Verify**: Payment record in DB has status=SUCCESS, invoice is PAID, email sent

### Scenario 2: UPI QR Code Payment
1. Cashier selects "UPI QR" method
2. QR code appears with correct amount (₹750)
3. Customer scans QR with Google Pay
4. Payment status polls: PENDING → PENDING → SUCCESS
5. POS auto-completes the invoice
6. Receipt printed (via window.print or thermal)

**Verify**: QR contains correct VPA + amount, payment confirmed, invoice PAID

### Scenario 3: UPI Payment Timeout/Failure
1. Cashier initiates UPI payment for ₹2,000
2. Customer's UPI app shows payment but they cancel
3. After 5 minutes of polling, status remains PENDING
4. Dialog shows "Payment not received. Try again or choose Cash."
5. Cashier clicks "Cancel" and chooses Cash instead
6. PhonePe transaction is auto-cancelled after timeout
7. Cash payment is recorded normally

**Verify**: No stuck payments, easy fallback to cash, no duplicate charges

### Scenario 4: Mixed Payment (Cash + UPI)
1. Total = ₹3,500
2. Cashier clicks "Mixed" → Split payment dialog opens
3. Row 1: Cash → ₹2,000 (recorded immediately)
4. Row 2: UPI → ₹1,500 (initiates PhonePe flow)
5. UPI payment confirmed
6. Total payments = ₹3,500 → Invoice marked PAID
7. Two Payment records created (one CASH, one UPI with PhonePe txn ID)

**Verify**: Both payments recorded correctly, invoice PAID, total matches

### Scenario 5: Invoice Cancellation After PhonePe Payment
1. Invoice is PAID via PhonePe (₹1,000)
2. Cashier voids/cancels the invoice
3. System calls PhonePe refund API
4. Refund status tracked in Payment record (status → REFUNDED)
5. Credit balance is NOT increased (since it was a direct refund)

**Verify**: Refund processed, Payment status updated, customer receives refund

### Scenario 6: Offline Graceful Degradation
1. Internet connection drops during payment
2. UPI payment initiation fails (API call to PhonePe fails)
3. Dialog shows: "Unable to process UPI payment. Please use Cash instead."
4. Cashier switches to Cash, records payment
5. Later, when internet returns, no ghost transactions

**Verify**: Error is handled gracefully, no stuck state, fallback to cash works

### Scenario 7: Webhook Security
1. Attacker sends fake webhook with `status: SUCCESS` for non-existent transaction
2. Signature verification fails → 400 response
3. Attacker replays a legitimate webhook
3. Idempotency check: Payment already marked SUCCESS → 200 OK, no duplicate processing

**Verify**: Only authentic PhonePe webhooks processed, no double-counting

### Scenario 8: Store Payment Config
1. Store owner goes to Settings > Payment Methods
2. Enables only "Cash" and "UPI QR" (disables UPI Intent)
3. In POS, only Cash and UPI QR buttons appear
4. Store owner changes merchant VPA to new VPA
5. QR codes now use the new VPA
6. Store owner disables auto-send receipt
7. Payment success no longer triggers email

**Verify**: Payment method toggles respected in POS, VPA updated in QRs

## Files to Create/Modify

### New Files
- `src/lib/phonepe.ts` — PhonePe PG client (initiate, status, refund, QR generation, webhook verify)
- `src/lib/emails.ts` — Resend email templates and sender functions
- `src/app/api/payments/pos/initiate/route.ts` — Initiate POS payment
- `src/app/api/payments/pos/status/[transactionId]/route.ts` — Poll payment status
- `src/app/api/payments/pos/webhook/route.ts` — PhonePe webhook handler
- `src/app/api/payments/pos/refund/route.ts` — Process refunds
- `src/app/(dashboard)/dashboard/settings/payment-methods/page.tsx` — Payment config UI

### Modified Files
- `src/app/(dashboard)/dashboard/billing/new/page.tsx` — Add UPI payment dialog, QR display, polling
- `prisma/schema.prisma` — Add PaymentGatewayStatus enum, PhonePe fields on Payment, StorePaymentConfig model
- `src/app/api/billing/route.ts` — Handle payment method + PhonePe transaction reference
- `src/app/(dashboard)/dashboard/settings/page.tsx` — Add "Payment Methods" link
- `src/app/(dashboard)/layout.tsx` — Add "Payment Methods" nav item (for admin personas)
- `.env.local.example` — Add PhonePe env vars

## Acceptance Criteria

- [ ] PhonePe UPI Intent flow works end-to-end (initiate → pay → confirm)
- [ ] PhonePe UPI QR code generates correctly with merchant VPA and amount
- [ ] Payment status auto-polls every 3 seconds and updates POS UI
- [ ] Mixed payment (Cash + UPI) works with real PhonePe transactions
- [ ] Invoice cancellation triggers PhonePe refund
- [ ] Payment failure/timeout shows clear message with fallback to Cash
- [ ] Offline/disconnected state handles gracefully (no stuck payments)
- [ ] Webhook signature verification prevents spoofing
- [ ] Idempotency: duplicate webhooks don't double-process
- [ ] Receipt email sent automatically after successful payment (Resend)
- [ ] Store payment config UI lets owner toggle methods and set VPA
- [ ] Disabled payment methods don't appear in POS
- [ ] All PhonePe API errors are logged and handled gracefully
- [ ] Sandbox mode works for development without real transactions

## Environment Variables

```env
# PhonePe Payment Gateway
PHONEPE_MERCHANT_ID=MERCHANTUATxxxxx
PHONEPE_SALT_KEY=your-salt-key
PHONEPE_SALT_INDEX=1
PHONEPE_API_URL=https://api-preprod.phonepe.com/apis/pg-sandbox  # sandbox
# PHONEPE_API_URL=https://api.phonepe.com/apis/pg  # production
PHONEPE_CALLBACK_URL=https://yourdomain.com/api/payments/pos/webhook
PHONEPE_REDIRECT_URL=https://yourdomain.com/dashboard/billing

# Resend (already configured)
RESEND_API_KEY=re_xxxxx
```
