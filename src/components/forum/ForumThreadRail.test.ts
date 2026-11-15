import { describe, it, expect } from 'vitest'
import { threadParticipants } from './ForumThreadRail'

const person = (userId: string, authorName = userId) => ({ userId, authorName, authorAvatar: '', authorStage: 1 }) as any

describe('threadParticipants', () => {
  it('lists repliers once, most active first, without the author of the post', () => {
    const topic = { userId: 'op' } as any
    const posts = [person('a'), person('op'), person('b'), person('b'), person('a'), person('b')]
    expect(threadParticipants(topic, posts).map((p) => p.userId)).toEqual(['b', 'a'])
  })
})
