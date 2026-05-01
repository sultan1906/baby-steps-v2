ALTER TABLE "user" ADD COLUMN "onboarded_at" timestamp;
--> statement-breakpoint
UPDATE "user"
SET "onboarded_at" = "created_at"
WHERE EXISTS (SELECT 1 FROM "baby" WHERE "baby"."user_id" = "user"."id");