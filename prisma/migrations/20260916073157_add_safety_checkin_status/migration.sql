-- CreateEnum
CREATE TYPE "SafetyCheckInStatus" AS ENUM ('ACTIVE', 'SAFE', 'NOT_SAFE');

-- AlterTable
ALTER TABLE "SafetyCheckIn" ADD COLUMN     "status" "SafetyCheckInStatus" NOT NULL DEFAULT 'ACTIVE';
