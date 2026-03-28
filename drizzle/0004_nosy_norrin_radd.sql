-- Remove any remaining growth rows before migrating the enum
DELETE FROM "step" WHERE "type" = 'growth';--> statement-breakpoint
ALTER TABLE "step" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "step" ALTER COLUMN "type" SET DEFAULT 'photo'::text;--> statement-breakpoint
DROP TYPE "public"."step_type";--> statement-breakpoint
CREATE TYPE "public"."step_type" AS ENUM('photo', 'video', 'first_word', 'milestone');--> statement-breakpoint
ALTER TABLE "step" ALTER COLUMN "type" SET DEFAULT 'photo'::"public"."step_type";--> statement-breakpoint
ALTER TABLE "step" ALTER COLUMN "type" SET DATA TYPE "public"."step_type" USING "type"::"public"."step_type";--> statement-breakpoint
ALTER TABLE "step" DROP COLUMN "weight";--> statement-breakpoint
ALTER TABLE "step" DROP COLUMN "height";
