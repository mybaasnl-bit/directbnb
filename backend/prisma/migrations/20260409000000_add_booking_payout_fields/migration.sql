-- CreateEnum
CREATE TYPE "BookingPayoutStatus" AS ENUM ('PENDING', 'TRANSFERRED', 'FAILED', 'NOT_APPLICABLE');

-- AlterTable: add payout tracking fields to bookings
ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "stripeChargeId"    TEXT,
  ADD COLUMN IF NOT EXISTS "stripeTransferId"  TEXT,
  ADD COLUMN IF NOT EXISTS "platformFeeAmount" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "payoutAmount"      DECIMAL(10,2),
  ADD COLUMN               "payoutStatus"      "BookingPayoutStatus" NOT NULL DEFAULT 'PENDING';
