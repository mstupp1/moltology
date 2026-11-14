import { eq } from 'drizzle-orm'
import { getDb } from '../../db'
import { oracleSkillUnlocks, profiles } from '../../db/schema'
import { ORACLE_SKILLS, toSkillInfo, type OracleSkill } from '../ai/oracle-skills-catalog'
import type { OracleSkillPlan } from '../ai/oracle-skills-prompt'
import {
  autoPickOn,
  skillSwitchedOff,
  type OracleSkillAccess,
  type OracleSkillCard,
  type OracleSkillSettings,
  type OracleSkillsPayload,
} from '../oracle-skills'
import { isAdmin } from '../permissions'

// Reads only. Kept apart from the purchase code so the chat route doesn't load Stripe.

type Db = ReturnType<typeof getDb>

export interface MemberSkillProfile {
  role: string | null
  isPremium: boolean
  settings: OracleSkillSettings
  unlocked: ReadonlySet<string>
}

/**
 * Why a member can use a skill, or null. Free starters and purchases always count;
 * admins get every skill; Oracle MAX includes every skill while the subscription is active.
 */
export function skillAccess(skill: Pick<OracleSkill, 'id' | 'price'>, member: MemberSkillProfile): OracleSkillAccess | null {
  if (skill.price === 0) return 'starter'
  if (member.unlocked.has(skill.id)) return 'owned'
  if (isAdmin(null, member.role)) return 'admin'
  if (member.isPremium) return 'max'
  return null
}

export function buildSkillCards(member: MemberSkillProfile | null): OracleSkillCard[] {
  return ORACLE_SKILLS.map((skill) => {
    const access = member ? skillAccess(skill, member) : null
    return {
      ...toSkillInfo(skill),
      access,
      enabled: access !== null && !skillSwitchedOff(member?.settings, skill.id),
    }
  })
}

export async function loadMemberSkillProfile(db: Db, userId: string) {
  const [profileRows, unlockRows] = await Promise.all([
    db
      .select({
        role: profiles.role,
        isPremium: profiles.isPremium,
        settings: profiles.oracleSkillSettings,
        gems: profiles.chitinGems,
        credits: profiles.moltCredits,
      })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1),
    db.select({ skillId: oracleSkillUnlocks.skillId }).from(oracleSkillUnlocks).where(eq(oracleSkillUnlocks.userId, userId)),
  ])
  const row = profileRows[0]
  return {
    member: {
      role: row?.role ?? null,
      isPremium: row?.isPremium === true,
      settings: row?.settings ?? {},
      unlocked: new Set(unlockRows.map((u) => u.skillId)),
    } satisfies MemberSkillProfile,
    gems: Math.max(0, Number(row?.gems ?? 0)),
    credits: Math.max(0, Number(row?.credits ?? 0)),
  }
}

export async function getOracleSkills(db: Db, userId: string): Promise<OracleSkillsPayload> {
  const { member, gems, credits } = await loadMemberSkillProfile(db, userId)
  return {
    skills: buildSkillCards(member),
    autoPick: autoPickOn(member.settings),
    isPremium: member.isPremium,
    gems,
    credits,
  }
}

export function getGuestOracleSkills(): OracleSkillsPayload {
  return { skills: buildSkillCards(null), autoPick: true, guest: true, isPremium: false, gems: 0, credits: 0 }
}

/**
 * The skills one chat reply may use. A picked skill must be one the member can use;
 * anything else is ignored rather than refused, so the chat never fails over a skill.
 */
export async function resolveOracleSkillPlan(userId: string, pickedSkillId?: string | null): Promise<OracleSkillPlan> {
  try {
    const { member } = await loadMemberSkillProfile(getDb(), userId)
    const usable = ORACLE_SKILLS.filter((skill) => skillAccess(skill, member) !== null)
    const picked = pickedSkillId ? usable.find((skill) => skill.id === pickedSkillId) : undefined
    if (picked) return { picked, discoverable: [] }
    if (!autoPickOn(member.settings)) return { discoverable: [] }
    return { discoverable: usable.filter((skill) => !skillSwitchedOff(member.settings, skill.id)) }
  } catch (err) {
    console.warn('[oracle-skills] Could not load skills for chat:', err)
    return { discoverable: [] }
  }
}
