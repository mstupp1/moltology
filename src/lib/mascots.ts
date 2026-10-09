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

/** Rendered cast (v2, 2026-10-08). Adults first, then juniors. */
export const MASCOT_CAST: MascotDefinition[] = [
  mascot(
    'lobster_pointing',
    'Lobster Pointing (CTA / Hero)',
    'char_lobster_pointing_adult_v2.webp',
    'Coral lobster raising a claw toward the call to action'
  ),
  mascot(
    'lobster_thumbs_up',
    'Lobster Approval (Raised Claw)',
    'char_lobster_thumbs_up_adult_v2.webp',
    'Cheerful orange lobster raising one claw in approval'
  ),
  mascot(
    'lobster_navigator',
    'Lobster Navigator (Explorer)',
    'char_lobster_navigator_adult_v2.webp',
    'Lobster explorer in brass goggles and a canvas field harness, waving'
  ),
  mascot(
    'lobster_engineer',
    'Lobster Engineer (Hardhat)',
    'char_lobster_engineer_adult_v2.webp',
    'Lobster engineer in a yellow hardhat with a blueprint tablet and wrench belt'
  ),
  mascot(
    'lobster_peaceful',
    'Lobster Peaceful (Lavender Calm)',
    'char_lobster_peaceful_adult_v2.webp',
    'Serene lavender lobster in a teal vest, claws open and relaxed'
  ),
  mascot(
    'lobster_peek',
    'Lobster Bashful (Shy Smile)',
    'char_lobster_peek_adult_v2.webp',
    'Pink lobster with claws clasped under its chin and a shy smile'
  ),
  mascot(
    'lobster_archivist',
    'Lobster Archivist (Scripture Keeper)',
    'char_lobster_archivist_adult_v2.webp',
    'Thoughtful lobster in a dark cloak holding a bound codex'
  ),
  mascot(
    'lobster_oracle_attendant',
    'Lobster Oracle Attendant',
    'char_lobster_oracle_attendant_adult_v2.webp',
    'Pale gold lobster in a teal mantle holding a glowing sea-glass orb'
  ),
  mascot(
    'crab_stats',
    'Crab Stats (Metrics)',
    'char_crab_stats_adult_v2.webp',
    'Coral crab holding up a bar chart tablet'
  ),
  mascot(
    'crab_builder',
    'Crab Builder (Hardhat)',
    'char_crab_builder_adult_v2.webp',
    'Magenta crab builder in a hardhat and plated harness, wrench raised'
  ),
  mascot(
    'crab_explorer',
    'Crab Explorer (Compass)',
    'char_crab_explorer_adult_v2.webp',
    'Blue crab explorer with goggles, compass and field satchel'
  ),
  mascot(
    'crab_sentinel',
    'Crab Sentinel (Shield)',
    'char_crab_sentinel_adult_v2.webp',
    'Navy armored crab standing guard behind a raised shield'
  ),
  mascot(
    'crab_ritual_keeper',
    'Crab Ritual Keeper (Bell)',
    'char_crab_ritual_keeper_adult_v2.webp',
    'Orange crab in a teal cape ringing a brass bell, tablet in claw'
  ),
  mascot(
    'lobster_pointing_junior',
    'Junior Lobster Pointing',
    'char_lobster_pointing_junior_v2.webp',
    'Young coral lobster with both claws up and a big grin'
  ),
  mascot(
    'lobster_thumbs_up_junior',
    'Junior Lobster Approval',
    'char_lobster_thumbs_up_junior_v2.webp',
    'Young orange lobster raising one claw in approval'
  ),
  mascot(
    'lobster_navigator_junior',
    'Junior Lobster Navigator',
    'char_lobster_navigator_junior_v2.webp',
    'Young lobster explorer in goggles and harness, both claws up'
  ),
  mascot(
    'lobster_engineer_junior',
    'Junior Lobster Engineer',
    'char_lobster_engineer_junior_v2.webp',
    'Young lobster engineer in a hardhat with a blueprint tablet'
  ),
  mascot(
    'lobster_peaceful_junior',
    'Junior Lobster Peaceful',
    'char_lobster_peaceful_junior_v2.webp',
    'Young lavender lobster in a teal vest, calm and content'
  ),
  mascot(
    'lobster_peek_junior',
    'Junior Lobster Bashful',
    'char_lobster_peek_junior_v2.webp',
    'Young pink lobster with claws clasped and wide blue eyes'
  ),
  mascot(
    'crab_stats_junior',
    'Junior Crab Stats',
    'char_crab_stats_junior_v2.webp',
    'Young coral crab holding up a bar chart tablet'
  ),
  mascot(
    'crab_builder_junior',
    'Junior Crab Builder',
    'char_crab_builder_junior_v2.webp',
    'Young violet crab builder in a hardhat, wrench raised'
  ),
  mascot(
    'crab_explorer_junior',
    'Junior Crab Explorer',
    'char_crab_explorer_junior_v2.webp',
    'Young teal crab explorer with goggles, compass and satchel'
  ),
]

export const DEFAULT_MASCOT_KEY = 'lobster_thumbs_up'

const CAST_BY_KEY = new Map(MASCOT_CAST.map((m) => [m.key, m]))

/** Short names and retired file names that still resolve to a cast key. */
const MASCOT_ALIASES: Record<string, string> = {
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

// A render's own file name (e.g. char_lobster_pointing_adult_v2.webp) resolves to its key.
for (const m of MASCOT_CAST) {
  MASCOT_ALIASES[m.filename.replace(/^char_/, '').replace(/\.[^/.]+$/, '')] = m.key
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
  return MASCOT_ALIASES[raw] ?? raw
}

export function getMascotDefinition(key: string): MascotDefinition | undefined {
  return CAST_BY_KEY.get(key)
}

export function getMascotKeys(): string[] {
  return MASCOT_CAST.map((m) => m.key)
}

/** Crab renders are near-square; lobsters are tall. Templates size the two shapes differently. */
export function isCrabMascot(rawKey: string): boolean {
  return resolveMascotAlias(rawKey).startsWith('crab_')
}
