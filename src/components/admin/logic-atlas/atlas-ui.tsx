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
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#9fb3b2] ${className}`}>
      <Icon className="h-3 w-3" aria-hidden />
      {RULE_KIND_LABELS[kind]}
    </span>
  )
}

export function StatusTag({ status }: { status: RuleStatus }) {
  if (status === 'active') return null
  const tone =
    status === 'soft-launch'
      ? 'border-[#d27bff]/50 text-[#e3b4ff]'
      : 'border-[#3a4a49] text-[#839493] line-through'
  return (
    <span className={`border px-1.5 py-px text-[9px] font-bold uppercase tracking-widest ${tone}`}>
      {RULE_STATUS_LABELS[status]}
    </span>
  )
}

const DRIFT_TONES: Record<DriftState, string> = {
  ok: 'bg-[#7cff6b]',
  unverified: 'bg-[#839493]',
  changed: 'bg-[#ffb020]',
  missing: 'bg-[#ff5540]',
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
      ? 'border-[#7cff6b]/40 text-[#b8ffae]'
      : drift === 'changed'
        ? 'border-[#ffb020]/60 text-[#ffd27a]'
        : drift === 'missing'
          ? 'border-[#ff5540]/60 text-[#ffb0a4]'
          : 'border-[#3a4a49] text-[#9fb3b2]'
  return (
    <span className={`inline-flex items-center gap-1.5 border px-1.5 py-px text-[9px] font-bold uppercase tracking-widest ${tone}`}>
      <DriftDot drift={drift} />
      {DRIFT_LABELS[drift]}
    </span>
  )
}

export function FlagIcon({ flag, className = 'h-3.5 w-3.5' }: { flag: AtlasFlag; className?: string }) {
  const Icon = flag.level === 'gap' ? TriangleAlert : CircleAlert
  const tone = flag.level === 'gap' ? 'text-[#ff5540]' : 'text-[#ffb020]'
  return <Icon className={`${className} ${tone}`} aria-label={flag.level === 'gap' ? 'Known gap' : 'Watch'} />
}

export function FlagCallout({ flag }: { flag: AtlasFlag }) {
  const tone =
    flag.level === 'gap'
      ? 'border-[#ff5540]/50 bg-[#ff5540]/[0.07] text-[#ffc2b8]'
      : 'border-[#ffb020]/50 bg-[#ffb020]/[0.07] text-[#ffe0a6]'
  return (
    <div className={`flex gap-2.5 border p-3 text-xs leading-relaxed ${tone}`} role="note">
      <FlagIcon flag={flag} className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest">
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
      {count !== undefined ? <span className="text-[#5f7170]">{count}</span> : null}
    </>
  )
  const base =
    'inline-flex min-h-[30px] max-w-full items-center gap-1.5 border px-2 py-1 text-[11px] font-semibold transition-colors'
  if (!onClick) {
    return (
      <span className={`${base} border-[#243233] bg-[#0e181b] text-[#b9c6c5]`}>{content}</span>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${base} ${
        active
          ? 'bg-[#122028] text-[#dfe3e3]'
          : 'border-[#243233] bg-[#0b1011] text-[#9fb3b2] hover:border-[#3a4a49] hover:text-[#dfe3e3]'
      }`}
      style={active ? { borderColor: color } : undefined}
    >
      {content}
    </button>
  )
}
