import React, { useEffect, useId, useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { OracleUsageSnapshot, OracleUsageWindow } from '@/lib/ai/usage-limits'
import { useOracleUsage } from '@/hooks/useOracleUsage'
import { useHiddenPageAccess } from '@/hooks/useHiddenPageAccess'
import { HudCard } from '@/components/ui/HudCard'

function UsageBar({ window, label }: { window: OracleUsageWindow; label: string }) {
  const low = window.remaining / window.limit <= 0.2
  return (
    <div className="space-y-1.5">
      <p className={`text-[11px] ${low ? 'text-amber-300' : 'text-ink-muted'}`}>
        {window.remaining} of {window.limit.toLocaleString('en-US')} remaining · {label}
      </p>
      <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={window.limit} aria-valuenow={window.remaining}
        aria-valuetext={`${window.remaining} of ${window.limit} messages remaining`}
        className="h-1 overflow-hidden rounded-full bg-surface-3">
        <div className={`h-full rounded-full ${low ? 'bg-amber-300/70' : 'bg-ink-muted/40'}`} style={{ width: `${window.remaining / window.limit * 100}%` }} />
      </div>
    </div>
  )
}

export function OracleUsage({ snapshot, unavailable, expanded = false }: {
  snapshot: OracleUsageSnapshot | null
  unavailable: boolean
  expanded?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [availableAt, setAvailableAt] = useState('')
  const detailsId = useId()
  useEffect(() => {
    setAvailableAt(snapshot?.nextAllowedAt ? new Date(snapshot.nextAllowedAt).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    }) : '')
  }, [snapshot?.nextAllowedAt])
  if (!snapshot) return unavailable ? <p className="text-[11px] text-ink-muted">Usage unavailable. Try again shortly.</p> : null
  const showDetails = expanded || open
  const exhausted = [snapshot.fiveHours.remaining === 0 && '5-hour', snapshot.week.remaining === 0 && '7-day'].filter(Boolean).join(' and ')
  return (
    <div className="space-y-2 text-ink-muted">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1"><UsageBar window={snapshot.fiveHours} label="Past 5 hours" /></div>
        {!expanded && <button type="button" className="text-[11px] underline underline-offset-2 hover:text-ink focus-visible:outline focus-visible:outline-cyan-glow"
          aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen(!open)}>{open ? 'Hide usage' : 'View usage'}</button>}
      </div>
      {showDetails && <div id={detailsId} className="space-y-2">
        <UsageBar window={snapshot.week} label="Past 7 days" />
        <p className="text-[11px]">Messages become available as older messages leave each window.</p>
      </div>}
      {exhausted && <p role="status" className="text-[11px] text-amber-300">
        {exhausted} allowance used.{availableAt && ` Next message available ${availableAt}.`}
      </p>}
      {unavailable && <p className="text-[11px]">Usage unavailable. Showing the last reading.</p>}
    </div>
  )
}

export function PlanUsageSection({ userId }: { userId: string | null }) {
  const usage = useOracleUsage(userId)
  const access = useHiddenPageAccess('premium')
  if (!userId) return null
  return <HudCard className="p-3 sm:p-4 md:p-5 space-y-3">
    <h2 className="font-grotesk text-sm font-bold text-ink">Plan &amp; usage</h2>
    {usage.snapshot && <p className="text-xs text-ink-muted">{usage.snapshot.isPremium ? 'Premium' : 'Free'} plan · Oracle messages</p>}
    <OracleUsage snapshot={usage.snapshot} unavailable={usage.unavailable} expanded />
    {access.canView && <Link to="/premium" className="inline-block text-xs text-ink-muted underline underline-offset-2 hover:text-ink">View Premium</Link>}
  </HudCard>
}
