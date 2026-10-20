-- The seeded Academy catalog is placeholder coursework. Keep it as draft so members see the
-- empty Academy until real courses are published. Only the placeholder ids are touched.
UPDATE "academy_courses" SET "status" = 'draft', "updatedAt" = now() WHERE "id" IN (
  'a2000000-0000-4000-8000-000000000001',
  'a2000000-0000-4000-8000-000000000002',
  'a2000000-0000-4000-8000-000000000003',
  'a2000000-0000-4000-8000-000000000004'
);--> statement-breakpoint
UPDATE "academy_tracks" SET "status" = 'draft', "updatedAt" = now() WHERE "id" IN (
  'a1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000002'
);
