import React, { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Check, Moon, X } from 'lucide-react'
import { HudButton } from '@/components/ui/HudButton'
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
  const { memberId, currentDate, setTaskCompleted, showRestDay, isOffDay, practiceAnyway, streakDays } = useDailyAlignment()
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

      {actions && showRestDay ? (
        <div className="rounded-control border border-line-subtle p-4 space-y-3" data-testid="alignment-rest-day">
          <div className="flex items-start gap-3">
            <Moon className="w-5 h-5 mt-0.5 shrink-0 text-cyan-glow" aria-hidden="true" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-bold text-ink">Rest day</p>
              <p className="text-xs leading-relaxed text-ink-muted">
                Today isn't one of your practice days, so there's nothing to do and your
                {streakDays > 0 ? ` ${streakDays}-day` : ''} streak is safe.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-8">
            <HudButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                practiceAnyway()
              }}
              data-testid="alignment-practice-anyway"
            >
              Practice anyway
            </HudButton>
            {memberId && (
              <Link
                to="/settings"
                hash="practice-days"
                onClick={onClose}
                className={`inline-flex items-center min-h-9 text-xs text-ink-muted hover:text-cyan-glow transition-colors rounded-control ${focusRing}`}
              >
                Change practice days
              </Link>
            )}
          </div>
        </div>
      ) : (
      <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            {countReady ? (
              <span className={`text-xs ${allTasksCompleted ? 'text-emerald-500 font-bold' : 'text-ink-muted'}`}>
                {allTasksCompleted ? 'All eight done for today' : `${completedCount} of ${tasks.length} done`}
                {actions && isOffDay && (
                  <span className="text-ink-muted font-normal" data-testid="alignment-off-day-note"> · Off day, so this is a bonus</span>
                )}
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
              const name = alignmentTaskCodex(key)?.label
              const codex = actions ? alignmentTaskCodex(key) : undefined
              const action = actions ? ALIGNMENT_TASK_ACTIONS[key] : undefined
              const opens = !t.completed && Boolean(action || codex)
              const isOpen = opens && openKey === key
              const detail =
                oneThing && key === ONE_THING_TASK_KEY
                  ? oneThing
                  : oneThing && key === CLOSE_THE_DAY_TASK_KEY
                    ? `Your one thing: ${oneThing}`
                    : ''
              const rowPad = roomy ? 'min-h-14 py-2.5' : 'min-h-12 py-2'
              const body = (
                <>
                  <span
                    className={`block ${roomy ? 'text-sm' : 'text-[13px]'} ${roomy ? 'line-clamp-2' : 'truncate'} ${
                      t.completed ? 'text-ink-muted' : 'text-ink font-bold'
                    }`}
                  >
                    {t.title}
                  </span>
                  <span className={`block truncate text-[11px] ${isNext ? 'text-cyan-glow' : 'text-ink-muted'}`}>
                    {name ? `${name} · ${t.time}` : t.time}
                    {detail && <span data-testid="alignment-one-thing-line"> · {detail}</span>}
                  </span>
                </>
              )
              return (
                <li key={t.id} className={isNext ? 'bg-surface-3 shadow-nav-current' : isOpen ? 'bg-surface-2' : ''}>
                  <div className="flex items-stretch">
                    {t.completed ? (
                      <span
                        role="img"
                        aria-label={`${t.title} done`}
                        data-testid="alignment-task-done"
                        className={`shrink-0 ${rowPad} pl-3 pr-3 flex items-center`}
                      >
                        <span className="w-[18px] h-[18px] rounded-chip bg-emerald-500 text-abyss flex items-center justify-center">
                          <Check className="w-3 h-3" strokeWidth={3} aria-hidden="true" />
                        </span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenKey(null)
                          onToggle(t.id)
                        }}
                        aria-label={`Mark ${t.title} done`}
                        data-testid="alignment-task-check"
                        className={`shrink-0 ${rowPad} pl-3 pr-3 flex items-center touch-manipulation group hover:bg-surface-2 transition-colors ${rowFocus}`}
                      >
                        <span
                          aria-hidden="true"
                          className="w-[18px] h-[18px] rounded-chip border border-line-strong group-hover:border-cyan-glow transition-colors"
                        />
                      </button>
                    )}
                    {t.completed ? (
                      <div className={`flex-1 min-w-0 ${rowPad} pr-3 flex flex-col justify-center`} data-testid="alignment-task-row">
                        {body}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (opens) setOpenKey(isOpen ? null : key)
                          else onToggle(t.id)
                        }}
                        {...(opens ? { 'aria-expanded': isOpen, 'aria-controls': `alignment-task-${key}` } : {})}
                        data-testid="alignment-task-row"
                        className={`flex-1 min-w-0 ${rowPad} pr-3 flex flex-col justify-center text-left transition-colors touch-manipulation ${rowFocus} ${
                          isNext ? '' : 'hover:bg-surface-2'
                        }`}
                      >
                        {body}
                      </button>
                    )}
                  </div>
                  {isOpen && (
                    <AlignmentTaskActionPanel
                      id={`alignment-task-${key}`}
                      taskKey={key}
                      taskTitle={t.title}
                      action={action}
                      codex={codex}
                      oneThing={oneThing}
                      onSaveOneThing={saveTodaysOneThing}
                      onClose={onClose}
                      onDone={() => setOpenKey(null)}
                    />
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </>
  )
}
