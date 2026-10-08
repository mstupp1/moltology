import { z } from 'zod'
import { COMPOSITE_DIMENSIONS, type CompositeAspectRatio } from './CompositeContainer'

/**
 * Layout specs describe a composite as data: a background plus an ordered stack of layers,
 * each placed in a percentage box on the canvas. One JSON file can recreate a reference ad
 * without writing a new React template, so the library of layouts grows as references come in.
 *
 * Boxes are percentages of the canvas (0-100) so a spec survives aspect changes. Font sizes
 * are CSS pixels at 1x on the native canvas (1080 wide for social formats).
 */

export const BRAND_COLORS = {
  cyan: '#00c3ff',
  sky: '#38bdf8',
  crimson: '#ff453a',
  amber: '#fbbf24',
  abyss: '#01060e',
  navy: '#021324',
  ink: '#02080c',
  white: '#ffffff',
  bone: '#dfe3e3',
  muted: '#8aa0a8',
} as const

export type BrandColorToken = keyof typeof BRAND_COLORS

const colorSchema = z.string().min(1)

const boxSchema = z.object({
  x: z.number().min(-50).max(150),
  y: z.number().min(-50).max(150),
  w: z.number().positive().max(200),
  h: z.number().positive().max(200).optional(),
  rotate: z.number().min(-180).max(180).optional(),
})

const fontSchema = z.enum(['display', 'body', 'serif', 'mono'])

const layerBase = {
  id: z.string().optional(),
  box: boxSchema,
  opacity: z.number().min(0).max(1).optional(),
  z: z.number().int().optional(),
}

const textLayerSchema = z.object({
  ...layerBase,
  type: z.literal('text'),
  text: z.string(),
  font: fontSchema.optional(),
  size: z.number().positive().max(400),
  minSize: z.number().positive().optional(),
  weight: z.number().int().min(100).max(900).optional(),
  color: colorSchema.optional(),
  /** Words or phrases inside `text` drawn in this color. */
  highlight: z.union([z.string(), z.array(z.string())]).optional(),
  highlightColor: colorSchema.optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  valign: z.enum(['top', 'center', 'bottom']).optional(),
  lineHeight: z.number().positive().max(3).optional(),
  tracking: z.number().min(-0.2).max(1).optional(),
  uppercase: z.boolean().optional(),
  italic: z.boolean().optional(),
  shadow: z.enum(['none', 'soft', 'strong', 'glow']).optional(),
  /** Shrink the font until the text fits the box (needs box.h). Default true when h is set. */
  fit: z.boolean().optional(),
})

const panelLayerSchema = z.object({
  ...layerBase,
  type: z.literal('panel'),
  style: z.enum(['glass', 'solid', 'outline', 'gradient']).optional(),
  color: colorSchema.optional(),
  colorTo: colorSchema.optional(),
  border: colorSchema.optional(),
  borderWidth: z.number().min(0).max(20).optional(),
  radius: z.number().min(0).max(1000).optional(),
  glow: colorSchema.optional(),
  shadow: z.boolean().optional(),
})

const pillLayerSchema = z.object({
  ...layerBase,
  type: z.literal('pill'),
  text: z.string(),
  size: z.number().positive().max(120).optional(),
  color: colorSchema.optional(),
  background: colorSchema.optional(),
  border: colorSchema.optional(),
  uppercase: z.boolean().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
})

const buttonLayerSchema = z.object({
  ...layerBase,
  type: z.literal('button'),
  text: z.string(),
  size: z.number().positive().max(160).optional(),
  style: z.enum(['solid', 'outline', 'gradient']).optional(),
  color: colorSchema.optional(),
  textColor: colorSchema.optional(),
  radius: z.number().min(0).max(1000).optional(),
  arrow: z.boolean().optional(),
})

const imageLayerSchema = z.object({
  ...layerBase,
  type: z.literal('image'),
  src: z.string().min(1),
  fit: z.enum(['cover', 'contain']).optional(),
  position: z.string().optional(),
  radius: z.number().min(0).max(1000).optional(),
  shadow: z.boolean().optional(),
  flip: z.boolean().optional(),
})

const mascotLayerSchema = z.object({
  ...layerBase,
  type: z.literal('mascot'),
  /** Registry key from MascotOverlay, or omit to use the render's mascot. */
  key: z.string().optional(),
  flip: z.boolean().optional(),
  shadow: z.boolean().optional(),
})

const shapeLayerSchema = z.object({
  ...layerBase,
  type: z.literal('shape'),
  shape: z.enum(['rect', 'circle', 'line', 'glow']),
  color: colorSchema.optional(),
  blur: z.number().min(0).max(400).optional(),
  radius: z.number().min(0).max(1000).optional(),
  thickness: z.number().min(0).max(40).optional(),
})

const listLayerSchema = z.object({
  ...layerBase,
  type: z.literal('list'),
  items: z.array(z.string()).min(1).max(12),
  size: z.number().positive().max(120),
  marker: z.enum(['dot', 'check', 'number', 'dash', 'none']).optional(),
  color: colorSchema.optional(),
  markerColor: colorSchema.optional(),
  gap: z.number().min(0).max(200).optional(),
  font: fontSchema.optional(),
  weight: z.number().int().min(100).max(900).optional(),
})

const statLayerSchema = z.object({
  ...layerBase,
  type: z.literal('stat'),
  value: z.string(),
  label: z.string().optional(),
  size: z.number().positive().max(400).optional(),
  color: colorSchema.optional(),
  labelColor: colorSchema.optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
})

