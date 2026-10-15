import React, { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, ShoppingBag } from 'lucide-react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { MERCH_SHIPPING_COUNTRIES, merchPriceLabel, uniqueVariantLabels, type MerchProductView } from '@/lib/merch'
import { getMerchCatalogFn } from '@/lib/server/merch-api'
import { MerchImage } from './MerchImage'
import { useMerchCart } from './MerchCartProvider'

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

export function StoreCatalog({
  category,
  checkout,
}: {
  category?: string
  checkout?: 'success' | 'cancel'
}) {
  const session = useAuthSession()
  const cart = useMerchCart()
  const [products, setProducts] = useState<MerchProductView[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const consumeCheckoutResult = cart.consumeCheckoutResult
  useEffect(() => {
    consumeCheckoutResult(checkout)
  }, [checkout, consumeCheckoutResult])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const token = await getAuthJWTToken()
        const result = await getMerchCatalogFn({
          data: { token: token ?? undefined, userId: session.userId ?? undefined },
        })
        if (!cancelled) setProducts(result)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error && loadError.message ? loadError.message : 'Could not load the store. Try again.')
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [session.userId])

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const product of products ?? []) counts.set(product.category, (counts.get(product.category) ?? 0) + 1)
    return [...counts.entries()]
  }, [products])

  const visible = useMemo(() => {
    if (!products) return []
    if (!category) return products
    return products.filter((product) => product.category === category)
  }, [category, products])

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-line-subtle pb-6">
        <div className="max-w-2xl">
          <p className="font-grotesk text-xs font-bold tracking-[0.12em] text-cyan-glow">STORE</p>
          <h1 className="mt-2 font-grotesk text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Field Issue</h1>
          <p className="mt-3 text-base leading-relaxed text-ink-body">
            Mugs and tees carrying the Synaptic Path. Each one is printed when you order it.
          </p>
        </div>
        <button
          type="button"
          onClick={() => cart.setOpen(true)}
          className={`inline-flex min-h-10 items-center gap-2 rounded-control border border-line bg-surface-1 px-4 text-sm text-ink hover:border-line-strong hover:bg-surface-2 ${FOCUS}`}
        >
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          Cart
          {cart.count > 0 ? (
            <span className="rounded-chip bg-cyan-glow px-1.5 text-xs font-semibold text-abyss">{cart.count}</span>
          ) : null}
        </button>
      </header>

      <nav className="flex flex-wrap items-baseline justify-between gap-3" aria-label="Categories">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <CategoryLink label="All" count={products?.length} to="/store" active={!category} />
          {categories.map(([name, count]) => (
            <CategoryLink key={name} label={name} count={count} to="/store" search={{ category: name }} active={category === name} />
          ))}
        </div>
        {products ? (
          <p className="text-sm text-ink-muted">
            {visible.length} {visible.length === 1 ? 'item' : 'items'}
          </p>
        ) : null}
      </nav>

      {error ? <p className="text-sm text-crimson-text">{error}</p> : null}

      {products === null && !error ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <div key={key} className="space-y-3">
              <div className="aspect-square animate-pulse rounded-card bg-surface-1" />
              <div className="h-4 w-1/2 animate-pulse rounded-chip bg-surface-1" />
            </div>
          ))}
        </div>
      ) : null}

      {products && visible.length === 0 ? (
        <p className="text-sm text-ink-muted">{category ? 'Nothing is listed in this category.' : 'Nothing is listed yet.'}</p>
      ) : null}

      {visible.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3">
          {visible.map((product, index) => (
            <li key={product.id}>
              <ProductCard product={product} eager={index < 3} />
            </li>
          ))}
        </ul>
      ) : null}

      <section aria-label="How orders work" className="grid gap-px overflow-hidden rounded-card border border-line-subtle bg-line-subtle sm:grid-cols-3">
        <StorePromise title="Printed to order" body="Nothing sits in a warehouse. Your piece is printed after you check out." />
        <StorePromise title="Ships in 2 to 5 business days" body={`Flat-rate shipping to ${MERCH_SHIPPING_COUNTRIES.length} countries, with tracking.`} />
        <StorePromise title="Checkout on Stripe" body="Payment happens on Stripe's secure page. We never see your card number." />
      </section>
    </div>
  )
}

