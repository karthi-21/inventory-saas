# T081: Transactional Email System via Resend

**Priority**: P0 (production blocker — customers need invoice receipts, stores need notifications)
**Status**: todo
**Size**: L
**Depends on**: T080 (PhonePe — for payment receipt emails)

## Problem

Ezvento currently has no email-sending functionality. The `RESEND_API_KEY` is configured in `.env.local` but no code uses it. For a SaaS product, transactional emails are critical for:
1. Invoice/bill receipts sent to customers after payment
2. Payment reminders for outstanding credit (khata)
3. Welcome email after signup
4. Low stock alerts
5. Subscription payment confirmations
6. User invitation emails

Resend (https://resend.com) is already configured and provides a clean API for transactional emails with good deliverability.

## Current State

- `RESEND_API_KEY` exists in `.env.local`
- No email sending code anywhere in the codebase
- No email templates
- No email preferences in settings
- No notification system that triggers emails

## Requirements

### 1. Email Infrastructure

Create `src/lib/emails.ts`:
```typescript
// Core send function
sendEmail(params: {
  to: string | string[]
  subject: string
  html: string
  from?: string  // defaults to 'Ezvento <billing@ezvento.karth-21.com>'
  replyTo?: string
  tags?: Record<string, string>  // for analytics
}): Promise<{ id: string }>

// Template rendering
renderTemplate(templateName: string, data: Record<string, any>): string
```

Install `resend` npm package if not already present.

### 2. Email Templates

Create `src/lib/email-templates/` directory with HTML email templates:

#### `welcome.tsx` — Welcome Email
- Sent after signup
- Content: "Welcome to Ezvento! Your store is ready."
- Includes: store name, link to dashboard, getting started tips
- CTA: "Go to Dashboard" button

#### `invoice-receipt.tsx` — Invoice Receipt
- Sent after successful payment (POS or UPI)
- Content: Invoice details (items, amounts, GST breakdown, total)
- Includes: Invoice number, date, store name, customer name
- CTA: "View Invoice Online" (links to PDF)

#### `payment-reminder.tsx` — Outstanding Payment Reminder
- Sent to customers with overdue credit
- Content: Outstanding amount, invoice details, due date
- Includes: Store name, customer name, total due, aging breakdown
- CTA: "Pay Now" (links to payment page or UPI deep link)

#### `low-stock-alert.tsx` — Low Stock Alert
- Sent to store owners when products fall below reorder level
- Content: Product name, current stock, reorder level
- Includes: Link to inventory page

#### `subscription-confirmation.tsx` — Subscription Payment Confirmation
- Sent after Dodo Payments subscription is activated
- Content: Plan name, amount, next billing date
- CTA: "Manage Subscription"

#### `user-invitation.tsx` — Team Member Invitation
- Sent when owner invites a team member
- Content: Store name, role, inviter name
- CTA: "Accept Invitation" (links to signup with pre-filled data)

#### `shift-summary.tsx` — Shift Close Summary
- Sent to manager when a shift is closed
- Content: Shift totals (sales, payments, returns)

### 3. Email Trigger Points

| Trigger | Template | Recipient | When |
|---------|----------|-----------|------|
| Invoice payment success | `invoice-receipt` | Customer email (if provided) | After POS payment confirmation |
| Outstanding reminder | `payment-reminder` | Customer email | Daily/weekly cron (configurable) |
| Low stock alert | `low-stock-alert` | Store owner email | When stock falls below reorder level |
| New signup | `welcome` | New user email | After Supabase auth confirmation |
| Subscription activated | `subscription-confirmation` | Tenant owner email | After Dodo webhook confirms payment |
| Team invitation | `user-invitation` | Invitee email | When owner invites team member |
| Shift close | `shift-summary` | Manager email | When shift is closed |

### 4. Notification Preferences

Add to `TenantSettings`:
```prisma
model TenantSettings {
  // ... existing fields ...
  emailNotificationsEnabled  Boolean @default(true)
  invoiceAutoSend            Boolean @default(true)
  lowStockEmailAlerts         Boolean @default(true)
  paymentReminderFrequency   String  @default("WEEKLY")  // DAILY, WEEKLY, MONTHLY, NEVER
  shiftSummaryEmail           Boolean @default(false)
}
```

Add a "Notifications" section in Settings page:
- Toggle: Send invoice receipts automatically
- Toggle: Send low stock alerts
- Dropdown: Payment reminder frequency (Daily/Weekly/Monthly/Never)
- Toggle: Send shift summary emails

### 5. Email Queue / Retry

For reliability, use Resend's built-in retry. But also add:
- `EmailLog` model in Prisma for tracking sent emails
- Log each email: to, template, status, sentAt, error (if any)
- Admin view in Settings to see recent email activity

```prisma
model EmailLog {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  to          String   // recipient email
  template    String   // template name
  subject     String
  status      String   // PENDING, SENT, FAILED
  resendId    String?  // Resend message ID
  error       String?  // error message if failed
  createdAt   DateTime @default(now())
}
```

### 6. API Endpoints

#### `POST /api/emails/send-invoice`
```typescript
{
  invoiceId: string
  emailTo?: string  // optional override, defaults to customer email
}
```
Triggers invoice receipt email. Called from POS after payment.

#### `POST /api/emails/send-reminder`
```typescript
{
  customerId: string
  invoiceIds?: string[]  // specific invoices, or all outstanding
}
```
Triggers payment reminder email. Called from customer detail page.

#### `POST /api/emails/invite`
```typescript
{
  email: string
  role: string
  storeId: string
}
```
Sends invitation email. Called from team management page.

#### `GET /api/emails/logs`
```typescript
// Returns recent email activity for the tenant
// Query: ?page=1&limit=20&template=invoice-receipt
```

## Test Scenarios

### Scenario 1: Invoice Receipt Email After POS Payment
1. Cashier completes a bill for ₹2,500 with customer email filled
2. Invoice is saved as PAID
3. Email is triggered to customer's email address
4. Email contains: invoice number, date, items table, GST breakdown, total, "View Invoice" link
5. Email is logged in EmailLog with status=SENT
6. If customer has no email, email is skipped (no error)

**Verify**: Email sent, logged in DB, correct content

### Scenario 2: Invoice Receipt Without Customer Email
1. Cashier completes a walk-in sale (no customer selected)
2. No email is sent (no email address)
3. No error is thrown
4. EmailLog has no entry for this invoice

**Verify**: Graceful skip, no errors

### Scenario 3: Payment Reminder Email
1. Owner goes to Customer detail page
2. Customer has ₹15,000 outstanding across 3 invoices
3. Owner clicks "Send Reminder"
4. Email is sent with breakdown: Invoice #1 ₹5,000, Invoice #2 ₹7,000, Invoice #3 ₹3,000
5. Customer receives email with "Pay Now" link
6. Email logged with template=payment-reminder

**Verify**: Correct amounts, proper formatting, sent to customer email

### Scenario 4: Low Stock Alert Email
1. Product "Samsung Galaxy S24" stock drops to 3 (reorder level: 10)
2. System checks for low stock products on daily basis
3. Email sent to store owner: "3 products are running low"
4. Email lists each product with current stock and reorder level
5. Owner clicks link to go to inventory page

**Verify**: Email triggered at correct threshold, correct product names and stock levels

### Scenario 5: Welcome Email After Signup
1. New user signs up via email
2. Supabase confirms email
3. Welcome email is sent
4. Email contains: "Welcome to Ezvento, [Name]!" and "Get Started" button
5. Email logged in EmailLog

**Verify**: Email sent after auth confirmation, personalized with user name

### Scenario 6: Email Sending Failure / Retry
1. Resend API returns 429 (rate limit) or 500
2. Email is logged with status=FAILED and error message
3. No crash or unhandled error
4. Admin can see failed emails in EmailLog
5. Manual retry: admin clicks "Resend" on failed email

**Verify**: Failure is graceful, logged, and retryable

### Scenario 7: Notification Preferences
1. Owner goes to Settings > Notifications
2. Disables "Send invoice receipts"
3. Completes a sale with customer email
4. No email is sent
5. Enables "Daily payment reminders"
6. Next day, customers with outstanding balances receive reminder emails

**Verify**: Preferences respected, no emails sent when disabled

### Scenario 8: Subscription Confirmation Email
1. User completes Dodo Payments checkout for Grow plan
2. Webhook confirms subscription is active
3. Email sent: "Your Ezvento Grow plan is now active"
4. Email includes: plan name, ₹2,499/mo, next billing date, "Manage Subscription" link

**Verify**: Email triggered by Dodo webhook, correct plan details

## Files to Create/Modify

### New Files
- `src/lib/emails.ts` — Core Resend email sender + template renderer
- `src/lib/email-templates/welcome.tsx` — Welcome email template
- `src/lib/email-templates/invoice-receipt.tsx` — Invoice receipt template
- `src/lib/email-templates/payment-reminder.tsx` — Outstanding reminder template
- `src/lib/email-templates/low-stock-alert.tsx` — Low stock alert template
- `src/lib/email-templates/subscription-confirmation.tsx` — Subscription confirmation
- `src/lib/email-templates/user-invitation.tsx` — Team invitation template
- `src/lib/email-templates/shift-summary.tsx` — Shift close summary
- `src/app/api/emails/send-invoice/route.ts` — Send invoice email
- `src/app/api/emails/send-reminder/route.ts` — Send payment reminder
- `src/app/api/emails/invite/route.ts` — Send team invitation
- `src/app/api/emails/logs/route.ts` — Email activity log

### Modified Files
- `prisma/schema.prisma` — Add EmailLog model, email preferences to TenantSettings
- `src/app/(dashboard)/dashboard/settings/page.tsx` — Add notification preferences section
- `src/app/api/billing/route.ts` — Trigger invoice email after successful payment
- `src/app/api/billing/[id]/cancel/route.ts` — Trigger refund notification email
- `src/app/(auth)/signup/page.tsx` — Trigger welcome email after signup
- `src/app/api/payments/dodo-webhook/route.ts` — Trigger subscription confirmation email
- `src/app/api/notifications/route.ts` — Add low stock email trigger
- `.env.local.example` — Document RESEND_FROM_EMAIL

## Acceptance Criteria

- [ ] Invoice receipt email is sent automatically after POS payment (when customer has email)
- [ ] Payment reminder email can be sent manually from customer page
- [ ] Low stock alert emails are sent daily to store owners (when enabled)
- [ ] Welcome email is sent after new user signup
- [ ] Team invitation email is sent when inviting team members
- [ ] All emails are logged in EmailLog with status and error info
- [ ] Failed emails can be retried from the email log
- [ ] Notification preferences are configurable per tenant in Settings
- [ ] Emails are skipped gracefully when customer has no email address
- [ ] Email templates are well-formatted and mobile-responsive
- [ ] Resend API errors (rate limits, invalid emails) are handled gracefully
- [ ] All email templates include unsubscribe link (for non-transactional emails)
- [ ] From address uses custom domain (billing@ezvento.karth-21.com or similar)

## Environment Variables

```env
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=Ezvento <billing@ezvento.karth-21.com>
RESEND_REPLY_TO=support@ezvento.karth-21.com
```
