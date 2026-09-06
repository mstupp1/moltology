import { describe, it, expect } from 'vitest'
import {
  FORUM_UNREAD_LABEL,
  countUnreadForumTopics,
  formatForumUnreadCount,
  forumTopicActivityAt,
  isForumTopicUnread,
  topicHasUnreadActivity,
} from './forum-visits'

describe('isForumTopicUnread', () => {
  const activity = '2026-09-06T12:00:00.000Z'

  it('is unread when a prior look is older than later activity', () => {
    expect(
      isForumTopicUnread({
        lastActivityAt: activity,
        topicVisitedAt: '2026-09-06T11:00:00.000Z',
      }),
    ).toBe(true)
  })

  it('is read when the member already looked at or after the latest activity', () => {
    expect(
      isForumTopicUnread({
        lastActivityAt: activity,
        topicVisitedAt: activity,
      }),
    ).toBe(false)
    expect(
      isForumTopicUnread({
        lastActivityAt: activity,
        topicVisitedAt: '2026-09-06T13:00:00.000Z',
      }),
    ).toBe(false)
  })

  it('uses the board first-look baseline when the topic was never opened', () => {
    expect(
      isForumTopicUnread({
        lastActivityAt: activity,
        boardVisitedAt: '2026-09-06T11:00:00.000Z',
      }),
    ).toBe(true)
    expect(
      isForumTopicUnread({
        lastActivityAt: activity,
        boardVisitedAt: '2026-09-06T13:00:00.000Z',
      }),
    ).toBe(false)
  })

  it('prefers the topic visit over the board baseline', () => {
    expect(
      isForumTopicUnread({
        lastActivityAt: activity,
        topicVisitedAt: '2026-09-06T13:00:00.000Z',
        boardVisitedAt: '2026-09-06T11:00:00.000Z',
      }),
    ).toBe(false)
  })

  it('stays quiet when the member has never been here', () => {
    expect(isForumTopicUnread({ lastActivityAt: activity })).toBe(false)
    expect(isForumTopicUnread({ lastActivityAt: 'not-a-date', topicVisitedAt: activity })).toBe(false)
  })
})

describe('forumTopicActivityAt', () => {
  it('takes the later of last reply and created', () => {
    expect(
      forumTopicActivityAt({
        createdAt: '2026-09-01T00:00:00.000Z',
        lastReplyAt: '2026-09-06T00:00:00.000Z',
      }),
    ).toBe('2026-09-06T00:00:00.000Z')
  })

  it('falls back to created when last reply is missing', () => {
    expect(forumTopicActivityAt({ createdAt: '2026-09-01T00:00:00.000Z' })).toBe(
      '2026-09-01T00:00:00.000Z',
    )
  })
})

describe('countUnreadForumTopics', () => {
  const visits = {
    topicVisitedAtById: new Map([
      ['seen', '2026-09-06T10:00:00.000Z'],
      ['caught-up', '2026-09-06T14:00:00.000Z'],
    ]),
    boardVisitedAtById: new Map([['board-a', '2026-09-06T09:00:00.000Z']]),
  }

  const topics = [
    {
      id: 'seen',
      categoryId: 'board-a',
      lastReplyAt: '2026-09-06T12:00:00.000Z',
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'caught-up',
      categoryId: 'board-a',
      lastReplyAt: '2026-09-06T12:00:00.000Z',
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'never-opened',
      categoryId: 'board-a',
      lastReplyAt: '2026-09-06T12:00:00.000Z',
      createdAt: '2026-09-06T11:00:00.000Z',
    },
    {
      id: 'other-board',
      categoryId: 'board-b',
      lastReplyAt: '2026-09-06T12:00:00.000Z',
      createdAt: '2026-09-06T11:00:00.000Z',
    },
  ]

  it('counts new activity on the scoped board', () => {
    expect(countUnreadForumTopics(topics, visits, 'board-a')).toBe(2)
    expect(topicHasUnreadActivity(topics[0], visits)).toBe(true)
    expect(topicHasUnreadActivity(topics[1], visits)).toBe(false)
    expect(topicHasUnreadActivity(topics[3], visits)).toBe(false)
  })
})

describe('unread chrome copy', () => {
  it('keeps the diegetic label and a short count', () => {
    expect(FORUM_UNREAD_LABEL).toBe('New transmission')
    expect(formatForumUnreadCount(0)).toBe('')
    expect(formatForumUnreadCount(1)).toBe('1 new')
    expect(formatForumUnreadCount(3)).toBe('3 new')
  })
})
