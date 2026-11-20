/**
 * Moltology mascot cast: the content cast's 3D characters as the composite studio sees them.
 *
 * The cast itself (looks, roles, voices) lives in content/characters/cast.json (see `src/lib/cast.ts`).
 * Each member's stills are rendered from the 3D character code by `npm run cast:render` and
 * published under `images/characters/`; the composite studio (`MascotOverlay`) and the script
 * compositor (`scripts/lib/character-overlay.ts`) both build their registries from this list.
 * The 2D cutouts of earlier casts stay in the bucket for old posts; their keys resolve to the
 * 3D successors below.
 */
import { CAST, DEFAULT_CAST_KEY, castMember, castStillFilename, splitPose } from './cast'
import type { AvatarPose } from './avatar/traits'

export const MASCOT_S3_PREFIX = 'images/characters'

export interface MascotDefinition {
  key: string
  name: string
  filename: string
  description: string
}

/** The 3D content cast, signature pose. */
export const MASCOT_CAST: MascotDefinition[] = CAST.map((m) => ({
  key: m.key,
  name: m.name,
  filename: castStillFilename(m),
  description: m.description,
}))

/** The still for a cast key in another pose (`key:pose` in specs and `--mascot`). */
export function mascotFilenameForPose(key: string, pose: AvatarPose): string | undefined {
  const member = castMember(key)
  return member ? castStillFilename(member, pose) : undefined
}

export { splitPose }

export const DEFAULT_MASCOT_KEY = DEFAULT_CAST_KEY

/** The 2D named cast (v5) replaced by the 3D cast on 2026-11-20, mapped to the nearest 3D role. */
const RETIRED_2D_CAST: Record<string, string> = {
  lobster_rook_tide: 'lobster_sol_ember',
  lobster_pip_current: 'lobster_kit_shallows',
  crab_mira_kelp: 'crab_moss_tern',
  crab_cal_brack: 'crab_otto_basalt',
  lobster_tess_shoal: 'lobster_vera_drift',
  lobster_faye_ripple: 'lobster_nell_quill',
}

/** Retired selections remain readable in saved layouts without entering the active cast. */
const LEGACY_ROLE_SUCCESSORS: Record<string, string> = {
  lobster_pointing: 'lobster_rook_tide',
  lobster_thumbs_up: 'lobster_rook_tide',
  lobster_navigator: 'lobster_tess_shoal',
  lobster_engineer: 'lobster_faye_ripple',
  lobster_peaceful: 'lobster_rook_tide',
  lobster_peek: 'lobster_pip_current',
  lobster_archivist: 'lobster_rook_tide',
  lobster_oracle_attendant: 'lobster_pip_current',
  crab_stats: 'crab_cal_brack',
  crab_builder: 'crab_cal_brack',
  crab_explorer: 'crab_mira_kelp',
  crab_sentinel: 'crab_cal_brack',
  crab_ritual_keeper: 'crab_mira_kelp',
  lobster_pointing_junior: 'lobster_rook_tide',
  lobster_thumbs_up_junior: 'lobster_rook_tide',
  lobster_navigator_junior: 'lobster_tess_shoal',
  lobster_engineer_junior: 'lobster_faye_ripple',
  lobster_peaceful_junior: 'lobster_rook_tide',
  lobster_peek_junior: 'lobster_pip_current',
  crab_stats_junior: 'crab_cal_brack',
  crab_builder_junior: 'crab_cal_brack',
  crab_explorer_junior: 'crab_mira_kelp',
}

export const RETIRED_MASCOT_SUCCESSORS: Record<string, string> = Object.fromEntries(
  Object.entries({ ...LEGACY_ROLE_SUCCESSORS, lobster_clove_cinder: 'lobster_rook_tide', ...RETIRED_2D_CAST }).map(([k, v]) => [
    k,
    RETIRED_2D_CAST[v] ?? v,
  ])
)

const CAST_BY_KEY = new Map(MASCOT_CAST.map((m) => [m.key, m]))

