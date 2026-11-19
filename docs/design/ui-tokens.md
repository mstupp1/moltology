# UI tokens

The shared colours, type, corners and sizes for the main site and the app. They live in
[`tailwind.config.js`](../../tailwind.config.js) and [`src/index.css`](../../src/index.css); this page
says when to use each. New UI uses these and the primitives in `src/components/ui/`, not raw hex.
The rules they follow (a Linear-style dark system with Moltology's colours) are locked in
[DESIGN.md](DESIGN.md).

## Colour

| Token | Use |
| --- | --- |
| `abyss` | Page ground, and text on solid cyan or crimson fills. |
| `surface-1` / `surface-2` / `surface-3` | Cards and panels / fields, menus and hovered controls / hovered menu rows and meter tracks. |
| `surface-crimson` | Ground for crimson cards and stat boxes. |
| `line-subtle` / `line` / `line-hover` / `line-strong` | Card edges and dividers / field and button borders / hovered field / hovered interactive card or button (cyan). |
| `ink` / `ink-body` / `ink-muted` | Headings and labels on controls / reading text / helper text, field labels, placeholders. |
| `cyan-glow`, `cyan-hover`, `cyan-soft` | The signal: main action fill, focus outline, links, live state / hover fill / tinted badge ground. Never decoration. |
| `crimson-aggro`, `crimson-hover`, `crimson-text`, `crimson-soft` | Sacred and destructive: fill / hover fill / red text on dark grounds / tinted ground. |
| `emerald-500`, `amber-500` | Done and warning, always with a word or ▲ ▼. |

The `line-*` and `*-soft` tokens already include alpha. Tailwind 4 opacity modifiers
apply to those colors too, so `/50` makes them more transparent.

Text selection defaults to `selection:bg-cyan-glow/30 selection:text-ink`: a muted
cyan wash with light text, so selected passages stay readable without a solid signal fill.

### Brand artwork

The Synaptic Path emblem uses `crimson-aggro` (`#ff453a`) in production. The
approved artwork also keeps reference-red, pure black/white and inherited-color
exports in [`content/brand/synaptic-path/`](../../content/brand/synaptic-path/README.md).
Use `BrandIcon` from `src/components/ui/BrandMark.tsx` for the inline emblem and
`HeaderBrand` for the navigation lockup: "Moltology" over "The Synaptic Path" as live
text, the tagline in tracked caps stretched to the title's width (`.brand-lockup` in
`src/index.css`; it is part of the mark, so it may sit under the 11px floor). The
outlined word SVGs live only in the downloadable kit. The emblem path inherits color;
do not apply filters to approximate a different brand color. For a page's one hero mark (page loader, not-found, sign-in, certificates, offline page,
link-preview cards) use `GlowEmblem` from `src/components/ui/GlowEmblem.tsx`: the emblem
in its own light, a soft red halo plus a drop shadow, colour unchanged. Never in lists or rows.
Use `BrandAwareImage`
for data-driven avatars and product images: existing emblem PNG/WebP/SVG URLs render
the current inline vector, while other images retain their source and fallbacks.
This keeps stored emblem URLs current without relying on image caches.
`npm run brand:build`
regenerates exports from these tokens; `npm run brand:check` detects stale colors,
icons or geometry and verifies the original-icon backups.

## Type

Space Grotesk (`font-grotesk`, and every `h1`/`h2` by default) for page and section titles and
the brand; Inter (`font-sans`, the default) for all UI and reading text. Weights are 400 for
reading, 500 (`font-medium`) for UI and 600 (`font-semibold`) for titles; no bold.

| Token | Size | Use |
| --- | --- | --- |
| `text-2xs` | 11px | Badges, eyebrows, tiny meta |
| `text-xs` | 12px | Meta, captions, small buttons |
| `text-ui` | 13px | Buttons, tabs, menu rows, dense lists |
| `text-sm` | 14px | Default UI text and list titles |
| `text-md` | 15px | Comfortable reading inside cards |
| `text-base` | 16px | Reading text, and every phone input (stops iOS zoom) |
| `text-lg` to `text-2xl` | 18 to 24px | Section and page titles, with `tracking-tight` |

Sizes are in rem, so they step up with the root size on larger screens. UI text is sentence
case. The one exception is `eyebrow`: a small uppercase, tracked section label in `ink-muted`
("What you will practice", "Module 2"). Do not add `uppercase` or positive tracking anywhere else.

## Corners

