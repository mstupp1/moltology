ALTER TABLE "forum_topics" ADD COLUMN "qualityScore" integer;--> statement-breakpoint
ALTER TABLE "forum_topics" ADD COLUMN "discoveryEligible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "forum_topics" ADD COLUMN "suggestedCategory" text;