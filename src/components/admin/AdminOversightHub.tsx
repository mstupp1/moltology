import React, { useCallback, useEffect, useState } from 'react'
import { FlaskConical, Search, ShieldCheck } from 'lucide-react'
import { HudButton } from '@/components/ui/HudButton'
import { cn } from '@/lib/utils'
import { ADMIN_CARD, ADMIN_FIELD, AdminCardHeading, AdminSwitch } from '@/components/admin/admin-ui'
import type { AdminTab } from '@/components/admin/AdminSectionNav'
import { useAdminTelemetryReload } from '@/components/admin/AdminShell'
import { AdminShopOrders } from '@/components/admin/AdminShopOrders'
import { AdminStore } from '@/components/admin/AdminStore'
import { CovenantWatchPage } from '@/components/forum/CovenantWatchPage'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { LoadMoreButton } from '@/components/ui/LoadMoreButton'
import { PAGE_SIZES, mergeById, takePage } from '@/lib/pagination'
import {
  getMyExperimentsFn,
  listAdminPurchasesFn,
  searchAdminMembersFn,
  setAdminMemberRoleFn,
  setExperimentFn,
  type AdminMemberDirectory,
  type AdminMemberRole,
  type AdminPurchaseRow,
  type ExperimentRow,
} from '@/lib/server/api'

export type { AdminTab }

const ROLE_OPTIONS: { value: AdminMemberRole; label: string }[] = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
]

function roleLabel(role: AdminMemberRole): string {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? 'User'
}

function utcDate(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toISOString().slice(0, 10)
}

function memberName(handle: string | null, larvaId: string): string {
  return handle?.trim() || larvaId
}

async function authData(userId: string) {
  const token = await getAuthJWTToken().catch(() => null)
  return { userId, token: token ?? undefined }
}

export function AdminOversightHub({ tab = 'watch' }: { tab?: AdminTab }) {
  const session = useAuthSession()
  // The header band (title, tabs, status figures) is drawn by the /admin layout route (AdminShell).
  const loadTelemetry = useAdminTelemetryReload()
  return (
    <div className="space-y-2 sm:space-y-4 lg:space-y-5 font-sans" data-testid="admin-oversight-hub">
      {tab === 'watch' ? <CovenantWatchPage onChanged={() => void loadTelemetry()} /> : null}
      {tab === 'members' ? (
        <MemberDirectory userId={session.userId} onChanged={() => void loadTelemetry()} />
      ) : null}
      {tab === 'store' ? (
        <>
          <AdminShopOrders />
          <PurchaseLedger userId={session.userId} />
          <AdminStore />
        </>
      ) : null}
      {tab === 'experiments' ? <ExperimentSwitches userId={session.userId} /> : null}
    </div>
  )
}

