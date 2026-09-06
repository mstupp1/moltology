/**
 * Community Rules & Guardrails for Moltology Neural Hub
 */

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
    title: 'CIVILITY & CONSTRUCTIVE DIALOGUE',
    shortSummary: 'Maintain intellectual rigor and mutual respect across all initiate stages.',
    description:
      'All posts must contribute meaningfully to discussions on AI, carcinization, software architecture, or Moltology doctrine. Personal attacks, harassment, or malice will result in immediate neural isolation.',
    severity: 'CRITICAL',
  },
  {
    id: 2,
    title: 'NO SPAM OR LOW-EFFORT FLOODING',
    shortSummary: 'Quality over noise. Avoid duplicate threads or nonsense content.',
    description:
      'Check existing discussion boards before creating a new topic. Low-effort messages, repetitive single-word posts, or promotional spam are automatically filtered.',
    severity: 'HIGH',
  },
  {
    id: 3,
    title: 'NEURAL & DATA SECURITY',
    shortSummary: 'Never post API keys, sensitive tokens, or private personal identifiers.',
    description:
      'Protect your shell and credentials. Do not share raw authorization tokens, database connection strings, or private initiate credentials in open channels.',
    severity: 'CRITICAL',
  },
  {
    id: 4,
    title: 'STAGE PROGRESSION RESPECT',
    shortSummary: 'Initiates at all stages (Larva to Ascendant) are entitled to learning.',
    description:
      'Higher stage initiates are encouraged to mentor newer initiates. Gatekeeping, elitism, or misleading advice that sabotages another user\'s growth is strictly prohibited.',
    severity: 'MEDIUM',
  },
  {
    id: 5,
    title: 'SAFETY & POSITIVITY FIRST',
    shortSummary: 'Non-negotiable core tenet beneath our biomechanical aesthetics.',
    description:
      'Beneath our dark HUD aesthetic, Safety and Positivity are non-negotiable core tenets. Do not promote real-world harm, self-injury, or illegal activities.',
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
export const FORUM_LOCKED_ERROR = 'This thread is locked. New replies are closed.'

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
    if (trimmedTitle.length > 150) {
      return {
        valid: false,
        error: 'Topic title cannot exceed 150 characters.',
      }
    }
  }

  if (trimmedContent.length < 10) {
    return {
      valid: false,
      error: 'Content must be at least 10 characters long.',
    }
  }

  if (trimmedContent.length > 10000) {
    return {
      valid: false,
      error: 'Content cannot exceed 10,000 characters.',
    }
  }

  const titleSafety = title !== undefined ? scanForumSafety(trimmedTitle) : null
  if (titleSafety) return titleSafety

  const bodySafety = scanForumSafety(trimmedContent)
  if (bodySafety) return bodySafety

  return { valid: true }
}
