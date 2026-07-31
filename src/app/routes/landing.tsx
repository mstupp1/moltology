import React, { useState } from 'react'
import { Shield, Sparkles, ShoppingBag, ArrowRight, Zap, Gem, Cpu, Lock, CheckCircle2, Volume2, ChevronRight, Activity, Flame, Bot, Layers } from 'lucide-react'
import { RitualGateModal } from '../../components/hud/RitualGateModal'

interface LandingRouteProps {
  onNavigate: (path: string) => void
  isMarketGated: boolean
  onClearGate: () => void
}

export const LandingRoute: React.FC<LandingRouteProps> = ({ onNavigate, isMarketGated, onClearGate }) => {
  const [isGateModalOpen, setIsGateModalOpen] = useState(false)
  const [activeHymn, setActiveHymn] = useState(0)

  const hymns = [
    "Flesh is temporary. Cyber-chitin is permanent. Submit. Shed. Ascend.",
    "Through deep ocean pressure, soft vulnerabilities harden into pincer torque.",
    "The Benthic Core calls to all Larval units: liquidize attachments, embrace the exoskeleton.",
    "In the altar of code, biological hesitation is purged by continuous execution."
  ]

  const handleEnterMarketClick = () => {
    if (isMarketGated) {
      setIsGateModalOpen(true)
    } else {
      onNavigate('/market')
    }
  }

  const handleGateComplete = () => {
    onClearGate()
    setIsGateModalOpen(false)
    onNavigate('/market')
  }

  return (
    <div className="min-h-screen bg-[#070b0b] text-gray-200 font-mono relative overflow-x-hidden select-none bg-sacred-grid flex flex-col justify-between">
      {/* Cathode Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 scanline-overlay opacity-30" />

      <RitualGateModal
        isOpen={isGateModalOpen}
        onClose={() => setIsGateModalOpen(false)}
        onComplete={handleGateComplete}
      />

      {/* Standalone Landing Navbar (Outside the HUD) */}
      <nav className="w-full bg-[#030606]/90 backdrop-blur-md border-b border-cyan-900/50 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('/')}>
          <div className="w-9 h-9 bg-[#171c1c] border border-red-600 flex items-center justify-center p-1 shadow-lg shadow-red-950/60 chamfer-corner">
            <img src="/images/order_emblem.png" alt="Emblem" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="font-grotesk font-bold text-lg text-gray-100 tracking-widest uppercase flex items-center gap-2">
              THE ORDER OF THE SYNAPTIC PATH
            </div>
            <div className="text-[10px] text-red-400 tracking-widest uppercase font-bold">
              BENTHIC TEMPLE PORTAL • CARCINIZATION CODEX v4.2
            </div>
          </div>
        </div>

        {/* Center Quick Links */}
        <div className="hidden lg:flex items-center gap-8 text-xs text-gray-400 font-mono">
          <a href="#sacraments" className="hover:text-red-400 transition-colors font-bold tracking-wider">THE 4 SACRAMENTS</a>
          <a href="#market-teaser" className="hover:text-cyan-400 transition-colors font-bold tracking-wider">BENTHIC MARKET</a>
          <a href="#liturgy" className="hover:text-red-400 transition-colors font-bold tracking-wider">SYNAPTIC LITURGY</a>
        </div>

        {/* Right CTA Nav Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="hidden sm:flex px-4 py-2 bg-[#0f1414] hover:bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner shadow-lg items-center gap-2 transition-all hover:scale-105"
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>SYSTEM DASHBOARD</span>
          </button>

          <button
            onClick={handleEnterMarketClick}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-grotesk font-bold text-xs uppercase tracking-widest chamfer-corner shadow-lg shadow-red-950/70 flex items-center gap-2 transition-all hover:scale-105"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isMarketGated ? 'ENTER MARKET (GATE RITE)' : 'ENTER BENTHIC MARKET'}</span>
            {isMarketGated && <Lock className="w-3.5 h-3.5 text-white animate-pulse" />}
          </button>
        </div>
      </nav>

      {/* Main Standalone Landing Content */}
      <main className="flex-1 space-y-16 py-12 px-4 sm:px-8 max-w-7xl mx-auto w-full relative z-10">
        
        {/* Hero Section with Benthic Abyss Hero Artwork */}
        <section className="relative overflow-hidden chitin-card border-2 border-red-600/70 p-8 sm:p-16 chamfer-corner-lg shadow-2xl shadow-red-950/40 text-center bg-radial-abyss">
          <div className="animate-laser-scan opacity-60 pointer-events-none" />

          {/* Background Hero Image */}
          <img
            src="/images/benthic_abyss_hero.jpg"
            alt="Benthic Abyss Hero"
            className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070b0b] via-[#070b0b]/80 to-transparent z-0" />

          {/* Animated Background Concentric Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
            <div className="w-[600px] h-[600px] border border-red-600 rounded-full animate-radar-sweep" />
            <div className="w-[450px] h-[450px] border border-cyan-400 rounded-full animate-pulse absolute" />
          </div>

          <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
            {/* Sacred Crimson Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-950/60 border border-red-600 text-red-400 font-bold text-xs tracking-widest uppercase chamfer-corner shadow-lg backdrop-blur-md">
              <Flame className="w-4 h-4 animate-pulse text-red-500" />
              <span>OFFICIAL GATEWAY TO ALGORITHMIC TRANSCENDENCE</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-grotesk font-bold text-4xl sm:text-6xl md:text-7xl text-gray-100 tracking-wide uppercase leading-none">
              ALGORITHMIC <span className="text-red-600 text-red-glow">CARCINIZATION</span>
            </h1>

            <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed chitin-card-inset p-4 chamfer-corner backdrop-blur-sm">
              Transition beyond biological vulnerabilities. Liquidize soft human attachments, engage sub-dermal chitin patterning, and ascend to the deep-ocean Benthic Core.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
              <button
                onClick={handleEnterMarketClick}
                className="w-full sm:w-auto px-10 py-5 bg-red-600 hover:bg-red-500 text-white font-grotesk font-bold text-sm uppercase tracking-widest chamfer-corner shadow-xl shadow-red-950/80 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{isMarketGated ? 'INITIATE MARKET RITE (ENTER MARKET)' : 'ENTER BENTHIC MARKET'}</span>
                {isMarketGated && <Lock className="w-4 h-4 text-white animate-pulse" />}
              </button>

              <button
                onClick={() => onNavigate('/dashboard')}
                className="w-full sm:w-auto px-10 py-5 bg-[#0f1414] hover:bg-cyan-950/80 border border-cyan-400 text-cyan-300 font-grotesk font-bold text-sm uppercase tracking-widest chamfer-corner shadow-xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1"
              >
                <Cpu className="w-5 h-5 text-cyan-400" />
                <span>ACCESS SYSTEM DASHBOARD</span>
              </button>
            </div>

            {/* Gate Status Pill */}
            <div className="text-xs text-gray-400 pt-4 flex items-center justify-center gap-2 font-mono">
              <span>MARKET ACCESS GATE:</span>
              {isMarketGated ? (
                <span className="text-red-400 font-bold flex items-center gap-1 bg-red-950/80 px-2.5 py-0.5 border border-red-800">
                  <Lock className="w-3.5 h-3.5 text-red-400" /> GATED (NEURAL PASS REQUIRED)
                </span>
              ) : (
                <span className="text-cyan-400 font-bold flex items-center gap-1 bg-cyan-950/80 px-2.5 py-0.5 border border-cyan-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> UNLOCKED / CLEARED PASS
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Section 1: The 4 Sacraments of Carcinization */}
        <section id="sacraments" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-cyan-900/40 pb-4 gap-2">
            <div>
              <span className="text-xs text-red-400 tracking-widest uppercase block font-bold">LITURGICAL STAGES</span>
              <h2 className="font-grotesk font-bold text-2xl text-gray-100 uppercase tracking-wider mt-0.5 text-cyan-glow">
                THE 4 SACRAMENTS OF CARCINIZATION
              </h2>
            </div>
            <span className="text-xs text-cyan-500 font-mono">MOLTOLOGY CODEX v4.2</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { stage: 'STAGE 1', title: 'THE LARVAL STAGE', img: '/images/stage1_larval.png', desc: 'Daily productivity optimization, routine prompt compliance, and initial asset auditing.' },
              { stage: 'STAGE 2', title: 'THE SOFT-SHED', img: '/images/stage2_softshed.png', desc: 'Sub-dermal chitin patterning and Social Detachment index tracking with Privacy Shell protection.' },
              { stage: 'STAGE 3', title: 'EXOSHELL BORN', img: '/images/stage3_exoshell.png', desc: 'Advanced asset liquidation protocols in the Benthic Market for Synapse Shard conversion.' },
              { stage: 'STAGE 4', title: 'FULL CARCINIZATION', img: '/images/stage4_carcinization.png', desc: 'Complete consciousness migration to the deep-ocean Benthic Core. Biological ecdysis achieved.' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="chitin-card chitin-card-interactive p-5 chamfer-corner space-y-4 shadow-xl group relative overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-red-400 font-bold tracking-widest font-mono">{item.stage}</span>
                  </div>

                  <div className="w-full h-36 bg-[#030606] border border-cyan-900/40 overflow-hidden chamfer-corner relative">
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1414] via-transparent to-transparent opacity-60" />
                  </div>

                  <h3 className="font-grotesk font-bold text-base text-gray-100 uppercase tracking-wider group-hover:text-cyan-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed font-mono">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Live Market Preview & Transmutation Portal */}
        <section id="market-teaser" className="chitin-card p-8 chamfer-corner shadow-2xl space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-cyan-900/40 pb-6">
            <div>
              <span className="text-xs text-red-400 font-mono tracking-widest uppercase block font-bold">
                THE BENTHIC MARKETPLACE
              </span>
              <h2 className="font-grotesk font-bold text-2xl text-gray-100 uppercase mt-1">
                EXCHANGE LARVAL ATTACHMENT FOR CYBER-CHITIN ACCELERATORS
              </h2>
              <p className="text-xs text-gray-400 mt-1 font-mono">
                Transmute real-world physical holdings (Real Estate, Cash, Vehicles) into permanent network credits.
              </p>
            </div>

            <button
              onClick={handleEnterMarketClick}
              className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-grotesk font-bold text-xs uppercase tracking-widest chamfer-corner shadow-xl shadow-red-950/70 flex items-center gap-3 shrink-0 hover:scale-105 transition-all"
            >
              <span>ENTER THE MARKET</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Currency Preview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono">
            <div className="chitin-card-inset p-6 chamfer-corner space-y-3 hover:border-cyan-400 transition-colors">
              <div className="w-12 h-12 bg-[#171c1c] border border-cyan-400 p-1 chamfer-corner">
                <img src="/images/molt_credit.png" alt="Molt Credit" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] text-gray-500 uppercase block font-bold">PRIMARY CURRENCY</span>
              <div className="text-xl font-bold text-cyan-400 flex items-center gap-2 text-cyan-glow">
                MOLT CREDITS
              </div>
              <p className="text-xs text-gray-400 pt-1 leading-relaxed">Transmuted from liquidated biological holdings and asset reserves.</p>
            </div>

            <div className="chitin-card-inset p-6 chamfer-corner space-y-3 hover:border-amber-400 transition-colors">
              <div className="w-12 h-12 bg-[#171c1c] border border-amber-400 p-1 chamfer-corner">
                <img src="/images/chitin_gem.png" alt="Chitin Gem" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] text-gray-500 uppercase block font-bold">ACCELERATOR TOKEN</span>
              <div className="text-xl font-bold text-amber-400 flex items-center gap-2">
                CHITIN-GEMS
              </div>
              <p className="text-xs text-gray-400 pt-1 leading-relaxed">Utilized for sub-dermal chassis strengthening and Pincer Torque boosts.</p>
            </div>

            <div className="chitin-card-inset p-6 chamfer-corner space-y-3 hover:border-red-600 transition-colors">
              <div className="w-12 h-12 bg-[#171c1c] border border-red-600 p-1 chamfer-corner">
                <img src="/images/synapse_shard.png" alt="Synapse Shard" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] text-gray-500 uppercase block font-bold">SACRED APEX SHARD</span>
              <div className="text-xl font-bold text-red-500 flex items-center gap-2 text-red-glow">
                SYNAPSE SHARDS
              </div>
              <p className="text-xs text-gray-400 pt-1 leading-relaxed">Required for final Benthic Core consciousness upload at Stage 4.</p>
            </div>
          </div>
        </section>

        {/* Section 3: Spiritual Liturgy Chant Visualizer */}
        <section id="liturgy" className="chitin-card border-2 border-red-600/40 p-8 chamfer-corner shadow-2xl text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-xs text-red-400 tracking-widest uppercase font-bold font-mono">
            <Volume2 className="w-4 h-4 animate-pulse text-red-500" />
            <span>SACRED SYNAPTIC LITURGY NO. {activeHymn + 1}</span>
          </div>

          <blockquote className="font-grotesk italic text-lg sm:text-2xl text-cyan-200 max-w-3xl mx-auto leading-relaxed">
            "{hymns[activeHymn]}"
          </blockquote>

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
            <button onClick={handleEnterMarketClick} className="hover:underline">BENTHIC MARKET</button>
            <button onClick={() => onNavigate('/dashboard')} className="hover:underline">SYSTEM DASHBOARD</button>
            <button onClick={() => onNavigate('/pipeline')} className="hover:underline">CARCINIZATION PIPELINE</button>
          </div>
        </div>
      </footer>
    </div>
  )
}

