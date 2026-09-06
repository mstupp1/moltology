CREATE TABLE "forum_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporterId" text NOT NULL,
	"topicId" uuid,
	"postId" uuid,
	"reason" text NOT NULL,
	"note" text,
	"status" text DEFAULT 'open' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "forum_reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "forum_reports" ADD CONSTRAINT "forum_reports_reporterId_profiles_id_fk" FOREIGN KEY ("reporterId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_reports" ADD CONSTRAINT "forum_reports_topicId_forum_topics_id_fk" FOREIGN KEY ("topicId") REFERENCES "public"."forum_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_reports" ADD CONSTRAINT "forum_reports_postId_forum_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."forum_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "forum_reports_open_topic_reporter_uidx" ON "forum_reports" USING btree ("reporterId","topicId") WHERE "forum_reports"."status" = 'open' AND "forum_reports"."topicId" IS NOT NULL AND "forum_reports"."postId" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "forum_reports_open_post_reporter_uidx" ON "forum_reports" USING btree ("reporterId","postId") WHERE "forum_reports"."status" = 'open' AND "forum_reports"."postId" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "forum_reports_status_created_idx" ON "forum_reports" USING btree ("status","createdAt");--> statement-breakpoint
CREATE POLICY "forum_reports_owner_insert_policy" ON "forum_reports" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("reporterId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "forum_reports_select_policy" ON "forum_reports" AS PERMISSIVE FOR SELECT TO public USING ("reporterId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
          AND profiles.role IN ('admin', 'super_admin')
      )
      OR (current_setting('request.jwt.claims', true) IS NULL));