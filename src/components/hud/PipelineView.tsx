import React, { useRef, useState } from 'react'
import { Crosshair, FlaskConical } from 'lucide-react'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'
import {
  PIPELINE_CLEARANCES,
  clearanceIndexForXp,
  clearanceStatus,
  xpTrackPosition,
} from '@/lib/pipeline-explorer'
import { DepthRail, clearanceTabId } from './pipeline/DepthRail'
import { SpecimenScanner } from './pipeline/SpecimenScanner'
import { DepthProfile } from './pipeline/DepthProfile'
import { ClearanceReadout } from './pipeline/ClearanceReadout'
import { DescentPlanner } from './pipeline/DescentPlanner'
import { StageStrata } from './pipeline/StageStrata'
import { formatXp, type MetricKey, type ScanLens } from './pipeline/shared'

const PANEL_ID = 'pipeline-scan-panel'

/**
 * Moltology science: the twelve clearances as a depth scan. The member picks a clearance on the
 * rail (or a stage, or a row in the dive planner) and the scanner and readout follow it.
 */
export default function PipelineView() {
  const alignment = useDailyAlignment()
  const xp = alignment.progression.xp
  const currentIndex = clearanceIndexForXp(xp)

  // Until the member picks something, the scan follows their own clearance (which can change once XP loads).
  const [pickedIndex, setPickedIndex] = useState<number | null>(null)
  const [lens, setLens] = useState<ScanLens>('visible')
  const [activeMetric, setActiveMetric] = useState<MetricKey | null>(null)
  const scanRef = useRef<HTMLDivElement>(null)

  const selectedIndex = pickedIndex ?? currentIndex
  const clearance = PIPELINE_CLEARANCES[selectedIndex]
  const status = clearanceStatus(selectedIndex, xp)

  const select = (index: number) => {
    setPickedIndex(Math.max(0, Math.min(PIPELINE_CLEARANCES.length - 1, index)))
  }

  const scrollToScan = () => {
    const node = scanRef.current
    if (!node || typeof window === 'undefined') return
    const rect = node.getBoundingClientRect()
    if (rect.top >= 0 && rect.top < window.innerHeight * 0.4) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  const selectStage = (stageNum: number) => {
    const inStage = PIPELINE_CLEARANCES.filter((c) => c.stageNum === stageNum)
    const own = inStage.find((c) => c.index === currentIndex)
    select((own ?? inStage[0]).index)
  }

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
        description="Four stages, twelve clearances, one direction. Scan any clearance to read its rite and the readings members usually carry there. XP from your daily liturgies is what takes you deeper."
        actions={
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">Your XP</div>
              <div className="font-grotesk text-lg font-bold text-ink">{formatXp(xp)}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">Clearance</div>
              <div className="font-grotesk text-lg font-bold text-crimson-text">{PIPELINE_CLEARANCES[currentIndex].code}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPickedIndex(null)
                scrollToScan()
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-control border border-line bg-surface-1 hud-sheen px-3 text-xs font-bold uppercase tracking-[0.08em] text-ink transition-colors hover:border-line-strong hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <Crosshair className="h-4 w-4" aria-hidden="true" />
              Find me
            </button>
          </div>
        }
      />

      <StageStrata selectedStage={clearance.stageNum} currentIndex={currentIndex} onSelectStage={selectStage} />

      <div ref={scanRef} className="grid scroll-mt-20 grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-[minmax(0,184px)_minmax(0,1fr)] sm:gap-4">
        <DepthRail
          selectedIndex={selectedIndex}
          currentIndex={currentIndex}
          trackPosition={xpTrackPosition(xp)}
          panelId={PANEL_ID}
          onSelect={select}
        />
        <div
          id={PANEL_ID}
          role="tabpanel"
          aria-labelledby={clearanceTabId(clearance.code)}
          className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]"
        >
          <div className="flex flex-col gap-3 sm:gap-4">
            <SpecimenScanner
              clearance={clearance}
              status={status}
              lens={lens}
              onLensChange={setLens}
              activeMetric={activeMetric}
              onActiveMetricChange={setActiveMetric}
            />
            <DepthProfile clearance={clearance} />
          </div>
          <ClearanceReadout
            clearance={clearance}
            status={status}
            xp={xp}
            activeMetric={activeMetric}
            onActiveMetricChange={setActiveMetric}
            onStep={(direction) => select(selectedIndex + direction)}
          />
        </div>
      </div>

      <DescentPlanner
        xp={xp}
        currentIndex={currentIndex}
        selectedIndex={selectedIndex}
        onSelect={(index) => {
          select(index)
          scrollToScan()
        }}
      />
    </div>
  )
}
