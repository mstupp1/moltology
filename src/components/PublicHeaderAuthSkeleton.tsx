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
        <div className={`h-8 w-16 rounded-control ${isCorporate ? 'bg-slate-200/70' : 'bg-surface-1 border border-line-subtle'} animate-pulse`} />
        <div className={`h-8 w-24 rounded-control ${isCorporate ? 'bg-sky-200/70' : 'bg-surface-1 border border-line-subtle'} animate-pulse`} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5 pt-1" data-testid="public-header-mobile-auth-skeleton">
      <div className={`h-11 w-full rounded-control ${isCorporate ? 'bg-slate-200/70' : 'bg-surface-1 border border-line-subtle'} animate-pulse`} />
      <div className={`h-11 w-full rounded-control ${isCorporate ? 'bg-sky-200/70' : 'bg-surface-1 border border-line-subtle'} animate-pulse`} />
    </div>
  )
}
