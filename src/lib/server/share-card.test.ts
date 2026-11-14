import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { describe, expect, it, vi } from 'vitest'
import { largeStillKey, storedStillKey } from '../avatar-still'
import { MEMBER_SHARE_FALLBACK_IMAGE, memberShareCardPath, SHARE_CARD_SIZE } from '../share-card'
import { handleMemberCardRequest } from './share-card'

const crab = fs.readFile(path.join(process.cwd(), 'content/brand/share-cards/crab-portrait-512.webp'))

function bucket(objects: Record<string, Buffer>) {
  return vi.fn(async (url: string) => {
    const key = url.split('/media/')[1]
    return objects[key] ? new Response(new Uint8Array(objects[key])) : new Response('missing', { status: 404 })
  })
}

describe('member share card', () => {
  it('builds its path from the portrait name and card version', () => {
    expect(memberShareCardPath('k3x9q2a')).toBe('/api/share/member/v2/k3x9q2a.jpg')
  })

  it('draws a 1200x630 JPEG from the sharp copy, cached for good', async () => {
    const fetcher = bucket({ [largeStillKey('k3x9q2a')]: await crab })
    const response = await handleMemberCardRequest('v2', 'k3x9q2a.jpg', fetcher)
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/jpeg')
    expect(response.headers.get('Cache-Control')).toContain('immutable')
    const meta = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
    expect({ width: meta.width, height: meta.height, format: meta.format }).toEqual({ ...SHARE_CARD_SIZE, format: 'jpeg' })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('falls back to the 256px portrait, then to the crab card', async () => {
    const small = bucket({ [storedStillKey('k3x9q2a')]: await crab })
    expect((await handleMemberCardRequest('v2', 'k3x9q2a.jpg', small)).status).toBe(200)
    expect(small).toHaveBeenCalledTimes(2)

    const none = await handleMemberCardRequest('v2', 'k3x9q2a.jpg', bucket({}))
    expect(none.status).toBe(302)
    expect(none.headers.get('Location')).toBe(`/${MEMBER_SHARE_FALLBACK_IMAGE}`)
  })

  it('never fetches for a bad name or an old version', async () => {
    const fetcher = bucket({})
    for (const [version, card] of [['v2', '..%2Fsecret.jpg'], ['v2', 'k3x9q2a.png'], ['v1', 'k3x9q2a.jpg']]) {
      expect((await handleMemberCardRequest(version, card, fetcher)).status).toBe(302)
    }
    expect(fetcher).not.toHaveBeenCalled()
  })
})
