import React from 'react'
import { BandSectionNav, type BandSection } from '@/components/hud/BandSectionNav'
import { HudTitleBandTop } from '@/components/hud/HudTitlePanel'

export const ADMIN_TAB_IDS = ['watch', 'members', 'store', 'experiments'] as const
export type AdminTab = (typeof ADMIN_TAB_IDS)[number]
export type AdminSection = AdminTab | 'logic'

const SECTIONS = [
  { id: 'watch', label: 'Covenant Watch', to: '/admin', search: { tab: 'watch' } },
  { id: 'members', label: 'Members', to: '/admin', search: { tab: 'members' } },
  { id: 'store', label: 'Store', to: '/admin', search: { tab: 'store' } },
  { id: 'experiments', label: 'Experiments', to: '/admin', search: { tab: 'experiments' } },
  { id: 'logic', label: 'Logic Atlas', to: '/admin/logic' },
] as const satisfies readonly BandSection<AdminSection>[]

/** First row of the admin header band: the hub's tabs plus the Logic Atlas page. */
export function AdminSectionNav({ current }: { current: AdminSection }) {
  return (
    <HudTitleBandTop>
      <BandSectionNav label="Admin sections" sections={SECTIONS} current={current} />
    </HudTitleBandTop>
  )
}
