CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"handle" text,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"category" text NOT NULL,
	"urgency" text DEFAULT 'NORMAL' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"ipHash" text,
	"emailSentAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_tickets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "support_tickets_user_created_idx" ON "support_tickets" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE POLICY "support_tickets_owner_insert_policy" ON "support_tickets" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "support_tickets_owner_select_policy" ON "support_tickets" AS PERMISSIVE FOR SELECT TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL));