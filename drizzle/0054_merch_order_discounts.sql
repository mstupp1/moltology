ALTER TABLE "merch_orders" ADD COLUMN "discountCents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "merch_orders" ADD COLUMN "promotionCode" text;--> statement-breakpoint
ALTER TABLE "merch_orders" ADD COLUMN "promotionCodeId" text;--> statement-breakpoint
CREATE INDEX "merch_orders_promotion_idx" ON "merch_orders" USING btree ("promotionCodeId");