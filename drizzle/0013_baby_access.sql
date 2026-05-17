CREATE TYPE "public"."baby_access_role" AS ENUM('coparent');--> statement-breakpoint
CREATE TABLE "baby_access" (
	"id" text PRIMARY KEY NOT NULL,
	"baby_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "baby_access_role" DEFAULT 'coparent' NOT NULL,
	"added_by_user_id" text,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "baby_access_unique_baby_user" UNIQUE("baby_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "baby_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"baby_id" text NOT NULL,
	"inviter_id" text NOT NULL,
	"kind" "invite_kind" NOT NULL,
	"email" text,
	"token" text NOT NULL,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_by_user_id" text,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "baby_invite_token_unique" UNIQUE("token"),
	CONSTRAINT "baby_invite_email_kind_check" CHECK (("baby_invite"."kind" = 'email' AND "baby_invite"."email" IS NOT NULL) OR ("baby_invite"."kind" = 'link' AND "baby_invite"."email" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "baby_access" ADD CONSTRAINT "baby_access_baby_id_baby_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."baby"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baby_access" ADD CONSTRAINT "baby_access_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baby_access" ADD CONSTRAINT "baby_access_added_by_user_id_user_id_fk" FOREIGN KEY ("added_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baby_invite" ADD CONSTRAINT "baby_invite_baby_id_baby_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."baby"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baby_invite" ADD CONSTRAINT "baby_invite_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baby_invite" ADD CONSTRAINT "baby_invite_accepted_by_user_id_user_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "baby_access_baby_idx" ON "baby_access" USING btree ("baby_id");--> statement-breakpoint
CREATE INDEX "baby_access_user_idx" ON "baby_access" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "baby_invite_baby_idx" ON "baby_invite" USING btree ("baby_id","status");--> statement-breakpoint
CREATE INDEX "baby_invite_inviter_idx" ON "baby_invite" USING btree ("inviter_id","status");--> statement-breakpoint
CREATE INDEX "baby_invite_token_idx" ON "baby_invite" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "baby_invite_unique_pending_email" ON "baby_invite" USING btree ("baby_id","email") WHERE "baby_invite"."status" = 'pending' AND "baby_invite"."kind" = 'email';