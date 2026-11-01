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

/** One row of stages with an expanded selection and shared details below. */
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
              'flex min-w-44 basis-0 shrink-0 items-center gap-3 rounded-card border p-2.5 text-left transition-colors sm:p-3',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
              selected ? 'min-w-72 grow-[1.8]' : 'grow',
              selected
                ? 'border-transparent bg-surface-3 shadow-nav-current'
                : 'border-line-subtle bg-surface-1 hover:border-line hover:bg-surface-2'
            )}
          >
            <img
              src={getAssetUrl(STAGE_ART[stage.stageNum])}
              alt=""
              width={56}
              height={56}
              loading="lazy"
              decoding="async"
              className={cn('shrink-0 rounded-control object-cover object-right', selected ? 'h-16 w-16' : 'h-9 w-9')}
            />
            <span className="min-w-0">
              <span className={cn('block text-[11px] font-bold uppercase tracking-[0.08em]', accent.text)}>
                Stage {stage.stageNum}
                {current ? <span className="text-ink-muted"> · Yours</span> : null}
              </span>
              <span className="block font-grotesk text-xs font-bold uppercase tracking-[0.04em] text-ink sm:text-sm">
                {stageName(stage.stageTitle)}
              </span>
              <span className="mt-0.5 block text-[11px] text-ink-muted">{xpRangeLabel(stage.stageNum)}</span>
              <span aria-hidden="true" className="mt-1 flex gap-0.5">
                {clearances.map((c) => (
                  <span
                    key={c.code}
                    className={cn(
                      'h-1.5 w-3 rounded-chip',
                      c.index < currentIndex ? 'bg-emerald-400' : c.index === currentIndex ? 'bg-cyan-glow' : 'bg-surface-3'
                    )}
                  />
                ))}
              </span>
            </span>
          </button>
        )
      })}
    </nav>
  )
}
