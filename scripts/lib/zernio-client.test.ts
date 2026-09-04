import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  DEFAULT_PROFILE_ID,
  DEFAULT_INSTAGRAM_ACCOUNT_ID,
  DEFAULT_YOUTUBE_ACCOUNT_ID,
  QUEUE_IDS,
  getZernioApiKey,
  createZernioPost,
  postZernioComment,
  queueInstagramPost,
  queueInstagramCarousel,
  queueDualReelAndShort,
} from './zernio-client'

describe('zernio-client', () => {
  const originalEnv = process.env
  const mockApiKey = 'mock_zernio_test_key_placeholder'

  beforeEach(() => {
    process.env = { ...originalEnv, ZERNIO_API_KEY: mockApiKey }
    vi.restoreAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('exports valid default identifiers and queue IDs', () => {
    expect(DEFAULT_PROFILE_ID).toBe('6a7f74b1839bf39ff3b6aaaa')
    expect(DEFAULT_INSTAGRAM_ACCOUNT_ID).toBe('6a7f7f0777555aae01d99b54')
    expect(DEFAULT_YOUTUBE_ACCOUNT_ID).toBe('6a7fd9bd77555aae01ebea63')
    expect(QUEUE_IDS.CAROUSELS_AND_POSTS).toBe('6a84b76d2421e968ac81f5bc')
    expect(QUEUE_IDS.REELS_AND_SHORTS).toBe('6a84b7702421e968ac81f5bd')
    expect(QUEUE_IDS.LEAD_MAGNETS_DAILY).toBe('6a8d93576f0e96efe2960c91')
  })

  it('retrieves API key from environment', () => {
    expect(getZernioApiKey()).toBe(mockApiKey)
  })

  it('creates a post via Zernio REST API', async () => {
    const mockPost = {
      _id: 'post_123',
      status: 'scheduled',
      scheduledFor: '2026-09-03T17:00:00.000Z',
      platforms: [{ platform: 'instagram' }],
    }

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ post: mockPost }),
    } as any)

    const result = await createZernioPost({
      queuedFromProfile: DEFAULT_PROFILE_ID,
      queueId: QUEUE_IDS.CAROUSELS_AND_POSTS,
      content: 'Test post caption',
      platforms: [{ platform: 'instagram', accountId: DEFAULT_INSTAGRAM_ACCOUNT_ID }],
    })

    expect(result._id).toBe('post_123')
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://zernio.com/api/v1/posts',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockApiKey}`,
          'Content-Type': 'application/json',
        }),
      })
    )

    const sentBody = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
    expect(sentBody.queuedFromProfile).toBe(DEFAULT_PROFILE_ID)
    expect(sentBody.queueId).toBe(QUEUE_IDS.CAROUSELS_AND_POSTS)
  })

  it('posts a first comment via Zernio inbox API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ comment: { _id: 'comm_456' } }),
    } as any)

    const res = await postZernioComment('post_123', DEFAULT_INSTAGRAM_ACCOUNT_ID, '💬 First comment')
    expect(res.comment._id).toBe('comm_456')
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://zernio.com/api/v1/inbox/comments/post_123',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          accountId: DEFAULT_INSTAGRAM_ACCOUNT_ID,
          message: '💬 First comment',
        }),
      })
    )
  })

  it('queues an Instagram post and immediately chains the first comment', async () => {
    const mockPost = {
      _id: 'post_ig_1',
      status: 'scheduled',
      scheduledFor: '2026-09-04T17:00:00.000Z',
    }
    const mockComment = { _id: 'comm_ig_1' }

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ post: mockPost }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ comment: mockComment }),
      } as any)

    const result = await queueInstagramPost({
      mediaUrl: 'https://cdn.moltology.org/post.png',
      caption: 'Awesome caption',
      firstComment: 'Comment "GUIDE" for link',
      queueId: QUEUE_IDS.LEAD_MAGNETS_DAILY,
    })

    expect(result.dryRun).toBe(false)
    expect(result.postId).toBe('post_ig_1')
    expect(result.commentId).toBe('comm_ig_1')
    expect(result.queueId).toBe(QUEUE_IDS.LEAD_MAGNETS_DAILY)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('supports dry-run mode for Instagram posts without making HTTP calls', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const result = await queueInstagramPost({
      mediaUrl: 'https://cdn.moltology.org/post.png',
      caption: 'Awesome caption',
      firstComment: 'Comment "GUIDE"',
      dryRun: true,
    })

    expect(result.dryRun).toBe(true)
    expect(result.postId).toContain('dry-run')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('queues an Instagram carousel with multiple slides and chains first comment', async () => {
    const mockPost = {
      _id: 'carousel_1',
      status: 'scheduled',
      scheduledFor: '2026-09-05T17:00:00.000Z',
    }
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ post: mockPost }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ comment: { _id: 'comm_c1' } }),
      } as any)

    const result = await queueInstagramCarousel({
      mediaUrls: ['https://cdn.moltology.org/s1.png', 'https://cdn.moltology.org/s2.png'],
      caption: 'Carousel caption',
      firstComment: 'Swipe to see',
      queueId: QUEUE_IDS.CAROUSELS_AND_POSTS,
    })

    expect(result.dryRun).toBe(false)
    expect(result.postId).toBe('carousel_1')
    expect(result.commentId).toBe('comm_c1')
    expect(fetchSpy).toHaveBeenCalledTimes(2)

    const postPayload = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
    expect(postPayload.mediaItems).toHaveLength(2)
    expect(postPayload.mediaItems[0].url).toBe('https://cdn.moltology.org/s1.png')
  })

  it('queues a unified dual broadcast for Reel and Short into Reels & Shorts queue', async () => {
    const mockPost = { _id: 'unified_reel_1', status: 'scheduled', scheduledFor: '2026-09-05T22:30:00.000Z' }
    const mockComment = { comment: { _id: 'comm_ig_reel_1' } }

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ post: mockPost }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockComment),
      } as any)

    const result = await queueDualReelAndShort({
      videoUrl: 'https://cdn.moltology.org/reel.mp4',
      instagramCaption: 'IG Reel caption',
      youtubeTitle: 'Epic YouTube Title #Shorts',
      youtubeDescription: 'Full description',
      youtubeTags: ['shorts', 'molt'],
      firstComment: 'Comment QUIZ',
      queueId: QUEUE_IDS.REELS_AND_SHORTS,
    })

    expect(result.dryRun).toBe(false)
    expect(result.postId).toBe('unified_reel_1')
    expect(result.instagramPostId).toBe('unified_reel_1')
    expect(result.youtubePostId).toBe('unified_reel_1')
    expect(result.commentId).toBe('comm_ig_reel_1')
    expect(fetchSpy).toHaveBeenCalledTimes(2)

    const postPayload = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
    expect(postPayload.queueId).toBe(QUEUE_IDS.REELS_AND_SHORTS)
    expect(postPayload.mediaItems).toHaveLength(1)
    expect(postPayload.mediaItems[0].url).toBe('https://cdn.moltology.org/reel.mp4')
    expect(postPayload.platforms).toHaveLength(2)

    // Instagram platform target
    expect(postPayload.platforms[0].platform).toBe('instagram')
    expect(postPayload.platforms[0].customContent).toBe('IG Reel caption')
    expect(postPayload.platforms[0].platformSpecificData.contentType).toBe('reel')
    expect(postPayload.platforms[0].platformSpecificData.shareToFeed).toBe(true)
    expect(postPayload.platforms[0].platformSpecificData.firstComment).toBe('Comment QUIZ')

    // YouTube platform target
    expect(postPayload.platforms[1].platform).toBe('youtube')
    expect(postPayload.platforms[1].customContent).toBe('Full description')
    expect(postPayload.platforms[1].platformSpecificData.title).toBe('Epic YouTube Title #Shorts')
    expect(postPayload.platforms[1].platformSpecificData.visibility).toBe('public')
    expect(postPayload.platforms[1].platformSpecificData.tags).toEqual(['shorts', 'molt'])
    expect(postPayload.platforms[1].platformSpecificData.firstComment).toBe('Comment QUIZ')
  })

  it('supports dry-run mode for unified Reel and Short without making HTTP calls', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const result = await queueDualReelAndShort({
      videoUrl: 'https://cdn.moltology.org/reel.mp4',
      instagramCaption: 'IG Reel caption',
      youtubeTitle: 'Epic YouTube Title #Shorts',
      youtubeDescription: 'Full description',
      dryRun: true,
    })

    expect(result.dryRun).toBe(true)
    expect(result.postId).toContain('dry-run-reel-short')
    expect(result.instagramPostId).toBe(result.postId)
    expect(result.youtubePostId).toBe(result.postId)
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