| Token | Size | Use |
| --- | --- | --- |
| `rounded-chip` | 2px | Badges, status squares. |
| `rounded-control` | 6px | Buttons, fields, menu rows, pagination. |
| `rounded-card` | 8px | Cards, menus, stat boxes. |
| `rounded-panel` | 12px | Large main-site panels and screenshot frames. |
| `rounded-full` | | Avatars, status dots and filter or view pills. |

## Depth

- Elevation comes from surface steps (`surface-1` → `surface-2` → `surface-3`) and 1px lines, not glow.
- No cut corners or corner brackets on anything.
- `.hud-sheen`: faint light from above on a surface, paired with a `bg-surface-*` colour.

## Sizes and states

- Controls are `min-h-8`, `min-h-10` or `min-h-12` (32, 40, 48px at the base font size).
- No text under 11px.

## Spacing

One scale, tighter on phones. Use these exact class sets so pages stay in step:

| What | Classes | Phone / sm / lg |
| --- | --- | --- |
| Gap between a page's sections | `space-y-3 sm:space-y-4 lg:space-y-5` | 12 / 16 / 20px |
| Gap between cards in a grid | `gap-3 sm:gap-4 lg:gap-5` | 12 / 16 / 20px |
| Card padding | `p-3 sm:p-4` | 12 / 16px |
| Large card or panel padding | `p-3 sm:p-4 lg:p-5` | 12 / 16 / 20px |
| Hero padding (Dashboard today, Academy, profile header) | `p-4 sm:p-5 lg:p-6` | 16 / 20 / 24px |
| List rows inside a card | `py-2 sm:py-2.5` | 8 / 10px |

Every standard page starts with the header band (see Page headings), then its sections.
Pages never wrap themselves in an extra outer card; the page panel is the frame.
- Standard app pages share a centered, fluid content area capped at 1,280px on desktop
  in `HudLayout`. The cap excludes sidebar navigation and page padding. Use pixels here
  because the root font size scales on desktop. Fullscreen Oracle pages use the full workspace.
  The desktop header's XP bar shares the same centered cap and horizontal page padding.
- Focus: `outline-2 outline-offset-2 outline-cyan-glow` on buttons and tabs; fields switch to a
  `cyan-glow` border with `shadow-field-focus` (`shadow-field-error` when invalid).
- Glow is for live states only (an active Oracle core, recording, streaming). Buttons and cards do not glow.

## Public header nav

The current page is a lit tile (`bg-surface-3 shadow-nav-current`: a faint light edge, cyan icon). A faint
lens slides to whatever is hovered or focused. No underline marks. Section sub-tabs
(the About subnav) use the same lit tile for the current section. On phones the same
tab list becomes a full-height sheet with a one-line hint per page and account actions
pinned to the bottom.

## Primitives

`HudButton` variants: `primary` (alias `cyan`, solid cyan), `crimson`, `secondary` (alias `dark`, a
faint `surface-2` fill with a `line-subtle` edge), `ghost`, `danger` (alias `sacred`). Inter 13px weight
500, sentence case, no glow. One `primary` per screen. There are two tab styles and no underline tabs:

- Section tabs, on a header band's title row: `BandSectionNav` (each section has a URL) or
  `HudTabs` (in-page state). Inter 13px weight 500, the current one a lit `surface-3` tile.
- In-page view tabs and filters: `pillTabClass()` from `src/components/ui/pillTab.ts`, round
  pills with the current one a lit `surface-3` pill.

## Guard

`npm run ui:check` (run in CI by `.github/workflows/hygiene.yml`) fails when a component adds an arbitrary
hex colour class (`bg-[#…]`, `text-[#…]`, `border-[#…]` …), a cut corner (`hud-cut`, `chamfer-corner`),
text under 11px, a one-off UI font size (`text-[13px]`), positive tracking, `uppercase`, `font-bold` or heavier,
a Tailwind grey (`text-slate-400`), an old `benthic-*`/`sacred-*` colour, a cyan or red glow
(`shadow-hud-*`, `shadow-[0_0_20px_rgba(0,195,255,…)]`) or a radius off the scale above (`rounded-lg`,
`rounded-[28px]` …). It scans `src/**/*.tsx` and `src/**/*.ts`. Social composites and rendered artwork
keep their recorded counts. Older hits are recorded per file in
`scripts/ui-token-baseline.json` and may only go down. After cleaning a file up, run
`npm run ui:check -- --update` to lock in the lower count.

## Horizontal scrolling

