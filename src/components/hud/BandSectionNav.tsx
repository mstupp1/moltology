import React from 'react'
import { Link, type LinkProps } from '@tanstack/react-router'
import { HorizontalScroll } from '@/components/ui/HorizontalScroll'
import { cn } from '@/lib/utils'
import { useTabIndicator } from '@/hooks/useTabIndicator'

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
 * parts of one area (Character, Academy, Admin, Profile). They sit on the band's bottom edge;
 * the current one is full ink with a bar under it that slides between tabs (`useTabIndicator`,
 * which also carries the bar across the remount when a tab is its own route).
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
  const listRef = React.useRef<HTMLDivElement>(null)
  const barRef = React.useRef<HTMLSpanElement>(null)
  useTabIndicator(listRef, barRef, label, current)
  return (
    <HorizontalScroll as="nav" aria-label={label} tabIndex={-1} className={cn('overflow-x-auto', className)}>
      <div ref={listRef} className="relative w-max">
        <ul className={BAND_TAB_LIST}>
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
                  data-tab-active={selected ? 'true' : undefined}
                  data-testid={`band-section-${section.id}`}
                  className={bandTabClass(selected)}
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
        <BandTabBar ref={barRef} />
      </div>
    </HorizontalScroll>
  )
}

/** The row that holds band tabs (inside a `relative w-max` wrapper that also holds the bar). */
export const BAND_TAB_LIST = 'flex w-max gap-5'

/** One band tab: plain label, full ink when current. Its bottom is the band's bottom edge. */
export function bandTabClass(selected: boolean) {
  return cn(
    'inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap text-ui font-medium transition-colors duration-200',
    // Inset focus ring: the scroll row would clip an outer one.
    'rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow',
    selected ? 'text-ink' : 'text-ink-muted hover:text-ink',
  )
}

/** The bar under the current band tab. Placed by `useTabIndicator`; hidden until placed. */
export const BandTabBar = React.forwardRef<HTMLSpanElement>(function BandTabBar(_props, ref) {
  return (
    <span
      ref={ref}
      aria-hidden="true"
      // 1px wide, moved and sized by transform only (useTabIndicator).
      className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-px origin-left bg-ink opacity-0 will-change-transform"
    />
  )
})

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
