import React, { useRef, useState } from 'react'
import { Activity, ArrowDown, ArrowRight, BookOpen, CheckCircle2, Clock, ListChecks, Lock, Sparkles, Terminal } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { PublicHeader } from '@/components/PublicHeader'
import { AuthModal } from '@/components/AuthModal'
import { MoltNationFooter } from '@/components/news/MoltNationFooter'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { updateUserStatsFn } from '@/lib/server/api'
import { useToast } from '@/components/ui/ToastProvider'
import { HeroBackground } from '@/components/ui/HeroBackground'
import { type QuizAnswers, computeMoltmaxResult, MOLTMAX_QUESTIONS, type MoltmaxResult } from '@/lib/moltmax-quiz'
import { getAssetUrl } from '@/lib/assets'
import '@/styles/crt.css'
import '@/styles/hud-chrome.css'
import '@/styles/pbr-textures.css'
import { QuizQuestionCard } from './moltmax/QuizQuestionCard'
import { QuizResultsReveal } from './moltmax/QuizResultsReveal'
import { VectorCarapaceDiagram } from './moltmax/VectorCarapaceDiagram'

type PageMode = 'hero' | 'quiz' | 'results'

const howItWorks = [
  {
    eyebrow: 'Answer',
    title: 'Spot your patterns',
    description: 'From competing pings to unfinished tasks, answer fifteen everyday dilemmas to explore how you handle distraction, pressure, and change.',
    bullets: ['No trick questions', 'Answer at your own pace', 'Revisit any answer'],
    image: '/images/moltmax/moltmax-how-it-works-answer-v2.webp',
    imageAlt: 'A friendly lobster at a reef workstation comparing small everyday scenarios',
    accent: '#22d3ee',
    underlay: 'pbr-underlay-chitin',
    cardClass: 'border-cyan-500/35 from-[#0a1215]/95 via-[#070d0f]/95 to-[#04080a]/95 hover:border-cyan-400 hover:shadow-[0_0_40px_rgba(0,195,255,0.22)]',
  },
  {
    eyebrow: 'Measure',
    title: 'See your strengths',
    description: 'Get a five-trait profile showing your resilience, execution, focus, habit-shedding, and calm under pressure. See what already holds and where your shell needs support.',
    bullets: ['Five-axis strengths chart', 'A percentage for each trait', 'A clear starting point'],
    image: '/images/moltmax/moltmax-how-it-works-measure-v2.webp',
    imageAlt: 'A friendly lobster examining its shell through an illuminated lens',
    accent: '#fbbf24',
    underlay: 'pbr-underlay-circuit',
    cardClass: 'border-[#ffd700]/35 from-[#121008]/95 via-[#0e0c07]/95 to-[#080704]/95 hover:border-[#ffd700] hover:shadow-[0_0_40px_rgba(255,215,0,0.2)]',
  },
  {
    eyebrow: 'Grow',
    title: 'Choose your next molt',
    description: 'Leave with your Moltmax score, clearance tier, and three small habit upgrades matched to your score. Pick one to try today.',
    bullets: ['Instant score and archetype', 'Downloadable scorecard', 'Save results with a free account'],
    image: '/images/moltmax/moltmax-how-it-works-grow-v2.webp',
    imageAlt: 'A friendly lobster taking a first step along a softly lit underwater path',
    accent: '#00ffcc',
    underlay: 'pbr-underlay-carbon',
    cardClass: 'border-[#00ffcc]/35 from-[#081412]/95 via-[#060e0d]/95 to-[#030807]/95 hover:border-[#00ffcc] hover:shadow-[0_0_40px_rgba(0,255,204,0.22)]',
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

  // On phones the Next button sits below the prompt, so bring each new question back into view
  React.useEffect(() => {
    if (mode !== 'quiz' || !quizRef.current) return
    if (quizRef.current.getBoundingClientRect().top < 0) {
      window.scrollTo({ top: window.scrollY + quizRef.current.getBoundingClientRect().top, behavior: 'smooth' })
    }
  }, [mode, questionIndex])

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
      ctx.fillText('MOLTOLOGY.ORG/MOLTMAX · NO SHELL IS FINAL', 60, 620)
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

  const activeCard = fannedCards[fannedActive]

  return (
    <div className="min-h-screen overflow-x-clip bg-[#070b0b] font-sans text-[#dfe3e3] selection:bg-[#00c3ff]/30 selection:text-white relative">
      {/* Ambient vignette, scanlines and glow, shared with the homepage */}
      <div className="fixed inset-0 bg-benthic-vignette pointer-events-none z-0 opacity-70" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(0,195,255,0.16)_0%,transparent_75%)] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-sacred-grid pointer-events-none z-0 opacity-30" />
      <div className="fixed inset-0 crt-scanlines pointer-events-none z-0 opacity-35 sm:opacity-45" />

      <PublicHeader activePage="moltmax" onOpenAuth={(auth) => { setAuthMode(auth); setIsAuthModalOpen(true) }} />
      {mode === 'hero' && <main className="relative z-10">
        <section className="relative w-full overflow-hidden border-b border-cyan-900/40 bg-[#030608] px-4 pt-24 pb-12 sm:px-8 sm:pt-32 sm:pb-16 lg:flex lg:min-h-[100svh] lg:items-center lg:px-12 lg:pt-28">
          <HeroBackground
            leftWatermark="MOLTMAX · BIOMETRIC_SCANNER"
            rightWatermark="CARCINIZATION · CLEARANCE_AUDIT"
          />

          <div className="relative z-10 mx-auto grid w-full max-w-[1440px] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_440px] xl:grid-cols-[minmax(0,1fr)_520px] xl:gap-16">
            {/* Copy column */}
            <div className="min-w-0 text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#00c3ff]/40 bg-[#00c3ff]/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#00c3ff] sm:text-xs">
                <Sparkles className="h-3.5 w-3.5 text-[#00ffcc]" /> Official Moltmaxxing audit
              </div>

              <h1 className="font-grotesk font-black uppercase text-white">
                <span className="block text-xl font-extrabold tracking-tight text-[#dfe3e3] sm:text-3xl lg:text-4xl">
                  Measure the shell.
                </span>
                <span className="mt-1 block text-[clamp(2.5rem,calc((100vw_-_2rem)/7.4),5rem)] leading-[0.95] tracking-[-0.03em] lg:text-[clamp(2.75rem,calc((100vw_-_620px)/7),6rem)] xl:text-[clamp(2.75rem,calc((100vw_-_740px)/7),6.5rem)]">
                  <span className="block">Master</span>
                  <span className="block bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#38bdf8] bg-clip-text pb-1 text-transparent drop-shadow-[0_0_40px_rgba(0,195,255,0.35)]">
                    Moltmaxxing
                  </span>
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[#b4c4c3] sm:text-base lg:text-lg">
                Moltmaxxing is the practice of shedding old habits, hardening your boundaries, and finishing what you start. Fifteen quick scenarios show where your shell stands today, then hand you a score, a five-trait profile, and three next steps.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={beginAudit}
                  className="group inline-flex min-h-[52px] items-center justify-center gap-3 rounded-md bg-[#00c3ff] px-7 font-grotesk text-sm font-bold uppercase tracking-wider text-[#020408] shadow-[0_0_35px_rgba(0,195,255,0.35)] transition-all hover:bg-[#00ffcc] hover:shadow-[0_0_45px_rgba(0,255,204,0.45)] cursor-pointer"
                >
                  <span>Take the Moltmax Quiz</span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate({ to: '/moltmaxxing' })}
                  className="group inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-md border border-[#00c3ff]/40 bg-[#00c3ff]/[0.06] px-6 font-grotesk text-sm font-bold uppercase tracking-wider text-[#00ffcc] backdrop-blur-md transition-all hover:border-[#00ffcc] hover:bg-[#00ffcc]/15 cursor-pointer"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Read Moltmaxxing Guide</span>
                </button>
              </div>

              <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#9ab0af] sm:text-sm">
                <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#00ffcc]" /> About 4 minutes</li>
                <li className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-[#00ffcc]" /> 15 questions</li>
                <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-[#00ffcc]" /> Free, no account needed</li>
              </ul>

              {/* Phone and tablet preview: one rotating scenario, tap to start */}
              <button
                type="button"
                onClick={beginAudit}
                aria-label="Start the quiz"
                className="group relative mt-9 block w-full overflow-hidden rounded-2xl border border-[#00c3ff]/40 bg-[#050c10] text-left shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(0,195,255,0.12)] lg:hidden"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[2/1]">
                  {fannedCards.map((card, idx) => (
                    <img
                      key={card.id}
                      src={card.image}
                      alt=""
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${idx === fannedActive ? 'opacity-100' : 'opacity-0'}`}
                    />
                  ))}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050c10] via-[#050c10]/40 to-transparent" />
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-[#00c3ff]/40 bg-[#020608]/85 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                    Tap to begin <ArrowRight className="h-3.5 w-3.5 text-[#00c3ff]" />
                  </span>
                </div>
                <div className="relative -mt-14 px-4 pb-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#00c3ff]">{activeCard.trait}</div>
                  <p className="mt-1 font-grotesk text-base font-bold leading-snug text-white sm:text-lg">{activeCard.prompt}</p>
                  <div className="mt-3 flex gap-1.5" aria-hidden="true">
                    {fannedCards.map((card, idx) => (
                      <span key={card.id} className={`h-1 rounded-full transition-all duration-300 ${idx === fannedActive ? 'w-6 bg-[#00c3ff]' : 'w-1.5 bg-white/20'}`} />
                    ))}
                  </div>
                </div>
              </button>
            </div>

            {/* Desktop showcase: fanned scenario cards, click any to start */}
            <div className="relative hidden w-full items-center justify-center lg:flex">
              <div className="absolute inset-4 rounded-full bg-[#00c3ff]/15 blur-[90px]" aria-hidden="true" />

              <div className="relative h-[600px] w-full xl:h-[660px]">
                {fannedCards.map((card, idx) => {
                  const isActive = idx === fannedActive
                  const rel = (idx - fannedActive + fannedCards.length) % fannedCards.length

                  let placement = 'translate-y-6 scale-[0.92] opacity-0 pointer-events-none z-0'
                  if (rel === 0) placement = 'translate-x-0 translate-y-0 scale-100 rotate-0 opacity-100 z-30'
                  else if (rel === 1) placement = 'translate-x-5 -translate-y-3 scale-[0.97] rotate-[2.5deg] opacity-70 z-20'
                  else if (rel === fannedCards.length - 1) placement = '-translate-x-5 -translate-y-3 scale-[0.97] -rotate-[2.5deg] opacity-50 z-10'

                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={beginAudit}
                      tabIndex={isActive ? 0 : -1}
                      aria-hidden={!isActive}
                      aria-label={isActive ? `Start the quiz. First up: ${card.prompt}` : undefined}
                      className={`group absolute inset-0 select-none text-left transition-all duration-500 ease-out cursor-pointer ${placement}`}
                    >
                      <div className={`flex h-full flex-col overflow-hidden rounded-2xl border p-5 backdrop-blur-md transition-colors duration-300 ${
                        isActive
                          ? 'border-[#00c3ff]/60 bg-[#050c10]/95 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(0,195,255,0.18)] group-hover:border-[#00ffcc]'
                          : 'border-white/15 bg-[#071114]/95 shadow-[0_15px_40px_rgba(0,0,0,0.7)]'
                      }`}>
                        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl border border-[#00c3ff]/25 bg-[#020608]">
                          <img
                            src={card.image}
                            alt={card.imageAlt}
                            className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#050c10]/70 via-transparent to-transparent" />
                          <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-[#020608]/85 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#00ffcc] backdrop-blur-md">
                            {card.trait}
                          </span>
                        </div>

                        <h3 className="mt-4 font-grotesk text-base font-bold leading-snug text-white xl:text-lg">
                          {card.prompt}
                        </h3>

                        <div className="relative mt-3 min-h-0 flex-1 overflow-hidden">
                          <div className="grid grid-cols-2 gap-2">
                            {card.options.map((opt, optIdx) => (
                              <div
                                key={opt.id}
                                className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-[#071114]/80 p-2.5 transition-colors group-hover:border-[#00c3ff]/40"
                              >
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/20 bg-white/5 text-[10px] font-bold text-[#9ab0af]">
                                  {['A', 'B', 'C', 'D'][optIdx]}
                                </span>
                                <span className="text-xs font-semibold leading-tight text-[#d0e6e6]">{opt.label}</span>
                              </div>
                            ))}
                          </div>
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#050c10] to-transparent" />
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3.5">
                          <span className="text-xs text-[#9ab0af]">One of 15 scenarios</span>
                          <span className="inline-flex items-center gap-2 rounded-md bg-[#00c3ff] px-4 py-2 font-grotesk text-xs font-bold uppercase tracking-wider text-[#020408] shadow-[0_0_15px_rgba(0,195,255,0.3)] transition-all group-hover:bg-[#00ffcc]">
                            Start <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}

                <div className="absolute -bottom-9 left-0 right-0 z-30 flex items-center justify-center gap-1">
                  {fannedCards.map((card, dotIdx) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setFannedActive(dotIdx)}
                      className="group flex h-6 items-center px-1 cursor-pointer"
                      aria-label={`Show scenario ${dotIdx + 1}`}
                      aria-current={dotIdx === fannedActive}
                    >
                      <span className={`block h-1.5 rounded-full transition-all duration-300 ${
                        dotIdx === fannedActive
                          ? 'w-8 bg-[#00c3ff] shadow-[0_0_10px_rgba(0,195,255,0.8)]'
                          : 'w-2 bg-white/20 group-hover:bg-white/40'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-[#839493] lg:block"><ArrowDown className="h-5 w-5 animate-bounce" /></div>
        </section>

        {/* How it works: cinematic header band */}
        <section className="relative w-full overflow-hidden border-b border-cyan-900/60 bg-[#030607] py-12 sm:py-16">
          <div className="pbr-underlay pbr-underlay-basalt opacity-40 pointer-events-none" />
          <img
            src={getAssetUrl('/images/hero_widescreen_bg.jpg')}
            alt=""
            loading="lazy"
            className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover opacity-20 mix-blend-luminosity blur-[8px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#030608] via-[#030608]/75 to-[#030608] pointer-events-none" />
          <div className="absolute inset-0 bg-sacred-grid opacity-25 pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-950/80 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300 sm:text-xs">
              <Terminal className="h-3.5 w-3.5 text-cyan-400" /> How it works
            </div>
            <h2 className="font-grotesk text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              Find your <span className="bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#38bdf8] bg-clip-text text-transparent">next molt</span> in three steps
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base">
              Discover where surface noise gets in, where your shell already holds, and what to strengthen next. Fifteen questions, about four minutes. No account needed.
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed text-gray-400 sm:text-sm">
              Your answers stay on your device. Saving to your profile stores your results.
            </p>
          </div>
        </section>

        <section className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
          <div className="pointer-events-none absolute left-1/4 top-1/2 h-[350px] w-[350px] -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[130px]" />
          <div className="pointer-events-none absolute right-1/4 top-1/2 h-[350px] w-[350px] -translate-y-1/2 rounded-full bg-red-500/10 blur-[130px]" />

          <ol className="relative grid gap-5 md:grid-cols-3 lg:gap-8">
            {howItWorks.map((step, index) => (
              <li
                key={step.title}
                className={`chitin-card group relative flex flex-col overflow-hidden rounded-xl border bg-gradient-to-b transition-all duration-500 hover:-translate-y-1 ${step.cardClass}`}
              >
                <div className={`pbr-underlay ${step.underlay} opacity-35 transition-opacity group-hover:opacity-55`} />
                <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-white/10 bg-[#020608]">
                  <img
                    src={getAssetUrl(step.image)}
                    alt={step.imageAlt}
                    loading="lazy"
                    className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#04080a] via-transparent to-transparent opacity-80" />
                  <span className="absolute bottom-3 left-4 font-grotesk text-4xl font-black leading-none text-white/90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                    0{index + 1}
                  </span>
                </div>

                <div className="relative z-10 flex flex-1 flex-col p-5 sm:p-6">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: step.accent }}>
                    {step.eyebrow}
                  </div>
                  <h3 className="mt-1.5 font-grotesk text-xl font-black uppercase tracking-wide text-white sm:text-2xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-300">
                    {step.description}
                  </p>
                  <ul className="mt-5 space-y-2 border-t border-white/10 pt-4">
                    {step.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2 text-sm text-gray-200">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: step.accent }} />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* The five traits */}
        <section className="relative w-full overflow-hidden border-y border-cyan-900/60 bg-[#030608] py-12 sm:py-16">
          <div className="pbr-underlay pbr-underlay-carbon opacity-40 pointer-events-none" />
          <img
            src={getAssetUrl('/images/subterranean_vats_bg.jpg')}
            alt=""
            loading="lazy"
            className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover opacity-25 mix-blend-luminosity blur-[6px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#030608] via-[#030608]/75 to-[#030608] pointer-events-none" />
          <div className="absolute inset-0 bg-sacred-grid opacity-25 pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-950/80 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300 sm:text-xs">
              <Activity className="h-3.5 w-3.5 text-[#00ffcc]" /> What gets measured
            </div>
            <h2 className="font-grotesk text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              The five vectors of <span className="bg-gradient-to-r from-[#00c3ff] via-[#00ffcc] to-[#38bdf8] bg-clip-text text-transparent">carcinization</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base">
              Each trait gets three questions. Your results show all five side by side, so you can see where the shell is already hard and where it is still soft.
            </p>
          </div>
        </section>

        <section className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
          <div className="pointer-events-none absolute left-1/3 top-1/3 h-[450px] w-[450px] -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[150px]" />
          <div className="pointer-events-none absolute bottom-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-amber-500/10 blur-[140px]" />

          <div className="relative">
            <VectorCarapaceDiagram />
          </div>
        </section>

        {/* Closing call to action */}
        <section className="relative mx-auto max-w-[1440px] px-4 pb-16 sm:px-8 lg:px-12">
          <div className="relative overflow-hidden rounded-2xl border border-[#00c3ff]/35 bg-gradient-to-br from-[#06131a] via-[#050c10] to-[#04110f] px-6 py-10 text-center shadow-[0_0_60px_rgba(0,195,255,0.12)] sm:px-12 sm:py-14">
            <div className="absolute inset-0 bg-sacred-grid opacity-20 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="font-grotesk text-2xl font-black uppercase tracking-tight text-white sm:text-4xl">
                Ready to measure your shell?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#b4c4c3] sm:text-base">
                Fifteen questions, about four minutes. No shell is final, so you can always come back and molt again.
              </p>
              <button
                type="button"
                onClick={beginAudit}
                className="group mt-7 inline-flex min-h-[52px] w-full items-center justify-center gap-3 rounded-md bg-[#00c3ff] px-8 font-grotesk text-sm font-bold uppercase tracking-wider text-[#020408] shadow-[0_0_35px_rgba(0,195,255,0.35)] transition-all hover:bg-[#00ffcc] sm:w-auto cursor-pointer"
              >
                <span>Start the quiz</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
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