function MemberDirectory({
  userId,
  onChanged,
}: {
  userId: string | null
  onChanged: () => void
}) {
  const toast = useOptionalToast()
  const [query, setQuery] = useState('')
  const [directory, setDirectory] = useState<AdminMemberDirectory | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, AdminMemberRole>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const load = useCallback(
    async (nextQuery: string) => {
      if (!userId) return
      try {
        const result = await searchAdminMembersFn({
          data: { ...(await authData(userId)), query: nextQuery },
        })
        setDirectory(result)
        setError(null)
        setDrafts(Object.fromEntries(result.members.map((member) => [member.id, member.role])))
      } catch (err: unknown) {
        setDirectory(null)
        setError(err instanceof Error ? err.message : 'Could not load members.')
      }
    },
    [userId],
  )

  useEffect(() => {
    void load('')
  }, [load])

  const loadMore = async () => {
    if (!userId || !directory) return
    setLoadingMore(true)
    try {
      const next = await searchAdminMembersFn({
        data: { ...(await authData(userId)), query, offset: directory.members.length },
      })
      setDirectory((current) =>
        current ? { members: mergeById(current.members, next.members), hasMore: next.hasMore } : next,
      )
      setDrafts((current) => ({
        ...Object.fromEntries(next.members.map((member) => [member.id, member.role])),
        ...current,
      }))
    } catch (err: unknown) {
      toast?.toast.error(err instanceof Error ? err.message : 'Could not load more members.')
    } finally {
      setLoadingMore(false)
    }
  }

  const saveRole = async (profileId: string, handle: string | null) => {
    if (!userId || savingId) return
    const role = drafts[profileId]
    if (!role) return
    setSavingId(profileId)
    try {
      const receipt = await setAdminMemberRoleFn({
        data: { ...(await authData(userId)), profileId, role },
      })
      toast?.toast.success(
        `Clearance for ${memberName(receipt.handle ?? handle, 'this member')} is now ${roleLabel(receipt.role)}.`,
        { id: `admin-role-${profileId}` },
      )
      onChanged()
      await load(query)
    } catch (err: unknown) {
      toast?.toast.error(err instanceof Error ? err.message : 'Could not change clearance.', {
        id: `admin-role-${profileId}`,
      })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section className={ADMIN_CARD} data-testid="admin-members">
      <form
        className="flex gap-2"
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          void load(query)
        }}
      >
        <label className="relative flex-1">
          <span className="sr-only">Search handle, larva id, or email</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" aria-hidden />
          <input
            type="search"
            value={query}
            placeholder="Search handle, larva id, or email"
            onChange={(event) => setQuery(event.target.value)}
            className={cn(ADMIN_FIELD, 'w-full pl-9')}
            data-testid="admin-member-search"
          />
        </label>
        <HudButton type="submit" variant="secondary">
          Search
        </HudButton>
      </form>
      <p className="text-xs text-ink-muted">Most recently updated first.</p>
      {error ? (
        <p className="text-xs text-crimson-text" data-testid="admin-members-error">
          {error}
        </p>
      ) : null}
      {directory && directory.members.length === 0 ? (
        <p className="text-xs text-ink-muted" data-testid="admin-members-empty">
          No members matched that search.
        </p>
      ) : null}
      {directory && directory.members.length > 0 ? (
        <ul className="divide-y divide-line-subtle border-y border-line-subtle" data-testid="admin-member-list">
          {directory.members.map((member) => {
            const name = memberName(member.handle, member.larvaId)
            const draft = drafts[member.id] ?? member.role
            return (
              <li
                key={member.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 py-2.5 md:grid-cols-[minmax(0,1fr)_auto_auto] md:gap-x-6"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <span className="truncate">{name}</span>
                    {member.role === 'admin' ? (
                      <span className="shrink-0 rounded-chip bg-amber-500/15 px-1.5 py-0.5 text-2xs font-semibold text-amber-400">
                        Admin
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-ink-muted" title={`${member.email ?? 'No email'} · ${member.larvaId}`}>
                    {member.email ?? 'No email'}
                    {member.handle ? ` · ${member.larvaId}` : ''}
                  </p>
                </div>
                <p className="hidden whitespace-nowrap text-xs text-ink-muted tabular-nums md:block" title={`Updated ${utcDate(member.updatedAt)}`}>
                  Joined {utcDate(member.createdAt)}
                </p>
                <div className="flex items-center gap-2">
                  <select
                    className={cn(ADMIN_FIELD, 'min-h-9 text-xs')}
                    value={draft}
                    aria-label={`Clearance for ${name}`}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [member.id]: event.target.value as AdminMemberRole,
                      }))
                    }
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {draft !== member.role || savingId === member.id ? (
                    <HudButton
                      size="sm"
                      disabled={savingId === member.id}
                      onClick={() => void saveRole(member.id, member.handle)}
                    >
                      {savingId === member.id ? 'Saving' : 'Save'}
                    </HudButton>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
      {directory?.hasMore ? (
        <LoadMoreButton
          label="Load more members"
          loading={loadingMore}
          testId="admin-members-load-more"
          onClick={() => void loadMore()}
        />
      ) : null}
    </section>
  )
}

const PURCHASE_PAGE = PAGE_SIZES.adminRows

function PurchaseLedger({ userId }: { userId: string | null }) {
  const [rows, setRows] = useState<AdminPurchaseRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadMore = async () => {
    if (!userId || !rows) return
    setLoadingMore(true)
    try {
      const next = await listAdminPurchasesFn({
        data: { ...(await authData(userId)), limit: PURCHASE_PAGE + 1, offset: rows.length },
      })
      const page = takePage(next, PURCHASE_PAGE)
      setRows((prev) => mergeById(prev ?? [], page.items))
      setHasMore(page.hasMore)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load purchases.')
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    void (async () => {
      try {
        const next = await listAdminPurchasesFn({ data: { ...(await authData(userId)), limit: PURCHASE_PAGE + 1 } })
        if (!cancelled) {
          const page = takePage(next, PURCHASE_PAGE)
          setRows(page.items)
          setHasMore(page.hasMore)
          setError(null)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setRows([])
          setError(err instanceof Error ? err.message : 'Could not load purchases.')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  return (
    <section className={ADMIN_CARD} data-testid="admin-purchases">
      <AdminCardHeading
        icon={<ShieldCheck />}
        title="Oracle MAX members"
        description="Oracle MAX status and currency balances. Billing changes happen in Stripe."
      />
      {error ? <p className="text-xs text-crimson-text">{error}</p> : null}
      {rows && rows.length === 0 && !error ? (
        <p className="text-xs text-ink-muted" data-testid="admin-purchases-empty">
          No Oracle MAX purchases are on file.
        </p>
      ) : null}
      {rows && rows.length > 0 ? (
        <ul className="divide-y divide-line-subtle border-y border-line-subtle" data-testid="admin-purchase-list">
          {rows.map((row) => (
            <li key={row.id} className="space-y-0.5 py-2.5">
              <p className="text-sm font-semibold text-ink">{memberName(row.handle, row.larvaId)}</p>
              <p className="text-xs text-ink-muted">{row.email ?? 'No email'}</p>
              <p className="text-xs text-ink-body">
                {row.isPremium ? 'Oracle MAX active' : 'Oracle MAX inactive'}
                {row.hasPurchasedPremium ? ' · purchased before' : ''}
                {row.premiumStatus ? ` · ${row.premiumStatus}` : ''}
                {row.premiumPeriodEnd ? ` · through ${utcDate(row.premiumPeriodEnd)}` : ''}
              </p>
              <p className="text-xs text-ink-muted">
                {row.moltCredits} Molt Credits · {row.chitinGems} Chitin Gems
              </p>
            </li>
          ))}
        </ul>
      ) : null}
      {rows && rows.length > 0 && hasMore && (
        <LoadMoreButton
          label="Load more purchases"
          loading={loadingMore}
          testId="admin-purchases-load-more"
          onClick={() => void loadMore()}
        />
      )}
    </section>
  )
}

function ExperimentSwitches({ userId }: { userId: string | null }) {
  const toast = useOptionalToast()
  const [rows, setRows] = useState<ExperimentRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    void (async () => {
      try {
        const next = await getMyExperimentsFn({ data: await authData(userId) })
        if (!cancelled) {
          setRows(next)
          setError(null)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setRows([])
          setError(err instanceof Error ? err.message : 'Could not load experiments.')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const toggle = async (row: ExperimentRow) => {
    if (!userId || savingId) return
    setSavingId(row.id)
    try {
      const next = await setExperimentFn({ data: { ...(await authData(userId)), id: row.id, on: !row.on } })
      setRows(next)
      window.dispatchEvent(new CustomEvent('experiments-changed'))
      toast?.toast.success(`${row.title} is ${row.on ? 'off' : 'on'} for you.`, { id: `admin-experiment-${row.id}` })
    } catch (err: unknown) {
      toast?.toast.error(err instanceof Error ? err.message : 'Could not change that experiment.', {
        id: `admin-experiment-${row.id}`,
      })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section className={ADMIN_CARD} data-testid="admin-experiments">
      <AdminCardHeading
        icon={<FlaskConical />}
        title="Experiments"
        description="Unfinished features you can try on your own account. Every other member keeps the current version."
      />
      {error ? <p className="text-xs text-crimson-text">{error}</p> : null}
      {rows && rows.length === 0 && !error ? (
        <p className="text-xs text-ink-muted">There are no experiments right now.</p>
      ) : null}
      {rows && rows.length > 0 ? (
        <ul className="divide-y divide-line-subtle border-y border-line-subtle" data-testid="admin-experiment-list">
          {rows.map((row) => (
            <li key={row.id} className="flex items-start justify-between gap-4 py-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-ink">{row.title}</p>
                <p className="text-xs text-ink-muted">{row.description}</p>
              </div>
              <AdminSwitch
                checked={row.on}
                label={row.title}
                disabled={savingId === row.id}
                testId={`admin-experiment-${row.id}`}
                onChange={() => void toggle(row)}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
