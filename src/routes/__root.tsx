import React from 'react'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react'
import '@neondatabase/neon-js/ui/css'
import { authClient } from '@/lib/auth'
import '@/index.css'
import { SITE_ORIGIN, buildJsonLd, notFoundSeo, xRobotsNoindexHeaders } from '@/lib/seo'
import { HUDErrorBoundary, HUDErrorFallback } from '@/components/hud/HUDErrorBoundary'
import { HUDNotFound } from '@/components/hud/HUDNotFound'
import { ToastProvider } from '@/components/ui/ToastProvider'

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
        ...(notFound ? notFoundSeo() : []),
      ],
      links: [
        { rel: 'icon', type: 'image/png', href: '/images/order_emblem.png' },
        { rel: 'alternate', type: 'application/rss+xml', title: 'MoltNation News RSS Feed', href: `${SITE_ORIGIN}/rss.xml` },
        { rel: 'sitemap', type: 'application/xml', title: 'Sitemap', href: `${SITE_ORIGIN}/sitemap.xml` },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
        { rel: 'preconnect', href: 'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech', crossOrigin: 'anonymous' },
        { rel: 'dns-prefetch', href: 'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@300;400;500;600;700;900&display=swap',
        },
      ],
    }
  },
  headers: ({ matches }) => {
    if (matches.some(isNotFoundMatch)) {
      return xRobotsNoindexHeaders()
    }
    return {}
  },
  notFoundComponent: HUDNotFound,
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
      <body className="bg-[#0f1414] text-[#dfe3e3] font-sans antialiased selection:bg-[#00ffff] selection:text-[#000a0a]">
        <HUDErrorBoundary>
          <ToastProvider>
            <NeonAuthUIProvider emailOTP authClient={authClient}>
              <Outlet />
            </NeonAuthUIProvider>
          </ToastProvider>
        </HUDErrorBoundary>
        <Scripts />
      </body>


    </html>
  )
}
