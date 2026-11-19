import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Home, LayoutDashboard } from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { HudButton } from '@/components/ui/HudButton'
import { GlowEmblem } from '@/components/ui/GlowEmblem'

export function HUDNotFound() {
  const [currentPath, setCurrentPath] = useState<string>('')
  const navigate = useNavigate()

  let locationPathname = ''
  try {
    const location = useLocation()
    locationPathname = location?.pathname || ''
  } catch {
    // Graceful fallback if router context is unavailable
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPath(locationPathname || window.location.pathname || '')
    }
  }, [locationPathname])

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back()
    } else {
      navigate({ to: '/' })
    }
  }

  return (
    <div className="min-h-screen bg-abyss text-ink flex flex-col font-sans selection:bg-cyan-glow/30 selection:text-ink">
      <title>Page Not Found | Moltology</title>
      <meta name="robots" content="noindex, nofollow" />
      <meta
        name="description"
        content="The requested page could not be found. Return to the home page or dashboard."
      />
      <PublicHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24">
        <div className="w-full max-w-md text-center">
          <GlowEmblem size={72} className="mb-8" />
          <p className="eyebrow mb-2">Error 404</p>
          <h1 className="font-grotesk font-semibold text-3xl sm:text-4xl text-ink mb-3">Page not found</h1>
          <p className="text-sm sm:text-base text-ink-body leading-relaxed">
            We couldn&rsquo;t find that page. It may have moved, or the link may be mistyped.
          </p>
          {currentPath && (
            <p className="mt-3 text-xs text-ink-muted truncate" title={currentPath}>
              {currentPath}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/" className="inline-flex">
              <HudButton variant="cyan" size="md" icon={<Home className="w-4 h-4" />}>
                Go home
              </HudButton>
            </Link>
            <Link to="/dashboard" className="inline-flex">
              <HudButton variant="dark" size="md" icon={<LayoutDashboard className="w-4 h-4" />}>
                Dashboard
              </HudButton>
            </Link>
          </div>
          <button
            type="button"
            onClick={handleGoBack}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-control text-xs text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go back</span>
          </button>
        </div>
      </main>
    </div>
  )
}
