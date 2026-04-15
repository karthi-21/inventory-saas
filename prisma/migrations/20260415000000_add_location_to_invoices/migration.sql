-- Add locationId to SalesInvoice for counter-wise sales tracking
ALTER TABLE "SalesInvoice" ADD COLUMN "locationId" TEXT;

-- Add locationId to Shift for counter-wise shift tracking
ALTER TABLE "Shift" ADD COLUMN "locationId" TEXT;

-- Add foreign key constraints
ALTER TABLE "SalesInvoice" ADD CONSTRAINT "SalesInvoice_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Shift" ADD CONSTRAINT "Shift_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for faster location-based queries
CREATE INDEX "SalesInvoice_locationId_idx" ON "SalesInvoice"("locationId");
CREATE INDEX "Shift_locationId_idx" ON "Shift"("locationId");