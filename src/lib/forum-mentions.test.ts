import { describe, expect, it } from 'vitest'
import {
  extractMentionHandles,
  forumMentionHubPath,
  forumMentionSourceKey,
  insertMentionAtCursor,
  mentionQueryAtCursor,
  presentForumMentionNotification,
  splitForumMentionParts,
} from './forum-mentions'

describe('forum mentions', () => {
  it('extracts unique @handles and ignores email-like tokens', () => {
    expect(
      extractMentionHandles('Hail @claw_lord and @Pincer_Prime — ignore initiate@order.org and @x'),
    ).toEqual(['claw_lord', 'Pincer_Prime'])
  })

  it('caps unique mentions and skips repeats', () => {
    const body = '@alpha @alpha @bravo @charlie @delta @echo @foxtrot @golf @hotel @india'
    expect(extractMentionHandles(body)).toEqual([
      'alpha',
      'bravo',
      'charlie',
      'delta',
      'echo',
      'foxtrot',
      'golf',
      'hotel',
    ])
  })

  it('detects an open @ query at the cursor', () => {
    expect(mentionQueryAtCursor('Hail @cla', 9)).toEqual({ start: 5, query: 'cla' })
    expect(mentionQueryAtCursor('Hail @', 6)).toEqual({ start: 5, query: '' })
    expect(mentionQueryAtCursor('Hail claw', 9)).toBeNull()
    expect(mentionQueryAtCursor('write initiate@cla', 18)).toBeNull()
  })

  it('inserts a designation over the active @ query', () => {
    const next = insertMentionAtCursor('Hail @cla more', 9, 'claw_lord')
    expect(next.text).toBe('Hail @claw_lord  more')
    expect(next.cursor).toBe(16)
    expect(next.text.slice(0, next.cursor)).toBe('Hail @claw_lord ')
  })

  it('splits saved copy into mention links and surrounding text', () => {
    expect(splitForumMentionParts('Ask @claw_lord before you molt.')).toEqual([
      { type: 'text', value: 'Ask ' },
      { type: 'mention', handle: 'claw_lord' },
      { type: 'text', value: ' before you molt.' },
    ])
  })

  it('builds durable hail copy and a later-inbox source key', () => {
    expect(
      presentForumMentionNotification({
        userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        handle: 'claw_lord',
        larvaId: 'LARVA UNIT #9',
      }),
    ).toEqual({
      title: 'You were hailed',
      detail: 'claw_lord hailed you in a discussion.',
    })
    expect(forumMentionSourceKey('post', 'post-1', 'user-2')).toBe('forum_mention:post:post-1:user-2')
    expect(forumMentionHubPath({ categorySlug: 'general-discussion', topicSlug: 'molt-notes' })).toBe(
      '/forum/general-discussion/molt-notes',
    )
    expect(
      forumMentionHubPath({
        categorySlug: 'general-discussion',
        topicSlug: 'molt-notes',
        postId: 'post-hail',
      }),
    ).toBe('/forum/general-discussion/molt-notes#post-post-hail')
    expect(forumMentionHubPath({})).toBe('/forum')
  })
})
