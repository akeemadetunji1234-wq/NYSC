-- Durable notification delivery state for Pusher realtime fan-out.
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

ALTER TABLE "Notification"
  ADD COLUMN "deliveryStatus" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "deliveredAt" TIMESTAMP(3),
  ADD COLUMN "lastDeliveryError" TEXT;

CREATE INDEX "Notification_userId_read_createdAt_idx"
  ON "Notification"("userId", "read", "createdAt");

CREATE INDEX "Notification_deliveryStatus_createdAt_idx"
  ON "Notification"("deliveryStatus", "createdAt");
