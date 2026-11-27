/**
 * The site's look for video: colours from tailwind.config.js and docs/design/ui-tokens.md,
 * Inter for text and Space Grotesk for titles (self-hosted in public/fonts), sized for a
 * 1920x1080 frame watched on a laptop or a phone held sideways.
 */
import { loadFont } from '@remotion/fonts'
import { staticFile } from 'remotion'

export const C = {
  abyss: '#030708',
  surface1: '#0a1112',
  surface2: '#101a1c',
  surface3: '#172325',
  deep: '#06232b',
  ink: '#e4e9e9',
  inkBody: '#c3cdcd',
  inkMuted: '#8fa0a0',
  line: 'rgba(150, 170, 170, 0.35)',
  lineSubtle: 'rgba(150, 170, 170, 0.14)',
  cyan: '#00c3ff',
  cyanSoft: 'rgba(0, 195, 255, 0.14)',
  crimson: '#ff453a',
  crimsonSoft: 'rgba(255, 69, 58, 0.14)',
  amber: '#f59e0b',
  shell: '#e0673a',
} as const

export const FONT = {
  text: 'Inter, sans-serif',
  title: '"Space Grotesk", Inter, sans-serif',
} as const

/** Type scale for 1080p: every size on screen comes from here. */
export const TYPE = {
  eyebrow: 26,
  caption: 30,
  body: 40,
  label: 48,
  heading: 72,
  display: 120,
} as const

let fontsLoaded: Promise<unknown> | null = null

export function loadBrandFonts() {
  fontsLoaded ??= Promise.all([
    loadFont({ family: 'Inter', url: staticFile('fonts/inter-latin.woff2'), weight: '400 700' }),
    loadFont({ family: 'Space Grotesk', url: staticFile('fonts/space-grotesk-latin.woff2'), weight: '300 700' }),
  ])
  return fontsLoaded
}
