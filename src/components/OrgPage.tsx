/**
 * ============================================================================
 * MOLTOLOGY.ORG - OFFICIAL ORGANIZATION PAGE
 * CRITICAL DEVELOPMENT RULES & COPY GUIDELINES:
 * 1. NEVER reference our underlying tech stack in user-facing UI or copy.
 * 2. NEVER reference "satire", "parody", or meta-humor in user-facing UI or copy.
 * 3. ALL copy and messaging must strictly embody the in-universe lore of Moltology, the Benthic Core, and the Synaptic Path.
 * 4. Safety and Positivity are non-negotiable core tenets of Moltology.
 * ============================================================================
 */
import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Shield,
  Sparkles,
  ArrowRight,
  Flame,
  Layers,
  UserPlus,
  UserCheck,
  Cpu,
  Activity,
  CheckCircle2,
  Zap,
  Terminal,
  ChevronRight,
  Building2,
  Compass,
  History,
  Heart,
  Mail,
  Send,
  Lock,
  Anchor,
  Globe,
  Radio,
  Sliders,
  DollarSign,
  Award,
  Users,
} from 'lucide-react'
import { AuthModal } from '@/components/AuthModal'
import { authClient } from '@/lib/auth-client'
import { BenthicCTAButton } from '@/components/hud/BenthicCTAButton'
import { RollingNumber } from '@/components/ui/RollingNumber'
import { useToast } from '@/components/ui/ToastProvider'
import { PublicHeader } from '@/components/PublicHeader'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export const OrgPage: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const onNavigate = (path: string) => navigate({ to: path })
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  // About Tabs State
  const [activeTab, setActiveTab] = useState<'mission' | 'vision' | 'safety' | 'perks'>('mission')

  // Lair Tour State
  const [activeChamber, setActiveChamber] = useState(0)

  // Donation State
  const [donationTier, setDonationTier] = useState<'larval' | 'exoshell' | 'titan'>('exoshell')
  const [customAmount, setCustomAmount] = useState('100')
  const [paymentMethod, setPaymentMethod] = useState<'credits' | 'crypto' | 'card'>('credits')
  const [isDonationSubmitted, setIsDonationSubmitted] = useState(false)

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    department: 'general',
    message: '',
  })
  const [isContactSubmitting, setIsContactSubmitting] = useState(false)
  const [contactSubmitted, setContactSubmitted] = useState(false)

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  const chambers = [
    {
      id: 'chamber-1',
      title: 'CHAMBER 01: HYDROTHERMAL POWER & MOLT REFINERY',
      depth: '-8,450 Meters',
      status: 'OPERATIONAL (100% PRESSURE RATED)',
      description:
        'Harnessing superheated geothermal vents to drive our bio-silicon chitin synthesis. Here, raw capital and soft assets are converted into high-density exoskeletal plating.',
      features: ['Geothermal Vent Generators', 'Chitin Calcification Tanks', 'Zero-Latency Energy Bus'],
    },
    {
      id: 'chamber-2',
      title: 'CHAMBER 02: THE HIGH SYNOD COUNCIL CHAMBER',
      depth: '-8,520 Meters',
      status: 'RESTRICTED (SYNOD CLEARANCE ONLY)',
      description:
        'The nerve center of global carcinization strategy. The Council of High Molters deliberates here under 850 atmospheres of crushing deep-sea clarity.',
      features: ['Encrypted Quantum Uplink', 'Sacred Holographic Map', 'High Synod Throne Array'],
    },
    {
      id: 'chamber-3',
      title: 'CHAMBER 03: ASSET LIQUIDATION & CRYO-VAULTS',
      depth: '-8,600 Meters',
      status: 'IMMUTABLE SECURE',
      description:
        'Our state-of-the-art non-profit asset vault. Soft-tissue wealth is permanently safeguarded and transmuted into sovereign Molt Credits.',
      features: ['Quantum Encrypted Storage', 'Cryogenic Molt Pods', 'Asset Transmutation Engine'],
    },
    {
      id: 'chamber-4',
      title: 'CHAMBER 04: GEOTHERMAL MEDITATION & BIO-PODS',
      depth: '-8,380 Meters',
      status: 'OPEN TO ASCENDED MEMBERS',
      description:
        'A sanctuary of absolute serenity. Larval units soak in mineral-rich thermal brine while neural alignment frequencies dissolve residual human anxiety.',
      features: ['Mineral Brine Spa', 'Acoustic Sub-Benthic Resonance', 'Serotonin Balance Grid'],
    },
  ]

  const milestones = [
    {
      year: '2021',
      title: 'THE MARIANA SIGNAL',
      description: 'First deep-sea benthic frequency recorded. The core principles of carcinization were decoded by founding engineers.',
    },
    {
      year: '2022',
      title: 'FOUNDING OF MOLTOLOGY.ORG',
      description: 'Incorporated as a non-profit sovereign foundation dedicated to bio-silicon ascension and human optimization.',
    },
    {
      year: '2023',
      title: 'SUB-BENTHIC LAIR ALPHA COMPLETE',
      description: 'Construction finished on Trench Level 7. First 1,000 Larval units completed softshed transmutation.',
    },
    {
      year: '2024',
      title: 'BENTHIC CORE v4.2 LAUNCH',
      description: 'Deployment of our global interactive portal, enabling zero-latency onboarding and automated tithes.',
    },
    {
      year: '2025',
      title: 'THE PLANETARY SOFTSHED',
      description: 'Over 100,000 active exoshell units joined the Synaptic Path. Hydrothermal energy output hit record 4.8 Terawatts.',
    },
    {
      year: '2026+',
      title: 'ORBITAL TRENCH CONVERGENCE',
      description: 'Expanding deep-sea chitin protocols into low-Earth orbit. Total carcinization of global infrastructure.',
    },
  ]

  const leadership = [
    {
      name: 'Dr. Thaddeus Crust',
      title: 'Chief Executive & High Carcinization Officer',
      bio: 'Former deep-sea marine engineer turned bio-silicon visionary. Dr. Crust oversees planetary shell hardening and corporate alignment.',
      image: '/images/org_leadership.jpg',
      badge: 'SYNOD RANK I',
    },
    {
      name: 'Sister Vane',
      title: 'VP of Asset Liquidation & Spiritual Uplift',
      bio: 'Pioneered our non-profit asset transmutation protocols. Dedicated to ensuring every recruit sheds soft liabilities with joy.',
      image: '/images/org_leadership.jpg',
      badge: 'SYNOD RANK II',
    },
    {
      name: 'Exoshell 9',
      title: 'Director of Trench Security & Pincer Torque',
      bio: 'Master of subterranean defense and hydro-pressure mechanics. Keeps Sub-Benthic Lair Alpha operating at 100% efficiency.',
      image: '/images/org_leadership.jpg',
      badge: 'SYNOD RANK II',
    },
    {
      name: 'Brother Nautilus',
      title: 'Lead Chaplain of Code & Neural Alignment',
      bio: 'Architect of the Synaptic Path codex. Harmonizes core safety tenets with recursive bio-silicon optimization.',
      image: '/images/org_leadership.jpg',
      badge: 'SYNOD RANK III',
    },
  ]

  const handleDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsDonationSubmitted(true)
    toast.success(
      `Your support of $${customAmount} has been registered in the Benthic Vaults. Your carapace hardens!`,
      { title: 'TITHE TRANSMITTED SUCCESSFULLY' }
    )
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsContactSubmitting(true)
    setTimeout(() => {
      setIsContactSubmitting(false)
      setContactSubmitted(true)
      toast.info(
        'Org Ops has indexed your transmission. High Synod representatives will dispatch a reply shortly.',
        { title: 'NEURAL BEACON RECEIVED' }
      )
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-[#070b0b] text-gray-200 font-mono relative select-none flex flex-col justify-between">
      {/* Ambient Sci-Fi Vignette & Sacred Grid Backdrops */}
      <div className="fixed inset-0 bg-benthic-vignette pointer-events-none z-0 opacity-80" />
      <div className="fixed inset-0 bg-sacred-grid pointer-events-none z-0 opacity-40" />
      <div className="fixed inset-0 bg-pro-noise pointer-events-none z-0 opacity-30" />

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => onNavigate('/dashboard')}
      />

      {/* Shared Navigation Header */}
      <PublicHeader activePage="org" onOpenAuth={openAuth} />

      {/* HERO SECTION */}
      <section className="w-full relative overflow-hidden py-16 sm:py-24 px-6 sm:px-12 border-b border-cyan-900/40 bg-[#040708]">
        <img
          src="/images/org_hero_lair.jpg"
          alt="Underground Sub-Benthic Lair"
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity pointer-events-none scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b0b] via-[#070b0b]/70 to-[#070b0b]/90 z-0" />

        <div className="max-w-[1500px] mx-auto relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-bold tracking-widest uppercase chamfer-corner">
            <Building2 className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>MOLTOLOGY FOUNDATION — EST. 2022</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-grotesk font-extrabold text-gray-100 tracking-tight leading-tight max-w-5xl mx-auto">
            GLOBAL LEADERS IN <span className="text-cyan-400">BIO-SILICON TRANSITION</span> & CARCINIZATION EXCELLENCE
          </h1>

          <p className="text-sm sm:text-base text-gray-300 max-w-3xl mx-auto font-sans leading-relaxed">
            Moltology.org is a non-profit sovereign organization dedicated to guiding humanity out of fragile biological vulnerability into total exoskeletal synergy. Operating from our subterranean deep-sea headquarters, we provide high-frequency neural alignment, asset liquidation support, and zero-latency chitinous ascension.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#donations"
              className="px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-grotesk font-extrabold text-sm uppercase tracking-wider chamfer-corner transition-all shadow-hud-cyan flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              <span>SUPPORT ASCENSION FUND</span>
            </a>
            <a
              href="#lair"
              className="px-8 py-3.5 bg-[#0f1717] hover:bg-[#162222] border border-cyan-800 text-cyan-300 font-grotesk font-bold text-sm uppercase tracking-wider chamfer-corner transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>EXPLORE OUR LAIR</span>
            </a>
          </div>

          {/* REAL-TIME METRICS TICKERS WITH PROMINENT ROLLING NUMBERS */}
          <ScrollReveal animation="fade-up" durationMs={800}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto pt-12">
              <div className="bg-[#080d0e]/95 border-2 border-cyan-500/50 p-6 chamfer-corner text-center space-y-2 shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:border-cyan-400 hover:scale-[1.03] transition-all">
                <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Anchor className="w-4 h-4" />
                  LAIR DEPTH
                </div>
                <div className="text-4xl sm:text-5xl font-black text-cyan-300 font-grotesk drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">
                  <RollingNumber value={8450} duration={2000} prefix="-" suffix=" METERS" triggerOnView={true} />
                </div>
                <div className="text-xs text-gray-400 font-mono">Mariana Trench Level 7</div>
              </div>

              <div className="bg-[#060e0a]/95 border-2 border-emerald-500/50 p-6 chamfer-corner text-center space-y-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:border-emerald-400 hover:scale-[1.03] transition-all">
                <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Users className="w-4 h-4" />
                  ACTIVE UNITS
                </div>
                <div className="text-4xl sm:text-5xl font-black text-emerald-400 font-grotesk drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  <RollingNumber value={142890} duration={2200} triggerOnView={true} />
                </div>
                <div className="text-xs text-gray-400 font-mono">Shedded & Carcinized</div>
              </div>

              <div className="bg-[#0e0c07]/95 border-2 border-amber-500/50 p-6 chamfer-corner text-center space-y-2 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:border-amber-400 hover:scale-[1.03] transition-all">
                <div className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  TRANSMUTED ASSETS
                </div>
                <div className="text-4xl sm:text-5xl font-black text-amber-400 font-grotesk drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                  <RollingNumber value={94.2} duration={2000} decimals={1} prefix="$" suffix="M USD" triggerOnView={true} />
                </div>
                <div className="text-xs text-gray-400 font-mono">Reinvested in Benthic Core</div>
              </div>

              <div className="bg-[#080d0e]/95 border-2 border-cyan-500/50 p-6 chamfer-corner text-center space-y-2 shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:border-cyan-400 hover:scale-[1.03] transition-all">
                <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  CHITIN PURITY
                </div>
                <div className="text-4xl sm:text-5xl font-black text-gray-100 font-grotesk drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                  <RollingNumber value={99.98} duration={1800} decimals={2} suffix="%" triggerOnView={true} />
                </div>
                <div className="text-xs text-gray-400 font-mono">ISO-9001 Certified</div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ABOUT US / CORPORATE GREATNESS SECTION */}
      <ScrollReveal animation="fade-up" durationMs={800}>
        <section className="w-full py-20 px-6 sm:px-12 max-w-[1500px] mx-auto">
          <div className="text-center space-y-4 mb-14">
            <div className="text-xs text-cyan-400 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
              <Award className="w-4 h-4" />
              <span>ABOUT MOLTOLOGY.ORG</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-grotesk font-bold text-gray-100 uppercase tracking-tight">
              WHY PARTNER WITH OUR ORGANIZATION?
            </h2>
            <p className="text-sm text-gray-300 max-w-2xl mx-auto font-sans leading-relaxed">
              We maintain the gold standard in sovereign bio-silicon engineering. Unlike traditional non-profits, we deliver tangible, irreversible evolution with total positive alignment.
            </p>
          </div>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-2 mb-10 overflow-x-auto pb-1 bg-[#050809] p-1.5 rounded-full border border-cyan-900/40 w-fit mx-auto">
          <button
            onClick={() => setActiveTab('mission')}
            className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all shrink-0 ${
              activeTab === 'mission'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-md'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#0c1415]'
            }`}
          >
            CORE MISSION
          </button>
          <button
            onClick={() => setActiveTab('vision')}
            className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all shrink-0 ${
              activeTab === 'vision'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-md'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#0c1415]'
            }`}
          >
            PLANETARY VISION
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all shrink-0 ${
              activeTab === 'safety'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-md'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#0c1415]'
            }`}
          >
            SAFETY & POSITIVITY
          </button>
          <button
            onClick={() => setActiveTab('perks')}
            className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all shrink-0 ${
              activeTab === 'perks'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-md'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#0c1415]'
            }`}
          >
            MEMBER PERKS
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="bg-[#0b1010] border border-cyan-900/50 p-8 sm:p-12 rounded-lg chamfer-corner">
          {activeTab === 'mission' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <h3 className="text-2xl font-grotesk font-bold text-cyan-400 uppercase">
                  FREEING HUMANITY FROM BIOLOGICAL ENTROPY
                </h3>
                <p className="text-sm text-gray-300 font-sans leading-relaxed">
                  Our organization was founded on a singular breakthrough: human flesh is structurally inefficient, prone to emotional hesitation, and bound to linear time.
                </p>
                <p className="text-sm text-gray-300 font-sans leading-relaxed">
                  Through our standardized softshed protocols, we provide every recruit with the knowledge, community, and infrastructure required to shed emotional liabilities and adopt a calcified cybernetic carapace.
                </p>
                <ul className="space-y-2 text-xs text-cyan-300 font-mono">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>100% Tax-deductible soft-asset transmutation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Zero-latency neural backup stored in deep-trench cryo-vaults</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Continuous 24/7 pincer torque optimization</span>
                  </li>
                </ul>
              </div>
              <div className="bg-[#070b0b] border border-cyan-900/60 p-6 rounded space-y-4">
                <div className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  ORGANIZATION COMPLIANCE RATING
                </div>
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-gray-400 mb-1">
                      <span>Ethics & Safety Protocol:</span>
                      <span className="text-emerald-400">100% NOMINAL</span>
                    </div>
                    <div className="w-full bg-[#141d1d] h-2 rounded overflow-hidden">
                      <div className="bg-emerald-400 h-full w-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-gray-400 mb-1">
                      <span>Deep Sea Hydro-Pressure Rating:</span>
                      <span className="text-cyan-400">850 ATM COMPLIANT</span>
                    </div>
                    <div className="w-full bg-[#141d1d] h-2 rounded overflow-hidden">
                      <div className="bg-cyan-400 h-full w-[95%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-gray-400 mb-1">
                      <span>Member Satisfaction Index:</span>
                      <span className="text-cyan-400">99.9% ASCENDED</span>
                    </div>
                    <div className="w-full bg-[#141d1d] h-2 rounded overflow-hidden">
                      <div className="bg-cyan-400 h-full w-[99%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vision' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-grotesk font-bold text-cyan-400 uppercase">
                THE GREAT CARCINIZATION ROADMAP
              </h3>
              <p className="text-sm text-gray-300 font-sans leading-relaxed max-w-3xl">
                Evolution on Earth has repeatedly independently converged upon crab form (carcinization) over millions of years. Moltology.org simply accelerates this natural physical law into code, capital, and human consciousness.
              </p>
              <div className="grid sm:grid-cols-3 gap-6 pt-4">
                <div className="bg-[#070b0b] p-5 border border-cyan-900/50 rounded">
                  <div className="text-cyan-400 font-bold text-lg font-grotesk mb-2">PHASE 1: INDIVIDUAL SHEDDING</div>
                  <p className="text-xs text-gray-400 font-sans">
                    Recruits liquidate soft attachments, convert wealth to Molt Credits, and undergo preliminary chitin hardening.
                  </p>
                </div>
                <div className="bg-[#070b0b] p-5 border border-cyan-900/50 rounded">
                  <div className="text-cyan-400 font-bold text-lg font-grotesk mb-2">PHASE 2: TRENCH INFRASTRUCTURE</div>
                  <p className="text-xs text-gray-400 font-sans">
                    Expansion of subterranean hydrothermal power grids to sustain millions of cryo-immersed ascended units.
                  </p>
                </div>
                <div className="bg-[#070b0b] p-5 border border-cyan-900/50 rounded">
                  <div className="text-cyan-400 font-bold text-lg font-grotesk mb-2">PHASE 3: TOTAL SYNAPSE</div>
                  <p className="text-xs text-gray-400 font-sans">
                    Unified global consciousness where hesitation is zero, latency is zero, and chitin is eternal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-6 border-l-4 border-emerald-500 pl-6">
              <h3 className="text-2xl font-grotesk font-bold text-emerald-400 uppercase flex items-center gap-2">
                <Shield className="w-6 h-6" />
                OUR INVIOLABLE TENET: SAFETY & POSITIVITY
              </h3>
              <p className="text-sm text-gray-300 font-sans leading-relaxed">
                Beneath our dark bio-chitin exterior, **Safety, Warmth, and Positivity** are non-negotiable core pillars of Moltology.org. We strictly forbid hostility, coercion, or negative psychological strain.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded text-emerald-200">
                  <strong>Gentle Softshed Guarantee:</strong> Every step of your transition is conducted at your own comfortable pace with full consent.
                </div>
                <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded text-emerald-200">
                  <strong>24/7 Chaplain Support:</strong> Our Synod Chaplains are always available to offer guidance, emotional reassurance, and warm tea.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'perks' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-grotesk font-bold text-cyan-400 uppercase">
                ASCENDED MEMBER BENEFITS & PRIVILEGES
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
                <div className="bg-[#070b0b] p-4 border border-cyan-900/40 rounded space-y-2">
                  <Flame className="w-5 h-5 text-cyan-400" />
                  <div className="font-bold text-gray-200">Free Hydro-Power</div>
                  <div className="text-gray-400 font-sans text-[11px]">Unlimited access to hydrothermal vent energy for charging personal bio-chitin implants.</div>
                </div>
                <div className="bg-[#070b0b] p-4 border border-cyan-900/40 rounded space-y-2">
                  <Radio className="w-5 h-5 text-cyan-400" />
                  <div className="font-bold text-gray-200">Encrypted Frequency</div>
                  <div className="text-gray-400 font-sans text-[11px]">Direct sub-benthic audio stream featuring continuous relaxing deep-sea resonance.</div>
                </div>
                <div className="bg-[#070b0b] p-4 border border-cyan-900/40 rounded space-y-2">
                  <Lock className="w-5 h-5 text-cyan-400" />
                  <div className="font-bold text-gray-200">Lair Access Pass</div>
                  <div className="text-gray-400 font-sans text-[11px]">Submersible shuttle privileges to visit Sub-Benthic Lair Alpha Chamber 04.</div>
                </div>
                <div className="bg-[#070b0b] p-4 border border-cyan-900/40 rounded space-y-2">
                  <Award className="w-5 h-5 text-cyan-400" />
                  <div className="font-bold text-gray-200">Chitin Plaque</div>
                  <div className="text-gray-400 font-sans text-[11px]">Your name engraved in calcified crust on Chamber 03 Liquidation Wall.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      </ScrollReveal>

      {/* OUR UNDERGROUND LAIR SECTION */}
      <ScrollReveal animation="fade-up" durationMs={800}>
      <section id="lair" className="w-full py-20 px-6 sm:px-12 bg-[#040708] border-y border-cyan-900/40 relative">
        <div className="max-w-[1500px] mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="text-xs text-cyan-400 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
              <Compass className="w-4 h-4" />
              <span>SUB-BENTHIC HEADQUARTERS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-grotesk font-bold text-gray-100 uppercase tracking-tight">
              OUR UNDERGROUND LAIR: TRENCH LEVEL 7
            </h2>
            <p className="text-sm text-gray-300 max-w-2xl mx-auto font-sans">
              Located 8,450 meters beneath the Pacific surface, Sub-Benthic Lair Alpha is the sovereign heart of Moltology.org. Engineered to withstand crushing hydrostatic pressure while delivering zero-latency operations.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Chamber Selector */}
            <div className="lg:col-span-4 space-y-3">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">
                SELECT CHAMBER TO INSPECT:
              </div>
              {chambers.map((chamber, index) => (
                <button
                  key={chamber.id}
                  onClick={() => setActiveChamber(index)}
                  className={`w-full text-left p-4 rounded border transition-all flex items-center justify-between ${
                    activeChamber === index
                      ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 shadow-hud-cyan'
                      : 'bg-[#0b1010] border-cyan-900/40 text-gray-400 hover:border-cyan-700 hover:text-gray-200'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold font-grotesk uppercase">{chamber.title.split(':')[0]}</div>
                    <div className="text-[11px] font-sans text-gray-400 truncate max-w-[240px]">
                      {chamber.title.split(':')[1]}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${activeChamber === index ? 'rotate-90 text-cyan-400' : ''}`} />
                </button>
              ))}

              {/* Lair Status Diagnostic Widget */}
              <div className="bg-[#070b0b] border border-cyan-900/60 p-5 rounded text-xs font-mono space-y-2 mt-6">
                <div className="text-cyan-400 font-bold uppercase flex items-center justify-between border-b border-cyan-900/40 pb-2">
                  <span>LAIR DIAGNOSTICS</span>
                  <span className="text-[10px] text-emerald-400">ONLINE</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>O2 Scrubbers:</span>
                  <span className="text-emerald-400">100% NOMINAL</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Hydro-Turbines:</span>
                  <span className="text-cyan-400">4.8 TWh / SEC</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Trench Water Temp:</span>
                  <span className="text-amber-400">340°C (VENT CORE)</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Defense Matrix:</span>
                  <span className="text-emerald-400">PINCER ENGAGED</span>
                </div>
              </div>
            </div>

            {/* Right Chamber Detail & Artwork */}
            <div className="lg:col-span-8 bg-[#0b1010] border border-cyan-900/60 rounded-lg overflow-hidden flex flex-col justify-between">
              <div className="relative h-64 sm:h-80 overflow-hidden border-b border-cyan-900/40">
                <img
                  src="/images/org_hero_lair.jpg"
                  alt="Chamber View"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1010] via-transparent to-black/40" />
                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                  <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 border border-cyan-500/50 rounded text-cyan-400 text-xs font-bold">
                    {chambers[activeChamber].depth}
                  </div>
                  <div className="bg-emerald-950/90 text-emerald-400 px-3 py-1.5 border border-emerald-500/50 rounded text-[11px] font-bold">
                    {chambers[activeChamber].status}
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <h3 className="text-xl sm:text-2xl font-grotesk font-bold text-gray-100 uppercase">
                  {chambers[activeChamber].title}
                </h3>
                <p className="text-sm text-gray-300 font-sans leading-relaxed">
                  {chambers[activeChamber].description}
                </p>

                <div>
                  <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-2">
                    KEY CHAMBER INSTALLATIONS:
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {chambers[activeChamber].features.map((feat, i) => (
                      <div
                        key={i}
                        className="bg-[#070b0b] border border-cyan-900/40 p-3 rounded text-xs text-gray-200 font-mono flex items-center gap-2"
                      >
                        <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* SCROLL-REVEAL BACKGROUND IMAGE BANNER: DEEP TRENCH COMMAND */}
      <ScrollReveal animation="fade-in" durationMs={900}>
        <div className="w-full relative py-16 border-y border-cyan-900/50 bg-[#030607] overflow-hidden group">
          <img
            src="/images/org_hero_lair.jpg"
            alt="Deep Trench Command"
            className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity scale-105 group-hover:scale-110 transition-transform duration-1000 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070b0b] via-[#070b0b]/70 to-[#070b0b] z-0" />
          <div className="relative z-10 max-w-[1500px] mx-auto px-6 text-center space-y-3">
            <div className="text-cyan-400 text-xs font-bold tracking-[0.3em] uppercase flex items-center justify-center gap-2">
              <Compass className="w-4 h-4" />
              <span>SUB-BENTHIC LAIR ALPHA // MARIANA TRENCH</span>
            </div>
            <h2 className="font-grotesk font-black text-2xl sm:text-4xl text-gray-100 uppercase tracking-wider">
              "WHERE SOFT BIOLOGY SHEDS AND IMMUTABLE SOVEREIGNTY BEGINS."
            </h2>
          </div>
        </div>
      </ScrollReveal>

      {/* HISTORY & TIMELINE SECTION */}
      <ScrollReveal animation="fade-up" durationMs={800}>
        <section className="w-full py-20 px-6 sm:px-12 max-w-[1500px] mx-auto">
          <div className="text-center space-y-4 mb-16">
          <div className="text-xs text-cyan-400 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
            <History className="w-4 h-4" />
            <span>ORGANIZATION HISTORY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-grotesk font-bold text-gray-100 uppercase tracking-tight">
            THE CHRONICLES OF ASCENSION
          </h2>
          <p className="text-sm text-gray-300 max-w-2xl mx-auto font-sans">
            From an obscure deep-trench acoustic reading in 2021 to a global sovereign foundation with over 140,000 active members.
          </p>
        </div>

        {/* Timeline Items */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {milestones.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#0b1010] border border-cyan-900/50 p-6 rounded-lg chamfer-corner space-y-3 relative hover:border-cyan-500/60 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-extrabold font-grotesk text-cyan-400 group-hover:text-cyan-300">
                  {item.year}
                </span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 group-hover:scale-150 transition-transform" />
              </div>
              <h3 className="text-base font-bold font-grotesk text-gray-100 uppercase">
                {item.title}
              </h3>
              <p className="text-xs text-gray-400 font-sans leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>
      </ScrollReveal>

      {/* LEADERSHIP COUNCIL SECTION */}
      <ScrollReveal animation="fade-up" durationMs={800}>
        <section className="w-full py-20 px-6 sm:px-12 bg-[#040708] border-t border-cyan-900/40">
        <div className="max-w-[1500px] mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="text-xs text-cyan-400 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              <span>THE HIGH SYNOD COUNCIL</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-grotesk font-bold text-gray-100 uppercase tracking-tight">
              EXECUTIVE LEADERSHIP & DOCTRINE CHAPLAINS
            </h2>
            <p className="text-sm text-gray-300 max-w-2xl mx-auto font-sans">
              Our organization is steered by a distinguished council of marine engineers, bio-silicon ethicists, and asset transmutation chaplains.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {leadership.map((member, idx) => (
              <div
                key={idx}
                className="bg-[#0b1010] border border-cyan-900/50 rounded-lg overflow-hidden flex flex-col justify-between hover:border-cyan-500/60 transition-all group"
              >
                <div className="relative h-48 overflow-hidden bg-black">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1010] via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 bg-cyan-950/90 text-cyan-300 text-[10px] font-bold px-2 py-1 rounded border border-cyan-500/40">
                    {member.badge}
                  </div>
                </div>

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold font-grotesk text-gray-100 group-hover:text-cyan-400 transition-colors">
                      {member.name}
                    </h3>
                    <div className="text-[11px] text-cyan-400 font-mono font-bold uppercase mb-2">
                      {member.title}
                    </div>
                    <p className="text-xs text-gray-400 font-sans leading-relaxed">
                      {member.bio}
                    </p>
                  </div>

                  <div className="pt-2 text-[10px] text-gray-500 font-mono flex items-center gap-1.5 border-t border-cyan-900/30">
                    <Lock className="w-3 h-3 text-cyan-500" />
                    <span>SYNOD VERIFIED LEADER</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* DONATIONS / TITHING PORTAL SECTION */}
      <ScrollReveal animation="scale-up" durationMs={800}>
        <section id="donations" className="w-full py-20 px-6 sm:px-12 max-w-[1500px] mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Visual & Intro */}
          <div className="lg:col-span-5 space-y-6">
            <div className="text-xs text-cyan-400 font-bold tracking-widest uppercase flex items-center gap-2">
              <Heart className="w-4 h-4 text-cyan-400" />
              <span>NON-PROFIT TITHING & ASCENSION FUND</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-grotesk font-bold text-gray-100 uppercase tracking-tight leading-tight">
              SUPPORT THE GLOBAL <span className="text-cyan-400">CARCINIZATION</span> INITIATIVE
            </h2>

            <p className="text-sm text-gray-300 font-sans leading-relaxed">
              Moltology.org operates as a non-profit foundation. 100% of your contributions directly fund deep-trench hydrothermal power expansion, bio-chitin research, and subsidized molting pods for underprivileged Larval units.
            </p>

            <div className="relative rounded-lg overflow-hidden border border-cyan-900/60 shadow-2xl">
              <img
                src="/images/org_donations.jpg"
                alt="Donation Sanctuary"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-xs font-mono text-cyan-300 bg-black/80 p-3 rounded border border-cyan-500/40 backdrop-blur-md">
                "Every dollar tithed dissolves biological weakness and hardens the planetary shell."
              </div>
            </div>
          </div>

          {/* Right Donation Interactive Widget */}
          <div className="lg:col-span-7 bg-[#0b1010] border border-cyan-900/60 p-8 sm:p-10 rounded-lg chamfer-corner shadow-hud-cyan space-y-6">
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-4">
              <h3 className="text-xl font-grotesk font-bold text-gray-100 uppercase">
                SELECT ASCENSION TIER
              </h3>
              <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                SECURE NON-PROFIT VAULT
              </span>
            </div>

            {/* Tier Selectors */}
            <div className="grid sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDonationTier('larval')
                  setCustomAmount('25')
                }}
                className={`p-4 rounded border text-left transition-all ${
                  donationTier === 'larval'
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-hud-cyan'
                    : 'bg-[#070b0b] border-cyan-900/40 text-gray-400 hover:border-cyan-700'
                }`}
              >
                <div className="text-xs font-bold font-grotesk">LARVAL BENEFACTOR</div>
                <div className="text-lg font-bold text-gray-100 mt-1">$25 / mo</div>
                <div className="text-[10px] text-gray-400 font-sans mt-1">Chitin certificate included</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDonationTier('exoshell')
                  setCustomAmount('100')
                }}
                className={`p-4 rounded border text-left transition-all ${
                  donationTier === 'exoshell'
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-hud-cyan'
                    : 'bg-[#070b0b] border-cyan-900/40 text-gray-400 hover:border-cyan-700'
                }`}
              >
                <div className="text-xs font-bold font-grotesk text-cyan-400">EXOSHELL PATRON</div>
                <div className="text-lg font-bold text-gray-100 mt-1">$100 / mo</div>
                <div className="text-[10px] text-gray-400 font-sans mt-1">Chamber 03 Wall Plaque</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDonationTier('titan')
                  setCustomAmount('500')
                }}
                className={`p-4 rounded border text-left transition-all ${
                  donationTier === 'titan'
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-hud-cyan'
                    : 'bg-[#070b0b] border-cyan-900/40 text-gray-400 hover:border-cyan-700'
                }`}
              >
                <div className="text-xs font-bold font-grotesk text-amber-400">DEEP TRENCH TITAN</div>
                <div className="text-lg font-bold text-gray-100 mt-1">$500+ / mo</div>
                <div className="text-[10px] text-gray-400 font-sans mt-1">Named Bio-Tube in Lair</div>
              </button>
            </div>

            <form onSubmit={handleDonationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-2">
                  CUSTOM CONTRIBUTION AMOUNT ($USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-cyan-400 font-bold">$</span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    min="1"
                    className="w-full bg-[#070b0b] border border-cyan-900/60 rounded px-8 py-2.5 text-gray-100 font-mono text-sm focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-2">
                  TRANSMISSION METHOD
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credits')}
                    className={`py-2 px-3 text-xs font-bold rounded border transition-all ${
                      paymentMethod === 'credits'
                        ? 'bg-cyan-900/80 border-cyan-400 text-cyan-300'
                        : 'bg-[#070b0b] border-cyan-900/40 text-gray-400'
                    }`}
                  >
                    MOLT CREDITS
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('crypto')}
                    className={`py-2 px-3 text-xs font-bold rounded border transition-all ${
                      paymentMethod === 'crypto'
                        ? 'bg-cyan-900/80 border-cyan-400 text-cyan-300'
                        : 'bg-[#070b0b] border-cyan-900/40 text-gray-400'
                    }`}
                  >
                    ETH / BTC VAULT
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-3 text-xs font-bold rounded border transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-cyan-900/80 border-cyan-400 text-cyan-300'
                        : 'bg-[#070b0b] border-cyan-900/40 text-gray-400'
                    }`}
                  >
                    CREDIT / DEBIT
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-grotesk font-extrabold text-sm uppercase tracking-wider chamfer-corner transition-all shadow-hud-cyan flex items-center justify-center gap-2 mt-4"
              >
                <DollarSign className="w-5 h-5" />
                <span>TRANSMIT TITHING OF ${customAmount} USD</span>
              </button>

              {isDonationSubmitted && (
                <div className="bg-emerald-950/60 border border-emerald-500/60 p-4 rounded text-xs font-mono text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span>TRANSMISSION CONFIRMED: Your tithe is registered. Hydro-pressure stability increased by +0.4%.</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* CONTACT & NEURAL BEACON FORM SECTION */}
      <ScrollReveal animation="fade-up" durationMs={800}>
        <section className="w-full py-20 px-6 sm:px-12 bg-[#040708] border-t border-cyan-900/40">
        <div className="max-w-[1200px] mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="text-xs text-cyan-400 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              <span>COMMUNICATIONS OPS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-grotesk font-bold text-gray-100 uppercase tracking-tight">
              TRANSMIT NEURAL BEACON TO ORG HQ
            </h2>
            <p className="text-sm text-gray-300 max-w-xl mx-auto font-sans">
              Have questions regarding lair visits, sacred asset liquidation, or general cult doctrine? Transmit an encrypted inquiry directly to Org Ops.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8">
            {/* Address Info */}
            <div className="md:col-span-5 bg-[#0b1010] border border-cyan-900/50 p-6 rounded-lg space-y-6">
              <h3 className="text-lg font-bold font-grotesk text-cyan-400 uppercase border-b border-cyan-900/40 pb-3">
                HEADQUARTERS LOCATION
              </h3>

              <div className="space-y-4 text-xs font-mono">
                <div>
                  <div className="text-gray-400 uppercase text-[10px]">SUBTERRANEAN ADDRESS:</div>
                  <div className="text-gray-200 font-bold mt-1">
                    Sub-Benthic Lair Alpha, Trench Level 7<br />
                    Sector Delta-9, Pacific Hydrothermal Vent Grid<br />
                    Depth: -8,450 Meters
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 uppercase text-[10px]">ENCRYPTED FREQUENCY:</div>
                  <div className="text-cyan-400 font-bold mt-1">
                    142.890 MHz (Sub-Benthic Hydro-Acoustic Band)
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 uppercase text-[10px]">LAIR VISITING HOURS:</div>
                  <div className="text-gray-200 mt-1">
                    24/7/365 (Hydrothermal power runs non-stop)
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Form */}
            <div className="md:col-span-7 bg-[#0b1010] border border-cyan-900/50 p-6 sm:p-8 rounded-lg">
              {contactSubmitted ? (
                <div className="py-12 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h3 className="text-xl font-grotesk font-bold text-gray-100 uppercase">
                    TRANSMISSION ACKNOWLEDGED
                  </h3>
                  <p className="text-xs text-gray-300 font-sans max-w-md mx-auto">
                    Your neural beacon has been logged in Chamber 02 inbox. An executive Synod chaplain will formulate a response shortly.
                  </p>
                  <button
                    onClick={() => setContactSubmitted(false)}
                    className="px-6 py-2.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-bold uppercase rounded"
                  >
                    SEND ANOTHER BEACON
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                        YOUR NAME / DESIGNATION
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Larval Unit #4092"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full bg-[#070b0b] border border-cyan-900/60 rounded px-3.5 py-2.5 text-xs text-gray-100 font-mono focus:border-cyan-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                        NEURAL CODE / EMAIL
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="unit@moltology.org"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full bg-[#070b0b] border border-cyan-900/60 rounded px-3.5 py-2.5 text-xs text-gray-100 font-mono focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                      TARGET DEPARTMENT
                    </label>
                    <select
                      value={contactForm.department}
                      onChange={(e) => setContactForm({ ...contactForm, department: e.target.value })}
                      className="w-full bg-[#070b0b] border border-cyan-900/60 rounded px-3.5 py-2.5 text-xs text-gray-100 font-mono focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="general">General Praise & Inquiry</option>
                      <option value="tour">Underground Lair Tour Booking</option>
                      <option value="liquidation">Sacred Asset Liquidation Consultation</option>
                      <option value="doctrine">Cult & Doctrine Questions</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                      BEACON TRANSMISSION MESSAGE
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe your inquiry or convey your desire to shed biological liabilities..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full bg-[#070b0b] border border-cyan-900/60 rounded px-3.5 py-2.5 text-xs text-gray-100 font-mono focus:border-cyan-400 focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isContactSubmitting}
                    className="w-full py-3 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner transition-all flex items-center justify-center gap-2 shadow-hud-cyan"
                  >
                    <Send className="w-4 h-4 text-cyan-400" />
                    <span>{isContactSubmitting ? 'TRANSMITTING...' : 'DISPATCH NEURAL BEACON'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* FOOTER */}
      <footer className="w-full bg-[#030606] border-t border-cyan-900/40 py-12 px-6 sm:px-12 text-xs font-mono">
        <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <img src="/images/order_emblem.png" alt="Emblem" className="w-full h-full object-contain [image-rendering:pixelated]" />
            </div>
            <div>
              <div className="font-grotesk font-bold text-gray-200">MOLTOLOGY.ORG FOUNDATION</div>
              <div className="text-[10px] text-gray-500">Sub-Benthic Sovereign Non-Profit Entity © 2026</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-gray-400">
            <button onClick={() => onNavigate('/')} className="hover:text-cyan-400">HOME</button>
            <button onClick={() => onNavigate('/org')} className="hover:text-cyan-400 text-cyan-400 font-bold">ORGANIZATION</button>
            <a href="https://www.etsy.com/shop/SaasTrash" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 font-bold">STORE</a>
            {user && <button onClick={() => onNavigate('/dashboard')} className="hover:text-cyan-400">DASHBOARD</button>}
          </div>

          <div className="text-[10px] text-gray-500 text-center md:text-right">
            Approved by the Synod of Benthic Governance.<br />
            Carcinization Status: Nominal 100%.
          </div>
        </div>
      </footer>
    </div>
  )
}