function StorePromise({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-surface-1 p-5">
      <p className="font-grotesk text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{body}</p>
    </div>
  )
}

function CategoryLink({
  label,
  count,
  active,
  to,
  search,
}: {
  label: string
  count?: number
  active: boolean
  to: '/store'
  search?: { category: string }
}) {
  return (
    <Link
      to={to}
      search={search ?? {}}
      aria-current={active ? 'page' : undefined}
      className={`rounded-control font-grotesk text-lg transition-colors ${FOCUS} ${
        active ? 'text-ink' : 'text-ink-muted hover:text-ink'
      }`}
    >
      {label}
      {count != null ? <sup className="ml-0.5 text-xs text-ink-muted">{count}</sup> : null}
    </Link>
  )
}

function ProductCard({ product, eager }: { product: MerchProductView; eager: boolean }) {
  const cart = useMerchCart()
  const colors = product.variants.filter(
    (variant, index, all) => variant.color && all.findIndex((item) => item.color === variant.color) === index,
  )
  // A second angle on hover. Multi-color products keep their first color so quick add matches the photo.
  const hoverImage = colors.length > 1 ? undefined : product.galleryImageUrls.find((url) => url !== product.featuredImageUrl)
  const firstColor = product.variants[0]?.color ?? null
  const quickSizes = uniqueVariantLabels(
    product.variants.filter((variant) => variant.color === firstColor),
    'size',
  )

  const quickAdd = (size: string) => {
    const variant = product.variants.find((item) => item.color === firstColor && item.size === size)
    if (!variant) return
    cart.addLine({
      variantId: variant.id,
      productSlug: product.slug,
      productTitle: product.title,
      variantTitle: variant.title,
      size: variant.size,
      color: variant.color,
      colorHex: variant.colorHex,
      imageUrl: variant.imageUrl || product.featuredImageUrl,
      unitPriceCents: variant.priceCents,
      quantity: 1,
    })
  }

  return (
    <article className="group relative">
      <div className="relative aspect-square overflow-hidden rounded-card bg-surface-1">
        <Link to="/store/$slug" params={{ slug: product.slug }} className={`block h-full w-full rounded-card ${FOCUS}`}>
          <span className="sr-only">{product.title}</span>
          <MerchImage
            src={product.featuredImageUrl}
            loading={eager ? 'eager' : 'lazy'}
            className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
          />
          {hoverImage ? (
            <MerchImage
              src={hoverImage}
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          ) : null}
        </Link>
        {quickSizes.length > 0 ? (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 hidden translate-y-2 opacity-0 transition duration-300 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 md:block">
            <div className="flex flex-wrap items-center gap-1.5 rounded-card border border-line-subtle bg-abyss/85 p-2 backdrop-blur">
              <span className="px-1 text-xs text-ink-muted">
                <Plus className="inline h-3 w-3" aria-hidden="true" /> Add{firstColor && colors.length > 1 ? ` ${firstColor.toLowerCase()}` : ''}
              </span>
              {quickSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => quickAdd(size)}
                  aria-label={`Add ${product.title}, ${firstColor ? `${firstColor}, ` : ''}${size}, to cart`}
                  className={`min-h-8 min-w-8 rounded-control border border-line bg-surface-1 px-2 text-xs text-ink hover:border-line-strong hover:bg-surface-2 ${FOCUS}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h2 className="font-grotesk text-sm font-medium text-ink sm:text-base">
            <Link to="/store/$slug" params={{ slug: product.slug }} className={`rounded-control hover:text-cyan-glow ${FOCUS}`}>
              {product.title}
            </Link>
          </h2>
          <p className="mt-0.5 text-sm text-ink-body">{merchPriceLabel(product)}</p>
        </div>
        {colors.length > 1 ? (
          <div className="flex shrink-0 gap-1.5 sm:pt-1.5" aria-label={`${colors.length} colors`}>
            {colors.map((variant) => (
              <span
                key={variant.color}
                title={variant.color ?? ''}
                className="h-3.5 w-3.5 rounded-full border border-line"
                style={{ backgroundColor: variant.colorHex ?? undefined }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}
