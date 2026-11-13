import React, { useEffect, useId, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Info } from 'lucide-react'
import { HudBottomSheet } from '@/components/ui/HudBottomSheet'
import {
  VECTORS,
  VECTOR_KEYS,
  formatBonus,
  moltmaxRating,
  type VectorKey,
  type VectorSet,
  type VectorSheet,
} from '@/lib/vectors'
import './stat-hud.css'

/** Bars run to 130 in steps of 10; the tenth segment marks the audit ceiling of 100. */
const SEGMENTS = 13

export interface StatHudProps {
  sheet: VectorSheet
  /** Gear totals if the piece being considered were equipped. */
  preview?: VectorSet | null
  /** `strip`: one row under the character (wide screens). `rail`: a narrow column beside it (phones). */
  variant: 'strip' | 'rail'
  className?: string
}

function Segments({ base, gear, next, size = 'md' }: { base: number; gear: number; next: number; size?: 'sm' | 'md' | 'lg' }) {
  // Any bonus or change gets at least one segment, so a small +2 never rounds out of sight.
  const steps = (n: number) => Math.min(SEGMENTS, Math.round(Math.max(0, n) / 10))
  const b = steps(base)
  const reach = (from: number, bonus: number) => Math.max(steps(base + bonus), bonus > 0 ? from + 1 : from)
  const low = reach(b, Math.min(gear, next))
  const high = next === gear ? low : Math.max(reach(b, Math.max(gear, next)), low + 1)
  const up = next > gear
  return (
    <span className={`stat-hud-segments stat-hud-segments-${size}`} aria-hidden="true">
      {Array.from({ length: SEGMENTS }, (_, i) => {
        const kind = i < b ? 'base' : i < low ? 'gear' : i < high ? (up ? 'up' : 'down') : 'empty'
        return <i key={i} data-kind={kind} data-cap={i === 9 ? '' : undefined} />
      })}
    </span>
  )
}

function Delta({ from, to, className = '' }: { from: number; to: number; className?: string }) {
  if (from === to) return null
  const up = to > from
  return (
    <span className={`font-bold ${up ? 'text-emerald-400' : 'text-crimson-text'} ${className}`}>
      <span aria-hidden="true">{up ? '▲' : '▼'}</span>
      {formatBonus(to - from)}
      <span className="sr-only"> if equipped</span>
    </span>
  )
}

