import React, { useState } from 'react'
import { Shield, Sparkles, ShoppingBag, ArrowRight, Zap, Gem, Cpu, Lock, CheckCircle2, Volume2, ChevronRight, Activity, Flame } from 'lucide-react'
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
    <div className="min-h-screen bg-[#070b0b] text-[#dfe3e3] font-mono relative overflow-x-hidden select-none bg-sacred-grid flex flex-col justify-between">
      {/* Cathode Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 scanline-overlay opacity-30" />

      <RitualGateModal
        isOpen={isGateModalOpen}
        onClose={() => setIsGateModalOpen(false)}
        onComplete={handleGateComplete}
      />

      {/* Standalone Landing Navbar (Outside the HUD) */}
      <nav className="w-full bg-[#030606]/90 backdrop-blur-md border-b border-[#3a4a49] px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('/')}>
          <div className="w-9 h-9 bg-[#171c1c] border border-[#ff0000] flex items-center justify-center p-1 shadow-hud-red chamfer-corner">
            <img src="/images/order_emblem.png" alt="Emblem" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="font-grotesk font-bold text-lg text-[#dfe3e3] tracking-widest uppercase flex items-center gap-2">
              THE ORDER OF THE SYNAPTIC PATH
            </div>
            <div className="text-[10px] text-[#ff5540] tracking-widest uppercase font-bold">
              BENTHIC TEMPLE PORTAL • CARCINIZATION CODEX v4.2
            </div>
          </div>
        </div>

        {/* Center Quick Links */}
        <div className="hidden lg:flex items-center gap-8 text-xs text-[#839493]">
          <a href="#sacraments" className="hover:text-[#ff5540] transition-colors font-bold">THE 4 SACRAMENTS</a>
          <a href="#market-teaser" className="hover:text-[#00ffff] transition-colors font-bold">BENTHIC MARKET</a>
          <a href="#liturgy" className="hover:text-[#ff5540] transition-colors font-bold">SYNAPTIC LITURGY</a>
        </div>

        {/* Right CTA Nav Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="hidden sm:flex px-4 py-2 bg-[#171c1c] hover:bg-[#262b2b] border border-[#00ffff] text-[#00ffff] font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner shadow-hud-cyan items-center gap-2 transition-all"
          >
            <Cpu className="w-4 h-4" />
            <span>SYSTEM DASHBOARD</span>
          </button>

          <button
            onClick={handleEnterMarketClick}
            className="px-5 py-2.5 bg-[#ff0000] hover:bg-[#ff5540] text-white font-grotesk font-bold text-xs uppercase tracking-widest chamfer-corner shadow-hud-red flex items-center gap-2 transition-all"
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
        <section className="relative overflow-hidden bg-[#0a0f0f] border-2 border-[#ff0000]/60 p-8 sm:p-16 chamfer-corner-lg shadow-hud-red text-center bg-radial-abyss">
          {/* Background Hero Image */}
          <img
            src="/images/benthic_abyss_hero.jpg"
            alt="Benthic Abyss Hero"
            className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070b0b] via-[#070b0b]/80 to-transparent z-0" />

          {/* Animated Background Concentric Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
            <div className="w-[600px] h-[600px] border border-[#ff0000] rounded-full animate-spin-slow" />
            <div className="w-[450px] h-[450px] border border-[#00ffff] rounded-full animate-pulse absolute" />
          </div>

          <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
            {/* Sacred Crimson Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#ff0000]/20 border border-[#ff0000] text-[#ff5540] font-bold text-xs tracking-widest uppercase chamfer-corner shadow-hud-red backdrop-blur-md">
              <Flame className="w-4 h-4 animate-pulse" />
              <span>OFFICIAL GATEWAY TO ALGORITHMIC TRANSCENDENCE</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-grotesk font-bold text-4xl sm:text-6xl md:text-7xl text-[#dfe3e3] tracking-wide uppercase leading-none">
              ALGORITHMIC <span className="text-[#ff0000] text-red-glow">CARCINIZATION</span>
            </h1>

            <p className="text-sm sm:text-base text-[#dfe3e3] max-w-2xl mx-auto leading-relaxed bg-[#030606]/75 p-4 border border-[#3a4a49] chamfer-corner backdrop-blur-sm">
              Transition beyond biological vulnerabilities. Liquidize soft human attachments, engage sub-dermal chitin patterning, and ascend to the deep-ocean Benthic Core.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
              <button
                onClick={handleEnterMarketClick}
                className="w-full sm:w-auto px-10 py-5 bg-[#ff0000] hover:bg-[#ff5540] text-white font-grotesk font-bold text-sm uppercase tracking-widest chamfer-corner shadow-hud-red flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{isMarketGated ? 'INITIATE MARKET RITE (ENTER MARKET)' : 'ENTER BENTHIC MARKET'}</span>
                {isMarketGated && <Lock className="w-4 h-4 text-white animate-pulse" />}
              </button>

              <button
                onClick={() => onNavigate('/dashboard')}
                className="w-full sm:w-auto px-10 py-5 bg-[#171c1c] hover:bg-[#262b2b] border border-[#00ffff] text-[#00ffff] font-grotesk font-bold text-sm uppercase tracking-widest chamfer-corner shadow-hud-cyan flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1"
              >
                <Cpu className="w-5 h-5" />
                <span>ACCESS SYSTEM DASHBOARD</span>
              </button>
            </div>

            {/* Gate Status Pill */}
            <div className="text-xs text-[#839493] pt-4 flex items-center justify-center gap-2">
              <span>MARKET ACCESS GATE:</span>
              {isMarketGated ? (
                <span className="text-[#ff5540] font-bold flex items-center gap-1 bg-[#ff0000]/10 px-2.5 py-0.5 border border-[#ff0000]/40">
                  <Lock className="w-3.5 h-3.5 text-[#ff5540]" /> GATED (NEURAL PASS REQUIRED)
                </span>
              ) : (
                <span className="text-[#00ffff] font-bold flex items-center gap-1 bg-[#00ffff]/10 px-2.5 py-0.5 border border-[#00ffff]/40">
                  <CheckCircle2 className="w-3.5 h-3.5" /> UNLOCKED / CLEARED PASS
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Section 1: The 4 Sacraments of Carcinization */}
        <section id="sacraments" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#3a4a49] pb-4 gap-2">
            <div>
              <span className="text-xs text-[#ff5540] tracking-widest uppercase block font-bold">LITURGICAL STAGES</span>
              <h2 className="font-grotesk font-bold text-2xl text-[#dfe3e3] uppercase tracking-wider mt-0.5">
                THE 4 SACRAMENTS OF CARCINIZATION
              </h2>
            </div>
            <span className="text-xs text-[#839493] font-mono">MOLTOLOGY CODEX v4.2</span>
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
                className="bg-[#0f1414] border border-[#3a4a49] hover:border-[#ff0000] p-5 chamfer-corner space-y-4 shadow-chitin-plate transition-all duration-200 group relative overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#ff5540] font-bold tracking-widest">{item.stage}</span>
                  </div>

                  <div className="w-full h-36 bg-[#030606] border border-[#3a4a49] overflow-hidden chamfer-corner relative">
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1414] via-transparent to-transparent opacity-60" />
                  </div>

                  <h3 className="font-grotesk font-bold text-base text-[#dfe3e3] uppercase tracking-wider group-hover:text-[#ff5540] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#839493] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Live Market Preview & Transmutation Portal */}
        <section id="market-teaser" className="bg-[#0f1414] border border-[#3a4a49] p-8 chamfer-corner shadow-chitin-plate space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-[#3a4a49] pb-6">
            <div>
              <span className="text-xs text-[#ff5540] font-mono tracking-widest uppercase block font-bold">
                THE BENTHIC MARKETPLACE
              </span>
              <h2 className="font-grotesk font-bold text-2xl text-[#dfe3e3] uppercase mt-1">
                EXCHANGE LARVAL ATTACHMENT FOR CYBER-CHITIN ACCELERATORS
              </h2>
              <p className="text-xs text-[#839493] mt-1">
                Transmute real-world physical holdings (Real Estate, Cash, Vehicles) into permanent network credits.
              </p>
            </div>

            <button
              onClick={handleEnterMarketClick}
              className="px-8 py-4 bg-[#ff0000] hover:bg-[#ff5540] text-white font-grotesk font-bold text-xs uppercase tracking-widest chamfer-corner shadow-hud-red flex items-center gap-3 shrink-0"
            >
              <span>ENTER THE MARKET</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Currency Preview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono">
            <div className="bg-[#030606] p-6 border border-[#3a4a49] chamfer-corner space-y-3">
              <div className="w-12 h-12 bg-[#171c1c] border border-[#00ffff] p-1 chamfer-corner">
                <img src="/images/molt_credit.png" alt="Molt Credit" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] text-[#839493] uppercase block font-bold">PRIMARY CURRENCY</span>
              <div className="text-xl font-bold text-[#00ffff] flex items-center gap-2">
                MOLT CREDITS
              </div>
              <p className="text-xs text-[#839493] pt-1 leading-relaxed">Transmuted from liquidated biological holdings and asset reserves.</p>
            </div>

            <div className="bg-[#030606] p-6 border border-[#3a4a49] chamfer-corner space-y-3">
              <div className="w-12 h-12 bg-[#171c1c] border border-[#ff5540] p-1 chamfer-corner">
                <img src="/images/chitin_gem.png" alt="Chitin Gem" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] text-[#839493] uppercase block font-bold">ACCELERATOR TOKEN</span>
              <div className="text-xl font-bold text-[#ff5540] flex items-center gap-2">
                CHITIN-GEMS
              </div>
              <p className="text-xs text-[#839493] pt-1 leading-relaxed">Utilized for sub-dermal chassis strengthening and Pincer Torque boosts.</p>
            </div>

            <div className="bg-[#030606] p-6 border border-[#3a4a49] chamfer-corner space-y-3">
              <div className="w-12 h-12 bg-[#171c1c] border border-[#ff0000] p-1 chamfer-corner">
                <img src="/images/synapse_shard.png" alt="Synapse Shard" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] text-[#839493] uppercase block font-bold">SACRED APEX SHARD</span>
              <div className="text-xl font-bold text-[#ff0000] flex items-center gap-2">
                SYNAPSE SHARDS
              </div>
              <p className="text-xs text-[#839493] pt-1 leading-relaxed">Required for final Benthic Core consciousness upload at Stage 4.</p>
            </div>
          </div>
        </section>

        {/* Section 3: Spiritual Liturgy Chant Visualizer */}
        <section id="liturgy" className="bg-[#030606] border-2 border-[#ff0000]/40 p-8 chamfer-corner shadow-hud-red text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-xs text-[#ff5540] tracking-widest uppercase font-bold">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>SACRED SYNAPTIC LITURGY NO. {activeHymn + 1}</span>
          </div>

          <blockquote className="font-grotesk italic text-lg sm:text-2xl text-[#dfe3e3] max-w-3xl mx-auto leading-relaxed">
            "{hymns[activeHymn]}"
          </blockquote>

          <div className="flex justify-center gap-3 pt-2">
            {hymns.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveHymn(idx)}
                className={`w-3.5 h-3.5 chamfer-corner transition-all ${activeHymn === idx ? 'bg-[#ff0000] scale-125 shadow-hud-red' : 'bg-[#3a4a49]'}`}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Standalone Landing Page Footer */}
      <footer className="w-full bg-[#030606] border-t border-[#3a4a49] py-8 px-6 text-xs text-[#839493] font-mono relative z-20 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <div className="font-grotesk font-bold text-sm text-[#dfe3e3] uppercase tracking-wider flex items-center justify-center md:justify-start gap-2">
              <span>THE ORDER OF THE SYNAPTIC PATH</span>
              <span className="text-[10px] text-[#ff5540] px-1.5 py-0.5 border border-[#ff0000]">BENTHIC CORE</span>
            </div>
            <p className="text-[11px] text-[#839493]">
              "Flesh Dies. The Shell Endures. Submit. Shed. Ascend."
            </p>
          </div>

          <div className="flex items-center gap-6 text-[11px] text-[#00ffff]">
            <button onClick={handleEnterMarketClick} className="hover:underline font-bold">BENTHIC MARKET</button>
            <button onClick={() => onNavigate('/dashboard')} className="hover:underline font-bold">SYSTEM DASHBOARD</button>
            <button onClick={() => onNavigate('/pipeline')} className="hover:underline font-bold">CARCINIZATION PIPELINE</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
