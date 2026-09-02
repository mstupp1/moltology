import React, { lazy } from 'react'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import '@/index.css'
import { SITE_ORIGIN, buildJsonLd, notFoundSeo, xRobotsNoindexHeaders } from '@/lib/seo'
import { HUDErrorBoundary, HUDErrorFallback } from '@/components/hud/HUDErrorBoundary'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'

const LazyHUDNotFound = lazy(() =>
  import('@/components/hud/HUDNotFound').then((m) => ({ default: m.HUDNotFound }))
)

function isNotFoundMatch(match: { status?: string; globalNotFound?: boolean }) {
  return match.status === 'notFound' || match.globalNotFound === true
}

export const Route = createRootRoute({
  head: ({ matches }) => {
    const notFound = matches.some(isNotFoundMatch)
    return {
      meta: [
        { charSet: 'UTF-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, viewport-fit=cover' },
        { name: 'theme-color', content: '#0a1212' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Moltology' },
        ...(notFound ? notFoundSeo() : []),
      ],
      links: [
        { rel: 'icon', type: 'image/png', href: '/images/order_emblem.png' },
        { rel: 'apple-touch-icon', href: '/images/pwa/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'alternate', type: 'application/rss+xml', title: 'MoltNation News RSS Feed', href: `${SITE_ORIGIN}/rss.xml` },
        { rel: 'sitemap', type: 'application/xml', title: 'Sitemap', href: `${SITE_ORIGIN}/sitemap.xml` },
        {
          rel: 'preload',
          as: 'font',
          type: 'font/woff2',
          href: '/fonts/space-grotesk-latin.woff2',
          crossOrigin: 'anonymous',
        },
        {
          rel: 'preload',
          as: 'font',
          type: 'font/woff2',
          href: '/fonts/inter-latin.woff2',
          crossOrigin: 'anonymous',
        },
        {
          rel: 'preconnect',
          href: 'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech',
        },
        { rel: 'dns-prefetch', href: 'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech' },
        // Auth is deferred until idle/interaction — dns-prefetch only (CORS preconnect would sit unused on first paint).
        { rel: 'dns-prefetch', href: 'https://ep-cold-breeze-aye6s748.neonauth.c-5.us-east-2.aws.neon.tech' },
      ],
    }
  },
  headers: ({ matches }): Record<string, string> => {
    if (matches.some(isNotFoundMatch)) {
      return xRobotsNoindexHeaders()
    }
    // The landing page renders identically for every guest (session is
    // client-side) — serve it from the CDN edge instead of re-running SSR
    // per request, eliminating cold-start TTFB variance on real users.
    if (matches.some((match) => match.pathname === '/')) {
      return {
        'Cache-Control': 'public, max-age=0, must-revalidate, s-maxage=600, stale-while-revalidate=3600',
      }
    }
    return {}
  },
  notFoundComponent: LazyHUDNotFound,
  errorComponent: HUDErrorFallback,
  component: RootDocument,
})

function RootDocument() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_ORIGIN}/#organization`,
        name: 'Moltology',
        alternateName: ['Moltology Org', 'MoltNation'],
        url: SITE_ORIGIN,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_ORIGIN}/images/order_emblem.png`,
        },
        description: 'AI-driven recursive platform exploring algorithmic carcinization and biological ecdysis.',
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        url: SITE_ORIGIN,
        name: 'Moltology',
        alternateName: ['Moltology', 'www.moltology.org', 'Moltology.org', 'Moltology — The Synaptic Path'],
        description: 'The Synaptic Path & Algorithmic Carcinization Portal',
        publisher: {
          '@id': `${SITE_ORIGIN}/#organization`,
        },
      },
    ],
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: buildJsonLd(jsonLd) }}
        />
      </head>
      <body className="bg-[#030708] text-[#dfe3e3] font-sans antialiased selection:bg-[#00ffff] selection:text-[#000a0a]">
        <HUDErrorBoundary>
          <ToastProvider>
            <Outlet />
          </ToastProvider>
        </HUDErrorBoundary>
        <Scripts />
        <SpeedInsights />
        <Analytics />
      </body>


    </html>
  )
}
