import { createRequire } from 'node:module'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { requireMerchDevDatabase } from '../../../scripts/merch/database'

const runIntegration = process.env.RUN_ORACLE_QUOTA_INTEGRATION === '1'
if (runIntegration) {
  const require = createRequire(resolve(process.cwd(), 'package.json'))
  const dotenv = require('dotenv') as { parse: (input: string) => Record<string, string> }
  const envFile = process.env.ORACLE_QUOTA_ENV_FILE || resolve(process.cwd(), '.env')
  const env = dotenv.parse(readFileSync(envFile, 'utf8'))
  process.env.DEV_DATABASE_URL ||= env.DEV_DATABASE_URL
  process.env.PROD_DATABASE_URL ||= env.PROD_DATABASE_URL
  process.env.DATABASE_URL ||= process.env.DEV_DATABASE_URL
}

const fixtureIds = [randomUUID(), randomUUID(), randomUUID(), randomUUID()]
const suite = describe.skipIf(!runIntegration)

suite('atomic Oracle usage reservation on Neon dev', () => {
  let client: any
  let reserveOracleChatUsage: typeof import('./service').reserveOracleChatUsage
  let releaseOracleChatUsage: typeof import('./service').releaseOracleChatUsage

  beforeAll(async () => {
    const selectedDatabaseUrl = requireMerchDevDatabase(process.env)
    if (selectedDatabaseUrl !== process.env.DEV_DATABASE_URL || selectedDatabaseUrl !== process.env.DATABASE_URL) {
      throw new Error('Oracle quota integration must target the explicitly configured dev database.')
    }
    const { getDb } = await import('../../db')
    const service = await import('./service')
    client = getDb().$client
    reserveOracleChatUsage = service.reserveOracleChatUsage
    releaseOracleChatUsage = service.releaseOracleChatUsage
  })

  it('admits one concurrent caller at free and Premium limits, releases usage, and initializes a missing profile', async () => {
    const [freeId, premiumId, releaseId, firstChatId] = fixtureIds

    try {
      await client`INSERT INTO profiles (id, "isPremium") VALUES (${freeId}, false)`
      await client`
        INSERT INTO ai_usage_events ("userId", kind, "createdAt")
        SELECT ${freeId}, 'chat', now() - interval '30 seconds'
        FROM generate_series(1, 4)
      `
      const freeResults = await Promise.all([
        reserveOracleChatUsage(freeId),
        reserveOracleChatUsage(freeId),
      ])
      expect(freeResults.filter((result) => result.allowed)).toHaveLength(1)
      const [freeCount] = await client`
        SELECT count(*)::integer AS count FROM ai_usage_events
        WHERE "userId" = ${freeId} AND kind = 'chat'
      `
      expect(Number(freeCount.count)).toBe(5)

      await client`INSERT INTO profiles (id, "isPremium") VALUES (${premiumId}, true)`
      await client`
        INSERT INTO ai_usage_events ("userId", kind, "createdAt")
        SELECT ${premiumId}, 'chat', now() - interval '30 seconds'
        FROM generate_series(1, 49)
      `
      const premiumResults = await Promise.all([
        reserveOracleChatUsage(premiumId),
        reserveOracleChatUsage(premiumId),
      ])
      expect(premiumResults.filter((result) => result.allowed)).toHaveLength(1)
      const [premiumCount] = await client`
        SELECT count(*)::integer AS count FROM ai_usage_events
        WHERE "userId" = ${premiumId} AND kind = 'chat'
      `
      expect(Number(premiumCount.count)).toBe(50)

      await client`INSERT INTO profiles (id, "isPremium") VALUES (${releaseId}, false)`
      const releaseResult = await reserveOracleChatUsage(releaseId)
      expect(releaseResult.allowed).toBe(true)
      if (!releaseResult.allowed) throw new Error('Ordinary control reservation was unexpectedly denied.')
      await releaseOracleChatUsage(releaseResult.id)
      const [releasedCount] = await client`
        SELECT count(*)::integer AS count FROM ai_usage_events
        WHERE "userId" = ${releaseId} AND kind = 'chat'
      `
      expect(Number(releasedCount.count)).toBe(0)

      const firstChatResult = await reserveOracleChatUsage(firstChatId)
      expect(firstChatResult.allowed).toBe(true)
      if (firstChatResult.allowed) await releaseOracleChatUsage(firstChatResult.id)
      const [createdProfile] = await client`SELECT id FROM profiles WHERE id = ${firstChatId}`
      expect(createdProfile?.id).toBe(firstChatId)
    } finally {
      await client`DELETE FROM ai_usage_events WHERE "userId" = ANY(${fixtureIds})`
      await client`DELETE FROM profiles WHERE id = ANY(${fixtureIds})`
    }
  })
})
