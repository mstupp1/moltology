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
  /** Small count pill after the label (Profile's pending requests). Hidden at 0. */
  badge?: number
  /** Replace history instead of pushing (tabs of one page). */
  replace?: boolean
}

/**
 * The section tabs of a page's header band (`HudTitlePanel` `sections`): links between the
 * parts of one area (Character, Academy, Admin, Profile). The current one is a lit tile, as in
 * the public header; no underline. Scrolls sideways on narrow screens instead of wrapping.
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
                replace={section.replace}
                aria-current={selected ? 'page' : undefined}
                data-testid={`band-section-${section.id}`}
                className={cn(
                  'inline-flex min-h-9 items-center gap-1.5 justify-center whitespace-nowrap rounded-control px-2.5 text-ui font-medium transition-colors',
                  // Inset focus ring: the scroll row would clip an outer one.
                  'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow',
                  selected
                    ? 'bg-surface-3 shadow-nav-current text-ink'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-3/60',
                )}
              >
                {section.label}
                {section.badge ? (
                  <span className="min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-cyan-glow text-2xs font-semibold text-abyss tabular-nums">
                    <span className="sr-only">, </span>
                    {section.badge > 99 ? '99+' : section.badge}
                    <span className="sr-only"> waiting</span>
                  </span>
                ) : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </HorizontalScroll>
  )
}

/** A small figure in a band's actions (XP, clearance, admin status): a sentence-case label over a value. */
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
    // One line from md up (label, then value) so it fits the band's title row.
    <div className="min-w-0 md:flex md:items-baseline md:gap-1.5" title={title}>
      <div className="text-xs text-ink-muted whitespace-nowrap">{label}</div>
      <div
        className={cn(
          'font-grotesk text-lg md:text-md font-semibold leading-tight tabular-nums',
          tone === 'cyan' ? 'text-cyan-glow' : tone === 'amber' ? 'text-amber-400' : 'text-ink',
        )}
      >
        {value}
      </div>
    </div>
  )
}
