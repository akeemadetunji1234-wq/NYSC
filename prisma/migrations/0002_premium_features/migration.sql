-- Additive migration for premium marketplace features.
-- This migration does not create property-payment infrastructure and does not
-- modify Booking.feeStatus. Property payments remain outside the application.

ALTER TABLE "Artisan"
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "verificationNotes" TEXT;

CREATE TABLE "SavedSearch" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "state" TEXT,
  "lga" TEXT,
  "minPrice" DOUBLE PRECISION,
  "maxPrice" DOUBLE PRECISION,
  "bedrooms" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PropertyEvent" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "viewerId" TEXT,
  "type" TEXT NOT NULL,
  "dedupeKey" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertyEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentLead" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "corpMemberId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "source" TEXT NOT NULL DEFAULT 'PLATFORM',
  "message" TEXT,
  "lastContactedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgentLead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BoostCredit" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "propertyId" TEXT,
  "source" TEXT NOT NULL DEFAULT 'PLAN',
  "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
  "startsAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BoostCredit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ArtisanReview" (
  "id" TEXT NOT NULL,
  "artisanId" TEXT NOT NULL,
  "corpMemberId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ArtisanReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PropertyEvent_dedupeKey_key" ON "PropertyEvent"("dedupeKey");
CREATE UNIQUE INDEX "ArtisanReview_artisanId_corpMemberId_key" ON "ArtisanReview"("artisanId", "corpMemberId");
CREATE INDEX "SavedSearch_userId_active_idx" ON "SavedSearch"("userId", "active");
CREATE INDEX "SavedSearch_state_lga_active_idx" ON "SavedSearch"("state", "lga", "active");
CREATE INDEX "PropertyEvent_propertyId_type_createdAt_idx" ON "PropertyEvent"("propertyId", "type", "createdAt");
CREATE INDEX "PropertyEvent_viewerId_type_createdAt_idx" ON "PropertyEvent"("viewerId", "type", "createdAt");
CREATE INDEX "AgentLead_agentId_status_updatedAt_idx" ON "AgentLead"("agentId", "status", "updatedAt");
CREATE INDEX "AgentLead_corpMemberId_createdAt_idx" ON "AgentLead"("corpMemberId", "createdAt");
CREATE INDEX "AgentLead_propertyId_createdAt_idx" ON "AgentLead"("propertyId", "createdAt");
CREATE INDEX "BoostCredit_agentId_status_expiresAt_idx" ON "BoostCredit"("agentId", "status", "expiresAt");
CREATE INDEX "BoostCredit_propertyId_status_idx" ON "BoostCredit"("propertyId", "status");
CREATE INDEX "ArtisanReview_artisanId_status_createdAt_idx" ON "ArtisanReview"("artisanId", "status", "createdAt");

ALTER TABLE "SavedSearch"
  ADD CONSTRAINT "SavedSearch_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyEvent"
  ADD CONSTRAINT "PropertyEvent_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyEvent"
  ADD CONSTRAINT "PropertyEvent_viewerId_fkey"
  FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgentLead"
  ADD CONSTRAINT "AgentLead_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentLead"
  ADD CONSTRAINT "AgentLead_corpMemberId_fkey"
  FOREIGN KEY ("corpMemberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentLead"
  ADD CONSTRAINT "AgentLead_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoostCredit"
  ADD CONSTRAINT "BoostCredit_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoostCredit"
  ADD CONSTRAINT "BoostCredit_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ArtisanReview"
  ADD CONSTRAINT "ArtisanReview_artisanId_fkey"
  FOREIGN KEY ("artisanId") REFERENCES "Artisan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtisanReview"
  ADD CONSTRAINT "ArtisanReview_corpMemberId_fkey"
  FOREIGN KEY ("corpMemberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill one available agent credit for existing active premium agents.
INSERT INTO "BoostCredit" ("id", "agentId", "source", "status", "createdAt")
SELECT 'legacy_' || md5(u."id"), u."id", 'LEGACY_PREMIUM', 'AVAILABLE', CURRENT_TIMESTAMP
FROM "User" u
WHERE u."role" = 'AGENT'
  AND u."isPremium" = true
  AND u."premiumPlan" = 'AGENT_PREMIUM'
  AND (u."premiumExpiry" IS NULL OR u."premiumExpiry" > CURRENT_TIMESTAMP)
  AND NOT EXISTS (
    SELECT 1 FROM "BoostCredit" b WHERE b."agentId" = u."id" AND b."status" = 'AVAILABLE'
  );

-- Prisma requires the updatedAt columns to be populated on future writes;
-- existing rows do not exist in these new tables, so the defaults above are safe.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Artisan_rating_range_check') THEN
    ALTER TABLE "ArtisanReview" ADD CONSTRAINT "Artisan_rating_range_check" CHECK ("rating" BETWEEN 1 AND 5);
  END IF;
END $$;

UPDATE "Artisan" SET "verifiedAt" = CURRENT_TIMESTAMP WHERE "verified" = true AND "verifiedAt" IS NULL;
UPDATE "Artisan" SET "verificationNotes" = 'Verified by platform administrator.' WHERE "verified" = true AND "verificationNotes" IS NULL;

-- Note: this migration intentionally does not seed transport content. Transport
-- guides must be entered and maintained through the CMS as published records.

-- Down migration is intentionally not provided; production rollback must use
-- the reviewed Prisma migration rollback procedure.
