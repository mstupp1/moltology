---
id: access
title: Access & roles
order: 3
color: '#00c3ff'
summary: Three clearance roles. Server functions verify the caller's JWT, then check the role before any staff action.
rules:
  - id: access.roles
    title: Three roles
    kind: permission
    statement: Every profile has one role, user, admin, or super_admin, stored in profiles.role. Members are user by default.
    anchors:
      - file: src/lib/server/admin-oversight.ts
        symbol: ADMIN_MEMBER_ROLES
      - file: src/db/schema.ts
        symbol: profiles.role
  - id: access.super-admin-emails
    title: Super admin by email
    kind: permission
    statement: A fixed list of emails always resolves to super_admin, whatever the stored role says. The profile role is checked first, then the session role.
    dependsOn: [access.roles]
    anchors:
      - file: src/lib/permissions.ts
        symbol: SUPER_ADMIN_EMAILS
      - file: src/lib/permissions.ts
        symbol: getEffectiveRole
    tests: [src/lib/permissions.test.ts]
  - id: access.staff
    title: Staff means admin or super admin
    kind: permission
    statement: Staff is any member whose effective role is admin or super_admin. Every staff check in the app goes through isAdminOrSuperAdmin.
    dependsOn: [access.super-admin-emails]
    anchors:
      - file: src/lib/permissions.ts
        symbol: isAdminOrSuperAdmin
    tests: [src/lib/permissions.test.ts]
  - id: access.write-auth
    title: Writes need a verified JWT
    kind: gate
    statement: Mutating server functions resolve the caller from a JWKS-verified JWT sub. A bare userId from the client is never trusted, and a userId that does not match the token is rejected.
    anchors:
      - file: src/lib/server/write-auth.ts
        symbol: resolveWriteAuth
    tests: [src/lib/server/write-auth.test.ts]
  - id: access.app-level-auth
    title: App-level auth is the real gate
    kind: invariant
    statement: The server talks to Postgres with the owner DATABASE_URL, which bypasses row-level policies. RLS is defense in depth for JWT-scoped connections; each handler must check identity and ownership itself.
    dependsOn: [access.write-auth]
    flag:
      level: watch
      note: A handler that forgets an ownership check is not saved by RLS. Review new handlers for resolveWriteAuth plus an owner or staff check.
    anchors:
      - file: src/db/schema.ts
        symbol: profiles
  - id: access.hidden-pages
    title: Hidden pages
    kind: gate
    statement: Pages listed in HIDDEN_PAGES (Subterranean Vats and Premium) stay out of navigation and search for members and show a plain unavailable notice. Staff see them faded in the sidebar and can open them.
    dependsOn: [access.staff]
    anchors:
      - file: src/lib/hidden-pages.ts
        symbol: HIDDEN_PAGES
      - file: src/lib/hidden-pages.ts
        symbol: canViewHiddenPages
    tests: [src/lib/hidden-pages.test.ts]
  - id: access.admin-only-paths
    title: Admin-only paths
    kind: gate
    statement: /admin, /watch, and everything under them are removed entirely for non-staff. Unlike hidden pages, staff see them as normal entries.
    dependsOn: [access.staff]
    anchors:
      - file: src/lib/admin-access.ts
        symbol: ADMIN_ONLY_PATHS
      - file: src/lib/admin-access.ts
        symbol: isAdminOnlyPath
    tests: [src/lib/admin-access.test.ts]
  - id: access.staff-server-check
    title: Staff RPCs recheck the role
    kind: gate
    statement: Every admin server function calls requireStaff, which verifies the JWT and reads the role from the database before returning data. The UI guard is only for display.
    dependsOn: [access.staff, access.write-auth]
    anchors:
      - file: src/lib/server/admin-oversight.ts
        symbol: requireStaff
    tests: [src/lib/server/admin-oversight.test.ts]
  - id: access.role-changes
    title: Who can change clearance
    kind: permission
    statement: Only a super admin can change a member's role. Nobody can change their own role, and accounts on the super admin email list are locked.
    dependsOn: [access.staff-server-check]
    anchors:
      - file: src/lib/server/admin-oversight.ts
        symbol: setAdminMemberRoleHandler
    tests: [src/lib/server/admin-oversight.test.ts]
  - id: access.admin-list-limits
    title: Admin list caps
    kind: limit
    statement: Admin member search returns at most 25 rows and the purchase ledger at most 50.
    dependsOn: [access.staff-server-check]
    anchors:
      - file: src/lib/server/admin-oversight.ts
        symbol: ADMIN_MEMBER_LIMIT
      - file: src/lib/server/admin-oversight.ts
        symbol: ADMIN_PURCHASE_LIMIT
---

Access has two layers. The UI hides staff tools from everyone else, and each server function checks the role again, because the client can be skipped.
