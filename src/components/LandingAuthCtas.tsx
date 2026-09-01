/**
 * Session-aware CTA clusters for the landing page.
 * Lazy-loaded so Neon Auth stays out of the landing first-paint graph.
 */
import React from 'react'
import { ArrowRight, Cpu, UserPlus } from 'lucide-react'
import { BenthicCTAButton } from '@/components/hud/BenthicCTAButton'
import type { LandingAuthCtaVariant } from '@/components/LandingAuthCtaSkeleton'
import { useAuthSession } from '@/hooks/useAuthSession'

export type { LandingAuthCtaVariant }

export interface LandingAuthCtasProps {
  variant: LandingAuthCtaVariant
  onNavigate: (path: string) => void
  onOpenAuth: (mode: 'login' | 'signup') => void
}

export function LandingAuthCtas({ variant, onNavigate, onOpenAuth }: LandingAuthCtasProps) {
  const session = useAuthSession()
  const user = session.user
  const isSessionPending = session.isPending

  if (variant === 'hero') {
    if (user) {
      return (
        <BenthicCTAButton
          size="lg"
          variant="cyan"
          containerClassName="w-full sm:w-auto"
          className="w-full sm:w-auto min-h-[50px] sm:min-h-[54px] text-xs sm:text-sm px-6 sm:px-8 tracking-wider"
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

    if (isSessionPending) {
      return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto min-h-[114px] sm:min-h-[54px]" data-testid="hero-auth-skeleton">
          <div className="w-full sm:w-[220px] min-h-[50px] sm:min-h-[54px] rounded-xl bg-white/[0.04] border border-white/[0.08] animate-pulse" />
          <div className="w-full sm:w-[180px] min-h-[50px] sm:min-h-[54px] rounded-xl bg-white/[0.04] border border-white/[0.08] animate-pulse" />
        </div>
      )
    }

    return (
      <>
        <BenthicCTAButton
          size="lg"
          containerClassName="w-full sm:w-auto"
          className="w-full sm:w-auto min-h-[50px] sm:min-h-[54px] text-xs sm:text-sm px-6 sm:px-8 tracking-wider"
          onClick={() => onOpenAuth('signup')}
        >
          <span className="flex items-center justify-center gap-2.5 leading-none">
            <span>INITIATE ASCENSION</span>
            <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
          </span>
        </BenthicCTAButton>
        <BenthicCTAButton
          size="lg"
          variant="cyan"
          containerClassName="w-full sm:w-auto"
          className="w-full sm:w-auto min-h-[50px] sm:min-h-[54px] text-xs sm:text-sm px-6 sm:px-8 tracking-wider"
          onClick={() => onNavigate('/dashboard')}
        >
          <span className="flex items-center justify-center gap-2.5 leading-none">
            <Cpu className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
            <span>TRY GUEST DEMO</span>
          </span>
        </BenthicCTAButton>
      </>
    )
  }

  if (variant === 'pillars') {
    if (user) {
      return (
        <BenthicCTAButton
          size="lg"
          variant="cyan"
          containerClassName="w-full sm:w-auto"
          className="w-full sm:w-auto min-h-[50px] sm:min-h-[54px] text-xs sm:text-sm px-6 sm:px-8 tracking-wider"
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

    if (isSessionPending) {
      return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto" data-testid="pillars-auth-skeleton">
          <div className="w-full sm:w-[220px] min-h-[50px] sm:min-h-[54px] rounded-xl bg-white/[0.04] border border-white/[0.08] animate-pulse" />
          <div className="w-full sm:w-[180px] min-h-[50px] sm:min-h-[54px] rounded-xl bg-white/[0.04] border border-white/[0.08] animate-pulse" />
        </div>
      )
    }

    return (
      <>
        <BenthicCTAButton
          size="lg"
          containerClassName="w-full sm:w-auto"
          className="w-full sm:w-auto min-h-[50px] sm:min-h-[54px] text-xs sm:text-sm px-6 sm:px-8 tracking-wider"
          onClick={() => onOpenAuth('signup')}
        >
          <span className="flex items-center justify-center gap-2.5 leading-none">
            <UserPlus className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
            <span>SIGN UP TODAY (FREE)</span>
            <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
          </span>
        </BenthicCTAButton>
        <BenthicCTAButton
          size="lg"
          variant="cyan"
          containerClassName="w-full sm:w-auto"
          className="w-full sm:w-auto min-h-[50px] sm:min-h-[54px] text-xs sm:text-sm px-6 sm:px-8 tracking-wider"
          onClick={() => onNavigate('/dashboard')}
        >
          <span className="flex items-center justify-center gap-2.5 leading-none">
            <Cpu className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
            <span>TRY THE DEMO NOW</span>
          </span>
        </BenthicCTAButton>
      </>
    )
  }

  // bottom
  if (user) {
    return (
      <BenthicCTAButton
        size="lg"
        variant="cyan"
        containerClassName="w-full sm:w-auto"
        className="w-full sm:w-auto min-h-[50px] sm:min-h-[54px] text-xs sm:text-sm px-8 sm:px-10 tracking-wider"
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

  if (isSessionPending) {
    return (
      <div className="flex items-center justify-center w-full sm:w-auto" data-testid="bottom-auth-skeleton">
        <div className="w-full sm:w-[240px] min-h-[50px] sm:min-h-[54px] rounded-xl bg-white/[0.04] border border-white/[0.08] animate-pulse" />
      </div>
    )
  }

  return (
    <BenthicCTAButton
      size="lg"
      containerClassName="w-full sm:w-auto"
      className="w-full sm:w-auto min-h-[50px] sm:min-h-[54px] text-xs sm:text-sm px-8 sm:px-10 tracking-wider"
      onClick={() => onOpenAuth('signup')}
    >
      <span className="flex items-center justify-center gap-2.5 leading-none">
        <span>INITIATE ASCENSION</span>
        <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
      </span>
    </BenthicCTAButton>
  )
}
