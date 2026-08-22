ALTER TABLE "changelogs" ALTER COLUMN "category" SET DEFAULT 'Feature';--> statement-breakpoint
ALTER TABLE "changelogs" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;