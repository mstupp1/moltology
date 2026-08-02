import React from 'react'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react'
import '@neondatabase/neon-js/ui/css'
import { authClient } from '@/lib/auth'
import '@/index.css'
import { seo } from '@/lib/seo'
import { HUDErrorBoundary, HUDErrorFallback } from '@/components/hud/HUDErrorBoundary'
import { ToastProvider } from '@/components/ui/ToastProvider'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'UTF-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      ...seo({
        title: 'MOLTISM PORTAL v4.2 - The Order of the Synaptic Path',
        description:
          'The digital onboarding portal for algorithmic carcinization and personal optimization.',
        keywords: 'synaptic path, moltism, benthic core, carcinization, ascension',
      }),
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@500;600;700&family=Space+Mono:wght@700&display=swap',
      },
    ],
  }),
  errorComponent: HUDErrorFallback,
  component: RootDocument,
})

function RootDocument() {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
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

