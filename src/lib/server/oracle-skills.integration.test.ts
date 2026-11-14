import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { gemTransactions, oracleSkillUnlocks, profiles } from '../../db/schema'
import { resolveIntegrationDatabaseUrl } from '../../../scripts/lib/integration-database'
import { awardGems } from './gems'
import { resolveOracleSkillPlan } from './oracle-skill-access'
import { buyOracleSkillHandler, getOracleSkillsHandler, setOracleSkillSettingsHandler } from './oracle-skills'

const db = getDb()
const member = `skills-test-${randomUUID()}`
const suite = describe.skipIf(process.env.RUN_ORACLE_SKILLS_INTEGRATION !== '1')

suite('Oracle skills on explicit Neon dev', () => {
  const context = { user: { sub: member }, db }
  beforeAll(async () => {
    if (resolveIntegrationDatabaseUrl(process.env) !== process.env.DATABASE_URL) throw new Error('Expected explicit dev target.')
    await db.insert(profiles).values({ id: member })
    await awardGems(db, member, [{ amount: 100, source: 'admin', sourceKey: 'test:grant', description: 'Test grant' }])
  })
  afterAll(async () => {
    await db.delete(profiles).where(eq(profiles.id, member))
  })

  it('starts with the four free starters', async () => {
    const payload = await getOracleSkillsHandler({ data: {}, context })
    expect(payload.skills.filter((s) => s.access).map((s) => s.id).sort()).toEqual([
      'close-the-day',
      'focus-rounds',
      'one-thing-first',
      'two-minute-start',
    ])
    expect(payload.gems).toBe(100)
  })

  it('charges once under concurrent buys and refuses what the member cannot afford', async () => {
    const results = await Promise.all([
      buyOracleSkillHandler({ data: { skillId: 'raise-the-dome' }, context }),
      buyOracleSkillHandler({ data: { skillId: 'raise-the-dome' }, context }),
    ])
    expect(results.some((r) => r.ok)).toBe(true)
    const charges = await db
      .select({ amount: gemTransactions.amount })
      .from(gemTransactions)
      .where(sql`${gemTransactions.userId} = ${member} AND ${gemTransactions.sourceKey} = 'skill:raise-the-dome'`)
    expect(charges).toEqual([{ amount: -60 }])
    const weekly = await buyOracleSkillHandler({ data: { skillId: 'weekly-review' }, context })
    expect(weekly).toMatchObject({ ok: false, gems: 40, error: 'You need 110 more gems for this skill.' })
    expect(await db.select().from(oracleSkillUnlocks).where(eq(oracleSkillUnlocks.userId, member))).toHaveLength(1)
  })

  it('feeds owned, switched-on skills to the chat and respects auto-pick', async () => {
    const plan = await resolveOracleSkillPlan(member)
    expect(plan.discoverable.map((s) => s.id)).toContain('raise-the-dome')
    expect((await resolveOracleSkillPlan(member, 'weekly-review')).picked).toBeUndefined()
    expect((await resolveOracleSkillPlan(member, 'raise-the-dome')).picked?.id).toBe('raise-the-dome')

    await setOracleSkillSettingsHandler({ data: { skillId: 'raise-the-dome', enabled: false }, context })
    expect((await resolveOracleSkillPlan(member)).discoverable.map((s) => s.id)).not.toContain('raise-the-dome')
    await setOracleSkillSettingsHandler({ data: { autoPick: false }, context })
    expect((await resolveOracleSkillPlan(member)).discoverable).toEqual([])
    const payload = await getOracleSkillsHandler({ data: {}, context })
    expect(payload.autoPick).toBe(false)
    expect(payload.skills.find((s) => s.id === 'raise-the-dome')).toMatchObject({ access: 'owned', enabled: false })
  })
})
