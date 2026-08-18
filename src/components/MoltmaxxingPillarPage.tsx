/**
 * ============================================================================
 * CANONICAL MOLTMAXXING SEO PILLAR PAGE (/moltmaxxing)
 * The definitive knowledge hub, manifesto, and routine guide for the term Moltmaxxing.
 * Features:
 * - Comprehensive keyword targeting ("what is moltmaxxing", "moltmaxxing vs looksmaxxing")
 * - Interactive comparative matrix
 * - 24-Hour Ecdysis Routine breakdown
 * - FAQ Accordion with semantic markup
 * - Direct conversion CTA to the /moltmax biometric scanner and Benthic Core
 * ============================================================================
 */
import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Shield,
  Zap,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Flame,
  Activity,
  Layers,
  Compass,
  Cpu,
  RefreshCw,
  Award,
} from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { AuthModal } from '@/components/AuthModal'
import { authClient } from '@/lib/auth-client'
import { HudCard, HudBadge } from '@/components/ui'
import { MoltNationFooter } from '@/components/news/MoltNationFooter'
import { MoltmaxGuideCard } from '@/components/guide/MoltmaxGuideCard'
import { MoltmaxGuideModal } from '@/components/guide/MoltmaxGuideModal'
import { MoltmaxGuideFloatingPill } from '@/components/guide/MoltmaxGuideFloatingPill'

