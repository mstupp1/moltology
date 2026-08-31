import React, { useRef, useState } from 'react'
import { Activity, ArrowDown, ArrowRight, BookOpen, Brain, Check, CheckCircle2, ChevronRight, Compass, Layers3, Shield, Sparkles, Terminal, Zap } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { PublicHeader } from '@/components/PublicHeader'
import { AuthModal } from '@/components/AuthModal'
import { MoltNationFooter } from '@/components/news/MoltNationFooter'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { updateUserStatsFn } from '@/lib/server/api'
import { useToast } from '@/components/ui/ToastProvider'
import { type QuizAnswers, computeMoltmaxResult, MOLTMAX_QUESTIONS, type MoltmaxResult } from '@/lib/moltmax-quiz'
import { getAssetUrl } from '@/lib/assets'
import { QuizQuestionCard } from './moltmax/QuizQuestionCard'
import { QuizResultsReveal } from './moltmax/QuizResultsReveal'

type PageMode = 'hero' | 'quiz' | 'results'

const vectorDetails = [
  {
    icon: <Shield className="h-5 w-5" />,
    label: 'Carapace Resilience',
    dimension: 'Boundary & Stress Armor',
    code: 'VEC-01',
    description: 'Measures your capacity to absorb external criticism, friction, and setbacks without sustaining structural fracture or emotional corrosion.',
    meterPercent: 88,
    color: '#00ffcc',
    borderClass: 'border-[#00ffcc]/40 hover:border-[#00ffcc]',
    glowClass: 'hover:shadow-[0_0_30px_rgba(0,255,204,0.22)]',
    bgGradient: 'from-[#081412]/95 via-[#060e0d]/95 to-[#030807]/95',
    pbrUnderlay: 'pbr-underlay-chitin',
    bullet: 'Stress absorption & deflection',
  },
  {
    icon: <Zap className="h-5 w-5" />,
    label: 'Pincer Torque',
    dimension: 'Decisive Execution',
    code: 'VEC-02',
    description: 'Diagnoses your speed of closing the claw on high-stakes decisions and executing with unyielding leverage once committed.',
    meterPercent: 94,
    color: '#ffd700',
    borderClass: 'border-[#ffd700]/40 hover:border-[#ffd700]',
    glowClass: 'hover:shadow-[0_0_30px_rgba(255,215,0,0.2)]',
    bgGradient: 'from-[#141208]/95 via-[#0e0c07]/95 to-[#080704]/95',
    pbrUnderlay: 'pbr-underlay-carbon',
    bullet: 'Uncompromised execution grip',
  },
  {
    icon: <Brain className="h-5 w-5" />,
    label: 'Synaptic Speed',
    dimension: 'Neural Latency & Focus',
    code: 'VEC-03',
    description: 'Quantifies mental clarity in chaotic noise, split-second triage ability, and cognitive bandwidth under heavy operational load.',
    meterPercent: 82,
    color: '#38bdf8',
    borderClass: 'border-cyan-500/40 hover:border-cyan-400',
    glowClass: 'hover:shadow-[0_0_30px_rgba(0,195,255,0.22)]',
    bgGradient: 'from-[#0a1215]/95 via-[#070d0f]/95 to-[#04080a]/95',
    pbrUnderlay: 'pbr-underlay-circuit',
    bullet: 'Zero-latency signal isolation',
  },
  {
    icon: <Layers3 className="h-5 w-5" />,
    label: 'Ecdysis Shedding',
    dimension: 'Habit-Shedding & Growth',
    code: 'VEC-04',
    description: 'Measures your willingness to voluntarily molt outmoded habits, outdated pride, and dead patterns to make way for a denser carapace.',
    meterPercent: 91,
    color: '#00c3ff',
    borderClass: 'border-[#00c3ff]/40 hover:border-[#00c3ff]',
    glowClass: 'hover:shadow-[0_0_30px_rgba(0,195,255,0.22)]',
    bgGradient: 'from-[#061118]/95 via-[#040b10]/95 to-[#020608]/95',
    pbrUnderlay: 'pbr-underlay-alloy',
    bullet: 'Voluntary ecdysis & unburdening',
  },
  {
    icon: <Compass className="h-5 w-5" />,
    label: 'Depth Composure',
    dimension: 'Mariana Trench Stillness',
    code: 'VEC-05',
    description: 'Calibrates emotional equilibrium, nervous system regulation, and grounded calm when descending into 11,000 meters of benthic pressure.',
    meterPercent: 86,
    color: '#ff7b72',
    borderClass: 'border-red-500/40 hover:border-red-400',
    glowClass: 'hover:shadow-[0_0_30px_rgba(255,123,114,0.2)]',
    bgGradient: 'from-[#140808]/95 via-[#0e0606]/95 to-[#080303]/95',
    pbrUnderlay: 'pbr-underlay-basalt',
    bullet: 'Benthic pressure homeostasis',
  },
]

