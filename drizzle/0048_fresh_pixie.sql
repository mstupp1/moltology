CREATE TABLE "ai_usage_daily_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"date" text NOT NULL,
	"kind" text NOT NULL,
	"model" text DEFAULT '' NOT NULL,
	"requestCount" integer DEFAULT 0 NOT NULL,
	"inputTokens" bigint DEFAULT 0 NOT NULL,
	"outputTokens" bigint DEFAULT 0 NOT NULL,
	"missingInputTokenCount" integer DEFAULT 0 NOT NULL,
	"missingOutputTokenCount" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_usage_daily_summaries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "routine_day_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"completedOn" text NOT NULL,
	"taskKeys" text[] NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "routine_day_summaries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ai_usage_daily_summaries" ADD CONSTRAINT "ai_usage_daily_summaries_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_day_summaries" ADD CONSTRAINT "routine_day_summaries_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_usage_daily_summaries_user_date_kind_model_unique" ON "ai_usage_daily_summaries" USING btree ("userId","date","kind","model");--> statement-breakpoint
CREATE UNIQUE INDEX "routine_day_summaries_user_date_unique" ON "routine_day_summaries" USING btree ("userId","completedOn");--> statement-breakpoint
CREATE POLICY "ai_usage_daily_summaries_server_only_policy" ON "ai_usage_daily_summaries" AS PERMISSIVE FOR ALL TO public USING (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL) WITH CHECK (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL);--> statement-breakpoint
CREATE POLICY "routine_day_summaries_isolation_policy" ON "routine_day_summaries" AS PERMISSIVE FOR ALL TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));