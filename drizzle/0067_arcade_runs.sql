CREATE TABLE "arcade_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"game" text NOT NULL,
	"seed" integer NOT NULL,
	"score" integer,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"finishedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "arcade_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "arcade_runs" ADD CONSTRAINT "arcade_runs_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "arcade_runs_game_finished_idx" ON "arcade_runs" USING btree ("game","finishedAt");--> statement-breakpoint
CREATE INDEX "arcade_runs_user_started_idx" ON "arcade_runs" USING btree ("userId","startedAt");--> statement-breakpoint
CREATE POLICY "arcade_runs_server_only" ON "arcade_runs" AS PERMISSIVE FOR ALL TO public USING (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL) WITH CHECK (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL);