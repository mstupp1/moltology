# Dependency maintenance baseline

Stage 1 was rebased on main at `2ada726` (2026-10-23). That merge already
included Vite 7.3.7, follow-redirects 1.16.1, Better Auth 1.7.12,
the TanStack Start `~1.168.61` range, and Node 22 in CI. Keep those fixes.
Stripe remains locked at 22.4.0 with API version `2026-07-29.dahlia`.

## Test commands

`npm run test:core` and `npm run test:scripts` run without a live Neon database.
JWKS cleanup tests mock database access and decryption; they never prune real keys.
Billing configuration tests use sandbox fixtures separately from `.env.example`,
which keeps credentials and account-specific IDs blank.

`npm run test:integration` selects `src/**/*.integration.test.ts` explicitly.
Set `DEV_DATABASE_URL` to a verified Neon development branch before running it.
The auth test uses that URL instead of the ambient `DATABASE_URL`, and loads its
auth and database modules only after validating the target. It creates and removes
a test user. Missing, malformed or dummy targets fail, as do connection errors.
If `PROD_DATABASE_URL` is supplied, the test rejects a matching endpoint even
when credentials, pooling, database names or connection options differ. Production
Neon Auth HTTPS URLs are normalized to the underlying endpoint for comparison. This comparison cannot
prove branch identity when the production URL is absent: verify the dev branch
before supplying its URL. Ordinary test commands exclude integration tests. Existing merch integration suites
also retain their separate `RUN_MERCH_INTEGRATION=1` opt-in and dev-target checks.

## Remaining audit findings

`npm audit --json` on 2026-10-23 reports 11 affected package entries: 5 high and
6 moderate. These counts include parent packages affected by their dependencies;
they are not 11 independent vulnerabilities.

| Tooling dependency chain | Root advisory | Follow-up |
| --- | --- | --- |
| Tailwind → chokidar / fast-glob → micromatch → braces | [braces stack exhaustion](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | Review Tailwind 4 migration separately. |
| Tailwind → postcss-nested / postcss-selector-parser | [selector parsing CPU exhaustion](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) | Review Tailwind 4 migration separately. |
| Drizzle Kit → @esbuild-kit/esm-loader → @esbuild-kit/core-utils → esbuild | [esbuild development server access](https://github.com/advisories/GHSA-67mh-4wv8-2f99) | Await/review a compatible tooling upgrade. |

Vite and follow-redirects no longer appear in this audit. Remaining findings are
in development tooling; this is dependency-path classification, not a finding of
zero exposure. npm proposes Tailwind 4.3.3 and a Drizzle Kit downgrade to 0.18.1.
Do not apply the downgrade or use `npm audit fix --force`. Do not force incompatible
transitive versions just to clear the audit.

## Deferred migrations

Remaining work is grouped into a toolchain bundle (Vite, React plugin, Vitest,
and TypeScript), a Tailwind migration with compatible Drizzle tooling fixes if
available, and a separate Stripe API/webhook review. Tailwind needs browser-support
and HUD styling checks. Do not downgrade Drizzle Kit or force incompatible
transitive overrides. Use current registry metadata and version-specific docs at
each stage rather than treating earlier latest-version quotes as fixed targets.

## Stage 1 verification (2026-10-23)

Typecheck passed. Core tests passed (1,238); script tests passed (323), followed
by the expanded integration-target guard tests (10). The live auth integration
test passed against the CLI-verified `dev` branch (`br-mute-violet-ayw0bf9s`):
signup, signin, session retrieval and signout. The 15 merch integration tests
remain behind their separate opt-in. No full production build was verified.

## Stage 2: Neon driver 1.2.0 (2026-10-23)

Upgraded `@neondatabase/serverless` from 0.10.4 to 1.2.0. Its Node >=19
requirement is satisfied by the current Node 24 CI runtime. The installed
Drizzle ORM 0.45.4 supports this driver version and already uses its `.query()`
API. No Drizzle tooling, schema, RLS or Stripe changes are included.

[Neon's v1 migration notes](https://github.com/neondatabase/serverless/blob/main/CHANGELOG.md#100-2025-03-25)
remove conventional `sql(text, values)` calls. Converted 11 such calls across
the legacy blog migration, social archive dependency scan and dev retention
verifier to `.query(text, values)`. Preserved SQL text, identifier escaping and
parameter binding; existing tagged templates and serializable transactions stay
as they were. A TypeScript AST inspection of driver clients found no remaining
conventional calls in tracked source.

Verification: typecheck, 1,238 core tests and 327 script tests passed. The live
auth test passed against the verified Neon dev endpoint. The dev retention
verifier passed using an isolated fixture schema and removed that schema after
checking cleanup, history/timezones/streak carries, usage rollups, concurrent
chat caps/replay, archive cascades and migrated RLS. The 15 merch integration
tests remain behind their separate opt-in. No production migration or social
archive operation was executed, and no full production build was verified.

Stage 1 merged in PR #295. Review this Neon-only migration against `main`.

## Stage 3: bundled supporting dependencies (2026-10-23)

Combined the following upgrades after merging the Neon PR #296:

| Dependency | Before | After |
| --- | --- | --- |
| dotenv | 17.4.2 | 18.0.9 |
| lucide-react | 0.474.0 | 1.61.0 |
| three | 0.185.1 | 0.186.1 |
| @types/three | 0.185.4 | 0.186.0 |

The installed dotenv 18.0.9 package still exports `dotenv/config`; its side-effect
import defaults to quiet. Tests cover working-directory `.env` loading, shell
variable precedence, blank/quoted/multiline values and optional missing files.
No loading paths or override behavior are changed by this migration. See the
[dotenv release notes](https://github.com/motdotla/dotenv/blob/master/CHANGELOG.md#1800-2026-09-17).

Lucide no longer exports Instagram and Youtube. Both footers now use shared
`SocialIcons` components with the exact prior paths, Lucide rendering defaults
and the original ISC license notice. All 169 runtime Lucide exports used by tracked
source were checked against the installed package; none remain missing.

The book-cover component uses WebGLRenderer and does not use the APIs changed in
the [Three.js r185→r186 migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide#185--186).
Headless construction of its geometry, extrusion, material, light and scene APIs
passed. Actual WebGL rendering and visual output were not verified.

Typecheck, 1,238 core tests, 330 script tests and 13 focused tests (environment
loading and both footers) passed. The live Neon dev auth test passed on an isolated
rerun after exceeding the default five-second limit under parallel load. Its
per-test timeout is now 30 seconds; ordinary tests retain their existing timeout.
The other 15 integration tests remain separately opt-in. Audit remains at 11
Tailwind/Drizzle tooling findings (5 high, 6 moderate). No full production build
was verified.
