import React, { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { type QuizQuestion } from '@/lib/moltmax-quiz'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

interface QuizQuestionCardProps {
  question: QuizQuestion
  questionNumber: number
  totalQuestions: number
  answer?: string
  direction?: 'next' | 'prev'
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
  direction = 'next',
  onAnswer,
  onBack,
  onNext,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const percent = Math.round((questionNumber / totalQuestions) * 100)
  const isLikert = question.format === 'likert'
  const activeIndex = question.options.findIndex((opt) => opt.id === answer)
  const currentOption = activeIndex !== -1 ? question.options[activeIndex] : null

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

      if (isLikert) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          const nextIdx = activeIndex > 0 ? activeIndex - 1 : 0
          onAnswer(question.options[nextIdx].id)
          return
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          const nextIdx = activeIndex < question.options.length - 1 ? (activeIndex === -1 ? 0 : activeIndex + 1) : question.options.length - 1
          onAnswer(question.options[nextIdx].id)
          return
        }
      }

      if (e.key === 'Enter' && answer) {
        e.preventDefault()
        onNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [question, answer, isLikert, activeIndex, onAnswer, onNext])

  return (
    <div className="relative mx-auto w-full max-w-6xl xl:max-w-[1240px]">
      
      {/* Visual Deck Depth Layers: Subtle stacked silhouettes representing remaining cards */}
      {questionNumber < totalQuestions && (
        <div
          className="absolute inset-0 translate-y-2.5 sm:translate-y-3.5 scale-[0.985] rounded-2xl border border-[#00c3ff]/20 bg-[#04080b]/90 pointer-events-none -z-10 transition-all duration-300 shadow-[0_15px_35px_rgba(0,0,0,0.6)]"
          aria-hidden="true"
        />
      )}
      {questionNumber < totalQuestions - 1 && (
        <div
          className="absolute inset-0 translate-y-5 sm:translate-y-7 scale-[0.97] rounded-2xl border border-cyan-900/30 bg-[#020507]/80 pointer-events-none -z-20 transition-all duration-300 shadow-[0_20px_45px_rgba(0,0,0,0.8)]"
          aria-hidden="true"
        />
      )}

      {/* Main Active Card in Deck (Smooth Deal Transition on Question Change) */}
      <div
        key={question.id}
        className={cn(
          'relative flex flex-col overflow-hidden rounded-2xl border border-[#00c3ff]/35 bg-[#050c10]/95 shadow-[0_25px_80px_rgba(0,0,0,0.7),0_0_40px_rgba(0,195,255,0.15)] backdrop-blur-md',
          direction === 'next' ? 'animate-deck-next' : 'animate-deck-prev'
        )}
      >
        {/* Integrated Clean Progress Track (Seamless Top Interface Edge) */}
        <div className="relative h-1.5 w-full overflow-hidden bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#38bdf8] shadow-[0_0_12px_rgba(0,255,204,0.6)] transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Ambient Decorative Backdrops */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,195,255,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(0,255,204,0.06),transparent_50%)] pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 right-0 h-1 w-1/3 bg-gradient-to-l from-[#00c3ff] to-transparent pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 p-5 sm:p-7 lg:p-9 flex flex-col justify-between flex-1">
          
          {/* Header Bar */}
          <div className="mb-5 sm:mb-6 flex items-center justify-between gap-3 border-b border-white/10 pb-3 sm:pb-4 text-xs font-bold uppercase tracking-wider text-[#839493]">
            <div className="flex items-center gap-2 text-[#00c3ff] truncate">
              <span className="flex h-2 w-2 shrink-0 rounded-full bg-[#00ffcc] animate-pulse" />
              <span className="truncate">{question.eyebrow}</span>
            </div>
            <div className="flex items-center gap-2 font-sans text-[#dfe3e3] shrink-0">
              <span className="rounded border border-[#00c3ff]/30 bg-[#00c3ff]/10 px-2.5 py-1 font-bold text-[#00ffcc]">
                {String(questionNumber).padStart(2, '0')} / {String(totalQuestions).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Main Content: Responsive Split Layout */}
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-[360px_1fr] xl:grid-cols-[420px_1fr] items-stretch flex-1">
            
            {/* Scenario Artwork - Adaptive 16:9 on Mobile, Full Aspect on Desktop */}
            <div className="group relative flex flex-col overflow-hidden rounded-xl border border-[#00c3ff]/30 bg-[#020608] shadow-[0_0_30px_rgba(0,195,255,0.15)] transition-all duration-300 hover:border-[#00ffcc]/60 aspect-[16/9] sm:aspect-[21/9] lg:aspect-auto lg:h-full max-h-52 sm:max-h-64 lg:max-h-none shrink-0">
              <div className="relative h-full w-full overflow-hidden bg-[#030a0d]">
                <img
                  src={question.image}
                  alt={question.imageAlt}
                  onLoad={() => setImageLoaded(true)}
                  className={cn(
                    'h-full w-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-105',
                    imageLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
                  )}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#071114]">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00c3ff] border-t-transparent" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#020608]/80 via-transparent to-transparent pointer-events-none lg:hidden" />
              </div>
            </div>

            {/* Questions & Options / Slider Panel */}
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="font-grotesk text-xl sm:text-2xl lg:text-3xl font-bold leading-snug text-white">
                  {question.prompt}
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-[#9ab0af] sm:text-sm">
                  {question.helper}
                </p>

                {/* Likert Standard Slider Experience */}
                {isLikert ? (
                  <div className="mt-6 sm:mt-8 space-y-6">
                    
                    {/* Active Alignment Status Card */}
                    <div className="rounded-xl border border-[#00c3ff]/30 bg-[#020608]/90 p-4 sm:p-5 backdrop-blur-md">
                      <div className="flex items-center justify-between gap-2 text-xs font-sans font-bold uppercase tracking-wider">
                        <span className="text-[#839493]">Current Stance</span>
                        <span className={cn(
                          'px-2.5 py-0.5 rounded text-xs transition-colors font-bold',
                          currentOption
                            ? 'bg-[#00ffcc]/15 text-[#00ffcc] border border-[#00ffcc]/40 shadow-[0_0_10px_rgba(0,255,204,0.2)]'
                            : 'bg-white/5 text-[#839493] border border-white/10'
                        )}>
                          {currentOption ? currentOption.label : 'Not Selected'}
                        </span>
                      </div>
                      {currentOption?.detail && (
                        <p className="mt-2 text-xs sm:text-sm text-[#c6dad9] leading-relaxed">
                          {currentOption.detail}
                        </p>
                      )}
                    </div>

                    {/* Standard shadcn Slider */}
                    <div className="px-2 pt-2 pb-1">
                      <Slider
                        min={0}
                        max={question.options.length - 1}
                        step={1}
                        value={[activeIndex !== -1 ? activeIndex : 2]}
                        onValueChange={(val) => onAnswer(question.options[val[0]].id)}
                        className="w-full cursor-pointer"
                        aria-label={question.prompt}
                      />
                      
                      {/* Step Points along Slider */}
                      <div className="mt-3 flex justify-between gap-1 text-[10px] sm:text-xs font-sans">
                        {question.options.map((opt, index) => {
                          const isSelected = activeIndex === index
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => onAnswer(opt.id)}
                              className={cn(
                                'transition-colors cursor-pointer text-center px-1 py-0.5 rounded hover:text-white',
                                isSelected ? 'font-bold text-[#00ffcc]' : 'text-[#839493]'
                              )}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                  </div>
                ) : (
                  /* Regular Scenario & Binary Options Grid */
                  <div className={cn(
                    'mt-5 sm:mt-7 grid gap-3 sm:gap-3.5',
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
                            'group relative flex items-center gap-3 rounded-xl border p-3.5 sm:p-4 text-left transition-all duration-200 cursor-pointer active:scale-[0.99]',
                            selected
                              ? 'border-[#00ffcc] bg-[#00ffcc]/15 shadow-[0_0_24px_rgba(0,255,204,0.22)]'
                              : 'border-white/10 bg-[#071114]/80 hover:border-[#00c3ff]/60 hover:bg-[#00c3ff]/10'
                          )}
                        >
                          {/* Shortcut Key Badge */}
                          <span className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded font-sans text-xs font-bold transition-colors',
                            selected
                              ? 'bg-[#00ffcc] text-[#020408]'
                              : 'border border-white/20 bg-white/5 text-[#839493] group-hover:border-[#00c3ff] group-hover:text-[#00c3ff]'
                          )}>
                            {keyLetters[index] || index + 1}
                          </span>

                          <div className="flex-1 pr-1">
                            <span className={cn(
                              'block font-grotesk text-xs sm:text-sm font-bold leading-tight transition-colors',
                              selected ? 'text-white' : 'text-[#e5ecec] group-hover:text-white'
                            )}>
                              {option.label}
                            </span>
                          </div>

                          {/* Dedicated Checkmark Indicator Slot (Hidden when unselected, zero layout shift) */}
                          <div
                            className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-200',
                              selected
                                ? 'border border-[#00ffcc] bg-[#00ffcc] text-[#020408] shadow-[0_0_12px_rgba(0,255,204,0.5)] opacity-100 scale-100'
                                : 'opacity-0 scale-75 pointer-events-none'
                            )}
                          >
                            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="mt-6 sm:mt-8 flex items-center justify-between gap-3 border-t border-white/10 pt-4 sm:pt-5">
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border border-transparent px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#839493] transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>

                <div className="flex items-center gap-3">
                  <span className="hidden text-[11px] text-[#526363] md:inline">
                    {answer ? 'Press Enter ↵ to advance' : 'Select an option to advance'}
                  </span>
                  <button
                    type="button"
                    onClick={onNext}
                    disabled={!answer}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#00c3ff]/80 bg-[#00c3ff] px-5 sm:px-6 py-2.5 sm:py-3 font-grotesk text-xs sm:text-sm font-bold uppercase tracking-wider text-[#020408] shadow-[0_0_20px_rgba(0,195,255,0.3)] transition-all hover:bg-[#00ffcc] hover:shadow-[0_0_30px_rgba(0,255,204,0.4)] disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none cursor-pointer"
                  >
                    <span>{questionNumber === totalQuestions ? 'Reveal My Clearance' : 'Next Question'}</span>
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
