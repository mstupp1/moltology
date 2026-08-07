CREATE TABLE "routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"timeSlot" text NOT NULL,
	"category" text DEFAULT 'DISCIPLINE' NOT NULL,
	"icon" text DEFAULT 'Activity' NOT NULL,
	"recurrence" jsonb DEFAULT '{"daysOfWeek":[]}'::jsonb NOT NULL,
	"streakCount" integer DEFAULT 0 NOT NULL,
	"lastCompletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "routines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "assets_isolation_policy" ON "assets" CASCADE;--> statement-breakpoint
DROP TABLE "assets" CASCADE;--> statement-breakpoint
DROP POLICY "daily_routines_isolation_policy" ON "daily_routines" CASCADE;--> statement-breakpoint
DROP TABLE "daily_routines" CASCADE;--> statement-breakpoint
ALTER TABLE "routines" ADD CONSTRAINT "routines_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "routines_isolation_policy" ON "routines" AS PERMISSIVE FOR ALL TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));