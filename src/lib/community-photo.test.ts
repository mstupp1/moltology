import { describe, expect, it, vi } from 'vitest'
import { profiles } from '../db/schema'
import { arrangeGroup, castHash, photoDue, photoKey, photoPose, PHOTO_HEIGHT, PHOTO_WIDTH, RETAKE_AFTER_MS, ROW_SIZE, rowSizes, type Figure } from './community-photo'
import type { LobsterAvatarConfig } from './lobster-avatar'

const crab: LobsterAvatarConfig = { style: 'critters', seed: 'a', race: 'crab', shellColor: 'cobalt' }
const lobster: LobsterAvatarConfig = { style: 'critters', seed: 'b', race: 'lobster', shellColor: 'gold' }

function webp(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(64)
  bytes.set([...'RIFF'].map((c) => c.charCodeAt(0)), 0)
  bytes.set([...'WEBPVP8X'].map((c) => c.charCodeAt(0)), 8)
  bytes.set([(width - 1) & 255, ((width - 1) >> 8) & 255, ((width - 1) >> 16) & 255, (height - 1) & 255, ((height - 1) >> 8) & 255, 0], 24)
  return bytes
}
const dataUrl = (bytes: Uint8Array) => `data:image/webp;base64,${Buffer.from(bytes).toString('base64')}`

/** A cast of figures with varied sizes, like real characters (heights 1.6 to 2.6). */
function figures(n: number): Figure[] {
  return Array.from({ length: n }, (_, i) => {
    const height = 1.6 + ((i * 37) % 11) / 10
    return { id: `m${i}`, height, width: 1.3 + ((i * 17) % 7) / 10, face: height * 0.72, head: 0.32 }
  })
}

describe('group photo arrangement', () => {
  it('keeps everyone in rows of at most ROW_SIZE', () => {
    for (const n of [1, 5, 8, 9, 17, 22, 48]) {
      const sizes = rowSizes(n)
      expect(sizes.reduce((a, b) => a + b, 0)).toBe(n)
      for (const size of sizes) expect(size).toBeLessThanOrEqual(ROW_SIZE)
      expect(arrangeGroup(figures(n))).toHaveLength(n)
    }
    expect(arrangeGroup([])).toEqual([])
  })

  it('puts the shortest in front and the tallest behind, on higher steps', () => {
    const cast = figures(22)
    const spots = arrangeGroup(cast)
    const rows = Math.max(...spots.map((s) => s.row)) + 1
    for (let row = 1; row < rows; row++) {
      const front = cast.filter((_, i) => spots[i].row === row - 1)
      const back = cast.filter((_, i) => spots[i].row === row)
      expect(Math.max(...front.map((f) => f.height))).toBeLessThanOrEqual(Math.min(...back.map((f) => f.height)))
      const y = (r: number) => spots.find((s) => s.row === r)!.y
      expect(y(row)).toBeGreaterThan(y(row - 1))
    }
  })

  it('stands the tallest of a row in its middle', () => {
    const cast = figures(8)
    const spots = arrangeGroup(cast)
    const tallest = cast.reduce((a, b) => (b.height > a.height ? b : a))
    const middle = Math.min(...spots.map((s) => Math.abs(s.x)))
    expect(Math.abs(spots[cast.indexOf(tallest)].x)).toBeCloseTo(middle, 6)
  })

  it('squeezes neighbours in a little, but not on top of each other', () => {
    const cast = figures(8)
    const spots = arrangeGroup(cast)
    const order = cast.map((f, i) => ({ f, x: spots[i].x })).sort((a, b) => a.x - b.x)
    for (let i = 1; i < order.length; i++) {
      const gap = order[i].x - order[i - 1].x
      const room = (order[i].f.width + order[i - 1].f.width) / 2
      expect(gap).toBeLessThan(room)
      expect(gap).toBeGreaterThan(room * 0.6)
    }
  })

  it('keeps back-row faces clear of the heads in front', () => {
    const cast = figures(22)
    const spots = arrangeGroup(cast)
    cast.forEach((back, i) => {
      if (spots[i].row === 0) return
      const faceY = spots[i].y + back.face
      cast.forEach((front, j) => {
        if (spots[j].row !== spots[i].row - 1) return
        if (Math.abs(spots[j].x - spots[i].x) > front.head) return
        // Directly behind a head, the face is lifted over it (allowing for the camera looking down).
        expect(faceY + 0.35).toBeGreaterThan(spots[j].y + front.height - back.head)
      })
    })
  })

  it('is the same every time for the same cast', () => {
    expect(arrangeGroup(figures(12))).toEqual(arrangeGroup(figures(12)))
  })

  it('gives each member the same pose every time', () => {
    expect(photoPose('member-1')).toBe(photoPose('member-1'))
  })
})

