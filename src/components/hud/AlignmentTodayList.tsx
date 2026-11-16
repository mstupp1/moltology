import React, { useCallback, useEffect, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { alignmentTaskCodex } from '@/lib/alignment-tasks'
import {
  ALIGNMENT_TASK_ACTIONS,
  CLOSE_THE_DAY_TASK_KEY,
  ONE_THING_EVENT,
  ONE_THING_TASK_KEY,
  readOneThing,
  saveOneThing,
} from '@/lib/alignment-actions'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'
import { AlignmentCodexLink } from './AlignmentCodexLink'
import { AlignmentTaskActionPanel } from './AlignmentTaskActionPanel'

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
  /** Rows open shortcuts (forum, Academy, timers, Oracle). Off for preview lists. */
  actions?: boolean
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
const rowFocus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow'
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
  actions = true,
}: AlignmentTodayListProps) {
  const { memberId, currentDate, setTaskCompleted } = useDailyAlignment()
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [oneThing, setOneThing] = useState('')
  useEffect(() => {
    const read = () => setOneThing(readOneThing(memberId, currentDate))
    read()
    window.addEventListener(ONE_THING_EVENT, read)
    return () => window.removeEventListener(ONE_THING_EVENT, read)
  }, [memberId, currentDate])
  const saveTodaysOneThing = useCallback(
    (text: string) => {
      saveOneThing(memberId, currentDate, text)
      if (text.trim()) void setTaskCompleted(ONE_THING_TASK_KEY, true)
    },
    [memberId, currentDate, setTaskCompleted],
  )
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
              const key = t.key ?? t.id
              const codex = alignmentTaskCodex(key)
              const action = actions ? ALIGNMENT_TASK_ACTIONS[key] : undefined
              const isOpen = Boolean(action) && openKey === key
              const subline =
                key === ONE_THING_TASK_KEY || key === CLOSE_THE_DAY_TASK_KEY ? oneThing : ''
              const rowSize = roomy ? 'min-h-12 py-2.5 text-sm' : 'min-h-[44px] sm:min-h-10 py-2 text-xs'
              return (
                <li
                  key={t.id}
                  className={isNext ? 'bg-surface-3 shadow-nav-current' : t.completed ? 'bg-abyss/30' : ''}
                >
                  <div className="flex items-stretch">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggle(t.id)
                      }}
                      aria-pressed={t.completed}
                      aria-label={t.completed ? `Mark ${t.title} not done` : `Mark ${t.title} done`}
                      data-testid="alignment-task-check"
                      className={`shrink-0 ${rowSize} pl-3 pr-2 flex items-center touch-manipulation group hover:bg-surface-2 transition-colors ${rowFocus}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`w-4 h-4 shrink-0 rounded-chip border flex items-center justify-center transition-colors ${
                          t.completed ? 'bg-emerald-500 border-emerald-500 text-abyss' : 'border-line-strong group-hover:border-cyan-glow'
                        }`}
                      >
                        {t.completed && <Check className="w-3 h-3" strokeWidth={3} />}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (action) setOpenKey(isOpen ? null : key)
                        else onToggle(t.id)
                      }}
                      {...(action
                        ? { 'aria-expanded': isOpen, 'aria-controls': `alignment-task-${key}` }
                        : { 'aria-pressed': t.completed })}
                      data-testid="alignment-task-row"
                      className={`flex-1 min-w-0 ${rowSize} pr-1 flex items-center gap-3 text-left transition-colors touch-manipulation ${rowFocus} ${
                        isNext ? '' : 'hover:bg-surface-2'
                      }`}
                    >
                      <span className={`w-24 shrink-0 text-[11px] ${isNext ? 'text-cyan-glow font-bold' : 'text-ink-muted'}`}>
                        {t.time}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block ${roomy ? 'line-clamp-2' : 'truncate'} ${
                            t.completed ? 'line-through decoration-ink-muted/60 text-ink-muted' : 'text-ink font-bold'
                          }`}
                        >
                          {t.title}
                        </span>
                        {subline && (
                          <span className="block truncate text-[11px] text-ink-muted" data-testid="alignment-one-thing-line">
                            {key === CLOSE_THE_DAY_TASK_KEY ? `Did you do it? ${subline}` : subline}
                          </span>
                        )}
                      </span>
                      {isNext && !isOpen && (
                        <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-cyan-glow">Next</span>
                      )}
                      {action && (
                        <ChevronDown
                          aria-hidden="true"
                          className={`w-3.5 h-3.5 shrink-0 text-ink-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      )}
                    </button>
                    {codex && (
                      <AlignmentCodexLink
                        codex={codex}
                        taskTitle={t.title}
                        onNavigate={onClose}
                      />
                    )}
                  </div>
                  {isOpen && action && (
                    <AlignmentTaskActionPanel
                      id={`alignment-task-${key}`}
                      taskKey={key}
                      action={action}
                      completed={t.completed}
                      oneThing={oneThing}
                      onSaveOneThing={saveTodaysOneThing}
                      onToggle={() => onToggle(t.id)}
                      onClose={onClose}
                      onDone={() => setOpenKey(null)}
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
