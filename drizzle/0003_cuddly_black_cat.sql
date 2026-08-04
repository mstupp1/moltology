CREATE TABLE "forum_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text DEFAULT 'MessageSquare' NOT NULL,
	"color" text DEFAULT '#00ffff' NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "forum_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "forum_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "forum_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topicId" uuid NOT NULL,
	"userId" text,
	"authorName" text DEFAULT 'Ascendant Initiate' NOT NULL,
	"authorAvatar" text DEFAULT '/images/stage1_larva.png' NOT NULL,
	"authorStage" integer DEFAULT 1 NOT NULL,
	"content" text NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "forum_posts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "forum_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"categoryId" uuid NOT NULL,
	"userId" text,
	"authorName" text DEFAULT 'Ascendant Initiate' NOT NULL,
	"authorAvatar" text DEFAULT '/images/stage1_larva.png' NOT NULL,
	"authorStage" integer DEFAULT 1 NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"isPinned" boolean DEFAULT false NOT NULL,
	"isLocked" boolean DEFAULT false NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"repliesCount" integer DEFAULT 0 NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"lastReplyAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "forum_topics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "forum_topics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_topicId_forum_topics_id_fk" FOREIGN KEY ("topicId") REFERENCES "public"."forum_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_topics" ADD CONSTRAINT "forum_topics_categoryId_forum_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."forum_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_topics" ADD CONSTRAINT "forum_topics_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "forum_categories_public_read_policy" ON "forum_categories" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "forum_posts_public_read_policy" ON "forum_posts" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "forum_posts_insert_policy" ON "forum_posts" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "forum_topics_public_read_policy" ON "forum_topics" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "forum_topics_insert_policy" ON "forum_topics" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));