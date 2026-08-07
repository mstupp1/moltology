CREATE POLICY "changelogs_admin_update_policy" ON "changelogs" AS PERMISSIVE FOR UPDATE TO public USING (EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        AND profiles.role IN ('admin', 'super_admin')
    )) WITH CHECK (EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        AND profiles.role IN ('admin', 'super_admin')
    ));--> statement-breakpoint
CREATE POLICY "changelogs_admin_delete_policy" ON "changelogs" AS PERMISSIVE FOR DELETE TO public USING (EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        AND profiles.role IN ('admin', 'super_admin')
    ));