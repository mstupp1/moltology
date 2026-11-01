import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ShoppingBag } from 'lucide-react'
import { MerchImage } from '@/components/store/MerchImage'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { merchPriceLabel, type MerchProductView } from '@/lib/merch'
import { MERCH_CUTOUTS } from '@/lib/merch-cutouts'
import { getMerchCatalogFn, getStoreAccessFn } from '@/lib/server/merch-api'
import { cn } from '@/lib/utils'
import { DASHBOARD_FOCUS, DashboardPanel } from './DashboardPanel'

export const DASHBOARD_STORE_LIMIT = 4

/**
 * Store pieces on the member dashboard. Hidden until the catalog loads, and for anyone the store
 * is not open to yet. Prices show only once ordering is open, so nothing reads as on sale early.
 */
export function DashboardStorePanel() {
  const navigate = useNavigate()
  const session = useAuthSession()
  const [products, setProducts] = useState<MerchProductView[]>([])
  const [orderingOpen, setOrderingOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const token = await getAuthJWTToken()
        const [catalog, access] = await Promise.all([
          getMerchCatalogFn({ data: { token: token ?? undefined, userId: session.userId ?? undefined } }),
          getStoreAccessFn(),
        ])
        if (cancelled) return
        setProducts(catalog.slice(0, DASHBOARD_STORE_LIMIT))
        setOrderingOpen(access.orderingOpen && !access.checkoutPaused)
      } catch {
        // The store is not open to this viewer, or it failed to load: leave the panel out.
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [session.userId])

  if (products.length === 0) return null

  return (
    <DashboardPanel
      icon={<ShoppingBag />}
      title="Store"
      action={{ label: 'Visit the store', onClick: () => navigate({ to: '/store' }) }}
      data-testid="dashboard-store"
    >
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {products.map((product) => {
          const image = MERCH_CUTOUTS[product.slug]
          return (
            <li key={product.id} className="min-w-0">
              <Link
                to="/store/$slug"
                params={{ slug: product.slug }}
                className={cn('group block rounded-control -m-1 p-1 hover:bg-surface-2 transition-colors', DASHBOARD_FOCUS)}
              >
                <span className={cn('block aspect-[4/3] overflow-hidden rounded-control border border-line-subtle', image?.background ?? 'bg-benthic-border')}>
                  <MerchImage
                    src={image?.src ?? product.featuredImageUrl}
                    alt={image?.alt ?? product.title}
                    className={cn('h-full w-full transition duration-500 group-hover:scale-[1.03]', image ? 'object-contain p-3' : 'object-cover')}
                  />
                </span>
                <span className="mt-2 block text-sm font-bold text-ink group-hover:text-cyan-glow transition-colors leading-snug line-clamp-2">
                  {product.title}
                </span>
                <span className="block text-xs text-ink-muted">{orderingOpen ? merchPriceLabel(product) : 'Coming soon'}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </DashboardPanel>
  )
}
