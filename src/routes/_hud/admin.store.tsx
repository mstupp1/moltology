import { createFileRoute, redirect } from '@tanstack/react-router'

// Store settings now sit in the Store tab of /admin. vercel.json sends a 301 in production;
// this covers in-app links saved before the move.
export const Route = createFileRoute('/_hud/admin/store')({
  beforeLoad: () => {
    throw redirect({ to: '/admin', search: { tab: 'store' }, hash: 'admin-store-settings', replace: true })
  },
})
