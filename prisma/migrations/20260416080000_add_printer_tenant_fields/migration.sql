-- Add tenant isolation and control fields to PrinterConfig
ALTER TABLE "PrinterConfig" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "PrinterConfig" ADD COLUMN "autoCut" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PrinterConfig" ADD COLUMN "cashDrawer" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PrinterConfig" ADD COLUMN "autoPrint" BOOLEAN NOT NULL DEFAULT false;

-- Backfill tenantId from store relation
UPDATE "PrinterConfig" SET "tenantId" = (SELECT "tenantId" FROM "Store" WHERE "Store"."id" = "PrinterConfig"."storeId");

-- Make tenantId NOT NULL after backfill
ALTER TABLE "PrinterConfig" ALTER COLUMN "tenantId" SET NOT NULL;