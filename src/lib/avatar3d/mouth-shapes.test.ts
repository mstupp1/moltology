import { describe, expect, it } from 'vitest'
import { MOUTH_PARAMS, MOUTH_RELAXED, speechMouthTrack } from './mouth-shapes'

describe('speech mouth track', () => {
  it('is null where nobody speaks and drawn where they do', () => {
    const track = speechMouthTrack('XXDDDDXXXXXXXXXXXXXX', { fps: 30 })
    expect(track[0]).toBeNull()
    expect(track[3]?.open).toBeCloseTo(MOUTH_PARAMS.D.open)
    expect(track[19]).toBeNull()
  })

  it('puts one halfway frame on a big change, and snaps small ones', () => {
    const track = speechMouthTrack('DDDDFFFFEEEE', { fps: 30 })
    const first = track[4]!
    // Wide open to a pucker: halfway between them on the first frame, landed on the next.
    expect(first.width).toBeGreaterThan(MOUTH_PARAMS.F.width)
    expect(first.width).toBeLessThan(MOUTH_PARAMS.D.width)
    expect(track[5]!.width).toBeCloseTo(MOUTH_PARAMS.F.width)
    // A small pucker to a round one is a small change: it snaps.
    expect(track[8]!.open).toBeCloseTo(MOUTH_PARAMS.E.open)
  })

  it('lands lip closes shut on their first frame', () => {
    const track = speechMouthTrack('DDDDAADDDD', { fps: 30 })
    expect(track[4]!.open).toBe(MOUTH_PARAMS.A.open)
    expect(track[4]!.press).toBe(1)
  })

  it('relaxes slightly open in a short pause and eases shut at the end of a line', () => {
    const track = speechMouthTrack('CCCCXXXXCCCCXXXXXXXXXXXXXXXXXX', { fps: 30 })
    expect(track[6]).toEqual(MOUTH_RELAXED)
    // Holds the last shape a beat, then closes over a few frames.
    expect(track[12]!.open).toBeCloseTo(MOUTH_PARAMS.C.open)
    expect(track[14]!.open).toBeLessThan(track[12]!.open)
    expect(track[16]!.open).toBeLessThan(track[14]!.open)
    expect(track[20]).toBeNull()
  })

  it('opens stressed words bigger than little ones', () => {
    const size = [...new Array(6).fill(0.2), ...new Array(6).fill(0.9)]
    const track = speechMouthTrack('CCCCCCCCCCCC', { fps: 30, size })
    expect(track[8]!.open).toBeGreaterThan(track[2]!.open * 1.3)
  })
})
