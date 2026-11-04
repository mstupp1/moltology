import { randomUUID } from 'node:crypto'
import { neonConfig } from '@neondatabase/serverless'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq, inArray, sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { memberReferrals, profiles, referralRewards, routineCompletions, xpTransactions } from '../../db/schema'
import { resolveIntegrationDatabaseUrl } from '../../../scripts/lib/integration-database'
import { captureSignupReferral, getReferralSummaryHandler, handleInvitation, qualifyReferral } from './referrals'

const db = getDb()
neonConfig.disableWarningInBrowsers = true
const sponsor = randomUUID(), otherSponsor = randomUUID()
const members = Array.from({ length: 9 }, () => randomUUID())
const ids = [sponsor, otherSponsor, ...members]
const request = (id: string) => new Request('https://moltology.org/api/auth/sign-up/email', {
  headers: { cookie: `moltology_inviter=${id}` },
})

describe.skipIf(process.env.RUN_REFERRAL_INTEGRATION !== '1')('referrals on explicit development database', () => {
  beforeAll(async () => {
    expect(resolveIntegrationDatabaseUrl(process.env)).toBe(process.env.DATABASE_URL)
    await db.insert(profiles).values(ids.map((id) => ({
      id, handle: `ref_${id.slice(0, 8)}`, avatarConfig: { style: 'critters', seed: id },
    })))
  })
  afterAll(async () => { await db.delete(profiles).where(inArray(profiles.id, ids)) })

  it('sets a private invitation cookie and returns to the inviter profile', async () => {
    const response = await handleInvitation(new Request(`https://moltology.org/i/${sponsor}`), sponsor)
    expect(response.status).toBe(302)
    expect(response.headers.get('Set-Cookie')).toContain(`moltology_inviter=${sponsor}`)
    expect(response.headers.get('Set-Cookie')).toContain('HttpOnly; SameSite=Lax')
    expect(response.headers.get('Set-Cookie')).toContain('Secure')
    expect(new URL(response.headers.get('Location')!, 'https://moltology.org').searchParams.get('redirect')).toBe(`/member/${sponsor}`)
    expect((await handleInvitation(new Request('https://moltology.org'), randomUUID())).status).toBe(404)
  })

  it('fixes attribution once, ignores self/invalid referrals, and grants no click/signup XP', async () => {
    await Promise.all(members.map((id) => captureSignupReferral(id, request(sponsor))))
    await captureSignupReferral(members[0], request(otherSponsor))
    await captureSignupReferral(sponsor, request(sponsor))
    await captureSignupReferral(otherSponsor, request(randomUUID()))
    const rows = await db.select().from(memberReferrals).where(eq(memberReferrals.referrerId, sponsor))
    expect(rows).toHaveLength(members.length)
    expect(await db.select().from(xpTransactions).where(eq(xpTransactions.userId, sponsor))).toHaveLength(0)
    expect((await db.select().from(profiles).where(eq(profiles.id, members[0])))[0].referredByUserId).toBe(sponsor)
  })

  it('requires a username, character and liturgy, in either order', async () => {
    await qualifyReferral(db, members[0])
    expect((await db.select().from(memberReferrals).where(eq(memberReferrals.referredUserId, members[0])))[0].qualifiedAt).toBeNull()
    await db.insert(routineCompletions).values(members.slice(0, 8).map((id) => ({ userId: id, taskKey: 'silent-synchronization', completedOn: '2026-11-03' })))
    await db.update(profiles).set({ handle: null }).where(eq(profiles.id, members[0]))
    await qualifyReferral(db, members[0])
    expect((await db.select().from(memberReferrals).where(eq(memberReferrals.referredUserId, members[0])))[0].qualifiedAt).toBeNull()
    await db.update(profiles).set({ handle: `ref_${members[0].slice(0, 8)}`, avatarConfig: null }).where(eq(profiles.id, members[0]))
    await qualifyReferral(db, members[0])
    expect((await db.select().from(memberReferrals).where(eq(memberReferrals.referredUserId, members[0])))[0].qualifiedAt).toBeNull()
    await db.update(profiles).set({ avatarConfig: { style: 'critters', seed: 'created' } }).where(eq(profiles.id, members[0]))
  })

  it('enforces five awards under concurrent activations and duplicate retries', async () => {
    await Promise.all(members.slice(0, 8).map((id) => qualifyReferral(db, id)))
    await Promise.all(members.slice(0, 8).map((id) => qualifyReferral(db, id)))
    expect(await db.select().from(referralRewards).where(eq(referralRewards.referrerId, sponsor))).toHaveLength(5)
    const ledger = await db.select().from(xpTransactions).where(eq(xpTransactions.userId, sponsor))
    expect(ledger).toHaveLength(5)
    expect(ledger.reduce((sum, row) => sum + row.amount, 0)).toBe(500)
    expect((await db.select().from(profiles).where(eq(profiles.id, sponsor)))[0].xp).toBe(500)
    const summary = await getReferralSummaryHandler({ data: {}, context: { user: { sub: sponsor }, db } })
    expect(summary.totalXp).toBe(500)
    expect(summary.rewardedThisMonth).toBe(5)
    expect(summary.referrals.filter((row) => row.status === 'pending')).toHaveLength(1)
    expect(summary.referrals.filter((row) => row.status === 'cap_reached')).toHaveLength(3)
    expect(summary.referrals.filter((row) => row.status === 'rewarded')).toHaveLength(5)
  })

  it('does not free a monthly slot when a referred account is deleted', async () => {
    const [rewarded] = await db.select({ memberId: memberReferrals.referredUserId }).from(memberReferrals)
      .innerJoin(referralRewards, eq(referralRewards.referralId, memberReferrals.id))
      .where(eq(memberReferrals.referrerId, sponsor)).limit(1)
    await db.delete(profiles).where(eq(profiles.id, rewarded.memberId!))
    expect(await db.select().from(referralRewards).where(eq(referralRewards.referrerId, sponsor))).toHaveLength(5)
    const summary = await getReferralSummaryHandler({ data: {}, context: { user: { sub: sponsor }, db } })
    expect(summary.referrals.some((row) => row.displayName === 'Deleted member' && row.status === 'rewarded')).toBe(true)
  })

  it('rejects unauthenticated referral summaries', async () => {
    await expect(getReferralSummaryHandler({ data: {}, context: {} })).rejects.toThrow('Unauthenticated')
  })

  it('preserves legacy XP and stage when a referral is the first ledger award', async () => {
    const newcomer = randomUUID()
    ids.push(newcomer)
    await db.insert(profiles).values({ id: newcomer, handle: `ref_${newcomer.slice(0, 8)}`, avatarConfig: { style: 'critters', seed: 'newcomer' } })
    await db.update(profiles).set({ xp: 2000, stage: 2 }).where(eq(profiles.id, otherSponsor))
    await captureSignupReferral(newcomer, request(otherSponsor))
    await db.insert(routineCompletions).values({ userId: newcomer, taskKey: 'silent-synchronization', completedOn: '2026-11-03' })
    await qualifyReferral(db, newcomer)
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, otherSponsor))
    expect(profile.xp).toBe(2100)
    expect(profile.stage).toBe(2)
  })
}, 60000)
