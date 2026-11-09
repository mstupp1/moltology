import React, { useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import type { ScriptureItem } from '@/lib/codexData'
import { cn } from '@/lib/utils'

export type CodexStageFilter = 'all' | 1 | 2 | 3 | 4

const STAGE_FILTERS: CodexStageFilter[] = ['all', 1, 2, 3, 4]

export interface CodexDirectoryProps {
  scriptures: ScriptureItem[]
  totalCount: number
  activeId: string
  onSelect: (id: string) => void
  /** Jump to one verse of the open scripture. */
  onSelectVerse?: (verseNumber: number) => void
  /** Verse currently in view, marked in the section list. */
  activeVerse?: number
  searchQuery: string
  onSearchChange: (value: string) => void
  stage: CodexStageFilter
  onStageChange: (stage: CodexStageFilter) => void
  onClearFilters: () => void
  /** Matches per scripture while searching. */
  matchCounts?: Record<string, number>
  className?: string
}

/** Search, stage filter and the scripture list. Used in the desktop rail and the phone Contents sheet. */
export function CodexDirectory({
  scriptures,
  totalCount,
  activeId,
  onSelect,
  onSelectVerse,
  activeVerse,
  searchQuery,
  onSearchChange,
  stage,
  onStageChange,
  onClearFilters,
  matchCounts,
  className,
}: CodexDirectoryProps) {
  const filtered = scriptures.length !== totalCount
  const listRef = useRef<HTMLDivElement>(null)

  // Keep the open scripture in view inside the list without moving the page.
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const row = list.querySelector<HTMLElement>('[data-codex-row][aria-current="true"]')
    const item = row?.closest('li')
    if (!row || !item) return
    const listBox = list.getBoundingClientRect()
    const rowBox = row.getBoundingClientRect()
    const itemBox = item.getBoundingClientRect()
    // Leave room for the sticky volume heading above the row.
    const headingRoom = 36
    if (rowBox.top < listBox.top + headingRoom || itemBox.bottom > listBox.bottom) {
      list.scrollTop += rowBox.top - listBox.top - headingRoom - 8
    }
  }, [activeId])

  return (
    <div className={cn('flex flex-col min-h-0 font-sans', className)}>
      <div className="space-y-2.5 p-3 border-b border-line-subtle shrink-0">
        <div className="relative flex items-center">
          <Search aria-hidden="true" className="absolute left-3 w-4 h-4 text-ink-muted pointer-events-none" />
          <input
            type="search"
            aria-label="Search scriptures"
            placeholder="Search scriptures"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full min-h-10 bg-surface-2 text-ink placeholder:text-ink-muted/70 text-sm rounded-control border border-line pl-9 pr-9 py-2 outline-hidden transition-[border-color,box-shadow] duration-200 hover:border-line-hover focus:border-cyan-glow focus:shadow-field-focus [&::-webkit-search-cancel-button]:hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-1 flex items-center justify-center w-8 h-8 rounded-control text-ink-muted hover:text-ink hover:bg-surface-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div role="group" aria-label="Filter by stage" className="flex items-center gap-1">
          <span aria-hidden="true" className="mr-1 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
            Stage
          </span>
          {STAGE_FILTERS.map((value) => {
            const selected = stage === value
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                aria-label={value === 'all' ? 'All stages' : `Stage ${value}`}
                onClick={() => onStageChange(value)}
                className={cn(
                  'min-h-8 min-w-8 px-2 rounded-control border text-[11px] font-bold uppercase tracking-[0.08em] tabular-nums transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
                  selected
                    ? 'border-line-strong bg-surface-3 text-ink'
                    : 'border-transparent text-ink-muted hover:text-ink hover:bg-surface-2'
                )}
              >
                {value === 'all' ? 'All' : value}
              </button>
            )
          })}
          <span className="ml-auto pl-2 text-[11px] text-ink-muted tabular-nums whitespace-nowrap" aria-live="polite">
            {filtered ? `${scriptures.length} of ${totalCount}` : ''}
          </span>
        </div>
      </div>

      <div ref={listRef} className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain pb-2 touch-pan-y">
        {scriptures.length === 0 ? (
          <div className="px-4 py-8 text-center space-y-3">
            <p className="text-sm text-ink-body">No scriptures match.</p>
            <button
              type="button"
              onClick={onClearFilters}
              className="min-h-8 px-3 rounded-control border border-line text-xs font-bold uppercase tracking-[0.08em] text-ink hover:bg-surface-2 hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <ul>
            {scriptures.map((s, index) => {
              const isActive = s.id === activeId
              const showGroup = index === 0 || scriptures[index - 1].volume !== s.volume
              const sections = isActive ? s.verses.filter((verse) => verse.heading) : []
              const hits = matchCounts?.[s.id]
              return (
                <li key={s.id}>
                  {showGroup && (
                    <div className="sticky top-0 z-[1] px-4 pt-3 pb-1.5 bg-surface-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                      {s.volumeName}
                    </div>
                  )}
                  <button
                    type="button"
                    data-codex-row=""
                    onClick={() => onSelect(s.id)}
                    aria-current={isActive ? 'true' : undefined}
                    title={s.mandate}
                    className={cn(
                      'group relative w-full flex items-baseline gap-3 text-left px-4 py-2 min-h-10 transition-colors',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow',
                      isActive ? 'bg-surface-2' : 'hover:bg-surface-2'
                    )}
                  >
                    {isActive && <span aria-hidden="true" className="absolute left-0 inset-y-0 w-[2px] bg-cyan-glow" />}
                    <span
                      className={cn(
                        'flex-1 min-w-0 text-sm leading-snug',
                        isActive ? 'text-ink font-semibold' : 'text-ink-body group-hover:text-ink'
                      )}
                    >
                      {s.title}
                    </span>
                    <span className="shrink-0 text-[11px] text-ink-muted tabular-nums">
                      {hits ? `${hits} ${hits === 1 ? 'match' : 'matches'}` : s.id}
                    </span>
                  </button>
                  {sections.length > 0 && (
                    <ol aria-label={`Sections of ${s.title}`} className="pb-2 bg-surface-2/50">
                      {sections.map((verse) => {
                        const current = activeVerse === verse.verseNumber
                        return (
                          <li key={verse.verseNumber}>
                            <button
                              type="button"
                              onClick={() => onSelectVerse?.(verse.verseNumber)}
                              aria-current={current ? 'location' : undefined}
                              className={cn(
                                'w-full text-left pl-7 pr-4 py-1.5 min-h-8 text-[13px] leading-snug transition-colors',
                                'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow',
                                current ? 'text-ink font-medium' : 'text-ink-muted hover:text-ink'
                              )}
                            >
                              {verse.heading}
                            </button>
                          </li>
                        )
                      })}
                    </ol>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
