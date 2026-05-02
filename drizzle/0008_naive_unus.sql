CREATE TYPE "public"."invite_kind" AS ENUM('email', 'link');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('pending', 'accepted', 'revoked', 'expired');--> statement-breakpoint
CREATE TABLE "invite" (
	"id" text PRIMARY KEY NOT NULL,
	"inviter_id" text NOT NULL,
	"kind" "invite_kind" NOT NULL,
	"email" text,
	"token" text NOT NULL,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_by_user_id" text,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invite_token_unique" UNIQUE("token"),
	CONSTRAINT "invite_email_kind_check" CHECK (("invite"."kind" = 'email' AND "invite"."email" IS NOT NULL) OR ("invite"."kind" = 'link' AND "invite"."email" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_accepted_by_user_id_user_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invite_inviter_idx" ON "invite" USING btree ("inviter_id","status");--> statement-breakpoint
CREATE INDEX "invite_email_idx" ON "invite" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invite_token_idx" ON "invite" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "invite_unique_pending_email" ON "invite" USING btree ("inviter_id","email") WHERE "invite"."status" = 'pending' AND "invite"."kind" = 'email';