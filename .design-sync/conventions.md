# Moltology HUD: how to build with it

A dark, sci-fi heads-up-display (HUD) system. Every surface is near-black with cyan accents. Crimson is reserved for warnings and sacred doctrine. Corners are square (`rounded-none`) and labels are uppercase with wide tracking.

## Setup

- No root provider is needed for styling. `styles.css` sets the page to `#030708` with light text (`#dfe3e3`) in Space Grotesk. Keep that dark page: the components are translucent and look washed out on white.
- Toasts: wrap the app once in `ToastProvider`, then call `useToast().toast.success|info|warning|error|hud(message, { title?, duration? })`. Use `useOptionalToast()` where the provider may be missing. Never use `alert()`.
- Overlays (`HudBottomSheet`, `ImageLightbox`, `HudDropdownMenuContent`) portal to `document.body` and position themselves. Control them with `isOpen`/`onClose` (or Radix `open`/`onOpenChange` for the dropdown).

## Styling idiom: Tailwind utilities (JIT, so only compiled names exist)

Use the components first. For your own layout glue, use only these families:

| Purpose | Classes |
|---|---|
| Surfaces | `bg-benthic-bg` `bg-benthic-dim` `bg-benthic-surface` `bg-benthic-container` `bg-benthic-high` |
| Borders | `border` `border-t` `border-b` `border-benthic-border` `border-cyan-glow` `border-crimson-aggro` |
| Text | `text-benthic-outline` (muted) `text-cyan-glow` `text-cyan-bright` `text-crimson-aggro` `text-sacred-glow` |
| Glow | `shadow-hud-cyan` `shadow-hud-cyan-lg` `shadow-hud-red` `shadow-sacred-red` `shadow-chitin-plate` |
| Type | `font-sans` `font-grotesk` `font-cinzel` `font-garamond` · `text-xs`–`text-5xl` · `font-bold` · `uppercase` `tracking-wider` `tracking-widest` |
| Layout | `flex` `grid` `grid-cols-1..12` `gap-0..16` `p-*` `px-*` `py-*` `m-*` `space-y-*` `max-w-xs..7xl` `w-full` `mx-auto` `items-*` `justify-*` |
| HUD helpers | `chitin-card` `chitin-card-interactive` `chamfer-corner` `bg-sacred-grid` `bg-benthic-vignette` `scanline-overlay` `text-cyan-glow` `text-red-glow` `texture-pbr-hex` (also `-chitin` `-alloy` `-carbon` `-basalt` `-circuit`) |

Arbitrary values like `w-[360px]` or `text-[#00c3ff]` are not compiled. Use the `style` prop for one-off sizes and colors. Spacing scale steps are `0 1 2 3 4 5 6 8 10 12 16`.

## Where the truth lives

- `styles.css` → `_ds_bundle.css`: the full compiled stylesheet, including the HUD helper classes. Read it before inventing a class.
- `components/<group>/<Name>/<Name>.prompt.md` (props + examples) and `<Name>.d.ts` (exact props). Groups: actions, layout, forms, display, feedback, navigation, media, brand.
- Compose cards from `HudCard` + `HudCardHeader` / `HudCardTitle` / `HudCardContent` / `HudCardFooter`. Use `HudStatBox` for metric readouts and `HudBadge` for one status pill (at most one or two per card).

## Copy rules

Warm, deadpan, in-world voice, but buttons, toasts, and errors stay plain and actionable ("Save username", "Could not save. Please try again."). No emoji, no ALL-CAPS sentences in body copy, no slash-pair titles, and no decorative controls that don't do anything.

## Example

```jsx
const { HudCard, HudCardHeader, HudCardTitle, HudCardContent, HudCardFooter, HudBadge, HudButton, HudStatBox } = window.MoltologyHud;

<div className="bg-benthic-bg p-6 grid grid-cols-3 gap-4">
  <HudStatBox label="Shell Hardness" value="61%" trend="up" trendValue="+4%" subtext="Stage 3 · Exoshell Born" />
  <HudCard glow className="col-span-2">
    <HudCardHeader>
      <HudCardTitle>Daily Shedding Routine</HudCardTitle>
      <HudBadge variant="emerald" dot>Active</HudBadge>
    </HudCardHeader>
    <HudCardContent><p className="leading-relaxed">Close the open tabs. Finish one thing you started yesterday.</p></HudCardContent>
    <HudCardFooter><span>3 of 5 sheds complete</span><HudButton size="sm">Log a shed</HudButton></HudCardFooter>
  </HudCard>
</div>
```
