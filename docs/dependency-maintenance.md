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

Review Neon, dotenv, Lucide, and Three.js with matching types in independent
changes. Review Vite / React plugin / Vitest together for TanStack Start and Nitro
compatibility; review TypeScript separately. Tailwind needs browser-support and
HUD styling checks. Stripe needs an explicit API and webhook compatibility review.
Use current registry metadata and version-specific documentation at each stage,
rather than treating previously quoted latest versions as fixed targets.

## Stage 1 verification (2026-10-23)

Typecheck passed. Core tests passed (1,238); script tests passed (323), followed
by the expanded integration-target guard tests (10). The live auth integration
test passed against the CLI-verified `dev` branch (`br-mute-violet-ayw0bf9s`):
signup, signin, session retrieval and signout. The 15 merch integration tests
remain behind their separate opt-in. No full production build was verified.
