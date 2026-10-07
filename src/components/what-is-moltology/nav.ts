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
    description: 'The whole story, from the surface to the floor.',
  },
  {
    id: 'beliefs',
    label: 'Beliefs & Codes',
    path: '/what-is-moltology/beliefs',
    description: 'Three truths, a day of practice, and the community codes.',
  },
  {
    id: 'quotes',
    label: 'What Moltologists Say',
    path: '/what-is-moltology/what-moltologists-say',
    description: 'Members at every depth, in their own words.',
  },
  {
    id: 'sacraments',
    label: 'Benthic Sacraments',
    path: '/what-is-moltology/benthic-sacraments',
    description: 'Four rites that turn the melt into a molt.',
  },
]

export function resolveWhatIsMoltologyNavId(pathname: string): WhatIsMoltologyNavId {
  if (pathname.startsWith('/what-is-moltology/beliefs')) return 'beliefs'
  if (pathname.startsWith('/what-is-moltology/what-moltologists-say')) return 'quotes'
  if (pathname.startsWith('/what-is-moltology/benthic-sacraments')) return 'sacraments'
  return 'overview'
}
