CREATE TYPE "PaymentProvider" AS ENUM ('PAYSTACK');

CREATE TYPE "PremiumPaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'ABANDONED');

CREATE TABLE "PremiumPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'PAYSTACK',
    "reference" TEXT NOT NULL,
    "providerTransactionId" TEXT,
    "plan" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "PremiumPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "authorizationUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PremiumPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PremiumPayment_reference_key" ON "PremiumPayment"("reference");
CREATE INDEX "PremiumPayment_userId_createdAt_idx" ON "PremiumPayment"("userId", "createdAt");
CREATE INDEX "PremiumPayment_status_createdAt_idx" ON "PremiumPayment"("status", "createdAt");

ALTER TABLE "PremiumPayment" ADD CONSTRAINT "PremiumPayment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
