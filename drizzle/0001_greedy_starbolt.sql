ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
DROP POLICY IF EXISTS "changelogs_admin_insert_policy" ON "changelogs";--> statement-breakpoint
CREATE POLICY "changelogs_admin_insert_policy" ON "changelogs" AS PERMISSIVE FOR INSERT TO public WITH CHECK (EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        AND profiles.role IN ('admin', 'super_admin')
    ));