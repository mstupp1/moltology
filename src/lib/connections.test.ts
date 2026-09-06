import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  normalizeFriendPair,
  canTransitionFriendRequest,
  assertCanSendFriendRequest,
  buildFriendNotificationCopy,
  presentFriendNotification,
  getStageLabel,
  toMemberSummary,
  relationshipForMember,
  pickConnectionsHubPreview,
  type ConnectionsListView,
} from './connections'
import {
  countUnreadNotifications,
  friendRequestSourceKey,
  friendAcceptedSourceKey,
  isActionableFriendRequest,
  presentNotificationView,
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

  it('presents friend notifications with the claimed designation, not the larva unit', () => {
    const presented = presentFriendNotification('friend_request', {
      userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      handle: 'claw_lord',
      larvaId: 'LARVA UNIT #2468',
    })
    expect(presented.actorPublicName).toBe('claw_lord')
    expect(presented.detail).toBe('claw_lord sent you a friend request.')
    expect(presented.detail).not.toMatch(/LARVA UNIT/)
  })

  it('presents friend notifications with the larva unit when no designation is claimed', () => {
    const presented = presentFriendNotification('friend_accepted', {
      userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      handle: null,
      larvaId: 'LARVA UNIT #2468',
    })
    expect(presented.actorPublicName).toBe('LARVA UNIT #2468')
    expect(presented.detail).toBe('LARVA UNIT #2468 accepted your friend request.')
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

  it('picks incoming requests before recent friends for the hub preview', () => {
    const connections: ConnectionsListView = {
      friends: [
        {
          id: 'old-friend',
          larvaId: 'LARVA UNIT #1',
          handle: 'old_shell',
          displayName: 'old_shell',
          stage: 2,
          stageLabel: 'Soft-Shed',
          avatarConfig: null,
          since: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'new-friend',
          larvaId: 'LARVA UNIT #4',
          handle: 'new_claw',
          displayName: 'new_claw',
          stage: 3,
          stageLabel: 'Exoshell Born',
          avatarConfig: null,
          since: '2026-08-01T00:00:00.000Z',
        },
      ],
      incoming: [
        {
          id: 'i1',
          larvaId: 'LARVA UNIT #2',
          handle: 'incoming_one',
          displayName: 'incoming_one',
          stage: 1,
          stageLabel: 'Larval Initiate',
          avatarConfig: null,
          requestId: 'req-in',
        },
      ],
      outgoing: [],
    }

    const preview = pickConnectionsHubPreview(connections, 3)
    expect(preview.map((row) => row.id)).toEqual(['i1', 'new-friend', 'old-friend'])
    expect(preview[0]?.kind).toBe('incoming')
    expect(preview[1]?.kind).toBe('friend')
  })

  it('returns an empty hub preview when there are no connections', () => {
    expect(pickConnectionsHubPreview(null)).toEqual([])
    expect(pickConnectionsHubPreview({ friends: [], incoming: [], outgoing: [] })).toEqual([])
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

  it('rewrites stored larva-unit notification copy when the actor has a designation', () => {
    const view = presentNotificationView({
      id: 'n1',
      kind: 'friend_request',
      title: 'Friend request',
      detail: 'LARVA UNIT #2468 sent you a friend request.',
      actorUserId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      actorLarvaId: 'LARVA UNIT #2468',
      actorHandle: 'claw_lord',
      payload: { requestId: 'r1', profileId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
      readAt: null,
      createdAt: '2026-09-03T00:00:00.000Z',
    })
    expect(view.detail).toBe('claw_lord sent you a friend request.')
    expect(view.detail).not.toMatch(/LARVA UNIT/)
    expect(view.actorHandle).toBe('claw_lord')
    expect(view.actionable).toBe(true)
  })

  it('keeps the larva unit on stored notification copy when no designation is claimed', () => {
    const view = presentNotificationView({
      id: 'n2',
      kind: 'friend_accepted',
      title: 'Friend request accepted',
      detail: 'LARVA UNIT #2468 accepted your friend request.',
      actorUserId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      actorLarvaId: 'LARVA UNIT #2468',
      actorHandle: null,
      payload: { requestId: 'r2' },
      readAt: '2026-09-03T00:00:00.000Z',
      createdAt: '2026-09-03T00:00:00.000Z',
    })
    expect(view.detail).toBe('LARVA UNIT #2468 accepted your friend request.')
    expect(view.actionable).toBe(false)
  })

  it('presents forum hail rows with live actor designation', () => {
    const view = presentNotificationView({
      id: 'n3',
      kind: 'forum_mention',
      title: 'You were hailed',
      detail: 'LARVA UNIT #2468 hailed you in a discussion.',
      actorUserId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      actorLarvaId: 'LARVA UNIT #2468',
      actorHandle: 'claw_lord',
      payload: {
        topicId: 'topic-1',
        postId: 'post-1',
        categorySlug: 'general-discussion',
        topicSlug: 'hail-thread',
        handle: 'pincer_prime',
      },
      readAt: null,
      createdAt: '2026-09-06T00:00:00.000Z',
    })
    expect(view.title).toBe('You were hailed')
    expect(view.detail).toBe('claw_lord hailed you in a discussion.')
    expect(view.actionable).toBe(false)
  })

  it('presents forum reply rows with live actor designation and thread target', () => {
    const view = presentNotificationView({
      id: 'n4',
      kind: 'forum_reply',
      title: 'A reply reached your thread',
      detail: 'LARVA UNIT #2468 answered a thread you opened.',
      actorUserId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      actorLarvaId: 'LARVA UNIT #2468',
      actorHandle: 'claw_lord',
      payload: {
        topicId: 'topic-1',
        postId: 'post-2',
        categorySlug: 'general-discussion',
        topicSlug: 'molt-notes',
        replyTarget: 'topic',
      },
      readAt: null,
      createdAt: '2026-09-06T00:00:00.000Z',
    })
    expect(view.title).toBe('A reply reached your thread')
    expect(view.detail).toBe('claw_lord answered a thread you opened.')
    expect(view.actionable).toBe(false)
  })
})
