/**
 * Character creator trait catalogs: every choosable option, its label, and its look data.
 * Labels are user-facing, so they stay plain and short.
 */

export const AVATAR_RACES = ['lobster', 'crab'] as const
export type AvatarRace = (typeof AVATAR_RACES)[number]
export const AVATAR_RACE_LABELS: Readonly<Record<AvatarRace, string>> = {
  lobster: 'Lobster',
  crab: 'Crab',
}

export interface ShellPalette {
  id: string
  label: string
  highlight: string
  base: string
  shade: string
  /** Darkest tone, used for the outline and brows. */
  deep: string
  belly: string
  bellyShade: string
  marking: string
  blush: string
  /** Palette used for the other half of a split shell. */
  splitWith: string
}

export const SHELL_PALETTES: readonly ShellPalette[] = [
  { id: 'coral', label: 'Coral', highlight: '#ffb48c', base: '#f2643f', shade: '#c23a26', deep: '#6e1a12', belly: '#ffe3c6', bellyShade: '#eeb28a', marking: '#9e2416', blush: '#ff5a6e', splitWith: 'cobalt' },
  { id: 'crimson', label: 'Crimson', highlight: '#ff9a9a', base: '#d7263d', shade: '#9c1530', deep: '#4f0a1a', belly: '#ffdcd4', bellyShade: '#eea69e', marking: '#640c20', blush: '#ff6f8a', splitWith: 'sunflower' },
  { id: 'tangerine', label: 'Tangerine', highlight: '#ffd593', base: '#ff8a1f', shade: '#d4590a', deep: '#6e2a05', belly: '#fff1d8', bellyShade: '#f5c68c', marking: '#b03f08', blush: '#ff6a5a', splitWith: 'lagoon' },
  { id: 'sunflower', label: 'Sunflower', highlight: '#fff6b8', base: '#ffcb2e', shade: '#e0920c', deep: '#6e4205', belly: '#fffbe8', bellyShade: '#f2d897', marking: '#c46a06', blush: '#ff8a5c', splitWith: 'crimson' },
  { id: 'cobalt', label: 'Cobalt', highlight: '#a6dcff', base: '#2f7ff0', shade: '#1c4fb8', deep: '#0a2259', belly: '#e4f2ff', bellyShade: '#a8c7ef', marking: '#10357f', blush: '#ff7aa8', splitWith: 'coral' },
  { id: 'lagoon', label: 'Lagoon', highlight: '#a8f7e8', base: '#18b7a6', shade: '#0d7f7a', deep: '#043a3b', belly: '#e4fff8', bellyShade: '#a3e3d4', marking: '#065654', blush: '#ff7f9a', splitWith: 'tangerine' },
  { id: 'orchid', label: 'Orchid', highlight: '#f2c8ff', base: '#b25cf0', shade: '#7a2fc0', deep: '#370d66', belly: '#f8ecff', bellyShade: '#d6b6ee', marking: '#541a8e', blush: '#ff7ac0', splitWith: 'jade' },
  { id: 'bubblegum', label: 'Bubblegum', highlight: '#ffd6ea', base: '#ff7ab8', shade: '#e04490', deep: '#701248', belly: '#fff2f8', bellyShade: '#f5bcd6', marking: '#b8286f', blush: '#ff4f8f', splitWith: 'lagoon' },
  { id: 'jade', label: 'Jade', highlight: '#d8f7a8', base: '#6fbf3a', shade: '#3e8a24', deep: '#1a400e', belly: '#f3ffe2', bellyShade: '#c5e3a2', marking: '#286516', blush: '#ff8a7a', splitWith: 'orchid' },
  { id: 'ghost', label: 'Ghost', highlight: '#ffffff', base: '#e6e2f4', shade: '#b4acd4', deep: '#4f4878', belly: '#ffffff', bellyShade: '#d8d3ec', marking: '#9d94cb', blush: '#ff9ab8', splitWith: 'obsidian' },
  { id: 'obsidian', label: 'Obsidian', highlight: '#7b8ea4', base: '#2f3948', shade: '#181f2a', deep: '#05070b', belly: '#a4b5c6', bellyShade: '#6f8195', marking: '#00e5ff', blush: '#ff6f91', splitWith: 'ghost' },
  { id: 'gold', label: 'Molten Gold', highlight: '#fff3bf', base: '#f2b632', shade: '#c47d12', deep: '#5c3604', belly: '#fff8de', bellyShade: '#eed18b', marking: '#8a5008', blush: '#ff7a5c', splitWith: 'obsidian' },
] as const

export const SHELL_PALETTE_MAP: Readonly<Record<string, ShellPalette>> = Object.fromEntries(
  SHELL_PALETTES.map((p) => [p.id, p])
)

export const SHELL_FINISHES = ['glossy', 'satin', 'pearl', 'chrome', 'glow'] as const
export type ShellFinish = (typeof SHELL_FINISHES)[number]
export const SHELL_FINISH_LABELS: Readonly<Record<ShellFinish, string>> = {
  glossy: 'Glossy',
  satin: 'Satin',
  pearl: 'Pearlescent',
  chrome: 'Chrome',
  glow: 'Bioluminescent',
}

