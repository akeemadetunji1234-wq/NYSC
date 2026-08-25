-- Keep simulated checkout confirmations distinct from ordinary messages.
ALTER TYPE "NotificationType" ADD VALUE 'PREMIUM_PAYMENT_SIMULATED';
