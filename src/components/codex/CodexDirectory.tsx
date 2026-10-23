import React from 'react'
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
  searchQuery: string
  onSearchChange: (value: string) => void
  stage: CodexStageFilter
  onStageChange: (stage: CodexStageFilter) => void
  onClearFilters: () => void
  className?: string
}

/** Search, stage filter and the scripture list. Used in the desktop rail and the phone Contents sheet. */
export function CodexDirectory({
  scriptures,
  totalCount,
  activeId,
  onSelect,
  searchQuery,
  onSearchChange,
  stage,
  onStageChange,
  onClearFilters,
  className,
}: CodexDirectoryProps) {
  const filtered = scriptures.length !== totalCount

  return (
    <div className={cn('flex flex-col min-h-0 font-sans', className)}>
      <div className="space-y-3 p-3 sm:p-4 border-b border-line-subtle shrink-0">
        <div className="relative flex items-center">
          <Search aria-hidden="true" className="absolute left-3 w-4 h-4 text-ink-muted pointer-events-none" />
          <input
            type="search"
            aria-label="Search scriptures"
            placeholder="Search scriptures and verses"
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

        <div role="group" aria-label="Filter by stage" className="flex items-center gap-1.5">
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
                    ? 'border-line-strong bg-cyan-soft text-cyan-glow'
                    : 'border-line-subtle text-ink-muted hover:text-ink hover:border-line'
                )}
              >
                {value === 'all' ? 'All' : value}
              </button>
            )
          })}
        </div>

        <p className="text-[11px] text-ink-muted tabular-nums" aria-live="polite">
          {filtered ? `${scriptures.length} of ${totalCount} scriptures` : `${totalCount} scriptures`}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-2 touch-pan-y">
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
              return (
                <li key={s.id}>
                  {showGroup && (
                    <div className="px-4 pt-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                      {s.volumeName}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelect(s.id)}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'group relative w-full text-left px-4 py-2.5 transition-colors',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow',
                      isActive ? 'bg-surface-2' : 'hover:bg-surface-2'
                    )}
                  >
                    {isActive && <span aria-hidden="true" className="absolute left-0 inset-y-0 w-[2px] bg-cyan-glow" />}
                    <span
                      className={cn(
                        'block text-sm font-semibold leading-snug',
                        isActive ? 'text-ink' : 'text-ink-body group-hover:text-ink'
                      )}
                    >
                      {s.title}
                    </span>
                    <span className="mt-0.5 font-garamond italic text-[13px] text-ink-muted line-clamp-1">
                      {s.mandate}
                    </span>
                    <span className="mt-1 flex items-center gap-2 text-[11px] text-ink-muted tabular-nums">
                      <span className={cn(isActive && 'text-cyan-glow')}>Stage {s.stageClearance}</span>
                      <span aria-hidden="true">·</span>
                      <span>{s.id}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
