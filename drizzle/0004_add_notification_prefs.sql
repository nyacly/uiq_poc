ALTER TABLE "profiles"
ADD COLUMN "notification_prefs" jsonb NOT NULL DEFAULT '{"email":true,"sms":false,"digest":"weekly"}'::jsonb;