function RatingHex({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  return (
    <span className={`stat-hud-hex stat-hud-hex-${size}`} aria-hidden="true">
      <span>{value}</span>
    </span>
  )
}

/** All five stats with what they mean. Shared by the desktop popover and the phone sheet. */
function StatGuide({
  sheet,
  preview,
  focus,
  nextRating,
}: {
  sheet: VectorSheet
  preview?: VectorSet | null
  focus: VectorKey | null
  nextRating: number | null
}) {
  const focusRef = useRef<HTMLLIElement>(null)
  useEffect(() => {
    focusRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [focus])
  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center gap-3">
        <RatingHex value={sheet.rating.total} />
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-glow">Moltmax rating</div>
          <div className="font-grotesk text-lg font-bold text-ink tabular-nums leading-tight">
            {sheet.rating.total}{' '}
            <span className="text-sm font-semibold text-ink-muted">
              = {sheet.rating.base} base{' '}
              <span className={sheet.rating.gear > 0 ? 'text-cyan-glow' : ''}>{formatBonus(sheet.rating.gear)} gear</span>
            </span>{' '}
            {nextRating !== null && <Delta from={sheet.rating.total} to={nextRating} className="text-sm" />}
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Your five stats, weighted into one score.{' '}
            {sheet.source === 'audit' ? (
              'Your base comes from the Moltmax audit.'
            ) : (
              <>
                Your base is provisional.{' '}
                <Link to="/moltmax" className="text-cyan-glow hover:text-ink font-semibold">
                  Take the audit
                </Link>{' '}
                to set your own.
              </>
            )}
          </p>
        </div>
      </div>
      <ul className="divide-y divide-line-subtle border-y border-line-subtle">
        {VECTOR_KEYS.map((k) => {
          const meta = VECTORS[k]
          const base = sheet.base[k]
          const gear = sheet.gear[k]
          const next = preview ? preview[k] : gear
          return (
            <li
              key={k}
              ref={focus === k ? focusRef : undefined}
              className={`py-2.5 px-2 -mx-2 ${focus === k ? 'stat-hud-focus' : ''}`}
              data-testid={`stat-guide-${k}`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[13px] font-bold text-ink">{meta.label}</span>
                  <span className="ml-2 text-[11px] font-bold tracking-[0.14em] text-ink-muted">{meta.short}</span>
                </div>
                <div className="shrink-0 tabular-nums text-[13px]">
                  <span className="font-bold text-ink">{base}</span>{' '}
                  <span className={gear > 0 ? 'text-cyan-glow font-semibold' : 'text-ink-muted'}>{formatBonus(gear)}</span>{' '}
                  <Delta from={gear} to={next} className="text-[12px]" />
                </div>
              </div>
              <p className="text-xs text-ink-body mt-0.5">{meta.description}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Segments base={base} gear={gear} next={next} size="lg" />
              </div>
              <p className="text-[11px] text-ink-muted mt-1">Raised by {slotNames(k)} gear.</p>
            </li>
          )
        })}
      </ul>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-muted">
        <span className="inline-flex items-center gap-1.5"><i className="stat-hud-key" data-kind="base" />Base</span>
        <span className="inline-flex items-center gap-1.5"><i className="stat-hud-key" data-kind="gear" />Gear bonus</span>
        <span className="inline-flex items-center gap-1.5"><i className="stat-hud-key" data-kind="up" />If equipped</span>
        <span className="inline-flex items-center gap-1.5"><i className="stat-hud-key" data-kind="cap" />100, the audit maximum</span>
      </div>
    </div>
  )
}

const SLOT_WORDS: Record<string, string> = {
  carapace: 'carapace',
  belt: 'belt',
  claws: 'pincer',
  head: 'head',
  legs: 'leg',
  antennae: 'antennae',
}
function slotNames(k: VectorKey): string {
  const words = VECTORS[k].slots.map((s) => SLOT_WORDS[s] ?? s)
  return words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}` : words[0]
}

/**
 * Game-style Moltmax stats for the character creator: a compact HUD that stays out of the
 * way of the character. Every stat opens a guide that spells out what it means.
 */
export const StatHud: React.FC<StatHudProps> = ({ sheet, preview, variant, className = '' }) => {
  const [open, setOpen] = useState(false)
  const [focus, setFocus] = useState<VectorKey | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const guideId = useId()
  const nextRating = preview
    ? moltmaxRating(Object.fromEntries(VECTOR_KEYS.map((k) => [k, sheet.base[k] + preview[k]])) as VectorSet)
    : null
  const show = (k: VectorKey | null) => {
    if (open && focus === k) {
      setOpen(false)
      return
    }
    setFocus(k)
    setOpen(true)
  }

  // The desktop popover closes on Escape or a click elsewhere; the phone sheet handles its own.
  useEffect(() => {
    if (!open || variant !== 'strip') return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, variant])

  const guide = <StatGuide sheet={sheet} preview={preview} focus={focus} nextRating={nextRating} />

  if (variant === 'rail') {
    return (
      <div className={`stat-hud stat-hud-rail ${className}`} data-testid="stat-hud">
        <button
          type="button"
          className="stat-hud-cell flex items-baseline justify-between w-full px-1.5 pt-1 pb-0.5 leading-none"
          aria-label={`Moltmax rating ${sheet.rating.total}. Show what the stats mean`}
          aria-haspopup="dialog"
          onClick={() => show(null)}
        >
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold tracking-[0.02em] text-cyan-glow">
            MAX
            <Info className="w-2.5 h-2.5" aria-hidden="true" />
          </span>
          <span className="font-grotesk text-[15px] font-bold text-ink tabular-nums stat-hud-glow">
            {sheet.rating.total}
          </span>
        </button>
        {VECTOR_KEYS.map((k) => {
          const meta = VECTORS[k]
          const gear = sheet.gear[k]
          const next = preview ? preview[k] : gear
          return (
            <button
              key={k}
              type="button"
              className="stat-hud-cell block w-full px-1.5 pt-0.5 pb-[3px] leading-none border-t border-line-subtle text-left"
              aria-label={`${meta.label} ${sheet.total[k]}: ${meta.description} Show what the stats mean`}
              aria-haspopup="dialog"
              data-testid={`stat-hud-${k}`}
              onClick={() => show(k)}
            >
              <span className="flex items-baseline justify-between">
                <span className="text-[11px] font-bold tracking-[0.1em] text-ink-muted">{meta.short}</span>
                <span className="text-[11px] leading-[14px] font-bold text-ink tabular-nums">
                  {next !== gear ? <Delta from={gear} to={next} className="text-[11px] mr-0.5" /> : null}
                  {sheet.total[k]}
                </span>
              </span>
              <Segments base={sheet.base[k]} gear={gear} next={next} size="sm" />
            </button>
          )
        })}
        <HudBottomSheet
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Moltmax stats"
          ariaLabel="What the Moltmax stats mean"
          maxHeight="85dvh"
        >
          <div className="overflow-y-auto px-4 pb-6 pt-1">{guide}</div>
        </HudBottomSheet>
      </div>
    )
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {open && (
        <div
          id={guideId}
          role="dialog"
          aria-label="What the Moltmax stats mean"
          className="stat-hud stat-hud-pop absolute left-0 right-0 bottom-[calc(100%+8px)] z-30 p-4 max-h-[min(560px,70vh)] overflow-y-auto"
        >
          <button
            type="button"
            className="absolute top-2 right-2 w-7 h-7 grid place-items-center text-ink-muted hover:text-ink"
            aria-label="Close"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
          {guide}
        </div>
      )}
      <div className="stat-hud stat-hud-strip flex items-stretch" data-testid="stat-hud">
        <button
          type="button"
          className="stat-hud-cell group flex items-center gap-2.5 pl-3 pr-3.5 py-2"
          aria-label={`Moltmax rating ${sheet.rating.total}. Show what the stats mean`}
          aria-expanded={open}
          aria-controls={open ? guideId : undefined}
          onClick={() => show(null)}
        >
          <RatingHex value={sheet.rating.total} size="sm" />
          <span className="text-left">
            <span className="block text-[11px] font-bold tracking-[0.14em] text-cyan-glow">MOLTMAX</span>
            <span className="block text-[11px] tabular-nums">
              <span className={sheet.rating.gear > 0 ? 'text-cyan-glow font-semibold' : 'text-ink-muted'}>
                {formatBonus(sheet.rating.gear)} gear
              </span>
              {nextRating !== null && <Delta from={sheet.rating.total} to={nextRating} className="ml-1" />}
            </span>
            <span className="block text-[11px] text-ink-muted group-hover:text-ink">What&apos;s this?</span>
          </span>
        </button>
        {VECTOR_KEYS.map((k) => {
          const meta = VECTORS[k]
          const base = sheet.base[k]
          const gear = sheet.gear[k]
          const next = preview ? preview[k] : gear
          return (
            <button
              key={k}
              type="button"
              className="stat-hud-cell group relative flex-1 min-w-0 px-3 py-2 border-l border-line-subtle text-left"
              aria-label={`${meta.label}: ${base} base, ${formatBonus(gear)} from gear. ${meta.description}`}
              aria-expanded={open && focus === k}
              aria-controls={open ? guideId : undefined}
              data-testid={`stat-hud-${k}`}
              onClick={() => show(k)}
            >
              <span className="flex items-baseline justify-between gap-1.5">
                <span className="text-[12px] font-bold text-ink truncate">{meta.label}</span>
                <span className="shrink-0 font-grotesk text-[15px] font-bold text-ink tabular-nums">{base}</span>
              </span>
              <span className="mt-1.5 block">
                <Segments base={base} gear={gear} next={next} />
              </span>
              <span className="flex items-center justify-between gap-1 mt-1 h-3.5 text-[11px] tabular-nums">
                <span className="tracking-[0.14em] font-bold text-ink-muted">{meta.short}</span>
                <span className="truncate">
                  <span className={gear > 0 ? 'text-cyan-glow font-semibold' : 'text-ink-muted'}>{formatBonus(gear)} gear</span>
                  <Delta from={gear} to={next} className="ml-1" />
                </span>
              </span>
              {/* Hover hint: the one-line meaning, so the stat reads without opening the guide. */}
              {!open && (
                <span role="tooltip" className="stat-hud-tip">
                  <span className="block font-bold text-ink">{meta.label}</span>
                  {meta.description}
                  <span className="block mt-1 text-cyan-glow">Click for all stats</span>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
