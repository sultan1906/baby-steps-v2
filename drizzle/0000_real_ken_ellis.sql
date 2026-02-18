CREATE TYPE "public"."step_type" AS ENUM('photo', 'video', 'growth', 'first_word', 'milestone');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "baby" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"birthdate" text NOT NULL,
	"photo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_description" (
	"id" text PRIMARY KEY NOT NULL,
	"baby_id" text NOT NULL,
	"date" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_description_baby_id_date_unique" UNIQUE("baby_id","date")
);
--> statement-breakpoint
CREATE TABLE "saved_location" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"nickname" text NOT NULL,
	"address" text NOT NULL,
	"full_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "step" (
	"id" text PRIMARY KEY NOT NULL,
	"baby_id" text NOT NULL,
	"photo_url" text,
	"date" text NOT NULL,
	"location_id" text,
	"location_nickname" text,
	"is_major" boolean DEFAULT false NOT NULL,
	"type" "step_type" DEFAULT 'photo' NOT NULL,
	"weight" real,
	"height" real,
	"first_word" text,
	"title" text,
	"caption" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baby" ADD CONSTRAINT "baby_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_description" ADD CONSTRAINT "daily_description_baby_id_baby_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."baby"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_location" ADD CONSTRAINT "saved_location_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step" ADD CONSTRAINT "step_baby_id_baby_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."baby"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step" ADD CONSTRAINT "step_location_id_saved_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."saved_location"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "baby_user_idx" ON "baby" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_loc_user_idx" ON "saved_location" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "step_baby_idx" ON "step" USING btree ("baby_id");--> statement-breakpoint
CREATE INDEX "step_baby_date_idx" ON "step" USING btree ("baby_id","date");