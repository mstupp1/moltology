import React from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { id: 'customize', label: 'Customize', to: '/character' },
  { id: 'shop', label: 'Shop', to: '/character/shop' },
  { id: 'progress', label: 'Progress', to: '/character/progress' },
] as const

export type CharacterSection = (typeof SECTIONS)[number]['id']

/**
 * Switches between the parts of the Character page: dressing your character
 * (/character), buying gear for it (/character/shop) and its stage and XP
 * (/character/progress).
 */
export function CharacterSectionNav({ current, className }: { current: CharacterSection; className?: string }) {
  return (
    // The quieter top row of the page's header band: plain labels, the current one in full ink.
    // Tabs inside the page (Gear, Earn gems...) keep the lit pill, so the two rows don't read alike.
    <nav aria-label="Character sections" className={cn('flex w-max gap-1', className)}>
      {SECTIONS.map((section) => {
        const selected = section.id === current
        return (
          <Link
            key={section.id}
            to={section.to}
            aria-current={selected ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-9 items-center justify-center rounded-control px-2.5 first:-ml-2.5 text-[11px] uppercase tracking-[0.08em] transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
              selected ? 'font-bold text-ink' : 'font-semibold text-ink-muted hover:text-ink',
            )}
          >
            {section.label}
          </Link>
        )
      })}
    </nav>
  )
}
