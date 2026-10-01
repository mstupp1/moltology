import { createFileRoute } from '@tanstack/react-router'
import { StoreShell } from '@/components/store/StoreShell'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

export const Route = createFileRoute('/store')({
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: [
      ...privatePageSeo({
        title: 'Store | Moltology',
        description: 'Shirts, mugs, and stickers. Payment happens on Stripe.',
      }),
    ],
  }),
  component: StoreShell,
})
