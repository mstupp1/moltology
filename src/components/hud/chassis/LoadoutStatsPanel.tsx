import React from 'react'
import type { LoadoutTotals } from '@/lib/chassis-loadout'
import { STAT_LABELS, type LoadoutStatKey } from '@/lib/chassis-loadout'

const STAT_ORDER: LoadoutStatKey[] = [
  'defense',
  'attack',
  'intelligence',
  'speed',
  'perception',
]

export interface LoadoutStatsPanelProps {
  totals: LoadoutTotals
  variant?: 'panel' | 'strip'
}

export const LoadoutStatsPanel: React.FC<LoadoutStatsPanelProps> = ({
  totals,
  variant = 'panel',
}) => {
  if (variant === 'strip') {
    return (
      <div className="chitin-card p-3 sm:p-4 chamfer-corner shadow-2xl">
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {STAT_ORDER.map((key) => (
            <div
              key={key}
              className="flex items-baseline gap-1.5 px-2.5 py-1.5 chitin-card-inset border border-[#3a4a49] min-w-[5.5rem] chamfer-corner"
            >
              <span className="text-[9px] uppercase tracking-widest text-[#839493]">
                {STAT_LABELS[key].slice(0, 3)}
              </span>
              <span className="text-sm font-bold text-[#00ffff] tabular-nums">{totals[key]}</span>
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
          Loadout Telemetry
        </h2>
        <p className="text-xs text-[#839493] mt-0.5">Equipped hardpoint totals.</p>
      </div>
      <ul className="space-y-2">
        {STAT_ORDER.map((key) => (
          <li
            key={key}
            className="flex items-center justify-between gap-3 border-b border-[#3a4a49]/60 pb-2 last:border-0 last:pb-0"
          >
            <span className="text-xs uppercase tracking-wider text-[#9aa8a7]">
              {STAT_LABELS[key]}
            </span>
            <span className="text-lg font-bold text-[#dfe3e3] tabular-nums">{totals[key]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
