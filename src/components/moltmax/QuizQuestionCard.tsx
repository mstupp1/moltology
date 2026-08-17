import React, { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
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

const keyMap = ['1', '2', '3', '4', '5']
const keyLetters = ['A', 'B', 'C', 'D', 'E']

export const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  answer,
  onAnswer,
  onBack,
  onNext,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    setImageLoaded(false)
  }, [question.id])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      const keyIndex = keyMap.indexOf(e.key)
      if (keyIndex !== -1 && question.options[keyIndex]) {
        onAnswer(question.options[keyIndex].id)
        return
      }

      if (e.key === 'Enter' && answer) {
        e.preventDefault()
        onNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [question, answer, onAnswer, onNext])

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="relative overflow-hidden rounded-2xl border border-[#00c3ff]/35 bg-[#050c10]/95 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.6),0_0_40px_rgba(0,195,255,0.12)] backdrop-blur-md sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,195,255,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(0,255,204,0.06),transparent_50%)] pointer-events-none" aria-hidden="true" />
        <div className="absolute left-0 top-0 h-1 w-1/3 bg-gradient-to-r from-[#00ffcc] to-transparent" aria-hidden="true" />
        <div className="absolute bottom-0 right-0 h-1 w-1/3 bg-gradient-to-l from-[#00c3ff] to-transparent" aria-hidden="true" />

        <div className="relative z-10">
          {/* Header Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 text-xs font-bold uppercase tracking-wider text-[#839493]">
            <div className="flex items-center gap-2 text-[#00c3ff]">
              <span className="flex h-2 w-2 rounded-full bg-[#00ffcc] animate-pulse" />
              <span>{question.eyebrow}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[#dfe3e3]">
              <span className="rounded bg-[#00c3ff]/10 px-2 py-0.5 font-bold text-[#00ffcc]">
                {String(questionNumber).padStart(2, '0')} / {String(totalQuestions).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Main Content Grid: Image + Interactive Questions */}
          <div className="grid gap-8 lg:grid-cols-[380px_1fr] items-start">
            
            {/* Character Scenario Visual Panel */}
            <div className="group relative flex flex-col overflow-hidden rounded-xl border border-[#00c3ff]/30 bg-[#020608] shadow-[0_0_30px_rgba(0,195,255,0.15)] transition-all duration-300 hover:border-[#00ffcc]/60">
              <div className="relative aspect-square w-full overflow-hidden bg-[#030a0d]">
                <img
                  src={question.image}
                  alt={question.imageAlt}
                  onLoad={() => setImageLoaded(true)}
                  className={cn(
                    'h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105',
                    imageLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
                  )}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#071114]">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00c3ff] border-t-transparent" />
                  </div>
                )}
              </div>
            </div>

            {/* Questions & Options Panel */}
            <div className="flex flex-col justify-between h-full">
              <div>
                <h2 className="font-grotesk text-2xl font-bold leading-snug text-white sm:text-3xl lg:text-4xl">
                  {question.prompt}
                </h2>
                <p className="mt-3 text-xs leading-relaxed text-[#9ab0af] sm:text-sm">
                  {question.helper}
                </p>

                {/* Options List */}
                <div className={cn(
                  'mt-6 grid gap-3',
                  question.options.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'
                )}>
                  {question.options.map((option, index) => {
                    const selected = answer === option.id
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => onAnswer(option.id)}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5',
                          selected
                            ? 'border-[#00ffcc] bg-[#00ffcc]/15 shadow-[0_0_24px_rgba(0,255,204,0.22)]'
                            : 'border-white/10 bg-[#071114]/80 hover:border-[#00c3ff]/60 hover:bg-[#00c3ff]/10'
                        )}
                      >
                        {/* Shortcut Key Badge */}
                        <span className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-xs font-bold transition-colors',
                          selected
                            ? 'bg-[#00ffcc] text-[#020608]'
                            : 'border border-white/20 bg-white/5 text-[#839493] group-hover:border-[#00c3ff] group-hover:text-[#00c3ff]'
                        )}>
                          {keyLetters[index] || index + 1}
                        </span>

                        <div className="flex-1 pr-1">
                          <span className={cn(
                            'block font-grotesk text-sm font-bold leading-tight transition-colors',
                            selected ? 'text-white' : 'text-[#e5ecec] group-hover:text-white'
                          )}>
                            {option.label}
                          </span>
                        </div>

                        {selected && (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00ffcc]/20 text-[#00ffcc]">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="mt-8 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#839493] transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>

                <div className="flex items-center gap-3">
                  <span className="hidden text-[11px] text-[#526363] sm:inline">
                    {answer ? 'Press Enter ↵ to continue' : 'Select an option to advance'}
                  </span>
                  <button
                    type="button"
                    onClick={onNext}
                    disabled={!answer}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#00c3ff]/80 bg-[#00c3ff] px-6 py-3 font-grotesk text-xs font-bold uppercase tracking-wider text-[#020408] shadow-[0_0_20px_rgba(0,195,255,0.3)] transition-all hover:bg-[#00ffcc] hover:shadow-[0_0_30px_rgba(0,255,204,0.4)] disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
                  >
                    {questionNumber === totalQuestions ? 'Reveal My Clearance' : 'Next Question'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
