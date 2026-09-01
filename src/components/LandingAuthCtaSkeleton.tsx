import React from 'react'

export type LandingAuthCtaVariant = 'hero' | 'pillars' | 'bottom'

export function LandingAuthCtaSkeleton({ variant }: { variant: LandingAuthCtaVariant }) {
  if (variant === 'bottom') {
    return (
      <div className="flex items-center justify-center w-full sm:w-auto" data-testid="bottom-auth-skeleton">
        <div className="w-full sm:w-[240px] min-h-[50px] sm:min-h-[54px] rounded-xl bg-white/[0.04] border border-white/[0.08] animate-pulse" />
      </div>
    )
  }

  const testId = variant === 'hero' ? 'hero-auth-skeleton' : 'pillars-auth-skeleton'
  return (
    <div
      className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto${variant === 'hero' ? ' min-h-[114px] sm:min-h-[54px]' : ''}`}
      data-testid={testId}
    >
      <div className="w-full sm:w-[220px] min-h-[50px] sm:min-h-[54px] rounded-xl bg-white/[0.04] border border-white/[0.08] animate-pulse" />
      <div className="w-full sm:w-[180px] min-h-[50px] sm:min-h-[54px] rounded-xl bg-white/[0.04] border border-white/[0.08] animate-pulse" />
    </div>
  )
}
