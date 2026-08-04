CREATE TABLE "podcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text NOT NULL,
	"audioUrl" text NOT NULL,
	"s3Key" text,
	"durationSeconds" integer NOT NULL,
	"fileSizeBytes" integer,
	"authorName" text DEFAULT 'High Ascendant Carcinus' NOT NULL,
	"authorAvatar" text DEFAULT '/images/order_emblem.png' NOT NULL,
	"authorRole" text DEFAULT 'Stage 4 Ascendant' NOT NULL,
	"category" text DEFAULT 'TRANSMISSION' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"playCount" integer DEFAULT 0 NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"isPublished" boolean DEFAULT true NOT NULL,
	"transcript" text,
	"publishedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "podcasts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "podcasts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "podcasts_public_read_policy" ON "podcasts" AS PERMISSIVE FOR SELECT TO public USING ("isPublished" = true);