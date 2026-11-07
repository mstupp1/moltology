import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Search, X, ArrowRight } from 'lucide-react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useHiddenPageAccess } from '@/hooks/useHiddenPageAccess'
import { useMemberSearch } from '@/hooks/useMemberSearch'
import { CommandCatalogIcon } from '@/components/hud/CommandCatalogIcon'
import { LobsterAvatarPortrait } from '@/components/hud/LobsterAvatarPortrait'
import {
  catalogNavigateArgs,
  filterCommandCatalog,
  goToCommands,
  searchPageLocation,
  type CommandCatalogItem,
  type SearchTab,
} from '@/lib/command-catalog'
import { MEMBER_SEARCH_MIN_CHARS } from '@/lib/member-search'
import { memberDossierLocation } from '@/lib/member-handle'
import { isAdminOnlyPath } from '@/lib/admin-access'
import { isHiddenPagePath } from '@/lib/hidden-pages'
import type { MemberSearchResult } from '@/lib/connections'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'
import {
  clearSearchRecents,
  getSearchRecents,
  pageFromRecent,
  personFromRecent,
  rememberOpenedPage,
  rememberOpenedPerson,
  rememberOpenedQuery,
  type SearchRecentEntry,
} from '@/lib/search-recents'

type PaletteRow =
  | { kind: 'person'; member: MemberSearchResult }
  | { kind: 'page'; command: CommandCatalogItem }
  | { kind: 'see-all' }

