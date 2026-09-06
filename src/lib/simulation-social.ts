import type {
  MemberBondKind,
  MemberJoinSource,
  SimulatedPersonaConfig,
  SimulatedTrait,
} from '../db/schema'

export type Rng = () => number

export const DEFAULT_MUTATION_CHANCE = 0.12
export const DEFAULT_MAX_TRAITS_PER_MEMBER = 3
export const DEFAULT_CONNECTION_CHANCE = 0.22
export const DEFAULT_BOND_CHANCE = 0.1
export const DEFAULT_MAX_BONDS_PER_MEMBER = 4

export const DEFAULT_JOIN_SOURCE_WEIGHTS: Record<MemberJoinSource, number> = {
  organic: 0.45,
  word_of_mouth: 0.35,
  brought_in: 0.2,
}

/** Mild, unique personality mutations. Labels stay plain and human-readable. */
export const SIMULATED_TRAIT_CATALOG: SimulatedTrait[] = [
  {
    id: 'pre_dawn_lock',
    label: 'Pre-dawn locker',
    description: 'Shows up for first light before the rest of the trench stirs.',
  },
  {
    id: 'quiet_depth',
    label: 'Quiet-depth walker',
    description: 'Talks less in the forum, then drops one useful line.',
  },
  {
    id: 'metric_scribe',
    label: 'Metric scribe',
    description: 'Keeps a private ledger of shell hardness and pincer torque.',
  },
  {
    id: 'warm_hail',
    label: 'Warm hail',
    description: 'Greets new larvae by name and means it.',
  },
  {
    id: 'soft_shed_nurse',
    label: 'Soft-shed nurse',
    description: 'Checks on anyone in a vulnerable window.',
  },
  {
    id: 'cold_plunge',
    label: 'Cold-plunge regular',
    description: 'Treats the plunge as a standing appointment, not a mood.',
  },
  {
    id: 'night_watch',
    label: 'Night-watch shell',
    description: 'Most active after the surface goes quiet.',
  },
  {
    id: 'doctrine_cite',
    label: 'Doctrine citer',
    description: 'Answers with a short scripture line, then the practical step.',
  },
  {
    id: 'pincer_finisher',
    label: 'Pincer finisher',
    description: 'Closes the tab, then the task, then the day.',
  },
  {
    id: 'slow_molt',
    label: 'Slow molt',
    description: 'Takes ecdysis in small sheds and does not rush the new shell.',
  },
  {
    id: 'reef_tinkerer',
    label: 'Reef tinkerer',
    description: 'Always adjusting a small ritual until it fits.',
  },
  {
    id: 'dry_trench_wit',
    label: 'Dry-trench wit',
    description: 'Deadpan asides that land because everything else was serious.',
  },
  {
    id: 'streak_keeper',
    label: 'Streak keeper',
    description: 'Protects the daily alignment chain like a molted claw.',
  },
  {
    id: 'mentor_lean',
    label: 'Mentor lean',
    description: 'Would rather teach a larva than flex a number.',
  },
  {
    id: 'solo_trench',
    label: 'Solo trench',
    description: 'Works alone first, then reports back with findings.',
  },
  {
    id: 'chorus_voice',
    label: 'Chorus voice',
    description: 'Shows up in threads to keep the tone constructive.',
  },
  {
    id: 'pressure_calm',
    label: 'Pressure-calm',
    description: 'Stays even when the surface is noisy.',
  },
  {
    id: 'chassis_fuss',
    label: 'Chassis fuss',
    description: 'Cares a little too much about which hardpoint is showing.',
  },
  {
    id: 'early_questioner',
    label: 'Early questioner',
    description: 'Asks the obvious thing everyone else was circling.',
  },
  {
    id: 'last_reply_closer',
    label: 'Last-reply closer',
    description: 'Sums up a thread so it can actually end.',
  },
]

export function rollChance(probability: number, rng: Rng = Math.random): boolean {
  if (probability <= 0) return false
  if (probability >= 1) return true
  return rng() < probability
}

export function pickNewTrait(
  existingIds: Iterable<string>,
  catalog: SimulatedTrait[] = SIMULATED_TRAIT_CATALOG,
  rng: Rng = Math.random
): SimulatedTrait | null {
  const taken = new Set(existingIds)
  const available = catalog.filter((trait) => !taken.has(trait.id))
  if (available.length === 0) return null
  const index = Math.min(available.length - 1, Math.floor(rng() * available.length))
  return available[index] ?? null
}

export function applyTraitMutation(
  persona: SimulatedPersonaConfig | null | undefined,
  trait: SimulatedTrait,
  acquiredAt = new Date().toISOString()
): SimulatedPersonaConfig {
  const base: SimulatedPersonaConfig = persona || { archetype: 'Acolyte', tone: 'Steadfast' }
  const nextTrait: SimulatedTrait = {
    id: trait.id,
    label: trait.label,
    description: trait.description,
    acquiredAt,
  }
  return {
    ...base,
    traits: [...(base.traits || []).filter((row) => row.id !== trait.id), nextTrait],
  }
}

