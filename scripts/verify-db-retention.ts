import 'dotenv/config'
import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { neon } from '@neondatabase/serverless'
import { applyCleanup, countCleanupCandidates, type RetentionQuery } from './lib/db-retention-cleanup'
import { applyCompletionRetention } from './lib/db-retention-completions'
import { applyUsageRetention } from './lib/db-retention-usage'
import { CANONICAL_ALIGNMENT_TASKS, computeStreakWithCarry, shiftDays } from '../src/lib/alignment-tasks'
import { CHAT_LIMIT, createChatThreadWithinLimit } from '../src/lib/ai/chat-retention'
import { applyChatRetention, countChatRetentionCandidates } from './lib/db-retention-chats'

// Explicitly opt-in: these checks create and remove only their own fixture schema.
// Cloning the migrated tables catches PostgreSQL syntax/type errors that mocks cannot.
async function main() {
  if (process.argv.slice(2).join(' ') !== '--target=dev') {
    throw new Error('Verification requires --target=dev; production is not supported.')
  }
  const url = process.env.DEV_DATABASE_URL
  if (!url) throw new Error('DEV_DATABASE_URL is required.')
  const endpoint = (value: string) => new URL(value).hostname.replace('-pooler.', '.')
  if (process.env.PROD_DATABASE_URL && endpoint(url) === endpoint(process.env.PROD_DATABASE_URL)) {
    throw new Error('Development and production endpoints must differ.')
  }
  const query = neon(url)
  const namespace = `retention_check_${Date.now()}_${randomBytes(4).toString('hex')}`
  const tables = [
    'profiles', 'activity_events', 'notifications', 'friend_requests', 'friendships',
    'routine_completions', 'routine_day_summaries', 'routine_streak_carries', 'ai_usage_events', 'ai_usage_daily_summaries',
    'ai_threads', 'ai_messages',
  ]
  const tablePattern = new RegExp(`\\b(${tables.join('|')})\\b`, 'g')
  const isolated: RetentionQuery = (strings, ...values) => {
    const statement = strings.reduce((sql, part, index) => sql + (index ? `$${index}` : '') + part, '')
    assert(!/\bpublic\s*\./i.test(statement), 'Fixture queries must not access public tables')
    const rewritten = statement.replace(tablePattern, (_, table: string) => `"${namespace}"."${table}"`)
    return query(rewritten, values) as Promise<Array<Record<string, unknown>>>
  }
  const count = async (table: string) => {
    assert(tables.includes(table))
    const [row] = await query(`SELECT count(*)::int AS count FROM "${namespace}"."${table}"`)
    return row.count as number
  }
  const asOf = new Date('2026-10-15T12:00:00.000Z')
  console.log(`[retention-verify] isolated fixtures on dev endpoint=${endpoint(url)} schema=${namespace}`)
  await query(`CREATE SCHEMA "${namespace}"`)
  try {
    for (const table of tables) {
      await query(`CREATE TABLE "${namespace}"."${table}" (LIKE public."${table}" INCLUDING ALL)`)
    }
    // LIKE copies indexes/defaults but not foreign keys; test the real cascade
    // explicitly against the isolated parent, never against public data.
    await isolated`ALTER TABLE ai_messages ADD FOREIGN KEY ("threadId") REFERENCES ai_threads(id) ON DELETE CASCADE`
    await isolated`INSERT INTO profiles (id) VALUES ('a'), ('b'), ('c'), ('d')`
    await isolated`
      INSERT INTO activity_events ("userId", kind, title, detail, "sourceKey", "createdAt")
      VALUES ('a', 'routine_completed', 'Old', 'Fixture', 'old', '2026-08-01'),
             ('a', 'routine_completed', 'Recent', 'Fixture', 'recent', '2026-10-15')
    `
    const requests = [
      ['00000000-0000-4000-8000-000000000001', 'a', 'b', 'accepted'],
      ['00000000-0000-4000-8000-000000000002', 'a', 'c', 'rejected'],
      ['00000000-0000-4000-8000-000000000003', 'c', 'd', 'accepted'],
      ['00000000-0000-4000-8000-000000000004', 'b', 'c', 'pending'],
    ]
    for (const [id, sender, recipient, status] of requests) {
      await isolated`
        INSERT INTO friend_requests (id, "senderId", "recipientId", status, "createdAt", "respondedAt")
        VALUES (${id}, ${sender}, ${recipient}, ${status}, '2026-01-01', '2026-01-02')
      `
      await isolated`
        INSERT INTO notifications ("userId", kind, title, detail, "sourceKey", payload, "createdAt")
        VALUES (${recipient}, 'friend_request', 'Request', 'Fixture', ${`friend_request:${id}`},
                ${JSON.stringify({ requestId: id })}::jsonb, '2026-01-01')
      `
    }
    await isolated`INSERT INTO friendships ("userAId", "userBId") VALUES ('a', 'b')`
    await isolated`
      INSERT INTO notifications ("userId", kind, title, detail, "sourceKey", "createdAt")
      VALUES ('a', 'friend_accepted', 'Accepted', 'Fixture', 'keep-confirmation', '2026-09-01')
    `
    const preview = await countCleanupCandidates(isolated, asOf, 'lean')
    assert.equal(preview.closedFriendRequests, 2, 'Accepted requests without friendships must survive')
    assert.equal(preview.activityEvents, 1)
    const cleaned = await applyCleanup(isolated, asOf, 'lean')
    assert.equal(cleaned.closedFriendRequests, 2)
    assert.equal(await count('friend_requests'), 2)
    assert.equal(await count('activity_events'), 1)
    const [pendingAlert] = await isolated`
      SELECT count(*)::int AS count FROM notifications
      WHERE payload->>'requestId' = '00000000-0000-4000-8000-000000000004'
    `
    assert.equal(pendingAlert.count, 1, 'Pending request alert must survive its ordinary TTL')
    const [confirmation] = await isolated`SELECT count(*)::int AS count FROM notifications WHERE "sourceKey"='keep-confirmation'`
    assert.equal(confirmation.count, 1, 'Non-actionable confirmation keeps its own retention window')
    assert.equal((await applyCleanup(isolated, asOf, 'lean')).closedFriendRequests, 0)

    await isolated`
      INSERT INTO routine_day_summaries ("userId", "completedOn", "taskKeys")
      VALUES ('a', '2026-08-01', ARRAY['first'])
    `
    await isolated`
      INSERT INTO routine_completions ("userId", "completedOn", "taskKey")
      VALUES ('a', '2026-08-01', 'second'), ('a', '2026-08-01', 'first'),
             ('a', '2026-10-15', 'today'), ('a', '2025-01-01', 'expired')
    `
    const completions = await applyCompletionRetention(isolated, asOf, 'lean')
    assert.equal(completions.rawRowsToSummarize, 2)
    assert.equal(completions.rawRowsToExpire, 1)
    assert.equal(await count('routine_completions'), 1)
    let [summary] = await isolated`SELECT "taskKeys" FROM routine_day_summaries WHERE "completedOn"='2026-08-01'`
    assert.deepEqual(summary.taskKeys, ['first', 'second'])
    await isolated`INSERT INTO routine_completions ("userId", "completedOn", "taskKey") VALUES ('a', '2026-08-01', 'late')`
    await applyCompletionRetention(isolated, asOf, 'lean')
    ;[summary] = await isolated`SELECT "taskKeys" FROM routine_day_summaries WHERE "completedOn"='2026-08-01'`
    assert.deepEqual(summary.taskKeys, ['first', 'late', 'second'], 'Late completion must merge with earlier keys')
    assert.equal((await applyCompletionRetention(isolated, asOf, 'lean')).rawRowsToSummarize, 0)

    // More than 90 complete days must preserve the long streak while old task
    // identities disappear. A missing day must reset the carried prefix.
    const streakFixtures: Array<{ userId: string; completedOn: string; taskKey: string }> = []
    for (let daysAgo = 180; daysAgo >= 0; daysAgo--) {
      const completedOn = shiftDays('2026-10-15', -daysAgo)
      for (const task of CANONICAL_ALIGNMENT_TASKS) {
        streakFixtures.push({ userId: 'b', completedOn, taskKey: task.key })
        if (daysAgo !== 100) streakFixtures.push({ userId: 'c', completedOn, taskKey: task.key })
      }
    }
    await isolated`
      INSERT INTO routine_completions ("userId", "completedOn", "taskKey")
      SELECT "userId", "completedOn", "taskKey"
      FROM jsonb_to_recordset(${JSON.stringify(streakFixtures)}::jsonb)
        AS fixture("userId" text, "completedOn" text, "taskKey" text)
    `
    await applyCompletionRetention(isolated, asOf, 'lean')
    for (const [userId, expectedStreak] of [['b', 181], ['c', 100]] as const) {
      const [carry] = await isolated`SELECT "anchorDate", "streakDays" FROM routine_streak_carries WHERE "userId"=${userId}`
      assert.equal(carry.anchorDate, '2026-07-16')
      const keys = await isolated`
        SELECT "completedOn", "taskKey" FROM routine_completions WHERE "userId"=${userId}
        UNION
        SELECT "completedOn", unnest("taskKeys") AS "taskKey" FROM routine_day_summaries WHERE "userId"=${userId}
      `
      assert(keys.every((row) => String(row.completedOn) >= '2026-07-17'), 'Only 90 days plus one timezone boundary date remain')
      const history = Array.from({ length: 91 }, (_, index) => {
        const date = shiftDays('2026-10-15', index - 90)
        return { date, completedCount: keys.filter((row) => row.completedOn === date).length }
      })
      assert.equal(computeStreakWithCarry(history, '2026-10-15', {
        anchorDate: String(carry.anchorDate), streakDays: Number(carry.streakDays),
      }), expectedStreak)
    }
    const carryBeforeRetry = await isolated`SELECT "userId", "anchorDate", "streakDays" FROM routine_streak_carries ORDER BY "userId"`
    await applyCompletionRetention(isolated, asOf, 'lean')
    const carryAfterRetry = await isolated`SELECT "userId", "anchorDate", "streakDays" FROM routine_streak_carries ORDER BY "userId"`
    assert.deepEqual(carryAfterRetry, carryBeforeRetry, 'A retry must not extend or reset an existing carry')

    // UTC has advanced while an American member is still on the previous date.
    // The internal boundary day must keep their earliest visible day available.
    await applyCompletionRetention(isolated, new Date('2026-10-16T00:30:00Z'), 'lean')
    const [timezoneCarry] = await isolated`SELECT "anchorDate", "streakDays" FROM routine_streak_carries WHERE "userId"='b'`
    assert.equal(timezoneCarry.anchorDate, '2026-07-17')
    const timezoneKeys = await isolated`
      SELECT "completedOn", "taskKey" FROM routine_completions WHERE "userId"='b'
      UNION
      SELECT "completedOn", unnest("taskKeys") AS "taskKey" FROM routine_day_summaries WHERE "userId"='b'
    `
    const localHistory = Array.from({ length: 90 }, (_, index) => {
      const date = shiftDays('2026-10-15', index - 89)
      return { date, completedCount: timezoneKeys.filter((row) => row.completedOn === date).length }
    })
    assert.equal(localHistory[0].completedCount, CANONICAL_ALIGNMENT_TASKS.length)
    assert.equal(computeStreakWithCarry(localHistory, '2026-10-15', {
      anchorDate: String(timezoneCarry.anchorDate), streakDays: Number(timezoneCarry.streakDays),
    }), 181)

    await isolated`
      INSERT INTO ai_usage_events ("userId", kind, model, "inputTokens", "outputTokens", "createdAt")
      VALUES ('a', 'chat', NULL, 10, NULL, '2026-08-01 23:59:00'),
             ('a', 'chat', NULL, NULL, 5, '2026-08-01 23:59:00'),
             ('a', 'chat', 'recent', 1, 1, '2026-10-15 11:59:00')
    `
    const usage = await applyUsageRetention(isolated, asOf, 'lean')
    assert.equal(usage.compactedEvents, 2)
    assert.equal(await count('ai_usage_events'), 1, 'Usage-limit records inside the last day must survive')
    let [daily] = await isolated`SELECT * FROM ai_usage_daily_summaries WHERE model=''`
    assert.equal(daily.date, '2026-08-01')
    assert.equal(daily.requestCount, 2)
    assert.equal(Number(daily.inputTokens), 10)
    assert.equal(Number(daily.outputTokens), 5)
    assert.equal(daily.missingInputTokenCount, 1)
    assert.equal(daily.missingOutputTokenCount, 1)
    assert.equal((await applyUsageRetention(isolated, asOf, 'lean')).compactedEvents, 0)
    await isolated`
      INSERT INTO ai_usage_events ("userId", kind, "inputTokens", "outputTokens", "createdAt")
      VALUES ('a', 'chat', 3, 4, '2026-08-01 23:59:00')
    `
    await applyUsageRetention(isolated, asOf, 'lean')
    ;[daily] = await isolated`SELECT * FROM ai_usage_daily_summaries WHERE model=''`
    assert.equal(daily.requestCount, 3)
    assert.equal(Number(daily.inputTokens), 13)
    assert.equal(Number(daily.outputTokens), 9)

    // The final free conversation slot must be shared safely across simultaneous
    // server requests, including the archived conversations in the count.
    await isolated`
      INSERT INTO ai_threads ("userId", title)
      SELECT 'd', 'Fixture ' || n FROM generate_series(1, ${CHAT_LIMIT - 1}) AS n
    `
    await isolated`
      UPDATE ai_threads SET "archivedAt"='2026-10-10'
      WHERE id=(SELECT id FROM ai_threads WHERE "userId"='d' LIMIT 1)
    `
    const capClient = Object.assign(isolated, { transaction: query.transaction.bind(query) }) as unknown as typeof query
    const candidates = await Promise.all([randomUUID(), randomUUID()].map((id) =>
      createChatThreadWithinLimit(capClient, { id, userId: 'd', title: 'Last slot', persona: 'oracle' }),
    ))
    const created = candidates.filter((candidate) => candidate?.created)
    assert.equal(created.length, 1, 'Two concurrent requests must not both take the final slot')
    assert.equal(candidates.filter((candidate) => candidate === null).length, 1)
    const [threadCount] = await isolated`SELECT count(*)::int AS count FROM ai_threads WHERE "userId"='d'`
    assert.equal(threadCount.count, CHAT_LIMIT)
    const createdId = created[0]!.thread.id
    const replay = await createChatThreadWithinLimit(capClient, { id: createdId, userId: 'd', title: 'Replay', persona: 'oracle' })
    assert.equal(replay?.created, false, 'Replaying an existing id at the cap must reuse that conversation')
    await isolated`DELETE FROM ai_threads WHERE id=${createdId}`
    assert.equal((await createChatThreadWithinLimit(capClient, {
      userId: 'd', title: 'Freed slot', persona: 'oracle',
    }))?.created, true)

    const chatCases = [
      { id: randomUUID(), archivedAt: '2026-09-01T00:00:00Z', pinnedAt: '2026-08-01T00:00:00Z' },
      { id: randomUUID(), archivedAt: '2026-09-15T12:00:00Z', pinnedAt: null },
      { id: randomUUID(), archivedAt: '2026-10-14T00:00:00Z', pinnedAt: null },
      { id: randomUUID(), archivedAt: null, pinnedAt: '2026-08-01T00:00:00Z' },
    ]
    for (const chat of chatCases) {
      await isolated`
        INSERT INTO ai_threads (id, "userId", title, "archivedAt", "pinnedAt", "createdAt")
        VALUES (${chat.id}, 'a', 'Retention fixture', ${chat.archivedAt}, ${chat.pinnedAt}, '2025-01-01')
      `
      await isolated`
        INSERT INTO ai_messages ("threadId", "userId", role, content)
        VALUES (${chat.id}, 'a', 'user', 'Fixture content')
      `
    }
    assert.equal(await countChatRetentionCandidates(isolated, asOf), 2)
    const usageBeforeChatExpiry = await count('ai_usage_events')
    assert.equal((await applyChatRetention(isolated, asOf)).deletedThreads, 2)
    assert.equal(await count('ai_messages'), 2, 'Expired thread messages must cascade; active/recent archives must survive')
    assert.equal(await count('ai_usage_events'), usageBeforeChatExpiry, 'Chat expiry must not reset usage limits')
    assert.equal((await applyChatRetention(isolated, asOf)).deletedThreads, 0)

    const policies = await query`
      SELECT relname, relrowsecurity FROM pg_class
      WHERE relnamespace='public'::regnamespace
        AND relname IN ('routine_day_summaries', 'routine_streak_carries', 'ai_usage_daily_summaries')
    `
    assert.equal(policies.length, 3)
    assert(policies.every((row) => row.relrowsecurity), 'Summary-table RLS must be enabled')
    console.log('[retention-verify] PASS: request dependencies, 90-day history/timezone/streak carries, usage rollups, concurrent chat cap/replay, archive expiry/cascade, usage-limit preservation, and migrated RLS')
  } finally {
    await query(`DROP SCHEMA "${namespace}" CASCADE`)
    console.log('[retention-verify] isolated fixture schema removed')
  }
}

main().catch((error) => {
  console.error('[retention-verify] failed:', error)
  process.exitCode = 1
})
