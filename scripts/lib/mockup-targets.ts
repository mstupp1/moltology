import { DEVICE_PREVIEW_LIBRARY } from '../../src/components/home/device-preview-library'

export interface CaptureTarget {
  name: string
  route: string
  windowSize: string
  scaleFactor: number
  isMobile?: boolean
  outputBase: string
}

export const REGISTERED_TARGETS: Record<string, CaptureTarget> = Object.fromEntries(
  [...DEVICE_PREVIEW_LIBRARY, { id: 'chassis', route: '/chassis' }].flatMap((sector) => [
    ...(['desktop', 'mobile'] as const).map((device) => ({
      name: `${sector.id}_${device}`,
      route: sector.route,
      windowSize: device === 'mobile' ? '540,1170' : '1760,1100',
      scaleFactor: 2,
      isMobile: device === 'mobile',
      outputBase: `${sector.id}_${device}_preview`,
    })),
    ...(['dashboard', 'forum', 'oracle', 'moltmax'].includes(sector.id) ? [{
      name: `${sector.id}_feature`, route: `${sector.route}?view=main`,
      windowSize: '1760,1100', scaleFactor: 2, outputBase: `${sector.id}_feature_preview`,
    }] : []),
  ]).map((target) => [target.name, target]),
)


/** Chassis remains explicitly capturable; defaults refresh the usable homepage library. */
export const DEFAULT_CAPTURE_TARGETS = Object.values(REGISTERED_TARGETS).filter((target) =>
  DEVICE_PREVIEW_LIBRARY.some((sector) => target.name.startsWith(`${sector.id}_`)),
)
