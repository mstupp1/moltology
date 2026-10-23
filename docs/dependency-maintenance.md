# Dependency maintenance baseline

Stage 1 was rebased on main at `2ada726` (2026-10-23). That merge already
included Vite 7.3.7, follow-redirects 1.16.1, Better Auth 1.7.12,
the TanStack Start `~1.168.61` range, and Node 22 in CI. Keep those fixes.
Stripe was held at 22.4.0 with API version `2026-07-29.dahlia` at that baseline;
Stage 6 upgrades it to 23.0.1 and `2026-09-30.endive`.

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

## Stage 1 audit baseline

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

The planned dependency migrations are complete. Four moderate Drizzle
Kit tooling findings remain without a compatible stable upstream fix. Do not
downgrade Drizzle Kit or force incompatible transitive overrides. Use current
registry metadata and version-specific docs at each stage.

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

## Stage 4: toolchain bundle (2026-10-23)

After merged PR #297, upgraded Vite 7.3.7 → 8.3.5, its React plugin 5.2.0 → 6.1.2,
Vitest 4.1.12 → 5.0.5 and the project TypeScript compiler 5.9.3 → 7.0.2. The
existing Node 24 CI runtime satisfies these releases' requirements.

[Vite 8 migration](https://vite.dev/guide/migration) replaces the old Rollup build
options with Rolldown. The `auth-vendor` group retains its existing package
selection through `rolldownOptions.output.codeSplitting.groups`. Vite config uses
`import.meta.dirname` and an explicit `.ts` config-helper import. TypeScript's
removed `baseUrl` option is dropped; `@/*` still maps directly to `./src/*`.

TypeScript 7's root package no longer exposes the classic compiler AST API.
The Logic Atlas anchor resolver alone imports the exact-pinned
`typescript-parser` alias (`npm:typescript@6.0.3`); project typechecking uses
TypeScript 7. Its ten anchor tests pass. A future migration can remove the alias
once a suitable stable parser interface is available.

Vitest setup now imports `@testing-library/jest-dom/vitest` for the correct
matcher typing and runtime integration. Updated stale homepage/news tests to
match the already-shipped canvas hero, byline placement and accessible labels.
The reel compositor unit test mocks browser capture failure and verifies its
Canvas/FFmpeg fallback instead of starting a browser/build during a unit run.
These test corrections do not change page behavior or production media rendering.

Verification passed:

- Typecheck and the full ordinary suite: 352 files, 2,513 tests.
- Live Neon dev auth: signup, signin, session retrieval and signout; zero temporary
  users remained afterward. The 15 merch integration tests remain opt-in.
- Standard `npm run build` and `NITRO_PRESET=vercel npm run build`, including the
  post-build pruning step. Generated Vercel functions use Node 24; store recovery
  retains `maxDuration: 240`; static images are not duplicated in the server function.
- Asset budget, brand asset and UI-token hygiene checks.
- Audit: seven moderate findings, zero high or critical, through Drizzle Kit's
  legacy esbuild chain and Tailwind's PostCSS selector parser chain. This is down
  from the prior 11 findings; no forced audit fixes were applied.

Builds retain non-fatal third-party module-directive, external `/media/*` URL and
large-chunk warnings. No deployment or browser visual verification was performed.

## Stage 5: Tailwind 4 (2026-10-23)

Upgraded Tailwind 3.4.19 → 4.3.3 with the first-party `@tailwindcss/vite` plugin.
Removed the old PostCSS config and direct PostCSS/Autoprefixer dependencies.
`src/index.css` imports Tailwind, explicitly loads the existing JavaScript theme
and scans `src/`; project colors, typography, radii, shadows, animations and class
based dark mode remain in `tailwind.config.js`.

Use native Tailwind 4 defaults, as requested. No frozen v3 palette, default-value
snapshot or compatibility overrides are included. Small changes to standard
colors, shadows, blur, gradients and form defaults are accepted. Tailwind 4 uses
its [modern browser baseline](https://tailwindcss.com/docs/upgrade-guide#browser-requirements).
Mechanical component updates replace `outline-none` with `outline-hidden` for
forced-colors support and the removed `blur-0` with `blur-none` for the quiz image
loading transition. The token guide now reflects opacity modifiers applying to
RGBA tokens.

Verification passed:

- Full ordinary suite: 352 files, 2,513 tests; typecheck passed.
- Standard production build and Vercel-preset production build. The recovery
  function retains its Node 24 runtime and 240-second limit.
- Compiled CSS includes the custom HUD palette, fonts, focus styles, corners and
  shadows. Compared 3,074 baseline emitted class names: expected utilities are
  present after outline/blur renames (three unused v3 scanner artifacts excluded),
  with no unprocessed Tailwind directives.
- Asset budget, brand assets and UI-token checks.
- Audit: four moderate findings, zero high or critical, all in Drizzle Kit's
  legacy `@esbuild-kit/esm-loader` → `@esbuild-kit/core-utils` → esbuild chain.
  Latest stable Drizzle Kit 0.31.11 still depends on that loader; no downgrade or
  forced override was applied.

Compared homepage screenshots from production builds of the pre-migration commit
and this branch at matching desktop (1760×1100) and mobile (540×1170) viewports,
with the same assets and reduced motion. Mobile appears virtually unchanged;
desktop has small text/CTA spacing differences, with the overall design intact.
Dashboard preview widgets remained in loading states in both versions, so those
captures are not treated as visual verification. No deployment was performed.
The legacy default styling is deliberately not reproduced pixel for pixel.

## Stage 6: Stripe 23 (2026-10-23)

Upgraded Stripe 22.4.0 → 23.0.1 and outgoing API requests from
`2026-07-29.dahlia` to `2026-09-30.endive`, matching the SDK's generated types.
The SDK is pinned exactly so dependency resolution cannot silently change the
typed API contract. `src/lib/stripe-config.ts` centralizes the explicit version
for Premium, store checkout, merch recovery, webhook verification and the merch
doctor. Existing timeouts and retry limits are retained. No type suppression or
historical-version cast is used.

Reviewed the [Stripe 23 changelog](https://github.com/stripe/stripe-node/blob/v23.0.1/CHANGELOG.md).
Node >=20 is satisfied by the project's Node 24 runtime. The removed V2 list
fields, top-level unverified-event helper, error-type export, address types and
Checkout `payment_method_types` request field are not used here. Existing invoice
parent/subscription metadata, subscription-item period ends, collected shipping,
discount totals and refund handlers remain compatible with the consumed fields.
Checkout still uses account payment-method settings; physical goods continue to
explicitly disable Managed Payments. No account defaults or hosted webhook
endpoint versions were changed. Endpoint payload versions are independent of
the outgoing request version; signed Dahlia and Endive fixtures both verify.

Verification passed:

- Typecheck; 153 core test files / 1,241 tests; 44 script test files / 330 tests.
- Real SDK HTTP serialization tests cover the explicit API header and Premium
  metadata, merch amounts, shipping and Managed Payments parameters. Webhook tests
  cover both API versions and reject stale, tampered and incorrectly signed data.
- Stripe sandbox API: created an isolated recurring price, created/retrieved
  Premium checkout, and created physical-goods checkout with a verified total and
  shipping. Expired both unpaid sessions and confirmed fixture products/prices
  inactive. The inline fixtures rejected archive updates; follow-up reads confirmed
  they were already inactive after session expiration.
- Audit remains four moderate Drizzle-tooling findings, zero high or critical.

The local configured Premium price ID is absent under the available test key, so
sandbox verification used isolated fixtures instead of changing `.env`. That
sandbox account requires an eligible product tax code for its default Managed
Payments setting; the temporary digital fixture used documented SaaS tax code
`txcd_10103000`. No real product tax classification was changed. There is no local
webhook secret or hosted webhook endpoint in this sandbox, so hosted delivery and
end-to-end membership synchronization were not verified. No checkout was completed,
payment collected, application database written, Printful fulfillment triggered,
production configuration changed, or deployment performed. No full suite or build
was run for this scoped SDK/API change (Tier 2 verification).
