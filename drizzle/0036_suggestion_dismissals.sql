CREATE TABLE "suggestion_dismissals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"viewerId" text NOT NULL,
	"dismissedUserId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "suggestion_dismissals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "suggestion_dismissals" ADD CONSTRAINT "suggestion_dismissals_viewerId_profiles_id_fk" FOREIGN KEY ("viewerId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggestion_dismissals" ADD CONSTRAINT "suggestion_dismissals_dismissedUserId_profiles_id_fk" FOREIGN KEY ("dismissedUserId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "suggestion_dismissals_viewer_target_uidx" ON "suggestion_dismissals" USING btree ("viewerId","dismissedUserId");--> statement-breakpoint
CREATE POLICY "suggestion_dismissals_owner_select_policy" ON "suggestion_dismissals" AS PERMISSIVE FOR SELECT TO public USING ("viewerId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "suggestion_dismissals_owner_insert_policy" ON "suggestion_dismissals" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("viewerId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "suggestion_dismissals_owner_delete_policy" ON "suggestion_dismissals" AS PERMISSIVE FOR DELETE TO public USING ("viewerId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL));