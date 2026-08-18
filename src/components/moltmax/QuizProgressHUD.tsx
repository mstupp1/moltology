import React from 'react'
import { type QuizDimension } from '@/lib/moltmax-quiz'

interface QuizProgressHUDProps {
  current: number
  total: number
  currentDimension?: QuizDimension
}

export const QuizProgressHUD: React.FC<QuizProgressHUDProps> = ({ current, total }) => {
  const percent = Math.round(((current + 1) / total) * 100)

  return (
    <div className="mx-auto mb-4 w-full max-w-5xl">
      <div className="mb-2 flex items-center justify-between font-sans text-xs text-[#839493]">
        <span className="font-bold text-[#00c3ff]">
          QUESTION {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <span className="font-bold text-[#00ffcc]">{percent}%</span>
      </div>

      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#38bdf8] shadow-[0_0_12px_rgba(0,255,204,0.4)] transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
