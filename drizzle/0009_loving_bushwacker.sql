CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"source" text DEFAULT 'moltmax_guide' NOT NULL,
	"referrer" text,
	"claimedPdf" boolean DEFAULT true NOT NULL,
	"convertedToUser" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "leads_public_insert_policy" ON "leads" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "leads_admin_read_policy" ON "leads" AS PERMISSIVE FOR SELECT TO public USING (EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        AND profiles.role IN ('admin', 'super_admin')
    ) OR (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL));