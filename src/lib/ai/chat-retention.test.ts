import { describe, expect, it, vi } from 'vitest'
import { CHAT_LIMIT, createChatThreadWithinLimit } from './chat-retention'

const input = {
  id: '11111111-1111-4111-8111-111111111111',
  userId: 'member-1',
  title: 'First question',
  persona: 'oracle',
}

function mockClient(rows: unknown[][], errors: unknown[] = []) {
  const queries: Array<{ text: string; values: unknown[] }> = []
  const client: any = (strings: TemplateStringsArray, ...values: unknown[]) => {
    queries.push({ text: strings.join('?'), values })
    return { text: strings.join('?'), values }
  }
  client.transaction = vi.fn(async (_queries: unknown[], options: unknown) => {
    expect(options).toEqual({ isolationLevel: 'Serializable' })
    const error = errors.shift()
    if (error) throw error
    return [rows.shift() || []]
  })
  return { client, queries }
}

describe('createChatThreadWithinLimit', () => {
  it('uses a serializable cap check and inserts under the shared limit', async () => {
    const thread = {
      id: input.id,
      userId: input.userId,
      title: input.title,
      persona: input.persona,
      pinnedAt: null,
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const { client, queries } = mockClient([[{ outcome: 'created', ...thread }]])

    const result = await createChatThreadWithinLimit(client, input)

    expect(CHAT_LIMIT).toBe(50)
    expect(result).toEqual({ thread, created: true })
    expect(client.transaction).toHaveBeenCalledTimes(1)
    expect(queries[0].text).toContain('count(*)::integer')
    expect(queries[0].values).toContain(CHAT_LIMIT)
    expect(queries[0].text).toContain('NOT EXISTS (SELECT 1 FROM existing)')
  })

  it('returns null when the cap is full', async () => {
    const { client } = mockClient([[{ outcome: 'limit' }]])
    expect(await createChatThreadWithinLimit(client, input)).toBeNull()
  })

  it('retries serialization conflicts and rechecks the cap', async () => {
    const { client } = mockClient([[{ outcome: 'limit' }]], [{ code: '40001' }])
    expect(await createChatThreadWithinLimit(client, input)).toBeNull()
    expect(client.transaction).toHaveBeenCalledTimes(2)
  })
})
