import { getStoreAccessFn } from '@/lib/server/merch-api'
import { createFileRoute } from '@tanstack/react-router'
import { StoreShell } from '@/components/store/StoreShell'
import { privatePageSeo, seo, xRobotsNoindexHeaders } from '@/lib/seo'

export const Route = createFileRoute('/store')({
  loader: () => getStoreAccessFn(),
  headers: ({ loaderData }) => loaderData?.indexingEnabled ? {} : xRobotsNoindexHeaders(),
  head: ({ loaderData }) => ({
    meta: [
      ...(loaderData?.indexingEnabled ? seo : privatePageSeo)({
        title: 'Store | Moltology',
        description: 'Shirts, mugs, and stickers. Payment happens on Stripe.',
      }),
    ],
  }),
  component: StoreShell,
})
