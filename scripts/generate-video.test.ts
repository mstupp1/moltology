import { describe, it, expect } from 'vitest'
import { buildOmniPrompt, buildOmniRequest, extractOmniVideo, isOmniModel, DEFAULT_VIDEO_MODEL } from './generate-video'

describe('isOmniModel', () => {
  it('routes Veo IDs to the legacy endpoint and everything else to Omni', () => {
    expect(isOmniModel(DEFAULT_VIDEO_MODEL)).toBe(true)
    expect(isOmniModel('gemini-omni-1.1-flash')).toBe(true)
    expect(isOmniModel('veo-3.1-fast-generate-preview')).toBe(false)
  })
})

describe('buildOmniPrompt', () => {
  it('folds the duration and things to avoid into the prompt text', () => {
    const prompt = buildOmniPrompt('A lobster crosses a trench.', 6, 'on-screen text, logos')
    expect(prompt).toBe('A lobster crosses a trench. One continuous 6-second shot with no scene cuts. No on-screen text, logos.')
  })

  it('leaves the prompt alone when there is nothing to add', () => {
    expect(buildOmniPrompt('  A lobster.  ')).toBe('A lobster.')
  })
})

describe('buildOmniRequest', () => {
  it('sends a plain string for text-to-video', () => {
    const body = buildOmniRequest({ model: 'gemini-omni-1.1-flash', prompt: 'p', aspectRatio: '9:16' })
    expect(body).toEqual({
      model: 'gemini-omni-1.1-flash',
      input: 'p',
      response_format: { type: 'video', aspect_ratio: '9:16', resolution: '720p' },
      background: true,
      store: true,
    })
  })

  it('puts the start image before the prompt for image-to-video', () => {
    const body = buildOmniRequest({
      model: 'gemini-omni-1.1-flash',
      prompt: 'p',
      aspectRatio: '16:9',
      resolution: '1080p',
      image: { data: 'AAAA', mimeType: 'image/png' },
    })
    expect(body.input).toEqual([
      { type: 'image', data: 'AAAA', mime_type: 'image/png' },
      { type: 'text', text: 'p' },
    ])
    expect(body.response_format).toEqual({ type: 'video', aspect_ratio: '16:9', resolution: '1080p' })
  })

  it('falls back to 9:16 for ratios Omni does not render', () => {
    const body = buildOmniRequest({ model: 'm', prompt: 'p', aspectRatio: '1:1' })
    expect((body.response_format as { aspect_ratio: string }).aspect_ratio).toBe('9:16')
  })
})

describe('extractOmniVideo', () => {
  it('finds inline video data in the model_output step', () => {
    const interaction = {
      id: 'v1_abc',
      status: 'completed',
      steps: [
        { type: 'user_input', content: [{ type: 'text', text: 'p' }] },
        { type: 'model_output', content: [{ type: 'video', mime_type: 'video/mp4', data: 'ZmFrZQ==' }] },
      ],
    }
    expect(extractOmniVideo(interaction)).toEqual({ data: 'ZmFrZQ==', uri: undefined })
  })

  it('finds a hosted file uri', () => {
    const interaction = { outputs: [{ type: 'video', uri: 'https://generativelanguage.googleapis.com/v1beta/files/xyz' }] }
    expect(extractOmniVideo(interaction)?.uri).toBe('https://generativelanguage.googleapis.com/v1beta/files/xyz')
  })

  it('ignores an image the user sent and returns null while the video is still rendering', () => {
    const interaction = {
      id: 'v1_abc',
      status: 'in_progress',
      steps: [{ type: 'user_input', content: [{ type: 'image', mime_type: 'image/png', data: 'AAAA' }] }],
    }
    expect(extractOmniVideo(interaction)).toBeNull()
  })
})
