import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  normalizeFriendPair,
  canTransitionFriendRequest,
  assertCanSendFriendRequest,
  buildFriendNotificationCopy,
  getStageLabel,
  toMemberSummary,
  relationshipForMember,
  type ConnectionsListView,
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
      handle: 'claw_lord',
      stage: 2,
      avatarConfig: { style: 'critters', seed: 'abc' },
      requestId: 'req-1',
      since: new Date('2024-01-01T00:00:00.000Z'),
    })
    expect(summary.stageLabel).toBe('Soft-Shed')
    expect(summary.requestId).toBe('req-1')
    expect(summary.since).toBe('2024-01-01T00:00:00.000Z')
    expect(summary.handle).toBe('claw_lord')
    expect(summary.displayName).toBe('claw_lord')
    expect(summary.larvaId).toBe('LARVA UNIT #9')
  })

  it('maps connection lists onto friend CTA state for shared member rows', () => {
    const connections: ConnectionsListView = {
      friends: [
        {
          id: 'f1',
          larvaId: 'LARVA UNIT #1',
          handle: 'friend',
          displayName: 'friend',
          stage: 2,
          stageLabel: 'Soft-Shed',
          avatarConfig: null,
        },
      ],
      incoming: [
        {
          id: 'i1',
          larvaId: 'LARVA UNIT #2',
          handle: null,
          displayName: 'LARVA UNIT #2',
          stage: 1,
          stageLabel: 'Larval Initiate',
          avatarConfig: null,
          requestId: 'req-in',
        },
      ],
      outgoing: [
        {
          id: 'o1',
          larvaId: 'LARVA UNIT #3',
          handle: 'sent',
          displayName: 'sent',
          stage: 1,
          stageLabel: 'Larval Initiate',
          avatarConfig: null,
          requestId: 'req-out',
        },
      ],
    }
    expect(relationshipForMember(connections, 'f1')).toEqual({
      relationship: 'friends',
      pendingRequestId: null,
    })
    expect(relationshipForMember(connections, 'i1')).toEqual({
      relationship: 'pending_received',
      pendingRequestId: 'req-in',
    })
    expect(relationshipForMember(connections, 'o1')).toEqual({
      relationship: 'pending_sent',
      pendingRequestId: 'req-out',
    })
    expect(relationshipForMember(connections, 'unknown')).toEqual({
      relationship: 'none',
      pendingRequestId: null,
    })
  })
})

describe('connections search copy', () => {
  it('asks for designation, larva unit, or name instead of larva ids only', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'src/components/hud/connections/ConnectionsPage.tsx'),
      'utf8',
    )
    expect(src).not.toMatch(/search by larva ids/i)
    expect(src).not.toMatch(/Search larva ids/)
    expect(src).toMatch(/designation, larva unit, or name/)
    expect(src).toMatch(/useMemberSearch/)
    expect(src).toMatch(/MemberSearchRow/)
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
