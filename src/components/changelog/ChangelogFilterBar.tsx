import React, { useRef, useEffect } from 'react'
import {
  Search,
  X,
  Filter,
  Sparkles,
  Tag,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react'

export interface ChangelogFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
  selectedTag?: string | null
  onTagChange?: (tag: string | null) => void
  categories?: { label: string; count?: number }[]
  tags?: { label: string; count?: number }[]
  totalCount: number
  filteredCount: number
  onReset: () => void
  className?: string
}

export function ChangelogFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTag = null,
  onTagChange,
  categories = [],
  tags = [],
  totalCount,
  filteredCount,
  onReset,
  className = '',
}: ChangelogFilterBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut: pressing '/' focuses the search bar if not already in an input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const hasActiveFilters =
    selectedCategory !== 'ALL' || Boolean(selectedTag) || searchQuery.trim().length > 0

  return (
    <div
      className={`w-full bg-[#070c0e]/95 border-b border-cyan-900/40 py-3 px-4 sm:px-8 relative z-10 ${className}`}
    >
      <div className="max-w-5xl mx-auto space-y-2.5">
        {/* Top Controls Row: Primary Category Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Primary Category Tabs (Horizontally scrollable on mobile) */}
          <div className="relative flex-1 min-w-0 flex items-center gap-2">
            {/* Label anchored outside scroll — never clips */}
            <div className="hidden lg:flex items-center text-[#839493] shrink-0 text-[11px] font-sans font-bold">
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1 text-cyan-400" />
              <span>CATEGORIES:</span>
            </div>

            <div
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth snap-x snap-mandatory flex-1 min-w-0"
              role="tablist"
              aria-label="Filter by primary category"
            >
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.label
                return (
                  <button
                    key={cat.label}
                    onClick={() => {
                      onCategoryChange(cat.label)
                    }}
                    role="tab"
                    aria-selected={isActive}
                    className={`px-3 py-1.5 text-[11px] font-bold font-grotesk uppercase tracking-wider chamfer-corner transition-all shrink-0 flex items-center gap-1.5 snap-start select-none ${
                      isActive
                        ? 'bg-cyan-500 text-black shadow-hud-cyan font-black'
                        : 'bg-[#090e10] text-gray-400 hover:text-white border border-cyan-950 hover:border-cyan-800'
                    }`}
                  >
                    <span>{cat.label === 'ALL' ? 'ALL UPDATES' : cat.label}</span>
                    {typeof cat.count === 'number' && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          isActive
                            ? 'bg-black/30 text-black'
                            : 'bg-cyan-950 text-cyan-400 border border-cyan-800/40'
                        }`}
                      >
                        {cat.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Search Box with Clear Button and Shortcut Hint */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search updates or tags..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-14 py-1.5 bg-[#030607] border border-cyan-900/60 focus:border-cyan-400 text-gray-100 font-sans text-xs chamfer-corner outline-none placeholder-gray-500 transition-colors"
              aria-label="Search changelogs"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-white transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono text-cyan-400/60 bg-cyan-950/60 border border-cyan-900/60 rounded pointer-events-none">
                /
              </span>
            )}
          </div>
        </div>

        {/* Secondary Row: Tags Strip & Count/Reset */}
        {(tags.length > 0 || hasActiveFilters) && (
          <div className="flex flex-col gap-1.5 pt-1 border-t border-cyan-950/60 text-xs font-sans">
            {/* Tags + inline count (sm+) */}
            <div className="flex items-center gap-2">
              {/* Tags Strip */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 mr-0.5">
                  <Tag className="w-3 h-3 text-cyan-400" />
                  <span>TAGS:</span>
                </span>

                {tags.map((tag) => {
                  const isTagActive = selectedTag === tag.label
                  return (
                    <button
                      key={tag.label}
                      onClick={() => {
                        if (onTagChange) {
                          onTagChange(isTagActive ? null : tag.label)
                        }
                      }}
                      className={`px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase transition-all shrink-0 rounded-sm flex items-center gap-1 ${
                        isTagActive
                          ? 'bg-purple-500 text-white font-extrabold shadow-[0_0_8px_rgba(192,132,252,0.5)] border border-purple-300'
                          : 'bg-[#060a0c] text-gray-400 hover:text-cyan-300 border border-cyan-900/40 hover:border-cyan-700/60'
                      }`}
                    >
                      <span>#{tag.label}</span>
                      {typeof tag.count === 'number' && (
                        <span className="text-[9px] opacity-75 font-mono">
                          ({tag.count})
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Count & Reset — inline on sm+ screens */}
              <div className="hidden sm:flex items-center gap-2 shrink-0 pl-2 text-[11px] text-gray-400">
                <span>
                  {filteredCount === totalCount ? (
                    <>
                      <strong className="text-cyan-300 font-mono">{totalCount}</strong> updates
                    </>
                  ) : (
                    <>
                      <strong className="text-cyan-300 font-mono">{filteredCount}</strong> of{' '}
                      <span className="font-mono">{totalCount}</span> updates
                    </>
                  )}
                </span>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={onReset}
                    className="px-2 py-0.5 bg-red-950/60 hover:bg-red-900 border border-red-500/50 text-red-300 hover:text-white text-[10px] font-bold chamfer-corner flex items-center gap-1 transition-all active:scale-95"
                    title="Reset all filters"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>RESET</span>
                  </button>
                )}
              </div>
            </div>

            {/* Count & Reset — own row on mobile only */}
            <div className="flex sm:hidden items-center justify-between text-[11px] text-gray-400">
              <span>
                {filteredCount === totalCount ? (
                  <>
                    <strong className="text-cyan-300 font-mono">{totalCount}</strong> updates
                  </>
                ) : (
                  <>
                    <strong className="text-cyan-300 font-mono">{filteredCount}</strong> of{' '}
                    <span className="font-mono">{totalCount}</span> updates
                  </>
                )}
              </span>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onReset}
                  className="px-2 py-0.5 bg-red-950/60 hover:bg-red-900 border border-red-500/50 text-red-300 hover:text-white text-[10px] font-bold chamfer-corner flex items-center gap-1 transition-all active:scale-95"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>RESET</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
