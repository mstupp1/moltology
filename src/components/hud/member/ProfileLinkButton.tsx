import React from 'react'
import { Link as LinkIcon } from 'lucide-react'
import { HudButton } from '@/components/ui/HudButton'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { profileSharePath } from '@/lib/referrals'

export function ProfileLinkButton({ userId }: { userId: string }) {
  const toast = useOptionalToast()?.toast
  return (
    <HudButton type="button" variant="secondary" size="sm" icon={<LinkIcon className="w-3.5 h-3.5" />}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(new URL(profileSharePath(userId), window.location.origin).href)
          toast?.success('Profile link copied. Your friend can open it to send you a friend request.')
        } catch {
          toast?.error('Could not copy the profile link. Please try again.')
        }
      }}>
      Copy profile link
    </HudButton>
  )
}
