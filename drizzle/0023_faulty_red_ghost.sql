ALTER TABLE "profiles" ADD COLUMN "handle" text;--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_handle_lower_uidx" ON "profiles" USING btree (lower("handle"));