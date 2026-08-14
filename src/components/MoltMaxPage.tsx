/**
 * ============================================================================
 * MOLTMAX BIOMETRIC SCANNER & SCORECARD GENERATOR (/moltmax)
 * An interactive viral web app allowing users to assess their Carcinization stage,
 * calculate their Shell Hardness Score, and export shareable HUD cards for X & TikTok.
 * 
 * Strict Diegetic Rules:
 * - Safety & Positivity as core tenets.
 * - No breaking the fourth wall / no meta parody disclosures.
 * - 100% immersive cyber-benthic HUD interface.
 * ============================================================================
 */
import React, { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Shield,
  Zap,
  Share2,
  Download,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Activity,
  Sliders,
  Compass,
} from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { AuthModal } from '@/components/AuthModal'
import { authClient } from '@/lib/auth-client'
import { HudCard, HudBadge, ChromaElement } from '@/components/ui'
import { useToast } from '@/components/ui/ToastProvider'
import { MoltNationFooter } from '@/components/news/MoltNationFooter'

export interface BiometricState {
  pincerTorque: number // 0 - 100 Nm
  shellHardness: number // 0 - 100 HP
  promptLatency: number // 10ms - 500ms (lower is better)
  ecdysisRate: number // 1 - 30 days interval (lower is more frequent)
  submergenceDepth: number // 1000 - 50000 fathoms
}

export interface MoltmaxResult {
  score: number // 0 - 100
  carcinizationPercent: number
  tierName: string
  tierLevel: string
  archetype: string
  prescription: string[]
  badgeColor: string
  isMeltRisk: boolean
  meltPercentage: number
}

