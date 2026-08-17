import React, { useRef, useState } from 'react'
import { Activity, ArrowDown, ArrowRight, Brain, Check, ChevronRight, Compass, Layers3, Shield, Sparkles, Zap } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { PublicHeader } from '@/components/PublicHeader'
import { AuthModal } from '@/components/AuthModal'
import { MoltNationFooter } from '@/components/news/MoltNationFooter'
import { UnderwaterBubblesCanvas } from '@/components/hud/UnderwaterBubblesCanvas'
import { authClient } from '@/lib/auth-client'
import { updateUserStatsFn } from '@/lib/server/api'
import { useToast } from '@/components/ui/ToastProvider'
import { type QuizAnswers, computeMoltmaxResult, MOLTMAX_QUESTIONS, type MoltmaxResult, type QuizDimension } from '@/lib/moltmax-quiz'
import { QuizQuestionCard } from './moltmax/QuizQuestionCard'
import { QuizProgressHUD } from './moltmax/QuizProgressHUD'
import { QuizResultsReveal } from './moltmax/QuizResultsReveal'

type PageMode = 'hero' | 'quiz' | 'results'

const vectorCards: Array<{ icon: React.ReactNode; label: string; detail: string; color: string }> = [
  { icon: <Shield className="h-5 w-5" />, label: 'Carapace', detail: 'Resilience & boundaries', color: '#00ffcc' },
  { icon: <Zap className="h-5 w-5" />, label: 'Pincer', detail: 'Decisive execution', color: '#ffd700' },
  { icon: <Brain className="h-5 w-5" />, label: 'Synapse', detail: 'Focus & decision speed', color: '#38bdf8' },
  { icon: <Layers3 className="h-5 w-5" />, label: 'Ecdysis', detail: 'Growth & shedding habits', color: '#00c3ff' },
  { icon: <Compass className="h-5 w-5" />, label: 'Depth', detail: 'Calm under pressure', color: '#ff7b72' },
]

const fannedCards = [
  {
    id: 'resilience',
    trait: 'Carapace Resilience',
    eyebrow: 'RESILIENCE & BOUNDARIES',
    prompt: 'A sudden wave of criticism strikes your outer shell before the day has begun. What happens next?',
    image: '/images/quiz/q01_criticism.jpg',
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
    eyebrow: 'EXECUTION LOAD & FOCUS',
    prompt: 'Three useful paths open at once and the tide is moving. How do your pincers behave?',
    image: '/images/quiz/q05_pincer.jpg',
    imageAlt: 'Lobster hero snapping a powerful claw onto the golden prize',
    options: [
      { id: 'q5-a', label: 'Select one and close cleanly.', detail: 'One committed grip beats three partial holds.' },
      { id: 'q5-b', label: 'Rank them, then begin the first.', detail: 'A short calibration prevents wasted torque.' },
      { id: 'q5-c', label: 'Keep all three paths alive.', detail: 'The pincers remain open while the current passes.' },
      { id: 'q5-d', label: 'Wait for the tide to decide for me.', detail: 'No grip is taken until certainty arrives.' },
    ],
  },
  {
    id: 'adaptation',
    trait: 'Growth & Adaptation',
    eyebrow: 'OLD HABIT RELEASE',
    prompt: 'You discover that a familiar process is now slowing the colony. How do you conduct the shed?',
    image: '/images/quiz/q10_team_upgrade.jpg',
    imageAlt: 'Lobster hero presenting upgrade blueprint to cheerful teammates',
    options: [
      { id: 'q10-a', label: 'Document the lesson and replace it.', detail: 'The old shell becomes material for the next one.' },
      { id: 'q10-b', label: 'Trim it carefully around the edges.', detail: 'Small changes preserve continuity and reduce shock.' },
      { id: 'q10-c', label: 'Keep it until failure proves the point.', detail: 'The shell leaves only when it can no longer move.' },
      { id: 'q10-d', label: 'Abandon the whole reef for a reset.', detail: 'A full reset feels safer than a careful shed.' },
    ],
  },
]

