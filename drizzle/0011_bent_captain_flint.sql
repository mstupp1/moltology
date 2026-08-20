ALTER TABLE "changelogs" ALTER COLUMN "version" SET DEFAULT 'v1.0.0';--> statement-breakpoint
ALTER TABLE "changelogs" ADD COLUMN IF NOT EXISTS "slug" text;--> statement-breakpoint
UPDATE "changelogs" SET "slug" = LOWER(REGEXP_REPLACE("version", '[^a-zA-Z0-9]+', '-', 'g')) WHERE "slug" IS NULL;--> statement-breakpoint
ALTER TABLE "changelogs" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "changelogs" ADD CONSTRAINT "changelogs_slug_unique" UNIQUE("slug");
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;