CREATE TABLE "equipment_catalog" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"flavorText" text NOT NULL,
	"category" text NOT NULL,
	"rarity" text NOT NULL,
	"primaryStat" integer NOT NULL,
	"imageUrl" text,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "equipment_catalog_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "equipment_catalog" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_gear_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"catalogItemId" uuid NOT NULL,
	"equippedSlot" text,
	"vaultIndex" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_gear_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_gear_items" ADD CONSTRAINT "user_gear_items_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_gear_items" ADD CONSTRAINT "user_gear_items_catalogItemId_equipment_catalog_id_fk" FOREIGN KEY ("catalogItemId") REFERENCES "public"."equipment_catalog"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_gear_equipped_slot_uidx" ON "user_gear_items" USING btree ("userId","equippedSlot") WHERE "equippedSlot" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "user_gear_vault_index_uidx" ON "user_gear_items" USING btree ("userId","vaultIndex") WHERE "vaultIndex" IS NOT NULL;--> statement-breakpoint
CREATE POLICY "equipment_catalog_public_read_policy" ON "equipment_catalog" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "user_gear_items_isolation_policy" ON "user_gear_items" AS PERMISSIVE FOR ALL TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));
