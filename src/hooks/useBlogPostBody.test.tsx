import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { BlogPostData } from '@/lib/blog-data'

// A plain function, not vi.fn(): the spy's own bookkeeping on a rejected promise trips
// Vitest's unhandled-rejection check even though the hook catches it.
let loadPost: (args: unknown) => Promise<unknown> = async () => null
const calls: unknown[] = []
vi.mock('@/lib/server/api', () => ({
  getBlogPostBySlugFn: (args: unknown) => {
    calls.push(args)
    return loadPost(args)
  },
}))

import { useBlogPostBody } from './useBlogPostBody'

const listingPost = { slug: 'a-post', summary: 'Short summary', content: '' } as BlogPostData

describe('useBlogPostBody', () => {
  beforeEach(() => {
    calls.length = 0
    loadPost = async () => null
  })

  it('returns null for no post and does not fetch', () => {
    const { result } = renderHook(() => useBlogPostBody(null))
    expect(result.current).toBeNull()
    expect(calls).toHaveLength(0)
  })

  it('uses an inline body without fetching', () => {
    const { result } = renderHook(() => useBlogPostBody({ ...listingPost, content: 'Full body' }))
    expect(result.current).toBe('Full body')
    expect(calls).toHaveLength(0)
  })

  it('loads the body by slug when the listing left it out', async () => {
    loadPost = async () => ({ content: 'Loaded body' })
    const { result } = renderHook(() => useBlogPostBody(listingPost))
    expect(result.current).toBeNull()
    await waitFor(() => expect(result.current).toBe('Loaded body'))
    expect(calls).toEqual([{ data: 'a-post' }])
  })

  it('falls back to the summary when loading fails', async () => {
    loadPost = () => Promise.reject(new Error('offline'))
    const { result } = renderHook(() => useBlogPostBody(listingPost))
    await waitFor(() => expect(result.current).toBe('Short summary'))
  })
})