export const SHELL_MARKINGS = ['none', 'spots', 'freckles', 'bands', 'tiger', 'stardust', 'calico', 'split', 'circuit'] as const
export type ShellMarking = (typeof SHELL_MARKINGS)[number]
export const SHELL_MARKING_LABELS: Readonly<Record<ShellMarking, string>> = {
  none: 'Clean',
  spots: 'Spots',
  freckles: 'Freckles',
  bands: 'Bands',
  tiger: 'Tiger',
  stardust: 'Stardust',
  calico: 'Calico',
  split: 'Split',
  circuit: 'Circuit',
}

export const AVATAR_MOUTHS = ['grin', 'smile', 'beam', 'smirk', 'tongue', 'fang', 'oh'] as const
export type AvatarMouth = (typeof AVATAR_MOUTHS)[number]
export const AVATAR_MOUTH_LABELS: Readonly<Record<AvatarMouth, string>> = {
  grin: 'Grin',
  smile: 'Smile',
  beam: 'Big laugh',
  smirk: 'Smirk',
  tongue: 'Cheeky',
  fang: 'Snaggletooth',
  oh: 'Surprised',
}

export const AVATAR_ANTENNAE = ['whip', 'curl', 'plume', 'bolt', 'beacon'] as const
export type AvatarAntennae = (typeof AVATAR_ANTENNAE)[number]
export const AVATAR_ANTENNAE_LABELS: Readonly<Record<AvatarAntennae, string>> = {
  whip: 'Classic whips',
  curl: 'Curls',
  plume: 'Plumes',
  bolt: 'Lightning',
  beacon: 'Glow bulbs',
}

export const AVATAR_CLAWS = ['classic', 'crusher', 'slim', 'mitten'] as const
export type AvatarClaws = (typeof AVATAR_CLAWS)[number]
export const AVATAR_CLAW_LABELS: Readonly<Record<AvatarClaws, string>> = {
  classic: 'Classic',
  crusher: 'Crusher',
  slim: 'Slender',
  mitten: 'Mittens',
}

export const AVATAR_POSES = ['cheer', 'wave', 'rest', 'flex'] as const
export type AvatarPose = (typeof AVATAR_POSES)[number]
export const AVATAR_POSE_LABELS: Readonly<Record<AvatarPose, string>> = {
  cheer: 'Cheer',
  wave: 'Wave',
  rest: 'Relaxed',
  flex: 'Flex',
}

export const AVATAR_ACCESSORIES = ['none', 'hard_hat', 'crown', 'visor', 'headset', 'halo', 'bow', 'beanie'] as const
export type AvatarAccessory = (typeof AVATAR_ACCESSORIES)[number]
export const AVATAR_ACCESSORY_LABELS: Readonly<Record<AvatarAccessory, string>> = {
  none: 'None',
  hard_hat: 'Hard hat',
  crown: 'Crown',
  visor: 'HUD visor',
  headset: 'Headset',
  halo: 'Halo',
  bow: 'Bow',
  beanie: 'Beanie',
}

/** Head silhouette. For crabs this is the shell, so the labels change with the race. */
export const AVATAR_HEAD_SHAPES = ['bean', 'round', 'tall', 'wide', 'square', 'heart'] as const
export type AvatarHeadShape = (typeof AVATAR_HEAD_SHAPES)[number]
export const AVATAR_HEAD_SHAPE_LABELS: Readonly<Record<AvatarRace, Record<AvatarHeadShape, string>>> = {
  lobster: { bean: 'Bean', round: 'Round', tall: 'Tall', wide: 'Wide', square: 'Boxy', heart: 'Pear' },
  crab: { bean: 'Oval', round: 'Dome', tall: 'Tall dome', wide: 'Wide', square: 'Boxy', heart: 'Heart' },
}

/** Body build: torso and tail for lobsters, leg weight and belly depth for crabs. */
export const AVATAR_BUILDS = ['classic', 'slim', 'chunky', 'barrel', 'tapered'] as const
export type AvatarBuild = (typeof AVATAR_BUILDS)[number]
export const AVATAR_BUILD_LABELS: Readonly<Record<AvatarRace, Record<AvatarBuild, string>>> = {
  lobster: { classic: 'Classic', slim: 'Slim', chunky: 'Chunky', barrel: 'Barrel', tapered: 'Tapered' },
  crab: { classic: 'Classic', slim: 'Spindly', chunky: 'Sturdy', barrel: 'Barrel', tapered: 'Pointy' },
}

export const AVATAR_EXPRESSION_LABELS: Readonly<Record<string, string>> = {
  open: 'Bright',
  relaxed: 'Easygoing',
  cheerful_squint: 'Beaming',
  focused: 'Focused',
  chill: 'Sleepy',
  angry: 'Fierce',
  worried: 'Nervous',
}

/** Small deterministic PRNG so seeds always roll the same character. */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pickFrom<T>(rng: () => number, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length) % list.length]
}

export function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value)
}
