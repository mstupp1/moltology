ALTER TABLE "equipment_catalog" ADD COLUMN "kind" text DEFAULT 'gear' NOT NULL;--> statement-breakpoint
ALTER TABLE "equipment_catalog" ADD COLUMN "artKey" text;