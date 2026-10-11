/** Shared by the homepage and mockups:capture; each sector always has both device sizes. */
export const DEVICE_PREVIEW_LIBRARY = [
  { id: 'dashboard', label: 'Dashboard', route: '/dashboard', alt: 'The Moltology dashboard, with daily modules, lectures and community news' },
  { id: 'forum', label: 'Community', route: '/forum', alt: 'The community boards and latest posts' },
  { id: 'oracle', label: 'Oracle', route: '/oracle', alt: 'A new conversation with the Oracle' },
  { id: 'moltmax', label: 'Moltmax', route: '/moltmax', alt: 'A Moltmax diagnostic question with answers to choose from' },
  { id: 'market', label: 'Market', route: '/market', alt: 'The Benthic Market catalog' },
  { id: 'codex', label: 'Codex', route: '/codex', alt: 'The Benthic Codex scripture library' },
] as const

export function devicePreviewPath(id: string, device: 'desktop' | 'mobile', small = false) {
  return `/images/marketing/${id}_${device}_preview${small ? '_sm' : ''}.webp`
}
