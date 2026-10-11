import React from 'react'
import { cn } from '@/lib/utils'
import { STAGE_PIPELINE_DATA } from '@/lib/codexData'
import { PIPELINE_CLEARANCES, stageXpRange } from '@/lib/pipeline-explorer'
import { stageAccent, stageArtUrl, stageName } from './shared'

interface StageStrataProps {
  selectedStage: number
  currentIndex: number
  onSelectStage: (stageNum: number) => void
}

function xpRangeLabel(stageNum: number): string {
  const { minXp, maxXp } = stageXpRange(stageNum)
  const fmt = (n: number) => n.toLocaleString('en-US')
  return maxXp === null ? `${fmt(minXp)}+ XP` : `${fmt(minXp)}–${fmt(maxXp)} XP`
}

/** The four stages as strata, shallowest first. Picking one points the scanner at it. */
export function StageStrata({ selectedStage, currentIndex, onSelectStage }: StageStrataProps) {
  const currentStage = PIPELINE_CLEARANCES[currentIndex].stageNum

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 sm:gap-3">
      {STAGE_PIPELINE_DATA.map((stage) => {
        const accent = stageAccent(stage.stageNum)
        const selected = stage.stageNum === selectedStage
        const clearances = PIPELINE_CLEARANCES.filter((c) => c.stageNum === stage.stageNum)
        return (
          <button
            key={stage.stageNum}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelectStage(stage.stageNum)}
            className={cn(
              'group relative flex items-center gap-3 overflow-hidden rounded-card border p-2.5 text-left transition-colors sm:p-3',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
              selected ? 'border-line-strong bg-surface-2' : 'border-line-subtle bg-surface-1 hover:border-line hover:bg-surface-2'
            )}
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-0.5 transition-opacity"
              style={{ background: accent.hex, opacity: selected ? 1 : 0.35 }}
            />
            <img
              src={stageArtUrl(stage.img)}
              alt=""
              width={56}
              height={56}
              loading="lazy"
              decoding="async"
              className="hidden h-12 w-12 shrink-0 object-contain sm:block lg:h-14 lg:w-14"
            />
            <span className="min-w-0">
              <span className={cn('flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]', accent.text)}>
                Stage {stage.stageNum}
                {stage.stageNum === currentStage ? (
                  <span className="rounded-chip bg-crimson-aggro px-1 text-abyss">You</span>
                ) : null}
              </span>
              <span className="block font-grotesk text-xs font-bold uppercase tracking-[0.04em] text-ink sm:text-sm">
                {stageName(stage.stageTitle)}
              </span>
              <span className="mt-0.5 block text-[11px] text-ink-muted">{xpRangeLabel(stage.stageNum)}</span>
              <span className="mt-1 flex items-center">
                <span aria-hidden="true" className="flex gap-0.5">
                  {clearances.map((c) => (
                    <span
                      key={c.code}
                      className={cn(
                        'h-1.5 w-3 rounded-chip',
                        c.index < currentIndex ? 'bg-emerald-400' : c.index === currentIndex ? 'bg-crimson-aggro' : 'bg-surface-3'
                      )}
                    />
                  ))}
                </span>
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
