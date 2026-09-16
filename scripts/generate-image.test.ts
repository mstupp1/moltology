import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { generateGeminiImage } from './generate-image'

describe('Gemini Image Generation Engine', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('throws error when API key is missing', async () => {
    delete process.env.GEMINI_API_KEY
    delete process.env.VERTEX_API_KEY
    delete process.env.GOOGLE_API_KEY
    delete process.env.AI_GATEWAY_API_KEY

    await expect(
      generateGeminiImage({
        prompt: 'A cybernetic crab in deep ocean',
      })
    ).rejects.toThrow('Missing API key in environment variables')
  })

  it('throws error when reference image path does not exist', async () => {
    process.env.GEMINI_API_KEY = 'test_key'

    await expect(
      generateGeminiImage({
        prompt: 'Elevate this card',
        referenceImagePath: 'tmp/non-existent-image-file.png',
      })
    ).rejects.toThrow('Reference image not found')
  })

  it('submits text prompt and parses base64 image data correctly', async () => {
    process.env.GEMINI_API_KEY = 'test_key'

    const dummyBase64 = Buffer.from('mock-image-bytes').toString('base64')
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: dummyBase64,
                  },
                },
              ],
            },
          },
        ],
      }),
    })
    global.fetch = mockFetch

    const testOutPath = path.resolve(process.cwd(), 'tmp/test-output-image.png')
    const result = await generateGeminiImage({
      prompt: 'A cybernetic crab in deep ocean',
      aspectRatio: '9:16',
      outputFilePath: testOutPath,
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [callUrl, callInit] = mockFetch.mock.calls[0]
    expect(callUrl).toContain('models/gemini-3-pro-image:generateContent?key=test_key')
    
    const body = JSON.parse(callInit.body)
    expect(body.contents[0].parts[0].text).toBe('A cybernetic crab in deep ocean')
    expect(body.generationConfig.imageConfig.aspectRatio).toBe('9:16')
    expect(body.generationConfig.imageConfig.imageSize).toBe('2K')

    expect(result.localPath).toBe(testOutPath)
    expect(fs.existsSync(testOutPath)).toBe(true)

    // Clean up
    if (fs.existsSync(testOutPath)) {
      fs.unlinkSync(testOutPath)
    }
  })

  it('encodes reference image as base64 inlineData when provided', async () => {
    process.env.GEMINI_API_KEY = 'test_key'

    const testRefPath = path.resolve(process.cwd(), 'tmp/test-ref-image.png')
    fs.mkdirSync(path.dirname(testRefPath), { recursive: true })
    fs.writeFileSync(testRefPath, 'dummy-ref-content')

    const dummyBase64 = Buffer.from('elevated-image-bytes').toString('base64')
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: dummyBase64,
                  },
                },
              ],
            },
          },
        ],
      }),
    })
    global.fetch = mockFetch

    const testOutPath = path.resolve(process.cwd(), 'tmp/test-elevated-output.png')
    const result = await generateGeminiImage({
      prompt: 'Elevate into 3D glassmorphic HUD panel',
      referenceImagePath: testRefPath,
      aspectRatio: '9:16',
      outputFilePath: testOutPath,
    })

    const [, callInit] = mockFetch.mock.calls[0]
    const body = JSON.parse(callInit.body)
    expect(body.contents[0].parts.length).toBe(2)
    expect(body.contents[0].parts[0].inlineData.mimeType).toBe('image/png')
    expect(body.contents[0].parts[0].inlineData.data).toBe(Buffer.from('dummy-ref-content').toString('base64'))
    expect(body.contents[0].parts[1].text).toBe('Elevate into 3D glassmorphic HUD panel')

    expect(result.localPath).toBe(testOutPath)

    // Clean up
    if (fs.existsSync(testRefPath)) fs.unlinkSync(testRefPath)
    if (fs.existsSync(testOutPath)) fs.unlinkSync(testOutPath)
  })

  it('resolves model aliases correctly', async () => {
    process.env.GEMINI_API_KEY = 'test_key'

    const dummyBase64 = Buffer.from('mock-bytes').toString('base64')
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ inlineData: { mimeType: 'image/png', data: dummyBase64 } }],
            },
          },
        ],
      }),
    })
    global.fetch = mockFetch

    const testOutPath = path.resolve(process.cwd(), 'tmp/test-alias-output.png')
    await generateGeminiImage({
      prompt: 'A cybernetic crab',
      model: 'nano-banana-2',
      outputFilePath: testOutPath,
    })

    const [callUrl] = mockFetch.mock.calls[0]
    expect(callUrl).toContain('models/gemini-3.1-flash-image:generateContent')

    if (fs.existsSync(testOutPath)) fs.unlinkSync(testOutPath)
  })
})
