# UI tokens

The shared colours, corners and sizes for the main site and the app. They live in
[`tailwind.config.js`](../../tailwind.config.js) and [`src/index.css`](../../src/index.css); this page
says when to use each. New UI uses these and the primitives in `src/components/ui/`, not raw hex.

## Colour

| Token | Use |
| --- | --- |
| `abyss` | Page ground, and text on solid cyan or crimson fills. |
| `surface-1` / `surface-2` / `surface-3` | Cards and panels / fields, menus and hovered controls / hovered menu rows and meter tracks. |
| `surface-crimson` | Ground for crimson cards and stat boxes. |
| `line-subtle` / `line` / `line-hover` / `line-strong` | Card edges and dividers / field and button borders / hovered field / hovered interactive card or button (cyan). |
| `ink` / `ink-body` / `ink-muted` | Headings and labels on controls / reading text / helper text, field labels, placeholders. |
| `cyan-glow`, `cyan-hover`, `cyan-soft` | The signal: main action fill, focus outline, live state / hover fill / tinted badge ground. |
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
do not apply filters to approximate a different brand color. Use `BrandAwareImage`
for data-driven avatars and product images: existing emblem PNG/WebP/SVG URLs render
the current inline vector, while other images retain their source and fallbacks.
This keeps stored emblem URLs current without relying on image caches.
`npm run brand:build`
regenerates exports from these tokens; `npm run brand:check` detects stale colors,
icons or geometry and verifies the original-icon backups.

## Corners

| Token | Size | Use |
| --- | --- | --- |
| `rounded-chip` | 2px | Badges, status squares. |
| `rounded-control` | 4px | Buttons, fields, menu rows, pagination. |
| `rounded-card` | 8px | Cards, menus, stat boxes. |
| `rounded-panel` | 12px | Large main-site panels and screenshot frames. |
| `rounded-full` | | Avatars and status dots only. |

## The sharp details

- `.hud-cut`: the single cut corner (top right) on filled buttons. Put it on the fill layer, never on the
  focusable element, so the focus outline is not clipped. Size comes from `--hud-cut`.
- `.hud-sheen`: faint light from above on a surface, paired with a `bg-surface-*` colour.

## Sizes and states

- Controls are `min-h-8`, `min-h-10` or `min-h-12` (32, 40, 48px at the base font size).
- Cards pad 16px (`p-4`); large panels 24px. No text under 11px.
- Standard app pages share a centered, fluid content area capped at 1,280px on desktop
  in `HudLayout`. The cap excludes sidebar navigation and page padding. Use pixels here
  because the root font size scales on desktop. Fullscreen Oracle pages use the full workspace.
  The desktop header's XP bar shares the same centered cap and horizontal page padding.
- Focus: `outline-2 outline-offset-2 outline-cyan-glow` on buttons and tabs; fields switch to a
  `cyan-glow` border with `shadow-field-focus` (`shadow-field-error` when invalid).
- Glow is for the main action on hover and for live states only. Resting cards and buttons do not glow.

## Public header nav

The current page is a lit tile (`bg-surface-3 shadow-nav-current`, cyan icon). A faint
lens slides to whatever is hovered or focused. No underline marks. Section sub-tabs
(the About subnav) use the same lit tile for the current section. On phones the same
tab list becomes a full-height sheet with a one-line hint per page and account actions
pinned to the bottom.

## Primitives

`HudButton` variants: `primary` (alias `cyan`), `crimson`, `secondary` (alias `dark`), `ghost`, `danger`
(alias `sacred`). One `primary` per screen. `HudTabs` is the underline tab list for in-page sections.

## Guard

`npm run ui:check` (run in CI by `.github/workflows/hygiene.yml`) fails when a component adds an arbitrary
hex colour class (`bg-[#…]`, `text-[#…]`, `border-[#…]` …), a `chamfer-corner`, text under 11px, or a radius
off the scale above (`rounded-lg`, `rounded-[28px]` …). Older hits are recorded per file in
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
  sections. Use for Community, Academy, admin pages, and editor toolbars.
- `treatment="integrated"`: heading inside an existing workspace surface, separated
  from its controls/content by a divider. Use for Search, Connections, Activity Stream,
  Settings, Daily Alignment, and Covenant Watch. The parent supplies padding and section spacing.
- `treatment="hero"`: substantial introduction with useful imagery, identity, or
  overview content. Premium uses this explicitly. Dashboard and member profiles
  retain their purpose-built identity compositions.

`treatment="band"` is the page header band: the title card runs edge to edge across
the top of the page panel (rounded to the panel's top corners on desktop, flush under
the top bar on phones) with a `surface-2` fill and a `line-subtle` bottom divider, so it
stands apart from the `surface-1` panel. Use it as the first element of a standard page
(Academy, Certificates, Forum, Shop, Progress; Character builds the same band by hand).
On desktop the search pill straddles the band's top-right corner, so the band leaves room
for it. Pages with section tabs open the band with `HudTitleBandTop` (tabs level with the
pill) and pass `joined` to the title band below it. Inside a band, section tabs are plain
labels; in-page tabs use the lit `surface-3` pill.

`actions` holds page-level commands or a short status summary. `toolbar` spans the
full width below the heading and actions, for navigation or filters. Both wrap on
small screens; do not force fixed header heights. Keep collection filters near
their results and editor save actions accessible while scrolling. Admin overview
metrics, tool links, and section tabs share one solid workspace; keep Atlas
filters and Store settings navigation on solid surfaces too.

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
