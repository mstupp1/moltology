CREATE TABLE "xp_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"amount" integer NOT NULL,
	"source" text NOT NULL,
	"sourceKey" text NOT NULL,
	"description" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "xp_transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "xp_transactions" ADD CONSTRAINT "xp_transactions_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "xp_transactions_user_source_key_unique" ON "xp_transactions" USING btree ("userId","sourceKey");--> statement-breakpoint
CREATE INDEX "xp_transactions_user_id_idx" ON "xp_transactions" USING btree ("userId");--> statement-breakpoint
CREATE POLICY "xp_transactions_isolation_policy" ON "xp_transactions" AS PERMISSIVE FOR ALL TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));