Use `HorizontalScroll` from `src/components/ui/HorizontalScroll.tsx` for sideways card,
filter and tab rows, keeping the layout's `overflow-x-auto` and responsive wrap/grid
classes. It preserves native touch and keyboard scrolling, hides the scrollbar, and
fades only edges with more content beyond them. Fades update on scroll, resize and
content changes, and disappear when the row fits. Use `as="nav"` or `as="ul"` to keep
the row's semantics; existing refs and scroll-to-selection behavior are supported.
Horizontal overflow utilities also hide scrollbars for tables and code blocks.

## Page headings

Use `HudTitlePanel` for shared HUD page headings. The heading treatment follows the
page's structure; a title alone does not need its own card.

- `treatment="compact"` (default): unboxed heading and actions above independent
  sections. Use for section headings inside a page and editor toolbars.
- `treatment="integrated"`: heading inside an existing workspace surface, separated
  from its controls/content by a divider. Use for Connections and Daily Alignment. The parent supplies padding and section spacing.
- `treatment="hero"`: substantial introduction with useful imagery, identity, or
  overview content. Premium uses this explicitly. Dashboard and member profiles
  retain their purpose-built identity compositions.

`treatment="band"` is the page header band: the title card runs edge to edge across
the top of the page panel (rounded to the panel's top corners on desktop, flush under
the top bar on phones) with a `surface-2` fill and a `line-subtle` bottom divider, so it
stands apart from the `surface-1` panel. Use it as the first element of every standard page
(Academy, Certificates, Forum, Shop, Progress, Admin, Logic Atlas, Support, Settings, Search,
Profile; Character and Codex build
the same band by hand with `BandHeadingRow`). On desktop the search pill straddles the band's
top-right corner, so the title row leaves room for it.

One band, the same rows on every page:

1. Title row, level with the pill on desktop: the `h1`, then for an area with sibling pages
   (Character, Academy, Admin, Support, Profile) a thin divider and the section tabs
   (`sections`: `BandSectionNav` when each section has a URL, `HudTabs` for in-page state). The
   title is the area's name on every one of its tabs (Character on Customize, Shop and Progress);
   the current tab is a lit tile. `actions` sit on the right of the same row (Forum's New post,
   Character's save, or a few figures as `BandStat`) and stop short of the pill
   (`.hud-pill-clear`). Admin, with six sections, passes `sectionsBelow` to give its tabs their
   own row. No eyebrow.
2. Optional description: one short line. `hideDescriptionOnPhone` drops it where the tabs
   and figures already say enough (Shop).
3. Optional `toolbar`: in-page view tabs as lit tiles (Shop's Gear / Skills / Earn gems / Credits).
   Content such as cards, lists or forms always starts below the band.

On phones the title row holds the title and short actions; section tabs get their own row
under it (scrolling sideways), then figures (`actionsBelowOnPhone`), then the toolbar.
Pages that open with their own hero instead of a band (Dashboard) add `hud-page-flush-top`
so the hero starts at the panel's top edge rather than under the strip kept for the pill.
Codex builds the same band by hand on desktop (title, stage and position, reader actions).

`actions` holds page-level commands or a short status summary. `toolbar` spans the
full width below the heading and actions, for navigation or filters. Both wrap on
small screens; do not force fixed header heights. Keep collection filters near
their results and editor save actions accessible while scrolling. Admin status figures,
section tabs and tool links all sit in the Admin band; Atlas filters and Store settings stay
on solid cards below it.

Use one page heading. Keep descriptions brief, omit redundant eyebrows, and avoid
repeating the page title as the first section heading. Oracle, lesson readers,
profile details, and forum topics use their content's own heading rather than an
additional generic title banner.

## Page panel

Every standard HUD page (everything except the full-screen Oracle) sits inside one
see-through page panel drawn by `HudLayout`, so pages never add their own outer frame.

- Desktop: `main` carries a `surface-1/[0.45]` scrim and 8px side padding around
  the panel. The page column (max 1312px) is the panel: `surface-1/[0.68]`,
  `line-subtle` border, `rounded-panel`, 15px side padding. 8 + 1 + 15 = 24px per
  side and 1312 - 32 = 1280px of content, the same width pages had before the
  panel, so keep these in step if any of them changes. It grows with its content (`flex-1 shrink-0`), so
  the frame reaches the bottom of long pages. The top-right pill straddles the
  panel's top edge and sits in its 54px top padding, so content starts right below
  the pill instead of under a reserved bar.
- Phone: the panel is full width with no inset or corners. Its `surface-1/[0.82]`
  tint sits in the background stack, matching the desktop panel's combined
  darkness (45% scrim under a 68% panel). No blur.
- Avoid `backdrop-filter` on `main` or the page column: it makes an element the
  containing block for `position: fixed` children, which would trap page sheets
  and dialogs inside it.
