import { useEffect, useState } from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useAccountProfile } from '@/hooks/useAccountProfile'
import { equipmentAppearance } from '@/lib/character-appearance'
import type { CatalogRef } from '@/lib/chassis-loadout'
import { GEAR_CATALOG } from '@/lib/equipment-seed-data'
import { guestStarterItems, readGuestCharacter } from '@/lib/guest-character'
import { lockAvatarConfig, rerollAvatarConfig, type LobsterAvatarConfig } from '@/lib/lobster-avatar'

export interface PlayerCharacter {
  /** The character to play as: undefined while unknown, null when there is none. */
  config: LobsterAvatarConfig | null | undefined
  userId: string | null
  isGuest: boolean
  /** A guest who has not made a character yet plays a stand-in. */
  standIn: boolean
}

/**
 * The character the player brings into a game: a member's saved character with the gear they wear,
 * or a guest's draft from Customize (with the starter gear), or a stand-in for a brand new guest.
 */
export function usePlayerCharacter(): PlayerCharacter {
  const session = useAuthSession()
  const { profile } = useAccountProfile(session.userId)
  const [guest, setGuest] = useState<{ config: LobsterAvatarConfig; standIn: boolean } | null>(null)

  useEffect(() => {
    if (session.isPending || session.userId) return
    const stored = readGuestCharacter()
    const config = stored.config ?? lockAvatarConfig(rerollAvatarConfig({ race: 'crab' }))
    const items = stored.items ?? guestStarterItems()
    const equipment = equipmentAppearance(items, GEAR_CATALOG as unknown as CatalogRef[])
    setGuest({ config: { ...config, equipment }, standIn: !stored.config })
  }, [session.isPending, session.userId])

  if (session.isPending) return { config: undefined, userId: null, isGuest: false, standIn: false }
  if (session.userId) {
    return {
      config: profile === undefined ? undefined : (profile?.avatarConfig as LobsterAvatarConfig | null | undefined) ?? null,
      userId: session.userId,
      isGuest: false,
      standIn: false,
    }
  }
  return { config: guest?.config, userId: null, isGuest: true, standIn: guest?.standIn ?? false }
}
