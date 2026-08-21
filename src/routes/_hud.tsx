import { createFileRoute } from '@tanstack/react-router'
import { HudLayout } from '@/components/hud/HudLayout'

export const Route = createFileRoute('/_hud')({
  component: HudLayout,
})

