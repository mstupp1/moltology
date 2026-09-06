CREATE TABLE "forum_board_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"categoryId" uuid NOT NULL,
	"lastVisitedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "forum_board_visits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "forum_topic_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"topicId" uuid NOT NULL,
	"lastVisitedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "forum_topic_visits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "forum_board_visits" ADD CONSTRAINT "forum_board_visits_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_board_visits" ADD CONSTRAINT "forum_board_visits_categoryId_forum_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."forum_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_topic_visits" ADD CONSTRAINT "forum_topic_visits_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_topic_visits" ADD CONSTRAINT "forum_topic_visits_topicId_forum_topics_id_fk" FOREIGN KEY ("topicId") REFERENCES "public"."forum_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "forum_board_visits_user_category_unique" ON "forum_board_visits" USING btree ("userId","categoryId");--> statement-breakpoint
CREATE INDEX "forum_board_visits_user_idx" ON "forum_board_visits" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "forum_topic_visits_user_topic_unique" ON "forum_topic_visits" USING btree ("userId","topicId");--> statement-breakpoint
CREATE INDEX "forum_topic_visits_user_idx" ON "forum_topic_visits" USING btree ("userId");--> statement-breakpoint
CREATE POLICY "forum_board_visits_owner_select_policy" ON "forum_board_visits" AS PERMISSIVE FOR SELECT TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "forum_board_visits_owner_insert_policy" ON "forum_board_visits" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "forum_board_visits_owner_update_policy" ON "forum_board_visits" AS PERMISSIVE FOR UPDATE TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)) WITH CHECK ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "forum_board_visits_owner_delete_policy" ON "forum_board_visits" AS PERMISSIVE FOR DELETE TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "forum_topic_visits_owner_select_policy" ON "forum_topic_visits" AS PERMISSIVE FOR SELECT TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "forum_topic_visits_owner_insert_policy" ON "forum_topic_visits" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "forum_topic_visits_owner_update_policy" ON "forum_topic_visits" AS PERMISSIVE FOR UPDATE TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)) WITH CHECK ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "forum_topic_visits_owner_delete_policy" ON "forum_topic_visits" AS PERMISSIVE FOR DELETE TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));