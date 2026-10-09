/**
 * Session-aware CTA clusters for the landing page.
 * Lazy-loaded so Neon Auth stays out of the landing first-paint graph.
 */
import React from 'react'
import { ArrowRight, Cpu } from 'lucide-react'
import { BenthicCTAButton } from '@/components/hud/BenthicCTAButton'
import type { LandingAuthCtaVariant } from '@/components/LandingAuthCtaSkeleton'
import { useAuthSession } from '@/hooks/useAuthSession'

export type { LandingAuthCtaVariant }

export interface LandingAuthCtasProps {
  variant: LandingAuthCtaVariant
  onNavigate: (path: string) => void
  onOpenAuth: (mode: 'login' | 'signup') => void
}

const buttonClass = 'w-full sm:w-auto min-h-[50px] sm:min-h-[54px] text-xs sm:text-sm px-6 sm:px-8 tracking-wider'

/**
 * Members get one way back to their dashboard. Guests get the same pair everywhere on the page:
 * join free, or look around the demo first.
 */
export function LandingAuthCtas({ variant, onNavigate, onOpenAuth }: LandingAuthCtasProps) {
  const session = useAuthSession()
  const user = session.user

  if (user) {
    return (
      <BenthicCTAButton
        size="lg"
        variant="cyan"
        containerClassName="w-full sm:w-auto"
        className={buttonClass}
        onClick={() => onNavigate('/dashboard')}
      >
        <span className="flex items-center justify-center gap-2.5 leading-none">
          <Cpu className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
          <span>ENTER SYSTEM DASHBOARD</span>
          <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
        </span>
      </BenthicCTAButton>
    )
  }

  if (session.isPending) {
    return (
      <div
        className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto${variant === 'hero' ? ' min-h-[114px] sm:min-h-[54px]' : ''}`}
        data-testid={`${variant}-auth-skeleton`}
      >
        <div className="w-full sm:w-[220px] min-h-[50px] sm:min-h-[54px] rounded-control bg-surface-1 border border-line-subtle animate-pulse" />
        <div className="w-full sm:w-[180px] min-h-[50px] sm:min-h-[54px] rounded-control bg-surface-1 border border-line-subtle animate-pulse" />
      </div>
    )
  }

  return (
    <>
      <BenthicCTAButton
        size="lg"
        variant="cyan"
        containerClassName="w-full sm:w-auto"
        className={buttonClass}
        onClick={() => onOpenAuth('signup')}
      >
        <span className="flex items-center justify-center gap-2.5 leading-none">
          <span>JOIN FREE</span>
          <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
        </span>
      </BenthicCTAButton>
      <BenthicCTAButton
        size="lg"
        variant="dark"
        containerClassName="w-full sm:w-auto"
        className={buttonClass}
        onClick={() => onNavigate('/dashboard')}
      >
        <span className="flex items-center justify-center gap-2.5 leading-none">
          <Cpu className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
          <span>TRY THE DEMO</span>
        </span>
      </BenthicCTAButton>
    </>
  )
}
