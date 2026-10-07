import React, { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { type QuizQuestion } from '@/lib/moltmax-quiz'
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
// Agreement scale runs from warm (disagree) to chitin green (agree)
const likertColors = ['#ff7b72', '#ffb86b', '#9ab0af', '#5eead4', '#00ffcc']

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
  const isLikert = question.format === 'likert'
  const activeIndex = question.options.findIndex((opt) => opt.id === answer)
  const currentOption = activeIndex !== -1 ? question.options[activeIndex] : null
  const isLast = questionNumber === totalQuestions

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
    <div className="relative mx-auto w-full max-w-6xl xl:max-w-[1200px]">
      {/* Deck depth: a hint of the cards still to come */}
      {questionNumber < totalQuestions && (
        <div
          className="pointer-events-none absolute inset-0 -z-10 hidden translate-y-3 scale-[0.985] rounded-2xl border border-[#00c3ff]/20 bg-[#04080b]/90 shadow-[0_15px_35px_rgba(0,0,0,0.6)] sm:block"
          aria-hidden="true"
        />
      )}

      <div
        key={question.id}
        className={cn(
          'relative flex flex-col overflow-clip rounded-2xl border border-[#00c3ff]/30 bg-[#050c10]/95 shadow-[0_25px_80px_rgba(0,0,0,0.7),0_0_40px_rgba(0,195,255,0.12)] backdrop-blur-md',
          direction === 'next' ? 'animate-deck-next' : 'animate-deck-prev'
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,195,255,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(0,255,204,0.05),transparent_50%)]" aria-hidden="true" />

        <div className="relative z-10 flex flex-1 flex-col p-4 sm:p-7 lg:p-9">
          {/* Header: segmented progress + counter */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-wider sm:text-xs">
              <span className="truncate text-[#00c3ff]">{question.eyebrow}</span>
              <span className="shrink-0 tabular-nums text-[#00ffcc]">
                {`${String(questionNumber).padStart(2, '0')} / ${String(totalQuestions).padStart(2, '0')}`}
              </span>
            </div>
            <div
              className="mt-3 flex gap-1"
              role="progressbar"
              aria-label="Quiz progress"
              aria-valuemin={1}
              aria-valuemax={totalQuestions}
              aria-valuenow={questionNumber}
            >
              {Array.from({ length: totalQuestions }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors duration-300',
                    index < questionNumber - 1 && 'bg-[#00c3ff]',
                    index === questionNumber - 1 && 'bg-[#00ffcc] shadow-[0_0_8px_rgba(0,255,204,0.6)]',
                    index > questionNumber - 1 && 'bg-white/10'
                  )}
                />
              ))}
            </div>
          </div>

          <div className="grid flex-1 items-stretch gap-5 sm:gap-8 lg:grid-cols-[minmax(0,400px)_1fr] xl:grid-cols-[minmax(0,440px)_1fr]">
            {/* Scenario artwork */}
            <figure className="group relative overflow-hidden rounded-xl border border-[#00c3ff]/25 bg-[#030a0d] aspect-[16/9] sm:aspect-[2/1] lg:aspect-square lg:self-start">
              <img
                src={question.image}
                alt={question.imageAlt}
                onLoad={() => setImageLoaded(true)}
                className={cn(
                  'h-full w-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-[1.03]',
                  imageLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
                )}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#071114]">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#00c3ff] border-t-transparent" />
                </div>
              )}
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#020608]/95 via-[#020608]/70 to-transparent px-3 pb-2.5 pt-8 text-[11px] leading-snug text-[#c6dad9] sm:px-4 sm:pb-3 sm:text-xs">
                {question.scenarioCaption}
              </figcaption>
            </figure>

            {/* Prompt + answers */}
            <div className="flex min-w-0 flex-col">
              <h2 className="font-grotesk text-lg font-bold leading-snug text-white sm:text-2xl lg:text-[1.75rem]">
                {question.prompt}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[#9ab0af] sm:text-sm">
                {question.helper}
              </p>

              {isLikert ? (
                <div className="mt-5 sm:mt-7">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-5 sm:gap-2.5">
                    {question.options.map((opt, index) => {
                      const isSelected = activeIndex === index
                      const color = likertColors[index] ?? '#00ffcc'
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => onAnswer(opt.id)}
                          className={cn(
                            'group flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 active:scale-[0.99] sm:flex-col sm:justify-center sm:gap-2.5 sm:px-2 sm:py-4 sm:text-center',
                            isSelected
                              ? 'bg-white/[0.06]'
                              : 'border-white/10 bg-[#071114]/80 hover:border-[#00c3ff]/50 hover:bg-[#00c3ff]/[0.06]'
                          )}
                          style={isSelected ? { borderColor: color, boxShadow: `0 0 22px ${color}33` } : undefined}
                        >
                          <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all"
                            style={{ borderColor: color, backgroundColor: isSelected ? color : 'transparent' }}
                            aria-hidden="true"
                          >
                            {isSelected && <Check className="h-3 w-3 stroke-[3] text-[#020408]" />}
                          </span>
                          <span className={cn('text-sm font-semibold leading-tight sm:text-xs lg:text-[13px]', isSelected ? 'text-white' : 'text-[#c6dad9] group-hover:text-white')}>
                            {opt.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-3 min-h-[2.5rem] text-xs leading-relaxed text-[#9ab0af] sm:text-sm" aria-live="polite">
                    {currentOption?.detail ?? 'Pick the answer that sounds most like you on an ordinary day.'}
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-2.5 sm:mt-7 sm:grid-cols-2 sm:gap-3">
                  {question.options.map((option, index) => {
                    const selected = answer === option.id
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => onAnswer(option.id)}
                        className={cn(
                          'group relative flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-200 active:scale-[0.99] sm:p-4',
                          selected
                            ? 'border-[#00ffcc] bg-[#00ffcc]/[0.12] shadow-[0_0_24px_rgba(0,255,204,0.18)]'
                            : 'border-white/10 bg-[#071114]/80 hover:border-[#00c3ff]/60 hover:bg-[#00c3ff]/[0.08]'
                        )}
                      >
                        <span className={cn(
                          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-sans text-xs font-bold transition-colors',
                          selected
                            ? 'bg-[#00ffcc] text-[#020408]'
                            : 'border border-white/20 bg-white/5 text-[#9ab0af] group-hover:border-[#00c3ff] group-hover:text-[#00c3ff]'
                        )}>
                          {selected ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : keyLetters[index] || index + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={cn(
                            'block font-grotesk text-sm font-bold leading-snug transition-colors',
                            selected ? 'text-white' : 'text-[#e5ecec] group-hover:text-white'
                          )}>
                            {option.label}
                          </span>
                          {option.detail && (
                            <span className={cn('mt-1 block text-xs leading-relaxed', selected ? 'text-[#c6dad9]' : 'text-[#839493]')}>
                              {option.detail}
                            </span>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Navigation: pinned to the bottom of the screen on phones so Next is always in reach */}
              <div className="sticky bottom-0 z-20 -mx-4 mt-auto border-t border-white/10 bg-[#050c10]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:static sm:mx-0 sm:mt-8 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-5 sm:backdrop-blur-none">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-bold uppercase tracking-wider text-[#9ab0af] transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>

                  <div className="flex items-center gap-4">
                    <span className="hidden text-[11px] text-[#6b7f7e] lg:inline">
                      {answer ? 'Press Enter to continue' : `Press 1–${question.options.length} to choose`}
                    </span>
                    <button
                      type="button"
                      onClick={onNext}
                      disabled={!answer}
                      className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg bg-[#00c3ff] px-5 font-grotesk text-xs font-bold uppercase tracking-wider text-[#020408] shadow-[0_0_20px_rgba(0,195,255,0.3)] transition-all hover:bg-[#00ffcc] hover:shadow-[0_0_30px_rgba(0,255,204,0.4)] disabled:cursor-not-allowed disabled:bg-[#00c3ff]/25 disabled:text-[#020408]/70 disabled:shadow-none sm:px-6 sm:text-sm"
                    >
                      <span>{isLast ? 'Reveal My Clearance' : 'Next Question'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
