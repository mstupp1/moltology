CREATE TABLE "community_photos" (
	"id" text PRIMARY KEY NOT NULL,
	"castHash" text NOT NULL,
	"imageKey" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"spots" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"takenBy" text,
	"takenAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "community_photos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "community_photos_server_only" ON "community_photos" AS PERMISSIVE FOR ALL TO public USING (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL) WITH CHECK (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL);