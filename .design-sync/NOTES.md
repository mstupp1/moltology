# design-sync notes (Moltology HUD)

## How this repo is synced
- The DS is not a published package. `node .design-sync/build-ds.mjs` (cfg.buildCmd) packages `src/components/ui/index.ts` into a mini package at `.design-sync/.cache/pkg` (`@moltology/hud`): esbuild ESM bundle, tsc declarations, compiled Tailwind CSS, and copies of `public/fonts`. Run it before the converter, with `--entry .design-sync/.cache/pkg/dist/index.js --node-modules ./node_modules`.
- The barrel is filtered: `GuestLockGuard` is dropped (it pulls in the auth session and AuthModal, which need a live backend), and `ToastProvider`/`useToast`/`useOptionalToast` are added.
- Tailwind is JIT. The DS CSS is compiled from the repo config, with content limited to `src/components/ui/**` and `.design-sync/previews/**`, plus a safelist of brand, layout, and type utilities that the conventions header promises the design agent. **If you change the safelist, re-validate `conventions.md` against `_ds_bundle.css`.** A new arbitrary class in a preview only exists after `build-ds.mjs` re-runs.
- Root-relative `/images/...` paths (HeaderBrand, HUDPageLoader, HeroBackground, the local branch of `getAssetUrl`) are rewritten to the public Neon S3 bucket at bundle time, because designs have no `/images` origin. Every one returned 200 on S3 at sync time.
- Grouping uses the category stubs in `.design-sync/groups/*.md` via `docsMap`. The stubs are frontmatter-only, so the generated prompt.md (props and preview examples) is kept.
- `dtsPropsFor` adds the DOM and Radix props that the extractor filters out (onClick, disabled, value, onChange, onValueChange, onSelect, open, and so on). If a component's own props change, update the matching entry: it replaces the extracted body.

## Preview conventions
- The card harness forces a white body, but the HUD only works on the dark backdrop. Every preview wraps its content in a local `Deep` div with `bg-[#030708]`.
- Overlays (bottom sheet, lightbox, dropdown, toasts, page loader) use `cardMode: single` with a viewport. Toasts use `duration: 0` so they stay on screen.
- RollingNumber previews use `duration={1}`. Longer durations get captured mid-animation, which makes the grade non-deterministic.
- `Slider` renders a single thumb, so don't author range (two-value) stories. The `disabled` state doesn't visually dim (that's the component's real behavior).

## Known render warns
- `[FONT_MISSING] "Trajan Pro"`: this is a fallback inside the `font-cinzel` stack. Cinzel itself ships. Suppressed via `runtimeFontPrefixes`.

## Re-sync risks
- `build-ds.mjs` text-rewrites `getAssetUrl`'s `` return `/${cleanPath}` ``. If `src/lib/assets.ts` changes that line, local-whitelist assets silently go back to `/images/...` and break in designs. Grep `dist/index.js` for `"/images/` after a build.
- The S3 base URL is hardcoded in `build-ds.mjs` and in the media previews. Update both if the bucket moves.
- `dtsPropsFor` bodies were snapshotted from the build on 2026-10-02. Props added to those components later won't appear until the entries are refreshed.
- Playwright is pinned to 1.62.0 in `.ds-sync/` to match the cached chromium-1234. A different chromium cache needs a matching version.
- Components added to `src/components/ui/index.ts` sync automatically but land in the `general` group with a floor card until they get a `docsMap` stub entry and an authored preview.
