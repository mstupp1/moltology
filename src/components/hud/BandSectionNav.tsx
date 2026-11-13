import React from 'react'
import { Link, type LinkProps } from '@tanstack/react-router'
import { HorizontalScroll } from '@/components/ui/HorizontalScroll'
import { cn } from '@/lib/utils'

export interface BandSection<K extends string = string> {
  id: K
  label: string
  to: LinkProps['to']
  search?: LinkProps['search']
  hash?: string
}

/**
 * The quiet top row of a page's header band (inside `HudTitleBandTop`): links between the
 * parts of one area (Character, Academy, Admin, Support). Plain labels, the current one in
 * full ink, no underline or pill, so it never reads like the in-page tabs further down.
 * Scrolls sideways on narrow screens instead of wrapping.
 */
export function BandSectionNav<K extends string>({
  label,
  sections,
  current,
  className,
}: {
  label: string
  sections: readonly BandSection<K>[]
  current: K | null
  className?: string
}) {
  return (
    <HorizontalScroll as="nav" aria-label={label} tabIndex={-1} className={cn('-ml-2.5 overflow-x-auto', className)}>
      <ul className="flex w-max gap-1">
        {sections.map((section) => {
          const selected = section.id === current
          return (
            <li key={section.id}>
              <Link
                to={section.to}
                search={section.search}
                hash={section.hash}
                aria-current={selected ? 'page' : undefined}
                data-testid={`band-section-${section.id}`}
                className={cn(
                  'inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-control px-2.5 text-[11px] uppercase tracking-[0.08em] transition-colors',
                  // Inset focus ring: the scroll row would clip an outer one.
                  'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow',
                  selected ? 'font-bold text-ink' : 'font-semibold text-ink-muted hover:text-ink',
                )}
              >
                {section.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </HorizontalScroll>
  )
}

/** A small figure in a band's actions (XP, clearance, admin status): tracked label over a value. */
export function BandStat({
  label,
  value,
  tone = 'ink',
  title,
}: {
  label: string
  value: React.ReactNode
  tone?: 'ink' | 'cyan' | 'amber'
  title?: string
}) {
  return (
    <div className="min-w-0" title={title}>
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted whitespace-nowrap">{label}</div>
      <div
        className={cn(
          'font-grotesk text-lg font-bold leading-tight tabular-nums',
          tone === 'cyan' ? 'text-cyan-glow' : tone === 'amber' ? 'text-amber-400' : 'text-ink',
        )}
      >
        {value}
      </div>
    </div>
  )
}
