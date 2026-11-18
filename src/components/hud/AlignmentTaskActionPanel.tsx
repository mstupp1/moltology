import React, { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { BookOpen } from 'lucide-react'
import { HudButton } from '@/components/ui/HudButton'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'
import { useSafeOracle } from './OracleContext'
import { codexVerseAnchor, type AlignmentCodexRef } from '@/lib/alignment-tasks'
import {
  ONE_THING_MAX_LENGTH,
  setOracleDraft,
  type AlignmentTaskAction,
} from '@/lib/alignment-actions'

export interface AlignmentTaskActionPanelProps {
  id: string
  taskKey: string
  taskTitle: string
  action?: AlignmentTaskAction
  codex?: AlignmentCodexRef
  oneThing: string
  onSaveOneThing: (text: string) => void
  /** Closes the surrounding panel before leaving for another page or dialog. */
  onClose: () => void
  /** Folds this row back up. */
  onDone: () => void
}

/** Under an opened daily task: one hint line, one button to go do it, and its Codex passage. */
export function AlignmentTaskActionPanel({
  id,
  taskKey,
  taskTitle,
  action,
  codex,
  oneThing,
  onSaveOneThing,
  onClose,
  onDone,
}: AlignmentTaskActionPanelProps) {
  const alignment = useDailyAlignment()
  const oracle = useSafeOracle()
  const navigate = useNavigate()
  const [text, setText] = useState(oneThing)

  const go = (run: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
    run()
  }

  let primary: React.ReactNode = null
  if (action?.kind === 'link') {
    primary = (
      <HudButton type="button" variant="primary" size="sm" onClick={go(() => void navigate({ to: action.to }))}>
        {action.label}
      </HudButton>
    )
  } else if (action?.kind === 'timer') {
    primary = (
      <HudButton type="button" variant="primary" size="sm" onClick={go(() => alignment.openPractice(action.practice))}>
        {action.label}
      </HudButton>
    )
  } else if (action?.kind === 'oracle') {
    primary = (
      <HudButton
        type="button"
        variant="primary"
        size="sm"
        onClick={go(() => {
          setOracleDraft({ text: action.draft, taskKey })
          if (oracle) oracle.openNewChat()
          else void navigate({ to: '/oracle' })
        })}
      >
        {action.label}
      </HudButton>
    )
  }

  if (action?.kind === 'break') {
    primary = (
      <HudButton
        type="button"
        variant="primary"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          void alignment.setTaskCompleted(taskKey, true)
          onDone()
        }}
      >
        {action.label}
      </HudButton>
    )
  }

  if (action?.kind === 'close-day') {
    const closeDay = (e: React.MouseEvent) => {
      e.stopPropagation()
      void alignment.setTaskCompleted(taskKey, true)
      onDone()
    }
    const others = alignment.tasks.filter((t) => t.key !== taskKey)
    const doneOthers = others.filter((t) => t.completed).length
    const streak = alignment.streakDays
    primary = (
      <>
        <p className="w-full text-xs leading-relaxed text-ink-muted" data-testid="alignment-day-recap">
          {doneOthers} of {others.length} tasks done today
          {streak > 0 ? ` · ${streak}-day streak` : ''}
          {oneThing ? '. Did you get to your one thing?' : ''}
        </p>
        {oneThing ? (
          <>
            <HudButton type="button" variant="primary" size="sm" onClick={closeDay}>Did it</HudButton>
            <HudButton type="button" variant="secondary" size="sm" onClick={closeDay}>Not today</HudButton>
          </>
        ) : (
          <HudButton type="button" variant="primary" size="sm" onClick={closeDay}>Close the day</HudButton>
        )}
      </>
    )
  }

  const codexLink = codex ? (
    <Link
      to="/codex/$slug"
      params={{ slug: codex.slug }}
      hash={codex.verse ? codexVerseAnchor(codex.verse) : undefined}
      onClick={onClose}
      aria-label={`Read about ${taskTitle} in the Codex`}
      data-testid="alignment-codex-link"
      className="inline-flex items-center gap-1.5 min-h-9 text-xs text-ink-muted hover:text-cyan-glow transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow rounded-control"
    >
      <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      Read in the Codex
    </Link>
  ) : null

  return (
    <div
      id={id}
      className="pl-[42px] pr-3 pb-3 space-y-2.5"
      data-testid="alignment-task-panel"
      onClick={(e) => e.stopPropagation()}
    >
      {action && action.kind !== 'close-day' && <p className="text-xs leading-relaxed text-ink-muted">{action.hint}</p>}
      {action?.kind === 'one-thing' ? (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!text.trim()) return
            onSaveOneThing(text)
            onDone()
          }}
        >
          <label className="sr-only" htmlFor={`${id}-input`}>Your one thing today</label>
          <input
            id={`${id}-input`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={ONE_THING_MAX_LENGTH}
            placeholder="Finish the draft, call Mom..."
            autoComplete="off"
            className="min-h-9 flex-1 min-w-0 rounded-control border border-line-subtle bg-surface-1 px-3 text-sm text-ink placeholder:text-ink-muted focus:border-cyan-glow focus:outline-none"
          />
          <HudButton type="submit" variant="primary" size="sm" disabled={!text.trim()}>
            Save
          </HudButton>
        </form>
      ) : null}
      {(primary || codexLink) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {primary}
          {codexLink}
        </div>
      )}
    </div>
  )
}
