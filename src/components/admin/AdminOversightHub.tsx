import React, { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Activity, Boxes, Eye, ShieldCheck, Users } from 'lucide-react'
import { CovenantWatchPage } from '@/components/forum/CovenantWatchPage'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import {
  getAdminTelemetryFn,
  listAdminPurchasesFn,
  searchAdminMembersFn,
  setAdminMemberRoleFn,
  type AdminMemberDirectory,
  type AdminMemberRole,
  type AdminPurchaseRow,
  type AdminTelemetry,
} from '@/lib/server/api'

type AdminTab = 'watch' | 'sectors' | 'members' | 'purchases'

const TABS: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'watch', label: 'Covenant Watch', icon: Eye },
  { id: 'sectors', label: 'Sectors', icon: Boxes },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'purchases', label: 'Purchases', icon: Activity },
]

const ROLE_OPTIONS: { value: AdminMemberRole; label: string }[] = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super admin' },
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
        <p className="text-xs text-[#ffb020]" data-testid="admin-telemetry-error">
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
              className={`inline-flex min-h-[40px] items-center gap-2 border px-3 py-2 text-xs font-bold uppercase tracking-wider chamfer-corner transition-colors ${
                selected
                  ? 'border-[#00c3ff] bg-[#00c3ff]/10 text-[#dfe3e3]'
                  : 'border-[#3a4a49] bg-[#122028] text-[#839493] hover:border-[#00c3ff]/50 hover:text-[#dfe3e3]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          )
        })}
      </div>

      {tab === 'watch' ? <CovenantWatchPage /> : null}
      {tab === 'sectors' ? <SectorDirectory /> : null}
      {tab === 'members' ? (
        <MemberDirectory userId={session.userId} onChanged={() => void loadTelemetry()} />
      ) : null}
      {tab === 'purchases' ? <PurchaseLedger userId={session.userId} /> : null}
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
    <div className="chitin-card chamfer-corner p-3 sm:p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#839493]">{label}</p>
      <p className={`mt-1 font-grotesk text-xl font-bold ${tone === 'amber' ? 'text-[#ffb020]' : 'text-[#00ffff]'}`}>
        {value}
      </p>
    </div>
  )
}

const SECTORS = [
  {
    title: 'Subterranean',
    detail: 'Hidden bio-vault chamber.',
    to: '/subterranean' as const,
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
    <section className="grid grid-cols-1 md:grid-cols-3 gap-2.5" data-testid="admin-sectors">
      {SECTORS.map((sector) => (
        <Link
          key={sector.to}
          to={sector.to}
          className="chitin-card chamfer-corner p-4 border border-[#3a4a49] hover:border-[#00c3ff]/60 transition-colors"
        >
          <h2 className="font-grotesk text-sm font-bold uppercase tracking-wider text-[#dfe3e3]">{sector.title}</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-[#839493]">{sector.detail}</p>
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
    <section className="chitin-card chamfer-corner p-3 sm:p-4 md:p-5 space-y-3" data-testid="admin-members">
      <div className="flex flex-col sm:flex-row sm:items-end gap-2">
        <label className="flex-1 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#839493]">
            Search handle, larva id, or email
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full min-h-[40px] border border-[#3a4a49] bg-[#0b1011] px-3 text-sm text-[#dfe3e3] outline-none focus:border-[#00c3ff]"
            data-testid="admin-member-search"
          />
        </label>
        <button
          type="button"
          onClick={() => void load(query)}
          className="min-h-[40px] border border-[#00c3ff]/60 bg-[#122028] px-4 text-xs font-bold uppercase tracking-wider text-[#dfe3e3]"
        >
          Search
        </button>
      </div>
      <p className="text-xs text-[#839493]">
        Recent profiles are listed by last update. There is no separate sync log.
      </p>
      {error ? (
        <p className="text-xs text-[#ff5540]" data-testid="admin-members-error">
          {error}
        </p>
      ) : null}
      {directory && directory.members.length === 0 ? (
        <p className="text-xs text-[#839493]" data-testid="admin-members-empty">
          No members matched that search.
        </p>
      ) : null}
      {directory && directory.members.length > 0 ? (
        <ul className="space-y-2" data-testid="admin-member-list">
          {directory.members.map((member) => (
            <li key={member.id} className="chitin-card-inset border border-[#3a4a49] chamfer-corner p-3 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-[#dfe3e3]">{memberName(member.handle, member.larvaId)}</p>
                  <p className="text-[11px] text-[#839493]">
                    {member.email ?? 'No email'} · {member.larvaId}
                  </p>
                </div>
                <span className="border border-[#ffb020]/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#ffb020]">
                  {roleLabel(member.role)}
                </span>
              </div>
              <p className="text-[11px] text-[#839493]">
                Joined {utcDate(member.createdAt)} · Updated {utcDate(member.updatedAt)}
              </p>
              {directory.viewerCanManageRoles ? (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-[11px] text-[#839493]">
                    Clearance
                    <select
                      className="ml-2 min-h-[36px] border border-[#3a4a49] bg-[#0b1011] px-2 text-xs text-[#dfe3e3]"
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
                    className="min-h-[36px] border border-[#3a4a49] px-3 text-[11px] font-bold uppercase tracking-wider text-[#dfe3e3] disabled:opacity-40"
                  >
                    {savingId === member.id ? 'Saving' : 'Save clearance'}
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-[#839493]">Only a super admin can change clearance.</p>
              )}
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
    <section className="chitin-card chamfer-corner p-3 sm:p-4 md:p-5 space-y-3" data-testid="admin-purchases">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#ffb020]" />
        <h2 className="font-grotesk text-sm font-bold uppercase tracking-wider text-[#dfe3e3]">Purchases</h2>
      </div>
      <p className="text-xs text-[#839493]">
        Premium status and currency balances. This view does not change billing.
      </p>
      {error ? <p className="text-xs text-[#ff5540]">{error}</p> : null}
      {rows && rows.length === 0 && !error ? (
        <p className="text-xs text-[#839493]" data-testid="admin-purchases-empty">
          No premium or Stripe purchases are on file.
        </p>
      ) : null}
      {rows && rows.length > 0 ? (
        <ul className="space-y-2" data-testid="admin-purchase-list">
          {rows.map((row) => (
            <li key={row.id} className="chitin-card-inset border border-[#3a4a49] chamfer-corner p-3 space-y-1">
              <p className="text-sm font-bold text-[#dfe3e3]">{memberName(row.handle, row.larvaId)}</p>
              <p className="text-[11px] text-[#839493]">{row.email ?? 'No email'}</p>
              <p className="text-[11px] text-[#dfe3e3]">
                {row.isPremium ? 'Premium active' : 'Premium inactive'}
                {row.hasPurchasedPremium ? ' · purchased before' : ''}
                {row.premiumStatus ? ` · ${row.premiumStatus}` : ''}
                {row.premiumPeriodEnd ? ` · through ${utcDate(row.premiumPeriodEnd)}` : ''}
              </p>
              <p className="text-[11px] text-[#839493]">
                {row.moltCredits} Molt Credits · {row.chitinGems} Chitin Gems
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
