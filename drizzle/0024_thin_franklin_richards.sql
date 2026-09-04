ALTER TABLE "forum_posts" ADD COLUMN "parentId" uuid;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_parent_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."forum_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "forum_posts_topic_parent_idx" ON "forum_posts" USING btree ("topicId","parentId");--> statement-breakpoint
CREATE INDEX "forum_posts_topic_created_idx" ON "forum_posts" USING btree ("topicId","createdAt");