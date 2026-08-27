---
name: neon-data-platform
description: >-
  Neon + Drizzle schema/migration workflow (dev branch → GitHub Actions on prod main),
  seeding rules (no ghost seed IDs), RLS, TanStack Start authenticated write patterns
  (createServerFn, JWT, resolveWriteAuth), and HUD UI conventions (chitin-card page chrome,
  route-level HudWorkspaceGhost only). Use when editing schema.ts, drizzle
  migrations, db:seed / seed scripts, forum or HUD mutations, Neon branches, DATABASE_URL,
  RLS, createServerFn write handlers, or building authenticated HUD pages/widgets that
  load Neon data.
---

# Neon Data Platform (Moltology)

Canonical workflow for Postgres schema, migrations, seeding, authenticated HUD writes,
and HUD surfaces that present that data.
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

1. **Optimistic local UI update**: Compute next state immediately using a synchronous state ref (`stateRef`) or functional updater.
2. **Optional `useHudPersist().begin/end`**: Activate the ambient shell persist indicator while operations are in-flight.
3. **JWT Retrieval**: `token = await getAuthJWTToken()`.
4. **Server Call**: Call server fn with `{ token, userId?, ...payload }`.
5. **Reconciliation**: Merge returned payload against any active pending overrides; toast / inline error on failure.

### Concurrency, race conditions & optimistic reconciliation

When building interactive toggles, multi-item check-ins, or rapidly clickable actions (e.g. daily alignment liturgies, voting, status updates):

1. **Synchronous State Reference (`stateRef`)**:
   - React state setters are asynchronous and render closures can be stale during rapid clicks within the same frame.
   - Always maintain a mutable ref (`stateRef.current = state`) so subsequent clicks calculate their target delta from the live state without dropping actions.
2. **Pending Overrides Map (`pendingOverridesRef`)**:
   - Maintain a `Map<string, TargetState>` tracking all in-flight mutations.
   - When a server response returns from an earlier mutation, **never blindly overwrite the full local state** with `response.data`.
   - Reconcile server data with active pending overrides:
     ```ts
     const merged = response.items.map((item) =>
       pendingOverridesRef.current.has(item.id)
         ? { ...item, completed: pendingOverridesRef.current.get(item.id)! }
         : item
     )
     ```
   - Only remove a key from `pendingOverridesRef` when its network call completes AND the user has not queued a newer state for that same key during the request.
3. **Serial Mutation Queue Worker (`queueRef` + `isProcessingRef`)**:
   - For items that can be toggled rapidly (e.g. ON -> OFF -> ON), serialize network writes sequentially through an async queue loop.
   - This prevents HTTP response out-of-order race conditions from corrupting the database or flickering the UI.
4. **Immediate Derived Metrics & Charts**:
   - If an action affects aggregate metrics (e.g. completion percentage, streak counts, heatmaps), update those local arrays synchronously alongside the item toggle so secondary UI widgets do not lag behind.
5. **Balanced `useHudPersist` Lifecycle**:
   - When queueing/batching mutations, call `persist.begin('surface-id')` when the queue runner starts and `persist.end('surface-id')` in the queue's `finally` block once all queued items settle.

### Mutations that reference rows

Before insert/vote/update that FKs to another table, verify the parent row exists (or catch FK and map to a clear user-facing error). Prefer existence checks so prod empty-DB fails loudly instead of opaque constraint errors.

## HUD UI when shipping Neon-backed pages

When building or redoing authenticated HUD routes/widgets that load Neon data, match existing HUD chrome — do not invent a narrower one-off layout.

### Page shell (copy from dashboard / forum / pipeline / chassis)

- Full-width page body: `space-y-3.5 sm:space-y-5 font-sans relative` (no `max-w-* mx-auto` unless the page already uses a deliberate content column).
- Top banner: gradient + `border-l-4` accent + `border border-[#3a4a49]` + `chamfer-corner` + `shadow-2xl` (see forum index / pipeline / chassis).
- Content panels: `chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl` (and `chitin-card-inset` for nested cells).
- Section titles: `font-grotesk text-sm font-bold … tracking-wider uppercase` with a short `text-xs text-[#839493]` subtitle when helpful.
- Guest-locked features: wrap in `GuestLockGuard`; route `pendingComponent: HudWorkspaceGhost`.

Reference pages: [`src/routes/_hud/dashboard.tsx`](../../../src/routes/_hud/dashboard.tsx), [`src/routes/_hud/forum/index.tsx`](../../../src/routes/_hud/forum/index.tsx), [`src/routes/_hud/pipeline.tsx`](../../../src/routes/_hud/pipeline.tsx), [`src/components/hud/chassis/ChassisStatusPage.tsx`](../../../src/components/hud/chassis/ChassisStatusPage.tsx).

### Ghost loaders (HUD standard)

Use **`HudWorkspaceGhost` only** for route-level pending — set `pendingComponent: HudWorkspaceGhost` on `_hud` file routes. Do **not** add per-page `*Ghost` composites or wrap Neon fetches in `HudGhostWidget` unless you are building a **dashboard widget** that embeds inside another page (e.g. `DailyRoutineGhost` on the home dashboard).

| Situation | Pattern |
| :--- | :--- |
| Route transition / code-split pending | `pendingComponent: HudWorkspaceGhost` on the file route |
| Authenticated page data (Neon fetch) | TanStack `loader` when public/cached, **or** a small session cache + silent background refetch — never re-show ghosts on remount |
| In-flight writes | `useHudPersist().begin/end` (shell spinner), not page ghosts |
| Embedded dashboard widget | `HudGhostWidget` + an existing widget ghost only when the widget has no loader cache |

```tsx
// Route — generic ghost during navigation only
export const Route = createFileRoute('/_hud/example')({
  component: ExamplePage,
  pendingComponent: HudWorkspaceGhost,
})
```

For auth-gated pages without a loader, cache the last successful payload in `src/lib/*` (see `getCachedChassisLoadout` / `setCachedChassisLoadout` in [`chassis-loadout.ts`](../../../src/lib/chassis-loadout.ts)) so returning to the route renders instantly and refreshes quietly.

Do **not** show plain “Loading…” copy for Neon-backed HUD surfaces.

Primitives: [`HudGhostLoader.tsx`](../../../src/components/ui/HudGhostLoader.tsx). Generic route composite: [`HudWorkspaceGhost`](../../../src/components/hud/HudGhostSkeletons.tsx) in [`HudGhostSkeletons.tsx`](../../../src/components/hud/HudGhostSkeletons.tsx).

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
| `src/components/ui/HudGhostLoader.tsx` | Ghost loader primitives + `HudGhostWidget` |
| `src/components/hud/HudGhostSkeletons.tsx` | Page/widget ghost composites |
