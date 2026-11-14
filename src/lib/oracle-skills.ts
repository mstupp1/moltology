/**
 * Oracle skills: short written methods the Oracle walks a member through (focus rounds,
 * a two-minute start, a weekly review). Members own skills (free starters, bought with
 * gems, or included with Oracle MAX), call one on purpose from the chat box, or let the
 * Oracle pick an owned skill when a message clearly fits.
 *
 * This module is safe for the browser: card text only. Playbooks stay on the server
 * (src/lib/ai/oracle-skills-catalog.ts reads content/oracle-skills/*.md).
 */

export const ORACLE_SKILL_CATEGORIES = ['Focus', 'Planning', 'Starting', 'Habits', 'Calm'] as const
export type OracleSkillCategory = (typeof ORACLE_SKILL_CATEGORIES)[number]

/** Gem prices. A free skill is a starter every member owns. */
export const ORACLE_SKILL_PRICES = [0, 60, 150] as const

/** Response header naming the skill that shaped a streamed reply. */
export const ORACLE_SKILL_HEADER = 'x-oracle-skill'

/** What the market and the chat picker show for one skill. */
export interface OracleSkillInfo {
  id: string
  name: string
  summary: string
  /** One line on when the skill helps. Also the Oracle's discovery hint. */
  whenToUse: string
  category: OracleSkillCategory
  /** Gem price; 0 = free starter. */
  price: number
  order: number
  /** Things a member might say that fit the skill. */
  examples: string[]
  /** A short sample exchange shown on the skill card. */
  preview: { member: string; oracle: string }
}

/** Why a member can use a skill. Purchases and admin grants stay; MAX lasts while subscribed. */
export type OracleSkillAccess = 'starter' | 'owned' | 'max' | 'admin'

export interface OracleSkillCard extends OracleSkillInfo {
  /** Null when the member can't use it yet. */
  access: OracleSkillAccess | null
  /** Off = still usable from the picker, but the Oracle won't pick it on its own. */
  enabled: boolean
}

/** Stored on profiles.oracleSkillSettings. Missing keys mean the defaults. */
export interface OracleSkillSettings {
  /** Let the Oracle pick an owned skill on its own. Default on. */
  autoPick?: boolean
  /** Owned skills switched off for discovery. */
  off?: string[]
}

export interface OracleSkillsPayload {
  skills: OracleSkillCard[]
  autoPick: boolean
  guest?: boolean
  isPremium: boolean
  gems: number
  credits: number
}

export interface BuyOracleSkillResult {
  ok: boolean
  gems: number
  credits: number
  error?: string
}

/** Saved on an assistant message's `parts`, so a reloaded chat can show which skill it used. */
export interface OracleSkillPart {
  type: 'skill'
  id: string
  name: string
  /** `picked` = the member chose it; `auto` = the Oracle looked it up; `continued` = carried on from the last reply. */
  how: 'picked' | 'auto' | 'continued'
}

export function readSkillPart(parts: unknown): OracleSkillPart | null {
  if (!Array.isArray(parts)) return null
  const part = parts.find(
    (p): p is OracleSkillPart =>
      Boolean(p) && typeof p === 'object' && (p as { type?: unknown }).type === 'skill'
      && typeof (p as { id?: unknown }).id === 'string' && typeof (p as { name?: unknown }).name === 'string',
  )
  return part ?? null
}

export function autoPickOn(settings: OracleSkillSettings | null | undefined): boolean {
  return settings?.autoPick !== false
}

export function skillSwitchedOff(settings: OracleSkillSettings | null | undefined, skillId: string): boolean {
  return Boolean(settings?.off?.includes(skillId))
}

/** The settings after one change. Unknown ids are dropped so the list can't grow without bound. */
export function nextSkillSettings(
  current: OracleSkillSettings | null | undefined,
  change: { autoPick?: boolean; skillId?: string; enabled?: boolean },
  knownIds: ReadonlySet<string>,
): OracleSkillSettings {
  const off = new Set((current?.off ?? []).filter((id) => knownIds.has(id)))
  if (change.skillId && knownIds.has(change.skillId) && typeof change.enabled === 'boolean') {
    if (change.enabled) off.delete(change.skillId)
    else off.add(change.skillId)
  }
  const autoPick = typeof change.autoPick === 'boolean' ? change.autoPick : autoPickOn(current)
  return { autoPick, off: [...off].sort() }
}

/** Skills a signed-in member can call from the picker, in catalog order. */
export function usableSkills(skills: OracleSkillCard[]): OracleSkillCard[] {
  return skills.filter((s) => s.access !== null)
}
