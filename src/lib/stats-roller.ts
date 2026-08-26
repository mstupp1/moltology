/**
 * Base Stats Roller Engine for Moltology Initiate Carapace Calibration
 *
 * Stats strictly correspond to the 5 Chassis Equipment Slots & Loadout Telemetry:
 * 1. DEFENSE (Carapace slot)
 * 2. ATTACK (Claws slot)
 * 3. INTELLIGENCE (Head slot)
 * 4. SPEED (Legs slot)
 * 5. PERCEPTION (Antennae slot)
 *
 * All initiates start with a fixed pool of 300 biometric points distributed across
 * the 5 chassis attributes. Re-rolling or adjusting always strictly preserves
 * the total 300-point budget.
 */

import type { LoadoutStatKey, EquipmentCategory } from './chassis-loadout'

export interface BaseStats {
  defense: number
  attack: number
  intelligence: number
  speed: number
  perception: number
}

export type StatKey = keyof BaseStats

export interface StatMeta {
  key: StatKey
  label: string
  shortLabel: string
  slot: EquipmentCategory
  slotLabel: string
  description: string
  color: string
  glowColor: string
  accentClass: string
}

export const TOTAL_STAT_POINTS = 300
export const STAT_MIN = 35
export const STAT_MAX = 85

export const STAT_KEYS: readonly StatKey[] = [
  'defense',
  'attack',
  'intelligence',
  'speed',
  'perception',
] as const

export const STAT_METAS: Record<StatKey, StatMeta> = {
  defense: {
    key: 'defense',
    label: 'DEFENSE',
    shortLabel: 'DEF',
    slot: 'carapace',
    slotLabel: 'Carapace Hardpoint',
    description: 'Chitin plating density, damage deflection, and carapace structural armor.',
    color: '#00ffff',
    glowColor: 'rgba(0, 255, 255, 0.4)',
    accentClass: 'text-[#00ffff]',
  },
  attack: {
    key: 'attack',
    label: 'ATTACK',
    shortLabel: 'ATK',
    slot: 'claws',
    slotLabel: 'Claw Hardpoint',
    description: 'Pincer crushing power, kinetic strike acceleration, and claw lethality.',
    color: '#ff5540',
    glowColor: 'rgba(255, 85, 64, 0.4)',
    accentClass: 'text-[#ff5540]',
  },
  intelligence: {
    key: 'intelligence',
    label: 'INTELLIGENCE',
    shortLabel: 'INT',
    slot: 'head',
    slotLabel: 'Head/Helm Hardpoint',
    description: 'Synaptic neural compute, sub-benthic telemetry, and pattern synthesis.',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    accentClass: 'text-[#a855f7]',
  },
  speed: {
    key: 'speed',
    label: 'SPEED',
    shortLabel: 'SPD',
    slot: 'legs',
    slotLabel: 'Legs Hardpoint',
    description: 'Hydrodynamic propulsion, kinetic locomotion velocity, and tactical evasion.',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    accentClass: 'text-[#10b981]',
  },
  perception: {
    key: 'perception',
    label: 'PERCEPTION',
    shortLabel: 'PER',
    slot: 'antennae',
    slotLabel: 'Antennae Hardpoint',
    description: 'Dual-antennae sensory sweep, sub-surface sonar, and threat recognition.',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    accentClass: 'text-[#f59e0b]',
  },
}

export const DEFAULT_BASE_STATS: BaseStats = {
  defense: 65,
  attack: 68,
  intelligence: 62,
  speed: 55,
  perception: 50,
}

export interface LarvalArchetype {
  id: string
  dominantStat: StatKey
  title: string
  subtitle: string
  description: string
  specialization: string
  color: string
}

export const LARVAL_ARCHETYPES: Record<StatKey, LarvalArchetype> = {
  defense: {
    id: 'chitin_bastion',
    dominantStat: 'defense',
    title: 'Chitin Bastion',
    subtitle: 'Carapace Armor & Boundary Guardian',
    description:
      'Impenetrable defensive calcification. Surface disruptions bounce cleanly off your reinforced carapace armor.',
    specialization: 'Carapace Hardpoint & Stress Deflection',
    color: '#00ffff',
  },
  attack: {
    id: 'apex_striker',
    dominantStat: 'attack',
    title: 'Apex Striker',
    subtitle: 'High-Torque Claws & Strike Specialist',
    description:
      'Engineered for decisive pincer leverage. You lock onto objectives and crush bottlenecks with lethal claw strikes.',
    specialization: 'Claw Hardpoint & Bottleneck Elimination',
    color: '#ff5540',
  },
  intelligence: {
    id: 'synaptic_overclocker',
    dominantStat: 'intelligence',
    title: 'Synaptic Overclocker',
    subtitle: 'Neural High-Bandwidth Telemetrist',
    description:
      'Overclocked neural ganglia. You process high-dimensional telemetry at cryogenic abyssal temperatures.',
    specialization: 'Head Hardpoint & Deep Neural Analysis',
    color: '#a855f7',
  },
  speed: {
    id: 'hydro_infiltrator',
    dominantStat: 'speed',
    title: 'Hydro Infiltrator',
    subtitle: 'Rapid Kinetic Locomotion Chassis',
    description:
      'Sleek hydro-propulsion leg arrays. You glide through deep ocean currents with rapid tactical agility.',
    specialization: 'Leg Hardpoints & Rapid Maneuvering',
    color: '#10b981',
  },
  perception: {
    id: 'benthic_sensor',
    dominantStat: 'perception',
    title: 'Benthic Sensor',
    subtitle: 'Dual-Antennae Deep Telemetry Array',
    description:
      'Total signal awareness. Your dual feelers scan through dark waters, detecting opportunities and threats instantly.',
    specialization: 'Antennae Hardpoint & Long-Range Sonar',
    color: '#f59e0b',
  },
}

