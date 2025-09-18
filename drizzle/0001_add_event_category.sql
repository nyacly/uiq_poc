ALTER TABLE "events" ADD COLUMN "category" varchar(120) NOT NULL DEFAULT 'general';
CREATE INDEX IF NOT EXISTS "events_category_idx" ON "events" ("category");
ALTER TABLE "events" ALTER COLUMN "category" DROP DEFAULT;
