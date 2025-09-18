ALTER TABLE "reports" RENAME COLUMN "subject_type" TO "target_type";
ALTER TABLE "reports" RENAME COLUMN "subject_id" TO "target_id";

ALTER TABLE "reports" ALTER COLUMN "status" SET DEFAULT 'open';

ALTER TABLE "reports" DROP CONSTRAINT IF EXISTS "reports_subject_check";
ALTER TABLE "reports" ADD CONSTRAINT "reports_target_check" CHECK (
  "target_type" IN ('user', 'business', 'event', 'announcement', 'classified', 'message')
);

ALTER INDEX IF EXISTS "reports_subject_idx" RENAME TO "reports_target_idx";

ALTER TABLE "reports" DROP CONSTRAINT IF EXISTS "reports_status_check";
ALTER TABLE "reports" ADD CONSTRAINT "reports_status_check" CHECK (
  "status" IN ('open', 'pending', 'reviewing', 'resolved', 'dismissed')
);

UPDATE "reports" SET "status" = 'open' WHERE "status" = 'pending';
