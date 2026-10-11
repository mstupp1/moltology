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
        expect(target.windowSize).toBe(device === 'mobile' ? '540,1170' : '1760,1100')
        expect(target.scaleFactor).toBe(2)
        expect(devicePreviewPath(sector.id, device)).toBe(`/images/marketing/${target.outputBase}.webp`)
        expect(devicePreviewPath(sector.id, device, true)).toBe(`/images/marketing/${target.outputBase}_sm.webp`)
      }
    }
  })
  it('keeps the unavailable Chassis preview out of the default library', () => {
    expect(REGISTERED_TARGETS.chassis_mobile).toBeDefined()
    expect(DEFAULT_CAPTURE_TARGETS.some((target) => target.name.startsWith('chassis_'))).toBe(false)
  })
  it('preserves all four homepage feature captures with main-area framing', () => {
    for (const id of ['dashboard', 'forum', 'oracle', 'moltmax']) {
      expect(REGISTERED_TARGETS[`${id}_feature`].route).toBe(`/${id}?view=main`)
    }
  })
})
