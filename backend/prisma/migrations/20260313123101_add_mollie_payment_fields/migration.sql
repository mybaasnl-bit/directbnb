-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'MOLLIE');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "molliePaymentId" TEXT,
ADD COLUMN     "paymentProvider" "PaymentProvider";
