import React, { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { HudButton } from '@/components/ui/HudButton'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'
import { useHudPersist } from '@/hooks/useHudPersist'
import { getAuthJWTToken } from '@/lib/jwt'
import { setPracticeDaysFn } from '@/lib/server/api'
import { shiftDays } from '@/lib/alignment-tasks'
import {
  MIN_PRACTICE_DAYS,
  WEEKDAY_DISPLAY_ORDER,
  WEEKDAY_NAMES,
  WEEKDAY_SHORT,
  countPracticeDays,
  describePracticeDays,
  practiceDaysOn,
} from '@/lib/practice-days'
import { cn } from '@/lib/utils'
import { SettingsCard } from './settings-ui'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

/** Settings card: pick the weekdays daily tasks show on. Changes apply from tomorrow. */
export function PracticeDaysCard() {
  const alignment = useDailyAlignment()
  const persist = useHudPersist()
  const { toast } = useToast()
  const { currentDate, practiceSchedule, isOffDay, memberId, streakReady } = alignment
  const tomorrow = shiftDays(currentDate, 1)
  const savedDays = practiceDaysOn(tomorrow, practiceSchedule)
  const [days, setDays] = useState(savedDays)
  const [saving, setSaving] = useState(false)

  // Follow the saved value (first server read, or a save) unless the member is mid-edit.
  const [seenSaved, setSeenSaved] = useState(savedDays)
  if (seenSaved !== savedDays) {
    setSeenSaved(savedDays)
    if (days === seenSaved) setDays(savedDays)
  }

  useEffect(() => {
    if (window.location.hash !== '#practice-days') return
    document.getElementById('practice-days')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [])

  const count = countPracticeDays(days)
  const changed = days !== savedDays

  const toggle = (weekday: number) => {
    const bit = 1 << weekday
    if (days & bit && count <= MIN_PRACTICE_DAYS) return
    setDays(days ^ bit)
  }

  const save = async () => {
    if (!memberId || saving || !changed) return
    setSaving(true)
    try {
      await persist.run('settings-practice-days', async () => {
        const token = await getAuthJWTToken()
        const result = await setPracticeDaysFn({
          data: { days, date: currentDate, userId: memberId, token: token ?? undefined },
        })
        alignment.setPracticeSchedule(result.practiceSchedule)
      })
      toast.success(`${describePracticeDays(days)}, starting tomorrow.`, { title: 'Practice days saved' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save your practice days. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsCard
      id="practice-days"
      className="scroll-mt-24"
      title="Practice days"
      description="Daily tasks show on these days. Skipping an off day never breaks your streak, and anything you do on one is a bonus."
    >
      <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Practice days">
        {WEEKDAY_DISPLAY_ORDER.map((weekday) => {
          const on = Boolean(days & (1 << weekday))
          const locked = on && count <= MIN_PRACTICE_DAYS
          return (
            <button
              key={weekday}
              type="button"
              aria-pressed={on}
              aria-label={WEEKDAY_NAMES[weekday]}
              title={locked ? `Keep at least ${MIN_PRACTICE_DAYS} days` : WEEKDAY_NAMES[weekday]}
              onClick={() => toggle(weekday)}
              disabled={!streakReady || saving}
              data-testid={`practice-day-${weekday}`}
              className={cn(
                'min-h-11 rounded-control border text-xs font-semibold transition-colors touch-manipulation disabled:opacity-60',
                focusRing,
                on
                  ? 'border-cyan-glow bg-cyan-glow/15 text-cyan-glow'
                  : 'border-line-subtle text-ink-muted hover:text-ink hover:border-line-strong',
                locked && 'cursor-not-allowed',
              )}
            >
              {WEEKDAY_SHORT[weekday]}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="text-xs text-ink-muted" data-testid="practice-days-status">
          {changed
            ? `${count} days a week. Starts tomorrow, so today stays as it is.`
            : `${describePracticeDays(savedDays)}, at least ${MIN_PRACTICE_DAYS} days.${isOffDay ? ' Today is a rest day.' : ''}`}
        </p>
        <HudButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void save()}
          disabled={!changed || saving || !memberId}
          data-testid="practice-days-save"
        >
          Save days
        </HudButton>
      </div>
    </SettingsCard>
  )
}
