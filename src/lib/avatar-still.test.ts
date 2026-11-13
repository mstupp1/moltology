import { describe, expect, it, vi } from 'vitest'
import { avatarStillHash, storedStillKey, storedStillUrl, STORED_STILL_PX, webpSize } from './avatar-still'
import { STARTER_CHARACTER_EQUIPMENT } from './avatar/starter-equipment'
import type { LobsterAvatarConfig } from './lobster-avatar'

const base: LobsterAvatarConfig = { style: 'critters', seed: 'larva-a', race: 'crab', shellColor: 'cobalt', pose: 'wave' }

/** The first bytes of an extended-format WebP of the given size. */
function webp(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(64)
  bytes.set([...'RIFF'].map((c) => c.charCodeAt(0)), 0)
  bytes.set([...'WEBPVP8X'].map((c) => c.charCodeAt(0)), 8)
  bytes.set([(width - 1) & 255, ((width - 1) >> 8) & 255, 0, (height - 1) & 255, ((height - 1) >> 8) & 255, 0], 24)
  return bytes
}
const dataUrl = (bytes: Uint8Array) => `data:image/webp;base64,${Buffer.from(bytes).toString('base64')}`

describe('saved portraits', () => {
  it('names a portrait by what it shows, not by how the config is written', () => {
    const hash = avatarStillHash(base)
    expect(hash).toMatch(/^[a-z0-9]{4,16}$/)
    // Field order, pose, backdrop, temperament and an empty gear list do not change the picture.
    expect(avatarStillHash({ pose: 'think', temperament: 'goofy', backgroundTheme: 'reef', shellColor: 'cobalt', race: 'crab', seed: 'larva-a', style: 'critters', equipment: {} })).toBe(hash)
    expect(avatarStillHash({ ...base, still: 'abcd1234' })).toBe(hash)
    // Anything on the face or body does.
    expect(avatarStillHash({ ...base, shellColor: 'gold' })).not.toBe(hash)
    expect(avatarStillHash({ ...base, headScale: 1.1 })).not.toBe(hash)
    expect(avatarStillHash({ ...base, equipment: STARTER_CHARACTER_EQUIPMENT })).not.toBe(hash)
  })

  it('offers the stored image only while it matches the look', () => {
    const still = avatarStillHash(base)!
    expect(storedStillUrl({ ...base, still })).toBe(`/media/${storedStillKey(still)}`)
    expect(storedStillUrl({ ...base, still, shellColor: 'gold' })).toBeNull()
    expect(storedStillUrl(base)).toBeNull()
  })

  it('reads the size of a WebP and rejects other bytes', () => {
    expect(webpSize(webp(256, 256))).toEqual({ width: 256, height: 256 })
    expect(webpSize(new Uint8Array(64))).toBeNull()
  })
})

describe('saveAvatarStillHandler', () => {
  async function run(image: string, row: Record<string, unknown> | undefined, upload = vi.fn(async () => {})) {
    const set = vi.fn(() => ({ where: vi.fn(async () => {}) }))
    const db = {
      select: () => ({ from: () => ({ where: () => ({ limit: async () => (row ? [row] : []) }) }) }),
      update: () => ({ set }),
    }
    const { saveAvatarStillHandler } = await import('./server/avatar-still')
    const result = await saveAvatarStillHandler({ data: { image }, context: { user: { sub: 'u1' }, db: db as never } }, upload)
    return { result, upload, set }
  }

  it('stores a portrait under the name other members will look for', async () => {
    const worn = STARTER_CHARACTER_EQUIPMENT
    const { result, upload, set } = await run(dataUrl(webp(STORED_STILL_PX, STORED_STILL_PX)), { avatarConfig: base, equipmentVersion: 1, equippedAppearance: worn })
    // What a list is sent for this member: the saved character plus the gear they wear.
    const sent = { ...base, equipment: worn } as LobsterAvatarConfig
    expect(result.still).toBe(avatarStillHash(sent))
    expect(upload).toHaveBeenCalledWith(expect.objectContaining({ key: storedStillKey(result.still!), contentType: 'image/webp' }))
    expect(set).toHaveBeenCalled()
    expect(storedStillUrl({ ...sent, still: result.still! })).not.toBeNull()
  })

  it('refuses anything that is not a square portrait of the right size', async () => {
    for (const image of [dataUrl(webp(512, 512)), dataUrl(new Uint8Array(64)), 'data:image/png;base64,AAAA']) {
      const { result, upload } = await run(image, { avatarConfig: base, equipmentVersion: 0, equippedAppearance: {} })
      expect(result).toEqual({ still: null, reason: 'not-an-image' })
      expect(upload).not.toHaveBeenCalled()
    }
  })

  it('leaves the character alone when storage is unavailable or nothing changed', async () => {
    const failing = vi.fn(async () => {
      throw new Error('no bucket')
    })
    const down = await run(dataUrl(webp(256, 256)), { avatarConfig: base, equipmentVersion: 0, equippedAppearance: {} }, failing)
    expect(down.result).toEqual({ still: null, reason: 'storage-unavailable' })
    expect(down.set).not.toHaveBeenCalled()
    const still = avatarStillHash(base)!
    const same = await run(dataUrl(webp(256, 256)), { avatarConfig: { ...base, still }, equipmentVersion: 0, equippedAppearance: {} })
    expect(same.result.still).toBe(still)
    expect(same.upload).not.toHaveBeenCalled()
  })
})
