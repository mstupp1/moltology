CREATE SCHEMA IF NOT EXISTS "neon_auth";
--> statement-breakpoint
CREATE TABLE "ai_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"threadId" uuid NOT NULL,
	"userId" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"parts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ai_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"title" text DEFAULT 'Ascendance Consultation' NOT NULL,
	"persona" text DEFAULT 'oracle' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_threads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"assetType" text NOT NULL,
	"description" text NOT NULL,
	"estimatedValueUsd" numeric(12, 2) NOT NULL,
	"moltCreditsReceived" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'TRANSMUTED' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "blog_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postId" uuid NOT NULL,
	"userId" text,
	"authorName" text DEFAULT 'Ascendant Initiate' NOT NULL,
	"authorAvatar" text DEFAULT '/images/stage1_larva.png' NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blog_comments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"coverImageUrl" text,
	"authorId" text,
	"authorName" text DEFAULT 'High Ascendant Carcinus' NOT NULL,
	"authorAvatar" text DEFAULT '/images/order_emblem.png' NOT NULL,
	"authorRole" text DEFAULT 'Stage 4 Ascendant' NOT NULL,
	"category" text DEFAULT 'SACRED DOCTRINE' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"readTimeMinutes" integer DEFAULT 5 NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"isPublished" boolean DEFAULT true NOT NULL,
	"publishedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "blog_posts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "changelogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"isPublished" boolean DEFAULT true NOT NULL,
	"releasedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "changelogs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "daily_routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"timeSlot" text NOT NULL,
	"description" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"date" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_routines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "gallery_pins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"prompt" text,
	"s3Key" text NOT NULL,
	"imageUrl" text NOT NULL,
	"aspectRatio" text DEFAULT '3:4' NOT NULL,
	"category" text DEFAULT 'SACRED DOCTRINE' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"authorName" text DEFAULT 'High Ascendant Carcinus' NOT NULL,
	"authorAvatar" text DEFAULT '/images/order_emblem.png' NOT NULL,
	"authorStage" text DEFAULT 'Stage 4 Ascendant' NOT NULL,
	"pinCount" integer DEFAULT 42 NOT NULL,
	"views" integer DEFAULT 128 NOT NULL,
	"likes" integer DEFAULT 19 NOT NULL,
	"isPreloaded" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gallery_pins_s3Key_unique" UNIQUE("s3Key")
);
--> statement-breakpoint
ALTER TABLE "gallery_pins" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "neon_auth"."user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image" text,
	"emailVerified" boolean
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"larvaId" text DEFAULT 'LARVA UNIT #8971' NOT NULL,
	"stage" integer DEFAULT 1 NOT NULL,
	"moltCredits" numeric(12, 2) DEFAULT '1450.00' NOT NULL,
	"chitinGems" integer DEFAULT 250 NOT NULL,
	"synapseShards" integer DEFAULT 45 NOT NULL,
	"depthPressureCoins" integer DEFAULT 12 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"pincerTorque" integer DEFAULT 78 NOT NULL,
	"shellHardness" integer DEFAULT 64 NOT NULL,
	"processingPower" integer DEFAULT 92 NOT NULL,
	"durability" integer DEFAULT 85 NOT NULL,
	"clawStrength" integer DEFAULT 70 NOT NULL,
	"socialDetachmentIndex" integer DEFAULT 94 NOT NULL,
	"submergenceDepthRating" integer DEFAULT 3400 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_stats" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_threadId_ai_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."ai_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_threads" ADD CONSTRAINT "ai_threads_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_postId_blog_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_authorId_profiles_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_routines" ADD CONSTRAINT "daily_routines_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_pins" ADD CONSTRAINT "gallery_pins_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "ai_messages_isolation_policy" ON "ai_messages" AS PERMISSIVE FOR ALL TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "ai_threads_isolation_policy" ON "ai_threads" AS PERMISSIVE FOR ALL TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "assets_isolation_policy" ON "assets" AS PERMISSIVE FOR ALL TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "blog_comments_public_read_policy" ON "blog_comments" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "blog_comments_insert_policy" ON "blog_comments" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "blog_posts_public_read_policy" ON "blog_posts" AS PERMISSIVE FOR SELECT TO public USING ("isPublished" = true);--> statement-breakpoint
CREATE POLICY "changelogs_public_read_policy" ON "changelogs" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "daily_routines_isolation_policy" ON "daily_routines" AS PERMISSIVE FOR ALL TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "gallery_pins_public_read_policy" ON "gallery_pins" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "profiles_isolation_policy" ON "profiles" AS PERMISSIVE FOR ALL TO public USING (id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "user_stats_isolation_policy" ON "user_stats" AS PERMISSIVE FOR ALL TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));