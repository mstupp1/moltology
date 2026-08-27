import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import {
  Compass,
  Home,
  LayoutDashboard,
  Newspaper,
  ArrowLeft,
  Radio,
  Terminal,
} from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { HudButton } from '@/components/ui'

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
    <div className="min-h-screen bg-[#070b0c] text-[#dfe3e3] flex flex-col font-sans selection:bg-[#00ffff] selection:text-[#000a0a]">
      <title>Page Not Found | Moltology</title>
      <meta name="robots" content="noindex, nofollow" />
      <meta
        name="description"
        content="The requested page could not be found. Return to the home page or dashboard."
      />
      {/* Top Public / HUD Header */}
      <PublicHeader />

      {/* Main 404 Sector Display */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden">
        {/* Atmospheric Biomechanical Grid & Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,195,255,0.07)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,195,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,195,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        {/* HUD Frame */}
        <div className="relative z-10 w-full max-w-3xl border border-[#232d30] bg-[#0c1214]/90 backdrop-blur-md p-6 sm:p-8 rounded-lg shadow-2xl shadow-black/80">
          {/* Status Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1c272a] mb-6">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-xs font-bold font-sans tracking-widest text-red-400 uppercase">
                PAGE NOT FOUND · ERROR 404
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-sans text-[#63757a] bg-[#080d0e] px-2.5 py-1 rounded border border-[#1c272a]">
              <Radio className="w-3 h-3 text-[#00c3ff] animate-pulse" />
              <span>STATUS: 404 NOT FOUND</span>
            </div>
          </div>

          {/* Core Warning Section */}
          <div className="flex flex-col sm:flex-row items-start gap-5 mb-6">
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 shrink-0">
              <Compass className="w-8 h-8 animate-spin text-red-400 [animation-duration:12s]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-sans tracking-widest text-[#00c3ff] uppercase mb-1">
                PAGE NOT FOUND
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-['Cinzel',serif] tracking-wide text-white mb-2">
                Page Not Found
              </h1>
              <p className="text-xs sm:text-sm text-[#9ab0b5] font-sans leading-relaxed">
                The page you are looking for does not exist or has been moved. Please check the URL or return home.
              </p>
            </div>
          </div>

          {/* Telemetry Block */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 font-sans text-xs">
            <div className="p-3 rounded bg-[#080d0e] border border-[#1c272a]">
              <div className="text-[10px] text-[#63757a] uppercase mb-0.5">Requested URL</div>
              <div className="text-[#00c3ff] truncate font-medium" title={currentPath || '/404_UNKNOWN'}>
                {currentPath || '/404_UNKNOWN'}
              </div>
            </div>
            <div className="p-3 rounded bg-[#080d0e] border border-[#1c272a]">
              <div className="text-[10px] text-[#63757a] uppercase mb-0.5">Status Code</div>
              <div className="text-[#dfe3e3] font-medium">HTTP 404</div>
            </div>
            <div className="p-3 rounded bg-[#080d0e] border border-[#1c272a]">
              <div className="text-[10px] text-[#63757a] uppercase mb-0.5">Status</div>
              <div className="text-emerald-400 font-medium">ONLINE</div>
            </div>
          </div>

          {/* Action Links */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/" className="inline-flex">
              <HudButton variant="cyan" size="md" icon={<Home className="w-4 h-4" />}>
                Return Home
              </HudButton>
            </Link>

            <Link to="/dashboard" className="inline-flex">
              <HudButton variant="dark" size="md" icon={<LayoutDashboard className="w-4 h-4" />}>
                Dashboard
              </HudButton>
            </Link>

            <Link to="/news" className="inline-flex">
              <HudButton variant="dark" size="md" icon={<Newspaper className="w-4 h-4" />}>
                MoltNation News
              </HudButton>
            </Link>

            <button
              onClick={handleGoBack}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-sans text-[#839493] hover:text-[#00c3ff] transition-colors sm:ml-auto cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
