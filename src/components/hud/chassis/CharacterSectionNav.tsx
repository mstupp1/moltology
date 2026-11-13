import React from 'react'
import { BandSectionNav, type BandSection } from '@/components/hud/BandSectionNav'

const SECTIONS = [
  { id: 'customize', label: 'Customize', to: '/character' },
  { id: 'shop', label: 'Shop', to: '/character/shop' },
  { id: 'progress', label: 'Progress', to: '/character/progress' },
] as const satisfies readonly BandSection[]

export type CharacterSection = (typeof SECTIONS)[number]['id']

/**
 * Switches between the parts of the Character page: dressing your character
 * (/character), buying gear for it (/character/shop) and its stage and XP
 * (/character/progress). Tabs inside the page (Gear, Earn gems...) keep the lit pill.
 */
export function CharacterSectionNav({ current, className }: { current: CharacterSection; className?: string }) {
  return <BandSectionNav label="Character sections" sections={SECTIONS} current={current} className={className} />
}
