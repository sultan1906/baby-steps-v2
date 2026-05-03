CREATE TABLE "album" (
	"id" text PRIMARY KEY NOT NULL,
	"baby_id" text NOT NULL,
	"name" text NOT NULL,
	"cover_step_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "album_step" (
	"id" text PRIMARY KEY NOT NULL,
	"album_id" text NOT NULL,
	"step_id" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "album_step_unique_pair" UNIQUE("album_id","step_id")
);
--> statement-breakpoint
ALTER TABLE "album" ADD CONSTRAINT "album_baby_id_baby_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."baby"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album" ADD CONSTRAINT "album_cover_step_id_step_id_fk" FOREIGN KEY ("cover_step_id") REFERENCES "public"."step"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_step" ADD CONSTRAINT "album_step_album_id_album_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."album"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_step" ADD CONSTRAINT "album_step_step_id_step_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."step"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "album_baby_idx" ON "album" USING btree ("baby_id");--> statement-breakpoint
CREATE INDEX "album_step_album_idx" ON "album_step" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "album_step_step_idx" ON "album_step" USING btree ("step_id");