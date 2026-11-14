CREATE TABLE "oracle_skill_unlocks" (
	"userId" text NOT NULL,
	"skillId" text NOT NULL,
	"source" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "oracle_skill_unlocks_userId_skillId_pk" PRIMARY KEY("userId","skillId")
);
--> statement-breakpoint
ALTER TABLE "oracle_skill_unlocks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "oracleSkillSettings" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "oracle_skill_unlocks" ADD CONSTRAINT "oracle_skill_unlocks_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "oracle_skill_unlocks_server_only" ON "oracle_skill_unlocks" AS PERMISSIVE FOR ALL TO public USING (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL) WITH CHECK (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL);