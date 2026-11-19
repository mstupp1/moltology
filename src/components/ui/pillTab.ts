import { cn } from '@/lib/utils'

/**
 * In-page view tabs and filters (Shop's Gear/Earn gems, Covenant Watch's Open/Resolved,
 * the Atlas Map/Decisions switch): the current one is a lit surface-3 pill, never an underline.
 * Section tabs in a header band use `BandSectionNav` instead.
 */
export function pillTabClass(selected: boolean, className?: string) {
  return cn(
    'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-3 text-ui font-medium transition-colors',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
    selected ? 'bg-surface-3 shadow-nav-current text-ink' : 'text-ink-muted hover:bg-surface-3/60 hover:text-ink',
    className,
  )
}
