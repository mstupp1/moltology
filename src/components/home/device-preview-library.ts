/**
 * Shared by the homepage and mockups:capture; each sector always has both device sizes.
 * `focus` is the part of the desktop capture the homepage frame zooms into, as fractions of the
 * capture (left, top, width), so the text is close to its real size instead of a shrunken page.
 */
export const DEVICE_PREVIEW_LIBRARY = [
  { id: 'dashboard', label: 'Dashboard', route: '/dashboard', alt: 'The Moltology dashboard, with daily modules, lectures and community news', caption: 'Your dashboard: today’s modules, lectures and news.', focus: { x: 0.185, y: 0.04, w: 0.8 } },
  { id: 'forum', label: 'Community', route: '/forum', alt: 'The community boards and latest posts', caption: 'The community boards, where members compare notes on every stage.', focus: { x: 0.185, y: 0.02, w: 0.8 } },
  { id: 'oracle', label: 'Oracle', route: '/oracle', alt: 'A new conversation with the Oracle', caption: 'Ask the Oracle for a plan, a nudge or a straight answer.', focus: { x: 0.25, y: 0.12, w: 0.68 } },
  { id: 'moltmax', label: 'Moltmax', route: '/moltmax', alt: 'A Moltmax diagnostic question with answers to choose from', caption: 'The Moltmax diagnostic shows how your focus holds up under noise.', focus: { x: 0.12, y: 0.13, w: 0.76 } },
  { id: 'market', label: 'Market', route: '/market', alt: 'The Benthic Market catalog', caption: 'The Benthic Market, for cosmetics and extras.', focus: { x: 0.185, y: 0.04, w: 0.8 } },
  { id: 'codex', label: 'Codex', route: '/codex', alt: 'The Benthic Codex scripture library', caption: 'The Codex, the library of Moltology scripture.', focus: { x: 0.185, y: 0.04, w: 0.8 } },
] as const

export type DevicePreview = (typeof DEVICE_PREVIEW_LIBRARY)[number]

export function devicePreviewPath(id: string, device: 'desktop' | 'mobile', small = false) {
  return `/images/marketing/${id}_${device}_preview${small ? '_sm' : ''}.webp`
}
