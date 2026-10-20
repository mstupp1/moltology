import { getStoreAccessFn } from '@/lib/server/merch-api'
import { createFileRoute } from '@tanstack/react-router'
import { ProductDetail } from '@/components/store/ProductDetail'
import { privatePageSeo, seo, xRobotsNoindexHeaders } from '@/lib/seo'

export const Route = createFileRoute('/store/$slug')({
  loader: () => getStoreAccessFn(),
  headers: ({ loaderData }) => loaderData?.indexingEnabled ? {} : xRobotsNoindexHeaders(),
  head: ({ loaderData }) => ({
    meta: [
      ...(loaderData?.indexingEnabled ? seo : privatePageSeo)({
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
