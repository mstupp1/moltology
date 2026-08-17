import React from 'react'
import { type QuizDimension } from '@/lib/moltmax-quiz'

interface QuizProgressHUDProps {
  current: number
  total: number
  currentDimension: QuizDimension
}

const labels: Record<QuizDimension, { name: string; icon: string }> = {
  shellHardness: { name: 'Shell Armor (Resilience)', icon: '🛡️' },
  pincerTorque: { name: 'Pincer Torque (Execution)', icon: '⚡' },
  neuralLatency: { name: 'Synaptic Flow (Focus & Speed)', icon: '🧠' },
  ecdysisDiscipline: { name: 'Shedding Discipline (Growth)', icon: '✨' },
  depthTolerance: { name: 'Depth Tolerance (Composure)', icon: '🌊' },
}

const getEncouragement = (percent: number) => {
  if (percent <= 20) return 'Beginning the descent · Trust your first instinct'
  if (percent <= 40) return 'Forming new chitin · Building strong momentum'
  if (percent <= 60) return 'Halfway through · Shell hardening in progress'
  if (percent <= 80) return 'Entering deep waters · Final calibration near'
  return 'Final chamber · Ascendance within reach'
}

export const QuizProgressHUD: React.FC<QuizProgressHUDProps> = ({ current, total, currentDimension }) => {
  const percent = Math.round(((current + 1) / total) * 100)
  const currentVector = labels[currentDimension]

  return (
    <div className="mx-auto mb-6 w-full max-w-6xl">
      <div className="mb-2.5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00c3ff]">
            <span>{currentVector.icon}</span>
            <span>Focus: {currentVector.name}</span>
          </div>
          <div className="mt-0.5 text-xs text-[#839493]">
            {getEncouragement(percent)}
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="font-bold text-[#00ffcc]">{percent}%</span>
          <span className="text-[#526363]">Complete</span>
        </div>
      </div>

      {/* Main Gradient Progress Bar */}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/10 p-[1px]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#ffd700] shadow-[0_0_12px_rgba(0,255,204,0.4)] transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Vector Steps */}
      <div className="mt-2.5 grid grid-cols-5 gap-1.5 sm:gap-2">
        {(Object.keys(labels) as QuizDimension[]).map((dimension, index) => {
          const start = index * 3
          const complete = current >= start + 3
          const active = current >= start && current < start + 3
          return (
            <div key={dimension} className="space-y-1">
              <div
                className={`h-1 rounded-full transition-colors ${
                  complete ? 'bg-[#00ffcc]' : active ? 'bg-[#00c3ff] shadow-[0_0_8px_rgba(0,195,255,0.6)]' : 'bg-white/10'
                }`}
              />
              <div
                className={`truncate text-center text-[9px] font-bold uppercase tracking-wider ${
                  active ? 'text-[#00ffcc]' : complete ? 'text-[#839493]' : 'text-[#415252]'
                }`}
              >
                {dimension === 'shellHardness'
                  ? 'Carapace'
                  : dimension === 'pincerTorque'
                  ? 'Torque'
                  : dimension === 'neuralLatency'
                  ? 'Synapse'
                  : dimension === 'ecdysisDiscipline'
                  ? 'Ecdysis'
                  : 'Depth'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
