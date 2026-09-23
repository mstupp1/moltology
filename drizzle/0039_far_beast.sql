ALTER TABLE "profiles" ADD COLUMN "hasPurchasedPremium" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "isPremium" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "stripeCustomerId" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "stripeSubscriptionId" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "premiumStatus" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "premiumPeriodEnd" timestamp;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "premiumSyncedAt" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_stripe_customer_uidx" ON "profiles" USING btree ("stripeCustomerId");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_stripe_subscription_uidx" ON "profiles" USING btree ("stripeSubscriptionId");