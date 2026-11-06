import { useEffect, useRef } from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { hasStoredGuestProgress } from '@/lib/guest-progress-key'

/**
 * Saves a Moltmax audit taken as a guest to the account that signs in on this browser.
 * Daily Alignment ticks are claimed by the alignment provider in the app.
 */
export function GuestProgressClaimer() {
  const session = useAuthSession()
  const toast = useOptionalToast()?.toast
  const toastRef = useRef(toast)
  toastRef.current = toast
  const claimedFor = useRef<string | null>(null)
  const userId = session.userId

  useEffect(() => {
    if (!userId || claimedFor.current === userId || !hasStoredGuestProgress()) return
    claimedFor.current = userId
    void import('@/lib/guest-progress-claim')
      .then(({ claimGuestAudit }) => claimGuestAudit())
      .then((outcome) => {
        if (outcome !== 'saved') return
        toastRef.current?.success('Your Moltmax audit is saved to your profile.', {
          id: 'guest-audit-claimed',
          action: { label: 'View', href: '/profile' },
        })
      })
      .catch((err) => {
        // Leave the stored audit in place; the next signed-in visit tries again.
        claimedFor.current = null
        console.warn('[GuestProgressClaimer] Could not save the guest audit:', err)
      })
  }, [userId])

  return null
}
