# Moltology design lock

The locked design system for the Moltology app and site, in the format the
[design-drift](https://github.com/ihlamury/design-drift) plugin reads. It takes its
structure from Linear's dark-mode system (near-black ground, luminance steps for depth,
1px lines, one accent for actions, a short type scale, sentence case) and keeps
Moltology's own colours, emblem, page panel and header band.

How to use the tokens day to day is in [ui-tokens.md](ui-tokens.md); values live in
[tailwind.config.js](../../tailwind.config.js) and [src/index.css](../../src/index.css).
`npm run ui:check` enforces the rules below in CI, and the committed `.design-lock`
(BRAND=moltology, read from `.design-cache/moltology.md`, a link to this file) makes the
design-drift scanner check every UI write in Claude sessions.

## 1. Atmosphere

Deep water at night. A near-black abyss ground (`#030708`) with the page in one
see-through panel. Content rises from darkness through small steps in surface
lightness, never through glow. Cyan (`#00c3ff`) is the signal: the main action,
focus, links in running text and live state. Crimson (`#ff453a`) is sacred and
destructive. Everything else is cool grey ink on dark teal-black surfaces.

## 2. Colour

| Token | Value | Use |
| --- | --- | --- |
| `abyss` | `#030708` | Page ground; text on solid cyan or crimson |
| `surface-1` | `#0a1112` | Cards, panels |
| `surface-2` | `#101a1c` | Fields, menus, secondary buttons, header band |
| `surface-3` | `#172325` | Hover rows, selected pills, meter tracks |
| `surface-crimson` | `#140a0b` | Crimson cards |
| `line-subtle` | `rgba(150, 170, 170, 0.14)` | Card edges, dividers, secondary button edge |
| `line` | `rgba(150, 170, 170, 0.55)` | Field borders |
| `line-hover` | `rgba(150, 170, 170, 0.72)` | Hovered field |
| `line-strong` | `rgba(0, 195, 255, 0.55)` | Hovered interactive card |
| `ink` | `#e4e9e9` | Headings, labels, primary text |
| `ink-body` | `#c3cdcd` | Reading text |
| `ink-muted` | `#8fa0a0` | Helper text, meta, placeholders, eyebrows |
| `cyan-glow` | `#00c3ff` | Main action fill, focus, live state |
| `cyan-hover` | `#3dd3ff` | Main action hover |
| `cyan-soft` | `rgba(0, 195, 255, 0.12)` | Tinted badge ground |
| `crimson-aggro` | `#ff453a` | Sacred or destructive fill, emblem |
| `crimson-hover` | `#ff6658` | Crimson hover |
| `crimson-text` | `#ff6a60` | Red text on dark |
| `crimson-glow` | `#ff5540` | Emblem halo only |
| `emerald-500` | `#10b981` | Done, always with a word |
| `amber-500` | `#f59e0b` | Warning, always with a word |

- MUST use colour tokens; NEVER write an arbitrary hex class such as `text-[#…]`
- MUST keep cyan for actions, focus, links and live state only
- NEVER use the old neon cyans (pure 00ffff and mint 00ffcc); there is one cyan
- NEVER use Tailwind greys (`slate`, `gray`, `zinc`, `neutral`, `stone`); use `ink-*`, `surface-*`, `line-*`

## 3. Type

- **Display and titles**: `font-family: Space Grotesk` (`font-grotesk`), weight 600, negative tracking (`tracking-tight`) at 20px and above. Page titles, section titles, the brand.
- **UI and reading**: `font-family: Inter` (`font-sans`, the default). Everything else.
- Lore pages may use `Cinzel` and `EB Garamond` for scripture.

| Token | Size | Use |
| --- | --- | --- |
| `text-2xs` | 11px | Eyebrows, badges, tiny meta |
| `text-xs` | 12px | Meta, captions, small buttons |
| `text-ui` | 13px | Buttons, tabs, menu rows, dense lists |
| `text-sm` | 14px | Default UI and list titles |
| `text-md` | 15px | Comfortable reading in cards |
| `text-base` | 16px | Reading text, phone inputs |
| `text-lg` to `text-2xl` | 18 to 24px | Section and page titles |
| `text-3xl` and up | 30px+ | Heroes only |

- MUST use the type scale; NEVER write an arbitrary size under 18px such as `text-[11px]`
- MUST write UI text in sentence case
- MUST use `eyebrow` for a small uppercase section label; it is the only uppercase, tracked UI text
- NEVER add positive letter-spacing (`tracking-wider`, `tracking-[0.08em]`) outside `eyebrow`
- MUST keep weights to 400 (reading), 500 (UI) and 600 (titles)
- NEVER use `font-bold`, `font-extrabold` or `font-black` in app UI
- NEVER put text under 11px

## 4. Shape and depth

### Border radius

Border radius scale: 2px badges (`rounded-chip`), 6px buttons and fields (`rounded-control`),
8px cards and menus (`rounded-card`), 12px panels (`rounded-panel`), full for filter pills,
avatars and status dots.

- MUST use the radius tokens; NEVER `rounded-lg`, `rounded-md` or `rounded-[Npx]`
- NEVER use cut corners (`hud-cut`, `chamfer-corner`) or corner brackets

### Depth

- MUST use 1px borders

- MUST show elevation with surface steps (`surface-1` → `surface-2` → `surface-3`) and 1px lines
- NEVER add glow (`shadow-hud-*`, cyan or red `0 0 Npx` shadows) to resting cards or buttons
- Glow is allowed only on live states (recording, streaming, an active core) and the emblem halo
- Dark drop shadows are allowed on floating layers (menus, sheets, dialogs)

## 5. Components

- **Primary button**: solid `cyan-glow`, `abyss` text, `rounded-control`, Inter 13px weight 500, no glow, no cut corner. One per screen.
- **Secondary button**: `surface-2` fill at 70%, `line-subtle` edge, `ink` text; hover `surface-3`.
- **Ghost button**: no fill, `ink-muted` text; hover `surface-2`.
- **Danger**: crimson outline and text.
- **Section tabs** (header band): Inter 13px weight 500, current in `ink`, others `ink-muted`. No underline.
- **View pills and filters**: `rounded-full`, current one `surface-3` with a faint light edge.
- **Cards**: `surface-1`, `line-subtle` edge, `rounded-card`, no glow.
- **Badges**: `rounded-chip`, 11px weight 600, sentence case, tinted ground.
- **Fields**: `surface-2`, `line` edge, `cyan-glow` border and soft ring on focus; 16px text on phones.

## 6. Layout and spacing

- MUST use 4px grid for spacing, with the scale in ui-tokens.md "Spacing"
- Every standard page starts with the header band inside the page panel
- NEVER use `h-screen`, use `h-dvh`

## 7. Interaction

- MUST use `outline-2 outline-offset-2 outline-cyan-glow` for keyboard focus; NEVER remove focus indicators
- Disabled: `opacity-50`, `cursor-not-allowed`
- MUST animate only `transform` and `opacity`, under 200ms for feedback, and respect reduced motion

## 8. Out of scope

Social composites (`src/components/composite/`), device-frame mockups (`ui/magicui/`) and
rendered artwork (book covers, share cards, the 3D character and Oracle core) are images,
not UI, and keep their own styling.
