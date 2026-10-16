CREATE TABLE "routine_streak_carries" (
	"userId" text PRIMARY KEY NOT NULL,
	"anchorDate" text NOT NULL,
	"streakDays" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "routine_streak_carries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "routine_streak_carries" ADD CONSTRAINT "routine_streak_carries_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "routine_completions_date_user_idx" ON "routine_completions" USING btree ("completedOn","userId");--> statement-breakpoint
CREATE INDEX "routine_day_summaries_date_user_idx" ON "routine_day_summaries" USING btree ("completedOn","userId");--> statement-breakpoint
CREATE POLICY "routine_streak_carries_isolation_policy" ON "routine_streak_carries" AS PERMISSIVE FOR ALL TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));