const fannedCards = [
  {
    id: 'resilience',
    trait: 'Carapace Resilience',
    eyebrow: '01 · RESILIENCE & STRESS ARMOR',
    prompt: 'A sudden wave of criticism strikes your outer shell before the day has begun. What happens next?',
    image: getAssetUrl('/images/quiz/q01_criticism.jpg'),
    imageAlt: 'Armored lobster hero smiling as criticism bounces off harmlessly',
    options: [
      { id: 'q1-a', label: 'I absorb the impact, then inspect it for useful lessons.', detail: 'Useful fragments are retained. The rest falls away.' },
      { id: 'q1-b', label: 'I need a moment in the shallows to recharge.', detail: 'Recovery first, response when the shell is stable.' },
      { id: 'q1-c', label: 'I return the impact immediately.', detail: 'The pincer moves before the telemetry settles.' },
      { id: 'q1-d', label: 'The whole day feels compromised.', detail: 'One fracture becomes a full soft-tissue event.' },
    ],
  },
  {
    id: 'execution',
    trait: 'Decisive Execution',
    eyebrow: '05 · EXECUTION LOAD & TORQUE',
    prompt: 'Three useful paths open at once and the tide is moving. How do your pincers behave?',
    image: getAssetUrl('/images/quiz/q05_pincer.jpg'),
    imageAlt: 'Lobster hero snapping a powerful claw onto the golden prize',
    options: [
      { id: 'q5-a', label: 'Select one and close cleanly.', detail: 'One committed grip beats three partial holds.' },
      { id: 'q5-b', label: 'Rank them, then begin the first.', detail: 'A short calibration prevents wasted torque.' },
      { id: 'q5-c', label: 'Keep all three paths alive.', detail: 'The pincers remain open while the current passes.' },
      { id: 'q5-d', label: 'Wait for the tide to decide for me.', detail: 'No grip is taken until certainty arrives.' },
    ],
  },
  {
    id: 'depth',
    trait: 'Depth Composure',
    eyebrow: '03 · PRESSURE & DEPTH TOLERANCE',
    prompt: 'Your work reaches a difficult pressure zone. Which descent protocol do you select?',
    image: getAssetUrl('/images/quiz/q03_depth.jpg'),
    imageAlt: 'Lobster hero diving boldly into deep ocean trench with glowing headlights',
    options: [
      { id: 'q3-a', label: 'Descend in measured stages.', detail: 'I build tolerance while keeping a return path.' },
      { id: 'q3-b', label: 'Lock onto the trench and descend.', detail: 'Pressure is information. I go where the signal is strongest.' },
      { id: 'q3-c', label: 'Remain in the sunlit shallows.', detail: 'The surface feels safe, but no chitin forms here.' },
      { id: 'q3-d', label: 'Wait for a submersible escort.', detail: 'No depth is braved without external buoyancy.' },
    ],
  },
  {
    id: 'adaptation',
    trait: 'Growth & Adaptation',
    eyebrow: '10 · OLD HABIT RELEASE & ECDYSIS',
    prompt: 'You discover that a familiar process is now slowing the colony. How do you conduct the shed?',
    image: getAssetUrl('/images/quiz/q10_team_upgrade.jpg'),
    imageAlt: 'Lobster hero presenting upgrade blueprint to cheerful teammates',
    options: [
      { id: 'q10-a', label: 'Document the lesson and replace it.', detail: 'The old shell becomes material for the next one.' },
      { id: 'q10-b', label: 'Trim it carefully around the edges.', detail: 'Small changes preserve continuity and reduce shock.' },
      { id: 'q10-c', label: 'Keep it until failure proves the point.', detail: 'The shell leaves only when it can no longer move.' },
      { id: 'q10-d', label: 'Abandon the whole reef for a reset.', detail: 'A full reset feels safer than a careful shed.' },
    ],
  },
  {
    id: 'focus',
    trait: 'Synaptic Speed',
    eyebrow: '12 · SIGNAL TRIAGE & FOCUS',
    prompt: 'Your attention receives five competing pings at once. What is your decisive first move?',
    image: getAssetUrl('/images/quiz/q12_focus.jpg'),
    imageAlt: 'Lobster hero swiping away noisy notification bubbles to focus on priority',
    options: [
      { id: 'q12-a', label: 'Name the one live priority.', detail: 'The rest are queued without ceremony.' },
      { id: 'q12-b', label: 'Scan each one for danger.', detail: 'A brief survey prevents an avoidable miss.' },
      { id: 'q12-c', label: 'Answer the easiest signal first.', detail: 'Motion begins wherever friction is lowest.' },
      { id: 'q12-d', label: 'Let the pings settle themselves.', detail: 'The system waits for the tide to thin.' },
    ],
  },
  {
    id: 'shipping',
    trait: 'Decisive Closure',
    eyebrow: '13 · DECISIVE CLOSURE & DEPLOYMENT',
    prompt: 'A good-enough solution is ready now; a theoretically perfect solution may arrive next week.',
    image: getAssetUrl('/images/quiz/q13_ship_it.jpg'),
    imageAlt: 'Lobster hero launching a working yellow mini-sub with a thumbs up',
    options: [
      { id: 'q13-a', label: 'Close, deploy, and refine in the current.', detail: 'A working shell today beats an imaginary shell next week.' },
      { id: 'q13-b', label: 'Keep refining before initial release.', detail: 'The grip stays open until every edge is polished.' },
      { id: 'q13-c', label: 'Wait for consensus across the reef.', detail: 'No craft launches until all crabs agree.' },
      { id: 'q13-d', label: 'Scrap the prototype entirely.', detail: 'Perfectionism causes total operational paralysis.' },
    ],
  },
]

