/**
 * Moltology mascot cast: the one list of rendered character cutouts.
 *
 * The composite studio (`MascotOverlay`) and the script compositor
 * (`scripts/lib/character-overlay.ts`) both build their registries from this
 * list, so a new render only needs registering here. Cutouts live in S3 under
 * `images/characters/`.
 */

export const MASCOT_S3_PREFIX = 'images/characters'

export interface MascotDefinition {
  key: string
  name: string
  filename: string
  description: string
}

const mascot = (key: string, name: string, filename: string, description: string): MascotDefinition => ({
  key,
  name,
  filename,
  description,
})

/** Named signature-look cast (v5, 2026-11-05). Historical role keys resolve below. */
export const MASCOT_CAST: MascotDefinition[] = [
  mascot(
    'lobster_rook_tide',
    'Rook Tide',
    'char_rook_tide_v5.webp',
    'Confident male red lobster with amber eyes, a cream belly and a common charcoal cyber chest plate with one cyan status light; bare pincers and no cape'
  ),
  mascot(
    'lobster_pip_current',
    'Pip Current',
    'char_pip_current_v4.webp',
    'Curious lavender lobster in a slouched navy knitted cap, with emerald eyes, a tentative smile and a copper keepsake ring on a wrist cord'
  ),
  mascot(
    'crab_mira_kelp',
    'Mira Kelp',
    'char_mira_kelp_v3.webp',
    'Enthusiastic jade-green crab with a heart-shaped shell, sapphire eyes and an ochre neckerchief'
  ),
  mascot(
    'crab_cal_brack',
    'Cal Brack',
    'char_cal_brack_v5.webp',
    'Patient cobalt-blue crab with a square shell, gold eyes and cream forehead patch, wearing a full mid-level gunmetal cyber armor set with brass edges, cyan lights, chest plate, utility belt, six armored walking legs and cyber pincers; head uncovered without a helmet'
  ),
  mascot(
    'lobster_tess_shoal',
    'Tess Shoal',
    'char_tess_shoal_v5.webp',
    'Attentive tall teal LGBTQIA+ lobster with amber eyes, mint underside and cream cheek patch, plum-purple mohawk, black leather biker vest with rainbow Pride patch and common gunmetal cyber claw casings'
  ),
  mascot(
    'lobster_faye_ripple',
    'Faye Ripple',
    'char_faye_ripple_v5.webp',
    'Sassy stylish rose-pink lobster with a sturdy softly square build, sapphire eyes, a raised brow and confident smirk, wearing a tailored aubergine blazer, ivory blouse and black belt with brass buckle; bare pincers and wrists without accessories'
  ),
]

export const DEFAULT_MASCOT_KEY = 'lobster_rook_tide'

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

export const RETIRED_MASCOT_SUCCESSORS: Record<string, string> = {
  ...LEGACY_ROLE_SUCCESSORS,
  lobster_clove_cinder: 'lobster_rook_tide',
}

const CAST_BY_KEY = new Map(MASCOT_CAST.map((m) => [m.key, m]))

/** Short names and retired file names that still resolve to a cast key. */
const MASCOT_ALIASES: Record<string, string> = {
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

// A named render's own file stem resolves to its canonical cast key.
for (const m of MASCOT_CAST) {
  MASCOT_ALIASES[m.filename.replace(/^char_/, '').replace(/\.[^/.]+$/, '')] = m.key
  MASCOT_ALIASES[m.name.toLowerCase()] = m.key
}

/**
 * Resolve a key, alias or file name to a cast key. Unknown names come back
 * stripped of `char_` and extension so callers can fall back to S3 by name.
 */
export function resolveMascotAlias(rawKey: string): string {
  let raw = rawKey.trim().toLowerCase()
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
