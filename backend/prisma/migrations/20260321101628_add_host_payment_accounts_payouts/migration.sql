-- CreateEnum
CREATE TYPE "HostPaymentStatus" AS ENUM ('PENDING', 'ONBOARDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'PAID', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "host_payment_accounts" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'STRIPE',
    "providerAccountId" TEXT,
    "ibanLast4" TEXT,
    "bankName" TEXT,
    "status" "HostPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "detailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "platformFeePercent" DECIMAL(5,2) DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "host_payment_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "hostAccountId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "bookingId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "providerPayoutId" TEXT,
    "description" TEXT,
    "arrivalDate" TIMESTAMP(3),
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "host_payment_accounts_ownerId_key" ON "host_payment_accounts"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "host_payment_accounts_providerAccountId_key" ON "host_payment_accounts"("providerAccountId");

-- CreateIndex
CREATE INDEX "host_payment_accounts_ownerId_idx" ON "host_payment_accounts"("ownerId");

-- CreateIndex
CREATE INDEX "payouts_hostAccountId_idx" ON "payouts"("hostAccountId");

-- CreateIndex
CREATE INDEX "payouts_ownerId_idx" ON "payouts"("ownerId");

-- CreateIndex
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- AddForeignKey
ALTER TABLE "host_payment_accounts" ADD CONSTRAINT "host_payment_accounts_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_hostAccountId_fkey" FOREIGN KEY ("hostAccountId") REFERENCES "host_payment_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
