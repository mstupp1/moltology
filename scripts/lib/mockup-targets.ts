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
  DEVICE_PREVIEW_LIBRARY.flatMap((sector) => [
    ...(['desktop', 'mobile'] as const).map((device) => ({
      name: `${sector.id}_${device}`,
      route: sector.route,
      // Mobile captures use a real phone width so the homepage frame shows them near actual size.
      windowSize: device === 'mobile' ? '390,844' : '1760,1100',
      scaleFactor: device === 'mobile' ? 3 : 2,
      isMobile: device === 'mobile',
      outputBase: `${sector.id}_${device}_preview`,
    })),
    ...(['dashboard', 'forum', 'oracle', 'moltmax'].includes(sector.id) ? [{
      name: `${sector.id}_feature`, route: `${sector.route}?view=main`,
      windowSize: '1760,1100', scaleFactor: 2, outputBase: `${sector.id}_feature_preview`,
    }] : []),
  ]).map((target) => [target.name, target]),
)


/** Default captures cover the complete homepage library. */
export const DEFAULT_CAPTURE_TARGETS = Object.values(REGISTERED_TARGETS).filter((target) =>
  DEVICE_PREVIEW_LIBRARY.some((sector) => target.name.startsWith(`${sector.id}_`)),
)

/**
 * Code each shot depends on, for `npm run mockups:stale`. A commit to any of these after a shot
 * was last captured means the shot may be out of date. Member pages also depend on the app chrome.
 */
export const SHARED_MOCKUP_SOURCES = [
  'src/components/hud/HUDSidebar.tsx',
  'src/components/hud/HUDHeader.tsx',
  'src/components/hud/HUDTaskBar.tsx',
  'src/components/hud/HudLayout.tsx',
  'src/routes/_hud.tsx',
]

export const MOCKUP_SOURCES: Record<string, string[]> = {
  dashboard: [...SHARED_MOCKUP_SOURCES, 'src/routes/_hud/dashboard.tsx', 'src/components/hud/DashboardView.tsx', 'src/components/hud/dashboard/', 'src/components/hud/ConnectionsHubCard.tsx', 'src/components/hud/ForumHubCard.tsx', 'src/components/hud/ActivityStreamPanel.tsx'],
  forum: [...SHARED_MOCKUP_SOURCES, 'src/routes/_hud/forum/', 'src/components/forum/'],
  oracle: [...SHARED_MOCKUP_SOURCES, 'src/routes/_hud/oracle.tsx', 'src/components/ai/', 'src/components/ai-elements/'],
  moltmax: ['src/routes/moltmax.tsx', 'src/components/MoltMaxPage.tsx', 'src/components/moltmax/', 'src/components/PublicHeader.tsx'],
  market: [...SHARED_MOCKUP_SOURCES, 'src/routes/_hud/character_.shop.tsx', 'src/components/hud/market/'],
  chassis: [...SHARED_MOCKUP_SOURCES, 'src/routes/_hud/character.tsx', 'src/components/hud/chassis/', 'src/lib/avatar/'],
  codex: [...SHARED_MOCKUP_SOURCES, 'src/routes/_hud/codex/', 'src/components/codex/', 'src/components/reader/'],
}
