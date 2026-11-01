import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { STAGE_PIPELINE_DATA } from '@/lib/codexData'
import { PIPELINE_CLEARANCES } from '@/lib/pipeline-explorer'
import { getAssetUrl } from '@/lib/assets'
import { STAGE_ART } from '@/lib/stage-art'
import { stageAccent, stageName, xpRangeLabel } from './shared'

interface StageStrataProps {
  currentIndex: number
  selectedStage: number
  onSelectStage: (stageNum: number) => void
}

/** Full-bleed stage portraits with a shared detail section below. */
export function StageStrata({ currentIndex, selectedStage, onSelectStage }: StageStrataProps) {
  const currentStage = PIPELINE_CLEARANCES[currentIndex].stageNum
  const rowRef = useRef<HTMLElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const row = rowRef.current
    const card = selectedRef.current
    if (!row || !card) return
    const rowBounds = row.getBoundingClientRect()
    const cardBounds = card.getBoundingClientRect()
    if (cardBounds.left < rowBounds.left || cardBounds.right > rowBounds.right) {
      // Scroll only the card row; keep the page and details in place.
      row.scrollTo({ left: row.scrollLeft + cardBounds.left - rowBounds.left - (row.clientWidth - cardBounds.width) / 2 })
    }
  }, [selectedStage])

  return (
    <nav ref={rowRef} aria-label="Stages" className="flex gap-2 overflow-x-auto p-1 sm:gap-3">
      {STAGE_PIPELINE_DATA.map((stage) => {
        const accent = stageAccent(stage.stageNum)
        const current = stage.stageNum === currentStage
        const selected = stage.stageNum === selectedStage
        const clearances = PIPELINE_CLEARANCES.filter((c) => c.stageNum === stage.stageNum)
        return (
          <button
            key={stage.stageNum}
            ref={selected ? selectedRef : undefined}
            type="button"
            onClick={() => onSelectStage(stage.stageNum)}
            aria-expanded={selected}
            aria-controls="pipeline-stage-details"
            aria-current={current ? 'step' : undefined}
            className={cn(
              'group relative isolate flex h-64 min-w-60 basis-0 shrink-0 grow flex-col justify-end overflow-hidden rounded-card border bg-surface-1 text-left transition-colors sm:h-72 lg:min-w-0',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
              selected
                ? 'border-cyan-glow'
                : 'border-line-subtle hover:border-line'
            )}
          >
            <img
              src={getAssetUrl(STAGE_ART[stage.stageNum])}
              alt=""
              width={1536}
              height={1024}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 -z-20 h-full w-full object-cover object-right motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105 motion-safe:group-focus-visible:scale-105"
            />
            <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-abyss via-abyss/60 to-transparent" />
            <span className="absolute inset-x-0 top-0 h-20 -z-10 bg-gradient-to-b from-abyss/70 to-transparent" aria-hidden="true" />
            <span className={cn('absolute left-4 right-4 top-4 text-[11px] font-bold uppercase tracking-[0.08em]', accent.text)}>
              Stage {stage.stageNum}
              {current ? <span className="text-ink-muted"> · Yours</span> : null}
            </span>
            <span className="block w-full p-4">
              <span className="block max-w-48 font-grotesk text-lg font-bold uppercase leading-tight tracking-[0.04em] text-ink">
                {stageName(stage.stageTitle)}
              </span>
              <span className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[11px] text-ink-body">{xpRangeLabel(stage.stageNum)}</span>
                <span aria-hidden="true" className="flex gap-1">
                  {clearances.map((c) => (
                    <span
                      key={c.code}
                      className={cn(
                        'h-1.5 w-3 rounded-chip',
                        c.index < currentIndex ? 'bg-emerald-400' : c.index === currentIndex ? 'bg-cyan-glow' : 'bg-ink/25'
                      )}
                    />
                  ))}
                </span>
              </span>
            </span>
            {selected ? <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan-glow" /> : null}
          </button>
        )
      })}
    </nav>
  )
}
