import React from 'react'
import { cn } from '@/lib/utils'

export interface HudTabItem<T extends string = string> {
  value: T
  label: React.ReactNode
  disabled?: boolean
}

export interface HudTabsProps<T extends string = string> {
  items: HudTabItem<T>[]
  value: T
  onValueChange: (value: T) => void
  /** Accessible name for the tab list. */
  label: string
  className?: string
  /** Prefix for tab ids, so panels can point at them with aria-labelledby. */
  idPrefix?: string
}

/**
 * Section tabs for the top row of a header band (`HudTitleBandTop`), matching `BandSectionNav`:
 * plain labels, the current one in full ink, no underline. Use this when the sections are
 * in-page state; use `BandSectionNav` when each section has its own URL.
 * Arrow keys move between tabs; Home and End jump to the ends.
 */
export function HudTabs<T extends string = string>({
  items,
  value,
  onValueChange,
  label,
  className,
  idPrefix = 'hud-tab',
}: HudTabsProps<T>) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([])

  const focusAt = (start: number, step: 1 | -1) => {
    const count = items.length
    for (let i = 1; i <= count; i++) {
      const index = (start + step * i + count) % count
      if (!items[index].disabled) {
        refs.current[index]?.focus()
        onValueChange(items[index].value)
        return
      }
    }
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowRight') focusAt(index, 1)
    else if (event.key === 'ArrowLeft') focusAt(index, -1)
    else if (event.key === 'Home') focusAt(-1, 1)
    else if (event.key === 'End') focusAt(items.length, -1)
    else return
    event.preventDefault()
  }

  return (
    <div role="tablist" aria-label={label} className={cn('-ml-2.5 flex flex-wrap gap-1', className)}>
      {items.map((item, index) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[index] = el
            }}
            id={`${idPrefix}-${item.value}`}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'inline-flex min-h-9 items-center whitespace-nowrap rounded-control px-2.5 text-[11px] uppercase tracking-[0.08em] transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow',
              'disabled:cursor-not-allowed disabled:opacity-50',
              selected ? 'font-bold text-ink' : 'font-semibold text-ink-muted hover:text-ink'
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
