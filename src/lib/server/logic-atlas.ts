import type { LogicAtlas } from '../logic-atlas/types'
import { requireStaff, type HandlerArgs } from './admin-oversight'
import type { WriteAuthData } from './write-auth'

/**
 * The atlas describes screening thresholds and known gaps, so it is served to
 * staff only and never shipped in a client bundle.
 */
export async function getLogicAtlasHandler(args: HandlerArgs<WriteAuthData | undefined>): Promise<LogicAtlas> {
  await requireStaff(args)
  const { LOGIC_ATLAS } = await import('./logic-atlas.generated')
  return LOGIC_ATLAS
}
