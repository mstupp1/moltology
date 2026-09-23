import React, { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ShoppingBag } from 'lucide-react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { formatMerchPrice, type MerchProductView } from '@/lib/merch'
import { getMerchCatalogFn } from '@/lib/server/merch-api'
import { useMerchCart } from './MerchCartProvider'

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
          setError(loadError instanceof Error ? loadError.message : 'Could not load the store. Try again.')
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [session.userId])

  const categories = useMemo(() => {
    const names = new Set((products ?? []).map((product) => product.category))
    return [...names]
  }, [products])

  const visible = useMemo(() => {
    if (!products) return []
    if (!category) return products
    return products.filter((product) => product.category === category)
  }, [category, products])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-grotesk text-xs font-bold tracking-wider text-amber-300">STORE</p>
          <h1 className="mt-1 font-grotesk text-2xl font-semibold text-[#dfe3e3]">Field issue</h1>
          <p className="mt-2 max-w-xl text-sm text-[#839493]">
            Shirts, mugs, and stickers. Payment happens on Stripe. We print and ship after the payment clears.
          </p>
        </div>
        <button
          type="button"
          onClick={() => cart.setOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 border border-amber-500/50 px-4 text-sm text-amber-200"
        >
          <ShoppingBag className="h-4 w-4" />
          Cart{cart.count > 0 ? ` (${cart.count})` : ''}
        </button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categories">
        <CategoryLink label="All" to="/store" active={!category} />
        {categories.map((name) => (
          <CategoryLink
            key={name}
            label={name}
            to="/store"
            search={{ category: name }}
            active={category === name}
          />
        ))}
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {products === null && !error ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="chitin-card h-72 animate-pulse bg-[#080e11]" />
          ))}
        </div>
      ) : null}
      {products && visible.length === 0 ? (
        <p className="text-sm text-[#839493]">
          {category ? 'Nothing is listed in this category.' : 'Nothing is listed yet.'}
        </p>
      ) : null}
      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function CategoryLink({
  label,
  active,
  to,
  search,
}: {
  label: string
  active: boolean
  to: '/store'
  search?: { category: string }
}) {
  return (
    <Link
      to={to}
      search={search ?? {}}
      role="tab"
      aria-selected={active}
      className={`min-h-11 px-3 py-2 text-xs font-grotesk font-bold tracking-wider ${
        active ? 'border border-amber-400 text-amber-200' : 'border border-[#3a4a49] text-[#839493]'
      }`}
    >
      {label}
    </Link>
  )
}

function ProductCard({ product }: { product: MerchProductView }) {
  const price = product.variants[0]?.priceCents ?? product.basePriceCents
  const colors = product.variants.filter(
    (variant, index, all) => variant.color && all.findIndex((item) => item.color === variant.color) === index,
  )
  return (
    <Link
      to="/store/$slug"
      params={{ slug: product.slug }}
      className="chitin-card chamfer-corner group flex flex-col overflow-hidden shadow-2xl"
    >
      <div className="flex h-48 items-center justify-center bg-[#080e11]">
        {product.featuredImageUrl ? (
          <img src={product.featuredImageUrl} alt="" className="h-28 w-28 object-contain" />
        ) : (
          <span className="text-xs text-[#839493]">No preview</span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <p className="text-[11px] uppercase tracking-wider text-[#839493]">{product.category}</p>
        <h2 className="font-grotesk text-lg font-semibold text-[#dfe3e3] group-hover:text-amber-200">{product.title}</h2>
        <p className="text-sm text-amber-200">{formatMerchPrice(price)}</p>
        {colors.length > 0 ? (
          <div className="flex gap-1.5" aria-hidden="true">
            {colors.map((variant) => (
              <span
                key={variant.color}
                title={variant.color ?? ''}
                className="h-3.5 w-3.5 rounded-full border border-white/20"
                style={{ backgroundColor: variant.colorHex ?? '#839493' }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  )
}