/** Short names and retired file names that still resolve to a cast key. */
const MASCOT_ALIASES: Record<string, string> = {
  'rook tide': 'lobster_rook_tide',
  'pip current': 'lobster_pip_current',
  'mira kelp': 'crab_mira_kelp',
  'cal brack': 'crab_cal_brack',
  'tess shoal': 'lobster_tess_shoal',
  'faye ripple': 'lobster_faye_ripple',
  rook_tide_v5: 'lobster_rook_tide',
  pip_current_v4: 'lobster_pip_current',
  mira_kelp_v3: 'crab_mira_kelp',
  cal_brack_v5: 'crab_cal_brack',
  tess_shoal_v5: 'lobster_tess_shoal',
  faye_ripple_v5: 'lobster_faye_ripple',
  rook_tide_v4: 'lobster_rook_tide',
  cal_brack_v4: 'crab_cal_brack',
  tess_shoal_v4: 'lobster_tess_shoal',
  faye_ripple_v4: 'lobster_faye_ripple',
  rook: 'lobster_rook_tide',
  rook_tide: 'lobster_rook_tide',
  pip_current_v3: 'lobster_pip_current',
  cal_brack_v3: 'crab_cal_brack',
  tess_shoal_v3: 'lobster_tess_shoal',
  faye_ripple_v3: 'lobster_faye_ripple',
  clove_cinder_v3: 'lobster_clove_cinder',
  'clove cinder': 'lobster_clove_cinder',
  pip: 'lobster_pip_current',
  pip_current: 'lobster_pip_current',
  mira: 'crab_mira_kelp',
  mira_kelp: 'crab_mira_kelp',
  cal: 'crab_cal_brack',
  cal_brack: 'crab_cal_brack',
  clove: 'lobster_rook_tide',
  clove_cinder: 'lobster_rook_tide',
  tess: 'lobster_tess_shoal',
  tess_shoal: 'lobster_tess_shoal',
  faye: 'lobster_faye_ripple',
  faye_ripple: 'lobster_faye_ripple',
  pointing: 'lobster_pointing',
  cta: 'lobster_pointing',
  lobster_cta: 'lobster_pointing',
  lobster_pointing_cta: 'lobster_pointing',
  peek: 'lobster_peek',
  corner_peek: 'lobster_peek',
  lobster_corner_peek: 'lobster_peek',
  bashful: 'lobster_peek',
  stats: 'crab_stats',
  pointing_stats: 'crab_stats',
  crab_pointing_stats: 'crab_stats',
  navigator: 'lobster_navigator',
  explorer: 'lobster_navigator',
  lobster_speed_action: 'lobster_navigator',
  speed_action: 'lobster_navigator',
  lobster_action: 'lobster_navigator',
  action: 'lobster_navigator',
  speed: 'lobster_navigator',
  peaceful: 'lobster_peaceful',
  floating_peaceful: 'lobster_peaceful',
  lobster_floating_peaceful: 'lobster_peaceful',
  zen: 'lobster_peaceful',
  floating: 'lobster_peaceful',
  engineer: 'lobster_engineer',
  diagnostic: 'lobster_engineer',
  hardhat: 'lobster_engineer',
  thumbs_up: 'lobster_thumbs_up',
  thumbs: 'lobster_thumbs_up',
  approval: 'lobster_thumbs_up',
  lobster_thumbs: 'lobster_thumbs_up',
  archivist: 'lobster_archivist',
  oracle_attendant: 'lobster_oracle_attendant',
  attendant: 'lobster_oracle_attendant',
  builder: 'crab_builder',
  sentinel: 'crab_sentinel',
  ritual_keeper: 'crab_ritual_keeper',
}

// Accept retired keys and exact v2 file stems, including junior variants.
for (const key of Object.keys(LEGACY_ROLE_SUCCESSORS)) {
  const stem = key.endsWith('_junior') ? `${key}_v2` : `${key}_adult_v2`
  MASCOT_ALIASES[stem] = key
}

// Every render version of the retired 2D cast (char_rook_tide_v3.png, ...).
for (const key of Object.keys(RETIRED_2D_CAST)) {
  const stem = key.replace(/^(lobster|crab)_/, '')
  for (const v of [2, 3, 4, 5]) MASCOT_ALIASES[`${stem}_v${v}`] ??= key
}

// Each cast member's name, aliases and published still file stems resolve to its key.
for (const m of CAST) {
  MASCOT_ALIASES[m.name.toLowerCase()] = m.key
  MASCOT_ALIASES[m.key.replace(/^(lobster|crab)_/, '')] = m.key
  for (const alias of m.aliases) MASCOT_ALIASES[alias.toLowerCase()] = m.key
}
for (const m of MASCOT_CAST) MASCOT_ALIASES[m.filename.replace(/^char_/, '').replace(/\.[^/.]+$/, '')] = m.key

/**
 * Resolve a key, alias or file name to a cast key. Unknown names come back
 * stripped of `char_` and extension so callers can fall back to S3 by name.
 */
export function resolveMascotAlias(rawKey: string): string {
  let raw = splitPose(rawKey.trim()).key.trim().toLowerCase()
  if (/\.(png|jpe?g|webp)$/.test(raw)) raw = raw.replace(/\.[^/.]+$/, '')
  if (raw.startsWith('char_')) raw = raw.slice('char_'.length)
  if (CAST_BY_KEY.has(raw)) return raw
  const alias = MASCOT_ALIASES[raw] ?? raw
  return RETIRED_MASCOT_SUCCESSORS[alias] ?? alias
}

export function getMascotDefinition(key: string): MascotDefinition | undefined {
  return CAST_BY_KEY.get(resolveMascotAlias(key))
}

export function getMascotKeys(): string[] {
  return MASCOT_CAST.map((m) => m.key)
}

/** Preserve species-aware template sizing after resolving historical role keys. */
export function isCrabMascot(rawKey: string): boolean {
  return resolveMascotAlias(rawKey).startsWith('crab_')
}
