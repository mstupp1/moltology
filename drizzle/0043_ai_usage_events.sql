CREATE TABLE "ai_usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"kind" text NOT NULL,
	"model" text,
	"inputTokens" integer,
	"outputTokens" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_usage_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_usage_events_user_created_idx" ON "ai_usage_events" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE POLICY "ai_usage_events_server_only_policy" ON "ai_usage_events" AS PERMISSIVE FOR ALL TO public USING (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL) WITH CHECK (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL);