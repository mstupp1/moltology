ALTER TABLE "changelogs" ALTER COLUMN "category" SET DEFAULT 'Feature';--> statement-breakpoint
ALTER TABLE "changelogs" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;