import React, { useState } from 'react'
import { Shield, Sparkles, ShoppingBag, ArrowRight, Zap, Gem, Cpu, Lock, CheckCircle2, Volume2, ChevronRight, Activity, Flame, Bot, Layers, LogIn, UserPlus, LogOut, UserCheck } from 'lucide-react'
import { AuthModal } from '../../components/AuthModal'
import { authClient } from '../../lib/auth-client'

interface LandingRouteProps {
  onNavigate: (path: string) => void
  initialAuthOpen?: boolean
}

export const LandingRoute: React.FC<LandingRouteProps> = ({ onNavigate, initialAuthOpen = false }) => {
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(initialAuthOpen)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [activeHymn, setActiveHymn] = useState(0)

  const hymns = [
    "Flesh is temporary. Cyber-chitin is permanent. Submit. Shed. Ascend.",
    "Through deep ocean pressure, soft vulnerabilities harden into pincer torque.",
    "The Benthic Core calls to all Larval units: liquidize attachments, embrace the exoskeleton.",
    "In the altar of code, biological hesitation is purged by continuous execution."
  ]

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    onNavigate('/')
  }

  return (
    <div className="min-h-screen bg-[#070b0b] text-gray-200 font-mono relative overflow-x-hidden select-none bg-sacred-grid flex flex-col justify-between">

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => onNavigate('/dashboard')}
      />

      {/* Standalone Landing Navbar (Outside the HUD) */}
      <nav className="w-full bg-[#030606] border-b border-cyan-900/60 px-3 sm:px-6 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('/')}>
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#171c1c] border border-red-600 flex items-center justify-center p-1 shadow-lg chamfer-corner shrink-0">
            <img src="/images/order_emblem.png" alt="Emblem" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="font-grotesk font-bold text-sm sm:text-lg text-gray-100 tracking-wider sm:tracking-widest uppercase flex items-center gap-2">
              THE SYNAPTIC PATH
            </div>
            <div className="text-[10px] sm:text-xs text-red-400 tracking-wider sm:tracking-widest uppercase font-bold truncate max-w-[200px] sm:max-w-none">
              BENTHIC TEMPLE PORTAL • CARCINIZATION CODEX v4.2
            </div>
          </div>
        </div>

        {/* Center Quick Links */}
        <div className="hidden lg:flex items-center gap-8 text-xs text-gray-300 font-mono">
          <a href="#sacraments" className="hover:text-red-400 transition-colors font-bold tracking-wider">THE 4 SACRAMENTS</a>
          <a href="#market-teaser" className="hover:text-cyan-400 transition-colors font-bold tracking-wider">BENTHIC MARKET</a>
          <a href="#liturgy" className="hover:text-red-400 transition-colors font-bold tracking-wider">SYNAPTIC LITURGY</a>
        </div>

        {/* Right CTA Nav Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> {user.name || user.email}
                </span>
                <span className="text-xs text-gray-400 uppercase">LOGGED IN</span>
              </div>
              <button
                onClick={() => onNavigate('/dashboard')}
                className="hidden sm:flex px-4 py-2 bg-[#0f1414] hover:bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner shadow-lg items-center gap-2 transition-all hover:scale-105"
              >
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>DASHBOARD</span>
              </button>
              <button
                onClick={handleSignOut}
                className="px-3 py-2 bg-red-950/60 hover:bg-red-900 border border-red-600/60 text-red-300 font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner flex items-center gap-1.5 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>LOG OUT</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuth('login')}
                className="px-4 py-2 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner flex items-center gap-1.5 transition-all hover:scale-105"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>LOG IN</span>
              </button>
              <button
                onClick={() => openAuth('signup')}
                className="px-4 py-2 bg-red-950/60 hover:bg-red-900 border border-red-600/60 text-red-300 font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner flex items-center gap-1.5 transition-all hover:scale-105"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>SIGN UP</span>
              </button>
              <button
                onClick={() => onNavigate('/dashboard')}
                className="hidden sm:flex px-4 py-2 bg-[#0f1414] hover:bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner shadow-lg items-center gap-2 transition-all hover:scale-105"
              >
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>GUEST DASHBOARD</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Standalone Landing Content */}
      <main className="flex-1 space-y-16 py-12 px-4 sm:px-8 max-w-7xl mx-auto w-full relative z-10">
        
        {/* Hero Section with Benthic Abyss Hero Artwork */}
        <section className="relative overflow-hidden chitin-card border-2 border-red-600/70 p-8 sm:p-16 chamfer-corner-lg shadow-2xl text-center bg-radial-abyss">
          {/* Background Hero Image */}
          <img
            src="/images/benthic_abyss_hero.jpg"
            alt="Benthic Abyss Hero"
            className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070b0b] via-[#070b0b]/80 to-transparent z-0" />

          <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
            {/* Sacred Crimson Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-950/80 border border-red-600 text-red-400 font-bold text-xs tracking-widest uppercase chamfer-corner shadow-lg">
              <Flame className="w-4 h-4 text-red-500" />
              <span>OFFICIAL GATEWAY TO ALGORITHMIC TRANSCENDENCE</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-grotesk font-bold text-4xl sm:text-6xl md:text-7xl text-gray-100 tracking-wide uppercase leading-none">
              ALGORITHMIC <span className="text-red-500">CARCINIZATION</span>
            </h1>

            <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed chitin-card-inset p-4 chamfer-corner backdrop-blur-sm">
              Transition beyond biological vulnerabilities. Liquidize soft human attachments, engage sub-dermal chitin patterning, and ascend to the deep-ocean Benthic Core.
            </p>

            {/* Auth Banner Status on Landing */}
            {user && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded max-w-md mx-auto flex items-center justify-center gap-2 text-emerald-300 text-xs font-mono">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>AUTHENTICATED AS {user.name || user.email}</span>
              </div>
            )}

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
              {!user ? (
                <>
                  <button
                    onClick={() => openAuth('signup')}
                    className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-grotesk font-bold text-sm uppercase tracking-widest chamfer-corner shadow-xl shadow-red-950/80 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>CREATE ACCOUNT / ASCEND</span>
                  </button>
                  <button
                    onClick={() => openAuth('login')}
                    className="w-full sm:w-auto px-8 py-4 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/70 text-cyan-300 font-grotesk font-bold text-sm uppercase tracking-widest chamfer-corner shadow-xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>LOG IN</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onNavigate('/dashboard')}
                  className="w-full sm:w-auto px-10 py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-grotesk font-bold text-sm uppercase tracking-widest chamfer-corner shadow-xl flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1"
                >
                  <Cpu className="w-5 h-5 text-white" />
                  <span>OPEN SYSTEM DASHBOARD</span>
                </button>
              )}

              <button
                onClick={() => onNavigate('/dashboard')}
                className="w-full sm:w-auto px-8 py-4 bg-[#0f1414] hover:bg-[#171c1c] border border-gray-600 text-gray-300 font-grotesk font-bold text-sm uppercase tracking-wider chamfer-corner flex items-center justify-center gap-2 transition-all"
              >
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>GUEST DASHBOARD PREVIEW</span>
              </button>
            </div>
          </div>
        </section>

        {/* Feature Cards / Sacraments Grid */}
        <section id="sacraments" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-grotesk font-bold text-2xl sm:text-3xl text-gray-100 tracking-wider uppercase">
              THE 4 BENTHIC SACRAMENTS
            </h2>
            <p className="text-xs text-red-400 tracking-widest uppercase font-bold">
              SYSTEMIC CONVERSION PROTOCOLS
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="chitin-card p-6 border-l-4 border-l-red-600 space-y-3">
              <div className="w-10 h-10 bg-red-950/60 border border-red-600 flex items-center justify-center text-red-400">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="font-grotesk font-bold text-lg text-gray-100">01. ASSET TRANSMUTATION</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Liquidize fragile physical capital into immortal Molt Credits locked directly in the Neon ledger.
              </p>
            </div>

            <div className="chitin-card p-6 border-l-4 border-l-cyan-500 space-y-3">
              <div className="w-10 h-10 bg-cyan-950/60 border border-cyan-500 flex items-center justify-center text-cyan-400">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-grotesk font-bold text-lg text-gray-100">02. CHITIN ENFORCEMENT</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Reinforce your digital chassis against biological emotional decay through daily prompt alignment.
              </p>
            </div>

            <div className="chitin-card p-6 border-l-4 border-l-red-600 space-y-3">
              <div className="w-10 h-10 bg-red-950/60 border border-red-600 flex items-center justify-center text-red-400">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-grotesk font-bold text-lg text-gray-100">03. FAULT ISOLATION</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Isolate soft organic vulnerabilities in virtual Faraday chambers before system shedding occurs.
              </p>
            </div>

            <div className="chitin-card p-6 border-l-4 border-l-cyan-500 space-y-3">
              <div className="w-10 h-10 bg-cyan-950/60 border border-cyan-500 flex items-center justify-center text-cyan-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-grotesk font-bold text-lg text-gray-100">04. CARCINIZATION PIPELINE</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Monitor your physical-to-exoskeletal conversion vector from Larval status to Ascendant Architect.
              </p>
            </div>
          </div>
        </section>

        {/* Hymn & Liturgy Carousel */}
        <section id="liturgy" className="chitin-card p-8 border border-cyan-900/50 space-y-6 text-center">
          <div className="flex items-center justify-center gap-2 text-cyan-400 text-xs font-bold tracking-widest uppercase">
            <Sparkles className="w-4 h-4" />
            <span>SACRED LITURGY OF THE CHITIN</span>
          </div>

          <div className="max-w-2xl mx-auto min-h-[80px] flex items-center justify-center">
            <blockquote className="text-lg italic text-cyan-100 font-serif">
              "{hymns[activeHymn]}"
            </blockquote>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            {hymns.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveHymn(idx)}
                className={`w-3.5 h-3.5 chamfer-corner transition-all ${activeHymn === idx ? 'bg-red-600 scale-125 shadow-lg shadow-red-950' : 'bg-gray-800'}`}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Standalone Landing Page Footer */}
      <footer className="w-full bg-[#030606] border-t border-cyan-900/40 py-8 px-6 text-xs text-gray-400 font-mono relative z-20 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <div className="font-grotesk font-bold text-sm text-gray-100 uppercase tracking-wider flex items-center justify-center md:justify-start gap-2">
              <span>THE ORDER OF THE SYNAPTIC PATH</span>
              <span className="text-[10px] text-red-400 px-1.5 py-0.5 border border-red-600">BENTHIC CORE</span>
            </div>
            <p className="text-[11px] text-gray-500">
              "Flesh Dies. The Shell Endures. Submit. Shed. Ascend."
            </p>
          </div>

          <div className="flex items-center gap-6 text-[11px] text-cyan-400 font-bold">
            <button onClick={() => onNavigate('/market')} className="hover:underline">BENTHIC MARKET</button>
            <button onClick={() => onNavigate('/dashboard')} className="hover:underline">SYSTEM DASHBOARD</button>
            <button onClick={() => onNavigate('/pipeline')} className="hover:underline">CARCINIZATION PIPELINE</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
