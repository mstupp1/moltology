import React, { useRef } from 'react'
import { Check, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PIPELINE_CLEARANCES, MAX_DEPTH_M, formatMeters, type ClearanceStatus } from '@/lib/pipeline-explorer'
import { STAGE_PIPELINE_DATA } from '@/lib/codexData'
import { stageAccent } from './shared'

interface DepthRailProps {
  selectedIndex: number
  currentIndex: number
  /** Fractional clearance index for the member's exact XP. */
  trackPosition: number
  panelId: string
  onSelect: (index: number) => void
}

export function clearanceTabId(code: string): string {
  return `pipeline-clearance-${code}`
}

/**
 * The descent as a vertical sonar rail (a scrolling strip on phones). Each clearance is a tab
 * for the scan panel; arrow keys, Home and End move between them.
 */
export function DepthRail({ selectedIndex, currentIndex, trackPosition, panelId, onSelect }: DepthRailProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const last = PIPELINE_CLEARANCES.length - 1

  const moveTo = (index: number) => {
    const next = Math.max(0, Math.min(last, index))
    refs.current[next]?.focus()
    onSelect(next)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') moveTo(index + 1)
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') moveTo(index - 1)
    else if (event.key === 'Home') moveTo(0)
    else if (event.key === 'End') moveTo(last)
    else return
    event.preventDefault()
  }

  const statusFor = (index: number): ClearanceStatus =>
    index < currentIndex ? 'cleared' : index === currentIndex ? 'current' : 'ahead'

  return (
    <div className="relative flex flex-col rounded-card border border-line-subtle bg-surface-1 md:h-full">
      <div className="hidden md:flex items-center justify-between px-3 pt-3 pb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
        <span>Surface</span>
        <span>{formatMeters(0)}</span>
      </div>

      <div
        role="tablist"
        aria-label="Clearances, from the surface down"
        aria-orientation="vertical"
        className="relative flex gap-2 overflow-x-auto p-2 md:flex-1 md:flex-col md:gap-0 md:overflow-visible md:p-0 md:px-2"
      >
        {/* The member's exact XP position, between clearance centres. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-1 z-10 hidden -translate-y-1/2 md:block transition-[top] duration-700"
          style={{ top: `${((trackPosition + 0.5) / PIPELINE_CLEARANCES.length) * 100}%` }}
        >
          <div className="pipeline-marker flex items-center">
            <span className="h-2.5 w-2.5 rounded-full bg-crimson-aggro ring-2 ring-abyss" />
            <span className="h-0.5 w-2 bg-crimson-aggro" />
          </div>
        </div>

        {STAGE_PIPELINE_DATA.map((stage) => {
          const accent = stageAccent(stage.stageNum)
          return (
            <div
              key={stage.stageNum}
              className="flex shrink-0 gap-2 md:flex-1 md:flex-col md:justify-around md:gap-0 md:border-l-2 md:pl-2"
              style={{
                borderLeftColor: accent.hex,
                background: `linear-gradient(to bottom, rgba(${accent.rgb}, ${0.02 + stage.stageNum * 0.015}), transparent)`,
              }}
            >
              {PIPELINE_CLEARANCES.filter((c) => c.stageNum === stage.stageNum).map((clearance) => {
                const { index } = clearance
                const status = statusFor(index)
                const selected = index === selectedIndex
                return (
                  <button
                    key={clearance.code}
                    ref={(node) => {
                      refs.current[index] = node
                    }}
                    type="button"
                    role="tab"
                    id={clearanceTabId(clearance.code)}
                    aria-selected={selected}
                    aria-controls={panelId}
                    tabIndex={selected ? 0 : -1}
                    aria-label={`${clearance.code} ${clearance.sub.shortTitle}${
                      status === 'current' ? ', you are here' : status === 'cleared' ? ', cleared' : ''
                    }`}
                    onClick={() => onSelect(index)}
                    onKeyDown={(event) => onKeyDown(event, index)}
                    className={cn(
                      'group relative flex min-h-10 shrink-0 items-center gap-2 rounded-control border px-2 text-left transition-colors',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
                      selected
                        ? 'border-line-strong bg-surface-3'
                        : 'border-transparent hover:border-line hover:bg-surface-2'
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-chip border',
                        status === 'cleared' && 'border-emerald-500/60 bg-emerald-500/15 text-emerald-400',
                        status === 'current' && 'border-crimson-aggro bg-crimson-aggro text-abyss',
                        status === 'ahead' && 'border-line-subtle text-ink-muted'
                      )}
                    >
                      {status === 'cleared' ? (
                        <Check className="h-3 w-3" />
                      ) : status === 'current' ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-abyss" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          'block font-grotesk text-xs font-bold tracking-[0.08em]',
                          selected ? accent.text : 'text-ink'
                        )}
                      >
                        {clearance.code}
                      </span>
                      <span className="block truncate text-[11px] text-ink-muted md:max-w-[120px]">
                        {clearance.sub.shortTitle}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      <div className="hidden md:flex items-center justify-between px-3 pt-2 pb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
        <span>Floor</span>
        <span>{formatMeters(MAX_DEPTH_M)}</span>
      </div>
    </div>
  )
}
