import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { HudButton } from '@/components/ui/HudButton'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'
import { useSafeOracle } from './OracleContext'
import {
  ONE_THING_MAX_LENGTH,
  setOracleDraft,
  type AlignmentTaskAction,
} from '@/lib/alignment-actions'

export interface AlignmentTaskActionPanelProps {
  id: string
  taskKey: string
  action: AlignmentTaskAction
  completed: boolean
  oneThing: string
  onSaveOneThing: (text: string) => void
  onToggle: () => void
  /** Closes the surrounding panel before leaving for another page or dialog. */
  onClose: () => void
  /** Folds this row back up. */
  onDone: () => void
}

/** The shortcut under an opened daily task: what checks it off, and a button to go do it. */
export function AlignmentTaskActionPanel({
  id,
  taskKey,
  action,
  completed,
  oneThing,
  onSaveOneThing,
  onToggle,
  onClose,
  onDone,
}: AlignmentTaskActionPanelProps) {
  const alignment = useDailyAlignment()
  const oracle = useSafeOracle()
  const navigate = useNavigate()
  const [text, setText] = useState(oneThing)

  const markButton = (
    <HudButton
      type="button"
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
        onDone()
      }}
    >
      {completed ? 'Mark not done' : 'Mark done'}
    </HudButton>
  )

  let primary: React.ReactNode = null
  if (action.kind === 'link') {
    primary = (
      <HudButton
        type="button"
        variant="primary"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
          void navigate({ to: action.to })
        }}
      >
        {action.label}
      </HudButton>
    )
  } else if (action.kind === 'timer') {
    primary = (
      <HudButton
        type="button"
        variant="primary"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
          alignment.openPractice(action.practice)
        }}
      >
        {action.label}
      </HudButton>
    )
  } else if (action.kind === 'oracle') {
    primary = (
      <HudButton
        type="button"
        variant="primary"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          setOracleDraft({ text: action.draft, taskKey })
          onClose()
          if (oracle) oracle.openNewChat()
          else void navigate({ to: '/oracle' })
        }}
      >
        {action.label}
      </HudButton>
    )
  }

  return (
    <div
      id={id}
      className="border-t border-line-subtle bg-abyss/40 px-3 py-3 space-y-2.5"
      data-testid="alignment-task-panel"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-xs leading-relaxed text-ink-body">{action.hint}</p>
      {action.kind === 'one-thing' ? (
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault()
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
            placeholder="Finish the draft, call Mom, ship the fix..."
            autoComplete="off"
            className="min-h-9 flex-1 min-w-0 rounded-control border border-line-subtle bg-surface-1 px-3 text-sm text-ink placeholder:text-ink-muted focus:border-cyan-glow focus:outline-none"
          />
          <div className="flex gap-2">
            <HudButton type="submit" variant="primary" size="sm" disabled={!text.trim() && !oneThing}>
              Save
            </HudButton>
            {markButton}
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {primary}
          {markButton}
        </div>
      )}
    </div>
  )
}
