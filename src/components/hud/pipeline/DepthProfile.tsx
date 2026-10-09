import React from 'react'
import { MAX_DEPTH_M, PIPELINE_CLEARANCES, type Clearance } from '@/lib/pipeline-explorer'
import { stageAccent } from './shared'

/** Water pressure in atmospheres at a depth: one at the surface, plus about one per 10 m of seawater. */
export function pressureAtm(depthM: number): number {
  return Math.round(1 + depthM / 10)
}

/**
 * The whole water column drawn to scale, surface to Challenger Deep, with the selected clearance's
 * depth band lit. It shows how much of the descent lies below the first two stages.
 */
export function DepthProfile({ clearance }: { clearance: Clearance }) {
  const accent = stageAccent(clearance.stageNum)
  const width = Math.max(0.8, ((clearance.depthToM - clearance.depthFromM) / MAX_DEPTH_M) * 100)
  const left = Math.min(100 - width, (clearance.depthFromM / MAX_DEPTH_M) * 100)
  const fmt = (n: number) => n.toLocaleString('en-US')
  const lowAtm = pressureAtm(clearance.depthFromM)
  const highAtm = pressureAtm(clearance.depthToM)

  return (
    <div className="rounded-card border border-line-subtle bg-surface-1 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">Water column, to scale</span>
        <span className="text-xs text-ink-body">
          Pressure{' '}
          <strong className="font-grotesk text-ink">
            {lowAtm === highAtm ? fmt(highAtm) : `${fmt(lowAtm)}–${fmt(highAtm)}`} atm
          </strong>
        </span>
      </div>

      <div className="relative mt-3 h-6 overflow-hidden rounded-chip" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-glow/25 via-cyan-dark/40 to-abyss" />
        {PIPELINE_CLEARANCES.slice(1).map((c) => (
          <span
            key={c.code}
            className="absolute inset-y-0 w-px bg-line-subtle"
            style={{ left: `${(c.depthFromM / MAX_DEPTH_M) * 100}%` }}
          />
        ))}
        <span
          className="absolute inset-y-0 transition-[left,width] duration-700"
          style={{ left: `${left}%`, width: `${width}%`, background: accent.hex, boxShadow: `0 0 12px rgba(${accent.rgb}, 0.6)` }}
        />
      </div>

      <div className="mt-1.5 flex justify-between text-[11px] text-ink-muted">
        <span>Surface</span>
        <span>{fmt(MAX_DEPTH_M)} m</span>
      </div>
      <p className="sr-only">
        {clearance.code} sits between {fmt(clearance.depthFromM)} and {fmt(clearance.depthToM)} meters of a{' '}
        {fmt(MAX_DEPTH_M)} meter column.
      </p>
    </div>
  )
}
