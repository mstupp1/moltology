import React, { useState } from 'react'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'
import { STAGE_PIPELINE_DATA } from '@/lib/codexStages'
import { PIPELINE_CLEARANCES, clearanceIndexForXp } from '@/lib/pipeline-explorer'
import { StageStrata } from './pipeline/StageStrata'
import { StageSection } from './pipeline/StageSection'
import { READINGS } from './pipeline/shared'

/**
 * Browse one stage at a time, starting with the member's own stage.
 */
export default function PipelineView() {
  const alignment = useDailyAlignment()
  const xp = alignment.progression.xp
  const current = PIPELINE_CLEARANCES[clearanceIndexForXp(xp)]
  // Follow progression until the member explicitly chooses a stage to browse.
  const [chosenStage, setChosenStage] = useState<number | null>(null)
  const selectedStage = chosenStage ?? current.stageNum
  const stage = STAGE_PIPELINE_DATA.find((item) => item.stageNum === selectedStage)!

  return (
    <div className="space-y-2 sm:space-y-4 lg:space-y-5 font-sans">
      {/* The Character band (title, XP, stage, tabs) is drawn by the /character layout route. */}
      <StageStrata
        currentIndex={current.index}
        selectedStage={selectedStage}
        onSelectStage={setChosenStage}
      />

      <div id="pipeline-stage-details">
        <StageSection key={stage.stageNum} stage={stage} xp={xp} />
      </div>

      <aside aria-labelledby="pipeline-readings-title" className="rounded-card border border-line-subtle bg-surface-1 p-3 sm:p-4 lg:p-5">
        <h2 id="pipeline-readings-title" className="eyebrow">
          About the readings
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-body">
          The readings under each clearance are what members there usually report. They describe the stage. Only XP opens a clearance.
        </p>
        <dl className="mt-3 grid gap-2 sm:grid-cols-3">
          {READINGS.map((reading) => (
            <div key={reading.label}>
              <dt className="text-xs font-semibold text-ink">{reading.label}</dt>
              <dd className="text-xs text-ink-muted">{reading.meaning}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  )
}
