/**
 * Experiments: unfinished features that can ship to main switched off.
 *
 * Each one is a personal opt-in for admins, stored on `profiles.experiments` and switched
 * on the Admin hub. For everyone else the feature stays off. To retire an experiment, delete
 * its entry here; stored switches for unknown ids are ignored.
 */
import { isAdmin } from './permissions'

export const EXPERIMENTS = {
  'avatar-kit': {
    title: 'Painted avatars and cosmetics',
    description:
      'Your avatar uses the painted art with your gear and looks, gets a rendered portrait, and your chassis shows the avatar and wardrobe. Other members see your avatar painted too.',
  },
} as const satisfies Record<string, { title: string; description: string }>

export type ExperimentId = keyof typeof EXPERIMENTS

export const EXPERIMENT_IDS = Object.keys(EXPERIMENTS) as ExperimentId[]

export function isExperimentId(value: unknown): value is ExperimentId {
  return typeof value === 'string' && Object.hasOwn(EXPERIMENTS, value)
}

/** Experiments in effect for a profile: only admins, only ids that still exist. */
export function activeExperiments(role: string | null | undefined, stored: unknown): ExperimentId[] {
  if (!isAdmin(null, role) || !Array.isArray(stored)) return []
  return EXPERIMENT_IDS.filter((id) => stored.includes(id))
}

export function hasExperiment(role: string | null | undefined, stored: unknown, id: ExperimentId): boolean {
  return activeExperiments(role, stored).includes(id)
}

/** The stored list after switching one experiment, dropping retired ids. */
export function toggleExperiment(stored: unknown, id: ExperimentId, on: boolean): ExperimentId[] {
  const current = Array.isArray(stored) ? EXPERIMENT_IDS.filter((x) => stored.includes(x)) : []
  const next = new Set(current)
  if (on) next.add(id)
  else next.delete(id)
  return EXPERIMENT_IDS.filter((x) => next.has(x))
}
