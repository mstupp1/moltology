CREATE TABLE "store_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"target" text NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_audit" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "store_outbox" (
	"key" text PRIMARY KEY NOT NULL,
	"orderId" uuid,
	"to" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"availableAt" timestamp DEFAULT now() NOT NULL,
	"leaseUntil" timestamp,
	"sentAt" timestamp,
	"lastError" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_outbox" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "store_overrides" (
	"id" uuid PRIMARY KEY NOT NULL,
	"enabled" boolean NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_overrides" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "store_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot" jsonb NOT NULL,
	"bindingHash" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"orderId" uuid
);
--> statement-breakpoint
ALTER TABLE "store_quotes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "store_rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"expiresAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_rate_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "store_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "merch_orders" ADD COLUMN "paymentStatus" text DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "merch_orders" ADD COLUMN "livemode" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "merch_orders" ADD COLUMN "fulfillmentMode" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "merch_orders" ADD COLUMN "quoteSnapshot" jsonb;--> statement-breakpoint
ALTER TABLE "merch_orders" ADD COLUMN "statusTokenHash" text;--> statement-breakpoint
ALTER TABLE "merch_orders" ADD COLUMN "stripePaymentIntentId" text;--> statement-breakpoint
ALTER TABLE "merch_orders" ADD COLUMN "refundCents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "merch_orders" ADD COLUMN "providerStatus" text;--> statement-breakpoint
ALTER TABLE "merch_orders" ADD COLUMN "shipments" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "merch_orders" ADD COLUMN "reconciledAt" timestamp;--> statement-breakpoint
ALTER TABLE "store_outbox" ADD CONSTRAINT "store_outbox_orderId_merch_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."merch_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_outbox_ready" ON "store_outbox" USING btree ("sentAt","availableAt");--> statement-breakpoint
CREATE POLICY "store_audit_server_only" ON "store_audit" AS PERMISSIVE FOR ALL TO public USING (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL) WITH CHECK (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL);--> statement-breakpoint
CREATE POLICY "store_outbox_server_only" ON "store_outbox" AS PERMISSIVE FOR ALL TO public USING (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL) WITH CHECK (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL);--> statement-breakpoint
CREATE POLICY "store_overrides_server_only" ON "store_overrides" AS PERMISSIVE FOR ALL TO public USING (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL) WITH CHECK (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL);--> statement-breakpoint
CREATE POLICY "store_quotes_server_only" ON "store_quotes" AS PERMISSIVE FOR ALL TO public USING (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL) WITH CHECK (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL);--> statement-breakpoint
CREATE POLICY "store_rate_limits_server_only" ON "store_rate_limits" AS PERMISSIVE FOR ALL TO public USING (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL) WITH CHECK (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL);--> statement-breakpoint
CREATE POLICY "store_settings_server_only" ON "store_settings" AS PERMISSIVE FOR ALL TO public USING (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL) WITH CHECK (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL);