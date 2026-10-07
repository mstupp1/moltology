-- There is one staff role now. Existing super admins keep staff access as admins.
UPDATE "profiles" SET "role" = 'admin' WHERE "role" = 'super_admin';
