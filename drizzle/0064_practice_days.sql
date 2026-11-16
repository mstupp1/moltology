CREATE TABLE "practice_day_schedules" (
	"userId" text NOT NULL,
	"effectiveFrom" text NOT NULL,
	"days" smallint NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "practice_day_schedules_userId_effectiveFrom_pk" PRIMARY KEY("userId","effectiveFrom")
);
--> statement-breakpoint
ALTER TABLE "practice_day_schedules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "practice_day_schedules" ADD CONSTRAINT "practice_day_schedules_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "practice_day_schedules_isolation_policy" ON "practice_day_schedules" AS PERMISSIVE FOR ALL TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));