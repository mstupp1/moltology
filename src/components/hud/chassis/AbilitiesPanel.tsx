import React from 'react'
import { Lock } from 'lucide-react'

const DUMMY_ABILITIES = [
  { id: 'pinch-lock', name: 'Pinch Lock', status: 'Ready', locked: false },
  { id: 'shell-brace', name: 'Shell Brace', status: 'Ready', locked: false },
  { id: 'depth-pulse', name: 'Depth Pulse', status: 'Cooling', locked: false },
  { id: 'signal-flare', name: 'Signal Flare', status: 'Locked', locked: true },
  { id: 'void-stride', name: 'Void Stride', status: 'Locked', locked: true },
]

export interface AbilitiesPanelProps {
  variant?: 'panel' | 'strip'
}

/** Placeholder chassis abilities column — not wired to data yet. */
export const AbilitiesPanel: React.FC<AbilitiesPanelProps> = ({ variant = 'panel' }) => {
  if (variant === 'strip') {
    return (
      <div className="chitin-card p-3 sm:p-4 chamfer-corner shadow-2xl space-y-2">
        <h2 className="font-grotesk text-xs font-bold text-[#dfe3e3] tracking-wider uppercase">
          Synaptic Abilities
        </h2>
        <div className="flex flex-wrap gap-2">
          {DUMMY_ABILITIES.map((ability) => (
            <div
              key={ability.id}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 chitin-card-inset border border-[#3a4a49] chamfer-corner ${
                ability.locked ? 'opacity-50' : ''
              }`}
            >
              {ability.locked && <Lock className="w-2.5 h-2.5 text-[#839493]" />}
              <span className="text-[9px] uppercase tracking-widest text-[#9aa8a7]">
                {ability.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-3 h-full">
      <div className="border-b border-[#3a4a49] pb-3">
        <h2 className="font-grotesk text-sm font-bold text-[#dfe3e3] tracking-wider uppercase">
          Synaptic Abilities
        </h2>
        <p className="text-xs text-[#839493] mt-0.5">Active protocols — stub readout.</p>
      </div>
      <ul className="space-y-2">
        {DUMMY_ABILITIES.map((ability) => (
          <li
            key={ability.id}
            className={`flex items-center justify-between gap-3 border-b border-[#3a4a49]/60 pb-2 last:border-0 last:pb-0 ${
              ability.locked ? 'opacity-50' : ''
            }`}
          >
            <span className="text-xs uppercase tracking-wider text-[#9aa8a7] flex items-center gap-1.5">
              {ability.locked && <Lock className="w-3 h-3 text-[#839493] shrink-0" />}
              {ability.name}
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-widest ${
                ability.locked
                  ? 'text-[#839493]'
                  : ability.status === 'Ready'
                    ? 'text-[#39ff14]'
                    : 'text-[#fbbf24]'
              }`}
            >
              {ability.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
