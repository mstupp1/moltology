import { createFileRoute } from '@tanstack/react-router'
import { ProductDetail } from '@/components/store/ProductDetail'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

export const Route = createFileRoute('/store/$slug')({
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: [
      ...privatePageSeo({
        title: 'Store | Moltology',
        description: 'Piece details, sizes, and checkout.',
      }),
    ],
  }),
  component: StoreProductPage,
})

function StoreProductPage() {
  const { slug } = Route.useParams()
  return <ProductDetail slug={slug} />
}
