CREATE TABLE "routine_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"taskKey" text NOT NULL,
	"completedOn" text NOT NULL,
	"completedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "routine_completions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "routine_completions" ADD CONSTRAINT "routine_completions_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "routine_completions_user_task_date_unique" ON "routine_completions" USING btree ("userId","taskKey","completedOn");--> statement-breakpoint
CREATE POLICY "routine_completions_isolation_policy" ON "routine_completions" AS PERMISSIVE FOR ALL TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));