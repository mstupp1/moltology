/**
 * Community Rules & Guardrails for Moltology Neural Hub
 */

import { forumVisibleLength } from './forum-markdown'
import { checkRateLimit } from './ai/guardrails'
import {
  CONTENT_HARM_ERROR,
  CONTENT_SECRET_ERROR,
  containsHarmfulContent,
  containsSecretLeak,
  stripControlChars,
} from './content-safety'

export interface CommunityRule {
  id: number
  title: string
  shortSummary: string
  description: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
}

export const COMMUNITY_RULES: CommunityRule[] = [
  {
    id: 1,
    title: 'Civility and respect',
    shortSummary: 'Keep discussions thoughtful and respectful across all experience levels.',
    description:
      'Add something useful to conversations on AI, daily workflows, or Moltology practice. Personal attacks, harassment, or hostility have no place here and will lead to suspension.',
    severity: 'CRITICAL',
  },
  {
    id: 2,
    title: 'Keep threads useful',
    shortSummary: 'Check existing threads before starting a new one, and skip low-effort noise.',
    description:
      'Look through recent discussions before posting a new topic. Duplicate threads, spam links, or off-topic flooding are removed to keep the boards readable.',
    severity: 'HIGH',
  },
  {
    id: 3,
    title: 'Protect your privacy and credentials',
    shortSummary: 'Never share API keys, tokens, passwords, or private personal information.',
    description:
      'Keep your work and accounts safe. Never post secret keys, database URLs, session tokens, or anyone else’s private details in public threads.',
    severity: 'CRITICAL',
  },
  {
    id: 4,
    title: 'Honor the Soft-Shell Covenant',
    shortSummary: 'Every member is learning, from day one onward.',
    description:
      'Newcomers at Stage 1 and experienced members at Stage 4 share the same space. Experienced members are expected to help without condescension, and deliberate bad advice is not tolerated.',
    severity: 'MEDIUM',
  },
  {
    id: 5,
    title: 'Safety comes first',
    shortSummary: 'Warmth, honesty, and real-world safety come before any theme.',
    description:
      'Beneath our ocean setting and humor, basic safety and respect are non-negotiable. Never promote real-world harm, self-harm, or illegal activity.',
    severity: 'CRITICAL',
  },
]

export interface GuardrailValidationResult {
  valid: boolean
  error?: string
}

export const FORUM_WRITE_RATE_LIMIT = 10
export const FORUM_WRITE_RATE_WINDOW_MS = 60 * 1000
export const FORUM_WRITE_RATE_ERROR = 'You are posting too quickly. Wait a minute and try again.'
/** Topic and reply creates and edits per member in any rolling 24 hours. */
export const FORUM_WRITE_DAILY_LIMIT = 150
export const FORUM_WRITE_DAILY_ERROR =
  'You have reached the daily limit for new posts and edits. Try again tomorrow.'
export const FORUM_LOCKED_ERROR = 'This thread is locked. New replies are closed.'
export const FORUM_STAFF_BOARD_ERROR = 'Only staff can start topics on this board. Pick another board for your post.'

/**
 * Caps signed-in topic/reply create and edit traffic per member.
 */
export function assertForumWriteRateLimit(userId: string): void {
  const result = checkRateLimit(
    `forum-write:${userId}`,
    FORUM_WRITE_RATE_LIMIT,
    FORUM_WRITE_RATE_WINDOW_MS,
  )
  if (!result.success) {
    throw new Error(FORUM_WRITE_RATE_ERROR)
  }
}

export interface ForumWriteCounts {
  lastMinute: number
  lastDay: number
}

/**
 * The durable check behind assertForumWriteRateLimit. Counts come from the
 * database, so the cap holds across server instances. Returns an error message
 * when the member is over a limit, or null when the write may go ahead.
 */
export function forumWriteLimitError(counts: ForumWriteCounts): string | null {
  if (counts.lastDay >= FORUM_WRITE_DAILY_LIMIT) return FORUM_WRITE_DAILY_ERROR
  if (counts.lastMinute >= FORUM_WRITE_RATE_LIMIT) return FORUM_WRITE_RATE_ERROR
  return null
}

function scanForumSafety(text: string): GuardrailValidationResult | null {
  const cleaned = stripControlChars(text)
  if (containsSecretLeak(cleaned)) {
    return { valid: false, error: CONTENT_SECRET_ERROR }
  }
  if (containsHarmfulContent(cleaned)) {
    return { valid: false, error: CONTENT_HARM_ERROR }
  }
  return null
}

// Reserve 150 title characters within the 1,500-character screening budget.
export const FORUM_TITLE_MAX_CHARS = 150
export const FORUM_BODY_MAX_CHARS = 1_350

/**
 * Validates forum topic or reply content against community guardrails.
 */
export function validateForumContent(
  title: string | undefined,
  content: string
): GuardrailValidationResult {
  const trimmedContent = content ? content.trim() : ''
  const trimmedTitle = title ? title.trim() : ''

  if (title !== undefined) {
    if (trimmedTitle.length < 5) {
      return {
        valid: false,
        error: 'Topic title must be at least 5 characters long.',
      }
    }
    if (trimmedTitle.length > FORUM_TITLE_MAX_CHARS) {
      return {
        valid: false,
        error: 'Topic title cannot exceed 150 characters.',
      }
    }
  }

  // Count what readers see, so markdown syntax alone cannot pass the minimum.
  if (forumVisibleLength(trimmedContent) < 10) {
    return {
      valid: false,
      error: 'Content must be at least 10 characters long.',
    }
  }

  if (trimmedContent.length > FORUM_BODY_MAX_CHARS) {
    return {
      valid: false,
      error: 'Content cannot exceed 1,350 characters, including formatting and links.',
    }
  }

  const titleSafety = title !== undefined ? scanForumSafety(trimmedTitle) : null
  if (titleSafety) return titleSafety

  const bodySafety = scanForumSafety(trimmedContent)
  if (bodySafety) return bodySafety

  return { valid: true }
}
