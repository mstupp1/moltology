CREATE TABLE "signup_risk_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"userId" text,
	"provider" text NOT NULL,
	"action" text NOT NULL,
	"riskLevel" text,
	"botScore" integer,
	"country" text,
	"emailDomain" text,
	"reason" text NOT NULL,
	"fastSubmission" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "signup_risk_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "signup_risk_events" ADD CONSTRAINT "signup_risk_events_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "signup_risk_events_user_idx" ON "signup_risk_events" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "signup_risk_events_created_idx" ON "signup_risk_events" USING btree ("createdAt");--> statement-breakpoint
CREATE POLICY "signup_risk_events_server_only_policy" ON "signup_risk_events" AS PERMISSIVE FOR ALL TO public USING (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL) WITH CHECK (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL);