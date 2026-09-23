CREATE TABLE "merch_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text,
	"customerEmail" text,
	"shippingAddress" jsonb,
	"stripeCheckoutSessionId" text,
	"printfulOrderId" text,
	"fulfillmentStatus" text DEFAULT 'pending' NOT NULL,
	"subtotalCents" integer DEFAULT 0 NOT NULL,
	"shippingCents" integer DEFAULT 0 NOT NULL,
	"taxCents" integer DEFAULT 0 NOT NULL,
	"totalCents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"lineItems" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"fulfillmentError" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "merch_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "merch_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text NOT NULL,
	"featuredImageUrl" text,
	"galleryImageUrls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"basePriceCents" integer NOT NULL,
	"isPublished" boolean DEFAULT false NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "merch_products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "merch_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"productId" uuid NOT NULL,
	"title" text NOT NULL,
	"size" text,
	"color" text,
	"colorHex" text,
	"priceCents" integer NOT NULL,
	"imageUrl" text,
	"printfulSyncVariantId" integer NOT NULL,
	"isAvailable" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "merch_variants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "merch_orders" ADD CONSTRAINT "merch_orders_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merch_variants" ADD CONSTRAINT "merch_variants_productId_merch_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."merch_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "merch_orders_user_idx" ON "merch_orders" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "merch_orders_stripe_session_uidx" ON "merch_orders" USING btree ("stripeCheckoutSessionId");--> statement-breakpoint
CREATE INDEX "merch_orders_printful_idx" ON "merch_orders" USING btree ("printfulOrderId");--> statement-breakpoint
CREATE UNIQUE INDEX "merch_products_slug_uidx" ON "merch_products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "merch_products_category_idx" ON "merch_products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "merch_products_published_sort_idx" ON "merch_products" USING btree ("isPublished","sortOrder");--> statement-breakpoint
CREATE INDEX "merch_variants_product_idx" ON "merch_variants" USING btree ("productId");--> statement-breakpoint
CREATE UNIQUE INDEX "merch_variants_printful_sync_uidx" ON "merch_variants" USING btree ("printfulSyncVariantId");--> statement-breakpoint
CREATE POLICY "merch_orders_server_only_policy" ON "merch_orders" AS PERMISSIVE FOR ALL TO public USING (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL) WITH CHECK (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL);--> statement-breakpoint
CREATE POLICY "merch_products_server_only_policy" ON "merch_products" AS PERMISSIVE FOR ALL TO public USING (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL) WITH CHECK (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL);--> statement-breakpoint
CREATE POLICY "merch_variants_server_only_policy" ON "merch_variants" AS PERMISSIVE FOR ALL TO public USING (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL) WITH CHECK (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL);