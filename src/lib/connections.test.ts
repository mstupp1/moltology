import { describe, it, expect } from 'vitest'
import {
  normalizeFriendPair,
  canTransitionFriendRequest,
  assertCanSendFriendRequest,
  buildFriendNotificationCopy,
  getStageLabel,
  toMemberSummary,
} from './connections'
import {
  countUnreadNotifications,
  friendRequestSourceKey,
  friendAcceptedSourceKey,
  isActionableFriendRequest,
} from './notifications'

describe('connections helpers', () => {
  it('normalizes friendship pairs lexicographically', () => {
    expect(normalizeFriendPair('b', 'a')).toEqual(['a', 'b'])
    expect(normalizeFriendPair('a', 'b')).toEqual(['a', 'b'])
  })

  it('rejects self-friendship pairs', () => {
    expect(() => normalizeFriendPair('same', 'same')).toThrow(/yourself/i)
  })

  it('guards self friend requests', () => {
    expect(() => assertCanSendFriendRequest('u1', 'u1')).toThrow(/yourself/i)
    expect(() => assertCanSendFriendRequest('u1', 'u2')).not.toThrow()
  })

  it('allows only pending transitions', () => {
    expect(canTransitionFriendRequest('pending', 'accepted')).toBe(true)
    expect(canTransitionFriendRequest('pending', 'rejected')).toBe(true)
    expect(canTransitionFriendRequest('pending', 'cancelled')).toBe(true)
    expect(canTransitionFriendRequest('accepted', 'rejected')).toBe(false)
    expect(canTransitionFriendRequest('rejected', 'pending')).toBe(false)
  })

  it('builds plain friend notification copy', () => {
    expect(buildFriendNotificationCopy('friend_request', 'LARVA UNIT #1')).toEqual({
      title: 'Friend request',
      detail: 'LARVA UNIT #1 sent you a friend request.',
    })
    expect(buildFriendNotificationCopy('friend_accepted', 'Soft-Shed Sam').title).toBe(
      'Friend request accepted'
    )
  })

  it('maps stage numbers to short labels', () => {
    expect(getStageLabel(1)).toBe('Larval Initiate')
    expect(getStageLabel(4)).toBe('Ascendant')
  })

  it('maps rows to connection summaries', () => {
    const summary = toMemberSummary({
      id: 'u1',
      larvaId: 'LARVA UNIT #9',
      stage: 2,
      avatarConfig: { style: 'critters', seed: 'abc' },
      requestId: 'req-1',
      since: new Date('2024-01-01T00:00:00.000Z'),
    })
    expect(summary.stageLabel).toBe('Soft-Shed')
    expect(summary.requestId).toBe('req-1')
    expect(summary.since).toBe('2024-01-01T00:00:00.000Z')
  })
})

describe('notifications helpers', () => {
  it('builds stable source keys', () => {
    expect(friendRequestSourceKey('abc')).toBe('friend_request:abc')
    expect(friendAcceptedSourceKey('abc')).toBe('friend_accepted:abc')
  })

  it('counts unread notifications', () => {
    expect(
      countUnreadNotifications([
        { readAt: null },
        { readAt: '2024-01-01T00:00:00.000Z' },
        { readAt: undefined },
      ])
    ).toBe(2)
  })

  it('detects actionable unread friend requests', () => {
    expect(
      isActionableFriendRequest('friend_request', null, { requestId: 'r1' })
    ).toBe(true)
    expect(
      isActionableFriendRequest('friend_request', '2024-01-01T00:00:00.000Z', {
        requestId: 'r1',
      })
    ).toBe(false)
    expect(isActionableFriendRequest('friend_accepted', null, { requestId: 'r1' })).toBe(
      false
    )
  })
})
