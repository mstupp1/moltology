import React, { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown, Minus, Plus } from 'lucide-react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { HudButton } from '@/components/ui/HudButton'
import { getAuthJWTToken } from '@/lib/jwt'
import {
  MERCH_CATEGORY_INFO,
  MERCH_MAX_QUANTITY,
  MERCH_SHIPPING_NOTE,
  formatMerchPrice,
  merchPriceLabel,
  uniqueVariantLabels,
  type MerchProductView,
  type MerchVariantView,
} from '@/lib/merch'
import { getMerchCatalogFn, getMerchProductBySlugFn } from '@/lib/server/merch-api'
import { StorePolicies } from './StorePolicies'
import { MerchImage } from './MerchImage'
import { useMerchCart } from './MerchCartProvider'

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

export function ProductDetail({ slug }: { slug: string }) {
  const session = useAuthSession()
  const cart = useMerchCart()
  const [product, setProduct] = useState<MerchProductView | null | undefined>(undefined)
  const [related, setRelated] = useState<MerchProductView[]>([])
  const [error, setError] = useState<string | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [size, setSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const token = await getAuthJWTToken()
        const auth = { token: token ?? undefined, userId: session.userId ?? undefined }
        const result = await getMerchProductBySlugFn({ data: { ...auth, slug } })
        if (cancelled) return
        setProduct(result)
        const first = result?.variants[0]
        setColor(first?.color ?? null)
        setSize(null)
        setQuantity(1)
        setActiveImage(first?.imageUrl ?? result?.featuredImageUrl ?? null)
        const all = await getMerchCatalogFn({ data: auth }).catch(() => [])
        if (!cancelled) setRelated(all.filter((item) => item.slug !== slug).slice(0, 3))
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error && loadError.message ? loadError.message : 'Could not load that piece. Try again.')
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
  const pool = useMemo(
    () => (product ? (color ? product.variants.filter((variant) => variant.color === color) : product.variants) : []),
    [color, product],
  )
  const sizes = useMemo(() => uniqueVariantLabels(pool, 'size'), [pool])
  const needsSize = sizes.length > 1
  const selected: MerchVariantView | null = useMemo(() => {
    if (!product) return null
    if (size) return pool.find((variant) => variant.size === size) ?? null
    return needsSize ? null : (pool[0] ?? null)
  }, [needsSize, pool, product, size])
  const display = selected ?? pool[0] ?? product?.variants[0] ?? null

  if (error) return <p className="text-sm text-crimson-text">{error}</p>
  if (product === undefined) {
    return (
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="aspect-square animate-pulse rounded-card bg-surface-1" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded-chip bg-surface-1" />
          <div className="h-4 w-1/4 animate-pulse rounded-chip bg-surface-1" />
        </div>
      </div>
    )
  }
  if (!product || !display) {
    return (
      <div className="space-y-3 py-16 text-center">
        <p className="text-sm text-ink-muted">This piece is not available.</p>
        <Link to="/store" className={`rounded-control text-sm text-cyan-glow underline-offset-2 hover:underline ${FOCUS}`}>
          Back to the store
        </Link>
      </div>
    )
  }

  const info = MERCH_CATEGORY_INFO[product.category]
  const gallery = uniqueImages(product)
  const mainImage = activeImage ?? display.imageUrl ?? product.featuredImageUrl
  const priceLabel = selected ? formatMerchPrice(selected.priceCents) : merchPriceLabel({ basePriceCents: product.basePriceCents, variants: pool })

  const chooseColor = (name: string) => {
    setColor(name)
    const match = product.variants.find((variant) => variant.color === name && (!size || variant.size === size))
    setActiveImage(match?.imageUrl ?? product.featuredImageUrl)
  }

  const addToCart = () => {
    if (!selected) return
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
      quantity,
    })
  }

  const addLabel = selected ? `Add to cart · ${formatMerchPrice(selected.priceCents * quantity)}` : 'Choose a size'

  return (
    <div className="pb-24 lg:pb-0">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-muted">
        <Link to="/store" className={`rounded-control hover:text-ink ${FOCUS}`}>
          Store
        </Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <Link to="/store" search={{ category: product.category }} className={`rounded-control hover:text-ink ${FOCUS}`}>
          {product.category}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-14">
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-card bg-surface-1">
            <MerchImage src={mainImage} alt={`${product.title}${display.color ? `, ${display.color}` : ''}`} loading="eager" className="h-full w-full object-cover" />
          </div>
          {gallery.length > 1 ? (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
              {gallery.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(src)}
                  aria-label={`Show photo ${index + 1}`}
                  aria-pressed={src === mainImage}
                  className={`aspect-square overflow-hidden rounded-control border bg-surface-1 transition-colors ${FOCUS} ${
                    src === mainImage ? 'border-cyan-glow' : 'border-line-subtle hover:border-line-hover'
                  }`}
                >
                  <MerchImage src={src} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="font-grotesk text-xs font-bold tracking-[0.12em] text-ink-muted">{product.category.toUpperCase()}</p>
          <h1 className="mt-2 font-grotesk text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{product.title}</h1>
          <p className="mt-2 text-xl text-ink">{priceLabel}</p>
          <p className="mt-5 text-base leading-relaxed text-ink-body">{product.description}</p>

          <div className="mt-8 space-y-6">
            {colors.length > 1 ? (
              <fieldset>
                <legend className="text-sm text-ink-muted">
                  Color <span className="text-ink">{color}</span>
                </legend>
                <div className="mt-3 flex flex-wrap gap-3">
                  {colors.map((name) => {
                    const swatch = product.variants.find((variant) => variant.color === name)
                    const active = color === name
                    return (
                      <button
                        key={name}
                        type="button"
                        aria-pressed={active}
                        aria-label={name}
                        onClick={() => chooseColor(name)}
                        className={`h-10 w-10 rounded-full border-2 p-0.5 transition-colors ${FOCUS} ${
                          active ? 'border-cyan-glow' : 'border-transparent hover:border-line-hover'
                        }`}
                      >
                        <span className="block h-full w-full rounded-full border border-line" style={{ backgroundColor: swatch?.colorHex ?? undefined }} />
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ) : null}

            {sizes.length > 0 ? (
              <fieldset>
                <div className="flex items-baseline justify-between">
                  <legend className="text-sm text-ink-muted">
                    Size {size ? <span className="text-ink">{size}</span> : null}
                  </legend>
                  {info?.sizeChart ? (
                    <a href="#size-chart" className={`rounded-control text-sm text-ink-muted underline underline-offset-4 hover:text-ink ${FOCUS}`}>
                      Size chart
                    </a>
                  ) : null}
                </div>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {sizes.map((name) => {
                    const variant = pool.find((item) => item.size === name)
                    const extra = variant && pool[0] && variant.priceCents > pool[0].priceCents
                    return (
                      <button
                        key={name}
                        type="button"
                        aria-pressed={size === name}
                        onClick={() => setSize(name)}
                        className={`flex min-h-12 flex-col items-center justify-center rounded-control border text-sm transition-colors ${FOCUS} ${
                          size === name
                            ? 'border-cyan-glow bg-surface-2 text-ink'
                            : 'border-line bg-surface-1 text-ink-body hover:border-line-hover hover:bg-surface-2'
                        }`}
                      >
                        {name}
                        {extra ? <span className="text-[11px] text-ink-muted">+{formatMerchPrice(variant.priceCents - pool[0].priceCents)}</span> : null}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ) : null}

            <div className="flex items-center gap-4">
              <span className="text-sm text-ink-muted" id="merch-qty-label">
                Quantity
              </span>
              <div className="inline-flex items-center rounded-control border border-line" role="group" aria-labelledby="merch-qty-label">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  className={`flex h-10 w-10 items-center justify-center text-ink hover:bg-surface-2 disabled:text-ink-muted disabled:hover:bg-transparent ${FOCUS}`}
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={quantity >= MERCH_MAX_QUANTITY}
                  onClick={() => setQuantity((value) => Math.min(MERCH_MAX_QUANTITY, value + 1))}
                  className={`flex h-10 w-10 items-center justify-center text-ink hover:bg-surface-2 disabled:text-ink-muted disabled:hover:bg-transparent ${FOCUS}`}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="hidden space-y-2 lg:block">
              <HudButton size="lg" fullWidth disabled={!selected} onClick={addToCart}>
                {addLabel}
              </HudButton>
              <HudButton
                size="lg"
                variant="secondary"
                fullWidth
                disabled={!selected || cart.checkingOut}
                onClick={() => selected && void cart.checkout([{ variantId: selected.id, quantity }])}
              >
                {cart.checkingOut ? 'Starting checkout…' : 'Buy now'}
              </HudButton>
            </div>
            <p className="text-sm leading-relaxed text-ink-muted">{MERCH_SHIPPING_NOTE}</p>
          </div>

          <div className="mt-8 divide-y divide-line-subtle border-y border-line-subtle">
            {info ? (
              <Disclosure title="Details" defaultOpen>
                <ul className="list-disc space-y-1 pl-5">
                  {info.details.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </Disclosure>
            ) : null}
            {info?.sizeChart ? (
              <Disclosure title="Size chart" id="size-chart">
                <table className="w-full text-left text-sm">
                  <thead className="text-ink-muted">
                    <tr>
                      <th className="py-1 font-normal">Size</th>
                      <th className="py-1 font-normal">Chest width (in)</th>
                      <th className="py-1 font-normal">Length (in)</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {info.sizeChart.map(([label, chest, length]) => (
                      <tr key={label} className="border-t border-line-subtle">
                        <td className="py-1.5">{label}</td>
                        <td className="py-1.5">{chest}</td>
                        <td className="py-1.5">{length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Disclosure>
            ) : null}
            {info ? (
              <Disclosure title="Care">
                <ul className="list-disc space-y-1 pl-5">
                  {info.care.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </Disclosure>
            ) : null}
            <Disclosure title="Shipping and returns">
              <StorePolicies />
            </Disclosure>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-20" aria-labelledby="related-heading">
          <h2 id="related-heading" className="font-grotesk text-xl font-semibold text-ink">
            More from the store
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.id}>
                <Link to="/store/$slug" params={{ slug: item.slug }} className={`group block rounded-card ${FOCUS}`}>
                  <div className="aspect-square overflow-hidden rounded-card bg-surface-1">
                    <MerchImage src={item.featuredImageUrl} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                  </div>
                  <p className="mt-3 font-grotesk text-sm font-medium text-ink group-hover:text-cyan-glow">{item.title}</p>
                  <p className="text-sm text-ink-body">{merchPriceLabel(item)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line-subtle bg-abyss/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink">{product.title}</p>
            <p className="text-xs text-ink-muted">{selected ? selected.title : sizes.length > 1 ? 'Choose a size above' : priceLabel}</p>
          </div>
          <HudButton disabled={!selected} onClick={addToCart}>
            {selected ? `Add · ${formatMerchPrice(selected.priceCents * quantity)}` : 'Choose a size'}
          </HudButton>
        </div>
      </div>
    </div>
  )
}

function Disclosure({
  title,
  children,
  defaultOpen,
  id,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  id?: string
}) {
  return (
    <details id={id} open={defaultOpen} className="group/disclosure">
      <summary
        className={`flex min-h-12 cursor-pointer list-none items-center justify-between rounded-control text-sm font-medium text-ink [&::-webkit-details-marker]:hidden ${FOCUS}`}
      >
        {title}
        <ChevronDown className="h-4 w-4 text-ink-muted transition-transform group-open/disclosure:rotate-180" aria-hidden="true" />
      </summary>
      <div className="pb-4 text-sm leading-relaxed text-ink-body">{children}</div>
    </details>
  )
}

function uniqueImages(product: MerchProductView): string[] {
  const urls = [product.featuredImageUrl, ...product.galleryImageUrls, ...product.variants.map((variant) => variant.imageUrl)]
  return urls.filter((url, index, all): url is string => Boolean(url) && all.indexOf(url) === index)
}
