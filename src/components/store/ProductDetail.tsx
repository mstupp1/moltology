import React, { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useAuthSession } from '@/hooks/useAuthSession'
import { HudButton } from '@/components/ui/HudButton'
import { getAuthJWTToken } from '@/lib/jwt'
import { formatMerchPrice, uniqueVariantLabels, type MerchProductView, type MerchVariantView } from '@/lib/merch'
import { getMerchProductBySlugFn } from '@/lib/server/merch-api'
import { useMerchCart } from './MerchCartProvider'

export function ProductDetail({ slug }: { slug: string }) {
  const session = useAuthSession()
  const cart = useMerchCart()
  const [product, setProduct] = useState<MerchProductView | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [size, setSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const token = await getAuthJWTToken()
        const result = await getMerchProductBySlugFn({
          data: { token: token ?? undefined, userId: session.userId ?? undefined, slug },
        })
        if (cancelled) return
        setProduct(result)
        const first = result?.variants[0]
        setColor(first?.color ?? null)
        setSize(first?.size ?? null)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load that piece. Try again.')
          setProduct(null)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [session.userId, slug])

  const colors = useMemo(() => (product ? uniqueVariantLabels(product.variants, 'color') : []), [product])
  const sizes = useMemo(() => {
    if (!product) return []
    const pool = color ? product.variants.filter((variant) => variant.color === color) : product.variants
    return uniqueVariantLabels(pool, 'size')
  }, [color, product])

  const selected = useMemo(() => {
    if (!product) return null
    const pool = color ? product.variants.filter((variant) => variant.color === color) : product.variants
    const sized = size ? pool.find((variant) => variant.size === size) : pool[0]
    return sized ?? pool[0] ?? product.variants[0] ?? null
  }, [color, product, size])

  useEffect(() => {
    if (!selected) return
    if (selected.color !== color) setColor(selected.color)
    if (selected.size !== size) setSize(selected.size)
  }, [color, selected, size])

  if (error) return <p className="text-sm text-red-300">{error}</p>
  if (product === undefined) {
    return <div className="chitin-card h-96 animate-pulse bg-[#080e11]" />
  }
  if (!product || !selected) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[#839493]">This piece is not available.</p>
        <Link to="/store" className="text-sm text-amber-200 underline-offset-2 hover:underline">
          Back to the store
        </Link>
      </div>
    )
  }

  const image = selected.imageUrl || product.featuredImageUrl
  const gallery = uniqueImages(product, selected)

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="space-y-3">
        <div className="chitin-card flex min-h-80 items-center justify-center bg-[#080e11] p-6">
          {image ? <img src={image} alt="" className="max-h-80 object-contain" /> : <span className="text-sm text-[#839493]">No preview</span>}
        </div>
        {gallery.length > 1 ? (
          <div className="flex gap-2">
            {gallery.map((src) => (
              <div key={src} className="h-16 w-16 border border-[#3a4a49] bg-[#080e11] p-1">
                <img src={src} alt="" className="h-full w-full object-contain" />
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="space-y-5">
        <div>
          <Link to="/store" className="text-xs text-[#839493] hover:text-amber-200">
            Store
          </Link>
          <h1 className="mt-2 font-grotesk text-3xl font-semibold text-[#dfe3e3]">{product.title}</h1>
          <p className="mt-2 text-lg text-amber-200">{formatMerchPrice(selected.priceCents)}</p>
          <p className="mt-3 text-sm leading-relaxed text-[#c5d0d0]">{product.description}</p>
        </div>
        {colors.length > 0 ? (
          <fieldset className="space-y-2">
            <legend className="text-xs font-grotesk font-bold tracking-wider text-[#839493]">Color</legend>
            <div className="flex flex-wrap gap-2">
              {colors.map((name) => {
                const swatch = product.variants.find((variant) => variant.color === name)
                const active = color === name
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setColor(name)}
                    className={`inline-flex min-h-11 items-center gap-2 border px-3 text-sm ${
                      active ? 'border-amber-400 text-amber-200' : 'border-[#3a4a49] text-[#dfe3e3]'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-white/30"
                      style={{ backgroundColor: swatch?.colorHex ?? '#839493' }}
                    />
                    {name}
                  </button>
                )
              })}
            </div>
          </fieldset>
        ) : null}
        {sizes.length > 0 ? (
          <fieldset className="space-y-2">
            <legend className="text-xs font-grotesk font-bold tracking-wider text-[#839493]">Size</legend>
            <div className="flex flex-wrap gap-2">
              {sizes.map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={size === name}
                  onClick={() => setSize(name)}
                  className={`min-h-11 min-w-11 border px-3 text-sm ${
                    size === name ? 'border-amber-400 text-amber-200' : 'border-[#3a4a49] text-[#dfe3e3]'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}
        <div className="flex items-center gap-3">
          <label htmlFor="merch-qty" className="text-xs text-[#839493]">
            Quantity
          </label>
          <input
            id="merch-qty"
            type="number"
            min={1}
            max={10}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            className="h-11 w-20 border border-[#3a4a49] bg-[#080e11] px-2 text-sm text-[#dfe3e3]"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <HudButton
            disabled={cart.checkingOut}
            onClick={() => void cart.checkout([{ variantId: selected.id, quantity: safeQty(quantity) }])}
          >
            {cart.checkingOut ? 'Starting checkout…' : 'Buy now'}
          </HudButton>
          <HudButton
            variant="dark"
            onClick={() =>
              cart.addLine({
                variantId: selected.id,
                productSlug: product.slug,
                productTitle: product.title,
                variantTitle: selected.title,
                size: selected.size,
                color: selected.color,
                colorHex: selected.colorHex,
                imageUrl: selected.imageUrl || product.featuredImageUrl,
                unitPriceCents: selected.priceCents,
                quantity: safeQty(quantity),
              })
            }
          >
            Add to cart
          </HudButton>
        </div>
      </div>
    </div>
  )
}

function safeQty(quantity: number): number {
  if (!Number.isInteger(quantity) || quantity < 1) return 1
  return Math.min(10, quantity)
}

function uniqueImages(product: MerchProductView, selected: MerchVariantView): string[] {
  const urls = [selected.imageUrl, product.featuredImageUrl, ...product.galleryImageUrls, ...product.variants.map((variant) => variant.imageUrl)]
  return urls.filter((url, index, all): url is string => Boolean(url) && all.indexOf(url) === index)
}
