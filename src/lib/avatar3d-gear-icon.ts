/**
 * Gear icons: the item worn on a dark, plain mannequin, with the camera in close on the slot it
 * fills, so members can see at a glance what the piece is and where it goes.
 */
import { getEquipmentVisual } from './avatar/equipment'
import type { StillShot } from './avatar3d/portraits'
import { LOBSTER_AVATAR_STYLE, type LobsterAvatarConfig } from './lobster-avatar'

export interface GearStill {
  config: LobsterAvatarConfig
  shot: StillShot
}

const cache = new Map<string, GearStill | null>()

export function gearStill(key: string | null | undefined): GearStill | null {
  if (!key) return null
  const hit = cache.get(key)
  if (hit !== undefined) return hit
  const visual = getEquipmentVisual(key)
  const slot = visual ? (visual.category === 'claws' ? 'claws-1' : visual.category) : null
  const out: GearStill | null =
    visual && slot
      ? {
          config: {
            style: LOBSTER_AVATAR_STYLE,
            seed: 'gear-icon',
            race: 'lobster',
            shellColor: 'obsidian',
            shellFinish: 'satin',
            marking: 'none',
            pose: 'rest',
            headShape: 'bean',
            build: 'classic',
            height: 'regular',
            eyelidStyle: 'chill',
            eyeColor: 'sapphire',
            mouth: 'smile',
            antennae: 'whip',
            transparentBackground: true,
            equipment: { [slot]: { visualKey: key } },
          } as LobsterAvatarConfig,
          shot: `gear:${slot}`,
        }
      : null
  cache.set(key, out)
  return out
}
