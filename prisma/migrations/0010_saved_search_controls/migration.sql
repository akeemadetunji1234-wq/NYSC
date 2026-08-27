-- Persist the member's saved-search email-alert preference.
ALTER TABLE "SavedSearch"
ADD COLUMN "emailAlerts" BOOLEAN NOT NULL DEFAULT true;
