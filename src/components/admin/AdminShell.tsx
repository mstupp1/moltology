import React, { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { AdminSectionNav, type AdminSection } from '@/components/admin/AdminSectionNav'
import { BandStat } from '@/components/hud/BandSectionNav'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { getAdminTelemetryFn, type AdminTelemetry } from '@/lib/server/api'

const TelemetryReload = React.createContext<() => Promise<void> | void>(() => {})

/** Refreshes the band's status figures after a tab changes something they count (flags, roles). */
export function useAdminTelemetryReload() {
  return React.useContext(TelemetryReload)
}

/**
 * The Admin header band for every admin tab (Covenant Watch, Members, Store, Experiments and the
 * Logic Atlas), drawn once by the /admin layout route so switching tabs swaps only the content.
 */
export function AdminShell({ current, children }: { current: AdminSection; children: React.ReactNode }) {
  const session = useAuthSession()
  const [telemetry, setTelemetry] = useState<AdminTelemetry | null>(null)
  const [telemetryError, setTelemetryError] = useState<string | null>(null)

  const loadTelemetry = useCallback(async () => {
    if (!session.userId || session.isPending) return
    try {
      const token = await getAuthJWTToken().catch(() => null)
      const next = await getAdminTelemetryFn({ data: { userId: session.userId, token: token ?? undefined } })
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

  const flags = telemetry?.pendingFlags ?? null
  return (
    <TelemetryReload.Provider value={loadTelemetry}>
      <div className="space-y-2 sm:space-y-4 lg:space-y-5 font-sans">
        <HudTitlePanel
          treatment="band"
          title="Admin"
          sections={<AdminSectionNav current={current} />}
          actionsBelowOnPhone
          actions={
            <div className="flex items-end gap-5 sm:gap-6" data-testid="admin-telemetry" aria-label="System status" role="group">
              <BandStat label="Pending flags" value={flags === null ? '—' : String(flags)} tone={flags ? 'amber' : 'ink'} />
              <BandStat label="Sessions" value={telemetry ? String(telemetry.activeSessions) : '—'} />
              <BandStat
                label="Health"
                value={telemetryError ? 'Unavailable' : telemetry?.healthy ? 'Healthy' : '—'}
                tone={telemetryError ? 'amber' : 'cyan'}
              />
            </div>
          }
        >
          <AdminToolLinks />
        </HudTitlePanel>
        {telemetryError ? (
          <p className="text-xs text-amber-400" data-testid="admin-telemetry-error">
            {telemetryError}
          </p>
        ) : null}
        {children}
      </div>
    </TelemetryReload.Provider>
  )
}

const TOOLS = [
  { title: 'Storefront', detail: 'The shop as members see it', to: '/store' as const },
  { title: 'Oracle MAX', detail: 'Membership tools for this account', to: '/max' as const },
  { title: 'Composite Studio', detail: 'Preview render layouts', to: '/render/composite' as const },
]

/** Pages outside the admin tabs, as a quiet link row under the title. */
function AdminToolLinks() {
  return (
    <nav aria-label="Admin tools" data-testid="admin-sectors" className="pt-1">
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {TOOLS.map((tool) => (
          <li key={tool.to}>
            <Link
              to={tool.to}
              title={tool.detail}
              className="inline-flex min-h-8 items-center gap-1 rounded-control text-xs font-semibold text-ink-body transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              {tool.title}
              <ArrowUpRight className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
