import { describe, expect, it } from 'vitest'
import { galleryShots } from './gallery'

describe('official gallery extraction', () => {
  it('keeps alternate angles with their provider variant mapping and removes duplicate URLs', () => {
    expect(galleryShots({ task_key: 'key', status: 'completed', mockups: [
      { variant_ids: [1320], mockup_url: 'https://example.com/front.jpg', extra: [
        { url: 'https://example.com/front.jpg', title: 'Front' },
        { url: 'https://example.com/left.jpg', title: 'Handle on Left' },
      ] },
      { variant_ids: [4830], mockup_url: 'https://example.com/large.jpg' },
    ] })).toEqual([
      { url: 'https://example.com/front.jpg', title: 'Primary', variantIds: [1320] },
      { url: 'https://example.com/left.jpg', title: 'Handle on Left', variantIds: [1320] },
      { url: 'https://example.com/large.jpg', title: 'Primary', variantIds: [4830] },
    ])
  })
  it('never treats pending or failed jobs as finished reference photos', () => {
    expect(() => galleryShots({ task_key: 'key', status: 'pending' })).toThrow('preserved')
    expect(() => galleryShots({ task_key: 'key', status: 'failed' })).toThrow('preserved')
  })
})
