# T064: Outstanding Payment Reminder System

**Priority**: P1  
**Status**: todo  
**Size**: M  
**Depends on**: —

## Problem

Indian retailers rely heavily on credit sales ("udhaar") and need to follow up with customers who have outstanding balances. The system tracks credit balances but provides no mechanism to send reminders or track follow-ups. Without this, credit collection becomes ad-hoc and disorganized.

## Requirements

### Reminder Dashboard
- New section in the Outstanding report or a dedicated "Follow-ups" page
- List customers with outstanding credit balance, sorted by:
  - Oldest outstanding first (aging)
  - Highest balance first
  - Recently contacted last
- Show: customer name, phone, total outstanding, oldest invoice date, days overdue

### Send Reminders
- **SMS reminder**: Integration with SMS gateway (MSG91, TextLocal, or similar)
  - Template: "Dear {name}, your outstanding balance of ₹{amount} at {storeName} is due. Please clear your dues."
  - Requires SMS gateway API key in settings
- **WhatsApp reminder**: Integration with WhatsApp Business API
  - Template-based messages via WhatsApp Business API
  - Fallback: generate WhatsApp deep link (`https://wa.me/{phone}?text={message}`)
- **Manual follow-up logging**: Record that a follow-up was made (call, visit, message)
  - Fields: date, type (call/visit/sms/whatsapp), notes, next follow-up date

### Aging Report
- Group outstanding balances by aging buckets:
  - 0–30 days (current)
  - 31–60 days
  - 61–90 days
  - 90+ days (overdue)
- Show total per bucket, with customer breakdown
- Color coding: green → yellow → orange → red

### Notification Preferences
- Add notification settings for credit reminders:
  - Auto-remind after X days (configurable)
  - Remind frequency: daily, weekly, bi-weekly
  - Default reminder method: SMS, WhatsApp, or manual

### Settings
- Add to TenantSettings or new NotificationSettings model:
  - `reminderEnabled`: boolean
  - `reminderDays`: number (days before auto-remind)
  - `reminderMethod`: 'SMS' | 'WHATSAPP' | 'MANUAL'
  - `smsProvider`: string (API provider name)
  - `smsApiKey`: string (encrypted)

## Acceptance Criteria

- [ ] Outstanding customers are listed with aging buckets
- [ ] Can send WhatsApp deep-link reminders from the UI
- [ ] Can log manual follow-ups (call, visit, message)
- [ ] Follow-up history is visible per customer
- [ ] Aging report shows totals per bucket with color coding
- [ ] SMS integration works (with valid API key configured)
- [ ] Notification settings are configurable per tenant
- [ ] Only users with `CUSTOMER_VIEW` permission can see follow-ups

## Files to Create/Modify

- `src/app/api/customers/[id]/followups/route.ts` — New: POST log follow-up, GET history
- `src/app/api/reports/outstanding/route.ts` — Add aging buckets
- `src/app/(dashboard)/customers/[id]/page.tsx` — Add follow-up history section
- `src/app/(dashboard)/dashboard/reports/page.tsx` — Add aging report tab or section
- `src/lib/sms.ts` — New: SMS gateway integration
- `prisma/schema.prisma` — Add FollowUp model, NotificationSettings