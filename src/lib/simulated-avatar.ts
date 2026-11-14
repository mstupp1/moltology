/**
 * Looks for simulated members. A seed-only config renders every bot as the same red or orange
 * lobster (see `resolveAvatarTraits`), so simulated members get a fully rolled character instead:
 * race, shell, body shape, face and backdrop, all picked at random from the creator's options.
 *
 * Claws and accessory are left out, like a member's own save (`commit_character` strips them):
 * those now come from worn gear.
 */
import {
  AVATAR_BUILDS,
  AVATAR_HEAD_SHAPES,
  AVATAR_RACES,
  AVATAR_TEMPERAMENTS,
  LOBSTER_AVATAR_STYLE,
  LOBSTER_EYE_COLORS,
  LOBSTER_EYE_VARIANTS,
  LOBSTER_EYELID_STYLES,
  LOBSTER_GAZES,
  LOBSTER_HEIGHTS,
  LOBSTER_PUPIL_VARIANTS,
  SHELL_FINISHES,
  SHELL_MARKINGS,
  SHELL_PALETTES,
  lockAvatarConfig,
  pickFrom,
  randomLobsterSeed,
  seededRandom,
  type AvatarRace,
  type LobsterAvatarConfig,
} from './lobster-avatar'

/** Expressions that read well on a stranger's face in a crowd. Angry, sad and shocked stay rare picks for real members. */
const FRIENDLY_EYELIDS = LOBSTER_EYELID_STYLES.filter((s) => !['angry', 'sad', 'shocked', 'worried'].includes(s))
/** Gaze toward the camera most of the time, so group shots do not look distracted. */
const GAZES = ['ahead', 'ahead', 'ahead', ...LOBSTER_GAZES.filter((g) => g !== 'ahead')] as const

const SHELL_IDS = SHELL_PALETTES.map((p) => p.id)

const round2 = (n: number) => Number(n.toFixed(2))
const between = (rng: () => number, min: number, max: number) => round2(min + rng() * (max - min))

/** What is stored for a simulated member: a pinned look, with no gear-owned fields. */
export type SimulatedAvatarConfig = Omit<LobsterAvatarConfig, 'equipment' | 'claws' | 'accessory' | 'still'>

export interface SimulatedLookHint {
  race?: AvatarRace
  shellColor?: string
}

/**
 * One random, fully pinned character. The same seed always rolls the same look.
 * `hint` lets a batch spread races and shell colours evenly instead of leaving it to chance.
 */
export function rollSimulatedAvatarConfig(seed: string = randomLobsterSeed(), hint: SimulatedLookHint = {}): SimulatedAvatarConfig {
  const rng = seededRandom(`${seed}:simulated-look`)
  const shellColor = hint.shellColor ?? pickFrom(rng, SHELL_IDS)
  const marking = rng() < 0.25 ? 'none' : pickFrom(rng, SHELL_MARKINGS)
  const config: LobsterAvatarConfig = {
    style: LOBSTER_AVATAR_STYLE,
    seed,
    race: hint.race ?? pickFrom(rng, AVATAR_RACES),
    shellColor,
    shellFinish: pickFrom(rng, SHELL_FINISHES),
    marking,
    headShape: pickFrom(rng, AVATAR_HEAD_SHAPES),
    build: pickFrom(rng, AVATAR_BUILDS),
    height: pickFrom(rng, LOBSTER_HEIGHTS),
    headScale: between(rng, 0.92, 1.1),
    armScale: between(rng, 0.8, 1.25),
    temperament: pickFrom(rng, AVATAR_TEMPERAMENTS),
    eyelidStyle: pickFrom(rng, FRIENDLY_EYELIDS),
    eyeColor: pickFrom(rng, LOBSTER_EYE_COLORS),
    eyeVariant: pickFrom(rng, LOBSTER_EYE_VARIANTS),
    pupilVariant: pickFrom(rng, LOBSTER_PUPIL_VARIANTS),
    gaze: pickFrom(rng, GAZES),
  }
  if (marking !== 'none') {
    config.markingScale = between(rng, 0.7, 1.5)
    if (rng() < 0.4) config.markingColor = pickFrom(rng, SHELL_IDS.filter((id) => id !== shellColor))
  }
  if (rng() < 0.3) config.bellyColor = pickFrom(rng, SHELL_IDS.filter((id) => id !== shellColor))

  // Pin the seeded fields too (mouth, antennae, backdrop) so the look never drifts.
  const { accessory: _a, claws: _c, equipment: _e, still: _s, ...locked } = lockAvatarConfig(config)
  return locked
}

function shuffled<T>(rng: () => number, list: readonly T[]): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Looks for a whole group of simulated members at once: races split evenly and shell colours
 * dealt from a shuffled deck, so no colour repeats until every one has been used.
 */
export function rollSimulatedCast(count: number, batchSeed: string = randomLobsterSeed()): SimulatedAvatarConfig[] {
  const rng = seededRandom(`${batchSeed}:cast`)
  const races = shuffled(rng, Array.from({ length: count }, (_, i) => AVATAR_RACES[i % AVATAR_RACES.length]))
  const shells: string[] = []
  while (shells.length < count) shells.push(...shuffled(rng, SHELL_IDS))
  return Array.from({ length: count }, (_, i) =>
    rollSimulatedAvatarConfig(`${batchSeed}-${i.toString(36)}`, { race: races[i], shellColor: shells[i] })
  )
}
