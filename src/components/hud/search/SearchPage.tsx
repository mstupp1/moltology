import React, { useState } from 'react'
import { FileText, Loader2, Lock, LogIn, Search, UserPlus, Users } from 'lucide-react'
import { AuthModal } from '@/components/AuthModal'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { pillTabClass } from '@/components/ui/pillTab'
import { MemberSearchRow } from '@/components/hud/connections/MemberSearchRow'
import { CommandCatalogIcon } from '@/components/hud/CommandCatalogIcon'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useHiddenPageAccess } from '@/hooks/useHiddenPageAccess'
import { useMemberSearch } from '@/hooks/useMemberSearch'
import { useConnectionsSummary } from '@/hooks/useConnectionsSummary'
import {
  relationshipForMember,
  type ConnectionsListView,
} from '@/lib/connections'
import {
  catalogNavigateArgs,
  filterCommandCatalog,
  type CommandCatalogItem,
  type SearchTab,
} from '@/lib/command-catalog'
import { MEMBER_SEARCH_MIN_CHARS } from '@/lib/member-search'
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
  const hiddenAccess = useHiddenPageAccess()
  const signedIn = session.isAuthenticated && !session.isGuest
  const { results, searching } = useMemberSearch(query, signedIn)
  const connectionsSummary = useConnectionsSummary()
  const connections = signedIn && !connectionsSummary.isLoading ? connectionsSummary.connections : null
  const refreshConnections = connectionsSummary.refresh
  const navigate = useNavigate()
  const trimmed = query.trim()
  const staffCatalog = hiddenAccess.canView && !hiddenAccess.pending
  const pages = filterCommandCatalog(query, undefined, {
    includeHidden: staffCatalog,
    includeAdminOnly: staffCatalog,
  })

  const runPage = (command: CommandCatalogItem) => {
    const dest = catalogNavigateArgs(command)
    if (dest) navigate(dest)
  }

  return (
    <div className="space-y-2 sm:space-y-4 lg:space-y-5 font-sans relative">
      <HudTitlePanel
        treatment="band"
        title="Search"
        toolbar={
          <div className="flex flex-wrap gap-1" role="group" aria-label="Search for">
            {(
              [
                { id: 'people' as const, label: 'People', icon: Users },
                { id: 'pages' as const, label: 'Pages', icon: FileText },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={type === id}
                onClick={() => onTypeChange(id)}
                className={pillTabClass(type === id)}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        }
      />
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search members or pages"
            className="w-full min-h-10 pl-10 pr-3 rounded-control bg-abyss border border-line text-sm text-ink placeholder:text-ink-muted focus:outline-hidden focus:border-cyan-glow focus:shadow-field-focus"
            aria-label="Search query"
          />
          {searching && type === 'people' && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-glow animate-spin" />
          )}
        </div>

        {type === 'people' ? (
          session.isPending ? (
            <div
              data-testid="people-search-pending"
              className="h-24 border border-line-subtle/60 bg-surface-1/80 rounded-card animate-pulse"
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
      <div className="mx-auto max-w-md text-center space-y-4 border border-line-subtle bg-surface-1/80 rounded-card p-4 sm:p-5 lg:p-6">
        <div className="mx-auto w-12 h-12 rounded-full bg-abyss border border-crimson-aggro/60 text-crimson-glow flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <div className="inline-block px-3 py-1 bg-crimson-aggro/10 border border-crimson-aggro/40 text-crimson-glow text-2xs font-semibold rounded-control">
          RESTRICTED ACCESS
        </div>
        <div className="space-y-2">
          <h2 className="text-base sm:text-lg font-grotesk font-semibold text-ink">
            MEMBER SEARCH LOCKED
          </h2>
          <p className="text-xs text-ink-muted leading-relaxed max-w-sm mx-auto font-sans">
            Sign in to search members. You can still search pages.
          </p>
        </div>
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={() => handleOpenAuth('signup')}
            className="w-full py-2.5 px-5 bg-crimson-aggro hover:bg-crimson-glow text-white font-grotesk font-semibold text-xs rounded-control flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Sign up to unlock</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAuth('login')}
            className="text-xs text-cyan-glow hover:text-white underline underline-offset-4 font-sans transition-colors cursor-pointer inline-flex items-center gap-1.5"
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
      <p className="text-xs text-ink-muted text-center py-6">
        Type at least two characters of a name, handle or larva unit number.
      </p>
    )
  }

  if (searching && results.length === 0) {
    return <p className="text-xs text-ink-muted text-center py-6">Searching members…</p>
  }

  if (results.length === 0) {
    return (
      <p className="text-xs text-ink-muted text-center py-6">
        No members match that.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {results.map((member) => {
        const { relationship, pendingRequestId } = relationshipForMember(connections, member.id, member.isFriend)
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
      <p className="text-xs text-ink-muted text-center py-6">
        {query
          ? 'No pages match that. Try a shorter word.'
          : 'Showing every page. Type to narrow the list.'}
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
            className="w-full text-left px-3 py-2.5 min-h-[44px] flex items-center justify-between text-ink-body hover:bg-surface-1/60 rounded-control"
          >
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-surface-1 border border-cyan-900/40">
                <CommandCatalogIcon icon={cmd.icon} />
              </div>
              <div>
                <div className="font-semibold text-xs text-ink">{cmd.label}</div>
                <div className="eyebrow text-cyan-600">
                  {cmd.category}
                </div>
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
