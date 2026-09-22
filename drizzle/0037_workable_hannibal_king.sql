CREATE TABLE "academy_certificate_awards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"certificateId" uuid NOT NULL,
	"credentialId" text NOT NULL,
	"issuedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "academy_certificate_awards_credentialId_unique" UNIQUE("credentialId")
);
--> statement-breakpoint
ALTER TABLE "academy_certificate_awards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "academy_certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"scope" text NOT NULL,
	"courseId" uuid,
	"trackId" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "academy_certificates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "academy_certificates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "academy_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"level" text NOT NULL,
	"coverImageUrl" text,
	"instructorName" text NOT NULL,
	"instructorTitle" text NOT NULL,
	"estimatedMinutes" integer DEFAULT 30 NOT NULL,
	"outcomes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"publishedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "academy_courses_slug_unique" UNIQUE("slug"),
	CONSTRAINT "academy_courses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "academy_courses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "academy_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"courseId" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"enrolledAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "academy_enrollments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "academy_lesson_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"lessonId" uuid NOT NULL,
	"courseId" uuid NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"progressPercent" integer DEFAULT 0 NOT NULL,
	"lastPositionSeconds" integer DEFAULT 0 NOT NULL,
	"quizScore" integer,
	"quizPassed" boolean DEFAULT false NOT NULL,
	"note" text,
	"completedAt" timestamp,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academy_lesson_progress" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "academy_lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"courseId" uuid NOT NULL,
	"moduleId" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"kind" text NOT NULL,
	"durationSeconds" integer DEFAULT 0 NOT NULL,
	"videoUrl" text,
	"videoProvider" text,
	"posterUrl" text,
	"body" text,
	"isPreview" boolean DEFAULT false NOT NULL,
	"passingScore" integer DEFAULT 80 NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academy_lessons" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "academy_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"courseId" uuid NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academy_modules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "academy_quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lessonId" uuid NOT NULL,
	"prompt" text NOT NULL,
	"choices" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"correctIndex" integer NOT NULL,
	"explanation" text DEFAULT '' NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academy_quiz_questions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "academy_track_courses" (
	"trackId" uuid NOT NULL,
	"courseId" uuid NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"required" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academy_track_courses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "academy_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text NOT NULL,
	"description" text NOT NULL,
	"level" text NOT NULL,
	"coverImageUrl" text,
	"estimatedHours" integer DEFAULT 1 NOT NULL,
	"outcomes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "academy_tracks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "academy_tracks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "academy_certificate_awards" ADD CONSTRAINT "academy_certificate_awards_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_certificate_awards" ADD CONSTRAINT "academy_certificate_awards_certificateId_academy_certificates_id_fk" FOREIGN KEY ("certificateId") REFERENCES "public"."academy_certificates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_certificates" ADD CONSTRAINT "academy_certificates_courseId_academy_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."academy_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_certificates" ADD CONSTRAINT "academy_certificates_trackId_academy_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."academy_tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_enrollments" ADD CONSTRAINT "academy_enrollments_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_enrollments" ADD CONSTRAINT "academy_enrollments_courseId_academy_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."academy_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_lesson_progress" ADD CONSTRAINT "academy_lesson_progress_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_lesson_progress" ADD CONSTRAINT "academy_lesson_progress_lessonId_academy_lessons_id_fk" FOREIGN KEY ("lessonId") REFERENCES "public"."academy_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_lesson_progress" ADD CONSTRAINT "academy_lesson_progress_courseId_academy_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."academy_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_lessons" ADD CONSTRAINT "academy_lessons_courseId_academy_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."academy_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_lessons" ADD CONSTRAINT "academy_lessons_moduleId_academy_modules_id_fk" FOREIGN KEY ("moduleId") REFERENCES "public"."academy_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_modules" ADD CONSTRAINT "academy_modules_courseId_academy_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."academy_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_quiz_questions" ADD CONSTRAINT "academy_quiz_questions_lessonId_academy_lessons_id_fk" FOREIGN KEY ("lessonId") REFERENCES "public"."academy_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_track_courses" ADD CONSTRAINT "academy_track_courses_trackId_academy_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."academy_tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_track_courses" ADD CONSTRAINT "academy_track_courses_courseId_academy_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."academy_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "academy_certificate_awards_user_cert_uidx" ON "academy_certificate_awards" USING btree ("userId","certificateId");--> statement-breakpoint
CREATE UNIQUE INDEX "academy_certificates_course_uidx" ON "academy_certificates" USING btree ("courseId");--> statement-breakpoint
CREATE UNIQUE INDEX "academy_certificates_track_uidx" ON "academy_certificates" USING btree ("trackId");--> statement-breakpoint
CREATE INDEX "academy_courses_status_sort_idx" ON "academy_courses" USING btree ("status","sortOrder");--> statement-breakpoint
CREATE INDEX "academy_courses_category_idx" ON "academy_courses" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "academy_enrollments_user_course_uidx" ON "academy_enrollments" USING btree ("userId","courseId");--> statement-breakpoint
CREATE INDEX "academy_enrollments_user_idx" ON "academy_enrollments" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "academy_lesson_progress_user_lesson_uidx" ON "academy_lesson_progress" USING btree ("userId","lessonId");--> statement-breakpoint
CREATE INDEX "academy_lesson_progress_user_course_idx" ON "academy_lesson_progress" USING btree ("userId","courseId");--> statement-breakpoint
CREATE UNIQUE INDEX "academy_lessons_course_slug_uidx" ON "academy_lessons" USING btree ("courseId","slug");--> statement-breakpoint
CREATE INDEX "academy_lessons_module_sort_idx" ON "academy_lessons" USING btree ("moduleId","sortOrder");--> statement-breakpoint
CREATE INDEX "academy_modules_course_sort_idx" ON "academy_modules" USING btree ("courseId","sortOrder");--> statement-breakpoint
CREATE INDEX "academy_quiz_questions_lesson_sort_idx" ON "academy_quiz_questions" USING btree ("lessonId","sortOrder");--> statement-breakpoint
CREATE UNIQUE INDEX "academy_track_courses_pk" ON "academy_track_courses" USING btree ("trackId","courseId");--> statement-breakpoint
CREATE INDEX "academy_track_courses_course_idx" ON "academy_track_courses" USING btree ("courseId");--> statement-breakpoint
CREATE INDEX "academy_tracks_status_sort_idx" ON "academy_tracks" USING btree ("status","sortOrder");--> statement-breakpoint
CREATE POLICY "academy_certificate_awards_owner_select_policy" ON "academy_certificate_awards" AS PERMISSIVE FOR SELECT TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "academy_certificate_awards_owner_insert_policy" ON "academy_certificate_awards" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "academy_certificates_public_read_policy" ON "academy_certificates" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "academy_courses_public_read_policy" ON "academy_courses" AS PERMISSIVE FOR SELECT TO public USING ("status" = 'published' OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "academy_enrollments_owner_select_policy" ON "academy_enrollments" AS PERMISSIVE FOR SELECT TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "academy_enrollments_owner_insert_policy" ON "academy_enrollments" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "academy_enrollments_owner_update_policy" ON "academy_enrollments" AS PERMISSIVE FOR UPDATE TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)) WITH CHECK ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "academy_lesson_progress_owner_select_policy" ON "academy_lesson_progress" AS PERMISSIVE FOR SELECT TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "academy_lesson_progress_owner_insert_policy" ON "academy_lesson_progress" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "academy_lesson_progress_owner_update_policy" ON "academy_lesson_progress" AS PERMISSIVE FOR UPDATE TO public USING ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)) WITH CHECK ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "academy_lessons_public_read_policy" ON "academy_lessons" AS PERMISSIVE FOR SELECT TO public USING (EXISTS (
      SELECT 1 FROM academy_courses c
      WHERE c.id = academy_lessons."courseId" AND c.status = 'published'
    ) OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "academy_modules_public_read_policy" ON "academy_modules" AS PERMISSIVE FOR SELECT TO public USING (EXISTS (
      SELECT 1 FROM academy_courses c
      WHERE c.id = academy_modules."courseId" AND c.status = 'published'
    ) OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "academy_quiz_questions_owner_read_policy" ON "academy_quiz_questions" AS PERMISSIVE FOR SELECT TO public USING ((current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "academy_track_courses_public_read_policy" ON "academy_track_courses" AS PERMISSIVE FOR SELECT TO public USING (EXISTS (
      SELECT 1 FROM academy_tracks t
      WHERE t.id = academy_track_courses."trackId" AND t.status = 'published'
    ) OR (current_setting('request.jwt.claims', true) IS NULL));--> statement-breakpoint
CREATE POLICY "academy_tracks_public_read_policy" ON "academy_tracks" AS PERMISSIVE FOR SELECT TO public USING ("status" = 'published' OR (current_setting('request.jwt.claims', true) IS NULL));