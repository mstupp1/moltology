import { eq, sql } from 'drizzle-orm'
import type { getDb } from '../../db'
import { oracleSkillUnlocks, profiles } from '../../db/schema'
import { ORACLE_SKILL_IDS, getOracleSkill } from '../ai/oracle-skills-catalog'
import { nextSkillSettings, type BuyOracleSkillResult, type OracleSkillSettings } from '../oracle-skills'
import { isAdmin } from '../permissions'
import { balanceRefresh } from './gems'
import { creditBalanceRefresh } from './molt-credits'
import { getGuestOracleSkills, getOracleSkills, loadMemberSkillProfile, skillAccess } from './oracle-skill-access'
import { resolveWriteAuth, type WriteAuthContext } from './write-auth'

type Db = ReturnType<typeof getDb>

/**
 * Charges gems (then credits for any shortfall) and unlocks the skill in one batch, the same
 * way gear is bought. The profile row lock comes first, so two tabs can't overspend.
 */
export async function buySkill(db: Db, userId: string, skillId: string): Promise<BuyOracleSkillResult> {
  const { member, gems, credits } = await loadMemberSkillProfile(db, userId)
  const skill = getOracleSkill(skillId)
  if (!skill) return { ok: false, gems, credits, error: 'That skill is not in the market.' }
  if (skillAccess(skill, member) === 'starter' || member.unlocked.has(skill.id)) {
    return { ok: false, gems, credits, error: 'You already own this skill.' }
  }
  if (isAdmin(null, member.role)) {
    await db.insert(oracleSkillUnlocks).values({ userId, skillId: skill.id, source: 'admin' }).onConflictDoNothing()
    return { ok: true, gems, credits }
  }

  const price = skill.price
  const key = `skill:${skill.id}`
  const label = `Bought the ${skill.name} skill`
  const [lock, gemUpdate] = balanceRefresh(db, userId)
  const [, creditUpdate] = creditBalanceRefresh(db, userId)
  const gemSum = sql`(SELECT COALESCE(SUM(amount), 0) FROM gem_transactions WHERE "userId" = ${userId})`
  const creditSum = sql`(SELECT COALESCE(SUM(amount), 0) FROM credit_transactions WHERE "userId" = ${userId})`
  const notOwned = sql`NOT EXISTS (SELECT 1 FROM oracle_skill_unlocks WHERE "userId" = ${userId} AND "skillId" = ${skill.id})`
  const gemsPaid = sql`COALESCE((SELECT -amount FROM gem_transactions WHERE "userId" = ${userId} AND "sourceKey" = ${key}), 0)`
  const creditsPaid = sql`COALESCE((SELECT -amount FROM credit_transactions WHERE "userId" = ${userId} AND "sourceKey" = ${key}), 0)`
  // Gems pay first; credits cover whatever is left. Each statement after the lock reads fresh sums.
  await db.batch([
    lock,
    db.execute(sql`INSERT INTO gem_transactions ("userId", amount, source, "sourceKey", description)
      SELECT ${userId}, -LEAST(${gemSum}, ${price}), 'purchase', ${key}, ${label}
      WHERE ${notOwned} AND ${gemSum} > 0 AND ${gemSum} + GREATEST(${creditSum}, 0) >= ${price}
      ON CONFLICT DO NOTHING`),
    db.execute(sql`INSERT INTO credit_transactions ("userId", amount, source, "sourceKey", description)
      SELECT ${userId}, -(${price} - ${gemsPaid}), 'purchase', ${key}, ${label}
      WHERE ${notOwned} AND ${price} - ${gemsPaid} > 0 AND ${creditSum} >= ${price} - ${gemsPaid}
      ON CONFLICT DO NOTHING`),
    db.execute(sql`INSERT INTO oracle_skill_unlocks ("userId", "skillId", source)
      SELECT ${userId}, ${skill.id}, 'purchase'
      WHERE ${gemsPaid} + ${creditsPaid} >= ${price}
      ON CONFLICT DO NOTHING`),
    gemUpdate,
    creditUpdate,
  ])
  const [after] = await db
    .select({
      gems: profiles.chitinGems,
      credits: profiles.moltCredits,
      unlocked: sql<boolean>`EXISTS (SELECT 1 FROM oracle_skill_unlocks WHERE "userId" = ${userId} AND "skillId" = ${skill.id})`,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)
  const gemsAfter = Math.max(0, Number(after?.gems ?? 0))
  const creditsAfter = Math.max(0, Number(after?.credits ?? 0))
  if (after?.unlocked) return { ok: true, gems: gemsAfter, credits: creditsAfter }
  return {
    ok: false,
    gems: gemsAfter,
    credits: creditsAfter,
    error: `You need ${price - gemsAfter - creditsAfter} more gems for this skill.`,
  }
}

export async function setSkillSettings(
  db: Db,
  userId: string,
  change: { autoPick?: boolean; skillId?: string; enabled?: boolean },
): Promise<OracleSkillSettings> {
  const [row] = await db
    .select({ settings: profiles.oracleSkillSettings })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)
  const next = nextSkillSettings(row?.settings, change, ORACLE_SKILL_IDS)
  await db.update(profiles).set({ oracleSkillSettings: next }).where(eq(profiles.id, userId))
  return next
}

export async function getOracleSkillsHandler(args: { data?: { token?: string }; context?: WriteAuthContext }) {
  const auth = await resolveWriteAuth({ ...args, requireAuth: false })
  if (!auth) return getGuestOracleSkills()
  return getOracleSkills(auth.dbClient, auth.userId)
}

export async function buyOracleSkillHandler(args: {
  data?: { token?: string; skillId: string }
  context?: WriteAuthContext
}) {
  const auth = await resolveWriteAuth(args)
  if (!auth) throw new Error('Authentication required.')
  if (!args.data?.skillId) throw new Error('Pick a skill to buy.')
  return buySkill(auth.dbClient, auth.userId, args.data.skillId)
}

export async function setOracleSkillSettingsHandler(args: {
  data?: { token?: string; autoPick?: boolean; skillId?: string; enabled?: boolean }
  context?: WriteAuthContext
}) {
  const auth = await resolveWriteAuth(args)
  if (!auth) throw new Error('Authentication required.')
  const { autoPick, skillId, enabled } = args.data ?? {}
  return setSkillSettings(auth.dbClient, auth.userId, { autoPick, skillId, enabled })
}