/**
 * Calculates total points currently allocated in stats.
 */
export function calculateStatSum(stats: BaseStats): number {
  return (
    stats.defense +
    stats.attack +
    stats.intelligence +
    stats.speed +
    stats.perception
  )
}

/**
 * Generates a randomized distribution of 5 base stats strictly summing to TOTAL_STAT_POINTS (300)
 * with each stat clamped between STAT_MIN (35) and STAT_MAX (85).
 */
export function rollBaseStats(
  total: number = TOTAL_STAT_POINTS,
  min: number = STAT_MIN,
  max: number = STAT_MAX
): BaseStats {
  const n = STAT_KEYS.length
  const remainingToAdd = total - n * min
  const maxCap = max - min

  const additions = new Array<number>(n).fill(0)
  let pointsLeft = remainingToAdd

  while (pointsLeft > 0) {
    const eligible: number[] = []
    for (let i = 0; i < n; i++) {
      if (additions[i] < maxCap) eligible.push(i)
    }

    if (eligible.length === 0) break

    const idx = eligible[Math.floor(Math.random() * eligible.length)]
    const space = maxCap - additions[idx]
    const step = Math.min(space, Math.min(pointsLeft, Math.floor(Math.random() * 8) + 1))
    additions[idx] += step
    pointsLeft -= step
  }

  // If there's any small remainder, distribute unit points
  while (pointsLeft > 0) {
    const eligible = additions
      .map((val, idx) => ({ val, idx }))
      .filter((item) => item.val < maxCap)
    if (eligible.length === 0) break
    const pick = eligible[Math.floor(Math.random() * eligible.length)]
    additions[pick.idx] += 1
    pointsLeft -= 1
  }

  const result: BaseStats = {
    defense: min + additions[0],
    attack: min + additions[1],
    intelligence: min + additions[2],
    speed: min + additions[3],
    perception: min + additions[4],
  }

  return result
}

/**
 * Nudges a single stat by delta (+1 or -1) while adjusting another stat to maintain
 * the exact 300-sum invariant within [STAT_MIN, STAT_MAX].
 */
export function adjustStat(
  stats: BaseStats,
  targetKey: StatKey,
  delta: number,
  min = STAT_MIN,
  max = STAT_MAX
): BaseStats {
  if (delta === 0) return { ...stats }

  const currentVal = stats[targetKey]
  const targetNewVal = currentVal + delta

  if (targetNewVal < min || targetNewVal > max) {
    return { ...stats }
  }

  // Find candidate keys to compensate
  const otherKeys = STAT_KEYS.filter((k) => k !== targetKey)
  const candidateKeys =
    delta > 0
      ? otherKeys.filter((k) => stats[k] > min)
      : otherKeys.filter((k) => stats[k] < max)

  if (candidateKeys.length === 0) {
    return { ...stats }
  }

  // Prefer compensating from the stat with the most headroom
  candidateKeys.sort((a, b) => {
    if (delta > 0) {
      // Pick highest other stat to deduct from
      return stats[b] - stats[a]
    } else {
      // Pick lowest other stat to add to
      return stats[a] - stats[b]
    }
  })

  const compensateKey = candidateKeys[0]
  const updated = { ...stats }
  updated[targetKey] = targetNewVal
  updated[compensateKey] = updated[compensateKey] - delta

  return updated
}

/**
 * Derives the initiate's starting archetype based on their dominant rolled stat.
 */
export function getDominantArchetype(stats: BaseStats): LarvalArchetype {
  let highestKey: StatKey = 'defense'
  let highestVal = -1

  for (const key of STAT_KEYS) {
    if (stats[key] > highestVal) {
      highestVal = stats[key]
      highestKey = key
    }
  }

  return LARVAL_ARCHETYPES[highestKey]
}
