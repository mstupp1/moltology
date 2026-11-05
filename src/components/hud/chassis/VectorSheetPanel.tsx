import React from 'react'
import { Link } from '@tanstack/react-router'
import {
  VECTORS,
  VECTOR_KEYS,
  formatBonus,
  moltmaxRating,
  type VectorKey,
  type VectorSet,
  type VectorSheet,
} from '@/lib/vectors'

/** Bars span 0 to this value; 100 is marked so gear pushing past the audit ceiling reads clearly. */
const BAR_MAX = 130

export interface VectorSheetPanelProps {
  sheet: VectorSheet
  /** Gear totals if the piece being considered were equipped. Shows "+14 → +18". */
  preview?: VectorSet | null
  /** Whose sheet this is: the member's own gets the audit link. */
  self?: boolean
  title?: string
  className?: string
  /** Drop the card frame when the panel sits inside another card. */
  bare?: boolean
  /** Hide the rating when the page already shows it nearby. */
  hideRating?: boolean
}

function Change({ from, to }: { from: number; to: number }) {
  if (from === to) return null
  const up = to > from
  return (
    <span className={`ml-1 font-semibold ${up ? 'text-emerald-500' : 'text-crimson-text'}`}>
      <span aria-hidden="true">→</span> {formatBonus(to)}
      <span className="sr-only"> if equipped ({up ? 'up' : 'down'})</span>
    </span>
  )
}

function VectorRow({
  vector,
  base,
  gear,
  preview,
}: {
  vector: VectorKey
  base: number
  gear: number
  preview?: number
}) {
  const meta = VECTORS[vector]
  const next = preview ?? gear
  const pct = (n: number) => `${Math.max(0, Math.min(100, (n / BAR_MAX) * 100))}%`
  return (
    <li className="space-y-1.5" data-testid={`vector-${vector}`}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[13px] font-semibold text-ink">{meta.label}</span>
          <span className="ml-2 text-[11px] text-ink-muted hidden sm:inline">{meta.description}</span>
        </div>
        <div className="shrink-0 tabular-nums text-[13px]" aria-label={`${meta.label} ${base} base, ${formatBonus(gear)} from gear`}>
          <span className="font-bold text-ink">{base}</span>
          <span className={`ml-1 ${gear > 0 ? 'text-cyan-glow font-semibold' : 'text-ink-muted'}`}>({formatBonus(gear)})</span>
          {preview !== undefined && <Change from={gear} to={next} />}
        </div>
      </div>
      <div className="relative h-1.5 rounded-full bg-surface-3 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-y-0 left-0 bg-ink-muted/70" style={{ width: pct(base) }} />
        <div
          className="absolute inset-y-0 bg-cyan-glow"
          style={{ left: pct(base), width: `calc(${pct(base + Math.min(gear, next))} - ${pct(base)})` }}
        />
        {next !== gear && (
          <div
            className={`absolute inset-y-0 ${next > gear ? 'bg-emerald-500/80' : 'bg-crimson-aggro/60'}`}
            style={{
              left: pct(base + Math.min(gear, next)),
              width: `calc(${pct(base + Math.max(gear, next))} - ${pct(base + Math.min(gear, next))})`,
            }}
          />
        )}
        <div className="absolute inset-y-0 w-px bg-ink/40" style={{ left: pct(100) }} />
      </div>
    </li>
  )
}

/** The member's five vectors: audit base, gear bonus, and the Moltmax rating they add up to. */
export const VectorSheetPanel: React.FC<VectorSheetPanelProps> = ({
  sheet,
  preview,
  self = false,
  title = 'Moltmax stats',
  className = '',
  bare = false,
  hideRating = false,
}) => {
  const nextRating = preview
    ? moltmaxRating(Object.fromEntries(VECTOR_KEYS.map((k) => [k, sheet.base[k] + preview[k]])) as VectorSet)
    : null
  return (
    <section
      className={`${bare ? '' : 'rounded-card border border-line-subtle bg-surface-1 hud-sheen shadow-sheen-inset p-4'} space-y-3.5 ${className}`}
      aria-label={title}
      data-testid="vector-sheet"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-grotesk text-sm font-bold text-ink tracking-[0.08em] uppercase">{title}</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            {sheet.source === 'audit' ? (
              <>Base from the Moltmax audit. Gear adds the bonus.</>
            ) : self ? (
              <>
                Provisional base.{' '}
                <Link to="/moltmax" className="text-cyan-glow hover:text-ink underline-offset-2 hover:underline">
                  Take the audit
                </Link>{' '}
                to set your own.
              </>
            ) : (
              <>Provisional base until the audit is taken.</>
            )}
          </p>
        </div>
        <div className={`shrink-0 text-right ${hideRating ? 'hidden' : ''}`}>
          <div className="text-[11px] uppercase tracking-[0.08em] text-ink-muted">Moltmax rating</div>
          <div className="tabular-nums leading-none mt-1">
            <span className="font-grotesk text-2xl font-extrabold text-ink">{sheet.rating.base}</span>
            <span className={`ml-1 text-sm ${sheet.rating.gear > 0 ? 'text-cyan-glow font-semibold' : 'text-ink-muted'}`}>
              ({formatBonus(sheet.rating.gear)})
            </span>
            {nextRating !== null && <Change from={sheet.rating.gear} to={nextRating - sheet.rating.base} />}
          </div>
        </div>
      </div>
      <ul className="space-y-3">
        {VECTOR_KEYS.map((k) => (
          <VectorRow
            key={k}
            vector={k}
            base={sheet.base[k]}
            gear={sheet.gear[k]}
            preview={preview ? preview[k] : undefined}
          />
        ))}
      </ul>
    </section>
  )
}

/** Small "+7 Shell · +1 Synapse" line for one piece. */
export function BonusList({ bonuses, className = '' }: { bonuses: VectorSet; className?: string }) {
  const parts = VECTOR_KEYS.filter((k) => bonuses[k] !== 0)
  if (parts.length === 0) return null
  return (
    <span className={`tabular-nums ${className}`}>
      {parts.map((k, i) => (
        <React.Fragment key={k}>
          {i > 0 && <span className="text-ink-muted"> · </span>}
          <span className="text-cyan-glow font-semibold">{formatBonus(bonuses[k])}</span> {VECTORS[k].label}
        </React.Fragment>
      ))}
    </span>
  )
}

/** "Shell ▲ +4 · Synapse ▼ -1": what swapping one piece would change. */
export function BonusChange({ from, to, className = '' }: { from: VectorSet; to: VectorSet; className?: string }) {
  const changed = VECTOR_KEYS.filter((k) => to[k] !== from[k])
  return (
    <span className={`tabular-nums ${className}`} data-testid="bonus-change">
      {changed.length === 0
        ? 'No stat change'
        : changed.map((k, i) => {
            const d = to[k] - from[k]
            return (
              <React.Fragment key={k}>
                {i > 0 && ' · '}
                {VECTORS[k].label}{' '}
                <span className={d > 0 ? 'text-emerald-500 font-semibold' : 'text-crimson-text font-semibold'}>
                  <span aria-hidden="true">{d > 0 ? '▲' : '▼'}</span> {formatBonus(d)}
                </span>
              </React.Fragment>
            )
          })}
    </span>
  )
}
