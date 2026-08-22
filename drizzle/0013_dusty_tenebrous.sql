CREATE TABLE "forum_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"topicId" uuid,
	"postId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "forum_votes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "forum_votes" ADD CONSTRAINT "forum_votes_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_votes" ADD CONSTRAINT "forum_votes_topicId_forum_topics_id_fk" FOREIGN KEY ("topicId") REFERENCES "public"."forum_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_votes" ADD CONSTRAINT "forum_votes_postId_forum_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."forum_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "forum_votes_topic_user_unique" ON "forum_votes" USING btree ("userId","topicId");--> statement-breakpoint
CREATE UNIQUE INDEX "forum_votes_post_user_unique" ON "forum_votes" USING btree ("userId","postId");--> statement-breakpoint
CREATE POLICY "forum_votes_public_read_policy" ON "forum_votes" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "forum_votes_owner_insert_policy" ON "forum_votes" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "forum_votes_owner_update_policy" ON "forum_votes" AS PERMISSIVE FOR UPDATE TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)) WITH CHECK ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "forum_votes_owner_delete_policy" ON "forum_votes" AS PERMISSIVE FOR DELETE TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));