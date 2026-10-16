import { describe, expect, it, vi } from 'vitest'
import {
  RETENTION_BATCH_SIZE,
  RETENTION_MAX_BATCHES,
  applyCleanup,
  countCleanupCandidates,
  getCleanupCutoffs,
  getTargetDatabaseHost,
  getTargetDatabaseUrl,
  parseCleanupArgs,
  type RetentionQuery,
} from './db-retention-cleanup'

function mockQuery(responses: Array<Array<Record<string, unknown>>> = []) {
  const calls: Array<{ sql: string; values: unknown[] }> = []
  const query = vi.fn(async (strings: TemplateStringsArray, ...values: unknown[]) => {
    calls.push({ sql: strings.join('?'), values })
    return responses.shift() ?? []
  }) as unknown as RetentionQuery
  return { query, calls }
}

describe('retention cleanup options', () => {
  it('requires an explicit target and defaults to a dry-run', () => {
    expect(parseCleanupArgs([], undefined)).toMatchObject({ ok: false })
    expect(parseCleanupArgs(['--target=dev'], undefined)).toMatchObject({
      ok: true,
      options: { target: 'dev', apply: false, profile: 'lean' },
    })
  })

  it('requires a backup reference or explicit PITR acknowledgment for production apply', () => {
    expect(parseCleanupArgs(['--target=prod', '--apply'], 'lenient')).toMatchObject({ ok: false })
    expect(parseCleanupArgs(['--target=prod', '--apply', '--backup-reference=weekly-snapshot-42'], 'lenient')).toMatchObject({
      ok: true,
      options: { target: 'prod', apply: true, profile: 'lenient', backupReference: 'weekly-snapshot-42' },
    })
    expect(parseCleanupArgs(['--target=prod', '--backup-reference=ref'])).toMatchObject({
      ok: true,
      options: { target: 'prod', apply: false },
    })
    expect(parseCleanupArgs(['--target=prod', '--apply', '--recovery=pitr'], 'lenient')).toMatchObject({
      ok: true,
      options: { target: 'prod', apply: true, profile: 'lenient', recovery: 'pitr' },
    })
    expect(parseCleanupArgs(['--target=prod', '--apply', '--recovery=latest'])).toMatchObject({ ok: false })
    expect(parseCleanupArgs(['--target=prod', '--apply', '--recovery='])).toMatchObject({ ok: false })
    expect(parseCleanupArgs(['--target=prod', '--apply', '--recovery=pitr', '--recovery=pitr'])).toMatchObject({ ok: false })
  })

  it('rejects unsupported arguments and invalid fixed cutoff dates', () => {
    expect(parseCleanupArgs(['--target=dev', '--oops'])).toMatchObject({ ok: false })
    expect(parseCleanupArgs(['--target=dev', '--as-of=not-a-date'])).toMatchObject({ ok: false })
    expect(parseCleanupArgs(['--target=dev', '--as-of=2999-01-01T00:00:00Z'])).toMatchObject({ ok: false })
    expect(parseCleanupArgs(['--target=dev', '--target=dev'])).toMatchObject({ ok: false })
    expect(parseCleanupArgs(['--target=dev'], 'lenient-ish')).toMatchObject({ ok: false })
  })

  it('selects only the explicitly named database URL', () => {
    const env = { DEV_DATABASE_URL: 'postgres://dev', PROD_DATABASE_URL: 'postgres://prod', DATABASE_URL: 'postgres://default' }
    expect(getTargetDatabaseUrl('dev', env)).toBe('postgres://dev')
    expect(getTargetDatabaseUrl('prod', env)).toBe('postgres://prod')
    expect(getTargetDatabaseUrl('dev', { DATABASE_URL: 'postgres://default' })).toBeUndefined()
    expect(getTargetDatabaseHost('postgres://user:secret@db.example:5432/app')).toBe('db.example:5432')
  })

  it('refuses a dev target that aliases the configured production endpoint', () => {
    expect(() => getTargetDatabaseUrl('dev', {
      DEV_DATABASE_URL: 'postgres://owner:dev@ep-example-pooler.region.neon.tech/db',
      PROD_DATABASE_URL: 'postgres://owner:prod@ep-example.region.neon.tech/db',
    })).toThrow('endpoints match')
  })
})