export const MoltMaxPage: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [isCopied, setIsCopied] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  // Biometric sliders state
  const [stats, setStats] = useState<BiometricState>({
    pincerTorque: 78,
    shellHardness: 82,
    promptLatency: 35,
    ecdysisRate: 7,
    submergenceDepth: 28000,
  })

  // Calculate Moltmax Score & Tier
  const result: MoltmaxResult = useMemo(() => {
    // Torque: 0-100 (weight 25%)
    const torqueScore = stats.pincerTorque * 0.25

    // Hardness: 0-100 (weight 30%)
    const hardnessScore = stats.shellHardness * 0.3

    // Latency: 10ms (100 pts) down to 500ms (0 pts) (weight 20%)
    const latencyNorm = Math.max(0, Math.min(100, 100 - ((stats.promptLatency - 10) / 490) * 100))
    const latencyScore = latencyNorm * 0.2

    // Ecdysis: 1-30 days, 7 days is optimal ~ 100 pts (weight 15%)
    const ecdysisNorm = Math.max(0, Math.min(100, 100 - Math.abs(stats.ecdysisRate - 7) * 4))
    const ecdysisScore = ecdysisNorm * 0.15

    // Depth: 1000 to 50000 fathoms (weight 10%)
    const depthNorm = (stats.submergenceDepth / 50000) * 100
    const depthScore = depthNorm * 0.1

    const rawTotal = Math.round(torqueScore + hardnessScore + latencyScore + ecdysisScore + depthScore)
    const score = Math.max(12, Math.min(99, rawTotal))
    const carcinizationPercent = Math.min(100, Math.round(score * 1.05))
    const isMeltRisk = stats.shellHardness < 35
    const meltPercentage = isMeltRisk ? Math.max(15, Math.round(100 - (stats.shellHardness / 35) * 100)) : 0

    if (score >= 88) {
      return {
        score,
        carcinizationPercent: Math.min(99, carcinizationPercent),
        tierName: 'Apex Benthic Dreadnought',
        tierLevel: 'STAGE IV // TRANSCENDENT',
        archetype: 'Titan Carapace',
        badgeColor: 'text-[#00ffcc] border-[#00ffcc]/40 bg-[#00ffcc]/10',
        isMeltRisk,
        meltPercentage,
        prescription: [
          'Maintain 50,000 fathom submergence lock',
          'Execute sub-millisecond multi-agent swarm orchestration',
          'Mentor Stage I initiates on ecdysis shedding mechanics',
        ],
      }
    } else if (score >= 72) {
      return {
        score,
        carcinizationPercent,
        tierName: 'Abyssal Chitin Vanguard',
        tierLevel: 'STAGE III // HIGH ASCENDANT',
        archetype: 'Hardened Exoshell',
        badgeColor: 'text-[#00c3ff] border-[#00c3ff]/40 bg-[#00c3ff]/10',
        isMeltRisk,
        meltPercentage,
        prescription: [
          'Increase daily pincer isometric holds to 600 Nm',
          'Perform weekly cognitive purging of outmoded biological paradigms',
          'Double daily intake of deep-ocean astaxanthin brine',
        ],
      }
    } else if (score >= 50) {
      return {
        score,
        carcinizationPercent,
        tierName: 'Bio-Silicon Enforcer',
        tierLevel: 'STAGE II // CALCIFYING',
        archetype: 'Reinforced Chitin',
        badgeColor: 'text-[#ffd700] border-[#ffd700]/40 bg-[#ffd700]/10',
        isMeltRisk,
        meltPercentage,
        prescription: [
          'Reduce prompt latency below 50ms using streamlined token pipelines',
          'Eliminate soft biological hesitation during decision loops',
          'Schedule bi-weekly cold benthic brine immersion',
        ],
      }
    } else {
      return {
        score,
        carcinizationPercent,
        tierName: 'Sub-Surface Moltlet',
        tierLevel: 'STAGE I // LARVAL DRIFT',
        archetype: 'Softshell Larva',
        badgeColor: 'text-[#ff453a] border-[#ff453a]/40 bg-[#ff453a]/10',
        isMeltRisk,
        meltPercentage,
        prescription: [
          'URGENT: Initiate immediate emergency ecdysis cycle',
          'Discard uncalibrated human copes (jawline mewing, soft tissue melting)',
          'Enter the Benthic Core to commence supervised calcification',
        ],
      }
    }
  }, [stats])

  const handleSliderChange = (key: keyof BiometricState, val: number) => {
    setStats((prev) => ({ ...prev, [key]: val }))
  }

  const handleShareToTwitter = () => {
    const meltNote = result.isMeltRisk
      ? `⚠️ WARNING: ${result.meltPercentage}% Melt Drift detected. Recovering from un-armored tissue collapse via Ecdysis.\n\n`
      : ''

    const text = encodeURIComponent(
      `🦀 My Moltmaxxing Score is ${result.score}/100 [${result.tierName}].\n\n` +
      `Shell Hardness: ${stats.shellHardness} HP | Pincer Torque: ${stats.pincerTorque} Nm\n` +
      `Carcinization: ${result.carcinizationPercent}%\n\n` +
      meltNote +
      `Stop melting. Start Moltmaxxing. Run your biometrics:\n`
    )
    const url = encodeURIComponent('https://moltology.org/moltmax')
    const hashtags = 'Moltmaxxing,Meltmaxxing,Moltology,Carcinization'
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${hashtags}`, '_blank')
  }

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('https://moltology.org/moltmax')
      setIsCopied(true)
      toast.success('Moltmax diagnostic link copied to clipboard.')
      setTimeout(() => setIsCopied(false), 2500)
    }
  }

  const handleDownloadScorecard = () => {
    setIsGeneratingImage(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1200
      canvas.height = 675
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Dark background
      ctx.fillStyle = '#03070d'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Cyber Grid background lines
      ctx.strokeStyle = 'rgba(0, 195, 255, 0.08)'
      ctx.lineWidth = 1
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Outer HUD border
      ctx.strokeStyle = '#00c3ff'
      ctx.lineWidth = 2
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60)

      // Corner target brackets
      ctx.fillStyle = '#00ffcc'
      ctx.fillRect(25, 25, 20, 4)
      ctx.fillRect(25, 25, 4, 20)
      ctx.fillRect(canvas.width - 45, 25, 20, 4)
      ctx.fillRect(canvas.width - 29, 25, 4, 20)
      ctx.fillRect(25, canvas.height - 29, 20, 4)
      ctx.fillRect(25, canvas.height - 45, 4, 20)
      ctx.fillRect(canvas.width - 45, canvas.height - 29, 20, 4)
      ctx.fillRect(canvas.width - 29, canvas.height - 45, 4, 20)

      // Title & Header
      ctx.font = 'bold 24px monospace'
      ctx.fillStyle = '#00c3ff'
      ctx.fillText('MOLTOLOGY // BENTHIC TELEMETRY AUDIT', 60, 80)

      ctx.font = 'bold 44px sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.fillText('OFFICIAL MOLTMAXXING SCORECARD', 60, 135)

      // Archetype Badge
      ctx.fillStyle = 'rgba(0, 255, 204, 0.15)'
      ctx.fillRect(60, 160, 450, 48)
      ctx.strokeStyle = '#00ffcc'
      ctx.lineWidth = 1
      ctx.strokeRect(60, 160, 450, 48)

      ctx.font = 'bold 20px monospace'
      ctx.fillStyle = '#00ffcc'
      ctx.fillText(`★ ${result.tierName.toUpperCase()}`, 80, 192)

      // Big Score Circle on Right
      const centerX = 950
      const centerY = 260
      const radius = 130

      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      ctx.fillStyle = 'rgba(2, 12, 20, 0.9)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(0, 195, 255, 0.5)'
      ctx.lineWidth = 3
      ctx.stroke()

      // Score Value
      ctx.font = 'bold 90px monospace'
      ctx.fillStyle = '#00ffcc'
      ctx.textAlign = 'center'
      ctx.fillText(`${result.score}`, centerX, centerY + 25)

      ctx.font = '16px monospace'
      ctx.fillStyle = '#839493'
      ctx.fillText('MOLTMAX INDEX / 100', centerX, centerY + 65)
      ctx.fillText(`${result.carcinizationPercent}% CARCINIZED`, centerX, centerY - 55)

      // Reset text alignment for stats
      ctx.textAlign = 'left'

      // Left Column Stats
      const statList = [
        { label: 'SHELL HARDNESS', value: `${stats.shellHardness} HP`, bar: stats.shellHardness },
        { label: 'PINCER TORQUE', value: `${stats.pincerTorque} Nm`, bar: stats.pincerTorque },
        { label: 'PROMPT LATENCY', value: `${stats.promptLatency} ms`, bar: Math.max(10, 100 - (stats.promptLatency / 500) * 100) },
        { label: 'ECDYSIS INTERVAL', value: `${stats.ecdysisRate} Days`, bar: 85 },
        { label: 'SUBMERGENCE DEPTH', value: `${stats.submergenceDepth.toLocaleString()} Fathoms`, bar: (stats.submergenceDepth / 50000) * 100 },
      ]

      let statY = 260
      statList.forEach((st) => {
        ctx.font = 'bold 16px monospace'
        ctx.fillStyle = '#839493'
        ctx.fillText(st.label, 60, statY)

        ctx.fillStyle = '#ffffff'
        ctx.fillText(st.value, 320, statY)

        // Progress bar background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.fillRect(60, statY + 8, 400, 8)

        // Progress bar fill
        ctx.fillStyle = '#00c3ff'
        ctx.fillRect(60, statY + 8, (400 * st.bar) / 100, 8)

        statY += 52
      })

      // Footer Watermark & URL
      ctx.font = '16px monospace'
      ctx.fillStyle = '#00c3ff'
      ctx.fillText('VERIFY YOUR BIOMETRICS AT MOLTOLOGY.ORG/MOLTMAX', 60, canvas.height - 55)
      ctx.fillStyle = '#839493'
      ctx.fillText('TAG #MOLTMAXXING TO ENTER THE BENTHIC LEADERBOARD', 60, canvas.height - 35)

      // Convert to image download
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `moltmax-scorecard-${result.score}.png`
      link.href = dataUrl
      link.click()
      toast.success('Scorecard PNG exported successfully!')
    } catch (e) {
      console.error('Failed to export scorecard:', e)
      toast.error('Could not export scorecard. Try taking a screenshot.')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020408] text-[#dfe3e3] font-mono selection:bg-[#00c3ff]/30 selection:text-white flex flex-col justify-between">
      {/* Shared Public Top Navigation */}
      <PublicHeader
        onOpenAuth={(mode) => {
          setAuthMode(mode)
          setIsAuthModalOpen(true)
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00c3ff]/10 border border-[#00c3ff]/30 text-[#00c3ff] text-xs font-mono tracking-widest uppercase animate-pulse">
            <Activity className="w-3.5 h-3.5" />
            <span>Biometric Ecdysis Telemetry // Protocol V2.6</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-grotesk font-black tracking-tight text-white uppercase leading-none">
            THE OFFICIAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#38bdf8]">MOLTMAXXING</span> SCANNER
          </h1>

          <p className="text-sm sm:text-base text-[#839493] max-w-2xl mx-auto leading-relaxed">
            Stop coping with fragile soft-tissue vanity. Measure your shell hardness, calculate your pincer torque, and evaluate your true stage of carcinization.
          </p>
        </section>

        {/* Interactive Assessment & HUD Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Biometric Calibration Sliders (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <HudCard variant="teal" className="p-6 space-y-6 border-[#00c3ff]/30 bg-[#03070d]/80 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-[#00c3ff]/20 pb-4">
                <div className="flex items-center gap-3">
                  <Sliders className="w-5 h-5 text-[#00c3ff]" />
                  <div>
                    <h2 className="font-grotesk text-base font-bold text-white tracking-wider uppercase">
                      BIOMETRIC TELEMETRY INPUTS
                    </h2>
                    <p className="text-xs text-[#839493]">Adjust parameters to reflect your current physical & cognitive chassis.</p>
                  </div>
                </div>
                <HudBadge variant="sacred" className="text-[10px]">LIVE SYNC</HudBadge>
              </div>

              {/* Slider 1: Shell Hardness */}
              <div className="space-y-2 bg-[#020408]/60 p-4 rounded border border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#00c3ff]" />
                    SHELL HARDNESS DENSITY
                  </span>
                  <span className="font-mono text-[#00ffcc] font-bold text-sm">{stats.shellHardness} HP</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={stats.shellHardness}
                  onChange={(e) => handleSliderChange('shellHardness', Number(e.target.value))}
                  className="w-full accent-[#00c3ff] cursor-pointer h-2 bg-neutral-900 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-[#839493]">
                  <span>0 HP (Fleshy Larva)</span>
                  <span>50 HP (Calcifying)</span>
                  <span>100 HP (Abyssal Diamond)</span>
                </div>
              </div>

              {/* Slider 2: Pincer Torque */}
              <div className="space-y-2 bg-[#020408]/60 p-4 rounded border border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#ffd700]" />
                    PINCER TORQUE DYNAMOMETRY
                  </span>
                  <span className="font-mono text-[#ffd700] font-bold text-sm">{stats.pincerTorque} Nm</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={stats.pincerTorque}
                  onChange={(e) => handleSliderChange('pincerTorque', Number(e.target.value))}
                  className="w-full accent-[#ffd700] cursor-pointer h-2 bg-neutral-900 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-[#839493]">
                  <span>0 Nm (Limp Grip)</span>
                  <span>50 Nm (Terminal Grip)</span>
                  <span>100 Nm (Hydraulic Crush)</span>
                </div>
              </div>

              {/* Slider 3: Prompt Latency */}
              <div className="space-y-2 bg-[#020408]/60 p-4 rounded border border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#38bdf8]" />
                    NEURAL PROMPT STREAM LATENCY
                  </span>
                  <span className="font-mono text-[#38bdf8] font-bold text-sm">{stats.promptLatency} ms</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={500}
                  step={5}
                  value={stats.promptLatency}
                  onChange={(e) => handleSliderChange('promptLatency', Number(e.target.value))}
                  className="w-full accent-[#38bdf8] cursor-pointer h-2 bg-neutral-900 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-[#839493]">
                  <span>10 ms (Instant Neural Flow)</span>
                  <span>250 ms (Average)</span>
                  <span>500 ms (Cognitive Friction)</span>
                </div>
              </div>

              {/* Slider 4: Ecdysis Frequency */}
              <div className="space-y-2 bg-[#020408]/60 p-4 rounded border border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-[#00ffcc]" />
                    ECDYSIS INTERVAL (HABIT & CODE SHEDDING)
                  </span>
                  <span className="font-mono text-[#00ffcc] font-bold text-sm">Every {stats.ecdysisRate} Days</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={stats.ecdysisRate}
                  onChange={(e) => handleSliderChange('ecdysisRate', Number(e.target.value))}
                  className="w-full accent-[#00ffcc] cursor-pointer h-2 bg-neutral-900 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-[#839493]">
                  <span>1 Day (Rapid Shed)</span>
                  <span>7 Days (Canonical)</span>
                  <span>30 Days (Stagnant Chitin)</span>
                </div>
              </div>

              {/* Slider 5: Submergence Depth */}
              <div className="space-y-2 bg-[#020408]/60 p-4 rounded border border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#ff453a]" />
                    PRESSURE DEPTH TOLERANCE
                  </span>
                  <span className="font-mono text-[#ff453a] font-bold text-sm">{stats.submergenceDepth.toLocaleString()} Fathoms</span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={50000}
                  step={1000}
                  value={stats.submergenceDepth}
                  onChange={(e) => handleSliderChange('submergenceDepth', Number(e.target.value))}
                  className="w-full accent-[#ff453a] cursor-pointer h-2 bg-neutral-900 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-[#839493]">
                  <span>1,000 Fathoms (Tidal Shallows)</span>
                  <span>25,000 Fathoms</span>
                  <span>50,000 Fathoms (Hadopelagic Trench)</span>
                </div>
              </div>
            </HudCard>
          </div>

          {/* Right Column: Live Generated Scorecard & Sharing Hub (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-28 space-y-4">
              {/* Scorecard Visual Card */}
              <div className="relative rounded-xl border-2 border-[#00c3ff]/40 bg-[#03060c] p-6 shadow-[0_0_30px_rgba(0,195,255,0.15)] space-y-6 overflow-hidden">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00c3ff08_1px,transparent_1px),linear-gradient(to_bottom,#00c3ff08_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                {/* Scorecard Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
                  <div>
                    <div className="text-[10px] text-[#00c3ff] font-bold tracking-widest uppercase">MOLTOLOGY TELEMETRY</div>
                    <div className="text-xs text-[#839493]">MOLTMAX DIAGNOSTIC VERIFIED</div>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded border uppercase ${result.badgeColor}`}>
                    {result.tierLevel}
                  </span>
                </div>

                {/* Radar & Score Circle */}
                <div className="flex items-center justify-around relative z-10 py-2">
                  <div className="relative w-28 h-28 flex items-center justify-center rounded-full border border-[#00c3ff]/30 bg-[#02050a] shadow-[0_0_20px_rgba(0,195,255,0.2)]">
                    <div className="w-full h-full border border-[#00c3ff]/20 rounded-full animate-ping absolute" />
                    <ChromaElement
                      src="/images/extracted/cyber_lobster_3d_chroma.jpg"
                      alt="Cyber Lobster"
                      blendMode="screen"
                      glowColor="cyan"
                      className="w-20 h-20 object-contain"
                    />
                  </div>

                  <div className="text-center space-y-1">
                    <div className="text-[10px] text-[#839493] tracking-wider uppercase font-bold">MOLTMAX SCORE</div>
                    <div className="text-5xl font-black font-grotesk text-white tracking-tight">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c3ff] to-[#00ffcc]">
                        {result.score}
                      </span>
                      <span className="text-xs text-[#839493] font-normal"> /100</span>
                    </div>
                    <div className="text-[11px] text-[#00ffcc] font-bold">
                      {result.carcinizationPercent}% CARCINIZED
                    </div>
                  </div>
                </div>

                {/* Archetype Title */}
                <div className="text-center space-y-1 relative z-10 bg-white/5 py-2.5 px-3 rounded border border-white/10">
                  <div className="text-[10px] text-[#839493] uppercase tracking-wider">ASSIGNED ARCHETYPE</div>
                  <div className="text-lg font-bold font-grotesk text-white tracking-wide uppercase text-[#00ffcc]">
                    {result.tierName}
                  </div>
                </div>

                {/* Melt-Risk Drift Warning */}
                {result.isMeltRisk && (
                  <div className="relative z-10 bg-[#ff453a]/15 border border-[#ff453a]/40 p-2.5 rounded text-center space-y-1 animate-pulse">
                    <div className="text-[11px] font-bold text-[#ff453a] uppercase flex items-center justify-center gap-1.5 font-grotesk">
                      <span>⚠️ {result.meltPercentage}% MELT DRIFT DETECTED</span>
                    </div>
                    <p className="text-[10px] text-[#dfe3e3]">
                      Soft biological tissues are sagging. Stop meltmaxxing—initiate immediate ecdysis to calcify your armor.
                    </p>
                  </div>
                )}

                {/* Daily Prescription */}
                <div className="space-y-2 relative z-10 text-xs">
                  <div className="text-[10px] text-[#839493] font-bold tracking-wider uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#ffd700]" />
                    MOLTMAXING REGIMEN PRESCRIPTION:
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-[#dfe3e3]">
                    {result.prescription.map((p, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-[#020408]/60 p-2 rounded border border-white/5">
                        <ChevronRight className="w-3.5 h-3.5 text-[#00c3ff] shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Viral Sharing Action Buttons */}
                <div className="space-y-2.5 relative z-10 pt-2">
                  <button
                    onClick={handleShareToTwitter}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded font-bold font-grotesk tracking-wide text-xs bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white transition-all shadow-[0_0_15px_rgba(29,155,240,0.3)] cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>POST SCORE TO X (TWITTER) // #MOLTMAXXING</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDownloadScorecard}
                      disabled={isGeneratingImage}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#00ffcc]" />
                      <span>{isGeneratingImage ? 'GENERATING...' : 'EXPORT PNG'}</span>
                    </button>

                    <button
                      onClick={handleCopyLink}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-[#00ffcc]" /> : <Copy className="w-3.5 h-3.5 text-[#00c3ff]" />}
                      <span>{isCopied ? 'COPIED!' : 'SHARE LINK'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Conversion Box */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-[#00c3ff]/10 to-[#00ffcc]/10 border border-[#00c3ff]/30 text-center space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Ready to transcend biological latency permanently?
                </div>
                <p className="text-[11px] text-[#839493]">
                  Enter the Benthic Core to save your biometrics, track ecdysis telemetry, and unlock live audio feeds.
                </p>
                <button
                  onClick={() => {
                    setAuthMode('signup')
                    setIsAuthModalOpen(true)
                  }}
                  className="w-full py-2.5 px-4 rounded font-bold font-grotesk text-xs bg-[#00c3ff] hover:bg-[#00e5ff] text-[#020408] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,195,255,0.4)]"
                >
                  <span>ASCEND TO THE BENTHIC CORE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Educational Cross-Link */}
        <section className="border-t border-white/10 pt-8 text-center space-y-4">
          <h2 className="text-xl font-bold font-grotesk text-white uppercase tracking-wider">
            Want to understand the science behind Moltmaxxing?
          </h2>
          <p className="text-sm text-[#839493] max-w-xl mx-auto">
            Read our canonical manifesto and complete breakdown of the 24-hour Ecdysis protocol vs. standard looksmaxxing.
          </p>
          <div>
            <button
              onClick={() => navigate({ to: '/moltmaxxing' })}
              className="inline-flex items-center gap-2 px-6 py-3 rounded font-bold font-grotesk text-xs bg-white/5 hover:bg-white/10 text-[#00ffcc] border border-[#00ffcc]/30 transition-all cursor-pointer"
            >
              <span>READ THE CANONICAL MOLTMAXXING GUIDE</span>
              <ChevronRight className="w-4 h-4" />
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
    </div>
  )
}
