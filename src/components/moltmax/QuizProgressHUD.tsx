import React from 'react'
import { type QuizDimension } from '@/lib/moltmax-quiz'

interface QuizProgressHUDProps {
  current: number
  total: number
  currentDimension: QuizDimension
}

const labels: Record<QuizDimension, string> = {
  shellHardness: 'Carapace',
  pincerTorque: 'Torque',
  neuralLatency: 'Synapse',
  ecdysisDiscipline: 'Ecdysis',
  depthTolerance: 'Depth',
}

export const QuizProgressHUD: React.FC<QuizProgressHUDProps> = ({ current, total, currentDimension }) => {
  const progress = ((current + 1) / total) * 100
  return (
    <div className="mx-auto mb-8 w-full max-w-5xl">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00c3ff]">Live audit // {labels[currentDimension]}</div>
          <div className="mt-1 text-xs text-[#839493]">Five vectors. One observed shell.</div>
        </div>
        <div className="font-mono text-xs font-bold text-white"><span className="text-[#00ffcc]">{String(current + 1).padStart(2, '0')}</span> / {String(total).padStart(2, '0')}</div>
      </div>
      <div className="h-2 overflow-hidden bg-white/10">
        <div className="h-full bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#ffd700] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1">
        {(Object.keys(labels) as QuizDimension[]).map((dimension, index) => {
          const start = index * 3
          const complete = current >= start + 3
          const active = current >= start && current < start + 3
          return <div key={dimension} className="space-y-1"><div className={`h-1 ${complete ? 'bg-[#00ffcc]' : active ? 'bg-[#00c3ff]' : 'bg-white/10'}`} /><div className={`text-center text-[8px] uppercase tracking-wider ${active ? 'text-[#00c3ff]' : 'text-[#526363]'}`}>{labels[dimension]}</div></div>
        })}
      </div>
    </div>
  )
}
