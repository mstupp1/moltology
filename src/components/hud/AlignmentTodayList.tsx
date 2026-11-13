import React from 'react'
import { Check, X } from 'lucide-react'
import { alignmentTaskCodex } from '@/lib/alignment-tasks'
import { AlignmentCodexLink } from './AlignmentCodexLink'

export interface AlignmentTodayTask {
  id: string
  key?: string
  time: string
  title: string
  completed: boolean
}

export interface AlignmentTodayListProps {
  tasks: AlignmentTodayTask[]
  countReady: boolean
  todayLabel: string
  onToggle: (taskId: string) => void
  /** Closes the surrounding panel (close button and Codex links). */
  onClose: () => void
  showClose?: boolean
  /** Taller rows and larger titles, for the full-screen phone account screen. */
  roomy?: boolean
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
const listFrame = 'rounded-control border border-line-subtle divide-y divide-line-subtle overflow-hidden'

/** Today's eight alignment tasks: heading, done count, progress line and the tickable list. */
export function AlignmentTodayList({
  tasks,
  countReady,
  todayLabel,
  onToggle,
  onClose,
  showClose = true,
  roomy = false,
}: AlignmentTodayListProps) {
  const allTasksCompleted = tasks.length > 0 && tasks.every((t) => t.completed)
  const completedCount = tasks.filter((t) => t.completed).length
  const progressPct = Math.round((completedCount / Math.max(tasks.length, 1)) * 100)
  const nextTask = tasks.find((t) => !t.completed) || tasks[tasks.length - 1]
  const nextTaskId = allTasksCompleted ? undefined : nextTask?.id

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-grotesk text-sm font-bold text-ink tracking-[0.08em] uppercase">Today</span>
          {todayLabel && <span className="text-xs text-ink-muted truncate">{todayLabel}</span>}
        </div>
        {showClose && <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="Close today's tasks"
          className={`-mr-1 p-1.5 rounded-control text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors ${focusRing}`}
        >
          <X className="w-4 h-4" />
        </button>}
      </div>

      <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            {countReady ? (
              <span className={`text-xs ${allTasksCompleted ? 'text-emerald-500 font-bold' : 'text-ink-muted'}`}>
                {allTasksCompleted ? 'All eight done for today' : `${completedCount} of ${tasks.length} done`}
              </span>
            ) : (
              <span className="inline-block h-2 w-24 rounded-chip bg-surface-3 animate-pulse" aria-hidden />
            )}
          </div>
          <div className="w-full h-1 bg-surface-3 rounded-chip overflow-hidden" aria-hidden="true">
            <div
              className={`h-full rounded-chip transition-[width] duration-300 ${allTasksCompleted ? 'bg-emerald-500' : 'bg-cyan-glow'} ${
                countReady ? '' : 'opacity-0'
              }`}
              style={{ width: `${countReady ? progressPct : 0}%` }}
            />
          </div>

          <ul className={listFrame}>
            {tasks.map((t) => {
              const isNext = t.id === nextTaskId
              const codex = alignmentTaskCodex(t.key ?? t.id)
              return (
                <li
                  key={t.id}
                  className={`flex items-stretch ${isNext ? 'bg-surface-3 shadow-nav-current' : t.completed ? 'bg-abyss/30' : ''}`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggle(t.id)
                    }}
                    aria-pressed={t.completed}
                    className={`flex-1 min-w-0 ${roomy ? 'min-h-12 py-2.5 text-sm' : 'min-h-[44px] sm:min-h-10 py-2 text-xs'} pl-3 pr-1 flex items-center gap-3 text-left transition-colors touch-manipulation group focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow ${
                      isNext ? '' : 'hover:bg-surface-2'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-4 h-4 shrink-0 rounded-chip border flex items-center justify-center transition-colors ${
                        t.completed ? 'bg-emerald-500 border-emerald-500 text-abyss' : 'border-line-strong group-hover:border-cyan-glow'
                      }`}
                    >
                      {t.completed && <Check className="w-3 h-3" strokeWidth={3} />}
                    </span>
                    <span className={`w-24 shrink-0 text-[11px] ${isNext ? 'text-cyan-glow font-bold' : 'text-ink-muted'}`}>
                      {t.time}
                    </span>
                    <span
                      className={`min-w-0 flex-1 ${roomy ? 'line-clamp-2' : 'truncate'} ${
                        t.completed ? 'line-through decoration-ink-muted/60 text-ink-muted' : 'text-ink font-bold'
                      }`}
                    >
                      {t.title}
                    </span>
                    {isNext && (
                      <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-cyan-glow">Next</span>
                    )}
                  </button>
                  {codex && (
                    <AlignmentCodexLink
                      codex={codex}
                      taskTitle={t.title}
                      onNavigate={onClose}
                    />
                  )}
                </li>
              )
            })}
          </ul>
        </div>
    </>
  )
}
