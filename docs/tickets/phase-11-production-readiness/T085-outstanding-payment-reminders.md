# T085: Outstanding Payment Reminders (Email-Based)

**Priority**: P1 (important for credit management, not a day-1 blocker)
**Status**: todo
**Size**: M
**Depends on**: T081 (Email system)

## Problem

Indian retailers rely heavily on credit sales (khata/udhaar). Customers with outstanding balances need follow-up. Currently, the system tracks credit balances but has no mechanism to send reminders. This ticket implements email-based payment reminders (no SMS/WhatsApp integration — that's future scope).

This replaces T064 from the original ticket board, adapted to use Resend email instead of SMS/WhatsApp.

## Requirements

### 1. Outstanding Customer Dashboard

Add a new section in the Customers page (or a dedicated "Follow-ups" tab):
- List customers with outstanding credit, sorted by:
  - Oldest outstanding first (aging)
  - Highest balance first
  - Recently contacted last
- Show: customer name, phone, email, total outstanding, oldest invoice date, days overdue
- Quick action buttons: "Send Reminder", "Log Follow-up", "View Details"

### 2. Aging Report

Add aging buckets to the outstanding report:
- 0–30 days (current): Green
- 31–60 days: Yellow
- 61–90 days: Orange
- 90+ days (overdue): Red
- Show total per bucket with customer breakdown
- Filter by store

### 3. Email Reminder Sending

From the customer detail page or outstanding list:
- "Send Reminder" button → composes email with:
  - Customer name
  - Total outstanding amount
  - Invoice-wise breakdown (number, date, amount, due)
  - Store name and contact info
  - "Pay Now" link (future: links to PhonePe payment page)
- Uses `src/lib/emails.ts` → `sendEmail()` with `payment-reminder` template
- Log email in EmailLog

### 4. Follow-Up Logging

Log manual follow-ups:
- Fields: date, type (email_sent, call, visit, whatsapp_link), notes, next follow-up date
- Viewable in customer detail page under "Follow-up History"
- Prisma model:

```prisma
model FollowUp {
  id          String   @id @default(cuid())
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  type        String   // EMAIL_SENT, CALL, VISIT, WHATSAPP_LINK, MANUAL
  notes       String?
  nextDate    DateTime?  // Scheduled next follow-up date
  createdAt   DateTime @default(now())
}
```

### 5. WhatsApp Deep Link (Manual)

While not a full WhatsApp integration, generate a WhatsApp deep link:
- `https://wa.me/{phone}?text={encoded_reminder_message}`
- Button: "Open WhatsApp" → opens WhatsApp Web/Desktop with pre-filled message
- This is free, requires no API, and is immediately useful

### 6. Auto-Reminder Configuration

Add to TenantSettings:
```prisma
model TenantSettings {
  // ... existing fields ...
  reminderEnabled           Boolean  @default(true)
  reminderDays              Int      @default(7)   // Auto-remind after X days overdue
  reminderFrequency         String   @default("WEEKLY")  // DAILY, WEEKLY, BIWEEKLY, MONTHLY, NEVER
  reminderEmailTemplate     String?  // Custom email template ID (future)
}
```

Settings > Notifications section:
- Toggle: Enable automatic payment reminders
- Input: Auto-remind after X days overdue (default 7)
- Dropdown: Reminder frequency (Daily, Weekly, Bi-weekly, Monthly)
- Note: "Reminders are sent via email. SMS and WhatsApp coming soon."

### 7. Scheduled Reminder Job (Cron)

Add a Next.js API route `/api/cron/reminders` that:
- Finds all customers with outstanding balances overdue by `reminderDays` or more
- Groups by tenant (respects tenant isolation)
- Sends reminder email using the `payment-reminder` template
- Logs each email in EmailLog
- Only sends one reminder per frequency period (per customer per tenant)
- Tracks last reminder sent date on customer or a separate `ReminderLog`

**Trigger**: Vercel Cron (`vercel.json`):
```json
{
  "crons": [{
    "path": "/api/cron/reminders",
    "schedule": "0 9 * * *"
  }]
}
```
Runs daily at 9 AM IST.

## Test Scenarios

### Scenario 1: View Outstanding Customers
1. Go to Customers page → "Outstanding" tab
2. See list of customers with credit balance > 0
3. Sorted by oldest outstanding first
4. Each row shows: name, phone, email, total outstanding, oldest invoice, days overdue
5. Clicking a row opens customer detail page

**Verify**: Outstanding customers listed correctly with accurate amounts

### Scenario 2: Aging Buckets
1. Go to Reports → Outstanding
2. See aging buckets: 0-30, 31-60, 61-90, 90+ days
3. Each bucket shows total amount and customer count
4. Colors: green, yellow, orange, red
5. Click a bucket to see customer breakdown
6. Filter by store works

**Verify**: Aging calculation is accurate, bucket totals match sum of individual invoices

### Scenario 3: Send Email Reminder
1. On outstanding list, click "Send Reminder" for Customer X
2. Modal shows email preview with:
   - Customer name
   - Total outstanding: ₹15,000
   - Invoice breakdown (3 invoices)
   - Store name and contact
3. Click "Send"
4. Email is sent via Resend
5. Email logged in EmailLog with status=SENT
6. Follow-up logged: type=EMAIL_SENT
7. Toast: "Reminder sent to customer@example.com"

**Verify**: Email sent, logged, follow-up recorded

### Scenario 4: Log Manual Follow-up
1. On customer detail, click "Log Follow-up"
2. Form: type dropdown (Call, Visit, Email Sent, WhatsApp), notes, next date
3. Select "Call", add notes "Spoke to customer, will pay by Friday"
4. Set next follow-up: Friday
5. Save
6. Follow-up appears in history with date, type, notes, next date

**Verify**: Follow-up logged, visible in customer detail

### Scenario 5: WhatsApp Deep Link
1. On outstanding list, click "WhatsApp" icon for Customer Y
2. New tab opens: `https://wa.me/919876543210?text=Dear%20Rajesh%2C%20...`
3. WhatsApp Web opens with pre-filled message
4. User sends message manually

**Verify**: Deep link generates correctly with customer name and outstanding amount

### Scenario 6: Auto-Reminder Cron
1. Customer Z has outstanding balance for 10+ days
2. Tenant setting: reminderDays=7, reminderFrequency=WEEKLY
3. Cron runs at 9 AM
4. Reminder email sent to Customer Z
5. ReminderLog records: sent date, customer, template
6. Next day, cron runs again
7. No second email (frequency is WEEKLY, not DAILY)
8. After 7 days, next reminder is sent

**Verify**: Reminders sent at correct frequency, no duplicate sends

### Scenario 7: Reminder Preferences Disabled
1. Tenant disables reminders in Settings
2. Cron runs at 9 AM
3. No emails sent for this tenant
4. Manual "Send Reminder" still works

**Verify**: Auto-reminders respect preferences, manual send always works

## Files to Create/Modify

### New Files
- `src/app/api/customers/[id]/followups/route.ts` — POST: log follow-up, GET: follow-up history
- `src/app/api/cron/reminders/route.ts` — Cron job for auto-reminders
- `src/app/(dashboard)/dashboard/customers/outstanding/page.tsx` — Outstanding customers list with aging
- `src/app/api/reports/outstanding/route.ts` — Outstanding report with aging buckets
- `prisma/schema.prisma` — Add FollowUp model, reminder fields to TenantSettings

### Modified Files
- `src/app/(dashboard)/dashboard/customers/page.tsx` — Add "Outstanding" tab
- `src/app/(dashboard)/dashboard/reports/page.tsx` — Add "Outstanding" report tab with aging
- `src/app/(dashboard)/dashboard/settings/page.tsx` — Add reminder notification settings
- `src/lib/emails.ts` — Add `sendPaymentReminder()` function
- `vercel.json` — Add cron job config

## Acceptance Criteria

- [ ] Outstanding customers listed with aging buckets (0-30, 31-60, 61-90, 90+ days)
- [ ] Email reminder can be sent manually from customer list
- [ ] Follow-ups can be logged (call, visit, email, WhatsApp)
- [ ] Follow-up history visible on customer detail page
- [ ] WhatsApp deep link generates correctly with pre-filled message
- [ ] Auto-reminder cron runs daily and sends reminders per tenant settings
- [ ] Reminder frequency respected (no duplicate emails)
- [ ] Reminder preferences configurable in Settings (enable/disable, frequency, days threshold)
- [ ] All reminders logged in EmailLog
- [ ] Aging report available in Reports section
- [ ] Outstanding tab on Customers page works with sorting and filtering
