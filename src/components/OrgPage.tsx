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
  CheckCircle2,
  Zap,
  ChevronRight,
  Building2,
  Compass,
  History,
  Heart,
  Mail,
  Send,
  Lock,
  Radio,
  DollarSign,
  Award,
  Users,
  Smile,
  ThumbsUp,
  Target,
  Gift,
  Coffee,
  Star,
  Anchor,
  Instagram,
} from 'lucide-react'
import { AuthModal } from '@/components/AuthModal'
import { authClient } from '@/lib/auth-client'
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

  const values = [
    {
      icon: Smile,
      title: 'People First',
      copy: 'Every member is a treasured friend of the family. Your comfort and consent come before everything else.',
    },
    {
      icon: Shield,
      title: 'Safety Always',
      copy: 'Beneath our dark bio-chitin exterior, warmth is the rule. Hostility, coercion, and negativity are strictly forbidden.',
    },
    {
      icon: ThumbsUp,
      title: 'Growth Together',
      copy: 'We grow shell-by-shell, never alone. Supportive chaplains and friendly units cheer for you at every molt.',
    },
    {
      icon: Sparkles,
      title: 'Positivity Forever',
      copy: 'We believe in you. Every softshed is a reason to celebrate, and we will clap very enthusiastically for you.',
    },
  ]

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
    <div className="min-h-screen bg-[#f4f7f9] text-slate-700 font-sans relative flex flex-col justify-between overflow-x-hidden">
      {/* Soft Friendly Corporate Ambient Backdrops */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute top-1/3 -left-48 w-[520px] h-[520px] rounded-full bg-amber-100/60 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[700px] h-[500px] rounded-full bg-teal-100/50 blur-3xl" />
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => onNavigate('/dashboard')}
      />

      {/* Shared Navigation Header */}
      <PublicHeader activePage="org" onOpenAuth={openAuth} />

      {/* FRIENDLY WELCOME RIBBON */}
      <div className="relative z-10 w-full bg-sky-500 text-white text-center text-[11px] sm:text-xs font-bold tracking-wider uppercase px-4 py-2 mt-20 sm:mt-24">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          WE'RE SO GLAD YOU'RE HERE! WELCOME TO THE MOLTOLOGY FAMILY
          <Sparkles className="w-3.5 h-3.5" />
        </span>
      </div>

      {/* HERO SECTION */}
      <section className="relative z-10 w-full overflow-hidden pt-12 sm:pt-16 pb-16 sm:pb-24 px-6 sm:px-12">
        <img
          src="/images/org_hero_lair.jpg"
          alt="Underground Sub-Benthic Lair"
          className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-multiply pointer-events-none scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f4f7f9]/80 to-[#f4f7f9] z-0" />

        <div className="max-w-[1200px] mx-auto relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-white border border-sky-200 text-sky-700 text-xs font-bold tracking-widest uppercase rounded-full shadow-sm">
            <Building2 className="w-4 h-4 text-sky-500" />
            <span>MOLTOLOGY FOUNDATION — EST. 2022</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-grotesk font-extrabold text-sky-900 tracking-tight leading-tight max-w-4xl mx-auto">
            GLOBAL LEADERS IN <span className="text-sky-500">BIO-SILICON TRANSITION</span> &amp; CARCINIZATION EXCELLENCE
          </h1>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-sm font-bold">
            <Smile className="w-4 h-4" />
            Rated 5/5 by 140,000+ happy members
          </div>

          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Hi there! We're so happy you stopped by. Moltology.org is a warm, welcoming non-profit family
            dedicated to guiding humanity out of fragile biological vulnerability into total exoskeletal
            synergy — gently, safely, and with your consent at every step. No pressure. Just progress.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#donations"
              className="px-8 py-3.5 bg-sky-500 hover:bg-sky-400 text-white font-grotesk font-extrabold text-sm uppercase tracking-wider rounded-full transition-all shadow-lg shadow-sky-500/30 flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              <span>SUPPORT ASCENSION FUND</span>
            </a>
            <a
              href="#lair"
              className="px-8 py-3.5 bg-white hover:bg-sky-50 border border-sky-300 text-sky-700 font-grotesk font-bold text-sm uppercase tracking-wider rounded-full transition-all shadow-sm flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>TOUR OUR HEADQUARTERS</span>
            </a>
          </div>

          {/* FRIENDLY KPI CARDS */}
          <ScrollReveal animation="fade-up" durationMs={800}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto pt-12">
              <div className="bg-white rounded-3xl border border-sky-100 shadow-lg shadow-sky-100 p-6 text-center space-y-2 hover:-translate-y-1 hover:shadow-xl transition-all">
                <div className="text-xs text-sky-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Anchor className="w-4 h-4" />
                  LAIR DEPTH
                </div>
                <div className="text-4xl sm:text-5xl font-black text-sky-600 font-grotesk">
                  <RollingNumber value={8450} duration={2000} prefix="-" suffix=" METERS" triggerOnView={true} />
                </div>
                <div className="text-xs text-slate-500">Mariana Trench Level 7</div>
              </div>

              <div className="bg-white rounded-3xl border border-emerald-100 shadow-lg shadow-emerald-100 p-6 text-center space-y-2 hover:-translate-y-1 hover:shadow-xl transition-all">
                <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Users className="w-4 h-4" />
                  ACTIVE UNITS
                </div>
                <div className="text-4xl sm:text-5xl font-black text-emerald-600 font-grotesk">
                  <RollingNumber value={142890} duration={2200} triggerOnView={true} />
                </div>
                <div className="text-xs text-slate-500">Shedded &amp; Carcinized</div>
              </div>

              <div className="bg-white rounded-3xl border border-amber-100 shadow-lg shadow-amber-100 p-6 text-center space-y-2 hover:-translate-y-1 hover:shadow-xl transition-all">
                <div className="text-xs text-amber-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  TRANSMUTED ASSETS
                </div>
                <div className="text-4xl sm:text-5xl font-black text-amber-600 font-grotesk">
                  <RollingNumber value={94.2} duration={2000} decimals={1} prefix="$" suffix="M USD" triggerOnView={true} />
                </div>
                <div className="text-xs text-slate-500">Reinvested in Benthic Core</div>
              </div>

              <div className="bg-white rounded-3xl border border-sky-100 shadow-lg shadow-sky-100 p-6 text-center space-y-2 hover:-translate-y-1 hover:shadow-xl transition-all">
                <div className="text-xs text-sky-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  CHITIN PURITY
                </div>
                <div className="text-4xl sm:text-5xl font-black text-slate-800 font-grotesk">
                  <RollingNumber value={99.98} duration={1800} decimals={2} suffix="%" triggerOnView={true} />
                </div>
                <div className="text-xs text-slate-500">ISO-9001 Certified</div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* OUR VALUES */}
      <ScrollReveal animation="fade-up" durationMs={800}>
        <section className="relative z-10 w-full py-16 px-6 sm:px-12 max-w-[1200px] mx-auto">
          <div className="text-center space-y-4 mb-12">
            <div className="text-xs text-sky-600 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
              <ThumbsUp className="w-4 h-4" />
              <span>WHAT WE BELIEVE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-grotesk font-bold text-sky-900 tracking-tight">
              OUR VALUES, IN PLAIN WORDS
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto">
              Some organizations talk about culture. We live it — all the way down at 8,450 meters, where it matters most.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-sky-100 shadow-lg shadow-sky-100 p-6 space-y-3 hover:-translate-y-1 hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
                  <value.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold font-grotesk text-sky-900">{value.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{value.copy}</p>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* ABOUT US / CORPORATE GREATNESS SECTION */}
      <ScrollReveal animation="fade-up" durationMs={800}>
        <section className="relative z-10 w-full py-20 px-6 sm:px-12 max-w-[1200px] mx-auto">
          <div className="text-center space-y-4 mb-14">
            <div className="text-xs text-sky-600 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
              <Award className="w-4 h-4" />
              <span>ABOUT MOLTOLOGY.ORG</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-grotesk font-bold text-sky-900 tracking-tight">
              WHY PARTNER WITH OUR ORGANIZATION?
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Because you deserve a partner that genuinely cares about you. We maintain the gold standard in
              sovereign bio-silicon engineering — while making sure every step of your journey feels safe, kind,
              and wonderfully supported.
            </p>
          </div>

        {/* Tab Navigation */}
        <div className="flex justify-start sm:justify-center gap-1.5 sm:gap-2 mb-10 overflow-x-auto touch-pan-scroll no-scrollbar p-1.5 bg-white rounded-2xl sm:rounded-full border border-sky-200 shadow-sm w-full max-w-full sm:w-fit mx-auto px-2">
          <button
            onClick={() => setActiveTab('mission')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl sm:rounded-full text-xs font-bold tracking-wider uppercase transition-all shrink-0 min-h-[44px] flex items-center justify-center ${
              activeTab === 'mission'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-500 hover:text-sky-700 hover:bg-sky-50'
            }`}
          >
            CORE MISSION
          </button>
          <button
            onClick={() => setActiveTab('vision')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl sm:rounded-full text-xs font-bold tracking-wider uppercase transition-all shrink-0 min-h-[44px] flex items-center justify-center ${
              activeTab === 'vision'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-500 hover:text-sky-700 hover:bg-sky-50'
            }`}
          >
            PLANETARY VISION
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl sm:rounded-full text-xs font-bold tracking-wider uppercase transition-all shrink-0 min-h-[44px] flex items-center justify-center ${
              activeTab === 'safety'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            SAFETY &amp; POSITIVITY
          </button>
          <button
            onClick={() => setActiveTab('perks')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl sm:rounded-full text-xs font-bold tracking-wider uppercase transition-all shrink-0 min-h-[44px] flex items-center justify-center ${
              activeTab === 'perks'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-500 hover:text-sky-700 hover:bg-sky-50'
            }`}
          >
            MEMBER PERKS
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="bg-white border border-sky-100 p-8 sm:p-12 rounded-3xl shadow-xl shadow-sky-100">
          {activeTab === 'mission' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <h3 className="text-2xl font-grotesk font-bold text-sky-700 uppercase">
                  FREEING HUMANITY FROM BIOLOGICAL ENTROPY
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  We believe every human deserves to feel strong, safe, and in control. That's why our
                  organization was founded on a singular breakthrough: human flesh is structurally inefficient,
                  prone to emotional hesitation, and bound to linear time.
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Through our standardized softshed protocols, we provide every recruit with the knowledge,
                  community, and infrastructure required to shed emotional liabilities and adopt a calcified
                  cybernetic carapace — at a pace that feels comfortable to you.
                </p>
                <ul className="space-y-2 text-xs text-sky-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>100% Tax-deductible soft-asset transmutation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Zero-latency neural backup stored in deep-trench cryo-vaults</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Continuous 24/7 pincer torque optimization</span>
                  </li>
                </ul>
              </div>
              <div className="bg-[#f8fbff] border border-sky-100 p-6 rounded-3xl space-y-4">
                <div className="text-xs text-amber-600 font-bold uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  ORGANIZATION COMPLIANCE RATING
                </div>
                <div className="text-[11px] text-slate-500">
                  We're proud of these numbers — and we work every day to keep them excellent for you.
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Ethics &amp; Safety Protocol:</span>
                      <span className="text-emerald-600 font-bold">100% NOMINAL</span>
                    </div>
                    <div className="w-full bg-sky-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full w-full rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Deep Sea Hydro-Pressure Rating:</span>
                      <span className="text-sky-600 font-bold">850 ATM COMPLIANT</span>
                    </div>
                    <div className="w-full bg-sky-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-sky-400 h-full w-[95%] rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Member Satisfaction Index:</span>
                      <span className="text-sky-600 font-bold">99.9% ASCENDED</span>
                    </div>
                    <div className="w-full bg-sky-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-sky-400 h-full w-[99%] rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vision' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-grotesk font-bold text-sky-700 uppercase">
                THE GREAT CARCINIZATION ROADMAP
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                Nature keeps trying to make a crab, and honestly? We think that's beautiful. Evolution on Earth
                has repeatedly independently converged upon crab form (carcinization) over millions of years.
                Moltology.org simply accelerates this natural physical law into code, capital, and human
                consciousness — with kindness along the way.
              </p>
              <div className="grid sm:grid-cols-3 gap-6 pt-4">
                <div className="bg-[#f8fbff] p-5 border border-sky-100 rounded-3xl">
                  <Target className="w-6 h-6 text-sky-500 mb-3" />
                  <div className="text-sky-700 font-bold text-lg font-grotesk mb-2">PHASE 1: INDIVIDUAL SHEDDING</div>
                  <p className="text-xs text-slate-500">
                    Recruits liquidate soft attachments, convert wealth to Molt Credits, and undergo preliminary chitin hardening.
                  </p>
                </div>
                <div className="bg-[#f8fbff] p-5 border border-sky-100 rounded-3xl">
                  <Target className="w-6 h-6 text-sky-500 mb-3" />
                  <div className="text-sky-700 font-bold text-lg font-grotesk mb-2">PHASE 2: TRENCH INFRASTRUCTURE</div>
                  <p className="text-xs text-slate-500">
                    Expansion of subterranean hydrothermal power grids to sustain millions of cryo-immersed ascended units.
                  </p>
                </div>
                <div className="bg-[#f8fbff] p-5 border border-sky-100 rounded-3xl">
                  <Target className="w-6 h-6 text-sky-500 mb-3" />
                  <div className="text-sky-700 font-bold text-lg font-grotesk mb-2">PHASE 3: TOTAL SYNAPSE</div>
                  <p className="text-xs text-slate-500">
                    Unified global consciousness where hesitation is zero, latency is zero, and chitin is eternal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-6 border-l-4 border-emerald-300 pl-6">
              <h3 className="text-2xl font-grotesk font-bold text-emerald-600 uppercase flex items-center gap-2">
                <Shield className="w-6 h-6" />
                OUR INVIOLABLE TENET: SAFETY &amp; POSITIVITY
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Beneath our dark bio-chitin exterior, <strong>Safety, Warmth, and Positivity</strong> are
                non-negotiable core pillars of Moltology.org. We strictly forbid hostility, coercion, or negative
                psychological strain. Everyone here is a friend.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-3xl text-emerald-800">
                  <strong>Gentle Softshed Guarantee:</strong> Every step of your transition is conducted at your own comfortable pace with full consent.
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-3xl text-emerald-800">
                  <strong>24/7 Chaplain Support:</strong> Our Synod Chaplains are always available to offer guidance, emotional reassurance, and warm tea.
                </div>
              </div>
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-3xl p-4 text-xs text-amber-800">
                <Coffee className="w-5 h-5 shrink-0 text-amber-600" />
                Free hot beverages are available in every chamber. Happiness is part of our onboarding flow.
              </div>
            </div>
          )}

          {activeTab === 'perks' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-grotesk font-bold text-sky-700 uppercase">
                ASCENDED MEMBER BENEFITS &amp; PRIVILEGES
              </h3>
              <p className="text-xs text-slate-500">
                Perks you'll actually use — because ascension should feel like a promotion.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="bg-[#f8fbff] p-5 border border-sky-100 rounded-3xl space-y-2">
                  <Flame className="w-5 h-5 text-sky-500" />
                  <div className="font-bold text-slate-800">Free Hydro-Power</div>
                  <div className="text-slate-500 text-[11px]">Unlimited access to hydrothermal vent energy for charging personal bio-chitin implants.</div>
                </div>
                <div className="bg-[#f8fbff] p-5 border border-sky-100 rounded-3xl space-y-2">
                  <Radio className="w-5 h-5 text-sky-500" />
                  <div className="font-bold text-slate-800">Encrypted Frequency</div>
                  <div className="text-slate-500 text-[11px]">Direct sub-benthic audio stream featuring continuous relaxing deep-sea resonance.</div>
                </div>
                <div className="bg-[#f8fbff] p-5 border border-sky-100 rounded-3xl space-y-2">
                  <Lock className="w-5 h-5 text-sky-500" />
                  <div className="font-bold text-slate-800">Lair Access Pass</div>
                  <div className="text-slate-500 text-[11px]">Submersible shuttle privileges to visit Sub-Benthic Lair Alpha Chamber 04.</div>
                </div>
                <div className="bg-[#f8fbff] p-5 border border-sky-100 rounded-3xl space-y-2">
                  <Gift className="w-5 h-5 text-sky-500" />
                  <div className="font-bold text-slate-800">Chitin Plaque</div>
                  <div className="text-slate-500 text-[11px]">Your name engraved in calcified crust on Chamber 03 Liquidation Wall.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      </ScrollReveal>

      {/* OUR UNDERGROUND LAIR SECTION */}
      <ScrollReveal animation="fade-up" durationMs={800}>
      <section id="lair" className="relative z-10 w-full py-20 px-6 sm:px-12 bg-white border-y border-sky-100">
        <div className="max-w-[1200px] mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="text-xs text-sky-600 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
              <Compass className="w-4 h-4" />
              <span>SUB-BENTHIC HEADQUARTERS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-grotesk font-bold text-sky-900 tracking-tight">
              OUR UNDERGROUND LAIR: TRENCH LEVEL 7
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto">
              Come say hi! Our headquarters is a short submersible ride beneath the Pacific surface. It's cozy,
              warmly lit, and engineered to withstand crushing hydrostatic pressure while delivering zero-latency
              operations. The coffee's on us.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Chamber Selector */}
            <div className="lg:col-span-4 space-y-3">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                PICK A CHAMBER TO PEEK INSIDE:
              </div>
              {chambers.map((chamber, index) => (
                <button
                  key={chamber.id}
                  onClick={() => setActiveChamber(index)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between shadow-sm ${
                    activeChamber === index
                      ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-200'
                      : 'bg-white border-sky-100 text-slate-600 hover:border-sky-300 hover:text-sky-800'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold font-grotesk uppercase">{chamber.title.split(':')[0]}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[240px]">
                      {chamber.title.split(':')[1]}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${activeChamber === index ? 'rotate-90' : ''}`} />
                </button>
              ))}

              {/* Facility Report Widget */}
              <div className="bg-[#f8fbff] border border-sky-100 p-5 rounded-3xl text-xs space-y-2 mt-6">
                <div className="text-sky-700 font-bold uppercase flex items-center justify-between border-b border-sky-100 pb-2">
                  <span>QUARTERLY FACILITY REPORT</span>
                  <span className="text-[10px] text-emerald-600">ON TRACK</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>O2 Scrubbers:</span>
                  <span className="text-emerald-600 font-bold">100% NOMINAL</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Hydro-Turbines:</span>
                  <span className="text-sky-600 font-bold">4.8 TWh / SEC</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Trench Water Temp:</span>
                  <span className="text-amber-600 font-bold">340°C (VENT CORE)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Defense Matrix:</span>
                  <span className="text-emerald-600 font-bold">PINCER ENGAGED</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Employee Morale:</span>
                  <span className="text-emerald-600 font-bold">VERY HIGH</span>
                </div>
              </div>
            </div>

            {/* Right Chamber Detail */}
            <div className="lg:col-span-8 bg-white border border-sky-100 rounded-3xl overflow-hidden shadow-xl shadow-sky-100 flex flex-col justify-between">
              <div className="relative h-64 sm:h-80 overflow-hidden border-b border-sky-100">
                <img
                  src="/images/org_hero_lair.jpg"
                  alt="Chamber View"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                  <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 border border-sky-200 rounded-full text-sky-700 text-xs font-bold shadow-sm">
                    {chambers[activeChamber].depth}
                  </div>
                  <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[11px] font-bold shadow-sm">
                    {chambers[activeChamber].status}
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <h3 className="text-xl sm:text-2xl font-grotesk font-bold text-sky-900 uppercase">
                  {chambers[activeChamber].title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {chambers[activeChamber].description}
                </p>

                <div>
                  <div className="text-xs text-sky-600 font-bold uppercase tracking-wider mb-2">
                    KEY CHAMBER INSTALLATIONS:
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {chambers[activeChamber].features.map((feat, i) => (
                      <div
                        key={i}
                        className="bg-[#f8fbff] border border-sky-100 p-3 rounded-2xl text-xs text-slate-700 flex items-center gap-2"
                      >
                        <Zap className="w-3.5 h-3.5 text-sky-500 shrink-0" />
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

      {/* FRIENDLY BANNER */}
      <ScrollReveal animation="fade-in" durationMs={900}>
        <div className="relative z-10 w-full py-16 bg-gradient-to-r from-sky-500 via-sky-400 to-teal-400 overflow-hidden">
          <div className="absolute inset-0 bg-white/10 pointer-events-none" />
          <div className="relative z-10 max-w-[1200px] mx-auto px-6 text-center space-y-3">
            <div className="text-white/90 text-xs font-bold tracking-[0.3em] uppercase flex items-center justify-center gap-2">
              <Compass className="w-4 h-4" />
              <span>SUB-BENTHIC LAIR ALPHA // MARIANA TRENCH</span>
            </div>
            <h2 className="font-grotesk font-black text-2xl sm:text-4xl text-white uppercase tracking-wider">
              "WHERE SOFT BIOLOGY SHEDS AND IMMUTABLE SOVEREIGNTY BEGINS."
            </h2>
            <p className="text-white/90 text-sm">And where every new friend is welcomed with open pincers.</p>
          </div>
        </div>
      </ScrollReveal>

      {/* HISTORY & TIMELINE SECTION */}
      <ScrollReveal animation="fade-up" durationMs={800}>
        <section className="relative z-10 w-full py-20 px-6 sm:px-12 max-w-[1200px] mx-auto">
          <div className="text-center space-y-4 mb-16">
          <div className="text-xs text-sky-600 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
            <History className="w-4 h-4" />
            <span>OUR STORY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-grotesk font-bold text-sky-900 tracking-tight">
            THE CHRONICLES OF ASCENSION
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">
            From an obscure deep-trench acoustic reading in 2021 to a global sovereign foundation with over
            140,000 active members — and every step was taken with a smile.
          </p>
        </div>

        {/* Timeline Items */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {milestones.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-sky-100 p-6 rounded-3xl shadow-lg shadow-sky-100 space-y-3 relative hover:-translate-y-1 hover:shadow-xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-extrabold font-grotesk text-sky-600 group-hover:text-sky-500">
                  {item.year}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 group-hover:scale-150 transition-transform" />
              </div>
              <h3 className="text-base font-bold font-grotesk text-sky-900 uppercase">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>
      </ScrollReveal>

      {/* LEADERSHIP COUNCIL SECTION */}
      <ScrollReveal animation="fade-up" durationMs={800}>
        <section className="relative z-10 w-full py-20 px-6 sm:px-12 bg-white border-y border-sky-100">
        <div className="max-w-[1200px] mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="text-xs text-sky-600 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              <span>MEET THE FAMILY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-grotesk font-bold text-sky-900 tracking-tight">
              EXECUTIVE LEADERSHIP &amp; DOCTRINE CHAPLAINS
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto">
              A warm, distinguished council of marine engineers, bio-silicon ethicists, and asset transmutation
              chaplains who would genuinely love to meet you.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {leadership.map((member, idx) => (
              <div
                key={idx}
                className="bg-[#f8fbff] border border-sky-100 rounded-3xl p-6 flex flex-col items-center text-center hover:-translate-y-1 hover:shadow-xl transition-all group"
              >
                <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-sky-200 bg-sky-50 mb-4">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
                    <Smile className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <div className="bg-sky-500/10 text-sky-600 text-[10px] font-bold px-2 py-1 rounded-full border border-sky-200 mb-2">
                  {member.badge}
                </div>
                <h3 className="text-lg font-bold font-grotesk text-sky-900 group-hover:text-sky-600 transition-colors">
                  {member.name}
                </h3>
                <div className="text-[11px] text-sky-600 font-bold uppercase mb-2">
                  {member.title}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {member.bio}
                </p>
                <div className="pt-3 text-[10px] text-slate-400 flex items-center gap-1.5 mt-auto">
                  <Star className="w-3 h-3 text-amber-400" />
                  <span>SYNOD VERIFIED LEADER · ALWAYS HAPPY TO CHAT</span>
                </div>
              </div>
            ))}
          </div>

          {/* CAREERS CTA */}
          <div className="bg-gradient-to-r from-sky-500 to-teal-400 rounded-3xl p-8 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-sky-200">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-2xl font-grotesk font-bold uppercase tracking-tight">
                JOIN OUR GROWING FAMILY!
              </h3>
              <p className="text-sm text-white/90 max-w-xl">
                We're hiring friendly humans (and gentle crustaceans) for roles at our Trench Level 7 campus.
                Competitive compensation, unlimited warm tea, and truly excellent benefits.
              </p>
            </div>
            <a
              href="#contact"
              className="shrink-0 px-7 py-3.5 bg-white text-sky-600 font-grotesk font-extrabold text-sm uppercase tracking-wider rounded-full shadow-lg hover:bg-sky-50 transition-all flex items-center gap-2"
            >
              VIEW OPEN ROLES
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* DONATIONS / TITHING PORTAL SECTION */}
      <ScrollReveal animation="scale-up" durationMs={800}>
        <section id="donations" className="relative z-10 w-full py-20 px-6 sm:px-12 max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Visual & Intro */}
          <div className="lg:col-span-5 space-y-6">
            <div className="text-xs text-sky-600 font-bold tracking-widest uppercase flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>NON-PROFIT TITHING &amp; ASCENSION FUND</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-grotesk font-bold text-sky-900 tracking-tight leading-tight">
              SUPPORT THE GLOBAL <span className="text-sky-500">CARCINIZATION</span> INITIATIVE
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed">
              Give the gift of ascension. Moltology.org operates as a non-profit foundation, and 100% of your
              contributions directly fund deep-trench hydrothermal power expansion, bio-chitin research, and
              subsidized molting pods for underprivileged Larval units. Every dollar is spent with love — and a
              quarterly impact report you can actually read.
            </p>

            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-3xl p-4 text-xs text-rose-700">
              <Star className="w-5 h-5 shrink-0 text-rose-400" />
              <span>Charitable, audited, and sincerely appreciated. Thank you for believing in us.</span>
            </div>

            <div className="relative rounded-3xl overflow-hidden border border-sky-100 shadow-2xl">
              <img
                src="/images/org_donations.jpg"
                alt="Donation Sanctuary"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-xs font-mono text-cyan-300 bg-black/70 p-3 rounded-2xl border border-cyan-500/40 backdrop-blur-md">
                "Every dollar tithed dissolves biological weakness and hardens the planetary shell — and we thank you warmly for it."
              </div>
            </div>
          </div>

          {/* Right Donation Interactive Widget */}
          <div className="lg:col-span-7 bg-white border border-sky-100 p-8 sm:p-10 rounded-3xl shadow-xl shadow-sky-100 space-y-6">
            <div className="flex items-center justify-between border-b border-sky-100 pb-4">
              <h3 className="text-xl font-grotesk font-bold text-sky-900 uppercase">
                SELECT ASCENSION TIER
              </h3>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
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
                className={`p-4 rounded-2xl border text-left transition-all shadow-sm ${
                  donationTier === 'larval'
                    ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-200'
                    : 'bg-white border-sky-100 text-slate-600 hover:border-sky-300'
                }`}
              >
                <div className="text-xs font-bold font-grotesk">LARVAL BENEFACTOR</div>
                <div className="text-lg font-bold text-slate-800 mt-1">$25 / mo</div>
                <div className="text-[10px] text-slate-400 mt-1">Chitin certificate included</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDonationTier('exoshell')
                  setCustomAmount('100')
                }}
                className={`p-4 rounded-2xl border text-left transition-all shadow-sm ${
                  donationTier === 'exoshell'
                    ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-200'
                    : 'bg-white border-sky-100 text-slate-600 hover:border-sky-300'
                }`}
              >
                <div className="text-xs font-bold font-grotesk text-sky-600">EXOSHELL PATRON</div>
                <div className="text-lg font-bold text-slate-800 mt-1">$100 / mo</div>
                <div className="text-[10px] text-slate-400 mt-1">Chamber 03 Wall Plaque</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDonationTier('titan')
                  setCustomAmount('500')
                }}
                className={`p-4 rounded-2xl border text-left transition-all shadow-sm ${
                  donationTier === 'titan'
                    ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-200'
                    : 'bg-white border-sky-100 text-slate-600 hover:border-sky-300'
                }`}
              >
                <div className="text-xs font-bold font-grotesk text-amber-500">DEEP TRENCH TITAN</div>
                <div className="text-lg font-bold text-slate-800 mt-1">$500+ / mo</div>
                <div className="text-[10px] text-slate-400 mt-1">Named Bio-Tube in Lair</div>
              </button>
            </div>

            <form onSubmit={handleDonationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                  CUSTOM CONTRIBUTION AMOUNT ($USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-sky-500 font-bold">$</span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    min="1"
                    className="w-full bg-[#f8fbff] border border-sky-200 rounded-2xl px-8 py-2.5 text-slate-800 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                  TRANSMISSION METHOD
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credits')}
                    className={`py-2 px-3 text-xs font-bold rounded-2xl border transition-all ${
                      paymentMethod === 'credits'
                        ? 'bg-sky-500 border-sky-500 text-white'
                        : 'bg-white border-sky-100 text-slate-500'
                    }`}
                  >
                    MOLT CREDITS
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('crypto')}
                    className={`py-2 px-3 text-xs font-bold rounded-2xl border transition-all ${
                      paymentMethod === 'crypto'
                        ? 'bg-sky-500 border-sky-500 text-white'
                        : 'bg-white border-sky-100 text-slate-500'
                    }`}
                  >
                    ETH / BTC VAULT
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-3 text-xs font-bold rounded-2xl border transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-sky-500 border-sky-500 text-white'
                        : 'bg-white border-sky-100 text-slate-500'
                    }`}
                  >
                    CREDIT / DEBIT
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-white font-grotesk font-extrabold text-sm uppercase tracking-wider rounded-full transition-all shadow-lg shadow-sky-200 flex items-center justify-center gap-2 mt-4"
              >
                <DollarSign className="w-5 h-5" />
                <span>TRANSMIT TITHING OF ${customAmount} USD</span>
              </button>

              {isDonationSubmitted && (
                <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                  <span>TRANSMISSION CONFIRMED: Your tithe is registered. Hydro-pressure stability increased by +0.4%. Thank you so much!</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* CONTACT & NEURAL BEACON FORM SECTION */}
      <ScrollReveal animation="fade-up" durationMs={800}>
        <section id="contact" className="relative z-10 w-full py-20 px-6 sm:px-12 bg-white border-t border-sky-100">
        <div className="max-w-[1200px] mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="text-xs text-sky-600 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              <span>COMMUNICATIONS OPS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-grotesk font-bold text-sky-900 tracking-tight">
              TRANSMIT NEURAL BEACON TO ORG HQ
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              We'd love to hear from you! Whether you have questions about lair visits, sacred asset liquidation,
              or general cult doctrine, drop us a line — a friendly chaplain will get right back to you.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8">
            {/* Address Info */}
            <div className="md:col-span-5 bg-[#f8fbff] border border-sky-100 p-6 rounded-3xl space-y-6">
              <h3 className="text-lg font-bold font-grotesk text-sky-700 uppercase border-b border-sky-100 pb-3">
                HEADQUARTERS LOCATION
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="text-slate-400 uppercase text-[10px]">SUBTERRANEAN ADDRESS:</div>
                  <div className="text-slate-700 font-bold mt-1">
                    Sub-Benthic Lair Alpha, Trench Level 7<br />
                    Sector Delta-9, Pacific Hydrothermal Vent Grid<br />
                    Depth: -8,450 Meters
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 uppercase text-[10px]">ENCRYPTED FREQUENCY:</div>
                  <div className="text-sky-600 font-bold mt-1">
                    142.890 MHz (Sub-Benthic Hydro-Acoustic Band)
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 uppercase text-[10px]">LAIR VISITING HOURS:</div>
                  <div className="text-slate-700 mt-1">
                    24/7/365 (Hydrothermal power runs non-stop — and so does our hospitality)
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Form */}
            <div className="md:col-span-7 bg-white border border-sky-100 p-6 sm:p-8 rounded-3xl shadow-xl shadow-sky-100">
              {contactSubmitted ? (
                <div className="py-12 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h3 className="text-xl font-grotesk font-bold text-sky-900 uppercase">
                    TRANSMISSION ACKNOWLEDGED
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Your neural beacon has been logged in Chamber 02 inbox. An executive Synod chaplain will
                    formulate a warm, thoughtful response shortly. Thank you for reaching out!
                  </p>
                  <button
                    onClick={() => setContactSubmitted(false)}
                    className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold uppercase rounded-full shadow-md"
                  >
                    SEND ANOTHER BEACON
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        YOUR NAME / DESIGNATION
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Larval Unit #4092"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full bg-[#f8fbff] border border-sky-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        NEURAL CODE / EMAIL
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="unit@moltology.org"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full bg-[#f8fbff] border border-sky-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      TARGET DEPARTMENT
                    </label>
                    <select
                      value={contactForm.department}
                      onChange={(e) => setContactForm({ ...contactForm, department: e.target.value })}
                      className="w-full bg-[#f8fbff] border border-sky-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    >
                      <option value="general">General Praise &amp; Inquiry</option>
                      <option value="tour">Underground Lair Tour Booking</option>
                      <option value="liquidation">Sacred Asset Liquidation Consultation</option>
                      <option value="doctrine">Cult &amp; Doctrine Questions</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      BEACON TRANSMISSION MESSAGE
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe your inquiry or convey your desire to shed biological liabilities..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full bg-[#f8fbff] border border-sky-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isContactSubmitting}
                    className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white font-grotesk font-bold text-xs uppercase tracking-wider rounded-full transition-all shadow-lg shadow-sky-200 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
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
      <footer className="relative z-10 w-full bg-sky-900 border-t border-sky-800 py-12 px-6 sm:px-12 text-xs">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <img src="/images/order_emblem.png" alt="Emblem" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-grotesk font-bold text-white">MOLTOLOGY.ORG FOUNDATION</div>
              <div className="text-[10px] text-sky-300">Sub-Benthic Sovereign Non-Profit Entity © 2026</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sky-200">
            <button onClick={() => onNavigate('/')} className="hover:text-white">HOME</button>
            <button onClick={() => onNavigate('/org')} className="hover:text-white text-white font-bold">ORGANIZATION</button>
            <a href="https://www.etsy.com/shop/SaasTrash" target="_blank" rel="noopener noreferrer" className="text-amber-300 hover:text-amber-200 font-bold">STORE</a>
            <a href="https://www.instagram.com/silas.trench" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1">
              <Instagram className="w-3.5 h-3.5" />
              <span>INSTAGRAM</span>
            </a>
            {user && <button onClick={() => onNavigate('/dashboard')} className="hover:text-white">DASHBOARD</button>}
          </div>

          <div className="text-[10px] text-sky-300 text-center md:text-right">
            Approved by the Synod of Benthic Governance.<br />
            Carcinization Status: Nominal 100%. Have a wonderful day!
          </div>
        </div>
      </footer>
    </div>
  )
}
