---
name: neon-data-platform
description: >-
  Neon + Drizzle schema/migration workflow (dev branch → GitHub Actions on prod main),
  seeding rules (no ghost seed IDs), RLS, and TanStack Start authenticated write patterns
  (createServerFn, JWT, resolveWriteAuth). Use when editing schema.ts, drizzle migrations,
  db:seed / seed scripts, forum or HUD mutations, Neon branches, DATABASE_URL, RLS, or
  createServerFn write handlers.
---

# Neon Data Platform (Moltology)

Canonical workflow for Postgres schema, migrations, seeding, and authenticated HUD writes.
Do **not** re-document this in AGENTS.md — keep that file for diegesis/brand/stack pointers only.

## Branch map

| Neon branch | Role | Who connects |
| :--- | :--- | :--- |
| `main` | Production data | Prod `DATABASE_URL` (GitHub secret + live deploy) |
| `dev` | Local development | Local `.env` `DATABASE_URL` |

- Reset `dev` from prod: `neonctl branches reset dev --parent main`
- Isolated experiment: `neonctl branches create --name feature-name --parent main`

Never run `db:reset` or destructive seed wipes against production `main`.

## Schema → migrate → ship

### Dev (agent / local)

1. Edit [`src/db/schema.ts`](../../../src/db/schema.ts).
2. `npm run db:generate` → new SQL under `drizzle/`.
3. Apply on **dev**: `npm run db:migrate` (or `npm run db:setup` = migrate → rls → seed).
4. If RLS policies changed: `npm run db:rls`.
5. Verify with scoped tests (`npm run test:core` for schema/lib; targeted `*.test.ts` otherwise).
6. Commit **both** `schema.ts` and the new `drizzle/*.sql` (and `enable-rls.ts` if touched).

Prefer `db:migrate` over `db:push` for anything that should reach production. `db:push` is for emergency/dev-only experimentation — do not rely on it for the prod path.

### Prod (automatic)

[`.github/workflows/migrate.yml`](../../../.github/workflows/migrate.yml) runs on push to `main` when these paths change:

- `drizzle/**`
- `src/db/schema.ts`
- `src/db/enable-rls.ts`
- `.github/workflows/migrate.yml`

Steps: `npm run db:migrate` then `npm run db:rls` with `secrets.DATABASE_URL` (prod `main`).

Also triggerable via `workflow_dispatch`. **Agents do not manually migrate prod** unless the user explicitly asks and confirms the target is production.

### Checklist (copy when doing schema work)

```
- [ ] schema.ts edited
- [ ] db:generate produced SQL
- [ ] migrate (+ rls if needed) on local DEV
- [ ] tests / typecheck for touched surface
- [ ] schema + drizzle SQL committed together
- [ ] merge/push to main → rely on migrate.yml for prod
```

## Commands

| Command | Purpose |
| :--- | :--- |
| `npm run db:generate` | Diff `schema.ts` → new `drizzle/*.sql` |
| `npm run db:migrate` | Apply pending SQL to `DATABASE_URL` |
| `npm run db:rls` | Enforce policies (`src/db/enable-rls.ts`) |
| `npm run db:seed` | Full seed (`src/db/seed.ts`) — **dev only** |
| `npm run db:setup` | migrate → rls → seed |
| `npm run db:reset` | Drop + setup — **dev only** |

## Seeding

### Rules

1. **Seed data must exist in the target DB before UI IDs are writable.** Never return fixed seed UUIDs from loaders/handlers when the DB is empty — that causes FK failures on reply/vote/create (forum incident). Empty DB → `[]` / `null`, same pattern as changelogs.
2. **`db:seed` is for the `dev` branch.** Prefer `userId: null` on seed rows that would otherwise FK to mock profiles that may not exist on prod.
3. **Prod content seeding** is deliberate and separate: one-shot scripts (e.g. [`scripts/seed-forum-only.ts`](../../../scripts/seed-forum-only.ts)), Neon MCP SQL with user approval, or content ingest (`scripts/ingest.ts` — defaults to prod unless `--dev`). Ask before writing production.
4. Keep seed sources (`src/lib/*-seed-data.ts`, `INITIAL_*`) aligned with what `db:seed` inserts so local and empty-env bootstraps match.

### When adding a new seeded domain

1. Define fixed IDs/slugs in a seed-data module.
2. Insert via `src/db/seed.ts` with `onConflictDoNothing`.
3. Optionally add a focused `scripts/seed-<domain>-only.ts` for empty prod/feature DBs.
4. Handlers: query DB only — no inventing rows from seed constants on miss.

## Authenticated HUD writes (TanStack Start)

Reference surfaces: daily alignment, forum, blog comments. **Not** React Query `useMutation` / `invalidateQueries`.

### Server declaration

Statically visible chain only (compiler must see `.handler`):

```ts
createServerFn({ method: 'POST' })
  .middleware([...]) // publicMiddleware or authenticatedMiddleware from src/lib/server/functions.ts
  .validator(...)
  .handler(...)
```

Do **not** wrap `.handler()` behind a helper — see [`src/lib/server/functions.ts`](../../../src/lib/server/functions.ts).

### Auth

- Client session: `sessionRes?.data?.user || (sessionRes as any)?.user` (never `data.user` alone).
- Writes: `await getAuthJWTToken()` — real Neon JWT only; never opaque session cookies.
- Server: `resolveWriteAuth` ([`src/lib/server/write-auth.ts`](../../../src/lib/server/write-auth.ts)) + owner `getDb()`. Never trust bare `userId` without matching verified JWT `sub`.

### Client write loop

1. Optimistic local UI update.
2. Optional `useHudPersist().begin/end` for shell spinner.
3. `token = await getAuthJWTToken()`.
4. Call server fn with `{ token, userId?, ...payload }`.
5. Reconcile from returned payload; toast / inline error on failure.

### Mutations that reference rows

Before insert/vote/update that FKs to another table, verify the parent row exists (or catch FK and map to a clear user-facing error). Prefer existence checks so prod empty-DB fails loudly instead of opaque constraint errors.

## Related paths

| Path | Role |
| :--- | :--- |
| `src/db/schema.ts` | Drizzle schema source of truth |
| `drizzle/` | Versioned SQL migrations |
| `src/db/enable-rls.ts` | RLS policies |
| `src/db/seed.ts` | Dev full seed |
| `src/lib/server/api.ts` | Most createServerFn handlers |
| `src/lib/server/write-auth.ts` | Write auth resolution |
| `src/lib/jwt.ts` | `getAuthJWTToken` / JWKS verify |
| `.github/workflows/migrate.yml` | Prod migrate + RLS |
