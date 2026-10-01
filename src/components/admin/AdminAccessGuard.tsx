import React from 'react'
import { useHiddenPageAccess } from '@/hooks/useHiddenPageAccess'

export interface AdminAccessGuardProps {
  children: React.ReactNode
  skeleton?: React.ReactNode
}

/**
 * Renders steward tools for admins and super admins.
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
        <h1 className="text-lg font-semibold text-[#dfe3e3]">This page is not available</h1>
        <p className="text-sm leading-relaxed text-[#839493]">
          Your account does not have access to this page.
        </p>
        <a
          href="/dashboard"
          className="inline-flex min-h-[44px] items-center justify-center border border-[#3a4a49] bg-[#122028] px-4 py-2 text-sm font-medium text-[#dfe3e3] transition-colors hover:border-[#00c3ff]/60"
        >
          Back to Command Hub
        </a>
      </div>
    </div>
  )
}
