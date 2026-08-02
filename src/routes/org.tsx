import { createFileRoute } from '@tanstack/react-router'
import { OrgPage } from '@/components/OrgPage'

export const Route = createFileRoute('/org')({
  component: OrgPage,
})
