/**
 * Progress a guest makes before signing up: their Moltmax audit answers and
 * today's Daily Alignment ticks. Kept in this browser only, and claimed by the
 * first account that signs in here, so joining saves the work instead of
 * starting over.
 *
 * Audit answers are stored, not the result: the score is recomputed from the
 * current question set when it is claimed, and the server derives the labels.
 */
import { MOLTMAX_QUESTIONS, type QuizAnswers } from './moltmax-quiz'
import { CANONICAL_ALIGNMENT_TASKS } from './alignment-tasks'

import { GUEST_PROGRESS_STORAGE_KEY } from './guest-progress-key'

export { GUEST_PROGRESS_STORAGE_KEY }

/** An unclaimed audit is kept for a week; alignment ticks only count for the day they were made. */
export const GUEST_AUDIT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TASK_KEYS = new Set(CANONICAL_ALIGNMENT_TASKS.map((task) => task.key))
const QUESTION_IDS = new Set(MOLTMAX_QUESTIONS.map((question) => question.id))

export interface GuestAudit {
  answers: QuizAnswers
  completedAt: number
  /** The guest pressed "Save results", so the claim may replace an older saved audit. */
  saveRequested: boolean
}

export interface GuestAlignment {
  date: string
  completedKeys: string[]
}

export interface GuestProgress {
  audit?: GuestAudit
  alignment?: GuestAlignment
}

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

function parseAudit(value: unknown, now: number): GuestAudit | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  if (typeof record.completedAt !== 'number' || !Number.isFinite(record.completedAt)) return undefined
  if (now - record.completedAt > GUEST_AUDIT_MAX_AGE_MS || record.completedAt > now + 60_000) return undefined
  if (!record.answers || typeof record.answers !== 'object') return undefined
  const answers: QuizAnswers = {}
  for (const [id, answer] of Object.entries(record.answers as Record<string, unknown>)) {
    if (QUESTION_IDS.has(id) && typeof answer === 'string' && answer.length > 0) answers[id] = answer
  }
  // Only a finished audit is worth keeping.
  if (Object.keys(answers).length !== QUESTION_IDS.size) return undefined
  return { answers, completedAt: record.completedAt, saveRequested: record.saveRequested === true }
}

function parseAlignment(value: unknown): GuestAlignment | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  if (typeof record.date !== 'string' || !DATE_RE.test(record.date)) return undefined
  if (!Array.isArray(record.completedKeys)) return undefined
  const completedKeys = [...new Set(record.completedKeys.filter((key): key is string => typeof key === 'string' && TASK_KEYS.has(key)))]
  return { date: record.date, completedKeys }
}

/** Parse a stored record, dropping anything malformed or stale. */
export function parseGuestProgress(raw: string | null, now: number = Date.now()): GuestProgress {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    const record = parsed as Record<string, unknown>
    const audit = parseAudit(record.audit, now)
    const alignment = parseAlignment(record.alignment)
    return { ...(audit ? { audit } : {}), ...(alignment ? { alignment } : {}) }
  } catch {
    return {}
  }
}

export function readGuestProgress(now: number = Date.now()): GuestProgress {
  const store = storage()
  if (!store) return {}
  try {
    return parseGuestProgress(store.getItem(GUEST_PROGRESS_STORAGE_KEY), now)
  } catch {
    return {}
  }
}

function writeGuestProgress(progress: GuestProgress): void {
  const store = storage()
  if (!store) return
  try {
    if (!progress.audit && !progress.alignment) store.removeItem(GUEST_PROGRESS_STORAGE_KEY)
    else store.setItem(GUEST_PROGRESS_STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Private mode or a full quota: the guest simply keeps nothing.
  }
}

/** Remember a finished guest audit. Keeps an earlier save request for the same answers. */
export function saveGuestAudit(answers: QuizAnswers, options: { saveRequested?: boolean; now?: number } = {}): void {
  const now = options.now ?? Date.now()
  const current = readGuestProgress(now)
  const audit = parseAudit({ answers, completedAt: now, saveRequested: options.saveRequested === true }, now)
  if (!audit) return
  writeGuestProgress({ ...current, audit })
}

/** Mark the stored audit as one the guest asked to save. */
export function requestGuestAuditSave(now: number = Date.now()): void {
  const current = readGuestProgress(now)
  if (!current.audit) return
  writeGuestProgress({ ...current, audit: { ...current.audit, saveRequested: true } })
}

export function saveGuestAlignment(date: string, completedKeys: string[]): void {
  const alignment = parseAlignment({ date, completedKeys })
  if (!alignment) return
  writeGuestProgress({ ...readGuestProgress(), alignment })
}

/** Today's guest ticks, or nothing if they were made on another day. */
export function guestAlignmentFor(date: string, progress: GuestProgress = readGuestProgress()): string[] {
  return progress.alignment?.date === date ? progress.alignment.completedKeys : []
}

export function clearGuestAudit(): void {
  const current = readGuestProgress()
  writeGuestProgress({ ...current, audit: undefined })
}

export function clearGuestAlignment(): void {
  const current = readGuestProgress()
  writeGuestProgress({ ...current, alignment: undefined })
}