export function sampleJoinOrigin(
  sponsorCount: number,
  weights: Record<MemberJoinSource, number> = DEFAULT_JOIN_SOURCE_WEIGHTS,
  rng: Rng = Math.random
): { source: MemberJoinSource; needsSponsor: boolean } {
  if (sponsorCount <= 0) {
    return { source: 'organic', needsSponsor: false }
  }

  const roll = rng()
  const organic = weights.organic
  const wordOfMouth = organic + weights.word_of_mouth
  if (roll < organic) return { source: 'organic', needsSponsor: false }
  if (roll < wordOfMouth) return { source: 'word_of_mouth', needsSponsor: true }
  return { source: 'brought_in', needsSponsor: true }
}

export function pickWeightedSponsor<T extends { id: string; stage: number }>(
  members: T[],
  rng: Rng = Math.random
): T | null {
  if (members.length === 0) return null
  const total = members.reduce((sum, member) => sum + Math.max(1, member.stage), 0)
  let cursor = rng() * total
  for (const member of members) {
    cursor -= Math.max(1, member.stage)
    if (cursor <= 0) return member
  }
  return members[members.length - 1] ?? null
}

export function friendshipPairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

export function pickUnconnectedPair<T extends { id: string }>(
  members: T[],
  existingPairKeys: Iterable<string>,
  rng: Rng = Math.random
): [T, T] | null {
  if (members.length < 2) return null
  const taken = new Set(existingPairKeys)
  const candidates: Array<[T, T]> = []
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const left = members[i]
      const right = members[j]
      if (taken.has(friendshipPairKey(left.id, right.id))) continue
      candidates.push([left, right])
    }
  }
  if (candidates.length === 0) return null
  const index = Math.min(candidates.length - 1, Math.floor(rng() * candidates.length))
  return candidates[index] ?? null
}

export function normalizeBondEndpoints(
  kind: MemberBondKind,
  fromUserId: string,
  toUserId: string
): { fromUserId: string; toUserId: string } {
  if (fromUserId === toUserId) {
    throw new Error('Cannot form a bond with yourself.')
  }
  if (kind === 'nest_mate') {
    return fromUserId < toUserId
      ? { fromUserId, toUserId }
      : { fromUserId: toUserId, toUserId: fromUserId }
  }
  return { fromUserId, toUserId }
}

export function bondPairKey(kind: MemberBondKind, fromUserId: string, toUserId: string): string {
  const pair = normalizeBondEndpoints(kind, fromUserId, toUserId)
  return `${kind}:${pair.fromUserId}|${pair.toUserId}`
}

export function chooseBondForPair<T extends { id: string; stage: number }>(
  left: T,
  right: T
): { kind: Exclude<MemberBondKind, 'brought_in'>; from: T; to: T } {
  if (left.stage !== right.stage) {
    const mentor = left.stage > right.stage ? left : right
    const protege = mentor.id === left.id ? right : left
    return { kind: 'mentor', from: mentor, to: protege }
  }
  const [from, to] = left.id < right.id ? [left, right] : [right, left]
  return { kind: 'nest_mate', from, to }
}

export function presentJoinStory(
  source: MemberJoinSource | null | undefined,
  referrerName: string | null | undefined
): string | null {
  if (!source || source === 'organic') return null
  const name = referrerName?.trim()
  if (!name) return null
  if (source === 'brought_in') return `Brought in by ${name}`
  return `Heard about the Order from ${name}`
}

export function presentBondLabel(
  kind: MemberBondKind,
  otherName: string,
  viewerIsFrom: boolean
): string {
  if (kind === 'nest_mate') return `Nest-mate of ${otherName}`
  if (kind === 'mentor') {
    return viewerIsFrom ? `Mentoring ${otherName}` : `Learning from ${otherName}`
  }
  return viewerIsFrom ? `Brought ${otherName} in` : `Brought in by ${otherName}`
}

export function formatPersonaVoiceBlock(persona: SimulatedPersonaConfig | null | undefined): string {
  const archetype = persona?.archetype || 'Acolyte'
  const tone = persona?.tone || 'Constructive, respectful'
  const traitLabels = (persona?.traits || []).map((trait) => trait.label).filter(Boolean)
  const traitLine =
    traitLabels.length > 0
      ? `Distinct traits: ${traitLabels.join('; ')}. Let those traits flavor word choice without naming them.`
      : 'Distinct traits: none yet.'
  return `Persona Archetype: ${archetype}\nTone: ${tone}\n${traitLine}`
}
