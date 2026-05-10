ALTER TABLE "notification" DROP CONSTRAINT "notification_step_id_step_id_fk";
--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_step_id_step_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."step"("id") ON DELETE set null ON UPDATE no action;