/**
 * Daily alignment tasks that real actions in the app can check off.
 *
 * Every task can still be ticked by hand. When a member does the matching thing (replies on
 * the forum, finishes an Academy lesson, runs a timer, talks to the Oracle), the app reports it
 * here and the alignment provider ticks the task for today. All of this runs in the browser;
 * the server only ever sees the tick itself, the same as a manual one.
 */

export const ALIGNMENT_ACTION_EVENT = 'moltology:alignment-action'

export interface AlignmentActionDetail {
  taskKey: string
}

/** Ticks today's task with this key, if it is not done yet. Safe to call anywhere. */
export function reportAlignmentAction(taskKey: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<AlignmentActionDetail>(ALIGNMENT_ACTION_EVENT, { detail: { taskKey } }))
}

export type AlignmentTaskAction =
  | { kind: 'link'; to: '/forum' | '/academy'; label: string; hint: string }
  | { kind: 'timer'; practice: AlignmentPractice; label: string; hint: string }
  | { kind: 'one-thing'; hint: string }
  | { kind: 'oracle'; label: string; hint: string; draft: string }

export type AlignmentPractice = 'silent' | 'deep-work'

/** What each task offers when its row is opened. Tasks without an entry just tick. */
export const ALIGNMENT_TASK_ACTIONS: Record<string, AlignmentTaskAction> = {
  'silent-synchronization': {
    kind: 'timer',
    practice: 'silent',
    label: 'Start a quiet timer',
    hint: 'Sit quietly for a few minutes. Starting the timer checks this off.',
  },
  'prompt-construction': {
    kind: 'one-thing',
    hint: 'Write it down. It stays here all day, and Close the day brings it back.',
  },
  'skill-development': {
    kind: 'link',
    to: '/academy',
    label: 'Open Academy',
    hint: 'Finish a lesson or pass a quiz and this checks off.',
  },
  'iterative-refinement': {
    kind: 'timer',
    practice: 'deep-work',
    label: 'Start a focus timer',
    hint: 'Pick a length and work on one thing. Starting the timer checks this off.',
  },
  'community-outreach': {
    kind: 'link',
    to: '/forum',
    label: 'Open the forum',
    hint: "Reply to someone or upvote another member's post. Either one checks this off.",
  },
  'reflection-log': {
    kind: 'oracle',
    label: 'Talk it through',
    hint: 'Tell the Oracle what you want to let go of. Sending it checks this off.',
    draft: 'Help me let go of something from today. What happened was ',
  },
}

export const ONE_THING_TASK_KEY = 'prompt-construction'
export const CLOSE_THE_DAY_TASK_KEY = 'alignment-review'
export const ONE_THING_MAX_LENGTH = 120

/** Fired in this tab after the one thing changes, so every open list shows it. */
export const ONE_THING_EVENT = 'moltology:alignment-one-thing'

function oneThingKey(userId: string | null | undefined, date: string) {
  return `moltology:one-thing:${userId || 'guest'}:${date}`
}

/** Today's one thing, kept on this device only. */
export function readOneThing(userId: string | null | undefined, date: string): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(oneThingKey(userId, date)) ?? ''
  } catch {
    return ''
  }
}

export function saveOneThing(userId: string | null | undefined, date: string, text: string) {
  if (typeof window === 'undefined') return
  const value = text.trim().slice(0, ONE_THING_MAX_LENGTH)
  try {
    const key = oneThingKey(userId, date)
    if (value) window.localStorage.setItem(key, value)
    else window.localStorage.removeItem(key)
    // Drop older days so the store does not grow.
    const prefix = `moltology:one-thing:${userId || 'guest'}:`
    for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
      const k = window.localStorage.key(i)
      if (k && k.startsWith(prefix) && k !== key) window.localStorage.removeItem(k)
    }
  } catch {
    // The task still ticks when storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent(ONE_THING_EVENT))
}

/** A draft for the Oracle's chat box, picked up by the next chat that renders. */
const ORACLE_DRAFT_KEY = 'moltology:oracle-draft'
export const ORACLE_DRAFT_EVENT = 'moltology:oracle-draft'

export interface OracleDraft {
  text: string
  /** Task to check off when the member sends this draft. */
  taskKey?: string
}

export function setOracleDraft(draft: OracleDraft) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(ORACLE_DRAFT_KEY, JSON.stringify(draft))
  } catch {}
  window.dispatchEvent(new CustomEvent(ORACLE_DRAFT_EVENT))
}

/** Returns and clears the waiting draft. */
export function takeOracleDraft(): OracleDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(ORACLE_DRAFT_KEY)
    if (!raw) return null
    window.sessionStorage.removeItem(ORACLE_DRAFT_KEY)
    const parsed = JSON.parse(raw) as OracleDraft
    return typeof parsed?.text === 'string' ? parsed : null
  } catch {
    return null
  }
}
