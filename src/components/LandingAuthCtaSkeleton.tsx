import React from 'react'

export type LandingAuthCtaVariant = 'hero' | 'bottom'

export function LandingAuthCtaSkeleton({ variant }: { variant: LandingAuthCtaVariant }) {
  return (
    <div
      className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto${variant === 'hero' ? ' min-h-[114px] sm:min-h-[54px]' : ''}`}
      data-testid={`${variant}-auth-skeleton`}
    >
      <div className="w-full sm:w-[220px] min-h-[50px] sm:min-h-[54px] rounded-xl bg-white/[0.04] border border-white/[0.08] animate-pulse" />
      <div className="w-full sm:w-[180px] min-h-[50px] sm:min-h-[54px] rounded-xl bg-white/[0.04] border border-white/[0.08] animate-pulse" />
    </div>
  )
}
