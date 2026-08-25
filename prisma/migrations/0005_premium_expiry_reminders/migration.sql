-- Add a dedicated notification type for annual premium expiry reminders.
ALTER TYPE "NotificationType" ADD VALUE 'PREMIUM_EXPIRY_REMINDER';

ALTER TABLE "Notification" ADD COLUMN "dedupeKey" TEXT;
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");
