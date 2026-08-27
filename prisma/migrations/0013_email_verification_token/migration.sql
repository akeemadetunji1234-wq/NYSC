ALTER TABLE "EmailOtp" ADD COLUMN "verificationTokenHash" TEXT;

CREATE UNIQUE INDEX "EmailOtp_verificationTokenHash_key" ON "EmailOtp"("verificationTokenHash");