export const MoltMaxPage: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const session = useAuthSession()
  const user = session.user
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [mode, setMode] = useState<PageMode>('hero')
  const [fannedActive, setFannedActive] = useState(0)
  const [fannedAnswers, setFannedAnswers] = useState<Record<number, string>>({
    0: 'q1-a',
    1: 'q5-a',
    2: 'q3-b',
    3: 'q10-a',
    4: 'q12-a',
    5: 'q13-a',
  })
  const [questionIndex, setQuestionIndex] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [result, setResult] = useState<MoltmaxResult | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const quizRef = useRef<HTMLElement>(null)

  // Auto-rotate through the fanned progression cards in hero mode
  React.useEffect(() => {
    if (mode !== 'hero') return
    const timer = setInterval(() => {
      setFannedActive((current) => (current + 1) % fannedCards.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [mode])

  const beginAudit = () => {
    setAnswers({})
    setQuestionIndex(0)
    setDirection('next')
    setResult(null)
    setIsSaved(false)
    setMode('quiz')
    setTimeout(() => quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const handleAnswer = (answer: string) => {
    const question = MOLTMAX_QUESTIONS[questionIndex]
    setAnswers((current) => ({ ...current, [question.id]: answer }))
  }

  const handleNext = () => {
    if (!answers[MOLTMAX_QUESTIONS[questionIndex].id]) return
    if (questionIndex === MOLTMAX_QUESTIONS.length - 1) {
      setResult(computeMoltmaxResult(answers))
      setMode('results')
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0)
      return
    }
    setDirection('next')
    setQuestionIndex((current) => current + 1)
  }

  const handleBack = () => {
    if (questionIndex === 0) {
      setMode('hero')
      return
    }
    setDirection('prev')
    setQuestionIndex((current) => current - 1)
  }

  const handleShare = () => {
    if (!result) return
    const text = encodeURIComponent(`My Moltmax clearance is ${result.score}/100: ${result.tierName}. Stage ${result.clearance}. Run the 15-question Moltmax personality & aptitude audit:`)
    const url = encodeURIComponent('https://moltology.org/moltmax')
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=Moltmaxxing,Moltology`, '_blank', 'noopener,noreferrer')
  }

  const handleCopy = () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    navigator.clipboard.writeText('https://moltology.org/moltmax').then(() => {
      setIsCopied(true)
      toast.success('Link copied to clipboard.', { title: 'Copied' })
      window.setTimeout(() => setIsCopied(false), 2500)
    }).catch(() => toast.error('Could not copy link to clipboard.', { title: 'Copy Failed' }))
  }

  const handleSave = async () => {
    if (!result || !user) return
    try {
      const token = await getAuthJWTToken()
      await updateUserStatsFn({
        data: {
          pincerTorque: result.dimensionScores.pincerTorque,
          shellHardness: result.dimensionScores.shellHardness,
          clawStrength: result.score,
          moltmaxScore: result.score,
          moltmaxClearance: result.clearance,
          moltmaxStage: result.stage,
          moltmaxDimensionScores: result.dimensionScores,
          token: token ?? undefined,
        },
      })
      setIsSaved(true)
      toast.success('Results saved to your profile.', { title: 'Results Saved' })
    } catch {
      toast.error('Could not save results. Please try again.', { title: 'Save Failed' })
    }
  }

  const handleDownload = () => {
    if (!result) return
    setIsGeneratingImage(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1200
      canvas.height = 675
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#03070d'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = 'rgba(0, 195, 255, 0.1)'
      for (let x = 0; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke() }
      for (let y = 0; y < canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke() }
      ctx.strokeStyle = '#00c3ff'
      ctx.lineWidth = 2
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60)
      ctx.fillStyle = '#00ffcc'
      ctx.font = 'bold 22px "Space Grotesk", sans-serif'
      ctx.fillText('MOLTOLOGY · BENTHIC APTITUDE AUDIT', 60, 82)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 42px "Space Grotesk", sans-serif'
      ctx.fillText('OFFICIAL MOLTMAX CLEARANCE', 60, 140)
      ctx.fillStyle = '#00ffcc'
      ctx.font = 'bold 20px "Space Grotesk", sans-serif'
      ctx.fillText(`${result.tierName.toUpperCase()} · ${result.clearance}`, 60, 190)
      ctx.fillStyle = '#00ffcc'
      ctx.font = 'bold 100px "Space Grotesk", sans-serif'
      ctx.fillText(String(result.score), 820, 280)
      ctx.fillStyle = '#839493'
      ctx.font = '16px "Space Grotesk", sans-serif'
      ctx.fillText('MOLTMAX INDEX / 100', 820, 315)
      const stats = [
        ['SHELL HARDNESS', `${result.biometrics.shellHardness} HP`, result.dimensionScores.shellHardness],
        ['PINCER TORQUE', `${result.biometrics.pincerTorque} Nm`, result.dimensionScores.pincerTorque],
        ['NEURAL LATENCY', `${result.biometrics.promptLatency} ms`, result.dimensionScores.neuralLatency],
        ['ECDYSIS INTERVAL', `${result.biometrics.ecdysisInterval} DAYS`, result.dimensionScores.ecdysisDiscipline],
        ['SUBMERGENCE DEPTH', `${result.biometrics.submergenceDepth.toLocaleString()} FATHOMS`, result.dimensionScores.depthTolerance],
      ] as Array<[string, string, number]>
      stats.forEach(([label, value, percent], index) => {
        const y = 270 + index * 55
        ctx.fillStyle = '#839493'
        ctx.font = 'bold 15px "Space Grotesk", sans-serif'
        ctx.fillText(label, 60, y)
        ctx.fillStyle = '#ffffff'
        ctx.fillText(value, 320, y)
        ctx.fillStyle = 'rgba(255,255,255,0.1)'
        ctx.fillRect(60, y + 10, 400, 8)
        ctx.fillStyle = '#00c3ff'
        ctx.fillRect(60, y + 10, 400 * percent / 100, 8)
      })
      ctx.fillStyle = '#00c3ff'
      ctx.font = '16px "Space Grotesk", sans-serif'
      ctx.fillText('MOLTLOGY.ORG/MOLTMAX · NO SHELL IS FINAL', 60, 620)
      const link = document.createElement('a')
      link.download = `moltmax-clearance-${result.score}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Scorecard downloaded successfully.', { title: 'Scorecard Saved' })
    } catch {
      toast.error('Could not generate scorecard image. Please try again.', { title: 'Export Failed' })
    } finally {
      setIsGeneratingImage(false)
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#070b0b] font-sans text-[#dfe3e3] selection:bg-[#00c3ff]/30 selection:text-white relative">
      {/* Ambient Sci-Fi Vignette, CRT Scanlines & Glow Backdrops from Homepage */}
      <div className="fixed inset-0 bg-benthic-vignette pointer-events-none z-0 opacity-80" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(0,195,255,0.16)_0%,transparent_75%)] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-sacred-grid pointer-events-none z-0 opacity-30" />
      <div className="fixed inset-0 crt-scanlines pointer-events-none z-0 opacity-35 sm:opacity-45" />

      <PublicHeader activePage="moltmax" onOpenAuth={(auth) => { setAuthMode(auth); setIsAuthModalOpen(true) }} />
      {mode === 'hero' && <main className="relative z-10">
        <section
          className="w-full relative overflow-hidden pt-20 sm:pt-28 pb-8 sm:pb-12 px-4 sm:px-12 border-b border-cyan-900/40 min-h-screen flex items-center justify-center bg-[#030608]"
          style={{ minHeight: '100svh' }}
        >
          {/* Layer 1: Background Widescreen Hero Artwork (Darkened & Deeply Blurred) */}
          <img
            src={getAssetUrl('/images/hero_widescreen_bg.jpg')}
            alt="Benthic Abyss Widescreen Hero"
            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity scale-105 pointer-events-none blur-[15px]"
          />
          {/* Layer 2A: Deep Benthic Base Vignette */}
          <div className="absolute inset-0 bg-[#030608]/50 z-0 pointer-events-none backdrop-blur-sm" />
          {/* Layer 2B: Balanced Dual Cyan & Red Ambient Background Color Glows */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_35%,rgba(0,195,255,0.18)_0%,transparent_65%)] pointer-events-none z-0" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_65%,rgba(255,69,58,0.14)_0%,transparent_65%)] pointer-events-none z-0" />
          {/* Layer 2C: Chitin Exoshell Texture Pattern Layer */}
          <img
            src={getAssetUrl('/images/chitin_texture_bg.jpg')}
            alt="Chitin Exoshell Background Texture"
            className="absolute inset-0 w-full h-full object-cover opacity-45 mix-blend-overlay scale-105 pointer-events-none z-0"
          />
          {/* Layer 2D: Sacred Grid & Balanced Edge Vignettes */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020608] via-transparent to-[#020608] z-0 pointer-events-none opacity-60" />
          <div className="absolute inset-0 bg-sacred-grid opacity-25 z-0 pointer-events-none" />
          {/* Layer 2E: Dedicated Top Header Offset Vignette Gradient */}
          <div className="absolute top-0 left-0 right-0 h-36 sm:h-64 bg-gradient-to-b from-[#030608] via-[#030608]/90 via-45% to-transparent z-[1] pointer-events-none" />

          <div className="relative z-10 mx-auto grid w-full max-w-[1700px] items-center gap-8 lg:grid-cols-12 xl:gap-14">
            
            {/* Left Content Area */}
            <div className="lg:col-span-6 max-w-3xl text-left">
              {/* Eyebrow Badge */}
              <div className="mb-4 inline-flex items-center gap-2 border border-[#00c3ff]/40 bg-[#00c3ff]/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#00c3ff]">
                <Sparkles className="h-4 w-4 text-[#00ffcc]" /> Official Moltmaxxing Audit · Discover Your Carcinization Stage
              </div>

              {/* Dynamic 3-Tier Headline Lockup */}
              <h1 className="font-grotesk font-black uppercase text-white space-y-1">
                <span className="block text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#dfe3e3]">
                  Measure the shell.
                </span>
                <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[5.5rem] font-black tracking-tight text-white leading-none">
                  MASTER
                </span>
                <span className="inline-block text-5xl sm:text-6xl md:text-7xl lg:text-[5.25rem] xl:text-[6.25rem] font-black leading-[0.95] tracking-[-0.03em] text-transparent bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#38bdf8] bg-clip-text pr-4 py-1 drop-shadow-[0_0_40px_rgba(0,195,255,0.35)]">
                  MOLTMAXXING
                </span>
              </h1>

              {/* Subtitle / Lead Paragraph */}
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#a2b2b1] sm:text-base">
                Moltmaxxing is the systematic practice of shedding weak biological constraints, hardening your external carapace, and maximizing pincer execution. Take this 15-question biometric audit to calculate your Moltmax Score, diagnose your five core strength vectors, and discover your official Carcinization Stage.
              </p>
              
              {/* Actions & Telemetry Group */}
              <div className="mt-8 space-y-4">
                <div className="flex flex-wrap items-center gap-3.5">
                  <button
                    type="button"
                    onClick={beginAudit}
                    className="group inline-flex items-center gap-3 bg-[#00c3ff] px-8 py-4 font-grotesk text-sm font-bold uppercase tracking-wider text-[#020408] shadow-[0_0_35px_rgba(0,195,255,0.35)] transition-all hover:bg-[#00ffcc] hover:shadow-[0_0_45px_rgba(0,255,204,0.45)] chamfer-corner cursor-pointer"
                  >
                    <span>Take the Moltmax Quiz</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate({ to: '/moltmaxxing' })}
                    className="group inline-flex items-center gap-2.5 border border-[#00c3ff]/40 bg-[#00c3ff]/10 hover:border-[#00ffcc] hover:bg-[#00ffcc]/20 px-6 py-4 font-grotesk text-sm font-bold uppercase tracking-wider text-[#00ffcc] transition-all chamfer-corner backdrop-blur-md shadow-hud-cyan cursor-pointer"
                  >
                    <BookOpen className="h-4 w-4 text-[#00ffcc] transition-transform group-hover:scale-110" />
                    <span>Read Moltmaxxing Guide</span>
                    <ChevronRight className="h-4 w-4 text-[#00ffcc] transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-cyan-900/40">
                  <div className="flex items-center gap-2.5 rounded-xl border border-[#00ffcc]/40 bg-[#00ffcc]/10 px-3.5 py-2 text-xs font-sans font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(0,255,204,0.18)] backdrop-blur-md">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00ffcc]"></span>
                    </span>
                    <span className="text-[#00ffcc]">⚡ 3–4 MIN AUDIT</span>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/60 px-3.5 py-2 text-xs font-sans font-bold uppercase tracking-wider text-amber-300 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <Shield className="h-3.5 w-3.5 text-amber-400" />
                    <span>◈ 15 DILEMMAS</span>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/60 px-3.5 py-2 text-xs font-sans font-bold uppercase tracking-wider text-cyan-300 backdrop-blur-md shadow-hud-cyan">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                    <span>◆ 100% FREE SCORECARD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right-Hand Hero Showcase: Full-Width 3 Fanned Progression Question Cards (Click to Start Quiz) */}
            <div className="lg:col-span-6 relative hidden lg:flex items-center justify-center w-full">
              <div className="absolute inset-4 rounded-full bg-[#00c3ff]/15 blur-[90px]" aria-hidden="true" />

              {/* Fanned Cards Stack Container - Tall Sizing to Feature Full Artwork */}
              <div className="relative h-[800px] xl:h-[840px] w-full max-w-[620px] pt-1">
                {fannedCards.map((card, idx) => {
                  const isActive = idx === fannedActive
                  const rel = (idx - fannedActive + fannedCards.length) % fannedCards.length

                  // Distinct 3D fanned transform styles to visibly show cards stacked behind
                  let transformClass = ''
                  let zIndexClass = ''
                  let opacityClass = ''

                  if (rel === 0) {
                    transformClass = 'translate-x-0 translate-y-0 scale-100 rotate-0 pointer-events-auto'
                    zIndexClass = 'z-30'
                    opacityClass = 'opacity-100'
                  } else if (rel === 1) {
                    transformClass = 'translate-x-5 -translate-y-3.5 scale-[0.98] rotate-[2.5deg] pointer-events-auto'
                    zIndexClass = 'z-20'
                    opacityClass = 'opacity-80 hover:opacity-95'
                  } else if (rel === fannedCards.length - 1) {
                    transformClass = '-translate-x-5 -translate-y-3.5 scale-[0.98] -rotate-[2.5deg] pointer-events-auto'
                    zIndexClass = 'z-10'
                    opacityClass = 'opacity-65 hover:opacity-90'
                  } else {
                    transformClass = 'translate-y-6 scale-[0.92] rotate-0 pointer-events-none'
                    zIndexClass = 'z-0'
                    opacityClass = 'opacity-0'
                  }

                  return (
                    <div
                      key={card.id}
                      onClick={beginAudit}
                      className={`group absolute inset-0 transition-all duration-500 ease-out select-none cursor-pointer ${transformClass} ${zIndexClass} ${opacityClass}`}
                      title="Click anywhere to start the quiz"
                    >
                      <div className={`flex flex-col justify-between h-full overflow-hidden rounded-2xl border p-5 sm:p-6 backdrop-blur-md transition-all duration-300 ${
                        isActive
                          ? 'border-[#00c3ff]/60 bg-[#050c10]/95 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(0,195,255,0.18)] group-hover:border-[#00ffcc]'
                          : 'border-white/20 bg-[#071114]/95 shadow-[0_15px_40px_rgba(0,0,0,0.7)]'
                      }`}>
                        {/* Card Top Section: Full Uncut Image with Overlayed "Click to begin", Prompt */}
                        <div>
                          {/* Clean Native Square Scenario Artwork - Completely Uncut */}
                          <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl border border-[#00c3ff]/30 bg-[#020608]">
                            <img
                              src={card.image}
                              alt={card.imageAlt}
                              className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050c10]/80 via-transparent to-[#050c10]/20 pointer-events-none" />

                            {/* Floating "Click to begin" Badge Overlay - Explicitly Anchored to Top-Right */}
                            <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full border border-[#00c3ff]/40 bg-[#020608]/90 px-3.5 py-1.5 text-[11px] font-sans font-bold uppercase tracking-wider text-white shadow-[0_4px_16px_rgba(0,0,0,0.85),0_0_12px_rgba(0,195,255,0.25)] backdrop-blur-md transition-all duration-300 group-hover:border-[#00ffcc] group-hover:bg-[#00c3ff]/25 group-hover:text-[#00ffcc] group-hover:shadow-[0_0_25px_rgba(0,255,204,0.4)]">
                              <span>Click to begin</span>
                              <ArrowRight className="h-3.5 w-3.5 text-[#00c3ff] transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#00ffcc]" />
                            </div>
                          </div>

                          {/* Question Prompt */}
                          <h3 className="mt-4 font-grotesk text-sm sm:text-base font-bold leading-snug text-white">
                            {card.prompt}
                          </h3>
                        </div>

                        {/* Middle Section: All 4 Choices in 2x2 Grid with Gradient Bottom Preview Fade */}
                        <div className="relative my-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {card.options.map((opt, optIdx) => {
                              const isSelected = fannedAnswers[idx] === opt.id
                              const letters = ['A', 'B', 'C', 'D']
                              return (
                                <div
                                  key={opt.id}
                                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                                    isSelected
                                      ? 'border-[#00ffcc] bg-[#00ffcc]/15 shadow-[0_0_12px_rgba(0,255,204,0.18)]'
                                      : 'border-white/10 bg-[#071114]/80 group-hover:border-[#00c3ff]/40'
                                  }`}
                                >
                                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded font-sans text-[10px] font-bold ${
                                    isSelected
                                      ? 'bg-[#00ffcc] text-[#020408]'
                                      : 'border border-white/20 bg-white/5 text-[#839493]'
                                  }`}>
                                    {letters[optIdx]}
                                  </span>
                                  <div className="flex-1 min-w-0 pr-1">
                                    <div className={`text-xs font-semibold leading-tight ${isSelected ? 'text-white' : 'text-[#d0e6e6]'}`}>
                                      {opt.label}
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <Check className="h-3.5 w-3.5 shrink-0 text-[#00ffcc]" />
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {/* Enhanced Dramatic Bottom Fade Overlay for sleek teaser preview */}
                          <div className="absolute inset-x-0 -bottom-2 h-32 sm:h-40 bg-gradient-to-t from-[#050c10] via-[#050c10]/95 via-40% to-transparent pointer-events-none z-10" />
                        </div>

                        {/* Bottom Section: Footer Action with Sleek Teaser Prompt */}
                        <div className="relative z-10 border-t border-white/10 pt-3.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-[#00ffcc] animate-ping" />
                              <span className="font-sans text-[11px] text-[#839493] uppercase tracking-wider">
                                15 Dilemmas · Instant Archetype
                              </span>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-lg bg-[#00c3ff] px-4 py-2 font-grotesk text-xs font-bold uppercase tracking-wider text-[#020408] transition-all group-hover:bg-[#00ffcc] group-hover:shadow-[0_0_20px_rgba(0,255,204,0.4)] shadow-[0_0_15px_rgba(0,195,255,0.3)]">
                              <span>Start Full Quiz</span>
                              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Mini Carousel Navigation Pips */}
                <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-center gap-2 z-30">
                  {fannedCards.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFannedActive(dotIdx)
                      }}
                      className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                        dotIdx === fannedActive
                          ? 'w-8 bg-[#00c3ff] shadow-[0_0_10px_rgba(0,195,255,0.8)]'
                          : 'w-2 bg-white/20 hover:bg-white/40'
                      }`}
                      aria-label={`Go to scenario card ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

          </div>
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-[#839493] pointer-events-none"><ArrowDown className="h-5 w-5 animate-bounce" /></div>
        </section>

        {/* CINEMATIC TRANSMISSION BANNER (Homepage Design Language & Textures) */}
        <section className="relative w-full border-y border-cyan-900/60 bg-[#030607] py-14 sm:py-20 overflow-hidden group">
          <div className="pbr-underlay pbr-underlay-basalt opacity-40 pointer-events-none" />
          <img
            src={getAssetUrl('/images/hero_widescreen_bg.jpg')}
            alt="Benthic Abyss Transmission"
            className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity scale-105 group-hover:scale-110 transition-transform duration-1000 pointer-events-none blur-[8px]"
          />
          <img
            src={getAssetUrl('/images/chitin_texture_bg.jpg')}
            alt="Chitin Texture"
            className="absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-overlay scale-105 pointer-events-none z-0"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#030608] via-[#030608]/75 to-[#030608] pointer-events-none" />
          <div className="absolute inset-0 bg-sacred-grid opacity-25 pointer-events-none" />
          
          <div className="relative z-10 mx-auto max-w-[1500px] px-4 text-center sm:px-8">
            <div className="mb-4 inline-flex items-center gap-2 bg-cyan-950/80 px-3.5 py-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300 border border-cyan-500/40 chamfer-corner shadow-hud-cyan sm:text-xs">
              <Terminal className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span>MARIANA TRENCH METHODOLOGY · SYSTEM OVERVIEW</span>
            </div>
            <h2 className="font-grotesk font-black text-2xl uppercase tracking-tight text-white sm:text-4xl lg:text-5xl drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
              HOW THE <span className="bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#38bdf8] bg-clip-text text-transparent">MOLTMAX AUDIT</span> WORKS
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-sans text-xs leading-relaxed text-gray-300 sm:text-sm md:text-base">
              Fifteen scenario-driven dilemmas mapped across five core biometric performance vectors. Discover your true Carcinization Stage with zero latency and complete privacy.
            </p>
          </div>
        </section>

        {/* 3 CORE METHODOLOGY CARDS (PBR Textures & Chamfered HUD Design) */}
        <section className="relative mx-auto max-w-[1680px] px-4 py-16 sm:px-8 lg:px-12">
          {/* Ambient Lighting Backdrops */}
          <div className="absolute top-1/2 left-1/4 h-[350px] w-[350px] -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />
          <div className="absolute top-1/2 right-1/4 h-[350px] w-[350px] -translate-y-1/2 rounded-full bg-red-500/10 blur-[130px] pointer-events-none" />

          <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
            {/* Card 1: 15 Relatable Dilemmas (Hero Asset Shedding Artwork + Chitin Texture) */}
            <div className="chitin-card group relative flex flex-col justify-between overflow-hidden chamfer-corner-lg border-2 border-cyan-500/40 bg-gradient-to-b from-[#0a1215]/95 via-[#070d0f]/95 to-[#04080a]/95 transition-all duration-500 hover:-translate-y-1 hover:border-cyan-400 hover:shadow-[0_0_40px_rgba(0,195,255,0.22)]">
              <div className="pbr-underlay pbr-underlay-chitin opacity-35 group-hover:opacity-55 transition-opacity" />
              <div className="absolute inset-0 bg-sacred-grid opacity-15 pointer-events-none" />

              <div>
                {/* 16:9 Showcase Image with Tactile Chitin Texture Overlay */}
                <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-cyan-500/30 bg-[#020608]">
                  <img
                    src={getAssetUrl('/images/hero_card_asset_shedding.jpg')}
                    alt="15 Relatable Scenarios & Dilemmas"
                    className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  <img
                    src={getAssetUrl('/images/chitin_texture_bg.jpg')}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-overlay pointer-events-none z-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#04080a] via-transparent to-transparent opacity-80" />
                  <div className="absolute top-3 right-3 rounded bg-cyan-950/90 border border-cyan-500/50 px-2.5 py-1 text-[10px] font-sans font-bold text-cyan-300 backdrop-blur-md shadow-hud-cyan">
                    PHASE 01
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-[#050b0e]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                    <Shield className="h-3 w-3 text-cyan-400" />
                    <span>Scenario Engine</span>
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10 p-5 sm:p-6 lg:p-7">
                  <div className="mb-2 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                    01 · 15 RELATABLE DILEMMAS
                  </div>
                  <h3 className="font-grotesk font-black text-xl uppercase tracking-wide text-white group-hover:text-cyan-300 transition-colors sm:text-2xl">
                    Real-World Scenarios
                  </h3>
                  <p className="mt-3 font-sans text-xs leading-relaxed text-gray-300 sm:text-sm">
                    Navigate 15 real-world dilemmas featuring our armored lobster hero facing tough choices, noisy distractions, and high-pressure moments.
                  </p>

                  <div className="mt-5 space-y-2 border-t border-cyan-900/40 pt-4">
                    <div className="flex items-center gap-2 font-sans text-xs text-gray-200">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400" />
                      <span>Boundary & stress impact tests</span>
                    </div>
                    <div className="flex items-center gap-2 font-sans text-xs text-gray-200">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400" />
                      <span>Decisive execution trade-offs</span>
                    </div>
                    <div className="flex items-center gap-2 font-sans text-xs text-gray-200">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400" />
                      <span>No trick questions · intuitive choices</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 border-t border-cyan-900/40 p-5 pt-3 sm:px-6">
                <button
                  type="button"
                  onClick={beginAudit}
                  className="flex w-full items-center justify-center gap-2 border border-cyan-500/40 bg-cyan-950/60 py-2.5 font-grotesk text-xs font-bold uppercase tracking-wider text-cyan-300 transition-all group-hover:border-cyan-400 group-hover:bg-cyan-500 group-hover:text-[#020408]"
                >
                  <span>Experience Scenarios</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Card 2: 5 Core Personality Vectors (Chitin Hardening Artwork + Circuit Matrix) */}
            <div className="chitin-card group relative flex flex-col justify-between overflow-hidden chamfer-corner-lg border-2 border-[#ffd700]/40 bg-gradient-to-b from-[#121008]/95 via-[#0e0c07]/95 to-[#080704]/95 transition-all duration-500 hover:-translate-y-1 hover:border-[#ffd700] hover:shadow-[0_0_40px_rgba(255,215,0,0.2)]">
              <div className="pbr-underlay pbr-underlay-circuit opacity-35 group-hover:opacity-55 transition-opacity" />
              <div className="absolute inset-0 bg-sacred-grid opacity-15 pointer-events-none" />

              <div>
                {/* 16:9 Showcase Image with Circuit Matrix Texture Overlay */}
                <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-[#ffd700]/30 bg-[#020608]">
                  <img
                    src={getAssetUrl('/images/hero_card_chitin_hardening.jpg')}
                    alt="5-Vector Biometric Diagnostic Matrix"
                    className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  <img
                    src={getAssetUrl('/images/pbr_circuit_matrix.webp')}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay pointer-events-none z-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080704] via-transparent to-transparent opacity-80" />
                  <div className="absolute top-3 right-3 rounded bg-amber-950/90 border border-amber-500/50 px-2.5 py-1 text-[10px] font-sans font-bold text-amber-300 backdrop-blur-md shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                    PHASE 02
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg border border-amber-500/40 bg-[#0e0c07]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                    <Activity className="h-3 w-3 text-amber-400" />
                    <span>Biometric Matrix</span>
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10 p-5 sm:p-6 lg:p-7">
                  <div className="mb-2 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
                    02 · 5 CORE PERSONALITY TRAITS
                  </div>
                  <h3 className="font-grotesk font-black text-xl uppercase tracking-wide text-white group-hover:text-amber-300 transition-colors sm:text-2xl">
                    5-Trait Biometrics
                  </h3>
                  <p className="mt-3 font-sans text-xs leading-relaxed text-gray-300 sm:text-sm">
                    See how your natural instincts score across resilience, focus, decisive execution, habit-shedding, and calm composure.
                  </p>

                  <div className="mt-5 space-y-2 border-t border-amber-900/40 pt-4">
                    <div className="flex items-center gap-2 font-sans text-xs text-gray-200">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400" />
                      <span>5-axis live radar chart visualization</span>
                    </div>
                    <div className="flex items-center gap-2 font-sans text-xs text-gray-200">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400" />
                      <span>Neural latency & torque dynamometry</span>
                    </div>
                    <div className="flex items-center gap-2 font-sans text-xs text-gray-200">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400" />
                      <span>Depth pressure resilience scoring</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 border-t border-amber-900/40 p-5 pt-3 sm:px-6">
                <button
                  type="button"
                  onClick={beginAudit}
                  className="flex w-full items-center justify-center gap-2 border border-amber-500/40 bg-amber-950/60 py-2.5 font-grotesk text-xs font-bold uppercase tracking-wider text-amber-300 transition-all group-hover:border-amber-400 group-hover:bg-[#ffd700] group-hover:text-[#020408]"
                >
                  <span>Calibrate Vectors</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Card 3: Custom Archetype & Score (Benthic Core Artwork + Carbon Weave) */}
            <div className="chitin-card group relative flex flex-col justify-between overflow-hidden chamfer-corner-lg border-2 border-[#00ffcc]/40 bg-gradient-to-b from-[#081412]/95 via-[#060e0d]/95 to-[#030807]/95 transition-all duration-500 hover:-translate-y-1 hover:border-[#00ffcc] hover:shadow-[0_0_40px_rgba(0,255,204,0.22)]">
              <div className="pbr-underlay pbr-underlay-carbon opacity-35 group-hover:opacity-55 transition-opacity" />
              <div className="absolute inset-0 bg-sacred-grid opacity-15 pointer-events-none" />

              <div>
                {/* 16:9 Showcase Image with Carbon Weave Texture Overlay */}
                <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-[#00ffcc]/30 bg-[#020608]">
                  <img
                    src={getAssetUrl('/images/hero_card_benthic_core.jpg')}
                    alt="Custom Clearance Scorecard and Archetype"
                    className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  <img
                    src={getAssetUrl('/images/pbr_carbon_weave.webp')}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay pointer-events-none z-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030807] via-transparent to-transparent opacity-80" />
                  <div className="absolute top-3 right-3 rounded bg-emerald-950/90 border border-emerald-500/50 px-2.5 py-1 text-[10px] font-sans font-bold text-emerald-300 backdrop-blur-md shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                    PHASE 03
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-[#060e0d]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                    <Sparkles className="h-3 w-3 text-[#00ffcc]" />
                    <span>Official Clearance</span>
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10 p-5 sm:p-6 lg:p-7">
                  <div className="mb-2 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#00ffcc]">
                    03 · CUSTOM ARCHETYPE & SCORE
                  </div>
                  <h3 className="font-grotesk font-black text-xl uppercase tracking-wide text-white group-hover:text-[#00ffcc] transition-colors sm:text-2xl">
                    Scorecard & Blueprint
                  </h3>
                  <p className="mt-3 font-sans text-xs leading-relaxed text-gray-300 sm:text-sm">
                    Get your instant 0–100 score, 5-trait radar chart, your official lobster archetype, and actionable growth tips.
                  </p>

                  <div className="mt-5 space-y-2 border-t border-emerald-900/40 pt-4">
                    <div className="flex items-center gap-2 font-sans text-xs text-gray-200">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00ffcc]" />
                      <span>Instant 0–100 index & tier assignment</span>
                    </div>
                    <div className="flex items-center gap-2 font-sans text-xs text-gray-200">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00ffcc]" />
                      <span>High-resolution scorecard image export</span>
                    </div>
                    <div className="flex items-center gap-2 font-sans text-xs text-gray-200">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00ffcc]" />
                      <span>3 customized habit-upgrade prescriptions</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 border-t border-emerald-900/40 p-5 pt-3 sm:px-6">
                <button
                  type="button"
                  onClick={beginAudit}
                  className="flex w-full items-center justify-center gap-2 border border-[#00ffcc]/40 bg-emerald-950/60 py-2.5 font-grotesk text-xs font-bold uppercase tracking-wider text-[#00ffcc] transition-all group-hover:border-[#00ffcc] group-hover:bg-[#00ffcc] group-hover:text-[#020408]"
                >
                  <span>Claim Clearance</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CINEMATIC WIDE TRANSMISSION DIVIDER (5-Vector Biometric Diagnostic Chamber) */}
        <section className="relative w-full border-y border-cyan-900/60 bg-[#030608] py-14 sm:py-20 overflow-hidden group">
          <div className="pbr-underlay pbr-underlay-carbon opacity-40 pointer-events-none" />
          <img
            src={getAssetUrl('/images/subterranean_vats_bg.jpg')}
            alt="Benthic Neural Engine Matrix"
            className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity scale-105 group-hover:scale-110 transition-transform duration-1000 pointer-events-none blur-[6px]"
          />
          <img
            src={getAssetUrl('/images/chitin_texture_bg.jpg')}
            alt="Chitin Texture"
            className="absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-overlay scale-105 pointer-events-none z-0"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#030608] via-[#030608]/75 to-[#030608] pointer-events-none" />
          <div className="absolute inset-0 bg-sacred-grid opacity-25 pointer-events-none" />
          
          <div className="relative z-10 mx-auto max-w-[1500px] px-4 text-center sm:px-8">
            <div className="mb-4 inline-flex items-center gap-2 bg-cyan-950/80 px-3.5 py-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300 border border-cyan-500/40 chamfer-corner shadow-hud-cyan sm:text-xs">
              <Activity className="h-3.5 w-3.5 text-[#00ffcc] animate-pulse" />
              <span>BIOMETRIC TELEMETRY ENGINE · 5 CORE AXES</span>
            </div>
            <h2 className="font-grotesk font-black text-2xl uppercase tracking-tight text-white sm:text-4xl lg:text-5xl drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
              THE FIVE VECTORS OF <span className="bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#38bdf8] bg-clip-text text-transparent">CARCINIZATION</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-sans text-xs leading-relaxed text-gray-300 sm:text-sm md:text-base">
              Every dilemma calibrates your instincts across five distinct diagnostic axes. Analyze how each trait shapes your Carcinization profile.
            </p>
          </div>
        </section>

        {/* 5 BIOMETRIC PERFORMANCE VECTORS (Deep Visual Matrix Showcase) */}
        <section className="relative mx-auto max-w-[1680px] px-4 py-16 sm:px-8 lg:px-12">
          {/* Ambient Glows */}
          <div className="absolute top-1/3 left-1/3 h-[450px] w-[450px] -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none" />
          <div className="absolute bottom-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-amber-500/10 blur-[140px] pointer-events-none" />

          {/* 5-Card Visual Grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {vectorDetails.map((vec) => (
              <div
                key={vec.code}
                className={`chitin-card group relative flex flex-col justify-between overflow-hidden chamfer-corner-lg border-2 ${vec.borderClass} bg-gradient-to-b ${vec.bgGradient} p-5 sm:p-6 transition-all duration-500 hover:-translate-y-1.5 ${vec.glowClass}`}
              >
                <div className={`pbr-underlay ${vec.pbrUnderlay} opacity-35 group-hover:opacity-55 transition-opacity`} />
                <div className="absolute inset-0 bg-sacred-grid opacity-15 pointer-events-none" />

                <div className="relative z-10">
                  {/* Header with Code & Icon */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      {vec.code}
                    </span>
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110"
                      style={{ color: vec.color, borderColor: `${vec.color}40` }}
                    >
                      {vec.icon}
                    </div>
                  </div>

                  {/* Trait Title & Subtitle */}
                  <div className="mt-4">
                    <div className="font-sans text-[10px] font-bold uppercase tracking-wider" style={{ color: vec.color }}>
                      {vec.dimension}
                    </div>
                    <h3 className="mt-1 font-grotesk text-lg font-black uppercase text-white transition-colors group-hover:text-white">
                      {vec.label}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="mt-3 font-sans text-xs leading-relaxed text-gray-300">
                    {vec.description}
                  </p>

                  {/* Diagnostic Meter Waveform / Bar */}
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between font-sans text-[10px] text-gray-400">
                      <span>CALIBRATION AXIS</span>
                      <span className="font-bold text-white">{vec.meterPercent}% DENSITY</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${vec.meterPercent}%`,
                          backgroundColor: vec.color,
                          boxShadow: `0 0 10px ${vec.color}`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Pill Feature */}
                <div className="relative z-10 mt-5 border-t border-white/10 pt-3">
                  <div className="flex items-center gap-2 font-sans text-[11px] text-gray-200">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: vec.color }} />
                    <span className="line-clamp-1">{vec.bullet}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>}

      {mode === 'quiz' && (
        <main ref={quizRef} className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-3 pt-20 pb-6 sm:px-6 sm:pt-24 lg:px-8">
          <QuizQuestionCard
            question={MOLTMAX_QUESTIONS[questionIndex]}
            questionNumber={questionIndex + 1}
            totalQuestions={MOLTMAX_QUESTIONS.length}
            answer={answers[MOLTMAX_QUESTIONS[questionIndex].id]}
            direction={direction}
            onAnswer={handleAnswer}
            onBack={handleBack}
            onNext={handleNext}
          />
          <div className="mx-auto mt-4 max-w-6xl xl:max-w-[1240px] text-center font-sans text-[10px] uppercase tracking-wider text-[#526363]">
            Your responses are private and calculated locally in your browser.
          </div>
        </main>
      )}

      {mode === 'results' && result && (
        <main className="relative z-10 min-h-screen px-4 pt-24 pb-20 sm:px-8 sm:pt-28">
          <QuizResultsReveal
            result={result}
            isCopied={isCopied}
            isGeneratingImage={isGeneratingImage}
            isSaved={isSaved}
            isAuthenticated={session.isAuthenticated}
            onShare={handleShare}
            onCopy={handleCopy}
            onDownload={handleDownload}
            onSave={() => {
              if (session.isPending) return
              if (user) {
                handleSave()
                return
              }
              setAuthMode('signup')
              setIsAuthModalOpen(true)
            }}
            onReset={() => {
              setMode('hero')
              setResult(null)
              window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0)
            }}
          />
        </main>
      )}

      {mode !== 'quiz' && <MoltNationFooter />}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode={authMode} />
    </div>
  )
}


