CREATE TABLE "gem_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"amount" integer NOT NULL,
	"source" text NOT NULL,
	"sourceKey" text NOT NULL,
	"description" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gem_transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "moltCredits" SET DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "chitinGems" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "gem_transactions" ADD CONSTRAINT "gem_transactions_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "gem_transactions_user_source_key_unique" ON "gem_transactions" USING btree ("userId","sourceKey");--> statement-breakpoint
CREATE INDEX "gem_transactions_user_created_idx" ON "gem_transactions" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE POLICY "gem_transactions_server_only" ON "gem_transactions" AS PERMISSIVE FOR ALL TO public USING (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL) WITH CHECK (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL);--> statement-breakpoint
-- Old balances were placeholders that nothing earned. Start everyone from the welcome grant.
INSERT INTO "gem_transactions" ("userId", "amount", "source", "sourceKey", "description")
SELECT "id", 100, 'welcome', 'welcome', 'Welcome to the market' FROM "profiles"
ON CONFLICT DO NOTHING;--> statement-breakpoint
UPDATE "profiles" SET "moltCredits" = 0, "chitinGems" = COALESCE(
  (SELECT SUM("amount") FROM "gem_transactions" g WHERE g."userId" = "profiles"."id"), 0);
