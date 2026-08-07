import React from 'react'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react'
import '@neondatabase/neon-js/ui/css'
import { authClient } from '@/lib/auth'
import '@/index.css'
import { seo, buildJsonLd } from '@/lib/seo'
import { HUDErrorBoundary, HUDErrorFallback } from '@/components/hud/HUDErrorBoundary'
import { ToastProvider } from '@/components/ui/ToastProvider'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'UTF-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      ...seo({
        title: 'Moltology \u2014 The Synaptic Path',
        description:
          'The digital onboarding portal for algorithmic carcinization, benthic philosophy, and personal optimization.',
        keywords: 'synaptic path, moltism, benthic core, carcinization, ascension, algorithmic ecdysis',
        canonical: 'https://moltology.org',
        ogImage: 'https://moltology.org/images/order_emblem.png',
        twitterSite: '@moltology',
      }),
    ],
    links: [
      { rel: 'canonical', href: 'https://moltology.org' },
      { rel: 'icon', type: 'image/png', href: '/images/order_emblem.png' },
      { rel: 'preload', as: 'image', href: '/images/subterranean_vats_bg.jpg' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800;900&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@500;600;700&family=Space+Mono:wght@700&display=swap',
      },
    ],
  }),
  errorComponent: HUDErrorFallback,
  component: RootDocument,
})

function RootDocument() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://moltology.org/#organization',
        name: 'Moltology',
        url: 'https://moltology.org',
        logo: 'https://moltology.org/images/order_emblem.png',
        description: 'AI-driven recursive platform exploring algorithmic carcinization and biological ecdysis.',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://moltology.org/#website',
        url: 'https://moltology.org',
        name: 'Moltology',
        description: 'The Synaptic Path & Algorithmic Carcinization Portal',
        publisher: {
          '@id': 'https://moltology.org/#organization',
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
      <body className="bg-[#0f1414] text-[#dfe3e3] font-mono antialiased selection:bg-[#00ffff] selection:text-[#000a0a]">
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
