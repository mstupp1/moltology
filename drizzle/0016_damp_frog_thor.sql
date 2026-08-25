DROP INDEX "user_gear_equipped_slot_uidx";--> statement-breakpoint
DROP INDEX "user_gear_vault_index_uidx";--> statement-breakpoint
CREATE UNIQUE INDEX "user_gear_equipped_slot_uidx" ON "user_gear_items" USING btree ("userId","equippedSlot") WHERE "equippedSlot" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "user_gear_vault_index_uidx" ON "user_gear_items" USING btree ("userId","vaultIndex") WHERE "vaultIndex" IS NOT NULL;