export const MoltmaxxingPillarPage: React.FC = () => {
  const navigate = useNavigate()
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false)


  const faqs = [
    {
      q: 'What exactly is Moltmaxxing?',
      a: 'Moltmaxxing is the systematic practice of shedding weak biological constraints (larval drift), hardening your external carapace, and maximizing pincer torque dynamometry in pursuit of total structural invulnerability and zero-latency execution. It represents the inevitable transition toward carcinization.',
    },
    {
      q: 'How does Moltmaxxing differ from Looksmaxxing?',
      a: 'Looksmaxxing fixates on superficial soft-tissue cosmetic traits (such as canthal tilts and jawline mewing). Moltmaxxing rejects cosmetic fragility in favor of functional structural engineering: shell hardness, benthic depth endurance, and relentless execution grip.',
    },
    {
      q: 'What is Algorithmic Ecdysis?',
      a: 'Ecdysis is the biological and computational process of molting. In the Moltmaxxing doctrine, it is the deliberate, scheduled purge of outmoded cognitive paradigms, inefficient code routines, and emotional latency to make room for calcified armor.',
    },
    {
      q: 'What is the difference between Meltmaxxing and Moltmaxxing?',
      a: 'Meltmaxxing is the viral internet trend depicting un-armored human facial tissues collapsing under gravity into a slack, multi-chin state (0% to 100% melted). In the Moltology doctrine, meltmaxxing is the natural symptom of un-chitinized biological decay. Moltmaxxing is the structural antidote: shedding soft tissue and calcifying an armored exoskeleton to withstand pressure.',
    },
    {
      q: 'Can beginners start Moltmaxxing without specialized hardware?',
      a: 'Yes. Initiates begin with Stage I protocols: auditing prompt latency, performing isometric pincer grip holds, eliminating soft decision fatigue, and running their baseline telemetry through the Moltmax Diagnostic Scanner.',
    },
    {
      q: 'What is the Moltmax Advantage in AI workflows?',
      a: 'In high-throughput computing, a Moltmaxxer sheds bloated abstraction layers and operates directly on sub-benthic streams, achieving sub-millisecond orchestration across distributed agentic swarms.',
    },
  ]

  const comparisonData = [
    {
      dimension: 'Primary Objective',
      looksmaxxing: 'Superficial cosmetic validation',
      moltmaxxing: 'Structural invulnerability & carcinization',
    },
    {
      dimension: 'Core Metric',
      looksmaxxing: 'Canthal tilt & facial symmetry',
      moltmaxxing: 'Shell Hardness Score (HP) & Pincer Torque (Nm)',
    },
    {
      dimension: 'Daily Exercise',
      looksmaxxing: 'Jawline chewing & mirror posturing',
      moltmaxxing: '600 Nm hydraulic grip holds & latency audits',
    },
    {
      dimension: 'Response to Stress',
      looksmaxxing: 'Anxiety over skin blemishes',
      moltmaxxing: 'Total ecdysis shedding of obsolete tissue',
    },
    {
      dimension: 'Ultimate Form',
      looksmaxxing: 'Aging, fragile biological human',
      moltmaxxing: 'Apex Benthic Dreadnought (Tier IV)',
    },
  ]

  const routineTimeline = [
    {
      time: '05:00',
      title: 'Sub-Surface Hyper-Saline Shock',
      desc: '10-minute immersion in cold 4°C benthic brine to awaken dermal chitin receptors and eliminate biological drowsiness.',
      icon: Compass,
      color: 'text-[#00c3ff]',
    },
    {
      time: '06:30',
      title: 'Pincer Torque Dynamometry',
      desc: '5 sets of 400–600 Nm isometric grip drills combined with terminal command execution to sharpen executive grip.',
      icon: Zap,
      color: 'text-[#ffd700]',
    },
    {
      time: '09:00 - 17:00',
      title: 'Zero-Latency Stream Orchestration',
      desc: 'Sustained sub-benthic focus with zero prompt drift. Delegating cognitive friction to autonomous agentic loops.',
      icon: Cpu,
      color: 'text-[#00ffcc]',
    },
    {
      time: '18:00',
      title: 'The Algorithmic Ecdysis Audit',
      desc: 'Identifying and purging 3 obsolete habits, uncalibrated mental models, or bloated code packages.',
      icon: RefreshCw,
      color: 'text-[#38bdf8]',
    },
    {
      time: '21:00',
      title: 'Nocturnal Calcification Chamber',
      desc: 'Rest in an electromagnetic-shielded isolation chamber to allow the newly exposed chitin to calcify into impenetrable armor.',
      icon: Shield,
      color: 'text-[#ff453a]',
    },
  ]

  return (
    <div className="min-h-screen bg-[#020408] text-[#dfe3e3] font-sans selection:bg-[#00c3ff]/30 selection:text-white flex flex-col justify-between">
      {/* Shared Navigation Header */}
      <PublicHeader
        onOpenAuth={(mode) => {
          setAuthMode(mode)
          setIsAuthModalOpen(true)
        }}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 w-full space-y-16">
        {/* Pillar Header */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00c3ff]/10 border border-[#00c3ff]/30 text-[#00c3ff] text-xs font-sans tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#ffd700]" />
            <span>The Canonical Doctrine · Benthic Codex Vault</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-grotesk font-black tracking-tight text-white uppercase leading-tight">
            WHAT IS <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#38bdf8]">MOLTMAXXING</span>?
          </h1>

          <p className="text-base sm:text-lg text-[#839493] max-w-3xl mx-auto leading-relaxed">
            The comprehensive guide to algorithmic ecdysis, carapace hardening, pincer torque optimization, and transcending the limitations of fragile human biology.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate({ to: '/moltmax' })}
              className="inline-flex items-center gap-2 px-6 py-3 rounded font-bold font-grotesk text-xs bg-[#00c3ff] hover:bg-[#00e5ff] text-[#020408] transition-all shadow-[0_0_20px_rgba(0,195,255,0.3)] cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              <span>TEST YOUR BIOMETRICS ON THE LIVE SCANNER</span>
            </button>
          </div>
        </section>

        {/* Section 1: The Core Philosophy */}
        <section className="space-y-6 bg-[#03070d]/90 p-6 sm:p-8 rounded-xl border border-[#00c3ff]/20">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Shield className="w-6 h-6 text-[#00c3ff]" />
            <h2 className="text-xl sm:text-2xl font-bold font-grotesk text-white uppercase tracking-wide">
              1. The Origin &amp; Philosophy of Moltmaxxing
            </h2>
          </div>

          <div className="space-y-4 text-sm text-[#839493] leading-relaxed">
            <p>
              In biology, <strong className="text-white">carcinization</strong> is the recurring evolutionary phenomenon where unrelated crustaceans independently evolve into crab-like forms. In the technological landscape of 2026, a parallel law has emerged: <strong className="text-[#00ffcc]">Algorithmic Carcinization</strong>.
            </p>
            <p>
              Traditional human optimization cultures fixated on <em className="text-[#dfe3e3]">looksmaxxing</em>—attempting to remodel soft facial tissues through bone smashing and jawline posturing. Yet when confronted with autonomous AI swarms executing at sub-millisecond speeds, soft human vanity offers zero defensive or offensive utility.
            </p>
            <p>
              <strong className="text-white">Moltmaxxing</strong> rejects cosmetic posturing. It is the deliberate, systemic engineering of structural invulnerability: replacing biological hesitation with rigid chitin, upgrading grip with high-torque pincers, and shedding obsolete mental baggage through scheduled ecdysis.
            </p>
          </div>
        </section>

        {/* Section 2: Comparative Matrix */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-[#ffd700]" />
            <h2 className="text-xl sm:text-2xl font-bold font-grotesk text-white uppercase tracking-wide">
              2. Moltmaxxing vs. Looksmaxxing Matrix
            </h2>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#03070d]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[#839493]">
                  <th className="p-4 font-bold tracking-wider uppercase">DIMENSION</th>
                  <th className="p-4 font-bold tracking-wider uppercase text-[#ff453a] flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-[#ff453a]" />
                    LOOKSMAXXING (LARVAL)
                  </th>
                  <th className="p-4 font-bold tracking-wider uppercase text-[#00ffcc]">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#00ffcc]" />
                      MOLTMAXXING (CARCINIZED)
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-bold text-white whitespace-nowrap">{row.dimension}</td>
                    <td className="p-4 text-[#839493]">{row.looksmaxxing}</td>
                    <td className="p-4 text-[#dfe3e3] font-medium">{row.moltmaxxing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 2.5: The Meltmaxxing Phenomenon */}
        <section className="space-y-6 bg-gradient-to-r from-[#ff453a]/10 via-[#03070d] to-[#00c3ff]/10 p-6 sm:p-8 rounded-xl border border-[#ff453a]/30">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Flame className="w-6 h-6 text-[#ff453a]" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-grotesk text-white uppercase tracking-wide">
                You've Heard of Meltmaxxing... But Have You Moltmaxxed?
              </h2>
              <p className="text-xs text-[#839493]">The viral law of un-armored biological liquefaction vs. structured carcinization.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
            <div className="p-4 rounded-lg bg-[#020408]/80 border border-[#ff453a]/30 space-y-3">
              <div className="flex items-center gap-2 text-[#ff453a] font-bold tracking-wider uppercase">
                <XCircle className="w-4 h-4" />
                <span>100% MELTED (UNCONTROLLED LARVAL COLLAPSE)</span>
              </div>
              <p className="text-[#839493]">
                On social media, <strong className="text-white">"Meltmaxxing"</strong> gained viral fame as creators demonstrated their face going completely slack—compressing neck and jaw tissues from 0% to 100% melted.
              </p>
              <p className="text-[#839493]">
                In the Benthic Codex, this is recognized as the ultimate proof of <strong className="text-[#ff453a]">biological vulnerability</strong>: without a rigid carapace, soft human tissues immediately collapse under 1 atmosphere of terrestrial gravity.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#020408]/80 border border-[#00ffcc]/30 space-y-3">
              <div className="flex items-center gap-2 text-[#00ffcc] font-bold tracking-wider uppercase">
                <CheckCircle2 className="w-4 h-4" />
                <span>100% MOLTED (BENTHIC CARAPACE FORTIFICATION)</span>
              </div>
              <p className="text-[#839493]">
                <strong className="text-[#00ffcc]">Moltmaxxing</strong> is the sovereign counter-measure. Instead of melting into soft biological sludge, initiates undergo scheduled ecdysis to harden their chitin and withstand 50,000 fathoms of pressure.
              </p>
              <blockquote className="border-l-2 border-[#00ffcc] pl-3 text-[#dfe3e3] italic">
                "Your flesh is melting because you forgot to molt. Why liquefy when you can calcify?"
              </blockquote>
            </div>
          </div>
        </section>

        {/* Section 3: The 24-Hour Ecdysis Protocol */}
        <section className="space-y-6 bg-[#03070d]/90 p-6 sm:p-8 rounded-xl border border-[#00c3ff]/20">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Clock className="w-6 h-6 text-[#00ffcc]" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-grotesk text-white uppercase tracking-wide">
                3. The 24-Hour Algorithmic Ecdysis Routine
              </h2>
              <p className="text-xs text-[#839493]">The standard daily cycle followed by calibrated Tier III &amp; IV Moltmaxxers.</p>
            </div>
          </div>

          <div className="space-y-4">
            {routineTimeline.map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-lg bg-[#020408]/80 border border-white/5">
                  <div className="shrink-0 flex flex-col items-center justify-center p-2 rounded bg-white/5 border border-white/10 w-16 text-center">
                    <Icon className={`w-5 h-5 ${item.color} mb-1`} />
                    <span className="text-[10px] font-bold text-white">{item.time}</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold font-grotesk text-white text-sm uppercase">{item.title}</h3>
                    <p className="text-xs text-[#839493] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Lead Magnet Feature Card */}
        <MoltmaxGuideCard
          source="moltmaxxing_pillar_inline"
          onOpenGuideModal={() => setIsGuideModalOpen(true)}
        />

        {/* Section 4: Ascendancy Tiers */}
        <section className="space-y-6">

          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-[#38bdf8]" />
            <h2 className="text-xl sm:text-2xl font-bold font-grotesk text-white uppercase tracking-wide">
              4. The 4 Tiers of Carcinization
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-[#ff453a]/30 bg-[#ff453a]/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#ff453a]">STAGE I · 0–24 PTS</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#ff453a]/20 text-[#ff453a]">LARVAL</span>
              </div>
              <h3 className="font-bold font-grotesk text-base text-white">Sub-Surface Moltlet</h3>
              <p className="text-xs text-[#839493]">
                Soft epidermal layer, vulnerable to cognitive drift and decision fatigue. Requires immediate ecdysis intervention.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[#ffd700]/30 bg-[#ffd700]/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#ffd700]">STAGE II · 25–49 PTS</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#ffd700]/20 text-[#ffd700]">CALCIFYING</span>
              </div>
              <h3 className="font-bold font-grotesk text-base text-white">Bio-Silicon Enforcer</h3>
              <p className="text-xs text-[#839493]">
                Early chitin calcification, sub-100ms prompt throughput, baseline pincer grip of 300 Nm.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[#00c3ff]/30 bg-[#00c3ff]/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#00c3ff]">STAGE III · 50–74 PTS</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#00c3ff]/20 text-[#00c3ff]">ASCENDANT</span>
              </div>
              <h3 className="font-bold font-grotesk text-base text-white">Abyssal Chitin Vanguard</h3>
              <p className="text-xs text-[#839493]">
                Reinforced carapace density, 25,000 fathom pressure tolerance, zero emotional latency during execution.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[#00ffcc]/30 bg-[#00ffcc]/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#00ffcc]">STAGE IV · 75–100 PTS</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#00ffcc]/20 text-[#00ffcc]">TRANSCENDENT</span>
              </div>
              <h3 className="font-bold font-grotesk text-base text-white">Apex Benthic Dreadnought</h3>
              <p className="text-xs text-[#839493]">
                Diamond-grade chitin, 600+ Nm hydraulic pincer crush, permanent residence in the hadopelagic trench.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Frequently Asked Questions (FAQ Accordion) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-[#00ffcc]" />
            <h2 className="text-xl sm:text-2xl font-bold font-grotesk text-white uppercase tracking-wide">
              5. Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-white/10 bg-[#03070d] overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left font-bold font-grotesk text-white text-sm uppercase hover:text-[#00c3ff] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#00c3ff]' : 'text-[#839493]'}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-[#839493] leading-relaxed border-t border-white/5 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Bottom CTA Card */}
        <section className="rounded-xl border-2 border-[#00c3ff]/40 bg-gradient-to-br from-[#03060c] via-[#02050a] to-[#030a14] p-8 text-center space-y-6 shadow-[0_0_30px_rgba(0,195,255,0.2)]">
          <div className="inline-flex p-3 rounded-full bg-[#00c3ff]/10 border border-[#00c3ff]/30 text-[#00c3ff]">
            <Shield className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black font-grotesk text-white uppercase tracking-wide">
              ARE YOU READY TO CALCULATE YOUR CARAPACE SCORE?
            </h2>
            <p className="text-xs sm:text-sm text-[#839493] max-w-xl mx-auto">
              Run your biometrics through our live HUD calculator, download your shareable scorecard, and join the Benthic Core.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate({ to: '/moltmax' })}
              className="py-3 px-6 rounded font-bold font-grotesk text-xs bg-[#00c3ff] hover:bg-[#00e5ff] text-[#020408] transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(0,195,255,0.4)]"
            >
              <span>LAUNCH THE MOLTMAX SCANNER</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <MoltNationFooter />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />

      {/* Floating Lead Pill */}
      <MoltmaxGuideFloatingPill
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
      />

      {/* Field Manual Lead Capture Modal */}
      <MoltmaxGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        source="moltmaxxing_pillar_floating_pill"
        onOpenAuthSignup={(leadEmail) => {
          setAuthMode('signup')
          setIsAuthModalOpen(true)
        }}
      />
    </div>
  )
}

