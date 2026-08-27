-- Store administrator feedback for listing moderation decisions.
ALTER TABLE "Property"
ADD COLUMN "moderationReason" TEXT;
