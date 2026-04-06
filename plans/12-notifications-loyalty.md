# Day 12: Notifications, Loyalty & Customer Engagement

## Goal
A retailer automatically engages customers via WhatsApp/SMS/email notifications and a loyalty program that drives repeat business.

---

## Why This Day Matters
Retention is as important as acquisition. A loyalty program + timely notifications keeps customers coming back. WhatsApp is the #1 channel for Indian SME customers.

---

## Tasks

### 12.1 WhatsApp Business API Integration
- [ ] Set up WhatsApp Business Cloud API (Meta)
- [ ] Create WhatsApp message templates:
  - Invoice receipt
  - Payment reminder
  - Loyalty points earned
  - Low stock alert (internal)
  - Expiry reminder (internal)
- [ ] Send invoice via WhatsApp after POS sale
- [ ] Send payment reminder for outstanding credit

### 12.2 SMS Notifications
- [ ] Set up MSG91 or Twilio for SMS
- [ ] Transactional SMS templates (pre-approved by telecom):
  - OTP (auth)
  - Welcome message after signup
  - Invoice receipt (backup to WhatsApp)
  - Payment received confirmation

### 12.3 Email Notifications (Resend)
- [ ] Welcome email after onboarding
- [ ] Invoice receipt (PDF attachment)
- [ ] Payment confirmation
- [ ] Subscription renewal reminder (3 days before trial ends)
- [ ] Low stock alert digest (daily summary)

### 12.4 Loyalty Program
- [ ] "Loyalty" section in customer profile
- [ ] Display: Points balance, ₹ value, tier (Bronze/Silver/Gold)
- [ ] Points earning: configurable per ₹ spent
- [ ] Points redemption: 1 point = ₹1 (configurable)
- [ ] Tier benefits:
  - Bronze: 1x points
  - Silver: 1.25x points (after 10K spending)
  - Gold: 1.5x points (after 50K spending)
- [ ] "Redeem at checkout" in POS

### 12.5 Customer SMS/WhatsApp Opt-in
- [ ] During customer creation: "Send promotional messages?" checkbox
- [ ] GDPR/DPDP compliance: easy unsubscribe

### 12.6 Notifications API
- [ ] POST `/api/notifications/send`: Generic notification sender
- [ ] POST `/api/notifications/whatsapp`: Send WhatsApp template
- [ ] POST `/api/notifications/sms`: Send SMS
- [ ] POST `/api/notifications/email`: Send email
- [ ] Background job processing (for bulk notifications)
  - Use Supabase Edge Functions or a simple queue

### 12.7 Internal Alerts
- [ ] Low stock → email/Slack to store owner
- [ ] Expiry alert → email daily digest
- [ ] Large outstanding → email weekly reminder

---

## Deliverable
A retailer can send WhatsApp receipts, manage loyalty points, and set up automated notifications — all without manual effort.

---

## Dependencies
- Day 4 (POS sale triggers notification)
- Day 6 (customer creation)
- Day 8 (purchase → stock alerts)
- WhatsApp Business API approved
- MSG91/Twilio account
- Resend account
