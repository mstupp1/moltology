import React from 'react'
import { cn } from '@/lib/utils'
import { STAGE_PIPELINE_DATA } from '@/lib/codexData'
import { PIPELINE_CLEARANCES } from '@/lib/pipeline-explorer'
import { stageAccent, stageArtUrl, stageName, stageSectionId, xpRangeLabel } from './shared'

interface StageStrataProps {
  currentIndex: number
}

/** The four stages as a contents row, shallowest first. Each card jumps to its section. */
export function StageStrata({ currentIndex }: StageStrataProps) {
  const currentStage = PIPELINE_CLEARANCES[currentIndex].stageNum

  return (
    <nav aria-label="Stages" className="grid grid-cols-2 gap-2 lg:grid-cols-4 sm:gap-3">
      {STAGE_PIPELINE_DATA.map((stage) => {
        const accent = stageAccent(stage.stageNum)
        const current = stage.stageNum === currentStage
        const clearances = PIPELINE_CLEARANCES.filter((c) => c.stageNum === stage.stageNum)
        return (
          <a
            key={stage.stageNum}
            href={`#${stageSectionId(stage.stageNum)}`}
            aria-current={current ? 'step' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-card border p-2.5 transition-colors sm:p-3',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
              current
                ? 'border-transparent bg-surface-3 shadow-nav-current'
                : 'border-line-subtle bg-surface-1 hover:border-line hover:bg-surface-2'
            )}
          >
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
          </a>
        )
      })}
    </nav>
  )
}
