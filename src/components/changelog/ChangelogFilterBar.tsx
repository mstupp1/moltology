import React, { useRef, useEffect } from 'react'
import { Search } from 'lucide-react'

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

  const hasActiveFilters = selectedCategory !== 'ALL' || Boolean(selectedTag) || searchQuery.trim().length > 0
  const control = 'min-h-10 rounded-control border border-line bg-surface-2 text-ink text-sm px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

  return (
    <section aria-label="Filter updates" className={`rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-4 space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-ink-muted" aria-hidden="true" />
          <input ref={searchInputRef} type="search" aria-label="Search changelogs" placeholder="Search updates…"
            value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className={`${control} w-full pl-9`} />
        </div>
        {tags.length > 0 && (
          <label className="flex items-center gap-2 text-xs text-ink-muted">
            Topic
            <select aria-label="Filter by topic" value={selectedTag || ''} onChange={(e) => onTagChange?.(e.target.value || null)} className={`${control} flex-1 sm:w-44`}>
              <option value="">All topics</option>
              {tags.map((tag) => <option key={tag.label} value={tag.label}>{tag.label === 'UI/UX' ? 'Interface' : tag.label === 'Auth' ? 'Sign-in' : tag.label} {typeof tag.count === 'number' ? `(${tag.count})` : ''}</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5 flex-1" role="group" aria-label="Filter by category">
          {categories.map((cat) => (
            <button key={cat.label} type="button" aria-pressed={selectedCategory === cat.label} onClick={() => onCategoryChange(cat.label)}
              className={`min-h-8 px-3 rounded-control text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${selectedCategory === cat.label ? 'bg-cyan-soft text-cyan-glow' : 'text-ink-muted hover:bg-surface-2 hover:text-ink'}`}>
              {cat.label === 'ALL' ? 'All updates' : cat.label} <span className="ml-1 text-[11px] tabular-nums opacity-75">{cat.count}</span>
            </button>
          ))}
        </div>
        {hasActiveFilters && <button type="button" title="Reset all filters" onClick={onReset} className={`${control} text-xs`}>Clear filters</button>}
      </div>
      {hasActiveFilters && <p role="status" className="text-xs text-ink-muted">Showing {filteredCount} of {totalCount} updates</p>}
    </section>
  )
}
