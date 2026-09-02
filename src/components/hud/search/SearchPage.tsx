import React, { useCallback, useEffect, useState } from 'react'
import { FileText, Loader2, Lock, LogIn, Search, UserPlus, Users } from 'lucide-react'
import { AuthModal } from '@/components/AuthModal'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { MemberSearchRow } from '@/components/hud/connections/MemberSearchRow'
import { CommandCatalogIcon } from '@/components/hud/CommandCatalogIcon'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useMemberSearch } from '@/hooks/useMemberSearch'
import { getAuthJWTToken } from '@/lib/jwt'
import { listConnectionsFn } from '@/lib/server/api'
import {
  relationshipForMember,
  type ConnectionsListView,
} from '@/lib/connections'
import {
  filterCommandCatalog,
  type CommandCatalogItem,
  type SearchTab,
} from '@/lib/command-catalog'
import { MEMBER_SEARCH_MIN_CHARS } from '@/lib/member-search'
import { useToast } from '@/components/ui/ToastProvider'
import { useNavigate } from '@tanstack/react-router'

export function SearchPage({
  query,
  type,
  onQueryChange,
  onTypeChange,
}: {
  query: string
  type: SearchTab
  onQueryChange: (next: string) => void
  onTypeChange: (next: SearchTab) => void
}) {
  const session = useAuthSession()
  const signedIn = session.isAuthenticated && !session.isGuest
  const { results, searching } = useMemberSearch(query, signedIn)
  const [connections, setConnections] = useState<ConnectionsListView | null>(null)
  const { toast } = useToast()
  const navigate = useNavigate()
  const trimmed = query.trim()
  const pages = filterCommandCatalog(query)

  const refreshConnections = useCallback(async () => {
    if (!signedIn) {
      setConnections(null)
      return
    }
    try {
      const token = await getAuthJWTToken()
      setConnections(await listConnectionsFn({ data: { token: token ?? undefined } }))
    } catch {
      setConnections(null)
    }
  }, [signedIn])

  useEffect(() => {
    void refreshConnections()
  }, [refreshConnections])

  const runPage = (command: CommandCatalogItem) => {
    if (command.to) {
      navigate({ to: command.to })
      return
    }
    if (command.toast) {
      toast.success(command.toast.message, {
        id: command.toast.id,
        title: command.toast.title,
      })
    }
  }

  return (
    <div className="space-y-3.5 sm:space-y-5 font-sans relative">
      <HudTitlePanel
        accent="teal"
        title="Search"
        description="Find fellow members by designation, larva unit, or name. Jump to any chamber the Path already keeps."
      />

      <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#839493]" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search designations, larva units, names, or pages…"
            className="w-full pl-10 pr-3 py-2.5 bg-[#050808] border border-[#3a4a49] text-sm text-[#dfe3e3] placeholder:text-[#4a5a59] focus:outline-none focus:border-[#00c3ff] chamfer-corner"
            aria-label="Search query"
          />
          {searching && type === 'people' && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00c3ff] animate-spin" />
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-b border-[#3a4a49] pb-3">
          {(
            [
              { id: 'people' as const, label: 'People', icon: Users },
              { id: 'pages' as const, label: 'Pages', icon: FileText },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTypeChange(id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border chamfer-corner transition-colors ${
                type === id
                  ? 'border-[#00c3ff] text-[#00c3ff] bg-[#00c3ff]/10'
                  : 'border-[#3a4a49] text-[#839493] hover:border-[#00c3ff]/50'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {type === 'people' ? (
          session.isPending ? (
            <div
              data-testid="people-search-pending"
              className="h-24 border border-[#3a4a49]/60 bg-[#0f1414]/80 chamfer-corner animate-pulse"
              aria-hidden="true"
            />
          ) : signedIn ? (
            <PeopleResults
              query={trimmed}
              searching={searching}
              results={results}
              connections={connections}
              onRelationshipChange={() => void refreshConnections()}
            />
          ) : (
            <PeopleGuestLock />
          )
        ) : (
          <PagesResults query={trimmed} pages={pages} onRun={runPage} />
        )}
      </div>
    </div>
  )
}

function PeopleGuestLock() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup')

  const handleOpenAuth = (mode: 'signup' | 'login') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  return (
    <div data-testid="people-search-guest-lock" className="relative w-full py-4 sm:py-6">
      <div className="mx-auto max-w-md text-center space-y-4 border border-[#3a4a49] bg-[#090f12]/80 chamfer-corner p-5 sm:p-6">
        <div className="mx-auto w-12 h-12 rounded-full bg-[#04080a] border border-[#ff453a]/60 text-[#ff5540] flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <div className="inline-block px-3 py-1 bg-[#ff453a]/10 border border-[#ff453a]/40 text-[#ff5540] text-[10px] font-bold tracking-widest uppercase chamfer-corner">
          RESTRICTED ACCESS
        </div>
        <div className="space-y-2">
          <h2 className="text-base sm:text-lg font-grotesk font-extrabold text-[#dfe3e3] uppercase tracking-wider">
            MEMBER SEARCH LOCKED
          </h2>
          <p className="text-xs text-[#839493] leading-relaxed max-w-sm mx-auto font-sans">
            Searching fellow members takes a signed-in account. Page jumps stay open to every guest.
          </p>
        </div>
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={() => handleOpenAuth('signup')}
            className="w-full py-2.5 px-5 bg-[#ff453a] hover:bg-[#ff5540] text-white font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>SIGN UP TO UNLOCK</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAuth('login')}
            className="text-xs text-[#00c3ff] hover:text-white underline underline-offset-4 tracking-wider uppercase font-sans transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Already have an account? Sign In</span>
          </button>
        </div>
      </div>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  )
}

function PeopleResults({
  query,
  searching,
  results,
  connections,
  onRelationshipChange,
}: {
  query: string
  searching: boolean
  results: ReturnType<typeof useMemberSearch>['results']
  connections: ConnectionsListView | null
  onRelationshipChange: () => void
}) {
  if (query.length < MEMBER_SEARCH_MIN_CHARS) {
    return (
      <p className="text-xs text-[#839493] text-center py-6">
        Name a designation, a larva unit, or a name. The Path listens after two characters.
      </p>
    )
  }

  if (searching && results.length === 0) {
    return <p className="text-xs text-[#839493] text-center py-6">Listening for designations…</p>
  }

  if (results.length === 0) {
    return (
      <p className="text-xs text-[#839493] text-center py-6">
        The trench stayed quiet. No designation, larva unit, or name surfaced for that call. The Path
        still holds.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {results.map((member) => {
        const { relationship, pendingRequestId } = relationshipForMember(connections, member.id)
        return (
          <MemberSearchRow
            key={member.id}
            member={member}
            relationship={relationship}
            pendingRequestId={pendingRequestId}
            onRelationshipChange={onRelationshipChange}
          />
        )
      })}
    </ul>
  )
}

function PagesResults({
  query,
  pages,
  onRun,
}: {
  query: string
  pages: CommandCatalogItem[]
  onRun: (command: CommandCatalogItem) => void
}) {
  if (pages.length === 0) {
    return (
      <p className="text-xs text-[#839493] text-center py-6">
        {query
          ? 'No chambers answered that call. Try a shorter word, or a rite you already know.'
          : 'Every chamber is listed. Type to narrow the Path.'}
      </p>
    )
  }

  return (
    <ul className="space-y-1">
      {pages.map((cmd) => (
        <li key={cmd.id}>
          <button
            type="button"
            onClick={() => onRun(cmd)}
            className="w-full text-left px-3 py-2.5 min-h-[44px] flex items-center justify-between text-gray-300 hover:bg-gray-900/60 chamfer-corner"
          >
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-[#0f1414] border border-cyan-900/40">
                <CommandCatalogIcon icon={cmd.icon} />
              </div>
              <div>
                <div className="font-semibold text-xs tracking-wide text-[#dfe3e3]">{cmd.label}</div>
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
        </li>
      ))}
    </ul>
  )
}
