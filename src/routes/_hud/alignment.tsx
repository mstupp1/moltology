import { createFileRoute, redirect } from '@tanstack/react-router'
import { DAILY_ALIGNMENT_HUB_ID } from '@/lib/alignment-tasks'

export const Route = createFileRoute('/_hud/alignment')({
  beforeLoad: () => {
    throw redirect({
      to: '/dashboard',
      hash: DAILY_ALIGNMENT_HUB_ID,
      replace: true,
    })
  },
})
