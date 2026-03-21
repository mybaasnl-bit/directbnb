-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "depositAmount" DECIMAL(10,2),
ADD COLUMN     "depositPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripePaymentIntentId" TEXT;
