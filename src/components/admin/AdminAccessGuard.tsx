import React from 'react'
import { useHiddenPageAccess } from '@/hooks/useHiddenPageAccess'

export interface AdminAccessGuardProps {
  children: React.ReactNode
  skeleton?: React.ReactNode
}

/**
 * Renders steward tools for admins.
 * Everyone else gets a plain unavailable notice, with no preview of the ledger.
 */
export const AdminAccessGuard: React.FC<AdminAccessGuardProps> = ({ children, skeleton }) => {
  const access = useHiddenPageAccess()

  if (access.pending) {
    return <>{skeleton ?? null}</>
  }

  if (access.canView) {
    return <>{children}</>
  }

  return (
    <div
      data-testid="admin-unavailable"
      className="flex min-h-[50vh] items-center justify-center px-4 py-16 font-sans"
    >
      <div className="max-w-md space-y-3 text-center">
        <h1 className="text-lg font-semibold text-ink">This page is not available</h1>
        <p className="text-sm leading-relaxed text-ink-muted">
          Your account does not have access to this page.
        </p>
        <a
          href="/dashboard"
          className="hud-sheen inline-flex min-h-[44px] items-center justify-center rounded-control border border-line bg-surface-1 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
        >
          Back to Command Hub
        </a>
      </div>
    </div>
  )
}
