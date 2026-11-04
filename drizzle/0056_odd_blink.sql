CREATE TABLE "member_referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrerId" text NOT NULL,
	"referredUserId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"qualifiedAt" timestamp,
	CONSTRAINT "member_referrals_referredUserId_unique" UNIQUE("referredUserId")
);
--> statement-breakpoint
ALTER TABLE "member_referrals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "referral_rewards" (
	"referralId" uuid PRIMARY KEY NOT NULL,
	"referrerId" text NOT NULL,
	"month" text NOT NULL,
	"slot" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "referral_rewards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "member_referrals" ADD CONSTRAINT "member_referrals_referrerId_profiles_id_fk" FOREIGN KEY ("referrerId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_referrals" ADD CONSTRAINT "member_referrals_referredUserId_profiles_id_fk" FOREIGN KEY ("referredUserId") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referralId_member_referrals_id_fk" FOREIGN KEY ("referralId") REFERENCES "public"."member_referrals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referrerId_profiles_id_fk" FOREIGN KEY ("referrerId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "member_referrals_referrer_idx" ON "member_referrals" USING btree ("referrerId");--> statement-breakpoint
CREATE UNIQUE INDEX "referral_rewards_month_slot_uidx" ON "referral_rewards" USING btree ("referrerId","month","slot");--> statement-breakpoint
CREATE POLICY "member_referrals_server_only" ON "member_referrals" AS PERMISSIVE FOR ALL TO public USING (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL) WITH CHECK (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL);--> statement-breakpoint
CREATE POLICY "referral_rewards_server_only" ON "referral_rewards" AS PERMISSIVE FOR ALL TO public USING (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL) WITH CHECK (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL);