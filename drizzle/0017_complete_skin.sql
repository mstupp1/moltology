ALTER TABLE "equipment_catalog" ADD COLUMN "visualType" text DEFAULT 'carapace' NOT NULL;--> statement-breakpoint
UPDATE "equipment_catalog" SET "visualType" = CASE
	WHEN "category" = 'head' THEN 'helm'
	WHEN "category" = 'claws' THEN 'pincer'
	WHEN "category" = 'legs' THEN 'greaves'
	WHEN "category" = 'antennae' THEN 'antennae'
	ELSE 'carapace'
END;--> statement-breakpoint
ALTER TABLE "equipment_catalog" ADD COLUMN "affixes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "equipment_catalog" ADD COLUMN "uniquePower" jsonb;