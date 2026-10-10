import React, { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Activity, Boxes, Eye, FlaskConical, ShieldCheck, Users } from 'lucide-react'
import { CovenantWatchPage } from '@/components/forum/CovenantWatchPage'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import {
  getAdminTelemetryFn,
  getMyExperimentsFn,
  listAdminPurchasesFn,
  searchAdminMembersFn,
  setAdminMemberRoleFn,
  setExperimentFn,
  type AdminMemberDirectory,
  type AdminMemberRole,
  type AdminPurchaseRow,
  type AdminTelemetry,
  type ExperimentRow,
} from '@/lib/server/api'

type AdminTab = 'watch' | 'sectors' | 'members' | 'purchases' | 'experiments'

const TABS: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'watch', label: 'Covenant Watch', icon: Eye },
  { id: 'sectors', label: 'Sectors', icon: Boxes },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'purchases', label: 'Purchases', icon: Activity },
  { id: 'experiments', label: 'Experiments', icon: FlaskConical },
]

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

export function AdminOversightHub() {
  const session = useAuthSession()
  const [tab, setTab] = useState<AdminTab>('watch')
  const [telemetry, setTelemetry] = useState<AdminTelemetry | null>(null)
  const [telemetryError, setTelemetryError] = useState<string | null>(null)

  const loadTelemetry = useCallback(async () => {
    if (!session.userId || session.isPending) return
    try {
      const next = await getAdminTelemetryFn({ data: await authData(session.userId) })
      setTelemetry(next)
      setTelemetryError(next.healthy ? null : 'System status could not be read.')
    } catch (err: unknown) {
      setTelemetry(null)
      setTelemetryError(err instanceof Error ? err.message : 'System status could not be read.')
    }
  }, [session.userId, session.isPending])

  useEffect(() => {
    void loadTelemetry()
  }, [loadTelemetry])

  return (
    <div className="space-y-3.5 sm:space-y-5 font-sans" data-testid="admin-oversight-hub">
      <HudTitlePanel
        accent="cyan"
        eyebrow="Steward oversight"
        title="Admin"
        description="Moderation, member clearance, purchases, and system status for staff."
      />

      <section
        className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
        data-testid="admin-telemetry"
        aria-label="System status"
      >
        <StatusCard label="Pending flags" value={telemetry ? String(telemetry.pendingFlags) : '—'} />
        <StatusCard label="Active sessions" value={telemetry ? String(telemetry.activeSessions) : '—'} />
        <StatusCard
          label="Health"
          value={telemetryError ? 'Unavailable' : telemetry?.healthy ? 'Healthy' : '—'}
          tone={telemetryError ? 'amber' : 'cyan'}
        />
      </section>
      {telemetryError ? (
        <p className="text-xs text-amber-400" data-testid="admin-telemetry-error">
          {telemetryError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Admin sections">
        {TABS.map((item) => {
          const Icon = item.icon
          const selected = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              data-testid={`admin-tab-${item.id}`}
              onClick={() => setTab(item.id)}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-t-control border-b-2 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                selected
                  ? 'border-cyan-glow bg-surface-2 text-ink'
                  : 'border-transparent text-ink-muted hover:bg-surface-2 hover:text-ink'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          )
        })}
      </div>

      {tab === 'watch' ? <CovenantWatchPage onChanged={() => void loadTelemetry()} /> : null}
      {tab === 'sectors' ? <SectorDirectory /> : null}
      {tab === 'members' ? (
        <MemberDirectory userId={session.userId} onChanged={() => void loadTelemetry()} />
      ) : null}
      {tab === 'purchases' ? <PurchaseLedger userId={session.userId} /> : null}
      {tab === 'experiments' ? <ExperimentSwitches userId={session.userId} /> : null}
    </div>
  )
}

function StatusCard({
  label,
  value,
  tone = 'cyan',
}: {
  label: string
  value: string
  tone?: 'cyan' | 'amber'
}) {
  return (
    <div className="hud-sheen rounded-card border border-line-subtle bg-surface-1 p-3 sm:p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">{label}</p>
      <p className={`mt-1 font-grotesk text-xl font-bold ${tone === 'amber' ? 'text-amber-400' : 'text-cyan-glow'}`}>
        {value}
      </p>
    </div>
  )
}

const SECTORS = [
  {
    title: 'Logic Atlas',
    detail: 'Map of business rules, where they live in code, and the decisions behind them.',
    to: '/admin/logic' as const,
  },
  {
    title: 'Premium',
    detail: 'Membership tools for this account.',
    to: '/premium' as const,
  },
  {
    title: 'Composite Studio',
    detail: 'Preview layouts. Headless capture still runs from the project scripts.',
    to: '/render/composite' as const,
  },
]

function SectorDirectory() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5" data-testid="admin-sectors">
      {SECTORS.map((sector) => (
        <Link
          key={sector.to}
          to={sector.to}
          className="hud-sheen rounded-card border border-line-subtle bg-surface-1 p-4 transition-colors hover:border-line-strong hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
        >
          <h2 className="font-grotesk text-sm font-bold uppercase tracking-[0.08em] text-ink">{sector.title}</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{sector.detail}</p>
        </Link>
      ))}
    </section>
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
    <section className="hud-sheen rounded-card border border-line-subtle bg-surface-1 p-3 sm:p-4 md:p-5 space-y-3" data-testid="admin-members">
      <div className="flex flex-col sm:flex-row sm:items-end gap-2">
        <label className="flex-1 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
            Search handle, larva id, or email
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full min-h-[40px] rounded-control border border-line bg-surface-2 px-3 text-sm text-ink outline-none transition-colors hover:border-line-hover focus:border-cyan-glow focus:shadow-field-focus"
            data-testid="admin-member-search"
          />
        </label>
        <button
          type="button"
          onClick={() => void load(query)}
          className="hud-sheen min-h-[40px] rounded-control border border-line bg-surface-1 px-4 text-xs font-bold uppercase tracking-[0.08em] text-ink transition-colors hover:border-line-strong hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
        >
          Search
        </button>
      </div>
      <p className="text-xs text-ink-muted">
        Recent profiles are listed by last update. There is no separate sync log.
      </p>
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
        <ul className="space-y-2" data-testid="admin-member-list">
          {directory.members.map((member) => (
            <li key={member.id} className="rounded-card border border-line-subtle bg-surface-2 p-3 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-ink">{memberName(member.handle, member.larvaId)}</p>
                  <p className="text-[11px] text-ink-muted">
                    {member.email ?? 'No email'} · {member.larvaId}
                  </p>
                </div>
                <span className="rounded-chip bg-amber-500/15 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-amber-400">
                  {roleLabel(member.role)}
                </span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Joined {utcDate(member.createdAt)} · Updated {utcDate(member.updatedAt)}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                  <label className="text-[11px] text-ink-muted">
                    Clearance
                    <select
                      className="ml-2 min-h-[36px] rounded-control border border-line bg-surface-2 px-2 text-xs text-ink outline-none transition-colors hover:border-line-hover focus:border-cyan-glow focus:shadow-field-focus"
                      value={drafts[member.id] ?? member.role}
                      aria-label={`Clearance for ${memberName(member.handle, member.larvaId)}`}
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
                  </label>
                  <button
                    type="button"
                    disabled={savingId === member.id || (drafts[member.id] ?? member.role) === member.role}
                    onClick={() => void saveRole(member.id, member.handle)}
                    className="hud-sheen min-h-[36px] rounded-control border border-line bg-surface-1 px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink transition-colors hover:border-line-strong hover:bg-surface-2 disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-surface-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                  >
                    {savingId === member.id ? 'Saving' : 'Save clearance'}
                  </button>
                </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function PurchaseLedger({ userId }: { userId: string | null }) {
  const [rows, setRows] = useState<AdminPurchaseRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    void (async () => {
      try {
        const next = await listAdminPurchasesFn({ data: await authData(userId) })
        if (!cancelled) {
          setRows(next)
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
    <section className="hud-sheen rounded-card border border-line-subtle bg-surface-1 p-3 sm:p-4 md:p-5 space-y-3" data-testid="admin-purchases">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-amber-400" />
        <h2 className="font-grotesk text-sm font-bold uppercase tracking-[0.08em] text-ink">Purchases</h2>
      </div>
      <p className="text-xs text-ink-muted">
        Premium status and currency balances. This view does not change billing.
      </p>
      {error ? <p className="text-xs text-crimson-text">{error}</p> : null}
      {rows && rows.length === 0 && !error ? (
        <p className="text-xs text-ink-muted" data-testid="admin-purchases-empty">
          No premium or Stripe purchases are on file.
        </p>
      ) : null}
      {rows && rows.length > 0 ? (
        <ul className="space-y-2" data-testid="admin-purchase-list">
          {rows.map((row) => (
            <li key={row.id} className="rounded-card border border-line-subtle bg-surface-2 p-3 space-y-1">
              <p className="text-sm font-bold text-ink">{memberName(row.handle, row.larvaId)}</p>
              <p className="text-[11px] text-ink-muted">{row.email ?? 'No email'}</p>
              <p className="text-[11px] text-ink-body">
                {row.isPremium ? 'Premium active' : 'Premium inactive'}
                {row.hasPurchasedPremium ? ' · purchased before' : ''}
                {row.premiumStatus ? ` · ${row.premiumStatus}` : ''}
                {row.premiumPeriodEnd ? ` · through ${utcDate(row.premiumPeriodEnd)}` : ''}
              </p>
              <p className="text-[11px] text-ink-muted">
                {row.moltCredits} Molt Credits · {row.chitinGems} Chitin Gems
              </p>
            </li>
          ))}
        </ul>
      ) : null}
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
    <section className="hud-sheen rounded-card border border-line-subtle bg-surface-1 p-3 sm:p-4 md:p-5 space-y-3" data-testid="admin-experiments">
      <div className="flex items-center gap-2">
        <FlaskConical className="w-4 h-4 text-cyan-glow" />
        <h2 className="font-grotesk text-sm font-bold uppercase tracking-[0.08em] text-ink">Experiments</h2>
      </div>
      <p className="text-xs text-ink-muted">
        Unfinished features you can try on your own account. Switches apply to you only; every other member keeps the current version.
      </p>
      {error ? <p className="text-xs text-crimson-text">{error}</p> : null}
      {rows && rows.length === 0 && !error ? (
        <p className="text-xs text-ink-muted">There are no experiments right now.</p>
      ) : null}
      {rows && rows.length > 0 ? (
        <ul className="space-y-2" data-testid="admin-experiment-list">
          {rows.map((row) => (
            <li key={row.id} className="flex items-start justify-between gap-3 rounded-card border border-line-subtle bg-surface-2 p-3">
              <div className="space-y-1">
                <p className="text-sm font-bold text-ink">{row.title}</p>
                <p className="text-xs text-ink-muted">{row.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={row.on}
                aria-label={row.title}
                disabled={savingId === row.id}
                data-testid={`admin-experiment-${row.id}`}
                onClick={() => void toggle(row)}
                className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                  row.on ? 'border-cyan-glow bg-cyan-glow/30' : 'border-line bg-surface-1'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full transition-transform ${
                    row.on ? 'translate-x-6 bg-cyan-glow' : 'translate-x-1 bg-ink-muted'
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