export const layoutLayerSchema = z.discriminatedUnion('type', [
  textLayerSchema,
  panelLayerSchema,
  pillLayerSchema,
  buttonLayerSchema,
  imageLayerSchema,
  mascotLayerSchema,
  shapeLayerSchema,
  listLayerSchema,
  statLayerSchema,
])

const aspectSchema = z.enum(Object.keys(COMPOSITE_DIMENSIONS) as [CompositeAspectRatio, ...CompositeAspectRatio[]])

export const layoutBackgroundSchema = z.object({
  color: colorSchema.optional(),
  /** Any CSS background-image gradient, e.g. "linear-gradient(180deg, #021324, #01060e)". */
  gradient: z.string().optional(),
  image: z.string().optional(),
  imageOpacity: z.number().min(0).max(1).optional(),
  imagePosition: z.string().optional(),
  vignette: z.boolean().optional(),
  spotlight: z.boolean().optional(),
  scanlines: z.boolean().optional(),
  grain: z.boolean().optional(),
})

export const layoutSpecSchema = z.object({
  version: z.literal(1).optional(),
  name: z.string().optional(),
  aspect: aspectSchema.optional(),
  /** Reference library id this layout recreates, for traceability. */
  referenceId: z.string().optional(),
  background: layoutBackgroundSchema.optional(),
  /** Inner safe margin in percent, used by the overlay guide and lint. */
  safeArea: z.number().min(0).max(25).optional(),
  layers: z.array(layoutLayerSchema).max(80),
})

export type LayoutBox = z.infer<typeof boxSchema>
export type LayoutLayer = z.infer<typeof layoutLayerSchema>
export type LayoutTextLayer = z.infer<typeof textLayerSchema>
export type LayoutBackground = z.infer<typeof layoutBackgroundSchema>
export type LayoutSpec = z.infer<typeof layoutSpecSchema>

export type LayoutSpecResult =
  | { ok: true; spec: LayoutSpec }
  | { ok: false; errors: string[] }

export function parseLayoutSpec(input: unknown): LayoutSpecResult {
  const result = layoutSpecSchema.safeParse(input)
  if (result.success) return { ok: true, spec: result.data }
  return {
    ok: false,
    errors: result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
  }
}

/** Resolve a brand token ("cyan") or pass through any CSS color. */
export function resolveColor(value: string | undefined, fallback: string = BRAND_COLORS.white): string {
  if (!value) return fallback
  return (BRAND_COLORS as Record<string, string>)[value] ?? value
}

export function boxToStyle(box: LayoutBox): {
  left: string
  top: string
  width: string
  height?: string
  transform?: string
} {
  return {
    left: `${box.x}%`,
    top: `${box.y}%`,
    width: `${box.w}%`,
    ...(box.h !== undefined ? { height: `${box.h}%` } : {}),
    ...(box.rotate ? { transform: `rotate(${box.rotate}deg)` } : {}),
  }
}

export const FONT_STACKS: Record<z.infer<typeof fontSchema>, string> = {
  display: "'Space Grotesk', 'Inter', ui-sans-serif, system-ui, sans-serif",
  body: "'Inter', 'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  serif: "'EB Garamond', Georgia, serif",
  mono: "ui-monospace, 'SFMono-Regular', Menlo, monospace",
}

/**
 * Split text into plain and highlighted runs, case-insensitive, first match wins at each
 * position. Used to color key words inside a headline.
 */
export function splitHighlights(text: string, highlight?: string | string[]): { text: string; hit: boolean }[] {
  const terms = (Array.isArray(highlight) ? highlight : highlight ? [highlight] : []).filter((t) => t.trim())
  if (terms.length === 0) return [{ text, hit: false }]
  const escaped = terms
    .sort((a, b) => b.length - a.length)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi')
  return text
    .split(pattern)
    .filter((part) => part.length > 0)
    .map((part) => ({ text: part, hit: terms.some((t) => t.toLowerCase() === part.toLowerCase()) }))
}

export interface LayoutLintIssue {
  level: 'warn' | 'error'
  layer?: string
  message: string
}

/**
 * Cheap structural checks that catch the usual scaffold problems before a render: text with
 * no room, copy pushed into the platform crop, and too many words for a social frame.
 */
export function lintLayoutSpec(spec: LayoutSpec): LayoutLintIssue[] {
  const issues: LayoutLintIssue[] = []
  const safe = spec.safeArea ?? 4
  let words = 0

  spec.layers.forEach((layer, index) => {
    const label = layer.id || `${layer.type}#${index}`
    const { x, y, w, h } = layer.box
    const textual = layer.type === 'text' || layer.type === 'pill' || layer.type === 'button' || layer.type === 'list' || layer.type === 'stat'

    if (textual) {
      if (x < safe || y < safe || x + w > 100 - safe || (h !== undefined && y + h > 100 - safe)) {
        issues.push({ level: 'warn', layer: label, message: `sits inside the ${safe}% edge margin, where feeds crop or overlay UI` })
      }
    }

    if (layer.type === 'text') {
      words += layer.text.split(/\s+/).filter(Boolean).length
      if (h === undefined) {
        issues.push({ level: 'warn', layer: label, message: 'has no box height, so it cannot auto-fit and may overflow' })
      }
      if (layer.size < 22) {
        issues.push({ level: 'warn', layer: label, message: `font size ${layer.size}px is hard to read on a phone feed` })
      }
    }
    if (layer.type === 'list') words += layer.items.join(' ').split(/\s+/).filter(Boolean).length
  })

  if (words > 60) {
    issues.push({ level: 'warn', message: `${words} words on one frame; strong ads usually carry under 40` })
  }

  return issues
}
