import { describe, expect, it } from 'vitest'
import {
  forumReplySourceKey,
  isForumInboxKind,
  isForumReplyKind,
  presentForumReplyNotification,
} from './forum-replies'
import { forumMentionHubPath, forumPostAnchorId } from './forum-mentions'

describe('forum reply notifications', () => {
  it('builds a durable source key and thread deep-link', () => {
    expect(forumReplySourceKey('post-1', 'user-2')).toBe('forum_reply:post:post-1:user-2')
    expect(forumPostAnchorId('post-1')).toBe('post-post-1')
    expect(
      forumMentionHubPath({
        categorySlug: 'general-discussion',
        topicSlug: 'molt-notes',
        postId: 'post-1',
      }),
    ).toBe('/forum/general-discussion/molt-notes#post-post-1')
  })

  it('presents thread vs post reply copy with the live designation', () => {
    expect(
      presentForumReplyNotification({
        handle: 'claw_lord',
        larvaId: 'LARVA UNIT #9',
        target: 'topic',
      }),
    ).toEqual({
      title: 'A reply reached your thread',
      detail: 'claw_lord answered a thread you opened.',
    })
    expect(
      presentForumReplyNotification({
        handle: 'claw_lord',
        target: 'post',
      }),
    ).toEqual({
      title: 'A reply reached your post',
      detail: 'claw_lord answered your post.',
    })
  })

  it('recognizes forum inbox kinds', () => {
    expect(isForumReplyKind('forum_reply')).toBe(true)
    expect(isForumInboxKind('forum_mention')).toBe(true)
    expect(isForumInboxKind('forum_reply')).toBe(true)
    expect(isForumInboxKind('friend_request')).toBe(false)
  })
})
