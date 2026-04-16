-- Add PARTIAL to PaymentStatus enum
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIAL' BEFORE 'OVERDUE';