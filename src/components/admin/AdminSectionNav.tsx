import React from 'react'
import { BandSectionNav, type BandSection } from '@/components/hud/BandSectionNav'

export const ADMIN_TAB_IDS = ['watch', 'members', 'store', 'experiments', 'logic'] as const
export type AdminTab = (typeof ADMIN_TAB_IDS)[number]
/** Kept as an alias: every admin section is now a tab of /admin. */
export type AdminSection = AdminTab

const SECTIONS = [
  { id: 'watch', label: 'Covenant Watch', to: '/admin', search: { tab: 'watch' } },
  { id: 'members', label: 'Members', to: '/admin', search: { tab: 'members' } },
  { id: 'store', label: 'Store', to: '/admin', search: { tab: 'store' } },
  { id: 'experiments', label: 'Experiments', to: '/admin', search: { tab: 'experiments' } },
  { id: 'logic', label: 'Logic Atlas', to: '/admin', search: { tab: 'logic' } },
] as const satisfies readonly BandSection<AdminSection>[]

/** The admin header band's section tabs (pass as `sections`), all tabs of /admin. */
export function AdminSectionNav({ current }: { current: AdminSection }) {
  return <BandSectionNav label="Admin sections" sections={SECTIONS} current={current} />
}
