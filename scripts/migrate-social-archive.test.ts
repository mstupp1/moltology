import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkZernioDependencies } from './migrate-social-archive'
import { fetchZernio } from './lib/zernio-client'

vi.mock('./lib/zernio-client', () => ({ fetchZernio: vi.fn(), DEFAULT_PROFILE_ID: 'profile' }))
afterEach(() => vi.resetAllMocks())

describe('live Zernio cleanup dependencies', () => {
  const url = 'https://example.storage.neon.tech/moltology-public-assets/images/social/posts/old.png'
  const post = { _id: 'old', status: 'published', mediaItems: [{ url }], platforms: [{ status: 'published' }], recycling: { enabled: false } }
  function response(posts: unknown[]) { return { posts, pagination: { page: 1, pages: 1, total: posts.length } } }
  it('retains published references unless explicitly authorized to discard them', async () => {
    vi.mocked(fetchZernio).mockResolvedValue(response([post]))
    expect((await checkZernioDependencies()).references).toContain('images/social/posts/old.png')
    expect(await checkZernioDependencies(true)).toEqual({ complete: true, references: [] })
  })
  it.each([
    { ...post, status: 'scheduled' },
    { ...post, recycling: { enabled: true } },
    { ...post, platforms: [{ status: 'pending' }] },
  ])('still protects active, recycling and partially published media', async value => {
    vi.mocked(fetchZernio).mockResolvedValue(response([value]))
    expect((await checkZernioDependencies(true)).references).toContain('images/social/posts/old.png')
  })
  it('fails closed on incomplete pagination', async () => {
    vi.mocked(fetchZernio).mockResolvedValue({ posts: [post], pagination: { page: 1, pages: 1, total: 2 } })
    expect((await checkZernioDependencies(true)).complete).toBe(false)
  })
})
