import type React from 'react'
import type { BenefitPage } from '@/lib/benefits/types'

export interface BenefitKitProps {
  page: BenefitPage
  /** Opens the sign-up modal. */
  onJoin: () => void
  /** The reveal. Kits render it last inside their <main>. */
  children?: React.ReactNode
}

/** Where the quiz, demo and about links go, so every kit points at the same places. */
export const BENEFIT_LINKS = {
  quiz: '/moltmax',
  demo: '/dashboard',
  about: '/what-is-moltology',
  hub: '/benefits',
} as const
