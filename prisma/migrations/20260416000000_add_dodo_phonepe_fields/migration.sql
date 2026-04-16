-- Migration: Add Dodo Payments fields, PhonePe fields, Email tracking
-- Replaces Razorpay with Dodo Payments for subscriptions
-- Adds PhonePe payment gateway fields for POS
-- Adds EmailLog for transactional email tracking
-- Adds FollowUp model for payment reminders
-- Adds StorePaymentConfig for per-store payment settings

-- 1. Subscription: Add Dodo fields, keep Razorpay as optional (migration reference)
ALTER TABLE "Subscription" ADD COLUMN "dodoCustomerId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "dodoSubscriptionId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "dodoPaymentId" TEXT;

-- 2. Payment: Add PhonePe fields and payment gateway status
ALTER TABLE "Payment" ADD COLUMN "phonePeTransactionId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "phonePeMerchantTxnId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Payment" ADD COLUMN "paymentCompletedAt" TIMESTAMP(3);

-- Create enum for PaymentGatewayStatus
CREATE TYPE "PaymentGatewayStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- Alter paymentStatus to use the enum
ALTER TABLE "Payment" ALTER COLUMN "paymentStatus" TYPE "PaymentGatewayStatus" USING "paymentStatus"::"PaymentGatewayStatus";

-- 3. EmailLog: Track all sent emails
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resendId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailLog_tenantId_idx" ON "EmailLog"("tenantId");
CREATE INDEX "EmailLog_template_idx" ON "EmailLog"("template");
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");

-- 4. FollowUp: Track payment follow-ups
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "nextDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FollowUp_customerId_idx" ON "FollowUp"("customerId");

-- 5. StorePaymentConfig: Per-store payment method settings
CREATE TABLE "StorePaymentConfig" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "merchantVPA" TEXT NOT NULL DEFAULT '',
    "merchantName" TEXT NOT NULL DEFAULT 'Ezvento Store',
    "phonepeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cashEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cardEnabled" BOOLEAN NOT NULL DEFAULT false,
    "upiQrEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoSendReceipt" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StorePaymentConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StorePaymentConfig_storeId_key" ON "StorePaymentConfig"("storeId");

-- 6. TenantSettings: Add email notification fields
ALTER TABLE "TenantSettings" ADD COLUMN "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "TenantSettings" ADD COLUMN "invoiceAutoSend" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "TenantSettings" ADD COLUMN "lowStockEmailAlerts" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "TenantSettings" ADD COLUMN "paymentReminderFrequency" TEXT NOT NULL DEFAULT 'WEEKLY';
ALTER TABLE "TenantSettings" ADD COLUMN "shiftSummaryEmail" BOOLEAN NOT NULL DEFAULT false;

-- 7. Add foreign keys
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_tenant_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_customer_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StorePaymentConfig" ADD CONSTRAINT "StorePaymentConfig_store_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Add unique constraint on PhonePe transaction ID
CREATE UNIQUE INDEX "Payment_phonePeTransactionId_key" ON "Payment"("phonePeTransactionId");
