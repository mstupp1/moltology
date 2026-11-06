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
    <nav aria-label="Character sections" className={cn('flex gap-1 rounded-control bg-surface-2 p-1', className)}>
      {SECTIONS.map((section) => {
        const selected = section.id === current
        return (
          <Link
            key={section.id}
            to={section.to}
            aria-current={selected ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-8 items-center justify-center rounded-control px-3 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
              selected ? 'bg-surface-3 shadow-nav-current text-ink' : 'text-ink-muted hover:bg-surface-3/60 hover:text-ink',
            )}
          >
            {section.label}
          </Link>
        )
      })}
    </nav>
  )
}
