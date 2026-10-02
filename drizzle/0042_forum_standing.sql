ALTER TABLE "forum_posts" ADD COLUMN "qualityScore" integer;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD COLUMN "sunk" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD COLUMN "reviewedAt" timestamp;--> statement-breakpoint
ALTER TABLE "forum_topics" ADD COLUMN "reviewedAt" timestamp;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "standingAdjustment" integer DEFAULT 0 NOT NULL;