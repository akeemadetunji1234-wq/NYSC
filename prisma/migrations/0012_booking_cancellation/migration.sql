-- Add an explicit cancellation state for member-owned booking requests.
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
