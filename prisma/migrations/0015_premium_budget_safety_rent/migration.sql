CREATE TYPE "AllowanceCategory" AS ENUM ('RENT', 'FOOD', 'TRANSPORT', 'DATA_AIRTIME', 'HEALTH', 'MISC');
CREATE TYPE "RentRecurrence" AS ENUM ('ONE_TIME', 'ANNUAL');
ALTER TYPE "NotificationType" ADD VALUE 'RENT_DUE_REMINDER';

CREATE TABLE "AllowanceBudget" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "monthlyIncome" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AllowanceBudget_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AllowanceBudget_userId_key" ON "AllowanceBudget"("userId");

CREATE TABLE "AllowanceExpense" (
  "id" TEXT NOT NULL,
  "budgetId" TEXT NOT NULL,
  "category" "AllowanceCategory" NOT NULL,
  "amount" INTEGER NOT NULL,
  "note" TEXT,
  "spentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AllowanceExpense_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AllowanceExpense_budgetId_spentAt_idx" ON "AllowanceExpense"("budgetId", "spentAt");

CREATE TABLE "SafetyCheckIn" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "propertyId" TEXT,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "label" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "checkedInAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SafetyCheckIn_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SafetyCheckIn_token_key" ON "SafetyCheckIn"("token");
CREATE INDEX "SafetyCheckIn_userId_idx" ON "SafetyCheckIn"("userId");
CREATE INDEX "SafetyCheckIn_expiresAt_idx" ON "SafetyCheckIn"("expiresAt");

CREATE TABLE "RentSchedule" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "recurrence" "RentRecurrence" NOT NULL DEFAULT 'ANNUAL',
  "lastRemindedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RentSchedule_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RentSchedule_bookingId_key" ON "RentSchedule"("bookingId");
CREATE INDEX "RentSchedule_dueDate_idx" ON "RentSchedule"("dueDate");
CREATE INDEX "RentSchedule_agentId_idx" ON "RentSchedule"("agentId");
CREATE INDEX "RentSchedule_tenantId_idx" ON "RentSchedule"("tenantId");

ALTER TABLE "AllowanceBudget" ADD CONSTRAINT "AllowanceBudget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AllowanceExpense" ADD CONSTRAINT "AllowanceExpense_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "AllowanceBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SafetyCheckIn" ADD CONSTRAINT "SafetyCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SafetyCheckIn" ADD CONSTRAINT "SafetyCheckIn_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RentSchedule" ADD CONSTRAINT "RentSchedule_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
