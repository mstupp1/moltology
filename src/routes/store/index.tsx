import { createFileRoute } from '@tanstack/react-router'
import { StoreCatalog } from '@/components/store/StoreCatalog'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

type StoreSearch = {
  category?: string
  checkout?: 'success' | 'cancel'
}

export const Route = createFileRoute('/store/')({
  validateSearch: (search: Record<string, unknown>): StoreSearch => {
    const category = typeof search.category === 'string' && search.category.trim() ? search.category.trim() : undefined
    const checkout = search.checkout === 'success' || search.checkout === 'cancel' ? search.checkout : undefined
    return { category, checkout }
  },
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: [
      ...privatePageSeo({
        title: 'Store | Moltology',
        description: 'Shirts, mugs, and stickers. Payment happens on Stripe.',
      }),
    ],
  }),
  component: StoreIndexPage,
})

function StoreIndexPage() {
  const search = Route.useSearch()
  return <StoreCatalog category={search.category} checkout={search.checkout} />
}
