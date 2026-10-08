# Composite layouts

Layout specs are JSON files that the composite renderer draws without any new React code. Each one is a reusable recipe: a background plus a stack of layers placed on the canvas. Most come from recreating a reference design or ad (see the `composite-reference-library` skill); keep the ones worth reusing here.

```bash
npm run composite:render -- --spec content/composite-layouts/bold-hook.json --out tmp/bold-hook.png
npm run composite:render -- --spec my-layout.json --guides                  # draw safe area and layer boxes
npm run composite:render -- --spec my-layout.json --compare ref.jpg         # side-by-side with a reference
npm run composite:render -- --spec my-layout.json --native                  # also write a 1x platform-size copy
npm run composite:render -- --spec my-layout.json --mascot crab_stats       # mascot layers without a key use this
```

The schema and lint rules live in [`src/components/composite/layout-spec.ts`](../../src/components/composite/layout-spec.ts); the renderer is [`LayoutSlide.tsx`](../../src/components/composite/LayoutSlide.tsx).

## Shape

```json
{
  "version": 1,
  "name": "bold-hook",
  "aspect": "3:4",
  "safeArea": 5,
  "referenceId": "ref-1a2b3c4d5e",
  "background": { "gradient": "linear-gradient(180deg, #021324, #01060e)", "spotlight": true, "grain": true },
  "layers": [ { "type": "text", "text": "…", "size": 96, "box": { "x": 7, "y": 12, "w": 86, "h": 24 } } ]
}
```

- **Boxes** are percentages of the canvas: `x`, `y`, `w`, optional `h` and `rotate`. Percentages keep a layout usable when the aspect changes.
- **Sizes** are CSS pixels on the 1x canvas (1080 wide for social formats). Renders are 2x by default.
- **Colors** take brand tokens (`cyan`, `sky`, `crimson`, `amber`, `abyss`, `navy`, `ink`, `white`, `bone`, `muted`) or any CSS color.
- **Images** take an S3 asset path (`images/…`), a URL, or a local file path starting with `./`, `../`, `/`, `~/` or `tmp/`. Local files are inlined at render time, so a background plate in `tmp/` needs no upload. Relative paths resolve from the spec file.
- **Order** is paint order; use `z` to override.

| Layer | Use it for | Key fields |
| --- | --- | --- |
| `text` | Headlines, body, captions | `text` (newlines allowed), `size`, `font` (display, body, serif, mono), `weight`, `color`, `highlight` + `highlightColor`, `align`, `valign`, `lineHeight`, `tracking`, `uppercase`, `shadow` (none, soft, strong, glow). With a box height the text shrinks to fit (down to `minSize`). |
| `panel` | Cards, glass HUD plates, color blocks | `style` (glass, solid, outline, gradient), `color`, `colorTo`, `border`, `radius`, `glow`, `shadow` |
| `pill` | Eyebrows, category tags | `text`, `size`, `color`, `background`, `border`, `align` |
| `button` | The call to action | `text`, `size`, `style` (solid, outline, gradient), `color`, `textColor`, `arrow` |
| `image` | Product shots, plates, screenshots | `src`, `fit` (cover, contain), `position`, `radius`, `shadow`, `flip` |
| `mascot` | A character cutout | `key` (registry key; omit to use `--mascot`), `flip`, `shadow` |
| `shape` | Glows, dividers, blocks, circles | `shape` (rect, circle, line, glow), `color`, `blur`, `radius`, `thickness` |
| `list` | Bullets, steps, checklists | `items`, `size`, `marker` (dot, check, number, dash, none), `gap` |
| `stat` | A big number with a label | `value`, `label`, `size`, `color`, `labelColor`, `align` |

## Lint

Every render prints warnings for text inside the edge margin (`safeArea`, default 4%), text boxes without a height (they cannot auto-fit), type under 22px, and frames over 60 words. Treat them as review notes, not blockers.

## Copy

Layouts carry real copy, so the [style guide](../../STYLE_GUIDE.md) applies: sentence case, at most two Moltology terms in a short piece, one call to action, no invented stats or reviews.
