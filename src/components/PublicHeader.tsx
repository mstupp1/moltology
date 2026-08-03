/**
 * ============================================================================
 * PUBLIC TOP NAVIGATION HEADER
 * Shared navigation bar across top-level public pages (Landing / Org).
 * Features a modern glassmorphic HUD pill nav, high-tech glowing tab indicators,
 * and direct store link to https://www.etsy.com/shop/SaasTrash.
 * ============================================================================
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Building2,
  Cpu,
  UserPlus,
  Home,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { BenthicCTAButton } from '@/components/hud/BenthicCTAButton'
import { UserAvatarMenu } from '@/components/UserAvatarMenu'

export interface PublicHeaderProps {
  activePage?: 'home' | 'org' | 'store'
  onOpenAuth?: (mode: 'login' | 'signup') => void
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  activePage = 'home',
  onOpenAuth,
}) => {
  const navigate = useNavigate()
  const onNavigate = (path: string) => navigate({ to: path })
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user

  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`w-full px-4 sm:px-8 lg:px-12 py-3 sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#030606]/80 backdrop-blur-2xl border-b border-[#121c1d]/80 shadow-xl'
          : 'bg-[#030606]/70 backdrop-blur-xl border-b border-cyan-950/40 shadow-md'
      }`}
    >
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        {/* Shared Brand Logo & Emblem */}
        <div
          className="flex items-center gap-3.5 cursor-pointer group shrink-0"
          onClick={() => onNavigate('/')}
        >
          <div className="w-10 h-10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all">
            <img
              src="/images/order_emblem.png"
              alt="Moltology Emblem"
              className="w-full h-full object-contain [image-rendering:pixelated]"
            />
          </div>
          <div>
            <div className="font-grotesk font-bold text-base sm:text-lg text-gray-100 tracking-wider uppercase flex items-center gap-2">
              <span>THE SYNAPTIC PATH</span>
            </div>
            <div className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase truncate flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              MOLTOLOGY.ORG FOUNDATION
            </div>
          </div>
        </div>

        {/* Central Modern Pill Navigation Capsule */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center bg-[#090e0f]/90 border border-cyan-900/50 p-1.5 rounded-full shadow-inner shadow-cyan-950/60 backdrop-blur-md">
          <button
            onClick={() => onNavigate('/')}
            className={`relative px-4 py-2 rounded-full text-xs font-grotesk font-extrabold tracking-wider transition-all duration-300 flex items-center gap-2 ${
              activePage === 'home'
                ? 'bg-gradient-to-r from-cyan-950 via-cyan-900 to-cyan-950 text-cyan-300 border border-cyan-400/80 shadow-[0_0_15px_rgba(0,255,255,0.3)]'
                : 'text-gray-400 hover:text-cyan-300 hover:bg-[#121c1d]/60'
            }`}
          >
            <Home className={`w-3.5 h-3.5 ${activePage === 'home' ? 'text-cyan-300' : 'text-gray-400'}`} />
            <span>PORTAL HOME</span>
            {activePage === 'home' && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00ffff] animate-pulse" />
            )}
          </button>

          <button
            onClick={() => onNavigate('/org')}
            className={`relative px-4 py-2 rounded-full text-xs font-grotesk font-extrabold tracking-wider transition-all duration-300 flex items-center gap-2 ${
              activePage === 'org'
                ? 'bg-gradient-to-r from-cyan-950 via-cyan-900 to-cyan-950 text-cyan-300 border border-cyan-400/80 shadow-[0_0_15px_rgba(0,255,255,0.3)]'
                : 'text-gray-400 hover:text-cyan-300 hover:bg-[#121c1d]/60'
            }`}
          >
            <Building2 className={`w-3.5 h-3.5 ${activePage === 'org' ? 'text-cyan-300' : 'text-gray-400'}`} />
            <span>ORGANIZATION</span>
            {activePage === 'org' && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00ffff] animate-pulse" />
            )}
          </button>

          <a
            href="https://www.etsy.com/shop/SaasTrash"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-full text-xs font-grotesk font-extrabold tracking-wider transition-all duration-300 text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 hover:shadow-[0_0_12px_rgba(245,158,11,0.25)] flex items-center gap-2 group"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>STORE</span>
            <ExternalLink className="w-3 h-3 text-amber-500 opacity-70 group-hover:opacity-100" />
          </a>
        </nav>

        {/* Header Action Items */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('/dashboard')}
                className="px-5 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner flex items-center gap-2 transition-all hover:scale-105 shadow-hud-cyan"
              >
                <Cpu className="w-4 h-4" />
                <span>DASHBOARD</span>
              </button>
              <UserAvatarMenu user={user} onNavigate={onNavigate} />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenAuth?.('login')}
                className="px-4 py-2 text-gray-300 hover:text-cyan-400 text-xs font-bold tracking-wider transition-colors"
              >
                LOG IN
              </button>
              <BenthicCTAButton
                size="sm"
                onClick={() => onOpenAuth?.('signup')}
              >
                <span className="flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>JOIN PATH</span>
                </span>
              </BenthicCTAButton>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
