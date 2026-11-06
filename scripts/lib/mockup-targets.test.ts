import { describe, expect, it } from 'vitest'
import { REGISTERED_TARGETS, DEFAULT_CAPTURE_TARGETS } from './mockup-targets'
import { DEVICE_PREVIEW_LIBRARY, devicePreviewPath } from '../../src/components/home/device-preview-library'

describe('marketing capture registry', () => {
  it('captures matched desktop/mobile variants for every homepage sector', () => {
    for (const sector of DEVICE_PREVIEW_LIBRARY) {
      for (const device of ['desktop', 'mobile'] as const) {
        const target = REGISTERED_TARGETS[`${sector.id}_${device}`]
        expect(target.route).toBe(sector.route)
        expect(target.isMobile).toBe(device === 'mobile')
        expect(target.windowSize).toBe(device === 'mobile' ? '390,844' : '1760,1100')
        expect(target.scaleFactor).toBe(device === 'mobile' ? 3 : 2)
        expect(devicePreviewPath(sector.id, device)).toBe(`/images/marketing/${target.outputBase}.webp`)
        expect(devicePreviewPath(sector.id, device, true)).toBe(`/images/marketing/${target.outputBase}_sm.webp`)
      }
    }
  })
  it('includes matched Character Studio captures in the default library', () => {
    expect(DEFAULT_CAPTURE_TARGETS.some((target) => target.name === 'chassis_desktop')).toBe(true)
    expect(DEFAULT_CAPTURE_TARGETS.some((target) => target.name === 'chassis_mobile')).toBe(true)
  })
  it('preserves all four homepage feature captures with main-area framing', () => {
    for (const id of ['dashboard', 'forum', 'oracle', 'moltmax']) {
      expect(REGISTERED_TARGETS[`${id}_feature`].route).toBe(`/${id}?view=main`)
    }
  })
})

describe('mockup source map', () => {
  it('lists existing source paths for every homepage sector', async () => {
    const fs = await import('node:fs')
    const { MOCKUP_SOURCES, SHARED_MOCKUP_SOURCES } = await import('./mockup-targets')
    for (const sector of DEVICE_PREVIEW_LIBRARY) {
      expect(MOCKUP_SOURCES[sector.id]?.length).toBeGreaterThan(0)
      for (const source of MOCKUP_SOURCES[sector.id]) expect(fs.existsSync(source), source).toBe(true)
    }
    for (const source of SHARED_MOCKUP_SOURCES) expect(fs.existsSync(source), source).toBe(true)
  })
})
