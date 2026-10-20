import { getAssetUrl } from '@/lib/assets'
import { stageXpRange, type Clearance } from '@/lib/pipeline-explorer'

/** Per-stage accent. Classes are spelled out so Tailwind keeps them; hex is for SVG and gradients. */
export const STAGE_ACCENT: Record<number, { hex: string; rgb: string; text: string; border: string; bg: string }> = {
  1: { hex: '#ff6a60', rgb: '255, 106, 96', text: 'text-crimson-text', border: 'border-crimson-aggro', bg: 'bg-crimson-aggro' },
  2: { hex: '#00c3ff', rgb: '0, 195, 255', text: 'text-cyan-glow', border: 'border-cyan-glow', bg: 'bg-cyan-glow' },
  3: { hex: '#c084fc', rgb: '192, 132, 252', text: 'text-purple-400', border: 'border-purple-400', bg: 'bg-purple-400' },
  4: { hex: '#34d399', rgb: '52, 211, 153', text: 'text-emerald-400', border: 'border-emerald-400', bg: 'bg-emerald-400' },
}

export function stageAccent(stageNum: number) {
  return STAGE_ACCENT[stageNum] ?? STAGE_ACCENT[2]
}

/** The stage art as the lighter webp encode that sits next to each png in the asset bucket. */
export function stageArtUrl(img: string): string {
  return getAssetUrl(img.replace(/\.png$/, '.webp'))
}

/** "STAGE 1: THE LARVAL INITIATE" -> "THE LARVAL INITIATE". */
export function stageName(stageTitle: string): string {
  return stageTitle.replace(/^STAGE \d+:\s*/i, '')
}

export interface Reading {
  label: string
  /** The everyday thing the reading stands for. */
  meaning: string
}

export const READINGS: Reading[] = [
  { label: 'Shell hardness', meaning: 'Not flinching at drama.' },
  { label: 'Pincer torque', meaning: 'Finishing the thing you started.' },
  { label: 'Depth', meaning: 'Holding focus below the noise.' },
]

function rangeLabel(from: number, to: number, unit: string): string {
  const fmt = (n: number) => n.toLocaleString('en-US')
  return from === to ? `${fmt(to)} ${unit}` : `${fmt(from)}–${fmt(to)} ${unit}`
}

/** The typical readings for a clearance, in the same order as READINGS. */
export function readingValues(clearance: Clearance): string[] {
  const { sub } = clearance
  return [
    `${sub.shellHardnessTarget}%`,
    sub.pincerTorqueTarget.replace(/\s*-\s*/, '–'),
    rangeLabel(clearance.depthFromM, clearance.depthToM, 'm'),
  ]
}

export function formatXp(xp: number): string {
  return `${Math.max(0, Math.floor(xp)).toLocaleString('en-US')} XP`
}

export function xpRangeLabel(stageNum: number): string {
  const { minXp, maxXp } = stageXpRange(stageNum)
  const fmt = (n: number) => n.toLocaleString('en-US')
  return maxXp === null ? `${fmt(minXp)}+ XP` : `${fmt(minXp)}–${fmt(maxXp)} XP`
}

export function stageSectionId(stageNum: number): string {
  return `stage-${stageNum}`
}

export function clearanceRowId(code: string): string {
  return `clearance-${code}`
}
