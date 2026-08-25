-- Track transactional email delivery separately from realtime notification delivery.
ALTER TABLE "Notification"
  ADD COLUMN "emailDeliveryAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "emailDeliveredAt" TIMESTAMP(3),
  ADD COLUMN "lastEmailError" TEXT;
