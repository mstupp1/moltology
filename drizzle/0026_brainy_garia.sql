CREATE TABLE "member_bonds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fromUserId" text NOT NULL,
	"toUserId" text NOT NULL,
	"kind" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "member_bonds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "joinSource" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "referredByUserId" text;--> statement-breakpoint
ALTER TABLE "member_bonds" ADD CONSTRAINT "member_bonds_fromUserId_profiles_id_fk" FOREIGN KEY ("fromUserId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_bonds" ADD CONSTRAINT "member_bonds_toUserId_profiles_id_fk" FOREIGN KEY ("toUserId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "member_bonds_pair_kind_uidx" ON "member_bonds" USING btree ("fromUserId","toUserId","kind");--> statement-breakpoint
CREATE INDEX "member_bonds_to_user_idx" ON "member_bonds" USING btree ("toUserId");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_referredByUserId_profiles_id_fk" FOREIGN KEY ("referredByUserId") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profiles_referred_by_idx" ON "profiles" USING btree ("referredByUserId");--> statement-breakpoint
CREATE POLICY "member_bonds_party_select_policy" ON "member_bonds" AS PERMISSIVE FOR SELECT TO public USING ("fromUserId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR "toUserId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "member_bonds_party_insert_policy" ON "member_bonds" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("fromUserId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR "toUserId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "member_bonds_party_delete_policy" ON "member_bonds" AS PERMISSIVE FOR DELETE TO public USING ("fromUserId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR "toUserId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL));