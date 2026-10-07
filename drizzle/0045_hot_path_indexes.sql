CREATE INDEX "ai_messages_thread_created_idx" ON "ai_messages" USING btree ("threadId","createdAt");--> statement-breakpoint
CREATE INDEX "ai_threads_user_id_idx" ON "ai_threads" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "blog_comments_post_created_idx" ON "blog_comments" USING btree ("postId","createdAt");--> statement-breakpoint
CREATE INDEX "forum_topics_category_id_idx" ON "forum_topics" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "forum_topics_user_id_idx" ON "forum_topics" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "forum_topics_last_reply_at_idx" ON "forum_topics" USING btree ("lastReplyAt");--> statement-breakpoint
CREATE INDEX "forum_votes_topic_id_idx" ON "forum_votes" USING btree ("topicId");--> statement-breakpoint
CREATE INDEX "forum_votes_post_id_idx" ON "forum_votes" USING btree ("postId");