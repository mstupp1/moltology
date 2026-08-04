CREATE TABLE "user_avatars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"name" text DEFAULT 'Carcinized Unit' NOT NULL,
	"stage" integer DEFAULT 1 NOT NULL,
	"carcinizationLevel" integer DEFAULT 50 NOT NULL,
	"cyberneticsLevel" integer DEFAULT 50 NOT NULL,
	"cosmetics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"imageUrl" text NOT NULL,
	"isActive" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_avatars" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "activeAvatarId" text;--> statement-breakpoint
ALTER TABLE "user_avatars" ADD CONSTRAINT "user_avatars_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "user_avatars_isolation_policy" ON "user_avatars" AS PERMISSIVE FOR ALL TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));