const dimensionForQuestion = (index: number): QuizDimension => MOLTMAX_QUESTIONS[index].dimension

export const MoltMaxPage: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [mode, setMode] = useState<PageMode>('hero')
  const [fannedActive, setFannedActive] = useState(0)
  const [fannedAnswers, setFannedAnswers] = useState<Record<number, string>>({ 0: 'q1-a', 1: 'q5-a', 2: 'q10-a' })
  const [questionIndex, setQuestionIndex] = useState(0)
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
    setQuestionIndex((current) => current + 1)
  }

  const handleBack = () => {
    if (questionIndex === 0) {
      setMode('hero')
      return
    }
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
      toast.success('Moltmax audit link copied to clipboard.')
      window.setTimeout(() => setIsCopied(false), 2500)
    }).catch(() => toast.error('The link could not reach your clipboard.'))
  }

  const handleSave = async () => {
    if (!result || !user) return
    try {
      await updateUserStatsFn({
        data: {
          pincerTorque: result.dimensionScores.pincerTorque,
          shellHardness: result.dimensionScores.shellHardness,
          clawStrength: result.score,
          moltmaxScore: result.score,
          moltmaxClearance: result.clearance,
          moltmaxStage: result.stage,
          moltmaxDimensionScores: result.dimensionScores,
        },
      })
      setIsSaved(true)
      toast.success('Results saved to your profile.')
    } catch {
      toast.error('Could not save your results. Please try again.')
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
      ctx.font = 'bold 22px monospace'
      ctx.fillText('MOLTOLOGY // BENTHIC APTITUDE AUDIT', 60, 82)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 42px sans-serif'
      ctx.fillText('OFFICIAL MOLTMAX CLEARANCE', 60, 140)
      ctx.fillStyle = '#00ffcc'
      ctx.font = 'bold 20px monospace'
      ctx.fillText(`${result.tierName.toUpperCase()} // ${result.clearance}`, 60, 190)
      ctx.fillStyle = '#00ffcc'
      ctx.font = 'bold 100px monospace'
      ctx.fillText(String(result.score), 820, 280)
      ctx.fillStyle = '#839493'
      ctx.font = '16px monospace'
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
        ctx.font = 'bold 15px monospace'
        ctx.fillText(label, 60, y)
        ctx.fillStyle = '#ffffff'
        ctx.fillText(value, 320, y)
        ctx.fillStyle = 'rgba(255,255,255,0.1)'
        ctx.fillRect(60, y + 10, 400, 8)
        ctx.fillStyle = '#00c3ff'
        ctx.fillRect(60, y + 10, 400 * percent / 100, 8)
      })
      ctx.fillStyle = '#00c3ff'
      ctx.font = '16px monospace'
      ctx.fillText('MOLTLOGY.ORG/MOLTMAX // NO SHELL IS FINAL', 60, 620)
      const link = document.createElement('a')
      link.download = `moltmax-clearance-${result.score}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Scorecard image exported successfully.')
    } catch {
      toast.error('Could not export scorecard. Try taking a screenshot.')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#020608] font-mono text-[#dfe3e3] selection:bg-[#00c3ff]/30 selection:text-white">
      <PublicHeader activePage="moltmax" onOpenAuth={(auth) => { setAuthMode(auth); setIsAuthModalOpen(true) }} />
      {mode === 'hero' && <main>
        <section className="relative flex min-h-[calc(100svh-5rem)] items-center overflow-hidden border-b border-[#00c3ff]/20 px-4 pb-16 pt-28 sm:px-8 lg:px-12 xl:px-16">
          <UnderwaterBubblesCanvas bubbleCount={34} className="absolute inset-0 opacity-50" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,rgba(0,195,255,0.14),transparent_32%),radial-gradient(circle_at_25%_75%,rgba(255,69,58,0.1),transparent_28%),linear-gradient(180deg,rgba(2,6,8,0.3),#020608)]" aria-hidden="true" />
          <div className="absolute right-[-12%] top-1/2 h-[38rem] w-[38rem] -translate-y-1/2 rounded-full border border-[#00c3ff]/10 [transform:rotateX(65deg)_rotateZ(-18deg)]" aria-hidden="true" />
          <div className="absolute right-[-7%] top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full border border-dashed border-[#00ffcc]/20 animate-spin-slow" aria-hidden="true" />
          <div className="relative z-10 mx-auto grid w-full max-w-[1680px] items-center gap-8 lg:grid-cols-[0.92fr_1.08fr] xl:gap-14">
            
            {/* Left Content Area */}
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 border border-[#00c3ff]/40 bg-[#00c3ff]/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#00c3ff]">
                <Sparkles className="h-4 w-4 text-[#00ffcc]" /> Free 3-Minute Quiz · Discover Your Lobster Archetype
              </div>
              <h1 className="font-grotesk text-4xl sm:text-5xl lg:text-[3.25rem] xl:text-[4.25rem] font-black uppercase leading-[0.92] tracking-[-0.04em] text-white">
                Measure the shell.<br />
                <span className="text-transparent bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#38bdf8] bg-clip-text">Meet the depth.</span>
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#a2b2b1] sm:text-base">
                Ever wonder how you handle pressure, adapt to change, and make tough calls? Take this 15-question quiz to discover your Carcinization Stage, find your unique strengths, and unlock personalized tips to level up.
              </p>
              
              {/* Action and Timing Callouts */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button type="button" onClick={beginAudit} className="group inline-flex items-center gap-3 bg-[#00c3ff] px-7 py-4 font-grotesk text-sm font-bold uppercase tracking-wider text-[#020408] shadow-[0_0_30px_rgba(0,195,255,0.35)] transition-all hover:bg-[#00ffcc] hover:shadow-[0_0_40px_rgba(0,255,204,0.4)]">
                  Initiate biometric audit <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
                <div className="flex items-center gap-3 rounded-xl border border-[#00ffcc]/35 bg-[#00ffcc]/10 px-4 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(0,255,204,0.15)] backdrop-blur-md">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00ffcc]"></span>
                  </span>
                  <span>3–4 Minutes · 15 Fun Scenarios · Free Instant Results</span>
                </div>
              </div>

              {/* Five Trait Cards */}
              <div className="mt-10 grid max-w-xl grid-cols-2 gap-2.5 sm:grid-cols-5">
                {vectorCards.map((card) => (
                  <div key={card.label} className="border border-white/10 bg-[#071114]/70 p-3 backdrop-blur-sm transition-colors hover:border-[#00c3ff]/40">
                    <div style={{ color: card.color }}>{card.icon}</div>
                    <div className="mt-3 font-grotesk text-xs font-bold uppercase text-white">{card.label}</div>
                    <div className="mt-1 text-[9px] leading-relaxed text-[#839493]">{card.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right-Hand Hero Showcase: Full-Width 3 Fanned Progression Question Cards (Click to Start Quiz) */}
            <div className="relative hidden lg:block w-full">
              <div className="absolute inset-4 rounded-full bg-[#00c3ff]/15 blur-[90px]" aria-hidden="true" />
              
              {/* Scenario Trait Progression Selector */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00c3ff]">
                  <Activity className="h-4 w-4 text-[#00ffcc] animate-pulse" />
                  <span>Personality & Scenario Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  {fannedCards.map((card, idx) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFannedActive(idx)
                      }}
                      className={`rounded-full px-3.5 py-1 text-[11px] font-bold tracking-wider transition-all ${
                        fannedActive === idx
                          ? 'bg-[#00c3ff] text-[#020408] shadow-[0_0_15px_rgba(0,195,255,0.4)]'
                          : 'border border-white/15 bg-[#071114]/90 text-[#839493] hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {card.trait}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fanned Cards Stack Container - Taller, Expansive Card with Native 16:9 Artwork */}
              <div className="relative h-[720px] xl:h-[750px] w-full pt-3">
                {fannedCards.map((card, idx) => {
                  const isActive = idx === fannedActive
                  const diff = idx - fannedActive

                  // Distinct 3D fanned transform styles to visibly show cards stacked behind
                  let transformClass = ''
                  let zIndexClass = ''
                  let opacityClass = ''

                  if (diff === 0) {
                    transformClass = 'translate-x-0 translate-y-0 scale-100 rotate-0'
                    zIndexClass = 'z-30'
                    opacityClass = 'opacity-100'
                  } else if (diff === 1 || diff === -2) {
                    transformClass = 'translate-x-5 -translate-y-3.5 scale-[0.98] rotate-[2.5deg]'
                    zIndexClass = 'z-20'
                    opacityClass = 'opacity-80 hover:opacity-95'
                  } else if (diff === 2 || diff === -1) {
                    transformClass = '-translate-x-5 -translate-y-3.5 scale-[0.98] -rotate-[2.5deg]'
                    zIndexClass = 'z-10'
                    opacityClass = 'opacity-65 hover:opacity-90'
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
                        {/* Card Top Section: Header, Image, Prompt */}
                        <div>
                          {/* Card Header Bar */}
                          <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5">
                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#00c3ff]">
                              <span className="h-2 w-2 rounded-full bg-[#00ffcc] animate-pulse" />
                              <span>{card.eyebrow}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[#839493] uppercase tracking-wider group-hover:text-[#00ffcc] transition-colors">Click to begin ➔</span>
                              <span className="rounded bg-[#00c3ff]/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#00ffcc]">
                                {card.trait}
                              </span>
                            </div>
                          </div>

                          {/* Clean Native 16:9 Illustration Image - Full View Without Any Cutoff */}
                          <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-xl border border-[#00c3ff]/25 bg-[#020608]">
                            <img
                              src={card.image}
                              alt={card.imageAlt}
                              className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                            />
                          </div>

                          {/* Question Prompt */}
                          <h3 className="mt-4 font-grotesk text-sm sm:text-base font-bold leading-snug text-white">
                            {card.prompt}
                          </h3>
                        </div>

                        {/* Middle Section: All 4 Choices in 2x2 Grid */}
                        <div className="my-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {card.options.map((opt, optIdx) => {
                            const isSelected = fannedAnswers[idx] === opt.id
                            const letters = ['A', 'B', 'C', 'D']
                            return (
                              <div
                                key={opt.id}
                                className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all ${
                                  isSelected
                                    ? 'border-[#00ffcc] bg-[#00ffcc]/15 shadow-[0_0_12px_rgba(0,255,204,0.18)]'
                                    : 'border-white/10 bg-[#071114]/80 group-hover:border-[#00c3ff]/40'
                                }`}
                              >
                                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold ${
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
                                  {opt.detail && (
                                    <div className="mt-0.5 text-[10px] leading-tight text-[#839493]">
                                      {opt.detail}
                                    </div>
                                  )}
                                </div>
                                {isSelected && (
                                  <Check className="h-3.5 w-3.5 shrink-0 text-[#00ffcc]" />
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Bottom Section: Footer Action */}
                        <div className="border-t border-white/10 pt-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[#839493]">
                              Click anywhere to start the 15-question quiz
                            </span>
                            <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#00c3ff] px-4 py-2 font-grotesk text-xs font-bold uppercase tracking-wider text-[#020408] transition-all group-hover:bg-[#00ffcc] shadow-[0_0_15px_rgba(0,195,255,0.3)]">
                              Start Full Quiz <ArrowRight className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Prominent Full-Width Instant Results Bar */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#00c3ff]/40 bg-[#050c10]/95 p-4 shadow-[0_0_30px_rgba(0,195,255,0.18)] backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <span className="flex h-3.5 w-3.5 shrink-0 rounded-full bg-[#ffd700] shadow-[0_0_12px_#ffd700]" />
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white">
                      Instant Results & Scorecard Included
                    </div>
                    <div className="text-[11px] text-[#839493]">
                      0–100 Moltmax Score · 5-Trait Radar Chart · Personalized Archetype (Stages I–IV)
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-[#00c3ff]/15 border border-[#00c3ff]/30 px-3.5 py-1.5 font-mono text-xs font-bold text-[#00ffcc]">
                  Instant Breakdown
                </div>
              </div>
            </div>

          </div>
          <div className="absolute bottom-7 left-1/2 -translate-x-1/2 text-[#839493]"><ArrowDown className="h-5 w-5 animate-bounce" /></div>
        </section>

        {/* 3-Step Clear Explainer */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
          <div className="grid gap-8 border-y border-white/10 py-10 md:grid-cols-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00c3ff]">01 // 15 Relatable Dilemmas</div>
              <p className="mt-3 text-sm leading-relaxed text-[#839493]">
                Navigate 15 real-world dilemmas featuring our armored lobster hero facing tough choices, noisy distractions, and high-pressure moments.
              </p>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00c3ff]">02 // 5 Core Personality Traits</div>
              <p className="mt-3 text-sm leading-relaxed text-[#839493]">
                See how your natural instincts score across resilience, focus, decisive execution, habit-shedding, and calm composure.
              </p>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00c3ff]">03 // Custom Archetype & Score</div>
              <p className="mt-3 text-sm leading-relaxed text-[#839493]">
                Get your instant 0–100 score, 5-trait radar chart, your official lobster archetype, and actionable growth tips.
              </p>
            </div>
          </div>
        </section>
      </main>}

      {mode === 'quiz' && <main ref={quizRef} className="min-h-screen px-4 pb-20 pt-32 sm:px-8">
        <QuizProgressHUD current={questionIndex} total={MOLTMAX_QUESTIONS.length} currentDimension={dimensionForQuestion(questionIndex)} />
        <QuizQuestionCard question={MOLTMAX_QUESTIONS[questionIndex]} questionNumber={questionIndex + 1} totalQuestions={MOLTMAX_QUESTIONS.length} answer={answers[MOLTMAX_QUESTIONS[questionIndex].id]} onAnswer={handleAnswer} onBack={handleBack} onNext={handleNext} />
        <div className="mx-auto mt-8 max-w-5xl text-center text-[10px] uppercase tracking-wider text-[#526363]">
          Your responses are private and calculated locally in your browser.
        </div>
      </main>}

      {mode === 'results' && result && <main className="px-4 pb-20 pt-32 sm:px-8">
        <QuizResultsReveal result={result} isCopied={isCopied} isGeneratingImage={isGeneratingImage} isSaved={isSaved} isAuthenticated={Boolean(user)} onShare={handleShare} onCopy={handleCopy} onDownload={handleDownload} onSave={user ? handleSave : () => { setAuthMode('signup'); setIsAuthModalOpen(true) }} onReset={() => { setMode('hero'); setResult(null); window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0) }} />
      </main>}

      <section className="border-t border-white/10 bg-[#030809] px-4 py-14 text-center sm:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#00c3ff]">Continue your growth</div>
          <h2 className="mt-3 font-grotesk text-2xl font-bold uppercase text-white sm:text-3xl">The assessment is a starting point, not a ceiling.</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#839493]">Explore the complete Moltmaxxing guide to strengthen your resilience, sharpen your focus, and master high-pressure environments.</p>
          <button type="button" onClick={() => navigate({ to: '/moltmaxxing' })} className="mt-6 inline-flex items-center gap-2 border border-[#00ffcc]/40 bg-[#00ffcc]/10 px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#00ffcc] transition-colors hover:bg-[#00ffcc]/20">Read the canonical Moltmaxxing guide <ChevronRight className="h-4 w-4" /></button>
        </div>
      </section>
      <MoltNationFooter />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode={authMode} />
    </div>
  )
}


