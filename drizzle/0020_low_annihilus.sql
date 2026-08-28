CREATE TABLE "friend_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"senderId" text NOT NULL,
	"recipientId" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"respondedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "friend_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userAId" text NOT NULL,
	"userBId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "friendships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"kind" text NOT NULL,
	"actorUserId" text,
	"title" text NOT NULL,
	"detail" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"readAt" timestamp,
	"sourceKey" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_senderId_profiles_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_recipientId_profiles_id_fk" FOREIGN KEY ("recipientId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_userAId_profiles_id_fk" FOREIGN KEY ("userAId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_userBId_profiles_id_fk" FOREIGN KEY ("userBId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actorUserId_profiles_id_fk" FOREIGN KEY ("actorUserId") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "friend_requests_pending_pair_uidx" ON "friend_requests" USING btree ("senderId","recipientId") WHERE status = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "friendships_pair_uidx" ON "friendships" USING btree ("userAId","userBId");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_user_source_unique" ON "notifications" USING btree ("userId","sourceKey");--> statement-breakpoint
CREATE POLICY "friend_requests_party_select_policy" ON "friend_requests" AS PERMISSIVE FOR SELECT TO public USING ("senderId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR "recipientId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "friend_requests_sender_insert_policy" ON "friend_requests" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("senderId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "friend_requests_party_update_policy" ON "friend_requests" AS PERMISSIVE FOR UPDATE TO public USING ("senderId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR "recipientId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)) WITH CHECK ("senderId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR "recipientId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "friendships_party_select_policy" ON "friendships" AS PERMISSIVE FOR SELECT TO public USING ("userAId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR "userBId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "friendships_party_insert_policy" ON "friendships" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("userAId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR "userBId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "friendships_party_delete_policy" ON "friendships" AS PERMISSIVE FOR DELETE TO public USING ("userAId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR "userBId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "notifications_owner_select_policy" ON "notifications" AS PERMISSIVE FOR SELECT TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "notifications_owner_update_policy" ON "notifications" AS PERMISSIVE FOR UPDATE TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)) WITH CHECK ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "notifications_insert_policy" ON "notifications" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);