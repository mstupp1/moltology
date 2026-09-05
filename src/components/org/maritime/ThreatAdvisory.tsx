/**
 * CURRENT MARINE THREAT ADVISORY
 * Intelligence-dashboard readout of the five standing advisory levels.
 */
import React, { useState } from 'react'
import { Radar, Siren } from 'lucide-react'
import { ACTIVE_THREAT_ID, THREAT_LEVELS, type ThreatLevel } from './data'
import { ClassificationStamp, MaritimeHeading, SonarPlate, TelemetryRow } from './primitives'

const ThreatLevelButton: React.FC<{
  level: ThreatLevel
  isSelected: boolean
  isCurrent: boolean
  onSelect: () => void
}> = ({ level, isSelected, isCurrent, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={isSelected}
    className={`group relative w-full overflow-hidden rounded-xl border px-4 py-3.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
      isSelected
        ? `${level.activeShell} shadow-lg`
        : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
    }`}
  >
    <span className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`h-3 w-3 shrink-0 rounded-full ${level.swatch} ${
          isCurrent ? 'animate-pulse motion-reduce:animate-none' : ''
        }`}
      />
      <span className="min-w-0 flex-1">
        <span
          className={`block font-grotesk text-xs font-black uppercase tracking-[0.16em] ${
            isSelected ? level.activeText : 'text-white'
          }`}
        >
          {level.code} — {level.subject}
        </span>
        <span className="mt-0.5 block text-[11px] leading-snug text-slate-400">{level.summary}</span>
      </span>
      {isCurrent ? (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] ${level.activeChip}`}
        >
          ACTIVE
        </span>
      ) : null}
    </span>
  </button>
)

export const ThreatAdvisory: React.FC = () => {
  const [selectedId, setSelectedId] = useState(ACTIVE_THREAT_ID)
  const selected = THREAT_LEVELS.find((l) => l.id === selectedId) ?? THREAT_LEVELS[2]
  const current = THREAT_LEVELS.find((l) => l.id === ACTIVE_THREAT_ID) ?? THREAT_LEVELS[2]

  return (
    <section aria-labelledby="mdc-threat-advisory" className="space-y-10">
      <MaritimeHeading
        id="mdc-threat-advisory"
        eyebrow="MARITIME DEFENSE COMMAND · WATCH FLOOR"
        eyebrowIcon={Radar}
        title="CURRENT MARINE THREAT ADVISORY"
        subtitle="Five standing levels. One is active at all times. Select a level to read the standing briefing."
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Level selector */}
        <div className="space-y-2.5 lg:col-span-5">
          {THREAT_LEVELS.map((level) => (
            <ThreatLevelButton
              key={level.id}
              level={level}
              isSelected={level.id === selectedId}
              isCurrent={level.id === ACTIVE_THREAT_ID}
              onSelect={() => setSelectedId(level.id)}
            />
          ))}
        </div>

        {/* Briefing panel */}
        <div className="lg:col-span-7">
          <div className={`h-full rounded-3xl border bg-[#04141d]/80 p-6 sm:p-8 ${selected.activeShell}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Siren className={`h-5 w-5 ${selected.activeText}`} aria-hidden="true" />
                <span className="font-grotesk text-sm font-black uppercase tracking-[0.18em] text-white">
                  LEVEL {selected.code}
                </span>
              </div>
              <ClassificationStamp label={selected.indicator} tone={selected.id === 'black' ? 'slate' : 'amber'} />
            </div>

            <div className="grid gap-6 pt-6 sm:grid-cols-12">
              <div className="space-y-4 sm:col-span-8">
                <h3 className={`font-grotesk text-xl font-black uppercase leading-tight ${selected.activeText}`}>
                  {selected.subject}
                </h3>
                <p className="text-sm leading-relaxed text-slate-300">{selected.briefing}</p>
                <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <TelemetryRow label="Standing posture" value={selected.posture} />
                  <TelemetryRow label="Advisory in force" value={`${current.code} — ${current.subject}`} />
                  <TelemetryRow label="Watch floor" value="STAFFED · CONTINUOUS" tone="text-emerald-300" />
                </div>
              </div>

              <div className="sm:col-span-4">
                <SonarPlate label="SECTOR SWEEP" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
