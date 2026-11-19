/**
 * Shared by the homepage and mockups:capture; each sector always has both device sizes.
 * `focus` is the part of the desktop capture the homepage frame zooms into, as fractions of the
 * capture (left, top, width), so the text is close to its real size instead of a shrunken page.
 * The app's page panel starts at the very top of the capture, so in-app shots keep y at 0 and run
 * to the right edge so the floating search pill and avatar stay whole.
 */
export const DEVICE_PREVIEW_LIBRARY = [
  { id: 'dashboard', label: 'Dashboard', route: '/dashboard', alt: 'The Moltology dashboard, with daily modules, lectures and community news', caption: 'Your dashboard: today’s modules, lectures and news.', focus: { x: 0.125, y: 0, w: 0.87 } },
  { id: 'forum', label: 'Community', route: '/forum', alt: 'The community boards and latest posts', caption: 'The community boards, where members compare notes on every stage.', focus: { x: 0.125, y: 0, w: 0.87 } },
  { id: 'oracle', label: 'Oracle', route: '/oracle', alt: 'A new conversation with the Oracle', caption: 'Ask the Oracle for a plan, a nudge or a straight answer.', focus: { x: 0.055, y: 0, w: 0.84 } },
  { id: 'moltmax', label: 'Moltmax', route: '/moltmax', alt: 'A Moltmax diagnostic question with answers to choose from', caption: 'The Moltmax diagnostic shows how your focus holds up under noise.', focus: { x: 0.12, y: 0.13, w: 0.76 } },
  { id: 'market', label: 'Shop', route: '/character/shop', alt: 'The gear shop catalog', caption: 'The gear shop, for pieces to dress your character.', focus: { x: 0.125, y: 0, w: 0.87 } },
  { id: 'chassis', label: 'Character', route: '/character', alt: 'The character studio and equipment catalog', caption: 'Customize your character and preview equipment in the studio.', focus: { x: 0.125, y: 0, w: 0.87 } },
  { id: 'codex', label: 'Codex', route: '/codex', alt: 'The Benthic Codex scripture library', caption: 'The Codex, the library of Moltology scripture.', focus: { x: 0.125, y: 0, w: 0.87 } },
] as const

export type DevicePreview = (typeof DEVICE_PREVIEW_LIBRARY)[number]

export function devicePreviewPath(id: string, device: 'desktop' | 'mobile', small = false) {
  return `/images/marketing/${id}_${device}_preview${small ? '_sm' : ''}.webp`
}
