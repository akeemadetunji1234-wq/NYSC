CREATE TABLE "GoogleOnboardingState" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GoogleOnboardingState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GoogleOnboardingState_tokenHash_key" ON "GoogleOnboardingState"("tokenHash");
CREATE INDEX "GoogleOnboardingState_email_idx" ON "GoogleOnboardingState"("email");
CREATE INDEX "GoogleOnboardingState_expiresAt_idx" ON "GoogleOnboardingState"("expiresAt");
