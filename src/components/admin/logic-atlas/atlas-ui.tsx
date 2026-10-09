import React from 'react'
import {
  CircleAlert,
  DoorClosed,
  Gauge,
  KeyRound,
  Lock,
  Ruler,
  TriangleAlert,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import {
  DRIFT_LABELS,
  RULE_KIND_LABELS,
  RULE_STATUS_LABELS,
  type AtlasFlag,
  type DriftState,
  type RuleKind,
  type RuleStatus,
} from '@/lib/logic-atlas/types'

export const KIND_ICONS: Record<RuleKind, LucideIcon> = {
  gate: DoorClosed,
  threshold: Gauge,
  invariant: Lock,
  flow: Workflow,
  limit: Ruler,
  permission: KeyRound,
}

export function KindTag({ kind, className = '' }: { kind: RuleKind; className?: string }) {
  const Icon = KIND_ICONS[kind]
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted ${className}`}>
      <Icon className="h-3 w-3" aria-hidden />
      {RULE_KIND_LABELS[kind]}
    </span>
  )
}

export function StatusTag({ status }: { status: RuleStatus }) {
  if (status === 'active') return null
  const tone =
    status === 'soft-launch'
      ? 'border-transparent bg-purple-500/15 text-purple-300'
      : 'border-line text-ink-muted line-through'
  return (
    <span className={`rounded-chip border px-1.5 py-px text-[11px] font-bold uppercase tracking-[0.08em] ${tone}`}>
      {RULE_STATUS_LABELS[status]}
    </span>
  )
}

const DRIFT_TONES: Record<DriftState, string> = {
  ok: 'bg-emerald-500',
  unverified: 'bg-ink-muted',
  changed: 'bg-amber-500',
  missing: 'bg-crimson-aggro',
}

export function DriftDot({ drift, className = '' }: { drift: DriftState; className?: string }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${DRIFT_TONES[drift]} ${className}`}
      title={DRIFT_LABELS[drift]}
      aria-label={DRIFT_LABELS[drift]}
    />
  )
}

export function DriftBadge({ drift }: { drift: DriftState }) {
  const tone =
    drift === 'ok'
      ? 'border-transparent bg-emerald-500/15 text-emerald-400'
      : drift === 'changed'
        ? 'border-transparent bg-amber-500/15 text-amber-400'
        : drift === 'missing'
          ? 'border-transparent bg-crimson-soft text-crimson-text'
          : 'border-line text-ink-muted'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-chip border px-1.5 py-px text-[11px] font-bold uppercase tracking-[0.08em] ${tone}`}>
      <DriftDot drift={drift} />
      {DRIFT_LABELS[drift]}
    </span>
  )
}

export function FlagIcon({ flag, className = 'h-3.5 w-3.5' }: { flag: AtlasFlag; className?: string }) {
  const Icon = flag.level === 'gap' ? TriangleAlert : CircleAlert
  const tone = flag.level === 'gap' ? 'text-crimson-text' : 'text-amber-400'
  return <Icon className={`${className} ${tone}`} aria-label={flag.level === 'gap' ? 'Known gap' : 'Watch'} />
}

export function FlagCallout({ flag }: { flag: AtlasFlag }) {
  const tone =
    flag.level === 'gap'
      ? 'border-l-crimson-aggro bg-crimson-soft'
      : 'border-l-amber-500 bg-amber-500/15'
  const labelTone = flag.level === 'gap' ? 'text-crimson-text' : 'text-amber-400'
  return (
    <div
      className={`flex gap-2.5 rounded-card border border-line-subtle border-l-2 p-3 text-xs leading-relaxed text-ink-body ${tone}`}
      role="note"
    >
      <FlagIcon flag={flag} className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className={`text-[11px] font-bold uppercase tracking-[0.08em] ${labelTone}`}>
          {flag.level === 'gap' ? 'Known gap' : 'Watch'}
        </p>
        <p className="mt-1">{flag.note}</p>
      </div>
    </div>
  )
}

export function DomainChip({
  title,
  color,
  active = false,
  onClick,
  count,
}: {
  title: string
  color: string
  active?: boolean
  onClick?: () => void
  count?: number
}) {
  const content = (
    <>
      <span className="h-2 w-2 shrink-0 rotate-45" style={{ background: color }} aria-hidden />
      <span className="truncate">{title}</span>
      {count !== undefined ? <span className="text-ink-muted">{count}</span> : null}
    </>
  )
  const base =
    'inline-flex min-h-[30px] max-w-full items-center gap-1.5 rounded-control border px-2 py-1 text-[11px] font-semibold transition-colors'
  if (!onClick) {
    return (
      <span className={`${base} border-line-subtle bg-surface-2 text-ink-body`}>{content}</span>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${base} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
        active
          ? 'bg-surface-2 text-ink'
          : 'border-line-subtle bg-surface-1 text-ink-muted hover:border-line-hover hover:bg-surface-2 hover:text-ink'
      }`}
      style={active ? { borderColor: color } : undefined}
    >
      {content}
    </button>
  )
}
