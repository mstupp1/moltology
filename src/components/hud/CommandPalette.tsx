import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Search, X, Users, FileText } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useMemberSearch } from '@/hooks/useMemberSearch'
import { CommandCatalogIcon } from '@/components/hud/CommandCatalogIcon'
import { LobsterAvatarPortrait } from '@/components/hud/LobsterAvatarPortrait'
import {
  filterCommandCatalog,
  searchPageLocation,
  type CommandCatalogItem,
  type SearchTab,
} from '@/lib/command-catalog'
import { MEMBER_SEARCH_MIN_CHARS } from '@/lib/member-search'
import type { MemberSearchResult } from '@/lib/connections'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'

type PaletteRow =
  | { kind: 'person'; member: MemberSearchResult }
  | { kind: 'page'; command: CommandCatalogItem }
  | { kind: 'see-all' }

function runCatalogCommand(
  command: CommandCatalogItem,
  navigate: ReturnType<typeof useNavigate>,
  toast: ReturnType<typeof useToast>['toast'],
  close: () => void,
) {
  if (command.to) {
    navigate({ to: command.to })
  } else if (command.toast) {
    toast.success(command.toast.message, {
      id: command.toast.id,
      title: command.toast.title,
    })
  }
  close()
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const { toast } = useToast()
  const session = useAuthSession()
  const close = () => setIsOpen(false)

  const signedIn = session.isAuthenticated && !session.isGuest
  const trimmed = query.trim()
  const peopleEnabled = isOpen && signedIn && trimmed.length >= MEMBER_SEARCH_MIN_CHARS
  const { results: people, searching: searchingPeople } = useMemberSearch(query, peopleEnabled)

  const filteredCommands = useMemo(() => filterCommandCatalog(query), [query])

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
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      } else if (e.key === 'Escape' && isOpen) {
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

  const goToSearch = (type: SearchTab) => {
    navigate(searchPageLocation(trimmed, type))
    close()
  }

  const activateRow = (row: PaletteRow | undefined) => {
    if (!row) {
      if (trimmed) goToSearch(people.length > 0 ? 'people' : 'pages')
      return
    }
    if (row.kind === 'person') {
      navigate({ to: '/member/$profileId', params: { profileId: row.member.id } })
      close()
      return
    }
    if (row.kind === 'page') {
      runCatalogCommand(row.command, navigate, toast, close)
      return
    }
    goToSearch(people.length > 0 ? 'people' : 'pages')
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

  const showPeopleSection = peopleEnabled || (trimmed.length >= MEMBER_SEARCH_MIN_CHARS && !signedIn)
  let pageCursor = 0

  return (
    <>
      {isOpen && (
        <div
          data-testid="command-palette-overlay"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-8 sm:pt-20 px-3 sm:px-4 animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            data-testid="command-palette-modal"
            className="w-full max-w-2xl bg-[#0b0f0f] border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 overflow-hidden chamfer-corner-lg font-sans text-sm max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDownMenu}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-900/40 bg-[#0f1414] shrink-0">
              <div className="flex items-center space-x-3 flex-1">
                <Search className="w-5 h-5 text-cyan-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type a command or search protocol (e.g. Market, Purge, a designation)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none w-full text-xs sm:text-sm font-sans"
                />
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-red-400 p-1 min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[55vh] sm:max-h-80 overflow-y-auto touch-pan-scroll p-2 space-y-1 flex-1">
              {showPeopleSection && (
                <div data-testid="command-palette-people" className="space-y-1">
                  <div className="px-2 pt-1 pb-0.5 text-[10px] uppercase tracking-widest text-cyan-600 font-semibold flex items-center gap-1.5">
                    <Users className="w-3 h-3" />
                    People
                  </div>
                  {!signedIn && (
                    <p className="px-3 py-2 text-xs text-[#839493]">
                      Sign in to search fellow members. Page jumps stay open.
                    </p>
                  )}
                  {signedIn && searchingPeople && people.length === 0 && (
                    <p className="px-3 py-2 text-xs text-[#839493]">Listening for designations…</p>
                  )}
                  {signedIn &&
                    !searchingPeople &&
                    people.length === 0 &&
                    trimmed.length >= MEMBER_SEARCH_MIN_CHARS && (
                      <p className="px-3 py-2 text-xs text-[#839493]">
                        The trench stayed quiet. No designation, larva unit, or name surfaced.
                      </p>
                    )}
                  {people.map((member) => {
                    const idx = pageCursor++
                    const isSelected = idx === selectedIndex
                    return (
                      <button
                        key={member.id}
                        type="button"
                        data-testid={`command-palette-person-${member.id}`}
                        onClick={() => activateRow({ kind: 'person', member })}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full text-left px-3 py-2.5 min-h-[44px] flex items-center gap-3 transition-colors ${
                          isSelected
                            ? 'bg-cyan-950/60 border-l-2 border-cyan-400 text-cyan-200'
                            : 'text-gray-300 hover:bg-gray-900/60'
                        }`}
                      >
                        <LobsterAvatarPortrait
                          config={(member.avatarConfig as LobsterAvatarConfig | null) ?? null}
                          className="w-8 h-8 shrink-0"
                          size={64}
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-xs tracking-wide truncate">
                            {member.displayName}
                          </div>
                          <div className="text-[10px] text-cyan-600 uppercase tracking-widest">
                            Stage {member.stage} · {member.stageLabel}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              <div data-testid="command-palette-pages" className="space-y-1">
                {trimmed.length >= MEMBER_SEARCH_MIN_CHARS && (
                  <div className="px-2 pt-2 pb-0.5 text-[10px] uppercase tracking-widest text-cyan-600 font-semibold flex items-center gap-1.5">
                    <FileText className="w-3 h-3" />
                    Pages
                  </div>
                )}
                {filteredCommands.length === 0 && !trimmed ? (
                  <div className="p-6 text-center text-gray-500 text-xs tracking-wider">
                    The Path is listening. Name a chamber or a rite.
                  </div>
                ) : filteredCommands.length === 0 ? null : (
                  filteredCommands.map((cmd) => {
                    const idx = pageCursor++
                    const isSelected = idx === selectedIndex
                    return (
                      <button
                        key={cmd.id}
                        type="button"
                        onClick={() => activateRow({ kind: 'page', command: cmd })}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full text-left px-3 py-2.5 min-h-[44px] flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-cyan-950/60 border-l-2 border-cyan-400 text-cyan-200'
                            : 'text-gray-300 hover:bg-gray-900/60'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-1.5 bg-[#0f1414] border border-cyan-900/40">
                            <CommandCatalogIcon icon={cmd.icon} />
                          </div>
                          <div>
                            <div className="font-semibold text-xs tracking-wide">{cmd.label}</div>
                            <div className="text-[10px] text-cyan-600 uppercase tracking-widest">
                              {cmd.category}
                            </div>
                          </div>
                        </div>
                        {cmd.shortcut && (
                          <span className="text-[10px] bg-black/60 border border-gray-800 text-gray-400 px-2 py-0.5 font-sans">
                            {cmd.shortcut}
                          </span>
                        )}
                      </button>
                    )
                  })
                )}
              </div>

              {trimmed && (
                <button
                  type="button"
                  data-testid="command-palette-see-all"
                  onClick={() => goToSearch(people.length > 0 ? 'people' : 'pages')}
                  onMouseEnter={() => setSelectedIndex(rows.length - 1)}
                  className={`w-full text-left px-3 py-2.5 min-h-[44px] flex items-center justify-between transition-colors ${
                    selectedIndex === rows.length - 1
                      ? 'bg-cyan-950/60 border-l-2 border-cyan-400 text-cyan-200'
                      : 'text-gray-300 hover:bg-gray-900/60'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs tracking-wide">See all</div>
                    <div className="text-[10px] text-cyan-600 uppercase tracking-widest">
                      Open full search for {trimmed}
                    </div>
                  </div>
                  <Search className="w-4 h-4 text-cyan-400" />
                </button>
              )}

              {rows.length === 0 && (
                <div className="p-6 text-center text-gray-500 text-xs tracking-wider">
                  The Path heard you. No shells or chambers answered.
                </div>
              )}
            </div>

            <div className="px-4 py-2 bg-[#070b0b] border-t border-cyan-950 text-[10px] text-gray-500 flex justify-between items-center">
              <div>
                Navigation: <span className="text-cyan-400">↑ ↓</span> to move,{' '}
                <span className="text-cyan-400">↵</span> to select
              </div>
              <div className="text-red-500 font-semibold uppercase tracking-widest">
                SYNAPTIC PATH COMMAND CORE
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