describe('when the photo is retaken', () => {
  const now = Date.parse('2026-11-14T12:00:00Z')

  it('changes the cast hash when someone joins or changes their look', () => {
    const one = castHash([{ id: 'a', config: crab }])
    expect(castHash([{ id: 'a', config: { ...crab, pose: 'think' } }])).toBe(one)
    expect(castHash([{ id: 'a', config: { ...crab, shellColor: 'gold' } }])).not.toBe(one)
    expect(castHash([{ id: 'a', config: crab }, { id: 'b', config: lobster }])).not.toBe(one)
  })

  it('is due when there is no photo, or the cast changed and the photo is old enough', () => {
    expect(photoDue(null, 'h', now)).toBe(true)
    expect(photoDue({ castHash: 'h', takenAt: new Date(now - 10 * RETAKE_AFTER_MS) }, 'h', now)).toBe(false)
    expect(photoDue({ castHash: 'old', takenAt: new Date(now - RETAKE_AFTER_MS / 2) }, 'h', now)).toBe(false)
    expect(photoDue({ castHash: 'old', takenAt: new Date(now - RETAKE_AFTER_MS) }, 'h', now)).toBe(true)
  })
})

describe('community photo server', () => {
  const members = [
    { id: 'a', handle: 'Ada', larvaId: 'LARVA UNIT #1', avatarConfig: crab, equipmentVersion: 0, equippedAppearance: {} },
    { id: 'b', handle: null, larvaId: 'LARVA UNIT #2', avatarConfig: lobster, equipmentVersion: 0, equippedAppearance: {} },
  ]

  function fakeDb(photo: Record<string, unknown> | null) {
    const upsert = vi.fn()
    const db = {
      select: () => ({
        from: (table: unknown) => ({
          where: () =>
            table === profiles
              ? { orderBy: () => ({ limit: async () => members }) }
              : { limit: async () => (photo ? [photo] : []) },
        }),
      }),
      insert: () => ({ values: (v: unknown) => ({ onConflictDoUpdate: async (u: unknown) => upsert(v, u) }) }),
    }
    return { db: db as never, upsert }
  }

  it('sends the cast only when a retake is due, and names the faces in the photo', async () => {
    const { getCommunityPhotoHandler, loadCast } = await import('./server/community-photo')
    const cast = await loadCast(fakeDb(null).db)
    expect(cast.map((m) => [m.name, m.profile])).toEqual([
      ['Ada', 'Ada'],
      ['LARVA UNIT #2', 'b'],
    ])
    const hash = castHash(cast)

    const empty = await getCommunityPhotoHandler(undefined, fakeDb(null).db)
    expect(empty).toMatchObject({ photo: null, due: true, castHash: hash })
    expect(empty.cast).toHaveLength(2)

    const current = { castHash: hash, imageKey: photoKey(hash), width: PHOTO_WIDTH, height: PHOTO_HEIGHT, takenAt: new Date(), spots: [{ id: 'a', x: 0.3, y: 0.4, r: 0.03 }, { id: 'gone', x: 0.6, y: 0.4, r: 0.03 }] }
    const fresh = await getCommunityPhotoHandler(undefined, fakeDb(current).db)
    expect(fresh.due).toBe(false)
    expect(fresh.cast).toBeUndefined()
    expect(fresh.photo?.url).toBe(`/media/${photoKey(hash)}`)
    // A member who has gone is no longer named.
    expect(fresh.photo?.spots).toEqual([{ id: 'a', x: 0.3, y: 0.4, r: 0.03, name: 'Ada', profile: 'Ada' }])
  })

  it('stores a photo only for the cast it shows, while a retake is due', async () => {
    const { saveCommunityPhotoHandler, loadCast } = await import('./server/community-photo')
    const hash = castHash(await loadCast(fakeDb(null).db))
    const image = dataUrl(webp(PHOTO_WIDTH, PHOTO_HEIGHT))
    const spots = [{ id: 'a', x: 0.3, y: 0.4, r: 0.03 }, { id: 'b', x: 0.6, y: 0.4, r: 0.03 }]
    const context = { user: { sub: 'a' } }

    const ok = fakeDb(null)
    const upload = vi.fn(async () => {})
    expect(await saveCommunityPhotoHandler({ data: { castHash: hash, image, spots }, context }, upload, ok.db)).toEqual({ saved: true })
    expect(upload).toHaveBeenCalledWith(expect.objectContaining({ key: photoKey(hash), contentType: 'image/webp' }))
    expect(ok.upsert).toHaveBeenCalled()

    const save = (data: Parameters<typeof saveCommunityPhotoHandler>[0]['data'], photo: Record<string, unknown> | null = null) =>
      saveCommunityPhotoHandler({ data, context }, vi.fn(async () => {}), fakeDb(photo).db)
    expect(await save({ castHash: 'other', image, spots })).toEqual({ saved: false, reason: 'cast-changed' })
    expect(await save({ castHash: hash, image, spots }, { castHash: hash, takenAt: new Date() })).toEqual({ saved: false, reason: 'not-due' })
    expect(await save({ castHash: hash, image: dataUrl(webp(256, 256)), spots })).toEqual({ saved: false, reason: 'not-an-image' })
    expect(await save({ castHash: hash, image, spots: [spots[0], { ...spots[1], id: 'stranger' }] })).toEqual({ saved: false, reason: 'bad-spots' })
    expect(await save({ castHash: hash, image, spots: [spots[0], { ...spots[1], x: 4 }] })).toEqual({ saved: false, reason: 'bad-spots' })

    await expect(saveCommunityPhotoHandler({ data: { castHash: hash, image, spots }, context: {} }, upload, ok.db)).rejects.toThrow(/Unauthenticated/)
  })
})
