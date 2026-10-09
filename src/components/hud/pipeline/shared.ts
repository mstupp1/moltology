import { getAssetUrl } from '@/lib/assets'
import { MAX_DEPTH_M, MAX_TORQUE_NM, type Clearance } from '@/lib/pipeline-explorer'

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

export type ScanLens = 'visible' | 'xray' | 'sonar'

export const SCAN_LENSES: Array<{ value: ScanLens; label: string; filter: string }> = [
  { value: 'visible', label: 'Visible', filter: 'none' },
  { value: 'xray', label: 'X-ray', filter: 'grayscale(1) invert(1) contrast(1.35) brightness(0.95)' },
  { value: 'sonar', label: 'Sonar', filter: 'grayscale(1) sepia(1) hue-rotate(150deg) saturate(4) brightness(0.9)' },
]

export type MetricKey = 'hardness' | 'torque' | 'depth'

export interface MetricReading {
  key: MetricKey
  label: string
  /** The everyday thing the reading stands for. */
  meaning: string
  value: string
  ratio: number
  /** Hotspot position over the specimen, in percent of the scanner. */
  spot: { x: number; y: number }
}

function rangeLabel(from: number, to: number, unit: string): string {
  const fmt = (n: number) => n.toLocaleString('en-US')
  return from === to ? `${fmt(to)} ${unit}` : `${fmt(from)}–${fmt(to)} ${unit}`
}

export function metricReadings(clearance: Clearance): MetricReading[] {
  const { sub } = clearance
  return [
    {
      key: 'hardness',
      label: 'Shell Hardness',
      meaning: 'Not flinching at drama.',
      value: `${sub.shellHardnessTarget}%`,
      ratio: sub.shellHardnessTarget / 100,
      spot: { x: 33, y: 34 },
    },
    {
      key: 'torque',
      label: 'Pincer Torque',
      meaning: 'Finishing the thing you started.',
      value: sub.pincerTorqueTarget.replace(/\s*-\s*/, '–'),
      ratio: clearance.torqueNm / MAX_TORQUE_NM,
      spot: { x: 69, y: 50 },
    },
    {
      key: 'depth',
      label: 'Submergence Depth',
      meaning: 'Holding focus below the noise.',
      value: rangeLabel(clearance.depthFromM, clearance.depthToM, 'm'),
      ratio: clearance.depthToM / MAX_DEPTH_M,
      spot: { x: 45, y: 71 },
    },
  ]
}

export function formatXp(xp: number): string {
  return `${Math.max(0, Math.floor(xp)).toLocaleString('en-US')} XP`
}
