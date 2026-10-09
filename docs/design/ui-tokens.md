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

The `line-*` and `*-soft` tokens are rgba, so Tailwind's `/50` opacity modifier does not apply to them.

### Brand artwork

The Synaptic Path emblem uses `crimson-aggro` (`#ff453a`) in production. The
approved artwork also keeps reference-red, pure black/white and inherited-color
exports in [`content/brand/synaptic-path/`](../../content/brand/synaptic-path/README.md).
Use `BrandIcon` / `BrandWordmark` from `src/components/ui/BrandMark.tsx` for inline
branding and `HeaderBrand` for the navigation lockup. Their paths inherit color;
do not apply filters to approximate a different brand color. `npm run brand:build`
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
- `.hud-ticks`: cyan corner ticks for a featured panel (`showCornerBrackets` on `HudCard` and `HudStatBox`).
- `.hud-sheen`: faint light from above on a surface, paired with a `bg-surface-*` colour.

## Sizes and states

- Controls are `min-h-8`, `min-h-10` or `min-h-12` (32, 40, 48px at the base font size).
- Cards pad 16px (`p-4`); large panels 24px. No text under 11px.
- Focus: `outline-2 outline-offset-2 outline-cyan-glow` on buttons and tabs; fields switch to a
  `cyan-glow` border with `shadow-field-focus` (`shadow-field-error` when invalid).
- Glow is for the main action on hover and for live states only. Resting cards and buttons do not glow.

## Primitives

`HudButton` variants: `primary` (alias `cyan`), `crimson`, `secondary` (alias `dark`), `ghost`, `danger`
(alias `sacred`). One `primary` per screen. `HudTabs` is the underline tab list for in-page sections.
