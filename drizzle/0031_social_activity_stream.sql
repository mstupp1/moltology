ALTER TABLE "activity_events" ADD COLUMN "visibility" text DEFAULT 'friends' NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_events" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_events" ADD COLUMN "href" text;--> statement-breakpoint
CREATE INDEX "activity_events_user_created_idx" ON "activity_events" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "activity_events_kind_created_idx" ON "activity_events" USING btree ("kind","createdAt");--> statement-breakpoint
DROP POLICY "activity_events_isolation_policy" ON "activity_events";--> statement-breakpoint
CREATE POLICY "activity_events_select_policy" ON "activity_events" AS PERMISSIVE FOR SELECT TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)
      OR visibility = 'public'
      OR (
        visibility = 'friends'
        AND EXISTS (
          SELECT 1 FROM friendships f
          WHERE (
            (f."userAId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') AND f."userBId" = "userId")
            OR (f."userBId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') AND f."userAId" = "userId")
          )
        )
      ));--> statement-breakpoint
CREATE POLICY "activity_events_owner_insert_policy" ON "activity_events" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "activity_events_owner_update_policy" ON "activity_events" AS PERMISSIVE FOR UPDATE TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)) WITH CHECK ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "activity_events_owner_delete_policy" ON "activity_events" AS PERMISSIVE FOR DELETE TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL));
