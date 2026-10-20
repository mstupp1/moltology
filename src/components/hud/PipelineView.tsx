import React from 'react'
import { FlaskConical } from 'lucide-react'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'
import { STAGE_PIPELINE_DATA } from '@/lib/codexData'
import { PIPELINE_CLEARANCES, clearanceIndexForXp } from '@/lib/pipeline-explorer'
import { StageStrata } from './pipeline/StageStrata'
import { StageSection } from './pipeline/StageSection'
import { READINGS, clearanceRowId, formatXp } from './pipeline/shared'

/**
 * Moltology science: the four stages and twelve clearances as one page you read top to bottom,
 * with the member's own clearance lit.
 */
export default function PipelineView() {
  const alignment = useDailyAlignment()
  const xp = alignment.progression.xp
  const current = PIPELINE_CLEARANCES[clearanceIndexForXp(xp)]

  return (
    <div className="space-y-3.5 sm:space-y-5 font-sans">
      <HudTitlePanel
        accent="cyan"
        eyebrow={
          <>
            <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
            Moltology science
          </>
        }
        title="The descent"
        description="Four stages, twelve clearances. Each clearance has one rite. XP from your daily liturgies opens the next one, and you can read ahead to see what is coming."
        actions={
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">Your XP</div>
              <div className="font-grotesk text-lg font-bold text-ink">{formatXp(xp)}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">Clearance</div>
              <div className="font-grotesk text-lg font-bold text-cyan-glow">{current.code}</div>
            </div>
            <a
              href={`#${clearanceRowId(current.code)}`}
              className="inline-flex min-h-10 items-center rounded-control border border-line bg-surface-1 px-3 text-xs font-bold uppercase tracking-[0.08em] text-ink transition-colors hover:border-line-strong hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              Go to mine
            </a>
          </div>
        }
      />

      <StageStrata currentIndex={current.index} />

      {STAGE_PIPELINE_DATA.map((stage) => (
        <StageSection key={stage.stageNum} stage={stage} xp={xp} />
      ))}

      <aside aria-labelledby="pipeline-readings-title" className="rounded-card border border-line-subtle bg-surface-1 p-4 sm:p-5">
        <h2 id="pipeline-readings-title" className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
          About the readings
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-body">
          The readings under each clearance are what members there usually report. They describe the stage. Only XP opens a clearance.
        </p>
        <dl className="mt-3 grid gap-2 sm:grid-cols-3">
          {READINGS.map((reading) => (
            <div key={reading.label}>
              <dt className="text-xs font-bold text-ink">{reading.label}</dt>
              <dd className="text-xs text-ink-muted">{reading.meaning}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  )
}
