/**
 * Oracle chat settings a member picks: a personality that sets the Oracle's tone, and
 * custom instructions that tell it about the member and how to answer.
 *
 * Safe for the browser: option text only. The prompt wording lives in
 * src/lib/ai/oracle-chat-settings-prompt.ts.
 */

export const ORACLE_PERSONALITIES = [
  {
    id: 'balanced',
    name: 'Balanced',
    summary: 'The usual Oracle. Deadpan, supportive, a little lore.',
  },
  {
    id: 'straight',
    name: 'Straight talk',
    summary: 'Short and plain. Answers first, almost no lore.',
  },
  {
    id: 'warm',
    name: 'Warm coach',
    summary: 'Gentle and encouraging. Notices progress, goes easy on setbacks.',
  },
  {
    id: 'tough',
    name: 'Tough love',
    summary: 'Blunt. Calls out excuses and pushes you to act now.',
  },
  {
    id: 'lore',
    name: 'Deep lore',
    summary: 'Full Benthic voice. Doctrine, scripture and ritual language.',
  },
] as const

export type OraclePersonalityId = (typeof ORACLE_PERSONALITIES)[number]['id']

export const DEFAULT_ORACLE_PERSONALITY: OraclePersonalityId = 'balanced'

/** Short enough for Laya to screen in one pass (it rejects state over ~1,500 characters). */
export const ORACLE_CUSTOM_INSTRUCTIONS_MAX = 1_000

/** Stored on profiles.oracleChatSettings. Missing keys mean the defaults. */
export interface OracleChatSettings {
  personality?: OraclePersonalityId
  /** Free text from the member, already screened when saved. */
  customInstructions?: string
}

export function isOraclePersonality(value: unknown): value is OraclePersonalityId {
  return typeof value === 'string' && ORACLE_PERSONALITIES.some((p) => p.id === value)
}

export function personalityOf(settings: OracleChatSettings | null | undefined): OraclePersonalityId {
  return isOraclePersonality(settings?.personality) ? settings.personality : DEFAULT_ORACLE_PERSONALITY
}

/** Trims, normalizes line breaks and drops control characters. Does not cap length. */
export function cleanCustomInstructions(text: string | null | undefined): string {
  return (text ?? '')
    .replace(/\r\n?/g, '\n')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** What the settings panel loads. */
export interface OracleChatSettingsPayload {
  personality: OraclePersonalityId
  customInstructions: string
  /** Skills auto-pick, mirrored from the skill settings so one panel can show it. */
  autoPick: boolean
}

export interface SaveOracleChatSettingsResult {
  ok: boolean
  settings: OracleChatSettingsPayload
  error?: string
}
