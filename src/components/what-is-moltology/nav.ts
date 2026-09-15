export type WhatIsMoltologyNavId = 'overview' | 'beliefs' | 'quotes' | 'sacraments'

export interface WhatIsMoltologyNavItem {
  id: WhatIsMoltologyNavId
  label: string
  path: string
  description: string
}

export const WHAT_IS_MOLTOLOGY_NAV: WhatIsMoltologyNavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    path: '/what-is-moltology',
    description: 'What Moltology is, and why the shell endures.',
  },
  {
    id: 'beliefs',
    label: 'Beliefs & Codes',
    path: '/what-is-moltology/beliefs',
    description: 'The Three Truths, living practices, and community codes.',
  },
  {
    id: 'quotes',
    label: 'What Moltologists Say',
    path: '/what-is-moltology/what-moltologists-say',
    description: 'Voices from the trench — warm, armored, and still soft at the start.',
  },
  {
    id: 'sacraments',
    label: 'Benthic Sacraments',
    path: '/what-is-moltology/benthic-sacraments',
    description: 'The four rites that turn melt into molt.',
  },
]

export function resolveWhatIsMoltologyNavId(pathname: string): WhatIsMoltologyNavId {
  if (pathname.startsWith('/what-is-moltology/beliefs')) return 'beliefs'
  if (pathname.startsWith('/what-is-moltology/what-moltologists-say')) return 'quotes'
  if (pathname.startsWith('/what-is-moltology/benthic-sacraments')) return 'sacraments'
  return 'overview'
}
