import React from 'react'
import { cn } from '@/lib/utils'
import { BAND_TAB_LIST, BandTabBar, bandTabClass } from '@/components/hud/BandSectionNav'
import { useTabIndicator } from '@/hooks/useTabIndicator'

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
 * Section tabs for a header band (`HudTitlePanel` `sections`), matching `BandSectionNav`:
 * plain labels on the band's bottom edge with a sliding bar under the current one. Use this when the sections are
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
  const listRef = React.useRef<HTMLDivElement>(null)
  const barRef = React.useRef<HTMLSpanElement>(null)
  useTabIndicator(listRef, barRef, label, value)

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
    <div ref={listRef} className="relative w-max">
      <div role="tablist" aria-label={label} className={cn(BAND_TAB_LIST, className)}>
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
              className={cn(bandTabClass(selected), 'disabled:cursor-not-allowed disabled:opacity-50')}
              data-tab-active={selected ? 'true' : undefined}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      <BandTabBar ref={barRef} />
    </div>
  )
}