describe('retention cleanup queries', () => {
  it('freezes policy cutoffs for a run using the selected retention profile', () => {
    const asOf = new Date('2026-10-15T12:00:00.000Z')
    expect(getCleanupCutoffs(asOf, 'lean').activity.toISOString()).toBe('2026-10-01T12:00:00.000Z')
    expect(getCleanupCutoffs(asOf, 'lenient').activity.toISOString()).toBe('2026-07-17T12:00:00.000Z')
  })

  it('counts only the three approved disposable table families', async () => {
    const { query, calls } = mockQuery([[{ count: 5 }], [{ count: 2 }], [{ count: 1 }, { count: 3 }], [{ count: 6 }]])
    const result = await countCleanupCandidates(query, new Date('2026-10-15T12:00:00.000Z'), 'lean')
    expect(result).toEqual({ activityEvents: 5, notifications: 2, closedFriendRequests: 4, linkedNotifications: 6 })
    expect(calls).toHaveLength(4)
    expect(calls[0].sql).toContain('FROM activity_events')
    expect(calls[1].sql).toContain('FROM notifications')
    expect(calls[1].sql).toContain("fr.status = 'pending'")
    expect(calls[1].sql).toContain("notifications.\"sourceKey\" = 'friend_request:' || fr.id::text")
    expect(calls[1].sql).not.toContain("notifications.payload->>'requestId' IS NULL")
    expect(calls[2].sql).toContain("fr.status IN ('rejected', 'cancelled')")
    expect(calls[2].sql).toContain("fr.status = 'accepted'")
    expect(calls[2].sql).toContain('FROM friendships')
    expect(calls[3].sql).toContain('COUNT(DISTINCT n.id)')
    expect(calls.map((call) => call.sql).join(' ')).not.toMatch(/routine_completions|ai_messages|ai_usage_events|xp_transactions|screening|forum_/)
  })

  it('deletes in repeatable bounded batches and reconciles linked friend notifications atomically', async () => {
    const { query, calls } = mockQuery([
      [{ id: 'activity-a' }, { id: 'activity-b' }],
      [{ id: 'activity-c' }],
      [{ id: 'notification-a' }],
      [{ deleted: 1, linked_notifications: 2 }],
    ])
    const result = await applyCleanup(query, new Date('2026-10-15T12:00:00.000Z'), 'lean', { batchSize: 2, maxBatches: 3 })
    expect(result).toEqual({ activityEvents: 3, notifications: 1, closedFriendRequests: 1, linkedNotifications: 2, capped: false })
    expect(calls).toHaveLength(4)
    expect(calls[0].sql).toContain('ORDER BY e."createdAt", e.id')
    expect(calls[0].sql).toContain('SKIP LOCKED')
    const friendSql = calls[3].sql
    expect(friendSql).toContain("fr.status IN ('rejected', 'cancelled', 'accepted')")
    expect(friendSql).toContain('EXISTS (')
    expect(friendSql).toContain('DELETE FROM notifications n')
    expect(friendSql).toContain("n.payload->>'requestId' = batch.id::text")
    expect(friendSql).toContain("'friend_request:' || batch.id::text")
    expect(friendSql).toContain("n.kind = 'friend_request'")
    expect(friendSql).not.toContain('friend_accepted:')
    expect(friendSql).toContain('DELETE FROM friend_requests fr')
    expect(friendSql.indexOf('DELETE FROM notifications n')).toBeLessThan(friendSql.indexOf('DELETE FROM friend_requests fr'))
    // Bind UTC strings: pg's Date serializer uses the process timezone, while
    // these timestamp-without-zone columns contain UTC wall-clock values.
    expect(calls[0].values.filter((value) => typeof value === 'string')).toEqual([
      '2026-10-01T12:00:00.000Z',
      '2026-10-01T12:00:00.000Z',
    ])
  })

  it('reports the batch cap and prevents callers from raising hard limits', async () => {
    const { query } = mockQuery(Array.from({ length: 6 }, () => [{ id: 'row' }]))
    const result = await applyCleanup(query, new Date('2026-10-15T12:00:00.000Z'), 'lean', { batchSize: 1, maxBatches: 2 })
    expect(result.capped).toBe(true)
    await expect(applyCleanup(query, new Date(), 'lean', { maxBatches: RETENTION_MAX_BATCHES + 1 })).rejects.toThrow('maxBatches cannot exceed')
    await expect(applyCleanup(query, new Date(), 'lean', { batchSize: RETENTION_BATCH_SIZE + 1 })).rejects.toThrow('batchSize cannot exceed')
  })

  it('reports a committed batch before a later query fails', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce([{ id: 'committed-activity' }])
      .mockRejectedValueOnce(new Error('notification query failed')) as unknown as RetentionQuery
    const onBatch = vi.fn()

    await expect(applyCleanup(query, new Date('2026-10-15T12:00:00.000Z'), 'lean', { batchSize: 2, onBatch }))
      .rejects.toThrow('notification query failed')
    expect(onBatch).toHaveBeenCalledTimes(1)
    expect(onBatch).toHaveBeenCalledWith({
      phase: 'activityEvents',
      batch: 1,
      counts: { activityEvents: 1 },
    })
  })
})