function runCatalogCommand(
  command: CommandCatalogItem,
  navigate: ReturnType<typeof useNavigate>,
  close: () => void,
) {
  const dest = catalogNavigateArgs(command)
  if (dest) navigate(dest)
  close()
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const session = useAuthSession()
  const hiddenAccess = useHiddenPageAccess()
  const includeHidden = hiddenAccess.canView && !hiddenAccess.pending
  const includeAdminOnly = includeHidden
  const close = () => setIsOpen(false)

  const signedIn = session.isAuthenticated && !session.isGuest
  const memberId = signedIn ? session.userId : null
  const [recents, setRecents] = useState<SearchRecentEntry[]>([])
  const trimmed = query.trim()
  const peopleEnabled = isOpen && signedIn && trimmed.length >= MEMBER_SEARCH_MIN_CHARS
  const { results: people, searching: searchingPeople } = useMemberSearch(query, peopleEnabled)
  const visibleRecents = recents.filter((entry) => {
    if (entry.kind !== 'page') return true
    const destination = pageFromRecent(entry).to
    if (isAdminOnlyPath(destination) && !includeAdminOnly) return false
    if (includeHidden) return true
    return !isHiddenPagePath(destination)
  })
  const showRecents = signedIn && !trimmed && visibleRecents.length > 0

  const filteredCommands = useMemo(
    () =>
      trimmed
        ? filterCommandCatalog(query, undefined, { includeHidden, includeAdminOnly })
        : filterCommandCatalog('', goToCommands(), { includeHidden, includeAdminOnly }),
    [query, trimmed, includeHidden, includeAdminOnly],
  )

  const rows: PaletteRow[] = useMemo(() => {
    const next: PaletteRow[] = []
    if (peopleEnabled) {
      for (const member of people) next.push({ kind: 'person', member })
    }
    for (const command of filteredCommands) next.push({ kind: 'page', command })
    if (trimmed) next.push({ kind: 'see-all' })
    return next
  }, [peopleEnabled, people, filteredCommands, trimmed])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    const handleCustomOpen = () => setIsOpen(true)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-command-palette', handleCustomOpen)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-command-palette', handleCustomOpen)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query, people])

  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const row = listRef.current?.querySelector<HTMLElement>('[data-selected]')
    row?.scrollIntoView?.({ block: 'nearest' })
  }, [selectedIndex])

  useEffect(() => {
    if (!isOpen) return
    setRecents(memberId ? getSearchRecents(memberId) : [])
  }, [isOpen, memberId])

  const goToSearch = (type: SearchTab) => {
    if (memberId && trimmed) {
      setRecents(rememberOpenedQuery(memberId, trimmed, type))
    }
    navigate(searchPageLocation(trimmed, type))
    close()
  }

  const activateRow = (row: PaletteRow | undefined) => {
    if (!row) {
      if (trimmed) goToSearch(people.length > 0 ? 'people' : 'pages')
      return
    }
    if (row.kind === 'person') {
      if (memberId) setRecents(rememberOpenedPerson(memberId, row.member))
      navigate(memberDossierLocation(row.member))
      close()
      return
    }
    if (row.kind === 'page') {
      if (memberId) setRecents(rememberOpenedPage(memberId, row.command))
      runCatalogCommand(row.command, navigate, close)
      return
    }
    goToSearch(people.length > 0 ? 'people' : 'pages')
  }

  const activateRecent = (entry: SearchRecentEntry) => {
    if (entry.kind === 'query') {
      setQuery(entry.query)
      return
    }
    if (entry.kind === 'person') {
      activateRow({ kind: 'person', member: personFromRecent(entry) })
      return
    }
    activateRow({ kind: 'page', command: pageFromRecent(entry) })
  }

  const clearRecents = () => {
    setRecents(clearSearchRecents(memberId))
  }

  const handleKeyDownMenu = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, rows.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev === 0 ? rows.length - 1 : prev - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      activateRow(rows[selectedIndex])
    }
  }

  const showPeople = peopleEnabled && people.length > 0
  const showGuestPeopleNote = !signedIn && trimmed.length >= MEMBER_SEARCH_MIN_CHARS
  const noMatches = Boolean(trimmed) && filteredCommands.length === 0 && !showPeople
  const seeAllIndex = rows.length - 1
  let rowCursor = 0

  return (
    <>
      {isOpen && (
        <div
          data-testid="command-palette-overlay"
          className="fixed inset-0 z-[99995] bg-abyss/85 backdrop-blur-sm flex items-stretch sm:items-start justify-center sm:pt-[12vh] sm:px-6 animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            data-testid="command-palette-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="w-full sm:max-w-[720px] h-[100dvh] sm:h-auto sm:max-h-[76vh] flex flex-col overflow-hidden font-sans text-sm bg-surface-1 sm:rounded-card sm:border sm:border-line sm:shadow-menu pt-[env(safe-area-inset-top,0px)] sm:pt-0"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDownMenu}
          >
            <div className="shrink-0 flex items-center gap-2 sm:gap-3 pl-4 pr-2 sm:pl-5 sm:pr-3 h-14 sm:h-16 border-b border-line-subtle">
              <Search className="w-5 h-5 text-ink-muted shrink-0" aria-hidden="true" />
              <input
                type="search"
                autoFocus
                enterKeyHint="go"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Search pages and members"
                aria-label="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-ink placeholder:text-ink-muted focus:outline-hidden text-base sm:text-lg font-sans [&::-webkit-search-cancel-button]:hidden"
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={() => setIsOpen(false)}
                className="shrink-0 rounded-control min-h-[40px] min-w-[40px] px-2 flex items-center justify-center text-ink-body hover:text-ink hover:bg-surface-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
              >
                <span className="sm:hidden text-sm font-semibold">Cancel</span>
                <X className="hidden sm:block w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-scroll px-2 sm:px-3 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-3">
              {showRecents && (
                <section data-testid="command-palette-recents" className="pt-1 pb-3">
                  <div className="flex items-center justify-between gap-2 px-2 h-9">
                    <SectionLabel>Recents</SectionLabel>
                    <button
                      type="button"
                      data-testid="command-palette-recents-clear"
                      onClick={clearRecents}
                      className="rounded-control text-xs text-ink-muted hover:text-ink transition-colors min-h-[36px] px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                      aria-label="Clear recents"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 px-2">
                    {visibleRecents.map((entry) => (
                      <RecentChip
                        key={searchRecentChipKey(entry)}
                        entry={entry}
                        onOpen={() => activateRecent(entry)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {showPeople && (
                <section data-testid="command-palette-people" className="pb-2">
                  <div className="px-2 h-9 flex items-center">
                    <SectionLabel>People</SectionLabel>
                  </div>
                  {people.map((member) => {
                    const idx = rowCursor++
                    return (
                      <ResultRow
                        key={member.id}
                        testId={`command-palette-person-${member.id}`}
                        selected={idx === selectedIndex}
                        onSelect={() => setSelectedIndex(idx)}
                        onOpen={() => activateRow({ kind: 'person', member })}
                        leading={
                          <LobsterAvatarPortrait
                            config={(member.avatarConfig as LobsterAvatarConfig | null) ?? null}
                            className="w-9 h-9 shrink-0"
                            size={72}
                          />
                        }
                        title={member.displayName}
                        detail={`Stage ${member.stage} · ${member.stageLabel}`}
                      />
                    )
                  })}
                </section>
              )}

              {filteredCommands.length > 0 && (
                <section data-testid="command-palette-pages">
                  <div className="px-2 h-9 flex items-center">
                    <SectionLabel>{trimmed ? 'Pages' : 'Go to'}</SectionLabel>
                  </div>
                  {filteredCommands.map((cmd) => {
                    const idx = rowCursor++
                    return (
                      <ResultRow
                        key={cmd.id}
                        selected={idx === selectedIndex}
                        onSelect={() => setSelectedIndex(idx)}
                        onOpen={() => activateRow({ kind: 'page', command: cmd })}
                        leading={
                          <span className="w-9 h-9 shrink-0 rounded-control bg-surface-2 border border-line-subtle flex items-center justify-center">
                            <CommandCatalogIcon icon={cmd.icon} />
                          </span>
                        }
                        title={cmd.label}
                        detail={cmd.category === 'Page' ? undefined : cmd.category}
                      />
                    )
                  })}
                </section>
              )}

              {signedIn && peopleEnabled && searchingPeople && people.length === 0 && (
                <p className="px-3 py-3 text-xs text-ink-muted">Searching members…</p>
              )}

              {noMatches && !searchingPeople && (
                <div className="px-3 py-8 text-center">
                  <p className="text-sm text-ink-body">Nothing matches “{trimmed}”.</p>
                </div>
              )}

              {trimmed && (
                <div className={noMatches ? 'flex justify-center' : 'pt-2 mt-1 border-t border-line-subtle'}>
                  <button
                    type="button"
                    data-testid="command-palette-see-all"
                    onClick={() => goToSearch(people.length > 0 ? 'people' : 'pages')}
                    data-selected={(!noMatches && selectedIndex === seeAllIndex) || undefined}
                    onMouseEnter={() => setSelectedIndex(seeAllIndex)}
                    className={
                      noMatches
                        ? 'rounded-control min-h-[44px] px-4 inline-flex items-center gap-2 border border-line bg-surface-2 text-ink font-semibold hover:border-line-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
                        : `w-full text-left rounded-control px-3 min-h-[48px] flex items-center gap-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow ${
                            selectedIndex === seeAllIndex ? 'bg-surface-2 text-ink' : 'text-ink-body hover:bg-surface-2'
                          }`
                    }
                  >
                    {noMatches ? (
                      <>
                        <Search className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                        Search everything
                      </>
                    ) : (
                      <>
                        <span className="w-9 h-9 shrink-0 flex items-center justify-center">
                          <Search className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                        </span>
                        <span className="flex-1 min-w-0 truncate">
                          See all results for <span className="text-ink font-semibold">“{trimmed}”</span>
                        </span>
                        <ArrowRight className="w-4 h-4 text-ink-muted shrink-0" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {showGuestPeopleNote && (
                <p className="px-3 pt-3 text-xs text-ink-muted">
                  Sign in to search members. You can still search pages.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] uppercase tracking-[0.12em] text-ink-muted font-semibold">
      {children}
    </span>
  )
}

function ResultRow({
  testId,
  selected,
  onSelect,
  onOpen,
  leading,
  title,
  detail,
}: {
  testId?: string
  selected: boolean
  onSelect: () => void
  onOpen: () => void
  leading: React.ReactNode
  title: string
  detail?: string
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      data-selected={selected || undefined}
      onClick={onOpen}
      onMouseEnter={onSelect}
      className={`w-full text-left rounded-control px-2 sm:px-3 min-h-[52px] py-1.5 flex items-center gap-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow ${
        selected ? 'bg-surface-2 text-ink' : 'text-ink-body hover:bg-surface-2'
      }`}
    >
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] sm:text-sm font-semibold text-ink truncate">{title}</span>
        {detail && <span className="block text-xs text-ink-muted truncate">{detail}</span>}
      </span>
    </button>
  )
}

function searchRecentChipKey(entry: SearchRecentEntry): string {
  if (entry.kind === 'query') return `query:${entry.query.toLowerCase()}`
  if (entry.kind === 'person') return `person:${entry.memberId}`
  return `page:${entry.commandId}`
}

function RecentChip({
  entry,
  onOpen,
}: {
  entry: SearchRecentEntry
  onOpen: () => void
}) {
  const livePage = entry.kind === 'page' ? pageFromRecent(entry) : null
  const label =
    entry.kind === 'query'
      ? entry.query
      : entry.kind === 'person'
        ? entry.displayName
        : livePage?.label ?? entry.label
  const testId =
    entry.kind === 'query'
      ? `command-palette-recent-query-${entry.query}`
      : entry.kind === 'person'
        ? `command-palette-recent-person-${entry.memberId}`
        : `command-palette-recent-page-${entry.commandId}`

  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onOpen}
      className="max-w-full inline-flex items-center gap-2 px-3 min-h-[40px] rounded-control border border-line-subtle bg-surface-2 text-ink hover:border-line-hover hover:bg-surface-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
    >
      {entry.kind === 'query' ? (
        <Search className="w-3.5 h-3.5 text-ink-muted shrink-0" aria-hidden="true" />
      ) : entry.kind === 'person' ? (
        <LobsterAvatarPortrait
          config={(entry.avatarConfig as LobsterAvatarConfig | null) ?? null}
          className="w-5 h-5 shrink-0"
          size={40}
        />
      ) : (
        <CommandCatalogIcon icon={livePage?.icon ?? entry.icon} />
      )}
      <span className="text-sm font-medium truncate">{label}</span>
    </button>
  )
}
