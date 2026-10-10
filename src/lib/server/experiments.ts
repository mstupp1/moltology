/** Admin-only experiment switches (see src/lib/experiments.ts). */
import { eq } from 'drizzle-orm'
import { profiles } from '../../db/schema'
import { EXPERIMENTS, EXPERIMENT_IDS, activeExperiments, isExperimentId, toggleExperiment, type ExperimentId } from '../experiments'
import { requireStaff, type HandlerArgs } from './admin-oversight'
import type { WriteAuthData } from './write-auth'

export type ExperimentRow = {
  id: ExperimentId
  title: string
  description: string
  on: boolean
}

function toRows(active: ExperimentId[]): ExperimentRow[] {
  return EXPERIMENT_IDS.map((id) => ({ id, ...EXPERIMENTS[id], on: active.includes(id) }))
}

export async function getMyExperimentsHandler(args: HandlerArgs<WriteAuthData | undefined>): Promise<ExperimentRow[]> {
  const auth = await requireStaff(args)
  const [profile] = await auth.dbClient
    .select({ role: profiles.role, experiments: profiles.experiments })
    .from(profiles)
    .where(eq(profiles.id, auth.userId))
    .limit(1)
  return toRows(activeExperiments(profile?.role, profile?.experiments))
}

export async function setExperimentHandler(
  args: HandlerArgs<(WriteAuthData & { id?: string; on?: boolean }) | undefined>,
): Promise<ExperimentRow[]> {
  const auth = await requireStaff(args)
  const id = args.data?.id
  if (!isExperimentId(id) || typeof args.data?.on !== 'boolean') {
    throw new Error('That experiment does not exist.')
  }

  const [profile] = await auth.dbClient
    .select({ role: profiles.role, experiments: profiles.experiments })
    .from(profiles)
    .where(eq(profiles.id, auth.userId))
    .limit(1)
  const next = toggleExperiment(profile?.experiments, id, args.data.on)
  await auth.dbClient.update(profiles).set({ experiments: next, updatedAt: new Date() }).where(eq(profiles.id, auth.userId))

  // Apply the switch to the avatar right away (adds or clears the painted look and portrait).
  if (id === 'avatar-kit') {
    const { syncAvatarLook } = await import('./db-services')
    try {
      await syncAvatarLook(auth.dbClient, auth.userId)
    } catch (e) {
      console.warn('[setExperiment] Avatar sync failed:', e)
    }
  }

  return toRows(activeExperiments(profile?.role, next))
}
