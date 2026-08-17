import React, { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CircleHelp } from 'lucide-react'
import { type QuizQuestion } from '@/lib/moltmax-quiz'
import { cn } from '@/lib/utils'

interface QuizQuestionCardProps {
  question: QuizQuestion
  questionNumber: number
  totalQuestions: number
  answer?: string
  onAnswer: (answer: string) => void
  onBack: () => void
  onNext: () => void
}

export const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  answer,
  onAnswer,
  onBack,
  onNext,
}) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setTilt({
      x: ((event.clientY - rect.top) / rect.height - 0.5) * -2.5,
      y: ((event.clientX - rect.left) / rect.width - 0.5) * 2.5,
    })
  }

  return (
    <div className="mx-auto w-full max-w-5xl" style={{ perspective: '1600px' }}>
      <div
        className="relative transition-transform duration-300 ease-out"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      >
        <div className="absolute -inset-8 rounded-full bg-[#00c3ff]/10 blur-3xl" aria-hidden="true" />
        <div className="relative overflow-hidden border border-[#00c3ff]/40 bg-[#071114]/95 px-5 py-7 shadow-[0_25px_80px_rgba(0,0,0,0.55),0_0_45px_rgba(0,195,255,0.12)] sm:px-10 sm:py-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,195,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,195,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" aria-hidden="true" />
          <div className="absolute left-0 top-0 h-1 w-1/3 bg-gradient-to-r from-[#00ffcc] to-transparent" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 h-1 w-1/3 bg-gradient-to-l from-[#ff453a] to-transparent" aria-hidden="true" />

          <div className="relative z-10">
            <div className="mb-8 flex items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#839493]">
              <span className="flex items-center gap-2 text-[#00c3ff]"><CircleHelp className="h-4 w-4" /> {question.eyebrow}</span>
              <span>{String(questionNumber).padStart(2, '0')} / {String(totalQuestions).padStart(2, '0')}</span>
            </div>

            <h2 className="max-w-4xl font-grotesk text-2xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              {question.prompt}
            </h2>
            <p className="mt-4 max-w-2xl text-xs leading-relaxed text-[#839493] sm:text-sm">{question.helper}</p>

            <div className={cn('mt-8 grid gap-3', question.options.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2')}>
              {question.options.map((option, index) => {
                const selected = answer === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onAnswer(option.id)}
                    className={cn(
                      'group relative min-h-[92px] overflow-hidden border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00c3ff]/70 hover:bg-[#00c3ff]/10',
                      selected ? 'border-[#00ffcc] bg-[#00ffcc]/10 shadow-[0_0_24px_rgba(0,255,204,0.18)]' : 'border-white/10 bg-[#020608]/70',
                      question.options.length > 2 && index < 2 ? 'lg:min-h-[108px]' : ''
                    )}
                  >
                    <span className={cn('absolute left-0 top-0 h-full w-1 transition-colors', selected ? 'bg-[#00ffcc]' : 'bg-[#00c3ff]/30 group-hover:bg-[#00c3ff]')} />
                    <span className="flex items-start justify-between gap-3 pl-2">
                      <span>
                        <span className="block font-grotesk text-sm font-bold uppercase tracking-wide text-white sm:text-base">{option.label}</span>
                        <span className="mt-2 block text-[11px] leading-relaxed text-[#839493]">{option.detail}</span>
                      </span>
                      {selected && <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#00ffcc]" />}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-9 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
              <button type="button" onClick={onBack} className="inline-flex items-center gap-2 px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-[#839493] transition-colors hover:text-white">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={!answer}
                className="inline-flex items-center gap-2 border border-[#00c3ff]/60 bg-[#00c3ff] px-5 py-3 font-grotesk text-xs font-bold uppercase tracking-wider text-[#020408] transition-all hover:bg-[#00ffcc] disabled:cursor-not-allowed disabled:opacity-30"
              >
                {questionNumber === totalQuestions ? 'Reveal My Clearance' : 'Enter Next Chamber'} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
