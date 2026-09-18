import { describe, it, expect, beforeEach } from 'vitest'
import {
  LOBSTER_FULL_BODY_VIEWBOX,
  LOBSTER_PORTRAIT_VIEWBOX,
  generateLobsterAvatarSvg,
  stripSvgSmilAnimation,
} from './lobster-avatar'
import {
  acquireLobsterFullBodyMotion,
  getLobsterFullBodyMotionLeaseCountForTests,
  isLobsterAvatarSlot,
  normalizePortraitSourcePx,
  pickLobsterAvatarSlot,
  portraitSourcePxForCssPx,
  releaseLobsterFullBodyMotion,
  resetLobsterFullBodyMotionForTests,
  resolveLobsterAvatarAssets,
} from './lobster-avatar-slots'

const config = { style: 'critters' as const, seed: 'slot-picker-alpha' }

describe('lobster-avatar-slots', () => {
  beforeEach(() => {
    resetLobsterFullBodyMotionForTests()
  })

  it('ships two portrait source sizes for 64 and 128 CSS px at 2×', () => {
    expect(portraitSourcePxForCssPx(32)).toBe(128)
    expect(portraitSourcePxForCssPx(64)).toBe(128)
    expect(portraitSourcePxForCssPx(65)).toBe(256)
    expect(portraitSourcePxForCssPx(128)).toBe(256)
    expect(normalizePortraitSourcePx(40)).toBe(128)
    expect(normalizePortraitSourcePx(128)).toBe(128)
    expect(normalizePortraitSourcePx(320)).toBe(256)
  })

  it('resolves portraitUrl and fullBody url+kind from config without a crop flag', () => {
    const assets = resolveLobsterAvatarAssets(config, { portraitSize: 128, fullBodySize: 256 })
    expect(assets.portraitUrl).toMatch(/^data:image\/svg\+xml/)
    expect(assets.fullBody).toEqual({
      url: expect.stringMatching(/^data:image\/svg\+xml/),
      kind: 'svg',
    })
    expect(assets.portraitUrl).not.toBe(assets.fullBody?.url)
  })

  it('picks by slot name and never invents an animated crop', () => {
    const assets = resolveLobsterAvatarAssets(config)
    const portrait = pickLobsterAvatarSlot(assets, 'portrait')
    const fullBody = pickLobsterAvatarSlot(assets, 'fullBody')
    expect(portrait).toEqual({ slot: 'portrait', url: assets.portraitUrl })
    expect(fullBody).toEqual({
      slot: 'fullBody',
      url: assets.fullBody?.url,
      kind: 'svg',
    })
    expect(isLobsterAvatarSlot('portrait')).toBe(true)
    expect(isLobsterAvatarSlot('fullBody')).toBe(true)
    expect(isLobsterAvatarSlot('thumbnail')).toBe(false)
  })

  it('returns empty assets when config is missing', () => {
    expect(resolveLobsterAvatarAssets(null)).toEqual({ portraitUrl: null, fullBody: null })
    expect(pickLobsterAvatarSlot({ portraitUrl: null, fullBody: null }, 'portrait')).toBeNull()
    expect(pickLobsterAvatarSlot({ portraitUrl: null, fullBody: null }, 'fullBody')).toBeNull()
  })

  it('generates a dedicated portrait viewBox instead of cropping the full-body frame', () => {
    const portrait = generateLobsterAvatarSvg(config, 128, { frame: 'portrait' })
    const fullBody = generateLobsterAvatarSvg(config, 256, { frame: 'fullBody' })
    expect(portrait).toContain(`viewBox="${LOBSTER_PORTRAIT_VIEWBOX}"`)
    expect(portrait).toContain('data-avatar-slot="portrait"')
    expect(portrait).not.toContain(`viewBox="${LOBSTER_FULL_BODY_VIEWBOX}"`)
    expect(fullBody).toContain(`viewBox="${LOBSTER_FULL_BODY_VIEWBOX}"`)
    expect(fullBody).toContain('data-avatar-slot="fullBody"')
  })

  it('strips SMIL motion from portraits so list faces stay still', () => {
    const portrait = generateLobsterAvatarSvg(
      { ...config, backgroundMotion: 'radar_sweep', patternSparkles: 'radiant', patternPulse: 'pulse' },
      128,
      { frame: 'portrait' }
    )
    expect(portrait).toBeTruthy()
    expect(portrait).not.toMatch(/<animate\b/)
    expect(portrait).not.toMatch(/<animateTransform\b/)
    expect(stripSvgSmilAnimation('<g><animate attributeName="opacity" dur="1s" /></g>')).toBe('<g></g>')
  })

  it('caps the full-body motion lease to one holder', () => {
    expect(acquireLobsterFullBodyMotion()).toBe(true)
    expect(acquireLobsterFullBodyMotion()).toBe(false)
    expect(getLobsterFullBodyMotionLeaseCountForTests()).toBe(1)
    releaseLobsterFullBodyMotion()
    expect(getLobsterFullBodyMotionLeaseCountForTests()).toBe(0)
    expect(acquireLobsterFullBodyMotion()).toBe(true)
  })
})
