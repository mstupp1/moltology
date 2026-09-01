import React from 'react'

export function PublicHeaderAuthSkeleton({
  isCorporate,
  layout,
}: {
  isCorporate: boolean
  layout: 'desktop' | 'mobile'
}) {
  if (layout === 'desktop') {
    return (
      <div className="flex items-center gap-2.5" data-testid="public-header-auth-skeleton">
        <div className={`h-8 w-16 rounded-md ${isCorporate ? 'bg-slate-200/70' : 'bg-white/[0.05] border border-white/[0.08]'} animate-pulse`} />
        <div className={`h-8 w-24 rounded-md ${isCorporate ? 'bg-sky-200/70' : 'bg-white/[0.05] border border-white/[0.08]'} animate-pulse`} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5 pt-1" data-testid="public-header-mobile-auth-skeleton">
      <div className={`h-11 w-full rounded-xl ${isCorporate ? 'bg-slate-200/70' : 'bg-white/[0.05] border border-white/[0.08]'} animate-pulse`} />
      <div className={`h-11 w-full rounded-xl ${isCorporate ? 'bg-sky-200/70' : 'bg-white/[0.05] border border-white/[0.08]'} animate-pulse`} />
    </div>
  )
}
